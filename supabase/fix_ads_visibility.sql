-- =======================================================
-- Database Fix for Disappearing Ads & Admin Panel Sync
-- =======================================================
-- Run these in Supabase Dashboard > SQL Editor.

-- 1. Update the 'status' constraint to allow 'reserved' and 'rented'
ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_status_check;
ALTER TABLE public.ads ADD CONSTRAINT ads_status_check 
  CHECK (status IN ('active', 'reserved', 'rented', 'passive', 'sold'));

-- 2. Update Row Level Security (RLS) to show reserved/rented ads to everyone
-- First drop the old restrictive policy
DROP POLICY IF EXISTS "ads_select_active" ON public.ads;

-- Create a new policy that includes reserved and rented statuses
CREATE POLICY "ads_select_public"
  ON public.ads FOR SELECT USING (status IN ('active', 'reserved', 'rented'));
