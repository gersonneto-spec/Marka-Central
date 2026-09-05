"""Monta o HTML final do painel DRE e Custos: injeta dre_data.json no template.
Fluxo: python3 extract_dre.py "DRE_754.xlsx" "Painel_Custos.xlsx" > dre_data.json && python3 build_dre.py
"""
import json
data = json.load(open("dre_data.json", encoding="utf-8"))
js = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
tpl = open("dre_template.html", encoding="utf-8").read()
assert "/*__DATA__*/" in tpl
open("dre_custos_754.html", "w", encoding="utf-8").write(tpl.replace("/*__DATA__*/", js))
print("ok", len(tpl) + len(js), "bytes")
