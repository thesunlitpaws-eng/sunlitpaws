const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');

// slug 生成函数（支持中文：用简单拼音映射）
const pinyinMap = {
  '猫':'cat','狗':'dog','宠':'pet','爬':'climb','架':'frame','树':'tree','窝':'bed','包':'bag',
  '推':'push','车':'cart','座':'seat','砂':'litter','盆':'box','食':'food','粮':'grain',
  '玩':'toy','具':'tool','记':'memory','忆':'memory','海':'sea','绵':'sponge','垫':'mat',
  '航':'air','空':'air','标':'standard','安':'safe','全':'safe','封':'closed','闭':'closed',
  '优':'premium','质':'quality','干':'dry','湿':'wet','互':'inter','动':'active','益':'puzzle',
  '智':'smart','羽':'feather','毛':'fluff','棒':'stick','套':'set','多':'multi','层':'layer',
  '隐':'hidden','约':'about','有':'have','大':'big','小':'small','新':'new','老':'old',
  '产':'product','品':'product','四':'four','轮':'wheel','高':'high','级':'level'
};
function slugify(str) {
  if (!str) return 'product';
  const s = str.toString().toLowerCase();
  let result = '';
  for (const ch of s) {
    if (/[a-z0-9\s\-_]/.test(ch)) { result += ch; }
    else if (pinyinMap[ch]) { result += pinyinMap[ch] + '-'; }
  }
  return result.replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'product';
}

const app = express();
const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, 'admin/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── 安全头 ────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
});

// ─── 中间件 ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── EJS SSR 配置 ──────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', __dirname);

// ═══════════════════════════════════════════════════════
// 访问统计（必须在 SSR 路由之前）
// ═══════════════════════════════════════════════════════
let analytics = {
  pageViews: {}, referrers: {}, userAgents: {},
  countries: {}, sessions: [], totalViews: 0,
  todayViews: 0, lastDate: null, startDate: new Date().toISOString().split('T')[0]
};
try {
  const af = path.join(__dirname, 'analytics.json');
  if (fs.existsSync(af)) analytics = JSON.parse(fs.readFileSync(af, 'utf-8'));
} catch(e) {}
function saveAnalytics() {
  try {
    fs.writeFileSync(path.join(__dirname, 'analytics.json'), JSON.stringify(analytics, null, 2));
  } catch(e) {}
}
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin/') || req.path.startsWith('/node_modules')) return next();
  const today = new Date().toISOString().split('T')[0];
  const page = req.path === '/' ? '/' : req.path;
  analytics.pageViews[page] = (analytics.pageViews[page] || 0) + 1;
  analytics.totalViews++;
  if (analytics.lastDate !== today) { analytics.todayViews = 1; analytics.lastDate = today; }
  else { analytics.todayViews++; }
  const ref = req.get('Referer') || 'Direct';
  analytics.referrers[ref] = (analytics.referrers[ref] || 0) + 1;
  const ua = req.get('User-Agent') || 'Unknown';
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone/i.test(ua)) deviceType = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';
  analytics.userAgents[deviceType] = (analytics.userAgents[deviceType] || 0) + 1;
  const sessionId = req.headers['x-session'] || req.ip;
  const existing = analytics.sessions.find(s => s.id === sessionId);
  if (existing) { existing.lastSeen = new Date().toISOString(); existing.pageViews++; }
  else { analytics.sessions.push({ id: sessionId, firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(), pageViews: 1, device: deviceType, ip: String(req.ip).substring(0, 15) }); }
  if (analytics.sessions.length > 1000) analytics.sessions = analytics.sessions.slice(-1000);
  saveAnalytics();
  next();
});

// ═══════════════════════════════════════════════════════
// 数据加载
// ═══════════════════════════════════════════════════════
const DATA_FILE = path.join(__dirname, 'data.json');
let products = [], news = [], faqs = [], cases = [], solutions = [], contacts = [], modules = {};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const d = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      products = d.products || [];
      news = d.news || [];
      faqs = d.faqs || [];
      cases = d.cases || d.modules?.cases?.cards || [];
      solutions = d.solutions || [];
      contacts = d.contacts || [];
      modules = d.modules || {};
    }
  } catch (e) { console.error('数据加载失败', e); }
}
loadData();
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ products, news, faqs, cases, solutions, contacts, modules }, null, 2));
}

// ═══════════════════════════════════════════════════════
// SSR 路由（必须在 express.static 之前！否则 index.html 先被匹配）
// ═══════════════════════════════════════════════════════

