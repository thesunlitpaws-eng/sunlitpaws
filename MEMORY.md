
---

## 2026-04-13 夜间更新

### 今日完成

**多语言系统（8种）**
- 8种语言：EN/ZH/ES/FR/DE/JA/KO/AR
- 阿拉伯语支持 RTL 页面镜像
- JS Bug修复：`langSwitcher.classList` → `langDropdown.classList`（CSS选择器.m-lang-dropdown.open 要求 open 在 lang-dropdown 自身）
- 所有语言字典完整（nav/hero/advantage/products/solutions/cases/news/contact/footer）

**SEO & 社交分享**
- Open Graph meta标签（og:title/description/image/type/url）
- Twitter Card meta标签

**地图**
- 移除高德地图JS（需要API Key）
- 替换为 Google Maps iframe（无需API Key，全球可访问）
- 保留两个"打开外部地图"链接

**FAQ**
- index.html 内嵌 FAQ section（#faq 锚点）
- 8大板块 28个问答，手风琴展开
- 侧边目录导航（TOC锚点）
- 数字徽章[01]-[08]替代emoji

### 当前服务器
- localhost:8080（Python HTTP Server）
- 目录：/Users/min/.qclaw/workspace-agent-986c647e/hebei-bingling/

### 待完成/注意事项
1. 表单 submitForm 需要对接真实后端API（或配置Formspree/EmailJS）
2. 社交媒体链接（LinkedIn/Facebook/YouTube/Instagram）占位符需填真实地址
3. Google Maps iframe 坐标精度可后续微调（当前用城市级）
4. 产品图片尚未替换为真实图片（使用图标占位符）
