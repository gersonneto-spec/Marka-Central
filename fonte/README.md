# Marka Central — código-fonte dos painéis

Esta pasta guarda tudo o que **gera** os painéis publicados em
<https://gersonneto-spec.github.io/Marka-Central/>.

Os `index.html` de cada pasta do repositório são **saída**, não fonte. Para atualizar
um painel não se edita o HTML publicado: roda-se o extrator sobre a planilha nova,
roda-se o build e sobe-se o `index.html` resultante. O endereço nunca muda, então
qualquer link já divulgado continua valendo.

> **Marka Engenharia Ltda** · Coordenação de Obras · Contrato Vale S.A. · TFPM, São Luís/MA

---

## 1. Como funciona

Todo painel segue o mesmo desenho de três etapas:

```
planilha (.xlsx) ou cronograma (.pdf)
        │
        ▼  extract_*.py          lê as abas/colunas e grava os dados crus
   dados.json
        │
        ▼  build_*.py            injeta o JSON no lugar de /*__DATA__*/ do template
   index.html                    arquivo único, sem dependência externa além do Chart.js
        │
        ▼  upload no GitHub      substitui o index.html da pasta do painel
   painel no ar
```

Duas decisões de projeto que valem ser mantidas:

- **O extrator não arredonda.** Arredondar na extração quebra a conferência contra a
  planilha. Todo arredondamento acontece só na exibição.
- **O painel recalcula, não copia.** O JavaScript reproduz as fórmulas da planilha a
  partir dos dados crus. Isso é o que permite conferir totais e pegar fórmula quebrada
  na origem.

---

## 2. Painéis, pastas e fontes

| Painel | Pasta publicada | Entrada | Extrator | Build |
|---|---|---|---|---|
| Medição OCG | `medicao/ocg/` | `Medição OCG.xlsx` | `extract_qqp.py` | `build.py` |
| Medição TP | `medicao/trem/` | `Medição Trem de Passageiros.xlsx` | `extract_tp.py` | `build_tp.py` |
| DRE e Custos 754 | `dre/754/` | `DRE_754_Evolucao_Contrato.xlsx` + `Painel_Custos_Contrato_Obra754.xlsx` | `extract_dre.py` | `build_dre.py` |
| Guia da Semana | `cronogramas/semana/` | `Trem de Passageiro - SEMxx - Cronograma.pdf` | `extract_crono.py` | `build_sm.py` |
| Curvas de Produção | `cronogramas/curvas/` | `Trem de Passageiro - SEM xx - Curvas de Produção.xlsx` | `extract_curvas.py` | `build_cv.py` |
| Efetivo x Salário | `efetivo/painel/` | `Efetivo_Salario_x_Funcao_Consolidado_TFPM.xlsx` | ver seção 4 | `patch_efetivo.py` |
| Portal (páginas de área) | raiz, `medicao/`, `cronogramas/`, `dre/`, `efetivo/` | nenhuma | — | `build_portal.py` |

`cronogramas/escavacao-trem/` é o endereço antigo do painel de escavação e hoje só
redireciona para `cronogramas/curvas/`. Não apagar: há link divulgado apontando para lá.

---

## 3. Atualização semanal (Cronogramas)

É a rotina mais frequente. Chegam dois arquivos do planejamento por semana.

### 3.1 Guia da Semana

```bash
python3 extract_crono.py "Trem de Passageiro - SEM39 - Cronograma.pdf" > crono_data.json
```

Depois abrir `crono_data.json` e completar o bloco `meta` com quatro campos:

```json
"semana": "SEM 39",
"hoje": "2026-09-27",          // data de corte
"sem1": "2026-09-28",          // primeiro dia da semana a guiar
"horizonte": "2026-10-25"      // sem1 + 27 dias, fecha as 4 semanas
```

```bash
python3 build_sm.py            # gera semana_sem38.html
```

**Conferir antes de subir:**

- Total de linhas extraídas igual ao do PDF. Hoje são 460, com IDs de 1 a 460 sem falha.
- Nenhum nome de tarefa truncado com reticência estranha. O extrator junta as quebras de
  linha do PDF; se o layout mudar, é aqui que quebra primeiro.
- `% Previsto` e `% Realizado` da linha 1 batendo com o cabeçalho do PDF.

**Regra de leitura que não pode mudar:** o painel mede atraso contra a **linha de base**
(`Início LB` e `Término LB`), não contra a data replanejada. Cobrar pela data atual
esconde o atraso, porque a data atual já foi movida pelo planejamento.

### 3.2 Curvas de Produção

```bash
python3 extract_curvas.py "Trem de Passageiro - SEM 39 - Curvas de Produção.xlsx" > curvas_data.json
python3 build_cv.py            # gera curvas_sem38.html
```

O `extract_curvas.py` tem no topo duas listas, `BLOCOS` e `BLOCOS_E`, que mapeiam cada
aba da planilha para as linhas onde ficam a série de datas e as séries de previsto,
realizado e tendência. **Se o planejamento inserir ou apagar linhas nessas abas, é essa
lista que precisa ser corrigida.** É o ponto mais frágil de toda a cadeia.

