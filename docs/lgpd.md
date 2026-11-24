# Conformidade com a LGPD

Documento interno do Memória Urbana Maceió (Lei 13.709/2018). A versão para o público é a página `/privacidade`. O CI (`tests/compliance.test.mjs`) falha se as seções abaixo sumirem.

## Registro das operações de tratamento (art. 37)

| Operação | Dados | Titulares | Finalidade | Base legal | Onde fica | Retenção | Operadores |
|---|---|---|---|---|---|---|---|
| Acesso às páginas | IP, data/hora, user agent (logs) | Visitantes | Funcionamento e segurança | Legítimo interesse (art. 7º, IX), com teste de balanceamento abaixo | Vercel | Prazo dos logs da Vercel | Vercel |
| Carregamento de fotos de terceiros | IP enviado ao site da foto | Visitantes | Exibir foto creditada | Legítimo interesse | Site de origem | Do site de origem | Sites listados em `/creditos` |
| Relato de dano | Tipo, detalhe, foto sem EXIF, hash do IP com sal rotativo | Visitantes que relatam | Conservação do patrimônio | Legítimo interesse | Hoje: aparelho (`mu_reports_pending`). Depois: Firestore/Storage | 12 meses, depois anonimizado | Google Cloud (futuro) |
| Conta da Trilha | `sub` do Google, nome, e-mail, foto, carimbos | Quem entra | Gamificação | Consentimento (art. 7º, I) | Cookie assinado (fase 1); Firestore (fase 3) | Até exclusão; sessão 7 dias | Google (OAuth), Vercel, Google Cloud |
| Câmera/galeria no relato | Só o arquivo escolhido; a foto é recodificada sem EXIF/GPS | Visitantes que anexam | Conservação do patrimônio | Legítimo interesse, com aviso antes de abrir (`mu_media_ok`) | Aparelho (IndexedDB) até o envio | Até o envio | — |
| Localização no mapa da Trilha | Latitude, longitude e precisão, ao vivo | Visitantes com conta que permitem | Mostrar onde a pessoa está, distâncias e check-in por GPS | Consentimento (permissão do navegador), com aviso antes do pedido | Só memória da aba; lida apenas com o mapa aberto | Não é retida | — |
| Progresso da Trilha sem conta | Ids dos monumentos abertos, passos marcados e a escolha "salvar aqui/nuvem" | Qualquer visitante | Lembrar o que a pessoa já viu, sem cadastro | Não há tratamento pelo controlador: o dado fica só no aparelho (`localStorage` `mu_progress`) e não é enviado | Aparelho | Até a pessoa limpar o navegador | — |
| Papéis de gestor/curador/admin | E-mail e papel | Equipe | Controle de acesso | Execução de contrato/procedimentos (art. 7º, V) | Variável `GESTOR_EMAILS` (fase 1), Firestore (fase 3) | Enquanto durar a função | Vercel, Google Cloud |

Teste de legítimo interesse: a finalidade (segurança, patrimônio) é legítima; o dado é mínimo (sem nome ou contato); o visitante espera que o site registre acessos e relatos; há transparência na política e o IP é guardado só como hash.

## Princípios aplicados (art. 6º)

- **Necessidade:** página pública sem cadastro. O relato não pede nome nem contato. O login recebe só `openid email profile`.
- **Transparência:** política, cookies, termos e créditos linkados no rodapé de toda página pública.
- **Segurança:** HTTPS/HSTS, CSP, cookies HttpOnly/Secure/SameSite, OAuth com PKCE, sem tokens do Google guardados.
- **Prevenção:** fotos de relatos têm EXIF/GPS removidos (task do Celery) e não devem mostrar rostos.
- **Não discriminação e livre acesso:** o conteúdo é igual com ou sem conta.

## Privacidade desde a concepção (art. 46, §2º)

O acervo é feito de **dados públicos sobre patrimônio e figuras públicas**, não de dados dos visitantes.

- **Conteúdo do acervo fora da LGPD de visitante:** monumentos, coordenadas, fotos com licença aberta e biografias de pessoas públicas já falecidas, a partir de fontes oficiais, jornalísticas e de bases abertas (Wikidata CC0, OpenStreetMap ODbL, Wikimedia Commons). Quando cita pessoa pública, o uso é histórico, cultural e jornalístico (art. 4º, II, "a" e "b") e de dado tornado público pelo próprio titular ou de domínio público (art. 7º, §§ 3º, 4º e 7º), sempre com a finalidade de memória e educação.
- **Sem PII por padrão:** ler a placa, ouvir, seguir trilhas e marcar progresso funcionam sem conta, sem cookie de rastreio e sem enviar nada ao servidor. O progresso vive no `localStorage` do aparelho.
- **Conta só por escolha:** o aviso "nuvem ou aparelho" aparece uma vez e não bloqueia. Só quem escolhe "nuvem" faz login (Google, escopo mínimo `openid email profile`).
- **Sem analytics de terceiros:** a CSP barra rastreadores; contagem de leituras do painel é agregada e anônima.
- **Padrões seguros:** EXIF/GPS removidos de fotos, IP só como hash com sal rotativo, nenhum campo de nome, telefone ou CPF.

## Direitos do titular (art. 18)

- **Canal:** o do encarregado, publicado em `/privacidade` e definido em `src/legal/org.ts`.
- **Prazo de resposta:** 15 dias.
- **Exclusão de conta:** `DELETE /api/v1/me` (KAN-76) apaga perfil, carimbos e sessões.
- **Revogação do consentimento:** basta sair e pedir a exclusão.

## Crianças e adolescentes (art. 14)

O conteúdo é aberto e não coleta dados. A conta segue a regra do Google (a partir de 13 anos) e pede autorização de um responsável para menores de 18. Não fazemos perfilamento nem publicidade.

## Transferência internacional (art. 33)

A Vercel, o Google e o Firebase podem processar dados nos EUA, sob as cláusulas de proteção de dados de cada fornecedor. Isso está informado na política.

## Incidente de segurança (art. 48)

1. Conter: revogar sessões (trocar `SESSION_SECRET`) e credenciais.
2. Avaliar: quais dados, quantos titulares e qual o risco.
3. Comunicar a ANPD e os titulares em prazo razoável (orientação da ANPD: até 3 dias úteis) quando houver risco ou dano relevante.
4. Registrar a ocorrência e as medidas em `docs/incidentes/`.

## Operadores e contratos (art. 39)

| Operador | O que trata | Contrato/DPA | Situação |
|---|---|---|---|
| Vercel Inc. | Hospedagem, logs de acesso | Vercel DPA (termos de serviço) | Anexar cópia (KAN-176) |
| Google (OAuth e Firebase) | Login, Firestore e Storage | Google Cloud Data Processing Addendum | Anexar cópia (KAN-176) |
| Oracle Cloud | VM do site (após a migração) | Oracle Data Processing Agreement | Anexar cópia (KAN-176) |
| GitHub | Código e CI (sem dado de visitante) | GitHub DPA | Não trata dado de titular |

## Verificação contínua

A matriz dos 40 requisitos está em [`docs/conformidade-40.md`](conformidade-40.md), com relatório automático no CI. O job **Conformidade** do CI roda `tests/compliance.test.mjs` (17 regras) e `tests/a11y.test.mjs` (axe-core e teclado) a cada push e PR.
