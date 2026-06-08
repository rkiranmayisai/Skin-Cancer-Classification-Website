/**
 * SKIN CANCER CLASSIFICATION WEBSITE
 * Shared Application JavaScript
 */

// ── Theme Management ──────────────────────────────────────
const ThemeManager = {
  key: 'skc-theme',
  init() {
    const saved = localStorage.getItem(this.key) || 'light';
    this.apply(saved);
  },
  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    this.apply(next);
    localStorage.setItem(this.key, next);
  },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle-icon').forEach(el => {
      el.className = 'theme-toggle-icon ' + (theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon');
    });
  }
};

// ── Auth Simulation ───────────────────────────────────────
const Auth = {
  key: 'skc-user',
  fakeUsers: [
    { id: 1, name: 'Dr. Ravi Kumar', email: 'ravi@dermcare.in', role: 'admin', avatar: '👨‍⚕️', joined: '2024-01-15' },
    { id: 2, name: 'Priya Sharma', email: 'priya@gmail.com', role: 'user', avatar: '👩', joined: '2025-03-22' },
    { id: 3, name: 'Arjun Nair', email: 'arjun@outlook.com', role: 'user', avatar: '👨', joined: '2025-06-10' },
  ],

  login(email, password) {
    if (!email || !password) return { success: false, msg: 'Please fill all fields.' };
    const user = this.fakeUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, msg: 'No account found with this email.' };
    if (password.length < 4) return { success: false, msg: 'Invalid password.' };
    const token = btoa(JSON.stringify({ uid: user.id, exp: Date.now() + 86400000 }));
    localStorage.setItem(this.key, JSON.stringify({ ...user, token }));
    return { success: true, user };
  },

  register(name, email, password) {
    if (!name || !email || !password) return { success: false, msg: 'Please fill all fields.' };
    if (password.length < 6) return { success: false, msg: 'Password must be at least 6 characters.' };
    const newUser = {
      id: Date.now(),
      name,
      email,
      role: 'user',
      avatar: '👤',
      joined: new Date().toISOString().slice(0, 10),
      token: btoa(JSON.stringify({ uid: Date.now(), exp: Date.now() + 86400000 }))
    };
    localStorage.setItem(this.key, JSON.stringify(newUser));
    return { success: true, user: newUser };
  },

  logout() {
    localStorage.removeItem(this.key);
    window.location.href = 'login.html';
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.key)); } catch { return null; }
  },

  isLoggedIn() { return !!this.getUser(); },

  requireLogin() {
    if (!this.isLoggedIn()) { window.location.href = 'login.html'; return false; }
    return true;
  }
};

// ── Navbar ────────────────────────────────────────────────
const Navbar = {
  init() {
    // Scroll effect
    window.addEventListener('scroll', () => {
      const nav = document.querySelector('.navbar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Active link
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === path || (path === '' && href === 'index.html'))) {
        link.classList.add('active');
      }
    });

    // User state
    this.updateUserState();

    // Mobile menu
    const hamburger = document.getElementById('hamburger');
    if (hamburger) hamburger.addEventListener('click', () => this.toggleMobile());
  },

  updateUserState() {
    const user = Auth.getUser();
    const loginBtn = document.getElementById('nav-login-btn');
    const userMenu = document.getElementById('nav-user-menu');
    const userName = document.getElementById('nav-user-name');

    if (user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userMenu) { userMenu.style.display = 'flex'; }
      if (userName) userName.textContent = user.name.split(' ')[0];
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (userMenu) userMenu.style.display = 'none';
    }
  },

  toggleMobile() {
    let menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.classList.toggle('open');
  }
};

// ── Toast Notifications ───────────────────────────────────
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    this.init();
    const icons = { success: 'fa-solid fa-circle-check', danger: 'fa-solid fa-circle-xmark', info: 'fa-solid fa-circle-info', warning: 'fa-solid fa-triangle-exclamation' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="toast-icon ${icons[type] || icons.info}"></i><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }
};

// ── Intersection Observer (Animations) ───────────────────
const AnimObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      AnimObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

function initAnimations() {
  document.querySelectorAll('.fade-up, .fade-in').forEach(el => AnimObserver.observe(el));
}

