# -*- coding: utf-8 -*-
"""Gera as páginas do portal Marka-Central (index, seções e páginas em preparação).
Uso: python3 build_portal.py
"""
import json, datetime, os

HOJE = datetime.date.today().strftime("%d/%m/%Y")

CSS = """
:root{color-scheme:light;
 --azul:#3871C1;--azul-esc:#2B5A9B;--azul-claro:#8FB2DE;--azul-tint:#E8F0FA;--azul-tint2:#D3E1F3;
 --cinza:#656263;--ouro:#C9A84C;--ouro-tint:#F7F1DF;
 --bg:#FFFFFF;--bg2:#F4F6F9;--bg3:#EBEFF5;--linha:#D0D7E3;--linha2:#E4E9F0;
 --ink:#1F2933;--ink2:#656263;--ink3:#8A8F98;
 --ok:#2E7D32;--warn:#B25E00;--crit:#C62828;
 --sombra:0 1px 2px rgba(31,41,51,.06),0 4px 14px rgba(31,41,51,.06);}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;
 --azul:#5B93D9;--azul-esc:#3871C1;--azul-claro:#7FA6D6;--azul-tint:#1C2A3D;--azul-tint2:#25385A;
 --cinza:#B4B7BC;--ouro:#D6B75F;--ouro-tint:#2E2A1C;
 --bg:#15181D;--bg2:#1C2026;--bg3:#242930;--linha:#353B45;--linha2:#2A3038;
 --ink:#EEF1F5;--ink2:#B4B7BC;--ink3:#848A94;
 --ok:#66BB6A;--warn:#F5A623;--crit:#EF5350;--sombra:0 1px 2px rgba(0,0,0,.4);}}
:root[data-theme="dark"]{color-scheme:dark;
 --azul:#5B93D9;--azul-esc:#3871C1;--azul-claro:#7FA6D6;--azul-tint:#1C2A3D;--azul-tint2:#25385A;
 --cinza:#B4B7BC;--ouro:#D6B75F;--ouro-tint:#2E2A1C;
 --bg:#15181D;--bg2:#1C2026;--bg3:#242930;--linha:#353B45;--linha2:#2A3038;
 --ink:#EEF1F5;--ink2:#B4B7BC;--ink3:#848A94;
 --ok:#66BB6A;--warn:#F5A623;--crit:#EF5350;--sombra:0 1px 2px rgba(0,0,0,.4);}
*{box-sizing:border-box}html,body{margin:0;padding:0}
body{background:var(--bg2);color:var(--ink);font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;font-variant-numeric:tabular-nums}
a{color:var(--azul);text-decoration:none}a:hover{text-decoration:underline}
h1,h2,h3{margin:0;text-wrap:balance}
.topo{background:#3871C1;color:#fff;padding:16px 28px;display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.marca{display:flex;flex-direction:column;line-height:1;padding-right:22px;border-right:1px solid rgba(255,255,255,.35)}
.marca b{font-size:26px;letter-spacing:.12em;font-weight:900}
.marca span{font-size:9px;letter-spacing:.34em;margin-top:5px;opacity:.9}
.titulo h1{font-size:20px;font-weight:700}
.titulo p{margin:3px 0 0;font-size:12.5px;opacity:.92}
.topo .volta{margin-left:auto;font-size:12.5px;color:#fff;border:1px solid rgba(255,255,255,.5);padding:6px 12px;border-radius:4px}
.topo .volta:hover{background:rgba(255,255,255,.12);text-decoration:none}
main{max-width:1180px;margin:0 auto;padding:26px 24px 56px}
.intro{font-size:14.5px;color:var(--ink2);max-width:70ch;margin-bottom:24px}
.sec-h{display:flex;align-items:baseline;gap:12px;margin:30px 0 12px}
.sec-h h2{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--azul);font-weight:700}
.sec-h .sub{font-size:12.5px;color:var(--ink3)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
.cards.g2{grid-template-columns:repeat(auto-fit,minmax(430px,1fr))}
.card{background:var(--bg);border:1px solid var(--linha);border-top:4px solid var(--azul);border-radius:6px;padding:18px 20px 20px;box-shadow:var(--sombra);display:flex;flex-direction:column;gap:10px}
.card.prep{border-top-color:var(--linha)}
.card h3{font-size:16px;color:var(--ink)}
.card .desc{font-size:13px;color:var(--ink2);flex:1}
.card .kpis{display:flex;gap:18px;flex-wrap:wrap;padding-top:4px;border-top:1px solid var(--linha2)}
.kpis div{display:flex;flex-direction:column;gap:2px}
.kpis small{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3);line-height:1.3}
.kpis b{font-size:15px;color:var(--azul);line-height:1.2}
.kpis b.ouro{color:var(--ouro)}
.acao{display:inline-block;background:var(--azul);color:#fff;padding:8px 14px;border-radius:4px;font-size:13px;font-weight:700;align-self:flex-start}
.acao:hover{background:var(--azul-esc);text-decoration:none}
.acao.sec{background:transparent;color:var(--azul);border:1px solid var(--azul)}
.tag{display:inline-block;padding:3px 9px;border-radius:3px;font-size:10.5px;font-weight:700;letter-spacing:.06em}
.tag.ativo{background:var(--azul-tint);color:var(--azul-esc)}
.tag.prep{background:var(--bg3);color:var(--ink2)}
.lista{background:var(--bg);border:1px solid var(--linha);border-radius:6px;padding:4px 0;box-shadow:var(--sombra)}
.lista .li{display:flex;gap:14px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--linha2);flex-wrap:wrap}
.lista .li:last-child{border-bottom:0}
.lista .li .txt{flex:1;min-width:240px}
.lista .li .txt b{display:block;font-size:14.5px}
.lista .li .txt span{font-size:12.5px;color:var(--ink2)}
.passos{counter-reset:p;padding:0;margin:0;list-style:none}
.passos li{counter-increment:p;position:relative;padding:0 0 14px 34px;font-size:13.5px;color:var(--ink2)}
.passos li::before{content:counter(p);position:absolute;left:0;top:0;width:22px;height:22px;border-radius:50%;background:var(--azul-tint);color:var(--azul-esc);font-weight:700;font-size:11.5px;display:flex;align-items:center;justify-content:center}
.passos li b{color:var(--ink)}
.nota{font-size:12.5px;color:var(--ink3);margin-top:14px}
code{background:var(--bg3);padding:2px 6px;border-radius:3px;font-size:12.5px}
.rodape{max-width:1180px;margin:0 auto;padding:14px 24px 40px;border-top:2px solid var(--azul);font-size:12px;color:var(--ink3);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
@media (max-width:700px){.topo{padding:14px 16px}main{padding:18px 14px 40px}}
"""

