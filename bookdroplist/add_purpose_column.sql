-- Add purpose column to lists table
ALTER TABLE lists
ADD COLUMN purpose TEXT CHECK (purpose IN ('sharing', 'pickup', 'borrowing', 'buying', 'searching')) DEFAULT 'sharing';

-- Add a comment for documentation
COMMENT ON COLUMN lists.purpose IS 'Purpose of the list: sharing (just sharing), pickup (for pick up), borrowing (for borrowing), buying (for buying), searching (searching for these books)';