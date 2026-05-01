/* ═══════════════════════════════════════════════════════════
   المسابقة الثقافية – Logique JS v2
   Améliorations clés :
   • Sync à 2 canaux (state + answers) → plus de race condition
   • Reconnexion exponentielle automatique
   • Son de gong à chaque lancement de question
   • Vibration mobile pour les participants
   • QR code généré pour invitation
   • Export CSV fonctionnel
   • Réponses corrigées (fautes de frappe)
   • Validation PIN renforcée + obfuscation simple
   • Timer optimisé via requestAnimationFrame
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ─── Configuration ─────────────────────────────────────────
let ROOM_CODE = localStorage.getItem('musabaka_room_code') || '';
const SYNC_VERSION = 'v8'; // changer cette valeur pour invalider d'anciennes sessions
const SYNC_BASE = `https://ntfy.sh/musabaka_adl_${SYNC_VERSION}_`;

// Canaux séparés : élimine les race conditions
const CHANNEL_STATE  = (room) => `${SYNC_BASE}${room}_state`;
const CHANNEL_ANSWER = (room) => `${SYNC_BASE}${room}_ans`;

// Codes PIN obfusqués (base64 simple — pas une vraie sécurité, mais évite la lecture rapide)
// "youssef98" → "eW91c3NlZjk4"  ;  "jury2026" → "anVyeTIwMjY="
const PIN_SUP_HASH  = 'eW91c3NlZjk4';
const PIN_JURY_HASH = 'anVyeTIwMjY=';
const verifyPin = (input, hash) => btoa(input) === hash;

// ─── Utilitaires de log ───────────────────────────────────
function logDebug(msg) {
  const area = document.getElementById('debug-area');
  if (!area) return;
  const t = new Date().toLocaleTimeString();
  area.innerHTML = `[${t}] ${msg}<br>` + area.innerHTML.substring(0, 400);
}

// ─── Encodage Base64 anti-blocage ─────────────────────────
const encodeState = (s) => btoa(unescape(encodeURIComponent(JSON.stringify(s))));
const decodeState = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));

// ─── État global ──────────────────────────────────────────
const app = {
  role: null,
  teamNum: null,
  teamName: null,
  teams: {},
  currentCat: null,
  currentQIdx: 0,
  completedCats: [],
  gameLog: JSON.parse(localStorage.getItem('musabaka_log') || '[]'),
  answeredQs: JSON.parse(localStorage.getItem('answered_qs') || '[]'),
  supTimerInt: null,
  partTimerRAF: null,
  esState: null,        // EventSource pour le canal state
  esAnswer: null,       // EventSource pour le canal answers
  selectedOpt: null,
  isRunning: false,
  mimeWord: null,
  activeQuestion: null,
  lastQKey: null,
  reconnectAttempt: 0,
  lastSyncTs: 0
};

const shared = { answers: {} };

const $ = (id) => document.getElementById(id);
function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = $(id);
  if (t) t.classList.add('active');
}

// ═══════════════════════════════════════════════════════════
// SYNC – DOUBLE CANAL
// ═══════════════════════════════════════════════════════════

/**
 * Le superviseur publie l'état complet (questions, scores, équipes…)
 * Les participants publient uniquement leurs réponses (canal answers)
 * Le superviseur écoute les deux et republie l'état mis à jour.
 */

async function publishState() {
  if (!ROOM_CODE) return;
  const payload = {
    teams: app.teams,
    completedCats: app.completedCats,
    currentCat: app.currentCat,
    currentQIdx: app.currentQIdx,
    activeAnswers: shared.answers,
    activeQuestion: app.activeQuestion,
    ts: Date.now()
  };
  try {
    await fetch(CHANNEL_STATE(ROOM_CODE), {
      method: 'POST',
      body: encodeState(payload)
    });
    logDebug('État envoyé ✅');
  } catch (e) {
    logDebug('Erreur envoi état ❌');
  }
}

async function publishAnswer(teamNum, ans) {
  if (!ROOM_CODE) return;
  try {
    await fetch(CHANNEL_ANSWER(ROOM_CODE), {
      method: 'POST',
      body: encodeState({ teamNum, ans, ts: Date.now() })
    });
    logDebug(`Réponse #${teamNum} envoyée ✅`);
  } catch (e) {
    logDebug('Erreur envoi réponse ❌');
  }
}

// Compatibilité avec l'ancienne API
async function saveRoomState() { return publishState(); }