def pagina(titulo, subtitulo, corpo, volta=None, tit_tag="Marka Central"):
    v = f'<a class="volta" href="{volta[0]}">{volta[1]}</a>' if volta else ""
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{tit_tag}</title>
<style>{CSS}</style>
</head>
<body>
<header class="topo">
  <div class="marca"><b>MARKA</b><span>ENGENHARIA</span></div>
  <div class="titulo"><h1>{titulo}</h1><p>{subtitulo}</p></div>
  {v}
</header>
<main>
{corpo}
</main>
<footer class="rodape"><span>Marka Engenharia Ltda · Coordenação de Obras · TFPM · São Luís, MA</span><span>Atualizado em {HOJE}</span></footer>
</body>
</html>"""

RODAPE_OBRA = "Vale S.A. · Terminal Ferroviário da Ponta da Madeira · São Luís, MA"

# ---------------------------------------------------------------- portal
portal_corpo = """
<p class="intro">Central de painéis gerenciais das obras da Marka Engenharia no TFPM. Cada área reúne os painéis interativos gerados a partir das planilhas de controle, atualizados a cada boletim de medição.</p>

<div class="sec-h"><h2>Áreas</h2><span class="sub">quatro frentes de acompanhamento</span></div>
<div class="cards">

  <div class="card">
    <span class="tag ativo">2 painéis no ar</span>
    <h3>Medição</h3>
    <p class="desc">Boletins de medição por contrato: quadro de quantidades e preços, avanço financeiro, saldo, alertas de estouro e projeção de esgotamento.</p>
    <div class="kpis">
      <div><small>Contratos</small><b>2</b></div>
      <div><small>Valor somado</small><b>R$ 126,2 mi</b></div>
      <div><small>Medido</small><b class="ouro">R$ 48,6 mi</b></div>
    </div>
    <a class="acao" href="medicao/">Abrir Medição</a>
  </div>

  <div class="card">
    <span class="tag ativo">2 painéis no ar</span>
    <h3>Cronogramas</h3>
    <p class="desc">Prazo e produção: guia da semana com look ahead e marcos contratuais, curvas de produção por frente, aderência à linha de base e projeção de término.</p>
    <div class="kpis">
      <div><small>Semana</small><b>SEM 38</b></div>
      <div><small>Avanço físico</small><b>17,3%</b></div>
      <div><small>IDP</small><b class="ouro">0,896</b></div>
    </div>
    <a class="acao" href="cronogramas/">Abrir Cronogramas</a>
  </div>

  <div class="card">
    <span class="tag ativo">1 painel no ar</span>
    <h3>DRE e Custos</h3>
    <p class="desc">Resultado por contrato: receita contra custo incorrido mês a mês, margem, custo por natureza, conta a conta e detalhe de material por fornecedor.</p>
    <div class="kpis">
      <div><small>Contratos</small><b>1</b></div>
      <div><small>Custo acum.</small><b>R$ 29,4 mi</b></div>
      <div><small>Margem</small><b class="ouro">10,9%</b></div>
    </div>
    <a class="acao" href="dre/">Abrir DRE e Custos</a>
  </div>

  <div class="card">
    <span class="tag ativo">1 painel no ar</span>
    <h3>Efetivo</h3>
    <p class="desc">Efetivo x salário por função nas duas obras: folha mensal contratual, peso da mão de obra indireta, escala salarial por família e concentração da folha.</p>
    <div class="kpis">
      <div><small>Efetivo</small><b>273</b></div>
      <div><small>Folha mensal</small><b>R$ 823.886</b></div>
      <div><small>MOI na folha</small><b class="ouro">40,7%</b></div>
    </div>
    <a class="acao" href="efetivo/">Abrir Efetivo</a>
  </div>

