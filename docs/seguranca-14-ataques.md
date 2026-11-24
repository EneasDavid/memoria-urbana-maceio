# Os 14 ataques mais comuns e como o Memória Urbana barra cada um

Cada linha tem um teste automático que roda no CI a cada push. Se alguém quebrar a proteção, o merge é barrado.

- Site e rotas de login: `tests/abuse.test.mjs` (Playwright + Node)
- Backend (API FastAPI): `backend/tests/test_ataques.py` (pytest)

O projeto é gratuito e não tem pagamento. Mesmo assim, os ataques de "preço", "cupom", "Pix" e "premium" foram testados no que existe de valor no sistema: **os pontos e carimbos da Trilha** e **o acesso às áreas com conta**.

| # | Ataque | O que o atacante tenta | Como o sistema barra | Teste |
|---|---|---|---|---|
| 1 | Digitar /admin | Achar um painel escondido | Não existe rota de admin. `/admin`, `/wp-admin` caem em "não encontrado". `/painel` sem conta manda para o login; conta comum vê "Acesso restrito"; a API devolve 401/403 | abuse 1 · ataques `digitar_admin` |
| 2 | Trocar o ID na URL | Ver ou mexer no dado de outra pessoa (IDOR) | Relatos têm id UUID4 e anexo só com token secreto entregue a quem criou (o banco guarda só o hash). Carimbos usam a conta da sessão, nunca um id da URL. Id inválido de monumento mostra "não encontrado" | abuse 2 · ataques `trocar_id_*` |
| 3 | Chave de API no navegador | Ler segredos no JavaScript do site | Segredos só existem nas variáveis da Vercel. O teste varre o bundle atrás de `client_secret`, `SESSION_SECRET`, chaves Google/AWS/Stripe e chaves privadas | abuse 3 |
| 4 | Mudar o preço | Mandar um valor menor/maior pelo navegador | Pontos são calculados no servidor a partir do cadastro do monumento. Enviar `xp` no corpo = 422 | ataques `mudar_o_preco` |
| 5 | Comprar −1 item | Usar números negativos para ganhar crédito | Corpo com campos fechados (`extra="forbid"`), método só `qr`/`nfc`/`gps`, id com padrão fixo. `quantidade: -1` = 422 | ataques `comprar_menos_um` |
| 6 | Fingir o Pix pago | Forjar a confirmação de pagamento | O equivalente aqui é forjar a sessão: cookie assinado com HMAC-SHA256; alterado, expirado ou com outra chave é recusado | abuse 6 · auth |
| 7 | Cupom 100 vezes | Repetir um benefício | Cada carimbo conta uma vez por dia (`SET NX` no Redis). 100 leituras seguidas = 1 carimbo. Relatos têm limite de 5 por hora por IP | ataques `cupom_cem_vezes` |
| 8 | Premium sem pagar | Usar recurso pago sem pagar | O "premium" do projeto é a Trilha/3D, liberada só com conta. Anônimo recebe 401; demonstração não acessa dado real | ataques `premium_sem_pagar` |
| 9 | Admin no cadastro | Mandar `role: admin` no cadastro | Toda conta nasce participante; papel vem só da lista de e-mails do servidor. Demonstração aceita só `visitante`/`gestor`; `admin` = 400; cookie de demo com `admin` é ignorado; corpo com `role` = 422 | abuse 9 · ataques `admin_no_cadastro` |
| 10 | Adivinhar o código | Chutar tokens, ids ou códigos | state, nonce e verificador PKCE com 256 bits; ids UUID4; token de anexo com 256 bits; limite de tentativas | abuse 10 |
| 11 | Mandar a IA ignorar | Prompt injection | Não há IA generativa em tempo de execução: a narração é a voz do próprio aparelho lendo o texto curado. O teste barra SDKs de IA nas dependências e no bundle | abuse 11 |
| 12 | Script no usuário | XSS pelo texto do relato | React escapa tudo, sem `dangerouslySetInnerHTML`; CSP sem script inline. O teste digita `<script>` e `onerror` e confere que nada executa | abuse 12 · ataques `script_no_usuario` |
| 13 | Senhas no GitHub | Achar segredo no repositório | `.env` ignorado; o teste varre os arquivos e **todo o histórico do git** atrás de chaves e tokens | abuse 13 · security 3 |
| 14 | Abrir teu banco de dados | Ler o banco direto | Regras do Firestore e do Storage negam todo acesso do cliente (só a API, com Admin SDK). Redis e emuladores do Docker só em `127.0.0.1`. Nenhuma URL de banco no front | abuse 14 · ataques `abrir_teu_banco` |

## O que mudou no código para os testes passarem

- **Relatos com id previsível (r1, r2…)**: qualquer pessoa podia anexar foto no relato de outra. Agora o id é UUID4 e o anexo exige o token devolvido só para quem criou o relato.
- **Pontos da Trilha no servidor**: nova rota `POST /api/v1/me/stamps`, com pontos do cadastro, carimbo uma vez por dia e conta tirada da sessão.
- **Corpo fechado**: relatos e carimbos recusam campo inesperado (`status`, `role`, `xp`…).
- **Portas do Docker**: Redis e emuladores do Firebase deixaram de ouvir em todas as interfaces da rede.
