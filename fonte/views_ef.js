/* ===================== VIEWS ===================== */

/* 1 · PANORAMA */
function vGeral(root) {
  const L = sel();
  const mod = L.filter(p => p.m === 'MOD'), moi = L.filter(p => p.m === 'MOI');
  const naObra = L.filter(p => p.naObra), fora = L.filter(p => !p.naObra);
  const idades = L.filter(p => p.id !== null).map(p => p.id);
  const tcs = L.filter(p => p.tc !== null).map(p => p.tc);

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(L.length), 'Efetivo cadastrado', 'clique para ver a lista', { lista: L, tit: 'Efetivo cadastrado' })}
    ${kpi(fN(naObra.length), 'Na obra', fP(naObra.length / L.length, 0) + ' do cadastro', { lista: naObra, tit: 'Na obra' })}
    ${kpi(fN(fora.length), 'Fora da obra', 'cadastrados e não mobilizados', { lista: fora, tit: 'Fora da obra', cls: 'gold' })}
    ${kpi(fN(mod.length), 'Mão de obra direta', fP(mod.length / L.length, 0) + ' do efetivo', { lista: mod, tit: 'Mão de obra direta' })}
    ${kpi(fN(moi.length), 'Mão de obra indireta', fP(moi.length / L.length, 0) + ' do efetivo', { lista: moi, tit: 'Mão de obra indireta' })}
    ${kpi(fN([...new Set(L.map(p => p.fn))].length), 'Funções distintas', 'no quadro das duas obras')}
    ${kpi(f1(med(idades)) + ' a', 'Idade mediana', `de ${fN(idades.length)} pessoas`)}
    ${kpi(f1(med(tcs)) + ' a', 'Tempo de casa mediano', `de ${fN(tcs.length)} pessoas`)}
  </div>`);

  const porObra = [...grupo(A, p => p.o)].map(([k, v]) => ({ k: OBRA[k], v: v.length, lista: v }));
  const porFun = [...grupo(L, p => p.fn)].map(([k, v]) => ({ k, v: v.length, lista: v,
    sub: v.filter(p => p.m === 'MOI').length ? 'MOI' : '' })).sort((a, b) => b.v - a.v).slice(0, 18);

  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Efetivo por obra', 'clique na barra para ver quem está em cada contrato', barras(porObra))}
    ${painel('Direta x indireta', 'peso da estrutura sobre a produção',
      '<div class="ch mini"><canvas></canvas></div>' +
      `<p class="h2s" style="margin-top:12px">Cada pessoa de MOI acompanha ${f1(mod.length / (moi.length || 1))} de MOD. Quanto menor essa razão, mais pesada é a estrutura sobre a produção.</p>`)}
  </section>`);

  const cv = root.querySelector('.ch.mini canvas');
  chart(cv, { type: 'doughnut',
    data: { labels: ['Direta (MOD)', 'Indireta (MOI)'], datasets: [{ data: [mod.length, moi.length], backgroundColor: [css('--azul'), css('--gold')], borderWidth: 2, borderColor: css('--card') }] },
    options: { cutout: '62%', plugins: { legend: { display: true, position: 'bottom' } },
      onClick: (e, els) => { if (els.length) { const i = els[0].index; abrir(i ? moi : mod, i ? 'Mão de obra indireta' : 'Mão de obra direta'); } } } });

  root.insertAdjacentHTML('beforeend', `<section>
    ${painel('As 18 funções com mais gente', 'clique na função para ver os nomes', barras(porFun))}</section>`);
}