function startSyncListener() {
  closeSyncListeners();
  if (!ROOM_CODE) return;
  updateSyncStatus('connecting', 'جاري الاتصال...');

  // Canal STATE
  app.esState = new EventSource(CHANNEL_STATE(ROOM_CODE) + '/sse');
  app.esState.onopen = () => {
    app.reconnectAttempt = 0;
    updateSyncStatus('online', 'متصل ✅');
    logDebug('Canal STATE ouvert 📡');
  };
  app.esState.onmessage = (e) => {
    try {
      const env = JSON.parse(e.data);
      if (!env.message) return;
      app.lastSyncTs = Date.now();
      applyState(decodeState(env.message));
    } catch (err) { /* ignore */ }
  };
  app.esState.onerror = () => handleConnectionError();

  // Canal ANSWERS (uniquement utile au superviseur et au jury)
  if (app.role === 'supervisor' || app.role === 'jury') {
    app.esAnswer = new EventSource(CHANNEL_ANSWER(ROOM_CODE) + '/sse');
    app.esAnswer.onmessage = (e) => {
      try {
        const env = JSON.parse(e.data);
        if (!env.message) return;
        const data = decodeState(env.message);
        // On agrège la réponse
        shared.answers[data.teamNum] = data.ans;
        if (app.role === 'supervisor') {
          renderAnswers();
          publishState(); // Republie pour synchroniser tout le monde
        }
        if (app.role === 'jury') syncJuryState();
      } catch (err) { /* ignore */ }
    };
  }

  forceSync(); // Récupération immédiate du dernier état
}

function closeSyncListeners() {
  if (app.esState) { app.esState.close(); app.esState = null; }
  if (app.esAnswer) { app.esAnswer.close(); app.esAnswer = null; }
}

function handleConnectionError() {
  updateSyncStatus('offline', 'انقطع الاتصال - إعادة المحاولة...');
  app.reconnectAttempt++;
  // Backoff exponentiel : 1s, 2s, 4s, 8s, max 30s
  const delay = Math.min(1000 * Math.pow(2, app.reconnectAttempt - 1), 30000);
  setTimeout(() => {
    if (ROOM_CODE) startSyncListener();
  }, delay);
}

async function forceSync() {
  if (!ROOM_CODE) return;
  logDebug('Synchro manuelle...');
  try {
    const res = await fetch(CHANNEL_STATE(ROOM_CODE) + '/json?poll=1');
    const text = await res.text();
    if (!text) return logDebug('Serveur vide');
    const lines = text.trim().split('\n');
    const last = JSON.parse(lines[lines.length - 1]);
    applyState(decodeState(last.message));
    updateSyncStatus('online', 'متصل ✅');
    logDebug('Synchro OK ⚡');
  } catch (e) {
    logDebug('Synchro retardée');
  }
}

function applyState(data) {
  if (!data) return;
  // Le superviseur ne se laisse pas écraser par son propre état réfléchi
  if (app.role === 'supervisor' && data.ts < (app.lastSyncTs - 500)) return;

  app.teams = data.teams || {};
  app.completedCats = data.completedCats || [];
  app.currentCat = data.currentCat || null;
  app.currentQIdx = data.currentQIdx || 0;
  // Attention : les participants ne doivent pas écraser leurs propres réponses locales
  if (app.role !== 'participant') {
    shared.answers = data.activeAnswers || {};
  }
  app.activeQuestion = data.activeQuestion || null;

  if (app.role === 'participant') syncParticipantState();
  if (app.role === 'jury')        syncJuryState();
  if (app.role === 'supervisor')  { renderScores(); renderAnswers(); }
}

function updateSyncStatus(status, msg) {
  const dot = $('sync-dot');
  const txt = $('sync-text');
  if (!dot || !txt) return;
  dot.className = 'status-dot ' + status;
  txt.textContent = msg;
}

