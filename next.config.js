/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com https://*.supabase.co; frame-src 'self';"
          }
        ]
      }
    ]
  },
  experimental: {
    appDir: true,
  },
  images: {
    domains: [],
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Optimize bundle splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split mermaid into its own chunk
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        mermaid: {
          name: 'mermaid',
          test: /[\\/]node_modules[\\/]mermaid[\\/]/,
          chunks: 'all',
          priority: 30,
        },
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: 10,
        },
      }
    }
    return config
  },
  // Enable compression
  compress: true,
  // Optimize fonts
  optimizeFonts: true,
}

module.exports = nextConfig