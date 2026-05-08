// ===== APP.JS - Hebei sunlitpaws Website =====

// ─── 翻译服务 ───────────────────────────────────────────
// 暂时禁用自动翻译，改用静态词典方案
const TranslationService = {
  // 从localStorage加载缓存
  getCache() {
    try {
      const cached = localStorage.getItem('translationCache');
      return cached ? JSON.parse(cached) : {};
    } catch(e) {
      return {};
    }
  },

  // 保存缓存到localStorage
  saveCache(cache) {
    try {
      localStorage.setItem('translationCache', JSON.stringify(cache));
    } catch(e) {}
  },

  // 翻译文本（暂不调用API，直接返回原文）
  async translate(text, targetLang) {
    // 暂时禁用翻译API调用
    return text;
  }
};

// ─── HERO SLIDER ───────────────────────────────────────
let currentSlide = 0;
let autoSlideTimer = null;

function goToSlide(n) {
  // 每次调用时重新查询，确保动态创建的轮播图也能工作
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length || !dots.length) return;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (n + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function resetAutoSlide() {
  clearInterval(autoSlideTimer);
  autoSlideTimer = setInterval(function() { goToSlide(currentSlide + 1); }, 5000);
}

// 事件委托：处理 dot 点击
document.addEventListener('click', function(e) {
  if (e.target.matches('.hero-dot')) {
    goToSlide(parseInt(e.target.dataset.slide));
    resetAutoSlide();
  }
  if (e.target.closest('.hero-arrow-left')) {
    goToSlide(currentSlide - 1);
    resetAutoSlide();
  }
  if (e.target.closest('.hero-arrow-right')) {
    goToSlide(currentSlide + 1);
    resetAutoSlide();
  }
});

// 启动轮播定时器（延迟 2 秒，等 loadHeroSlides 先完成）
setTimeout(function() {
  autoSlideTimer = setInterval(function() { goToSlide(currentSlide + 1); }, 5000);
}, 2000);

// ─── HERO SLIDER: 鼠标悬停暂停 ──────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var heroSlider = document.getElementById('heroSlider');
  if (heroSlider) {
    heroSlider.addEventListener('mouseenter', function() {
      if (autoSlideTimer) { clearInterval(autoSlideTimer); autoSlideTimer = null; }
    });
    heroSlider.addEventListener('mouseleave', function() {
      if (!autoSlideTimer) {
        autoSlideTimer = setInterval(function() { goToSlide(currentSlide + 1); }, 5000);
      }
    });
  }
  // 点击导航点时也恢复轮播
  document.querySelectorAll('.hero-dot').forEach(function(dot) {
    dot.addEventListener('click', function() {
      resetAutoSlide();
    });
  });
});


// ─── HEADER SCROLL ──────────────────────────────────────
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  if (scrollY > 80) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
  lastScroll = scrollY;
}, { passive: true });


// ─── HAMBURGER MOBILE NAV ──────────────────────────────
const hamburger = document.getElementById('hamburger');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  header.classList.toggle('mobile-open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    document.body.classList.remove('menu-open');
  });
});


// ─── LANGUAGE SWITCHER ─────────────────────────────────
const langSwitcher = document.getElementById('langSwitcher');
const langBtn = document.getElementById('langBtn');
const langDropdown = document.getElementById('langDropdown');

langBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  langDropdown.classList.toggle('open');
});

document.addEventListener('click', () => {
  langDropdown.classList.remove('open');
});

langDropdown.addEventListener('click', (e) => {
  const option = e.target.closest('.lang-option');
  if (!option) return;

  const lang = option.dataset.lang;
  document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
  option.classList.add('active');
  langBtn.querySelector('.lang-current').textContent = lang.toUpperCase();
  langDropdown.classList.remove('open');

  // Save preference
  localStorage.setItem('preferredLang', lang);

  // Sync to cookie for SSR
  fetch('/api/set-lang', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang })
  }).catch(() => {});

  // 产品详情页和案例详情页需要重新加载以获取正确语言的内容
  if (window.location.pathname.startsWith('/products/') || window.location.pathname.startsWith('/company/cases/')) {
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
    return;
  }

  switchLanguage(lang);
});


