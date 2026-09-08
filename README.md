# Marka Central

Central de painéis gerenciais das obras da Marka Engenharia Ltda no Terminal Ferroviário da Ponta da Madeira (Vale S.A., São Luís/MA).

**Acesso:** https://gersonneto-spec.github.io/Marka-Central/

## Áreas

| Área | Conteúdo | Situação |
|---|---|---|
| [Medição](medicao/) | Boletins de medição por contrato | 2 painéis publicados |
| [Cronogramas](cronogramas/) | Evolução física de escavação, análises de prazo, curva de avanço | 1 painel publicado |
| [DRE e Custos](dre/) | Resultado por contrato, custo por natureza, material por fornecedor | 1 painel publicado |

## Painéis de medição

| Painel | Contrato | Base |
|---|---|---|
| [Medição OCG](medicao/ocg/) | RT-2180KF-G-17251 · Obra 754 | `Medição OCG.xlsx`, aba QQP |
| [Medição TP](medicao/trem/) | PQ-2180KF-G-10017 · L9057 | `Medição Trem de Passageiros.xlsx`, aba QQP |

## Painel de cronogramas

| Painel | Obra | Base |
|---|---|---|
| [Evolução da Escavação · Trem de Passageiros](cronogramas/escavacao-trem/) | PQ-2180KF-G-10017 · L9057 | apontamento diário de escavação, 07/07 a 05/09/2026 |

A pasta traz dois arquivos independentes e autocontidos, sem script de extração:

```
cronogramas/escavacao-trem/
├── index.html                 índice do painel
├── painel-escavacao.html      painel gerencial (KPIs, curva, talhão, DMT)
└── timeline-escavacao.html    timeline animada de 53 s
```

Volume sempre líquido, com desconto de 33% de empolamento sobre o volume solto medido em caminhão. Para atualizar, substitua os dois arquivos `.html` da pasta; o endereço não muda.

## Painel de DRE e custos

| Painel | Contrato | Base |
|---|---|---|
| [DRE e Custos 754](dre/754/) | RT-2180KF-G-17251 · Obra 754 | `DRE_754_Evolucao_Contrato_Marka.xlsx` (aba Consolidado) + `Painel_Custos_Contrato_Obra754.xlsx` |

```
python3 extract_dre.py "DRE_754.xlsx" "Painel_Custos.xlsx" > dre_data.json
python3 build_dre.py                  # gera dre_custos_754.html
```

## Atualizar um painel de medição

Na pasta do painel, com Python 3 e `openpyxl` instalados:

```
# OCG
python3 extract_qqp.py "Medição OCG.xlsx" > qqp_data.json
python3 build.py                      # gera medicao_ocg.html

# TP
python3 extract_tp.py "Medição Trem de Passageiros.xlsx" > tp_data.json
python3 build_tp.py                   # gera medicao_tp.html
```

Renomeie o arquivo gerado para `index.html` e substitua o arquivo da pasta correspondente. O GitHub Pages republica sozinho em 1 a 2 minutos e o endereço do painel não muda.

## Estrutura

```
Marka-Central/
├── index.html              portal
├── medicao/
│   ├── index.html          índice da área
│   ├── ocg/                painel + scripts de extração
│   └── trem/               painel + scripts de extração
├── cronogramas/
│   ├── index.html          índice da área
│   └── escavacao-trem/     painel gerencial + timeline de escavação
└── dre/
    ├── index.html          índice da área
    └── 754/                painel + scripts de extração
```

Marka Engenharia Ltda · Coordenação de Obras
