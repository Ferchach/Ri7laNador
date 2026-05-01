// ══ CONFIGURATION & SYNC ══════════════════════════════════
let ROOM_CODE = localStorage.getItem('musabaka_room_code') || "";
let NTFY_URL = "";
const BUCKET_URL = "https://kvdb.io/mn6xR6f8XzY9vP7u5nB2/"; 

function logDebug(msg) {
  const area = document.getElementById('debug-area');
  if (area) {
    const time = new Date().toLocaleTimeString();
    area.innerHTML = `[${time}] ${msg}<br>` + area.innerHTML.substring(0, 500);
  }
  console.log(msg);
}

// ══ API CORE ══
async function publishState(data) {
  if (!NTFY_URL) return;
  try {
    const res = await fetch(NTFY_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Title': 'SyncData' }
    });
    return res.ok;
  } catch (e) { return false; }
}

// Persistent Storage (Cloud)
async function saveRoomState() {
  if (!ROOM_CODE) return;
  const state = {
    teams: app.teams,
    completedCats: app.completedCats,
    currentCat: app.currentCat,
    currentQIdx: app.currentQIdx,
    gameLog: app.gameLog
  };
  try {
    await fetch(BUCKET_URL + "room_" + ROOM_CODE + "_state", {
      method: 'PUT',
      body: JSON.stringify(state)
    });
  } catch (e) { logDebug("Save failed."); }
}

async function loadRoomState() {
  if (!ROOM_CODE) return;
  try {
    const res = await fetch(BUCKET_URL + "room_" + ROOM_CODE + "_state?t=" + Date.now());
    if (res.ok) {
      const data = await res.json();
      app.teams = data.teams || {};
      app.completedCats = data.completedCats || [];
      app.currentCat = data.currentCat || null;
      app.currentQIdx = data.currentQIdx || 0;
      app.gameLog = data.gameLog || [];
      logDebug("State restored.");
    }
  } catch (e) { logDebug("No state found."); }
}

function updateSyncStatus(status, msg) {
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-text');
  if (!dot || !txt) return;
  dot.className = status === 'online' ? 'status-dot online' : 'status-dot';
  txt.textContent = msg || (status === 'online' ? "متصل" : "جاري الاتصال...");
}

// ══ DATA (UPDATED) ════════════════════════════════════════════
const SUPERVISOR_PIN = "youssef98";

