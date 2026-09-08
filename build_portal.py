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

<div class="sec-h"><h2>Áreas</h2><span class="sub">três frentes de acompanhamento</span></div>
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
    <span class="tag ativo">1 painel no ar</span>
    <h3>Cronogramas</h3>
    <p class="desc">Evolução física e análises de prazo: apontamento de escavação do Trem de Passageiros, curva de avanço e produtividade por frente. Caminho crítico e look ahead entram com o cronograma da obra.</p>
    <div class="kpis">
      <div><small>Painéis</small><b>1</b></div>
      <div><small>Obra</small><b style="color:var(--ink2);font-size:13px">Trem de Passageiros</b></div>
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
<p class="intro">Análises de prazo e de evolução física das obras. O primeiro painel já está no ar; as demais análises entram nesta mesma página assim que o cronograma da obra for enviado, sem alterar endereços.</p>

<div class="sec-h"><h2>Painéis no ar</h2><span class="sub">1 painel publicado</span></div>
<div class="cards g2">
  <div class="card">
    <span class="tag ativo">no ar</span>
    <h3>Evolução da Escavação · Trem de Passageiros</h3>
    <p class="desc">Apontamento diário de escavação de 07/07 a 05/09/2026, em volume líquido com desconto de 33% de empolamento. Painel gerencial com KPIs, curva de avanço, produtividade por talhão e DMT, mais duas versões da timeline para apresentação.</p>
    <div class="kpis">
      <div><small>Obra</small><b>Trem de Passageiros</b></div>
      <div><small>Período</small><b>07/07 a 05/09</b></div>
      <div><small>Volume</small><b class="ouro">líquido</b></div>
    </div>
    <a class="acao" href="escavacao-trem/">Abrir painel</a>
  </div>
</div>

<div class="sec-h"><h2>Em preparação</h2><span class="sub">a partir do cronograma da obra em .xlsx, .mpp exportado ou PDF</span></div>
<div class="cards">
  <div class="card prep"><h3>Linha de base × tendência</h3><p class="desc">Comparação entre a revisão aprovada e a data projetada de cada atividade, com o desvio em dias e o impacto nos marcos contratuais.</p></div>
  <div class="card prep"><h3>Caminho crítico</h3><p class="desc">Atividades que determinam a data de conclusão, folga de cada frente e as amarrações que travam o avanço.</p></div>
  <div class="card prep"><h3>Curva de avanço</h3><p class="desc">Avanço físico previsto contra realizado por semana e por mês, com a projeção de conclusão no ritmo atual.</p></div>
  <div class="card prep"><h3>Look ahead</h3><p class="desc">Programação das próximas semanas por frente, com pendências de liberação de área, projeto e material.</p></div>
</div>

<div class="sec-h"><h2>Para publicar as análises de prazo</h2></div>
<ol class="passos">
  <li><b>Envie o cronograma</b> da obra, na revisão vigente. Cronograma com linha de base e percentual realizado permite montar as quatro análises acima; sem linha de base, saem apenas as duas primeiras.</li>
  <li><b>Confirme os marcos contratuais</b> que precisam aparecer em destaque, como entrega de frente, liberação de área e datas de medição.</li>
  <li><b>O painel entra nesta mesma página</b> com o mesmo padrão dos painéis de medição, e o link desta seção já pode ser divulgado desde agora.</li>
</ol>
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

