/* =====================================================================
   CURVAS DE PRODUÇÃO · SEM 38 · Trem de Passageiros
   Fonte: "Trem de Passageiro - SEM 38 - Curvas de Produção.xlsx"
   ===================================================================== */
const D = window.CV, K = D.kpi, PJ = D.proj, ATV = D.atividades, CAL = D.calendario;

/* ---------- utilitários ---------- */
function sum(a, f) { let s = 0; for (const x of a) s += (f ? f(x) : x) || 0; return s; }
const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fN = (v, d = 2) => (v === null || v === undefined || !isFinite(v)) ? '–' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fP = (v, d = 1) => (v === null || v === undefined || !isFinite(v)) ? '–' : (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
const fD = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '–';
const fDc = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '–';
const trunc = (s, n = 90) => s.length > n ? s.slice(0, n - 1) + '…' : s;
const ult = a => { for (let i = a.length - 1; i >= 0; i--) if (a[i] !== null && a[i] !== undefined) return a[i]; return null; };
const ultIdx = a => { for (let i = a.length - 1; i >= 0; i--) if (a[i] !== null && a[i] !== undefined) return i; return -1; };

/* cada atividade ganha os derivados que o painel usa */
const temVal = x => Array.isArray(x) && x.some(v => v !== null && v !== undefined);
ATV.forEach(a => {
  const prevAc = temVal(a.blBac) ? a.blBac : (temVal(a.blAac) ? a.blAac : null);
  a.prevAc = prevAc;
  a.iReal = ultIdx(a.realac || []);
  a.realHoje = a.realac ? ult(a.realac) : null;
  // previsto comparável: último previsto lançado até a semana do último real
  a.prevHoje = null;
  if (prevAc) { const lim = a.iReal >= 0 ? a.iReal : prevAc.length - 1;
    for (let i = Math.min(lim, prevAc.length - 1); i >= 0; i--) if (prevAc[i] !== null && prevAc[i] !== undefined) { a.prevHoje = prevAc[i]; break; } }
  a.metaTot = temVal(a.tendac) ? ult(a.tendac) : (prevAc ? ult(prevAc) : null);
  a.semMeta = a.metaTot === null;
  a.spi = (a.prevHoje && a.realHoje !== null) ? a.realHoje / a.prevHoje : null;
  a.pct = (a.metaTot && a.realHoje !== null) ? a.realHoje / a.metaTot : null;
  a.saldo = (a.metaTot !== null && a.realHoje !== null) ? a.metaTot - a.realHoje : null;
  // ritmo das 4 últimas semanas com apontamento
  const sem = a.real || [];
  const cheio = sem.map((v, i) => [v, i]).filter(x => x[0] !== null && x[0] !== undefined && x[0] > 0);
  const ul4 = cheio.slice(-4);
  a.ritmo4 = ul4.length ? sum(ul4, x => x[0]) / ul4.length : null;
  a.semRest = (a.ritmo4 && a.saldo > 0) ? a.saldo / a.ritmo4 : null;
  a.status = a.spi === null ? 'sem baseline' : a.spi >= 0.95 ? 'no ritmo' : a.spi >= 0.80 ? 'atenção' : 'crítico';
  a.temBL = !!prevAc;
});
const ATV_BL = ATV.filter(a => a.temBL);

/* ---------- DOM ---------- */
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
function sec(t, sub, ...kids) { const s = el('section', 'sec', `<div class="sec-h"><h2>${h(t)}</h2>${sub ? `<span class="sub">${sub}</span>` : ''}</div>`); kids.forEach(k => k && s.appendChild(typeof k === 'string' ? el('div', '', k) : k)); return s; }
function kpi(l, v, n, cls = '') { return `<div class="kpi ${cls}"><small>${h(l)}</small><b title="${h(v)}">${h(v)}</b>${n ? `<em>${n}</em>` : ''}</div>`; }
function selectHTML(id, label, opts, cur) { return `<label>${h(label)}<select id="${id}">${opts.map(o => `<option value="${h(o)}" ${o === cur ? 'selected' : ''}>${h(o)}</option>`).join('')}</select></label>`; }
function stTag(s) { const m = { 'no ritmo': 'ok', 'atenção': 'warn', 'crítico': 'crit', 'sem baseline': 'neu' }; return `<span class="tag ${m[s] || 'neu'}">${h(s)}</span>`; }
function pctBar(v) { return `<span class="pct"><i><b style="width:${Math.max(0, Math.min(100, (v || 0) * 100))}%"></b></i>${fP(v)}</span>`; }

/* ---------- tabela ---------- */
let TID = 0;
function tabela(cols, rows, opt = {}) {
  const st = { sort: opt.sort ?? null, dir: opt.dir ?? -1 };
  const box = el('div', 'tw' + (opt.alto ? ' alto' : ''));
  const val = (r, c) => typeof c.k === 'function' ? c.k(r) : r[c.k];
  function render() {
    let rs = [...rows];
    if (st.sort !== null) { const c = cols[st.sort]; rs.sort((a, b) => { const x = val(a, c), y = val(b, c); if (x === y) return 0; if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : -1) * st.dir; }); }
    let t = '<table><thead><tr>' + cols.map((c, i) => `<th class="${c.num ? 'num ' : ''}${opt.semSort ? '' : 'sort'}" data-i="${i}">${h(c.t)}${st.sort === i ? `<span class="seta">${st.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('') + '</tr></thead><tbody>';
    for (const r of rs) t += '<tr>' + cols.map(c => { const v = val(r, c); return `<td class="${c.num ? 'num' : (c.cls || '')}">${c.f ? c.f(v, r) : h(v ?? '')}</td>`; }).join('') + '</tr>';
    box.innerHTML = t + '</tbody></table>';
    if (!opt.semSort) box.querySelectorAll('th.sort').forEach(th => th.onclick = () => { const i = +th.dataset.i; if (st.sort === i) st.dir *= -1; else { st.sort = i; st.dir = cols[i].num ? -1 : 1; } render(); });
  }
  render(); return box;
}

/* ---------- gráficos ---------- */
const CH = [];
function chart(canvas, cfg) {
  const ink2 = css('--ink2'), ink3 = css('--ink3'), grid = css('--linha2');
  Chart.defaults.font.family = 'Arial, Helvetica, sans-serif'; Chart.defaults.font.size = 11; Chart.defaults.color = ink2;
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = css('--ink'); Chart.defaults.plugins.tooltip.titleColor = css('--bg');
  Chart.defaults.plugins.tooltip.bodyColor = css('--bg'); Chart.defaults.plugins.tooltip.padding = 8; Chart.defaults.plugins.tooltip.cornerRadius = 4;
  const base = { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
    scales: { x: { grid: { display: false }, border: { color: grid }, ticks: { color: ink3 } },
              y: { grid: { color: grid, drawTicks: false }, border: { display: false }, ticks: { color: ink3 } } } };
  cfg.options = deepMerge(base, cfg.options || {});
  const c = new Chart(canvas, cfg); CH.push(c); return c;
}
function deepMerge(a, b) { const o = { ...a }; for (const k in b) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? deepMerge(a[k], b[k]) : b[k]; return o; }
function destroyCharts() { CH.forEach(c => c.destroy()); CH.length = 0; }
function caixa(alt = 'ch') { const d = el('div', 'painel'); d.appendChild(el('div', alt, '<canvas></canvas>')); return d; }
function legHTML(items) { return el('div', 'leg', items.map(([n, c]) => `<span><i style="background:${c}"></i>${h(n)}</span>`).join('')); }

/* curva S de uma atividade */
function curvaS(canvas, a) {
  const L = a.semanas.map(fDc);
  const ds = [];
  const linha = (dados, rot, cor, dash) => dados && dados.some(v => v !== null && v !== undefined) &&
    ds.push({ label: rot, data: dados, borderColor: cor, backgroundColor: cor, borderWidth: 2, borderDash: dash || [],
              pointRadius: 2, pointHoverRadius: 5, tension: .15, spanGaps: false });
  linha(a.blAac, 'Previsto BL0', css('--ink3'), [3, 3]);
  linha(a.blBac, 'Previsto BL1', css('--azul'));
  linha(a.tendac, 'Tendência', css('--c5'), [6, 3]);
  linha(a.realac, 'Realizado', css('--c2'));
  return chart(canvas, { type: 'line', data: { labels: L, datasets: ds },
    options: { scales: { y: { ticks: { callback: v => fN(v, v >= 100 ? 0 : 1) }, title: { display: true, text: a.un + ' acumulado' } } },
      plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fN(c.parsed.y)} ${a.un}` } } } } });
}
/* barras semanais previsto x real */
function barrasSemana(canvas, a) {
  const L = a.semanas.map(fDc), ds = [];
  if (a.blB || a.blA) ds.push({ label: 'Previsto', data: a.blB || a.blA, backgroundColor: css('--azul-claro'), borderRadius: 3 });
  if (a.real) ds.push({ label: 'Realizado', data: a.real, backgroundColor: css('--azul'), borderRadius: 3 });
  return chart(canvas, { type: 'bar', data: { labels: L, datasets: ds },
    options: { scales: { y: { ticks: { callback: v => fN(v, 1) }, title: { display: true, text: a.un + ' na semana' } } },
      plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fN(c.parsed.y)} ${a.un}` } } } } });
}
