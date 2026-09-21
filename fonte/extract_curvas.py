"""Extrai as curvas de producao (SEM38) para JSON.
Uso: python3 extract_curvas.py curvas.xlsx > curvas_data.json
Le o bloco semanal de cada aba: linha de datas + linhas rotuladas na coluna D/E.
"""
import sys, json, re, datetime, warnings; warnings.filterwarnings("ignore")
import openpyxl
from openpyxl.utils import get_column_letter as CL

wb = openpyxl.load_workbook(sys.argv[1], data_only=True)

# (aba, linha de datas, {rotulo_saida: linha}, coluna do rotulo, unidade, titulo, frente)
BLOCOS = [
  ("Escavação de 1a Categoria", 74, {"blA":76,"blAac":77,"blB":78,"blBac":79,"real":80,"realac":81,"tend":82,"tendac":83},
   "m³ x mil", "Escavação de 1ª Categoria", "Terraplanagem"),
  ("Demolição de Laje - TP05", 46, {"blA":47,"blAac":48,"blB":49,"blBac":50,"real":51,"realac":52,"tend":53,"tendac":54},
   "m³", "Demolição de Laje — TP05", "Galeria TP05"),
  ("Supressão", 68, {"blB":70,"blBac":71,"real":72,"realac":73,"tend":74,"tendac":75},
   "m² x mil", "Supressão Vegetal", "Vias Férreas"),
  ("Escavação (1a e 2a categoria)", 56, {"real":58,"realac":59},
   "m³ x mil", "Escavação (1ª e 2ª cat.)", "Terraplanagem"),
  ("Compactação de Aterro", 56, {"real":58,"realac":59},
   "m³ x mil", "Compactação de Aterro", "Terraplanagem"),
]
# blocos com rotulo na coluna E (Prev / Pre Ac / Real / Real Ac)
BLOCOS_E = [
  ("Drenagem (2)", 70, {"blB":71,"blBac":72,"real":73,"realac":74}, "km", "Drenagem — consolidado", "Drenagem"),
  ("Drenagem - Sarjeta", 41, {"blB":42,"blBac":43,"real":44,"realac":45}, "m", "Drenagem — Sarjeta Trapezoidal", "Drenagem"),
  ("Drenagem - Canaleta", 42, {"blB":43,"blBac":44,"real":45,"realac":46}, "m", "Drenagem — Canaleta Ferroviária", "Drenagem"),
  ("Concreto Estrutural", 71, {"real":73,"realac":74}, "m³", "Concreto Estrutural", "Estruturas"),
]

def num(v):
    if isinstance(v, (int, float)): return round(float(v), 6)
    return None

def serie(ws, lin, cols):
    return [num(ws.cell(row=lin, column=c).value) for c in cols]

ativs = []
for aba, ldata, mapa, un, titulo, frente in BLOCOS + BLOCOS_E:
    ws = wb[aba]
    cols, datas = [], []
    for c in range(1, ws.max_column + 1):
        v = ws.cell(row=ldata, column=c).value
        if isinstance(v, datetime.datetime):
            cols.append(c); datas.append(v.date().isoformat())
    if not cols: continue
    d = {"aba": aba, "titulo": titulo, "un": un, "frente": frente, "semanas": datas}
    for k, lin in mapa.items():
        d[k] = serie(ws, lin, cols)
    ativs.append(d)

# KPIs do Dashboard Gerencial (linha 12 da tabela de indicadores)
dg = wb["Dashboard Gerencial"]
def dcell(ref):
    v = dg[ref].value
    if isinstance(v, datetime.datetime): return v.date().isoformat()
    return num(v) if isinstance(v, (int, float)) else (v if v is None else str(v).strip())

kpi = {
  "corte": dcell("C3"), "meta": dcell("C12"), "ultApont": dcell("D12"),
  "prevAc": dcell("E12"), "realAc": dcell("F12"), "pctReal": dcell("H12"),
  "spi": dcell("J12"), "ritmo4": dcell("K12"), "saldo": dcell("L12"),
  "fimBL": dcell("M12"), "semParaConcluir": dcell("Q12"), "fimProj": dcell("R12"),
  "status": dcell("S12"), "atrasoSem": dcell("O8"),
}
proj = {
  "janelaDias": dcell("C37"), "iniJanela": dcell("C38"), "prodJanela": dcell("C39"),
  "diasUteisJanela": dcell("C40"), "produtDia": dcell("C41"), "saldo": dcell("C42"),
  "diasUteisNec": dcell("C43"), "calendario": dcell("C44"),
  "fimProj": dcell("G36"), "diasUteis": dcell("G37"), "semanas": dcell("G38"),
  "fimBL": dcell("G39"), "atrasoSem": dcell("G40"),
}
# calendario de dias uteis (E48:I..)
cal = []
for r in range(48, 120):
    n = dg.cell(row=r, column=5).value
    if not isinstance(n, (int, float)): break
    dd = dg.cell(row=r, column=6).value
    cal.append({"n": int(n), "data": dd.date().isoformat() if isinstance(dd, datetime.datetime) else None,
                "dia": dg.cell(row=r, column=7).value,
                "prod": num(dg.cell(row=r, column=8).value), "acum": num(dg.cell(row=r, column=9).value)})

json.dump({"meta": {"arquivo": sys.argv[1].split("/")[-1], "semana": "SEM 38",
                    "extraido_em": datetime.date.today().isoformat()},
           "kpi": kpi, "proj": proj, "calendario": cal, "atividades": ativs},
          sys.stdout, ensure_ascii=False, separators=(",", ":"))