# ------------------------------------------------ escavação Trem de Passageiros
esc_corpo = """
<p class="intro">Acompanhamento gerencial da escavação da obra do Trem de Passageiros, montado a partir do apontamento diário de produção. Os três painéis abaixo leem a mesma base: o painel gerencial para leitura de números e duas versões da timeline para apresentação.</p>

<div class="sec-h"><h2>Painéis</h2><span class="sub">abrem em tela cheia, sem instalação</span></div>
<div class="cards">

  <div class="card">
    <span class="tag ativo">no ar</span>
    <h3>Painel gerencial</h3>
    <p class="desc">KPIs de volume, curva de avanço, filtros por material e por destino, produtividade por talhão, calendário de dias úteis e análise de DMT.</p>
    <div class="kpis">
      <div><small>Período</small><b>07/07 a 05/09</b></div>
      <div><small>Empolamento</small><b class="ouro">33%</b></div>
    </div>
    <a class="acao" href="painel-escavacao.html">Abrir painel gerencial</a>
  </div>

  <div class="card">
    <span class="tag ativo">no ar</span>
    <h3>Timeline · versão palco</h3>
    <p class="desc">A evolução do período em 64 segundos, em fundo escuro e uma estatística por momento. Feita para projeção em auditório.</p>
    <div class="kpis">
      <div><small>Duração</small><b>64 s</b></div>
      <div><small>Uso</small><b style="color:var(--ink2);font-size:13px">auditório</b></div>
    </div>
    <a class="acao" href="timeline-palco.html">Abrir versão palco</a>
  </div>

  <div class="card">
    <span class="tag ativo">no ar</span>
    <h3>Timeline · versão clara</h3>
    <p class="desc">A mesma evolução em fundo branco, com as anotações dos marcos do período. Indicada para telão claro e para impressão de quadros.</p>
    <div class="kpis">
      <div><small>Duração</small><b>53 s</b></div>
      <div><small>Uso</small><b style="color:var(--ink2);font-size:13px">telão claro</b></div>
    </div>
    <a class="acao" href="timeline-escavacao.html">Abrir versão clara</a>
  </div>

</div>

<div class="sec-h"><h2>Base de dados</h2><span class="sub">o que alimenta os dois painéis</span></div>
<div class="lista">
  <div class="li"><div class="txt"><b>Apontamento diário de escavação</b><span>Volume por dia, talhão, material e destino, de 07/07/2026 a 05/09/2026.</span></div></div>
  <div class="li"><div class="txt"><b>Volume líquido</b><span>Todo volume exibido já está com o desconto de 33% de empolamento aplicado sobre o volume solto medido em caminhão.</span></div></div>
  <div class="li"><div class="txt"><b>Dias úteis do contrato</b><span>Segunda, terça, quinta, sexta e sábado. O calendário do painel separa dias produtivos de paradas, o que sustenta a produtividade média e a projeção de término.</span></div></div>
</div>

<p class="nota">Para atualizar: envie o apontamento com os dias novos. Os painéis são regerados e substituídos nesta pasta, e o endereço desta página não muda.</p>
"""

PAGS = [
    ("index.html", pagina("Marka Central", "Painéis gerenciais de obra · " + RODAPE_OBRA, portal_corpo, tit_tag="Marka Central")),
    ("medicao/index.html", pagina("Medição", "Boletins de medição por contrato · " + RODAPE_OBRA, medicao_corpo, volta=("../", "← Marka Central"), tit_tag="Medição · Marka Central")),
    ("cronogramas/index.html", pagina("Cronogramas", "Análises de prazo · " + RODAPE_OBRA, cron_corpo, volta=("../", "← Marka Central"), tit_tag="Cronogramas · Marka Central")),
    ("cronogramas/escavacao-trem/index.html", pagina("Evolução da Escavação · Trem de Passageiros", "Apontamento de produção · 07/07 a 05/09/2026 · volume líquido com desconto de 33% de empolamento", esc_corpo, volta=("../", "← Cronogramas"), tit_tag="Evolução da Escavação · Marka Central")),
    ("dre/index.html", pagina("DRE e Custos", "Resultado dos contratos · " + RODAPE_OBRA, dre_corpo, volta=("../", "← Marka Central"), tit_tag="DRE e Custos · Marka Central")),
]

for caminho, html in PAGS:
    os.makedirs(os.path.dirname(caminho), exist_ok=True) if os.path.dirname(caminho) else None
    open(caminho, "w", encoding="utf-8").write(html)
    print("gerado", caminho, len(html), "bytes")