// 首页 SSR
app.get('/', (req, res) => {
  // 禁止缓存，确保后台修改后前台立即更新
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  res.render('index.ejs', { lang, products, news, faqs, cases, solutions, modules, _ssr: true });
});

// 产品详情页 SSR
app.get('/products/:category/:subcategory/:type/:slug/', (req, res) => {
  // 禁止缓存，确保后台修改后前台立即更新
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const { category, subcategory, type, slug } = req.params;
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const product = products.find(p =>
    p.slug === slug && p.category_slug === category &&
    p.subcategory_slug === subcategory && p.type_slug === type
  );
  if (!product) return res.status(404).send('Product not found');
  // 按 category_slug（同品类）或 type_slug（同类型）匹配，最多 4 个
  const related = products.filter(x =>
    x.id !== product.id &&
    (x.category_slug === product.category_slug || x.type_slug === product.type_slug)
  ).slice(0, 4);
  res.render('product.ejs', { lang, product, relatedProducts: related, allProducts: products, _ssr: true });
});
app.get('/products/:category/:subcategory/:type/:slug', (req, res) => {
  res.redirect(301, `/products/${req.params.category}/${req.params.subcategory}/${req.params.type}/${req.params.slug}/`);
});

// 类型产品列表 /products/:cat/:sub/:type/
app.get('/products/:category/:subcategory/:type/', (req, res) => {
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const { category, subcategory, type } = req.params;
  const typeProducts = products.filter(p =>
    p.category_slug === category && p.subcategory_slug === subcategory && p.type_slug === type
  );
  const pageTitle = lang === 'zh'
    ? `${type.replace(/-/g,' ')} 产品列表`
    : `${type.replace(/-/g,' ')} Products`;
  const pageDesc = lang === 'zh'
    ? `浏览我们的 ${type.replace(/-/g,' ')} 产品系列，MOQ从${typeProducts[0]?.moq || '可商议'}起`
    : `Browse our ${type.replace(/-/g,' ')} product series, MOQ from ${typeProducts[0]?.moq || 'negotiable'}`;
  res.render('products.ejs', { lang, products: typeProducts, pageTitle, pageDesc, catSlug: category, subSlug: subcategory, typeSlug: type });
});
// 子分类页 /products/:cat/:sub/
app.get('/products/:category/:subcategory/', (req, res) => {
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const { category, subcategory } = req.params;
  const subProducts = products.filter(p => p.category_slug === category && p.subcategory_slug === subcategory);
  const pageTitle = lang === 'zh' ? `${subcategory.replace(/-/g,' ')} 产品` : `${subcategory.replace(/-/g,' ')} Products`;
  const pageDesc = lang === 'zh'
    ? `浏览我们全面的 ${subcategory.replace(/-/g,' ')} 产品，OEM/ODM支持`
    : `Browse our full range of ${subcategory.replace(/-/g,' ')}, OEM/ODM supported`;
  res.render('products.ejs', { lang, products: subProducts, pageTitle, pageDesc, catSlug: category, subSlug: subcategory, typeSlug: null });
});
// 父分类页 /products/:cat/
app.get('/products/:category/', (req, res) => {
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const { category } = req.params;
  const catProducts = products.filter(p => p.category_slug === category);
  const catNames = { 'cat-furniture': lang==='zh'?'猫家具':'Cat Furniture', 'pet-food': lang==='zh'?'宠物食品':'Pet Food', 'pet-toys': lang==='zh'?'宠物玩具':'Pet Toys', 'products': lang==='zh'?'产品':'Products' };
  const pageTitle = catNames[category] || (lang==='zh'?'产品列表':'Products');
  const pageDesc = lang==='zh'
    ? `浏览${pageTitle}全系列产品，支持OEM/ODM定制，最小起订量从200件起`
    : `Browse our complete ${pageTitle} range, OEM/ODM supported, MOQ from 200 units`;
  res.render('products.ejs', { lang, products: catProducts, pageTitle, pageDesc, catSlug: category, subSlug: null, typeSlug: null });
});
// 产品列表页
app.get('/products/', (req, res) => {
  // 禁止缓存产品列表页
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const pageTitle = lang === 'zh' ? '产品列表' : 'All Products';
  const pageDesc = lang === 'zh'
    ? '浏览我们完整的宠物用品产品线，猫爬架、宠物床、宠物包、推车、玩具全品类'
    : 'Browse our complete pet products catalog - cat trees, pet beds, carriers, strollers, toys';
  res.render('products.ejs', { lang, products, pageTitle, pageDesc, catSlug: null, subSlug: null, typeSlug: null });
});

