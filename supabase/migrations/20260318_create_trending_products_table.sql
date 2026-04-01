-- Migration to create trending_products table with RLS policies
-- Run this in your Supabase SQL Editor or via supabase migration run

-- Create the table
CREATE TABLE IF NOT EXISTS trending_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  original_title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  target_market TEXT NOT NULL,
  ai_generated_copy TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE trending_products ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own products
CREATE POLICY "Users can view their own trending products"
  ON trending_products
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own products
CREATE POLICY "Users can insert their own trending products"
  ON trending_products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own products
CREATE POLICY "Users can update their own trending products"
  ON trending_products
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own products
CREATE POLICY "Users can delete their own trending products"
  ON trending_products
  FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trending_products_user_id ON trending_products(user_id);
CREATE INDEX IF NOT EXISTS idx_trending_products_created_at ON trending_products(created_at DESC);
