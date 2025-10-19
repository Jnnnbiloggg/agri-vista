-- db/trainings.sql

-- Create trainings table
CREATE TABLE IF NOT EXISTS trainings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  topics TEXT[] NOT NULL,
  capacity INTEGER DEFAULT 0,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training_registrations table
CREATE TABLE IF NOT EXISTS training_registrations (
  id BIGSERIAL PRIMARY KEY,
  training_id BIGINT REFERENCES trainings(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_registrations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN ('admin@agrivista.com', 'admin@example.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's email
CREATE OR REPLACE FUNCTION get_user_email()
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRAININGS POLICIES
-- ============================================

-- Everyone can view trainings
CREATE POLICY "Trainings are viewable by everyone"
  ON trainings FOR SELECT
  USING (true);

-- Only admins can insert trainings
CREATE POLICY "Only admins can insert trainings"
  ON trainings FOR INSERT
  WITH CHECK (is_admin(get_user_email()));

-- Only admins can update trainings
CREATE POLICY "Only admins can update trainings"
  ON trainings FOR UPDATE
  USING (is_admin(get_user_email()));

-- Only admins can delete trainings
CREATE POLICY "Only admins can delete trainings"
  ON trainings FOR DELETE
  USING (is_admin(get_user_email()));

-- ============================================
-- TRAINING REGISTRATIONS POLICIES
-- ============================================

-- Users can view their own registrations, admins can view all
CREATE POLICY "Users can view own registrations, admins view all"
  ON training_registrations FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_admin(get_user_email())
  );

-- Authenticated users can create registrations
CREATE POLICY "Authenticated users can create registrations"
  ON training_registrations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own registrations, admins can update all
CREATE POLICY "Users can update own registrations, admins update all"
  ON training_registrations FOR UPDATE
  USING (
    auth.uid() = user_id OR
    is_admin(get_user_email())
  );

-- Users can delete their own registrations, admins can delete all
CREATE POLICY "Users can delete own registrations, admins delete all"
  ON training_registrations FOR DELETE
  USING (
    auth.uid() = user_id OR
    is_admin(get_user_email())
  );

-- ============================================
-- INDEXES
-- ============================================

-- Trainings indexes
CREATE INDEX IF NOT EXISTS trainings_created_at_idx ON trainings(created_at DESC);
CREATE INDEX IF NOT EXISTS trainings_start_date_idx ON trainings(start_date_time DESC);
CREATE INDEX IF NOT EXISTS trainings_name_idx ON trainings USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS trainings_created_by_idx ON trainings(created_by);

-- Registrations indexes
CREATE INDEX IF NOT EXISTS registrations_status_idx ON training_registrations(status);
CREATE INDEX IF NOT EXISTS registrations_user_id_idx ON training_registrations(user_id);
CREATE INDEX IF NOT EXISTS registrations_training_id_idx ON training_registrations(training_id);
CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON training_registrations(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trainings updated_at trigger
DROP TRIGGER IF EXISTS update_trainings_updated_at ON trainings;
CREATE TRIGGER update_trainings_updated_at
  BEFORE UPDATE ON trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Registrations updated_at trigger
DROP TRIGGER IF EXISTS update_registrations_updated_at ON training_registrations;
CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON training_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create storage bucket for training images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trainings', 'trainings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for trainings bucket
CREATE POLICY "Anyone can view training images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trainings');

CREATE POLICY "Admins can upload training images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trainings' AND
    is_admin(get_user_email())
  );

CREATE POLICY "Admins can update training images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'trainings' AND
    is_admin(get_user_email())
  );

CREATE POLICY "Admins can delete training images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trainings' AND
    is_admin(get_user_email())
  );