**Conferir antes de subir:** KPI de avanço da escavação e término projetado batendo com
a aba `Dashboard Gerencial` da própria planilha.

---

## 4. Painel de Efetivo

O painel de Efetivo não tem extrator automático. Ele é montado em dois passos:

1. O HTML base fica em `base.html`, com o array `const D = [...]` de 273 registros já
   anonimizados: obra, cargo, família, nível, MOD/MOI, salário, mês de admissão e flag de
   aprendiz. **Sem nome, sem matrícula Fortes, sem data de admissão individual.**
2. `patch_efetivo.py` injeta nesse base a paleta (`css_add.txt`), a biblioteca Chart.js,
   a navegação por abas e a aba **Gráficos x Análise** (`graf.js`).

```bash
python3 patch_efetivo.py       # gera efetivo_v2.html
```

**Regra de confidencialidade:** o Marka-Central é repositório público. A aba
`Consulta por Função` da planilha, que tem os dados nominais, **não entra no painel**.
Ela fica apenas na planilha de trabalho. Ao regerar o array `D` a partir de uma base
nova, manter os mesmos nove campos e nenhum a mais.

---

## 5. Portal e páginas de área

```bash
python3 build_portal.py
```

Gera `index.html` da raiz e das quatro áreas (`medicao/`, `cronogramas/`, `dre/`,
`efetivo/`). Os números que aparecem nos cartões estão escritos à mão dentro do próprio
script: ao atualizar um painel, atualizar também o cartão correspondente.

---

## 6. Como subir

Pela interface do GitHub, em `Add file > Upload files`, dentro da pasta do painel.
O arquivo tem que se chamar `index.html`. Isso substitui a versão anterior e o
GitHub Pages republica em um a dois minutos.

Para uma pasta que ainda não existe, criar antes um arquivo pelo caminho completo em
`Add file > Create new file`, digitando por exemplo `cronogramas/nova/.gitkeep`. A página
de upload redireciona se a pasta não existir.

---

## 7. Padrão visual

Vale para qualquer painel novo.

| Elemento | Valor |
|---|---|
| Azul Marka | `#3871C1` |
| Cinza | `#656263` |
| Ouro | `#C9A84C` |
| Paleta categórica (claro) | `#3871C1` `#E07B39` `#8C6BB1` `#1BA39C` `#B5A03A` `#C2557A` |
| Paleta categórica (escuro) | `#5B93D9` `#D95926` `#9878C0` `#17A093` `#9A8A28` `#C2557A` |
| Tipografia | Arial |
| Moeda | `R$ 1.234.567,89` |
| Datas | `dd/mm/aaaa` ou `mmm/aa` |
| Cargo | Coordenador de Obras |

Vermelho nunca é cor de identidade. Aparece só como sinal de estado: atraso, estouro de
quantidade, margem negativa.

Todo painel funciona em tema claro e escuro, pelos tokens `:root`,
`@media (prefers-color-scheme: dark)` e `:root[data-theme="dark"]`.

`charts4.js` traz as quatro formas gráficas usadas nos painéis de Medição e DRE:
bump chart, slope chart, cascata e histograma com densidade (núcleo gaussiano, banda pela
regra de Silverman). Cada bloco de gráfico carrega uma moldura **Como ler** em cima e um
**Quando usar** embaixo, para funcionar em reunião sem explicação verbal.

---

## 8. Arquivos desta pasta

| Arquivo | Serve para |
|---|---|
| `extract_qqp.py` · `build.py` · `ocg_template.html` · `app_ocg.js` | Medição OCG |
| `extract_tp.py` · `build_tp.py` · `tp_template.html` · `head_tp.html` · `app_tp.js` | Medição TP |
| `extract_dre.py` · `build_dre.py` · `dre_template.html` · `head_dre.html` · `app_dre.js` | DRE 754 |
| `extract_crono.py` · `build_sm.py` · `head_sm.html` · `app_sm.js` · `views_sm.js` | Guia da Semana |
| `extract_curvas.py` · `build_cv.py` · `head_cv.html` · `app_cv.js` · `views_cv.js` | Curvas de Produção |
| `patch_efetivo.py` · `graf.js` · `css_add.txt` | Efetivo |
| `build_portal.py` | Portal e páginas de área |
| `charts4.js` | Biblioteca de gráficos compartilhada |

Nos painéis de Curvas e Semana o template é montado por concatenação
(`head_*.html` + `app_*.js` + `views_*.js`) antes do build. Nos demais, o template já
vem com o aplicativo embutido.

---

## 9. Dependências

```bash
pip install openpyxl pdfplumber --break-system-packages
```

Chart.js 4.4.1 entra por CDN (`cdnjs.cloudflare.com`), não precisa instalar.
O painel funciona offline depois de carregado uma vez, mas a primeira abertura precisa
de internet.
