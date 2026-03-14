# AI吉祥物组件使用说明

## 概述
AIMascot 是一个可爱的AI助手吉祥物组件，具有站立、微笑和招手动画效果。

## 特性
- 🎨 可爱的卡通形象设计
- 👋 自动招手动画（每8秒一次）
- 💬 招手时显示问候气泡
- 🖱️ 点击触发招手动画
- 📍 支持4个位置定位
- 📏 支持3种尺寸
- ✨ 悬停放大效果

## 使用方法

### 基础用法
```tsx
import { AIMascot } from '../../components/ai/AIMascot';

function MyPage() {
  return (
    <div>
      <AIMascot />
    </div>
  );
}
```

### 自定义位置
```tsx
<AIMascot position="bottom-right" />  // 右下角（默认）
<AIMascot position="bottom-left" />   // 左下角
<AIMascot position="top-right" />     // 右上角
<AIMascot position="top-left" />      // 左上角
```

### 自定义尺寸
```tsx
<AIMascot size="small" />   // 小尺寸 (80x100)
<AIMascot size="medium" />  // 中等尺寸 (100x120, 默认)
<AIMascot size="large" />   // 大尺寸 (120x150)
```

### 完整示例
```tsx
<AIMascot 
  position="bottom-right" 
  size="medium"
  className="custom-class"
/>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| position | 'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left' | 'bottom-right' | 吉祥物位置 |
| size | 'small' \| 'medium' \| 'large' | 'medium' | 吉祥物尺寸 |
| className | string | '' | 自定义CSS类名 |

## 动画效果

### 自动招手
- 每8秒自动触发一次招手动画
- 招手持续2秒
- 同时显示问候气泡

### 点击交互
- 点击吉祥物可以立即触发招手动画
- 适合用户互动场景

### 悬停效果
- 鼠标悬停时吉祥物会放大10%
- 平滑过渡动画

## 设计说明

### 外观特征
- 米白色头部和耳朵
- 金黄色衣服
- 粉色腮红
- 微笑的眼睛和嘴巴
- 棕色腿部和鞋子
- 衣服上有小星星装饰

### 动画细节
- 左手招手动画（旋转-30度到30度）
- 问候气泡弹跳效果
- 阴影效果增强立体感

## 应用场景

1. **路线推荐页面** - 作为AI助手的可视化形象
2. **对话界面** - 增强用户体验和亲和力
3. **引导页面** - 欢迎新用户
4. **帮助中心** - 提供友好的帮助入口

## 注意事项

- 吉祥物使用 `fixed` 定位，会固定在视口中
- z-index 设置为 50，确保在大多数元素之上
- 不会遮挡重要的交互元素
- 可以通过 className 进一步自定义样式

## 浏览器兼容性

- 支持所有现代浏览器
- 使用 SVG 绘制，矢量图形不失真
- CSS3 动画效果流畅

## 性能优化

- 使用 CSS 动画而非 JavaScript 动画
- SVG 渲染性能优秀
- 定时器在组件卸载时自动清理
