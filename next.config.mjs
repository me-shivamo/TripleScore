

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
