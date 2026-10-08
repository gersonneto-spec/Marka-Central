# -*- coding: utf-8 -*-
"""Extrai as duas planilhas SGC de efetivo (Obras Civis e Trem de Passageiros) para JSON.

Uso: python3 extract_efetivo.py OBRAS_CIVIS.xlsx TREM_PASSAGEIROS.xlsx > efetivo_data.json

CONFIDENCIALIDADE: o Marka-Central é repositório público. Nome, matrícula, CPF e data de
nascimento NUNCA entram no JSON. Idade sai em faixa, tempo de casa em anos arredondados.
O salário não vem nestas planilhas: entra pela tabela por função (sal_funcao.json).
"""
import sys, json, re, unicodedata, datetime as dt, warnings
warnings.filterwarnings("ignore")
import openpyxl

HOJE = dt.date(2026, 10, 7)          # data de atualização das planilhas
ARQ = {"OC": sys.argv[1], "TP": sys.argv[2]}

def txt(v): return "" if v is None else str(v).replace("\xa0", " ").strip()
def dat(v):
    if isinstance(v, dt.datetime): return v.date()
    if isinstance(v, dt.date): return v
    return None
def ym(d): return d.strftime("%Y-%m") if d else None

def nf(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().upper()
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9 .]", " ", s)).strip()

ABR = {"TEC.": "TECNICO", "TEC": "TECNICO", "ENC.": "ENCARREGADO", "ENC": "ENCARREGADO",
       "OP.": "OPERADOR", "OP": "OPERADOR", "AUX.": "AUXILIAR", "AUX": "AUXILIAR",
       "SEG.": "SEGURANCA", "EM": "DE", "EQUIP.": "EQUIPAMENTOS", "MUNK": "MUNCK",
       "ADMINSTRATIVO": "ADMINISTRATIVO", "SUPERVISORA": "SUPERVISOR", "CAMIHAO": "CAMINHAO"}
ROM = r"\s+(I{1,3}|IV|V|VI{0,3}|IX|X)$"
SIN = [("MOTORISTA CAMINHAO MUNCK", "OPERADOR DE CAMINHAO MUNCK"),
       ("OPERADOR CAMINHAO MUNCK", "OPERADOR DE CAMINHAO MUNCK"),
       ("SINALEIRO RIGGER", "SINALEIRO DE RIGGER"),
       ("APRENDIZ DE TECNICO DE SEGURANCA DO TRABALHO", "APRENDIZ TECNICO SEG DO TRABALHO"),
       ("APRENDIZ TECNICO DE SEGURANCA DO TRABALHO", "APRENDIZ TECNICO SEG DO TRABALHO"),
       ("MOTORISTA DE CAMINHAO", "MOTORISTA CAMINHAO"),
       ("TECNICO MEDICAO", "TECNICO DE MEDICAO"),
       ("SUPERVISOR DE MEDICAO", "SUPERVISOR A DE MEDICAO")]

def funcao(cargo):
    """Nome de função comparável entre as revisões da planilha: sem acento, sem nível
    romano, abreviação expandida. A planilha de 07/10 largou o nível (ENCANADOR I virou
    ENCANADOR), então sem isso nada casa com a tabela salarial."""
    s = nf(cargo).replace("(A)", " ").replace("(", " ").replace(")", " ")
    s = " ".join(ABR.get(p, p) for p in s.split())
    while re.search(ROM, s): s = re.sub(ROM, "", s).strip()
    s = re.sub(r"\s+", " ", s).strip()
    for a, b in SIN: s = s.replace(a, b)
    return s

def faixa(idade):
    if idade is None: return None
    for lim, rot in ((25, "até 24"), (35, "25 a 34"), (45, "35 a 44"), (55, "45 a 54")):
        if idade < lim: return rot
    return "55 ou mais"

def sexo(v):
    s = nf(v)
    if s.startswith("F"): return "F"
    if s.startswith("M"): return "M"          # pega "Mascuino", erro de digitação na origem
    return None

def cabecalho(w, lin=4):
    return {txt(w.cell(row=lin, column=c).value): c
            for c in range(1, w.max_column + 1) if txt(w.cell(row=lin, column=c).value)}

ativos, saidas, afast = [], [], []
vistos = set()

