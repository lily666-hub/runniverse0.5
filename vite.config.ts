import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    dedupe: ['react', 'react-dom', 'react-router-dom']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  server: {
    https: false,
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: {
      // 固定客户端连接端口与主机，避免端口错配
      clientPort: 5173,
      port: 5173,
      host: '127.0.0.1',
      protocol: 'ws'
    },
    open: true, // 使用默认浏览器打开 HTTP 页面
    proxy: {
      '/api/openweather': {
        target: 'https://api.openweathermap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openweather/, ''),
        secure: true
      }
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // 忽略 TypeScript 相关的警告
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
