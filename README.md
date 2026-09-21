# Marka Central

Central de painéis gerenciais das obras da Marka Engenharia Ltda no Terminal Ferroviário
da Ponta da Madeira (Vale S.A., São Luís/MA).

**Acesso:** <https://gersonneto-spec.github.io/Marka-Central/>

---

## Áreas

| Área | Conteúdo | Situação |
|---|---|---|
| [Medição](medicao/) | Boletins de medição por contrato | 2 painéis |
| [Cronogramas](cronogramas/) | Guia da semana, look-ahead, marcos e curvas de produção | 2 painéis |
| [DRE e Custos](dre/) | Resultado por contrato, custo por natureza, material por fornecedor | 1 painel |
| [Efetivo](efetivo/) | Efetivo e folha por função, com gráficos e análise | 1 painel |

## Painéis publicados

| Painel | Obra / contrato | Base |
|---|---|---|
| [Medição OCG](medicao/ocg/) | Obras Civis Gerais · RT-2180KF-G-17251 · Obra 754 | `Medição OCG.xlsx`, aba QQP |
| [Medição TP](medicao/trem/) | Oficina de Carros de Passageiros · PQ-2180KF-G-10017 | `Medição Trem de Passageiros.xlsx`, aba QQP |
| [Guia da Semana](cronogramas/semana/) | Oficina de Carros de Passageiros | cronograma semanal em PDF, Rev. 00 / LB_rev1 |
| [Curvas de Produção](cronogramas/curvas/) | Oficina de Carros de Passageiros | `Curvas de Produção.xlsx`, 9 frentes |
| [DRE e Custos 754](dre/754/) | Obras Civis Gerais · Obra 754 | DRE contábil + painel de apropriações do SIENGE |
| [Efetivo x Salário](efetivo/painel/) | Obras Civis e Trem de Passageiros | Listagem de Talentos do Fortes |

`cronogramas/escavacao-trem/` é o endereço antigo do painel de escavação e hoje
redireciona para `cronogramas/curvas/`, que ampliou o escopo para as nove frentes
medidas por volume. O link antigo continua válido.

---

## Como atualizar

**Todo o código que gera os painéis está em [`fonte/`](fonte/), com o passo a passo
completo em [`fonte/README.md`](fonte/README.md).**

Os `index.html` de cada pasta são saída, não fonte. Para atualizar um painel não se edita
o HTML publicado: roda-se o extrator sobre a planilha nova, roda-se o build e sobe-se o
`index.html` resultante. O endereço nunca muda, então qualquer link já divulgado
continua valendo.

```
planilha (.xlsx) ou cronograma (.pdf)
        │
        ▼  extract_*.py     lê as abas e grava os dados crus
   dados.json
        │
        ▼  build_*.py       injeta o JSON no template
   index.html
        │
        ▼  upload no GitHub substitui o arquivo da pasta do painel
   painel no ar em 1 a 2 minutos
```

Rotina mais frequente, toda semana, na área de Cronogramas:

```bash
python3 extract_crono.py  "Trem de Passageiro - SEM39 - Cronograma.pdf"      > crono_data.json
python3 extract_curvas.py "Trem de Passageiro - SEM 39 - Curvas.xlsx"        > curvas_data.json
python3 build_sm.py && python3 build_cv.py
```

---

## Estrutura

```
Marka-Central/
├── index.html                  portal
├── build_portal.py             gera o portal e as páginas de área
├── fonte/                      TODO o código-fonte + README de atualização
├── medicao/
│   ├── ocg/                    Medição OCG
│   └── trem/                   Medição TP
├── cronogramas/
│   ├── semana/                 Guia da Semana
│   ├── curvas/                 Curvas de Produção
│   └── escavacao-trem/         redireciona para curvas/
├── dre/
│   └── 754/                    DRE e Custos da Obra 754
└── efetivo/
    └── painel/                 Efetivo x Salário por Função
```

---

## Confidencialidade

Este repositório é **público**.

- O painel de **Efetivo** não carrega nome, matrícula Fortes nem data de admissão
  individual. Trabalha por função, família e nível. A consulta nominal fica apenas na
  planilha de trabalho.
- O painel de **DRE e Custos** expõe receita, custo e margem do contrato 754. Se o acesso
  precisar ser restrito, essa área pode ser movida para repositório privado sem alterar
  as demais.
- A pasta `fonte/` contém apenas lógica de extração e layout. Nenhum dado de obra, custo
  ou pessoal.

---

Marka Engenharia Ltda · Coordenação de Obras · TFPM, São Luís/MA
