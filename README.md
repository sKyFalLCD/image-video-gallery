# sKyCai的作品展示

一个优雅的个人创作图片轮播与视频展示网站，支持图片和视频上传管理。

## 🎯 功能特点

### 1. 图片展示区
- **自动轮播图**：6张高质量图片自动轮播，支持手动切换
- **缩略图预览**：点击缩略图快速切换主图
- **优雅动画**：平滑的过渡效果和悬停动画

### 2. 视频展示区
- **2×2网格布局**：四个视频展示位
- **点击播放**：点击视频缩略图全屏播放
- **响应式设计**：适配各种屏幕尺寸

### 3. 上传与管理区
- **双上传区域**：支持图片和视频分别上传
- **拖放上传**：支持拖放文件到上传区域
- **图片列表管理**：
  - 缩略图预览
  - 文件信息显示（名称、大小、时间）
  - 操作按钮（查看、移动、删除）
  - 图片排序功能

## 🚀 技术栈

- **HTML5**：语义化标签，现代结构
- **CSS3**：Flexbox、Grid、CSS变量、动画
- **JavaScript**：ES6+，面向对象编程
- **第三方资源**：
  - Font Awesome图标
  - Google Fonts字体
  - Unsplash图片
  - YouTube视频

## 📁 文件结构

```
image-video-gallery/
├── index.html          # 主页面
├── style.css          # 样式文件
├── script.js          # 交互脚本
└── README.md          # 说明文档
```

## 🎨 设计特色

### 视觉设计
- **现代配色**：蓝紫色系，专业优雅
- **渐变背景**：层次丰富的视觉效果
- **阴影效果**：立体感强的卡片设计
- **圆角设计**：统一的圆角风格

### 交互体验
- **悬停效果**：按钮、卡片悬停动画
- **平滑过渡**：所有状态变化都有动画
- **响应式**：完美适配手机、平板、电脑
- **无障碍**：键盘导航支持

## 🔧 使用方法

### 1. 本地运行
```bash
# 将文件复制到你的项目目录
# 直接在浏览器中打开 index.html
```

### 2. 功能操作

#### 图片轮播
- 点击左右箭头手动切换
- 点击缩略图快速跳转
- 点击指示器切换图片
- 鼠标悬停暂停自动播放

#### 视频播放
- 点击视频卡片全屏播放
- ESC键或点击关闭退出全屏

#### 文件上传
- **拖放上传**：拖拽文件到上传区域
- **点击上传**：点击上传区域选择文件
- **图片管理**：
  - 查看：点击"查看"按钮预览大图
  - 移动：点击"移动"按钮调整顺序
  - 删除：点击"删除"按钮移除图片

## 🌐 部署到GitHub Pages

### 步骤1：创建GitHub仓库
1. 登录GitHub
2. 点击右上角"+" → "New repository"
3. 输入仓库名（如：skycai-portfolio）
4. 选择"Public"（必须公开）
5. 点击"Create repository"

### 步骤2：上传文件
```bash
# 方法1：通过GitHub网页上传
# 进入仓库 → Add file → Upload files
# 选择所有文件上传

# 方法2：通过Git命令
git init
git add .
git commit -m "初始提交：sKyCai的作品展示"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 步骤3：启用GitHub Pages
1. 进入仓库设置（Settings）
2. 左侧选择"Pages"
3. 在"Source"选择"Deploy from a branch"
4. 分支选择"main"，文件夹选择"/ (root)"
5. 点击"Save"

### 步骤4：访问网站
- 等待1-2分钟部署完成
- 访问：`https://你的用户名.github.io/仓库名/`

## 📱 响应式设计

### 断点设计
- **>1200px**：桌面端完整布局
- **768-1200px**：平板优化布局
- **<768px**：移动端单列布局
- **<480px**：小屏幕优化

### 移动端特性
- 触摸友好的按钮
- 简化的图片列表
- 优化的字体大小
- 隐藏非必要信息

## 🛠️ 自定义配置

### 修改配色
在`style.css`中修改CSS变量：
```css
:root {
    --primary-color: #4361ee;    /* 主色调 */
    --secondary-color: #3a0ca3;  /* 次要色调 */
    --accent-color: #f72585;     /* 强调色 */
    /* ... */
}
```

### 更换图片
在`index.html`中修改图片URL：
```html
<img src="你的图片URL" alt="描述">
```

### 更换视频
在`script.js`中修改视频数据：
```javascript
this.videos = [
    { id: '你的视频ID', title: '视频标题' },
    // ...
];
```

## 🔍 SEO优化建议

1. **添加meta标签**：
```html
<meta name="description" content="sKyCai的作品展示 - 优雅的图片轮播与视频展示平台">
<meta name="keywords" content="图片轮播,视频展示,多媒体,画廊,上传管理">
```

2. **添加favicon**：
```html
<link rel="icon" href="favicon.ico" type="image/x-icon">
```

3. **添加Open Graph标签**（社交媒体分享）：
```html
<meta property="og:title" content="sKyCai的作品展示">
<meta property="og:description" content="优雅的图片轮播与视频展示平台">
<meta property="og:image" content="预览图片URL">
```

## 🐛 故障排除

### 常见问题

1. **GitHub Pages不显示**
   - 确保仓库是Public
   - 检查文件在根目录
   - 等待1-2分钟重新加载

2. **图片不显示**
   - 检查图片URL是否有效
   - 确保网络连接正常
   - 检查浏览器控制台错误

3. **上传功能无效**
   - 确保使用现代浏览器
   - 检查文件大小限制
   - 查看浏览器控制台错误

### 浏览器兼容性
- Chrome 60+ ✅
- Firefox 55+ ✅
- Safari 11+ ✅
- Edge 79+ ✅

## 📄 许可证

本项目采用MIT许可证，可自由使用和修改。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请：
1. 查看本README文档
2. 检查浏览器控制台错误
3. 提交GitHub Issue

---

**享受你的sKyCai的作品展示吧！** 🎉