// ═══════════════════════════════════════════════════════════
// DONNÉES (questions corrigées)
// ═══════════════════════════════════════════════════════════
const QUESTIONS = {
  "الديني": [
    { q: "ما هي السورة التي تُسمى 'قلب القرآن'؟", type: "mcq",
      opts: ["الواقعة", "يس", "البقرة", "الكهف"], ans: "يس", pts: 2 },
    // CORRECTION : "بلال بن رباح" en option et en réponse
    { q: "ما اسم الصحابي الذي أذّن أول مرة في الإسلام؟", type: "mcq",
      opts: ["أبو بكر الصديق", "طلحة بن الزبير", "بلال بن رباح", "عبد الرحمن بن عوف"],
      ans: "بلال بن رباح", pts: 2 },
    { q: "كم عدد الأشهر الحُرم في الإسلام؟", type: "mcq",
      opts: ["3", "4", "5", "6"], ans: "4", pts: 2 }
  ],
  "السياسي": [
    { q: "ما هو نظام الحكم في المغرب؟", type: "mcq",
      opts: ["جمهورية", "ملكية دستورية", "ملكية برلمانية"], ans: "ملكية دستورية", pts: 2 },
    { q: "ما اسم أعلى هيئة تشريعية في المغرب؟", type: "mcq",
      opts: ["مجلس الوزراء", "البرلمان", "المحكمة الدستورية"], ans: "البرلمان", pts: 2 },
    { q: "ما هي مدة ولاية مجالس الجماعات المحلية في المغرب؟", type: "mcq",
      opts: ["3", "4", "5", "6"], ans: "5", pts: 2 }
  ],
  "الرياضي": [
    { q: "من هو العداء المغربي الذي فاز بذهبيتين في أولمبياد أثينا 2004؟", type: "mcq",
      opts: ["سفيان البقالي", "سعيد عويطة", "رشيد البسطي", "هشام الكروج"],
      ans: "هشام الكروج", pts: 2 },
    { q: "كم عدد لاعبي فريق كرة اليد في الملعب؟", type: "mcq",
      opts: ["5", "6", "7", "8"], ans: "7", pts: 2 },
    { q: "في أي مدينة أقيمت الألعاب الأولمبية الشتوية الأخيرة 2022؟", type: "mcq",
      opts: ["طوكيو", "بكين", "لندن", "باريس"], ans: "بكين", pts: 2 }
  ],
  "كرة القدم": [
    { q: "من هو المنتخب الفائز بكأس العالم 2022؟", type: "mcq",
      opts: ["فرنسا", "الأرجنتين", "البرازيل", "كرواتيا"], ans: "الأرجنتين", pts: 2 },
    // CORRECTION : "فالنسيا"
    { q: "من هو فريق كرة القدم الذي خسر نهائيين لدوري أبطال أوروبا على التوالي سنة 2000 و2001؟", type: "mcq",
      opts: ["فالنسيا", "يوفنتس", "مانشستر يونايتد", "بنفيكا"],
      ans: "فالنسيا", pts: 2 },
    { q: "من هو اللاعب الذي سجل هدف الفوز للمغرب ضد البرتغال في مونديال قطر؟", type: "mcq",
      opts: ["حكيم زياش", "سفيان بوفال", "يوسف النصيري", "أشرف حكيمي"],
      ans: "يوسف النصيري", pts: 2 }
  ],
  "الجغرافي": [
    { q: "ما أعلى قمة جبلية في القارة الأفريقية؟", type: "mcq",
      opts: ["كليمنجارو", "جبل كينيا", "رووينزوري", "جبل أطلس"],
      ans: "كليمنجارو", pts: 2 },
    // CORRECTION : ajout du mot "نهر"
    { q: "ما اسم أطول نهر في العالم؟", type: "mcq",
      opts: ["نهر النيل", "نهر الأمازون", "نهر المسيسيبي", "نهر اليانغتسي"],
      ans: "نهر النيل", pts: 1 },
    { q: "أي دولة تحتل أكبر مساحة في العالم؟", type: "mcq",
      opts: ["كندا", "الصين", "روسيا", "الولايات المتحدة"], ans: "روسيا", pts: 1 }
  ],
  "جماعة العدل والإحسان": [
    { q: "من هو مؤسس جماعة العدل والإحسان؟", type: "open",
      ans: "الشيخ عبد السلام ياسين", pts: 1 },
    { q: "ما هو تعريف جماعة العدل والإحسان؟", type: "mcq",
      opts: ["حزب سياسي", "جمعية خيرية", "مؤسسة تعليمية فكرية", "جماعة تربوية دعوية سياسية"],
      ans: "جماعة تربوية دعوية سياسية", pts: 2 },
    { q: "ما عنوان الرسالة التي وجّهها الشيخ عبد السلام ياسين للملك الحسن الثاني سنة 1974؟", type: "mcq",
      opts: ["لمن يهمه الأمر", "الإسلام أو الطوفان", "رسالة تذكير", "الثمن"],
      ans: "الإسلام أو الطوفان", pts: 3 }
  ],
  "الطبيعة": [
    { q: "ما الغاز الأكثر وفرة في الغلاف الجوي للأرض؟", type: "mcq",
      opts: ["الأكسجين", "الأرغون", "النيتروجين", "ثاني أكسيد الكربون"],
      ans: "النيتروجين", pts: 1 },
    { q: "ما الظاهرة البصرية التي تُفسّر احمرار السماء عند الغروب؟", type: "mcq",
      opts: ["تشتت رايلي للضوء", "تشتت ميك للضوء", "الانعكاس الكلي الداخلي", "الانكسار"],
      ans: "تشتت رايلي للضوء", pts: 3 },
    { q: "كم تستغرق أشعة الشمس للوصول إلى كوكب الأرض؟", type: "mcq",
      opts: ["8 ثوانٍ", "8 دقائق", "8 ساعات", "8 أيام"], ans: "8 دقائق", pts: 2 }
  ],
  "الحيوانات": [
    { q: "أي حيوان يمكنه البقاء طوال حياته دون أن يشرب الماء مباشرة؟", type: "mcq",
      opts: ["الجمل", "الكنغر", "فأر الكنغر الكبير", "ابن آوى"],
      ans: "فأر الكنغر الكبير", pts: 3 },
    { q: "كم قلباً يملك الأخطبوط؟", type: "mcq",
      opts: ["1", "2", "3", "4"], ans: "3", pts: 2 },
    { q: "ما الحيوان الوحيد الذي لديه بصمة يد مطابقة للإنسان؟", type: "mcq",
      opts: ["الشمبانزي", "الغوريلا", "كوالا", "الأورانغوتان"], ans: "كوالا", pts: 3 }
  ],
  "أمثال شعبية مغربية": [
    { q: "أكمل المثل الشعبي: 'دير النية...'", type: "open", ans: "وبات مع الحية", pts: 2 },
    { q: "أكمل المثل: 'اللي دارها بيديه...'", type: "open", ans: "يفكها بسنيه", pts: 2 },
    { q: "أكمل الحكمة: 'الوقت كالسيف...'", type: "open", ans: "إن لم تقطعه قطعك", pts: 2 }
  ],
  "التاريخي": [
    { q: "في أي سنة استقل المغرب عن الحماية الفرنسية؟", type: "mcq",
      opts: ["1954", "1956", "1958", "1960"], ans: "1956", pts: 1 },
    { q: "من قاد الجيوش الإسلامية في معركة اليرموك الفاصلة؟", type: "mcq",
      opts: ["أبو عبيدة بن الجراح", "عمرو بن العاص", "خالد بن الوليد", "سعد بن أبي وقاص"],
      ans: "خالد بن الوليد", pts: 2 },
    // CORRECTION : retrait du "م" final
    { q: "ما الحدث التاريخي الذي أطلق عليه المؤرخون اسم 'نهاية العصور الوسطى' في أوروبا؟", type: "mcq",
      opts: ["سقوط القسطنطينية سنة 1453", "اكتشاف أمريكا سنة 1492", "بداية الإصلاح الديني سنة 1517", "نهاية حرب المئة عام سنة 1453"],
      ans: "سقوط القسطنطينية سنة 1453", pts: 3 }
  ],
  "ثقافة عامة": [
    { q: "كم عدد ألوان الطيف المرئي للضوء؟", type: "mcq",
      opts: ["5", "6", "7", "8"], ans: "7", pts: 1 },
    { q: "من يُنسب إليه اختراع التلفزيون؟", type: "mcq",
      opts: ["توماس إديسون", "جون لوجي بيرد", "ماركوني", "نيكولا تسلا"],
      ans: "جون لوجي بيرد", pts: 2 },
    { q: "كم عدد مربعات رقعة الشطرنج؟", type: "mcq",
      opts: ["32", "48", "64", "81"], ans: "64", pts: 1 }
  ],
  "اقتصادي": [
    { q: "ما العملة الرسمية لدولة الصين؟", type: "mcq",
      opts: ["الدولار", "الدينار", "الين", "اليوان"], ans: "اليوان", pts: 1 },
    { q: "ما أكبر بورصة مالية في العالم من حيث الرسملة السوقية؟", type: "mcq",
      opts: ["بورصة لندن", "بورصة طوكيو", "بورصة نيويورك", "بورصة هونغ كونغ"],
      ans: "بورصة نيويورك", pts: 2 },
    // CORRECTION : "3." retiré
    { q: "التضخم يعني:", type: "mcq",
      opts: ["انخفاض الأسعار", "ارتفاع الأسعار", "ثبات الأسعار", "زيادة الإنتاج"],
      ans: "ارتفاع الأسعار", pts: 3 }
  ],
  "الأدب": [
    { q: "من كتب كتاب 'كليلة ودمنة'؟", type: "mcq",
      opts: ["ابن المقفع", "المتنبي", "الفارابي", "إدريس الشرايبي"],
      ans: "ابن المقفع", pts: 2 },
    { q: "في أي عام حصل نجيب محفوظ على جائزة نوبل في الأدب؟", type: "mcq",
      opts: ["1984", "1986", "1988", "1990"], ans: "1988", pts: 2 },
    { q: "ما هو جنس 'ألف ليلة وليلة'؟", type: "mcq",
      opts: ["رواية حديثة", "شعر", "قصص شعبية", "مسرحية"],
      ans: "قصص شعبية", pts: 1 }
  ],
  "🎭 Mimes": [
    { q: "Mimes — كل ممثل يختار كلمة ويوصل معناها بالحركات فقط خلال 90 ثانية", type: "mimes",
      words: ["فيلسوف", "صبورة", "ممثل", "طبيب الأسنان", "صياد سمك", "ملاكم",
              "حلاق", "تلفاز", "سرير", "كتاب", "حاسوب", "أستاذ", "قاضي", "قبطان", "سباح"],
      ans: "(تقديرية)", pts: 3 }
  ]
};