// ─── LANGUAGE DATA ─────────────────────────────────────
const i18n = {
  en: {
    'nav.home': 'Home',
    'nav.about': 'About Us',
    'nav.products': 'Products',
    'nav.solutions': 'Solutions',
    'nav.cases': 'Cases',
    'nav.news': 'News',
    'nav.contact': 'Contact',
    'nav.cta': 'Get Quote',
    'hero.badge': '🏭 ISO · FDA · BSCI Certified Manufacturer',
    'hero.title': 'Professional Pet Products\nManufacturer for Global Buyers',
    'hero.sub': '10+ years specializing in pet food, toys & accessories R&D and manufacturing.\nServing 30+ countries with OEM/ODM capabilities.',
    'hero.cta1': 'Get Product Catalog',
    'hero.cta2': 'Contact Us',
    'hero.stat1': 'Years Experience',
    'hero.stat2': 'Countries Served',
    'hero.stat3': 'Product SKUs',
    'hero.stat4': 'Global Partners',
    'adv.tag': 'Why Choose Us',
    'adv.title': 'Built on Trust, Driven by Quality',
    'adv.sub': 'Four pillars that make us the preferred manufacturing partner for global pet brands',
    'adv.c1.title': '10+ Years Export Experience',
    'adv.c1.desc': 'Serving global buyers across North America, Europe, Southeast Asia and beyond with deep understanding of international trade requirements.',
    'adv.c2.title': 'International Certifications',
    'adv.c2.desc': 'ISO 9001, ISO 22000, FDA, BSCI and more. Our comprehensive certification portfolio ensures compliance with global market standards.',
    'adv.c3.title': 'OEM/ODM Capabilities',
    'adv.c3.desc': 'Full customization from product design to packaging. Our R&D team brings your brand vision to life with flexible MOQ and fast turnaround.',
    'adv.c4.title': 'Strict Quality Control',
    'adv.c4.desc': 'End-to-end quality management from raw materials to finished products. Every batch undergoes rigorous testing before shipment.',
    'prod.tag': 'Product Center',
    'prod.title': 'Full-Range Pet Products, One-Stop Sourcing',
    'prod.sub': 'From nutrition to lifestyle - everything your customers need for their beloved pets',
    'prod.all': 'All Products',
    'prod.food': 'Pet Food',
    'prod.toys': 'Pet Toys',
    'prod.supplies': 'Pet Supplies',
          'factory.tag': 'Factory Overview',
      'factory.title': 'Our Production Capabilities',
      'factory.sub': "Take a look inside our 8,000m² manufacturing facility in Shijiazhuang",
      'factory.card1.name': 'Production Workshop',
      'factory.card1.desc': '8,000m² automated production lines with strict QC at every stage',
      'factory.card2.name': 'Product Showroom',
      'factory.card2.desc': '5,000+ SKUs on display - cat trees, strollers, carriers',
      'factory.card3.name': 'Global Shipping',
      'factory.card3.desc': 'Weekly container shipments to 30+ countries worldwide',
      'factory.workshop': 'Production Workshop',
      'factory.workshop.desc': 'Automated production lines with strict quality control at every stage',
      'factory.showroom': 'Product Showroom',
      'factory.showroom.desc': '5,000+ SKUs on display - cat trees, strollers, carriers & more',
      'factory.shipping': 'Global Shipping',
      'factory.shipping.desc': 'Weekly container shipments to 30+ countries worldwide',
      'prod.detail': 'View Details',
    'prod.inquire': 'Inquire Now',
    'prod.getprice': 'Get Price',
    'prod.more.text': '500+ SKUs available across all categories',
    'prod.more.cta': 'Download Full Catalog',
    'prod.badge.food': 'Pet Food',
    'prod.badge.toys': 'Pet Toys',
    'prod.badge.supplies': 'Pet Supplies',
    'prod.moq': 'MOQ: 500kg',
    'prod.moq2': 'MOQ: 1000 cans',
    'prod.moq3': 'MOQ: 200 pcs',
    'prod.moq4': 'MOQ: 500 sets',
    'prod.moq5': 'MOQ: 50 pcs',
    'prod.moq6': 'MOQ: 100 pcs',
    'prod.food1.name': 'Premium Dry Dog Food',
    'prod.food1.desc': 'High-protein formula with natural ingredients. ISO 22000 certified. Available in multiple flavors and sizes.',
    'prod.food2.name': 'Premium Cat Wet Food',
    'prod.food2.desc': 'Grain-free, high-moisture formula. FDA compliant. Custom flavors and private label available.',
    'prod.toy1.name': 'Interactive Puzzle Dog Toy',
    'prod.toy1.desc': 'BPA-free, durable ABS material. Stimulates mental activity. CE/ASTM certified. Custom colors available.',
    'prod.toy2.name': 'Cat Feather Wand Set',
    'prod.toy2.desc': 'Natural feathers with retractable wand. Safe, non-toxic materials. OEM packaging available.',
    'prod.sup1.name': 'Multi-Level Cat Tree Tower',
    'prod.sup1.desc': 'Sisal rope scratching posts, plush platforms. Stable base design. Multiple sizes. Custom colors & branding.',
    'prod.sup2.name': 'Airline-Approved Pet Carrier',
    'prod.sup2.desc': 'Breathable mesh panels, reinforced zippers. IATA compliant. Available in 3 sizes. Private label welcome.',
    'sol.tag': 'Solutions',
    'sol.title': 'Tailored Solutions for Every Business Model',
    'sol.sub': 'We understand your unique challenges and deliver customized manufacturing partnerships',
    'sol.c1.title': 'Brand OEM/ODM Solution',
    'sol.c1.desc': 'For pet brands seeking reliable manufacturing partners. We handle product development, production, quality control, and custom packaging - you focus on your brand and market.',
    'sol.c1.l1': 'Custom formulation & design',
    'sol.c1.l2': 'Private label packaging',
    'sol.c1.l3': 'Regulatory compliance support',
    'sol.c2.title': 'E-Commerce Supply Chain',
    'sol.c2.desc': 'For Amazon, Shopify, and cross-border e-commerce sellers. Fast production cycles, competitive pricing, and FBA-ready packaging to keep your listings competitive.',
    'sol.c2.l1': 'FBA-ready packaging & labeling',
    'sol.c2.l2': 'Fast 30-45 day lead time',
    'sol.c2.l3': 'Small batch trial orders',
    'sol.c3.title': 'Retail Wholesale Program',
    'sol.c3.desc': 'For pet store chains and distributors. Consistent quality, reliable delivery schedules, and comprehensive product range to stock your shelves year-round.',
    'sol.c3.l1': 'Full product line sourcing',
    'sol.c3.l2': 'Seasonal collection planning',
    'sol.c3.l3': 'Dedicated account manager',
    'sol.c1.title': 'Brand OEM/ODM Solution',
    'sol.c1.desc': 'For pet brands seeking reliable manufacturing partners. We handle product development, production, quality control, and custom packaging - you focus on your brand and market.',
    'sol.c1.l1': 'Custom formulation & design',
    'sol.c1.l2': 'Private label packaging',
    'sol.c1.l3': 'Regulatory compliance support',
    'sol.c2.title': 'E-Commerce Supply Chain',
    'sol.c2.desc': 'For Amazon, Shopify, and cross-border e-commerce sellers. Fast production cycles, competitive pricing, and FBA-ready packaging to keep your listings competitive.',
    'sol.c2.l1': 'FBA-ready packaging & labeling',
    'sol.c2.l2': 'Fast 30-45 day lead time',
    'sol.c2.l3': 'Small batch trial orders',
    'sol.c3.title': 'Retail Wholesale Program',
    'sol.c3.desc': 'For pet store chains and distributors. Consistent quality, reliable delivery schedules, and comprehensive product range to stock your shelves year-round.',
    'sol.c3.l1': 'Full product line sourcing',
    'sol.c3.l2': 'Seasonal collection planning',
    'sol.c3.l3': 'Dedicated account manager',
    'sol.learn': 'Learn More →',
    'case.tag': 'Success Cases',
    'case.tag1': 'OEM Success',
    'case.tag2': 'Distribution',
    'case.title': 'Trusted by 200+ Global Partners',
    'case.sub': 'Real partnerships, real results - see how we\'ve helped brands grow worldwide',
    'case.c1.country': '🇺🇸 United States',
    'case.c1.cat': 'Pet Food',
    'case.c1.title': 'US Premium Pet Food Brand',
    'case.c1.desc': 'Helped a US-based pet food startup launch their private label line. Developed 8 SKUs from scratch, achieved FDA compliance, and scaled from 500kg trial to 50-ton monthly orders within 18 months.',
    'case.c1.s1': 'Scale-up time',
    'case.c1.s2': 'Monthly volume',
    'case.c1.s3': 'SKUs launched',
    'case.c2.country': '🇩🇪 Germany',
    'case.c2.cat': 'Pet Toys',
    'case.c2.title': 'European Pet Toy Distributor',
    'case.c2.desc': 'Supplied a German distributor with 120+ toy SKUs meeting CE and EN71 standards. Consistent quality and on-time delivery helped them expand to 5 additional EU markets.',
    'case.c2.s1': 'SKUs supplied',
    'case.c2.s2': 'Markets expanded',
    'case.c2.s3': 'On-time rate',
    'case.c1.img': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
    'case.c2.img': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80',
    'case.c1.n1': '18mo', 'case.c1.n2': '50T', 'case.c1.n3': '8',
    'case.c2.n1': '120+', 'case.c2.n2': '5', 'case.c2.n3': '98%',
    'case.cta': 'Become Our Next Success Story',
    'news.tag': 'News & Insights',
    'news.title': 'Stay Ahead in the Pet Industry',
    'news.cat1': 'Company News',
    'news.cat2': 'Industry Trends',
    'news.n1.title': 'Bingling Achieves ISO 22000:2018 Recertification for Pet Food Production',
    'news.n1.desc': 'Our manufacturing facility has successfully passed the ISO 22000:2018 food safety management system recertification audit, reinforcing our commitment to the highest quality standards.',
    'news.n2.title': 'Global Pet Industry to Reach $500B by 2030: Key Opportunities for Manufacturers',
    'news.n3.title': 'Bingling Expands Production Capacity with New 5,000㎡ Manufacturing Facility',
    'news.n4.title': 'Sustainable Pet Products: How Eco-Friendly Materials Are Reshaping the Market',
    'news.read': 'Read More →',
    'cta.title': 'Ready to Start Your Partnership?',
    'cta.sub': 'Get a free product catalog and quote. We respond within 24 hours.',
    'cta.btn1': 'Get Free Catalog',
    'cta.btn2': '💬 WhatsApp Us',
    'contact.tag': 'Contact Us',
    'contact.title': 'Let\'s Build Something Together',
    'contact.sub': 'Fill in your requirements and our team will get back to you within 24 hours',
    'contact.addr.label': 'Address',
    'contact.addr.val': 'No. 88 Industrial Avenue, Shijiazhuang, Hebei Province, China 050000',
    'contact.phone.label': 'Phone',
    'contact.email.label': 'Email',
    'contact.hours.label': 'Business Hours',
    'contact.hours.val': 'Mon-Fri 9:00-18:00 (GMT+8)\nWeekend: Email support only',
    'form.name': 'Full Name *',
    'form.name.ph': 'John Smith',
    'form.email': 'Email Address *',
    'form.company': 'Company Name *',
    'form.company.ph': 'Your Company Ltd.',
    'form.country': 'Country',
    'form.interest': 'Product Interest',
    'form.interest.ph': 'Select product category...',
    'form.interest.food': 'Pet Food',
    'form.interest.toys': 'Pet Toys',
    'form.interest.supplies': 'Pet Supplies',
    'form.interest.all': 'All Categories',
    'form.message': 'Your Requirements *',
    'form.message.ph': 'Please describe your product requirements, target quantity, and any specific needs...',
    'form.attach': 'Attachment (optional)',
    'form.attach.label': 'Upload file (PDF, DOC, XLS, JPG)',
    'form.submit': 'Send Inquiry',
    'form.note': '🔒 Your information is secure. We respond within 24 business hours.',
    'footer.desc': 'Professional pet products manufacturer and exporter. Serving global buyers with quality, reliability, and innovation since 2014.',
    'footer.products': 'Products',
    'footer.food': 'Pet Food',
    'footer.toys': 'Pet Toys',
    'footer.supplies': 'Pet Supplies',
    'footer.catalog': 'Product Catalog',
    'footer.company': 'Company',
    'footer.about': 'About Us',
    'footer.solutions': 'Solutions',
    'footer.cases': 'Cases',
    'footer.news': 'News',
    'footer.contact': 'Contact',
    'footer.inquiry': 'Send Inquiry',
    'footer.copy': '© 2025 Hebei sunlitpaws Co., Ltd. All rights reserved.',
    'footer.icp': '冀ICP备XXXXXXXX号',
    'float.chat': 'Inquire',
    'modal.title': 'Send Your Inquiry',
    'modal.sub': 'We\'ll respond within 24 business hours',
    'toast.title': 'Inquiry Sent!',
    'toast.msg': 'We\'ll get back to you within 24 hours.',
  },

  zh: {
    'nav.home': '首页',
    'nav.about': '关于我们',
    'nav.products': '产品中心',
    'nav.solutions': '解决方案',
    'nav.cases': '案例展示',
    'nav.news': '新闻资讯',
    'nav.contact': '联系我们',
    'nav.cta': '获取报价',
    'hero.badge': '🏭 ISO · FDA · BSCI 认证制造商',
    'hero.title': '专业宠物用品制造商\n服务全球采购商',
    'hero.sub': '10+年专注于宠物食品、玩具、用品研发生产。\n通过ISO/FDA认证，提供OEM/ODM定制服务。',
    'hero.cta1': '获取产品目录',
    'hero.cta2': '联系我们',
    'hero.stat1': '年出口经验',
    'hero.stat2': '服务国家',
    'hero.stat3': '产品SKU',
    'hero.stat4': '全球合作伙伴',
    'adv.tag': '为什么选择我们',
    'adv.title': '品质铸就信任，专业驱动未来',
    'adv.sub': '四大核心优势，使我们成为全球宠物品牌首选制造伙伴',
    'adv.c1.title': '10+年出口经验',
    'adv.c1.desc': '深耕北美、欧洲、东南亚等国际市场，精通国际贸易规则与合规要求。',
    'adv.c2.title': '国际认证齐全',
    'adv.c2.desc': '拥有ISO 9001、ISO 22000、FDA、BSCI等完整认证体系，确保产品符合全球市场标准。',
    'adv.c3.title': 'OEM/ODM定制能力',
    'adv.c3.desc': '从产品设计到包装的全链条定制服务，研发团队将您的品牌愿景变为现实，MOQ灵活，交付迅速。',
    'adv.c4.title': '严格品控体系',
    'adv.c4.desc': '从原料到成品的全流程质量管理，每批次产品发货前均经过严格检测。',
    'prod.tag': '产品中心',
    'prod.title': '全品类宠物用品，一站式采购',
    'prod.sub': '从营养到生活，全方位满足您的宠物用品采购需求',
    'prod.all': '全部产品',
    'prod.food': '宠物食品',
    'prod.toys': '宠物玩具',
    'prod.supplies': '宠物用品',
          'factory.tag': '工厂概览',
      'factory.title': '生产能力',
      'factory.sub': '参观我们在石家庄的 8,000㎡ 制造基地',
      'factory.card1.name': '生产车间',
      'factory.card1.desc': '自动化生产线，每道工序严格质量管控',
      'factory.card2.name': '样品展厅',
      'factory.card2.desc': '5,000+ 款产品陈列 - 猫爬架、推车、宠物包应有尽有',
      'factory.card3.name': '全球发货',
      'factory.card3.desc': '每周集装箱发货至全球 30+ 个国家和地区',
      'factory.workshop': '生产车间',
      'factory.workshop.desc': '自动化生产线，每道工序严格质量管控',
      'factory.showroom': '样品展厅',
      'factory.showroom.desc': '5,000+ 款产品陈列 - 猫爬架、推车、宠物包应有尽有',
      'factory.shipping': '全球发货',
      'factory.shipping.desc': '每周集装箱发货至全球 30+ 国家和地区',
      'prod.detail': '查看详情',
    'prod.inquire': '立即咨询',
    'prod.getprice': '获取报价',
    'prod.more.text': '全品类500+ SKU可选',
    'prod.more.cta': '下载完整产品目录',
    'prod.badge.food': '宠物食品',
    'prod.badge.toys': '宠物玩具',
    'prod.badge.supplies': '宠物用品',
    'prod.moq': 'MOQ: 500kg',
    'prod.moq2': 'MOQ: 1000罐',
    'prod.moq3': 'MOQ: 200个',
    'prod.moq4': 'MOQ: 500套',
    'prod.moq5': 'MOQ: 50个',
    'prod.moq6': 'MOQ: 100个',
    'prod.food1.name': '优质狗干粮',
    'prod.food1.desc': '高蛋白配方，天然原料，ISO 22000认证，多种口味和规格可选。',
    'prod.food2.name': '优质猫湿粮',
    'prod.food2.desc': '无谷高水分配方，FDA合规，可定制口味和品牌包装。',
    'prod.toy1.name': '互动益智狗玩具',
    'prod.toy1.desc': 'BPA-free，耐用ABS材质，刺激狗狗智力活动，CE/ASTM认证。',
    'prod.toy2.name': '猫羽毛逗棒套装',
    'prod.toy2.desc': '天然羽毛配伸缩棒，安全无毒材质，支持OEM包装定制。',
    'prod.sup1.name': '多层猫爬架',
    'prod.sup1.desc': '剑麻绳抓柱+绒毛平台，底座稳固，多种尺寸可选，支持颜色定制。',
    'prod.sup2.name': '航空专用宠物包',
    'prod.sup2.desc': '透气网面设计，强化拉链，IATA合规，3种尺寸，支持品牌定制。',
    'sol.tag': '解决方案',
    'sol.title': '量身定制，满足各类业务场景',
    'sol.sub': '深入理解您的独特挑战，提供定制化制造合作方案',
    'sol.c1.title': '品牌OEM/ODM方案',
    'sol.c1.desc': '为寻求可靠制造伙伴的宠物品牌提供全流程服务。产品开发、生产、质检、包装全链路覆盖。',
    'sol.c1.l1': '定制配方与设计',
    'sol.c1.l2': '自有品牌包装',
    'sol.c1.l3': '法规合规支持',
    'sol.c2.title': '跨境电商供应链',
    'sol.c2.desc': '为Amazon、Shopify等跨境电商卖家提供快速生产周期、竞争性价格和FBA合规包装。',
    'sol.c2.l1': 'FBA合规包装贴标',
    'sol.c2.l2': '30-45天快速交付',
    'sol.c2.l3': '小批量试单',
    'sol.c3.title': '零售批发计划',
    'sol.c3.desc': '为宠物连锁店和分销商提供稳定质量、可靠交期和全品类产品线，助您全年备货无忧。',
    'sol.c3.l1': '全产品线采购',
    'sol.c3.l2': '季节性选品规划',
    'sol.c3.l3': '专属客户经理',
    'sol.learn': '了解更多 →',
    'case.tag': '成功案例',
    'case.tag1': 'OEM成功',
    'case.tag2': '分销合作',
    'case.title': '200+全球合作伙伴的信赖之选',
    'case.sub': '真实合作，真实成果--了解我们如何帮助品牌实现全球增长',
    'case.c1.country': '🇺🇸 美国',
    'case.c1.cat': '宠物食品',
    'case.c1.title': '美国高端宠物食品品牌',
    'case.c1.desc': '帮助美国宠物食品初创企业从零开发8个SKU，完成FDA合规认证，18个月内将月订单从500kg扩展至50吨。',
    'case.c1.s1': '扩张周期',
    'case.c1.s2': '月出货量',
    'case.c1.s3': 'SKU数量',
    'case.c2.country': '🇩🇪 德国',
    'case.c2.cat': '宠物玩具',
    'case.c2.title': '欧洲宠物玩具分销商',
    'case.c2.desc': '为德国分销商提供120+玩具SKU，符合CE和EN71标准，凭借稳定品质和准时交付帮助其拓展至5个欧盟市场。',
    'case.c2.s1': 'SKU供应数',
    'case.c2.s2': '市场扩张数',
    'case.c2.s3': '准时交付率',
    'case.c1.n1': '18个月', 'case.c1.n2': '50吨/月', 'case.c1.n3': '8个SKU',
    'case.c2.n1': '120+个SKU', 'case.c2.n2': '5个市场', 'case.c2.n3': '98%准时',
    'case.c1.img': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80',
    'case.c2.img': 'https://images.unsplash.com/photo-1450778869180-41d601e046e?w=600&q=80',
    'case.cta': '成为下一个成功案例',
    'news.tag': '新闻资讯',
    'news.title': '洞察行业前沿，把握市场机遇',
    'news.cat1': '公司动态',
    'news.cat2': '行业趋势',
    'news.n1.title': 'Bingling科技通过ISO 22000:2018宠物食品生产再认证',
    'news.n1.desc': '我司生产基地顺利通过ISO 22000:2018食品安全管理体系再认证审核，进一步强化对最高品质标准的不懈追求。',
    'news.n2.title': '2030年全球宠物行业将达5000亿美元：制造商的关键机遇',
    'news.n3.title': 'Bingling科技新扩建5000㎡生产基地，产能大幅提升',
    'news.n4.title': '可持续宠物用品：环保材料如何重塑市场格局',
    'news.read': '阅读更多 →',
    'cta.title': '准备好开启合作了吗？',
    'cta.sub': '免费获取产品目录与报价，24小时内回复',
    'cta.btn1': '获取免费目录',
    'cta.btn2': '💬 WhatsApp联系',
    'contact.tag': '联系我们',
    'contact.title': '携手共创，共赢未来',
    'contact.sub': '填写您的需求，我们的团队将在24小时内回复',
    'contact.addr.label': '公司地址',
    'contact.addr.val': '中国河北省石家庄市工业区路88号 050000',
    'contact.phone.label': '联系电话',
    'contact.email.label': '电子邮箱',
    'contact.hours.label': '工作时间',
    'contact.hours.val': '周一至周五 9:00-18:00（GMT+8）\n周末：邮件支持',
    'form.name': '姓名 *',
    'form.name.ph': '张三',
    'form.email': '邮箱地址 *',
    'form.company': '公司名称 *',
    'form.company.ph': '您的公司名称',
    'form.country': '国家/地区',
    'form.interest': '产品兴趣',
    'form.interest.ph': '请选择产品类别...',
    'form.interest.food': '宠物食品',
    'form.interest.toys': '宠物玩具',
    'form.interest.supplies': '宠物用品',
    'form.interest.all': '全品类',
    'form.message': '您的需求 *',
    'form.message.ph': '请描述您的产品需求、目标数量及特殊要求...',
    'form.attach': '附件上传（可选）',
    'form.attach.label': '上传文件（PDF、DOC、XLS、JPG）',
    'form.submit': '提交咨询',
    'form.note': '🔒 您的信息受到保护，我们将在24个工作小时内回复。',
    'footer.desc': '专业宠物用品制造与出口商。自2014年成立以来，以品质、可靠和创新服务全球采购商。',
    'footer.products': '产品',
    'footer.food': '宠物食品',
    'footer.toys': '宠物玩具',
    'footer.supplies': '宠物用品',
    'footer.catalog': '产品目录',
    'footer.company': '公司',
    'footer.about': '关于我们',
    'footer.solutions': '解决方案',
    'footer.cases': '案例展示',
    'footer.news': '新闻资讯',
    'footer.contact': '联系我们',
    'footer.inquiry': '在线咨询',
    'footer.copy': '© 2025 河北Bingling科技有限公司 保留所有权利',
    'footer.icp': '冀ICP备XXXXXXXX号',
        'float.chat': '咨询',
    'modal.title': '提交您的咨询',
    'modal.sub': '我们将在24个工作小时内回复',
    'toast.title': '提交成功！',
    'toast.msg': '我们将在24小时内与您联系。',
  },
};


