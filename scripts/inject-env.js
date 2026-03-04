#!/usr/bin/env node

/**
 * 环境变量注入脚本
 * 在构建后将环境变量注入到 env-config.js 文件中
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取环境变量（严禁将 AI 密钥注入到前端）
const envVars = {
  VITE_AMAP_API_KEY: process.env.VITE_AMAP_API_KEY || 'b4bbc4d6ac83b3431412e4f99c4d7b26',
  VITE_AMAP_REST_KEY: process.env.VITE_AMAP_REST_KEY || 'b4bbc4d6ac83b3431412e4f99c4d7b26',
  VITE_AMAP_SECURITY_JS_CODE: process.env.VITE_AMAP_SECURITY_JS_CODE || '',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
  // 关键：强制置空，避免任何 AI 密钥进入前端
  VITE_KIMI_API_KEY: '',
  VITE_DEEPSEEK_API_KEY: ''
};

// 构建目录路径
const distDir = path.join(__dirname, '..', 'dist');
const envConfigPath = path.join(distDir, 'env-config.js');

console.log('🔧 开始注入环境变量...');
console.log('📁 构建目录:', distDir);
console.log('📄 配置文件:', envConfigPath);

try {
  // 检查构建目录是否存在
  if (!fs.existsSync(distDir)) {
    console.error('❌ 构建目录不存在:', distDir);
    process.exit(1);
  }

  // 检查 env-config.js 是否存在
  if (!fs.existsSync(envConfigPath)) {
    console.error('❌ env-config.js 文件不存在:', envConfigPath);
    process.exit(1);
  }

  // 读取 env-config.js 文件
  let content = fs.readFileSync(envConfigPath, 'utf8');
  
  // 替换环境变量占位符
  Object.keys(envVars).forEach(key => {
    const placeholder = `__${key}__`;
    const value = envVars[key];
    content = content.replace(new RegExp(placeholder, 'g'), value);
    console.log(`✅ ${key}: ${value ? '已设置' : '未设置（使用默认值）'}`);
  });

  // 写回文件
  fs.writeFileSync(envConfigPath, content, 'utf8');
  
  // 额外安全清理：删除构建目录中的 .env（如误入构建产物）
  const distEnvPath = path.join(distDir, '.env');
  if (fs.existsSync(distEnvPath)) {
    try {
      fs.unlinkSync(distEnvPath);
      console.log('🧹 已清理构建目录中的 .env 文件，避免敏感信息泄露');
    } catch (e) {
      console.warn('⚠️ 清理 dist/.env 失败：', e.message);
    }
  }

  console.log('✅ 环境变量注入完成！');
  
} catch (error) {
  console.error('❌ 环境变量注入失败:', error.message);
  process.exit(1);
}