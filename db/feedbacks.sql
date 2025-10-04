CREATE TABLE feedbacks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  profile_pic TEXT,
  profession TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('general', 'product')),
  product TEXT,
  message TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_public BOOLEAN DEFAULT true,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_type ON feedbacks(feedback_type);
CREATE INDEX idx_feedbacks_product ON feedbacks(product);