/* 2 · EVOLUÇÃO NO TEMPO */
function vEvol(root) {
  const L = sel(), Sa = selS();
  const ini = '2025-01';
  const meses = [];
  for (let y = 2025; y <= 2026; y++) for (let m = 1; m <= 12; m++) {
    const k = y + '-' + String(m).padStart(2, '0');
    if (k >= ini && k <= HOJE.slice(0, 7)) meses.push(k);
  }
  const ent = meses.map(m => L.filter(p => p.ma === m).length);
  const sai = meses.map(m => Sa.filter(p => p.mes === m).length);
  // efetivo ao fim de cada mês: admitidos até ali que ainda estão no quadro, mais os que
  // saíram depois daquele mês. Reconstrói a curva sem precisar de foto histórica.
  const acum = meses.map(m => L.filter(p => p.ma && p.ma <= m).length + Sa.filter(p => p.ma && p.ma <= m && p.mes > m).length);

  const u6 = meses.slice(-6);
  const entR = soma(u6.map(m => L.filter(p => p.ma === m).length));
  const saiR = soma(u6.map(m => Sa.filter(p => p.mes === m).length));

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(acum[acum.length - 1]), 'Efetivo hoje', 'reconstruído da base de admissões')}
    ${kpi(fN(entR), 'Entradas em 6 meses', u6.map(fM).join(' · '), { lista: L.filter(p => u6.includes(p.ma)), tit: 'Admitidos nos últimos 6 meses' })}
    ${kpi(fN(saiR), 'Saídas em 6 meses', 'desligamentos e desmobilizações', { lista: Sa.filter(p => u6.includes(p.mes)), tit: 'Saídas nos últimos 6 meses', cols: COLS_SA, cls: 'gold' })}
    ${kpi((entR - saiR > 0 ? '+' : '') + fN(entR - saiR), 'Saldo de 6 meses', entR - saiR >= 0 ? 'quadro cresceu' : 'quadro encolheu')}
  </div>`);

  root.insertAdjacentHTML('beforeend', `<section>${painel('Efetivo mês a mês',
    'barras: quem entrou e quem saiu em cada mês. Linha: o tamanho do quadro ao fim do mês. Clique na barra para ver os nomes',
    '<div class="ch alto"><canvas></canvas></div>')}</section>`);
  const cv = root.querySelector('.ch.alto canvas');
  chart(cv, {
    data: {
      labels: meses.map(fM),
      datasets: [
        { type: 'line', label: 'Efetivo no fim do mês', data: acum, borderColor: css('--azul'), borderWidth: 2.5, fill: false, tension: .3, pointRadius: 2, yAxisID: 'y1', order: 0 },
        { type: 'bar', label: 'Entradas', data: ent, backgroundColor: css('--ok'), borderRadius: 3, yAxisID: 'y', order: 1 },
        { type: 'bar', label: 'Saídas', data: sai, backgroundColor: css('--gold'), borderRadius: 3, yAxisID: 'y', order: 1 },
      ]
    },
    options: {
      plugins: { legend: { display: true, position: 'bottom' },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fN(Math.abs(c.parsed.y))}` } } },
      scales: { y: { position: 'left', beginAtZero: true, title: { display: true, text: 'entradas e saídas' }, ticks: { precision: 0 } },
                y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: 'efetivo' } } },
      onClick: (e, els) => {
        if (!els.length) return;
        const m = meses[els[0].index], d = els[0].datasetIndex;
        if (d === 1) abrir(L.filter(p => p.ma === m), 'Admitidos em ' + fM(m));
        else if (d === 2) abrir(Sa.filter(p => p.mes === m), 'Saídas em ' + fM(m), '', COLS_SA);
      }
    }
  });

  const FAIXA = [['admitidos em 2026', y => y === 2026], ['admitidos em 2025', y => y === 2025],
                 ['2023 e 2024', y => y >= 2023 && y <= 2024], ['2020 a 2022', y => y >= 2020 && y <= 2022],
                 ['antes de 2020', y => y < 2020]];
  const comAdm = L.filter(p => p.ma);
  const porAno = FAIXA.map(([k, f]) => {
    const l = comAdm.filter(p => f(+p.ma.slice(0, 4)));
    return { k, v: l.length, lista: l };
  }).filter(d => d.v);
  // a planilha tem uma admissão lançada em 2029: data futura, erro de cadastro na origem
  const futuro = comAdm.filter(p => p.ma > HOJE.slice(0, 7));
  if (futuro.length) porAno.push({ k: 'data de admissão futura', v: futuro.length, lista: futuro, cls: 'tp', sub: 'erro de cadastro' });
  const mobM = [...grupo(L.filter(p => p.mm), p => p.mm)].map(([k, v]) => ({ k: fM(k), v: v.length, lista: v, ord: k })).sort((a, b) => a.ord.localeCompare(b.ord)).slice(-12);
  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('De que safra é a equipe', 'ano de admissão de quem está no quadro hoje', barras(porAno))}
    ${painel('Mobilizações por mês', 'quando cada pessoa foi liberada para o canteiro', barras(mobM))}
  </section>`);
}

/* 3 · PERFIL E CRUZAMENTOS */
function vPerfil(root) {
  const L = sel();
  const FX = ['18 a 24', '25 a 34', '35 a 44', '45 a 54', '55 ou mais'];
  const TC = ['até 6 meses', '6 meses a 1 ano', '1 a 2 anos', '2 a 5 anos', '5 anos ou mais'];
  const fem = L.filter(p => p.sx === 'F'), mas = L.filter(p => p.sx === 'M');

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(fem.length), 'Mulheres', fP(fem.length / L.length, 1) + ' do efetivo', { lista: fem, tit: 'Mulheres no efetivo', cls: 'gold' })}
    ${kpi(fN(L.filter(p => p.apr).length), 'Aprendizes', 'contrato de aprendizagem', { lista: L.filter(p => p.apr), tit: 'Aprendizes' })}
    ${kpi(fN(L.filter(p => p.tc !== null && p.tc < 0.5).length), 'Com até 6 meses', 'ainda em curva de aprendizado', { lista: L.filter(p => p.tc !== null && p.tc < 0.5), tit: 'Até 6 meses de casa' })}
    ${kpi(fN(L.filter(p => p.tc !== null && p.tc >= 5).length), 'Com 5 anos ou mais', 'memória técnica da empresa', { lista: L.filter(p => p.tc !== null && p.tc >= 5), tit: '5 anos ou mais de casa' })}
  </div>`);

  root.insertAdjacentHTML('beforeend', `<section>${painel('Pirâmide etária por obra',
    'Obras Civis à esquerda, Trem de Passageiros à direita. Clique na barra para ver quem está em cada faixa',
    '<div class="ch alto"><canvas></canvas></div>')}</section>`);
  const cv = root.querySelector('.ch.alto canvas');
  const oc = FX.map(f => -A.filter(p => p.o === 'OC' && p.fx === f).length);
  const tp = FX.map(f => A.filter(p => p.o === 'TP' && p.fx === f).length);
  chart(cv, {
    type: 'bar',
    data: { labels: FX, datasets: [
      { label: 'Obras Civis', data: oc, backgroundColor: css('--azul'), borderRadius: 3 },
      { label: 'Trem de Passageiros', data: tp, backgroundColor: css('--gold'), borderRadius: 3 }] },
    options: { indexAxis: 'y',
      plugins: { legend: { display: true, position: 'bottom' },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fN(Math.abs(c.parsed.x))}` } } },
      scales: { x: { stacked: true, ticks: { callback: v => Math.abs(v) } }, y: { stacked: true } },
      onClick: (e, els) => { if (els.length) { const f = FX[els[0].index], o = els[0].datasetIndex ? 'TP' : 'OC';
        abrir(A.filter(p => p.o === o && p.fx === f), `${f} anos · ${OBRA[o]}`); } } }
  });

  // mapa de calor função x tempo de casa
  const topF = [...grupo(L, p => p.fn)].sort((a, b) => b[1].length - a[1].length).slice(0, 12).map(x => x[0]);
  const maxC = Math.max(...topF.flatMap(f => TC.map(t => L.filter(p => p.fn === f && p.ftc === t).length)), 1);
  const cor = v => v === 0 ? 'transparent' : `color-mix(in srgb, var(--azul) ${Math.round(18 + v / maxC * 82)}%, transparent)`;
  const hid = 'hm' + Math.random().toString(36).slice(2, 7);
  const linhas = topF.map(f => `<tr><td class="fnm">${h(trunc(f, 30))}</td>` + TC.map(t => {
    const q = L.filter(p => p.fn === f && p.ftc === t).length;
    return `<td class="hc" data-f="${h(f)}" data-t="${h(t)}" style="background:${cor(q)};color:${q / maxC > .55 ? '#fff' : 'inherit'}">${q || ''}</td>`;
  }).join('') + '</tr>').join('');
  root.insertAdjacentHTML('beforeend', `<section>${painel('Função x tempo de casa',
    'onde está a gente nova e onde está a experiência. Clique numa célula para ver os nomes',
    `<div class="tw"><table class="hm" id="${hid}"><thead><tr><th>Função</th>${TC.map(t => `<th class="num">${t}</th>`).join('')}</tr></thead><tbody>${linhas}</tbody></table></div>`)}</section>`);
  setTimeout(() => {
    document.querySelectorAll('#' + hid + ' .hc').forEach(c => {
      c.onclick = () => { const l = L.filter(p => p.fn === c.dataset.f && p.ftc === c.dataset.t);
        if (l.length) abrir(l, c.dataset.f, c.dataset.t + ' de casa'); };
    });
  });

  const porTc = TC.map(k => ({ k, v: L.filter(p => p.ftc === k).length, lista: L.filter(p => p.ftc === k) })).filter(d => d.v);
  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Tempo de casa', 'quanto da equipe é recém-chegado', barras(porTc))}
    ${painel('Onde estão as mulheres', 'funções ocupadas',
      fem.length ? barras([...grupo(fem, p => p.fn)].map(([k, v]) => ({ k, v: v.length, lista: v })).sort((a, b) => b.v - a.v)) : '<p class="h2s">Sem registro.</p>')}
  </section>`);
}

/* 4 · RISCO OPERACIONAL */
function vRisco(root) {
  const L = sel();
  const comB = L.filter(p => p.blo !== null);
  const venc = comB.filter(p => p.blo < 0), crit = comB.filter(p => p.blo >= 0 && p.blo <= 15);
  const alerta = comB.filter(p => p.blo > 15 && p.blo <= 30);
  const fora = L.filter(p => !p.naObra);
  const porFn = [...grupo(L, p => p.fn)];
  const unicos = porFn.filter(([, v]) => v.length === 1).map(([k, v]) => v[0]);
  const unicosObra = unicos.filter(p => p.naObra);
  const Sa = selS();
  const rot = porFn.map(([k, v]) => {
    const s = Sa.filter(x => x.fn === k).length;
    return { k, v: s, atual: v.length, taxa: s / (s + v.length), lista: Sa.filter(x => x.fn === k) };
  }).filter(d => d.v >= 2).sort((a, b) => b.taxa - a.taxa).slice(0, 10);

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(venc.length), 'Crachás vencidos', 'acesso já bloqueado', { lista: venc, tit: 'Crachás vencidos', cls: venc.length ? 'gold' : '' })}
    ${kpi(fN(crit.length), 'Vencem em 15 dias', 'crítico', { lista: crit, tit: 'Crachá vence em até 15 dias', cls: crit.length ? 'gold' : '' })}
    ${kpi(fN(alerta.length), 'Vencem em 16 a 30 dias', 'alerta', { lista: alerta, tit: 'Crachá vence em 16 a 30 dias', cls: alerta.length ? 'gold' : '' })}
    ${kpi(fN(fora.length), 'Fora da obra', 'contratados sem presença', { lista: fora, tit: 'Fora da obra', cls: fora.length ? 'gold' : '' })}
    ${kpi(fN(unicosObra.length), 'Funções com uma pessoa só', 'ponto único de falha na obra', { lista: unicosObra, tit: 'Funções com uma pessoa só' })}
    ${kpi(fN(AF.length), 'Afastados', 'fora por afastamento', { lista: AF.map(p => Object.assign({ naObra: false, loc: p.st, adm: null, tc: null, id: null, blo: null }, p)), tit: 'Afastados' })}
  </div>`);

  const risco = [...venc, ...crit, ...alerta].sort((a, b) => a.blo - b.blo);
  root.insertAdjacentHTML('beforeend', `<section>${painel('Quem perde o acesso primeiro',
    'sem renovação a pessoa não entra no terminal e a frente perde o dia. Quem já está fora da obra não é urgência: ali o crachá vencido é consequência, não causa',
    risco.length ? `<div class="tw"><table><thead><tr><th>${NOM ? 'Nome' : 'Matrícula'}</th><th>Função</th><th>Obra</th><th>Está na obra</th><th class="num">Bloqueio</th><th class="num">Dias</th></tr></thead>
      <tbody>${risco.map(p => `<tr><td>${quem(p)}</td><td>${h(p.c)}</td><td>${OBRA[p.o]}</td>
      <td>${p.naObra ? 'sim' : '<span class="av">não</span>'}</td><td class="num">${fD(p.dblo)}</td>
      <td class="num"><b class="${p.blo <= 15 ? 'av' : ''}">${fN(p.blo)}</b></td></tr>`).join('')}</tbody></table></div>`
      : '<p class="h2s">Nenhum crachá vence nos próximos 30 dias.</p>')}</section>`);

  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Pessoal contratado que não está na obra', 'por função: é mão de obra paga que a frente não tem',
      fora.length ? barras([...grupo(fora, p => p.fn)].map(([k, v]) => ({ k, v: v.length, lista: v, sub: OBRA[v[0].o] })).sort((a, b) => b.v - a.v)) : '<p class="h2s">Todo o efetivo está na obra.</p>')}
    ${painel('Funções que mais perdem gente', 'saídas sobre o total que já passou pela função. Clique para ver quem saiu',
      rot.length ? barras(rot.map(d => ({ k: d.k, v: d.v, lista: d.lista, sub: fP(d.taxa, 0) + ' de troca' })), { cols: COLS_SA }) : '<p class="h2s">Sem função com duas saídas ou mais.</p>')}
  </section>`);

  // barra de tamanho 1 repetida vinte vezes não informa nada: vira grade de fichas
  if (unicosObra.length) {
    const gid = 'u' + Math.random().toString(36).slice(2, 7);
    const fichas = [...unicosObra].sort((a, b) => a.fn.localeCompare(b.fn, 'pt-BR')).map((p, i) =>
      `<button class="ficha" data-i="${i}"><b>${h(p.fn)}</b><span>${NOM ? h(p.n) : 'mat. ' + h(p.mat)}</span><small>${OBRA[p.o]}</small></button>`).join('');
    root.insertAdjacentHTML('beforeend', `<section>${painel('Ponto único de falha',
      `${fN(unicosObra.length)} funções têm uma única pessoa na obra: falta, férias ou saída param a atividade`,
      `<div class="fichas" id="${gid}">${fichas}</div>`)}</section>`);
    const ord = [...unicosObra].sort((a, b) => a.fn.localeCompare(b.fn, 'pt-BR'));
    setTimeout(() => document.querySelectorAll('#' + gid + ' .ficha').forEach(b =>
      b.onclick = () => abrir([ord[+b.dataset.i]], ord[+b.dataset.i].fn, 'única pessoa na obra')));
  }
}