</div>

<div class="sec-h"><h2>Como atualizar</h2><span class="sub">o mesmo caminho para qualquer painel</span></div>
<ol class="passos">
  <li><b>Envie a planilha atualizada.</b> A base de cada painel continua sendo a planilha de controle da obra, sem mudança no seu fluxo de trabalho.</li>
  <li><b>O painel é regerado.</b> Os scripts de extração leem as abas e recalculam tudo pelas mesmas fórmulas da planilha.</li>
  <li><b>O arquivo entra nesta central.</b> O endereço do painel não muda, então o link que você já divulgou continua valendo.</li>
</ol>
"""

# ---------------------------------------------------------------- medição
medicao_corpo = """
<p class="intro">Painéis de boletim de medição por contrato. Cada painel lê a aba QQP da planilha da obra como base mestre e reproduz as demais abas de análise em formato interativo, com filtros, ordenação e histórico por boletim.</p>

<div class="sec-h"><h2>Painéis publicados</h2></div>
<div class="lista">

  <div class="li">
    <div class="txt">
      <b>Medição OCG · Obras Civis Gerais</b>
      <span>Contrato RT-2180KF-G-17251 · Obra 754 · 644 itens · BM01 a BM16</span>
    </div>
    <div class="kpis" style="border:0;gap:22px">
      <div><small>Contrato</small><b>R$ 88.714.693</b></div>
      <div><small>Medido</small><b class="ouro">50,2%</b></div>
    </div>
    <a class="acao" href="ocg/">Abrir painel</a>
  </div>

  <div class="li">
    <div class="txt">
      <b>Medição TP · Oficina de Carros de Passageiros</b>
      <span>PQ-2180KF-G-10017 · L9057 · 346 itens · 1ª a 3ª medição</span>
    </div>
    <div class="kpis" style="border:0;gap:22px">
      <div><small>Contrato</small><b>R$ 37.476.724</b></div>
      <div><small>Medido</small><b class="ouro">10,9%</b></div>
    </div>
    <a class="acao" href="trem/">Abrir painel</a>
  </div>

