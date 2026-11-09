(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Neural network background ---------- */
  const canvas = document.getElementById("neural");
  const ctx = canvas.getContext("2d");
  let nodes = [];
  let w, h;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(90, Math.floor((w * h) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 0.6,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      if (!reduced) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
    }
    const maxD = 140;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxD) {
          ctx.strokeStyle = `rgba(109,255,179,${(1 - d / maxD) * 0.22})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      const n = nodes[i];
      const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      const lit = md < 160;
      if (lit) {
        ctx.strokeStyle = `rgba(92,200,255,${(1 - md / 160) * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
      ctx.fillStyle = lit ? "#5cc8ff" : "rgba(109,255,179,.8)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduced) requestAnimationFrame(draw);
  }

  canvas.parentElement.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });
  window.addEventListener("resize", resize);
  resize();
  draw();

  /* ---------- Terminal typing ---------- */
  const lines = [
    ['<span class="c">$</span> ', 'python profile.py --load rayen'],
    ['<span class="k">name</span>      = ', '<span class="v">"Rayen Ben Fathallah"</span>'],
    ['<span class="k">role</span>      = ', '<span class="v">"Senior Data & AI Engineer @ Rosenberger"</span>'],
    ['<span class="k">focus</span>     = ', '[agents, llm_pipelines, forecasting, vision]'],
    ['<span class="k">deploys</span>   = ', '<span class="v">"to production, with monitoring"</span>'],
    ['<span class="c"># status: ', 'open to conversations ✓</span>'],
  ];
  const term = document.getElementById("terminal-body");
  if (reduced) {
    term.innerHTML = lines.map((l) => l[0] + l[1]).join("\n");
  } else {
    let li = 0, ci = 0, out = "";
    const stripTags = (s) => s.replace(/<[^>]+>/g, "");
    function type() {
      if (li >= lines.length) {
        term.innerHTML = out + '<span class="cursor"></span>';
        return;
      }
      const [prefix, body] = lines[li];
      const plain = stripTags(body);
      if (ci <= plain.length) {
        // show prefix + partial plain text while typing, styled text when line completes
        term.innerHTML = out + prefix + plain.slice(0, ci) + '<span class="cursor"></span>';
        ci++;
        setTimeout(type, li === 0 ? 38 : 16);
      } else {
        out += prefix + body + "\n";
        li++; ci = 0;
        setTimeout(type, 220);
      }
    }
    setTimeout(type, 500);
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.count;
      if (reduced) { el.textContent = target; return; }
      let t0 = null;
      const step = (t) => {
        t0 ??= t;
        const p = Math.min((t - t0) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => countIO.observe(c));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- Scroll progress + timeline fill ---------- */
  const bar = document.querySelector(".scroll-progress span");
  const timeline = document.querySelector(".timeline");
  const fill = document.querySelector(".timeline-line span");
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (scrollY / max) * 100 + "%";
    const r = timeline.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.6 - r.top) / r.height, 0), 1);
    fill.style.height = p * 100 + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