/* 5 · TURNOVER */
function vTurn(root) {
  const L = sel(), Sa = selS();
  const meses = [...new Set(Sa.map(p => p.mes).filter(Boolean))].sort();
  const u3 = meses.slice(-3), rec = Sa.filter(p => u3.includes(p.mes));
  const comTc = Sa.filter(p => p.tc !== null);
  const cedo = comTc.filter(p => p.tc < 0.5);
  const motivo = [...grupo(Sa, p => p.mot)].map(([k, v]) => ({ k, v: v.length, lista: v })).sort((a, b) => b.v - a.v);

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(Sa.length), 'Saídas registradas', 'histórico das duas planilhas', { lista: Sa, tit: 'Todas as saídas', cols: COLS_SA })}
    ${kpi(fN(rec.length), 'Saídas em 3 meses', u3.map(fM).join(' · '), { lista: rec, tit: 'Saídas nos últimos 3 meses', cols: COLS_SA })}
    ${kpi(fP(L.length ? rec.length / 3 / L.length : 0, 1), 'Turnover mensal', 'saídas do mês sobre o efetivo atual', { cls: 'gold' })}
    ${kpi(f1(med(comTc.map(p => p.tc))) + ' a', 'Tempo de casa na saída', 'mediana de quem saiu')}
    ${kpi(fN(cedo.length), 'Saíram com até 6 meses', fP(comTc.length ? cedo.length / comTc.length : 0, 0) + ' das saídas', { lista: cedo, tit: 'Saíram com até 6 meses de casa', cols: COLS_SA, cls: 'gold' })}
    ${kpi(fN([...new Set(Sa.map(p => p.fn))].length), 'Funções atingidas', 'funções que perderam ao menos uma pessoa')}
  </div>`);

  root.insertAdjacentHTML('beforeend', `<section>${painel('Saídas mês a mês por motivo',
    'barras empilhadas por causa do desligamento. Clique para ver quem saiu',
    '<div class="ch alto"><canvas></canvas></div>')}</section>`);
  const cv = root.querySelector('.ch.alto canvas');
  const mots = motivo.map(m => m.k);
  const CORES = [css('--azul'), css('--gold'), css('--azul2'), css('--mut')];
  chart(cv, {
    type: 'bar',
    data: { labels: meses.map(fM), datasets: mots.map((m, i) => ({
      label: m, data: meses.map(x => Sa.filter(p => p.mes === x && p.mot === m).length),
      backgroundColor: CORES[i % CORES.length], borderRadius: 2 })) },
    options: { plugins: { legend: { display: true, position: 'bottom' } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } },
      onClick: (e, els) => { if (els.length) { const m = meses[els[0].index], mo = mots[els[0].datasetIndex];
        abrir(Sa.filter(p => p.mes === m && p.mot === mo), mo + ' · ' + fM(m), '', COLS_SA); } } }
  });

  const porFun = [...grupo(Sa, p => p.fn)].map(([k, v]) => ({ k, v: v.length, lista: v })).sort((a, b) => b.v - a.v).slice(0, 12);
  const TC = ['até 6 meses', '6 meses a 1 ano', '1 a 2 anos', '2 a 5 anos', '5 anos ou mais'];
  const porTc = TC.map(k => ({ k, v: Sa.filter(p => p.ftc === k).length, lista: Sa.filter(p => p.ftc === k) })).filter(d => d.v);
  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Funções com mais saídas', 'onde a reposição consome mais tempo de mobilização', barras(porFun, { cols: COLS_SA }))}
    ${painel('Tempo de casa de quem saiu', 'saída precoce é custo de recrutamento e integração jogado fora', barras(porTc, { cols: COLS_SA }))}
  </section>`);
}

