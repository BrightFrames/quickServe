-- Fix Captain1 Restaurant Assignment
-- Run this in Supabase SQL Editor

-- Step 1: Check current assignment
SELECT 
  u.id,
  u.username,
  u.role,
  u."restaurantId",
  r.name as restaurant_name,
  r.slug as restaurant_slug
FROM "Users" u
LEFT JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.username = 'captain1';

-- Step 2: Update captain1 to Sourabh's restaurant (ID 2)
UPDATE "Users"
SET "restaurantId" = 2
WHERE username = 'captain1' AND role = 'captain';

-- Step 3: Verify the update
SELECT 
  u.id,
  u.username,
  u.role,
  u."restaurantId",
  r.name as restaurant_name,
  r.slug as restaurant_slug
FROM "Users" u
LEFT JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.username = 'captain1';

-- Expected result:
-- captain1 should now be assigned to Restaurant ID 2 (Sourabh Upadhyay / sourabh-upadhyay)
