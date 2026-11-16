(() => {
  const $ = id => document.getElementById(id);
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = arr => arr[rnd(0, arr.length - 1)];
  let boost = 1;

  // Relógio e tela cheia
  setInterval(() => $('clock').textContent = new Date().toLocaleTimeString('pt-BR'), 1000);
  $('fs').onclick = e => { e.stopPropagation(); document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); };

  // Status que muda
  const states = ['● compilando…', '● executando testes…', '● otimizando build…', '● sincronizando com o servidor…', '● analisando dependências…'];
  setInterval(() => $('status').textContent = pick(states), 4000);

  // Editor de código digitando sozinho
  const snippets = [
`// pipeline de deploy
const config = await loadConfig('./prod.json');
async function deploy(build, env) {
  const nodes = await cluster.getNodes(env);
  for (const node of nodes) {
    await node.drain();
    await node.push(build.artifact);
    const ok = await node.healthCheck({ retries: 5 });
    if (!ok) throw new Error('rollback em ' + node.id);
  }
  return metrics.record('deploy.done', nodes.length);
}
`,
`class CacheLayer {
  constructor(ttl = 300) { this.store = new Map(); this.ttl = ttl; }
  get(key) {
    const hit = this.store.get(key);
    if (hit && hit.exp > Date.now()) return hit.value;
    this.store.delete(key);
    return null;
  }
  set(key, value) { this.store.set(key, { value, exp: Date.now() + this.ttl * 1000 }); }
}
`,
`function normalize(rows) {
  return rows
    .filter(r => r.status !== 'deleted')
    .map(r => ({ ...r, total: r.qty * r.price }))
    .sort((a, b) => b.total - a.total)
    .reduce((acc, r) => (acc[r.group] = [...(acc[r.group] || []), r], acc), {});
}
`
  ];
  const code = $('code');
  let text = '', queue = '';
  const colorize = src => src
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/(\/\/.*)|('[^']*')|\b(const|let|async|await|function|class|return|for|of|if|throw|new|constructor)\b/g,
      (m, c, str, kw) => c ? `<span class="c">${m}</span>` : str ? `<span class="s">${m}</span>` : `<span class="k">${m}</span>`);
  function type() {
    if (!queue) queue = pick(snippets);
    const n = rnd(1, 3) * boost;
    text += queue.slice(0, n); queue = queue.slice(n);
    const lines = text.split('\n');
    const max = Math.max(8, Math.floor(code.clientHeight / 19));
    if (lines.length > max) text = lines.slice(-max).join('\n');
    code.innerHTML = colorize(text) + '▌';
    setTimeout(type, rnd(15, 45));
  }
  type();

  // Terminal falso
  const term = $('term');
  const cmds = ['npm run build', 'git pull origin main', 'docker compose up -d', 'pytest -q', 'kubectl get pods', 'python train.py --epochs 50', 'ssh deploy@prod-02', 'make clean && make all'];
  const outs = [
    ['ok', '✔ 142 módulos transformados'], ['ok', '✔ 38 testes passaram'], ['warn', '⚠ 2 avisos de dependência obsoleta'],
    ['', 'Resolvendo deltas: 100% (64/64)'], ['', 'epoch 12/50 — loss: 0.0841 — acc: 0.973'],
    ['ok', 'pod/api-7f9c Running 1/1'], ['err', '✖ timeout em db-replica-3, tentando novamente…'], ['', 'Compilando assets… 87%']
  ];
  function addLine(box, cls, txt, max = 40) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = txt;
    box.appendChild(d);
    while (box.children.length > max) box.removeChild(box.firstChild);
  }
  function termTick() {
    addLine(term, 'f', '$ ' + pick(cmds));
    for (let i = rnd(1, 3); i > 0; i--) { const [c, t] = pick(outs); addLine(term, c, t); }
    setTimeout(termTick, rnd(700, 1800) / boost);
  }
  termTick();

  // Logs
  const levels = [['ok', 'INFO'], ['', 'DEBUG'], ['warn', 'WARN'], ['err', 'ERROR']];
  const paths = ['/api/users', '/api/orders', '/auth/login', '/api/files', '/health', '/api/reports'];
  function logTick() {
    const lv = Math.random() < .75 ? levels[rnd(0, 1)] : pick(levels.slice(2));
    const ip = [rnd(10, 220), rnd(0, 255), rnd(0, 255), rnd(1, 254)].join('.');
    addLine($('logs'), lv[0], `${new Date().toLocaleTimeString('pt-BR')} ${lv[1]} ${ip} ${pick(['GET', 'POST', 'PUT'])} ${pick(paths)} ${pick([200, 200, 200, 201, 304, 404, 500])} ${rnd(8, 480)}ms`);
    setTimeout(logTick, rnd(200, 700) / boost);
  }
  logTick();

  // Gráfico de linha
  const cv = $('line'), ctx = cv.getContext('2d');
  const pts = Array.from({ length: 60 }, () => rnd(40, 70));
  function resize() { cv.width = cv.clientWidth * devicePixelRatio; cv.height = cv.clientHeight * devicePixelRatio; }
  addEventListener('resize', resize); resize();
  function draw() {
    const w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#26324f'; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, h * i / 5); ctx.lineTo(w, h * i / 5); ctx.stroke(); }
    const step = w / (pts.length - 1);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(90,212,230,.35)'); grad.addColorStop(1, 'rgba(90,212,230,0)');
    ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](i * step, h - p / 100 * h));
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](i * step, h - p / 100 * h));
    ctx.strokeStyle = '#5ad4e6'; ctx.lineWidth = 2 * devicePixelRatio; ctx.stroke();
  }
  setInterval(() => {
    const last = pts[pts.length - 1];
    pts.push(Math.max(10, Math.min(95, last + rnd(-12, 12)))); pts.shift(); draw();
  }, 500 / 1);

  // Barras de recursos
  const names = ['CPU', 'Memória', 'Disco', 'Rede', 'GPU'];
  $('bars').innerHTML = names.map((n, i) =>
    `<div class="bar"><span><b>${n}</b><b id="v${i}">0%</b></span><div class="track"><div class="fill" id="f${i}"></div></div></div>`).join('');
  setInterval(() => names.forEach((_, i) => {
    const v = rnd(15, 98);
    $('v' + i).textContent = v + '%';
    $('f' + i).style.width = v + '%';
    $('f' + i).classList.toggle('hot', v > 85);
  }), 1200);

  // Tarefas com progresso
  const tasks = ['Migrando banco de dados', 'Gerando relatório de métricas', 'Compilando módulos', 'Treinando modelo', 'Enviando backup'];
  const prog = tasks.map(() => rnd(0, 60));
  $('tasks').innerHTML = tasks.map((t, i) =>
    `<div class="task"><span style="display:flex;justify-content:space-between;color:var(--dim)"><b>${t}</b><b id="tp${i}"></b></span><div class="track"><div class="fill" id="tf${i}" style="background:var(--amber)"></div></div></div>`).join('');
  setInterval(() => prog.forEach((p, i) => {
    prog[i] = p >= 100 ? 0 : Math.min(100, p + rnd(1, 6));
    $('tp' + i).textContent = prog[i] + '%';
    $('tf' + i).style.width = prog[i] + '%';
  }), 900);

  // Acelerar ao digitar/clicar + tela de relatório com Esc
  const speedUp = () => { boost = 4; clearTimeout(speedUp.t); speedUp.t = setTimeout(() => boost = 1, 1500); };
  addEventListener('keydown', e => { if (e.key === 'Escape') $('boss').hidden = !$('boss').hidden; else speedUp(); });
  addEventListener('click', speedUp);
})();
