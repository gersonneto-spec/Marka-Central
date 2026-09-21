/* =====================================================================
   VIEWS
   ===================================================================== */
const VIEWS = [
  ['painel', 'Painel', vPainel], ['esc', 'Escavação 1ª Cat.', vEsc],
  ['ativ', 'Curva por Atividade', vAtiv], ['proj', 'Projeção de Término', vProj],
  ['comp', 'Comparativo', vComp],
];
const STATE = { view: 'painel' };

function vPainel(root) {
  destroyCharts();
  const esc = ATV[0];
  const atraso = K.atrasoSem;
  root.appendChild(el('div', 'kpis',
    kpi('Avanço da escavação', fP(K.pctReal), `${fN(K.realAc)} de ${fN(K.meta)} m³ x mil`, K.pctReal < .8 ? 'crit' : '') +
    kpi('Aderência ao BL0', fN(K.spi, 3), `deveria estar 100% em ${fD(K.fimBL)}`, K.spi < .8 ? 'crit' : '') +
    kpi('Saldo a executar', fN(K.saldo) + ' mil m³', 'até a meta contratual') +
    kpi('Ritmo 4 semanas', fN(K.ritmo4) + ' mil m³', 'por semana apontada') +
    kpi('Término projetado', fD(K.fimProj), `baseline ${fD(K.fimBL)}`, 'crit') +
    kpi('Atraso projetado', fN(atraso, 1) + ' sem', 'mantido o ritmo atual', 'ouro')));

  root.appendChild(el('div', 'dica', `<b>Duas leituras de atraso, as duas verdadeiras.</b> Contra o <b>BL0</b>, a linha de base original, a escavação deveria estar concluída em ${fD(K.fimBL)} e está em ${fP(K.pctReal)}: SPI 0,588. Contra o <b>BL1</b>, o replanejamento que empurrou o término para ${fD(ATV[0].semanas[ATV[0].semanas.length - 1])}, o SPI é ${fN(ATV[0].spi, 3)}. O primeiro número é o que a Vale cobra no contrato; o segundo é o que mede a equipe hoje. Leve os dois para a reunião.`));
  root.appendChild(el('div', 'dica', `<b>Onde a obra está.</b> A escavação de 1ª categoria fechou o baseline em ${fD(K.fimBL)} com ${fP(K.pctReal)} executado. Faltam ${fN(K.saldo)} mil m³ e o ritmo das últimas 4 semanas é de ${fN(K.ritmo4)} mil m³ por semana, o que joga o término para ${fD(K.fimProj)}. Esse é o número que sustenta conversa de prazo com a Vale e eventual pleito de improdutividade.`));

  const c1 = caixa('ch alto');
  root.appendChild(sec('Curva S · Escavação de 1ª Categoria', 'previsto BL0, previsto BL1, realizado e tendência', c1));
  curvaS(c1.querySelector('canvas'), esc);
  root.appendChild(legHTML([['Previsto BL0', css('--ink3')], ['Previsto BL1', css('--azul')], ['Tendência', css('--c5')], ['Realizado', css('--c2')]]));

  const linhas = ATV.map(a => ({ ...a }));
  root.appendChild(sec('Todas as frentes medidas', `${ATV.length} atividades acompanhadas por curva`, tabela([
    { t: 'Atividade', k: 'titulo' }, { t: 'Frente', k: 'frente' }, { t: 'Un.', k: 'un' },
    { t: 'Meta', k: 'metaTot', num: true, f: v => v === null ? '–' : fN(v) },
    { t: 'Realizado', k: 'realHoje', num: true, f: v => fN(v) },
    { t: 'Previsto até hoje', k: 'prevHoje', num: true, f: v => v === null ? '–' : fN(v) },
    { t: '% concluído', k: 'pct', num: true, f: (v, r) => r.semMeta ? '<span style="color:var(--ink3)">sem meta na aba</span>' : pctBar(v) },
    { t: 'SPI vs BL1', k: 'spi', num: true, f: v => v === null ? '–' : `<span style="color:${v >= .95 ? 'var(--ok)' : v >= .8 ? 'var(--warn)' : 'var(--crit)'}">${fN(v, 3)}</span>` },
    { t: 'Ritmo 4 sem', k: 'ritmo4', num: true, f: v => v === null ? '–' : fN(v) },
    { t: 'Saldo', k: 'saldo', num: true, f: v => v === null ? '–' : fN(v) },
    { t: 'Semanas p/ concluir', k: 'semRest', num: true, f: v => v === null ? '–' : fN(v, 1) },
    { t: 'Status', k: 'status', f: v => stTag(v) },
  ], linhas, { sort: 6 })));

  const criticas = ATV_BL.filter(a => a.spi !== null && a.spi < .8);
  if (criticas.length) root.appendChild(el('div', 'dica', `<b>Frentes fora de ritmo.</b> ${criticas.length} de ${ATV_BL.length} atividades com baseline estão abaixo de 0,80 de SPI: ${criticas.map(a => `${h(a.titulo)} (${fN(a.spi, 2)})`).join(', ')}. São essas que puxam o cronograma e que precisam de plano de recuperação nesta semana.`));
}

