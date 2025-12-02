-- Create Separate Captain for Each Restaurant
-- Run this in Supabase SQL Editor

-- Step 1: Check current restaurants
SELECT id, name, slug FROM "Restaurants";

-- Expected:
-- ID 1: Vivek Singh Bhadoriya, slug: vivek-singh-bhadoriya
-- ID 2: Sourabh Upadhyay, slug: sourabh-upadhyay

-- Step 2: Check current captains
SELECT id, username, "restaurantId", role FROM users WHERE role = 'captain';

-- Step 3: Create captain for Sourabh's restaurant (if not exists)
INSERT INTO users (username, password, role, "restaurantId", "isOnline", "lastActive", "createdAt", "updatedAt")
VALUES (
  'captain_sourabh',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt hashed password
  'captain',
  2, -- Sourabh's restaurant ID
  false,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Step 4: Verify both captains
SELECT 
  u.id,
  u.username,
  u.role,
  u."restaurantId",
  r.name as restaurant_name,
  r.slug as restaurant_slug
FROM users u
LEFT JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.role = 'captain'
ORDER BY u."restaurantId";

-- Expected Result:
-- captain1 → Restaurant ID 1 (Vivek Singh Bhadoriya / vivek-singh-bhadoriya)
-- captain_sourabh → Restaurant ID 2 (Sourabh Upadhyay / sourabh-upadhyay)

-- IMPORTANT NOTES:
-- 1. Each restaurant MUST have its own captain account
-- 2. Captain username format: captain_{restaurant_slug} or captain1, captain2, etc.
-- 3. Each captain has separate credentials
-- 4. Captain can ONLY access their assigned restaurant
-- 5. Password MUST be bcrypt hashed (use backend to generate hash)
