-- Temporary fix: Disable RLS on lists table since we're using custom authentication
-- This allows our custom session-based authentication to work properly
-- TODO: In production, we should either:
--   1. Switch to Supabase Auth completely, OR
--   2. Create custom RLS policies that work with our session system

ALTER TABLE lists DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on list_books since it depends on lists ownership
ALTER TABLE list_books DISABLE ROW LEVEL SECURITY;

-- Keep favorites table RLS disabled for now since it's missing from database
-- ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;