// ── Counter Animation ─────────────────────────────────────
function animateCounter(el, target, duration = 1800, suffix = '') {
  const start = performance.now();
  const startVal = 0;
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(startVal + (target - startVal) * eased).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ── Progress Bar Animate ──────────────────────────────────
function animateProgress(barEl, pct) {
  setTimeout(() => { barEl.style.width = pct + '%'; }, 100);
}

// ── Confidence Ring ───────────────────────────────────────
function setConfidenceRing(ringEl, percent) {
  const circumference = 408;
  const fill = ringEl.querySelector('.fill');
  const valueEl = ringEl.querySelector('.confidence-percent');
  if (!fill) return;
  const offset = circumference - (percent / 100) * circumference;
  setTimeout(() => {
    fill.style.strokeDashoffset = offset;
    // Animate number
    const start = performance.now();
    const update = (time) => {
      const p = Math.min((time - start) / 1500, 1);
      const v = Math.round(p * percent);
      if (valueEl) valueEl.textContent = v + '%';
      if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, 300);
  // Color class
  fill.className = 'fill ' + (percent >= 70 ? 'high' : percent >= 40 ? 'medium' : 'low');
}

// ── Prediction History (localStorage) ────────────────────
const PredictionHistory = {
  key: 'skc-predictions',
  add(record) {
    const hist = this.getAll();
    hist.unshift({ ...record, id: Date.now(), date: new Date().toISOString() });
    if (hist.length > 50) hist.pop();
    localStorage.setItem(this.key, JSON.stringify(hist));
  },
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; }
  },
  clear() { localStorage.removeItem(this.key); }
};

// ── Utility Functions ─────────────────────────────────────
const Utils = {
  formatDate(isoStr) {
    return new Date(isoStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  },
  formatTime(isoStr) {
    return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  },
  capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; },
  slugify(str) { return str.toLowerCase().replace(/\s+/g, '-'); },
  debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  }
};