</div>

<div class="sec-h"><h2>O que cada painel traz</h2></div>
<div class="cards g2">
  <div class="card"><h3>Base contratual</h3><p class="desc">QQP completa com busca, filtros por frente, contrato, empresa, classe ABC e situação, agrupamento hierárquico e histórico de medição item a item.</p></div>
  <div class="card"><h3>Acompanhamento</h3><p class="desc">Avanço financeiro por boletim, comparativo previsto contra medido por frente e por empresa, relatório fechado de cada boletim.</p></div>
  <div class="card"><h3>Alertas</h3><p class="desc">Itens estourados acima do contratado, itens parados com saldo preso, itens não iniciados e curva ABC de concentração do valor medido.</p></div>
  <div class="card"><h3>Projeção</h3><p class="desc">Estudo de esgotamento de saldo por item, com ritmo ajustável e cálculo do aditivo necessário para manter o ritmo até o fim do contrato.</p></div>
</div>

<p class="nota">Os scripts de extração e o modelo de cada painel ficam nas pastas <code>ocg/</code> e <code>trem/</code> deste repositório, junto com o passo a passo de atualização.</p>
"""

# ---------------------------------------------------- cronogramas (preparação)
cron_corpo = """
<p class="intro">Prazo e produção da Oficina de Carros de Passageiros. Os painéis leem o cronograma semanal emitido pelo planejamento e a planilha de curvas de produção, e são refeitos a cada semana sem mudar o endereço desta página.</p>

<div class="sec-h"><h2>Painéis publicados</h2></div>
<div class="lista">

  <div class="li">
    <div class="txt">
      <b>Guia da Semana &middot; SEM 38</b>
      <span>Cronograma Rev. 00 / LB_rev1 &middot; 460 linhas &middot; 317 atividades executáveis &middot; 17 marcos contratuais &middot; datas de referência pela linha de base</span>
    </div>
    <div class="kpis" style="border:0;gap:22px">
      <div><small>Atrasadas (LB)</small><b>8</b></div>
      <div><small>Tendência</small><b class="ouro">09/08/2027</b></div>
    </div>
    <a class="acao" href="semana/">Abrir painel</a>
  </div>

  <div class="li">
    <div class="txt">
      <b>Curvas de Produção &middot; SEM 38</b>
      <span>9 frentes acompanhadas por curva S &middot; corte em 18/09/2026</span>
    </div>
    <div class="kpis" style="border:0;gap:22px">
      <div><small>Escavação 1ª cat.</small><b>58,8%</b></div>
      <div><small>Término proj.</small><b class="ouro">21/10/2026</b></div>
    </div>
    <a class="acao" href="curvas/">Abrir painel</a>
  </div>

</div>

<div class="sec-h"><h2>O que cada painel traz</h2></div>
<div class="cards g2">
  <div class="card"><h3>Minha Semana</h3><p class="desc">O que está atrasado, o que encerra e o que começa nos próximos sete dias, tudo pela data de linha de base e separado por frente, com a data replanejada e o desvio em dias ao lado.</p></div>
  <div class="card"><h3>Look ahead de 4 semanas</h3><p class="desc">Carga semana a semana e carga por frente, separando atrasadas, o que já está em curso e o que entra novo, para diligenciar material e mobilizar equipe com antecedência.</p></div>
  <div class="card"><h3>Análise gerencial</h3><p class="desc">O que está atrasado contra a linha de base, a evolução até a data de corte e a tendência de término em dois cenários, com a memória de cálculo aberta.</p></div>
  <div class="card"><h3>Marcos contratuais</h3><p class="desc">Os 17 marcos do ramo 1.1 em gráfico de dias restantes até a data de linha de base, com o deslocamento que o cronograma já tomou empilhado ao lado.</p></div>
  <div class="card"><h3>Curva S por frente</h3><p class="desc">Previsto BL0, previsto BL1, realizado e tendência em cada frente medida por volume, com produção semanal e desvio acumulado.</p></div>
  <div class="card"><h3>Projeção de término</h3><p class="desc">Projeção da escavação de 1ª categoria pela produtividade por dia útil dos últimos 15 dias, no calendário real da obra, dia útil a dia útil.</p></div>
  <div class="card"><h3>Comparativo</h3><p class="desc">Todas as frentes na mesma escala: quanto falta de cada uma e qual é a aderência de cada uma ao baseline, lado a lado.</p></div>
