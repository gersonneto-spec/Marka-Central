/* ===================== VIEWS ===================== */

/* 1 · PANORAMA */
function vGeral(root) {
  const L = sel();
  const comSal = L.filter(p => p.s);
  const folha = soma(comSal, p => p.s);
  const moi = L.filter(p => p.m === 'MOI'), mod = L.filter(p => p.m === 'MOD');
  const folhaMOI = soma(moi.filter(p => p.s), p => p.s);
  const fora = L.filter(p => !p.naObra);
  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(L.length), 'Efetivo cadastrado', `${fN(L.filter(p => p.naObra).length)} na obra`)}
    ${kpi(fR0(folha), 'Folha mensal estimada', `${fN(comSal.length)} de ${fN(L.length)} com salário de referência`, 'gold')}
    ${kpi(fN(mod.length), 'Mão de obra direta', fP(mod.length / L.length, 0) + ' do efetivo')}
    ${kpi(fN(moi.length), 'Mão de obra indireta', folha ? fP(folhaMOI / folha, 1) + ' da folha' : '–')}
    ${kpi(fN(fora.length), 'Fora da obra', 'cadastrados e não mobilizados')}
    ${kpi(fR0(comSal.length ? folha / comSal.length : 0), 'Salário médio', 'por pessoa com referência')}
  </div>`);

  const porObra = [...grupo(A, p => p.o)].map(([k, v]) => ({
    k: OBRA[k] || k, v: v.length, sub: fR0(soma(v.filter(p => p.s), p => p.s))
  }));
  const porFun = [...grupo(L, p => p.fn)].map(([k, v]) => ({ k, v: v.length, sub: fR0(soma(v.filter(p => p.s), p => p.s)) }))
    .sort((a, b) => b.v - a.v).slice(0, 15);
  const folhaFun = [...grupo(L.filter(p => p.s), p => p.fn)].map(([k, v]) => ({ k, v: soma(v, p => p.s), sub: v.length + ' pessoa' + (v.length > 1 ? 's' : '') }))
    .sort((a, b) => b.v - a.v).slice(0, 15);

  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Efetivo por obra', 'cadastrados e folha estimada de cada contrato', barras(porObra))}
    ${painel('MOD x MOI', 'peso da mão de obra indireta no efetivo e na folha',
      barras([{ k: 'Direta (MOD)', v: mod.length }, { k: 'Indireta (MOI)', v: moi.length, cls: 'tp' }]) +
      `<p class="h2s" style="margin-top:14px">A MOI é ${fP(moi.length / L.length, 1)} das pessoas e ${fP(folhaMOI / folha, 1)} da folha. Quanto maior essa distância, mais cara é a estrutura por pessoa produtiva.</p>`)}
  </section>`);

  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Funções com mais gente', 'quantidade de pessoas e folha da função', barras(porFun))}
    ${painel('Funções que mais pesam na folha', 'valor mensal estimado por função', barras(folhaFun, { fmt: fR0 }))}
  </section>`);

  if (META.semSalario.length) root.insertAdjacentHTML('beforeend',
    `<div class="nota">As planilhas do SGC não trazem salário. A folha vem da tabela por função da base anterior, casada pelo nome da função sem o nível. ${META.semSalario.length} funções não têm referência e ficam fora do cálculo: ${META.semSalario.map(h).join(', ')}.</div>`);
}

/* 2 · MOBILIZAÇÃO */
function vMob(root) {
  const L = sel();
  const porLoc = [...grupo(L, p => p.loc || 'não informado')].map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v);
  // só admitidos em 2026: para quem é de empresa antiga, 'dias adm -> mob' mede tempo de
  // casa até ser alocado nesta obra, não prazo de mobilização. Dava 7.472 dias.
  const comDias = L.filter(p => p.dmob !== null && p.dmob >= 0 && p.adm >= '2026-01');
  const med = comDias.length ? comDias.map(p => p.dmob).sort((a, b) => a - b)[Math.floor(comDias.length / 2)] : null;
  const fora = L.filter(p => !p.naObra);
  const lentos = [...comDias].sort((a, b) => b.dmob - a.dmob).slice(0, 10);

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(L.filter(p => p.naObra).length), 'Na obra', 'liberados e mobilizados')}
    ${kpi(fN(fora.length), 'Fora da obra', 'cadastrados, sem presença', fora.length ? 'gold' : '')}
    ${kpi(med === null ? '–' : fN(med) + ' d', 'Prazo de mobilização', `mediana dos ${fN(comDias.length)} admitidos em 2026`)}
    ${kpi(fR0(soma(fora.filter(p => p.s), p => p.s)), 'Folha parada', 'estimativa do pessoal fora da obra', 'gold')}
  </div>`);

  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Onde está o efetivo', 'situação informada na planilha do SGC', barras(porLoc))}
    ${painel('Quem está fora da obra', 'por função, sem identificação nominal',
      fora.length ? barras([...grupo(fora, p => p.fn)].map(([k, v]) => ({ k, v: v.length, sub: OBRA[v[0].o] })).sort((a, b) => b.v - a.v))
        : '<p class="h2s">Todo o efetivo cadastrado está na obra.</p>')}
  </section>`);

  root.insertAdjacentHTML('beforeend', `<section>${painel('Maiores prazos de mobilização',
    'admitidos em 2026, dez casos mais lentos: cada dia aqui é salário pago sem produção na frente',
    tabela([{ t: 'Função', k: 'fn' }, { t: 'Obra', f: r => OBRA[r.o] },
      { t: 'Admissão', f: r => mesLbl(r.adm) }, { t: 'Mobilização', f: r => mesLbl(r.mob) },
      { t: 'Dias', n: true, f: r => `<b>${fN(r.dmob)}</b>` }], lentos))}</section>`);
}

/* 3 · CRACHÁ */
function vCracha(root) {
  const L = sel().filter(p => p.blo !== null);
  const fx = d => d < 0 ? 'vencido' : d <= 15 ? 'crítico' : d <= 30 ? 'alerta' : 'ok';
  const venc = L.filter(p => fx(p.blo) === 'vencido'), crit = L.filter(p => fx(p.blo) === 'crítico');
  const alerta = L.filter(p => fx(p.blo) === 'alerta'), ok = L.filter(p => fx(p.blo) === 'ok');
  const risco = [...venc, ...crit, ...alerta].sort((a, b) => a.blo - b.blo);

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(venc.length), 'Vencidos', 'acesso já bloqueado', venc.length ? 'gold' : '')}
    ${kpi(fN(crit.length), 'Críticos', 'até 15 dias', crit.length ? 'gold' : '')}
    ${kpi(fN(alerta.length), 'Alerta', 'de 16 a 30 dias', alerta.length ? 'gold' : '')}
    ${kpi(fN(ok.length), 'Em dia', 'mais de 30 dias')}
  </div>`);

  root.insertAdjacentHTML('beforeend', `<section>${painel('Quem perde o acesso primeiro',
    'ordenado pelo prazo de bloqueio do crachá. Sem renovação a pessoa não entra no terminal e a frente perde o dia. Quem já está fora da obra não é urgência: o crachá vencido ali é consequência, não causa',
    risco.length ? tabela([{ t: 'Função', k: 'fn' }, { t: 'Obra', f: r => OBRA[r.o] },
      { t: 'Está na obra', f: r => r.naObra ? 'sim' : `<span style="color:var(--mut)">não</span>` },
      { t: 'Situação', f: r => `<span class="tag ${fx(r.blo) === 'ok' ? '' : 'w'}">${fx(r.blo)}</span>` },
      { t: 'Dias até o bloqueio', n: true, f: r => `<b>${fN(r.blo)}</b>` }], risco)
      : '<p class="h2s">Nenhum crachá vence nos próximos 30 dias.</p>')}</section>`);
}

