"""Extrai o cronograma SEM38 (PDF nativo) para JSON.
Uso: python3 extract_crono.py cronograma.pdf > crono_data.json
"""
import sys, json, re, warnings; warnings.filterwarnings("ignore")
import pdfplumber

COLS = [("id",30,50),("id2",50,70),("nome",90,451),("dur",451,515),
        ("prev",515,565),("conc",565,640),("real",640,700),
        ("iniBL",700,770),("fimBL",770,835),("ini",835,905),("fim",905,975)]

def bucket(x):
    for k,a,b in COLS:
        if a <= x < b: return k
    return None

pdf = pdfplumber.open(sys.argv[1])
linhas = []
for pg in pdf.pages:
    ws = pg.extract_words(use_text_flow=False, keep_blank_chars=False)
    ws = [w for w in ws if bucket(w["x0"])]
    ws.sort(key=lambda w: (w["top"], w["x0"]))
    rows = {}
    cur, base = None, None
    for w in ws:
        c = (w["top"] + w["bottom"]) / 2
        if base is None or abs(c - base) > 5:
            base = c; cur = []; rows[round(base, 1)] = cur
        cur.append(w)
    for k in sorted(rows):
        cel = {}
        xs = {}
        for w in sorted(rows[k], key=lambda w: w["x0"]):
            c = bucket(w["x0"])
            if not c: continue
            cel.setdefault(c, []).append(w["text"])
            xs.setdefault(c, w["x0"])
        nome = " ".join(cel.get("nome", []))
        if "id" not in cel or not re.fullmatch(r"\d+", cel["id"][0]):
            # continuacao do nome da tarefa anterior (quebra de linha no PDF)
            if nome and linhas and len(cel) == 1 and "nome" in cel:
                linhas[-1]["nome"] += " " + nome
            continue
        if not nome: continue
        linhas.append({"_id": int(cel["id"][0]), "_x": xs.get("nome", 95), "_top": k,
                       "nome": nome, "dur": " ".join(cel.get("dur", [])),
                       "prev": " ".join(cel.get("prev", [])), "conc": " ".join(cel.get("conc", [])),
                       "real": " ".join(cel.get("real", [])), "iniBL": " ".join(cel.get("iniBL", [])),
                       "fimBL": " ".join(cel.get("fimBL", [])), "ini": " ".join(cel.get("ini", [])),
                       "fim": " ".join(cel.get("fim", []))})

# junta continuacoes: linhas sem id valido ja foram descartadas; textos quebrados vem com mesmo id? nao.
# ordena por id e funde duplicatas de id (quebra de linha do nome)
por = {}
for L in linhas:
    i = L["_id"]
    if i in por:
        if not L["dur"] and not L["prev"]:
            por[i]["nome"] += " " + L["nome"]
        continue
    por[i] = L

def pct(s):
    s = s.replace("%","").replace(",",".").strip()
    try: return float(s)/100
    except: return None
def dt(s):
    m = re.fullmatch(r"(\d{2})/(\d{2})/(\d{2})", s.strip())
    return f"20{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None
def dur(s):
    m = re.match(r"([\d,\.]+)", s.strip().replace(".",""))
    return float(m.group(1).replace(",",".")) if m else None

out = []
for i in sorted(por):
    L = por[i]
    nome = re.sub(r"\s+", " ", L["nome"]).strip()
    nome = re.sub(r"(?:\s+\d{2}/\d{2})+$", "", nome).strip()
    m = re.match(r"^((?:\d+\.)*\d+)\s+(.*)$", nome)
    eap, titulo = (m.group(1), m.group(2)) if m else ("", nome)
    out.append({"id": i, "eap": eap, "nivel": eap.count(".")+1 if eap else 1,
                "nome": titulo, "dur": dur(L["dur"]),
                "prev": pct(L["prev"]), "conc": pct(L["conc"]), "real": pct(L["real"]),
                "iniBL": dt(L["iniBL"]), "fimBL": dt(L["fimBL"]),
                "ini": dt(L["ini"]), "fim": dt(L["fim"])})
json.dump({"meta":{"arquivo":sys.argv[1],"linhas":len(out)},"tarefas":out},
          sys.stdout, ensure_ascii=False, separators=(",",":"))