// ═══════════════════════════════════════════════════════════
// SON & VIBRATION
// ═══════════════════════════════════════════════════════════
let audioCtx = null;
function playGong() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = 440;
    o.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.6);
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    o.start();
    o.stop(audioCtx.currentTime + 0.8);
  } catch (e) { /* fallback silencieux */ }
}
function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

// ═══════════════════════════════════════════════════════════
// ROOM
// ═══════════════════════════════════════════════════════════
async function initRoom() {
  const code = $('room-code-in').value.trim().toUpperCase();
  if (!code) return alert('أدخل رمز الغرفة أولاً');
  ROOM_CODE = code;
  localStorage.setItem('musabaka_room_code', ROOM_CODE);
  $('display-room-code').textContent = '🔑 ' + ROOM_CODE;
  startSyncListener();
  goto('screen-role');
}

function exitRoom() {
  closeSyncListeners();
  localStorage.clear();
  location.reload();
}

// ═══════════════════════════════════════════════════════════
// SUPERVISEUR
// ═══════════════════════════════════════════════════════════
function checkPin() {
  if (verifyPin($('sup-pin').value, PIN_SUP_HASH)) {
    app.role = 'supervisor';
    localStorage.setItem('musabaka_role', 'supervisor');
    goto('screen-supervisor');
    const url = localStorage.getItem('sheets_webhook');
    if (url) $('sheets-url').value = url;
    $('sup-room-id').textContent = '🔑 ' + ROOM_CODE;
    buildCatGrid();
    renderScores();
    if (app.currentCat) renderSupQuestion();
    startSyncListener(); // Reabonnement avec écoute du canal answers
  } else {
    alert('الرمز خاطئ');
  }
}

