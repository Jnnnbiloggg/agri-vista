-- db/announcements.sql

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Get admin emails from environment or hardcode them
  -- For this example, we'll check against known admin emails
  RETURN user_email IN ('admin@agrivista.com', 'admin@example.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Everyone (including anonymous) can read announcements
CREATE POLICY "Announcements are viewable by everyone"
  ON announcements FOR SELECT
  USING (true);

-- Policy: Only admin users can insert announcements
CREATE POLICY "Only admins can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.jwt() ->> 'email')
  );

-- Policy: Only admin users can update announcements
CREATE POLICY "Only admins can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email')
  );

-- Policy: Only admin users can delete announcements
CREATE POLICY "Only admins can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email')
  );

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS announcements_title_idx ON announcements USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS announcements_description_idx ON announcements USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS announcements_created_by_idx ON announcements(created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for announcement images (run this in Supabase Dashboard -> Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for announcements bucket
CREATE POLICY "Anyone can view announcement images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcements');

CREATE POLICY "Admins can upload announcement images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'announcements' AND
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can update announcement images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'announcements' AND
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can delete announcement images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'announcements' AND
    is_admin(auth.jwt() ->> 'email')
  );