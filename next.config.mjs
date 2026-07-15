/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'gsap'],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Provide placeholder env vars at build time so Firebase doesn't throw
  // when no .env.local is present. Real values are set in .env.local at runtime.
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || 'build-placeholder',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'build-placeholder.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || 'build-placeholder',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'build-placeholder.appspot.com',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID|| '000000000000',
    NEXT_PUBLIC_FIREBASE_APP_ID:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || '1:000000000000:web:placeholder',
  },
};

export default nextConfig;
