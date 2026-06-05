CREATE EXTENSION IF NOT EXISTS "uuiD-ossp";

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL
);

INSERT INTO roles (name, label) VALUES
    ('user', 'General User'),
    ('hod', 'Event Coordinator / HOD'),
    ('admin', 'System Administrator')
on CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    USERNAME TEXT,
    email TEXT,
    role_id INTEGER NOT NULL REFERENCES roles(id) DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
);

CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    capacity INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
);

CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    condition TEXT NOT NULL DEFAULT 'Good',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id),
    start_time TIMESTAMPTZ NOT,
    end_time TIMESTAMPTZ NOT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK(end_time > start_time)
);

CREATE TABLE IF NOT EXISTS event_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id),
    quantity_requested INTEGER NOT NULL DEFAULT 1 CHECK (quantity_requested > 0)
);


CREATE OR REPLACE FUNCTION get_available_venues(
    p_start TIMESTAMPTZ, 
    p_end TIMESTAMPTZ, 
    p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, location TEXT, capacity INTEGER, description TEXT)
AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.name, v.location, v.capacity, v.description
    FROM venues v
    WHERE v.is_active = TRUE
        AND v.id NOT IN (
            SELECT e.venue_id
            FROM events e
            WHERE e.status = 'approved'
                AND e.start_time < p_end
                AND e.end_time > p_start
                AND e.venue_id IS NOT NULL
                AND (p_exclude_event_id IS NULL OR e.id != p_exclude_event_id)
        )
    ORDER BY v.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;