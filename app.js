/* app.js — DermAI Main Controller */

// ─── State ────────────────────────────────────────────────────────────────
const state = {
  currentView: 'scanner',
  inputMode: 'upload',
  currentImage: null,      // HTMLImageElement or null
  currentFilename: null,
  currentResult: null,     // last analysis result object
  history: [],
  stats: { total: 0, critical: 0, high: 0, benign: 0 },
  webcamStream: null,
  samples: [],
};

// ─── Toast ────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('voice-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupDropzone();
  await loadSamples();
  await loadCatalog();
  checkServerHealth();
});

async function checkServerHealth() {
  try {
    await DermAPI.health();
    setStatus('System Ready', 'healthy');
  } catch {
    setStatus('Server Offline', 'busy');
  }
}

function setStatus(label, cls) {
  const dot = document.getElementById('status-dot');
  const lbl = document.getElementById('status-label');
  if (dot) { dot.className = `status-dot ${cls}`; }
  if (lbl) lbl.textContent = label;
}

// ─── View Switching ───────────────────────────────────────────────────────
function switchView(viewName, navEl) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const view = document.getElementById(`view-${viewName}`);
  if (view) view.classList.add('active');
  if (navEl) navEl.classList.add('active');
  state.currentView = viewName;
  const titles = { scanner: 'Live Scanner', dashboard: 'Dashboard', catalog: 'Lesion Catalog', history: 'Scan History' };
  const pt = document.getElementById('page-title');
  if (pt) pt.textContent = titles[viewName] || viewName;
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ─── Input Mode ───────────────────────────────────────────────────────────
function setMode(mode) {
  state.inputMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${mode}`)?.classList.add('active');
  document.querySelectorAll('.input-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${mode}`)?.classList.add('active');

  if (mode !== 'camera') stopCamera();
}

// ─── Dropzone ─────────────────────────────────────────────────────────────
function setupDropzone() {
  const dz = document.getElementById('dropzone');
  if (!dz) return;

  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  });
  dz.addEventListener('click', () => document.getElementById('file-input')?.click());
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadImageFile(file);
}

function loadImageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.currentImage = img;
      state.currentFilename = file.name;
      drawImageOnCanvas(img);
      document.getElementById('analyze-btn').disabled = false;
      showToast(`Loaded: ${file.name}`);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ─── Camera ───────────────────────────────────────────────────────────────
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    state.webcamStream = stream;
    const video = document.getElementById('webcam-video');
    video.srcObject = stream;
    document.getElementById('cam-start-btn').disabled = true;
    document.getElementById('cam-capture-btn').disabled = false;
    document.getElementById('cam-stop-btn').disabled = false;
    showToast('Camera started');
  } catch (err) {
    alert(`Camera error: ${err.message}. Please allow camera access.`);
  }
}

function stopCamera() {
  if (state.webcamStream) {
    state.webcamStream.getTracks().forEach(t => t.stop());
    state.webcamStream = null;
  }
  const video = document.getElementById('webcam-video');
  if (video) video.srcObject = null;
  document.getElementById('cam-start-btn').disabled = false;
  document.getElementById('cam-capture-btn').disabled = true;
  document.getElementById('cam-stop-btn').disabled = true;
}

function captureFrame() {
  const video = document.getElementById('webcam-video');
  if (!video || !video.srcObject) return;

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  const img = new Image();
  img.onload = () => {
    state.currentImage = img;
    state.currentFilename = 'webcam_capture.jpg';
    drawImageOnCanvas(img);
    document.getElementById('analyze-btn').disabled = false;
    showToast('Frame captured');
  };
  img.src = canvas.toDataURL('image/jpeg', 0.92);
}

// ─── Samples ──────────────────────────────────────────────────────────────
async function loadSamples() {
  try {
    const samples = await DermAPI.getSamples();
    state.samples = samples;
    renderSamples(samples);
  } catch {
    document.getElementById('sample-grid').innerHTML = '<div class="sample-skeleton">Could not load samples (server offline).</div>';
  }
}

