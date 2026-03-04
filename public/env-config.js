// 环境变量配置文件
// 在构建时会被替换为实际的环境变量值
window.ENV_CONFIG = {
  VITE_AMAP_API_KEY: '__VITE_AMAP_API_KEY__',
  VITE_AMAP_REST_KEY: '__VITE_AMAP_REST_KEY__',
  VITE_AMAP_SECURITY_JS_CODE: '__VITE_AMAP_SECURITY_JS_CODE__',
  VITE_SUPABASE_URL: '__VITE_SUPABASE_URL__',
  VITE_SUPABASE_ANON_KEY: '__VITE_SUPABASE_ANON_KEY__',
  VITE_KIMI_API_KEY: '__VITE_KIMI_API_KEY__',
  VITE_DEEPSEEK_API_KEY: '__VITE_DEEPSEEK_API_KEY__'
};

// 为了向后兼容，也设置到window对象上
Object.keys(window.ENV_CONFIG).forEach(key => {
  window[key] = window.ENV_CONFIG[key];
});