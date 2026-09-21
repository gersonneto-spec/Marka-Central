/* =====================================================================
   GUIA DA SEMANA · SEM 38 · Oficina de Trens de Passageiros
   Fonte: PDF "Trem de Passageiro - SEM38 - Cronograma" (460 linhas, Rev. 00 / LB_rev1)
   ===================================================================== */
const D = window.CR, T = D.tarefas;
const HOJE = D.meta.hoje, H1 = D.meta.sem1, H2 = D.meta.horizonte;

/* ---------- utilitários ---------- */
function sum(a, f) { let s = 0; for (const x of a) s += (f ? f(x) : x) || 0; return s; }
const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fN = (v, d = 0) => (v === null || v === undefined || !isFinite(v)) ? '–' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const fP = (v, d = 1) => (v === null || v === undefined || !isFinite(v)) ? '–' : (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
const fD = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '–';
const fDc = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) : '–';
const trunc = (s, n = 90) => s.length > n ? s.slice(0, n - 1) + '…' : s;
const dias = (a, b) => Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 86400000);
const addD = (s, n) => new Date(Date.parse(s + 'T00:00:00') + n * 86400000).toISOString().slice(0, 10);

/* ---------- hierarquia ---------- */
T.forEach((x, i) => { x.folha = !(i + 1 < T.length && T[i + 1].nivel > x.nivel); });
// pacote = ancestral de nível 3 (ex.: 1.5.1 TP05) e frente = nível 4
const pilha = [];
T.forEach(x => {
  pilha[x.nivel] = x; pilha.length = x.nivel + 1;
  x.ramo = (pilha[2] || x).nome;
  x.pacote = (pilha[3] || pilha[2] || x).nome;
  x.frente = (pilha[4] || pilha[3] || pilha[2] || x).nome;
  x.caminho = pilha.slice(2, x.nivel).map(p => p.nome).join(' › ');
});
const FOLHAS = T.filter(x => x.folha);
const MARCOS = T.filter(x => x.eap.startsWith('1.1.') && x.folha);
const RAIZ = T[0];

/* ---------- situação de cada folha · referência = LINHA DE BASE ---------- */
FOLHAS.forEach(x => {
  const r = x.real || 0;
  x.desvioIni = (x.ini && x.iniBL) ? dias(x.iniBL, x.ini) : null;
  x.desvioLB = (x.fim && x.fimBL) ? dias(x.fimBL, x.fim) : null;
  x.concluida = r >= 1;
  x.aberta = r > 0 && r < 1;
  // atraso medido contra a LINHA DE BASE, não contra a data replanejada
  x.atrasoIni = (!x.concluida && r === 0 && x.iniBL && x.iniBL < HOJE) ? dias(x.iniBL, HOJE) : null;
  x.atrasoFim = (!x.concluida && x.fimBL && x.fimBL < HOJE) ? dias(x.fimBL, HOJE) : null;
  x.atrasada = x.atrasoIni !== null || x.atrasoFim !== null;
  x.atrasoDias = Math.max(x.atrasoIni || 0, x.atrasoFim || 0) || null;
  x.tipoAtraso = x.atrasoFim !== null ? (r > 0 ? 'término vencido' : 'nem iniciou e já venceu') : (x.atrasoIni !== null ? 'início vencido' : null);
  // janelas pela LINHA DE BASE
  x.noHorizonteBL = !!x.iniBL && !!x.fimBL && x.iniBL <= H2 && x.fimBL >= H1 && r < 1;
  x.situacao = x.concluida ? 'concluída' : x.atrasada ? 'atrasada' : x.aberta ? 'em andamento' : (x.iniBL && x.iniBL <= H2 ? 'a iniciar' : 'futura');
});
const NO_HORIZ = FOLHAS.filter(x => x.noHorizonteBL).sort((a, b) => (a.iniBL < b.iniBL ? -1 : a.iniBL > b.iniBL ? 1 : a.id - b.id));
const ABERTAS = FOLHAS.filter(x => x.aberta).sort((a, b) => (a.fimBL < b.fimBL ? -1 : 1));
const ATRASADAS = FOLHAS.filter(x => x.atrasada).sort((a, b) => (b.atrasoDias || 0) - (a.atrasoDias || 0));

/* semanas do horizonte, sempre pela linha de base */
const SEMANAS = [];
for (let k = 0; k < 4; k++) {
  const ini = addD(H1, k * 7), fim = addD(H1, k * 7 + 6);
  SEMANAS.push({ k, ini, fim, rot: `${fDc(ini)} a ${fDc(fim)}`,
    itens: FOLHAS.filter(x => x.iniBL && x.fimBL && x.iniBL <= fim && x.fimBL >= ini && (x.real || 0) < 1) });
}
const IDP = RAIZ.prev ? RAIZ.real / RAIZ.prev : null;

