// Dados do projeto (item 15). Fonte única para rodapé, Sobre, Política de Privacidade e Termos.
// O CI (tests/compliance.test.mjs) falha se responsável, natureza ou canal de contato ficarem vazios.
export const ORG = {
  nome: 'Memória Urbana Maceió',
  natureza:
    'Projeto acadêmico de estudantes, gratuito e sem fins lucrativos. Não tem vínculo oficial com a Prefeitura de Maceió, com o Governo de Alagoas nem com os museus citados.',
  pessoaJuridica: 'Não há CNPJ: o projeto não é uma empresa.',
  responsavel: 'David Enéas Ferreira',
  encarregado: 'David Enéas Ferreira (responsável pelo projeto)',
  cidade: 'Maceió, Alagoas, Brasil',
  contato: {
    descricao: 'Abra um chamado público no GitHub do projeto',
    url: 'https://github.com/EneasDavid/memoria-urbana-maceio/issues/new',
    // e-mail do encarregado de dados: definido na task de contato (Jira); enquanto vazio, vale o canal acima
    email: '' as string,
  },
  repositorio: 'https://github.com/EneasDavid/memoria-urbana-maceio',
  atualizadoEm: '19 de novembro de 2026',
  hospedagem: 'Vercel Inc. (EUA)',
} as const

export const LEGAL_LINKS = [
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos de uso' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/acessibilidade', label: 'Acessibilidade' },
  { href: '/creditos', label: 'Créditos das imagens' },
  { href: '/sobre', label: 'Sobre o projeto' },
] as const
