# Testes de usabilidade e carga cognitiva

Automatizados em `tests/usabilidade.test.mjs` (Playwright, celular 390 × 844, toque). Rodam no CI a cada push.
Complementam o teste de usabilidade com moradores feito no protótipo (Sprint 4), cujos achados viraram 5 correções.

| Tarefa | Passos do usuário | Meta | Resultado |
|---|---|---|---|
| Ler a placa pela câmera do celular e ganhar o selo | 1 (apontar a câmera) | confirmação < 2,5 s | ~1 s, mensagem com menos de 30 palavras |
| Mesma leitura já com conta | 1 (apontar) | abrir o app na obra, com barra de abas, sem ler de novo | 0 toque extra |
| Ler pelo scanner do app | 2 (tocar "Ler placa", apontar) | câmera aberta em 1 toque | ok (iPhone usa jsQR; Android usa BarcodeDetector) |
| Ver uma obra pela galeria | 2 (Galeria → obra) | nenhum selo indevido | ok: galeria não carimba |
| Primeiro acesso | 1 decisão | no máximo 2 botões e 2 escolhas | "Permitir e continuar" ou "Só o essencial"; localização e câmera marcáveis; microfone nunca |
| Localização | 1 pergunta na vida do aparelho | não perguntar de novo | resposta guardada em `mu_perms` |
| Página da obra | — | até 7 controles na primeira tela (Miller); 1 controle de áudio | ok |
| Consistência com conta | — | mesma barra de abas e mesmo chip de sessão em home, galeria e obra | ok |

## Decisões tomadas a partir dos testes

- **Selo sem ler duas vezes:** o QR da placa leva `?via=qr`; a página carimba e remove o parâmetro (recarregar não duplica). Com conta, abre direto o app na obra.
- **Galeria separada da placa:** ver pela galeria nunca dá selo, para o selo continuar significando "estive lá".
- **Permissões no momento certo:** localização e câmera no primeiro acesso (opcional); galeria de fotos só ao anexar; microfone bloqueado no código (`openCamera` sempre com `audio: false`) e no cabeçalho `Permissions-Policy`.
- **Menos escolhas:** 3D e realidade aumentada saíram da interface (viram funcionalidade futura).
