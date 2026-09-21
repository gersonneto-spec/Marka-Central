"""Monta o HTML final: injeta qqp_data.json no template.
Uso: python3 build.py  ->  medicao_ocg.html
Fluxo de atualização: python3 extract_qqp.py "Medição OCG.xlsx" > qqp_data.json && python3 build.py
"""
import json
data = json.load(open("qqp_data.json", encoding="utf-8"))
js = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
tpl = open("ocg_template.html", encoding="utf-8").read()
assert "/*__DATA__*/" in tpl
open("medicao_ocg.html", "w", encoding="utf-8").write(tpl.replace("/*__DATA__*/", js))
print("ok", len(tpl) + len(js), "bytes")
