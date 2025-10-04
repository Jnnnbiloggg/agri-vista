-- Create announcements table
CREATE TABLE announcements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read announcements
CREATE POLICY "Announcements are viewable by everyone"
  ON announcements FOR SELECT
  USING (true);

-- Policy: Only authenticated users (admins) can insert
CREATE POLICY "Authenticated users can insert announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users (admins) can update
CREATE POLICY "Authenticated users can update announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Only authenticated users (admins) can delete
CREATE POLICY "Authenticated users can delete announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX announcements_created_at_idx ON announcements(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();