function vEsc(root) {
  destroyCharts();
  const a = ATV[0];
  const c1 = caixa('ch alto'); root.appendChild(sec('Curva S acumulada', a.un, c1)); curvaS(c1.querySelector('canvas'), a);
  root.appendChild(legHTML([['Previsto BL0', css('--ink3')], ['Previsto BL1', css('--azul')], ['Tendência', css('--c5')], ['Realizado', css('--c2')]]));
  const c2 = caixa(); root.appendChild(sec('Produção semanal', 'previsto x realizado, semana a semana', c2)); barrasSemana(c2.querySelector('canvas'), a);
  root.appendChild(legHTML([['Previsto', css('--azul-claro')], ['Realizado', css('--azul')]]));

  const rows = a.semanas.map((s, i) => ({
    sem: fD(s), prevS: (a.blB || [])[i], prevA: (a.blBac || [])[i], realS: (a.real || [])[i], realA: (a.realac || [])[i],
    bl0: (a.blAac || [])[i], tend: (a.tendac || [])[i],
    desv: ((a.realac || [])[i] !== null && (a.realac || [])[i] !== undefined && (a.blBac || [])[i]) ? (a.realac[i] - a.blBac[i]) : null,
  }));
  root.appendChild(sec('Semana a semana', 'valores em ' + a.un, tabela([
    { t: 'Semana', k: 'sem' },
    { t: 'Previsto BL0 acum.', k: 'bl0', num: true, f: v => v == null ? '–' : fN(v) },
    { t: 'Previsto BL1 sem.', k: 'prevS', num: true, f: v => v == null ? '–' : fN(v) },
    { t: 'Previsto BL1 acum.', k: 'prevA', num: true, f: v => v == null ? '–' : fN(v) },
    { t: 'Realizado sem.', k: 'realS', num: true, f: v => v == null ? '–' : fN(v) },
    { t: 'Realizado acum.', k: 'realA', num: true, f: v => v == null ? '–' : fN(v) },
    { t: 'Desvio acum.', k: 'desv', num: true, f: v => v == null ? '–' : `<span style="color:${v >= 0 ? 'var(--ok)' : 'var(--crit)'}">${v > 0 ? '+' : ''}${fN(v)}</span>` },
    { t: 'Tendência acum.', k: 'tend', num: true, f: v => v == null ? '–' : fN(v) },
  ], rows, { semSort: true })));

  const i = a.iReal, desvHoje = a.realac[i] - a.blBac[i];
  root.appendChild(el('div', 'dica', `<b>Leitura.</b> Na semana de ${fD(a.semanas[i])} o acumulado real é de ${fN(a.realac[i])} ${a.un} contra ${fN(a.blBac[i])} previstos, ou seja ${fN(Math.abs(desvHoje))} ${a.un} de déficit (${fP(Math.abs(desvHoje) / a.blBac[i])} do previsto). O BL0 original pedia ${fN(ult(a.blAac))} ${a.un} já concluídos em ${fD(K.fimBL)}.`));
}