</div>

<p class="nota"><b>Regra de leitura:</b> no Guia da Semana toda data de referência é da linha de base (LB_rev1), não da data replanejada. Cobrar pela data atual esconde o atraso, porque a data atual já foi movida. Fontes: <code>Trem de Passageiro - SEM38 - Cronograma.pdf</code> e <code>Trem de Passageiro - SEM 38 - Curvas de Produção.xlsx</code>. Para atualizar, basta enviar a revisão da semana seguinte: os scripts de extração leem as mesmas colunas e abas.</p>
"""

# ------------------------------------------------------ DRE (preparação)
dre_corpo = """
<p class="intro">Resultado e custo por contrato, a partir do fechamento contábil por competência e do analítico de apropriações do SIENGE. Cada painel cruza receita, custo por natureza e detalhe de fornecedor no mesmo lugar.</p>

<div class="sec-h"><h2>Painéis publicados</h2></div>
<div class="lista">
  <div class="li">
    <div class="txt">
      <b>DRE e Custos · Obra 754</b>
      <span>Obras Civis Gerais · RT-2180KF-G-17251 · mar/25 a jul/26 · 58 contas contábeis</span>
    </div>
    <div class="kpis" style="border:0;gap:22px">
      <div><small>Receita</small><b>R$ 34.561.049</b></div>
      <div><small>Custo</small><b>R$ 29.374.986</b></div>
      <div><small>Margem</small><b class="ouro">10,9%</b></div>
    </div>
    <a class="acao" href="754/">Abrir painel</a>
  </div>
</div>

<div class="sec-h"><h2>O que o painel traz</h2></div>
<div class="cards g2">
  <div class="card"><h3>Resultado</h3><p class="desc">Receita bruta e líquida contra custo total mês a mês, lucro por mês, margem acumulada e comparação com o valor já medido no contrato.</p></div>
  <div class="card"><h3>Custo por natureza</h3><p class="desc">Custo em obra, pessoal, veículos e máquinas, gastos gerais e administração, com a participação de cada grupo no custo de cada mês.</p></div>
  <div class="card"><h3>Conta a conta</h3><p class="desc">As 58 contas contábeis do contrato mês a mês, com busca, filtro por grupo e a concentração das contas que formam 80% do custo.</p></div>
  <div class="card"><h3>Relatório do mês</h3><p class="desc">DRE fechado de qualquer competência, com AV%, comparação contra o mês anterior e contra a média dos três meses anteriores, conta a conta.</p></div>
  <div class="card"><h3>Material e fornecedores</h3><p class="desc">Detalhe do material por fornecedor e por categoria, com lançamentos por mês, fornecedores novos e concentração dos cinco maiores.</p></div>
  <div class="card"><h3>Conciliação de fontes</h3><p class="desc">DRE contábil contra o painel de apropriações, mês a mês, apontando onde as duas bases divergem e qual grupo de custo explica a diferença.</p></div>
</div>

<div class="sec-h"><h2>Ainda não coberto</h2><span class="sub">o que falta para fechar a área</span></div>
<ol class="passos">
  <li><b>Margem por frente de obra.</b> O DRE fecha por contrato; para abrir o resultado por frente é preciso a apropriação de custo por centro de custo ou por frente, além do critério de rateio da administração local.</li>
  <li><b>Realizado contra orçado.</b> Falta a composição de custo unitário orçada para comparar com o custo praticado item a item.</li>
  <li><b>Obra do Trem de Passageiros.</b> A área cobre hoje só a Obra 754; o mesmo painel pode ser gerado para o contrato PQ-2180KF-G-10017 quando a base de custos dessa obra for enviada.</li>
</ol>

