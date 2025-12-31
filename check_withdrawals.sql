-- Run this in Supabase SQL Editor to check if withdrawals exist
SELECT w.*, p.full_name 
FROM withdrawals w
LEFT JOIN profiles p ON w.user_id = p.id
ORDER BY w.created_at DESC
LIMIT 10;
