/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['covers.openlibrary.org', 'books.google.com', 'i.gr-assets.com'],
  },
  outputFileTracingRoot: __dirname,
}

module.exports = nextConfig