function cancelPick() {
  if (app.isRunning) return;
  app.currentCat = null;
  app.currentQIdx = 0;
  app.activeQuestion = null;
  $('sup-q-card').classList.add('hidden');
  buildCatGrid();
  publishState();
}

function pickMimeWord() {
  const q = QUESTIONS[app.currentCat][0];
  app.mimeWord = q.words[Math.floor(Math.random() * q.words.length)];
  $('sup-reveal-text').textContent = app.mimeWord;
  $('sup-reveal-box').classList.add('show');
}

async function launchQuestion() {
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  const dur = q.type === 'mimes' ? 90 : 30;
  const now = Date.now();
  shared.answers = {};
  renderAnswers();

  app.isRunning = true;
  $('btn-cancel-pick').disabled = true;
  $('btn-launch').disabled = true;

  app.activeQuestion = {
    cat: app.currentCat,
    qIdx: app.currentQIdx,
    qText: q.type === 'mimes'
      ? '🎭 جولة الميمز: التعبير بالحركات فقط'
      : q.q,
    qType: q.type,
    opts: q.opts || [],
    tStart: now,
    dur,
    ans: q.ans,
    pts: q.pts || 1,
    qKey: 'Q_' + now
  };
  await publishState();
  playGong();

  $('sup-status-badge').textContent = '⏱ يعمل';
  $('sup-status-badge').className = 'badge badge-teal';

  let rem = dur;
  clearInterval(app.supTimerInt);
  app.supTimerInt = setInterval(() => {
    rem--;
    $('btn-launch').textContent = '⏱ ' + rem + ' ثانية';
    if (rem <= 0) {
      clearInterval(app.supTimerInt);
      finishQuestionRound(q);
    }
  }, 1000);
}

async function finishQuestionRound(q) {
  app.isRunning = false;
  app.activeQuestion = null;
  $('btn-launch').textContent = '✓ انتهى الوقت';
  $('btn-launch').disabled = false;
  $('btn-cancel-pick').disabled = false;

  const logItem = {
    room: ROOM_CODE,
    cat: app.currentCat,
    question: q.q,
    answer: q.type === 'mimes' ? 'Mime: ' + app.mimeWord : q.ans,
    teamAnswers: { ...shared.answers },
    ts: Date.now()
  };
  app.gameLog.push(logItem);
  localStorage.setItem('musabaka_log', JSON.stringify(app.gameLog));

  await publishState();

  $('sup-status-badge').textContent = 'انتهى الوقت';
  $('sup-status-badge').className = 'badge badge-red';

  const url = $('sheets-url').value;
  if (url) {
    localStorage.setItem('sheets_webhook', url);
    fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify(logItem) }).catch(() => {});
  }
}

function nextQ() {
  const qs = QUESTIONS[app.currentCat];
  const isLast = app.currentQIdx >= qs.length - 1;
  if (isLast && !confirm('هل تريد إنهاء هذا الصنف؟')) return;
  app.activeQuestion = null;
  app.isRunning = false;
  clearInterval(app.supTimerInt);

  if (!isLast) {
    app.currentQIdx++;
    renderSupQuestion();
  } else {
    if (!app.completedCats.includes(app.currentCat)) app.completedCats.push(app.currentCat);
    app.currentCat = null;
    app.currentQIdx = 0;
    $('sup-q-card').classList.add('hidden');
    buildCatGrid();
  }
  publishState();
}

// ═══════════════════════════════════════════════════════════
// JURY
// ═══════════════════════════════════════════════════════════
function checkJuryPin() {
  if (verifyPin($('jury-pin').value, PIN_JURY_HASH)) {
    app.role = 'jury';
    localStorage.setItem('musabaka_role', 'jury');
    goto('screen-jury');
    startSyncListener();
    syncJuryState();
  } else {
    alert('الرمز خاطئ');
  }
}

function syncJuryState() {
  if (app.role !== 'jury') return;
  const q = app.activeQuestion;
  if (q) {
    $('jury-q-card').classList.remove('hidden');
    $('jury-cat').textContent = q.cat;
    $('jury-pts').textContent = q.pts + ' نقطة';
    $('jury-q-text').textContent = q.qText;
    $('jury-ans').textContent = q.ans;
    const rem = Math.max(0, Math.ceil(q.dur - (Date.now() - q.tStart) / 1000));
    $('jury-timer-box').textContent = '⏱ ' + rem + ' ثانية';
  } else {
    $('jury-q-card').classList.add('hidden');
  }

  const list = $('jury-answers-list');
  list.innerHTML = '';
  Object.entries(shared.answers).forEach(([tn, ans]) => {
    const d = document.createElement('div');
    d.className = 'ans-row';
    d.innerHTML = `<span class="ans-team">فريق ${tn}</span><span class="ans-text">${escapeHTML(ans)}</span>`;
    list.appendChild(d);
  });

  const sl = $('jury-scores-list');
  sl.innerHTML = '';
  Object.entries(app.teams).sort((a, b) => b[1].score - a[1].score).forEach(([tn, d]) => {
    const r = document.createElement('div');
    r.className = 'score-row';
    r.innerHTML = `<span>${escapeHTML(d.name)}</span><span class="score-pts">${d.score}</span>`;
    sl.appendChild(r);
  });
}

