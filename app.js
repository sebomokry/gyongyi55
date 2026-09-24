/* Boldog 55. szülinapot! – játékos meglepetés-oldal */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  /* ================= HANG (WebAudio, fájlok nélkül) ================= */
  let actx = null;
  let soundOn = store.get("hang") !== "ki";
  const soundBtn = $("#soundBtn");
  const syncSoundBtn = () => (soundBtn.textContent = soundOn ? "🔊" : "🔇");
  syncSoundBtn();
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    store.set("hang", soundOn ? "be" : "ki");
    syncSoundBtn();
    if (soundOn) sfx.pop();
  });
  function ac() {
    if (!actx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      actx = new C();
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function tone(freq, dur = 0.2, type = "triangle", vol = 0.2, when = 0, slide = 0) {
    if (!soundOn) return;
    const c = ac();
    if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function noise(dur = 0.3, vol = 0.2, when = 0, hp = 800) {
    if (!soundOn) return;
    const c = ac();
    if (!c) return;
    const t = c.currentTime + when;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const g = c.createGain();
    g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination);
    s.start(t);
  }
  const sfx = {
    pop: () => tone(rand(500, 700), 0.12, "sine", 0.25, 0, 500),
    knock: () => { tone(160, 0.08, "square", 0.12); tone(140, 0.08, "square", 0.12, 0.12); },
    boing: () => tone(180, 0.45, "sine", 0.25, 0, 420),
    blow: () => noise(0.5, 0.25, 0, 1200),
    chomp: () => { noise(0.08, 0.3, 0, 300); noise(0.08, 0.3, 0.12, 300); },
    whoosh: () => noise(0.4, 0.15, 0, 2500),
    tada: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, "triangle", 0.18, i * 0.09)),
    slide: (up = true) => tone(up ? 300 : 900, 0.35, "sine", 0.2, 0, up ? 700 : -650),
    squeak: () => { tone(1400, 0.08, "sine", 0.15, 0, 400); tone(1600, 0.1, "sine", 0.15, 0.1, -300); },
  };

  /* ================= KONFETTI (canvas) ================= */
  const cv = $("#fx");
  const cx = cv.getContext("2d");
  let parts = [];
  let raf = 0;
  const leafImgs = ["assets/level1.webp", "assets/level2.webp", "assets/level3.webp"].map((src) => {
    const i = new Image();
    i.src = src;
    return i;
  });
  function sizeCanvas() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeCanvas();
  addEventListener("resize", sizeCanvas);
  const COLORS = ["#d7263d", "#e8742a", "#f5c02e", "#ff7aa2", "#8fb04a", "#3a86ff", "#fff"];
  function burst(x, y, n = 60, opts = {}) {
    if (reduced) n = Math.min(n, 12);
    const { spread = Math.PI * 2, angle = -Math.PI / 2, speed = 9, leaves = 0.15, emoji = null } = opts;
    for (let i = 0; i < n; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = rand(speed * 0.4, speed);
      const kind = emoji ? "emoji" : Math.random() < leaves ? "leaf" : Math.random() < 0.5 ? "rect" : "circ";
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        g: 0.22, drag: 0.985, life: rand(70, 130), age: 0,
        rot: rand(0, 6.28), vr: rand(-0.3, 0.3), size: kind === "leaf" ? rand(16, 30) : kind === "emoji" ? rand(18, 30) : rand(6, 11),
        color: pick(COLORS), kind, img: pick(leafImgs), emoji: emoji ? pick(emoji) : null, wob: rand(0, 6),
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function rain(n = 140) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => burst(rand(0, innerWidth), -20, 1, { angle: Math.PI / 2, spread: 0.6, speed: 4, leaves: 0.3 }), i * 18);
    }
  }
  function tick() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.age < p.life && p.y < innerHeight + 60);
    for (const p of parts) {
      p.age++;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx + Math.sin((p.age + p.wob * 10) / 10) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      const alpha = Math.min(1, (p.life - p.age) / 25);
      cx.save();
      cx.globalAlpha = alpha;
      cx.translate(p.x, p.y);
      cx.rotate(p.rot);
      if (p.kind === "leaf" && p.img.complete) cx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
      else if (p.kind === "emoji") { cx.font = `${p.size}px serif`; cx.textAlign = "center"; cx.fillText(p.emoji, 0, 0); }
      else {
        cx.fillStyle = p.color;
        if (p.kind === "rect") { cx.scale(1, Math.cos(p.age / 6)); cx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
        else { cx.beginPath(); cx.arc(0, 0, p.size / 2.4, 0, 7); cx.fill(); }
      }
      cx.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
  }
  const centerOf = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  /* ================= TOAST & BUBORÉK ================= */
  let toastT;
  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), ms);
  }
  function say(bubble, msg, ms = 2200) {
    bubble.textContent = msg;
    bubble.classList.add("show");
    clearTimeout(bubble._t);
    bubble._t = setTimeout(() => bubble.classList.remove("show"), ms);
  }
  function tempClass(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    clearTimeout(el["_" + cls]);
    el["_" + cls] = setTimeout(() => el.classList.remove(cls), ms);
  }

  /* ================= FOTÓ HELYŐRZŐK ================= */
  const faceSVG = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#ffd9b0" stroke="#6e2417" stroke-width="3"/>
    <path d="M14 44 C14 10, 86 10, 86 44 C80 26, 60 22, 50 30 C40 22, 20 26, 14 44Z" fill="#8a3a26"/>
    <circle cx="36" cy="50" r="5" fill="#2b1614"/><circle cx="64" cy="50" r="5" fill="#2b1614"/>
    <ellipse cx="28" cy="62" rx="6" ry="3.5" fill="#ff8f9e"/><ellipse cx="72" cy="62" rx="6" ry="3.5" fill="#ff8f9e"/>
    <path d="M36 66 q14 14 28 0" fill="none" stroke="#6e2417" stroke-width="4" stroke-linecap="round"/></svg>`;
  const phColors = ["#ffd3a8", "#ffc2c7", "#cfe6a8", "#ffe28a"];
  $$("img[data-ph]").forEach((img, i) => {
    const swap = () => {
      const d = document.createElement("div");
      d.className = "ph";
      const key = img.dataset.ph;
      if (key === "anya") d.innerHTML = faceSVG + `<span class="ph-txt">ide jön anya fotója</span>`;
      else { d.textContent = key; d.style.background = `radial-gradient(circle at 35% 30%, #fff6ea, ${phColors[i % 4]})`; }
      d.setAttribute("role", "img");
      d.setAttribute("aria-label", img.alt);
      img.replaceWith(d);
    };
    if (img.complete && img.naturalWidth === 0) swap();
    else img.addEventListener("error", swap);
  });

  /* ================= FALEVÉL-FÜZÉR + HULLÓ LEVELEK ================= */
  const garland = $(".garland");
  const gCount = Math.max(5, Math.min(11, Math.round(innerWidth / 110)));
  for (let i = 0; i < gCount; i++) {
    const img = new Image();
    img.src = leafImgs[i % 3].src;
    img.alt = "";
    img.style.setProperty("--r", `${(i % 2 ? 1 : -1) * rand(150, 200)}deg`);
    img.style.animationDelay = `${-rand(0, 4)}s`;
    img.style.transform = `rotate(${img.style.getPropertyValue("--r")})`;
    img.addEventListener("click", (e) => {
      sfx.whoosh();
      img.classList.remove("spin");
      void img.offsetWidth;
      img.classList.add("spin");
      burst(e.clientX, e.clientY, 14, { leaves: 1, speed: 6 });
      setTimeout(() => img.classList.remove("spin"), 900);
    });
    garland.appendChild(img);
  }

  const leafLayer = $("#leafLayer");
  let caught = 0;
  const leafQuips = { 5: "5 levél! Gyűjtögetős kedvedben vagy 🍂", 10: "10 levél! Hivatalos Levélkapó Bajnok 🏆", 25: "25! Ősz királynője 👑🍁", 55: "55 levél – pont mint az évek! 🎉" };
  function spawnLeaf() {
    if (document.hidden || leafLayer.childElementCount > 9) return;
    const w = document.createElement("div");
    w.className = "fall";
    const s = rand(34, 70);
    w.style.cssText = `left:${rand(-5, 95)}vw;--s:${s}px;--t:${rand(9, 16)}s;--dx:${rand(-160, 160)}px;--rot:${rand(-540, 540)}deg;--f:${rand(1.6, 3.2)}s`;
    const img = new Image();
    img.src = pick(leafImgs).src;
    img.alt = "";
    w.appendChild(img);
    w.addEventListener("pointerdown", (e) => {
      caught++;
      sfx.pop();
      burst(e.clientX, e.clientY, 18, { leaves: 0.4, speed: 7 });
      w.remove();
      if (leafQuips[caught]) toast(leafQuips[caught]);
      else if (caught === 1) toast("Elkaptál egy levelet! 🍁");
    });
    w.addEventListener("animationend", (e) => { if (e.target === w) w.remove(); });
    leafLayer.appendChild(w);
  }
  if (!reduced) {
    setTimeout(() => { for (let i = 0; i < 3; i++) setTimeout(spawnLeaf, i * 700); }, 1200);
    setInterval(spawnLeaf, 1700);
  }

  /* ================= CÍM: betűnként ugráló ================= */
  let ci = 0;
  $$(".title .split").forEach((el) => {
    const txt = el.textContent;
    el.textContent = "";
    for (const ch of txt) {
      const s = document.createElement("span");
      if (ch === " ") { s.innerHTML = "&nbsp;"; el.appendChild(s); ci++; continue; }
      s.className = "ch";
      s.textContent = ch;
      s.style.setProperty("--i", ci++);
      s.addEventListener("click", () => {
        tempClass(s, "jump", 600);
        s.style.color = pick(["#d7263d", "#e8742a", "#8fb04a", "#ff7aa2", "#3a86ff", ""]);
        tone(rand(400, 900), 0.15, "sine", 0.18, 0, 300);
      });
      el.appendChild(s);
    }
  });

  // 55 → "25?" poén
  const n55 = $("#n55");
  const agesJokes = [["25?", "Psszt… lélekben 25! 😉"], ["18!", "Na jó, 18 és pár hónap 😅"], ["∞", "Fiatalos energia: végtelen ⚡"], ["55.", "Oké, oké, 55. De milyen jól áll! ✨"]];
  let ageIdx = 0;
  n55.addEventListener("click", () => {
    const [txt, msg] = agesJokes[ageIdx++ % agesJokes.length];
    tempClass(n55, "flip", 800);
    sfx.slide(true);
    setTimeout(() => (n55.textContent = txt), 400);
    toast(msg);
    if (txt !== "55.") setTimeout(() => { tempClass(n55, "flip", 800); setTimeout(() => (n55.textContent = "55."), 400); }, 2600);
    const [x, y] = centerOf(n55);
    burst(x, y, 30);
  });

  /* ================= SZEMEK KÖVETIK AZ EGERET ================= */
  // ajándék-SVG-k kitöltése a sablonból (így a szemek és a fedő animálhatók)
  const giftTpl = $("#gift-shape").innerHTML;
  $$(".gift svg").forEach((svg) => (svg.innerHTML = giftTpl));
  let eyes = [];
  function collectEyes() {
    eyes = $$(".eye").filter((e) => !e.closest("defs")).map((e) => ({ el: e, pupil: $(".pupil", e), glint: $(".glint", e), r: +e.dataset.r || 4 }));
  }
  collectEyes();
  let px = innerWidth / 2, py = innerHeight / 2, eyeRaf = 0;
  function updateEyes() {
    eyeRaf = 0;
    for (const e of eyes) {
      const b = e.el.getBoundingClientRect();
      if (!b.width || b.bottom < 0 || b.top > innerHeight) continue;
      const dx = px - (b.left + b.width / 2), dy = py - (b.top + b.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 120) * e.r;
      const tr = `translate(${(dx / d) * k} ${(dy / d) * k})`;
      e.pupil.setAttribute("transform", tr);
      if (e.glint) e.glint.setAttribute("transform", tr);
    }
  }
  addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; if (!eyeRaf) eyeRaf = requestAnimationFrame(updateEyes); }, { passive: true });
  addEventListener("pointerdown", (e) => { px = e.clientX; py = e.clientY; updateEyes(); }, { passive: true });
  addEventListener("scroll", () => { if (!eyeRaf) eyeRaf = requestAnimationFrame(updateEyes); }, { passive: true });
  // pislogás
  setInterval(() => {
    const blinkers = [...$$(".gift"), $("#cake")].filter(Boolean);
    const el = pick(blinkers);
    tempClass(el, "blink", 240);
  }, 1300);

  /* ================= ANYA ================= */
  const mom = $("#mom");
  const momBubble = $("#momBubble");
  const accs = ["acc-hat", "acc-glasses", "acc-crown", "acc-stache", null];
  const momLines = ["Buli-sapka ON! 🥳", "Túl menő vagyok ehhez 😎", "A család királynője 👑", "Bajusz? Miért ne! 🥸", "Na, vissza a régi énemhez 😄", "Ki mondta, hogy 55? 😏", "Hol a torta?! 🎂"];
  let accIdx = 0;
  mom.addEventListener("click", () => {
    $$(".acc > g", mom).forEach((g) => g.classList.remove("on"));
    const a = accs[accIdx % accs.length];
    if (a) $("." + a, mom).classList.add("on");
    say(momBubble, accIdx < accs.length ? momLines[accIdx] : pick(momLines));
    accIdx++;
    tempClass(mom, "boing", 700);
    sfx.boing();
    const [x, y] = centerOf(mom);
    burst(x, y, 24, { speed: 7 });
  });

  /* ================= TORTA + GYERTYÁK ================= */
  const cake = $("#cake");
  const candles = $$(".candle", cake);
  const cakeHint = $("#cakeHint");
  let blown = 0;
  function blowOut(c) {
    if (c.classList.contains("out")) return;
    c.classList.add("out");
    blown++;
    sfx.blow();
    if (blown === candles.length) {
      setTimeout(() => {
        cake.classList.add("happy");
        sfx.tada();
        const [x, y] = centerOf(cake);
        burst(x, y - 40, 140, { speed: 13 });
        cakeHint.innerHTML = "Hurrá! Most kívánj valamit! ✨";
        toast("🎉 Mindkét gyertya elfújva! Teljesüljön a kívánságod!");
        stopMic();
        $("#micBtn").textContent = "🕯️ Gyújtsd meg újra";
      }, 450);
    }
  }
  function relight() {
    candles.forEach((c) => c.classList.remove("out"));
    blown = 0;
    cake.classList.remove("happy");
    cakeHint.innerHTML = "Fújd el a gyertyákat! <small>(bökj a lángokra)</small>";
    $("#micBtn").textContent = "🎤 Fújd el igazából!";
    tone(900, 0.2, "sine", 0.12, 0, 600);
  }
  candles.forEach((c) => c.addEventListener("click", (e) => { e.stopPropagation(); blowOut(c); }));
  cake.addEventListener("click", () => {
    if (blown === candles.length) { sfx.boing(); const [x, y] = centerOf(cake); burst(x, y, 20, { emoji: ["🎂", "🍰", "✨"] }); }
    else { sfx.squeak(); cakeHint.innerHTML = "Nem engem, a <b>lángokat</b>! 🔥😂"; }
  });

  // Mikrofonos elfújás
  let micStream = null, micRaf = 0;
  function stopMic() {
    if (micStream) micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
    cancelAnimationFrame(micRaf);
  }
  $("#micBtn").addEventListener("click", async () => {
    if (blown === candles.length) return relight();
    if (micStream) { stopMic(); $("#micBtn").textContent = "🎤 Fújd el igazából!"; return; }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast("Nincs mikrofon? Semmi baj, bökd meg a lángokat! 🔥");
      return;
    }
    const c = ac() || new (window.AudioContext || window.webkitAudioContext)();
    const src = c.createMediaStreamSource(micStream);
    const an = c.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    const data = new Uint8Array(an.fftSize);
    let loud = 0;
    $("#micBtn").textContent = "💨 Fújj bele erősen!";
    cakeHint.innerHTML = "Hallgatózom… fújj! 👂";
    const loop = () => {
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      const rms = Math.sqrt(sum / data.length);
      loud = rms > 0.18 ? loud + 1 : Math.max(0, loud - 1);
      $$(".flame-in", cake).forEach((f) => (f.style.transform = rms > 0.08 ? `skewX(${-rms * 120}deg) scale(${1 - rms})` : ""));
      if (loud > 6) {
        const lit = candles.find((cd) => !cd.classList.contains("out"));
        if (lit) blowOut(lit);
        loud = 0;
      }
      if (micStream) micRaf = requestAnimationFrame(loop);
      else $$(".flame-in", cake).forEach((f) => (f.style.transform = ""));
    };
    loop();
  });

  /* ================= MENEKÜLŐ GOMB ================= */
  const whatGift = $("#whatGift");
  const runLines = ["Hopp! Nem-nem! 🙈", "Majdnem! 😜", "Előbb a torta! 🎂", "Na jó… megadom magam 😅"];
  let runs = 0;
  const maxRuns = 3;
  function runAway() {
    if (runs >= maxRuns) return false;
    const zone = whatGift.parentElement.getBoundingClientRect();
    const maxX = Math.min(zone.width / 2 - 140, 260);
    const x = (Math.random() < 0.5 ? -1 : 1) * rand(80, Math.max(90, maxX));
    const y = rand(-40, 30);
    whatGift.style.transform = `translate(${x}px, ${y}px) rotate(${rand(-15, 15)}deg)`;
    toast(runLines[runs]);
    sfx.slide(runs % 2 === 0);
    runs++;
    return true;
  }
  const isTouch = matchMedia("(hover: none)").matches;
  if (!isTouch) whatGift.addEventListener("pointerenter", () => { if (runs < maxRuns - 1) runAway(); });
  whatGift.addEventListener("click", () => {
    if (runs < maxRuns && runAway()) return;
    whatGift.style.transform = "";
    toast(runLines[3]);
    sfx.tada();
    const [x, y] = centerOf(whatGift);
    burst(x, y, 90, { speed: 12 });
    unlock($("#gifts"));
    whatGift.disabled = true;
    whatGift.style.opacity = ".0";
    setTimeout(() => (whatGift.parentElement.style.display = "none"), 500);
  });

  function unlock(sec) {
    if (!sec.classList.contains("locked")) return;
    sec.classList.remove("locked");
    sec.classList.add("unlocking");
    collectEyes();
    setTimeout(() => sec.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }), 120);
  }

  /* ================= AJÁNDÉKOK ================= */
  const programs = ["szallas", "vacsora", "zene"].sort(() => Math.random() - 0.5);
  const progIcon = { szallas: ["sym-suitcase", "0 0 120 175"], vacsora: ["sym-maki", "0 0 100 90"], zene: ["sym-banjo", "0 0 140 230"] };
  const progToast = { szallas: "🧳 Szállás Budapesten!", vacsora: "🍣 Korlátlan sushi!", zene: "🪕 Magyar Zene Háza!" };
  const gifts = $$(".gift");
  let opened = 0;
  gifts.forEach((g, i) => {
    g.dataset.prog = programs[i];
    g._taps = 0;
    const [id, vb] = progIcon[programs[i]];
    const inside = document.createElement("div");
    inside.className = "inside";
    inside.innerHTML = `<svg viewBox="${vb}"><use href="#${id}"/></svg>`;
    g.appendChild(inside);
    const slot = g.parentElement;
    const tag = $(".gift-tag", slot);
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    slot.appendChild(bubble);

    g.addEventListener("click", () => {
      if (g.classList.contains("open")) { sfx.boing(); say(bubble, pick(["Már ki vagyok bontva! 😄", "Csiki-csiki! 🤭", "Juhé! 🎉"])); return; }
      // A félénk zöld doboz először elugrik
      if (g.classList.contains("shy") && !g._shyDone && opened < 2) {
        g._shyDone = true;
        g.style.setProperty("--hx", `${-rand(30, 60)}px`);
        g.classList.add("hopaway");
        sfx.slide(false);
        say(bubble, "Jaj ne, engem a végére! 🙈", 2400);
        setTimeout(() => g.classList.remove("hopaway"), 1300);
        return;
      }
      g._taps++;
      const left = 3 - g._taps;
      if (left > 0) {
        tempClass(g, left === 2 ? "shake1" : "shake2", 600);
        sfx.knock();
        tag.textContent = left === 2 ? "Még 2 kopp!" : "Még egyet! 😬";
        say(bubble, left === 2 ? pick(["Ki az? 👀", "Hé, ez csikiz!", "Kopp-kopp, ki van ott?"]) : pick(["Mindjárt kipukkadok! 😵", "Érzem, jön…!", "Ajjaj, remegek!"]), 1500);
        return;
      }
      openGift(g, tag, bubble);
    });
  });

  function openGift(g, tag, bubble) {
    g.classList.add("open");
    opened++;
    sfx.pop();
    setTimeout(sfx.tada, 150);
    const [x, y] = centerOf(g);
    burst(x, y - 30, 110, { speed: 12, leaves: 0.25 });
    tag.textContent = "Kibontva! ✔";
    tag.classList.add("done");
    const prog = g.dataset.prog;
    say(bubble, progToast[prog], 2400);
    const card = $("#" + prog);
    $("#reveals").appendChild(card);
    setTimeout(() => {
      card.classList.add("show");
      collectEyes();
      if (prog === "vacsora") startBelt();
      card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    }, 900);
    if (opened === gifts.length) {
      setTimeout(() => {
        rain(160);
        toast("🎁 Mind a 3 ajándék kibontva! Gratula! 🎉", 3500);
        $("#toFinal").classList.remove("hidden");
      }, 1800);
    } else {
      setTimeout(() => toast(`Még ${gifts.length - opened} ajándék vár rád! 🎁`), 2600);
    }
  }

  $("#toFinal").addEventListener("click", () => {
    sfx.tada();
    unlock($("#final"));
    $("#toFinal").classList.add("hidden");
    setTimeout(() => {
      $("#signature").classList.add("write");
      rain(200);
    }, 900);
  });
  $("#again").addEventListener("click", () => { scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => location.reload(), 700); });

  /* ================= SZÁLLÁS: bőrönd + hotel ================= */
  const packing = ["👗", "🩴", "🪥", "🧸", "🛁", "😴", "🥂", "📸", "👒", "🧦"];
  const suitcase = $("#suitcase");
  suitcase.addEventListener("click", () => {
    tempClass(suitcase, "jump", 800);
    sfx.boing();
    const [x, y] = centerOf(suitcase);
    for (let i = 0; i < 5; i++) flyEmoji(pick(packing), x, y - 30, i * 70);
    if (!suitcase._n) toast("Bepakoltunk mindent… még a zoknit is 🧦");
    suitcase._n = (suitcase._n || 0) + 1;
  });
  function flyEmoji(ch, x, y, delay = 0) {
    setTimeout(() => {
      const e = document.createElement("div");
      e.className = "flyer";
      e.textContent = ch;
      document.body.appendChild(e);
      const vx = rand(-7, 7), vy0 = rand(-15, -10);
      let vy = vy0, cxx = x - 17, cyy = y - 17, rot = 0, t = 0;
      const vr = rand(-12, 12);
      const step = () => {
        t++;
        vy += 0.55;
        cxx += vx;
        cyy += vy;
        rot += vr;
        e.style.transform = `translate(${cxx}px, ${cyy}px) rotate(${rot}deg)`;
        e.style.opacity = Math.min(1, (70 - t) / 20);
        if (t < 70) requestAnimationFrame(step);
        else e.remove();
      };
      step();
    }, delay);
  }
  const hotel = $("#hotel");
  const wins = $(".wins", hotel);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const w = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    w.setAttribute("x", 44 + c * 30);
    w.setAttribute("y", 68 + r * 24);
    w.setAttribute("width", 22);
    w.setAttribute("height", 16);
    w.setAttribute("rx", 3);
    w.setAttribute("class", "win" + (Math.random() < 0.4 ? " lit" : ""));
    wins.appendChild(w);
  }
  hotel.addEventListener("click", (e) => {
    if (e.target.classList.contains("win")) {
      e.target.classList.toggle("lit");
      tone(e.target.classList.contains("lit") ? 880 : 440, 0.1, "square", 0.08);
      if ($$(".win.lit", hotel).length === 12) toast("Minden ablakban buli van! 🪩");
      if ($$(".win.lit", hotel).length === 0) toast("Mindenki alszik… 😴");
      return;
    }
    hotel.classList.toggle("night");
    const night = hotel.classList.contains("night");
    sfx.slide(!night);
    toast(night ? "Jó éjszakát, Budapest! 🌙" : "Jó reggelt! Kész a reggeli? ☀️");
    if (night) {
      const [x, y] = centerOf(hotel);
      ["Z", "z", "z"].forEach((z, i) => setTimeout(() => {
        const d = document.createElement("div");
        d.className = "zzz";
        d.textContent = z;
        d.style.left = x + 20 + i * 12 + "px";
        d.style.top = y - 40 - i * 10 + "px";
        document.body.appendChild(d);
        setTimeout(() => d.remove(), 2300);
      }, i * 300));
    }
  });

  /* ================= VACSORA: sushi futószalag ================= */
  const belt = $("#belt");
  let beltStarted = false;
  let eaten = 0;
  const eatQuips = {
    3: "Ez csak a bemelegítés 🍣", 7: "Hét szerencsés falat! 🍀", 12: "A szakács már izzad 😅",
    20: "Anya, a futószalag fél tőled! 😂", 30: "Korlátlan… de azért marad a desszertnek is hely? 🍰", 55: "55 sushi az 55. szülinapra! LEGENDA 🏆",
  };
  function startBelt() {
    if (beltStarted) return;
    beltStarted = true;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const b = document.createElement("button");
      b.className = "sushi";
      const nig = i % 2 === 1;
      b.setAttribute("aria-label", "Sushi – kapd el!");
      b.innerHTML = nig ? `<svg viewBox="0 0 110 80"><use href="#sym-nigiri"/></svg>` : `<svg viewBox="0 0 100 90"><use href="#sym-maki"/></svg>`;
      const dur = 12;
      b.style.setProperty("--dur", dur + "s");
      b.style.setProperty("--del", `${-(dur / n) * i}s`);
      b.addEventListener("click", (e) => {
        if (b.classList.contains("eaten")) return;
        b.classList.add("eaten");
        eaten++;
        sfx.chomp();
        const n = document.createElement("div");
        n.className = "nyam";
        n.textContent = pick(["Nyamm!", "Hamm!", "Mmm! 😋", "Csámm!", "Omnom!"]);
        n.style.left = e.clientX + "px";
        n.style.top = e.clientY + "px";
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 1000);
        const cnt = $("#eatCount");
        cnt.textContent = `Megevett sushi: ${eaten}`;
        tempClass(cnt, "bump", 500);
        if (eatQuips[eaten]) toast(eatQuips[eaten], 3000);
        burst(e.clientX, e.clientY, 10, { emoji: ["🍚", "✨", "🥢"], speed: 6 });
        setTimeout(() => b.classList.remove("eaten"), 2200); // korlátlan utánpótlás :)
      });
      belt.appendChild(b);
    }
  }

  /* ================= ZENE: zongora + bendzsó ================= */
  const notes = [
    ["G", 392.0, "#d7263d"], ["A", 440.0, "#e8742a"], ["H", 493.88, "#f5a524"], ["C", 523.25, "#f5c02e"],
    ["D", 587.33, "#8fb04a"], ["E", 659.25, "#3fae8c"], ["F", 698.46, "#3a86ff"], ["G", 783.99, "#b06ad9"],
  ];
  const keysEl = $("#keys");
  const keyEls = notes.map(([name, f, col], i) => {
    const k = document.createElement("button");
    k.className = "key";
    k.style.setProperty("--kc", col);
    k.textContent = name;
    k.setAttribute("aria-label", `Hang: ${name}`);
    k.addEventListener("pointerdown", (e) => { e.preventDefault(); playKey(i); });
    k.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playKey(i); } });
    keysEl.appendChild(k);
    return k;
  });
  const banjo = $("#banjo");
  function playKey(i, dur = 0.45) {
    const [, f, col] = notes[i];
    tone(f, dur, "triangle", 0.22);
    tone(f * 2, dur * 0.6, "sine", 0.05);
    const k = keyEls[i];
    tempClass(k, "down", 160);
    const r = k.getBoundingClientRect();
    flyNote(r.left + r.width / 2, r.top, col);
    tempClass(banjo, "strum", 400);
  }
  function flyNote(x, y, col) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    n.setAttribute("viewBox", "0 0 40 50");
    n.setAttribute("class", "note-fly");
    n.innerHTML = `<use href="#sym-note"/>`;
    n.style.color = col;
    n.style.left = x - 15 + "px";
    n.style.top = y - 30 + "px";
    n.style.setProperty("--nx", `${rand(-60, 60)}px`);
    n.style.setProperty("--nr", `${rand(-40, 40)}deg`);
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 1600);
  }
  banjo.addEventListener("click", () => {
    [0, 2, 4, 7].forEach((i, j) => setTimeout(() => playKey(i, 0.6), j * 45));
    if (!banjo._n) toast("Yeee-haw! 🤠🪕");
    banjo._n = 1;
  });
  // Boldog születésnapot dallam (G-dúr hangolás a 8 billentyűre)
  const song = [
    [0, .75], [0, .25], [1, 1], [0, 1], [3, 1], [2, 2],
    [0, .75], [0, .25], [1, 1], [0, 1], [4, 1], [3, 2],
    [0, .75], [0, .25], [7, 1], [5, 1], [3, 1], [2, 1], [1, 2],
    [6, .75], [6, .25], [5, 1], [3, 1], [4, 1], [3, 2.5],
  ];
  let playing = false;
  $("#playSong").addEventListener("click", () => {
    if (playing) return;
    playing = true;
    if (!soundOn) { soundOn = true; syncSoundBtn(); toast("Bekapcsoltam a hangot 🔊"); }
    const beat = 380;
    let t = 0;
    song.forEach(([i, d]) => { setTimeout(() => playKey(i, d * beat / 1000 + 0.1), t); t += d * beat; });
    setTimeout(() => {
      playing = false;
      const [x, y] = centerOf(banjo);
      burst(x, y, 80, { speed: 11 });
      toast("🎶 Boldog szülinapot, Anya! 🎶", 3000);
    }, t + 200);
  });

  /* ================= CSALÁD ================= */
  const famLines = {
    Ivett: ["Isten éltessen, Anya! 💛", "Te vagy a legjobb! 🌟"],
    Balázs: ["Boldog szülinapot! 🎉", "Sushi-verseny? Benne vagyok! 🍣"],
    Orsi: ["Nagyon szeretünk! 🧡", "Irány Budapest! 🚋"],
    "Sebő": ["Tök jó vagy, Anya! 🎃", "55? Nem látszik! 😎"],
  };
  $$(".fam").forEach((f) => {
    const b = document.createElement("span");
    b.className = "bubble";
    f.appendChild(b);
    let n = 0;
    f.addEventListener("click", () => {
      const lines = famLines[f.dataset.name];
      say(b, lines[n++ % lines.length]);
      tempClass(f, "boing", 700);
      tone(rand(500, 800), 0.2, "sine", 0.18, 0, 400);
      const [x, y] = centerOf(f);
      burst(x, y, 20, { emoji: ["💛", "🧡", "❤️", "🍂"], speed: 7 });
    });
  });

  /* ================= TÖKÖK ================= */
  const pkLines = ["Tök jó vagy! 🎃", "Tökéletes 55! ✨", "Tök boldog szülinapot!", "Tökmagnyi szeretet 🧡", "Tökre szeretünk!", "Ne bökdöss, csikis vagyok! 🤭"];
  const pumpkins = $("#pumpkins");
  const pkCount = Math.max(4, Math.min(9, Math.round(innerWidth / 150)));
  const jack = `<svg class="jack" viewBox="0 0 100 80"><path d="M20 30 l12 -14 l12 14z M56 30 l12 -14 l12 14z" fill="#3b1a0c"/><path d="M18 48 q32 30 64 0 l-8 6 l-6 -6 l-8 8 l-8 -8 l-8 8 l-8 -8 l-6 6z" fill="#3b1a0c"/></svg>`;
  for (let i = 0; i < pkCount; i++) {
    const p = document.createElement("button");
    p.className = "pk";
    p.setAttribute("aria-label", "Tök – bökd meg!");
    p.innerHTML = `<img src="assets/tok.webp" alt="">${jack}<span class="bubble"></span>`;
    p.style.transform = `scale(${rand(0.8, 1.05)}) rotate(${rand(-6, 6)}deg)`;
    p.style.zIndex = i % 2 ? 2 : 1;
    p.addEventListener("click", (e) => {
      tempClass(p, "bounce", 700);
      p.classList.toggle("lit");
      sfx.boing();
      say($(".bubble", p), pick(pkLines));
      burst(e.clientX, e.clientY, 16, { leaves: 0.6, speed: 7 });
    });
    pumpkins.appendChild(p);
  }

  /* ================= MÓKUS EASTER EGG ================= */
  const sq = $("#squirrel");
  const sqBubble = $(".sq-bubble", sq);
  let sqBusy = false;
  function squirrelPeek() {
    if (sqBusy || document.hidden) return;
    sq.style.bottom = `${rand(80, innerHeight * 0.55)}px`;
    sq.classList.add("peek");
    setTimeout(() => { if (!sqBusy) sq.classList.remove("peek"); }, 3200);
  }
  sq.addEventListener("click", () => {
    if (sqBusy) return;
    sqBusy = true;
    sq.classList.add("out");
    sfx.squeak();
    say(sqBubble, pick(["Boldog szülinapot! 🌰", "Hoztam makkot ajándékba! 🌰", "Psszt… én is jövök Pestre! 🐿️"]), 2000);
    const [x, y] = centerOf(sq);
    burst(x, y, 26, { emoji: ["🌰", "🍂", "✨"], speed: 9 });
    setTimeout(() => { sq.classList.remove("out", "peek"); sq.classList.add("run"); }, 2100);
    setTimeout(() => { sq.classList.remove("run"); sqBusy = false; }, 2800);
  });
  setTimeout(squirrelPeek, 9000);
  setInterval(squirrelPeek, 24000);

  /* ================= GÖRGETÉSI CSÍK ================= */
  const bar = $(".progress span");
  addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
  }, { passive: true });

  // nyitó konfetti
  setTimeout(() => burst(innerWidth / 2, innerHeight * 0.3, 80, { speed: 12, leaves: 0.3 }), 700);
})();
