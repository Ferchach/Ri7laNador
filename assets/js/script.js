// ============================================================================
// MUSABAKA THAQAFIYA - V9 DUAL-CHANNEL ARCHITECTURE
// ============================================================================

const TOPIC_STATE = "https://ntfy.envs.net/musabaka_v9_state_";
const TOPIC_ANSWERS = "https://ntfy.envs.net/musabaka_v9_answers_";
const TOPIC_EVALS = "https://ntfy.envs.net/musabaka_v9_evals_";
let ROOM_CODE = localStorage.getItem('musabaka_room_code') || "";

// Hashed Pins
const SUPERVISOR_HASH = "ed7c13affd83dd1be773bd1708e02569da39bee0369d4119372588f715fba8da"; // youssef98
const JURY_HASH = "d8e4bcb09b1a5a0dbdda2ad799697e0d7e211d6d0807a5f4ab2b6b49ae4cc92a"; // jury2026

async function hashPin(pin) {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ══ DATA ══
const QUESTIONS = {
  "الديني": [
    { q: "ما هي السورة التي تُسمى 'قلب القرآن'؟", type: "mcq", opts: ["الواقعة", "يس", "البقرة", "الكهف"], ans: "يس", pts: 2 },
    { q: "ما اسم الصحابي الذي أذّن أول مرة في الإسلام؟", type: "mcq", opts: ["أبو بكر الصديق", "طلحة بن الزبير", "بلال بن رباح", "عبد الرحمن بن عوف"], ans: "بلال بن رباح", pts: 2 },
    { q: "كم عدد الأشهر الحُرم في الإسلام؟", type: "mcq", opts: ["3", "4", "5", "6"], ans: "4", pts: 2 }
  ],
  "السياسي": [
    { q: "ما هو نظام الحكم في المغرب؟", type: "mcq", opts: ["جمهورية", "ملكية دستورية", "ملكية برلمانية"], ans: "ملكية دستورية", pts: 2 },
    { q: "ما اسم أعلى هيئة تشريعية في المغرب؟", type: "mcq", opts: ["مجلس الوزراء", "البرلمان", "المحكمة الدستورية"], ans: "البرلمان", pts: 2 },
    { q: "ما هي مدة ولاية مجالس الجماعات المحلية في المغرب؟", type: "mcq", opts: ["3", "4", "5", "6"], ans: "5", pts: 2 }
  ],
  "الرياضي": [
    { q: "من هو العداء المغربي الذي فاز بذهبيتين في أولمبياد أثينا 2004؟", type: "mcq", opts: ["سفيان البقالي", "سعيد عويطة", "رشيد البسطي", "هشام الكروج"], ans: "هشام الكروج", pts: 2 },
    { q: "كم عدد لاعبي فريق كرة اليد في الملعب؟", type: "mcq", opts: ["5", "6", "7", "8"], ans: "7", pts: 2 },
    { q: "في أي مدينة أقيمت الألعاب الأولمبية الشتوية الأخيرة 2022؟", type: "mcq", opts: ["طوكيو", "بكين", "لندن", "باريس"], ans: "بكين", pts: 2 }
  ],
  "كرة القدم": [
    { q: "من هو المنتخب الفائز بكأس العالم 2022؟", type: "mcq", opts: ["فرنسا", "الأرجنتين", "البرازيل", "كرواتيا"], ans: "الأرجنتين", pts: 2 },
    { q: "من هو فريق كرة القدم لذي خسر نهائيين لدوري أبطال أوروبا على التوالى سنة 2000 و 2001؟", type: "mcq", opts: ["فالنسيا", "يوفنتس", "مانشستر يونايتد", "بنفيكا"], ans: "فالنسيا", pts: 2 },
    { q: "من هو اللاعب الذي سجل هدف الفوز للمغرب ضد البرتغال في مونديال قطر؟", type: "mcq", opts: ["حكيم زياش", "سفيان بوفال", "يوسف النصيري", "أشرف حكيمي"], ans: "يوسف النصيري", pts: 2 }
  ],
  "الجغرافي": [
    { q: "ما أعلى قمة جبلية في القارة الأفريقية؟", type: "mcq", opts: ["كليمنجارو", "جبل كينيا", "رووينزوري", "جبل أطلس"], ans: "كليمنجارو", pts: 2 },
    { q: "ما اسم أطول نهر في العالم؟", type: "mcq", opts: ["نهر النيل", "نهر الأمازون", "نهر المسيسيبي", "نهر اليانغتسي"], ans: "نهر النيل", pts: 1 },
    { q: "أي دولة تحتل أكبر مساحة في العالم؟", type: "mcq", opts: ["كندا", "الصين", "روسيا", "الولايات المتحدة"], ans: "روسيا", pts: 1 }
  ],
  "جماعة العدل والإحسان": [
    { q: "من هو مؤسس جماعة العدل والإحسان؟", type: "open", ans: "الشيخ عبد السلام ياسين", pts: 1 },
    { q: "ماهو تعريف جماعة العدل والإحسان؟", type: "mcq", opts: ["حزب سياسي", "جمعية خيرية", "مؤسسة تعليمية فكرية", "جماعة تربوية دعوية سياسية "], ans: "جماعة تربوية دعوية سياسية ", pts: 2 },
    { q: "ما عنوان الرسالة التي وجّهها الشيخ عبد السلام ياسين للملك الحسن الثاني سنة 1974؟", type: "mcq", opts: ["لمن يهمه الأمر", "الإسلام أو الطوفان", "رسالة تذكير", "الثمن"], ans: "الإسلام أو الطوفان", pts: 3 }
  ],
  "الطبيعة": [
    { q: "ما الغاز الأكثر وفرة في الغلاف الجوي للأرض؟", type: "mcq", opts: ["الأكسجين", "الأرغون", "النيتروجين", "ثاني أكسيد الكربون"], ans: "النيتروجين", pts: 1 },
    { q: "ما الظاهرة البصرية التي تُفسّر احمرار السماء عند الغروب؟", type: "mcq", opts: ["تشتت رايلي للضوء (Rayleigh Scattering)", "تشتت ميك للضوء (Mie Scattering)", "الانعكاس الكلي الداخلي", "الانكسار"], ans: "تشتت رايلي للضوء (Rayleigh Scattering)", pts: 3 },
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
    { q: "ما الحدث التاريخي الذي أطلق عليه المؤرخون اسم 'نهاية العصور الوسطى' في أوروبا؟", type: "mcq", opts: ["سقوط القسطنطينية سنة 1453م", "اكتشاف أمريكا سنة 1492", "بداية الإصلاح الديني سنة 1517", "نهاية حرب المئة عام سنة 1453"], ans: "سقوط القسطنطينية سنة 1453م", pts: 3 }
  ],
  "ثقافة عامة": [
    { q: "كم عدد ألوان الطيف المرئي للضوء؟", type: "mcq", opts: ["5", "6", "7", "8"], ans: "7", pts: 1 },
    { q: "من يُنسب إليه اختراع التلفزيون؟", type: "mcq", opts: ["توماس إديسون", "جون لوجي بيرد", "ماركوني", "نيكولا تسلا"], ans: "جون لوجي بيرد", pts: 2 },
    { q: "كم عدد مربعات رقعة الشطرنج؟", type: "mcq", opts: ["32", "48", "64", "81"], ans: "64", pts: 1 }
  ],
  "اقتصادي": [
    { q: "ما العملة الرسمية لدولة الصين؟", type: "mcq", opts: ["الدولار", "الدينار", "الين", "اليوان"], ans: "اليوان", pts: 1 },
    { q: "ما أكبر بورصة مالية في العالم من حيث الرسملة السوقية؟", type: "mcq", opts: ["بورصة لندن", "بورصة طوكيو", "بورصة نيويورك", "بورصة هونغ كونغ"], ans: "بورصة نيويورك", pts: 2 },
    { q: "التضخم يعني:", type: "mcq", opts: ["انخفاض الأسعار", "ارتفاع الأسعار", "ثبات الأسعار", "زيادة الإنتاج"], ans: "ارتفاع الأسعار", pts: 3 }
  ],
  "الأدب": [
    { q: "من كتب كتاب 'كليلة ودمنة'؟", type: "mcq", opts: ["ابن المقفع", "المتنبي", "الفارابي", "إدريس الشرايبي"], ans: "ابن المقفع", pts: 2 },
    { q: "في أي عام حصل نجيب محفوظ على جائزة نوبل في الأدب؟", type: "mcq", opts: ["1984", "1986", "1988", "1990"], ans: "1988", pts: 2 },
    { q: "ما هو جنس 'ألف ليلة وليلة'؟", type: "mcq", opts: ["رواية حديثة", "شعر", "قصص شعبية", "مسرحية"], ans: "قصص شعبية", pts: 1 }
  ],
  "🎭 Mimes": [
    {
      q: "Mimes — كل ممثل يختار كلمة ويوصل معناها بالحركات فقط خلال 90 ثانية", type: "mimes",
      words: ["فيلسوف", "صبورة", "ممثل", "طبيب الأسنان", "صياد سمك", "حلبة ملاكمة", "حلاق", "تلفاز", "سرير", "كتاب", "حاسوب", "أستاذ", "قاضي", "قبطان", "سباح"],
      ans: "(تقديرية)", pts: 3
    }
  ]
};

// ══ STATE ══
const app = {
  role: null, teamNum: null, teams: {}, currentCat: null, currentQIdx: 0,
  completedCats: [], gameLog: JSON.parse(localStorage.getItem('musabaka_log') || "[]"),
  answeredQs: JSON.parse(localStorage.getItem('answered_qs') || "[]"),
  supTimerInt: null, eventSourceState: null, eventSourceAnswers: null, selectedOpt: null, isRunning: false,
  mimeWord: null, activeQuestion: null, lastQKey: null, isTimerRunning: false
};
const shared = { answers: {} };

// ══ UX FX ══
function playGong() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 1);
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1);
  } catch (e) { }
}