function renderSamples(samples) {
  const grid = document.getElementById('sample-grid');
  if (!grid) return;

  if (!samples.length) {
    grid.innerHTML = '<div class="sample-skeleton">No samples found.</div>';
    return;
  }

  grid.innerHTML = samples.map(s => `
    <div class="sample-card" onclick="loadSampleByFilename('${s.filename}', this)">
      <img class="sample-thumb" src="${DermAPI.getSamplesUrl(s.url)}" alt="${s.title}" onerror="this.style.display='none'" />
      <div class="sample-name">${s.title}</div>
      <span class="sample-risk risk-${s.risk_level}">${s.risk_level}</span>
    </div>
  `).join('');
}

function loadSampleByFilename(filename, cardEl) {
  document.querySelectorAll('.sample-card').forEach(c => c.classList.remove('active'));
  cardEl?.classList.add('active');

  const url = DermAPI.getSampleImageUrl(filename);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.currentImage = img;
    state.currentFilename = filename;
    drawImageOnCanvas(img);
    document.getElementById('analyze-btn').disabled = false;
    showToast(`Sample loaded: ${filename}`);
  };
  img.onerror = () => {
    state.currentFilename = filename;
    state.currentImage = null;
    document.getElementById('analyze-btn').disabled = false;
    showToast(`Using golden data for: ${filename}`);
  };
  img.src = url;
}

// ─── Canvas ───────────────────────────────────────────────────────────────
function drawImageOnCanvas(img) {
  const canvas = document.getElementById('analysis-canvas');
  const placeholder = document.getElementById('canvas-placeholder');
  if (!canvas) return;

  const wrapper = document.getElementById('canvas-wrapper');
  const maxW = wrapper.clientWidth - 8;
  const maxH = wrapper.clientHeight - 8;
  const scale = Math.min(maxW / img.width, maxH / img.height, 1);

  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  canvas.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';
}

function drawResultOverlay(canvas, obj) {
  const ctx = canvas.getContext('2d');
  const [x0, y0, x1, y1] = obj.box;
  const bx = x0 * canvas.width;
  const by = y0 * canvas.height;
  const bw = (x1 - x0) * canvas.width;
  const bh = (y1 - y0) * canvas.height;

  // Color by risk level
  const riskColors = { Critical: '#e74c3c', High: '#e67e22', Low: '#2ecc71', Benign: '#3498db' };
  const color = riskColors[obj.risk_level] || '#4f9cf9';

  // Bounding box
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 3]);
  ctx.strokeRect(bx, by, bw, bh);
  ctx.setLineDash([]);

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.shadowBlur = 0;

  // Corner markers
  const cs = 14;
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  [[bx, by], [bx+bw, by], [bx, by+bh], [bx+bw, by+bh]].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + (cy === by ? cs : -cs));
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + (cx === bx ? cs : -cs), cy);
    ctx.stroke();
  });

  // Label badge
  const label = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
  ctx.font = 'bold 11px Outfit, sans-serif';
  const tw = ctx.measureText(label).width;
  const padX = 8, padY = 5;
  const lx = bx, ly = by > 22 ? by - 22 : by + bh + 4;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(lx, ly, tw + padX*2, 20, 4);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.fillText(label, lx + padX, ly + 14);
}

