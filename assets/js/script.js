// ══ REAL-TIME SYNC (Standard HTTP - No Cache) ═══════════════
const BUCKET_ID = "mn6xR6f8XzY9vP7u5nB2"; 
const BUCKET_URL = "https://kvdb.io/mn6xR6f8XzY9vP7u5nB2/"; 

// ══ API CORE ══
async function apiPut(key, val) {
  try {
    const res = await fetch(BUCKET_URL + key, {
      method: 'PUT', // PUT is more standard for updates
      body: typeof val === 'object' ? JSON.stringify(val) : String(val),
      headers: { 'Content-Type': 'text/plain' },
      cache: 'no-store'
    });
    return res.ok;
  } catch (e) { return false; }
}

async function apiGet(key) {
  try {
    const res = await fetch(BUCKET_URL + key + "?nocache=" + Date.now(), { 
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || text === "null" || text === "") return null;
    try { return JSON.parse(text); } catch { return text; }
  } catch (e) { return null; }
}

function updateSyncStatus(status, msg) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-text');
  if (!dot || !txt) return;
  if (status === 'online') {
    dot.className = 'status-dot online';
    txt.textContent = msg || "متصل";
  } else {
    dot.className = 'status-dot';
    txt.textContent = msg || "جاري الاتصال...";
  }
}

async function initSync() {
  updateSyncStatus('connecting');
  const ok = await apiPut('ping_test', Date.now());
  if (ok) updateSyncStatus('online', "جاهز للمزامنة");
}

// ══ DATA ══════════════════════════════════════════════════════
const SUPERVISOR_PIN = "youssef98";