function vibrateDevice() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

// ══ UI UTILS ══
function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}
function $(id) { return document.getElementById(id); }

function showToast(msg, isError = false) {
  let t = document.getElementById('musabaka-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'musabaka-toast';
    t.style.position = 'fixed'; t.style.bottom = '20px'; t.style.left = '50%';
    t.style.transform = 'translateX(-50%)'; t.style.padding = '12px 24px';
    t.style.borderRadius = '8px'; t.style.color = 'white'; t.style.fontWeight = 'bold';
    t.style.zIndex = '9999'; t.style.transition = 'opacity 0.3s'; t.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
    document.body.appendChild(t);
  }
  t.style.background = isError ? '#e74c3c' : '#2ecc71';
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 3000);
}

function updateSyncStatus(status, msg) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-text');
  if (dot) dot.className = status === 'online' ? 'status-dot online' : 'status-dot';
  if (txt) txt.textContent = msg;
}

// ══ CORE SYNC ENGINE (DUAL CHANNEL) ══
function b64Encode(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
function b64Decode(str) { return JSON.parse(decodeURIComponent(escape(atob(str)))); }

async function saveRoomState() {
  if (!ROOM_CODE || app.role !== 'supervisor') return;
  const state = {
    teams: app.teams, completedCats: app.completedCats, currentCat: app.currentCat,
    currentQIdx: app.currentQIdx, activeAnswers: shared.answers, activeQuestion: app.activeQuestion,
    lastQ: app.lastFinishedQuestion || null, lastAns: app.lastFinishedAnswers || null,
    gameEnded: app.gameEnded || false,
    finalLogs: app.gameEnded ? app.gameLog : null,
    ts: Date.now()
  };
  try {
    const payload = b64Encode(state);
    const res = await fetch(TOPIC_STATE + ROOM_CODE, { method: 'POST', body: payload });
    if (!res.ok) throw new Error("HTTP " + res.status);
    showToast("✅ تم حفظ وإرسال البيانات");
  } catch (e) {
    showToast("❌ خطأ في الإرسال: تأكد من الإنترنت", true);
  }
}

let debounceSaveTimer = null;
function requestSaveRoomState() {
  if (debounceSaveTimer) clearTimeout(debounceSaveTimer);
  debounceSaveTimer = setTimeout(() => {
    saveRoomState();
  }, 2000); // 2000ms debounce - longer delay to batch multiple team answers and avoid Rate Limits (HTTP 429)
}

let reconnectTimer = null;
let retryCount = 0;

function startSyncListener() {
  if (app.eventSourceState) app.eventSourceState.close();
  if (app.eventSourceAnswers) app.eventSourceAnswers.close();
  if (app.eventSourceEvals) app.eventSourceEvals.close();

  // TOUT LE MONDE écoute le STATE
  app.eventSourceState = new EventSource(TOPIC_STATE + ROOM_CODE + "/sse");
  app.eventSourceState.onopen = () => { updateSyncStatus('online', "متصل ✅"); retryCount = 0; };
  app.eventSourceState.onmessage = (e) => {
    try {
      const envelope = JSON.parse(e.data);
      if (envelope.message) applyState(b64Decode(envelope.message));
    } catch (err) { }
  };
  app.eventSourceState.onerror = () => {
    updateSyncStatus('offline', "جاري الاتصال...");
    app.eventSourceState.close();
    scheduleReconnect();
  };

  // SUPERVISEUR écoute les ANSWERS et EVALS
  if (app.role === 'supervisor') {
    app.eventSourceAnswers = new EventSource(TOPIC_ANSWERS + ROOM_CODE + "/sse");
    app.eventSourceAnswers.onmessage = (e) => {
      try {
        const envelope = JSON.parse(e.data);
        if (envelope.message) {
          const ansData = b64Decode(envelope.message);
          if (app.activeQuestion && ansData.qKey === app.activeQuestion.qKey) {
            shared.answers[ansData.teamNum] = ansData.ans;
            if (!app.teams[ansData.teamNum]) app.teams[ansData.teamNum] = { score: 0, name: 'فريق ' + ansData.teamNum };
            requestSaveRoomState();
            renderAnswers();
          }
        }
      } catch (err) { }
    };

    app.eventSourceEvals = new EventSource(TOPIC_EVALS + ROOM_CODE + "/sse");
    app.eventSourceEvals.onmessage = (e) => {
      try {
        const envelope = JSON.parse(e.data);
        if (envelope.message) {
          const evalData = b64Decode(envelope.message);
          let evals = JSON.parse(localStorage.getItem('musabaka_evals') || "[]");
          evals.push(evalData);
          localStorage.setItem('musabaka_evals', JSON.stringify(evals));
          showToast(`تم تلقي تقييم من فريق ${evalData.team}`);
        }
      } catch (err) { }
    };
  }

  // JURY écoute aussi les ANSWERS directement (sans passer par le superviseur)
  if (app.role === 'jury') {
    app.juryLocalAnswers = app.juryLocalAnswers || {};
    app.juryLocalAnswersKey = null;
    app.eventSourceAnswers = new EventSource(TOPIC_ANSWERS + ROOM_CODE + "/sse");
    app.eventSourceAnswers.onmessage = (e) => {
      try {
        const envelope = JSON.parse(e.data);
        if (envelope.message) {
          const ansData = b64Decode(envelope.message);
          const activeQ = app.activeQuestion || app.lastFinishedQuestion;
          if (activeQ) {
            if (app.juryLocalAnswersKey !== activeQ.qKey) {
              app.juryLocalAnswers = {};
              app.juryLocalAnswersKey = activeQ.qKey;
            }
            app.juryLocalAnswers[ansData.teamNum] = ansData.ans;
            syncJuryState();
          }
        }
      } catch (err) { }
    };
  }
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
  retryCount++;
  reconnectTimer = setTimeout(startSyncListener, delay);
}

async function forceSync() {
  if (!ROOM_CODE) return;
  try {
    const res = await fetch(TOPIC_STATE + ROOM_CODE + "/json?poll=1");
    const text = await res.text();
    if (text) {
      const lines = text.trim().split('\n');
      const lastMsg = JSON.parse(lines[lines.length - 1]);
      applyState(b64Decode(lastMsg.message));
    }
  } catch (e) { }
}

function applyState(data) {
  if (!data) return;

  // Détecter un Reset de la salle
  if (Object.keys(data.teams).length === 0 && Object.keys(app.teams).length > 0) {
    app.answeredQs = [];
    localStorage.removeItem('answered_qs');
  }

  app.teams = data.teams || {}; app.completedCats = data.completedCats || [];
  app.currentCat = data.currentCat || null; app.currentQIdx = data.currentQIdx || 0;
  shared.answers = data.activeAnswers || {}; app.activeQuestion = data.activeQuestion || null;

  app.lastFinishedQuestion = data.lastQ || null;
  app.lastFinishedAnswers = data.lastAns || null;
  if (data.finalLogs) app.gameLog = data.finalLogs;

  if (data.gameEnded && app.role !== 'supervisor') {
    goto('screen-results');
    renderFinalResultsUI();
    return;
  }

  if (app.role === 'participant') syncParticipantState();
  if (app.role === 'jury') syncJuryState();
  if (app.role === 'supervisor') renderScores();
}

// ══ SESSION MANAGEMENT ══
async function initRoom() {
  const code = $('room-code-in').value.trim().toUpperCase();
  if (!code) { alert("أدخل رمز الغرفة أولاً"); return; }
  ROOM_CODE = code; localStorage.setItem('musabaka_room_code', ROOM_CODE);

  startSyncListener();
  forceSync();
  goto('screen-role');
}

function exitRoom() {
  if (app.eventSourceState) app.eventSourceState.close();
  if (app.eventSourceAnswers) app.eventSourceAnswers.close();
  if (app.eventSourceEvals) app.eventSourceEvals.close();
  localStorage.clear(); location.reload();
}

// ══ SUPERVISOR ══
async function checkPin() {
  const hash = await hashPin($('sup-pin').value);
  if (hash === SUPERVISOR_HASH) {
    app.role = 'supervisor'; localStorage.setItem('musabaka_role', 'supervisor');
    goto('screen-supervisor');
    $('sup-room-id').textContent = ROOM_CODE;
    const savedUrl = localStorage.getItem('sheets_webhook');
    if (savedUrl) $('sheets-url').value = savedUrl;
    buildCatGrid(); renderScores();
    if (app.currentCat) renderSupQuestion();
    startSyncListener(); // Relance pour inclure la connexion Answers
  } else { showToast("الرمز خاطئ", true); }
}

function buildCatGrid() {
  const grid = $('cat-grid'); grid.innerHTML = '';
  Object.keys(QUESTIONS).forEach(cat => {
    const done = app.completedCats.includes(cat);
    const d = document.createElement('div');
    d.className = 'cat-item' + (done ? ' done' : '') + (app.currentCat === cat ? ' active-cat' : '');
    d.textContent = cat;
    d.onclick = () => pickCat(cat, done);
    grid.appendChild(d);
  });
}

function pickCat(cat, done) {
  if (app.isRunning) return;
  if (done && !confirm("هذا الصنف مكتمل. إعادة فتحه؟")) return;
  app.currentCat = cat; app.currentQIdx = 0;
  buildCatGrid(); renderSupQuestion(); saveRoomState();
}

function cancelPick() {
  if (app.isRunning) return;
  app.currentCat = null; app.currentQIdx = 0; app.activeQuestion = null;
  $('sup-q-card').style.display = 'none';
  buildCatGrid(); saveRoomState();
}

function renderSupQuestion() {
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  if (!q) return;
  $('sup-q-card').style.display = 'block';
  $('sup-q-text').textContent = q.q;
  $('sup-reveal-box').style.display = 'none';
  $('sup-reveal-text').textContent = q.ans;
  // Always fully reset launch button state for new/relaunched question
  const btnLaunch = $('btn-launch');
  btnLaunch.textContent = '▶ إطلاق السؤال';
  btnLaunch.disabled = false;
  btnLaunch.style.display = 'block';
  btnLaunch.onclick = launchQuestion;
  if ($('btn-relaunch')) $('btn-relaunch').style.display = 'none';
  // Re-enable navigation buttons
  const btnNext = document.getElementById('btn-next'); if (btnNext) btnNext.disabled = false;
  const btnCancel = document.getElementById('btn-cancel-pick'); if (btnCancel) { btnCancel.style.opacity = '1'; btnCancel.disabled = false; }
  $('sup-q-cat-badge').textContent = app.currentCat;
  $('sup-q-num-badge').textContent = 'سؤال ' + (app.currentQIdx + 1);
  $('sup-q-pts-badge').textContent = (q.pts || 1) + ' نقطة';

  const optsDiv = $('sup-q-opts'); optsDiv.innerHTML = '';
  if (app.currentCat === '🎭 Mimes') {
    optsDiv.innerHTML = `
      <div style="background:rgba(212,168,67,0.08); border:1px solid var(--gold); border-radius:10px; padding:15px; text-align:center;">
        <p class="muted" style="margin-bottom:10px; font-size:0.85rem;">تحديد عدد الفرق المشاركة في جولة الميمز</p>
        <div style="display:flex; gap:8px; justify-content:center; align-items:center; margin-bottom:10px;">
          <input type="number" id="mime-num-teams" min="1" max="20" value="${Object.keys(app.teams).length || 2}" style="width:70px; text-align:center; font-size:1.2rem; padding:8px;">
          <span class="muted">فريق</span>
        </div>
        <button class="btn btn-gold" onclick="startMimesRound()">🎭 بدء جولة الميمز</button>
      </div>`;
  } else if (q.type === 'mcq') {
    q.opts.forEach(o => {
      const b = document.createElement('div'); b.className = 'opt-btn'; b.textContent = o;
      if (o === q.ans) b.style.borderColor = 'var(--gold)';
      optsDiv.appendChild(b);
    });
  }
  const btnCancel2 = document.getElementById('btn-cancel-pick');
  if (btnCancel2) { btnCancel2.style.opacity = app.isRunning ? "0.3" : "1"; btnCancel2.disabled = !!app.isRunning; }
}

// ══ MIMES ROUND - TEAM BY TEAM ══
function startMimesRound() {
  const numTeams = parseInt($('mime-num-teams')?.value) || 2;
  if (numTeams < 1) { showToast('أدخل عددًا صحيحًا', true); return; }

  // Ensure all teams exist in app.teams
  for (let i = 1; i <= numTeams; i++) {
    if (!app.teams[i]) app.teams[i] = { score: 0, name: 'فريق ' + i };
  }

  app.mimeRound = {
    numTeams,
    currentTeamIdx: 0,      // 0-based index
    usedWords: [],
    results: {},
    pts: QUESTIONS['🎭 Mimes'][0].pts || 3
  };

  app.isRunning = true;
  if ($('btn-cancel-pick')) $('btn-cancel-pick').disabled = true;
  if ($('btn-next')) $('btn-next').disabled = true;
  if ($('btn-launch')) $('btn-launch').style.display = 'none';
  if ($('btn-relaunch')) $('btn-relaunch').style.display = 'none';

  mimePickWord();
}

function mimePickWord() {
  const round = app.mimeRound;
  const allWords = QUESTIONS['🎭 Mimes'][0].words;
  const available = allWords.filter(w => !round.usedWords.includes(w));

  if (available.length === 0) {
    showToast('تم استخدام جميع الكلمات! جاري إعادة القائمة', true);
    round.usedWords = []; // Reset and retry
  }

  const availableNow = allWords.filter(w => !round.usedWords.includes(w));
  const word = availableNow[Math.floor(Math.random() * availableNow.length)];
  round.usedWords.push(word);
  round.currentWord = word;

  const teamNum = round.currentTeamIdx + 1;
  const optsDiv = $('sup-q-opts');
  optsDiv.innerHTML = `
    <div style="background:rgba(212,168,67,0.08); border:1px solid var(--gold); border-radius:12px; padding:18px; text-align:center;">
      <p class="muted" style="font-size:0.8rem; margin-bottom:5px;">دور الفريق</p>
      <h2 class="gold" style="font-size:2rem; margin-bottom:5px;">فريق ${teamNum}</h2>
      <p class="muted" style="font-size:0.7rem; margin-bottom:12px;">الفريق ${teamNum} من ${round.numTeams}</p>
      <div style="background:rgba(20,184,166,0.1); border:1px dashed var(--teal); border-radius:8px; padding:10px; margin-bottom:15px;">
        <p class="muted" style="font-size:0.7rem;">الكلمة السرية</p>
        <p id="mime-word-display" style="font-size:1.8rem; font-weight:900; color:var(--teal);">${word}</p>
      </div>
      <button class="btn btn-teal" onclick="mimeLaunchTimer()" style="width:100%;">▶ إطلاق المؤقت (90ث)</button>
    </div>`;

  $('sup-status-badge').textContent = `دور فريق ${teamNum}`;
  $('sup-status-badge').className = 'badge badge-gold';
  $('sup-reveal-box').style.display = 'none';

  // Broadcast to jury/participants
  const now = Date.now();
  app.activeQuestion = {
    cat: '🎭 Mimes', qIdx: 0,
    qText: `🎭 ميمز — دور فريق ${teamNum} من ${round.numTeams}`,
    qType: 'mimes', opts: [], tStart: now, dur: 90,
    ans: '(تقديرية)', pts: round.pts, qKey: 'MIME_' + now
  };
  saveRoomState();
}

function mimeLaunchTimer() {
  const round = app.mimeRound;
  const teamNum = round.currentTeamIdx + 1;
  const optsDiv = $('sup-q-opts');

  optsDiv.innerHTML = `
    <div style="background:rgba(212,168,67,0.08); border:1px solid var(--gold); border-radius:12px; padding:18px; text-align:center;">
      <p class="muted" style="font-size:0.8rem;">فريق ${teamNum} — الكلمة: <strong class="teal" style="font-size:1.1rem;">${round.currentWord}</strong></p>
      <div id="mime-timer-display" style="font-size:3rem; font-weight:900; color:var(--teal); margin:15px 0;">90</div>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button class="btn btn-teal" onclick="mimeFound()" style="flex:2; font-size:1rem;">✅ وجدها! (+${round.pts})</button>
        <button class="btn btn-red" onclick="mimeNotFound()" style="flex:1; font-size:0.9rem;">✗ لم يجد (0)</button>
      </div>
    </div>`;

  let rem = 90;
  clearInterval(app.supTimerInt);
  app.supTimerInt = setInterval(() => {
    rem--;
    const el = $('mime-timer-display');
    if (el) {
      el.textContent = rem;
      el.style.color = rem <= 10 ? 'var(--red)' : 'var(--teal)';
    }
    if (rem <= 0) {
      clearInterval(app.supTimerInt);
      playGong();
      mimeNotFound();
    }
  }, 1000);

  $('sup-status-badge').textContent = `⏱ فريق ${teamNum}`;
  $('sup-status-badge').className = 'badge badge-teal';
}

function mimeFound() {
  clearInterval(app.supTimerInt);
  const round = app.mimeRound;
  const teamNum = round.currentTeamIdx + 1;
  app.teams[teamNum].score += round.pts;
  round.results[teamNum] = round.pts;
  showToast(`فريق ${teamNum}: أحسنت! +${round.pts} نقاط 🌟`);
  renderScores();
  mimeNextTeam();
}

function mimeNotFound() {
  clearInterval(app.supTimerInt);
  const round = app.mimeRound;
  const teamNum = round.currentTeamIdx + 1;
  round.results[teamNum] = 0;
  showToast(`فريق ${teamNum}: انتهى الوقت — 0 نقاط`, true);
  mimeNextTeam();
}

function mimeNextTeam() {
  const round = app.mimeRound;
  round.currentTeamIdx++;

  if (round.currentTeamIdx >= round.numTeams) {
    finishMimesRound();
  } else {
    // Small delay before showing next team
    setTimeout(() => mimePickWord(), 800);
  }
}

async function finishMimesRound() {
  app.isRunning = false;
  app.activeQuestion = null;
  clearInterval(app.supTimerInt);

  // Log the whole mime round
  const round = app.mimeRound;
  const logItem = {
    room: ROOM_CODE, cat: '🎭 Mimes',
    question: 'جولة الميمز',
    answer: JSON.stringify(round.usedWords),
    teamAnswers: round.results
  };
  app.gameLog.push(logItem);
  localStorage.setItem('musabaka_log', JSON.stringify(app.gameLog));
  app.mimeRound = null;

  // Re-enable nav buttons
  if ($('btn-cancel-pick')) $('btn-cancel-pick').disabled = false;
  if ($('btn-next')) $('btn-next').disabled = false;

  renderScores();
  await saveRoomState();

  $('sup-status-badge').textContent = 'جولة الميمز انتهت!';
  $('sup-status-badge').className = 'badge badge-teal';

  const optsDiv = $('sup-q-opts');
  optsDiv.innerHTML = `
    <div style="background:rgba(20,184,166,0.1); border:1px solid var(--teal); border-radius:10px; padding:15px; text-align:center;">
      <p style="font-size:1.2rem; font-weight:bold; color:var(--teal);">✅ انتهت جولة الميمز!</p>
      <div style="margin-top:10px;">
        ${Object.entries(round.results).map(([t, p]) =>
          `<div class="score-row"><span>فريق ${t}</span><span class="score-pts" style="color:${p > 0 ? 'var(--teal2)' : 'var(--red)'}">${p > 0 ? '+' + p : '0'}</span></div>`
        ).join('')}
      </div>
    </div>`;
  if ($('btn-launch')) { $('btn-launch').style.display = 'none'; }
  if ($('btn-relaunch')) $('btn-relaunch').style.display = 'block';
}

async function launchQuestion() {
  if (app.currentCat === '🎭 Mimes') return; // Mimes handled by startMimesRound
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  const dur = 30;
  const now = Date.now();
  shared.answers = {}; renderAnswers();

  app.isRunning = true;
  if ($('btn-cancel-pick')) $('btn-cancel-pick').disabled = true;

  app.activeQuestion = {
    cat: app.currentCat, qIdx: app.currentQIdx,
    qText: q.q, qType: q.type, opts: q.opts || [],
    tStart: now, dur: dur, ans: q.ans, pts: q.pts || 1, qKey: "Q_" + now
  };

  await saveRoomState();

  $('sup-status-badge').textContent = '⏱ يعمل';
  $('sup-status-badge').className = 'badge badge-teal';
  $('btn-launch').style.display = 'block';
  if ($('btn-relaunch')) $('btn-relaunch').style.display = 'none';

  const btnNext = document.getElementById('btn-next');
  if (btnNext) btnNext.disabled = true;

  $('btn-launch').disabled = false;
  $('btn-launch').onclick = forceFinish;

  let rem = dur; clearInterval(app.supTimerInt);
  app.supTimerInt = setInterval(() => {
    rem--; $('btn-launch').textContent = '⏹ إنهاء مبكر (' + rem + ' ث)';
    if (rem <= 0) { forceFinish(); }
  }, 1000);
}

function forceFinish() {
  if (app.mimeRound) return; // Mimes use their own timer
  if (app.isRunning && app.activeQuestion) {
    clearInterval(app.supTimerInt);
    const q = QUESTIONS[app.currentCat][app.currentQIdx];
    finishQuestionRound(q);
  }
}

async function finishQuestionRound(q) {
  app.isRunning = false; app.activeQuestion = null;
  $('btn-launch').style.display = 'none';
  $('btn-launch').onclick = launchQuestion; // Reset onclick
  if ($('btn-relaunch')) $('btn-relaunch').style.display = 'block';

  const btnNext = document.getElementById('btn-next');
  if (btnNext) btnNext.disabled = false;

  if (q.type === 'mcq') {
    Object.entries(shared.answers).forEach(([tn, ans]) => {
      if (ans === q.ans) {
        if (!app.teams[tn]) app.teams[tn] = { score: 0, name: 'فريق ' + tn };
        app.teams[tn].score += (q.pts || 1);
      }
    });
    renderScores(); renderAnswers();
  }

  app.lastFinishedQuestion = q;
  app.lastFinishedAnswers = { ...shared.answers };

  const logItem = {
    room: ROOM_CODE, cat: app.currentCat, question: q.q,
    answer: q.type === 'mimes' ? "Mime: " + app.mimeWord : q.ans,
    teamAnswers: { ...shared.answers }
  };
  app.gameLog.push(logItem);
  localStorage.setItem('musabaka_log', JSON.stringify(app.gameLog));

  await saveRoomState();

  $('sup-status-badge').textContent = 'انتهى الوقت';
  $('sup-status-badge').className = 'badge badge-red';

  const url = $('sheets-url').value;
  if (url) {
    localStorage.setItem('sheets_webhook', url);
    fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify(logItem) }).catch(e => { });
  }
}

