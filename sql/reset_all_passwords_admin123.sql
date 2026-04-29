-- Reset all temporary plain-text passwords to admin123
-- Run in Supabase SQL editor

UPDATE public.usuarios
SET password = 'admin123',
    updated_at = now();