const QUESTIONS = {
  "الديني": [
    { q: "ما هي السورة التي تُسمى 'قلب القرآن'؟", type: "mcq", opts: ["الواقعة", "يس", "البقرة", "الكهف"], ans: "يس", pts: 2 },
    { q: "ما اسم الصحابي الذي أذّن أول مرة في الإسلام؟", type: "open", ans: "بلال بن رباح", pts: 2 },
    { q: "كم عدد الأشهر الحُرم في الإسلام؟", type: "mcq", opts: ["3", "4", "5", "6"], ans: "4", pts: 2 }
  ],
  "السياسي": [
    { q: "ما هو نظام الحكم في المغرب؟", type: "mcq", opts: ["جمهورية", "ملكية دستورية", "ملكية برلمانية"], ans: "ملكية دستورية", pts: 2 },
    { q: "ما اسم أعلى هيئة تشريعية في المغرب؟", type: "mcq", opts: ["مجلس الوزراء", "البرلمان", "المحكمة الدستورية"], ans: "البرلمان", pts: 2 },
    { q: "من هو رئيس الحكومة المغربية الحالي؟", type: "open", ans: "عزيز أخنوش", pts: 2 }
  ],
  "الرياضي": [
    { q: "من هو العداء المغربي الذي فاز بذهبيتين في أولمبياد أثينا 2004؟", type: "open", ans: "هشام الكروج", pts: 2 },
    { q: "كم عدد لاعبي فريق كرة اليد في الملعب؟", type: "mcq", opts: ["5", "6", "7", "8"], ans: "7", pts: 2 },
    { q: "في أي مدينة أقيمت الألعاب الأولمبية الشتوية الأخيرة 2022؟", type: "mcq", opts: ["طوكيو", "بكين", "لندن", "باريس"], ans: "بكين", pts: 2 }
  ],
  "كرة القدم": [
    { q: "من هو المنتخب الفائز بكأس العالم 2022؟", type: "mcq", opts: ["فرنسا", "الأرجنتين", "البرازيل", "كرواتيا"], ans: "الأرجنتين", pts: 2 },
    { q: "ما هو الفريق الذي يلقب بـ 'النادي الملكي' في إسبانيا؟", type: "open", ans: "ريال مدريد", pts: 2 },
    { q: "من هو اللاعب الذي سجل هدف الفوز للمغرب ضد البرتغال في مونديال قطر؟", type: "mcq", opts: ["حكيم زياش", "سفيان بوفال", "يوسف النصيري", "أشرف حكيمي"], ans: "يوسف النصيري", pts: 2 }
  ],
  "الجغرافي": [
    { q: "ما أعلى قمة جبلية في القارة الأفريقية؟", type: "mcq", opts: ["كليمنجارو", "جبل كينيا", "رووينزوري", "جبل أطلس"], ans: "كليمنجارو", pts: 2 },
    { q: "ما اسم المضيق الفاصل بين المغرب وإسبانيا؟", type: "open", ans: "مضيق جبل طارق", pts: 1 },
    { q: "أي دولة تحتل أكبر مساحة في العالم؟", type: "mcq", opts: ["كندا", "الصين", "روسيا", "الولايات المتحدة"], ans: "روسيا", pts: 1 }
  ],
  "جماعة العدل والإحسان": [
    { q: "من هو مؤسس جماعة العدل والإحسان؟", type: "open", ans: "الشيخ عبد السلام ياسين", pts: 1 },
    { q: "ماهو تعريف جماعة العدل والإحسان؟", type: "mcq", opts: ["حزب سياسي", "جمعية خيرية", "مؤسسة تعليمية فكرية", "جماعة تربوية دعوية سياسية "], ans: "جماعة تربوية دعوية سياسية ", pts: 2 },
    { q: "ما عنوان الرسالة التي وجّهها الشيخ عبد السلام ياسين للملك الحسن الثاني سنة 1974؟", type: "open", ans: "الإسلام أو الطوفان", pts: 3 }
  ],
  "الطبيعة": [
    { q: "ما الغاز الأكثر وفرة في الغلاف الجوي للأرض؟", type: "mcq", opts: ["الأكسجين", "الأرغون", "النيتروجين", "ثاني أكسيد الكربون"], ans: "النيتروجين", pts: 1 },
    { q: "ما الظاهرة البصرية التي تُفسّر احمرار السماء عند الغروب؟", type: "open", ans: "تشتت رايلي للضوء (Rayleigh Scattering)", pts: 3 },
    { q: "كم تستغرق أشعة الشمس للوصول إلى كوكب الأرض؟", type: "mcq", opts: ["8 ثوانٍ", "8 دقائق", "8 ساعات", "8 أيام"], ans: "8 دقائق", pts: 2 }
  ],
  "الحيوانات": [
    { q: "أي حيوان يمكنه البقاء طوال حياته دون أن يشرب الماء مباشرة؟", type: "mcq", opts: ["الجمل", "الكنغر", "فأر الكنغر الكبير", "ابن آوى"], ans: "فأر الكنغر الكبير", pts: 3 },
    { q: "كم قلباً يملك الأخطبوط؟", type: "mcq", opts: ["1", "2", "3", "4"], ans: "3", pts: 2 },
    { q: "ما الحيوان الوحيد الذي لديه بصمة يد مطابقة للإنسان؟", type: "mcq", opts: ["الشمبانزي", "الغوريلا", "كوالا", "الأورانغوتان"], ans: "كوالا", pts: 3 }
  ],
  "أمثال شعبية مغربية": [
    { q: "أكمل المثل الشعبي: 'دير النية...'", type: "open", ans: "وبات مع الحية", pts: 2 },
    { q: "أكمل المثل: 'اللي دارها بيديه...'", type: "open", ans: "يفكها بسنيه", pts: 2 },
    { q: "أكمل الحكمة: 'الوقت كالسيف...'", type: "open", ans: "إن لم تقطعه قطعك", pts: 2 }
  ],
  "التاريخي": [
    { q: "في أي سنة استقل المغرب عن الحماية الفرنسية؟", type: "mcq", opts: ["1954", "1956", "1958", "1960"], ans: "1956", pts: 1 },
    { q: "من قاد الجيوش الإسلامية في معركة اليرموك الفاصلة؟", type: "mcq", opts: ["أبو عبيدة بن الجراح", "عمرو بن العاص", "خالد بن الوليد", "سعد بن أبي وقاص"], ans: "خالد بن الوليد", pts: 2 },
    { q: "ما الحدث التاريخي الذي أطلق عليه المؤرخون اسم 'نهاية العصور الوسطى' في أوروبا؟", type: "mcq", opts: ["سقوط القسطنطينية سنة 1453", "اكتشاف أمريكا سنة 1492", "بداية الإصلاح الديني سنة 1517", "نهاية حرب المئة عام سنة 1453"], ans: "سقوط القسطنطينية سنة 1453م", pts: 3 }
  ],
  "ثقافة عامة": [
    { q: "كم عدد ألوان الطيف المرئي للضوء؟", type: "mcq", opts: ["5", "6", "7", "8"], ans: "7", pts: 1 },
    { q: "من يُنسب إليه اختراع التلفزيون؟", type: "mcq", opts: ["توماس إديسون", "جون لوجي بيرد", "ماركوني", "نيكولا تسلا"], ans: "جون لوجي بيرد", pts: 2 },
    { q: "كم عدد مربعات رقعة الشطرنج؟", type: "mcq", opts: ["32", "48", "64", "81"], ans: "64", pts: 1 }
  ],
  "اقتصادي": [
    { q: "ما العملة الرسمية للاتحاد الأوروبي؟", type: "open", ans: "اليورو", pts: 1 },
    { q: "ما أكبر بورصة مالية في العالم من حيث الرسملة السوقية؟", type: "mcq", opts: ["بورصة لندن", "بورصة طوكيو", "بورصة نيويورك", "بورصة هونغ كونغ"], ans: "بورصة نيويورك", pts: 2 },
    { q: "3.	التضخم يعني:", type: "mcq", opts: ["انخفاض الأسعار", "ارتفاع الأسعار", "ثبات الأسعار", "زيادة الإنتاج"], ans: "ارتفاع الأسعار", pts: 3 }
  ],
  "الأدب": [
    { q: "من كتب كتاب 'كليلة ودمنة'؟", type: "mcq", opts: ["ابن المقفع", "المتنبي", "الفارابي", "إدريس الشرايبي"], ans: "ابن المقفع", pts: 2 },
    { q: "في أي عام حصل نجيب محفوظ على جائزة نوبل في الأدب؟", type: "mcq", opts: ["1984", "1986", "1988", "1990"], ans: "1988", pts: 2 },
    { q: "'ما هو جنس 'ألف ليلة وليلة", type: "mcq", opts: ["رواية حديثة", "شعر", "قصص شعبية", "مسرحية"], ans: "قصص شعبية", pts: 1 }
  ],
  "🎭 Mimes": [
    {
      q: "Mimes — كل ممثل يختار كلمة ويوصل معناها بالحركات فقط خلال 90 ثانية", type: "mimes",
      words: ["فيلسوف", "غسالة", "طائرة ورقية", "طبيب الأسنان", "صياد سمك", "ملاكم", "حلاق", "ممثل مسرحي", "لاعب شطرنج", "راكب دراجة"],
      ans: "(تقديرية)", pts: 2
    }
  ]
};

