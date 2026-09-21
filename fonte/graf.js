/* =====================================================================
   GRÁFICOS x ANÁLISE
   ===================================================================== */
const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const CAT6 = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];
const corCat = i => cssv(CAT6[i % 6]);
const CH = [];
function chartBase(canvas, cfg) {
  const ink2 = cssv('--mut'), grid = cssv('--ln');
  Chart.defaults.font.family = 'Arial, Helvetica, sans-serif'; Chart.defaults.font.size = 11; Chart.defaults.color = ink2;
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = cssv('--txt'); Chart.defaults.plugins.tooltip.titleColor = cssv('--card');
  Chart.defaults.plugins.tooltip.bodyColor = cssv('--card'); Chart.defaults.plugins.tooltip.padding = 9; Chart.defaults.plugins.tooltip.cornerRadius = 4;
  const base = { responsive: true, maintainAspectRatio: false, animation: false,
    scales: { x: { grid: { display: false }, border: { color: grid }, ticks: { color: ink2 } },
              y: { grid: { color: grid, drawTicks: false }, border: { display: false }, ticks: { color: ink2 } } } };
  cfg.options = dmerge(base, cfg.options || {});
  const c = new Chart(canvas, cfg); CH.push(c); return c;
}
function dmerge(a, b) { const o = { ...a }; for (const k in b) o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') ? dmerge(a[k], b[k]) : b[k]; return o; }
function limpaCharts() { CH.forEach(c => c.destroy()); CH.length = 0; }

/* densidade por núcleo gaussiano, banda pela regra de Silverman */
function kde(dados, grade, banda) {
  const n = dados.length; if (!n) return grade.map(() => 0);
  const m = dados.reduce((a, b) => a + b, 0) / n;
  const dp = Math.sqrt(dados.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, n - 1));
  const ord = [...dados].sort((a, b) => a - b);
  const q = p => { const i = (n - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return ord[lo] + (ord[hi] - ord[lo]) * (i - lo); };
  const iqr = q(.75) - q(.25);
  const hh = banda || 0.9 * Math.min(dp || 1, (iqr || dp || 1) / 1.349) * Math.pow(n, -0.2) || 1;
  const k = u => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
  return grade.map(x => dados.reduce((a, d) => a + k((x - d) / hh), 0) / (n * hh));
}

/* ---------- estado dos filtros ---------- */
const G = { mo: '', fam: '', dim: 'c', semApr: false, met: 'part' };

function baseFiltrada() {
  let R = OBRA === 'ALL' ? D : D.filter(r => r.o === OBRA);
  if (G.mo) R = R.filter(r => r.m === G.mo);
  if (G.fam) R = R.filter(r => r.f === G.fam);
  if (G.semApr) R = R.filter(r => !r.h);
  return R;
}
const ROT_DIM = { c: 'Função', f: 'Família', n: 'Nível', m: 'MOD / MOI' };
function agrupa(rows, chave) {
  const m = {};
  rows.forEach(r => { const k = r[chave] || '(sem)'; const o = m[k] || (m[k] = { k, n: 0, fo: 0, oc: 0, tp: 0, foc: 0, ftp: 0 });
    o.n++; o.fo += r.s; if (r.o === 'OC') { o.oc++; o.foc += r.s; } else { o.tp++; o.ftp += r.s; } });
  return Object.values(m).map(o => ({ ...o, med: o.fo / o.n }));
}

/* ---------- montagem dos filtros ---------- */
function montaFiltros() {
  const fams = [...new Set(D.map(r => r.f))].sort();
  document.getElementById('gfil').innerHTML =
    `<label>Agrupar por<span class="chips">${Object.entries(ROT_DIM).map(([k, v]) => `<button data-d="${k}" class="${G.dim === k ? 'on' : ''}">${v}</button>`).join('')}</span></label>
     <label>Tipo<span class="chips">${[['', 'MOD e MOI'], ['MOD', 'MOD'], ['MOI', 'MOI']].map(([k, v]) => `<button data-m="${k}" class="${G.mo === k ? 'on' : ''}">${v}</button>`).join('')}</span></label>
     <label>Família<select id="gfam"><option value="">Todas</option>${fams.map(f => `<option value="${esc(f)}" ${G.fam === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></label>
     <label>Comparar obras por<span class="chips">${[['part', '% da folha'], ['ef', 'Efetivo'], ['sal', 'Salário médio']].map(([k, v]) => `<button data-t="${k}" class="${G.met === k ? 'on' : ''}">${v}</button>`).join('')}</span></label>
     <label class="chk"><input type="checkbox" id="gapr" ${G.semApr ? 'checked' : ''}> Excluir aprendizes</label>
     <span class="conta" id="gconta"></span>`;
  document.querySelectorAll('#gfil [data-d]').forEach(b => b.onclick = () => { G.dim = b.dataset.d; montaFiltros(); renderGraf(); });
  document.querySelectorAll('#gfil [data-m]').forEach(b => b.onclick = () => { G.mo = b.dataset.m; montaFiltros(); renderGraf(); });
  document.querySelectorAll('#gfil [data-t]').forEach(b => b.onclick = () => { G.met = b.dataset.t; montaFiltros(); renderGraf(); });
  document.getElementById('gfam').onchange = e => { G.fam = e.target.value; renderGraf(); };
  document.getElementById('gapr').onchange = e => { G.semApr = e.target.checked; renderGraf(); };
}

/* ---------- render ---------- */
function renderGraf() {
  limpaCharts();
  const R = baseFiltrada(), n = R.length, tot = R.reduce((a, r) => a + r.s, 0);
  const grupos = agrupa(R, G.dim);
  const rotDim = ROT_DIM[G.dim];
  document.getElementById('gconta').textContent = `${int(n)} colaboradores · ${int(grupos.length)} ${rotDim.toLowerCase()}${grupos.length === 1 ? '' : 's'} · ${kbrl(tot)} de folha`;
  if (!n) { ['g1', 'g2', 'g3', 'g4'].forEach(id => { const e = document.getElementById(id + 'txt'); if (e) e.innerHTML = 'Nenhum colaborador nos filtros atuais.'; }); return; }

  /* 1 · DISPERSÃO folha x salário, bolha = efetivo */
  const maxN = Math.max(...grupos.map(g => g.n));
  const corteF = tot / grupos.length;   // folha média por grupo
  const corteS = tot / n;               // salário médio da seleção
  const pts = grupos.map(g => ({ x: g.fo, y: g.med, r: 5 + 22 * Math.sqrt(g.n / maxN), _g: g }));
  const quad = {
    id: 'quad',
    beforeDatasetsDraw(ch) {
      const { ctx, chartArea: a, scales } = ch;
      const px = scales.x.getPixelForValue(corteF), py = scales.y.getPixelForValue(corteS);
      ctx.save();
      ctx.fillStyle = cssv('--c2') + '12';
      ctx.fillRect(px, a.top, a.right - px, py - a.top);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = cssv('--mut'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom);
      ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke();
      ctx.setLineDash([]); ctx.font = 'bold 10px Arial'; ctx.fillStyle = cssv('--mut');
      ctx.fillText('folha média ' + kbrl(corteF), px + 6, a.top + 13);
      ctx.fillText('salário médio ' + brl(corteS), a.left + 6, py - 5);
      ctx.restore();
    }
  };
  chartBase(document.getElementById('g1'), {
    type: 'bubble', plugins: [quad],
    data: { datasets: [{ data: pts,
      backgroundColor: pts.map(p => (p._g.fo >= corteF && p._g.med >= corteS) ? cssv('--c2') + 'BB' : cssv('--c1') + '8A'),
      borderColor: pts.map(p => (p._g.fo >= corteF && p._g.med >= corteS) ? cssv('--c2') : cssv('--c1')), borderWidth: 1.5 }] },
    options: { layout: { padding: { top: 12, right: 18 } }, scales: {
        x: { type: 'logarithmic', title: { display: true, text: 'folha mensal do grupo (escala log)' },
             ticks: { callback: v => { const m = v / Math.pow(10, Math.floor(Math.log10(v))); return Math.abs(m - 1) < .01 || Math.abs(m - 2) < .01 || Math.abs(m - 5) < .01 ? kbrl(v) : ''; } } },
        y: { beginAtZero: true, title: { display: true, text: 'salário mensal contratual' }, ticks: { callback: v => kbrl(v) } } },
      plugins: { tooltip: { callbacks: {
        title: c => c[0].raw._g.k,
        label: c => [` folha ${brl(c.raw._g.fo)} · ${pct(c.raw._g.fo / tot)} do total`,
                     ` ${int(c.raw._g.n)} ${c.raw._g.n === 1 ? 'pessoa' : 'pessoas'}`,
                     ` salário ${brl2(c.raw._g.med)}`] } } } } });
  const q1 = grupos.filter(g => g.fo >= corteF && g.med >= corteS).sort((a, b) => b.fo - a.fo);
  const q2 = grupos.filter(g => g.fo >= corteF && g.med < corteS).sort((a, b) => b.fo - a.fo);
  const q3 = grupos.filter(g => g.fo < corteF && g.med >= corteS).sort((a, b) => b.fo - a.fo);
  const fq = l => l.reduce((a, g) => a + g.fo, 0), nq = l => l.reduce((a, g) => a + g.n, 0);
  const rd = rotDim.toLowerCase();
  document.getElementById('g1txt').innerHTML = `<b>Onde mexer primeiro.</b> Os cortes são a folha média de ${kbrl(corteF)} por ${rd} e o salário médio de ${brl(corteS)}. <b>Quadrante laranja</b>, pesado e caro: ${q1.length ? `${q1.length} ${rd}${q1.length === 1 ? '' : 's'} com ${int(nq(q1))} ${nq(q1) === 1 ? 'pessoa' : 'pessoas'} e ${kbrl(fq(q1))}, ${pct(fq(q1) / tot)} da folha (${q1.slice(0, 3).map(g => esc(g.k.toLowerCase())).join(', ')})` : 'vazio'}. <b>Pesado e barato</b>, à direita e embaixo: ${q2.length} ${rd}${q2.length === 1 ? '' : 's'}, ${int(nq(q2))} pessoas, ${pct(fq(q2) / tot)} da folha. Esse grupo se ataca por produtividade e dimensionamento de equipe, nunca por salário. <b>Caro e leve</b>, à esquerda e em cima: ${q3.length} ${rd}${q3.length === 1 ? '' : 's'}, só ${int(nq(q3))} pessoas e ${pct(fq(q3) / tot)} da folha. Custa caro por pessoa e quase não move o total: atacar aqui dá trabalho político e pouco resultado financeiro.`;

  /* 2 · HISTOGRAMA com densidade */
  const sal = R.map(r => r.s);
  const lo = Math.min(...sal), hi = Math.max(...sal), bins = 24, larg = ((hi - lo) / bins) || 1;
  const cont = new Array(bins).fill(0);
  sal.forEach(v => cont[Math.min(bins - 1, Math.floor((v - lo) / larg))]++);
  const meio = Array.from({ length: bins }, (_, i) => lo + larg * (i + .5));
  const dens = kde(sal, meio).map(d => d * n * larg);   // mesma escala das barras
  chartBase(document.getElementById('g2'), {
    data: { labels: meio.map(v => kbrl(v)), datasets: [
      { type: 'bar', label: 'colaboradores', data: cont, backgroundColor: cssv('--azul2'),
        borderRadius: 2, barPercentage: .96, categoryPercentage: .99, order: 2 },
      { type: 'line', label: 'densidade', data: dens, borderColor: cssv('--gold'), borderWidth: 2,
        pointRadius: 0, tension: .35, order: 1 }] },
    options: { interaction: { mode: 'index', intersect: false },
      scales: { x: { title: { display: true, text: 'salário mensal contratual' }, ticks: { maxTicksLimit: 9, autoSkip: true } },
                y: { beginAtZero: true, title: { display: true, text: 'nº de colaboradores' }, ticks: { precision: 0 } } },
      plugins: { tooltip: { callbacks: {
        title: c => 'faixa de ' + brl(lo + larg * c[0].dataIndex) + ' a ' + brl(lo + larg * (c[0].dataIndex + 1)),
        label: c => c.datasetIndex === 0 ? ` ${c.parsed.y} ${c.parsed.y === 1 ? 'colaborador' : 'colaboradores'}` : ` densidade ${c.parsed.y.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}` } } } } });
  const degraus = {}; sal.forEach(v => degraus[v] = (degraus[v] || 0) + 1);
  const topD = Object.entries(degraus).map(([v, q]) => [+v, q]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const acima = sal.filter(v => v > tot / n).length;
  document.getElementById('g2txt').innerHTML = `<b>A folha é uma escada, não uma curva.</b> ${int(n)} colaboradores ocupam só ${int(Object.keys(degraus).length)} salários distintos, porque o valor é tabelado por cargo e nível. O degrau mais povoado é <b>${brl2(topD[0][0])}</b>, com ${int(topD[0][1])} ${topD[0][1] === 1 ? 'pessoa' : 'pessoas'} (${pct(topD[0][1] / n)} do efetivo)${topD[1] ? `, seguido de ${brl2(topD[1][0])} com ${int(topD[1][1])} e ${brl2(topD[2][0])} com ${int(topD[2][1])}` : ''}. Só ${int(acima)} ${acima === 1 ? 'pessoa ganha' : 'pessoas ganham'} acima do salário médio de ${brl(tot / n)}, o que mostra que a média é puxada pela cauda e a mediana descreve melhor a obra. Reajustar um degrau move a fatia inteira de uma vez: a conversa de reajuste começa pelo degrau, não pela pessoa.`;

  /* 3 · CASCATA de composição da folha */
  const ord = [...grupos].sort((a, b) => b.fo - a.fo);
  const topC = ord.slice(0, 8), resto = ord.slice(8);
  const passos = [...topC.map(g => ({ nome: cortar(g.k, 20), v: g.fo, nota: `${int(g.n)} ${g.n === 1 ? 'pessoa' : 'pessoas'} · ${pct(g.fo / tot)} da folha` })),
    ...(resto.length ? [{ nome: `Outras (${resto.length})`, v: resto.reduce((a, g) => a + g.fo, 0), nota: `${int(resto.reduce((a, g) => a + g.n, 0))} pessoas` }] : []),
    { nome: 'Folha mensal', v: 0, tipo: 'total' }];
  cascata(document.getElementById('g3'), passos);
  const fTop = topC.reduce((a, g) => a + g.fo, 0), nTop = topC.reduce((a, g) => a + g.n, 0);
  document.getElementById('g3txt').innerHTML = `<b>Como a folha se forma.</b> As ${topC.length} maiores ${rotDim.toLowerCase()}s empilham ${kbrl(fTop)} (${pct(fTop / tot)} da folha) com ${int(nTop)} das ${int(n)} pessoas (${pct(nTop / n)} do efetivo).${resto.length ? ` As outras ${resto.length} fecham os ${kbrl(tot - fTop)} restantes com ${int(n - nTop)} pessoas.` : ''} A maior isolada é <b>${esc(topC[0].k.toLowerCase())}</b>, com ${kbrl(topC[0].fo)} e ${pct(topC[0].fo / tot)} da folha. É a leitura que a diretoria pede: não quanto a folha é, mas de onde ela veio.`;

  /* 4 · SLOPE Obras Civis x Trem de Passageiro */
  const baseSlope = aplicaNaoObra(D);
  const totOC = baseSlope.filter(r => r.o === 'OC').reduce((a, r) => a + r.s, 0);
  const totTP = baseSlope.filter(r => r.o === 'TP').reduce((a, r) => a + r.s, 0);
  const MET = { part: ['participação na folha da obra', v => pct(v), g => totOC ? g.foc / totOC : 0, g => totTP ? g.ftp / totTP : 0],
                ef:   ['pessoas na obra', v => fmtN(v), g => g.oc, g => g.tp],
                sal:  ['salário médio', v => kbrl(v), g => g.foc / g.oc, g => g.ftp / g.tp] };
  const [rotMet, fmtMet, fa, fb] = MET[G.met];
  const gAll = agrupa(baseSlope, G.dim).filter(g => g.oc > 0 && g.tp > 0)
    .sort((a, b) => b.fo - a.fo).slice(0, 10);
  if (gAll.length >= 2) {
    const linhas = gAll.map(g => ({ nome: cortar(g.k, 26), a: fa(g), b: fb(g), g }));
    slope(document.getElementById('g4'), linhas, 'Obras Civis', 'Trem de Passageiro', rotMet, fmtMet);
    document.getElementById('g4leg').innerHTML = linhas.map((l, i) => `<span><i style="background:${corCat(i)}"></i>${esc(l.nome)}</span>`).join('');
    document.getElementById('g4sub').textContent = rotMet + ' em Obras Civis contra Trem de Passageiro';
    const dif = l => l.a ? (l.b - l.a) / l.a : 0;
    const maior = [...linhas].sort((x, y) => Math.abs(dif(y)) - Math.abs(dif(x)))[0];
    const sobem = linhas.filter(l => l.b > l.a * 1.02).length, descem = linhas.filter(l => l.b < l.a * 0.98).length;
    const planas = linhas.length - sobem - descem;
    document.getElementById('g4txt').innerHTML = `<b>As duas obras lado a lado, por ${rotMet}.</b> ${gAll.length} ${rotDim.toLowerCase()}s existem nas duas obras e permitem comparação direta. ${sobem} ${sobem === 1 ? 'pesa' : 'pesam'} mais no Trem de Passageiro, ${descem} ${descem === 1 ? 'pesa' : 'pesam'} mais em Obras Civis e ${planas} ${planas === 1 ? 'fica praticamente igual' : 'ficam praticamente iguais'}. A maior diferença é <b>${esc(maior.nome.toLowerCase())}</b>: ${fmtMet(maior.a)} em Obras Civis contra ${fmtMet(maior.b)} no Trem de Passageiro. ${G.met === 'sal' ? 'Linha plana é cargo com tabela unificada, que é o caso da maioria; linha inclinada é nível diferente ocupando o mesmo nome de cargo, e vale conferir o critério com o DP.' : 'Inclinação forte mostra que o mesmo cargo tem peso diferente nos dois contratos, o que é esperado quando as frentes são diferentes, mas vira alerta quando as frentes são parecidas.'}`;
  } else {
    document.getElementById('g4leg').innerHTML = '';
    document.getElementById('g4txt').innerHTML = `<b>Sem comparação possível nos filtros atuais.</b> A inclinação precisa de ${rotDim.toLowerCase()}s presentes nas duas obras. Afrouxe o filtro de família ou o de tipo.`;
  }
}
function aplicaNaoObra(rows) {
  let R = rows;
  if (G.mo) R = R.filter(r => r.m === G.mo);
  if (G.fam) R = R.filter(r => r.f === G.fam);
  if (G.semApr) R = R.filter(r => !r.h);
  return R;
}
const mediana = a => { const s = [...a].sort((x, y) => x - y), k = s.length; return k ? (k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2) : 0; };
const cortar = (s, k) => s.length > k ? s.slice(0, k - 1) + '…' : s;
const fmtN = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/* ---- cascata com barras flutuantes ---- */
function cascata(canvas, passos) {
  let acum = 0; const flut = [], cores = [];
  for (const p of passos) {
    if (p.tipo === 'total') { flut.push([0, acum]); cores.push(cssv('--azul')); }
    else { const i0 = acum; acum += p.v; flut.push([Math.min(i0, acum), Math.max(i0, acum)]); cores.push(cssv('--c2')); }
  }
  return chartBase(canvas, { type: 'bar',
    data: { labels: passos.map(p => p.nome), datasets: [{ data: flut, backgroundColor: cores, borderRadius: 3, barPercentage: .74 }] },
    options: { scales: { x: { ticks: { maxRotation: 38, minRotation: 0, autoSkip: false, font: { size: 10 } } },
                         y: { ticks: { callback: v => kbrl(v) } } },
      plugins: { tooltip: { callbacks: {
        label: c => { const p = passos[c.dataIndex]; return p.tipo === 'total' ? ` ${brl(c.raw[1])} no total` : ` soma ${brl(Math.abs(p.v))}`; },
        afterLabel: c => passos[c.dataIndex].nota || '' } } } } });
}
/* ---- slope de dois pontos ---- */
function slope(canvas, linhas, rotA, rotB, rotY, fmtY) {
  return chartBase(canvas, { type: 'line',
    data: { labels: [rotA, rotB], datasets: linhas.map((l, i) => ({
      label: l.nome, data: [l.a, l.b], borderColor: corCat(i), backgroundColor: corCat(i),
      borderWidth: 2, pointRadius: 4, pointHoverRadius: 7, tension: 0 })) },
    options: { layout: { padding: { left: 8, right: 8 } },
      scales: { x: { ticks: { font: { size: 12, weight: 'bold' } } }, y: { beginAtZero: true, ticks: { callback: v => fmtY(v) }, title: { display: true, text: rotY } } },
      plugins: { tooltip: { mode: 'nearest', intersect: true, callbacks: { label: c => ` ${c.dataset.label}: ${fmtY(c.parsed.y)}` } } } } });
}
