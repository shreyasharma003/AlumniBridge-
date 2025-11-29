-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS=0;

-- Insert batches
INSERT IGNORE INTO batches (year) VALUES (2018),(2019),(2020),(2021),(2022),(2023),(2024);

-- Insert degrees
INSERT IGNORE INTO degrees (name) VALUES ('BTech'),('BCA'),('BBA'),('MBA'),('MCA');

-- Clean up any old admin users (admin@gmail.com was broken)
DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@gmail.com');
DELETE FROM users WHERE email = 'admin@gmail.com';

-- Note: Admin user 'testadmin@gmail.com' with password 'admin123' should be created via registration API
-- or already exists in the database from previous registration

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