<p class="nota">Confidencialidade: esta central está publicada em repositório público, e custo e margem são dados mais sensíveis que medição. Se o acesso precisar ser restrito, esta área pode ser movida para repositório privado sem alterar as demais.</p>
"""

efetivo_corpo = """
<p class="intro">Efetivo e folha contratual das duas obras do TFPM, por função. A base é a Listagem de Talentos do Fortes; o painel trabalha por função, família e nível, sem dados nominais.</p>

<div class="sec-h"><h2>Painel publicado</h2></div>
<div class="lista">
  <div class="li">
    <div class="txt">
      <b>Efetivo x Salário por Função</b>
      <span>Obras Civis e Oficina de Trens de Passageiros &middot; 273 colaboradores &middot; base Fortes de 03/09/2026</span>
    </div>
    <div class="kpis" style="border:0;gap:22px">
      <div><small>Folha mensal</small><b>R$ 823.886</b></div>
      <div><small>MOI na folha</small><b class="ouro">40,7%</b></div>
    </div>
    <a class="acao" href="painel/">Abrir painel</a>
  </div>
</div>

<div class="sec-h"><h2>O que o painel traz</h2></div>
<div class="cards g2">
  <div class="card"><h3>Concentração da folha</h3><p class="desc">Pareto das funções de maior folha mensal e o acumulado sobre o total, que mostra em quantas funções o controle de custo de mão de obra realmente se resolve.</p></div>
  <div class="card"><h3>Direta x indireta</h3><p class="desc">Peso da MOI no efetivo e na folha, por obra, e quantas vezes cada pessoa de MOI custa em relação a uma de MOD.</p></div>
  <div class="card"><h3>Escala por família</h3><p class="desc">Níveis de cada função lado a lado, com o salto percentual entre níveis e destaque para inversões, em que o nível superior paga menos que o inferior.</p></div>
  <div class="card"><h3>Faixas e tempo de casa</h3><p class="desc">Distribuição do efetivo por faixa salarial e por tempo de casa, que é o indicador de curva de aprendizado e de risco de integração de SSMA.</p></div>
</div>

<div class="sec-h"><h2>Base e limites</h2></div>
<ol class="passos">
  <li><b>Folha é salário contratual do Fortes.</b> Não inclui encargos, periculosidade, horas extras, adicionais nem benefícios. Para custo real de mão de obra, a fonte é o DRE.</li>
  <li><b>Aprendizes entram por conversão.</b> Vêm com salário por hora e são convertidos por 150 h/mês; confirmar a premissa com o DP antes de usar em orçamento.</li>
  <li><b>Sem dados nominais.</b> Nome, matrícula e data de admissão individual ficam apenas na planilha de trabalho. Esta central é pública e não carrega esses campos.</li>
</ol>

<p class="nota">Fonte: <code>Efetivo_Salario_x_Funcao_Consolidado_TFPM.xlsx</code>, gerado da Listagem de Talentos do Fortes emitida em 03/09/2026.</p>
"""

PAGS = [
    ("index.html", pagina("Marka Central", "Painéis gerenciais de obra · " + RODAPE_OBRA, portal_corpo, tit_tag="Marka Central")),
    ("medicao/index.html", pagina("Medição", "Boletins de medição por contrato · " + RODAPE_OBRA, medicao_corpo, volta=("../", "← Marka Central"), tit_tag="Medição · Marka Central")),
    ("cronogramas/index.html", pagina("Cronogramas", "Análises de prazo · " + RODAPE_OBRA, cron_corpo, volta=("../", "← Marka Central"), tit_tag="Cronogramas · Marka Central")),
    ("dre/index.html", pagina("DRE e Custos", "Resultado dos contratos · " + RODAPE_OBRA, dre_corpo, volta=("../", "← Marka Central"), tit_tag="DRE e Custos · Marka Central")),
    ("efetivo/index.html", pagina("Efetivo", "Efetivo e folha por função · " + RODAPE_OBRA, efetivo_corpo, volta=("../", "← Marka Central"), tit_tag="Efetivo · Marka Central")),
]

for caminho, html in PAGS:
    os.makedirs(os.path.dirname(caminho), exist_ok=True) if os.path.dirname(caminho) else None
    open(caminho, "w", encoding="utf-8").write(html)
    print("gerado", caminho, len(html), "bytes")