// ══ SHARED STATE ══
const shared = {
  questionActive: false,
  cat: null,
  qIndex: 0,
  qText: '',
  qType: '',
  opts: [],
  timerStart: null,
  duration: 30,
  answers: {}
};

// ══ APP STATE ══
const app = {
  role: null,
  teamNum: null,
  teams: {},
  currentCat: null,
  currentQIdx: 0,
  completedCats: [],
  supTimerInt: null,
  partTimerInt: null,
  syncInt: null,
  selectedOpt: null
};

// ══ UTILS ══
function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function $(id) { return document.getElementById(id); }

function supTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  $('stab-cat').classList.add('hidden');
  $('stab-scores').classList.add('hidden');
  $('stab-answers').classList.add('hidden');
  $('stab-' + name).classList.remove('hidden');
  if (name === 'scores') renderScores();
  if (name === 'answers') renderAnswers();
}

// ══ SUPERVISOR ══
function checkPin() {
  if ($('sup-pin').value === SUPERVISOR_PIN) {
    app.role = 'supervisor';
    goto('screen-supervisor');
    buildCatGrid();
    renderScores();
    startSupervisorSync();
  } else {
    $('sup-pin').style.borderColor = 'var(--red)';
    setTimeout(() => $('sup-pin').style.borderColor = '', 800);
  }
}

function startSupervisorSync() {
  clearInterval(app.syncInt);
  app.syncInt = setInterval(async () => {
    document.getElementById('sync-text').textContent = "تحديث الإجابات...";
    for (let i = 1; i <= 20; i++) {
      const ans = await apiGet('ans_' + i);
      if (ans && ans !== shared.answers[i]) {
        shared.answers[i] = ans;
        renderAnswers();
      }
    }
    document.getElementById('sync-text').textContent = "متصل";
  }, 3000);
}

