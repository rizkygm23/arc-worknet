-- Migration: Add task file support for jobs
-- Description: Adds task_file_path and task_file_name columns to public.jobs_arcworker table.

ALTER TABLE public.jobs_arcworker
ADD COLUMN task_file_path text,
ADD COLUMN task_file_name text;
