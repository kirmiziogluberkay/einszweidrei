-- Migration: Add is_active column to categories table
-- Run this in Supabase SQL Editor

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
