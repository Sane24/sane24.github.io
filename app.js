// Portfolio logic — Design Component class, loaded by the DC runtime.
// Exposed as a factory so the inline <script data-dc-script> can build it
// with the runtime-injected DCLogic base class and React.
window.__PortfolioComponent = function (DCLogic, React) {
class Component extends DCLogic {
  state = { dark: false, selected: null, course: null, mode: null, cornerReady: false };

  _score = 0;
  _lookAccent = { blueprint: '#2C3BEA', riso: '#EA4E2B', analog: '#B5623A', brutal: '#4A3AEE', noir: '#B8945A' };
  _secRAF = []; _secCleanup = [];

  componentDidMount() {
    // hero background mode
    this._mode = this.props.heroMode || 'play';
    this.setState({ mode: this._mode });
    setTimeout(() => this._paintPills(), 0);

    // theme from storage
    try {
      const saved = localStorage.getItem('sane-theme');
      const dark = saved ? saved === 'dark' : false;
      this.setState({ dark });
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    } catch (e) {}

    // hero scene from storage
    try {
      this._look = 'blueprint';
    } catch (e) { this._look = 'blueprint'; }
    delete document.documentElement.dataset.look;
    setTimeout(() => this._paintLooks(), 0);

    // scroll reveals — content is visible by default; hide via JS first so a
    // throttled/non-painting environment never leaves it invisible.
    const els = Array.from(document.querySelectorAll('[data-reveal]'));
    const reveal = (el) => { el.style.opacity = '1'; el.style.transform = 'none'; };
    els.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(28px)'; });
    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { reveal(en.target); this._io.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      els.forEach((el) => this._io.observe(el));
      // safety: force everything visible after a moment (no transition, so it
      // can't get stuck "pending" in a throttled/non-painting environment).
      this._safety = setTimeout(() => els.forEach((el) => {
        el.style.transition = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
      }), 1400);
    } else {
      els.forEach(reveal);
    }

    // auto party-popper: fire one burst when the Leadership section scrolls into view
    if ('IntersectionObserver' in window) {
      const lead = document.getElementById('popper-sentinel');
      if (lead) {
        this._popIo = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) { this._popSeenOut = true; return; }
            // only fire on a genuine scroll-in (must have been out of view first)
            if (this._popSeenOut) { this._popIo.disconnect(); setTimeout(() => { this._autoPop = true; }, 400); }
          });
        }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
        this._popIo.observe(lead);
      }
    }

    this._startCanvas();
    setTimeout(() => {
      this._sectionCanvas(this._aboutCv, this._scAbout);
      this._sectionCanvas(this._armCv, this._scArm);
      this._sectionCanvas(this._floraL, this._scFlora);
      this._sectionCanvas(this._floraR, this._scFlora);
      this._sectionCanvas(this._confettiCv, this._scConfetti);
      this._sectionCanvas(this._grassCv, this._scGrass);
      const rose = "<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 34 34'><g transform='translate(17,17)'><g fill='#2C3BEA'><ellipse cx='0' cy='-10' rx='5' ry='7'/><ellipse cx='0' cy='-10' rx='5' ry='7' transform='rotate(72)'/><ellipse cx='0' cy='-10' rx='5' ry='7' transform='rotate(144)'/><ellipse cx='0' cy='-10' rx='5' ry='7' transform='rotate(216)'/><ellipse cx='0' cy='-10' rx='5' ry='7' transform='rotate(288)'/></g><g fill='#6E83FF'><ellipse cx='0' cy='-5' rx='3.2' ry='4.6' transform='rotate(36)'/><ellipse cx='0' cy='-5' rx='3.2' ry='4.6' transform='rotate(108)'/><ellipse cx='0' cy='-5' rx='3.2' ry='4.6' transform='rotate(180)'/><ellipse cx='0' cy='-5' rx='3.2' ry='4.6' transform='rotate(252)'/><ellipse cx='0' cy='-5' rx='3.2' ry='4.6' transform='rotate(324)'/></g><circle cx='0' cy='0' r='3' fill='#1E2AA8'/><circle cx='0' cy='0' r='1.3' fill='#9DB0FF'/></g></svg>";
      const roseCur = 'url("data:image/svg+xml,' + encodeURIComponent(rose) + '") 16 16, auto';
      const pj = document.getElementById('projects');
      if (pj) pj.style.cursor = roseCur;
      [this._floraL, this._floraR, this._grassCv].forEach((cv) => { if (cv) { cv.style.cursor = roseCur; cv.style.pointerEvents = 'auto'; } });
    }, 0);
  }

  componentDidUpdate(prev) {
    if (prev.heroMode !== this.props.heroMode && this.props.heroMode) {
      this._mode = this.props.heroMode;
    }
    if (prev.look !== this.props.look && this.props.look) { this.setLook(this.props.look); }
    this._paintPills();
    this._paintLooks();
  }

  componentWillUnmount() {
    if (this._io) this._io.disconnect();
    if (this._safety) clearTimeout(this._safety);
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onMove) window.removeEventListener('pointermove', this._onMove);
    if (this._ro) this._ro.disconnect();
    (this._secRAF || []).forEach((id) => cancelAnimationFrame(id));
    (this._secCleanup || []).forEach((fn) => { try { fn(); } catch (e) {} });
  }

  _startCanvas() {
    const cv = this._canvas;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, on: false };
    const gap = 38;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // spawn the ball just after the "E" in SANE, matching the N–E gap
      const letters = document.querySelectorAll('#sane-letters > *');
      const b = this._ball;
      if (b && w > 0 && letters.length >= 4 && letters[3].firstElementChild && letters[2].firstElementChild) {
        const Eb = letters[3].firstElementChild.getBoundingClientRect();
        const Nb = letters[2].firstElementChild.getBoundingClientRect();
        const g = Math.max(24, Eb.left - Nb.right);
        this._spawn = {
          x: Math.min(w - b.r - 8, (Eb.right - r.left) + g + b.r),
          y: (Eb.top - r.top) + Eb.height / 2,
        };
        if (!this._spawned) { b.x = this._spawn.x; b.y = this._spawn.y; b.vx = 0; b.vy = 0; this._spawned = true; }
      }
      // park the F1 car just to the right of the subtitle line
      const sub = document.getElementById('hero-subtitle');
      const c = this._car;
      if (c && w > 0 && sub) {
        const sr = sub.getBoundingClientRect();
        this._carHome = {
          x: Math.min(w - 40, (sr.right - r.left) + 46),
          y: (sr.top - r.top) + sr.height / 2,
        };
        if (!this._carParked) { c.x = this._carHome.x; c.y = this._carHome.y; c.speed = 0; this._carParked = true; }
      }
    };
    resize();
    this._onResize = resize;
    window.addEventListener('resize', resize);
    // canvas often measures 0×0 before first layout — re-measure on next frame + on any size change
    requestAnimationFrame(resize);
    if ('ResizeObserver' in window) { this._ro = new ResizeObserver(() => resize()); this._ro.observe(cv); }
    this._onMove = (e) => {
      const r = cv.getBoundingClientRect();
      const nx = e.clientX - r.left, ny = e.clientY - r.top;
      mouse.vx = nx - mouse.x; mouse.vy = ny - mouse.y;
      mouse.x = nx; mouse.y = ny;
      mouse.on = nx >= 0 && nx <= w && ny >= 0 && ny <= h;
    };
    window.addEventListener('pointermove', this._onMove);

    // ---- interactive objects (share the dot grid as a base) ----
    const car = { x: w * 0.6 || 300, y: h * 0.285 || 160, angle: 0, speed: 0 };
    const carTrail = [];
    const ball = { x: w * 0.62 || 460, y: h * 0.42 || 200, vx: 0, vy: 0, rot: 0, r: 22, shot: 0 };
    this._car = car; this._ball = ball;
    const pal = {};

    const goalGeom = () => { const gh = Math.min(180, h * 0.34); return { gy0: h / 2 - gh / 2, gy1: h / 2 + gh / 2, netX: w - 26 }; };

    const updateCar = () => {
      const dx = mouse.x - car.x, dy = mouse.y - car.y;
      const dist = Math.hypot(dx, dy);
      // drive only while the cursor is on-canvas AND meaningfully away; otherwise park
      if (mouse.on && dist > 8) {
        const target = Math.atan2(dy, dx);
        let da = target - car.angle;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        car.angle += da * 0.1;
        const want = Math.min(dist * 0.08, 8);
        car.speed += (want - car.speed) * 0.12;
      } else {
        car.speed += (0 - car.speed) * 0.25;
        if (car.speed < 0.06) car.speed = 0;
      }
      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;
      car.x = Math.max(34, Math.min(w - 34, car.x));
      car.y = Math.max(34, Math.min(h - 34, car.y));
      // racing-line trail grows while moving, fades once parked
      if (car.speed > 0.7) {
        carTrail.push({ x: car.x - Math.cos(car.angle) * 20, y: car.y - Math.sin(car.angle) * 20 });
        if (carTrail.length > 30) carTrail.shift();
      } else if (carTrail.length) {
        carTrail.shift();
      }
    };

    const drawCarBody = () => {
      ctx.lineCap = 'round';
      for (let i = 1; i < carTrail.length; i++) {
        ctx.strokeStyle = pal.accent;
        ctx.globalAlpha = (i / carTrail.length) * 0.4 * Math.min(1, car.speed / 3);
        ctx.lineWidth = (i / carTrail.length) * 4;
        ctx.beginPath(); ctx.moveTo(carTrail[i - 1].x, carTrail[i - 1].y); ctx.lineTo(carTrail[i].x, carTrail[i].y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(car.x, car.y); ctx.rotate(car.angle);
      ctx.fillStyle = pal.ink; ctx.globalAlpha = 0.92;
      const wheel = (wx, wy) => { ctx.beginPath(); ctx.roundRect(wx - 5, wy - 3.5, 10, 7, 2); ctx.fill(); };
      wheel(11, -11); wheel(11, 11); wheel(-13, -11); wheel(-13, 11);
      ctx.fillRect(20, -12, 5, 24);
      ctx.fillRect(-25, -13, 5, 26);
      ctx.fillStyle = pal.accent; ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(24, 0); ctx.lineTo(11, -6); ctx.lineTo(-18, -8.5);
      ctx.lineTo(-22, 0); ctx.lineTo(-18, 8.5); ctx.lineTo(11, 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal.ink; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.ellipse(-3, 0, 6, 4.2, 0, 0, 6.2832); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    };

    const updateBall = () => {
      if (ball.shot > 0) {
        // powered homing corner kick — curls toward the goal mouth
        const dx = (w + 8) - ball.x, dy = h / 2 - ball.y, d = Math.hypot(dx, dy) || 1, spd = 6;
        ball.vx += ((dx / d * spd) - ball.vx) * 0.04;
        ball.vy += ((dy / d * spd) - ball.vy) * 0.04;
        ball.vx *= 0.995; ball.vy *= 0.995; ball.shot--;
      } else {
        ball.vx *= 0.976; ball.vy *= 0.976;
      }
      // collide with the car: kick when driven into, bounce when it rolls in, rest when both still
      const cdx = ball.x - car.x, cdy = ball.y - car.y, cd = Math.hypot(cdx, cdy) || 1;
      const hit = ball.r + 22;
      if (cd < hit) {
        const nx = cdx / cd, ny = cdy / cd;
        ball.x = car.x + nx * hit; ball.y = car.y + ny * hit;
        const cvx = Math.cos(car.angle) * car.speed, cvy = Math.sin(car.angle) * car.speed;
        const vdotn = ball.vx * nx + ball.vy * ny;
        if (vdotn < 0) { ball.vx -= 2 * vdotn * nx; ball.vy -= 2 * vdotn * ny; ball.vx *= 0.7; ball.vy *= 0.7; }
        const carPush = cvx * nx + cvy * ny;
        if (carPush > 0) { const p = carPush * 0.95 + (car.speed > 0.5 ? 1.2 : 0); ball.vx += nx * p; ball.vy += ny * p; }
      }
      // speed scales with the car, capped (except during a powered corner kick)
      const bs = Math.hypot(ball.vx, ball.vy); if (ball.shot <= 0 && bs > 9) { ball.vx = ball.vx / bs * 9; ball.vy = ball.vy / bs * 9; }
      else if (ball.shot > 0 && bs > 6.5) { ball.vx = ball.vx / bs * 6.5; ball.vy = ball.vy / bs * 6.5; }
      ball.x += ball.vx; ball.y += ball.vy;
      const r = ball.r;
      if (ball.x < r) { ball.x = r; ball.vx *= -0.72; }
      const gg = goalGeom();
      if (ball.x + r >= w) {
        if (ball.y > gg.gy0 && ball.y < gg.gy1) { this._scoreGoal(); return; }
        ball.x = w - r; ball.vx *= -0.72;
      }
      if (ball.y < r) { ball.y = r; ball.vy *= -0.72; }
      if (ball.y > h - r) { ball.y = h - r; ball.vy *= -0.72; }
      ball.rot += (ball.vx >= 0 ? 1 : -1) * Math.hypot(ball.vx, ball.vy) / r;
      // ball sitting in the actual top-right or bottom-right corner of the hero → offer a corner kick
      const inRightCorner = ball.x > w - r - 160 && (ball.y < r + 160 || ball.y > h - r - 160);
      if (ball.shot <= 0 && inRightCorner) {
        this._cornerHold = 60;                       // keep the offer alive through jitter
        this._cornerT = (this._cornerT || 0) + 1;
        if (this._cornerT > 4 && !this._cornerReady) this._setCorner(true);
      } else {
        this._cornerT = 0;
        if (this._cornerReady) {
          this._cornerHold = (this._cornerHold || 0) - 1;
          if (this._cornerHold <= 0) this._setCorner(false);
        }
      }
      // left side: never let it wedge in a corner — nudge it back into open play
      const nearTB = ball.y < r + 120 || ball.y > h - r - 120;
      if (ball.shot <= 0 && ball.x < r + 110 && nearTB) {
        this._leftT = (this._leftT || 0) + 1;
        if (this._leftT > 20) { ball.vx += 2.6; ball.vy += (ball.y > h / 2 ? -1.8 : 1.8); this._leftT = 0; }
      } else { this._leftT = 0; }
    };

    const drawBallBody = () => {
      const r = ball.r;
      ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.ellipse(ball.x, ball.y + r * 0.92, r * 0.86, r * 0.26, 0, 0, 6.2832); ctx.fill();
      ctx.save(); ctx.translate(ball.x, ball.y); ctx.rotate(ball.rot);
      // white leather base
      ctx.fillStyle = '#F4F3EF';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
      // clip everything to the ball so rim panels read as partial pentagons
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.clip();
      const pentPath = (cx, cy, pr, rot) => {
        ctx.beginPath();
        for (let k = 0; k < 5; k++) { const a = rot - Math.PI / 2 + k * 2 * Math.PI / 5; const px = cx + Math.cos(a) * pr, py = cy + Math.sin(a) * pr; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.closePath();
      };
      const cPr = r * 0.38;           // central pentagon radius
      const oPr = r * 0.34;           // outer pentagon radius
      const oDist = r * 1.0;          // outer pentagon centre distance
      // ball is always white leather, so its markings stay dark in both themes
      const ballDark = '#1A1915';
      // seams: from each central-pentagon vertex out to the rim
      ctx.strokeStyle = ballDark; ctx.globalAlpha = 0.5; ctx.lineWidth = r * 0.06; ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + k * 2 * Math.PI / 5;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * cPr, Math.sin(a) * cPr); ctx.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1); ctx.stroke();
      }
      // outer black pentagons, offset 36° so they sit between the seams
      ctx.fillStyle = ballDark; ctx.globalAlpha = 0.95;
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + Math.PI / 5 + k * 2 * Math.PI / 5;
        pentPath(Math.cos(a) * oDist, Math.sin(a) * oDist, oPr, a + Math.PI / 2);
        ctx.fill();
      }
      // central black pentagon (drawn last, on top)
      ctx.fillStyle = ballDark; ctx.globalAlpha = 0.95;
      pentPath(0, 0, cPr, 0); ctx.fill();
      ctx.restore(); // undo clip
      // rim + gloss
      ctx.strokeStyle = ballDark; ctx.globalAlpha = 0.9; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.ellipse(-r * 0.36, -r * 0.4, r * 0.24, r * 0.14, -0.6, 0, 6.2832); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    };

    const drawGoal = () => {
      const g = goalGeom();
      const flash = this._goalFlash ? Math.max(0, 1 - (performance.now() - this._goalFlash) / 750) : 0;
      // net mesh
      ctx.strokeStyle = pal.ink; ctx.lineWidth = 1; ctx.globalAlpha = 0.14 + flash * 0.5;
      for (let y = g.gy0; y <= g.gy1; y += 9) { ctx.beginPath(); ctx.moveTo(g.netX, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let x = g.netX; x <= w; x += 9) { ctx.beginPath(); ctx.moveTo(x, g.gy0); ctx.lineTo(x, g.gy1); ctx.stroke(); }
      // frame (posts + crossbars)
      ctx.strokeStyle = flash > 0 ? pal.accent : pal.ink;
      ctx.globalAlpha = flash > 0 ? 0.7 + flash * 0.3 : 0.5; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(g.netX, g.gy0); ctx.lineTo(w, g.gy0);
      ctx.moveTo(g.netX, g.gy1); ctx.lineTo(w, g.gy1);
      ctx.moveTo(g.netX, g.gy0); ctx.lineTo(g.netX, g.gy1);
      ctx.stroke();
      // score readout + celebration
      ctx.globalAlpha = 1; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = pal.muted; ctx.font = "600 12px 'JetBrains Mono', monospace";
      ctx.fillText('GOALS · ' + (this._score || 0), w - 10, g.gy0 - 14);
      if (flash > 0) { ctx.globalAlpha = flash; ctx.fillStyle = pal.accent; ctx.font = "700 18px 'Space Grotesk', system-ui, sans-serif"; ctx.fillText('GOAL!', w - 10, g.gy0 - 32); ctx.globalAlpha = 1; }
      ctx.textAlign = 'left';
    };

    // combined play: drive the F1 car with your cursor to knock the ball into the goal
    const drawPlay = () => {
      if (this._mode !== 'blueprint') drawPenalty();
      updateCar();
      updateBall();
      drawGoal();
      drawBallBody();
      drawCarBody();
      drawRose();
    };

    // ===== alternate hero scenes (selected by this._look) =====
    const FMONO = "'JetBrains Mono', monospace";
    let scenePhase = 0, vFeat = null, petals = [], vines = null, icoData = null;
    const arm = { a: -1.15, b: 1.0 };
    const rot3s = (p, ax, ay) => {
      const cy = Math.cos(ay), sy = Math.sin(ay);
      const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy;
      const cx = Math.cos(ax), sx = Math.sin(ax);
      return { x: x1, y: p.y * cx - z1 * sx, z: p.y * sx + z1 * cx };
    };

    const drawGrid = () => {
      const cols = Math.ceil(w / gap) + 1, rows = Math.ceil(h / gap) + 1;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = i * gap, y = j * gap, d = Math.hypot(x - mouse.x, y - mouse.y), R = 150;
        if (d < R) { const t = 1 - d / R; ctx.fillStyle = pal.accent; ctx.globalAlpha = 0.25 + t * 0.75; ctx.beginPath(); ctx.arc(x, y, 1 + t * 3.2, 0, 6.2832); ctx.fill(); }
        else { ctx.fillStyle = pal.dot; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 1, 0, 6.2832); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    };

    // 1) COMPUTER VISION — feature points, matches, tracking box
    const drawVision = () => {
      if (!vFeat || vFeat._w !== w) { vFeat = Array.from({ length: 66 }, () => ({ x: Math.random() * w, y: Math.random() * h, p: Math.random() * 6.28 })); vFeat._w = w; }
      scenePhase += 0.016;
      for (const f of vFeat) {
        const jx = Math.cos(scenePhase + f.p) * 1.4, jy = Math.sin(scenePhase + f.p) * 1.4, d = Math.hypot(f.x - mouse.x, f.y - mouse.y);
        ctx.strokeStyle = pal.ink; ctx.globalAlpha = d < 160 ? 0.5 : 0.16; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(f.x + jx - 3, f.y + jy); ctx.lineTo(f.x + jx + 3, f.y + jy); ctx.moveTo(f.x + jx, f.y + jy - 3); ctx.lineTo(f.x + jx, f.y + jy + 3); ctx.stroke();
        if (mouse.on && d < 150) { ctx.strokeStyle = pal.accent; ctx.globalAlpha = (1 - d / 150) * 0.55; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      }
      const scanY = (scenePhase * 42) % h;
      ctx.strokeStyle = pal.accent; ctx.globalAlpha = 0.22; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(w, scanY); ctx.stroke();
      ctx.globalAlpha = 1;
      if (!this._vbox) this._vbox = { x: w / 2, y: h / 2 };
      const tx = mouse.on ? mouse.x : w / 2, ty = mouse.on ? mouse.y : h / 2;
      this._vbox.x += (tx - this._vbox.x) * 0.12; this._vbox.y += (ty - this._vbox.y) * 0.12;
      const bw = 138, bh = 96, L = this._vbox.x - bw / 2, T = this._vbox.y - bh / 2, c = 15;
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.95;
      const brk = (x, y, sx, sy) => { ctx.beginPath(); ctx.moveTo(x + sx * c, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * c); ctx.stroke(); };
      brk(L, T, 1, 1); brk(L + bw, T, -1, 1); brk(L, T + bh, 1, -1); brk(L + bw, T + bh, -1, -1);
      ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(this._vbox.x - 8, this._vbox.y); ctx.lineTo(this._vbox.x + 8, this._vbox.y); ctx.moveTo(this._vbox.x, this._vbox.y - 8); ctx.lineTo(this._vbox.x, this._vbox.y + 8); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = pal.accent; ctx.fillRect(L, T - 17, 88, 14);
      ctx.fillStyle = pal.bg2; ctx.font = "600 10px " + FMONO; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      ctx.fillText('SUBJECT 0.97', L + 5, T - 6); ctx.globalAlpha = 1;
    };

    // 2) ROBOTICS — 2-link inverse-kinematics arm reaching for the cursor
    const drawRobotics = () => {
      const bx = w * 0.5, by = h - 26, L1 = Math.min(w, h) * 0.26, L2 = Math.min(w, h) * 0.23;
      let tx = mouse.on ? mouse.x : w * 0.5 + Math.cos(scenePhase) * 120, ty = mouse.on ? mouse.y : h * 0.4;
      scenePhase += 0.006;
      let dx = tx - bx, dy = ty - by, dist = Math.hypot(dx, dy);
      const maxR = (L1 + L2) * 0.98, minR = Math.abs(L1 - L2) + 10;
      if (dist > maxR) { tx = bx + dx / dist * maxR; ty = by + dy / dist * maxR; } else if (dist < minR) { const a = Math.atan2(dy, dx); tx = bx + Math.cos(a) * minR; ty = by + Math.sin(a) * minR; }
      dx = tx - bx; dy = ty - by;
      const a2 = Math.acos(Math.min(1, Math.max(-1, (dx * dx + dy * dy - L1 * L1 - L2 * L2) / (2 * L1 * L2))));
      const a1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(a2), L1 + L2 * Math.cos(a2));
      arm.a += (a1 - arm.a) * 0.16; arm.b += (a2 - arm.b) * 0.16;
      const ex = bx + Math.cos(arm.a) * L1, ey = by + Math.sin(arm.a) * L1, hx = ex + Math.cos(arm.a + arm.b) * L2, hy = ey + Math.sin(arm.a + arm.b) * L2;
      ctx.strokeStyle = pal.dot; ctx.globalAlpha = 1; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, by + 5); ctx.lineTo(w, by + 5); ctx.stroke();
      ctx.fillStyle = pal.ink; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.roundRect(bx - 28, by, 56, 18, 3); ctx.fill();
      ctx.lineCap = 'round'; ctx.strokeStyle = pal.ink; ctx.globalAlpha = 0.9; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = pal.bg2; ctx.strokeStyle = pal.ink; ctx.lineWidth = 2; [[bx, by], [ex, ey]].forEach(([jx, jy]) => { ctx.beginPath(); ctx.arc(jx, jy, 6, 0, 6.28); ctx.fill(); ctx.stroke(); });
      const ga = arm.a + arm.b, gpx = Math.cos(ga), gpy = Math.sin(ga), px = -gpy, py = gpx;
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hx + px * 7, hy + py * 7); ctx.lineTo(hx + px * 7 + gpx * 12, hy + py * 7 + gpy * 12); ctx.moveTo(hx - px * 7, hy - py * 7); ctx.lineTo(hx - px * 7 + gpx * 12, hy - py * 7 + gpy * 12); ctx.stroke();
      ctx.strokeStyle = pal.accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tx, ty, 11, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1;
    };

    // 3) FLORA — vines that sway toward the cursor, drifting petals on movement
    const drawFlora = () => {
      if (!vines || vines._w !== w) { vines = Array.from({ length: 5 }, (_, i) => ({ x: w * (0.13 + 0.185 * i), seg: 9 + (i % 3), ph: i * 1.3 })); vines._w = w; }
      scenePhase += 0.01;
      const lean = mouse.on ? (mouse.x / w - 0.5) : 0;
      ctx.lineCap = 'round';
      for (const v of vines) {
        let x = v.x, y = h + 4, ang = -Math.PI / 2, len = Math.min(h * 0.52, 300) / v.seg;
        for (let s = 0; s < v.seg; s++) {
          ang += Math.sin(scenePhase * 1.3 + v.ph + s * 0.5) * 0.09 + lean * 0.1 * (s / v.seg);
          const nx = x + Math.cos(ang) * len, ny = y + Math.sin(ang) * len;
          ctx.strokeStyle = pal.ink; ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(1, 5 * (1 - s / v.seg));
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke();
          if (s % 2 === 1) { ctx.save(); ctx.translate(nx, ny); ctx.rotate(ang + (s % 4 ? 0.6 : -0.6)); ctx.fillStyle = pal.accent; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(6, 0, 7, 3, 0, 0, 6.28); ctx.fill(); ctx.restore(); }
          x = nx; y = ny;
        }
        ctx.fillStyle = pal.accent; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (mouse.on && Math.hypot(mouse.vx, mouse.vy) > 3 && petals.length < 64) petals.push({ x: mouse.x, y: mouse.y, vx: (Math.random() - 0.5) * 0.7, vy: -0.5 - Math.random(), r: 3 + Math.random() * 3, life: 1, rot: Math.random() * 6.28 });
      for (let i = petals.length - 1; i >= 0; i--) { const p = petals[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.008; p.life -= 0.006; p.rot += 0.03; if (p.life <= 0) { petals.splice(i, 1); continue; } ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = pal.accent; ctx.globalAlpha = p.life * 0.6; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, 6.28); ctx.fill(); ctx.restore(); }
      ctx.globalAlpha = 1;
    };

    // 4) 3D / VR — rotating wireframe icosahedron + perspective floor grid
    const drawGraphics = () => {
      scenePhase += 0.006;
      const hz = h * 0.5;
      ctx.strokeStyle = pal.ink; ctx.globalAlpha = 0.13; ctx.lineWidth = 1;
      for (let i = 1; i <= 9; i++) { const y = hz + (h - hz) * (i / 9) * (i / 9); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      for (let i = -9; i <= 9; i++) { const x = w / 2 + i * 74; ctx.beginPath(); ctx.moveTo(w / 2 + (x - w / 2) * 0.16, hz); ctx.lineTo(x, h); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (!icoData) { const t = 1.618; const V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => ({ x: v[0], y: v[1], z: v[2] })); const E = []; for (let a = 0; a < 12; a++) for (let b = a + 1; b < 12; b++) if (Math.abs(Math.hypot(V[a].x - V[b].x, V[a].y - V[b].y, V[a].z - V[b].z) - 2) < 0.1) E.push([a, b]); icoData = { V, E }; }
      const gx = w > 720 ? w * 0.72 : w * 0.5, gcy = h * 0.4, R = Math.min(w, h) * 0.2;
      const ay = scenePhase + (mouse.on ? (mouse.x - gx) / w : 0), ax = 0.4 + (mouse.on ? (mouse.y - gcy) / h * 0.6 : 0);
      const pr = icoData.V.map(v => rot3s(v, ax, ay));
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 1.2;
      for (const [a, b] of icoData.E) { const pa = pr[a], pb = pr[b], za = (pa.z + pb.z) / 2; ctx.globalAlpha = 0.18 + (za * 0.5 + 0.5) * 0.6; ctx.beginPath(); ctx.moveTo(gx + pa.x / 2 * R, gcy - pa.y / 2 * R); ctx.lineTo(gx + pb.x / 2 * R, gcy - pb.y / 2 * R); ctx.stroke(); }
      for (const p of pr) { ctx.fillStyle = pal.ink; ctx.globalAlpha = 0.3 + (p.z * 0.5 + 0.5) * 0.6; ctx.beginPath(); ctx.arc(gx + p.x / 2 * R, gcy - p.y / 2 * R, 2, 0, 6.28); ctx.fill(); }
      ctx.globalAlpha = 1;
    };

    // 5) STADIUM — blooming blue rose, grandstand at the top, grass + flowers at the bottom,
    //    and a faint soccer/F1 playfield under the game with shot telemetry
    let bp = null;
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const easeOut = (v) => v <= 0 ? 0 : v >= 1 ? 1 : 1 - Math.pow(1 - v, 3);

    // shared blue rose — blooms above the headline in any hero mode, not just Stadium
    let roseState = null;
    const drawRose = () => {
      if (!roseState) roseState = { born: performance.now(), fall: [], t: 0 };
      if (this._bloomReset) { this._bloomReset = false; roseState.born = performance.now(); roseState.fall = []; }
      roseState.t += 0.008;
      const t = roseState.t;
      // --- blue rose blooming from the top-left (hand-drawn, reference-inspired), anchored above the headline ---
      const bloom = Math.min(1, (performance.now() - roseState.born) / 2600);
      if (!this._heroH1 || !this._heroH1.isConnected) this._heroH1 = document.querySelector('#top h1');
      let roseLimit = h * .3;
      if (this._heroH1) { roseLimit = (this._heroH1.getBoundingClientRect().top - cv.getBoundingClientRect().top) - 46; }
      const rs = clamp01((roseLimit - 20) / 110);
      const s = .34 + rs * .66;
      const reach = 40 * s;
      const rx = 26 + 60 * s;
      const ry = Math.max(reach * .7, Math.min(reach + 60 * s, roseLimit - reach - 4));
      const RC = { outline: '#101c36', deep: '#1b3f8f', mid: '#2f7fe0', light: '#66c9f4', pale: '#b9ecff' };
      const q = (a, b, c2, u2) => (1 - u2) * (1 - u2) * a + 2 * (1 - u2) * u2 * b + u2 * u2 * c2;
      const sp = easeOut(Math.min(1, bloom * 1.6));
      // thorny stem growing in from the corner
      ctx.strokeStyle = RC.outline; ctx.globalAlpha = .8; ctx.lineWidth = 2.2 * s + .6; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) { const u2 = (i / 24) * sp; const px = q(-4, rx * .7, rx, u2), py = q(-4, ry * .15, ry, u2); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
      [.36, .62].forEach((u2, i2) => {
        if (sp < u2 + .08) return;
        const px = q(-4, rx * .7, rx, u2), py = q(-4, ry * .15, ry, u2);
        ctx.fillStyle = RC.outline;
        ctx.beginPath(); ctx.moveTo(px - 3, py + 1); ctx.lineTo(px + (i2 ? 3 : -1), py + (i2 ? 7 : 8)); ctx.lineTo(px + 3, py + 1); ctx.closePath(); ctx.fill();
      });
      if (sp > .55) {
        const px = q(-4, rx * .7, rx, .5), py = q(-4, ry * .15, ry, .5);
        ctx.save(); ctx.translate(px, py); ctx.rotate(1.15); ctx.globalAlpha = .9 * easeOut((sp - .55) / .45);
        ctx.fillStyle = RC.deep; ctx.strokeStyle = RC.outline; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(10 * s + 4, 0, 9 * s + 3, 3.6 * s + 1.4, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(17 * s + 5, 0); ctx.stroke();
        ctx.restore(); ctx.globalAlpha = 1;
      }
      // rose head — layered outlined petals with light rims + a spiral bud, unfurling inside-out
      const petal = (ang, dist, pw, plh, open, fillA, fillB) => {
        ctx.save(); ctx.rotate(ang); ctx.translate(0, -dist * open); ctx.scale(open, open); ctx.rotate((1 - open) * .6);
        ctx.beginPath();
        ctx.moveTo(0, plh * .45);
        ctx.bezierCurveTo(-pw, plh * .3, -pw * 1.05, -plh * .5, 0, -plh);
        ctx.bezierCurveTo(pw * 1.05, -plh * .5, pw, plh * .3, 0, plh * .45);
        ctx.closePath();
        ctx.fillStyle = fillA; ctx.fill();
        ctx.strokeStyle = RC.outline; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, plh * .28);
        ctx.bezierCurveTo(-pw * .55, plh * .16, -pw * .6, -plh * .34, 0, -plh * .62);
        ctx.bezierCurveTo(pw * .6, -plh * .34, pw * .55, plh * .16, 0, plh * .28);
        ctx.closePath();
        ctx.fillStyle = fillB; ctx.globalAlpha = .85; ctx.fill(); ctx.globalAlpha = 1;
        ctx.restore();
      };
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(Math.sin(t * .5) * .05); ctx.scale(s, s); ctx.globalAlpha = .95;
      const o1 = easeOut(clamp01(bloom * 2.6 - 1.6));
      const o2 = easeOut(clamp01(bloom * 2.6 - .8));
      const o3 = easeOut(clamp01(bloom * 2.6));
      if (o1 > 0) for (let k = 0; k < 6; k++) petal(k * 1.047 + .3, 20, 13, 18, o1, RC.deep, RC.mid);
      if (o2 > 0) for (let k = 0; k < 5; k++) petal(k * 1.257 + .9, 12, 10.5, 14, o2, RC.mid, RC.light);
      if (o3 > 0) for (let k = 0; k < 4; k++) petal(k * 1.571 + .4, 6, 8, 10.5, o3, RC.light, RC.pale);
      if (o3 > 0) {
        ctx.fillStyle = RC.mid; ctx.globalAlpha = o3 * .95;
        ctx.beginPath(); ctx.arc(0, 0, 5.5 * o3, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = RC.outline; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.globalAlpha = o3;
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) { const a2 = i / 30 * 4.4; const rr2 = .4 + a2 * 1.25 * o3; const px = Math.cos(a2 + 1) * rr2, py = Math.sin(a2 + 1) * rr2; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke();
      }
      ctx.restore(); ctx.globalAlpha = 1;
      // petals drift down from the bloom
      if (bloom >= 1 && roseState.fall.length < 6 && Math.random() < .012) roseState.fall.push({ x: rx + (Math.random() - .5) * reach, y: ry + reach * .4, vy: .35 + Math.random() * .3, ph: Math.random() * 6.28, r: (3 + Math.random() * 2.5) * s, rot: Math.random() * 6.28 });
      for (let i = roseState.fall.length - 1; i >= 0; i--) {
        const p = roseState.fall[i]; p.y += p.vy; p.x += Math.sin(t * 2 + p.ph) * .5; p.rot += .02;
        if (p.y > h - 24) { roseState.fall.splice(i, 1); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = pal.accent; ctx.globalAlpha = Math.min(.5, (1 - p.y / h) * .8); ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.2832); ctx.fill(); ctx.restore();
      }
    };

    const drawPenalty = () => {
      const gg = goalGeom();
      const inX = 26;
      ctx.strokeStyle = pal.ink; ctx.globalAlpha = .1; ctx.lineWidth = 1.4;
      const bxW = Math.min(150, w * .14), bxH = (gg.gy1 - gg.gy0) + 110;
      ctx.strokeRect(w - inX - bxW, h / 2 - bxH / 2, bxW, bxH);
      const sixW = bxW * .45, sixH = (gg.gy1 - gg.gy0) + 30;
      ctx.strokeRect(w - inX - sixW, h / 2 - sixH / 2, sixW, sixH);
      const spX = w - inX - bxW * .62;
      ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.arc(spX, h / 2, 2.2, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(spX, h / 2, 46, Math.PI * .68, Math.PI * 1.32); ctx.stroke();
      ctx.globalAlpha = 1;
    };

    // blue butterfly — flies in, lands on the E in SANE and sits still (drawn above the car)
    const drawButterfly = () => {
      if (!bp) return;
      const nowB = performance.now();
      if (!bp.bfStart) bp.bfStart = bp.born + 900;
      const sane = document.querySelectorAll('#sane-letters > *');
      if (sane.length >= 4 && sane[3].firstElementChild) {
        const er = sane[3].firstElementChild.getBoundingClientRect(), cr2 = cv.getBoundingClientRect();
        const ET = { x: er.left + er.width * .55 - cr2.left, y: er.top - cr2.top + 3 };
        const A = { x: w * .62, y: -36 }, B = { x: w * .16, y: h * .3 }, C = { x: w * .07, y: h * .58 };
        const cub = (a, b, c2, d2, uu) => { const v = 1 - uu; return v * v * v * a + 3 * v * v * uu * b + 3 * v * uu * uu * c2 + uu * uu * uu * d2; };
        const u = clamp01((nowB - bp.bfStart) / 5200);
        const e2 = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        const landed = u >= 1;
        let bx = cub(A.x, B.x, C.x, ET.x, e2), by = cub(A.y, B.y, C.y, ET.y, e2);
        const ha = clamp01(e2 + .02);
        const angB = Math.atan2(cub(A.y, B.y, C.y, ET.y, ha) - by, cub(A.x, B.x, C.x, ET.x, ha) - bx) + Math.PI / 2;
        if (!landed) {
          const wig = (1 - e2) * 13;
          bx += Math.sin(nowB * .011) * wig; by += Math.cos(nowB * .013) * wig * .6;
        }
        let fl;
        if (!landed) {
          fl = Math.max(.25, Math.abs(Math.cos(nowB * .02)));
        } else {
          const settleT = nowB - (bp.bfStart + 5200); // ms since it touched down
          if (settleT < 1150) { const fade = 1 - settleT / 1150; fl = 1 - fade * .78 * Math.abs(Math.sin(settleT * .009)); }
          else fl = 1; // finally at rest, wings open and still
        }
        ctx.save(); ctx.translate(bx, by); ctx.rotate(landed ? 0 : angB);
        const wingB = (side) => {
          ctx.save(); ctx.scale(side * fl, 1);
          ctx.fillStyle = '#2f7fe0'; ctx.strokeStyle = '#101c36'; ctx.lineWidth = 1; ctx.globalAlpha = .95;
          ctx.beginPath(); ctx.ellipse(7.5, -4, 7, 5.2, -.5, 0, 6.2832); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#66c9f4';
          ctx.beginPath(); ctx.ellipse(6, 3.5, 5, 4, .5, 0, 6.2832); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.55)';
          ctx.beginPath(); ctx.ellipse(8, -4.5, 2.6, 1.7, -.5, 0, 6.2832); ctx.fill();
          ctx.restore();
        };
        wingB(1); wingB(-1);
        ctx.fillStyle = '#101c36'; ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, 1.8, 6, 0, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = '#101c36'; ctx.lineWidth = 1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -5.5); ctx.quadraticCurveTo(-3, -10, -4.5, -11); ctx.moveTo(0, -5.5); ctx.quadraticCurveTo(3, -10, 4.5, -11); ctx.stroke();
        ctx.restore();
      }
    };

    const drawBlueprint = () => {
      scenePhase += 0.008;
      const t = scenePhase;
      if (!bp) bp = { born: performance.now(), grass: [], flowers: Array.from({ length: 7 }, (_, i) => ({ fx: .05 + i * .14 + Math.random() * .05, s: .7 + Math.random() * .5, ph: Math.random() * 6.28 })), fall: [], _w: -1 };
      if (this._bloomReset) { this._bloomReset = false; bp.born = performance.now(); bp.fall = []; bp.bfStart = 0; }
      if (bp._w !== w) {
        bp._w = w; bp.grass = [];
        const greens = ['#3F7A34', '#4E8B3B', '#5FA24A', '#6FB257', '#356B2C', '#7DBB5F'];
        for (let x = 1; x < w; x += 4 + Math.random() * 3.5) bp.grass.push({ x, len: 18 + Math.random() * 30, wd: 2.2 + Math.random() * 2.4, ph: Math.random() * 6.28, bend: 0, c: greens[(Math.random() * greens.length) | 0], dir: Math.random() < .5 ? -1 : 1 });
        bp.grass.sort((a, b) => a.len - b.len);
      }
      ctx.lineCap = 'butt'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      // --- faint playfield: penalty box only (no boundary, no centre circle) ---
      drawPenalty();

      // --- grandstand tiers + crowd across the top ---
      for (let r2 = 0; r2 < 3; r2++) {
        const y0 = 10 + r2 * 11, sag = 14 + r2 * 5;
        ctx.strokeStyle = pal.ink; ctx.globalAlpha = .16; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y0); ctx.quadraticCurveTo(w / 2, y0 + sag * 2, w, y0); ctx.stroke();
      }
      ctx.fillStyle = pal.ink;
      for (let i = 0; i < w / 13; i++) {
        const x = i * 13 + 6, u = x / w;
        for (let r2 = 0; r2 < 2; r2++) {
          const yy = (10 + r2 * 11) + 2 * u * (1 - u) * (14 + r2 * 5) * 2 + 5.5;
          const bob = ((i * 7 + r2 * 13) % 5 === 0) ? Math.sin(t * 2 + i) * 1.2 : 0;
          ctx.globalAlpha = .13; ctx.beginPath(); ctx.arc(x, yy + bob, 1.5, 0, 6.2832); ctx.fill();
        }
      }
      // floodlights
      const flood = (fx) => {
        const x = fx * w;
        ctx.strokeStyle = pal.ink; ctx.globalAlpha = .2; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, 54); ctx.lineTo(x, 21); ctx.stroke();
        ctx.strokeRect(x - 10, 8, 20, 13);
        ctx.fillStyle = pal.accent;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.globalAlpha = .28 + .12 * Math.sin(t * 3 + i + j); ctx.beginPath(); ctx.arc(x - 6 + i * 6, 11.5 + j * 5.5, 1.4, 0, 6.2832); ctx.fill(); }
      };
      flood(.12); flood(.88);
      ctx.globalAlpha = 1;

      // --- rose is drawn once per frame via drawPlay() (called right after drawBlueprint) ---

      // --- blue butterfly (drawn after the car, in the draw loop) ---

      // --- bottom crowd row behind the grass ---
      ctx.fillStyle = pal.ink;
      for (let i = 0; i < w / 15; i++) {
        const x = i * 15 + 8;
        for (let r2 = 0; r2 < 2; r2++) {
          const bob = ((i * 5 + r2 * 3) % 4 === 0) ? Math.sin(t * 2.2 + i) * 1.3 : 0;
          ctx.globalAlpha = .12; ctx.beginPath(); ctx.arc(x + r2 * 7, h - 48 + r2 * 9 + bob, 1.7, 0, 6.2832); ctx.fill();
        }
      }

      for (const f of bp.flowers) {
        const x = f.fx * w, hgt = 27 * f.s, sway = Math.sin(t * 1.2 + f.ph) * 2.4;
        ctx.strokeStyle = pal.ink; ctx.globalAlpha = .36; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, h); ctx.quadraticCurveTo(x + sway * .4, h - hgt * .6, x + sway, h - hgt); ctx.stroke();
        ctx.save(); ctx.translate(x + sway, h - hgt); ctx.rotate(Math.sin(t + f.ph) * .15);
        ctx.fillStyle = pal.accent;
        for (let k = 0; k < 5; k++) { const a = k * 1.2566; ctx.globalAlpha = .5; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 4.2 * f.s, Math.sin(a) * 4.2 * f.s, 3.2 * f.s, 2 * f.s, a, 0, 6.2832); ctx.fill(); }
        ctx.fillStyle = pal.bg2; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(0, 0, 1.6 * f.s, 0, 6.2832); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // --- shot telemetry: live + best velocity / angle ---
      const bl = this._ball;
      ctx.font = "600 10px " + FMONO; ctx.textAlign = 'right';
      if (bl) {
        const v = Math.hypot(bl.vx, bl.vy);
        const ang = v > .15 ? Math.round(Math.atan2(-bl.vy, bl.vx) * 180 / Math.PI) : 0;
        ctx.fillStyle = pal.muted; ctx.globalAlpha = .75;
        ctx.fillText('VEL ' + v.toFixed(1) + ' · ANG ' + ang + '°', w - 12, 66);
      }
      const bs2 = this._bestShot;
      ctx.fillStyle = pal.accent; ctx.globalAlpha = .85;
      ctx.fillText(bs2 ? 'BEST ' + bs2.v.toFixed(1) + ' · ' + bs2.a + '°' : 'BEST —', w - 12, 80);
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    };

    const draw = () => {
      if (w <= 0 || h <= 0) { resize(); this._raf = requestAnimationFrame(draw); return; }
      const cs = getComputedStyle(document.documentElement);
      pal.dot = cs.getPropertyValue('--dot').trim() || 'rgba(0,0,0,.15)';
      pal.accent = cs.getPropertyValue('--accent').trim() || '#2C3BEA';
      pal.ink = cs.getPropertyValue('--ink').trim() || '#1A1915';
      pal.bg2 = cs.getPropertyValue('--bg2').trim() || '#fff';
      pal.line = cs.getPropertyValue('--line').trim() || '#ddd';
      pal.muted = cs.getPropertyValue('--muted').trim() || '#888';
      ctx.clearRect(0, 0, w, h);

      const look = this._look || 'blueprint';
      if (look === 'vision') drawVision();
      else if (look === 'robotics') drawRobotics();
      else if (look === 'flora') drawFlora();
      else if (look === 'graphics') drawGraphics();
      else { drawGrid(); const md = this._mode || 'play'; if (md === 'play') drawPlay(); else if (md === 'blueprint') { drawBlueprint(); drawPlay(); drawButterfly(); } }

      mouse.vx *= 0.6; mouse.vy *= 0.6;
      this._raf = requestAnimationFrame(draw);
    };
    // always cancel any pending frame before (re)starting so mode switches
    // can never stack multiple concurrent draw loops (which double-runs physics)
    this._draw = () => { if (this._raf) cancelAnimationFrame(this._raf); draw(); };
    this._draw();
  }

  setMode = (m) => {
    if (m === 'blueprint' && this._mode !== 'blueprint') this._bloomReset = true;
    this._mode = m;
    this._setCorner(false);
    this.setState({ mode: m });
    this._paintPills();
    if (this._draw) this._draw();
  };

  _scoreGoal() {
    const bl = this._ball;
    if (bl) {
      const v = Math.hypot(bl.vx, bl.vy), a = Math.round(Math.atan2(-bl.vy, bl.vx) * 180 / Math.PI);
      this._lastShot = { v, a };
      if (!this._bestShot || v > this._bestShot.v) this._bestShot = { v, a };
    }
    this._score = (this._score || 0) + 1;
    this._goalFlash = performance.now();
    this._cornerT = 0;
    if (this._cornerReady) this._setCorner(false);
    const b = this._ball, s = this._spawn, cv = this._canvas;
    if (b) {
      if (s) { b.x = s.x; b.y = s.y; }
      else if (cv) { b.x = cv.clientWidth * 0.3; b.y = cv.clientHeight * 0.5; }
      b.vx = 0; b.vy = 0; b.shot = 0;
    }
  }

  // launch a wedged ball out of a corner with a banana curve toward the goal mouth
  _cornerKick(w, h) {
    const b = this._ball; if (!b) return;
    const r = b.r || 22, tx = w + 8, ty = h / 2;
    b.x = Math.min(Math.max(b.x, r + 40), w - r - 40);
    b.y = Math.min(Math.max(b.y, r + 40), h - r - 40);
    // launch angled off-target; the homing in updateBall curls it into the mouth
    const ang = Math.atan2(ty - b.y, tx - b.x) + (b.y > ty ? -1 : 1) * 0.7;
    b.vx = Math.cos(ang) * 6; b.vy = Math.sin(ang) * 6; b.shot = 300;
  }

  _setCorner(on) {
    this._cornerReady = on;
    if (!this._cornerBtn) this._cornerBtn = document.getElementById('corner-kick-btn');
    if (this._cornerBtn) this._cornerBtn.style.display = on ? 'inline-flex' : 'none';
  }

  takeCorner = () => {
    const cv = this._canvas; if (!cv) return;
    this._cornerKick(cv.clientWidth, cv.clientHeight);
    this._cornerT = 0; this._setCorner(false);
  };

  onFooterMove = (e) => this._spawnRipple(e, false);
  onFooterDown = (e) => this._spawnRipple(e, true);
  _spawnRipple(e, big) {
    const layer = this._rippleLayer; if (!layer) return;
    const now = performance.now();
    if (!big) { if (now - (this._lastRip || 0) < 90) return; this._lastRip = now; }
    const r = layer.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return;
    const mkRing = (size, op, dur, delay, bw) => {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute; left:' + x + 'px; top:' + y + 'px; width:' + size + 'px; height:' + size + 'px; margin:' + (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px; border:' + bw + 'px solid var(--accent); border-radius:50%; pointer-events:none; opacity:' + op + '; transform:scale(0); animation:rippleExpand ' + dur + 'ms cubic-bezier(.2,.7,.2,1) ' + delay + 'ms forwards;';
      layer.appendChild(d);
      setTimeout(() => d.remove(), dur + delay + 80);
    };
    if (big) {
      mkRing(360, 0.85, 950, 0, 2.5);
      mkRing(220, 0.6, 860, 120, 1.5);
      mkRing(96, 0.5, 700, 40, 1.5);
    } else {
      mkRing(168, 0.55, 760, 0, 1.5);
    }
  }

  setLook = (k) => {
    this._look = k;
    delete document.documentElement.dataset.look;
    try { localStorage.setItem('sane-look', k); } catch (e) {}
    this._setCorner(false);
    this._paintLooks();
    if (this._draw) this._draw();
  };

  _paintLooks() {
    const cur = this._look || 'blueprint';
    const wrap = document.getElementById('look-switch');
    if (wrap) wrap.querySelectorAll('[data-look-btn]').forEach((b) => {
      const on = b.getAttribute('data-look-btn') === cur;
      b.style.color = on ? 'var(--accent)' : 'var(--muted)';
      b.style.borderColor = on ? 'var(--accent)' : 'var(--line)';
      b.style.background = on ? 'var(--soft)' : 'transparent';
    });
    const bg = document.getElementById('bg-switch');
    if (bg) bg.style.display = cur === 'blueprint' ? 'flex' : 'none';
  }

  _paintPills() {
    const wrap = document.getElementById('bg-switch');
    if (!wrap) return;
    wrap.querySelectorAll('[data-mode]').forEach((b) => {
      const on = b.getAttribute('data-mode') === this._mode;
      b.style.color = on ? 'var(--accent)' : 'var(--muted)';
      b.style.borderColor = on ? 'var(--accent)' : 'var(--line)';
      b.style.background = on ? 'var(--soft)' : 'transparent';
    });
  }

  onToggleTheme = () => {
    this.setState((s) => {
      const dark = !s.dark;
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      try { localStorage.setItem('sane-theme', dark ? 'dark' : 'light'); } catch (e) {}
      return { dark };
    });
  };

  openProject = (p) => { this.setState({ selected: p }); document.body.style.overflow = 'hidden'; };
  onCloseProject = () => { this.setState({ selected: null }); document.body.style.overflow = ''; };
  openCourse = (c) => { this.setState({ course: c }); document.body.style.overflow = 'hidden'; };
  onCloseCourse = () => { this.setState({ course: null }); document.body.style.overflow = ''; };
  stop = (e) => { e.stopPropagation(); };

  _spineCols = ['#2C3BEA', '#B8462A', '#2E7D57', '#C6982F', '#8E3A6B', '#3A5A9E', '#7A5230', '#455066'];
  _mkBook = (c, i) => {
    const h = 214 + ((i * 5) % 4) * 13;
    const w = c.w || (50 + ((i * 2) % 3) * 7);
    const book = { ...c, h, w, color: this._spineCols[i % this._spineCols.length],
      over: (e) => { e.currentTarget.style.transform = 'translateY(-16px)'; e.currentTarget.style.zIndex = '4'; },
      out: (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.zIndex = ''; },
    };
    book.open = (e) => this._pullBook(e, book);
    return book;
  };

  // pull the selected spine up and out of the shelf, then open the reader
  _pullBook = (e, book) => {
    const el = e && e.currentTarget;
    if (!el) { this.openCourse(book); return; }
    el.style.transformOrigin = 'bottom center';
    el.style.transition = 'transform .42s cubic-bezier(.34,1.14,.5,1), box-shadow .42s ease';
    el.style.transform = 'translateY(-44px) rotate(-3deg) scale(1.1)';
    el.style.boxShadow = '0 32px 42px -14px rgba(0,0,0,.55), inset -8px 0 13px rgba(0,0,0,.24), inset 5px 0 5px rgba(255,255,255,.16)';
    el.style.zIndex = '8';
    setTimeout(() => this.openCourse(book), 430);
    setTimeout(() => { el.style.transition = 'transform .26s cubic-bezier(.2,.7,.2,1), box-shadow .26s ease'; el.style.transform = ''; el.style.boxShadow = ''; el.style.zIndex = ''; el.style.transformOrigin = ''; }, 900);
  };

  hoverLink = (e) => { e.currentTarget.style.color = 'var(--ink)'; };
  unhoverLink = (e) => { e.currentTarget.style.color = 'var(--muted)'; };
  btnOver = (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px var(--soft)'; };
  btnOut = (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; };
  ghostOver = (e) => { e.currentTarget.style.borderColor = 'var(--accent)'; };
  ghostOut = (e) => { e.currentTarget.style.borderColor = 'var(--line)'; };
  cardOver = (e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-3px)'; };
  cardOut = (e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'none'; };

  _bgs = [
    'linear-gradient(135deg,#2C3BEA,#6E83FF)',
    'linear-gradient(135deg,#1A1915,#3a3a44)',
    'linear-gradient(135deg,#E85D2A,#f0a35c)',
    'linear-gradient(135deg,#16876b,#4fd1a5)',
    'linear-gradient(135deg,#7b3fe4,#b88cff)',
    'linear-gradient(135deg,#c4304f,#ff7a90)'
  ];
  _tags = ['Web App','Computer Vision','Mixed Reality','CLI Tool','ML / Data','Robotics','Systems','Game','Mobile','API'];
  _techPool = [['React','TypeScript','Node'],['Python','PyTorch','OpenCV'],['Unity','C#','ARKit'],['Go','Postgres','Docker'],['Three.js','WebGL','GLSL'],['Swift','CoreML','Metal'],['Rust','WASM'],['C++','ROS','Eigen']];

  _projectImgs = { Personal: { 4: 'uploads/anchor-app.png' } };

  _makeProjects(section, prefix, titles, tags, techs) {    return Array.from({ length: (titles ? titles.length : 12) }, (_, i) => {
      const num = String(i + 1).padStart(2, '0');
      const p = {
        section,
        isProject: true,
        num,
        title: (titles && titles[i]) || ('Project ' + num),
        tag: (tags && tags[i]) || this._tags[i % this._tags.length],
        bg: this._bgs[i % this._bgs.length],
        tech: (techs && techs[i]) || this._techPool[i % this._techPool.length],
        detail: 'Placeholder description.',
        shotId: prefix + '-shot-' + num,
        img: (this._projectImgs[section] && this._projectImgs[section][i]) || undefined,
        over: this.cardOver,
        out: this.cardOut,
      };
      p.showShot = !p.img;
      p.open = () => this.openProject(p);
      return p;
    });
  }

  // generic decorative section canvas: sizes itself, tracks cursor (with movement decay), runs a draw fn
  _sectionCanvas(cv, drawFn) {
    if (!cv || cv._wired) return; cv._wired = true;
    const ctx = cv.getContext('2d'); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0; const m = { x: -9999, y: -9999, tx: -9999, ty: -9999, mv: 0, on: false };
    const resize = () => { const r = cv.getBoundingClientRect(); w = r.width; h = r.height; cv.width = Math.max(1, w * dpr); cv.height = Math.max(1, h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); const ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null; if (ro) ro.observe(cv);
    const onMove = (e) => { const r = cv.getBoundingClientRect(); const nx = e.clientX - r.left, ny = e.clientY - r.top; m.tx = nx; m.ty = ny; m.mv = Math.min(1, m.mv + 0.5); m.on = nx >= -60 && nx <= w + 60 && ny >= -60 && ny <= h + 60; };
    window.addEventListener('pointermove', onMove);
    const onDown = (e) => { const r = cv.getBoundingClientRect(); const nx = e.clientX - r.left, ny = e.clientY - r.top; if (nx >= 0 && nx <= w && ny >= 0 && ny <= h) { m.click = { x: nx, y: ny }; m.down = true; } };
    const onUp = () => { m.down = false; };
    window.addEventListener('pointerdown', onDown); window.addEventListener('pointerup', onUp);
    this._secCleanup.push(() => { if (ro) ro.disconnect(); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointerup', onUp); });
    let t = 0;
    const loop = () => {
      if (w > 0 && h > 0) {
        if (m.x < -9000) { m.x = m.tx; m.y = m.ty; }
        m.x += (m.tx - m.x) * 0.1; m.y += (m.ty - m.y) * 0.1; m.mv *= 0.93;
        const cs = getComputedStyle(document.documentElement);
        const pal = { accent: cs.getPropertyValue('--accent').trim() || '#2C3BEA', ink: cs.getPropertyValue('--ink').trim() || '#1A1915', dot: cs.getPropertyValue('--dot').trim() || 'rgba(0,0,0,.15)', muted: cs.getPropertyValue('--muted').trim() || '#888', line: cs.getPropertyValue('--line').trim() || '#ddd', bg2: cs.getPropertyValue('--bg2').trim() || '#fff' };
        ctx.clearRect(0, 0, w, h); try { drawFn(ctx, w, h, m, pal, t); } catch (e) {}
        t++;
      }
      this._secRAF.push(requestAnimationFrame(loop));
    };
    loop();
  }

  // ABOUT — computer-vision detection framing over the portrait
  _scAbout = (ctx, w, h, m, pal, t) => {
    const cvEl = ctx.canvas;
    if (!cvEl._vf || cvEl._vw !== w || cvEl._vh !== h) { cvEl._vf = Array.from({ length: 40 }, () => ({ x: Math.random() * w, y: Math.random() * h, p: Math.random() * 6.28 })); cvEl._vw = w; cvEl._vh = h; }
    // feature points that connect to the cursor when near (like the hero Vision scene)
    for (const f of cvEl._vf) {
      const fx = f.x + Math.cos(t * 0.015 + f.p) * 1.2, fy = f.y, d = m.on ? Math.hypot(fx - m.x, fy - m.y) : 9999;
      ctx.strokeStyle = pal.ink; ctx.globalAlpha = d < 160 ? 0.5 : 0.13; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(fx - 2.5, fy); ctx.lineTo(fx + 2.5, fy); ctx.moveTo(fx, fy - 2.5); ctx.lineTo(fx, fy + 2.5); ctx.stroke();
      if (d < 150) { ctx.strokeStyle = pal.accent; ctx.globalAlpha = (1 - d / 150) * 0.55; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(m.x, m.y); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    // locate the portrait relative to the canvas
    let pb = null; const pel = document.getElementById('sb-portrait');
    if (pel) { const cr = cvEl.getBoundingClientRect(), r = pel.getBoundingClientRect(); if (r.width) pb = { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height }; }
    const onFace = pb && m.on && m.x > pb.x - 12 && m.x < pb.x + pb.w + 12 && m.y > pb.y - 12 && m.y < pb.y + pb.h + 12;
    const onHi = pb && m.on && m.x > pb.x && m.x < pb.x + pb.w * 0.22 && m.y > pb.y + pb.h / 3 && m.y < pb.y + pb.h * 2 / 3;
    let onWall = false;
    if (pb && m.on && !onHi && (m.y - pb.y) < pb.h * 0.62) {
      if (!this._portraitPix) { const pim = document.getElementById('sb-portrait'); if (pim && pim.complete && pim.naturalWidth) { try { const oc = document.createElement('canvas'); oc.width = pim.naturalWidth; oc.height = pim.naturalHeight; const octx = oc.getContext('2d'); octx.drawImage(pim, 0, 0); this._portraitPix = octx.getImageData(0, 0, oc.width, oc.height); } catch (e) { this._portraitPix = 'err'; } } }
      const P = this._portraitPix;
      if (P && P !== 'err') {
        const iw = P.width, ih = P.height, sc = Math.max(pb.w / iw, pb.h / ih);
        const ox = (pb.w - iw * sc) * 0.5, oy = (pb.h - ih * sc) * 0.30;
        const ix = Math.round(((m.x - pb.x) - ox) / sc), iy = Math.round(((m.y - pb.y) - oy) / sc);
        if (ix >= 0 && ix < iw && iy >= 0 && iy < ih) {
          const i4 = (iy * iw + ix) * 4, r = P.data[i4], g = P.data[i4 + 1], b = P.data[i4 + 2];
          const hi = Math.max(r, g, b), lo = Math.min(r, g, b), bright = (r + g + b) / 3, sat = hi ? (hi - lo) / hi : 0;
          onWall = bright > 165 && sat < 0.22;
        }
      }
    }
    if (pb) {
      const L = pb.x, T = pb.y, bw = pb.w, bh = pb.h, c = 18;
      ctx.strokeStyle = onFace ? pal.accent : pal.muted; ctx.globalAlpha = onFace ? 0.95 : 0.4; ctx.lineWidth = 2;
      const brk = (x, y, sx, sy) => { ctx.beginPath(); ctx.moveTo(x + sx * c, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * c); ctx.stroke(); };
      brk(L, T, 1, 1); brk(L + bw, T, -1, 1); brk(L, T + bh, 1, -1); brk(L + bw, T + bh, -1, -1);
      if (onFace) {
        const gdx = bw * 0.05, gdy = -bh * 0.13;
        ctx.strokeStyle = pal.accent; ctx.globalAlpha = 0.28; ctx.lineWidth = 0.7;
        for (let i = 0; i <= 5; i++) { const gx = L + gdx + bw * 0.2 + bw * 0.6 * (i / 5); ctx.beginPath(); ctx.moveTo(gx, T + gdy + bh * 0.2); ctx.lineTo(gx, T + gdy + bh * 0.82); ctx.stroke(); }
        for (let j = 0; j <= 6; j++) { const gy = T + gdy + bh * 0.2 + bh * 0.62 * (j / 6); ctx.beginPath(); ctx.moveTo(L + gdx + bw * 0.2, gy); ctx.lineTo(L + gdx + bw * 0.8, gy); ctx.stroke(); }
        ctx.globalAlpha = 1;
        ctx.globalAlpha = 1; ctx.fillStyle = pal.accent; ctx.fillRect(L, T - 16, onHi ? 138 : 96, 14); ctx.fillStyle = pal.bg2; ctx.font = "600 9px 'JetBrains Mono',monospace"; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillText(onHi ? 'GREETINGS DETECTED!' : (onWall ? 'WALL DETECTED' : 'FACE DETECTED'), L + 5, T - 5);
      }
    }
    ctx.globalAlpha = 1;
    // square tracking reticle on the cursor — label shows coordinates (never the word "scan")
    if (m.on) {
      const rx = m.x, ry = m.y, s = 15, c2 = 6;
      ctx.strokeStyle = pal.accent; ctx.globalAlpha = 0.9; ctx.lineWidth = 1.6;
      const sq = (cx2, cy2, sx, sy) => { ctx.beginPath(); ctx.moveTo(cx2 + sx * c2, cy2); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2, cy2 + sy * c2); ctx.stroke(); };
      sq(rx - s, ry - s, 1, 1); sq(rx + s, ry - s, -1, 1); sq(rx - s, ry + s, 1, -1); sq(rx + s, ry + s, -1, -1);
      ctx.globalAlpha = 0.45; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx - 5, ry); ctx.lineTo(rx + 5, ry); ctx.moveTo(rx, ry - 5); ctx.lineTo(rx, ry + 5); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = pal.accent; ctx.font = "600 8px 'JetBrains Mono',monospace"; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillText(onFace ? 'LOCK' : (Math.round(rx) + ',' + Math.round(ry)), rx + s + 4, ry + 3);
    }
    ctx.fillStyle = pal.muted; ctx.globalAlpha = 0.65; ctx.font = "9px 'JetBrains Mono',monospace"; ctx.textAlign = 'left'; ctx.fillText('CV · RGB · f' + (1000 + t % 999), 4, 13);
    ctx.globalAlpha = 1;
  };

  _pickArmTarget = () => { const idx = [0, 1, 2, 3, 4]; for (let i = idx.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp; } return idx.slice(0, 3); };
  restartArm = () => { this._armObjs = null; this._heldIdx = null; if (this._armGame) { this._armGame.target = this._pickArmTarget(); this._armGame.startT = null; this._armGame.elapsed = 0; this._armGame.done = false; } };

  // EXPERIENCE — IK robotic arm ending in an articulated hand, mounted on the right
  _scArm = (ctx, w, h, m, pal, t) => {
    const bx = w - 12, by = h * 0.5, L1 = Math.min(w * 0.5, h * 0.42), L2 = Math.min(w * 0.42, h * 0.34);
    let tx, ty;
    if (m.on) { tx = m.x; ty = m.y; }
    else { const hp = m.tx > -9000; const ddx = hp ? (m.tx - bx) : -1, ddy = hp ? (m.ty - by) : 0; const dl = Math.hypot(ddx, ddy) || 1, rr = (L1 + L2) * 0.5; tx = bx + ddx / dl * rr; ty = by + ddy / dl * rr; }
    let dx = tx - bx, dy = ty - by, dist = Math.hypot(dx, dy);
    const maxR = (L1 + L2) * 0.98, minR = Math.abs(L1 - L2) + 12;
    if (dist > maxR) { tx = bx + dx / dist * maxR; ty = by + dy / dist * maxR; } else if (dist < minR) { const a = Math.atan2(dy, dx); tx = bx + Math.cos(a) * minR; ty = by + Math.sin(a) * minR; }
    dx = tx - bx; dy = ty - by;
    const elbow = ty < by ? 1 : -1;
    const a2 = elbow * Math.acos(Math.min(1, Math.max(-1, (dx * dx + dy * dy - L1 * L1 - L2 * L2) / (2 * L1 * L2))));
    const a1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(a2), L1 + L2 * Math.cos(a2));
    if (!this._eArm) this._eArm = { a: a1, b: a2 };
    const sa = (cur, tg) => cur + Math.atan2(Math.sin(tg - cur), Math.cos(tg - cur)) * 0.16;
    this._eArm.a = sa(this._eArm.a, a1); this._eArm.b = sa(this._eArm.b, a2);
    const A = this._eArm.a, B = this._eArm.b;
    const ex = bx + Math.cos(A) * L1, ey = by + Math.sin(A) * L1, hx = ex + Math.cos(A + B) * L2, hy = ey + Math.sin(A + B) * L2;
    // colored blocks — press & hold to grab with the hand, release to drop; out-of-reach resets home
    const reach = L1 + L2, groundY = Math.min(h - 6, by + reach * 0.62), hd0 = A + B, htx = hx + Math.cos(hd0) * 16, hty = hy + Math.sin(hd0) * 16;
    if (!this._armObjs || this._armObjs._w !== w || this._armObjs._h !== h || this._armObjs.length !== 5) {
      this._armObjs = [[44, 15, '#2C3BEA'], [90, 14, '#E8663A'], [136, 13, '#25A567'], [182, 18, '#C24DD0'], [224, 11, '#E8B93A']].map(([d, s, c]) => { const hx0 = Math.max(w - d, bx - reach * 0.72); return { x: hx0, y: groundY - s, vx: 0, vy: 0, s: s, c: c, home: hx0 }; });
      this._armObjs._w = w; this._armObjs._h = h; this._heldIdx = null;
    }
    const objs = this._armObjs;
    if (!this._armGame) { let best = null; try { const b = parseFloat(localStorage.getItem('sane-arm-best')); if (b > 0) best = b; } catch (e) {} this._armGame = { target: this._pickArmTarget(), startT: null, elapsed: 0, done: false, best }; }
    const G = this._armGame;
    // reset the timer if the cursor has left the Experience section for more than 3s
    { const secEl = ctx.canvas.closest('section'); const now = performance.now(); let inSec = false;
      if (secEl && m.tx > -9000) { const cr = ctx.canvas.getBoundingClientRect(), sr = secEl.getBoundingClientRect(); const gx = m.tx + cr.left, gy = m.ty + cr.top; inSec = gx >= sr.left && gx <= sr.right && gy >= sr.top && gy <= sr.bottom; }
      if (inSec) { this._armAwaySince = null; }
      else if (this._armAwaySince == null) { this._armAwaySince = now; }
      else if (now - this._armAwaySince > 3000 && (G.startT != null || G.done || G.elapsed > 0)) { G.startT = null; G.elapsed = 0; G.done = false; G.target = this._pickArmTarget(); this._heldIdx = null; } }
    const padX = Math.round(bx - reach * 0.5), padHalf = 30;
    if (m.down && this._heldIdx == null) { for (let k = 0; k < objs.length; k++) { if (Math.hypot(objs[k].x - m.x, objs[k].y - m.y) < objs[k].s + 22 || Math.hypot(objs[k].x - htx, objs[k].y - hty) < objs[k].s + 16) { this._heldIdx = k; if (G.startT == null && !G.done) G.startT = performance.now(); break; } } }
    if (!m.down && this._heldIdx != null) this._heldIdx = null;
    for (let k = 0; k < objs.length; k++) {
      const o = objs[k];
      if (k === this._heldIdx) { o.x += (htx - o.x) * 0.55; o.y += (hty - o.y) * 0.55; o.vx = 0; o.vy = 0; continue; }
      o.vy += 0.4; o.vx *= 0.98; o.x += o.vx; o.y += o.vy;
      if (o.x < o.s) { o.x = o.s; o.vx *= -0.4; } if (o.x > w - o.s) { o.x = w - o.s; o.vx *= -0.4; }
      // rest on the shelf OR on top of another block (stacking); settle without bouncing
      let sup = groundY; for (let j = 0; j < objs.length; j++) { if (j === k || j === this._heldIdx) continue; const oj = objs[j]; if (Math.abs(o.x - oj.x) < o.s + oj.s - 2 && oj.y > o.y + 1) sup = Math.min(sup, oj.y - oj.s); }
      if (o.y >= sup - o.s) { o.y = sup - o.s; o.vy = 0; o.vx *= 0.6; if (Math.abs(o.x - bx) <= reach * 0.82) o.vx *= 0.3; }
      // only ease a block home if it has come to rest genuinely beyond the arm's horizontal reach
      if (o.y >= sup - o.s - 0.6 && Math.abs(o.vy) < 0.5 && Math.abs(o.x - bx) > reach * 0.82) { o.x += (o.home - o.x) * 0.06; }
    }
    // ==== mini-game: match the target stack as fast as you can ====
    ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = pal.muted; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(padX - padHalf, groundY + 1); ctx.lineTo(padX + padHalf, groundY + 1); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    let gy = groundY;
    for (const bi of G.target) { const s = objs[bi].s; ctx.save(); ctx.translate(padX, gy - s); ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5; ctx.strokeStyle = objs[bi].c; ctx.globalAlpha = G.done ? 0.16 : 0.8; ctx.beginPath(); ctx.roundRect(-s, -s, s * 2, s * 2, 3); ctx.stroke(); ctx.globalAlpha = G.done ? 0.04 : 0.11; ctx.fillStyle = objs[bi].c; ctx.fill(); ctx.setLineDash([]); ctx.restore(); gy -= s * 2 + 0.5; }
    ctx.globalAlpha = 0.78; ctx.fillStyle = G.done ? pal.accent : pal.muted; ctx.font = "600 8.5px 'JetBrains Mono',monospace"; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(G.done ? 'SOLVED' : 'TARGET', padX, gy - 3); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    if (!G.done) {
      const tgt = G.target.map((bi) => objs[bi].c), tset = new Set(tgt);
      const stack = objs.filter((o, ki) => ki !== this._heldIdx && tset.has(o.c) && Math.abs(o.x - padX) < padHalf && Math.abs(o.vy) < 0.6).sort((a, b) => b.y - a.y);
      const seq = stack.map((o) => o.c);
      if (seq.length === tgt.length && seq.every((c, i) => c === tgt[i])) { G.done = true; if (G.startT != null) G.elapsed = (performance.now() - G.startT) / 1000; if (G.best == null || G.elapsed < G.best) { G.best = G.elapsed; try { localStorage.setItem('sane-arm-best', G.best.toFixed(2)); } catch (e) {} } }
    }
    if (G.startT != null && !G.done) G.elapsed = (performance.now() - G.startT) / 1000;
    if (this._armTimeEl) { this._armTimeEl.textContent = (G.startT == null ? 0 : G.elapsed).toFixed(1) + 's'; this._armTimeEl.style.color = G.done ? 'var(--accent)' : 'var(--ink)'; }
    if (this._armBestEl) this._armBestEl.textContent = G.best == null ? '—' : G.best.toFixed(1) + 's';
    for (let k = 0; k < objs.length; k++) {
      const o = objs[k];
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(k === this._heldIdx ? 0 : o.vx * 0.04);
      ctx.globalAlpha = 0.95; ctx.fillStyle = o.c; ctx.beginPath(); ctx.roundRect(-o.s, -o.s, o.s * 2, o.s * 2, 3); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-o.s + 3, -o.s + 3); ctx.lineTo(o.s - 3, -o.s + 3); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = pal.ink; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.roundRect(bx - 6, by - 30, 20, 60, 5); ctx.fill();
    const cap = (x0, y0, x1, y1, wd0, wd1, col) => { const aa = Math.atan2(y1 - y0, x1 - x0), px = Math.cos(aa + 1.5708), py = Math.sin(aa + 1.5708); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0 + px * wd0, y0 + py * wd0); ctx.lineTo(x1 + px * wd1, y1 + py * wd1); ctx.lineTo(x1 - px * wd1, y1 - py * wd1); ctx.lineTo(x0 - px * wd0, y0 - py * wd0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(x1, y1, wd1, 0, 6.28); ctx.fill(); };
    ctx.globalAlpha = 0.92; cap(bx, by, ex, ey, 7, 6, pal.ink); cap(ex, ey, hx, hy, 6, 5, pal.accent);
    ctx.fillStyle = pal.bg2; ctx.strokeStyle = pal.ink; ctx.lineWidth = 2; [[bx, by, 7], [ex, ey, 6.5]].forEach(([jx, jy, jr]) => { ctx.beginPath(); ctx.arc(jx, jy, jr, 0, 6.28); ctx.fill(); ctx.stroke(); });
    const dir = A + B, near = Math.hypot(tx - hx, ty - hy), curl = Math.max(this._heldIdx != null ? 0.92 : 0, Math.min(1, 1 - near / 90));
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(dir);
    ctx.fillStyle = pal.ink; ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.roundRect(-6, -12, 9, 24, 3); ctx.fill(); ctx.beginPath(); ctx.roundRect(1, -12, 15, 24, 6); ctx.fill();
    const fng = (oy, sc) => { let x = 15, y = oy, a = 0; const ln = [8 * sc, 6 * sc, 4.5 * sc], wd = [3, 2.6, 2.1]; for (let s = 0; s < 3; s++) { a += (s === 0 ? 0.04 : 0.12) + curl * (0.45 + s * 0.22); const nx = x + Math.cos(a) * ln[s], ny = y + Math.sin(a) * ln[s]; ctx.strokeStyle = pal.ink; ctx.lineCap = 'round'; ctx.lineWidth = wd[s]; ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke(); ctx.fillStyle = pal.bg2; ctx.strokeStyle = pal.ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, wd[s] * 0.62, 0, 6.28); ctx.fill(); ctx.stroke(); x = nx; y = ny; } ctx.fillStyle = pal.accent; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(x, y, 1.9, 0, 6.28); ctx.fill(); };
    fng(-8, 1.04); fng(-2.8, 1.14); fng(2.8, 1.08); fng(8, 0.9);
    (() => { let x = 2, y = 11, a = 0.85 - curl * 0.35; const ln = [7, 5], wd = [3, 2.4]; for (let s = 0; s < 2; s++) { a += 0.12 + curl * 0.5; const nx = x + Math.cos(a) * ln[s], ny = y + Math.sin(a) * ln[s]; ctx.strokeStyle = pal.ink; ctx.lineWidth = wd[s]; ctx.lineCap = 'round'; ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke(); x = nx; y = ny; } ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.arc(x, y, 1.9, 0, 6.28); ctx.fill(); })();
    ctx.restore(); ctx.globalAlpha = 1;
  };

  // PROJECTS — vines that hold a lean toward the cursor; extra sway only while the cursor moves
  _scFlora = (ctx, w, h, m, pal, t) => {
    const cvel = ctx.canvas;
    const isLeft = cvel.getBoundingClientRect().left < (window.innerWidth || 1200) / 2;
    const inward = isLeft ? 1 : -1;
    const FC = [pal.accent, '#E8663A', '#C24DD0', '#E8B93A', '#25A567'];
    if (!cvel._fn || cvel._fw !== w || cvel._fh !== h || cvel._fv !== 3) { cvel._fn = Array.from({ length: 5 }, (_, i) => ({ off: 2 + i * 13.75, ph: i * 1.7, curve: 0.6 + (i % 3) * 0.35, tall: 0.84 + (i % 2) * 0.14, seed: (i * 3) % FC.length })); cvel._fw = w; cvel._fh = h; cvel._fv = 3; }
    const seg = Math.min(42, Math.max(16, Math.round(h / 80)));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leaf = (L, W) => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -W, L, 0); ctx.quadraticCurveTo(L * 0.5, W, 0, 0); ctx.fill(); const g = ctx.globalAlpha; ctx.globalAlpha = g * 0.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L * 0.9, 0); ctx.stroke(); ctx.globalAlpha = g; };
    const flower = (type, r, col) => { ctx.fillStyle = col; if (type === 0) { for (let q = 0; q < 6; q++) { ctx.rotate(1.0472); ctx.beginPath(); ctx.ellipse(0, -r, r * 0.55, r, 0, 0, 6.28); ctx.fill(); } } else if (type === 1) { for (let q = 0; q < 11; q++) { ctx.rotate(0.5712); ctx.beginPath(); ctx.ellipse(0, -r * 1.05, r * 0.26, r * 1.05, 0, 0, 6.28); ctx.fill(); } } else { for (let q = 0; q < 5; q++) { ctx.rotate(1.2566); ctx.beginPath(); ctx.ellipse(0, -r * 0.85, r * 0.72, r * 0.85, 0, 0, 6.28); ctx.fill(); } } ctx.globalAlpha = 0.95; ctx.fillStyle = pal.bg2; ctx.beginPath(); ctx.arc(0, 0, r * 0.42, 0, 6.28); ctx.fill(); ctx.fillStyle = '#E8B93A'; ctx.beginPath(); ctx.arc(0, 0, r * 0.24, 0, 6.28); ctx.fill(); };
    for (const v of cvel._fn) {
      const len = (h * v.tall) / seg, pts = [], baseX = (isLeft ? 22 : w - 22) + inward * v.off;
      // no mouse-attach — only a little extra sway when the cursor is near THIS vine
      const prox = m.on ? Math.max(0, 1 - Math.abs(m.x - baseX) / 85) : 0;
      let x = baseX, y = h + 4, ang = -Math.PI / 2;
      for (let s = 0; s <= seg; s++) {
        pts.push({ x, y, t01: s / seg });
        ang += v.curve * 0.0028 * inward + Math.sin(t * 0.02 + v.ph + s * 0.35) * (0.007 + prox * 0.03) * (s / seg);
        ang = Math.max(-Math.PI / 2 - 0.25, Math.min(-Math.PI / 2 + 0.25, ang));
        x += Math.cos(ang) * len; y += Math.sin(ang) * len;
      }
      ctx.strokeStyle = pal.ink; ctx.globalAlpha = 0.42;
      for (let i = 1; i < pts.length; i++) { ctx.lineWidth = Math.max(0.9, 4.6 * (1 - pts[i].t01 * 0.9)); ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
      for (let i = 2; i < pts.length - 1; i++) {
        const p = pts[i], dir = Math.atan2(p.y - pts[i - 1].y, p.x - pts[i - 1].x), side = (i % 2 ? 1 : -1), grow = Math.sin((i / pts.length) * Math.PI), L = 7 + grow * 12, W = 2.6 + grow * 4.6;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(dir + side * 1.2); ctx.fillStyle = pal.accent; ctx.strokeStyle = pal.accent; ctx.globalAlpha = 0.4; ctx.lineWidth = 1; leaf(L, W); ctx.restore();
      }
      [0.4, 0.62, 0.82, 1.0].forEach((sp, si) => {
        const p = pts[Math.min(pts.length - 1, Math.round(sp * (pts.length - 1)))];
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * 0.006 + v.ph + si * 1.3); ctx.globalAlpha = 0.66; flower((v.seed + si) % 3, si === 3 ? 6.8 : 4.8, FC[(v.seed + si) % FC.length]); ctx.restore();
      });
    }
    ctx.globalAlpha = 1;
  };

  // PROJECTS floor — a band of grass you can ruffle through with the cursor
  _scGrass = (ctx, w, h, m, pal, t) => {
    const cv = ctx.canvas;
    if (!cv._g || cv._gw !== w || cv._gv !== 2) {
      cv._gv = 2; cv._g = [];
      const greens = ['#3F7A34', '#4E8B3B', '#5FA24A', '#6FB257', '#356B2C', '#7DBB5F'];
      for (let x = 1; x < w; x += 4 + Math.random() * 3.5) {
        cv._g.push({ x, len: 20 + Math.random() * 32, wd: 2.2 + Math.random() * 2.4, ph: Math.random() * 6.28, bend: 0, c: greens[(Math.random() * greens.length) | 0], dir: Math.random() < 0.5 ? -1 : 1 });
      }
      cv._g.sort((a, b) => a.len - b.len); // short blades behind, tall in front
      cv._gw = w;
    }
    const baseY = h + 2;
    ctx.lineJoin = 'round';
    for (const b of cv._g) {
      // ruffle: blades bend away from the cursor when it's near, then spring back
      let target = b.dir * 0.11; // gentle natural resting tilt
      if (m.on) {
        const midY = baseY - b.len * 0.6, dx = b.x - m.x, dy = midY - m.y, dist = Math.hypot(dx, dy);
        if (dist < 80) { const f = 1 - dist / 80; target += Math.sign(dx || 1) * f * (1.1 + m.mv * 1.4); }
      }
      const idle = Math.sin(t * 0.02 + b.ph) * 0.07;
      b.bend += (target - b.bend) * 0.16;
      const lean = Math.max(-1.5, Math.min(1.5, b.bend + idle));
      const tipx = b.x + Math.sin(lean) * b.len, tipy = baseY - Math.cos(lean) * b.len;
      const cx = b.x + Math.sin(lean * 0.5) * b.len * 0.5, cy = baseY - Math.cos(lean * 0.5) * b.len * 0.5;
      ctx.beginPath();
      ctx.moveTo(b.x - b.wd / 2, baseY);
      ctx.quadraticCurveTo(cx - b.wd * 0.35, cy, tipx, tipy);
      ctx.quadraticCurveTo(cx + b.wd * 0.35, cy, b.x + b.wd / 2, baseY);
      ctx.closePath();
      ctx.fillStyle = b.c; ctx.globalAlpha = 0.62; ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // LEADERSHIP & AWARDS — confetti cannon; click to throw, confetti piles up on the ground
  _scConfetti = (ctx, w, h, m, pal, t) => {
    const cvel = ctx.canvas;
    if (!cvel._cf) cvel._cf = [];
    const binW = 13, nb = Math.ceil(w / binW);
    if (!cvel._bins || cvel._binN !== nb) { cvel._bins = new Array(nb).fill(0); cvel._binN = nb; }
    const cols = ['#2C3BEA', '#E8663A', '#25A567', '#E8B93A', '#C24DD0'];
    // party popper (party.png) sits bottom-right, mouth pointing up-left
    const iw = 58, ih = 58;
    const imgX = w - iw - 14, imgY = h - ih - 14, dirA = -Math.PI * 0.72;
    const mx = imgX + iw * 0.34, my = imgY + ih * 0.52;  // launch from the cone mouth
    const cx = imgX + iw * 0.55, cy = imgY + ih * 0.55;  // click hit-test center
    const burst = () => {
      for (let i = 0; i < 48; i++) { const a = dirA + (Math.random() - 0.5) * 1.0, sp = 2.8 + Math.random() * 4.4; cvel._cf.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.26, s: 3 + Math.random() * 3, c: cols[(Math.random() * cols.length) | 0], set: false }); }
      if (cvel._cf.length > 900) cvel._cf.splice(0, cvel._cf.length - 900);
    };
    if (this._autoPop) { this._autoPop = false; burst(); }
    if (m.click) {
      if (Math.hypot(m.click.x - cx, m.click.y - cy) < 58) burst();
      m.click = null;
    }
    // rebuild pile heights from actually-settled confetti each frame (prevents phantom mid-air piles)
    cvel._bins.fill(0);
    for (const p of cvel._cf) { if (p.set) { const b = Math.max(0, Math.min(nb - 1, (p.x / binW) | 0)); cvel._bins[b]++; } }
    const groundAt = (x) => { const b = Math.max(0, Math.min(nb - 1, (x / binW) | 0)); return h - 2 - Math.min(46, cvel._bins[b] * 0.55); };
    for (const p of cvel._cf) {
      if (p.set) {
        // sift: sweep the cursor through the pile to scatter settled confetti
        if (m.on && Math.hypot(p.x - m.x, p.y - m.y) < 24) { const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1; p.set = false; p.vx = dx / d * 3.2; p.vy = -2 - Math.random() * 2.4; p.vr = (Math.random() - 0.5) * 0.5; }
        else if (p.y < groundAt(p.x) - 6) { p.set = false; p.vy = 0; }
      } else {
        p.vy += 0.09; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.x < 0 || p.x > w) { p.vx *= -0.5; p.x = Math.max(0, Math.min(w, p.x)); }
        const g = groundAt(p.x);
        if (p.y >= g) { p.y = g; p.set = true; p.vx = 0; p.vy = 0; }
      }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 0.95; ctx.fillStyle = p.c; ctx.fillRect(-p.s, -p.s * 0.6, p.s * 2, p.s * 1.2); ctx.restore();
    }
    ctx.globalAlpha = 1;
    // party popper image (party.png)
    if (!cvel._pop) { const im = new Image(); im.src = 'uploads/party.png'; cvel._pop = im; }
    if (cvel._pop.complete && cvel._pop.naturalWidth) { ctx.drawImage(cvel._pop, imgX, imgY, iw, ih); }
    ctx.fillStyle = pal.muted; ctx.globalAlpha = 0.75; ctx.font = "9px 'JetBrains Mono',monospace"; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText('click the popper', w - 10, h - 6); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  };

  renderVals() {
    const dark = this.state.dark;
    const personalTitles = ['Haptic Navigation Gloves for BLV Users', 'NYT Wordle Solver AI Bot', 'Real-Time Astigmatism & Myopia Vision Simulator', 'Mem: NeRF-Powered 3D Memory Capture', 'Anchor: Journal & Planner', 'Self-driving F1 Racing Simulator', 'Amazon Alexa Audio Style Transfer', 'Moodnotes: Moodboards + Notes', 'SoundSync: Emotion-Based Music Player and Recommender', 'Better YouTube Translate Extension', 'Offline AR Maps App'];
    const personalTags = ['Robotics / Accessibility Research', 'Information Theory / AI', 'Vision Sim', 'Graphics Research', 'Web App', 'Graphics / Simulation', 'Audio ML', 'Web App', 'Music ML', 'Browser Extension', 'Mixed Reality'];
    const berkeleyTitles = ['Celestial Phenomena Simulator', 'Secure File Sharing System', 'Multi-Agent Search', 'Pacman Reinforcement Learning', 'Breaching a Vulnerable Web Server', 'Cloth Simulation', 'Rasterizer', 'Ray Tracing', '3D Graphics with Bézier Curves', 'Ants vs Bees (Plants vs Zombies inspired game)', 'Rooms & Hallways (2D Color Maze)', 'Scheme Interpreter'];
    const berkeleyTags = ['Simulation', 'Security', 'AI / Search', 'ML', 'Security', 'Physics Sim', 'Graphics', 'Graphics', '3D Graphics', 'Game', 'Game', 'Interpreter'];
    const personalTech = [
      ['C++', 'ESP32', 'Haptics', 'Arduino'],
      ['Python', 'NumPy', 'Information Theory'],
      ['Three.js', 'WebGL', 'GLSL'],
      ['PyTorch', 'NeRF', 'Python', 'CUDA'],
      ['React', 'TypeScript', 'Firebase'],
      ['Python', 'PyTorch', 'Unity'],
      ['Python', 'TensorFlow', 'AWS Lambda'],
      ['React', 'Next.js', 'Supabase'],
      ['Python', 'Librosa', 'scikit-learn', 'Spotify API'],
      ['TypeScript', 'Chrome API', 'WebExtensions'],
      ['Swift', 'ARKit', 'MapKit'],
    ];
    const berkeleyTech = [
      ['C++', 'OpenGL', 'GLSL'],
      ['Go', 'Cryptography'],
      ['Python', 'A* / Search'],
      ['Python', 'NumPy', 'Q-Learning'],
      ['C', 'GDB', 'x86 Assembly'],
      ['C++', 'OpenGL', 'GLSL'],
      ['C++', 'SVG', 'Sampling'],
      ['C++', 'BVH', 'Ray Tracing'],
      ['C++', 'OpenGL', 'Bézier'],
      ['Python', 'OOP'],
      ['Java', 'Data Structures'],
      ['Python', 'Interpreters'],
    ];
    const personal = this._makeProjects('Personal', 'p', personalTitles, personalTags, personalTech);
    const berkeley = this._makeProjects('Berkeley', 'b', berkeleyTitles, berkeleyTags, berkeleyTech);

    const acronym = [
      { letter: 'S', word: 'Speculative', delay: '.15s' },
      { letter: 'A', word: 'and', delay: '.28s' },
      { letter: 'N', word: 'Novel', delay: '.41s' },
      { letter: 'E', word: 'Engineering', delay: '.54s' },
    ].map((a) => ({
      ...a,
      color: 'var(--ink)',
      lift: 'translateY(0)',
      enter: (e) => {
        const box = e.currentTarget;
        const big = box.firstChild;
        big.style.color = 'var(--accent)';
        big.style.transform = 'translateY(-10px)';
      },
      leave: (e) => {
        const box = e.currentTarget;
        const big = box.firstChild;
        big.style.color = 'var(--ink)';
        big.style.transform = 'translateY(0)';
      },
    }));

    const mkHover = (overStyle) => ({
      over: (e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-3px)'; },
      out: (e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'none'; },
    });

    const industry = [
      { company: 'Live150.ai', role: 'AI Engineer Intern · Computer Vision & AI Agent', period: 'Summer 2025', slotId: 'logo-1', logo: 'uploads/live150.png' },
      { company: 'SkyIT Services', role: 'Software Developer Intern · Full-Stack Platform', period: 'Summer 2024', slotId: 'logo-2', logo: 'uploads/skyit-services.png' },
      { company: 'STARLab', role: 'Design Engineer Intern · Software Simulation', period: 'Summer 2021', slotId: 'logo-3', logo: 'uploads/starlab.png' },
    ].map((j) => ({ ...j, ...mkHover(), logoRef: (el) => { if (el && !el.src.endsWith(j.logo)) el.src = j.logo; } }));

    const socials = [
      { label: 'LinkedIn', href: '#', icon: 'IN' },
      { label: 'Email', href: 'mailto:sam@example.com', icon: '@' },
      { label: 'GitHub', href: 'https://github.com/sane24', icon: 'GH' },
      { label: 'Résumé', href: '#', icon: '↗' },
    ].map((s) => ({
      ...s,
      over: (e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; },
      out: (e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'none'; },
    }));

    return {
      themeIcon: dark ? '☀' : '☾',
      onToggleTheme: this.onToggleTheme,
      hoverLink: this.hoverLink, unhoverLink: this.unhoverLink,
      btnOver: this.btnOver, btnOut: this.btnOut,
      ghostOver: this.ghostOver, ghostOut: this.ghostOut,
      canvasRef: (el) => { this._canvas = el; },
      aboutCvRef: (el) => { this._aboutCv = el; },
      armCvRef: (el) => { this._armCv = el; },
      armTimeRef: (el) => { this._armTimeEl = el; },
      armBestRef: (el) => { this._armBestEl = el; },
      restartArm: this.restartArm,
      floraLRef: (el) => { this._floraL = el; },
      floraRRef: (el) => { this._floraR = el; },
      grassRef: (el) => { this._grassCv = el; },
      confettiRef: (el) => { this._confettiCv = el; },
      mode: this.state.mode || this._mode || 'play',
      cornerReady: this.state.cornerReady,
      cornerBtnRef: (el) => { this._cornerBtn = el; },
      takeCorner: this.takeCorner,
      modeBtns: [
        { key: 'play', label: 'F1 + Soccer' },
        { key: 'blueprint', label: 'Stadium' },
        { key: 'none', label: 'Off' },
      ].map((m) => ({ ...m, onClick: () => this.setMode(m.key) })),
      acronym,
      ...(() => {
        const hd = [
          { name: 'Digital art', kind: 'Artwork', caps: ['Character: Aglaea — Background: 3D modeled environment', 'Work in Progress — Reze from Chainsaw Man', 'Robin Sketch'] },
          { name: '3D modeling', kind: 'Render', caps: ['3D Model', '3D Model', '3D Model'] },
          { name: 'Formula 1', kind: 'Photo', caps: ['Max Verstappen winning F1 Italian Grand Prix', 'Red Bull RB16B', '1988 McLaren MP4'] },
          { name: 'Soccer', kind: 'Photo', caps: ['Kaoru Mitoma: the man who studied dribbling', "Mitoma's Dribbling Thesis paper", 'My Favorite game: Argentina vs France 2022 World Cup'] },
          { name: 'Poker', kind: 'Photo', caps: ['Playing Poker :)', 'Balatro: Roguelike Poker Style game'] },
          { name: 'VR games', kind: 'Screenshot', caps: ['Beat Saber', 'Superhot VR'] },
          { name: 'Photography', kind: 'Photo', caps: ['Berkeley Libraries', 'Berkeley House', 'SF road'] },
          { name: 'Cooking', kind: 'Dish', caps: ['Katsu Curry!', 'Cheeseburgers!', 'Tiramisu'] },
        ];
        const open = this.state.openHobby == null ? -1 : this.state.openHobby;
        const hov = this.state.hoverHobby == null ? -1 : this.state.hoverHobby;
        const hobbies = hd.map((h, i) => { const active = i === open, hovered = i === hov; return { name: h.name, toggle: () => this.setState((s) => ({ openHobby: s.openHobby === i ? null : i })), enter: () => this.setState({ hoverHobby: i }), leave: () => this.setState((s) => (s.hoverHobby === i ? { hoverHobby: null } : {})), bg: active ? 'var(--accent)' : (hovered ? 'var(--soft)' : 'var(--bg2)'), fg: active ? 'var(--accent-ink)' : (hovered ? 'var(--accent)' : 'var(--ink)'), border: (active || hovered) ? 'var(--accent)' : 'var(--line)' }; });
        const cur = open >= 0 ? hd[open] : null;
        const openHobbyImages = cur ? cur.caps.map((c, j) => ({ cap: c, kind: cur.kind, slotId: 'hobby-' + open + '-' + j })) : null;
        return { hobbies, openHobbyImages, openHobbyName: cur ? cur.name : '' };
      })(),
      industry,
      personal, berkeley,
      projectCount: '24 total',
      skills: [
        { title: 'Languages', items: ['Python','TypeScript / JavaScript','Java','C++','C','C#','Swift','Go','Rust','R','SQL','HTML/CSS'] },
        { title: 'Frameworks & Tools', items: ['React / Next.js','PyTorch / OpenCV','Unity / ARKit','NodeJS','Docker','Three.js / WebGL','Git / Linux','Flask','MongoDB','Firebase','AWS','Kubernetes'] },
      ],
      leadership: [
        {
          role: 'Selected AI & Robotics Research Speaker',
          orgMain: 'Silicon Valley Robotics Fair', orgSub: 'Be the Change Foundation',
          place: 'San Mateo, CA',
          period: 'Aug 2026',
          bullet: 'Presenting research on multimodal AI, human–robot interaction, and accessibility robotics at the Silicon Valley Robotics Fair, representing UC Berkeley research to industry and community attendees.',
        },
        {
          role: 'President & Finance Lead',
          orgMain: 'Genshin @ Berkeley', orgSub: 'Video Game Club',
          place: 'Berkeley, CA',
          period: 'Aug 2024 – Present',
          bullet: 'Leading the planning and execution of club events and fundraisers as President, managing financial strategy across asset organization, collaborations with video-game companies, and art merchandising to increase club revenue.',
        },
      ],
      awards: [
        { title: 'UC Berkeley AI Hackathon Poker Tournament', meta: '2026', detail: 'Top 4 Finalist · #1 overall bankroll after preliminary rounds' },
        { title: 'International Informatics Olympiad', meta: '2020–21', detail: 'International Rank 21 (2021) · Gold Medal (2020)' },
        { title: 'SOF International Math Olympiad', meta: '2020–21', detail: 'Gold Medal (2021) · International Rank 319 (2020)' },
      ],
      coursework: [
        { code: 'Data C8', short: 'Data Science', name: 'Data Science', grade: 'A+', desc: 'Computational and inferential thinking, sampling, simulation, hypothesis testing, regression, and prediction on real-world datasets.' },
        { code: 'CS 61B', short: 'Data Structures', name: 'Data Structures & Algorithms', grade: 'A', w: 44, desc: 'Designing and analyzing efficient data structures and algorithms in Java, with a strong emphasis on real software engineering.' },
        { code: 'CS 188', short: 'Artificial Intelligence', name: 'Artificial Intelligence', grade: 'A+', desc: 'Search, adversarial games, constraint satisfaction, MDPs, reinforcement learning, and probabilistic reasoning under uncertainty.' },
        { code: 'CS 189', short: 'Machine Learning', name: 'Machine Learning', grade: 'A+', w: 66, desc: 'The theory and practice of machine learning, regression, SVMs, neural networks, and unsupervised methods.' },
        { code: 'CS 184', short: 'Computer Graphics', name: 'Computer Graphics', grade: 'A', desc: 'Rasterization, ray tracing, geometric modeling, and physically-based rendering and simulation.' },
        { code: 'CS 168', short: 'Internet Architecture', name: 'Internet Architecture & Protocols', grade: 'A', desc: 'How the Internet actually works, routing, congestion control, DNS, and network security.' },
        { code: 'Cogsci 131', short: 'Computational Models', name: 'Computational Models of Cognition', grade: 'A+', w: 46, desc: 'Computational accounts of human cognition, Bayesian models, neural networks, reinforcement learning, and decision-making.' },
        { code: 'EECS 126', short: 'Probability', name: 'Probability & Random Processes', grade: 'A', desc: 'Probability foundations for EECS, random variables, Markov chains, estimation, and stochastic processes.' },
        { code: 'CS 170', short: 'Efficient Algorithm', name: 'Efficient Algorithms & Intractable Problems', grade: 'A-', desc: 'Algorithm design paradigms, divide-and-conquer, graph algorithms, dynamic programming, and the theory of NP-completeness.' },
        { code: 'CS 61C', short: 'Computer Architecture', name: 'Great Ideas of Computer Architecture', grade: 'A-', desc: 'The hardware–software interface, C, assembly, caches, pipelining, and how machines actually run programs.' },
        { code: 'AEROENG 10', short: 'Aerospace Design', name: 'Introduction to Aerospace Engineering Design', grade: 'A', desc: 'Fundamentals of aerospace vehicle design, aerodynamics, propulsion, structures, and the engineering design process.' },
        { code: 'CS 198', short: 'VR Development', name: 'Virtual Reality Development Decal', grade: 'P', desc: 'Student-led decal building immersive virtual reality experiences with modern VR development toolkits.' },
        { code: 'CS 197', short: 'Fullstack Dev', name: 'Fullstack Development Decal', grade: 'P', desc: 'Student-led decal on end-to-end full-stack web development, front-end, backend, and deployment.' },
        { code: 'COGSCI 1', short: 'Cognitive Science', name: 'Introduction to Cognitive Science', grade: 'A', desc: 'A broad survey of the mind, perception, language, memory, reasoning, and learning across psychology, linguistics, neuroscience, and AI.' },
      ].map((c, i) => this._mkBook(c, i)),
      inProgress: [
        { code: 'CS 160', short: 'UI/UX Design', name: 'UI/UX Design & Development', grade: 'In progress', desc: 'User-centered design, rapid prototyping, and building polished, usable interactive interfaces.' },
        { code: 'CS 180', short: 'Computer Vision', name: 'Computer Vision', grade: 'In progress', desc: 'Image formation, features and matching, multi-view geometry, and deep learning for visual recognition.' },
      ].map((c, i) => this._mkBook(c, i + 5)),
      artWins: [
        { title: 'Nyan Cat Cosplaying as a Minecraft Pig 🐷🌈', comp: 'Final Art Competition #4 · 1st Place Winner', img: 'uploads/art-nyancat.gif', detail: `A rainbow-swirled Nyan Cat walked into my cloth simulator and said, "I'm the main character now." So I gave it collision physics, shader sparkles, a minecraft pig cosplay, and a magical rainbow cape, though the magic got a little out of hand and the cape didn't stick around for long :P

I started by extending the simulator with custom cube support, by implementing a new Cube class with collision detection, bounding boxes, and json parsing logic, allowing me to place rigid cube objects that interact with cloth in the scene. Once cubes were in, I wrote the collision response to gently push point masses out of cubes when intersecting. Next, I added a wind system that applied force to cloth triangles based on their normals. To make it dynamic, I modulated the wind using sine waves and added GUI sliders to control the wind direction. This gave the rainbow cloth a beautiful flutter effect and let me change its direction and speed to simulate it for the final video.

For the model itself, I assembled the cat entirely using the json cube and sphere objects. One big cubes made the body, small ones stacked to form triangle-shaped ears, legs made of cubes, eyes made of spheres, and a arc tail in the back. It was like building a voxel sculpture one block at a time. Finally, I wrote a custom GLSL fragment shader to bring the cat to life. The shader blended rainbow gradients across the body, added toon shading with soft lighting quantization, and layered in sparkles and iridescent tints that shimmered beautifully across the cat's surface.

The result looked like Nyan Cat collided with a shader art blog and respawned in a Minecraft server, like a vaporwave nyan cat in minecraft cosplay, utterly ridiculous but absolutely aesthetic!` },
        { title: 'Blorb of the Abyss', comp: 'Art Competition #3 · 1st Place Winner', img: 'uploads/art-blorb.png', detail: `I chose to render a jellyfish because they are small, shiny, and just a lil bit magical. ✨

I created the glowing jellyfish scene by starting with the empty room collada file, and adding in a jellyfish and spherical water bubbles, fixing their geometry and exporting it back as a .dae. To bring the jellyfish to life, I gave it an emissive "light" material so it would act as a soft area light. To create the underwater scene, I treated the ceiling of the room as the ocean's surface and gave it a similar bright, bluish emissive material.

Following the Sp21 pathtracer project, I extended our pathtracer to accept more BSDF materials (mirror, glass, liquid), allowing for better reflection and realistic refraction, and added an environment light enabling soft ambient illumination across the scene.

All elements came together in the final rendered frame of 2048 samples per pixel, making a jellyfish too shy to surface, and too bright to ignore :)` },
        { title: 'Boba Blueprint Battle', comp: 'Art Competition #2 · 3rd Place Winner', img: 'uploads/bobablueprintbattle.png', detail: `A cold war, but for boba! I started by modeling a boba cup with a straw, ice cubes and pearls, and a low-poly penguin. To distinguish the 2 duplicated penguins and enhance the scene, I used mesh transformations to move, scale and rotate them into a face off, adjusting their eyeballs to stare at each other in a silent boba making rivalry.

Then, I applied a glass-like shader to make the models semi-transparent, allowing underlying structures of the tapioca pearls and ice cubes to be visible, and enabled wireframe view for the middle cup giving it an X-ray blueprint effect which added a really unique look.` },
      ].map((a, i) => { const o = { ...a, section: 'Art', num: String(i + 1).padStart(2, '0'), tag: 'Computer Graphics', bg: this._bgs[(i + 2) % this._bgs.length], shotId: 'art-' + (i + 1), over: this.cardOver, out: this.cardOut }; o.imgRef = (el) => { if (el && el.getAttribute('src') !== o.img) el.src = o.img; }; o.open = () => this.openProject(o); return o; }),
      rippleLayerRef: (el) => { this._rippleLayer = el; },
      onFooterMove: this.onFooterMove,
      onFooterDown: this.onFooterDown,
      socials,
      selected: this.state.selected,
      selectedImgRef: (el) => { const s = this.state.selected; if (el && s && s.img && el.getAttribute('src') !== s.img) el.src = s.img; },
      onCloseProject: this.onCloseProject,
      course: this.state.course,
      onCloseCourse: this.onCloseCourse,
      stop: this.stop,
    };
  }
}
return Component;
};