function nextQ() {
  const qs = QUESTIONS[app.currentCat];
  const isLast = app.currentQIdx >= qs.length - 1;
  if (isLast && !confirm("هل تريد إنهاء هذا الصنف؟")) return;

  app.activeQuestion = null; app.isRunning = false; clearInterval(app.supTimerInt);

  if (!isLast) { app.currentQIdx++; renderSupQuestion(); }
  else {
    if (!app.completedCats.includes(app.currentCat)) app.completedCats.push(app.currentCat);
    app.currentCat = null; app.currentQIdx = 0;
    $('sup-q-card').style.display = 'none'; buildCatGrid();
  }
  saveRoomState();
}

function renderAnswers() {
  const list = $('answers-list'); list.innerHTML = '';
  const q = QUESTIONS[app.currentCat] ? QUESTIONS[app.currentCat][app.currentQIdx] : null;
  const pts = q ? (q.pts || 1) : 2;
  const isAuto = q && q.type === 'mcq';
  Object.entries(shared.answers).forEach(([tn, ans]) => {
    const d = document.createElement('div'); d.className = 'ans-row';
    let btnHTML = isAuto ? `<span class="muted" style="font-size:0.75rem;">(تصحيح تلقائي)</span>` : `<button class="btn btn-teal btn-sm" onclick="grantPts(${tn},${pts})">✓ +${pts}</button>`;
    d.innerHTML = `<strong>فريق ${tn}</strong> <span style="flex:1; text-align:center;">${ans}</span> ${btnHTML}`;
    list.appendChild(d);
  });
}