function switchLanguage(lang) {
  const dict = i18n[lang] || i18n['en'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });
  document.documentElement.lang = lang;
  // Dispatch language change event for FAQ and other dynamic content
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Init language from localStorage
const savedLang = localStorage.getItem('preferredLang');
if (savedLang && i18n[savedLang]) {
  document.querySelectorAll('.lang-option').forEach(o => {
    o.classList.toggle('active', o.dataset.lang === savedLang);
  });
  document.getElementById('langBtn').querySelector('.lang-current').textContent = savedLang.toUpperCase();
  switchLanguage(savedLang);
}


// ─── PRODUCT FILTER & PAGINATION ──────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn:not(.sub)');
const subFilterBtns = document.querySelectorAll('.filter-btn.sub');
const prodSubfilter = document.getElementById('prodSubfilter');
let activeCat = 'all';
let activeSubCat = 'all';
let currentPage = 1;
const ITEMS_PER_PAGE = 16; // 4×4

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCat = btn.dataset.cat;
    currentPage = 1; // reset page on filter change

    if (activeCat === 'supplies') {
      prodSubfilter.classList.add('show');
      if (!document.querySelector('.filter-btn.sub.active')) {
        const firstSub = document.querySelector('.filter-btn.sub');
        if (firstSub) { firstSub.classList.add('active'); activeSubCat = firstSub.dataset.cat; }
      }
    } else {
      prodSubfilter.classList.remove('show');
      subFilterBtns.forEach(b => b.classList.remove('active'));
      activeSubCat = 'all';
    }

    applyFilter();
  });
});

subFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    subFilterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeSubCat = btn.dataset.cat;
    currentPage = 1;
    applyFilter();
  });
});

function applyFilter() {
  const prodCards = document.querySelectorAll('.prod-card');
  const visibleCards = [];

  prodCards.forEach(card => {
    const cardCat = card.dataset.cat;
    const cardSubCat = card.dataset.subcat || 'supplies';

    let show = false;
    if (activeCat === 'all') {
      show = true;
    } else if (activeCat === 'supplies') {
      show = (activeSubCat === 'supplies' || cardSubCat === activeSubCat);
    } else {
      show = (cardCat === activeCat);
    }

    if (show) {
      card.classList.remove('hidden');
      visibleCards.push(card);
    } else {
      card.classList.add('hidden');
      card.classList.add('page-hidden');
    }
  });

  // Apply pagination to visible cards
  const totalPages = Math.ceil(visibleCards.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;

  visibleCards.forEach((card, idx) => {
    if (idx >= startIdx && idx < endIdx) {
      card.classList.remove('page-hidden');
      card.style.animation = 'fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both';
    } else {
      card.classList.add('page-hidden');
    }
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById('prodPagination');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  // Prev arrow
  html += `<button class="page-btn arrow" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">‹</button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages <= 7 || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      html += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="page-btn" style="border:none;cursor:default;">…</span>`;
    }
  }

  // Next arrow
  html += `<button class="page-btn arrow" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">›</button>`;

  container.innerHTML = html;
}

function goToPage(page) {
  const prodCards = document.querySelectorAll('.prod-card:not(.hidden)');
  const totalPages = Math.ceil(prodCards.length / ITEMS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  applyFilter();
  // Scroll to products section top
  const section = document.getElementById('products');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
// ─── PRODUCT SECTION INIT ─────────────────────────────────
let productsInitialized = false;
const productsSection = document.getElementById('products');
if (productsSection) {
  const productsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !productsInitialized) {
        productsInitialized = true;
        applyFilter();
        // Also ensure products are loaded if not yet
        if (document.getElementById('prodGrid') && document.getElementById('prodGrid').children.length === 0) {
          loadProducts();
        }
      }
    });
  }, { threshold: 0.05 });
  productsObserver.observe(productsSection);
}