function buildCatGrid() {
  const grid = $('cat-grid');
  grid.innerHTML = '';
  Object.keys(QUESTIONS).forEach(cat => {
    const done = app.completedCats.includes(cat);
    const active = app.currentCat === cat;
    const d = document.createElement('div');
    d.className = 'cat-item' + (done ? ' done' : '') + (active ? ' active-cat' : '');
    d.textContent = cat;
    if (!done) d.onclick = () => pickCat(cat);
    grid.appendChild(d);
  });
}

function pickCat(cat) {
  app.currentCat = cat;
  app.currentQIdx = 0;
  buildCatGrid();
  renderSupQuestion();
}

function renderSupQuestion() {
  const qs = QUESTIONS[app.currentCat];
  if (!qs || app.currentQIdx >= qs.length) return;
  const q = qs[app.currentQIdx];
  $('sup-q-card').style.display = 'block';
  $('sup-q-cat-badge').textContent = app.currentCat;
  $('sup-q-num-badge').textContent = 'سؤال ' + (app.currentQIdx + 1) + '/' + qs.length;
  $('sup-q-pts-badge').textContent = q.pts + ' نقطة';
  $('sup-q-text').textContent = q.q;
  $('sup-reveal-box').style.display = 'none';
  $('sup-reveal-text').textContent = q.ans;

  const optsDiv = $('sup-q-opts');
  optsDiv.innerHTML = '';
  if (q.type === 'mcq') {
    const g = document.createElement('div');
    g.className = 'opts-grid';
    q.opts.forEach(o => {
      const b = document.createElement('div');
      b.className = 'opt-btn';
      b.textContent = o;
      if (o === q.ans) b.style.borderColor = 'rgba(27,184,123,0.4)';
      g.appendChild(b);
    });
    optsDiv.appendChild(g);
  } else if (q.type === 'mimes') {
    const g = document.createElement('div');
    g.className = 'mimes-grid';
    q.words.forEach(w => {
      const b = document.createElement('div');
      b.className = 'mimes-word';
      b.textContent = w;
      g.appendChild(b);
    });
    optsDiv.appendChild(g);
  }

  $('btn-launch').textContent = '▶ إطلاق السؤال';
  $('btn-launch').disabled = false;
  clearInterval(app.supTimerInt);
  $('sup-status-badge').textContent = 'سؤال محدد';
  $('sup-status-badge').className = 'badge badge-gold';
}

async function launchQuestion() {
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  const dur = q.type === 'mimes' ? 90 : 30;
  const now = Date.now();

  shared.answers = {};
  for (let i = 1; i <= 20; i++) apiPut('ans_' + i, "");

  const ok = await apiPut('state', {
    active: true,
    cat: app.currentCat,
    qIdx: app.currentQIdx,
    qText: q.q,
    qType: q.type,
    opts: q.opts || (q.type === 'mimes' ? q.words : []),
    tStart: now,
    dur: dur,
    _v: now
  });

  if (!ok) { alert("خطأ في إرسال السؤال للشبكة!"); return; }

  $('sup-status-badge').textContent = '⏱ يعمل';
  $('sup-status-badge').className = 'badge badge-teal';

  let rem = dur;
  clearInterval(app.supTimerInt);
  $('btn-launch').disabled = true;

  app.supTimerInt = setInterval(() => {
    rem--;
    $('btn-launch').textContent = '⏱ ' + rem + ' ثانية';
    if (rem <= 0) {
      clearInterval(app.supTimerInt);
      $('btn-launch').textContent = '✓ انتهى الوقت';
      apiPut('state_active', "false");
      $('sup-status-badge').textContent = 'انتهى الوقت';
      $('sup-status-badge').className = 'badge badge-red';
      renderAnswers();
    }
  }, 1000);
}

function revealAns() {
  $('sup-reveal-box').style.display = 'block';
}

function nextQ() {
  const qs = QUESTIONS[app.currentCat];
  apiPut('state', { active: false, _v: Date.now() });
  clearInterval(app.supTimerInt);
  if (app.currentQIdx < qs.length - 1) {
    app.currentQIdx++;
    renderSupQuestion();
  } else {
    app.completedCats.push(app.currentCat);
    app.currentCat = null;
    $('sup-q-card').style.display = 'none';
    buildCatGrid();
    if (app.completedCats.length === Object.keys(QUESTIONS).length) {
      showFinalResults();
    }
  }
}