function renderScores() {
  const list = $('scores-list'); list.innerHTML = '';
  Object.entries(app.teams).sort((a, b) => b[1].score - a[1].score).forEach(([tn, d]) => {
    const row = document.createElement('div'); row.className = 'score-row';
    row.innerHTML = `<span>${d.name}</span><span class="score-pts">${d.score}</span>`;
    list.appendChild(row);
  });
}

function grantPts(tn, p) {
  if (!app.teams[tn]) app.teams[tn] = { score: 0, name: 'فريق ' + tn };
  app.teams[tn].score += p;
  renderScores(); renderAnswers(); saveRoomState();
}

function addManual() {
  const t = parseInt($('manual-team').value);
  const p = parseInt($('manual-pts').value) || 1;
  if (!t) return; grantPts(t, p);
}

function supTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  $('stab-cat').classList.add('hidden'); $('stab-scores').classList.add('hidden');
  $('stab-answers').classList.add('hidden'); $('stab-' + name).classList.remove('hidden');
}

function revealAns() { $('sup-reveal-box').style.display = 'block'; }

function showFinalResults() {
  app.gameEnded = true;
  saveRoomState();
  goto('screen-results');
  renderFinalResultsUI();
}

function renderFinalResultsUI() {
  const list = $('final-list'); list.innerHTML = '';
  Object.entries(app.teams).sort((a, b) => b[1].score - a[1].score).forEach(([tn, d], i) => {
    const row = document.createElement('div'); row.className = 'result-item';
    if (i === 0) row.classList.add('r1'); else if (i === 1) row.classList.add('r2'); else if (i === 2) row.classList.add('r3');
    row.innerHTML = `<span class="medal">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👏'}</span><span class="result-name">${d.name}</span><span class="result-score">${d.score}</span>`;
    list.appendChild(row);
  });

  const logCont = $('log-container');
  if (logCont && app.gameLog) {
    logCont.innerHTML = '';
    app.gameLog.forEach((log, idx) => {
      const qDiv = document.createElement('div');
      qDiv.style.marginBottom = '15px'; qDiv.style.padding = '10px';
      qDiv.style.background = 'rgba(255,255,255,0.05)'; qDiv.style.borderRadius = '8px';
      let html = `<strong class="teal" style="font-size:1.1rem;">سؤال ${idx + 1} (${log.cat}):</strong> <span style="font-size:1.1rem;">${log.question}</span><br>`;
      html += `<span class="gold" style="font-size:0.85rem">الجواب الصحيح: ${log.answer}</span><div style="margin-top:8px; font-size:0.9rem">`;
      Object.entries(log.teamAnswers || {}).forEach(([tn, ans]) => {
        let isCorrect = (log.answer === ans);
        let color = isCorrect ? 'var(--teal2)' : 'var(--text2)';
        html += `<div style="color:${color}; margin-bottom:3px;">فريق ${tn}: ${ans}</div>`;
      });
      html += `</div>`;
      qDiv.innerHTML = html;
      logCont.appendChild(qDiv);
    });
  }
}