/* 4 · PERFIL */
function vPerfil(root) {
  const L = sel();
  const ORD = ['até 24', '25 a 34', '35 a 44', '45 a 54', '55 ou mais'];
  const porFx = ORD.map(k => ({ k, v: L.filter(p => p.fx === k).length })).filter(d => d.v);
  const porSx = [['M', 'Masculino'], ['F', 'Feminino']].map(([k, r]) => ({ k: r, v: L.filter(p => p.sx === k).length }));
  const comTc = L.filter(p => p.tc !== null);
  const tcFx = [['menos de 1 ano', p => p.tc < 1], ['1 a 2 anos', p => p.tc >= 1 && p.tc < 2],
                ['2 a 5 anos', p => p.tc >= 2 && p.tc < 5], ['5 anos ou mais', p => p.tc >= 5]]
    .map(([k, f]) => ({ k, v: comTc.filter(f).length })).filter(d => d.v);
  const tcMed = comTc.length ? [...comTc].map(p => p.tc).sort((a, b) => a - b)[Math.floor(comTc.length / 2)] : null;
  const fem = L.filter(p => p.sx === 'F');

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fD1(tcMed) + ' a', 'Tempo de casa (mediana)', `${fN(comTc.length)} pessoas com admissão informada`)}
    ${kpi(fN(comTc.filter(p => p.tc < 1).length), 'Com menos de 1 ano', fP(comTc.filter(p => p.tc < 1).length / comTc.length, 0) + ' do efetivo')}
    ${kpi(fN(fem.length), 'Mulheres no efetivo', fP(fem.length / L.length, 1) + ' do total', 'gold')}
    ${kpi(fN(L.filter(p => p.apr).length), 'Aprendizes', 'contrato de aprendizagem')}
  </div>`);

  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Faixa etária', 'distribuição do efetivo cadastrado', barras(porFx))}
    ${painel('Tempo de casa', 'quanto da equipe é recém-chegado', barras(tcFx))}
  </section>`);

  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Sexo', 'composição do efetivo', barras(porSx))}
    ${painel('Onde estão as mulheres', 'funções ocupadas, sem identificação nominal',
      fem.length ? barras([...grupo(fem, p => p.fn)].map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v))
        : '<p class="h2s">Sem registro.</p>')}
  </section>`);
}

/* 5 · TURNOVER */
function vTurn(root) {
  const L = selS(), At = sel();
  const meses = [...new Set(L.map(p => p.mes).filter(Boolean))].sort();
  const porMes = meses.map(m => ({ m, v: L.filter(p => p.mes === m).length }));
  const motivo = [...grupo(L, p => p.mot || 'não informado')].map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v);
  const comTc = L.filter(p => p.tc !== null && p.tc >= 0);
  const tcMed = comTc.length ? [...comTc].map(p => p.tc).sort((a, b) => a - b)[Math.floor(comTc.length / 2)] : null;
  const cedo = comTc.filter(p => p.tc < 0.5);
  const u3 = meses.slice(-3);
  const rec = L.filter(p => u3.includes(p.mes));
  const porFun = [...grupo(L, p => p.fn)].map(([k, v]) => ({ k, v: v.length })).sort((a, b) => b.v - a.v).slice(0, 12);

  root.insertAdjacentHTML('beforeend', `<div class="kpis">
    ${kpi(fN(L.length), 'Saídas registradas', 'no histórico das duas planilhas')}
    ${kpi(fN(rec.length), 'Saídas nos últimos 3 meses', u3.map(mesLbl).join(' · '))}
    ${kpi(fP(At.length ? rec.length / 3 / At.length : 0, 1), 'Turnover mensal', 'saídas do mês sobre o efetivo atual', 'gold')}
    ${kpi(fD1(tcMed) + ' a', 'Tempo de casa na saída', 'mediana de quem saiu')}
    ${kpi(fN(cedo.length), 'Saíram com menos de 6 meses', fP(comTc.length ? cedo.length / comTc.length : 0, 0) + ' das saídas', cedo.length ? 'gold' : '')}
    ${kpi(fN(AF.length), 'Afastados hoje', 'fora por afastamento')}
  </div>`);

  root.insertAdjacentHTML('beforeend', `<section>${painel('Saídas mês a mês',
    'quando o efetivo foi embora', '<div class="ch"><canvas></canvas></div>')}</section>`);
  const cv = root.querySelector('.ch canvas');
  chart(cv, { type: 'bar', data: { labels: porMes.map(d => mesLbl(d.m)), datasets: [{ data: porMes.map(d => d.v), backgroundColor: css('--azul'), borderRadius: 3, barPercentage: .65 }] },
    options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });

  root.insertAdjacentHTML('beforeend', `<section class="grid2">
    ${painel('Motivo da saída', 'o que a planilha registra como causa', barras(motivo))}
    ${painel('Funções com mais saídas', 'onde a reposição consome mais tempo de mobilização', barras(porFun))}
  </section>`);

  root.insertAdjacentHTML('beforeend',
    `<div class="nota">Pedido de demissão e desligamento por iniciativa da empresa pesam de forma diferente no custo: o pedido indica perda de gente treinada, o desligamento indica ajuste de efetivo. Reposição exige nova mobilização, que nesta obra leva a mediana mostrada na aba Mobilização.</div>`);
}

/* ---------- navegação ---------- */
const VIEWS = [['geral', 'Panorama', vGeral], ['mob', 'Mobilização', vMob],
               ['cracha', 'Crachá e acesso', vCracha], ['perfil', 'Perfil da equipe', vPerfil],
               ['turn', 'Turnover', vTurn]];

function show() {
  limpaCharts();
  const main = document.getElementById('main');
  main.innerHTML = '';
  const v = VIEWS.find(x => x[0] === ST.view) || VIEWS[0];
  v[2](main);
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
    `<div><small>Atualizado</small><b>${META.data.split('-').reverse().join('/')}</b></div>`;
  try { const v = localStorage.getItem('ef.view'); if (v && VIEWS.some(x => x[0] === v)) ST.view = v; } catch (e) { }
  show();
})();
