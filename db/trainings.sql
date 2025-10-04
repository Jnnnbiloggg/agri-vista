-- Trainings Table
CREATE TABLE trainings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  topics TEXT[] NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations Table
CREATE TABLE training_registrations (
  id BIGSERIAL PRIMARY KEY,
  training_id BIGINT REFERENCES trainings(id),
  training_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_trainings_start_date ON trainings(start_date_time);
CREATE INDEX idx_registrations_status ON training_registrations(status);
CREATE INDEX idx_registrations_user ON training_registrations(user_id);