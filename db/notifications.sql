-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  route VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- System/Admin can insert notifications for any user
CREATE POLICY "Enable insert for authenticated users"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Function to create notification for admin users
CREATE OR REPLACE FUNCTION notify_admins(
  notification_type VARCHAR,
  notification_title VARCHAR,
  notification_message TEXT,
  notification_data JSONB DEFAULT NULL,
  notification_route VARCHAR DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Get all admin users
  FOR admin_user IN 
    SELECT id FROM user_profiles WHERE user_type = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, data, route)
    VALUES (
      admin_user.id,
      notification_type,
      notification_title,
      notification_message,
      notification_data,
      notification_route
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for specific user
CREATE OR REPLACE FUNCTION notify_user(
  target_user_id UUID,
  notification_type VARCHAR,
  notification_title VARCHAR,
  notification_message TEXT,
  notification_data JSONB DEFAULT NULL,
  notification_route VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data, route)
  VALUES (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    notification_data,
    notification_route
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger function for new feedback
CREATE OR REPLACE FUNCTION notify_on_new_feedback()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins(
    'new_feedback',
    'New Feedback Received',
    NEW.user_name || ' submitted new feedback',
    jsonb_build_object('feedback_id', NEW.id, 'user_name', NEW.user_name),
    '/admin/feedback'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new feedback
CREATE TRIGGER on_new_feedback
  AFTER INSERT ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_feedback();

-- Trigger function for new training registration
CREATE OR REPLACE FUNCTION notify_on_new_registration()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins(
    'new_registration',
    'New Training Registration',
    NEW.user_name || ' registered for ' || NEW.training_name,
    jsonb_build_object('registration_id', NEW.id, 'training_name', NEW.training_name, 'user_name', NEW.user_name),
    '/admin/trainings'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new registration
CREATE TRIGGER on_new_registration
  AFTER INSERT ON training_registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_registration();

-- Trigger function for registration status update
CREATE OR REPLACE FUNCTION notify_on_registration_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM notify_user(
      NEW.user_id,
      'registration_status_update',
      'Training Registration ' || INITCAP(NEW.status),
      'Your registration for ' || NEW.training_name || ' has been ' || NEW.status,
      jsonb_build_object('registration_id', NEW.id, 'training_name', NEW.training_name, 'status', NEW.status),
      '/user/trainings'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for registration status update
CREATE TRIGGER on_registration_status_update
  AFTER UPDATE ON training_registrations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_registration_status_update();

-- Trigger function for new order
CREATE OR REPLACE FUNCTION notify_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins(
    'new_order',
    'New Product Order',
    NEW.buyer_name || ' ordered ' || NEW.product_name,
    jsonb_build_object('order_id', NEW.id, 'product_name', NEW.product_name, 'buyer_name', NEW.buyer_name, 'quantity', NEW.quantity),
    '/admin/products'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new order
CREATE TRIGGER on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_order();

-- Trigger function for order status update
CREATE OR REPLACE FUNCTION notify_on_order_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.order_status != NEW.order_status THEN
    PERFORM notify_user(
      NEW.user_id,
      'order_status_update',
      'Order ' || INITCAP(NEW.order_status),
      'Your order for ' || NEW.product_name || ' has been ' || NEW.order_status,
      jsonb_build_object('order_id', NEW.id, 'product_name', NEW.product_name, 'status', NEW.order_status),
      '/user/products'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order status update
CREATE TRIGGER on_order_status_update
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION notify_on_order_status_update();

-- Trigger function for new booking
CREATE OR REPLACE FUNCTION notify_on_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins(
    'new_booking',
    'New Activity Booking',
    NEW.user_name || ' booked ' || NEW.activity_name,
    jsonb_build_object('booking_id', NEW.id, 'activity_name', NEW.activity_name, 'user_name', NEW.user_name),
    '/admin/activities'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new booking
CREATE TRIGGER on_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_booking();

-- Trigger function for booking status update
CREATE OR REPLACE FUNCTION notify_on_booking_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM notify_user(
      NEW.user_id,
      'booking_status_update',
      'Booking ' || INITCAP(NEW.status),
      'Your booking for ' || NEW.activity_name || ' has been ' || NEW.status,
      jsonb_build_object('booking_id', NEW.id, 'activity_name', NEW.activity_name, 'status', NEW.status),
      '/user/activities'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking status update
CREATE TRIGGER on_booking_status_update
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_booking_status_update();

-- Trigger function for new appointment
CREATE OR REPLACE FUNCTION notify_on_new_appointment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_admins(
    'new_appointment',
    'New Appointment',
    NEW.full_name || ' scheduled an appointment',
    jsonb_build_object('appointment_id', NEW.id, 'full_name', NEW.full_name, 'appointment_type', NEW.appointment_type),
    '/admin/activities'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new appointment
CREATE TRIGGER on_new_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_appointment();

-- Trigger function for appointment status update
CREATE OR REPLACE FUNCTION notify_on_appointment_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    PERFORM notify_user(
      NEW.user_id,
      'appointment_status_update',
      'Appointment ' || INITCAP(NEW.status),
      'Your appointment has been ' || NEW.status,
      jsonb_build_object('appointment_id', NEW.id, 'appointment_type', NEW.appointment_type, 'status', NEW.status),
      '/user/activities'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointment status update
CREATE TRIGGER on_appointment_status_update
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_on_appointment_status_update();
