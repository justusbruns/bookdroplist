/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['covers.openlibrary.org'],
  },
  outputFileTracingRoot: __dirname,
}

module.exports = nextConfig