// ─── SCROLL REVEAL ──────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));


// ─── ACTIVE NAV HIGHLIGHT ────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
}, { passive: true });


// ─── INQUIRY MODAL ──────────────────────────────────────
function openInquiry() {
  document.getElementById('inquiryModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeInquiry(e) {
  if (!e || e.target === e.currentTarget) {
    document.getElementById('inquiryModal').classList.remove('open');
    document.body.style.overflow = '';
  }
}

function scrollToElement(selector) {
  document.querySelector(selector).scrollIntoView({ behavior: 'smooth' });
}


// ─── FORM SUBMISSION ─────────────────────────────────────
function submitForm(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('submitBtn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span>⏳ Sending...</span>';
  btn.disabled = true;

  const formData = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    company: form.company.value.trim(),
    country: form.country.value.trim(),
    interest: form.interest.value,
    message: form.message.value.trim()
  };

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  .then(res => {
    if (!res.ok) throw new Error('Server error');
    return res.json();
  })
  .then(() => {
    btn.innerHTML = '<span>✅ Sent!</span>';
    showToast("We'll get back to you within 24 hours.");
    form.reset();
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }, 2500);
  })
  .catch(() => {
    btn.innerHTML = '<span>❌ Failed</span>';
    showToast('Failed to send. Please try again.', 'error');
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }, 2500);
  });
}

function submitModalForm(e) {
  e.preventDefault();
  closeInquiry();
  showToast("Inquiry request sent! Our team will contact you soon.");
  setTimeout(() => {
    if (i18n[savedLang || 'en']) switchLanguage(savedLang || 'en');
  }, 500);
}

function showToast(msg, type) {
  const toast = document.getElementById('toast');
  const icon = toast.querySelector('.toast-icon');
  const body = toast.querySelector('p');
  if (msg) body.textContent = msg;
  if (type === 'error') {
    toast.classList.add('error');
    icon.textContent = '❌';
    body.textContent = msg || 'Something went wrong.';
  } else {
    icon.textContent = '✅';
  }
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show', 'error');
    icon.textContent = '✅';
    body.textContent = '';
  }, 4000);
}


// ─── FILE UPLOAD ─────────────────────────────────────────
const fileInput = document.getElementById('fileInput');
const fileLabel = document.querySelector('.file-label span');

if (fileInput) {
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      fileLabel.textContent = fileInput.files[0].name;
    }
  });
}


// ─── BACK TO TOP ────────────────────────────────────────
const backTopBtn = document.getElementById('backTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 600) {
    backTopBtn.classList.add('visible');
  } else {
    backTopBtn.classList.remove('visible');
  }
}, { passive: true });


// ─── PRODUCT DETAIL (stub - routes to inquiry) ──────────
function openProductDetail(productId) {
  openInquiry();
}


// ─── KEYBOARD ACCESSIBILITY ──────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeInquiry();
  }
});

