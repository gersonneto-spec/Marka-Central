# -*- coding: utf-8 -*-
"""Monta o painel de Efetivo: css_base.txt + app_ef.js + views_ef.js + efetivo_data.json."""
import json, sys
# "python3 build_efetivo.py publico" gera a versão sem nome, que é a que vai para o
# repositório público. Sem argumento, gera a versão nominal, de uso interno.
PUB = len(sys.argv) > 1 and sys.argv[1] == "publico"
d = json.load(open("efetivo_data.json", encoding="utf-8"))
d["meta"]["nominal"] = not PUB
if PUB:
    for grupo in ("ativos", "saidas", "afastados"):
        for p in d[grupo]: p.pop("n", None)
js = json.dumps(d, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
css = open("css_base.txt", encoding="utf-8").read()
app = open("app_ef.js", encoding="utf-8").read()
views = open("views_ef.js", encoding="utf-8").read()

EXTRA = """
.abas{background:var(--card);border-bottom:1px solid var(--ln);position:sticky;top:0;z-index:5;overflow-x:auto}
.abas .wrapa{max-width:1240px;margin:0 auto;padding:0 20px;display:flex;gap:4px}
.abas button{border:0;background:transparent;color:var(--mut);font:inherit;font-size:14px;padding:13px 16px;cursor:pointer;white-space:nowrap;border-bottom:3px solid transparent}
.abas button.on{color:var(--azul);font-weight:bold;border-bottom-color:var(--azul)}
.abas button:hover{color:var(--txt)}
.metah{display:flex;gap:30px;flex-wrap:wrap}
.metah div small{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.82}
.metah div b{font-size:19px}
.kpis{grid-template-columns:repeat(auto-fit,minmax(176px,1fr))}
.kpi.clic{cursor:pointer;transition:transform .12s,box-shadow .12s}
.kpi.clic:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(16,24,40,.13)}
.kpi.clic:after{content:"ver nomes";display:block;margin-top:7px;font-size:11px;color:var(--azul);letter-spacing:.04em}
.hb{row-gap:9px}
.hb .clic{cursor:pointer}
.hb .lab.clic:hover,.hb .val.clic:hover{color:var(--azul)}
.hb .trk.clic:hover .fil{filter:brightness(1.12)}
.ch{height:320px;position:relative}
.ch.alto{height:400px}
.ch.mini{height:230px}
.tw{overflow-x:auto}
.tw table{width:100%;border-collapse:collapse;font-size:13.5px}
.tw th{background:var(--azul);color:#fff;text-align:left;padding:9px 12px;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.tw td{padding:8px 12px;border-top:1px solid var(--ln);vertical-align:top}
.tw td small{color:var(--mut);font-size:11.5px}
.tw td.num,.tw th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tw tbody tr:hover{background:var(--alt)}
.av{color:var(--warn);font-weight:bold}
table.hm td.fnm{font-size:12.5px;white-space:nowrap}
table.hm td.hc{text-align:center;font-variant-numeric:tabular-nums;cursor:pointer;border:1px solid var(--card);font-weight:bold;min-width:84px}
table.hm td.hc:hover{outline:2px solid var(--azul);outline-offset:-2px}
.busca{width:100%;padding:11px 14px;border:1px solid var(--ln);border-radius:6px;background:var(--bg);color:var(--txt);font:inherit;font-size:14px}
.busca:focus{outline:2px solid var(--azul);outline-offset:1px}
.fichas{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.ficha{text-align:left;border:1px solid var(--ln);background:var(--bg);border-radius:6px;padding:10px 12px;cursor:pointer;font:inherit;color:var(--txt)}
.ficha:hover{border-color:var(--azul);background:var(--alt)}
.ficha b{display:block;font-size:12.5px;color:var(--azul)}
.ficha span{display:block;font-size:13.5px;margin-top:2px}
.ficha small{display:block;color:var(--mut);font-size:11.5px;margin-top:2px}
.nota{background:var(--card);border-left:4px solid var(--gold);padding:13px 16px;border-radius:0 6px 6px 0;font-size:13.5px;color:var(--mut);margin-top:22px}
section.grid2{margin-top:16px}
.panel.w2{grid-column:1/-1}
#veu{position:fixed;inset:0;background:rgba(10,16,24,.45);opacity:0;pointer-events:none;transition:opacity .18s;z-index:40}
#veu.on{opacity:1;pointer-events:auto}
#drawer{position:fixed;top:0;right:0;bottom:0;width:min(940px,96vw);background:var(--card);box-shadow:-6px 0 28px rgba(10,16,24,.3);transform:translateX(102%);transition:transform .2s;z-index:50;display:flex;flex-direction:column}
#drawer.on{transform:none}
.dtopo{display:flex;align-items:flex-start;gap:14px;padding:18px 22px;border-bottom:1px solid var(--ln)}
.dtopo h3{margin:0;font-size:18px}
.dtopo p{margin:3px 0 0;color:var(--mut);font-size:13px}
.dfecha{margin-left:auto;border:0;background:transparent;color:var(--mut);font-size:30px;line-height:1;cursor:pointer;padding:0 4px}
.dfecha:hover{color:var(--txt)}
.dcorpo{overflow:auto;padding:0 22px 26px}
@media(max-width:860px){.grid2{grid-template-columns:1fr}.ch{height:280px}.ch.alto{height:340px}}
"""

HTML = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{'' if PUB else '<!-- a página traz lista nominal: fora de buscador --><meta name="robots" content="noindex, nofollow, noarchive">'}
<title>Efetivo | TFPM</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>{css}{EXTRA}</style>
</head>
<body>
<header>
  <div class="wrap">
    <div>
      <div class="brand">MARKA<span>ENGENHARIA</span></div>
      <h1>Efetivo &middot; Obras Civis e Trem de Passageiros</h1>
      <div class="sub">Vale S.A. &middot; Terminal Ferroviário da Ponta da Madeira &middot; São Luís, MA</div>
    </div>
    <div class="seg" id="seg"></div>
  </div>
  <div class="wrap" style="padding-top:14px"><div class="metah" id="meta"></div></div>
</header>
<nav class="abas" id="abas"></nav>
<main class="wrap" id="main"></main>
<div class="wrap"><p class="foot">Fonte: planilhas SGC de colaboradores, posição de {d['meta']['data'][8:10]}/{d['meta']['data'][5:7]}/{d['meta']['data'][:4]}.
{'As pessoas aparecem por matrícula: esta central é pública e não carrega nome, CPF nem data de nascimento.' if PUB else 'Documento interno da Marka Engenharia com dados de pessoal: não divulgar fora da equipe de gestão da obra.'}
Marka Engenharia &middot; Coordenação de Obras &middot; <a href="../../">Marka Central</a></p></div>
<div id="veu"></div><aside id="drawer"></aside>
<script>window.EF = {js};</script>
<script>{app}
{views}</script>
</body></html>"""

nome = "efetivo_publico.html" if PUB else "efetivo_v4.html"
open(nome, "w", encoding="utf-8").write(HTML)
print("ok", nome, len(HTML), "bytes")