const QUESTIONS = {
  "الديني": [
    { q: "ما هي السورة التي تُسمى 'قلب القرآن'؟", type: "mcq", opts: ["الواقعة", "يس", "البقرة", "الكهف"], ans: "يس", pts: 2 },
    { q: "ما اسم الصحابي الذي أذّن أول مرة في الإسلام؟", type: "mcq", opts: ["أبو بكر الصديق", "طلحة بن الزبير", "بلال بن رواح", "عبد الرحمن بن عوف"], ans: "بلال بن رباح", pts: 2 },
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
    { q: "من هو فريق كرة القدم لذي خسر نهائيين لدوري أبطال أوروبا على التوالى سنة 2000 و 2001؟", type: "mcq", opts: ["فالنسيا", "يوفنتس", "مانشستر يونايتد", "بنفيكا"], ans: "فانسيا", pts: 2 },
    { q: "من هو اللاعب الذي سجل هدف الفوز للمغرب ضد البرتغال في مونديال قطر؟", type: "mcq", opts: ["حكيم زياش", "سفيان بوفال", "يوسف النصيري", "أشرف حكيمي"], ans: "يوسف النصيري", pts: 2 }
  ],
  "الجغرافي": [
    { q: "ما أعلى قمة جبلية في القارة الأفريقية؟", type: "mcq", opts: ["كليمنجارو", "جبل كينيا", "رووينزوري", "جبل أطلس"], ans: "كليمنجارو", pts: 2 },
    { q: "ما اسم أطول في العالم؟", type: "mcq", opts: ["نهر النيل", "نهر الأمازون", " نهر المسيسيبي", "نهر اليانغتسي"], ans: "نهر النيل", pts: 1 },
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
    { q: "ما الحدث التاريخي الذي أطلق عليه المؤرخون اسم 'نهاية العصور الوسطى' في أوروبا؟", type: "mcq", opts: ["سقوط القسطنطينية سنة 1453", "اكتشاف أمريكا سنة 1492", "بداية الإصلاح الديني سنة 1517", "نهاية حرب المئة عام سنة 1453"], ans: "سقوط القسطنطينية سنة 1453م", pts: 3 }
  ],
  "ثقافة عامة": [
    { q: "كم عدد ألوان الطيف المرئي للضوء؟", type: "mcq", opts: ["5", "6", "7", "8"], ans: "7", pts: 1 },
    { q: "من يُنسب إليه اختراع التلفزيون؟", type: "mcq", opts: ["توماس إديسون", "جون لوجي بيرد", "ماركوني", "نيكولا تسلا"], ans: "جون لوجي بيرد", pts: 2 },
    { q: "كم عدد مربعات رقعة الشطرنج؟", type: "mcq", opts: ["32", "48", "64", "81"], ans: "64", pts: 1 }
  ],
  "اقتصادي": [
    { q: "ما العملة الرسمية لدولة الصين؟", type: "mcq", opts: ["الدولار", "الدينار", "الين", "اليوان"], ans: "اليوان", pts: 1 },
    { q: "ما أكبر بورصة مالية في العالم من حيث الرسملة السوقية؟", type: "mcq", opts: ["بورصة لندن", "بورصة طوكيو", "بورصة نيويورك", "بورصة هونغ كونغ"], ans: "بورصة نيويورك", pts: 2 },
    { q: "3.	التضخم يعني:", type: "mcq", opts: ["انخفاض الأسعار", "ارتفاع الأسعار", "ثبات الأسعار", "زيادة الإنتاج"], ans: "ارتفاع الأسعار", pts: 3 }
  ],
  "الأدب": [
    { q: "من كتب كتاب 'كليلة ودمنة'؟", type: "mcq", opts: ["ابن المقفع", "المتنبي", "الفارابي", "إدريس الشرايبي"], ans: "ابن المقفع", pts: 2 },
    { q: "في أي عام حصل نجيب محفوظ على جائزة نوبل في الأدب؟", type: "mcq", opts: ["1984", "1986", "1988", "1990"], ans: "1988", pts: 2 },
    { q: "ما هو جنس 'ألف ليلة وليلة'؟", type: "mcq", opts: ["رواية حديثة", "شعر", "قصص شعبية", "مسرحية"], ans: "قصص شعبية", pts: 1 }
  ],
  "🎭 Mimes": [
    {
      q: "Mimes — كل ممثل يختار كلمة ويوصل معناها بالحركات فقط خلال 90 ثانية", type: "mimes",
      words: ["فيلسوف", "صبورة", "ممثل", "طبيب الأسنان", "صياد سمك", "ملاكم", "حلاق", "تلفاز", "سرير", "كتاب", "حاسوب", "أستاذ", "قاضي", "قبطان", "سباح"],
      ans: "(تقديرية)", pts: 2
    }
  ]
};

// ══ STATE ══
const app = {
  role: null, teamNum: null, teams: {}, currentCat: null, currentQIdx: 0,
  completedCats: [], gameLog: [], supTimerInt: null, partTimerInt: null, eventSource: null, selectedOpt: null
};

const shared = { answers: {} };

// ══ UTILS ══
function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}
function $(id) { return document.getElementById(id); }

// ══ SESSION MANAGEMENT ═══════════════════════════════════════
async function initRoom() {
  const code = $('room-code-in').value.trim().toUpperCase();
  if (!code) { alert("أدخل رمز الغرفة أولاً"); return; }
  ROOM_CODE = code;
  localStorage.setItem('musabaka_room_code', ROOM_CODE);
  NTFY_URL = "https://ntfy.sh/musabaka_adl_" + ROOM_CODE;
  $('display-room-code').textContent = ROOM_CODE;
  $('sup-room-id').textContent = ROOM_CODE;
  
  await loadRoomState(); 
  goto('screen-role');
  startListening();
}

function exitRoom() {
  localStorage.removeItem('musabaka_room_code');
  localStorage.removeItem('musabaka_role');
  localStorage.removeItem('musabaka_team_num');
  location.reload();
}

// ══ SYNC RECEIVER ══
function startListening() {
  if (app.eventSource) app.eventSource.close();
  app.eventSource = new EventSource(NTFY_URL + "/sse");
  app.eventSource.onopen = () => updateSyncStatus('online', "جاهز - غرفة " + ROOM_CODE);
  app.eventSource.onmessage = (e) => {
    try {
      const envelope = JSON.parse(e.data);
      if (!envelope.message) return;
      let data = JSON.parse(envelope.message);
      if (data.type === 'QUESTION_LAUNCH') handleIncomingQuestion(data);
      else if (data.type === 'QUESTION_END') handleQuestionEnd();
      else if (data.type === 'ANSWER_SUBMIT' && app.role === 'supervisor') handleIncomingAnswer(data);
      else if (data.type === 'ROOM_RESET') location.reload();
    } catch (err) {}
  };
}

