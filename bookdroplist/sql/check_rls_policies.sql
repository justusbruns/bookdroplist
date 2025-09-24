-- Check current RLS policies and table settings
-- Run this in your Supabase SQL editor to see what's currently configured

-- 1. Check which tables have RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Check specifically for lists table policies
SELECT
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'lists';

-- 4. Test if auth.uid() returns anything (should be null with our custom auth)
SELECT auth.uid() as current_auth_uid;