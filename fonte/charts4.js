/* =====================================================================
   QUATRO FORMAS DE LEITURA · módulo comum aos painéis Marka
   bump (ranking no tempo) · slope (dois momentos) · cascata (composição)
   · histograma com densidade (distribuição)
   Depende de: chart(), css(), fK(), fR0(), fP(), h(), el(), trunc(), sum()
   ===================================================================== */
const CAT6 = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];
const corCat = i => css(CAT6[i % 6]);

/* ---------- 1. BUMP · posição no ranking período a período ---------- */
function bumpChart(canvas, series, labels, opt = {}) {
  // series: [{nome, v:[...]}] — o ranking é recalculado em cada período
  const N = labels.length, S = series.length;
  const rank = series.map(() => new Array(N).fill(null));
  for (let k = 0; k < N; k++) {
    const ord = series.map((s, i) => ({ i, v: s.v[k] })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    ord.forEach((x, pos) => rank[x.i][k] = pos + 1);
  }
  const ds = series.map((s, i) => ({
    label: s.nome, data: rank[i], borderColor: corCat(i), backgroundColor: corCat(i),
    borderWidth: 2.5, pointRadius: 5, pointHoverRadius: 8, pointBorderColor: css('--bg'), pointBorderWidth: 2,
    tension: 0, spanGaps: false,
  }));
  return chart(canvas, { type: 'line', data: { labels, datasets: ds }, options: {
    scales: { y: { reverse: true, min: .5, max: S + .5, ticks: { stepSize: 1, callback: v => Number.isInteger(v) && v >= 1 && v <= S ? v + 'º' : '' }, title: { display: true, text: 'posição no ranking', color: css('--ink3') } },
      x: { ticks: { maxRotation: 0, autoSkip: false, font: { size: 10 } } } },
    plugins: { tooltip: { callbacks: {
      title: c => labels[c[0].dataIndex],
      label: c => ` ${c.parsed.y}º · ${c.dataset.label}: ${fK(series[c.datasetIndex].v[c.dataIndex])}` } } } } });
}

/* ---------- 2. SLOPE · o que mudou entre dois momentos ---------- */
function slopeChart(canvas, linhas, rotA, rotB, opt = {}) {
  // linhas: [{nome, a, b}] — dois pontos por linha
  const fmt = opt.fmt || fK;
  const ds = linhas.map((l, i) => {
    const sobe = l.b >= l.a;
    const c = opt.corPorSinal ? (sobe ? css('--crit') : css('--ok')) : corCat(i);
    return { label: l.nome, data: [l.a, l.b], borderColor: c, backgroundColor: c, borderWidth: 2.5,
      pointRadius: 6, pointHoverRadius: 9, pointBorderColor: css('--bg'), pointBorderWidth: 2, tension: 0 };
  });
  return chart(canvas, { type: 'line', data: { labels: [rotA, rotB], datasets: ds }, options: {
    layout: { padding: { right: 12, left: 12 } },
    scales: { x: { grid: { display: false }, ticks: { font: { size: 12, weight: '700' } } },
      y: { ticks: { callback: v => fmt(v) } } },
    plugins: { tooltip: { callbacks: {
      label: c => ` ${c.dataset.label}: ${fmt(c.parsed.y)}`,
      afterBody: c => { const l = linhas[c[0].datasetIndex]; const d = l.b - l.a;
        return `variação ${d >= 0 ? '+' : ''}${fmt(d)}${l.a ? ` (${d / l.a >= 0 ? '+' : ''}${fP(d / l.a, 0)})` : ''}`; } } } } } });
}

/* ---------- 3. CASCATA · como se chega de um total a outro ---------- */
function cascataChart(canvas, passos, opt = {}) {
  // passos: [{nome, v, tipo:'inicio'|'delta'|'total'}]
  const fmt = opt.fmt || fK;
  let acum = 0; const flut = [], cores = [], valores = [];
  for (const p of passos) {
    if (p.tipo === 'inicio' || p.tipo === 'total') { const base = p.tipo === 'inicio' ? 0 : 0; const topo = p.tipo === 'inicio' ? p.v : acum;
      flut.push([base, p.tipo === 'inicio' ? p.v : acum]); valores.push(p.tipo === 'inicio' ? p.v : acum);
      cores.push(css('--azul-esc')); if (p.tipo === 'inicio') acum = p.v; }
    else { const ini = acum; acum += p.v; flut.push([Math.min(ini, acum), Math.max(ini, acum)]); valores.push(p.v);
      cores.push(p.v >= 0 ? css('--ok') : css('--c2')); }
  }
  return chart(canvas, { type: 'bar', data: { labels: passos.map(p => p.nome), datasets: [{ data: flut, backgroundColor: cores, borderRadius: 4, barPercentage: .7 }] },
    options: { scales: { x: { ticks: { maxRotation: 30, minRotation: 0, autoSkip: false, font: { size: 10 } } }, y: { ticks: { callback: v => fmt(v) } } },
      plugins: { tooltip: { callbacks: { label: c => { const p = passos[c.dataIndex];
        return p.tipo === 'delta' ? ` ${p.v >= 0 ? 'entra' : 'sai'} ${fmt(Math.abs(p.v))}` : ` ${fmt(valores[c.dataIndex])}`; },
        afterLabel: c => passos[c.dataIndex].nota || '' } } } } });
}

/* ---------- 4. HISTOGRAMA COM DENSIDADE ---------- */
function kde(dados, grade, banda) {
  // núcleo gaussiano; banda por regra de Silverman se não informada
  const n = dados.length; if (!n) return grade.map(() => 0);
  const media = sum(dados) / n;
  const dp = Math.sqrt(sum(dados.map(x => (x - media) ** 2)) / n) || 1;
  const ord = [...dados].sort((a, b) => a - b);
  const q = p => ord[Math.min(n - 1, Math.max(0, Math.floor(p * (n - 1))))];
  const iqr = q(.75) - q(.25);
  const bw = banda || 0.9 * Math.min(dp, iqr / 1.349 || dp) * Math.pow(n, -0.2) || dp / 3;
  return grade.map(x => sum(dados.map(d => Math.exp(-0.5 * ((x - d) / bw) ** 2))) / (n * bw * Math.sqrt(2 * Math.PI)));
}
function histogramaDensidade(canvas, dados, opt = {}) {
  const nbins = opt.bins || Math.max(8, Math.min(24, Math.ceil(Math.sqrt(dados.length))));
  const min = opt.min !== undefined ? opt.min : Math.min(...dados);
  const max = opt.max !== undefined ? opt.max : Math.max(...dados);
  const larg = (max - min) / nbins || 1;
  const centros = [], contagem = new Array(nbins).fill(0);
  for (let i = 0; i < nbins; i++) centros.push(min + larg * (i + .5));
  for (const d of dados) { let i = Math.floor((d - min) / larg); if (i >= nbins) i = nbins - 1; if (i < 0) i = 0; contagem[i]++; }
  // densidade na mesma unidade da contagem: dens × n × largura do bin
  const dens = kde(dados, centros, opt.banda).map(v => v * dados.length * larg);
  const fmt = opt.fmt || (v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
  return chart(canvas, { data: { labels: centros.map(c => fmt(c)), datasets: [
      { type: 'bar', label: 'Itens no intervalo', data: contagem, backgroundColor: css('--azul-claro'), borderRadius: 3, barPercentage: 1, categoryPercentage: .92, order: 2 },
      { type: 'line', label: 'Densidade', data: dens, borderColor: css('--ouro'), backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 0, tension: .35, order: 1 }] },
    options: { scales: { x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { size: 10 } }, title: { display: !!opt.eixoX, text: opt.eixoX || '', color: css('--ink3') } },
        y: { title: { display: true, text: 'nº de ocorrências', color: css('--ink3') } } },
      plugins: { tooltip: { callbacks: {
        title: c => `${opt.rotulo || 'faixa'} ≈ ${c[0].label}`,
        label: c => c.dataset.type === 'bar' ? ` ${c.parsed.y} ocorrência(s)` : ` densidade ${c.parsed.y.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}` } } } } });
}

/* ---------- moldura explicativa de cada gráfico ---------- */
function blocoGrafico(titulo, comoLer, quandoUsar, altura = 'ch alto') {
  const p = el('div', 'painel');
  p.innerHTML = `<div class="sec-h"><h2>${h(titulo)}</h2></div>
    <div class="leg-exp"><b>Como ler:</b> ${comoLer}</div>
    <div class="${altura}"><canvas></canvas></div>
    <div class="nota"><b>Quando usar:</b> ${quandoUsar}</div>`;
  return p;
}