// ══ SUPERVISOR ══
function checkPin() {
  if ($('sup-pin').value === SUPERVISOR_PIN) {
    app.role = 'supervisor';
    localStorage.setItem('musabaka_role', 'supervisor');
    goto('screen-supervisor');
    buildCatGrid();
    renderScores();
    if (app.currentCat) renderSupQuestion(); // Resume last question
  } else {
    $('sup-pin').style.borderColor = 'var(--red)';
    setTimeout(() => $('sup-pin').style.borderColor = '', 800);
  }
}

function cancelPick() {
  app.currentCat = null;
  app.currentQIdx = 0;
  $('sup-q-card').style.display = 'none';
  buildCatGrid();
  saveRoomState();
}

async function launchQuestion() {
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  const dur = q.type === 'mimes' ? 90 : 30;
  const now = Date.now();
  shared.answers = {};
  renderAnswers();

  await publishState({
    type: 'QUESTION_LAUNCH',
    cat: app.currentCat,
    qIdx: app.currentQIdx,
    qText: q.q,
    qType: q.type,
    opts: q.opts || (q.type === 'mimes' ? q.words : []),
    tStart: now,
    dur: dur
  });

  $('sup-status-badge').textContent = '⏱ يعمل';
  $('sup-status-badge').className = 'badge badge-teal';
  $('btn-launch').disabled = true;

  let rem = dur;
  clearInterval(app.supTimerInt);
  app.supTimerInt = setInterval(() => {
    rem--;
    $('btn-launch').textContent = '⏱ ' + rem + ' ثانية';
    if (rem <= 0) {
      clearInterval(app.supTimerInt);
      $('btn-launch').textContent = '✓ انتهى الوقت';
      publishState({ type: 'QUESTION_END' });
      $('sup-status-badge').textContent = 'انتهى الوقت';
      $('sup-status-badge').className = 'badge badge-red';
      
      // Log this round
      app.gameLog.push({
        cat: app.currentCat,
        q: q.q,
        ans: q.ans,
        teamAnswers: {...shared.answers}
      });
      saveRoomState();
    }
  }, 1000);
}

function nextQ() {
  publishState({ type: 'QUESTION_END' });
  clearInterval(app.supTimerInt);
  const qs = QUESTIONS[app.currentCat];
  if (app.currentQIdx < qs.length - 1) {
    app.currentQIdx++;
    renderSupQuestion();
    saveRoomState();
  } else {
    app.completedCats.push(app.currentCat);
    app.currentCat = null;
    app.currentQIdx = 0;
    $('sup-q-card').style.display = 'none';
    buildCatGrid();
    saveRoomState();
    if (app.completedCats.length === Object.keys(QUESTIONS).length) showFinalResults();
  }
}

// ══ PARTICIPANT ══
function joinTeam() {
  const tn = parseInt($('part-team-in').value);
  if (!tn || tn < 1 || tn > 20) { alert("أدخل رقم فريق صحيح"); return; }
  app.teamNum = tn;
  app.role = 'participant';
  localStorage.setItem('musabaka_role', 'participant');
  localStorage.setItem('musabaka_team_num', tn);
  $('part-team-display').textContent = 'فريق ' + tn;
  goto('screen-participant');
  $('part-login').classList.add('hidden');
  $('part-waiting').classList.remove('hidden');
}

function handleIncomingQuestion(data) {
  if (app.role !== 'participant') return;
  goto('screen-participant');
  $('part-waiting').classList.add('hidden');
  $('part-q-view').classList.remove('hidden');
  $('part-cat-badge').textContent = data.cat;
  $('part-num-badge').textContent = 'سؤال ' + (data.qIdx + 1);
  $('part-q-text').textContent = data.qText;
  $('part-send-btn').classList.remove('hidden');
  $('part-sent-msg').classList.add('hidden');
  renderPartOpts(data);
  runPartTimer(data.tStart, data.dur);
}

