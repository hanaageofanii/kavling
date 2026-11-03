/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // semua /api/* diteruskan ke backend Go
    return [{ source: "/api/:path*", destination: "http://localhost:8080/api/:path*" }];
  },
};

export default nextConfig;
