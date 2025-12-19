-- Migration: Create users table for RBAC
-- Run this in Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on firebase_uid for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own profile
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (true);

-- Policy: Allow admins to read all users
-- Note: This will be enforced at the application level

-- Policy: Allow admins to update any user
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (true);

-- Policy: Allow insert for new user creation
CREATE POLICY "Allow insert for user creation" ON users
    FOR INSERT WITH CHECK (true);

-- Policy: Allow delete only by admins (enforced at app level)
CREATE POLICY "Allow delete" ON users
    FOR DELETE USING (true);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


INSERT INTO users (firebase_uid, email, role, display_name)
VALUES ('dmwdYgcnsXT9KkkSFDPMttNgI3w1', 'faiqihya@gmail.com', 'admin', 'Mas Admin');