async function sendAnswer() {
  const qType = QUESTIONS[app.currentCat] ? QUESTIONS[app.currentCat][app.currentQIdx].type : 'open';
  let ans = (app.selectedOpt || $('part-open-inp').value.trim() || "(بدون إجابة)");
  await publishState({ type: 'ANSWER_SUBMIT', teamNum: app.teamNum, ans: ans });
  $('part-send-btn').classList.add('hidden');
  $('part-sent-msg').classList.remove('hidden');
  clearInterval(app.partTimerInt);
}

// ══ DATA EXPORT ══════════════════════════════════════════════
function exportToSheets() {
  let csv = "\ufeff"; // BOM for Arabic support in Excel
  csv += "الصنف,السؤال,الجواب الصحيح,";
  
  // Header for teams
  const maxTeams = 20;
  for(let i=1; i<=maxTeams; i++) csv += `فريق ${i},`;
  csv += "\n";

  // Rows for each question logged
  app.gameLog.forEach(log => {
    csv += `"${log.cat}","${log.q}","${log.ans}",`;
    for(let i=1; i<=maxTeams; i++) {
      csv += `"${log.teamAnswers[i] || '-'}",`;
    }
    csv += "\n";
  });

  // Final Scores Row
  csv += "\nالنتيجة النهائية,,,";
  for(let i=1; i<=maxTeams; i++) {
    csv += `"${app.teams[i] ? app.teams[i].score : 0}",`;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `musabaka_results_${ROOM_CODE}.csv`;
  a.click();
}

function confirmReset() {
  if (confirm("هل أنت متأكد من مسح جميع النتائج والبدء من جديد؟")) resetCompetition();
}

async function resetCompetition() {
  app.teams = {}; app.completedCats = []; app.gameLog = [];
  app.currentCat = null; app.currentQIdx = 0;
  
  // Wipe Cloud
  await saveRoomState();
  // Signal others to reload
  await publishState({ type: 'ROOM_RESET' });
  
  // Wipe Local
  localStorage.removeItem('musabaka_room_code');
  localStorage.removeItem('musabaka_role');
  localStorage.removeItem('musabaka_team_num');
  
  location.reload();
}

function resetAll() { resetCompetition(); }

// ══ UI RENDERING ══
function buildCatGrid() {
  const grid = $('cat-grid'); grid.innerHTML = '';
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
function pickCat(cat) { app.currentCat = cat; app.currentQIdx = 0; buildCatGrid(); renderSupQuestion(); saveRoomState(); }
function renderSupQuestion() {
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  if(!q) return;
  $('sup-q-card').style.display = 'block';
  $('sup-q-text').textContent = q.q;
  $('sup-reveal-box').style.display = 'none';
  $('sup-reveal-text').textContent = q.ans;
  $('btn-launch').textContent = '▶ إطلاق السؤال';
  $('btn-launch').disabled = false;
  $('sup-q-cat-badge').textContent = app.currentCat;
  $('sup-q-num-badge').textContent = 'سؤال ' + (app.currentQIdx + 1);
  $('sup-q-pts-badge').textContent = (q.pts || 1) + ' نقطة';
  
  const optsDiv = $('sup-q-opts'); optsDiv.innerHTML = '';
  if (q.type === 'mcq') {
    q.opts.forEach(o => {
      const b = document.createElement('div'); b.className = 'opt-btn'; b.textContent = o;
      if (o === q.ans) b.style.borderColor = 'var(--gold)';
      optsDiv.appendChild(b);
    });
  }
}
function renderPartOpts(data) {
  const area = $('part-opts-area'); area.innerHTML = '';
  const open = $('part-open-area'); open.classList.add('hidden');
  app.selectedOpt = null;
  if (data.qType === 'mcq' || data.qType === 'mimes') {
    const g = document.createElement('div'); g.className = data.qType==='mcq' ? 'opts-grid' : 'mimes-grid';
    data.opts.forEach(o => {
      const b = document.createElement('button'); b.className = 'opt-btn'; b.textContent = o;
      b.onclick = () => { document.querySelectorAll('.opt-btn, .mimes-word').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); app.selectedOpt = o; };
      g.appendChild(b);
    });
    area.appendChild(g);
  } else { open.classList.remove('hidden'); $('part-open-inp').value = ''; }
}
function runPartTimer(startMs, dur) {
  const circle = $('part-circle'); const num = $('part-timer-num');
  clearInterval(app.partTimerInt);
  app.partTimerInt = setInterval(() => {
    const rem = Math.max(0, dur - (Date.now() - startMs) / 1000);
    circle.style.strokeDashoffset = 326.7 * (1 - rem / dur);
    num.textContent = Math.ceil(rem);
    if (rem <= 0) { clearInterval(app.partTimerInt); if (!$('part-send-btn').classList.contains('hidden')) sendAnswer(); }
  }, 200);
}
function handleIncomingAnswer(data) { shared.answers[data.teamNum] = data.ans; renderAnswers(); }
function renderAnswers() {
  const list = $('answers-list'); list.innerHTML = '';
  Object.entries(shared.answers).forEach(([tn, ans]) => {
    const d = document.createElement('div'); d.className = 'ans-row';
    d.innerHTML = `<strong>فريق ${tn}</strong> <span style="flex:1; text-align:center;">${ans}</span> <button class="btn btn-teal btn-sm" onclick="grantPts(${tn},2)">✓ +2</button>`;
    list.appendChild(d);
  });
}
function renderScores() {
  const list = $('scores-list'); list.innerHTML = '';
  Object.entries(app.teams).sort((a,b)=>b[1].score-a[1].score).forEach(([tn, d]) => {
    const row = document.createElement('div'); row.className = 'score-row';
    row.innerHTML = `<span>${d.name}</span><span class="score-pts">${d.score}</span>`;
    list.appendChild(row);
  });
}
function grantPts(tn, p) { if (!app.teams[tn]) app.teams[tn] = { score: 0, name: 'فريق ' + tn }; app.teams[tn].score += p; renderScores(); renderAnswers(); saveRoomState(); }
function addManual() { const t = parseInt($('manual-team').value); const p = parseInt($('manual-pts').value) || 1; if (!t) return; grantPts(t,p); }
function supTab(name, el) { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); $('stab-cat').classList.add('hidden'); $('stab-scores').classList.add('hidden'); $('stab-answers').classList.add('hidden'); $('stab-' + name).classList.remove('hidden'); }
function revealAns() { $('sup-reveal-box').style.display = 'block'; }
function showFinalResults() {
  goto('screen-results');
  const list = $('final-list'); list.innerHTML = '';
  Object.entries(app.teams).sort((a,b)=>b[1].score-a[1].score).forEach(([tn, d], i) => {
    const row = document.createElement('div'); row.className = 'score-row';
    row.style.fontSize = i === 0 ? '1.5rem' : '1.1rem';
    row.innerHTML = `<span>${i===0?'👑 ':''}${d.name}</span><span class="score-pts">${d.score}</span>`;
    list.appendChild(row);
  });

  // Render Detailed Log
  const logCont = $('log-container'); logCont.innerHTML = '';
  app.gameLog.forEach((log, idx) => {
    const d = document.createElement('div');
    d.className = 'card card-sm';
    d.style.marginBottom = '10px';
    d.style.background = 'var(--bg3)';
    
    let teamsHtml = "";
    Object.entries(log.teamAnswers).forEach(([tn, ans]) => {
      teamsHtml += `<div style="font-size:0.8rem; margin-top:4px; padding:4px; border-bottom:1px solid #333;">
        <strong>فريق ${tn}:</strong> ${ans}
      </div>`;
    });

    d.innerHTML = `
      <div style="color:var(--gold); font-weight:bold; margin-bottom:5px;">سؤال ${idx+1}: ${log.cat}</div>
      <div style="margin-bottom:8px;">${log.q}</div>
      <div style="color:var(--teal2); font-size:0.9rem; margin-bottom:10px;">✓ الجواب الصحيح: ${log.ans}</div>
      <div style="border-top:1px solid #444; padding-top:5px;">
        ${teamsHtml || '<p class="muted">لا توجد إجابات</p>'}
      </div>
    `;
    logCont.appendChild(d);
  });
}

// ══ ON LOAD ══
window.onload = async () => {
  if (ROOM_CODE) {
    $('room-code-in').value = ROOM_CODE;
    await initRoom();
    const role = localStorage.getItem('musabaka_role');
    if (role === 'supervisor') {
      app.role = 'supervisor';
      goto('screen-supervisor');
      buildCatGrid();
      renderScores();
      if (app.currentCat) renderSupQuestion();
    } else if (role === 'participant') {
      const tn = localStorage.getItem('musabaka_team_num');
      if (tn) { $('part-team-in').value = tn; joinTeam(); }
    }
  }
};
