/* =====================================================================
   PAINEL DE EFETIVO · TFPM · Obras Civis + Trem de Passageiros
   Fonte: planilhas SGC de 07/10/2026. Sem dado nominal: o repositório é público.
   ===================================================================== */
const D = window.EF, A = D.ativos, S = D.saidas, AF = D.afastados, META = D.meta;
const OBRA = { OC: 'Obras Civis', TP: 'Trem de Passageiros' };

const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fN = v => (v === null || v === undefined || !isFinite(v)) ? '–' : v.toLocaleString('pt-BR');
const fR = v => (v === null || v === undefined || !isFinite(v)) ? '–' : 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fR0 = v => (v === null || v === undefined || !isFinite(v)) ? '–' : 'R$ ' + v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const fP = (v, d = 1) => (v === null || !isFinite(v)) ? '–' : (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
const fD1 = v => (v === null || v === undefined || !isFinite(v)) ? '–' : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const soma = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
const el = (t, c, html) => { const e = document.createElement(t); if (c) e.className = c; if (html !== undefined) e.innerHTML = html; return e; };
const mesLbl = m => { if (!m) return '–'; const [y, mm] = m.split('-'); return ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][+mm - 1] + '/' + y.slice(2); };
function grupo(arr, f) { const m = new Map(); arr.forEach(x => { const k = f(x); if (k === null || k === undefined || k === '') return; m.set(k, (m.get(k) || []).concat([x])); }); return m; }

/* ---------- estado e filtro de obra ---------- */
const ST = { view: 'geral', obra: '' };
const sel = () => ST.obra ? A.filter(p => p.o === ST.obra) : A;
const selS = () => ST.obra ? S.filter(p => p.o === ST.obra) : S;

/* ---------- derivados ---------- */
// 'Não está na obra' contém 'na obra': testar pelo negativo, nunca pelo positivo
A.forEach(p => { p.naObra = !/n[ãa]o est[áa]|processo de mobiliza/i.test(p.loc); });
const CHARTS = [];
function chart(cv, cfg) {
  cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } } }, cfg.options || {});
  CHARTS.push(new Chart(cv, cfg));
}
function limpaCharts() { CHARTS.splice(0).forEach(c => c.destroy()); }

/* ---------- blocos reutilizáveis ---------- */
function kpi(v, l, d, cls) {
  return `<div class="kpi ${cls || ''}"><div class="v">${v}</div><div class="l">${l}</div>${d ? `<div class="d">${d}</div>` : ''}</div>`;
}
function barras(dados, opt = {}) {
  const max = Math.max(...dados.map(d => d.v), 1);
  return '<div class="hb">' + dados.map(d =>
    `<div class="lab" title="${h(d.k)}">${h(d.k)}</div>
     <div class="trk"><div class="fil${d.cls ? ' ' + d.cls : ''}" style="width:${Math.max(1, d.v / max * 100)}%"></div></div>
     <div class="val">${opt.fmt ? opt.fmt(d.v) : fN(d.v)}${d.sub ? `<small>${d.sub}</small>` : ''}</div>`).join('') + '</div>';
}
function painel(titulo, sub, conteudo) {
  return `<div class="panel"><h2>${titulo}</h2><p class="h2s">${sub}</p>${conteudo}</div>`;
}
function tabela(cols, linhas) {
  return `<div class="tw"><table><thead><tr>${cols.map(c => `<th class="${c.n ? 'num' : ''}">${c.t}</th>`).join('')}</tr></thead>
  <tbody>${linhas.map(r => `<tr>${cols.map(c => `<td class="${c.n ? 'num' : ''}">${c.f ? c.f(r) : h(r[c.k] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
