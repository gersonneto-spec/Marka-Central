# -*- coding: utf-8 -*-
"""Injeta a aba Gráficos x Análise no painel de Efetivo."""
import re
s = open('base.html', encoding='utf-8').read()
css = open('css_add.txt', encoding='utf-8').read()
js  = open('graf.js', encoding='utf-8').read()

# 1. CSS
assert '</style>' in s
s = s.replace('</style>', css + '\n</style>', 1)

# 2. Chart.js
s = s.replace('</head>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>\n</head>', 1)

# 3. nav de abas logo após o header
assert '</header>' in s
s = s.replace('</header>', '''</header>
<nav class="abas"><div class="wrapa">
  <button data-v="painel" class="on">Painel</button>
  <button data-v="graf">Gráficos x Análise</button>
</div></nav>''', 1)

# 4. embrulha o conteúdo atual na view "painel" e cria a view "graf"
ini = s.index('<div class="wrap">\n  <div class="kpis" id="kpis"></div>')
fim = s.index('<div class="foot">')
corpo = s[ini:fim]
corpo_novo = ('<div class="wrap">\n<div class="view on" id="v-painel">\n'
              + corpo.replace('<div class="wrap">\n', '', 1)
              + '''</div>

<div class="view" id="v-graf">
  <div class="filtros" id="gfil"></div>

  <div class="gsec">
    <div class="gh"><h2>1 &middot; Dispersão</h2><span>quanto o grupo pesa na folha contra quanto custa cada pessoa, com a bolha no tamanho do efetivo</span></div>
    <div class="panel">
      <div class="leg-exp"><b>Como ler:</b> cada bolha é um grupo. Quanto mais à direita, mais a folha daquele grupo pesa no mês; quanto mais acima, maior o salário de cada pessoa; quanto maior a bolha, mais gente. As linhas tracejadas são a folha média por grupo e o salário médio, e a área laranja é o quadrante que pesa nos dois eixos ao mesmo tempo.</div>
      <div class="ch alto"><canvas id="g1"></canvas></div>
      <div class="quando"><b>Quando usar:</b> para decidir onde mexer primeiro. Bolha grande e baixa se resolve por produtividade e dimensionamento; bolha pequena e alta se resolve por escala salarial e estrutura.</div>
    </div>
    <div class="achado" id="g1txt"></div>
  </div>

  <div class="gsec">
    <div class="gh"><h2>2 &middot; Histograma com densidade</h2><span>distribuição real dos salários, sem faixas pré-definidas</span></div>
    <div class="panel">
      <div class="leg-exp"><b>Como ler:</b> cada barra conta quantos colaboradores caem naquela faixa de salário; a linha dourada é a densidade, que suaviza o desenho e mostra onde a massa se concentra de verdade.</div>
      <div class="ch alto"><canvas id="g2"></canvas></div>
      <div class="quando"><b>Quando usar:</b> antes de qualquer simulação de reajuste. Mostra que a folha é formada por degraus de tabela, e quantas pessoas cada degrau carrega.</div>
    </div>
    <div class="achado" id="g2txt"></div>
  </div>

  <div class="gsec">
    <div class="gh"><h2>3 &middot; Cascata</h2><span>como a folha se empilha, do maior grupo até o total do mês</span></div>
    <div class="panel">
      <div class="leg-exp"><b>Como ler:</b> cada barra laranja é o quanto um grupo acrescenta à folha, empilhada sobre a anterior; a barra azul da direita é a folha mensal fechada. A altura de cada degrau é o peso daquele grupo.</div>
      <div class="ch alto"><canvas id="g3"></canvas></div>
      <div class="quando"><b>Quando usar:</b> para apresentar à diretoria de onde saiu a folha, e não só quanto ela é. Funciona em qualquer decomposição de um total em partes.</div>
    </div>
    <div class="achado" id="g3txt"></div>
  </div>

  <div class="gsec">
    <div class="gh"><h2>4 &middot; Inclinação entre as obras</h2><span id="g4sub">Obras Civis contra Trem de Passageiro</span></div>
    <div class="panel">
      <div class="leg-exp"><b>Como ler:</b> cada linha liga o mesmo grupo nas duas obras, na métrica escolhida no filtro. Linha subindo pesa mais no Trem de Passageiro; linha descendo pesa mais em Obras Civis; linha plana é igual nos dois contratos. Só aparecem grupos presentes nas duas obras.</div>
      <div class="ch alto"><canvas id="g4"></canvas></div>
      <div class="gleg" id="g4leg"></div>
      <div class="quando"><b>Quando usar:</b> para comparar a estrutura dos dois contratos sem alternar o filtro de obra e comparar de memória. Diferença grande no mesmo cargo pede conferência de nível e de critério do DP.</div>
    </div>
    <div class="achado" id="g4txt"></div>
  </div>
</div>

''')
s = s[:ini] + corpo_novo + s[fim:]

# 5. JS: insere as funções antes do bloco de listeners finais
alvo = "document.querySelectorAll('.seg button').forEach"
assert alvo in s
s = s.replace(alvo, js + '\n' + alvo, 1)

# 6. troca de aba + re-render; obra passa a atualizar as duas views
s = s.replace(
  "document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{OBRA=b.dataset.o;document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));render()});",
  """let VIEW='painel';
document.querySelectorAll('.abas button').forEach(b=>b.onclick=()=>{
  VIEW=b.dataset.v;
  document.querySelectorAll('.abas button').forEach(x=>x.classList.toggle('on',x===b));
  document.getElementById('v-painel').classList.toggle('on',VIEW==='painel');
  document.getElementById('v-graf').classList.toggle('on',VIEW==='graf');
  if(VIEW==='graf') renderGraf(); else limpaCharts();
  try{localStorage.setItem('efe.view',VIEW)}catch(e){}
  window.scrollTo(0,0);
});
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{OBRA=b.dataset.o;document.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));render();if(VIEW==='graf')renderGraf()});""",
  1)

# 7. init
s = s.replace("\nrender();\n</script>", """
montaFiltros();
render();
try{const v=localStorage.getItem('efe.view'); if(v==='graf') document.querySelector('.abas button[data-v="graf"]').click();}catch(e){}
</script>""", 1)

open('efetivo_v2.html', 'w', encoding='utf-8').write(s)
print('ok', len(s), 'bytes')