// ═══════════════════════════════════════════════════════════
// PARTICIPANT
// ═══════════════════════════════════════════════════════════
function syncParticipantState() {
  if (app.role !== 'participant') return;
  if (app.activeQuestion) {
    if (app.activeQuestion.qKey !== app.lastQKey) {
      app.lastQKey = app.activeQuestion.qKey;
      handleIncomingQuestion(app.activeQuestion);
      vibrate([200, 100, 200]);
    } else {
      runPartTimer(app.activeQuestion.tStart, app.activeQuestion.dur);
    }
  } else {
    app.lastQKey = null;
    $('part-q-view').classList.add('hidden');
    $('part-waiting').classList.remove('hidden');
  }
}

function joinTeam() {
  const tn = parseInt($('part-team-in').value);
  if (!tn || tn < 1 || tn > 20) return alert('أدخل رقم فريق صحيح (1-20)');
  app.teamNum = tn;
  app.teamName = $('part-team-name').value.trim() || ('فريق ' + tn);
  app.role = 'participant';
  localStorage.setItem('musabaka_role', 'participant');
  localStorage.setItem('musabaka_team_num', tn);
  localStorage.setItem('musabaka_team_name', app.teamName);
  if (!app.teams[tn]) app.teams[tn] = { score: 0, name: app.teamName };
  $('part-team-display').textContent = app.teamName;
  goto('screen-participant');
  startSyncListener();
}

function handleIncomingQuestion(data) {
  const realKey = data.cat + '_' + data.qIdx + '_' + data.qKey;
  if (app.answeredQs.includes(realKey) && data.qType !== 'mimes') {
    goto('screen-participant');
    $('part-waiting').classList.add('hidden');
    $('part-q-view').classList.remove('hidden');
    $('part-send-btn').classList.add('hidden');
    $('part-sent-msg').classList.remove('hidden');
    $('part-q-text').textContent = 'تمت الإجابة بالفعل على هذا السؤال.';
    $('part-opts-area').innerHTML = '';
    return;
  }

  goto('screen-participant');
  $('part-waiting').classList.add('hidden');
  $('part-q-view').classList.remove('hidden');
  $('part-cat-badge').textContent = data.cat;
  $('part-num-badge').textContent = 'سؤال ' + (data.qIdx + 1);
  $('part-q-text').textContent = data.qText;
  app.selectedOpt = null;

  if (data.qType === 'mimes') {
    $('part-send-btn').classList.add('hidden');
    $('part-sent-msg').classList.add('hidden');
    $('part-opts-area').innerHTML =
      "<div class='card-sm' style='background:rgba(212,168,67,.08); color:var(--gold); text-align:center;'>المشرف سيختار الكلمة وفريقكم سيعبر عنها بالحركات</div>";
    $('part-open-area').classList.add('hidden');
  } else if (data.qType === 'mcq') {
    $('part-send-btn').classList.remove('hidden');
    $('part-sent-msg').classList.add('hidden');
    $('part-open-area').classList.add('hidden');
    renderPartOpts(data);
  } else {
    // open
    $('part-send-btn').classList.remove('hidden');
    $('part-sent-msg').classList.add('hidden');
    $('part-opts-area').innerHTML = '';
    $('part-open-area').classList.remove('hidden');
    $('part-open-inp').value = '';
  }
  runPartTimer(data.tStart, data.dur);
}

function renderPartOpts(data) {
  const area = $('part-opts-area');
  area.innerHTML = '';
  data.opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt-btn';
    b.textContent = o;
    b.onclick = () => {
      area.querySelectorAll('.opt-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      app.selectedOpt = o;
    };
    area.appendChild(b);
  });
}

async function sendAnswer(ansParam) {
  if (!app.activeQuestion) return;
  const realKey = app.activeQuestion.cat + '_' + app.activeQuestion.qIdx + '_' + app.activeQuestion.qKey;
  let ans = ansParam || app.selectedOpt || $('part-open-inp').value.trim() || '(بدون إجابة)';
  if (!app.answeredQs.includes(realKey)) {
    app.answeredQs.push(realKey);
    localStorage.setItem('answered_qs', JSON.stringify(app.answeredQs));
  }
  shared.answers[app.teamNum] = ans;
  await publishAnswer(app.teamNum, ans);
  $('part-send-btn').classList.add('hidden');
  $('part-sent-msg').classList.remove('hidden');
  if (app.partTimerRAF) cancelAnimationFrame(app.partTimerRAF);
}

// ═══════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, s =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

