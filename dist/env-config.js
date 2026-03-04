// 环境变量配置文件
// 部署时替换为实际的环境变量值
window.ENV_CONFIG = {
  VITE_AMAP_API_KEY: '',
  VITE_AMAP_REST_KEY: '',
  VITE_AMAP_SECURITY_JS_CODE: '',
  VITE_SUPABASE_URL: '',
  VITE_SUPABASE_ANON_KEY: '',
  VITE_KIMI_API_KEY: '',
  VITE_DEEPSEEK_API_KEY: ''
};

// 为了向后兼容，也设置到window对象上
Object.keys(window.ENV_CONFIG).forEach(key => {
  window[key] = window.ENV_CONFIG[key];
});
