# DESIGN.md · Memória Urbana Maceió

Sistema de design do site público, no formato DESIGN.md: um arquivo que pessoas e IAs leem antes de mexer no front. Não copia marca de terceiros. A linguagem nasce das placas de rua, do mar de Pajuçara e dos museus de Maceió.

## Ideia

**Uma placa que fala.** Quem chega pelo QR está de pé na calçada, no sol, com uma mão ocupada. A página precisa de:
- leitura grande;
- um só controle de áudio;
- o museu a um toque de distância.

O resto fica quieto.

## Cores (tokens em `src/index.css`, em OKLCH)

| Token | OKLCH | Uso |
|---|---|---|
| `--c-navy` | `oklch(29% 0.06 240)` | Citação, convite da Trilha, aviso de cookies, botões escuros |
| `--c-teal` | `oklch(47% 0.08 195)` | Ação principal (Museu, Como chegar, Enviar), links. AA sobre areia e branco |
| `--c-gold` | `oklch(76% 0.13 80)` | Detalhes da marca (ondas, estrela) e foco do teclado. Nunca texto sobre claro |
| `--c-sand` | `oklch(96.5% 0.012 85)` | Fundo do site |
| `--c-red` | `oklch(55% 0.16 33)` | Relatar problema, erros |
| `--edge` | `oklch(0% 0 0 / 7%)` | Bordas com transparência (no escuro: branco a 8%) |

- Degradês sempre `linear-gradient(in oklch …)`.
- No modo escuro, camadas mais altas são mais claras (`.mu-raise-1` e `.mu-raise-2`), em vez de usar sombra.

## Tipografia

- **Fonte:** a do sistema (SF/Segoe/Roboto). Não baixa nenhuma fonte, o que importa em 4G na orla.
- **Escala:**

  | Uso | Tamanho |
  |---|---|
  | Título do monumento | 36/48 px, peso 700, tracking −0,03 em |
  | H2 | 22 px, peso 700 |
  | Texto da bio | 18/20 px, entrelinha 1,6 |
  | Apoio | 13–15 px, preto a 70% |

- **Regras:**
  - Títulos usam `text-wrap: balance` e parágrafos `pretty`.
  - Números que mudam usam `.tabular`.
  - Reticências tipográficas (…).
  - Campos com 16 px ou mais.

## Forma

- **Raio concêntrico:** `--r-card` 22 px. O raio interno é `--r-card − pad/2`. Pílulas só em chips e no login.
- **Alvos de toque:** pelo menos 44 px. `.mu-hit` cria a área invisível quando o botão é pequeno.
- **Fotos:** `.mu-photo-edge`, um fio de luz que separa a foto do fundo.

## Movimento

| Token | Valor | Quando |
|---|---|---|
| `--dur-1` | 110 ms | Pressão (squash) |
| `--dur-2` | 200 ms | Troca de estado |
| `--dur-3` | 320 ms | Entrada de painel |
| `--ease-spring` | `cubic-bezier(.34,1.36,.64,1)` | Volta do toque, follow-through |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | Saídas e arcos |

- Movimento responde a uma ação (abrir, fechar, enviar, tocar). Nada anima sozinho, exceto as barras de áudio enquanto a voz fala.
- Com "reduzir movimento" ligado, tudo some.

## Componentes da página do monumento

1. Foto com véu OKLCH, nome, papel, datas e crédito.
2. **Ações rápidas:** Museu, Compartilhar, Relatar. O áudio não entra aqui: há um só play, no cartão da narração.
3. Bio ou Audiodescrição, com narração e legenda que acompanha a voz.
4. Convite ao museu: sempre visível e sem login.
5. Trilha: convite opcional.
6. Ficha, obras (rolagem lateral com máscara), relatar e fontes.
7. Rodapé legal.

## Não fazer

- **Dois controles para a mesma coisa.** Exemplo: dois plays.
- **Rótulo em CAIXA ALTA acima de cada título.** Exceção: a etiqueta da placa, que imita a plaqueta física.
- **Animação de entrada em cada seção** ou hover em tudo.
- **Foto de terceiro como og:image** enquanto a autorização estiver pendente.
- **Texto dourado sobre fundo claro**, porque reprova no contraste.

## Como revisar (as 5 ferramentas)

| Ferramenta | Como usamos aqui |
|---|---|
| **Bom gosto (skill de design)** | Este arquivo é o plano. Toda mudança visual é comparada com ele antes do código |
| **Web Interface Guidelines (Vercel)** | `tests/guidelines.test.mjs` no CI: nome acessível, noopener, layout shift, 16 px, touch-action, tabulares, reticências e foco |
| **DESIGN.md (estilo "awesome design")** | Este arquivo: tokens e regras que a IA segue para não inventar estilo novo a cada pedido |
| **Imagem → código** | `pnpm shots` gera prints de cada rota, no claro e no escuro. Eles são comparados com o protótipo do Figma Make (`/prototipo`) e com as referências do docs/evidencias |
| **Playwright (abre, clica, tira print)** | `tests/ux.test.mjs`, `a11y.test.mjs`, `attach.test.mjs`, `guidelines.test.mjs` e o artefato "prints" de cada execução do CI |
