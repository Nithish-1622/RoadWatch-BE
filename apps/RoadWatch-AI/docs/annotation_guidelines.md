Annotation Guidelines — RoadWatch

General rules
- Use bounding boxes for all defect annotations (COCO bbox: x,y,w,h). For thin cracks, use multiple tight boxes along the crack length.
- Label only visible damage related to the road surface or signage.

Class-specific notes
- pothole: annotate the visible cavity or depression area. If partially occluded, annotate the visible portion.
- crack: annotate linear hairline to deep cracks. For branching cracks, annotate each branch as separate boxes.
- waterlogging: annotate standing water patches on the carriageway; exclude reflections in puddles that are off-road.
- surface wear: annotate worn pavement regions, raveling, or exposed aggregate.
- missing road marking: annotate the road surface area where a marking is absent (prefer polygons); if using bbox, cover the relevant lane area.
- broken signboard: annotate the sign object (post + sign face if visible) when damaged or missing.

Label attributes (recommended)
- severity: low/medium/high (annotator-estimated severity)
- occluded: true/false
- confidence: 0.0-1.0 (annotator confidence)

Review process
- Each image annotated by one labeler and reviewed by a second for consensus on edge cases.