/* ---------- agrupamento por pacote (nível 3 da EAP) ---------- */
function porPacote(lista) {
  const m = new Map();
  for (const x of lista) { let o = m.get(x.pacote); if (!o) { o = { k: x.pacote, itens: [] }; m.set(x.pacote, o); } o.itens.push(x); }
  return [...m.values()].sort((a, b) => b.itens.length - a.itens.length);
}

/* ---------- tendência de término ---------- */
const OBRA = {
  ini: RAIZ.iniBL, fimBL: RAIZ.fimBL, fimCrono: RAIZ.fim,
  durBL: dias(RAIZ.iniBL, RAIZ.fimBL),
  decorrido: dias(RAIZ.iniBL, HOJE),
};
OBRA.restBL = OBRA.durBL - OBRA.decorrido;
OBRA.pctTempo = OBRA.decorrido / OBRA.durBL;
// (a) atraso já acumulado, mantido o ritmo da LB daqui para frente
OBRA.projA = addD(RAIZ.fimBL, Math.round(OBRA.decorrido * (1 / IDP - 1)));
// (b) saldo executado no ritmo atual
OBRA.diasRest = Math.round(OBRA.restBL / IDP);
OBRA.projB = addD(HOJE, OBRA.diasRest);
OBRA.atrasoA = dias(RAIZ.fimBL, OBRA.projA);
OBRA.atrasoB = dias(RAIZ.fimBL, OBRA.projB);
OBRA.declarado = dias(RAIZ.fimBL, RAIZ.fim);

/* ---------- DOM ---------- */
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
function sec(t, sub, ...kids) { const s = el('section', 'sec', `<div class="sec-h"><h2>${h(t)}</h2>${sub ? `<span class="sub">${sub}</span>` : ''}</div>`); kids.forEach(k => k && s.appendChild(typeof k === 'string' ? el('div', '', k) : k)); return s; }
function kpi(l, v, n, cls = '') { return `<div class="kpi ${cls}"><small>${h(l)}</small><b title="${h(v)}">${h(v)}</b>${n ? `<em>${n}</em>` : ''}</div>`; }
function selectHTML(id, label, opts, cur, all) { return `<label>${h(label)}<select id="${id}">${all ? `<option value="">${h(all)}</option>` : ''}${opts.map(o => `<option value="${h(o)}" ${o === cur ? 'selected' : ''}>${h(o)}</option>`).join('')}</select></label>`; }
function stTag(s) { const m = { 'atrasada': 'crit', 'em andamento': 'A', 'concluída': 'ok', 'a iniciar': 'warn', 'futura': 'neu' }; return `<span class="tag ${m[s] || 'neu'}">${h(s)}</span>`; }
function pctBar(v) { return `<span class="pct"><i><b style="width:${Math.max(0, Math.min(100, (v || 0) * 100))}%"></b></i>${fP(v, 0)}</span>`; }
function desvTag(d) { if (d === null) return '–'; if (d === 0) return '<span style="color:var(--ok)">na LB</span>'; return `<span style="color:${d > 0 ? 'var(--crit)' : 'var(--ok)'}">${d > 0 ? '+' : ''}${d} d</span>`; }

let TID = 0;
function tabela(cols, rows, opt = {}) {
  const st = { sort: opt.sort ?? null, dir: opt.dir ?? -1 };
  const box = el('div', 'tw' + (opt.alto ? ' alto' : ''));
  const val = (r, c) => typeof c.k === 'function' ? c.k(r) : r[c.k];
  function render() {
    let rs = [...rows];
    if (st.sort !== null) { const c = cols[st.sort]; rs.sort((a, b) => { const x = val(a, c), y = val(b, c); if (x === y) return 0; if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : -1) * st.dir; }); }
    let t = '<table><thead><tr>' + cols.map((c, i) => `<th class="${c.num ? 'num ' : ''}${opt.semSort ? '' : 'sort'}" data-i="${i}">${h(c.t)}${st.sort === i ? `<span class="seta">${st.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('') + '</tr></thead><tbody>';
    if (!rs.length) t += `<tr><td colspan="${cols.length}" style="text-align:center;color:var(--ink3);padding:18px">Nada nesta condição.</td></tr>`;
    for (const r of rs) t += '<tr>' + cols.map(c => { const v = val(r, c); return `<td class="${c.num ? 'num' : (c.cls || '')}">${c.f ? c.f(v, r) : h(v ?? '')}</td>`; }).join('') + '</tr>';
    box.innerHTML = t + '</tbody></table>';
    if (!opt.semSort) box.querySelectorAll('th.sort').forEach(th => th.onclick = () => { const i = +th.dataset.i; if (st.sort === i) st.dir *= -1; else { st.sort = i; st.dir = cols[i].num ? -1 : 1; } render(); });
  }
  render(); return box;
}

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
