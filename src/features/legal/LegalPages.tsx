import { useEffect, type ReactNode } from 'react'
import { monuments } from '../../data'
import { ORG } from '../../legal/org'
import { LegalFooter } from './LegalFooter'

// Páginas legais e institucionais (itens 1, 2, 3, 4, 8, 14, 15 e 16).
// O texto é a fonte de verdade; o CI confere que as seções obrigatórias continuam aqui.

function Layout({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · ${ORG.nome}`
  }, [title])
  return (
    <main id="conteudo" className="min-h-dvh bg-[#f6f3ec] text-black">
      <div className="max-w-[760px] mx-auto px-5 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1f6b6b] underline underline-offset-2">
          <img src="/memoria-urbana-logo.png" alt="" className="w-7 h-7 rounded-full object-cover bg-white" />
          {ORG.nome}
        </a>
        <h1 className="mt-6 text-[30px] font-bold tracking-[-0.02em] leading-tight">{title}</h1>
        <p className="mt-1 text-[13.5px] text-black/70">Atualizado em {ORG.atualizadoEm}</p>
        <div className="legal mt-6 space-y-4 text-[16px] leading-relaxed text-black/85">{children}</div>
        <LegalFooter />
      </div>
    </main>
  )
}

const H2 = ({ id, children }: { id?: string; children: ReactNode }) => (
  <h2 id={id} className="pt-4 text-[20px] font-bold tracking-[-0.01em] text-black">{children}</h2>
)
const Contato = () => (
  <>
    {ORG.contato.email ? <><a className="underline" href={`mailto:${ORG.contato.email}`}>{ORG.contato.email}</a> ou </> : null}
    <a className="underline" href={ORG.contato.url}>{ORG.contato.descricao.charAt(0).toLowerCase() + ORG.contato.descricao.slice(1)}</a>
  </>
)

const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="overflow-x-auto rounded-[14px] bg-white" tabIndex={0} role="region" aria-label="Tabela (role para os lados se precisar)">
    <table className="w-full text-[14px] text-left">
      <thead><tr>{head.map((h) => <th key={h} scope="col" className="px-3 py-2.5 font-semibold text-black border-b border-black/10">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="align-top">{r.map((c, j) => <td key={j} className="px-3 py-2.5 border-b border-black/[0.06]">{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
)

export function PrivacyPage() {
  return (
    <Layout title="Política de Privacidade">
      <p>Esta política explica quais dados pessoais o {ORG.nome} trata, por quê e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).</p>
      <p><strong>Resumo:</strong> para ler a página de um monumento você não precisa de cadastro, e não usamos ferramentas de rastreamento, publicidade nem venda de dados. Só tratamos dados quando você envia um relato ou escolhe entrar com sua conta Google.</p>

      <H2 id="controlador">Quem é o controlador</H2>
      <p>O controlador é o {ORG.nome}. {ORG.natureza} {ORG.pessoaJuridica} Responsável: {ORG.responsavel}, {ORG.cidade}.</p>

      <H2 id="dados">Quais dados tratamos, para quê e por quanto tempo</H2>
      <Table
        head={['Situação', 'Dados', 'Finalidade', 'Base legal (LGPD)', 'Retenção']}
        rows={[
          ['Abrir qualquer página', 'Endereço IP, data/hora, navegador (registros técnicos da hospedagem)', 'Funcionamento e segurança do site', 'Legítimo interesse (art. 7º, IX)', 'Prazo dos registros da hospedagem (curto, definido pela Vercel)'],
          ['Ver fotos dos monumentos', 'Seu navegador busca a foto no site de origem, que recebe o seu IP', 'Exibir a foto creditada ao autor', 'Legítimo interesse (art. 7º, IX)', 'Conforme o site de origem (lista em Créditos)'],
          ['Relatar um problema na obra', 'Tipo do problema, detalhe opcional, foto ou vídeo opcional (a foto é recodificada sem localização; vídeo até 30 s) e um código derivado do IP (hash) só para limitar abusos', 'Avisar sobre danos ao patrimônio', 'Legítimo interesse (art. 7º, IX)', 'Hoje fica só no seu aparelho; quando houver servidor, até 12 meses e depois anonimizado'],
          ['Mapa da Trilha com conta (opcional)', 'Localização do aparelho, só enquanto o mapa está aberto e depois que você permite', 'Mostrar onde você está, a distância até cada obra e o check-in por GPS', 'Consentimento (art. 7º, I): permissão do navegador, que você pode retirar a qualquer momento', 'Não é gravada nem enviada: fica na memória do aparelho e para de ser lida quando você sai do mapa'],
          ['Entrar com Google (opcional)', 'Identificador da conta Google, nome, e-mail e foto; carimbos da Trilha', 'Pontuar na Trilha Cultural e guardar o passaporte', 'Consentimento (art. 7º, I), que você pode revogar', 'Até você sair ou pedir a exclusão da conta; sessão expira em 7 dias'],
        ]}
      />
      <p>Não pedimos nome, telefone, CPF, endereço nem localização para ler ou relatar. A localização só é usada no mapa da Trilha, se você permitir, e não sai do seu aparelho. Não tratamos dados sensíveis.</p>

      <H2 id="cookies">Cookies e armazenamento no aparelho</H2>
      <p>Usamos só itens essenciais. Detalhes na página <a className="underline" href="/cookies">Cookies</a>.</p>

      <H2 id="compartilhamento">Compartilhamento e transferência internacional</H2>
      <p>Não vendemos nem alugamos dados. Usamos fornecedores que processam dados por nossa conta: {ORG.hospedagem} (hospedagem), Google (login, apenas se você escolher entrar) e, quando o servidor de dados entrar no ar, Google Cloud/Firebase. Esses serviços podem guardar dados fora do Brasil; a transferência segue o art. 33 da LGPD, com fornecedores que adotam cláusulas de proteção de dados. Os sites que publicam as fotos recebem o seu IP quando a foto é carregada.</p>

      <H2 id="direitos">Direitos do titular</H2>
      <p>Pelo art. 18 da LGPD você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização ou eliminação de dados desnecessários, portabilidade, eliminação dos dados tratados com consentimento, informação sobre com quem compartilhamos e revogação do consentimento. Para isso, fale com o encarregado pelo canal abaixo; respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

      <H2 id="encarregado">Encarregado de dados (DPO)</H2>
      <p>{ORG.encarregado}. Contato: <Contato />. Não envie dados pessoais em chamados públicos; peça um canal privado.</p>

      <H2 id="seguranca">Segurança</H2>
      <p>Conexão sempre criptografada (HTTPS com HSTS), cabeçalhos de segurança, cookies de sessão inacessíveis ao JavaScript, login com OAuth 2.0 e PKCE sem guardar senhas nem tokens do Google, e testes automáticos de segurança a cada mudança no código.</p>

      <H2 id="criancas">Crianças e adolescentes</H2>
      <p>As páginas dos monumentos podem ser lidas por qualquer pessoa, sem coleta de dados. A conta é opcional e segue a regra do Google (a partir de 13 anos); menores de 18 anos devem usá-la com autorização de um responsável, como pede o art. 14 da LGPD.</p>

      <H2 id="alteracoes">Alterações</H2>
      <p>Avisaremos mudanças relevantes nesta página, com a data de atualização no topo.</p>
    </Layout>
  )
}

export function CookiesPage() {
  return (
    <Layout title="Cookies e armazenamento">
      <p>O {ORG.nome} não usa cookies de publicidade, de análise de audiência nem de terceiros. Só usamos o que é essencial para o site funcionar, por isso não há o que aceitar ou recusar: o aviso existe para você saber.</p>
      <Table
        head={['Nome', 'Tipo', 'Para quê', 'Duração']}
        rows={[
          ['mu_session', 'Cookie essencial (HttpOnly, Secure)', 'Manter você conectado depois de entrar com Google', '7 dias ou até sair'],
          ['mu_oauth', 'Cookie essencial (HttpOnly, Secure)', 'Proteger o login contra falsificação (state, nonce e PKCE)', '10 minutos'],
          ['mu_cookie_notice', 'Armazenamento local', 'Lembrar que você já viu este aviso', 'Até limpar o navegador'],
          ['mu_media_ok', 'Armazenamento local', 'Lembrar que você já leu o aviso de câmera e galeria', 'Até limpar o navegador'],
          ['mu_demo', 'Cookie essencial (HttpOnly)', 'Sessão do acesso de demonstração, sem dado pessoal', '2 horas'],
          ['mu_progress', 'Armazenamento local', 'Lembrar monumentos vistos, passos das trilhas e a escolha "salvar neste aparelho" (nada é enviado sem login)', 'Até limpar o navegador'],
          ['mu_reports_pending', 'Armazenamento local', 'Guardar relatos de dano até o envio ao servidor', 'Até o envio ou limpar o navegador'],
          ['mu_reports_media', 'IndexedDB (aparelho)', 'Guardar a foto (já sem localização) ou o vídeo do relato até o envio', 'Até o envio ou limpar o navegador'],
        ]}
      />
      <p>Você pode apagar tudo nas configurações do navegador. Mais detalhes na <a className="underline" href="/privacidade">Política de Privacidade</a>.</p>
    </Layout>
  )
}

export function TermsPage() {
  return (
    <Layout title="Termos de uso">
      <p>Ao usar o {ORG.nome} você concorda com estes termos.</p>
      <H2 id="o-que-e">O que é o serviço</H2>
      <p>Páginas sobre estátuas e praças de Maceió, abertas pelo QR ou NFC das placas, com convite para os museus da cidade. {ORG.natureza}</p>
      <H2 id="gratuito">Uso gratuito, pagamentos e reembolso</H2>
      <p>O serviço é gratuito. Não vendemos produtos, assinaturas nem ingressos e não cobramos nada de ninguém; por isso não existe política de reembolso. Se algum dia houver cobrança, estes termos serão atualizados antes, com regras de reembolso conforme o Código de Defesa do Consumidor.</p>
      <H2 id="conteudo">Conteúdo e fontes</H2>
      <p>As biografias foram escritas a partir de fontes jornalísticas, acadêmicas e oficiais, citadas em cada página. Pode haver erros: use "Relatar um problema" ou o canal de contato para corrigir. Horários e endereços dos museus podem mudar; confirme antes de ir. O projeto não fala em nome da Prefeitura nem dos museus.</p>
      <H2 id="conduta">Uso adequado</H2>
      <p>Não envie relatos falsos, ofensivos ou com fotos que identifiquem pessoas. Podemos descartar relatos que descumpram estas regras.</p>
      <H2 id="conta">Conta opcional</H2>
      <p>A conta Google serve só para a Trilha Cultural. Você pode sair a qualquer momento e pedir a exclusão dos seus dados (veja a Política de Privacidade).</p>
      <H2 id="seguranca-rua">Segurança na rua</H2>
      <p>Use o celular com atenção ao trânsito e ao entorno. As rotas são sugestões do Google Maps e podem não considerar obras, horários ou condições do local.</p>
      <H2 id="propriedade">Propriedade intelectual</H2>
      <p>As fotos pertencem aos autores indicados em <a className="underline" href="/creditos">Créditos das imagens</a>. Os textos do projeto podem ser citados com crédito e link. Nomes e marcas de terceiros pertencem aos seus donos.</p>
      <H2 id="responsabilidade">Limitação de responsabilidade</H2>
      <p>O serviço é oferecido como está, para fins educativos e culturais, e pode ficar fora do ar. Na medida permitida pela lei, não respondemos por decisões tomadas só com base no conteúdo.</p>
      <H2 id="lei">Lei aplicável</H2>
      <p>Valem as leis brasileiras. Fica eleito o foro de Maceió (AL), sem prejuízo dos direitos do consumidor. Contato: <Contato />.</p>
    </Layout>
  )
}

export function AccessibilityPage() {
  return (
    <Layout title="Acessibilidade">
      <p>Queremos que todas as pessoas conheçam a história dos monumentos. Nossa meta é o nível AA das Diretrizes de Acessibilidade para Conteúdo Web (WCAG 2.1), em linha com a Lei Brasileira de Inclusão (Lei 13.146/2015) e o eMAG.</p>
      <H2 id="recursos">O que já existe</H2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Narração em voz de cada biografia, com a frase e a palavra faladas destacadas.</li>
        <li>Audiodescrição das obras.</li>
        <li>Modo escuro e claro conforme o seu aparelho; contraste verificado automaticamente.</li>
        <li>Navegação completa por teclado, com link para pular direto ao conteúdo e foco sempre visível.</li>
        <li>Textos alternativos nas imagens e páginas que funcionam com leitores de tela.</li>
        <li>Animações reduzidas quando o aparelho pede menos movimento.</li>
      </ul>
      <H2 id="como-verificamos">Como verificamos</H2>
      <p>A cada mudança no código, um teste automático (axe-core) percorre as páginas públicas no modo claro e no escuro e bloqueia a publicação se houver falhas graves de acessibilidade, incluindo contraste e textos alternativos. Também testamos a navegação por teclado.</p>
      <H2 id="limitacoes">Limitações conhecidas</H2>
      <p>O protótipo de demonstração em /prototipo ainda não passa por essa verificação. Algumas fotos de terceiros têm só uma descrição curta.</p>
      <H2 id="barreiras">Encontrou uma barreira?</H2>
      <p>Conte para a gente: <Contato />.</p>
    </Layout>
  )
}

export function CreditsPage() {
  const withPhoto = monuments.filter((m) => m.photo)
  return (
    <Layout title="Créditos das imagens">
      <p>Cada foto exibida no site tem o autor e a fonte de origem abaixo. As fotos são de fotógrafos de órgãos de imprensa públicos e veículos de notícia; a autorização formal de uso ainda não foi obtida: o projeto vai pedi-la a cada autor ou trocar a foto por uma própria ou de licença livre. Se você é titular de alguma imagem e quer correção ou remoção, fale conosco: <Contato />.</p>
      <Table
        head={['Monumento', 'Autor', 'Fonte', 'Uso']}
        rows={withPhoto.map((m) => [
          m.name,
          m.photo!.credit,
          <a key="s" className="underline break-all" href={m.photo!.source}>{new URL(m.photo!.source).hostname.replace('www.', '')}</a>,
          m.photo!.license,
        ])}
      />
      <H2 id="outros">Outros elementos</H2>
      <p>Logo, ícones e ilustrações: criação do próprio projeto. Mapa do protótipo: imagens de satélite © Esri. Fontes dos textos: listadas no fim de cada página de monumento.</p>
    </Layout>
  )
}

export function AboutPage() {
  return (
    <Layout title="Sobre o projeto">
      <p>{ORG.nome} transforma as estátuas e praças de Maceió em convite para os museus da cidade: quem lê a placa conhece a história do homenageado e descobre onde continuar aprendendo.</p>
      <H2 id="dados">Dados do projeto</H2>
      <Table
        head={['Item', 'Informação']}
        rows={[
          ['Nome', ORG.nome],
          ['Natureza', ORG.natureza],
          ['Pessoa jurídica', ORG.pessoaJuridica],
          ['Responsável', ORG.responsavel],
          ['Local', ORG.cidade],
          ['Contato', <Contato key="c" />],
          ['Código aberto', <a key="r" className="underline break-all" href={ORG.repositorio}>{ORG.repositorio.replace('https://', '')}</a>],
        ]}
      />
      <H2 id="transparencia">Transparência</H2>
      <p>Não há anúncios, patrocínio pago nem avaliações ou depoimentos de usuários no site. Os números do painel de demonstração são simulados e indicados como tal.</p>
      <H2 id="ia">Uso de inteligência artificial</H2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Construção do site:</strong> o código, os testes e parte dos textos de interface foram feitos com ajuda de IA (Claude, da Anthropic). A equipe revisou tudo, e o código é aberto no GitHub.</li>
        <li><strong>Narração:</strong> a voz que lê a bio é sintetizada pelo próprio aparelho (leitor de voz do sistema). Não é a gravação de uma pessoa, e nada do que você ouve sai do celular.</li>
        <li><strong>Conteúdo histórico:</strong> é escrito e conferido pela equipe a partir das fontes citadas em cada página. A IA não inventa datas nem fatos, e erros podem ser relatados pelo botão "Informação errada".</li>
        <li><strong>Decisões sobre você:</strong> nenhuma decisão automatizada é tomada com seus dados (LGPD, art. 20).</li>
      </ul>
    </Layout>
  )
}