/* 6 · LISTA COMPLETA */
function vLista(root) {
  const L = sel();
  root.insertAdjacentHTML('beforeend', `<section>${painel('Efetivo completo',
    NOM ? 'busca por nome, matrícula ou função' : 'busca por matrícula ou função',
    `<input class="busca" id="q" placeholder="${NOM ? 'digite um nome, matrícula ou função' : 'digite uma matrícula ou função'}" autocomplete="off">
     <div id="res"></div>`)}</section>`);
  const cols = COLS_AT;
  function pinta(lista) {
    document.getElementById('res').innerHTML =
      `<p class="h2s" style="margin:10px 0">${fN(lista.length)} de ${fN(L.length)} pessoas</p>` +
      `<div class="tw"><table><thead><tr>${cols.map(c => `<th class="${c.n ? 'num' : ''}">${c.t}</th>`).join('')}</tr></thead>
       <tbody>${[...lista].sort(ordem).map(p => `<tr>${cols.map(c => `<td class="${c.n ? 'num' : ''}">${c.f(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  pinta(L);
  const q = document.getElementById('q');
  q.oninput = () => {
    const t = q.value.trim().toLowerCase();
    pinta(!t ? L : L.filter(p => ((NOM ? p.n : '') + ' ' + p.mat + ' ' + p.c).toLowerCase().includes(t)));
  };
}

/* ---------- navegação ---------- */
const VIEWS = [['geral', 'Panorama', vGeral], ['evol', 'Evolução', vEvol],
               ['perfil', 'Perfil', vPerfil], ['risco', 'Risco operacional', vRisco],
               ['turn', 'Turnover', vTurn], ['lista', 'Lista completa', vLista]];

function show() {
  limpaCharts(); fechar();
  const main = document.getElementById('main');
  main.innerHTML = '';
  (VIEWS.find(x => x[0] === ST.view) || VIEWS[0])[2](main);
  document.querySelectorAll('.abas button').forEach(b => b.classList.toggle('on', b.dataset.v === ST.view));
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.o === ST.obra));
  try { localStorage.setItem('ef.view', ST.view); } catch (e) { }
}

(function () {
  const nav = document.getElementById('abas');
  nav.innerHTML = '<div class="wrapa">' + VIEWS.map(v => `<button data-v="${v[0]}">${v[1]}</button>`).join('') + '</div>';
  nav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { ST.view = b.dataset.v; show(); } });
  const seg = document.getElementById('seg');
  seg.innerHTML = [['', 'As duas obras'], ['OC', 'Obras Civis'], ['TP', 'Trem de Passageiros']]
    .map(([k, r]) => `<button data-o="${k}">${r}</button>`).join('');
  seg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { ST.obra = b.dataset.o; show(); } });
  document.getElementById('meta').innerHTML =
    `<div><small>Efetivo</small><b>${fN(A.length)}</b></div>` +
    `<div><small>Na obra</small><b>${fN(A.filter(p => p.naObra).length)}</b></div>` +
    `<div><small>Funções</small><b>${fN([...new Set(A.map(p => p.fn))].length)}</b></div>` +
    `<div><small>Atualizado</small><b>${META.data.split('-').reverse().join('/')}</b></div>`;
  document.getElementById('veu').onclick = fechar;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });
  try { const v = localStorage.getItem('ef.view'); if (v && VIEWS.some(x => x[0] === v)) ST.view = v; } catch (e) { }
  show();
})();
