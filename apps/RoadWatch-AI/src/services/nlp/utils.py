def urgency_score(text: str) -> float:
    # heuristic: presence of urgency tokens increases score
    urgent_tokens = ['urgent', 'immediately', 'asap', 'now', 'help', 'emergency']
    s = text.lower()
    score = 0.0
    for t in urgent_tokens:
        if t in s:
            score += 0.3
    return max(0.0, min(1.0, score))
