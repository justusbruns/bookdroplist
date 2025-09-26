-- Add description field to lists table
ALTER TABLE public.lists
ADD COLUMN description TEXT;

-- Add comment to describe the field
COMMENT ON COLUMN public.lists.description IS 'Optional description for the book list';