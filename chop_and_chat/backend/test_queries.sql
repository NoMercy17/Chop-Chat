-- DEVELOPMENT QUERIES - NOT FOR PRODUCTION

-- Verify schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public';

-- Test relationships
SELECT p.id, p.title, u.name as author_name
FROM posts p JOIN users u ON p.user_id = u.id;

-- Performance checks
EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = 1;