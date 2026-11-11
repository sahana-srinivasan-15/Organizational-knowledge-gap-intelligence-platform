-- ==============================================================================
-- Flyway Migration: V25__cleanup_duplicate_user_accounts.sql
-- Description: Clean up duplicate test accounts and consolidate user records
-- ==============================================================================

-- 1. Remove duplicate test employee skills and profiles
DELETE FROM employee_skills 
WHERE employee_profile_id IN (
    SELECT id FROM employee_profiles WHERE user_id IN (17, 18, 19, 21)
);

DELETE FROM employee_profiles 
WHERE user_id IN (17, 18, 19, 21);

-- 2. Remove duplicate test users
DELETE FROM users 
WHERE id IN (17, 18, 19, 21);

-- 3. Consolidate primary Priya Raman account
UPDATE users 
SET email = 'priya.raman@orgkgi.dev' 
WHERE id = 16 AND email LIKE 'new.engineer.%';

-- 4. Clarify distinct identity for Lead Mentor vs Principal Engineer
UPDATE users 
SET first_name = 'Alex', last_name = 'Morgan (Principal)' 
WHERE id = 3;

UPDATE users 
SET first_name = 'Alex', last_name = 'Morgan (Mentor)' 
WHERE id = 6;

