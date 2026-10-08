# -*- coding: utf-8 -*-
"""Monta o painel de Efetivo: css_base.txt + app_ef.js + views_ef.js + efetivo_data.json."""
import json
d = json.load(open("efetivo_data.json", encoding="utf-8"))
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
.kpis{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.hb{row-gap:9px}
.ch{height:300px;position:relative}
.tw{overflow-x:auto}
.tw table{width:100%;border-collapse:collapse;font-size:13.5px}
.tw th{background:var(--azul);color:#fff;text-align:left;padding:9px 12px;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.tw td{padding:9px 12px;border-top:1px solid var(--ln)}
.tw td.num,.tw th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tag{display:inline-block;font-size:11px;padding:2px 8px;border-radius:20px;background:var(--azul3);color:var(--azul)}
.tag.w{background:var(--warnbg);color:var(--warn)}
.metah{display:flex;gap:30px;flex-wrap:wrap}
.metah div small{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.82}
.metah div b{font-size:19px}
.nota{background:var(--card);border-left:4px solid var(--gold);padding:13px 16px;border-radius:0 6px 6px 0;font-size:13.5px;color:var(--mut);margin-top:22px}
section.grid2{margin-top:16px}
@media(max-width:860px){.grid2{grid-template-columns:1fr}}
"""

HTML = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
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
Por ser repositório público, o painel não carrega nome, matrícula, CPF nem data de nascimento: a idade sai em faixa e o tempo de casa em anos.
Marka Engenharia &middot; Coordenação de Obras &middot; <a href="../../">Marka Central</a></p></div>
<script>window.EF = {js};</script>
<script>{app}
{views}</script>
</body></html>"""

open("efetivo_v3.html", "w", encoding="utf-8").write(HTML)
print("ok", len(HTML), "bytes")
