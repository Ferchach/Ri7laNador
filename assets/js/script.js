// ══ REAL-TIME SYNC (ntfy.sh with Logs) ══════════════════════
const ROOM_TOPIC = "adl_musabaka_2026_test"; 
const NTFY_URL = "https://ntfy.sh/" + ROOM_TOPIC;

function logDebug(msg) {
  const area = document.getElementById('debug-area');
  if (area) {
    const time = new Date().toLocaleTimeString();
    area.innerHTML = `[${time}] ${msg}<br>` + area.innerHTML;
  }
  console.log(msg);
}

// ══ API CORE ══
async function publishState(data) {
  try {
    logDebug("Sending: " + data.type);
    const res = await fetch(NTFY_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Title': 'Sync' }
    });
    return res.ok;
  } catch (e) { 
    logDebug("Send Error: " + e.message);
    return false; 
  }
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

// ══ STATE ══
const app = {
  role: null,
  teamNum: null,
  teams: {},
  currentCat: null,
  currentQIdx: 0,
  completedCats: [],
  supTimerInt: null,
  partTimerInt: null,
  eventSource: null,
  selectedOpt: null
};

const shared = {
  answers: {}
};

// ══ UTILS ══
function goto(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}
function $(id) { return document.getElementById(id); }

// ══ SYNC LOGIC ══
function startListening() {
  if (app.eventSource) app.eventSource.close();
  
  logDebug("Listening to topic: " + ROOM_TOPIC);
  app.eventSource = new EventSource(NTFY_URL + "/sse");
  
  app.eventSource.onopen = () => {
    logDebug("Connection established (SSE Open)");
    updateSyncStatus('online', "جاهز لاستقبال الأسئلة");
  };
  
  app.eventSource.onmessage = (e) => {
    try {
      logDebug("Data received: " + e.data.substring(0, 50) + "...");
      const msg = JSON.parse(e.data);
      if (!msg.message) return;
      
      const data = JSON.parse(msg.message);
      logDebug("Parsed Type: " + data.type);
      
      if (data.type === 'QUESTION_LAUNCH') {
        handleIncomingQuestion(data);
      } else if (data.type === 'QUESTION_END') {
        handleQuestionEnd();
      } else if (data.type === 'ANSWER_SUBMIT' && app.role === 'supervisor') {
        handleIncomingAnswer(data);
      }
    } catch (err) {
      logDebug("Parse Error: " + err.message);
    }
  };

  app.eventSource.onerror = (err) => {
    logDebug("SSE Error, retrying...");
    updateSyncStatus('offline', "جاري إعادة الاتصال...");
  };
}

function handleIncomingQuestion(data) {
  if (app.role !== 'participant') return;
  logDebug("Displaying Question: " + data.qIdx);
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

function handleQuestionEnd() {
  if (app.role !== 'participant') return;
  logDebug("Question Closed");
  $('part-q-view').classList.add('hidden');
  $('part-waiting').classList.remove('hidden');
}

function handleIncomingAnswer(data) {
  logDebug("Answer from Team " + data.teamNum);
  shared.answers[data.teamNum] = data.ans;
  renderAnswers();
}

// ══ SUPERVISOR ══
function checkPin() {
  if ($('sup-pin').value === SUPERVISOR_PIN) {
    app.role = 'supervisor';
    goto('screen-supervisor');
    buildCatGrid();
    renderScores();
    startListening();
  } else {
    $('sup-pin').style.borderColor = 'var(--red)';
    setTimeout(() => $('sup-pin').style.borderColor = '', 800);
  }
}

async function launchQuestion() {
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  const dur = q.type === 'mimes' ? 90 : 30;
  const now = Date.now();
  shared.answers = {};
  renderAnswers();

  logDebug("Broadcasting Question...");
  const ok = await publishState({
    type: 'QUESTION_LAUNCH',
    cat: app.currentCat,
    qIdx: app.currentQIdx,
    qText: q.q,
    qType: q.type,
    opts: q.opts || (q.type === 'mimes' ? q.words : []),
    tStart: now,
    dur: dur
  });

  if (!ok) { alert("خطأ في الاتصال بالشبكة!"); return; }

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
  } else {
    app.completedCats.push(app.currentCat);
    app.currentCat = null;
    $('sup-q-card').style.display = 'none';
    buildCatGrid();
    if (app.completedCats.length === Object.keys(QUESTIONS).length) showFinalResults();
  }
}

