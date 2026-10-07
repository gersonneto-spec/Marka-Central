"""Farol da Obra: pagina de uma tela, para diretoria, a partir de crono_data.json.
Uso: python3 build_farol.py  (depois de extract_crono.py e do meta preenchido)
Sem jargao, sem EAP, sem sigla nao explicada. A regra de atraso e a mesma do Guia da
Semana: tudo medido contra a LINHA DE BASE, nunca contra a data ja replanejada.
"""
import json, datetime as dt

D = json.load(open("crono_data.json", encoding="utf-8"))
T = D["tarefas"]; M = D["meta"]
HOJE = dt.date.fromisoformat(M["hoje"])

def d(s): return dt.date.fromisoformat(s) if s else None
def fd(x): return x.strftime("%d/%m/%Y") if x else "–"
def fp(v, c=1): return ("%.*f" % (c, v * 100)).replace(".", ",") + "%"
def fn(v, c=1): return ("%.*f" % (c, v)).replace(".", ",")

RAIZ = T[0]
prev, real = RAIZ["prev"], RAIZ["real"]
idp = real / prev if prev else 0
iniBL, fimBL = d(RAIZ["iniBL"]), d(RAIZ["fimBL"])
fimDecl = d(RAIZ["fim"])
totalBL = (fimBL - iniBL).days
decor = (HOJE - iniBL).days
restBL = (fimBL - HOJE).days
tend = HOJE + dt.timedelta(days=round(restBL / idp)) if idp else fimBL
atrasoTend = (tend - fimBL).days
atrasoDecl = (fimDecl - fimBL).days if fimDecl else 0
gapPP = (real - prev) * 100

NOMES = {"1.1.4.1": "Desmobilização final", "1.1.2.1": "Opção de Compra · Superestrutura"}
# ---- marcos: agrupadores de nivel 4 sob 1.1, que e como o contrato fala ----
marcos = []
for x in T:
    if x["eap"].startswith("1.1.") and x["nivel"] == 4 and x["fimBL"]:
        alvo = d(x["fimBL"]); repl = d(x["fim"]) or alvo
        falta = (alvo - HOJE).days
        concl = (x["real"] or 0) >= 1
        desliz = (repl - alvo).days
        if concl: st, rot = "ok", "Entregue"
        elif falta < 0: st, rot = "vencido", "Data vencida"
        elif desliz > 0: st, rot = "risco", "Replanejado para depois do prazo"
        elif falta <= 60: st, rot = "atencao", "Prazo próximo"
        else: st, rot = "prazo", "Dentro do prazo"
        marcos.append({"nome": NOMES.get(x["eap"], x["nome"]), "alvo": alvo, "repl": repl, "falta": falta,
                       "desliz": desliz, "st": st, "rot": rot, "real": x["real"] or 0})
marcos.sort(key=lambda m: m["alvo"])
abertos = [m for m in marcos if m["st"] != "ok"]
emRisco = [m for m in marcos if m["st"] in ("risco", "vencido")]

# ---- o que esta travando: folhas atrasadas pela linha de base ----
trav = []
for i, x in enumerate(T):
    folha = not (i + 1 < len(T) and T[i + 1]["nivel"] > x["nivel"])
    if not folha or (x["real"] or 0) >= 1: continue
    fb, ib = d(x["fimBL"]), d(x["iniBL"])
    if fb and fb < HOJE: a, ref, tipo = (HOJE - fb).days, fb, "deveria ter terminado"
    elif ib and ib < HOJE and (x["real"] or 0) == 0: a, ref, tipo = (HOJE - ib).days, ib, "deveria ter começado"
    else: continue
    # acima de 90% a atividade está praticamente entregue: vira ruído no farol da diretoria
    if (x["real"] or 0) >= 0.9: continue
    trav.append({"nome": x["nome"], "dias": a, "real": x["real"] or 0, "ref": ref, "tipo": tipo})
trav.sort(key=lambda t: -t["dias"])
somaAtraso = sum(t["dias"] for t in trav)

# ---- status geral ----
if gapPP >= -1: geral, gtit = "ok", "No ritmo"
elif gapPP >= -5: geral, gtit = "atencao", "Atrasada, ainda recuperável"
else: geral, gtit = "risco", "Atrasada, prazo final ameaçado"

