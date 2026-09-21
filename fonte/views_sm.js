/* =====================================================================
   VIEWS
   ===================================================================== */
const VIEWS = [
  ['semana', 'Minha Semana', vSemana], ['look', 'Look-ahead 4 semanas', vLook],
  ['analise', 'Análise Gerencial', vAnalise], ['marcos', 'Marcos Contratuais', vMarcos],
  ['frentes', 'Frentes', vFrentes], ['todas', 'Cronograma Completo', vTodas],
];
const STATE = { view: 'semana' };

/* colunas: a linha de base vem primeiro, a data atual do cronograma vem depois */
const COLS_BASE = [
  { t: 'ID', k: 'id', num: true },
  { t: 'Atividade', k: 'nome', cls: 'desc', f: (v, r) => `<b>${h(trunc(v, 60))}</b><br><small style="color:var(--ink3)">${h(trunc(r.caminho, 68))}</small>` },
  { t: 'Início LB', k: 'iniBL', f: v => `<b>${fD(v)}</b>` },
  { t: 'Término LB', k: 'fimBL', f: v => `<b>${fD(v)}</b>` },
  { t: 'Início atual', k: 'ini', f: (v, r) => `${fD(v)}${r.desvioIni ? ` <small style="color:${r.desvioIni > 0 ? 'var(--crit)' : 'var(--ok)'}">${r.desvioIni > 0 ? '+' : ''}${r.desvioIni}d</small>` : ''}` },
  { t: 'Término atual', k: 'fim', f: (v, r) => `${fD(v)}${r.desvioLB ? ` <small style="color:${r.desvioLB > 0 ? 'var(--crit)' : 'var(--ok)'}">${r.desvioLB > 0 ? '+' : ''}${r.desvioLB}d</small>` : ''}` },
  { t: '% Real', k: 'real', num: true, f: v => pctBar(v) },
  { t: 'Situação', k: 'situacao', f: (v, r) => stTag(v) + (r.atrasoDias ? ` <small style="color:var(--crit)">${r.atrasoDias}d</small>` : '') },
];

/* bloco por pacote, para ler frente a frente */
function blocosPorPacote(lista, cols) {
  const wrap = el('div');
  const gs = porPacote(lista);
  if (!gs.length) { wrap.appendChild(el('div', 'nota', 'Nada nesta condição.')); return wrap; }
  for (const g of gs) {
    const atr = g.itens.filter(x => x.atrasada).length;
    wrap.appendChild(sec(g.k, `${g.itens.length} ${g.itens.length === 1 ? 'atividade' : 'atividades'}${atr ? ` · <span style="color:var(--crit);font-weight:700">${atr} em atraso</span>` : ''}`,
      tabela(cols, g.itens, { semSort: true })));
  }
  return wrap;
}

