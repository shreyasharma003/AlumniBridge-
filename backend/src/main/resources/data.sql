-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS=0;

-- Insert batches
INSERT IGNORE INTO batches (year) VALUES (2018),(2019),(2020),(2021),(2022),(2023),(2024);

-- Insert degrees
INSERT IGNORE INTO degrees (name) VALUES ('BTech'),('BCA'),('BBA'),('MBA'),('MCA');

-- Delete old admin user if exists
DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@gmail.com');
DELETE FROM users WHERE email = 'admin@gmail.com';

-- Insert admin user with password: admin123
-- Hash: $2a$10$VZZCo2GooR3LbX7Ey3yE9.neS93W6s81JOdSBmRsfaeNjQVEi3PdW
INSERT INTO users (email, name, password, role) 
VALUES ('admin@gmail.com', 'Admin User', '$2a$10$VZZCo2GooR3LbX7Ey3yE9.neS93W6s81JOdSBmRsfaeNjQVEi3PdW', 'ADMIN');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
