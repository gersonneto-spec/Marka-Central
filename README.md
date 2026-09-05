# Marka Central

Central de painéis gerenciais das obras da Marka Engenharia Ltda no Terminal Ferroviário da Ponta da Madeira (Vale S.A., São Luís/MA).

**Acesso:** https://gersonneto-spec.github.io/Marka-Central/

## Áreas

| Área | Conteúdo | Situação |
|---|---|---|
| [Medição](medicao/) | Boletins de medição por contrato | 2 painéis publicados |
| [Cronogramas](cronogramas/) | Análises de prazo, caminho crítico, curva de avanço | estrutura pronta |
| [DRE e Custos](dre/) | Resultado por contrato, custo por natureza, margem por frente | estrutura pronta |

## Painéis de medição

| Painel | Contrato | Base |
|---|---|---|
| [Medição OCG](medicao/ocg/) | RT-2180KF-G-17251 · Obra 754 | `Medição OCG.xlsx`, aba QQP |
| [Medição TP](medicao/trem/) | PQ-2180KF-G-10017 · L9057 | `Medição Trem de Passageiros.xlsx`, aba QQP |

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
├── cronogramas/            estrutura pronta
└── dre/                    estrutura pronta
```

Marka Engenharia Ltda · Coordenação de Obras