/* ---------- 1. MINHA SEMANA ---------- */
function vSemana(root) {
  destroyCharts();
  const s1 = SEMANAS[0];
  const encerram = s1.itens.filter(x => x.fimBL >= s1.ini && x.fimBL <= s1.fim);
  const comecam = s1.itens.filter(x => x.iniBL >= s1.ini && x.iniBL <= s1.fim);
  const marcos90 = MARCOS.filter(x => x.fim && x.fim >= HOJE && dias(HOJE, x.fim) <= 90).sort((a, b) => a.fim < b.fim ? -1 : 1);

  root.appendChild(el('div', 'kpis',
    kpi('Semana', s1.rot, `SEM 38 · corte ${fD(HOJE)}`) +
    kpi('Atrasadas pela LB', fN(ATRASADAS.length), 'início ou término vencido na linha de base', ATRASADAS.length ? 'crit' : '') +
    kpi('Em andamento', fN(ABERTAS.length), 'com apontamento parcial') +
    kpi('Abertas nesta semana', fN(s1.itens.length), 'pela janela da linha de base') +
    kpi('Encerram pela LB', fN(encerram.length), 'término de baseline até ' + fDc(s1.fim), encerram.length ? 'ouro' : '') +
    kpi('Avanço global', fP(RAIZ.real), `previsto ${fP(RAIZ.prev)} · IDP ${fN(IDP, 3)}`, IDP < 1 ? 'crit' : '')));

  root.appendChild(el('div', 'dica', `<b>Todas as datas desta aba são da linha de base.</b> A coluna <i>Início LB</i> e <i>Término LB</i> é a obrigação; <i>Início atual</i> e <i>Término atual</i> é o que o planejamento já replanejou, com o desvio em dias ao lado. Cobrar pela data atual esconde o atraso, porque a data atual já foi movida.`));

  if (ATRASADAS.length) {
    const naoIni = ATRASADAS.filter(x => x.atrasoIni !== null && x.atrasoFim === null);
    const fimVenc = ATRASADAS.filter(x => x.atrasoFim !== null);
    root.appendChild(el('div', 'dica', `<b>${ATRASADAS.length} ${ATRASADAS.length === 1 ? 'atividade atrasada' : 'atividades atrasadas'} contra a linha de base.</b> ${naoIni.length ? `${naoIni.length} deveriam ter começado e não têm nenhum apontamento, a mais antiga parada há ${Math.max(...naoIni.map(x => x.atrasoIni))} dias. ` : ''}${fimVenc.length ? `${fimVenc.length} passaram do término de baseline sem concluir. ` : ''}Atraso médio de ${fN(sum(ATRASADAS, x => x.atrasoDias) / ATRASADAS.length, 0)} dias.`));
    root.appendChild(sec('1 · Atrasadas pela linha de base', 'ordenadas pelo maior atraso · por frente',
      blocosPorPacote(ATRASADAS, [...COLS_BASE.slice(0, 4),
        { t: 'Tipo de atraso', k: 'tipoAtraso', f: v => `<span class="tag crit">${h(v)}</span>` },
        { t: 'Dias de atraso', k: 'atrasoDias', num: true, f: v => `<b style="color:var(--crit)">${v} d</b>` },
        ...COLS_BASE.slice(4)])));
  }

  root.appendChild(sec('2 · Encerram nesta semana pela LB', 'cobrar conclusão, liberar a frente seguinte e registrar em RDO',
    blocosPorPacote(encerram, COLS_BASE)));

  root.appendChild(sec('3 · Começam nesta semana pela LB', 'garantir mão de obra, equipamento, material e liberação de área',
    blocosPorPacote(comecam, COLS_BASE)));

  root.appendChild(sec('4 · Em andamento', `${ABERTAS.length} atividades com apontamento parcial`,
    blocosPorPacote(ABERTAS, COLS_BASE)));

  root.appendChild(sec('Marcos contratuais nos próximos 90 dias', 'datas de obrigação perante a Vale',
    tabela([
      { t: 'Marco', k: 'nome', cls: 'desc', f: (v, r) => `<b>${h(trunc(v, 78))}</b><br><small style="color:var(--ink3)">${h(r.caminho)}</small>` },
      { t: 'Data LB', k: 'fimBL', f: v => `<b>${fD(v)}</b>` },
      { t: 'Data atual', k: 'fim', f: v => fD(v) },
      { t: 'Desvio', k: 'desvioLB', num: true, f: v => desvTag(v) },
      { t: 'Faltam (LB)', k: r => r.fimBL ? dias(HOJE, r.fimBL) : null, num: true, f: v => v === null ? '–' : `<span style="color:${v <= 30 ? 'var(--crit)' : v <= 60 ? 'var(--warn)' : 'var(--ink)'};font-weight:700">${v} dias</span>` },
      { t: '% Real', k: 'real', num: true, f: v => pctBar(v) },
    ], marcos90, { semSort: true })));
}

