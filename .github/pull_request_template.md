## O que muda

<!-- Uma ou duas frases. Link da task: KAN-xxx -->

## Checklist

**Segurança**
- [ ] Nenhum segredo, token ou dado pessoal no código ou nos logs
- [ ] Rotas novas que mudam estado são `POST` e conferem a Origem
- [ ] Entradas validadas (tipo, tamanho); arquivos passam por `src/shared/media.ts` e `backend/app/core/media.py`

**LGPD e conteúdo**
- [ ] Dado novo tratado? Atualizei `/privacidade`, `/cookies` e `docs/lgpd.md`
- [ ] Conteúdo histórico com fonte citada

**Acessibilidade e UX**
- [ ] Funciona só com teclado e com leitor de tela; contraste AA nos modos claro e escuro
- [ ] Alvos de toque com 44 px ou mais; respeita "reduzir movimento"

**Testes**
- [ ] CI verde (build, Conformidade, Backend) e prints conferidos no artefato `prints`