// ─── Analysis ─────────────────────────────────────────────────────────────
async function triggerAnalysis() {
  const overlay = document.getElementById('analysis-overlay');
  const analyzeBtn = document.getElementById('analyze-btn');
  overlay?.classList.remove('hidden');
  analyzeBtn.disabled = true;
  setStatus('Analyzing...', 'busy');

  try {
    let imageData = '';
    const canvas = document.getElementById('analysis-canvas');

    // Grab base64 from canvas if we have a real image drawn
    if (state.currentImage && canvas.style.display !== 'none') {
      const tmp = document.createElement('canvas');
      tmp.width = state.currentImage.width;
      tmp.height = state.currentImage.height;
      tmp.getContext('2d').drawImage(state.currentImage, 0, 0);
      imageData = tmp.toDataURL('image/jpeg', 0.92).split(',')[1];
    }

    const response = await DermAPI.analyzeBase64(imageData, state.currentFilename);
    const obj = response.objects?.[0];
    if (!obj) throw new Error('No lesion detected in the response');

    state.currentResult = obj;

    // Redraw image then overlay
    if (state.currentImage) drawImageOnCanvas(state.currentImage);
    drawResultOverlay(canvas, obj);

    renderResults(obj);
    updateDashboardStats(obj);
    showToast(`✅ ${obj.label} — ${obj.risk_level}`);
    setStatus('Analysis Complete', 'healthy');

  } catch (err) {
    console.error(err);
    showToast(`❌ Error: ${err.message}`);
    setStatus('Error', 'busy');
  } finally {
    overlay?.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
}

// ─── Result Rendering ─────────────────────────────────────────────────────
function renderResults(obj) {
  // Toggle visibility
  document.getElementById('result-placeholder').style.display = 'none';
  document.getElementById('result-content').classList.remove('hidden');

  // Header
  document.getElementById('result-label').textContent = obj.label;
  const badge = document.getElementById('risk-badge');
  badge.textContent = obj.risk_level;
  badge.className = `risk-badge ${obj.risk_level}`;

  // ABCD meters
  const abcd = obj.abcd;
  setMeter('asym',  abcd.asymmetry,       `${(abcd.asymmetry * 100).toFixed(0)}%`);
  setMeter('border', abcd.border,         `${(abcd.border * 100).toFixed(0)}%`);
  setMeter('color', abcd.color_variance,  `${(abcd.color_variance * 100).toFixed(0)}%`);
  const diamNorm = Math.min(abcd.diameter_mm / 20, 1);
  setMeter('diam',  diamNorm,             `${abcd.diameter_mm} mm`);

  // Risk gauge
  animateGauge(obj.risk_score);

  // Urgency banner
  document.getElementById('urgency-banner').textContent = obj.urgency;

  // Info grid
  document.getElementById('info-medical-name').textContent = obj.medical_name;
  document.getElementById('info-icd').textContent = obj.icd_code;
  document.getElementById('info-conf').textContent = `${(obj.confidence * 100).toFixed(1)}%`;
  document.getElementById('info-diam').textContent = `${abcd.diameter_mm} mm`;

  // Action
  document.getElementById('action-text').textContent = obj.action?.immediate || '—';

  // SPF advice
  document.getElementById('spf-text').textContent = obj.spf_advice || '—';

  // Warning signs
  const wl = document.getElementById('warning-list');
  wl.innerHTML = (obj.warning_signs || []).map(w => `<li>${w}</li>`).join('');
}

function setMeter(key, ratio, label) {
  const fill = document.getElementById(`meter-${key}`);
  const val  = document.getElementById(`val-${key}`);
  if (!fill || !val) return;

  const pct = Math.min(Math.max(ratio * 100, 0), 100);
  fill.style.width = `${pct}%`;

  // Color gradient
  if (pct > 66)      fill.style.background = 'linear-gradient(90deg,#e67e22,#e74c3c)';
  else if (pct > 33) fill.style.background = 'linear-gradient(90deg,#f1c40f,#e67e22)';
  else               fill.style.background = 'linear-gradient(90deg,#2ecc71,#3498db)';

  val.textContent = label;
}

function animateGauge(score) {
  const arc = document.getElementById('gauge-arc');
  const txt = document.getElementById('gauge-score');
  const lbl = document.getElementById('gauge-label');
  if (!arc || !txt) return;

  const total = 251; // circumference of the half-arc path
  const offset = total - (score / 100) * total;

  arc.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
  arc.style.strokeDashoffset = offset;

  // Animate counter
  let current = 0;
  const step = score / 60;
  const timer = setInterval(() => {
    current = Math.min(current + step, score);
    txt.textContent = Math.round(current);
    if (current >= score) clearInterval(timer);
  }, 16);

  lbl.textContent = 'Risk Score / 100';
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────
function updateDashboardStats(obj) {
  state.stats.total++;
  if (obj.risk_level === 'Critical') state.stats.critical++;
  else if (obj.risk_level === 'High') state.stats.high++;
  else if (['Benign', 'Low'].includes(obj.risk_level)) state.stats.benign++;

  ['total','critical','high','benign'].forEach(k => {
    ['sb-', 'd-'].forEach(prefix => {
      const el = document.getElementById(`${prefix}${k}`);
      if (el) el.textContent = state.stats[k];
    });
  });
}

// ─── History ──────────────────────────────────────────────────────────────
function addToHistory() {
  if (!state.currentResult) { showToast('No result to save'); return; }
  const obj = state.currentResult;
  const entry = {
    id: state.history.length + 1,
    label: obj.label,
    risk_level: obj.risk_level,
    risk_score: obj.risk_score,
    confidence: `${(obj.confidence * 100).toFixed(1)}%`,
    diameter: `${obj.abcd.diameter_mm} mm`,
    time: new Date().toLocaleTimeString(),
    filename: state.currentFilename,
  };
  state.history.unshift(entry);
  renderHistory();
  showToast('Saved to history');
}

function renderHistory() {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  if (!state.history.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No scans recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = state.history.map(e => `
    <tr>
      <td>${e.id}</td>
      <td>${e.label}</td>
      <td><span class="sample-risk risk-${e.risk_level}">${e.risk_level}</span></td>
      <td>${e.risk_score}/100</td>
      <td>${e.confidence}</td>
      <td>${e.diameter}</td>
      <td>${e.time}</td>
      <td><button class="btn btn-sm btn-outline" onclick="viewHistoryEntry(${e.id-1})">View</button></td>
    </tr>
  `).join('');
}

function clearHistory() {
  if (!confirm('Clear all scan history?')) return;
  state.history = [];
  renderHistory();
  showToast('History cleared');
}

function viewHistoryEntry(idx) {
  const entry = state.history[idx];
  if (!entry) return;
  switchView('scanner', document.getElementById('nav-scanner'));
  showToast(`Viewing: ${entry.label}`);
}

function exportCSV() {
  if (!state.history.length) { showToast('No history to export'); return; }
  const header = 'ID,Label,Risk Level,Risk Score,Confidence,Diameter,Time\n';
  const rows = state.history.map(e =>
    `${e.id},"${e.label}","${e.risk_level}",${e.risk_score},"${e.confidence}","${e.diameter}","${e.time}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dermai_scan_history_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported');
}

function exportReport() {
  if (!state.currentResult) { showToast('No result to export'); return; }
  const obj = state.currentResult;
  const report = `DERMAI SKIN LESION REPORT
===========================
Date/Time   : ${new Date().toLocaleString()}
File        : ${state.currentFilename || 'Unknown'}

CLASSIFICATION
--------------
Label       : ${obj.label}
Medical Name: ${obj.medical_name}
ICD-10 Code : ${obj.icd_code}
Confidence  : ${(obj.confidence * 100).toFixed(1)}%
Risk Level  : ${obj.risk_level}
Risk Score  : ${obj.risk_score}/100

ABCD CRITERIA
--------------
Asymmetry       : ${(obj.abcd.asymmetry * 100).toFixed(0)}%
Border Irregular: ${(obj.abcd.border * 100).toFixed(0)}%
Color Variance  : ${(obj.abcd.color_variance * 100).toFixed(0)}%
Diameter        : ${obj.abcd.diameter_mm} mm

CLINICAL URGENCY
-----------------
${obj.urgency}

RECOMMENDED ACTION
-------------------
${obj.action?.immediate || 'Consult a dermatologist.'}

SPF ADVICE
-----------
${obj.spf_advice}

WARNING SIGNS
--------------
${(obj.warning_signs || []).map(w => `• ${w}`).join('\n')}

DISCLAIMER: This report is generated by an AI educational tool.
Always consult a certified dermatologist for medical diagnosis.
`;

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dermai_report_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Report exported');
}

// ─── Lesion Catalog ───────────────────────────────────────────────────────
async function loadCatalog() {
  try {
    const catalog = await DermAPI.getLesionCatalog();
    renderCatalog(catalog);
  } catch {
    document.getElementById('catalog-grid').innerHTML =
      '<div class="catalog-loading">Could not load catalog (server offline).</div>';
  }
}

function renderCatalog(catalog) {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  grid.innerHTML = Object.entries(catalog).map(([key, c]) => `
    <div class="catalog-card">
      <div class="catalog-risk-bar" style="background:${c.color};opacity:0.7"></div>
      <div class="catalog-label">${c.name}</div>
      <div class="catalog-medical">${c.medical_name}</div>
      <span class="sample-risk risk-${c.risk_level}" style="margin-bottom:10px;display:inline-block">${c.risk_level} — Score ${c.risk_score}/100</span>
      <div class="catalog-desc">${c.description.substring(0, 180)}...</div>
      <div class="catalog-icd">ICD-10: ${c.icd_code} &nbsp;|&nbsp; ${c.prevalence}</div>
    </div>
  `).join('');
}