function buildCatGrid() {
  const grid = $('cat-grid');
  grid.innerHTML = '';
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
  if (done && !confirm('هذا الصنف مكتمل. إعادة فتحه؟')) return;
  app.currentCat = cat;
  app.currentQIdx = 0;
  buildCatGrid();
  renderSupQuestion();
  publishState();
}

function renderSupQuestion() {
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  if (!q) return;
  $('sup-q-card').classList.remove('hidden');
  $('sup-q-text').textContent = q.q;
  $('sup-reveal-box').classList.remove('show');
  $('sup-reveal-text').textContent = q.ans;
  $('btn-launch').textContent = '▶ إطلاق السؤال';
  $('btn-launch').disabled = false;
  $('sup-q-cat-badge').textContent = app.currentCat;
  $('sup-q-num-badge').textContent = 'سؤال ' + (app.currentQIdx + 1);
  $('sup-q-pts-badge').textContent = (q.pts || 1) + ' نقطة';

  const opts = $('sup-q-opts');
  opts.innerHTML = '';
  if (app.currentCat === '🎭 Mimes') {
    const b = document.createElement('button');
    b.className = 'btn btn-gold';
    b.textContent = '🎲 اختيار كلمة عشوائية';
    b.onclick = pickMimeWord;
    opts.appendChild(b);
  } else if (q.type === 'mcq') {
    q.opts.forEach(o => {
      const b = document.createElement('div');
      b.className = 'opt-btn';
      b.textContent = o;
      if (o === q.ans) b.classList.add('correct');
      opts.appendChild(b);
    });
  }
  $('btn-cancel-pick').style.opacity = app.isRunning ? '.3' : '1';
}

// Timer participant – optimisé via requestAnimationFrame
function runPartTimer(startMs, dur) {
  const circle = $('part-circle');
  const num = $('part-timer-num');
  if (app.partTimerRAF) cancelAnimationFrame(app.partTimerRAF);

  function tick() {
    const rem = Math.max(0, dur - (Date.now() - startMs) / 1000);
    if (circle) {
      circle.style.strokeDashoffset = 326.7 * (1 - rem / dur);
      circle.classList.toggle('warn', rem <= dur * 0.3 && rem > dur * 0.15);
      circle.classList.toggle('danger', rem <= dur * 0.15);
    }
    if (num) num.textContent = Math.ceil(rem);
    if (rem <= 0) {
      if (!$('part-send-btn').classList.contains('hidden')) sendAnswer('(انتهى الوقت)');
      return;
    }
    app.partTimerRAF = requestAnimationFrame(tick);
  }
  tick();
}

function renderAnswers() {
  const list = $('answers-list');
  if (!list) return;
  list.innerHTML = '';
  if (Object.keys(shared.answers).length === 0) {
    list.innerHTML = '<p class="muted">لا إجابات بعد</p>';
    return;
  }
  const pts = (QUESTIONS[app.currentCat] && QUESTIONS[app.currentCat][app.currentQIdx])
    ? QUESTIONS[app.currentCat][app.currentQIdx].pts
    : 2;
  Object.entries(shared.answers).forEach(([tn, ans]) => {
    const d = document.createElement('div');
    d.className = 'ans-row';
    d.innerHTML = `
      <span class="ans-team">فريق ${tn}</span>
      <span class="ans-text">${escapeHTML(ans)}</span>
      <button class="btn btn-teal btn-sm" onclick="grantPts(${tn},${pts})">✓ +${pts}</button>
    `;
    list.appendChild(d);
  });
}

function renderScores() {
  const list = $('scores-list');
  if (!list) return;
  list.innerHTML = '';
  const sorted = Object.entries(app.teams).sort((a, b) => b[1].score - a[1].score);
  if (sorted.length === 0) {
    list.innerHTML = '<p class="muted">لا فرق بعد</p>';
    return;
  }
  sorted.forEach(([tn, d]) => {
    const r = document.createElement('div');
    r.className = 'score-row';
    r.innerHTML = `<span>${escapeHTML(d.name)}</span><span class="score-pts">${d.score}</span>`;
    list.appendChild(r);
  });
}

function grantPts(tn, p) {
  if (!app.teams[tn]) app.teams[tn] = { score: 0, name: 'فريق ' + tn };
  app.teams[tn].score += p;
  renderScores();
  renderAnswers();
  publishState();
}

function addManual() {
  const t = parseInt($('manual-team').value);
  const p = parseInt($('manual-pts').value) || 1;
  if (!t) return;
  grantPts(t, p);
}

function supTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['stab-cat', 'stab-scores', 'stab-answers'].forEach(id => $(id).classList.add('hidden'));
  $('stab-' + name).classList.remove('hidden');
}

function revealAns() { $('sup-reveal-box').classList.add('show'); }

function showFinalResults() { goto('screen-results'); renderFinalResultsUI(); }

