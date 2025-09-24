# Book Drop List

Transform photos of books into beautiful, instantly shareable lists with AI-powered recognition.

## Features

- **Photo to List Magic**: Upload a photo of books and get an instant, shareable list
- **AI Recognition**: Google Gemini Vision API extracts book titles and authors from images
- **Rich Metadata**: Automatic enrichment with covers, descriptions, and publication info
- **Instant Sharing**: Every list gets a unique, shareable URL
- **Beautiful Display**: Clean, visual interface with cover image grids
- **Mobile Optimized**: Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, file storage)
- **AI**: Google Gemini Vision API for image processing
- **Book Data**: Open Library API for metadata enrichment
- **Deployment**: Vercel

## Getting Started

### Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Google Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/)

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd bookdroplist
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase and Gemini API credentials.

3. **Set up Supabase database**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL from `sql/schema.sql` to create tables and policies

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Deployment

### Vercel Deployment

1. **Push to GitHub**: Make sure your code is in a GitHub repository

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect it's a Next.js project

3. **Set Environment Variables** in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `GEMINI_API_KEY`: Your Google Gemini API key

4. **Deploy**: Vercel will automatically deploy your app

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## Usage

1. **Upload a Photo**: Take or upload a photo containing books
2. **AI Processing**: Gemini Vision extracts book titles and authors
3. **Get Your List**: View your beautiful book list with covers and metadata
4. **Share**: Every list gets a unique URL for instant sharing

## API Endpoints

- `POST /api/process-image`: Process uploaded image and create book list
- `GET /api/lists/[shareUrl]`: Get book list by share URL
- `PUT /api/lists/[shareUrl]`: Update list name

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details