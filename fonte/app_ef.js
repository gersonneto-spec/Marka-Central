/* =====================================================================
   PAINEL DE EFETIVO · TFPM · Obras Civis + Trem de Passageiros
   Base: planilhas SGC de colaboradores. Todo número da tela é clicável e
   abre a lista nominal por trás dele.
   ===================================================================== */
const D = window.EF, A = D.ativos, S = D.saidas, AF = D.afastados, META = D.meta;
const OBRA = { OC: 'Obras Civis', TP: 'Trem de Passageiros' };
const HOJE = META.data;
// nominal=false: a versão publicada no repositório público troca o nome pela matrícula.
// Mesma tela, mesmos cliques, sem dado pessoal exposto na internet.
const NOM = META.nominal !== false;
const quem = p => NOM ? `<b>${h(p.n)}</b><br><small>mat. ${h(p.mat)}</small>` : `<b>mat. ${h(p.mat)}</b>`;
const ordem = (a, b) => NOM ? a.n.localeCompare(b.n, 'pt-BR') : String(a.mat).localeCompare(String(b.mat), 'pt-BR', { numeric: true });

const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fN = v => (v === null || v === undefined || !isFinite(v)) ? '–' : v.toLocaleString('pt-BR');
const fP = (v, d = 1) => (v === null || !isFinite(v)) ? '–' : (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';
const f1 = v => (v === null || v === undefined || !isFinite(v)) ? '–' : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fD = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '–';
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fM = m => m ? MES[+m.slice(5, 7) - 1] + '/' + m.slice(2, 4) : '–';
const soma = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x) || 0, 0);
const med = a => { if (!a.length) return null; const o = [...a].sort((x, y) => x - y); return o[Math.floor(o.length / 2)]; };
function grupo(arr, f) { const m = new Map(); arr.forEach(x => { const k = f(x); if (k === null || k === undefined || k === '') return; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }); return m; }
const trunc = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

/* ---------- estado ---------- */
const ST = { view: 'geral', obra: '' };
const sel = () => ST.obra ? A.filter(p => p.o === ST.obra) : A;
const selS = () => ST.obra ? S.filter(p => p.o === ST.obra) : S;

/* ---------- gaveta: a lista nominal por trás de cada número ---------- */
const COLS_AT = [
  { t: NOM ? 'Nome' : 'Matrícula', f: quem },
  { t: 'Função', f: p => h(p.c) },
  { t: 'Obra', f: p => OBRA[p.o] },
  { t: 'Tipo', f: p => p.m },
  { t: 'Admissão', f: p => fD(p.adm), n: true },
  { t: 'Tempo de casa', f: p => p.tc === null ? '–' : f1(p.tc) + ' a', n: true },
  { t: 'Idade', f: p => p.id === null ? '–' : p.id, n: true },
  { t: 'Situação', f: p => p.naObra ? 'na obra' : `<span class="av">${h(p.loc)}</span>` },
  { t: 'Crachá', f: p => p.blo === null ? '–' : (p.blo < 0 ? `<span class="av">vencido há ${-p.blo} d</span>` : p.blo <= 30 ? `<span class="av">${p.blo} d</span>` : p.blo + ' d'), n: true },
];
const COLS_SA = [
  { t: NOM ? 'Nome' : 'Matrícula', f: quem },
  { t: 'Função', f: p => h(p.c) },
  { t: 'Obra', f: p => OBRA[p.o] },
  { t: 'Motivo', f: p => h(p.mot) },
  { t: 'Admissão', f: p => fM(p.ma), n: true },
  { t: 'Saída', f: p => fD(p.dt), n: true },
  { t: 'Tempo de casa', f: p => p.tc === null ? '–' : f1(p.tc) + ' a', n: true },
];

function abrir(lista, titulo, sub, cols) {
  cols = cols || COLS_AT;
  const dr = document.getElementById('drawer');
  const ord = [...lista].sort(ordem);
  dr.innerHTML = `<div class="dtopo">
      <div><h3>${h(titulo)}</h3><p>${sub ? h(sub) + ' &middot; ' : ''}${fN(ord.length)} pessoa${ord.length === 1 ? '' : 's'}</p></div>
      <button class="dfecha" aria-label="Fechar">&times;</button></div>
    <div class="dcorpo"><div class="tw"><table><thead><tr>${cols.map(c => `<th class="${c.n ? 'num' : ''}">${c.t}</th>`).join('')}</tr></thead>
    <tbody>${ord.map(p => `<tr>${cols.map(c => `<td class="${c.n ? 'num' : ''}">${c.f(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
  dr.classList.add('on');
  document.getElementById('veu').classList.add('on');
  dr.querySelector('.dfecha').onclick = fechar;
}
function fechar() {
  document.getElementById('drawer').classList.remove('on');
  document.getElementById('veu').classList.remove('on');
}

/* ---------- gráficos ---------- */
const CHARTS = [];
function chart(cv, cfg) {
  cfg.options = Object.assign({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; },
  }, cfg.options || {});
  CHARTS.push(new Chart(cv, cfg));
}
function limpaCharts() { CHARTS.splice(0).forEach(c => c.destroy()); }

/* ---------- blocos ---------- */
function kpi(v, l, d, opt = {}) {
  const id = 'k' + Math.random().toString(36).slice(2, 9);
  setTimeout(() => {
    const e = document.getElementById(id);
    if (e && opt.lista) { e.classList.add('clic'); e.onclick = () => abrir(opt.lista, opt.tit || l, opt.sub, opt.cols); }
  });
  return `<div class="kpi ${opt.cls || ''}" id="${id}"><div class="v">${v}</div><div class="l">${l}</div>${d ? `<div class="d">${d}</div>` : ''}</div>`;
}
function barras(dados, opt = {}) {
  const max = Math.max(...dados.map(d => d.v), 1);
  const id = 'b' + Math.random().toString(36).slice(2, 9);
  setTimeout(() => {
    const e = document.getElementById(id);
    if (e) e.querySelectorAll('[data-i]').forEach(n => {
      const d = dados[+n.dataset.i];
      if (d.lista) { n.classList.add('clic'); n.onclick = () => abrir(d.lista, d.tit || d.k, opt.sub, opt.cols); }
    });
  });
  return `<div class="hb" id="${id}">` + dados.map((d, i) =>
    `<div class="lab" data-i="${i}" title="${h(d.k)}">${h(d.k)}</div>
     <div class="trk" data-i="${i}"><div class="fil${d.cls ? ' ' + d.cls : ''}" style="width:${Math.max(1.5, d.v / max * 100)}%"></div></div>
     <div class="val" data-i="${i}">${opt.fmt ? opt.fmt(d.v) : fN(d.v)}${d.sub ? `<small>${d.sub}</small>` : ''}</div>`).join('') + '</div>';
}
function painel(titulo, sub, conteudo, larg) {
  return `<div class="panel${larg ? ' w2' : ''}"><h2>${titulo}</h2><p class="h2s">${sub}</p>${conteudo}</div>`;
}