async function confirmReset() {
  if (confirm("هل تريد حذف هذه الغرفة نهائياً؟ سيتم طرد جميع المشاركين.")) {
    app.teams = {}; app.completedCats = []; app.gameLog = [];
    app.currentCat = null; app.currentQIdx = 0; app.activeQuestion = null;
    shared.answers = {};
    await saveRoomState(); // Force reset state over network BEFORE reloading
    localStorage.clear(); location.reload();
  }
}

function exportToSheets() {
  if (!app.gameLog || app.gameLog.length === 0) {
    showToast("لا توجد بيانات لتصديرها", true);
    return;
  }
  let csv = "Room;Category;Question;Answer;Team Answers...\n";
  app.gameLog.forEach(log => {
    let row = `"${log.room || ''}";"${log.cat || ''}";"${(log.question || '').replace(/"/g, '""')}";"${(log.answer || '').replace(/"/g, '""')}"`;
    Object.entries(log.teamAnswers || {}).forEach(([tn, ans]) => {
      row += `;"Team ${tn}: ${(ans || '').replace(/"/g, '""')}"`;
    });
    csv += row + "\n";
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `musabaka_export_${ROOM_CODE}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast("تم تحميل الملف بنجاح ✅");
}

// ══ JURY ══
async function checkJuryPin() {
  const hash = await hashPin($('jury-pin').value);
  if (hash === JURY_HASH) {
    app.role = 'jury'; localStorage.setItem('musabaka_role', 'jury');
    goto('screen-jury'); syncJuryState();
  } else { showToast("الرمز خاطئ", true); }
}

function syncJuryState() {
  if (app.role !== 'jury') return;
  const q = app.activeQuestion || app.lastFinishedQuestion;
  // Merge state-relayed answers with jury's directly-received answers
  const stateAns = app.activeQuestion ? shared.answers : (app.lastFinishedAnswers || {});
  const directAns = (app.juryLocalAnswers && app.juryLocalAnswersKey === (q && q.qKey)) ? app.juryLocalAnswers : {};
  const ansObj = { ...stateAns, ...directAns };

  if (q) {
    $('jury-q-card').classList.remove('hidden');
    $('jury-cat').textContent = q.cat; $('jury-pts').textContent = (q.pts || 1) + " نقطة";
    $('jury-q-text').textContent = q.qText || q.q; $('jury-ans').textContent = q.ans;
    if (app.activeQuestion) {
      const rem = Math.max(0, Math.ceil(q.dur - (Date.now() - q.tStart) / 1000));
      $('jury-timer-box').textContent = "⏱ " + rem + " ثانية";
    } else {
      $('jury-timer-box').textContent = "انتهى الوقت";
    }
  } else { $('jury-q-card').classList.add('hidden'); }

  const jAnsList = $('jury-answers-list'); jAnsList.innerHTML = '';
  Object.entries(ansObj).forEach(([tn, ans]) => {
    const d = document.createElement('div'); d.className = 'ans-row';
    let colorStyle = '';
    if (q && q.type !== 'mimes') {
      if (q.type === 'mcq') {
        colorStyle = (ans === q.ans) ? 'color: var(--teal2); font-weight:bold;' : 'color: var(--red); text-decoration: line-through;';
      } else {
        colorStyle = (ans === q.ans) ? 'color: var(--teal2); font-weight:bold;' : 'color: var(--gold);';
      }
    }
    d.innerHTML = `<strong>فريق ${tn}:</strong> <span style="${colorStyle}">${ans}</span>`;
    jAnsList.appendChild(d);
  });

  const jScoreList = $('jury-scores-list'); jScoreList.innerHTML = '';
  const teamEntries = Object.entries(app.teams);
  if (teamEntries.length === 0) {
    jScoreList.innerHTML = '<p class="muted">لا توجد نقاط بعد</p>';
  } else {
    teamEntries.sort((a, b) => b[1].score - a[1].score).forEach(([tn, d]) => {
      const row = document.createElement('div'); row.className = 'score-row';
      row.innerHTML = `<span>${d.name}</span><span class="score-pts">${d.score}</span>`;
      jScoreList.appendChild(row);
    });
  }
}

// ══ PARTICIPANT ══
function joinTeam() {
  const tn = parseInt($('part-team-in').value);
  if (!tn || tn < 1 || tn > 20) { alert("أدخل رقم فريق صحيح"); return; }
  app.teamNum = tn; app.role = 'participant';
  localStorage.setItem('musabaka_role', 'participant');
  localStorage.setItem('musabaka_team_num', tn);
  $('part-team-display').textContent = 'فريق ' + tn;
  goto('screen-participant');
  forceSync();
}

function syncParticipantState() {
  if (app.role !== 'participant') return;
  const waitingDiv = $('part-waiting'); const qViewDiv = $('part-q-view');

  if (app.activeQuestion) {
    if (app.activeQuestion.qKey !== app.lastQKey) {
      app.lastQKey = app.activeQuestion.qKey;
      playGong(); vibrateDevice();
      handleIncomingQuestion(app.activeQuestion);
    }
  } else if (app.currentCat) {
    app.lastQKey = null; app.isTimerRunning = false;
    qViewDiv.classList.add('hidden'); waitingDiv.classList.remove('hidden');
    waitingDiv.innerHTML = `
      <div class="card" style="border-color: var(--teal); background: rgba(0, 212, 255, 0.05); text-align: center;">
        <h3 style='color:var(--teal)'>المشرف يجهز سؤالاً في صنف:</h3>
        <h2 style="color:var(--gold); font-size: 2rem; margin: 20px 0;">« ${app.currentCat} »</h2>
        <p>استعدوا... سيظهر السؤال قريباً</p>
      </div>`;
  } else {
    app.lastQKey = null; app.isTimerRunning = false;
    qViewDiv.classList.add('hidden'); waitingDiv.classList.remove('hidden');
    waitingDiv.innerHTML = `
      <div style="text-align: center;">
        <div class="waiting-anim"></div>
        <h3 style="margin-top:20px;">في انتظار المشرف...</h3>
        <p>سيظهر السؤال تلقائياً</p>
      </div>`;
  }
}

function handleIncomingQuestion(data) {
  const qRealKey = data.qKey; // Use dynamic qKey so that 'Relaunch' creates a fresh opportunity
  if (app.answeredQs.includes(qRealKey) && data.qType !== 'mimes') {
    goto('screen-participant');
    $('part-waiting').classList.add('hidden'); $('part-q-view').classList.remove('hidden');
    $('part-send-btn').classList.add('hidden'); $('part-sent-msg').classList.remove('hidden');
    $('part-q-text').textContent = "تمت الإجابة بالفعل على هذا السؤال."; $('part-opts-area').innerHTML = "";
    return;
  }
  goto('screen-participant');
  $('part-waiting').classList.add('hidden'); $('part-q-view').classList.remove('hidden');
  $('part-cat-badge').textContent = data.cat; $('part-num-badge').textContent = 'سؤال ' + (data.qIdx + 1);
  $('part-q-text').textContent = data.qText;

  if (data.qType === 'mimes') {
    $('part-send-btn').classList.add('hidden'); $('part-sent-msg').classList.add('hidden');
    $('part-opts-area').innerHTML = "<div class='card' style='background:rgba(255,255,255,0.05); color:var(--gold);'>المشرف سيقوم باختيار الكلمة وفريقكم سيعبر عنها...</div>";
  } else {
    $('part-send-btn').classList.remove('hidden'); $('part-sent-msg').classList.add('hidden');
    renderPartOpts(data);
  }
  runPartTimer(data.tStart, data.dur);
}

function renderPartOpts(data) {
  const area = $('part-opts-area'); area.innerHTML = ''; app.selectedOpt = null;
  if (data.qType === 'mcq') {
    data.opts.forEach(o => {
      const b = document.createElement('div'); b.className = 'opt-btn'; b.textContent = o;
      b.onclick = () => { document.querySelectorAll('.opts-grid .opt-btn').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); app.selectedOpt = o; };
      area.appendChild(b);
    });
  } else {
    area.innerHTML = '<input type="text" id="part-open-inp" class="input-field" placeholder="اكتب إجابتك هنا...">';
  }
}

function runPartTimer(startMs, dur) {
  const circle = document.getElementById('part-circle');
  const num = document.getElementById('part-timer-num');

  app.isTimerRunning = true;

  function updateTimer() {
    if (!app.isTimerRunning) return;

    const rem = Math.max(0, dur - (Date.now() - startMs) / 1000);
    if (circle) circle.style.strokeDashoffset = 326.7 * (1 - rem / dur);
    if (num) num.textContent = Math.ceil(rem);

    if (rem > 0) {
      requestAnimationFrame(updateTimer);
    } else {
      if (!$('part-send-btn').classList.contains('hidden')) sendAnswer("(انتهى الوقت)");
    }
  }

  requestAnimationFrame(updateTimer);
}

async function sendAnswer(ansParam) {
  const qRealKey = app.activeQuestion.qKey;
  let ans = ansParam || (app.selectedOpt || ($('part-open-inp') ? $('part-open-inp').value.trim() : null) || "(بدون إجابة)");

  if (!app.answeredQs.includes(qRealKey)) {
    app.answeredQs.push(qRealKey); localStorage.setItem('answered_qs', JSON.stringify(app.answeredQs));
  }

  $('part-send-btn').classList.add('hidden'); $('part-sent-msg').classList.remove('hidden');
  app.isTimerRunning = false;

  const ansData = { teamNum: app.teamNum, ans: ans, qKey: app.activeQuestion.qKey };
  try {
    const payload = b64Encode(ansData);
    await fetch(TOPIC_ANSWERS + ROOM_CODE, { method: 'POST', body: payload });
  } catch (e) { showToast("Erreur d'envoi", true); }
}

// ══ ON LOAD ══
window.onload = async () => {
  if (ROOM_CODE) {
    $('room-code-in').value = ROOM_CODE; await initRoom();
    const role = localStorage.getItem('musabaka_role');
    if (role === 'supervisor') checkPin();
    else if (role === 'participant') joinTeam();
    else if (role === 'jury') checkJuryPin();
  }
  if (localStorage.getItem('musabaka_has_evaluated')) {
    $('eval-form-card')?.classList.add('hidden');
    $('eval-success-card')?.classList.remove('hidden');
  }
  renderEvalQuestions();
};

// ══ VISIBILITY PENALTY: 0 points if participant leaves during question ══
document.addEventListener('visibilitychange', () => {
  if (
    document.hidden &&
    app.role === 'participant' &&
    app.activeQuestion &&
    app.isTimerRunning &&
    !app.answeredQs.includes(app.activeQuestion.qKey)
  ) {
    // Auto-submit with empty answer = 0 points
    showToast("⚠️ غادرت الصفحة! تم إرسال إجابة فارغة (0 نقطة)", true);
    sendAnswer("(مغادرة الصفحة - 0 نقطة)");
  }
});

// ══ EVALUATION LOGIC ══
const EVAL_QUESTIONS = [
  "تقييم عام للرحلة",
  "تقييم الوجهة",
  "تقييم برنامج الرحلة",
  "تقييم أنشطة الرحلة",
  "تقييم وجبة الغذاء",
  "تقييم تنظيم الرحلة",
  "تقييم المؤطرين"
];
const EVAL_OPTIONS = ["سيئة", "لا بأس بها", "مقبولة", "جيدة", "ممتازة"];
const EVAL_NUMBERS = ["1", "2", "3", "4", "5"];

function renderEvalQuestions() {
  const container = $('eval-questions');
  if (!container) return;
  container.innerHTML = '';
  EVAL_QUESTIONS.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'eval-q-card';
    card.innerHTML = `<div class="eval-q-title">${i + 1}. ${q}</div><div class="eval-options" id="eval-opts-${i}"></div>`;
    container.appendChild(card);

    const optsContainer = $(`eval-opts-${i}`);
    const options = q === "تقييم المؤطرين" ? EVAL_NUMBERS : EVAL_OPTIONS;

    options.forEach(opt => {
      const btn = document.createElement('div');
      btn.className = 'eval-opt';
      btn.textContent = opt;
      btn.onclick = () => {
        optsContainer.querySelectorAll('.eval-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        btn.dataset.val = opt;
      };
      optsContainer.appendChild(btn);
    });
  });
}

async function submitEvaluation() {
  const evalRoomCode = ($('eval-room-code').value.trim().toUpperCase()) || ROOM_CODE;
  if (!evalRoomCode) { showToast("الرجاء إدخال رمز الغرفة", true); return; }
  const team = $('eval-team').value;
  const rank = $('eval-rank').value;
  if (!team || !rank) { showToast("الرجاء إدخال رقم الفريق والرتبة", true); return; }

  let answers = {};
  let allAnswered = true;
  EVAL_QUESTIONS.forEach((q, i) => {
    const selected = $(`eval-opts-${i}`).querySelector('.eval-opt.selected');
    if (!selected) allAnswered = false;
    else answers[q] = selected.dataset.val;
  });

  if (!allAnswered) { showToast("الرجاء الإجابة على جميع التقييمات", true); return; }

  const notes = $('eval-notes').value.trim();
  const evalData = { team, rank, answers, notes, room: evalRoomCode, ts: new Date().toISOString() };

  $('eval-submit-btn').textContent = "جاري الإرسال...";
  $('eval-submit-btn').disabled = true;

  try {
    const payload = b64Encode(evalData);
    await fetch(TOPIC_EVALS + evalRoomCode, { method: 'POST', body: payload });
    localStorage.setItem('musabaka_has_evaluated', 'true');
    $('eval-form-card').classList.add('hidden');
    $('eval-success-card').classList.remove('hidden');
  } catch (e) {
    showToast("خطأ في الاتصال. الرجاء المحاولة مرة أخرى.", true);
    $('eval-submit-btn').textContent = "إرسال التقييم";
    $('eval-submit-btn').disabled = false;
  }
}

function gotoEvaluation() {
  // Auto-fill room code if already known
  goto('screen-evaluation');
  const rcInput = $('eval-room-code');
  if (rcInput && ROOM_CODE) rcInput.value = ROOM_CODE;
}

async function forceSyncEvals() {
  if (!ROOM_CODE || app.role !== 'supervisor') return;
  try {
    const res = await fetch(TOPIC_EVALS + ROOM_CODE + "/json?poll=1&since=1d");
    const text = await res.text();
    if (!text.trim()) return;
    const lines = text.trim().split('\n');
    let newCount = 0;
    const existing = JSON.parse(localStorage.getItem('musabaka_evals') || "[]");
    const existingTs = new Set(existing.map(e => e.ts));
    lines.forEach(line => {
      try {
        const msg = JSON.parse(line);
        if (msg.message) {
          const evalData = b64Decode(msg.message);
          if (!existingTs.has(evalData.ts)) {
            existing.push(evalData);
            existingTs.add(evalData.ts);
            newCount++;
          }
        }
      } catch (e) { }
    });
    if (newCount > 0) {
      localStorage.setItem('musabaka_evals', JSON.stringify(existing));
      showToast(`تم استرجاع ${newCount} تقييم مفقود ✅`);
    } else {
      showToast("لا تقييمات جديدة للاسترجاع");
    }
  } catch (e) { showToast("خطأ في استرجاع التقييمات", true); }
}

function exportEvalsToSheets() {
  const evals = JSON.parse(localStorage.getItem('musabaka_evals') || "[]");
  if (evals.length === 0) {
    showToast("لا توجد تقييمات لتصديرها", true);
    return;
  }
  let csv = "Time;Team;Rank;Notes";
  EVAL_QUESTIONS.forEach(q => csv += `;"${q}"`);
  csv += "\n";

  evals.forEach(ev => {
    let row = `"${ev.ts}";"${ev.team}";"${ev.rank}";"${(ev.notes || '').replace(/"/g, '""')}"`;
    EVAL_QUESTIONS.forEach(q => {
      row += `;"${ev.answers[q] || ''}"`;
    });
    csv += row + "\n";
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `musabaka_evals_${ROOM_CODE}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showToast("تم تحميل التقييمات بنجاح ✅");
}
