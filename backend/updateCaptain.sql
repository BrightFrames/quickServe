-- Update captain1 from restaurant 1 (Vivek) to restaurant 2 (Sourabh)
UPDATE "Users" 
SET "restaurantId" = 2 
WHERE username = 'captain1' AND role = 'captain';

-- Verify the update
SELECT u.id, u.username, u.role, u."restaurantId", r.name as "restaurantName", r.slug 
FROM "Users" u
JOIN "Restaurants" r ON u."restaurantId" = r.id
WHERE u.username = 'captain1';
