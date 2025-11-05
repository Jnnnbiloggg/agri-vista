-- db/carousel.sql

-- Create carousel_slides table
CREATE TABLE IF NOT EXISTS carousel_slides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (if not already exists)
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN ('admin@agrivista.com', 'admin@example.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CAROUSEL SLIDES POLICIES
-- ============================================

-- Everyone can view active carousel slides
CREATE POLICY "Active carousel slides are viewable by everyone"
  ON carousel_slides FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

-- Only admins can insert carousel slides
CREATE POLICY "Only admins can insert carousel slides"
  ON carousel_slides FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.jwt() ->> 'email')
  );

-- Only admins can update carousel slides
CREATE POLICY "Only admins can update carousel slides"
  ON carousel_slides FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email')
  );

-- Only admins can delete carousel slides
CREATE POLICY "Only admins can delete carousel slides"
  ON carousel_slides FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS carousel_slides_order_idx ON carousel_slides(order_index);
CREATE INDEX IF NOT EXISTS carousel_slides_active_idx ON carousel_slides(is_active);
CREATE INDEX IF NOT EXISTS carousel_slides_created_at_idx ON carousel_slides(created_at DESC);

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

-- Carousel slides updated_at trigger
DROP TRIGGER IF EXISTS update_carousel_slides_updated_at ON carousel_slides;
CREATE TRIGGER update_carousel_slides_updated_at
  BEFORE UPDATE ON carousel_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE
-- ============================================

-- Create storage bucket for carousel images (run this in Supabase Dashboard -> Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('carousel', 'carousel', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for carousel bucket
CREATE POLICY "Anyone can view carousel images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'carousel');

CREATE POLICY "Admins can upload carousel images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'carousel' AND
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can update carousel images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'carousel' AND
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can delete carousel images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'carousel' AND
    is_admin(auth.jwt() ->> 'email')
  );