fimEsc = max(fimBL, tend, fimDecl or fimBL) + dt.timedelta(days=25)
escala = (fimEsc - iniBL).days
def pos(x): return max(2, min(97, round((x - iniBL).days / escala * 100)))

CORES = {"ok": "#1BA39C", "prazo": "#3871C1", "atencao": "#C9A84C", "risco": "#E07B39", "vencido": "#C0392B"}

def barra(m):
    # contagem regressiva: proporcao do que falta sobre o maior prazo em aberto
    maxf = max([x["falta"] for x in abertos] + [1])
    pc = max(2, min(100, round((m["falta"] / maxf) * 100))) if m["falta"] > 0 else 100
    return pc

css_marcos = "".join(
    f'''<div class="marco {m['st']}">
      <div class="mtopo"><b>{m['nome']}</b><span class="tag {m['st']}">{m['rot']}</span></div>
      <div class="mdata">Prazo do contrato <b>{fd(m['alvo'])}</b>{
        f" &middot; obra projeta <b>{fd(m['repl'])}</b>" if m['desliz'] > 0 else ""}</div>
      <div class="track"><i style="width:{barra(m)}%"></i></div>
      <div class="mfalta">{
        "Concluído" if m['st'] == 'ok' else
        (f"<b>{abs(m['falta'])}</b> dias de atraso" if m['falta'] < 0 else f"faltam <b>{m['falta']}</b> dias")
      }{f" &middot; escorregou {m['desliz']} dias" if m['desliz'] > 0 else ""}</div>
    </div>''' for m in marcos)

linhas_trav = "".join(
    f'''<tr><td>{t['nome'][:78]}<br><small style="color:var(--ink3)">{t['tipo']}</small></td>
    <td class="n">{fd(t['ref'])}</td>
    <td class="n"><b style="color:var(--vermelho)">{t['dias']} d</b></td>
    <td class="n">{fp(t['real'], 0)}</td></tr>''' for t in trav[:8])

