-- Update purpose column to include 'minilibrary'
ALTER TABLE lists
DROP CONSTRAINT IF EXISTS lists_purpose_check;

ALTER TABLE lists
ADD CONSTRAINT lists_purpose_check
CHECK (purpose IN ('sharing', 'pickup', 'borrowing', 'buying', 'searching', 'minilibrary'));

-- Add updated_at column for tracking last content updates
ALTER TABLE lists
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add exact coordinates for mini libraries (separate from public/fuzzy coords)
ALTER TABLE lists
ADD COLUMN IF NOT EXISTS exact_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS exact_longitude DECIMAL(11, 8);

-- Add function to automatically update the parent list's updated_at timestamp
CREATE OR REPLACE FUNCTION update_parent_list_updated_at()
RETURNS TRIGGER AS $
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE lists SET updated_at = NOW() WHERE id = OLD.list_id;
    ELSE
        UPDATE lists SET updated_at = NOW() WHERE id = NEW.list_id;
    END IF;
    RETURN NULL; -- The return value for an AFTER trigger is ignored
END;
$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at when list_books changes
DROP TRIGGER IF EXISTS update_lists_updated_at ON list_books;
CREATE TRIGGER update_lists_updated_at
    AFTER INSERT OR UPDATE OR DELETE ON list_books
    FOR EACH ROW EXECUTE FUNCTION update_parent_list_updated_at();-- Update the comment for the purpose column
COMMENT ON COLUMN lists.purpose IS 'Purpose of the list: sharing (just sharing), pickup (for pick up), borrowing (for borrowing), buying (for buying), searching (searching for these books), minilibrary (community mini library)';
COMMENT ON COLUMN lists.updated_at IS 'Last time the list contents were updated (books added/removed)';
COMMENT ON COLUMN lists.exact_latitude IS 'Exact latitude for mini libraries (not fuzzy)';
COMMENT ON COLUMN lists.exact_longitude IS 'Exact longitude for mini libraries (not fuzzy)';