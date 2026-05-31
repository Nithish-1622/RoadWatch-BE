-- Create analytics schema and anomalies table
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.anomalies (
    id SERIAL PRIMARY KEY,
    request_id TEXT,
    timestamp DOUBLE PRECISION,
    payload JSONB
);