for obra, arq in ARQ.items():
    wb = openpyxl.load_workbook(arq, data_only=True)

    for aba, apr in (("Colaboradores", False), ("Aprendizes", True)):
        if aba not in wb.sheetnames: continue
        w = wb[aba]; H = cabecalho(w)
        for r in range(5, w.max_row + 1):
            g = lambda k: w.cell(row=r, column=H[k]).value if k in H else None
            mat = txt(g("Matrícula"))
            if not mat: continue
            # a mesma matrícula aparece nas duas planilhas quando a pessoa é compartilhada
            if (mat, obra) in vistos: continue
            vistos.add((mat, obra))
            adm, mob = dat(g("Data de Admissão")), dat(g("Data de mobilização"))
            blo, nas = dat(g("Data de bloqueio do crachá/acesso (Específica)")), dat(g("Data de nascimento"))
            cargo = txt(g("Cargo")) or txt(g("Função"))
            ativos.append({
                "o": obra, "c": cargo, "fn": funcao(cargo),
                "m": txt(g("MOD/MOI")) or txt(g("MOI/MOD")),
                "loc": txt(g("Local Atual")), "st": txt(g("Status do colaborador")),
                "adm": ym(adm), "mob": ym(mob),
                "dmob": (mob - adm).days if adm and mob else None,
                "tc": round((HOJE - adm).days / 365.25, 1) if adm else None,
                "fx": faixa((HOJE - nas).days // 365 if nas else None),
                "sx": sexo(txt(g("Sexo"))),
                "blo": (blo - HOJE).days if blo else None,
                "cp": txt(g("Compartilhamento")), "apr": apr,
                "frente": txt(g("Frente de Serviço")) if apr else "",
            })

    if "Demissionais_Desmob" in wb.sheetnames:
        w = wb["Demissionais_Desmob"]; H = cabecalho(w)
        for r in range(5, w.max_row + 1):
            g = lambda k: w.cell(row=r, column=H[k]).value if k in H else None
            mat = txt(g("Matrícula"))
            if not mat: continue
            if ("D", mat) in vistos: continue      # o mesmo desligamento consta nas duas planilhas
            vistos.add(("D", mat))
            adm, dem, nas = dat(g("Data de Admissão")), dat(g("Data Demissão")), dat(g("Data de nascimento"))
            cargo = txt(g("Função")) or txt(g("Cargo")) or "não informado"
            # algumas linhas vêm com as colunas deslocadas e trazem CPF no campo Motivo.
            # CPF é dado identificável e o repositório é público: só entra texto com letra.
            mot = txt(g("Motivo"))
            if not re.search(r"[A-Za-zÀ-ÿ]", mot): mot = "não informado"
            tc = round((dem - adm).days / 365.25, 1) if adm and dem else None
            if tc is not None and tc < 0: tc = None     # data de saída anterior à admissão
            saidas.append({"o": obra, "c": cargo, "fn": funcao(cargo),
                           "mot": mot, "mes": ym(dem),
                           "tc": tc,
                           "fx": faixa((dem - nas).days // 365 if nas and dem else None),
                           "sx": sexo(txt(g("Sexo")))})

    if "Afastados" in wb.sheetnames:
        w = wb["Afastados"]; H = cabecalho(w)
        for r in range(5, w.max_row + 1):
            g = lambda k: w.cell(row=r, column=H[k]).value if k in H else None
            mat = txt(g("Matrícula"))
            if not mat or ("A", mat) in vistos: continue
            vistos.add(("A", mat))
            cargo = txt(g("Função")) or txt(g("Cargo"))
            afast.append({"o": obra, "c": cargo, "fn": funcao(cargo),
                          "st": txt(g("Status do colaborador")),
                          "m": txt(g("MOI/MOD")) or txt(g("MOD/MOI"))})

# ---- salário: não vem nestas planilhas, entra pela tabela por função ----
try:
    TAB = json.load(open("sal_funcao.json", encoding="utf-8"))
except FileNotFoundError:
    TAB = {}
semSal = set()
for p in ativos:
    v = TAB.get(p["fn"])
    p["s"] = v
    if v is None: semSal.add(p["c"])

json.dump({"meta": {"data": HOJE.isoformat(), "fonte": [a.split("/")[-1] for a in ARQ.values()],
                    "ativos": len(ativos), "saidas": len(saidas), "afastados": len(afast),
                    "semSalario": sorted(semSal)},
           "ativos": ativos, "saidas": saidas, "afastados": afast},
          sys.stdout, ensure_ascii=False, separators=(",", ":"))