function renderFinalResultsUI() {
  const list = $('final-list');
  list.innerHTML = '';
  Object.entries(app.teams).sort((a, b) => b[1].score - a[1].score).forEach(([tn, d], i) => {
    const r = document.createElement('div');
    r.className = 'result-item ' + (i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '');
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️';
    r.innerHTML = `
      <span class="medal">${medal}</span>
      <span class="result-name">${escapeHTML(d.name)}</span>
      <span class="result-score">${d.score}</span>
    `;
    list.appendChild(r);
  });

  // Détails du log
  const logBox = $('log-container');
  logBox.innerHTML = '';
  app.gameLog.forEach((item, idx) => {
    const e = document.createElement('div');
    e.className = 'log-entry';
    const teamsStr = Object.entries(item.teamAnswers || {})
      .map(([tn, a]) => `فريق ${tn}: ${escapeHTML(a)}`).join(' | ');
    e.innerHTML = `
      <strong class="gold">${idx + 1}. ${escapeHTML(item.cat)}</strong><br>
      <span class="muted">${escapeHTML(item.question || '')}</span><br>
      <span class="teal">✓ ${escapeHTML(item.answer)}</span>
      ${teamsStr ? `<br><small class="muted">${teamsStr}</small>` : ''}
    `;
    logBox.appendChild(e);
  });
}

async function confirmReset() {
  if (!confirm('هل تريد حذف هذه الغرفة نهائياً؟ سيتم طرد جميع المشاركين.')) return;
  app.teams = {}; app.completedCats = []; app.gameLog = [];
  app.currentCat = null; app.currentQIdx = 0; app.activeQuestion = null;
  shared.answers = {};
  await publishState();
  setTimeout(() => { localStorage.clear(); location.reload(); }, 500);
}

function resetCompetition() { confirmReset(); }

// ═══════════════════════════════════════════════════════════
// EXPORT CSV (fonctionnel cette fois !)
// ═══════════════════════════════════════════════════════════
function exportToSheets() {
  if (!app.gameLog || app.gameLog.length === 0)
    return alert('لا توجد بيانات للتصدير بعد');

  const rows = [['التوقيت', 'الصنف', 'السؤال', 'الجواب الصحيح', 'إجابات الفرق']];
  app.gameLog.forEach(item => {
    const teamsStr = Object.entries(item.teamAnswers || {})
      .map(([tn, a]) => `فريق ${tn}: ${a}`).join(' | ');
    rows.push([
      new Date(item.ts || Date.now()).toLocaleString('ar-MA'),
      item.cat || '',
      item.question || '',
      item.answer || '',
      teamsStr
    ]);
  });

  // Scores finaux
  rows.push([]);
  rows.push(['الترتيب النهائي']);
  rows.push(['الفريق', 'النقاط']);
  Object.entries(app.teams).sort((a, b) => b[1].score - a[1].score).forEach(([_, d]) => {
    rows.push([d.name, d.score]);
  });

  const csv = '\uFEFF' + rows.map(r =>
    r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `musabaka_${ROOM_CODE}_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════
// QR CODE
// ═══════════════════════════════════════════════════════════
function showQRCode() {
  const url = location.origin + location.pathname + '?room=' + encodeURIComponent(ROOM_CODE);
  $('qr-code-box').innerHTML = '';
  $('qr-room-text').textContent = 'الرمز: ' + ROOM_CODE;
  if (window.QRCode) {
    QRCode.toCanvas($('qr-code-box').appendChild(document.createElement('canvas')), url,
      { width: 240, margin: 2 }, () => {});
  } else {
    $('qr-code-box').textContent = url;
  }
  $('qr-modal').classList.remove('hidden');
}
function hideQRCode() { $('qr-modal').classList.add('hidden'); }

// ═══════════════════════════════════════════════════════════
// AUTO-LOAD & DEEP-LINK
// ═══════════════════════════════════════════════════════════
window.onload = async () => {
  // Deep-link : ?room=XXX pré-remplit le code
  const params = new URLSearchParams(location.search);
  const roomParam = params.get('room');
  if (roomParam && !ROOM_CODE) {
    $('room-code-in').value = roomParam.toUpperCase();
  }

  if (ROOM_CODE) {
    $('room-code-in').value = ROOM_CODE;
    $('display-room-code').textContent = '🔑 ' + ROOM_CODE;
    await initRoom();
    const role = localStorage.getItem('musabaka_role');
    if (role === 'supervisor') {
      // On laisse le superviseur ressaisir son PIN par sécurité
      goto('screen-sup-login');
    } else if (role === 'participant') {
      const tn = localStorage.getItem('musabaka_team_num');
      const tname = localStorage.getItem('musabaka_team_name');
      if (tn) {
        app.teamNum = parseInt(tn);
        app.teamName = tname || ('فريق ' + tn);
        app.role = 'participant';
        $('part-team-display').textContent = app.teamName;
        goto('screen-participant');
        startSyncListener();
      }
    } else if (role === 'jury') {
      goto('screen-jury-login');
    }
  }
};

// Watchdog : si pas de message reçu depuis > 45s alors qu'on est censé être connecté → reconnect
setInterval(() => {
  if (ROOM_CODE && app.lastSyncTs && Date.now() - app.lastSyncTs > 45000) {
    logDebug('Watchdog : reconnexion forcée');
    handleConnectionError();
  }
}, 15000);