// ── Tabs ─────────────────────────────────────────────────
function initTabs(containerEl) {
  const btns = containerEl.querySelectorAll('.tab-btn');
  const panes = containerEl.querySelectorAll('.tab-pane');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = containerEl.querySelector('#' + btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ── Modal ─────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// ── Shared Navbar HTML generator ─────────────────────────
function renderNavbar(activePage = '') {
  const user = Auth.getUser();
  return `
  <nav class="navbar" id="navbar">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">
        <div class="nav-logo-icon"><i class="fa-solid fa-microscope"></i></div>
        <span>DermAI</span>
      </a>
      <div class="nav-links">
        <a href="index.html" class="nav-link ${activePage==='home'?'active':''}">Home</a>
        <a href="upload.html" class="nav-link ${activePage==='upload'?'active':''}">AI Scan</a>
        <a href="dashboard.html" class="nav-link ${activePage==='dashboard'?'active':''}">Dashboard</a>
        <a href="risk-calculator.html" class="nav-link ${activePage==='risk'?'active':''}">Risk Check</a>
        <a href="admin.html" class="nav-link ${activePage==='admin'?'active':''}">Admin</a>
      </div>
      <div class="nav-actions">
        <button class="nav-toggle-theme" onclick="ThemeManager.toggle()" title="Toggle theme">
          <i class="theme-toggle-icon fa-solid fa-moon"></i>
        </button>
        ${user
          ? `<div id="nav-user-menu" class="flex" style="align-items:center;gap:10px;">
               <span style="font-size:0.85rem;font-weight:600;">${user.avatar} ${user.name.split(' ')[0]}</span>
               <a href="profile.html" class="btn btn-outline btn-sm">Profile</a>
               <button class="btn btn-sm" style="background:var(--border);color:var(--text);" onclick="Auth.logout()">Logout</button>
             </div>`
          : `<a href="login.html" id="nav-login-btn" class="btn btn-primary btn-sm">Login / Sign Up</a>`
        }
        <button class="hamburger" id="hamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>
  <div class="mobile-menu" id="mobile-menu">
    <div class="mobile-menu-bg" onclick="Navbar.toggleMobile()"></div>
    <div class="mobile-menu-panel">
      <a href="index.html" class="nav-link">🏠 Home</a>
      <a href="upload.html" class="nav-link">🔬 AI Scan</a>
      <a href="dashboard.html" class="nav-link">📊 Dashboard</a>
      <a href="risk-calculator.html" class="nav-link">⚠️ Risk Check</a>
      <a href="admin.html" class="nav-link">🛡️ Admin</a>
      <hr style="margin:12px 0;border-color:var(--border);">
      ${user
        ? `<a href="profile.html" class="nav-link">👤 Profile</a>
           <button class="btn btn-danger btn-sm" style="width:100%;margin-top:8px;" onclick="Auth.logout()">Logout</button>`
        : `<a href="login.html" class="btn btn-primary" style="width:100%;justify-content:center;">Login / Sign Up</a>`
      }
    </div>
  </div>`;
}

// ── Shared Footer HTML ────────────────────────────────────
function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h3>🔬 DermAI</h3>
          <p>AI-powered skin cancer classification using deep learning. Early detection saves lives. Built with ❤️ for a healthier tomorrow.</p>
          <br>
          <div class="flex gap-sm" style="margin-top:16px;">
            <span class="badge badge-primary">TensorFlow</span>
            <span class="badge badge-secondary">CNN Model</span>
            <span class="badge badge-success">94.5% Accuracy</span>
          </div>
        </div>
        <div class="footer-col">
          <h4>Product</h4>
          <ul>
            <li><a href="upload.html">AI Skin Scan</a></li>
            <li><a href="dashboard.html">Dashboard</a></li>
            <li><a href="risk-calculator.html">Risk Calculator</a></li>
            <li><a href="profile.html">My Reports</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Learn</h4>
          <ul>
            <li><a href="index.html#about">About Melanoma</a></li>
            <li><a href="index.html#prevention">Prevention Tips</a></li>
            <li><a href="index.html#faq">FAQ</a></li>
            <li><a href="#">Research</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Use</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <hr class="footer-divider">
      <div class="footer-bottom">
        <p>© 2025 DermAI. Built for academic & research purposes. Not a substitute for professional medical advice.</p>
        <div class="footer-socials">
          <a class="social-icon" href="#" title="GitHub"><i class="fa-brands fa-github"></i></a>
          <a class="social-icon" href="#" title="Twitter"><i class="fa-brands fa-twitter"></i></a>
          <a class="social-icon" href="#" title="LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
          <a class="social-icon" href="#" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
        </div>
      </div>
    </div>
  </footer>`;
}

// ── Chatbot ───────────────────────────────────────────────
const Chatbot = {
  open: false,
  responses: {
    melanoma: "Melanoma is the most serious type of skin cancer. It develops from pigment-producing cells (melanocytes). Early detection is crucial — look for asymmetry, border irregularity, color variation, diameter >6mm, and evolution (ABCDE rule).",
    benign: "A benign skin lesion is non-cancerous. Common examples include moles, seborrheic keratosis, and dermatofibromas. While generally harmless, regular monitoring is recommended.",
    malignant: "A malignant lesion is cancerous and can spread to other parts of the body. Immediate dermatologist consultation is recommended if our AI detects malignancy.",
    symptoms: "Common warning signs:\n• Asymmetrical moles\n• Irregular or ragged borders\n• Multiple colors in one lesion\n• Diameter larger than a pencil eraser\n• Any changing, bleeding, or itching spot",
    prevention: "Skin cancer prevention tips:\n• Apply SPF 30+ sunscreen daily\n• Avoid peak sun hours (10am–4pm)\n• Wear protective clothing & hats\n• Never use tanning beds\n• Perform monthly self-skin exams\n• Annual dermatologist check-ups",
    accuracy: "Our AI model achieves 94.5% accuracy on the ISIC 2020 dataset, using an ensemble of ResNet50, EfficientNet-B4, and DenseNet-121. Confidence scores are provided with each prediction.",
    upload: "To analyze your skin lesion: 1) Click 'AI Scan' in the navigation, 2) Upload a clear image of the lesion, 3) Our AI will classify it in seconds with a detailed report.",
    report: "Yes! After each analysis you can download a comprehensive PDF report containing the uploaded image, AI prediction, confidence scores, heatmap visualization, and medical recommendations.",
    doctor: "Our AI is a screening tool, not a diagnosis. Always consult a certified dermatologist for professional advice. We recommend booking an appointment if:\n• Confidence > 70% for malignancy\n• You notice any ABCDE signs\n• Any skin change that worries you",
    risk: "Use our Risk Calculator to assess your personal risk score based on age, skin type, family history, and sun exposure history. Early risk assessment helps with preventive care.",
    hello: "Hello! 👋 I'm DermBot, your AI skin health assistant. I can help you with:\n• Information about skin cancer types\n• Prevention tips\n• How to use our AI scanner\n• Understanding your results\n\nWhat would you like to know?",
    default: "I'm here to help with skin health questions! Try asking about:\n• Melanoma symptoms\n• Prevention tips\n• How the AI works\n• Understanding results\n• Risk factors"
  },

  getResponse(msg) {
    const m = msg.toLowerCase();
    if (m.match(/hello|hi|hey|namaste|hai/)) return this.responses.hello;
    if (m.match(/melanoma/)) return this.responses.melanoma;
    if (m.match(/benign/)) return this.responses.benign;
    if (m.match(/malignant|cancer/)) return this.responses.malignant;
    if (m.match(/symptom|sign|abcde/)) return this.responses.symptoms;
    if (m.match(/prevent|protect|sunscreen/)) return this.responses.prevention;
    if (m.match(/accura|model|ai|accuracy/)) return this.responses.accuracy;
    if (m.match(/upload|scan|image|photo/)) return this.responses.upload;
    if (m.match(/report|pdf|download/)) return this.responses.report;
    if (m.match(/doctor|consult|appointment/)) return this.responses.doctor;
    if (m.match(/risk|calculator|score/)) return this.responses.risk;
    return this.responses.default;
  },

  toggle() {
    this.open = !this.open;
    const win = document.getElementById('chatbot-window');
    const fab = document.getElementById('chatbot-fab');
    if (win) win.classList.toggle('open', this.open);
    if (fab) fab.innerHTML = this.open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-robot"></i>';
  },

  send() {
    const inp = document.getElementById('chatbot-input');
    if (!inp) return;
    const msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    this.addMessage(msg, 'user');
    setTimeout(() => this.addMessage(this.getResponse(msg), 'bot'), 600);
  },

  addMessage(text, who) {
    const msgs = document.getElementById('chatbot-messages');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${who}`;
    div.innerHTML = `<div class="chat-bubble">${text.replace(/\n/g, '<br>')}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  },

  initUI() {
    const html = `
    <button class="chatbot-fab" id="chatbot-fab" onclick="Chatbot.toggle()" title="Ask DermBot">
      <i class="fa-solid fa-robot"></i>
    </button>
    <div class="chatbot-window" id="chatbot-window">
      <div class="chatbot-header">
        <div class="chatbot-avatar"><i class="fa-solid fa-robot"></i></div>
        <div>
          <div style="font-weight:700;font-size:0.95rem;">DermBot</div>
          <div style="font-size:0.75rem;opacity:0.8;">🟢 Online · AI Health Assistant</div>
        </div>
        <button onclick="Chatbot.toggle()" style="margin-left:auto;background:rgba(255,255,255,0.2);border:none;color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;">✕</button>
      </div>
      <div class="chatbot-messages" id="chatbot-messages"></div>
      <div class="chatbot-input-row">
        <input type="text" id="chatbot-input" placeholder="Ask about skin health..." onkeydown="if(event.key==='Enter')Chatbot.send()">
        <button class="btn btn-primary btn-sm btn-icon" onclick="Chatbot.send()"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>`;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstElementChild);
    document.body.appendChild(wrapper.lastElementChild);
    this.addMessage("Hello! 👋 I'm DermBot. How can I help you today?", 'bot');
  }
};

// ── Init on DOM Ready ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Navbar.init();
  initAnimations();
  Chatbot.initUI();

  // Init tabs
  document.querySelectorAll('[data-tabs]').forEach(el => initTabs(el));

  // Modal close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });
});