function renderScores() {
  const sorted = Object.entries(app.teams).sort((a, b) => b[1].score - a[1].score);
  const list = $('scores-list');
  list.innerHTML = '';
  if (!sorted.length) {
    list.innerHTML = '<p class="muted">لا فرق مسجلة بعد</p>';
    return;
  }
  sorted.forEach(([tn, data], i) => {
    const d = document.createElement('div');
    d.className = 'score-row';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
    d.innerHTML = `<span>${medal} ${data.name}</span><span class="score-pts">${data.score}</span>`;
    list.appendChild(d);
  });
}

function addManual() {
  const t = parseInt($('manual-team').value);
  const p = parseInt($('manual-pts').value) || 1;
  if (!t) return;
  ensureTeam(t);
  app.teams[t].score += p;
  renderScores();
}

function renderAnswers() {
  $('ans-q-label').textContent = app.currentCat ? (app.currentCat + ' - س' + (app.currentQIdx + 1)) : '-';
  const list = $('answers-list');
  const entries = Object.entries(shared.answers);
  if (!entries.length) { list.innerHTML = '<p class="muted">لا إجابات بعد</p>'; return; }
  const q = app.currentCat && QUESTIONS[app.currentCat] ? QUESTIONS[app.currentCat][app.currentQIdx] : null;
  list.innerHTML = '';
  entries.forEach(([tn, ans]) => {
    if (!ans || ans === "null" || ans === "") return;
    const correct = q && q.type === 'mcq' && ans === q.ans;
    const d = document.createElement('div');
    d.className = 'ans-row';
    d.innerHTML = `
      <strong>فريق ${tn}</strong>
      <span style="color:${correct ? 'var(--teal2)' : 'var(--text)'}; flex:1; text-align:center;">${ans}</span>
      <button class="btn btn-teal btn-sm" onclick="grantPts(${tn},${q ? q.pts : 1})">✓ صح +${q ? q.pts : 1}</button>
    `;
    list.appendChild(d);
  });
}

function grantPts(tn, pts) {
  ensureTeam(tn);
  app.teams[tn].score += pts;
  renderScores();
  renderAnswers();
}

function ensureTeam(tn) {
  if (!app.teams[tn]) app.teams[tn] = { score: 0, name: 'فريق ' + tn };
}

function showFinalResults() {
  const sorted = Object.entries(app.teams).sort((a, b) => b[1].score - a[1].score);
  const list = $('final-list');
  list.innerHTML = '';
  sorted.forEach(([tn, data], i) => {
    const d = document.createElement('div');
    d.className = 'result-item' + (i === 0 ? ' r1' : i === 1 ? ' r2' : i === 2 ? ' r3' : '');
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    d.innerHTML = `
      <span class="medal">${medal || (i + 1) + '.'}</span>
      <span class="result-name">${data.name}</span>
      <span class="result-score">${data.score}</span>
    `;
    list.appendChild(d);
  });
  goto('screen-results');
}

// ══ PARTICIPANT ══
function joinTeam() {
  const tn = parseInt($('part-team-in').value);
  if (!tn || tn < 1 || tn > 20) { alert('أدخل رقم فريق بين 1 و 20'); return; }
  app.teamNum = tn;
  app.role = 'participant';
  ensureTeam(tn);
  $('part-team-display').textContent = 'فريق ' + tn;
  $('part-login').classList.add('hidden');
  $('part-waiting').classList.remove('hidden');
  startParticipantSync();
}

let lastV = 0;
function startParticipantSync() {
  clearInterval(app.syncInt);
  app.syncInt = setInterval(async () => {
    document.getElementById('sync-text').textContent = "تحديث...";
    const data = await apiGet('state');
    if (data) {
      if (data.active && data._v !== lastV) {
        lastV = data._v;
        shared.questionActive = true;
        shared.cat = data.cat;
        shared.qIndex = data.qIdx;
        shared.qText = data.qText;
        shared.qType = data.qType;
        shared.opts = data.opts || [];
        shared.timerStart = data.tStart;
        shared.duration = data.dur;
        displayPartQuestion();
      } else if (!data.active) {
        shared.questionActive = false;
        $('part-q-view').classList.add('hidden');
        $('part-waiting').classList.remove('hidden');
      }
    }
    document.getElementById('sync-text').textContent = "متصل";
  }, 1500);
}

