import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 为可能依赖全局 React 的第三方产物或历史代码提供兼容
// 某些环境下打包后的 chunk 可能存在对 window.React 的访问
// 这里显式挂载一次，避免 ReferenceError: React is not defined
if (typeof window !== 'undefined' && !(window as any).React) {
  (window as any).React = React
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
