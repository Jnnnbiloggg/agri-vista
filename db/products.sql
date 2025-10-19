-- db/products.sql

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT[], -- Array of image URLs
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email IN ('admin@agrivista.com', 'admin@example.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Everyone can view products
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- Only admins can insert products
CREATE POLICY "Only admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin(auth.jwt() ->> 'email')
  );

-- Only admins can update products
CREATE POLICY "Only admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email')
  );

-- Only admins can delete products
CREATE POLICY "Only admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Users can view their own orders, admins can view all
CREATE POLICY "Users can view own orders, admins view all"
  ON orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Authenticated users can create orders
CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own orders, admins can update all
CREATE POLICY "Users can update own orders, admins update all"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- Users can delete their own orders, admins can delete all
CREATE POLICY "Users can delete own orders, admins delete all"
  ON orders FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- INDEXES
-- ============================================

-- Products indexes
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_name_idx ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS products_created_by_idx ON products(created_by);

-- Orders indexes
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(order_status);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_product_id_idx ON orders(product_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

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

-- Products updated_at trigger
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Orders updated_at trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE
-- ============================================

-- Create storage bucket for product images (run this in Supabase Dashboard -> Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for products bucket
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'products' AND
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'products' AND
    is_admin(auth.jwt() ->> 'email')
  );