/* ---------- 2. LOOK-AHEAD ---------- */
function vLook(root) {
  destroyCharts();
  root.appendChild(el('div', 'dica', `<b>Janela de ${fD(H1)} a ${fD(H2)}, pela linha de base.</b> Uma atividade entra na semana em que a LB manda executá-la, não na data replanejada. Serve para diligenciar material, mobilizar equipe e cobrar liberação de área antes de o atraso virar fato.`));

  const c = caixa('ch alto');
  root.appendChild(sec('Carga por semana', 'atividades abertas em cada semana, pela janela da linha de base', c));
  chart(c.querySelector('canvas'), { type: 'bar',
    data: { labels: SEMANAS.map(s => s.rot), datasets: [
      { label: 'Atrasadas', data: SEMANAS.map(s => s.itens.filter(x => x.atrasada).length), backgroundColor: css('--crit'), borderRadius: 3, stack: 'a' },
      { label: 'Já em curso', data: SEMANAS.map(s => s.itens.filter(x => !x.atrasada && x.iniBL < s.ini).length), backgroundColor: css('--azul'), borderRadius: 3, stack: 'a' },
      { label: 'Iniciando', data: SEMANAS.map(s => s.itens.filter(x => !x.atrasada && x.iniBL >= s.ini && x.iniBL <= s.fim).length), backgroundColor: css('--c2'), borderRadius: 3, stack: 'a' }] },
    options: { scales: { x: { stacked: true }, y: { stacked: true, ticks: { precision: 0 }, title: { display: true, text: 'atividades' } } },
      plugins: { tooltip: { callbacks: { label: c2 => ` ${c2.dataset.label}: ${c2.parsed.y}` } } } } });
  root.appendChild(legHTML([['Atrasadas', css('--crit')], ['Já em curso', css('--azul')], ['Iniciando na semana', css('--c2')]]));

  const c2 = caixa('ch alto');
  root.appendChild(sec('Carga por frente na janela', 'quantas atividades cada pacote abre nas 4 semanas', c2));
  const gs = porPacote(NO_HORIZ);
  chart(c2.querySelector('canvas'), { type: 'bar',
    data: { labels: gs.map(g => trunc(g.k, 28)), datasets: [
      { label: 'Atrasadas', data: gs.map(g => g.itens.filter(x => x.atrasada).length), backgroundColor: css('--crit'), borderRadius: 3, stack: 'a' },
      { label: 'No prazo', data: gs.map(g => g.itens.filter(x => !x.atrasada).length), backgroundColor: css('--azul'), borderRadius: 3, stack: 'a' }] },
    options: { indexAxis: 'y', scales: { x: { stacked: true, ticks: { precision: 0 } }, y: { stacked: true, ticks: { callback: function (v) { return this.getLabelForValue(v); }, font: { size: 11 } } } },
      plugins: { tooltip: { callbacks: { label: c3 => ` ${c3.dataset.label}: ${c3.parsed.x}` } } } } });
  root.appendChild(legHTML([['Atrasadas', css('--crit')], ['No prazo', css('--azul')]]));

  SEMANAS.forEach((s, i) => {
    const novas = s.itens.filter(x => x.iniBL >= s.ini && x.iniBL <= s.fim).length;
    const atr = s.itens.filter(x => x.atrasada).length;
    root.appendChild(el('div', 'sec-h', `<h2>Semana ${i + 1} · ${s.rot}</h2><span class="sub">${s.itens.length} atividades abertas · ${novas} iniciando${atr ? ` · <span style="color:var(--crit);font-weight:700">${atr} em atraso</span>` : ''}</span>`));
    root.appendChild(blocosPorPacote(s.itens, COLS_BASE));
  });
}

