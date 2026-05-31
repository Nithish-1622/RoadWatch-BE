-- Geo intelligence schema for RoadWatch
CREATE SCHEMA IF NOT EXISTS geo;

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS geo.admin_boundaries (
    id BIGSERIAL PRIMARY KEY,
    boundary_code TEXT UNIQUE,
    boundary_name TEXT NOT NULL,
    boundary_level TEXT NOT NULL,
    parent_code TEXT,
    authority_name TEXT,
    owner_name TEXT,
    admin_code TEXT,
    source TEXT DEFAULT 'openstreetmap',
    confidence DOUBLE PRECISION DEFAULT 0.8,
    geom geometry(MultiPolygon, 4326) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_boundaries_geom ON geo.admin_boundaries USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_admin_boundaries_code ON geo.admin_boundaries (boundary_code);
CREATE INDEX IF NOT EXISTS idx_admin_boundaries_level ON geo.admin_boundaries (boundary_level);

CREATE TABLE IF NOT EXISTS geo.road_ownership (
    id BIGSERIAL PRIMARY KEY,
    road_name TEXT NOT NULL,
    road_type TEXT,
    authority_name TEXT,
    owner_name TEXT,
    jurisdiction_level TEXT,
    admin_code TEXT,
    road_class TEXT,
    source TEXT DEFAULT 'postgis',
    confidence DOUBLE PRECISION DEFAULT 0.75,
    tags JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_ownership_name ON geo.road_ownership (road_name);
CREATE INDEX IF NOT EXISTS idx_road_ownership_admin_code ON geo.road_ownership (admin_code);
CREATE INDEX IF NOT EXISTS idx_road_ownership_type ON geo.road_ownership (road_type);

CREATE TABLE IF NOT EXISTS geo.authority_mappings (
    id BIGSERIAL PRIMARY KEY,
    admin_code TEXT,
    boundary_level TEXT,
    road_class TEXT,
    authority_name TEXT NOT NULL,
    owner_name TEXT,
    owner_type TEXT,
    contact_ref TEXT,
    source TEXT DEFAULT 'manual',
    confidence DOUBLE PRECISION DEFAULT 0.7,
    active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authority_mappings_admin_code ON geo.authority_mappings (admin_code);
CREATE INDEX IF NOT EXISTS idx_authority_mappings_boundary_level ON geo.authority_mappings (boundary_level);
CREATE INDEX IF NOT EXISTS idx_authority_mappings_road_class ON geo.authority_mappings (road_class);

CREATE TABLE IF NOT EXISTS geo.road_segments (
    id BIGSERIAL PRIMARY KEY,
    road_name TEXT NOT NULL,
    road_type TEXT,
    authority_name TEXT,
    owner_name TEXT,
    boundary_code TEXT,
    admin_code TEXT,
    geom geometry(LineString, 4326),
    tags JSONB DEFAULT '{}'::jsonb,
    confidence DOUBLE PRECISION DEFAULT 0.75,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON geo.road_segments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_road_segments_road_name ON geo.road_segments (road_name);
CREATE INDEX IF NOT EXISTS idx_road_segments_admin_code ON geo.road_segments (admin_code);