// 新闻 SSR
app.get('/blog/', (req, res) => {
  // 禁止缓存博客页
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  res.render('blog.ejs', { lang, news, article: null, pageTitle: lang === 'zh' ? '新闻动态' : 'News & Updates', pageDesc: lang === 'zh' ? '浏览sunlitpaws最新新闻、行业动态、产品发布和公司公告' : 'Latest pet industry news, product launches, and company updates from sunlitpaws' });
});
app.get('/blog/:slug/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const article = news.find(n => n.slug === req.params.slug);
  if (!article) return res.status(404).send('Article not found');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  res.render('news.ejs', { lang, news, article, _ssr: true });
});
app.get('/blog/:slug', (req, res) => {
  res.redirect(301, `/blog/${req.params.slug}/`);
});

// 解决方案 SSR
app.get('/solutions/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  res.render('solutions.ejs', { lang, solutions, currentSolution: null, _ssr: true });
});
app.get('/solutions/:slug/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const s = solutions.find(x => x.slug === req.params.slug);
  if (!s) return res.status(404).send('Solution not found');
  res.render('solutions.ejs', { lang, solutions, currentSolution: s, _ssr: true });
});
app.get('/solutions/:slug', (req, res) => {
  res.redirect(301, `/solutions/${req.params.slug}/`);
});

// 案例/公司 SSR
app.get('/company/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  res.render('case.ejs', { lang, cases, currentCase: null, _ssr: true });
});
app.get('/company/cases/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  res.render('case.ejs', { lang, cases, currentCase: null, _ssr: true });
});
app.get('/company/cases/:slug/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const c = cases.find(x => x.slug === req.params.slug);
  if (!c) return res.status(404).send('Case not found');
  res.render('case.ejs', { lang, cases, currentCase: c, _ssr: true });
});
app.get('/company/cases/:slug', (req, res) => {
  res.redirect(301, `/company/cases/${req.params.slug}/`);
});

// FAQ SSR
app.get('/resources/faq/', (req, res) => {
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  res.render('faq.ejs', { lang, faqs, _ssr: true });
});

// sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://sunlitpaws.com';
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  products.forEach(p => {
    const cat = p.category_slug || 'products';
    const sub = p.subcategory_slug || 'general';
    const type = p.type_slug || 'standard';
    xml += `  <url>\n    <loc>${baseUrl}/products/${cat}/${sub}/${type}/${p.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });
  // 父分类页 /products/cat-furniture/ 等
  const catPages = [...new Set(products.map(p => p.category_slug || 'products'))];
  catPages.forEach(key => { xml += `  <url>\n    <loc>${baseUrl}/products/${key}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.75</priority>\n  </url>\n`; });
  // 子分类页 /products/cat-furniture/cat-trees/ 等
  const subPages = [...new Set(products.map(p => `${p.category_slug || 'products'}/${p.subcategory_slug || 'general'}`))];
  subPages.forEach(key => { xml += `  <url>\n    <loc>${baseUrl}/products/${key}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`; });
  // 子分类-类型页 /products/cat-furniture/cat-trees/multi-level-cat-trees/ 等
  const typePages = [...new Set(products.map(p => `${p.category_slug || 'products'}/${p.subcategory_slug || 'general'}/${p.type_slug || 'standard'}`))];
  typePages.forEach(key => { xml += `  <url>\n    <loc>${baseUrl}/products/${key}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.65</priority>\n  </url>\n`; });
  news.forEach(n => { if (n.slug) xml += `  <url>\n    <loc>${baseUrl}/blog/${n.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`; });
  cases.forEach(c => { if (c.slug) xml += `  <url>\n    <loc>${baseUrl}/company/cases/${c.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`; });
  solutions.forEach(s => { if (s.slug) xml += `  <url>\n    <loc>${baseUrl}/solutions/${s.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`; });
  xml += `  <url>\n    <loc>${baseUrl}/resources/faq/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n</urlset>`;
  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// robots.txt
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /dashboard\nDisallow: /api/admin/\nSitemap: https://sunlitpaws.com/sitemap.xml`);
});

// favicon
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/gif');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});

// ═══════════════════════════════════════════════════════
// 静态文件（SSR 路由之后，防止 .html 覆盖 .ejs）
// ═══════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(UPLOAD_DIR));

// 后台路由（不变）
app.get('/admin', (req, res) => { res.sendFile(path.join(__dirname, 'admin', 'index.html')); });
app.get('/admin/', (req, res) => { res.sendFile(path.join(__dirname, 'admin', 'index.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'admin', 'dashboard.html')); });

// ─── 语言切换 ─────────────────────────────────────────
app.post('/api/set-lang', (req, res) => {
  const lang = req.body.lang || 'en';
  res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, path: '/' });
  res.json({ success: true, lang });
});

// ─── 公开 API ─────────────────────────────────────────
app.get('/api/site/products', (req, res) => {
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const result = products.map(p => {
    if (lang === 'en') {
      return { ...p, name: p.name_en || p.name, desc: p.desc_en || p.desc, badge: p.badge_en || p.badge };
    }
    return p;
  });
  res.json(result);
});
app.get('/api/site/news', (req, res) => {
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  const result = news.map(n => {
    if (lang === 'en') {
      // 优先用 _en 字段，如果没有则用 _zh / 原始字段（不互换）
      return { ...n, title: n.title_en || n.title_zh || n.title, excerpt: n.excerpt_en || n.excerpt_zh || n.excerpt, content: n.content_en || n.content_zh || n.content };
    }
    return n;
  });
  res.json(result);
});
app.get('/api/site/faqs', (req, res) => {
  const lang = req.query.lang || 'en';
  const filtered = faqs.filter(f => f.lang === lang || (!f.lang && lang === 'en'));
  res.json(filtered);
});
app.get('/api/site/cases', (req, res) => res.json(cases));
app.get('/api/site/solutions', (req, res) => res.json(solutions));
app.get('/api/site/product-by-slug/:category/:subcategory/:type/:slug', (req, res) => {
  const { category, subcategory, type, slug } = req.params;
  const p = products.find(x => x.slug === slug && x.category_slug === category && x.subcategory_slug === subcategory && x.type_slug === type);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});
app.get('/api/site/news-by-slug/:slug', (req, res) => {
  const n = news.find(x => x.slug === req.params.slug);
  if (!n) return res.status(404).json({ error: 'Article not found' });
  res.json(n);
});
app.get('/api/site/case-by-slug/:slug', (req, res) => {
  const c = cases.find(x => x.slug === req.params.slug);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  res.json(c);
});
app.get('/api/site/solution-by-slug/:slug', (req, res) => {
  const s = solutions.find(x => x.slug === req.params.slug);
  if (!s) return res.status(404).json({ error: 'Solution not found' });
  res.json(s);
});

// 联系表单
app.post('/api/contact', (req, res) => {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const bjStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}+08:00`;
  contacts.push({ id: uuidv4(), createdAt: bjStr, ...req.body, status: 'new' });
  saveData();
  res.json({ success: true });
});

// ─── 简易 Session ────────────────────────────────────
const sessions = {};
app.use((req, res, next) => {
  const bearer = req.headers['authorization'];
  const token = bearer ? bearer.replace('Bearer ', '') : req.headers['x-session'] || req.cookies?.session;
  req.admin = token ? sessions[token] : null;
  next();
});
function requireAuth(req, res, next) {
  if (!req.admin) return res.status(401).json({ error: '未登录' });
  next();
}

// ─── 管理员 API ───────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    const token = uuidv4();
    sessions[token] = { username, loginAt: Date.now() };
    res.cookie('session', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, token, username });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});
app.get('/api/admin/me', (req, res) => {
  if (req.admin) res.json({ loggedIn: true, username: req.admin.username });
  else res.json({ loggedIn: false });
});
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers['x-session'] || req.cookies?.session;
  if (token) delete sessions[token];
  res.clearCookie('session');
  res.json({ success: true });
});

app.get('/api/admin/products', requireAuth, (req, res) => res.json(products));
app.get('/api/admin/products/:id', requireAuth, (req, res) => {
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: '产品不存在' });
  res.json(p);
});
app.post('/api/admin/products', requireAuth, (req, res) => {
  const p = {
    ...req.body,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    // 自动生成 slug 相关字段（放在 ...req.body 之后，确保不被覆盖）
    slug: req.body.slug || slugify(req.body.name || 'product'),
    category_slug: req.body.category_slug || req.body.category || 'products',
    subcategory_slug: req.body.subcategory_slug || req.body.subcategory || 'general',
    type_slug: req.body.type_slug || 'standard',
  };
  // slug 唯一性保证
  let baseSlug = p.slug, counter = 1;
  while (products.some(x => x.slug === p.slug)) { p.slug = baseSlug + '-' + counter++; }
  products.push(p); saveData();
  res.json({ success: true, product: p });
});
app.put('/api/admin/products/:id', requireAuth, (req, res) => {
  const i = products.findIndex(p => p.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: '未找到' });
  products[i] = { ...products[i], ...req.body };
  // 自动同步 slug 字段
  if (req.body.name && (!products[i].slug || products[i].slug === '')) {
    products[i].slug = slugify(req.body.name);
  }
  if (req.body.category && !products[i].category_slug) {
    products[i].category_slug = req.body.category;
  }
  if (req.body.subcategory && !products[i].subcategory_slug) {
    products[i].subcategory_slug = req.body.subcategory;
  }
  if (!products[i].type_slug) products[i].type_slug = 'standard';
  saveData();
  res.json({ success: true, product: products[i] });
});
app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  products = products.filter(p => p.id !== req.params.id); saveData();
  res.json({ success: true });
});

app.get('/api/admin/news', requireAuth, (req, res) => res.json(news));
app.post('/api/admin/news', requireAuth, (req, res) => {
  const n = { id: uuidv4(), createdAt: new Date().toISOString(), ...req.body }; news.push(n); saveData();
  res.json({ success: true, news: n });
});
app.put('/api/admin/news/:id', requireAuth, (req, res) => {
  const i = news.findIndex(n => n.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: '未找到' });
  for (const key of Object.keys(req.body)) { if (req.body[key] !== null && req.body[key] !== '' && req.body[key] !== undefined) news[i][key] = req.body[key]; }
  saveData(); res.json({ success: true, news: news[i] });
});
app.delete('/api/admin/news/:id', requireAuth, (req, res) => {
  news = news.filter(n => n.id !== req.params.id); saveData();
  res.json({ success: true });
});

app.get('/api/admin/faqs', requireAuth, (req, res) => res.json(faqs));
app.post('/api/admin/faqs', requireAuth, (req, res) => {
  const f = { id: uuidv4(), createdAt: new Date().toISOString(), ...req.body }; faqs.push(f); saveData();
  res.json({ success: true, faq: f });
});
app.put('/api/admin/faqs/:id', requireAuth, (req, res) => {
  const i = faqs.findIndex(f => f.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: '未找到' });
  faqs[i] = { ...faqs[i], ...req.body }; saveData();
  res.json({ success: true, faq: faqs[i] });
});
app.delete('/api/admin/faqs/:id', requireAuth, (req, res) => {
  faqs = faqs.filter(f => f.id !== req.params.id); saveData();
  res.json({ success: true });
});

app.get('/api/admin/cases', requireAuth, (req, res) => res.json(cases));
app.post('/api/admin/cases', requireAuth, (req, res) => {
  const c = { id: uuidv4(), createdAt: new Date().toISOString(), ...req.body }; cases.push(c); saveData();
  res.json({ success: true, case: c });
});
app.put('/api/admin/cases/:id', requireAuth, (req, res) => {
  const i = cases.findIndex(c => c.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: '未找到' });
  cases[i] = { ...cases[i], ...req.body }; saveData();
  res.json({ success: true, case: cases[i] });
});
app.delete('/api/admin/cases/:id', requireAuth, (req, res) => {
  cases = cases.filter(c => c.id !== req.params.id); saveData();
  res.json({ success: true });
});

app.get('/api/admin/solutions', requireAuth, (req, res) => res.json(solutions));
app.post('/api/admin/solutions', requireAuth, (req, res) => {
  const s = { id: uuidv4(), createdAt: new Date().toISOString(), ...req.body }; solutions.push(s); saveData();
  res.json({ success: true, solution: s });
});
app.put('/api/admin/solutions/:id', requireAuth, (req, res) => {
  const i = solutions.findIndex(s => s.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: '未找到' });
  solutions[i] = { ...solutions[i], ...req.body }; saveData();
  res.json({ success: true, solution: solutions[i] });
});
app.delete('/api/admin/solutions/:id', requireAuth, (req, res) => {
  solutions = solutions.filter(s => s.id !== req.params.id); saveData();
  res.json({ success: true });
});

app.get('/api/admin/contacts', requireAuth, (req, res) => res.json(contacts));
app.delete('/api/admin/contacts/:id', requireAuth, (req, res) => {
  const idx = contacts.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '未找到' });
  contacts.splice(idx, 1); saveData();
  res.json({ success: true });
});

app.get('/api/admin/stats', requireAuth, (req, res) => {
  res.json({ products: products.length, news: news.length, faqs: faqs.length, cases: cases.length, solutions: solutions.length, contacts: contacts.filter(c => c.status === 'new').length });
});

// ─── 文件上传 ─────────────────────────────────────────
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持图片文件 (JPEG/PNG/GIF/WebP/SVG)'));
  }
});
const SIZES = [{ name: 'original', maxW: null, q: 90 }, { name: 'large', maxW: 1200, q: 88 }, { name: 'medium', maxW: 800, q: 85 }, { name: 'thumb', maxW: 300, q: 80 }];
async function processImage(file) {
  const sharp = require('sharp');
  const results = {};
  const baseName = path.basename(file.filename, path.extname(file.filename));
  const origDir = path.join(UPLOAD_DIR, 'original');
  fs.mkdirSync(origDir, { recursive: true });
  fs.copyFileSync(file.path, path.join(origDir, path.basename(file.filename)));
  results.original = `/uploads/original/${path.basename(file.filename)}`;
  for (const size of SIZES) {
    if (size.name === 'original') continue;
    const outDir = path.join(UPLOAD_DIR, size.name);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, baseName + '.jpg');
    await sharp(file.path).resize(size.maxW, null, { withoutEnlargement: true }).jpeg({ quality: size.q }).toFile(outPath);
    results[size.name] = `/uploads/${size.name}/${baseName}.jpg`;
  }
  return results;
}
app.post('/api/admin/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  try {
    const urls = await processImage(req.file);
    res.json({ success: true, url: urls.large, urls, filename: req.file.originalname });
  } catch (err) {
    console.error('Image processing error:', err);
    res.json({ success: true, url: `/uploads/original/${req.file.filename}`, urls: { original: `/uploads/original/${req.file.filename}` }, filename: req.file.originalname });
  }
});

// ─── 模块 & 统计 API ──────────────────────────────────
app.get('/api/modules', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')).modules || {}); }
  catch(e) { res.status(500).json({ error: 'Failed to load modules' }); }
});
app.post('/api/modules', requireAuth, (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    data.modules = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    modules = req.body;
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: 'Failed to save modules' }); }
});
app.get('/api/analytics', requireAuth, (req, res) => {
  const now = new Date();
  const activeSessions = (analytics.sessions || []).filter(s => (now - new Date(s.lastSeen)) < 30 * 60 * 1000).length;
  const topPages = Object.entries(analytics.pageViews || {}).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([page, views]) => ({ page, views }));
  const topRefs = Object.entries(analytics.referrers || {}).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([source, visits]) => ({ source, visits }));
  const devices = Object.entries(analytics.userAgents || {}).map(([device, count]) => ({ device, count }));
  res.json({ totalViews: analytics.totalViews || 0, todayViews: analytics.todayViews || 0, activeSessions, avgDuration: 180, topPages, topRefs, devices, startDate: analytics.startDate || new Date().toISOString().split('T')[0], sessionsCount: (analytics.sessions || []).length });
});
app.post('/api/analytics/reset', requireAuth, (req, res) => {
  analytics = { pageViews: {}, referrers: {}, userAgents: {}, countries: {}, sessions: [], totalViews: 0, todayViews: 0, startDate: new Date().toISOString().split('T')[0] };
  saveAnalytics();
  res.json({ success: true });
});

// ─── 全局错误处理 ──────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: '文件太大，最大 5MB' });
  if (err.message && err.message.includes('仅支持图片')) return res.status(415).json({ error: err.message });
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// ─── 404 ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>404 - sunlitpaws</title></head><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;background:#f5f5f5"><div style="text-align:center"><h1 style="font-size:72px;margin:0;color:#FF6B35">404</h1><p style="font-size:20px;color:#666">Page not found</p><a href="/" style="color:#FF6B35">Back to Home</a></div></body></html>');
});

// ─── 启动 ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║     sunlitpaws 前台 SSR 已启动         ║');
  console.log(`  ║                                          ║`);
  console.log(`  ║  前台网站: http://localhost:${PORT}          ║`);
  console.log(`  ║  管理后台: http://localhost:${PORT}/dashboard  ║`);
  console.log(`  ║  登录账号: admin / admin123             ║`);
  console.log('  ╚══════════════════════════════════════════╝');
});