/* ---------- 3. ANÁLISE GERENCIAL ---------- */
function vAnalise(root) {
  destroyCharts();
  const naoIni = ATRASADAS.filter(x => x.atrasoIni !== null && x.atrasoFim === null);
  const fimVenc = ATRASADAS.filter(x => x.atrasoFim !== null);

  root.appendChild(el('div', 'kpis',
    kpi('Tempo decorrido', fP(OBRA.pctTempo), `${fN(OBRA.decorrido)} de ${fN(OBRA.durBL)} dias da LB`) +
    kpi('Avanço realizado', fP(RAIZ.real), `previsto ${fP(RAIZ.prev)}`) +
    kpi('IDP', fN(IDP, 3), 'realizado / previsto', IDP < 1 ? 'crit' : '') +
    kpi('Atrasadas pela LB', fN(ATRASADAS.length), `${naoIni.length} sem iniciar · ${fimVenc.length} com término vencido`, ATRASADAS.length ? 'crit' : '') +
    kpi('Tendência de término', fD(OBRA.projB), `${OBRA.atrasoB > 0 ? '+' : ''}${OBRA.atrasoB} dias sobre a LB`, 'crit') +
    kpi('Já declarado no cronograma', fD(RAIZ.fim), `${OBRA.declarado > 0 ? '+' : ''}${OBRA.declarado} dias sobre a LB`, 'ouro')));

  /* --- o que está atrasado --- */
  root.appendChild(el('div', 'dica', `<b>1 · O que está atrasado.</b> ${ATRASADAS.length} atividades estão fora da linha de base, somando ${fN(sum(ATRASADAS, x => x.atrasoDias))} dias de atraso e média de ${fN(sum(ATRASADAS, x => x.atrasoDias) / ATRASADAS.length, 0)} dias por atividade. ${naoIni.length} delas <b>não têm um único apontamento</b> e já passaram da data de início da LB; a mais antiga está parada há ${Math.max(...naoIni.map(x => x.atrasoIni))} dias. As outras ${fimVenc.length} começaram, passaram do término da LB e pararam em ${fP(fimVenc[0].real, 0)}. Nenhuma delas está no caminho do TP03, que ainda não iniciou.`));

  const ca = caixa('ch alto');
  root.appendChild(sec('Atraso por atividade', 'dias além da data de linha de base, na data de corte', ca));
  chart(ca.querySelector('canvas'), { type: 'bar',
    data: { labels: ATRASADAS.map(x => trunc(x.nome, 38)), datasets: [{ data: ATRASADAS.map(x => x.atrasoDias),
      backgroundColor: ATRASADAS.map(x => x.atrasoFim !== null ? css('--crit') : css('--c2')), borderRadius: 4 }] },
    options: { indexAxis: 'y', scales: { x: { ticks: { precision: 0 }, title: { display: true, text: 'dias de atraso' } },
      y: { ticks: { callback: function (v) { return this.getLabelForValue(v); }, font: { size: 10 } } } },
      plugins: { tooltip: { callbacks: { label: c => ` ${c.parsed.x} dias`, afterLabel: c => ATRASADAS[c.dataIndex].tipoAtraso + ' · ' + ATRASADAS[c.dataIndex].pacote } } } } });
  root.appendChild(legHTML([['Término da LB vencido', css('--crit')], ['Início da LB vencido, sem apontamento', css('--c2')]]));

  root.appendChild(tabela([
    { t: 'Atividade', k: 'nome', cls: 'desc', f: (v, r) => `<b>${h(trunc(v, 58))}</b><br><small style="color:var(--ink3)">${h(r.caminho)}</small>` },
    { t: 'Tipo', k: 'tipoAtraso', f: v => `<span class="tag crit">${h(v)}</span>` },
    { t: 'Início LB', k: 'iniBL', f: v => fD(v) },
    { t: 'Término LB', k: 'fimBL', f: v => fD(v) },
    { t: 'Replanejado para', k: 'fim', f: (v, r) => `${fD(v)}${r.desvioLB ? ` <small style="color:var(--crit)">+${r.desvioLB}d</small>` : ''}` },
    { t: 'Atraso', k: 'atrasoDias', num: true, f: v => `<b style="color:var(--crit)">${v} d</b>` },
    { t: '% Real', k: 'real', num: true, f: v => pctBar(v) },
  ], ATRASADAS, { semSort: true }));

  /* --- evolução até agora --- */
  root.appendChild(el('div', 'dica', `<b>2 · Evolução até agora.</b> A obra consumiu ${fP(OBRA.pctTempo)} do prazo da linha de base (${fN(OBRA.decorrido)} de ${fN(OBRA.durBL)} dias corridos) e entregou ${fP(RAIZ.real)} de avanço físico contra ${fP(RAIZ.prev)} previstos. São ${fN((RAIZ.prev - RAIZ.real) * 100, 2)} pontos percentuais de déficit, que equivalem a ${fN(OBRA.decorrido * (1 / IDP - 1), 0)} dias de produção não realizada. ${FOLHAS.filter(x => x.concluida).length} das ${FOLHAS.length} atividades executáveis estão concluídas e ${ABERTAS.length} em andamento; ${FOLHAS.filter(x => !x.concluida && !x.aberta).length} ainda não começaram.`));

  const ce = caixa('ch alto');
  root.appendChild(sec('Previsto contra realizado por pacote', 'IDP ponderado pela duração das atividades de cada pacote', ce));
  const PAC = pacotesAgregados().filter(g => g.pct !== null).sort((a, b) => a.pct - b.pct);
  chart(ce.querySelector('canvas'), { type: 'bar',
    data: { labels: PAC.map(g => trunc(g.k, 28)), datasets: [
      { label: 'Previsto', data: PAC.map(g => g.prevPct), backgroundColor: css('--azul-claro'), borderRadius: 3 },
      { label: 'Realizado', data: PAC.map(g => g.realPct), backgroundColor: css('--azul'), borderRadius: 3 }] },
    options: { scales: { y: { ticks: { callback: v => fP(v, 0) }, title: { display: true, text: 'avanço ponderado' } },
      x: { ticks: { maxRotation: 30, font: { size: 10 } } } },
      plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fP(c.parsed.y)}` } } } } });
  root.appendChild(legHTML([['Previsto', css('--azul-claro')], ['Realizado', css('--azul')]]));

  /* --- tendência --- */
  const memo = el('div', 'painel');
  memo.innerHTML = `<div class="sec-h"><h2>Memória de cálculo da tendência</h2><span class="sub">dois cenários, o mesmo IDP</span></div>
  <dl class="dl" style="grid-template-columns:300px 1fr">
    <dt>Base</dt><dd>Início da obra ${fD(OBRA.ini)}, término da linha de base ${fD(OBRA.fimBL)}. Duração de ${fN(OBRA.durBL)} dias corridos, dos quais ${fN(OBRA.decorrido)} já passaram (${fP(OBRA.pctTempo)}).</dd>
    <dt>IDP na data de corte</dt><dd>${fP(RAIZ.real)} realizado ÷ ${fP(RAIZ.prev)} previsto = <b>${fN(IDP, 3)}</b>. Cada dia de calendário está rendendo ${fP(IDP)} de um dia de plano.</dd>
    <dt>Cenário A · recuperar o ritmo</dt><dd>O atraso já acumulado é carregado, mas daqui para frente a obra volta ao ritmo da LB.<br>${fN(OBRA.decorrido)} dias × (1 ÷ ${fN(IDP, 3)} − 1) = <b>${fN(OBRA.decorrido * (1 / IDP - 1), 0)} dias</b> de atraso → término em <b>${fD(OBRA.projA)}</b>.</dd>
    <dt>Cenário B · manter o ritmo atual</dt><dd>O saldo de ${fN(OBRA.restBL)} dias de plano é executado no IDP de hoje.<br>${fN(OBRA.restBL)} ÷ ${fN(IDP, 3)} = <b>${fN(OBRA.diasRest)} dias</b> a partir de ${fD(HOJE)} → término em <b>${fD(OBRA.projB)}</b>, ${OBRA.atrasoB} dias além da LB.</dd>
    <dt>O que o cronograma declara</dt><dd>${fD(RAIZ.fim)}, ${OBRA.declarado} dias além da LB. Fica entre os dois cenários e mais perto do A, ou seja, o planejamento está assumindo recuperação de ritmo.</dd>
    <dt>Limite do método</dt><dd>O IDP é global e ponderado pelo próprio cronograma. Não substitui análise de caminho crítico: um atraso pequeno numa atividade crítica pesa mais que um atraso grande numa com folga. Serve para dimensionar a ordem de grandeza e sustentar a conversa de prazo.</dd>
  </dl>`;
  root.appendChild(memo);

  const ct = caixa('ch alto');
  root.appendChild(sec('3 · Tendência de término', 'linha de base, o que o cronograma declara e os dois cenários', ct));
  const cen = [
    { n: 'Linha de base', d: RAIZ.fimBL, v: 0 },
    { n: 'Declarado no cronograma', d: RAIZ.fim, v: OBRA.declarado },
    { n: 'Cenário A · recupera ritmo', d: OBRA.projA, v: OBRA.atrasoA },
    { n: 'Cenário B · mantém ritmo', d: OBRA.projB, v: OBRA.atrasoB },
  ];
  chart(ct.querySelector('canvas'), { type: 'bar',
    data: { labels: cen.map(x => x.n), datasets: [{ data: cen.map(x => x.v),
      backgroundColor: cen.map(x => x.v === 0 ? css('--ok') : x.v <= 20 ? css('--warn') : css('--crit')), borderRadius: 4 }] },
    options: { indexAxis: 'y', scales: { x: { ticks: { precision: 0 }, title: { display: true, text: 'dias além da linha de base' } },
      y: { ticks: { callback: function (v) { return this.getLabelForValue(v); }, font: { size: 11 } } } },
      plugins: { tooltip: { callbacks: { label: c => ` ${c.parsed.x} dias`, afterLabel: c => 'término ' + fD(cen[c.dataIndex].d) } } } } });

  root.appendChild(el('div', 'dica', `<b>Leitura para a diretoria.</b> A linha de base termina em ${fD(RAIZ.fimBL)}. O cronograma emitido pelo planejamento já declara ${fD(RAIZ.fim)}, ${OBRA.declarado} dias depois. Mantido o ritmo de hoje, a tendência é ${fD(OBRA.projB)}, ${OBRA.atrasoB} dias além da linha de base, ou ${OBRA.atrasoB - OBRA.declarado} dias além do que o cronograma já assume. A diferença entre os dois é exatamente o tamanho da recuperação de ritmo que o planejamento está prometendo sem plano de aceleração declarado. É esse ponto que precisa entrar em ata.`));
}

function pacotesAgregados() {
  const m = new Map();
  for (const x of FOLHAS) {
    let o = m.get(x.pacote); if (!o) { o = { k: x.pacote, n: 0, conc: 0, and: 0, atr: 0, horiz: 0, prev: 0, real: 0, dur: 0, fim: null, fimBL: null }; m.set(x.pacote, o); }
    o.n++; if (x.concluida) o.conc++; if (x.aberta) o.and++; if (x.atrasada) o.atr++; if (x.noHorizonteBL) o.horiz++;
    const d = x.dur || 0; o.dur += d; o.prev += (x.prev || 0) * d; o.real += (x.real || 0) * d;
    if (x.fim && (!o.fim || x.fim > o.fim)) o.fim = x.fim;
    if (x.fimBL && (!o.fimBL || x.fimBL > o.fimBL)) o.fimBL = x.fimBL;
  }
  return [...m.values()].map(o => ({ ...o, pct: o.prev ? o.real / o.prev : null,
    prevPct: o.dur ? o.prev / o.dur : null, realPct: o.dur ? o.real / o.dur : null }));
}

/* ---------- 4. MARCOS ---------- */
function vMarcos(root) {
  destroyCharts();
  const ord = MARCOS.slice().sort((a, b) => (a.fimBL || '9') < (b.fimBL || '9') ? -1 : 1);
  const atrasados = ord.filter(x => x.desvioLB > 0);
  const abertos = ord.filter(x => (x.real || 0) < 1 && x.fimBL).map(x => ({ ...x,
    faltaBL: dias(HOJE, x.fimBL), faltaAtual: dias(HOJE, x.fim) })).sort((a, b) => a.faltaBL - b.faltaBL);

  root.appendChild(el('div', 'kpis',
    kpi('Marcos contratuais', fN(MARCOS.length), 'ramo 1.1 do cronograma') +
    kpi('Concluídos', fN(MARCOS.filter(x => (x.real || 0) >= 1).length), 'com 100% apontado') +
    kpi('Deslocados da LB', fN(atrasados.length), 'data atual depois da linha de base', atrasados.length ? 'crit' : '') +
    kpi('Maior deslocamento', atrasados.length ? `+${Math.max(...atrasados.map(x => x.desvioLB))} d` : '–', 'sobre a LB_rev1', 'ouro') +
    kpi('Próximo em aberto', abertos.length ? `${abertos[0].faltaBL} dias` : '–', abertos.length ? fD(abertos[0].fimBL) : '', abertos.length && abertos[0].faltaBL <= 60 ? 'crit' : '') +
    kpi('Término do contrato', fD(RAIZ.fimBL), `cronograma declara ${fD(RAIZ.fim)}`, 'crit')));

  const c1 = caixa('ch alto');
  root.appendChild(sec('Quantos dias faltam para cada marco', 'contagem a partir de ' + fD(HOJE) + ' · barra pela data da linha de base', c1));
  chart(c1.querySelector('canvas'), { type: 'bar',
    data: { labels: abertos.map(x => trunc(x.frente + ' · ' + x.nome, 62)), datasets: [
      { label: 'Dias até a data da LB', data: abertos.map(x => x.faltaBL),
        backgroundColor: abertos.map(x => x.faltaBL <= 30 ? css('--crit') : x.faltaBL <= 90 ? css('--warn') : css('--azul')), borderRadius: 4 },
      { label: 'Folga que o cronograma já tomou', data: abertos.map(x => Math.max(0, x.faltaAtual - x.faltaBL)),
        backgroundColor: css('--c2'), borderRadius: 4 }] },
    options: { indexAxis: 'y', scales: { x: { stacked: true, ticks: { precision: 0 }, title: { display: true, text: 'dias a partir de hoje' } },
      y: { stacked: true, ticks: { callback: function (v) { return this.getLabelForValue(v); }, font: { size: 10 } } } },
      plugins: { tooltip: { callbacks: {
        title: c => abertos[c[0].dataIndex].nome,
        label: c => c.datasetIndex === 0 ? ` faltam ${c.parsed.x} dias para a LB (${fD(abertos[c.dataIndex].fimBL)})` : ` +${c.parsed.x} dias de deslocamento (atual ${fD(abertos[c.dataIndex].fim)})` } } } } });
  root.appendChild(legHTML([['Até 30 dias', css('--crit')], ['31 a 90 dias', css('--warn')], ['Mais de 90 dias', css('--azul')], ['Deslocamento já declarado', css('--c2')]]));

  const proximos = abertos.filter(x => x.faltaBL <= 90);
  if (proximos.length) root.appendChild(el('div', 'dica', `<b>O que vence primeiro.</b> ${proximos.length} ${proximos.length === 1 ? 'marco vence' : 'marcos vencem'} em até 90 dias pela linha de base, todos com 0% apontado. O primeiro é <b>${h(trunc(proximos[0].nome, 110))}</b>, em ${fD(proximos[0].fimBL)}, daqui a <b>${proximos[0].faltaBL} dias</b>${proximos[0].desvioLB > 0 ? `, e o cronograma já o empurrou para ${fD(proximos[0].fim)}` : ''}. Notificação à Vale sobre risco de marco precisa sair com 30 dias de antecedência, então a decisão sobre esse é agora.`));

  root.appendChild(sec('Todos os marcos contratuais', 'linha de base contra data atual do cronograma',
    tabela([
      { t: 'EAP', k: 'eap', cls: 'mono' },
      { t: 'Marco', k: 'nome', cls: 'desc', f: (v, r) => `<b>${h(trunc(v, 88))}</b><br><small style="color:var(--ink3)">${h(r.caminho)}</small>` },
      { t: 'Data LB', k: 'fimBL', f: v => `<b>${fD(v)}</b>` },
      { t: 'Data atual', k: 'fim', f: v => fD(v) },
      { t: 'Desvio', k: 'desvioLB', num: true, f: v => desvTag(v) },
      { t: 'Faltam (LB)', k: r => (r.real || 0) >= 1 ? null : (r.fimBL ? dias(HOJE, r.fimBL) : null), num: true,
        f: (v, r) => (r.real || 0) >= 1 ? '<span style="color:var(--ok)">cumprido</span>' : v === null ? '–' : `<span style="color:${v <= 30 ? 'var(--crit)' : v <= 90 ? 'var(--warn)' : 'var(--ink)'};font-weight:700">${v} d</span>` },
      { t: '% Real', k: 'real', num: true, f: v => pctBar(v) },
    ], ord, { semSort: true })));

  root.appendChild(el('div', 'dica', `<b>O que esta aba prova.</b> O cronograma já traz ${atrasados.length} marcos com data atual depois da linha de base, o maior deles com ${atrasados.length ? Math.max(...atrasados.map(x => x.desvioLB)) : 0} dias. O término do contrato saiu de ${fD(RAIZ.fimBL)} para ${fD(RAIZ.fim)}, ${OBRA.declarado} dias. Esse deslocamento está declarado pelo próprio planejamento: é documento, não opinião, e vale como lastro em qualquer discussão de prazo.`));
}

/* ---------- 5. FRENTES ---------- */
function vFrentes(root) {
  destroyCharts();
  const G = pacotesAgregados().sort((a, b) => b.horiz - a.horiz || b.n - a.n);
  const c = caixa('ch alto');
  root.appendChild(sec('Aderência por pacote', 'IDP ponderado pela duração das atividades do pacote', c));
  const cb = G.filter(g => g.pct !== null).sort((a, b) => a.pct - b.pct);
  chart(c.querySelector('canvas'), { type: 'bar',
    data: { labels: cb.map(g => trunc(g.k, 30)), datasets: [{ data: cb.map(g => g.pct),
      backgroundColor: cb.map(g => g.pct >= .95 ? css('--ok') : g.pct >= .8 ? css('--warn') : css('--crit')), borderRadius: 4 }] },
    options: { indexAxis: 'y', scales: { x: { ticks: { callback: v => fN(v, 2) } }, y: { ticks: { callback: function (v) { return this.getLabelForValue(v); }, font: { size: 10 } } } },
      plugins: { tooltip: { callbacks: { label: c2 => ` IDP ${fN(c2.parsed.x, 3)}` } } } } });

  root.appendChild(sec('Pacotes de trabalho', `${G.length} pacotes · ${FOLHAS.length} atividades executáveis`,
    tabela([
      { t: 'Pacote', k: 'k' },
      { t: 'Atividades', k: 'n', num: true },
      { t: 'Concluídas', k: 'conc', num: true },
      { t: 'Em andamento', k: 'and', num: true },
      { t: 'Atrasadas (LB)', k: 'atr', num: true, f: v => v ? `<span style="color:var(--crit);font-weight:700">${v}</span>` : '0' },
      { t: 'Abertas no horizonte', k: 'horiz', num: true, f: v => v ? `<b>${v}</b>` : '0' },
      { t: 'Previsto', k: 'prevPct', num: true, f: v => v === null ? '–' : fP(v) },
      { t: 'Realizado', k: 'realPct', num: true, f: v => v === null ? '–' : fP(v) },
      { t: 'IDP', k: 'pct', num: true, f: v => v === null ? '–' : `<span style="color:${v >= .95 ? 'var(--ok)' : v >= .8 ? 'var(--warn)' : 'var(--crit)'};font-weight:700">${fN(v, 3)}</span>` },
      { t: 'Término LB', k: 'fimBL', f: v => fD(v) },
      { t: 'Término atual', k: 'fim', f: v => fD(v) },
    ], G, { sort: 5 })));
}

/* ---------- 6. CRONOGRAMA COMPLETO ---------- */
function vTodas(root) {
  destroyCharts();
  const S = STATE.todas ||= { q: '', pac: '', sit: '' };
  const pacs = [...new Set(FOLHAS.map(x => x.pacote))].sort();
  const f = el('div', 'filtros'); const out = el('div'); root.append(f, out);
  f.innerHTML = `<label>Buscar<input id="q" type="search" placeholder="nome ou EAP" value="${h(S.q)}"></label>` +
    selectHTML('p', 'Pacote', pacs, S.pac, 'Todos') +
    selectHTML('s', 'Situação', ['atrasada', 'em andamento', 'a iniciar', 'concluída', 'futura'], S.sit, 'Todas') +
    `<span class="conta" id="cc"></span>`;
  f.querySelector('#q').oninput = e => { S.q = e.target.value; draw(); };
  f.querySelector('#p').onchange = e => { S.pac = e.target.value; draw(); };
  f.querySelector('#s').onchange = e => { S.sit = e.target.value; draw(); };
  function draw() {
    out.innerHTML = '';
    const q = S.q.trim().toLowerCase();
    const rs = FOLHAS.filter(x => (!q || x.nome.toLowerCase().includes(q) || x.eap.includes(q)) &&
      (!S.pac || x.pacote === S.pac) && (!S.sit || x.situacao === S.sit));
    f.querySelector('#cc').textContent = `${rs.length} de ${FOLHAS.length} atividades executáveis`;
    out.appendChild(tabela([{ t: 'EAP', k: 'eap', cls: 'mono' }, ...COLS_BASE], rs, { sort: 3, dir: 1, alto: true }));
  }
  draw();
}

/* ---------- navegação e init ---------- */
function nav() {
  const a = document.getElementById('abas');
  a.innerHTML = VIEWS.map(v => `<button data-v="${v[0]}" class="${STATE.view === v[0] ? 'on' : ''}">${h(v[1])}</button>`).join('');
  a.querySelectorAll('button').forEach(b => b.onclick = () => { STATE.view = b.dataset.v; try { localStorage.setItem('sm.view', STATE.view); } catch (e) { } nav(); show(); });
}
function show() {
  destroyCharts();
  const m = document.getElementById('main'); m.innerHTML = '';
  const v = VIEWS.find(x => x[0] === STATE.view) || VIEWS[0];
  const root = el('div', 'view on'); m.appendChild(root); v[2](root);
  root.appendChild(el('footer', 'rodape', `<span>Marka Engenharia Ltda &middot; Coordenação de Obras &middot; TFPM &middot; São Luís, MA</span><span>Fonte: ${h(D.meta.arquivo)} &middot; ${h(D.meta.linhas)} linhas &middot; datas de referência = linha de base (LB_rev1) &middot; extraído em ${fD(D.meta.extraido_em)}</span>`));
  window.scrollTo(0, 0);
}
(function () {
  document.getElementById('meta').innerHTML =
    `<div><small>Semana</small><b>${fDc(H1)} a ${fDc(SEMANAS[0].fim)}</b></div>` +
    `<div><small>Atrasadas</small><b>${fN(ATRASADAS.length)}</b></div>` +
    `<div><small>Avanço</small><b>${fP(RAIZ.real)}</b></div>` +
    `<div><small>IDP</small><b>${fN(IDP, 3)}</b></div>`;
  try { const v = localStorage.getItem('sm.view'); if (v && VIEWS.some(x => x[0] === v)) STATE.view = v; } catch (e) { }
  nav(); show();
})();
