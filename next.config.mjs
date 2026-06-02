/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cover & file panduan dilayani dari Supabase Storage (public bucket).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
