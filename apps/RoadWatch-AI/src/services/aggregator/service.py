import math
from typing import Dict, Any, List, Optional
import json
import hashlib
import os
from storage.cache import sync_get, sync_set, make_key


def _weighted_confidence(services: Dict[str, Dict[str, Any]]) -> Dict[str, float]:
    # weights per service (tunable)
    weights = {
        'computer_vision': 0.25,
        'nlp': 0.2,
        'ocr': 0.2,
        'geo': 0.15,
        'rag': 0.15,
        'analytics': 0.05,
    }
    service_confidences = {}
    total_weight = 0.0
    weighted_sum = 0.0
    for name, cfg in weights.items():
        svc = services.get(name)
        conf = 0.0
        if isinstance(svc, dict):
            conf = float(svc.get('confidence', svc.get('conf', 0.0) or 0.0))
        service_confidences[name] = conf
        weighted_sum += conf * cfg
        total_weight += cfg

    overall = (weighted_sum / total_weight) if total_weight > 0 else 0.0
    overall = max(0.0, min(1.0, float(overall)))
    return {'overall_confidence': overall, 'service_confidences': service_confidences}


def _merge_citations(services: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    citations = []
    seen = set()
    for key in ['rag', 'ocr', 'geo', 'analytics']:
        svc = services.get(key)
        if not svc:
            continue
        if key == 'rag':
            for c in svc.get('citations', []) or svc.get('sources', []):
                cid = c.get('id') if isinstance(c, dict) else str(c)
                if cid in seen:
                    continue
                seen.add(cid)
                citations.append({'id': cid, 'service': 'rag', 'meta': c})
        elif key == 'ocr':
            # OCR may not have structured citations; use document meta
            doc_id = svc.get('source') or svc.get('metadata', {}).get('title') or 'ocr_doc'
            if doc_id not in seen:
                seen.add(doc_id)
                citations.append({'id': doc_id, 'service': 'ocr', 'meta': svc.get('metadata', {})})
        elif key == 'geo':
            gid = svc.get('sources', {}).get('postgis', {}).get('id') or svc.get('sources', {}).get('overpass', {}).get('id') or 'geo_doc'
            if gid not in seen:
                seen.add(gid)
                citations.append({'id': str(gid), 'service': 'geo', 'meta': svc.get('sources', {})})
        elif key == 'analytics':
            aid = svc.get('request_id') or 'analytics'
            if aid not in seen:
                seen.add(aid)
                citations.append({'id': aid, 'service': 'analytics', 'meta': svc})

    return citations


def _resolve_conflicts(services: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    # Basic resolution logic per requirements
    # Location: prefer geo location; if OCR contains coords, compare distances
    resolved = {'location': None, 'location_conflict': False}
    geo = services.get('geo')
    ocr = services.get('ocr')
    nlp = services.get('nlp')

    # parse coordinates from OCR if present
    def _parse_coords_from_ocr(ocr_svc: Dict[str, Any]) -> Optional[tuple]:
        if not ocr_svc:
            return None
        text = ocr_svc.get('extracted_text', '')
        import re
        m = re.search(r"([0-9]{1,2}\.[0-9]+)\s*,\s*([0-9]{1,3}\.[0-9]+)", text)
        if m:
            lat = float(m.group(1))
            lon = float(m.group(2))
            return (lat, lon)
        return None

    ocr_coords = _parse_coords_from_ocr(ocr)
    geo_coords = None
    if geo and isinstance(geo, dict):
        # try to extract centroid from nominatim source
        nom = geo.get('sources', {}).get('nominatim')
        if nom and isinstance(nom, dict):
            raw = nom.get('raw', {})
            try:
                lat = float(raw.get('lat'))
                lon = float(raw.get('lon'))
                geo_coords = (lat, lon)
            except Exception:
                geo_coords = None

    # decision
    if geo_coords and ocr_coords:
        # compute distance
        from math import radians, cos, sin, asin, sqrt

        def haversine(a, b):
            lat1, lon1 = a
            lat2, lon2 = b
            R = 6371.0
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            u = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
            return 2 * R * asin(sqrt(u))

        dist_km = haversine(geo_coords, ocr_coords)
        if dist_km > 0.2:  # conflict threshold 200m
            resolved['location_conflict'] = True
            # prefer geo if its confidence higher
            geo_conf = float(geo.get('confidence', 0) or 0)
            ocr_conf = float(ocr.get('confidence', 0) or 0)
            if geo_conf >= ocr_conf:
                resolved['location'] = {'lat': geo_coords[0], 'lon': geo_coords[1], 'source': 'geo'}
            else:
                resolved['location'] = {'lat': ocr_coords[0], 'lon': ocr_coords[1], 'source': 'ocr'}
        else:
            # agree, pick average
            avg_lat = (geo_coords[0] + ocr_coords[0]) / 2
            avg_lon = (geo_coords[1] + ocr_coords[1]) / 2
            resolved['location'] = {'lat': avg_lat, 'lon': avg_lon, 'source': 'merge'}
    elif geo_coords:
        resolved['location'] = {'lat': geo_coords[0], 'lon': geo_coords[1], 'source': 'geo'}
    elif ocr_coords:
        resolved['location'] = {'lat': ocr_coords[0], 'lon': ocr_coords[1], 'source': 'ocr'}
    else:
        # fallback: try NLP extracted location entities
        if nlp and isinstance(nlp, dict):
            ent = nlp.get('entities', {}) or {}
            loc = ent.get('location') or ent.get('road_name')
            if isinstance(loc, dict) and 'lat' in loc:
                resolved['location'] = {'lat': loc['lat'], 'lon': loc['lon'], 'source': 'nlp'}
            elif isinstance(loc, str):
                resolved['location'] = {'text': loc, 'source': 'nlp'}
    # Authority resolution: prefer geo.authority > rag > ocr > nlp
    authority = None
    candidates = []
    if geo and geo.get('authority'):
        candidates.append(('geo', geo.get('authority'), geo.get('confidence', 0)))
    if services.get('rag') and services['rag'].get('sources'):
        for s in services['rag'].get('sources'):
            candidates.append(('rag', s.get('source') or s.get('meta') or None, s.get('score', 0)))
    if ocr and ocr.get('metadata') and ocr['metadata'].get('contractor'):
        candidates.append(('ocr', ocr['metadata'].get('contractor'), ocr.get('confidence', 0)))
    if nlp and nlp.get('entities') and nlp['entities'].get('contractor'):
        candidates.append(('nlp', nlp['entities'].get('contractor'), nlp.get('confidence', 0)))

    if candidates:
        # pick highest confidence
        candidates_sorted = sorted(candidates, key=lambda x: -float(x[2] or 0))
        authority = {'authority': candidates_sorted[0][1], 'source': candidates_sorted[0][0]}

    return {'resolved_location': resolved, 'resolved_authority': authority}


def aggregate(services: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    # check cache for this services snapshot
    try:
        key_raw = json.dumps(services, sort_keys=True)
        key = make_key('aggregator:final', hashlib.sha256(key_raw.encode('utf-8')).hexdigest())
        cached = sync_get(key)
        if cached.get('cache_hit') and isinstance(cached.get('value'), dict):
            v = cached.get('value')
            # attach cache metadata
            v['_cache'] = {'cache_hit': True, 'cache_key': key, 'ttl': cached.get('ttl')}
            return v
    except Exception:
        key = None

    # compute confidences
    confs = _weighted_confidence(services)

    # merge citations
    citations = _merge_citations(services)

    # resolve conflicts
    resolved = _resolve_conflicts(services)

    # issue summary: prefer RAG answer, fall back to NLP intent or CV labels
    issue_summary = None
    detected_issue = None
    severity = None
    urgency = None

    rag = services.get('rag')
    nlp = services.get('nlp')
    cv = services.get('computer_vision')
    ocr = services.get('ocr')

    if rag and rag.get('answer'):
        issue_summary = rag.get('answer')
    elif nlp and nlp.get('intent'):
        intent = nlp.get('intent')
        if isinstance(intent, dict):
            detected_issue = intent.get('name')
        else:
            detected_issue = intent
        issue_summary = f"Detected intent: {detected_issue}"
    elif cv and cv.get('detections'):
        dets = cv.get('detections')
        if isinstance(dets, list) and dets:
            detected_issue = dets[0].get('label') or dets[0].get('class')
            severity = dets[0].get('severity')
            issue_summary = f"CV detected {detected_issue} with severity {severity}"

    # severity from CV preferred
    if cv and cv.get('detections'):
        try:
            severity = cv.get('detections')[0].get('severity')
        except Exception:
            pass

    # urgency from NLP if present
    if nlp and nlp.get('urgency'):
        urgency = nlp.get('urgency')

    # assemble recommendations: simple rules
    recommendations = []
    if severity in ('critical', 'high') or urgency in ('high', 'critical'):
        recommendations.append('Dispatch maintenance crew immediately')
    else:
        recommendations.append('Schedule inspection in 7 days')

    # normalize location object
    loc_obj = resolved.get('resolved_location') or {}
    # if nested under 'location' key, pull that out
    if isinstance(loc_obj, dict) and 'location' in loc_obj:
        loc = loc_obj.get('location')
    else:
        loc = loc_obj

    final = {
        'issue_summary': issue_summary,
        'detected_issue': detected_issue,
        'location': loc,
        'authority': resolved.get('resolved_authority'),
        'severity': severity,
        'urgency': urgency,
        'confidence': confs.get('overall_confidence'),
        'service_confidences': confs.get('service_confidences'),
        'citations': citations,
        'recommendations': recommendations,
    }

    # store final into cache
    try:
        if key:
            sync_set(key, final, ttl=int(os.environ.get('AGGREGATOR_CACHE_TTL', '300')))
            final['_cache'] = {'cache_hit': False, 'cache_key': key, 'ttl': int(os.environ.get('AGGREGATOR_CACHE_TTL', '300'))}
    except Exception:
        pass

    return final
