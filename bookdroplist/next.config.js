/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['covers.openlibrary.org', 'books.google.com'],
  },
  outputFileTracingRoot: __dirname,
}

module.exports = nextConfig