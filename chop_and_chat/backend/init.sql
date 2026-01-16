CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- New columns for profile features
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