/* ===== FAQ ACCORDION ===== */
function faqToggle(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-answer') || item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    const a = el.querySelector('.faq-answer') || el.querySelector('.faq-a');
    if (a) a.style.maxHeight = '0';
  });

  // Open clicked if it was closed
  if (!isOpen) {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

/* ===== FAQ TOC ACTIVE HIGHLIGHT ===== */
const faqTocLinks = document.querySelectorAll('.faq-toc-link');
const faqGroups = document.querySelectorAll('.faq-group');
if (faqTocLinks.length && faqGroups.length) {
  const faqObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        faqTocLinks.forEach(l => l.classList.remove('toc-active'));
        const active = document.querySelector('.faq-toc-link[href="#' + entry.target.id + '"]');
        if (active) active.classList.add('toc-active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  faqGroups.forEach(g => faqObs.observe(g));
}

/* ===== NEWS TAB SWITCHING + PAGINATION ===== */
(function() {
  var newsCurrentPage = 1;
  var NEWS_PER_PAGE = 3;
  var newsCurrentCat = 'all';

  function getNewsCards() {
    return document.querySelectorAll('#newsListContainer .news-card');
  }

  function applyNewsFilter() {
    var cards = getNewsCards();
    var visible = [];
    cards.forEach(function(card) {
      var cat = card.dataset.category || '';
      if (newsCurrentCat === 'all' || cat === newsCurrentCat) {
        card.style.display = '';
        visible.push(card);
      } else {
        card.style.display = 'none';
      }
    });

    // Pagination: show only current page items
    var start = (newsCurrentPage - 1) * NEWS_PER_PAGE;
    var count = 0;
    visible.forEach(function(card) {
      if (count >= start && count < start + NEWS_PER_PAGE) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
      count++;
    });

    renderNewsPagination(visible.length);
  }

  function renderNewsPagination(total) {
    var container = document.getElementById('newsPagination');
    if (!container) return;
    var totalPages = Math.ceil(total / NEWS_PER_PAGE);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    var html = '';
    // Prev button
    html += '<button class="page-btn" onclick="newsGoToPage(' + (newsCurrentPage - 1) + ')" ' + (newsCurrentPage <= 1 ? 'disabled' : '') + '>‹</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button class="page-btn' + (i === newsCurrentPage ? ' active' : '') + '" onclick="newsGoToPage(' + i + ')">' + i + '</button>';
    }
    // Next button
    html += '<button class="page-btn" onclick="newsGoToPage(' + (newsCurrentPage + 1) + ')" ' + (newsCurrentPage >= totalPages ? 'disabled' : '') + '>›</button>';
    container.innerHTML = html;
  }

  // Global function for pagination buttons
  window.newsGoToPage = function(page) {
    var cards = getNewsCards();
    var total = 0;
    cards.forEach(function(card) {
      var cat = card.dataset.category || '';
      if (newsCurrentCat === 'all' || cat === newsCurrentCat) total++;
    });
    var totalPages = Math.ceil(total / NEWS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    newsCurrentPage = page;
    applyNewsFilter();
    // Scroll to news section top
    var newsSection = document.getElementById('news');
    if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Tab click handlers
  document.querySelectorAll('.news-tab').forEach(function(tab) {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      newsCurrentCat = this.dataset.cat;
      newsCurrentPage = 1; // reset to first page on tab change
      document.querySelectorAll('.news-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      applyNewsFilter();
    });
  });

  // Initial render
  applyNewsFilter();
})();

/* ===== FAQ EVENT DELEGATION ===== */
document.addEventListener('click', function(e) {
  const q = e.target.closest('.faq-question');
  if (q && typeof faqToggle === 'function') {
    faqToggle(q);
  }
});

/* ===== LOAD DYNAMIC MODULES FROM API ===== */
(async function loadModules() {
  try {
    // Fetch both languages so switchLanguage() can switch between them
    const [zhRes, enRes] = await Promise.all([
      fetch('/api/modules?lang=zh'),
      fetch('/api/modules?lang=en')
    ]);
    if (!zhRes.ok || !enRes.ok) return;
    const zhData = await zhRes.json();
    const enData = await enRes.json();
    // localizeModules on server resolves _en fields → the API returns pure zh/en text.
    // Inject into i18n so switchLanguage() can apply them.

    // Hero zh + en
    ['zh','en'].forEach(function(l) {
      var m = l === 'zh' ? zhData : enData;
      if (m.hero) {
        i18n[l]['hero.title'] = m.hero.title || i18n[l]['hero.title'];
        i18n[l]['hero.sub'] = m.hero.subtitle || i18n[l]['hero.sub'];
        if (m.hero.stats) m.hero.stats.forEach((s, i) => { if (s.value) i18n[l]['hero.stat'+(i+1)] = s.label||''; });
      }
    });

    // About zh + en
    ['zh','en'].forEach(function(l) {
      var m = l === 'zh' ? zhData : enData;
      if (m.about) {
        ['tag','title','lead','p1','p2'].forEach(k => { if (m.about[k]) i18n[l]['about.'+k] = m.about[k]; });
        if (l === 'zh' && m.about.badge) {
          const badge = document.querySelector('.about-badge-num');
          if (badge) badge.textContent = m.about.badge;
        }
      }
    });

    // Factory zh + en
    ['zh','en'].forEach(function(l) {
      var m = l === 'zh' ? zhData : enData;
      if (m.factory) {
        if (m.factory.tag) { i18n[l]['factory.tag'] = m.factory.tag; var el = document.querySelector('[data-i18n="factory.tag"]'); if (el) el.textContent = m.factory.tag; }
        if (m.factory.title) { i18n[l]['factory.title'] = m.factory.title; var el = document.querySelector('[data-i18n="factory.title"]'); if (el) el.textContent = m.factory.title; }
        if (m.factory.subtitle) { i18n[l]['factory.sub'] = m.factory.subtitle; var el = document.querySelector('[data-i18n="factory.sub"]'); if (el) el.textContent = m.factory.subtitle; }
        if (m.factory.cards) m.factory.cards.forEach(function(c, i) {
          var idx = i+1;
          if (c.name) { i18n[l]['factory.card'+idx+'.name'] = c.name; var el = document.querySelector('[data-i18n="factory.card'+idx+'.name"]'); if (el) el.textContent = c.name; }
          if (c.desc) { i18n[l]['factory.card'+idx+'.desc'] = c.desc; var el = document.querySelector('[data-i18n="factory.card'+idx+'.desc"]'); if (el) el.textContent = c.desc; }
          if (c.image && l === lang) { var imgEl = document.querySelectorAll('.factory-img')[i]; if (imgEl) imgEl.src = c.image; }
        });
      }
    });

    // Solutions zh + en
    ['zh','en'].forEach(function(l) {
      var m = l === 'zh' ? zhData : enData;
      if (m.solutions) {
        if (m.solutions.tag) { i18n[l]['sol.tag'] = m.solutions.tag; if (l === lang) { var el = document.querySelector('[data-i18n="sol.tag"]'); if (el) el.textContent = m.solutions.tag; } }
        if (m.solutions.title) { i18n[l]['sol.title'] = m.solutions.title; if (l === lang) { var el = document.querySelector('[data-i18n="sol.title"]'); if (el) el.textContent = m.solutions.title; } }
        if (m.solutions.subtitle) { i18n[l]['sol.sub'] = m.solutions.subtitle; if (l === lang) { var el = document.querySelector('[data-i18n="sol.sub"]'); if (el) el.textContent = m.solutions.subtitle; } }
        if (m.solutions.cards) m.solutions.cards.forEach(function(c, i) {
          var idx = i+1;
          if (c.title) { i18n[l]['sol.c'+idx+'.title'] = c.title; if (l === lang) { var el = document.querySelector('[data-i18n="sol.c'+idx+'.title"]'); if (el) el.textContent = c.title; } }
          if (c.desc) { i18n[l]['sol.c'+idx+'.desc'] = c.desc; if (l === lang) { var el = document.querySelector('[data-i18n="sol.c'+idx+'.desc"]'); if (el) el.textContent = c.desc; } }
          if (c.items) {
            c.items.forEach(function(item, j) { i18n[l]['sol.c'+idx+'.l'+(j+1)] = item; if (l === lang) { var el = document.querySelector('[data-i18n="sol.c'+idx+'.l'+(j+1)+'"]'); if (el) el.textContent = item; } });
            if (l === lang) {
              var cardDiv = document.querySelector('[data-idx="'+(idx-1)+'"]');
              if (cardDiv) { var lis = cardDiv.querySelectorAll('li'); for (var k = c.items.length; k < lis.length; k++) lis[k].style.display='none'; }
            }
          }
        });
      }
    });

    // Cases
    if (m.cases) {
      if (m.cases.tag) { i18n[lang]['case.tag'] = m.cases.tag; var el = document.querySelector('[data-i18n="case.tag"]'); if (el) el.textContent = m.cases.tag; }
      if (m.cases.title) { i18n[lang]['case.title'] = m.cases.title; var el = document.querySelector('[data-i18n="case.title"]'); if (el) el.textContent = m.cases.title; }
      if (m.cases.subtitle) { i18n[lang]['case.sub'] = m.cases.subtitle; var el = document.querySelector('[data-i18n="case.sub"]'); if (el) el.textContent = m.cases.subtitle; }
      if (m.cases.cards) {
        m.cases.cards.forEach(function(c, i) {
          var idx = i + 1;
          var fields = ['tag','title','desc','country','cat','badge','s1','s2','s3','n1','n2','n3'];
          fields.forEach(function(f) {
            if (c[f]) { i18n[lang]['case.c' + idx + '.' + f] = c[f]; }
          });
          // 图片
          if (c.img) { i18n[lang]['case.c' + idx + '.img'] = c.img; var imgEl = document.querySelector('[data-i18n="case.c' + idx + '.img"]'); if (imgEl) imgEl.src = c.img; }
          // 统计数字 n1/n2/n3 直接更新 DOM
          var ne1 = document.querySelector('[data-i18n="case.c' + idx + '.n1"]'); if (ne1) ne1.textContent = c.n1 || '';
          var ne2 = document.querySelector('[data-i18n="case.c' + idx + '.n2"]'); if (ne2) ne2.textContent = c.n2 || '';
          var ne3 = document.querySelector('[data-i18n="case.c' + idx + '.n3"]'); if (ne3) ne3.textContent = c.n3 || '';
          // 卡片标签 tag / 国家 country / 品类 cat 直接更新 DOM
          var ctag = document.querySelector('[data-i18n="case.c' + idx + '.tag"]'); if (ctag) ctag.textContent = c.tag || '';
          var ccountry = document.querySelector('[data-i18n="case.c' + idx + '.country"]'); if (ccountry) ccountry.textContent = c.country || '';
          var ccat = document.querySelector('[data-i18n="case.c' + idx + '.cat"]'); if (ccat) ccat.textContent = c.cat || '';
        });
      }
    }

    // Advantages
    if (m.advantages) {
      if (m.advantages.tag) i18n[lang]['adv.tag'] = m.advantages.tag;
      if (m.advantages.title) i18n[lang]['adv.title'] = m.advantages.title;
      if (m.advantages.subtitle) i18n[lang]['adv.subtitle'] = m.advantages.subtitle;
      if (m.advantages.items) {
        m.advantages.items.forEach((item, i) => {
          if (item.title) i18n[lang]['adv.c' + (i+1) + '.title'] = item.title;
          if (item.desc) i18n[lang]['adv.c' + (i+1) + '.desc'] = item.desc;
        });
      }
    }

    // Contact
    if (m.contact) {
      if (m.contact.tag) i18n[lang]['contact.tag'] = m.contact.tag;
      if (m.contact.title) i18n[lang]['contact.title'] = m.contact.title;
      if (m.contact.subtitle) i18n[lang]['contact.sub'] = m.contact.subtitle;
      if (m.contact.address) i18n[lang]['contact.addr.val'] = m.contact.address;
      if (m.contact.hours) i18n[lang]['contact.hours.val'] = m.contact.hours;
      // Update phone/email links directly
      const phoneLink = document.querySelector('.contact-item a[href^="tel:"]');
      if (phoneLink && m.contact.phone) phoneLink.href = 'tel:' + m.contact.phone.replace(/\s/g, '');
      if (phoneLink && m.contact.phone) phoneLink.textContent = m.contact.phone;
      const emailLink = document.querySelector('.contact-item a[href^="mailto:"]');
      if (emailLink && m.contact.email) emailLink.href = 'mailto:' + m.contact.email;
      if (emailLink && m.contact.email) emailLink.textContent = m.contact.email;
      // Update Google Maps iframe
      if (m.contact.mapLng && m.contact.mapLat) {
        const iframe = document.querySelector('#amapContainer iframe');
        if (iframe) {
          const lat = parseFloat(m.contact.mapLat);
          const lng = parseFloat(m.contact.mapLng);
          iframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${lat}g!5e0!3m2!1sen!2scn!4v1`;
        }
      }
    }

    // CTA
    if (m.cta) {
      if (m.cta.title) i18n[lang]['cta.title'] = m.cta.title;
      if (m.cta.subtitle) i18n[lang]['cta.subtitle'] = m.cta.subtitle;
      if (m.cta.btn1) i18n[lang]['cta.btn1'] = m.cta.btn1;
      if (m.cta.btn2) i18n[lang]['cta.btn2'] = m.cta.btn2;
    }

    // Re-apply translations with updated i18n
    switchLanguage(lang);

    } catch(e) {
    console.warn('模块内容加载失败，使用默认内容', e);
  }

  // 初始加载产品
  loadProducts();
})();

// 加载产品列表
// 加载产品列表
async function loadProducts(langArg) {
  try {
    const lang = langArg || localStorage.getItem('preferredLang') || 'zh';
    const prodRes = await fetch('/api/site/products?lang=' + lang + '&t=' + Date.now());
    if (!prodRes.ok) throw new Error('products fetch failed');
    const prods = await prodRes.json();
    const prodGrid = document.getElementById('prodGrid');

    if (prodGrid && prods.length > 0) {
      const lang = localStorage.getItem('preferredLang') || 'zh';
      prodGrid.innerHTML = prods.map((p, i) => {
        const displayName = (lang === 'en' && p.name_en) ? p.name_en : p.name;
        const displayDesc = (lang === 'en' && p.desc_en) ? p.desc_en : p.desc;
        const displayBadge = (lang === 'en' && p.badge_en) ? p.badge_en : (p.badge || (p.category === 'food' ? 'Pet Food' : p.category === 'toys' ? 'Pet Toys' : 'Pet Supplies'));
        // 语义化 URL（四级：/products/父分类/子分类/类型/产品slug/）
        const categorySlug = p.category_slug || 'products';
        const subcategorySlug = p.subcategory_slug || 'general';
        const typeSlug = p.type_slug || 'standard';
        const slug = p.slug || p.id;
        const productUrl = `/products/${categorySlug}/${subcategorySlug}/${typeSlug}/${slug}/`;
        return `<div class="prod-card reveal${i > 0 ? '" style="--delay:' + (i * 0.05) + 's"' : '"'} data-cat="${p.category}"${p.subcategory ? ' data-subcat="' + p.subcategory + '"' : ''}>
          <div class="prod-img-wrap">
            <img src="${(p.images && p.images.original) || p.image || ''}" alt="${displayName}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=90'">
            <div class="prod-overlay">
              <button class="btn btn-primary btn-sm" onclick="location.href='${productUrl}'">View Details</button>
              <button class="btn btn-primary btn-sm" onclick="openInquiry()" style="background:#FF6B35;color:#fff;box-shadow:0 2px 8px rgba(255,107,53,0.4);">Inquire Now</button>
            </div>
            <span class="prod-badge">${displayBadge}</span>
          </div>
          <div class="prod-info">
            <h3>${displayName}</h3>
            <p>${displayDesc}</p>
            <div class="prod-meta">
              ${p.moq ? '<span>MOQ: ' + p.moq + '</span>' : ''}
              <button class="prod-cta" onclick="openInquiry()">Get Price</button>
            </div>
          </div>
        </div>`;
      }).join('');
      // Re-bind product filter logic after dynamic render
      if (typeof initProductFilter === 'function') initProductFilter();
      // Observe newly created .reveal elements
      prodGrid.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
      // Apply filter after rendering
      if (typeof applyFilter === 'function') applyFilter();
    }
  } catch(e) { console.warn('产品列表加载失败，使用静态内容'); }
}

// 加载新闻列表
async function loadNews(langArg) {
  var container = document.getElementById('newsListContainer');
  if (!container) return;

  var currentLang = langArg || localStorage.getItem('preferredLang') || 'zh';
  container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;">' + (currentLang === 'zh' ? '加载中...' : 'Loading...') + '</div>';

  try {
    var res = await fetch('/api/site/news?lang=' + currentLang + '&t=' + Date.now());
    if (!res.ok) throw new Error('API error');
    var newsList = await res.json();

    if (!newsList || newsList.length === 0) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">' + (currentLang === 'zh' ? '暂无新闻' : 'No news available') + '</div>';
      return;
    }

    // 按分类分组
    var company = newsList.filter(function(n) { return n.category === 'company'; });
    var industry = newsList.filter(function(n) { return n.category === 'industry'; });

    // 生成 HTML
    var html = '';
    if (company.length > 0) {
      html += '<div class="news-category active" data-category="company">';
      company.forEach(function(n) {
        var displayTitle = n.title || n.title_zh || n.title_en;
        var displayExcerpt = n.excerpt || n.excerpt_zh || n.excerpt_en;
        var newsSlug = n.slug || n.id;
        var newsUrl = '/blog/' + newsSlug + '/';
        html += '<a href="' + newsUrl + '" class="news-item reveal">';
        html += '<div class="ni-thumb"><img src="' + ((n.images && n.images.medium) || n.image || '') + '" alt="' + displayTitle + '" loading="lazy"/></div>';
        html += '<div class="ni-content">';
        html += '<span class="ni-badge company">' + (currentLang === 'zh' ? '公司' : 'Company') + '</span>';
        html += '<span class="ni-date">' + (n.date || '') + '</span>';
        html += '<h3>' + displayTitle + '</h3>';
        html += '<p>' + displayExcerpt + '</p>';
        html += '</div></a>';
      });
      html += '</div>';
    }
    if (industry.length > 0) {
      html += '<div class="news-category active" data-category="industry">';
      industry.forEach(function(n) {
        var displayTitle = n.title || n.title_zh || n.title_en;
        var displayExcerpt = n.excerpt || n.excerpt_zh || n.excerpt_en;
        var newsSlug = n.slug || n.id;
        var newsUrl = '/blog/' + newsSlug + '/';
        html += '<a href="' + newsUrl + '" class="news-item reveal">';
        html += '<div class="ni-thumb"><img src="' + ((n.images && n.images.medium) || n.image || '') + '" alt="' + displayTitle + '" loading="lazy"/></div>';
        html += '<div class="ni-content">';
        html += '<span class="ni-badge industry">' + (currentLang === 'zh' ? '行业' : 'Industry') + '</span>';
        html += '<span class="ni-date">' + (n.date || '') + '</span>';
        html += '<h3>' + displayTitle + '</h3>';
        html += '<p>' + displayExcerpt + '</p>';
        html += '</div></a>';
      });
      html += '</div>';
    }

    container.innerHTML = html;

    // 添加 visible 类
    container.querySelectorAll('.news-item.reveal').forEach(function(item) {
      item.classList.add('visible');
    });
  } catch (e) {
    console.error('loadNews error:', e);
  }
}

// DISABLED: loadNews() replaces SSR .news-card with .news-item, breaking pagination IIFE
  // if (document.readyState === 'loading') {
  //   document.addEventListener('DOMContentLoaded', loadNews);
  // } else {
  //   loadNews();
  // }

// ===== 加载联系信息 =====
async function loadContactInfo() {
  const container = document.getElementById('contactInfo');
  if (!container) return;

  try {
    const res = await fetch('/api/modules');
    if (!res.ok) throw new Error('Failed to load contact');
    const m = await res.json();
    const c = m.contact || {};

    // 使用后台数据或默认值
    const address = c.address || '中国河北省石家庄市新华区工业路88号';
    const phone = c.phone || '+86 311 8888 8888';
    const email = c.email || 'sales@bingling-tech.com';
    const whatsapp = c.whatsapp || '+86 130 0000 0000';
    const hours = c.hours || 'Mon-Fri 9:00-18:00 (GMT+8)<br/>Weekend: Email support only';
    const mapUrl = c.mapUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26510!2d114.5024!3d38.0455!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35eca88e7c3dd7bf%3A0x0!2z5bu26LSn5biB5paw5YqA!5e0!3m2!1sen!2scn!4v1';
    const linkedin = c.linkedin || '#';
    const facebook = c.facebook || '#';
    const youtube = c.youtube || '#';
    const instagram = c.instagram || '#';

    container.innerHTML = `
      <div class="contact-item">
        <div class="contact-icon">📍</div>
        <div>
          <strong data-i18n="contact.addr.label">Address</strong>
          <p data-i18n="contact.addr.val">${address}</p>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">📞</div>
        <div>
          <strong data-i18n="contact.phone.label">Phone</strong>
          <p><a href="tel:${phone.replace(/\s/g, '')}">${phone}</a></p>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">✉️</div>
        <div>
          <strong data-i18n="contact.email.label">Email</strong>
          <p><a href="mailto:${email}">${email}</a></p>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">💬</div>
        <div>
          <strong>WhatsApp</strong>
          <p><a href="https://wa.me/${whatsapp.replace(/\+|\s/g, '')}" target="_blank">${whatsapp}</a></p>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">🕐</div>
        <div>
          <strong data-i18n="contact.hours.label">Business Hours</strong>
          <p data-i18n="contact.hours.val">${hours}</p>
        </div>
      </div>
      <div class="contact-map">
        <div class="contact-map-title">📍 公司位置 / Our Location</div>
        <div class="contact-map-wrap">
          <iframe src="${mapUrl}" width="100%" height="280" style="border:0;border-radius:12px;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="sunlitpaws location"></iframe>
        </div>
      </div>
      <div class="contact-social">
        <a href="${linkedin}" class="social-btn" title="LinkedIn" target="_blank">in</a>
        <a href="${facebook}" class="social-btn" title="Facebook" target="_blank">f</a>
        <a href="${youtube}" class="social-btn" title="YouTube" target="_blank">▶</a>
        <a href="${instagram}" class="social-btn" title="Instagram" target="_blank">📷</a>
      </div>
    `;

    // 同步更新页脚和浮动按钮的 WhatsApp/电话/邮箱
    const waClean = whatsapp.replace(/\+|\s/g, '');
    const waHref = 'https://wa.me/' + waClean;
    document.querySelectorAll('a[href*="wa.me"]').forEach(a => a.href = waHref);
    const footerTel = document.querySelector('footer a[href^="tel:"]');
    if (footerTel) footerTel.href = 'tel:' + phone.replace(/\s/g, '');
    const footerTel2 = document.querySelector('footer a[href^="tel:"]');
    if (footerTel2) footerTel2.textContent = phone;
    const footerEmail = document.querySelector('footer a[href^="mailto:"]');
    if (footerEmail) footerEmail.href = 'mailto:' + email;
    if (footerEmail) footerEmail.textContent = email;

    // 重新应用语言切换
    const lang = localStorage.getItem('preferredLang') || 'en';
    if (typeof switchLanguage === 'function') switchLanguage(lang);

  } catch (e) {
    console.warn('联系信息加载失败，使用默认内容', e);
  }
}

// DOM 加载完成后加载联系信息
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadContactInfo);
} else {
  loadContactInfo();
}

// ===== 中文FAQ加载 (index.html首页) =====
async function loadChineseFaqs() {
  try {
    const res = await fetch('/api/site/faqs?lang=zh&t=' + Date.now());
    const faqs = await res.json();
    if (!faqs || !faqs.length) return;

    // 按 section 分组
    const groups = {};
    faqs.forEach(f => {
      const sec = f.section || '其他';
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(f);
    });

    // 生成分组ID映射
    const sectionIds = {
      '供应商资质核查': 's1',
      '工厂vs贸易公司': 's2',
      '认证与合规': 's3',
      '质量控制': 's4',
      '价格与起订量': 's5',
      '付款与贸易': 's6',
      '物流与清关': 's7',
      '售后与风控': 's8'
    };

    // 生成TOC和内容
    let tocHtml = '';
    let contentHtml = '';
    let idx = 0;

    Object.keys(groups).forEach((sec, si) => {
      const sid = sectionIds[sec] || 's' + (si + 1);
      const num = String(si + 1).padStart(2, '0');

      // TOC项
      tocHtml += '<li><a href="#faq-' + sid + '" class="faq-toc-link">' + num + ' &nbsp;' + sec + '</a></li>';

      // 分组内容
      contentHtml += '<div class="faq-group" id="faq-' + sid + '">';
      contentHtml += '<div class="faq-group-head"><span class="faq-group-num">' + num + '</span><span class="faq-group-name">' + sec + '</span></div>';
      contentHtml += '<div class="faq-items">';

      groups[sec].forEach((item) => {
        idx++;
        const qNum = 'Q' + idx;
        const answer = (item.answer || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
        contentHtml += '<div class="faq-item">';
        contentHtml += '<button class="faq-q" onclick="faqToggle(this)"><span class="faq-q-num">' + qNum + '</span><span class="faq-q-text">' + (item.question || '') + '</span></button>';
        contentHtml += '<div class="faq-a"><div class="faq-a-inner">' + answer + '</div></div>';
        contentHtml += '</div>';
      });

      contentHtml += '</div></div>';
    });

    // 写入DOM
    const tocEl = document.getElementById('faqToc');
    const contentEl = document.getElementById('faqAccordion');
    if (tocEl) {
      const label = tocEl.querySelector('.faq-toc-label');
      tocEl.innerHTML = (label ? '<div class="faq-toc-label">目录</div>' : '') + '<ul class="faq-toc-list">' + tocHtml + '</ul>';
    }
    if (contentEl) contentEl.innerHTML = contentHtml;

  } catch(e) {
    console.error('加载中文FAQ失败:', e);
  }
}

window.addEventListener('languageChanged', function(e) {
  const lang = e.detail.lang;
  // 重新加载产品（带上正确的lang参数给API）
  if (typeof loadProducts === 'function') {
    loadProducts(lang);
  }
  // DON'T call loadNews() here - it replaces SSR .news-card with .news-item, breaking pagination
  // if (typeof loadNews === 'function') { loadNews(lang); }
  // FAQ由index.ejs内联IIFE自行监听languageChanged事件并重载，此处无需重复调用
});