// ══ PARTICIPANT ══
function joinTeam() {
  const tn = parseInt($('part-team-in').value);
  if (!tn) return;
  app.teamNum = tn;
  app.role = 'participant';
  $('part-team-display').textContent = 'فريق ' + tn;
  goto('screen-participant');
  $('part-login').classList.add('hidden');
  $('part-waiting').classList.remove('hidden');
  startListening();
}

async function sendAnswer() {
  const qList = QUESTIONS[app.currentCat];
  const q = qList ? qList[app.currentQIdx] : {type:'open'};
  let ans = "";
  if (q.type === 'mcq' || q.type === 'mimes') {
    ans = app.selectedOpt || "(بدون إجابة)";
  } else {
    ans = $('part-open-inp').value.trim() || "(بدون إجابة)";
  }
  logDebug("Submitting Answer...");
  await publishState({ type: 'ANSWER_SUBMIT', teamNum: app.teamNum, ans: ans });
  $('part-send-btn').classList.add('hidden');
  $('part-sent-msg').classList.remove('hidden');
  clearInterval(app.partTimerInt);
}

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
function pickCat(cat) { app.currentCat = cat; app.currentQIdx = 0; buildCatGrid(); renderSupQuestion(); }
function renderSupQuestion() {
  const q = QUESTIONS[app.currentCat][app.currentQIdx];
  $('sup-q-card').style.display = 'block';
  $('sup-q-text').textContent = q.q;
  $('sup-reveal-box').style.display = 'none';
  $('sup-reveal-text').textContent = q.ans;
  $('btn-launch').textContent = '▶ إطلاق السؤال';
  $('btn-launch').disabled = false;
}
function renderPartOpts(data) {
  const area = $('part-opts-area'); area.innerHTML = '';
  const open = $('part-open-area'); open.classList.add('hidden');
  if (data.qType === 'mcq') {
    const g = document.createElement('div'); g.className = 'opts-grid';
    data.opts.forEach(o => {
      const b = document.createElement('button'); b.className = 'opt-btn'; b.textContent = o;
      b.onclick = () => { document.querySelectorAll('.opt-btn').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); app.selectedOpt = o; };
      g.appendChild(b);
    });
    area.appendChild(g);
  } else if (data.qType === 'mimes') {
    const g = document.createElement('div'); g.className = 'mimes-grid';
    data.opts.forEach(w => {
      const b = document.createElement('div'); b.className = 'mimes-word'; b.textContent = w;
      b.onclick = () => { document.querySelectorAll('.mimes-word').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); app.selectedOpt = w; };
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
    if (rem <= 0) { clearInterval(app.partTimerInt); if (!$('part-send-btn').classList.contains('hidden')) autoSend(); }
  }, 200);
}
function autoSend() { sendAnswer(); }
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
  Object.entries(app.teams).forEach(([tn, d]) => {
    const row = document.createElement('div'); row.className = 'score-row';
    row.innerHTML = `<span>${d.name}</span><span class="score-pts">${d.score}</span>`;
    list.appendChild(row);
  });
}
function grantPts(tn, p) { if (!app.teams[tn]) app.teams[tn] = { score: 0, name: 'فريق ' + tn }; app.teams[tn].score += p; renderScores(); renderAnswers(); }
function supTab(name, el) { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); $('stab-cat').classList.add('hidden'); $('stab-scores').classList.add('hidden'); $('stab-answers').classList.add('hidden'); $('stab-' + name).classList.remove('hidden'); }
function revealAns() { $('sup-reveal-box').style.display = 'block'; }
function showFinalResults() { goto('screen-results'); }
function resetAll() { location.reload(); }

logDebug("App Ready");
updateSyncStatus('connecting');
setTimeout(startListening, 500);
