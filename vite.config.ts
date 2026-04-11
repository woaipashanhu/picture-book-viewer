import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'manifest.json',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
        'books.json',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.(jpg|jpeg|png|gif|webp|svg|webp)(\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'book-images',
              expiration: {
                maxEntries: 10000,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: '刘费曼的绘本',
        short_name: '绘本',
        description: 'A warm and cozy picture book viewer',
        theme_color: '#FDF6EC',
        background_color: '#FDF6EC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
})
