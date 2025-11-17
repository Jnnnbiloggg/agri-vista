-- db/feedbacks.sql

-- Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  profession TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('general', 'product')),
  product TEXT,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

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
-- FEEDBACKS POLICIES
-- ============================================

-- Everyone can view public feedbacks
CREATE POLICY "Public feedbacks are viewable by everyone"
  ON feedbacks FOR SELECT
  USING (is_public = true);

-- Users can view their own feedbacks
CREATE POLICY "Users can view own feedbacks"
  ON feedbacks FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all feedbacks
CREATE POLICY "Admins can view all feedbacks"
  ON feedbacks FOR SELECT
  USING (is_admin(get_user_email()));

-- Authenticated users can create feedbacks
CREATE POLICY "Authenticated users can create feedbacks"
  ON feedbacks FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- Users can update their own feedbacks
CREATE POLICY "Users can update own feedbacks"
  ON feedbacks FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can view all feedbacks (but cannot update is_public)
CREATE POLICY "Admins cannot update feedbacks"
  ON feedbacks FOR UPDATE
  USING (false);

-- Users can delete their own feedbacks
CREATE POLICY "Users can delete own feedbacks"
  ON feedbacks FOR DELETE
  USING (user_id = auth.uid());

-- Admins can delete all feedbacks
CREATE POLICY "Admins can delete all feedbacks"
  ON feedbacks FOR DELETE
  USING (is_admin(get_user_email()));

-- ============================================
-- INDEXES
-- ============================================

-- Feedbacks indexes
CREATE INDEX IF NOT EXISTS feedbacks_created_at_idx ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS feedbacks_type_idx ON feedbacks(feedback_type);
CREATE INDEX IF NOT EXISTS feedbacks_product_idx ON feedbacks(product);
CREATE INDEX IF NOT EXISTS feedbacks_rating_idx ON feedbacks(rating);
CREATE INDEX IF NOT EXISTS feedbacks_user_id_idx ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS feedbacks_is_public_idx ON feedbacks(is_public);
CREATE INDEX IF NOT EXISTS feedbacks_message_idx ON feedbacks USING gin(to_tsvector('english', message));

-- ============================================
-- TRIGGERS
-- ============================================

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON feedbacks;
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();