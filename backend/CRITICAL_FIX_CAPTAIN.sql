-- ⚠️ CRITICAL: Fix Captain Restaurant Assignment
-- Run this in Supabase SQL Editor NOW!

-- Step 1: Check current captain assignments
SELECT 
  u.id,
  u.username,
  u.role,
  u."restaurantId",
  r.name as restaurant_name,
  r.slug as restaurant_slug
FROM users u
LEFT JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.role = 'captain';

-- Step 2: Update captain1 to Sourabh's restaurant (ID 2)
-- Change restaurantId from 1 (Vivek) to 2 (Sourabh)
UPDATE users
SET "restaurantId" = 2
WHERE username = 'captain1' AND role = 'captain';

-- Step 3: Verify the fix
SELECT 
  u.id,
  u.username,
  u.role,
  u."restaurantId",
  r.name as restaurant_name,
  r.slug as restaurant_slug
FROM users u
LEFT JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.username = 'captain1';

-- Expected Result:
-- username: captain1
-- restaurantId: 2
-- restaurant_name: Sourabh Upadhyay
-- restaurant_slug: sourabh-upadhyay

-- ⚠️ IMPORTANT NOTES:
-- 1. Captain access is controlled by URL slug (/:restaurantSlug/captain/login)
-- 2. Backend validates captain can only access their assigned restaurant
-- 3. If captain tries to access wrong restaurant slug, they will get 403 error
-- 4. For multi-restaurant support, create separate captain users for each restaurant
