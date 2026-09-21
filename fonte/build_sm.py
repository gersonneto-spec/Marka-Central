import json
data = json.load(open("crono_data.json", encoding="utf-8"))
js = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
tpl = open("sm_template.html", encoding="utf-8").read()
assert "/*__DATA__*/" in tpl
open("semana_sem38.html", "w", encoding="utf-8").write(tpl.replace("/*__DATA__*/", js))
print("ok", len(tpl) + len(js), "bytes")