HTML = f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Farol da Obra &middot; Trem de Passageiros</title>
<style>
:root{{--azul:#3871C1;--navy:#1B2A4A;--ouro:#C9A84C;--cinza:#656263;--vermelho:#C0392B;
--ok:#1BA39C;--atencao:#C9A84C;--risco:#E07B39;
--bg:#F4F6FA;--card:#FFFFFF;--ink:#16202E;--ink2:#4A5869;--ink3:#8A96A6;--linha:#DFE5EE}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{
--bg:#0F1621;--card:#18212F;--ink:#E8EDF4;--ink2:#A9B6C6;--ink3:#6F7E91;--linha:#273345;--azul:#5B93D9;--risco:#D95926}}}}
:root[data-theme="dark"]{{--bg:#0F1621;--card:#18212F;--ink:#E8EDF4;--ink2:#A9B6C6;--ink3:#6F7E91;--linha:#273345;--azul:#5B93D9;--risco:#D95926}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 Arial,Helvetica,sans-serif}}
.topo{{background:var(--azul);color:#fff;padding:18px 28px;display:flex;align-items:center;gap:22px;flex-wrap:wrap}}
.marca b{{font-size:22px;letter-spacing:4px;display:block}}
.marca span{{font-size:9px;letter-spacing:5px;opacity:.85}}
.topo h1{{margin:0;font-size:21px}} .topo p{{margin:2px 0 0;font-size:13px;opacity:.9}}
.topo .quando{{margin-left:auto;text-align:right;font-size:13px;opacity:.92}}
main{{max-width:1180px;margin:0 auto;padding:26px 20px 60px}}
.hero{{background:var(--card);border-radius:14px;padding:26px 28px;border-left:10px solid var(--c);
display:flex;gap:28px;align-items:center;flex-wrap:wrap;box-shadow:0 1px 3px rgba(16,24,40,.07)}}
.farol{{width:74px;height:74px;border-radius:50%;background:var(--c);flex:none;
display:flex;align-items:center;justify-content:center;color:#fff;font-size:34px;font-weight:bold}}
.hero h2{{margin:0 0 4px;font-size:26px}} .hero p{{margin:0;color:var(--ink2);max-width:640px}}
.nums{{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:14px;margin:20px 0 10px}}
.num{{background:var(--card);border-radius:12px;padding:16px 18px;border-top:4px solid var(--azul);
box-shadow:0 1px 3px rgba(16,24,40,.06)}}
.num small{{display:block;color:var(--ink3);font-size:11px;letter-spacing:1.2px;text-transform:uppercase}}
.num b{{display:block;font-size:30px;margin:6px 0 2px;color:var(--azul)}}
.num i{{font-style:normal;font-size:13px;color:var(--ink2)}}
.num.ouro{{border-top-color:var(--ouro)}} .num.ouro b{{color:var(--ouro)}}
.num.risco{{border-top-color:var(--risco)}} .num.risco b{{color:var(--risco)}}
h3.sec{{font-size:13px;letter-spacing:1.6px;text-transform:uppercase;color:var(--azul);
margin:34px 0 4px}} h3.sec span{{color:var(--ink3);letter-spacing:0;text-transform:none;font-weight:normal;margin-left:10px;font-size:13px}}
.linhatempo{{background:var(--card);border-radius:12px;padding:22px 26px;box-shadow:0 1px 3px rgba(16,24,40,.06)}}
.lt{{position:relative;height:8px;background:var(--linha);border-radius:4px;margin:62px 0 72px}}
.lt i{{position:absolute;left:0;top:0;bottom:0;background:var(--azul);border-radius:4px}}
.pin{{position:absolute;top:-50px;transform:translateX(-50%);text-align:center;font-size:12px;white-space:nowrap}}
.pin b{{display:block;font-size:14px;line-height:1.35}} .pin:after{{content:"";position:absolute;left:50%;top:44px;width:2px;height:14px;background:var(--pc);transform:translateX(-50%)}}
.pin.baixo{{top:auto;bottom:-50px}} .pin.baixo:after{{top:auto;bottom:44px}}
.marcos{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin-top:10px}}
.marco{{background:var(--card);border-radius:12px;padding:16px 18px;box-shadow:0 1px 3px rgba(16,24,40,.06);
border-left:6px solid var(--mc)}}
.marco.ok{{--mc:{CORES['ok']}}} .marco.prazo{{--mc:{CORES['prazo']}}} .marco.atencao{{--mc:{CORES['atencao']}}}
.marco.risco{{--mc:{CORES['risco']}}} .marco.vencido{{--mc:{CORES['vencido']}}}
.mtopo{{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}}
.mtopo b{{font-size:16px;line-height:1.3}}
.tag{{font-size:10px;letter-spacing:.6px;text-transform:uppercase;padding:3px 8px;border-radius:20px;
color:#fff;background:var(--mc);flex:none;white-space:nowrap}}
.mdata{{font-size:13px;color:var(--ink2);margin:8px 0 10px}}
.track{{height:7px;background:var(--linha);border-radius:4px;overflow:hidden}}
.track i{{display:block;height:100%;background:var(--mc)}}
.mfalta{{font-size:13px;color:var(--ink2);margin-top:8px}}
table{{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden;
box-shadow:0 1px 3px rgba(16,24,40,.06)}}
th{{background:var(--azul);color:#fff;font-size:12px;letter-spacing:.8px;text-transform:uppercase;
padding:11px 14px;text-align:left}}
td{{padding:11px 14px;border-top:1px solid var(--linha);font-size:14px}}
td.n,th.n{{text-align:right;white-space:nowrap}}
.rodape{{margin-top:34px;font-size:12px;color:var(--ink3);line-height:1.7}}
.volta{{display:inline-block;margin-top:18px;background:var(--azul);color:#fff;text-decoration:none;
padding:9px 16px;border-radius:8px;font-size:14px}}
@media(max-width:640px){{.topo{{padding:14px 16px}}main{{padding:18px 14px 44px}}.hero h2{{font-size:21px}}}}
</style></head><body>
<header class="topo">
  <div class="marca"><b>MARKA</b><span>ENGENHARIA</span></div>
  <div><h1>Farol da Obra &middot; Trem de Passageiros</h1>
  <p>Oficina de Manutenção de Carros de Passageiros &middot; Vale S.A. &middot; TFPM &middot; São Luís, MA</p></div>
  <div class="quando">Posição de <b>{fd(HOJE)}</b><br>{M.get("semana","")} &middot; cronograma do planejamento</div>
</header>
<main>

<div class="hero" style="--c:{CORES[geral]}">
  <div class="farol">{"&#10003;" if geral == "ok" else "!"}</div>
  <div>
    <h2>{gtit}</h2>
    <p>A obra deveria estar com <b>{fp(prev)}</b> dos serviços prontos e está com <b>{fp(real)}</b>.
    São <b>{fn(abs(gapPP))} pontos</b> abaixo do planejado. Mantido o ritmo atual, a entrega final
    cai para <b>{fd(tend)}</b>, contra o prazo de contrato de <b>{fd(fimBL)}</b>.</p>
  </div>
</div>

<div class="nums">
  <div class="num"><small>Executado até hoje</small><b>{fp(real)}</b><i>de tudo que o contrato prevê</i></div>
  <div class="num ouro"><small>Deveria estar em</small><b>{fp(prev)}</b><i>segundo a linha de base</i></div>
  <div class="num risco"><small>Diferença</small><b>{"+" if gapPP > 0 else "&minus;"}{fn(abs(gapPP))} pp</b><i>pontos abaixo do planejado</i></div>
  <div class="num"><small>Ritmo de entrega</small><b>{fn(idp, 2)}</b><i>a cada 10 dias planejados, a obra entrega {fn(idp * 10)}</i></div>
  <div class="num"><small>Marcos do contrato</small><b>{len(marcos) - len(abertos)} de {len(marcos)}</b><i>entregues &middot; {len(emRisco)} em risco</i></div>
  <div class="num risco"><small>Atividades paradas ou vencidas</small><b>{len(trav)}</b><i>somando {somaAtraso} dias de atraso</i></div>
</div>

<h3 class="sec">Entrega final <span>três datas que precisam estar na mesma conversa</span></h3>
<div class="linhatempo">
  <div class="lt"><i style="width:{pos(HOJE)}%"></i>
    <div class="pin" style="left:{pos(HOJE)}%;--pc:var(--azul);color:var(--azul)">
      <b>{fd(HOJE)}</b>hoje</div>
    <div class="pin baixo" style="left:{pos(fimBL)}%;--pc:{CORES['ok']};color:{CORES['ok']}">
      <b>{fd(fimBL)}</b>prazo do contrato</div>
    <div class="pin" style="left:{pos(tend)}%;--pc:{CORES['risco']};color:{CORES['risco']}">
      <b>{fd(tend)}</b>no ritmo de hoje</div>
  </div>
  <p style="margin:0;color:var(--ink2);font-size:14px">
  O planejamento já declara o término em <b>{fd(fimDecl)}</b>, {atrasoDecl} dias depois do contrato.
  Pelo ritmo efetivo das frentes, a projeção é <b>{fd(tend)}</b>, ou seja <b>{atrasoTend} dias</b> além do prazo
  contratual. A diferença entre essas duas datas é o que precisa ser recuperado ou formalizado.</p>
</div>

<h3 class="sec">Marcos do contrato <span>o que foi prometido e quanto falta para cada entrega</span></h3>
<div class="marcos">{css_marcos}</div>

<h3 class="sec">O que está travando agora <span>atividades que passaram da data e não andaram</span></h3>
<table><thead><tr><th>Atividade</th><th class="n">Data da linha de base</th>
<th class="n">Atraso</th><th class="n">Executado</th></tr></thead>
<tbody>{linhas_trav}</tbody></table>

<div class="rodape">
  <b>Como ler esta página.</b> Todas as datas de referência são as da linha de base do contrato, não as datas
  já remarcadas pelo planejamento. Cobrar pela data remarcada esconde o atraso, porque a data remarcada já foi
  movida. Fonte: cronograma {M.get("semana","")} do planejamento, {M.get("linhas","")} atividades.<br>
  Marka Engenharia &middot; Coordenação de Obras &middot; atualizado em {fd(HOJE)}
  <br><a class="volta" href="../../">&larr; Marka Central</a>
</div>
</main></body></html>'''

open("farol.html", "w", encoding="utf-8").write(HTML)
print("ok", len(HTML), "bytes |", len(marcos), "marcos |", len(trav), "travadas | tend", fd(tend))