function vAtiv(root) {
  const S = STATE.ativ ||= { i: 0 };
  const f = el('div', 'filtros'); const out = el('div'); root.append(f, out);
  f.innerHTML = selectHTML('a', 'Atividade', ATV.map(a => a.titulo), ATV[S.i].titulo) +
    `<span class="conta">${ATV.length} curvas acompanhadas</span>`;
  f.querySelector('#a').onchange = e => { S.i = ATV.findIndex(a => a.titulo === e.target.value); draw(); };
  function draw() {
    destroyCharts(); out.innerHTML = '';
    const a = ATV[S.i];
    out.appendChild(el('div', 'kpis',
      kpi('Meta', fN(a.metaTot) + ' ' + a.un, 'quantidade total da curva') +
      kpi('Realizado', fN(a.realHoje) + ' ' + a.un, fP(a.pct) + ' da meta') +
      kpi('Previsto até hoje', a.prevHoje === null ? '–' : fN(a.prevHoje) + ' ' + a.un, a.temBL ? 'pela linha de base' : 'sem baseline nesta aba') +
      kpi('SPI', a.spi === null ? '–' : fN(a.spi, 3), 'realizado / previsto', a.spi !== null && a.spi < .8 ? 'crit' : '') +
      kpi('Ritmo 4 sem', a.ritmo4 === null ? '–' : fN(a.ritmo4) + ' ' + a.un, 'média das últimas 4 semanas com apontamento') +
      kpi('Semanas p/ concluir', a.semRest === null ? '–' : fN(a.semRest, 1), 'mantido o ritmo', 'ouro')));
    const c1 = caixa('ch alto'); out.appendChild(sec('Curva S acumulada', a.frente + ' · ' + a.un, c1)); curvaS(c1.querySelector('canvas'), a);
    out.appendChild(legHTML([['Previsto BL0', css('--ink3')], ['Previsto BL1', css('--azul')], ['Tendência', css('--c5')], ['Realizado', css('--c2')]]));
    const c2 = caixa(); out.appendChild(sec('Produção semanal', 'previsto x realizado', c2)); barrasSemana(c2.querySelector('canvas'), a);
    const rows = a.semanas.map((s, i) => ({ sem: fD(s), p: (a.blBac || a.blAac || [])[i], r: (a.realac || [])[i], ps: (a.blB || a.blA || [])[i], rs: (a.real || [])[i] }));
    out.appendChild(sec('Semana a semana', a.un, tabela([
      { t: 'Semana', k: 'sem' }, { t: 'Previsto sem.', k: 'ps', num: true, f: v => v == null ? '–' : fN(v) },
      { t: 'Realizado sem.', k: 'rs', num: true, f: v => v == null ? '–' : fN(v) },
      { t: 'Previsto acum.', k: 'p', num: true, f: v => v == null ? '–' : fN(v) },
      { t: 'Realizado acum.', k: 'r', num: true, f: v => v == null ? '–' : fN(v) },
      { t: 'Desvio', k: r => (r.r != null && r.p) ? r.r - r.p : null, num: true, f: v => v == null ? '–' : `<span style="color:${v >= 0 ? 'var(--ok)' : 'var(--crit)'}">${v > 0 ? '+' : ''}${fN(v)}</span>` },
    ], rows, { semSort: true })));
  }
  draw();
}

