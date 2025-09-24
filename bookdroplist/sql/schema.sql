-- Create books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  isbn TEXT,
  publication_year INTEGER,
  genre TEXT,
  description TEXT,
  publisher TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(title, author)
);

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create magic links table (temporary authentication tokens)
CREATE TABLE magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Book List',
  share_url TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Exact location (private, not exposed to public)
  exact_latitude DECIMAL(10, 8),
  exact_longitude DECIMAL(11, 8),
  -- Fuzzy location (public, within ~300m radius)
  public_latitude DECIMAL(10, 8),
  public_longitude DECIMAL(11, 8),
  -- Location metadata
  location_name TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create list_books junction table
CREATE TABLE list_books (
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (list_id, book_id)
);

-- Create favorites table (users can save/favorite other users' lists)
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, list_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_user_id ON magic_links(user_id);
CREATE INDEX idx_lists_share_url ON lists(share_url);
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_list_books_list_id ON list_books(list_id);
CREATE INDEX idx_list_books_position ON list_books(list_id, position);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_list_id ON favorites(list_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Allow user creation" ON users
  FOR INSERT WITH CHECK (true);

-- Create policies for magic_links table
CREATE POLICY "Allow magic link creation" ON magic_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow magic link verification" ON magic_links
  FOR SELECT USING (true);

CREATE POLICY "Allow magic link updates" ON magic_links
  FOR UPDATE USING (true);

-- Create policies for books table
CREATE POLICY "Allow public read access on books" ON books
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on books" ON books
  FOR INSERT WITH CHECK (true);

-- Create policies for lists table
CREATE POLICY "Allow public read access on lists" ON lists
  FOR SELECT USING (true);

CREATE POLICY "Users can create lists" ON lists
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own lists" ON lists
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own lists" ON lists
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create policies for list_books table
CREATE POLICY "Allow public read access on list_books" ON list_books
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on list_books" ON list_books
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their list_books" ON list_books
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_books.list_id
      AND lists.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their list_books" ON list_books
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_books.list_id
      AND lists.user_id::text = auth.uid()::text
    )
  );

-- Create policies for favorites table
CREATE POLICY "Users can read their own favorites" ON favorites
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can add favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can remove their favorites" ON favorites
  FOR DELETE USING (auth.uid()::text = user_id::text);