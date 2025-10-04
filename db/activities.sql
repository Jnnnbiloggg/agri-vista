-- Activities Table
CREATE TABLE activities (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  activity_id BIGINT REFERENCES activities(id),
  activity_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  booking_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(date);

-- Storage bucket for activity images
-- Create bucket named "activity-images" in Supabase Dashboard