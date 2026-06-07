CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
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

CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN('pending', 'accepted', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
)


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

CREATE OR REPLACE FUNCTION get_resources_availability(
    p_start TIMESTAMPTZ, 
    p_end TIMESTAMPTZ, 
    p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID, name TEXT, description TEXT, condition TEXT, total_quantity INTEGER, allocated INTEGER, available INTEGER
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id, r.name, r.description, r.condition, r.total_quantity,
        COALESCE(SUM(er.quantity_requested), 0)::INTEGER AS allocated,
        (r.total_quantity - COALESCE(SUM(er.quantity_requested), 0))::INTEGER AS available
    FROM resources r
    LEFT JOIN event_resources er ON er.resource_id = r.id
    LEFT JOIN events e
        ON e.id = er.event_id
        AND e.status = 'approved'
        AND e.start_time < p_end
        AND e.end_time   > p_start
        AND (p_exclude_event_id IS NULL OR e.id != p_exclude_event_id)
    WHERE r.is_active = true
    GROUP BY r.id, r.name, r.description, r.condition, r.available_quantity
    ORDER BY r.name
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites         ENABLE ROW LEVEL SECURITY;


CREATE OR REPLACE FUNCTION auth_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p JOIN roles r ON r.id = p.role_id
        WHERE p.id = auth.uid() AND r.name = role_name
    );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_has_role_min(min_role_id INTEGER)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role_id >= min_role_id
    );
$$ LANGUAGE sql SECURITY DEFINER;


CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (auth_has_role('admin'));

CREATE POLICY "venues_select" ON venues FOR SELECT USING (is_active = true OR auth_has_role('admin'));
CREATE POLICY "venues_admin" ON venues FOR ALL USING (auth_has_role('admin'));

CREATE POLICY "resources_select" ON resources FOR SELECT USING (true);
CREATE POLICY "resources_admin" ON resources FOR ALL USING (auth_has_role('admin'));

CREATE POLICY "events_select" ON events FOR SELECT USING (user_id = auth.uid() OR auth_has_role_min(2));
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "events_update" ON events FOR UPDATE USING (auth_has_role_min(2));

CREATE POLICY "er_select" ON event_resources FOR SELECT USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND (e.user_id = auth.uid() OR auth_has_role_min(2))));
CREATE POLICY "er_insert" ON event_resources FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid()));
CREATE POLICY "er_delete" ON event_resources FOR DELETE USING (EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid()));

CREATE POLICY "invites_admin_all" ON invites FOR ALL USING (auth_has_role('admin'));


CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE 
    v_role_id INTEGER;
BEGIN
    v_role_id := COALESCE(
        (NEW.raw_user_meta_data->>'role_id')::INTEGER,
        1
    );

    INSERT INTO profiles(id, username, email, role_id)
    VALUES(
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        v_role_id
    ) ON CONFLICT (id) DO NOTHING;

    UPDATE invites
    SET status = 'accepted', accepted_at = NOW()
    WHERE LOWER(email) = LOWER(NEW.email)
    AND status = 'pending';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


INSERT INTO venues(name, location, capacity, description) VALUES
    ('Main Auditorium',   'Block A, Ground Floor', 500, 'Main event hall with full stage and AV system'),
    ('Conference Room 1', 'Block B, 2nd Floor',     50, 'Executive boardroom with projector and video conferencing'),
    ('Seminar Hall A',    'Block C, 1st Floor',    150, 'Tiered seating hall with dual projectors'),
    ('Seminar Hall B',    'Block C, 2nd Floor',    120, 'Flat-floor room for workshops and breakout sessions'),
    ('Open Courtyard',    'Central Campus',         300, 'Outdoor venue for large gatherings'),
    ('Innovation Lab',    'Block D, 3rd Floor',      40, 'Collaborative space with smartboard')
ON CONFLICT DO NOTHING;

INSERT INTO resources(name, description, total_quantity, condition) VALUES
    ('HD Projector',        'Full-HD projector with HDMI/VGA',          8,  'Good'),
    ('Wireless Microphone', 'UHF wireless handheld microphone',         15,  'Good'),
    ('Lapel Microphone',    'Clip-on lapel mic for presentations',      10,  'Good'),
    ('Folding Chair',       'Standard cushioned folding chairs',       300,  'Good'),
    ('Folding Table (6ft)', 'Rectangular 6-foot folding table',         50,  'Good'),
    ('PA Speaker System',   'Portable PA speakers on stands',            6,  'Good'),
    ('Whiteboard',          'Portable double-sided whiteboard',         10,  'Good'),
    ('Extension Cord (5m)', '5-metre heavy-duty power extension',       20,  'Good'),
    ('Podium / Lectern',    'Wooden podium with reading light',          4,  'Good'),
    ('LED Spotlight',       'Portable LED spotlight for stage use',     12,  'Good'),
    ('HDMI Cable (5m)',     '5-metre HDMI cable',                       25,  'Good')
ON CONFLICT DO NOTHING;