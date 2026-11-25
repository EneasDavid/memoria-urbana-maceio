# Riscos jurídicos

Matriz revisada a cada sprint review. Probabilidade e impacto vão de 1 (baixo) a 3 (alto). Cada risco aberto tem uma task no Jira.

| ID | Risco | Base legal | Probabilidade | Impacto | Mitigação | Dono / task |
|---|---|---|---|---|---|---|
| R1 | Uso de fotos de terceiros sem autorização (direito autoral) | Lei 9.610/1998 | 3 | 2 | Crédito e fonte em cada foto, página `/creditos`, pedido de autorização ou troca por foto própria/licença livre, remoção imediata a pedido | Curadoria · task "Autorização das fotos" |
| R2 | Site confundido com canal oficial da Prefeitura ou dos museus (uso indevido de nome, marca ou brasão) | Código Civil, art. 18; Lei 9.279/1996 | 2 | 2 | Aviso "sem vínculo oficial" no rodapé, termos e Sobre; nenhum brasão ou logo de órgão público | Responsável · KAN conformidade |
| R3 | Tratamento de dados sem transparência | LGPD, arts. 6º, 9º e 18 | 1 | 3 | Política, cookies, registro de operações (`docs/lgpd.md`), canal do encarregado | Encarregado · task "E-mail do encarregado" |
| R4 | Foto de relato com rosto ou placa de carro (dado pessoal de terceiro) | LGPD; Código Civil, art. 20 | 2 | 2 | Aviso no formulário, EXIF removido, triagem antes de publicar, descarte | Gestor · KAN-68 |
| R5 | Informação histórica errada ou ofensiva à memória de homenageado (difamação) | Código Civil, art. 12, parágrafo único | 1 | 2 | Fontes citadas em cada página, botão "Informação errada", revisão da curadoria | Curadoria · KAN-18 |
| R6 | Barreiras de acessibilidade | Lei 13.146/2015, art. 63 | 2 | 2 | WCAG 2.1 AA, axe-core no CI, página `/acessibilidade` | Equipe · E12 |
| R7 | Menores de idade usando a conta | LGPD, art. 14 | 2 | 2 | Regra de idade do Google, aviso de autorização no login, sem perfilamento | Responsável |
| R8 | Acidente de visitante seguindo rota (responsabilidade civil) | Código Civil, art. 927 | 1 | 3 | Aviso de segurança nos termos, rota delegada ao Google Maps | Responsável |
| R9 | Relação de consumo sem regras de cobrança e reembolso | CDC, arts. 6º e 49 | 1 | 1 | Serviço gratuito e declarado; CI barra código de pagamento | Equipe |
| R10 | Vazamento de sessão ou credenciais | LGPD, arts. 46 e 48 | 1 | 3 | Login pelo Firebase conferido no servidor, Firestore sem chave (OIDC), cookies HttpOnly, CSP, segredos só em variáveis, plano de incidente | Equipe · KAN-77 |
| R11 | Avaliações ou depoimentos falsos (propaganda enganosa) | CDC, art. 37 | 1 | 2 | Não há avaliações; números de demonstração marcados como simulados; CI barra | Equipe |

**Revisão humana:** esta matriz foi feita pela equipe. Ela não substitui o parecer de um advogado ou do orientador do projeto; há uma task para essa revisão.
