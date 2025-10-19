-- db/activities.sql

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  location TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  activity_id BIGINT REFERENCES activities(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  booking_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN ('admin@agrivista.com', 'admin@example.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ACTIVITIES POLICIES
-- ============================================

-- Everyone can view activities
CREATE POLICY "Activities are viewable by everyone"
  ON activities FOR SELECT
  USING (true);

-- Only admins can insert activities
CREATE POLICY "Only admins can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.jwt() ->> 'email')
  );

-- Only admins can update activities
CREATE POLICY "Only admins can update activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email')
  );

-- Only admins can delete activities
CREATE POLICY "Only admins can delete activities"
  ON activities FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- BOOKINGS POLICIES
-- ============================================

-- Users can view their own bookings, admins can view all
CREATE POLICY "Users can view own bookings, admins view all"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Authenticated users can create bookings
CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own bookings, admins can update all
CREATE POLICY "Users can update own bookings, admins update all"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Users can delete their own bookings, admins can delete all
CREATE POLICY "Users can delete own bookings, admins delete all"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- APPOINTMENTS POLICIES
-- ============================================

-- Users can view their own appointments, admins can view all
CREATE POLICY "Users can view own appointments, admins view all"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Authenticated users can create appointments
CREATE POLICY "Authenticated users can create appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own appointments, admins can update all
CREATE POLICY "Users can update own appointments, admins update all"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Users can delete their own appointments, admins can delete all
CREATE POLICY "Users can delete own appointments, admins delete all"
  ON appointments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- INDEXES
-- ============================================

-- Activities indexes
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS activities_type_idx ON activities(type);
CREATE INDEX IF NOT EXISTS activities_name_idx ON activities USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS activities_description_idx ON activities USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS activities_created_by_idx ON activities(created_by);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_activity_id_idx ON bookings(activity_id);
CREATE INDEX IF NOT EXISTS bookings_booking_date_idx ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings(created_at DESC);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS appointments_status_idx ON appointments(status);
CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON appointments(user_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON appointments(date);
CREATE INDEX IF NOT EXISTS appointments_created_at_idx ON appointments(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Activities updated_at trigger
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Bookings updated_at trigger
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Appointments updated_at trigger
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE
-- ============================================

-- Create storage bucket for activity images (run this in Supabase Dashboard -> Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for activities bucket
CREATE POLICY "Anyone can view activity images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'activities');

CREATE POLICY "Admins can upload activity images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'activities' AND
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can update activity images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'activities' AND
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can delete activity images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'activities' AND
    is_admin(auth.jwt() ->> 'email')
  );