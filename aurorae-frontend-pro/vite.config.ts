import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 将 /api 开头的请求代理到后端服务
      '/api': {
        target: 'http://localhost:8080', // record服务的实际运行端口
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // 移除 /api 前缀
      },
    },
  },
})
