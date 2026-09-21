"""Monta o HTML final do painel TP: injeta tp_data.json no template.
Fluxo de atualização: python3 extract_tp.py "Medição Trem de Passageiros.xlsx" > tp_data.json && python3 build_tp.py
"""
import json
data = json.load(open("tp_data.json", encoding="utf-8"))
js = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
tpl = open("tp_template.html", encoding="utf-8").read()
assert "/*__DATA__*/" in tpl
open("medicao_tp.html", "w", encoding="utf-8").write(tpl.replace("/*__DATA__*/", js))
print("ok", len(tpl) + len(js), "bytes")