function displayPartQuestion() {
  $('part-waiting').classList.add('hidden');
  $('part-q-view').classList.remove('hidden');
  $('part-cat-badge').textContent = shared.cat;
  $('part-num-badge').textContent = 'سؤال ' + (shared.qIndex + 1);
  $('part-q-text').textContent = shared.qText;
  $('part-send-btn').classList.remove('hidden');
  $('part-sent-msg').classList.add('hidden');
  app.selectedOpt = null;

  const optsArea = $('part-opts-area');
  optsArea.innerHTML = '';
  const openArea = $('part-open-area');

  if (shared.qType === 'mcq') {
    openArea.classList.add('hidden');
    const g = document.createElement('div');
    g.className = 'opts-grid';
    shared.opts.forEach(o => {
      const b = document.createElement('button');
      b.className = 'opt-btn';
      b.textContent = o;
      b.onclick = () => {
        document.querySelectorAll('.opt-btn').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        app.selectedOpt = o;
      };
      g.appendChild(b);
    });
    optsArea.appendChild(g);
  } else if (shared.qType === 'mimes') {
    openArea.classList.add('hidden');
    const label = document.createElement('p');
    label.className = 'muted';
    label.style.marginBottom = '8px';
    label.textContent = 'اختر الكلمة التي ستمثلها:';
    optsArea.appendChild(label);
    const g = document.createElement('div');
    g.className = 'mimes-grid';
    shared.opts.forEach(w => {
      const b = document.createElement('div');
      b.className = 'mimes-word';
      b.textContent = w;
      b.onclick = () => {
        document.querySelectorAll('.mimes-word').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        app.selectedOpt = w;
      };
      g.appendChild(b);
    });
    optsArea.appendChild(g);
  } else {
    openArea.classList.remove('hidden');
    $('part-open-inp').value = '';
  }

  runPartTimer(shared.timerStart, shared.duration);
}

function runPartTimer(startMs, dur) {
  const circle = $('part-circle');
  const num = $('part-timer-num');
  const totalDash = 326.7;
  clearInterval(app.partTimerInt);

  app.partTimerInt = setInterval(() => {
    const elapsed = (Date.now() - startMs) / 1000;
    const rem = Math.max(0, dur - elapsed);
    const pct = rem / dur;
    circle.style.strokeDashoffset = totalDash * (1 - pct);
    num.textContent = Math.ceil(rem);
    circle.style.stroke = rem > 10 ? '#1bb87b' : '#e04040';
    if (rem <= 0) {
      clearInterval(app.partTimerInt);
      autoSend();
    }
  }, 200);
}

function autoSend() {
  if (!$('part-send-btn').classList.contains('hidden')) sendAnswer();
}

async function sendAnswer() {
  let ans = '';
  if (shared.qType === 'mcq' || shared.qType === 'mimes') {
    ans = app.selectedOpt || '(بدون إجابة)';
  } else {
    ans = $('part-open-inp').value.trim() || '(بدون إجابة)';
  }
  
  await apiPut('ans_' + app.teamNum, ans);

  $('part-send-btn').classList.add('hidden');
  $('part-sent-msg').classList.remove('hidden');
  clearInterval(app.partTimerInt);
}

function resetAll() {
  Object.assign(app, {
    role: null, teamNum: null, teams: {}, currentCat: null,
    currentQIdx: 0, completedCats: [], supTimerInt: null,
    partTimerInt: null, syncInt: null, selectedOpt: null
  });
  Object.assign(shared, {
    questionActive: false, cat: null, qIndex: 0, qText: '',
    qType: '', opts: [], timerStart: null, duration: 30, answers: {}
  });
  clearInterval(app.supTimerInt);
  clearInterval(app.partTimerInt);
  clearInterval(app.syncInt);
  apiPut('state', { active: false, _v: Date.now() });
  for (let i = 1; i <= 20; i++) apiPut('ans_' + i, "");
  $('sup-pin').value = '';
  goto('screen-role');
}

initSync();