function vProj(root) {
  destroyCharts();
  root.appendChild(el('div', 'kpis',
    kpi('Produtividade por dia útil', fN(PJ.produtDia, 3) + ' mil m³', `janela de ${PJ.janelaDias} dias desde ${fD(PJ.iniJanela)}`) +
    kpi('Produção na janela', fN(PJ.prodJanela) + ' mil m³', `em ${PJ.diasUteisJanela} dias úteis`) +
    kpi('Saldo a executar', fN(PJ.saldo) + ' mil m³', 'até a meta de ' + fN(K.meta)) +
    kpi('Dias úteis necessários', fN(PJ.diasUteisNec, 0), PJ.calendario) +
    kpi('Término projetado', fD(PJ.fimProj), `${fN(PJ.semanas, 1)} semanas corridas`, 'crit') +
    kpi('Atraso vs baseline', fN(PJ.atrasoSem, 1) + ' sem', `baseline ${fD(PJ.fimBL)}`, 'ouro')));

  root.appendChild(el('div', 'dica', `<b>Como a projeção é montada.</b> Pega a produção dos últimos ${PJ.janelaDias} dias corridos (${fN(PJ.prodJanela)} mil m³ em ${PJ.diasUteisJanela} dias úteis), divide pelo número de dias úteis e projeta o saldo de ${fN(PJ.saldo)} mil m³ no calendário real da obra: ${PJ.calendario}. Não usa média histórica, usa o ritmo de agora.`));

  const futuro = CAL.filter(d => d.prod !== null && d.prod !== undefined);
  const c1 = caixa('ch alto'); root.appendChild(sec('Projeção até o término', 'acumulado projetado dia útil a dia útil', c1));
  chart(c1.querySelector('canvas'), { type: 'line',
    data: { labels: futuro.map(d => fDc(d.data)), datasets: [
      { label: 'Acumulado projetado', data: futuro.map(d => d.acum), borderColor: css('--c5'), backgroundColor: css('--c5'), borderWidth: 2, borderDash: [6, 3], pointRadius: 0, tension: .1 },
      { label: 'Meta', data: futuro.map(() => K.meta), borderColor: css('--crit'), borderWidth: 1.5, borderDash: [2, 4], pointRadius: 0 }] },
    options: { scales: { y: { ticks: { callback: v => fN(v, 0) }, title: { display: true, text: 'm³ x mil acumulado' } }, x: { ticks: { maxTicksLimit: 14 } } },
      plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fN(c.parsed.y)} mil m³` } } } } });
  root.appendChild(legHTML([['Acumulado projetado', css('--c5')], ['Meta contratual', css('--crit')]]));

  root.appendChild(sec('Calendário de dias úteis', `${futuro.length} dias úteis projetados · ${PJ.calendario}`, tabela([
    { t: '#', k: 'n', num: true }, { t: 'Data', k: r => fD(r.data) }, { t: 'Dia', k: 'dia' },
    { t: 'Produção do dia', k: 'prod', num: true, f: v => fN(v, 3) },
    { t: 'Acumulado', k: 'acum', num: true, f: v => fN(v) },
    { t: 'Falta para a meta', k: r => K.meta - r.acum, num: true, f: v => v <= 0 ? '<span style="color:var(--ok)">meta atingida</span>' : fN(v) },
  ], futuro, { semSort: true, alto: true })));
}

function vComp(root) {
  destroyCharts();
  const c1 = caixa('ch alto');
  root.appendChild(sec('Avanço comparado', 'todas as frentes na mesma escala, em % da própria meta', c1));
  const CAT = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];
  const ord = ATV.filter(a => !a.semMeta).sort((a, b) => (b.pct || 0) - (a.pct || 0));
  const sem = ATV.filter(a => a.semMeta);
  chart(c1.querySelector('canvas'), { type: 'bar',
    data: { labels: ord.map(a => trunc(a.titulo, 30)), datasets: [{ data: ord.map(a => a.pct), backgroundColor: ord.map((a, i) => css(CAT[i % 6])), borderRadius: 4 }] },
    options: { indexAxis: 'y', scales: { x: { max: 1, ticks: { callback: v => fP(v, 0) } }, y: { ticks: { callback: function (v) { return this.getLabelForValue(v); }, font: { size: 10 } } } },
      plugins: { tooltip: { callbacks: { label: c => ` ${fP(c.parsed.x)} da meta` } } } } });

  if (sem.length) root.appendChild(el('div', 'nota', `Fora do gráfico por não terem quantidade de meta na aba de origem: ${sem.map(a => h(a.titulo) + ' (' + fN(a.realHoje) + ' ' + a.un + ' apontados)').join(' · ')}. Vale pedir ao planejamento a quantidade contratual dessas três para fechar o comparativo.`));
  const c2 = caixa('ch alto');
  root.appendChild(sec('Aderência ao baseline', 'SPI por frente; abaixo de 0,80 é zona crítica', c2));
  const cb = ATV_BL.slice().sort((a, b) => a.spi - b.spi);
  chart(c2.querySelector('canvas'), { type: 'bar',
    data: { labels: cb.map(a => trunc(a.titulo, 30)), datasets: [{ data: cb.map(a => a.spi), backgroundColor: cb.map(a => a.spi >= .95 ? css('--ok') : a.spi >= .8 ? css('--warn') : css('--crit')), borderRadius: 4 }] },
    options: { indexAxis: 'y', scales: { x: { ticks: { callback: v => fN(v, 2) } }, y: { ticks: { callback: function (v) { return this.getLabelForValue(v); }, font: { size: 10 } } } },
      plugins: { tooltip: { callbacks: { label: c => ` SPI ${fN(c.parsed.x, 3)}` } } } } });

  root.appendChild(el('div', 'dica', `<b>Como usar.</b> O primeiro gráfico mostra quanto falta de cada frente, o segundo mostra se ela está no prazo. Frente com avanço alto e SPI baixo é frente que começou cedo e perdeu ritmo. Frente com avanço baixo e SPI alto ainda está dentro do plano, só não chegou a hora dela.`));
}

/* ---------- navegação e init ---------- */
function nav() {
  const a = document.getElementById('abas');
  a.innerHTML = VIEWS.map(v => `<button data-v="${v[0]}" class="${STATE.view === v[0] ? 'on' : ''}">${h(v[1])}</button>`).join('');
  a.querySelectorAll('button').forEach(b => b.onclick = () => { STATE.view = b.dataset.v; try { localStorage.setItem('cv.view', STATE.view); } catch (e) { } nav(); show(); });
}
function show() {
  destroyCharts();
  const m = document.getElementById('main'); m.innerHTML = '';
  const v = VIEWS.find(x => x[0] === STATE.view) || VIEWS[0];
  const root = el('div', 'view on'); m.appendChild(root); v[2](root);
  root.appendChild(el('footer', 'rodape', `<span>Marka Engenharia Ltda &middot; Coordenação de Obras &middot; TFPM &middot; São Luís, MA</span><span>Fonte: ${h(D.meta.arquivo)} &middot; ${h(D.meta.semana)} &middot; extraído em ${fD(D.meta.extraido_em)}</span>`));
  window.scrollTo(0, 0);
}
(function () {
  document.getElementById('meta').innerHTML =
    `<div><small>Semana</small><b>${h(D.meta.semana)}</b></div>` +
    `<div><small>Data de corte</small><b>${fD(K.corte)}</b></div>` +
    `<div><small>Escavação</small><b>${fP(K.pctReal)}</b></div>` +
    `<div><small>Término proj.</small><b>${fD(K.fimProj)}</b></div>`;
  try { const v = localStorage.getItem('cv.view'); if (v && VIEWS.some(x => x[0] === v)) STATE.view = v; } catch (e) { }
  nav(); show();
})();
