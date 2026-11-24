// Memória Urbana Maceió · dados do protótipo
// Textos marcados com [colchetes] são preenchidos pela curadoria (diretriz do MVP).

export type Rarity = 'Comum' | 'Raro' | 'Lendário'
export type Method = 'qr' | 'nfc' | 'gps'

export interface Source { label: string; url: string }

export interface Monument {
  id: string
  plate: string
  name: string
  role: string
  years: string
  area: string
  address: string
  museum: { name: string; address: string; hours?: string; why: string } // "Como chegar": museu ou centro histórico para aprofundar
  kind: 'Estátua' | 'Busto' | 'Praça' | 'Patrimônio'
  group: 'orla' | 'centro' | 'igrejas' | 'jaragua' | 'bebedouro' | 'alto'
  visit: 'Aberto' | 'Restrito' | 'Fechado'
  visitNote?: string
  rarity: Rarity
  xp: number
  lat: number // posição real (aproximada) em Maceió
  lng: number
  x: number // posição no mapa estilizado
  y: number
  hue: string
  views: number
  change: number
  flow: number
  summary: string
  facts: [string, string][]
  photo?: { src: string; credit: string; source: string; license: string }
  sources: Source[]
  material?: 'Bronze' | 'Pedra' | 'Alvenaria' // para trilhas temáticas (ex.: Trilha de Bronze)
  person?: string // id da personalidade em src/graph.ts (grafo de conhecimento)
  origin?: { dataset: 'wikidata' | 'osm' | 'curadoria'; id: string; importedAt: string } // linhagem do dado (ETL)
  works?: string[]
  quote?: string
  tag: { type: 'NTAG216' | 'NTAG215' | 'NTAG213'; status: 'Ativa' | 'Placa danificada' | 'Sem leitura há 7 dias'; lastRead: string; pendingOffline: number }
}

// Conteúdo real, com fontes jornalísticas e oficiais (sem Wikipedia).
// Fotos: créditos de Secom Maceió / Agência Alagoas, exibidas com crédito, como divulgação institucional.
export const monuments: Monument[] = [
  {
    id: 'graciliano', plate: '01', name: 'Graciliano Ramos', role: 'Escritor', years: '1892 — 1953',
    person: 'graciliano-ramos', material: 'Bronze',
    area: 'Pajuçara', address: 'Calçadão da orla de Pajuçara', kind: 'Estátua', group: 'orla', visit: 'Aberto', rarity: 'Lendário', xp: 250,
    lat: -9.6668, lng: -35.7122, x: 168, y: 392, hue: '#2c8585', views: 1842, change: 18, flow: 96,
    summary: 'Graciliano Ramos nasceu em Quebrangulo (AL), em 27 de outubro de 1892. Foi prefeito de Palmeira dos Índios e, em Maceió, dirigiu a Imprensa Oficial e a Instrução Pública do estado, que hoje seria a Secretaria de Educação. Sua maior contribuição está nos livros: em Vidas Secas e São Bernardo, ele contou a vida dura do sertão de forma direta, sem enfeites. Morreu no Rio de Janeiro, em 20 de março de 1953. A estátua chegou à orla em 2015, nos 200 anos de Maceió.', museum: { name: 'Biblioteca Pública Estadual Graciliano Ramos', address: 'Praça Dom Pedro II, 57 · Centro', why: 'A biblioteca leva o nome dele e é o maior espaço de leitura de Alagoas. Bom lugar para ler Vidas Secas e São Bernardo.' },
    facts: [['Escultor', 'Léo Santana (MG), autor do Drummond de Copacabana'], ['Material', 'Bronze, tamanho real'], ['Inauguração', '30/11/2015 · Maceió 200 anos'], ['Visitação', 'Espaço público, 24 horas']],
    photo: { src: 'https://082noticias.com/wp-content/uploads/2022/01/Foto.MarcoAntnio.SecomMacei.jpg', credit: 'Marco Antônio / Secom Maceió', source: 'https://082noticias.com/cultura/um-monumento-a-ignorancia/', license: 'Reprodução com crédito ao autor; autorização de uso pendente (ver /creditos)' },
    works: ['Caetés', 'São Bernardo', 'Angústia', 'Vidas Secas', 'Memórias do Cárcere'],
    quote: 'A palavra não foi feita para enfeitar, brilhar como ouro falso; a palavra foi feita para dizer.',
    sources: [
      { label: 'TNH1 · Graciliano e Aurélio agora estão na orla (30/11/2015)', url: 'https://www.tnh1.com.br/noticia/nid/homenagens-graciliano-ramos-e-aurelio-buarque-agora-estao-na-orla-de-maceio/' },
      { label: 'Assembleia Legislativa de AL · Projeto Rodovia Graciliano Ramos (2015)', url: 'https://sapl.al.al.leg.br/media/sapl/public/materialegislativa/2015/55/55_texto_integral.pdf' },
      { label: '082 Notícias · foto Arquivo/Secom Maceió', url: 'https://082noticias.com/cultura/um-monumento-a-ignorancia/' },
    ],
    tag: { type: 'NTAG216', status: 'Ativa', lastRead: 'há 4 min', pendingOffline: 3 },
  },
  {
    id: 'paulo', plate: '02', name: 'Paulo Gracindo', role: 'Ator', years: '1911 — 1995',
    person: 'paulo-gracindo', material: 'Bronze',
    area: 'Pajuçara', address: 'Av. Dr. Antônio Gouveia, início da orla de Pajuçara', kind: 'Estátua', group: 'orla', visit: 'Aberto', rarity: 'Raro', xp: 150,
    lat: -9.6672, lng: -35.7148, x: 128, y: 438, hue: '#c4683a', views: 1108, change: 11, flow: 72,
    summary: 'Paulo Gracindo nasceu no Rio de Janeiro, em 16 de julho de 1911, mas viveu os primeiros 20 anos em Maceió, em Pajuçara. Por isso a estátua está aqui. Começou no teatro amador da cidade, ficou famoso na Rádio Nacional e depois na TV, onde viveu Odorico Paraguaçu, de O Bem-Amado, o papel que ele considerava o melhor da carreira. Morreu no Rio de Janeiro, em 4 de setembro de 1995. A estátua foi inaugurada em 14 de julho de 2017.', museum: { name: 'Museu da Imagem e do Som de Alagoas (Misa)', address: 'Rua Sá e Albuquerque, 275 · Jaraguá', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'O museu guarda a memória do rádio, da imagem e do som de Alagoas, as linguagens em que Paulo Gracindo fez carreira.' },
    facts: [['Escultor', 'Léo Santana'], ['Técnica', 'Modelada em argila e fundida em bronze'], ['Inauguração', '14/07/2017'], ['Nome de batismo', 'Pelópidas Guimarães Brandão Gracindo']],
    photo: { src: 'https://082noticias.com/wp-content/uploads/2022/01/OrladeMaceiEstatuaPauloGracindo-1024x683-1.jpg', credit: 'Pei Fon / Secom Maceió', source: 'https://www.cadaminuto.com.br/noticia/2017/07/14/prefeitura-inaugura-escultura-em-homenagem-ao-ator-paulo-gracindo-na-pajucara', license: 'Reprodução com crédito ao autor; autorização de uso pendente (ver /creditos)' },
    sources: [
      { label: 'Cada Minuto · Prefeitura inaugura escultura de Paulo Gracindo (14/07/2017)', url: 'https://www.cadaminuto.com.br/noticia/2017/07/14/prefeitura-inaugura-escultura-em-homenagem-ao-ator-paulo-gracindo-na-pajucara' },
      { label: 'TNH1 · Paulo Gracindo ganha estátua em Maceió (14/07/2017)', url: 'https://www.tnh1.com.br/noticia/nid/video-paulo-gracindo-ganha-estatua-em-maceio-foi-aqui-que-ele-morou-e-e-onde-sera-homenageado-diz-filho/' },
      { label: 'Tribuna Hoje · Maceió vai ganhar escultura do ator (12/07/2017)', url: 'https://tribunahoje.com/noticias/cidades/2017/07/12/68845-maceio-vai-ganhar-escultura-do-ator-paulo-gracindo' },
    ],
    tag: { type: 'NTAG216', status: 'Ativa', lastRead: 'há 12 min', pendingOffline: 0 },
  },
  {
    id: 'aurelio', plate: '03', name: 'Aurélio Buarque de Holanda', role: 'Lexicógrafo', years: '1910 — 1989',
    person: 'aurelio-buarque',
    area: 'Ponta Verde', address: 'Av. Álvaro Otacílio, orla da Ponta Verde', kind: 'Estátua', group: 'orla', visit: 'Aberto', rarity: 'Raro', xp: 150,
    lat: -9.6632, lng: -35.6977, x: 232, y: 302, hue: '#4d6fb3', views: 1526, change: 14, flow: 82,
    summary: 'Aurélio Buarque de Holanda nasceu em Passo de Camaragibe (AL), em 3 de maio de 1910, e se mudou com a família para Maceió aos 13 anos. Formou-se em Direito no Recife, em 1936, mas virou professor: deu aulas de Português, Literatura e Francês no Colégio Estadual de Alagoas e dirigiu a Biblioteca Municipal de Maceió. Sua maior contribuição é o dicionário lançado em 1975, tão usado que “Aurélio” virou sinônimo de dicionário. Morreu no Rio de Janeiro, em 28 de fevereiro de 1989.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'O instituto guarda documentos, fotos e objetos da história de Alagoas. Ajuda a entender a Maceió onde Aurélio cresceu, estudou e deu aulas.' },
    facts: [['Escultor', 'Léo Santana'], ['Pose', 'Sentado num banco, segurando os óculos'], ['Inauguração', '30/11/2015 · Maceió 200 anos'], ['Cuidado', 'Já teve os óculos quebrados por vandalismo']],
    sources: [
      { label: 'TNH1 · Orla ganha esculturas de Graciliano e Aurélio (28/11/2015)', url: 'https://www.tnh1.com.br/noticia/nid/orla-de-pajucara-ganha-esculturas-de-graciliano-ramos-e-aurelio-buarque/' },
      { label: 'TNH1 · Deboche com estátua de Aurélio causa revolta (15/03/2021)', url: 'https://www.tnh1.com.br/noticia/nid/video-deboche-com-estatua-de-aurelio-buarque-na-orla-de-maceio-viraliza-e-causa-revolta/' },
    ],
    tag: { type: 'NTAG216', status: 'Sem leitura há 7 dias', lastRead: 'há 7 dias', pendingOffline: 0 },
  },
  {
    id: 'nise', plate: '04', name: 'Nise da Silveira', role: 'Psiquiatra', years: '1905 — 1999',
    person: 'nise-da-silveira',
    area: 'Jatiúca', address: 'Corredor Vera Arruda', kind: 'Estátua', group: 'orla', visit: 'Aberto', rarity: 'Lendário', xp: 250,
    lat: -9.6487, lng: -35.7033, x: 285, y: 222, hue: '#9b5aa6', views: 984, change: 9, flow: 64,
    summary: 'Nise da Silveira nasceu em Maceió, em 15 de fevereiro de 1905. Estudou Medicina na Bahia e se formou em 1926, a única mulher numa turma de mais de 60 alunos. No Rio, trocou tratamentos violentos, como o eletrochoque, por pintura, modelagem e convivência com animais. Em 1952 criou o Museu de Imagens do Inconsciente, com obras feitas pelos pacientes. Morreu no Rio de Janeiro, em 30 de outubro de 1999. A estátua, com um gato no colo, foi inaugurada em 30 de julho de 2019.', museum: { name: 'Museu Palácio Floriano Peixoto (Mupa)', address: 'Praça dos Martírios, 517 · Centro', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'O antigo Palácio do Governo virou museu e expõe pinturas de artistas alagoanos. Um bom começo para ver como a arte conta a história de quem a faz.' },
    facts: [['Escultor', 'Léo Santana'], ['Local', 'Corredor Vera Arruda'], ['Inauguração', '30/07/2019 · FMAC'], ['Legado', 'Museu de Imagens do Inconsciente (1952)']],
    photo: { src: 'https://www.tnh1.com.br/media/_versions/legacy/1/2/59b9bc688572a188c21520c453078703f567692c_widelg.jpg', credit: 'Pei Fon / Secom Maceió', source: 'https://www.tnh1.com.br/noticia/nid/prefeito-inaugura-escultura-de-nise-da-silveira-no-vera-arruda/', license: 'Reprodução com crédito ao autor; autorização de uso pendente (ver /creditos)' },
    sources: [
      { label: 'TNH1/Secom · Prefeito inaugura escultura de Nise (30/07/2019)', url: 'https://www.tnh1.com.br/noticia/nid/prefeito-inaugura-escultura-de-nise-da-silveira-no-vera-arruda/' },
      { label: 'Psicologia USP · Maceió é uma cidade mítica (2007)', url: 'https://www.redalyc.org/pdf/3051/305123717006.pdf' },
      { label: 'USP · Seminário Nise da Silveira', url: 'https://edisciplinas.usp.br/pluginfile.php/5838326/mod_resource/content/1/Seminario%20Nise.pdf' },
    ],
    tag: { type: 'NTAG216', status: 'Placa danificada', lastRead: 'há 2 dias', pendingOffline: 1 },
  },
  {
    id: 'ledo', plate: '05', name: 'Lêdo Ivo', role: 'Poeta e escritor', years: '1924 — 2012',
    person: 'ledo-ivo',
    area: 'Jatiúca', address: 'Calçadão do Posto 7, Jatiúca', kind: 'Estátua', group: 'orla', visit: 'Aberto', rarity: 'Raro', xp: 150,
    lat: -9.6478, lng: -35.699, x: 318, y: 172, hue: '#3f8f5f', views: 702, change: 6, flow: 48,
    summary: 'Lêdo Ivo nasceu em Maceió, em 18 de fevereiro de 1924. Estudou no Recife e, aos 19 anos, foi para o Rio, onde se formou em Direito e trabalhou como jornalista. Escreveu poemas, romances e ensaios, muitos sobre Maceió e o mar de Alagoas, como o romance Ninho de Cobras (1973). Entrou para a Academia Brasileira de Letras em 1986. Morreu em Sevilha, na Espanha, em 23 de dezembro de 2012. A estátua foi inaugurada no Posto 7 em 3 de setembro de 2019.', museum: { name: 'Biblioteca Pública Estadual Graciliano Ramos', address: 'Praça Dom Pedro II, 57 · Centro', why: 'O maior espaço de leitura de Alagoas. Peça os livros de Lêdo Ivo e leia a Maceió que ele descreveu.' },
    facts: [['Escultor', 'Léo Santana'], ['Local', 'Calçadão do Posto 7'], ['Inauguração', '03/09/2019'], ['Na cerimônia', 'Família e Academia Alagoana de Letras']],
    photo: { src: 'https://www.tnh1.com.br/media/uploads/legacy/c/2/dcdac1d9deb179c19a5671589290908781d20d75.jpg', credit: 'Marco Antônio / Secom Maceió', source: 'https://www.tnh1.com.br/noticia/nid/estatua-de-ledo-ivo-e-inaugurada-no-calcadao-do-posto-7-em-maceio/', license: 'Reprodução com crédito ao autor; autorização de uso pendente (ver /creditos)' },
    sources: [
      { label: 'TNH1 · Estátua de Lêdo Ivo é inaugurada no Posto 7 (03/09/2019)', url: 'https://www.tnh1.com.br/noticia/nid/estatua-de-ledo-ivo-e-inaugurada-no-calcadao-do-posto-7-em-maceio/' },
      { label: 'TNH1/Secom · Prefeitura inaugura mais uma estátua na orla (02/09/2019)', url: 'https://www.tnh1.com.br/noticia/nid/prefeitura-inaugura-mais-uma-estatua-na-orla-nesta-terca-feira/' },
    ],
    tag: { type: 'NTAG215', status: 'Ativa', lastRead: 'há 1 h', pendingOffline: 0 },
  },
  {
    id: 'emilio', plate: '06', name: 'Praça Emílio de Maya', role: 'Busto do escritor', years: 'Revitalizada em 2025',
    person: 'emilio-de-maya', material: 'Bronze',
    area: 'Ponta Verde', address: 'Praça Emílio de Maya, Ponta Verde', kind: 'Busto', group: 'orla', visit: 'Aberto', rarity: 'Comum', xp: 80,
    lat: -9.661, lng: -35.7005, x: 204, y: 326, hue: '#b8862b', views: 588, change: 4, flow: 41,
    summary: 'Emílio de Maya nasceu no Engenho Patrocínio, em Atalaia (AL), em 25 de junho de 1906. Formou-se em Direito no Recife, em 1929, e foi advogado, jornalista e poeta. Eleito deputado federal em 1934, escreveu O Brasil e o Drama do Petróleo. Morreu jovem, no Rio de Janeiro, em 13 de março de 1939; seus poemas foram reunidos depois no livro Pétalas Esparsas. O busto de bronze da praça é obra de Bibiano Silva e foi restaurado em 2025.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'O instituto guarda documentos e objetos da história política de Alagoas, o cenário em que Emílio atuou.' },
    facts: [['Escultor do busto', 'Bibiano Silva'], ['Obras do homenageado', '“O Brasil e o Drama do Petróleo”, “Pétalas Esparsas”'], ['Revitalização', '07/02/2025 · Prefeitura de Maceió'], ['Área', 'Mais de mil m²']],
    sources: [
      { label: 'Prefeitura de Maceió · Praça Emílio de Maya revitalizada (08/02/2025)', url: 'https://maceio.al.gov.br/noticias/iplan/prefeitura-de-maceio-entrega-praca-emilio-de-maya-revitalizada' },
      { label: 'Prefeitura de Maceió/Iplan · Emílio Eliseu de Maya', url: 'https://maceio.al.gov.br/p/iplan/emilio-eliseu-de-maya' },
    ],
    tag: { type: 'NTAG215', status: 'Ativa', lastRead: 'há 3 h', pendingOffline: 0 },
  },
  {
    id: 'martirios', plate: '07', name: 'Praça dos Martírios', role: 'Monumento a Floriano Peixoto', years: 'Inaugurada em 1908',
    person: 'floriano-peixoto',
    area: 'Centro', address: 'Praça Marechal Floriano Peixoto, Centro', kind: 'Praça', group: 'centro', visit: 'Aberto', rarity: 'Lendário', xp: 250,
    lat: -9.6658, lng: -35.7352, x: 62, y: 522, hue: '#a14a4a', views: 1210, change: 12, flow: 70,
    summary: 'A praça foi inaugurada em 24 de dezembro de 1908 e ganhou o nome de Marechal Floriano Peixoto por causa do monumento a ele. Floriano nasceu em Ipioca, hoje parte de Maceió, em 30 de abril de 1839, e estudou primeiro em Maceió. Lutou na Guerra do Paraguai e foi o segundo presidente do Brasil, de 1891 a 1894, conhecido como “Marechal de Ferro”. Morreu em Barra Mansa (RJ), em 29 de junho de 1895.', museum: { name: 'Museu Palácio Floriano Peixoto (Mupa)', address: 'Praça dos Martírios, 517 · Centro', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'Fica na própria praça. O antigo Palácio do Governo hoje é museu, com móveis, pratarias e pinturas de artistas alagoanos.' },
    facts: [['Inauguração', '24/12/1908 · Gov. Euclides Malta'], ['Tombamento', 'Patrimônio Estadual · Decreto nº 38.309/2000'], ['Entorno', 'Palácio Floriano Peixoto, Igreja dos Martírios, Pierre Chalita'], ['Revitalização', '04/05/2023 · fonte luminosa recuperada']],
    photo: { src: 'https://img.dhost.cloud/egLaEmwDbcshBJ4T2oFTrra-TJ0=/1280x720/smart/https://tdan.nyc3.digitaloceanspaces.com/images/688f9/5abbfa67874ce993e9650b718602cf25d11.jpg', credit: 'Marco Antônio / Agência Alagoas', source: 'https://www.tribunadosertao.com.br/alagoas/2023/05/03/498583-governador-inaugura-revitalizacao-da-praca-marechal-floriano-nesta-quinta-5', license: 'Reprodução com crédito ao autor; autorização de uso pendente (ver /creditos)' },
    sources: [
      { label: 'Agência Alagoas via Tribuna do Sertão · Revitalização da Praça Marechal Floriano (03/05/2023)', url: 'https://www.tribunadosertao.com.br/alagoas/2023/05/03/498583-governador-inaugura-revitalizacao-da-praca-marechal-floriano-nesta-quinta-5' },
      { label: 'Tribuna do Sertão · Paulo Dantas inaugura revitalização (04/05/2023)', url: 'https://www.tribunadosertao.com.br/alagoas/2023/05/04/498764-paulo-dantas-inaugura-revitalizacao-da-praca-floriano-peixoto' },
    ],
    tag: { type: 'NTAG216', status: 'Ativa', lastRead: 'há 20 min', pendingOffline: 0 },
  },
  {
    id: 'sinimbu', plate: '08', name: 'Praça Sinimbu', role: 'Monumento ao Visconde de Sinimbu', years: 'Revitalizada em 2020',
    person: 'visconde-de-sinimbu', material: 'Bronze',
    area: 'Centro', address: 'Praça Visconde de Sinimbu, Centro', kind: 'Praça', group: 'centro', visit: 'Aberto', rarity: 'Raro', xp: 150,
    lat: -9.6688, lng: -35.7326, x: 98, y: 498, hue: '#6b6b8f', views: 431, change: 3, flow: 33,
    summary: 'A praça homenageia João Lins Vieira Cansanção de Sinimbu, o Visconde de Sinimbu. Ele nasceu em São Miguel dos Campos (AL), em 20 de novembro de 1810. Formou-se em Direito em Olinda e completou os estudos na Alemanha. Governou as províncias de Alagoas, Sergipe, Rio Grande do Sul e Bahia, foi ministro e chefiou o governo do Império entre 1878 e 1880. Morreu no Rio de Janeiro, em 27 de dezembro de 1906, aos 96 anos.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'O instituto guarda a história de Alagoas no tempo do Império, quando Sinimbu governou a província.' },
    facts: [['Homenageado', 'Visconde de Sinimbu (São Miguel dos Campos)'], ['Restauração', 'Monumento restaurado em 12/2020'], ['Nova escultura', 'Jorge de Lima, em bronze'], ['Vizinha', 'Casa Jorge de Lima · Academia Alagoana de Letras']],
    photo: { src: 'https://www.tnh1.com.br/media/uploads/legacy/6/c/ed59f50243d5c861fd3a806642cffbd02905768a.jpg', credit: 'Marco Antonio / Secom Maceió', source: 'https://www.tnh1.com.br/noticia/nid/tradicional-praca-sinimbu-em-maceio-e-revitalizada-veja-fotos-de-como-ficou/', license: 'Reprodução com crédito ao autor; autorização de uso pendente (ver /creditos)' },
    sources: [
      { label: 'TNH1/Secom · Praça Sinimbu é revitalizada (18/12/2020)', url: 'https://www.tnh1.com.br/noticia/nid/tradicional-praca-sinimbu-em-maceio-e-revitalizada-veja-fotos-de-como-ficou/' },
      { label: 'TNH1 · Academia Alagoana de Letras, Casa Jorge de Lima', url: 'https://www.tnh1.com.br/noticia/nid/jurista-fabio-lins-da-palestra-hoje-na-academia-alagoana-de-letras/' },
    ],
    tag: { type: 'NTAG215', status: 'Ativa', lastRead: 'há 2 h', pendingOffline: 0 },
  },
  {
    id: 'montepio', plate: '09', name: 'Praça Montepio dos Artistas', role: 'Busto de Bráulio Cavalcanti', years: 'Busto de 1917',
    person: 'braulio-cavalcante',
    area: 'Centro', address: 'Praça Montepio dos Artistas, Centro', kind: 'Busto', group: 'centro', visit: 'Aberto', rarity: 'Comum', xp: 80,
    lat: -9.6651, lng: -35.7386, x: 42, y: 556, hue: '#8a6a3a', views: 377, change: 2, flow: 29,
    summary: 'A praça abrigou o Monte Pio dos Artistas a partir de 1890 e hoje também leva o nome de Bráulio Cavalcante. Ele nasceu em Pão de Açúcar (AL), em 14 de março de 1887, estudou em Maceió e se formou em Direito no Recife, em 1911. Poeta e jornalista, era líder da oposição ao governo de Euclides Malta. Foi morto a tiros em 10 de março de 1912, num protesto em frente ao Palácio do Governo, quatro dias antes de fazer 25 anos. O busto foi inaugurado em 16 de setembro de 1917.', museum: { name: 'Museu Palácio Floriano Peixoto (Mupa)', address: 'Praça dos Martírios, 517 · Centro', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'Bráulio foi morto em frente a este prédio, que era o Palácio do Governo. Hoje é museu e ajuda a entender aquele momento da história de Alagoas.' },
    facts: [['Busto', 'Bráulio Cavalcanti, inaugurado em 16/09/1917'], ['Homenageado', 'Advogado nascido em Pão de Açúcar'], ['Revitalização', '22/01/2025 · 1.207 m²'], ['Projeto', 'Iplan · execução Seminfra']],
    photo: { src: 'https://prefeitura.maceio.cloud/imagens/Foto-22-01-2025-17-50-33.jpg', credit: 'Itawi Albuquerque / Secom Maceió', source: 'https://maceio.al.gov.br/noticias/gp/prefeitura-de-maceio-entrega-revitalizacao-da-praca-montepio-dos-artistas', license: 'Reprodução com crédito ao autor; autorização de uso pendente (ver /creditos)' },
    sources: [
      { label: 'Prefeitura de Maceió · Entrega da revitalização (23/01/2025)', url: 'https://maceio.al.gov.br/noticias/gp/prefeitura-de-maceio-entrega-revitalizacao-da-praca-montepio-dos-artistas' },
      { label: 'Prefeitura de Maceió/Iplan · Praça volta a ser ponto de convivência (23/01/2025)', url: 'https://maceio.al.gov.br/noticias/iplan/praca-montepio-dos-artistas-volta-a-ser-ponto-de-convivencia-no-centro-de-maceio' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'há 5 h', pendingOffline: 0 },
  },
  {
    id: 'pedro2', plate: '10', name: 'Praça Dom Pedro II', role: 'Busto do Imperador', years: 'Centro histórico',
    person: 'dom-pedro-ii',
    area: 'Centro', address: 'Praça Dom Pedro II, Centro', kind: 'Busto', group: 'centro', visit: 'Aberto', rarity: 'Comum', xp: 80,
    lat: -9.6669, lng: -35.737, x: 80, y: 560, hue: '#2f5f73', views: 410, change: 3, flow: 31,
    summary: 'No coração do Centro, a praça já se chamou Praça do Pelourinho, do Tesouro, da Catedral e da Assembleia. O busto, diante da Catedral, homenageia Dom Pedro II. Ele nasceu no Rio de Janeiro, em 2 de dezembro de 1825, e governou o Brasil como imperador de 1840 a 1889. Em 1859, passou por Alagoas numa longa viagem pelo Nordeste. Com a chegada da República, foi para o exílio e morreu em Paris, em 5 de dezembro de 1891.', museum: { name: 'Biblioteca Pública Estadual Graciliano Ramos', address: 'Praça Dom Pedro II, 57 · Centro', why: 'Fica na própria praça. A biblioteca estadual guarda obras raras e é o maior espaço de leitura de Alagoas.' },
    facts: [['Busto', 'Imperador Dom Pedro II'], ['Nomes antigos', 'Pelourinho, Tesouro, Catedral, Assembleia'], ['Entorno', 'Catedral Metropolitana N. Sra. dos Prazeres'], ['Foto', '[A FOTOGRAFAR pela curadoria]']],
    sources: [
      { label: 'IBGE · Biblioteca, cartão postal “Praça Dom Pedro II: Maceió, AL”', url: 'https://biblioteca.ibge.gov.br/index.php/biblioteca-catalogo?view=detalhes&id=436593' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'há 6 h', pendingOffline: 0 },
  },
  {
    id: 'lucena', plate: '11', name: 'Praça Lucena Maranhão', role: 'Coração do Bebedouro', years: 'Antiga Praça Santo Antônio',
    area: 'Bebedouro', address: 'Praça Coronel Lucena Maranhão, Bebedouro', kind: 'Praça', group: 'bebedouro', visit: 'Restrito',
    visitNote: 'Bairro desocupado pelo afundamento do solo causado pela mineração de sal-gema. Acesso só em eventos autorizados — siga a Defesa Civil.',
    rarity: 'Lendário', xp: 250, lat: -9.6244, lng: -35.7582, x: 22, y: 352, hue: '#7a4a2a', views: 214, change: 21, flow: 8,
    summary: 'Antiga Praça Santo Antônio, em frente à igreja matriz, a praça é considerada o coração do Bebedouro e referência cultural de Maceió. Ali ensaiava o Coco de Roda Reviver, criado em 2000 por coroinhas da igreja. Com o afundamento do solo, o bairro foi esvaziado; em 24 de dezembro de 2025 a Arquidiocese voltou a celebrar a missa de Natal diante da antiga matriz.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'O instituto reúne documentos, fotos e objetos da história de Alagoas. [Curadoria: indicar peças ligadas ao Bebedouro.]' },
    facts: [['Situação', 'Área afetada pelo afundamento do solo (Braskem)'], ['Memória viva', 'Coco de Roda Reviver, desde 2000'], ['Última reforma', 'Ordem de serviço em 18/06/2016'], ['Visitação', 'Restrita · só em eventos autorizados']],
    sources: [
      { label: 'MPF · Visita técnica aos bairros afetados pela Braskem', url: 'https://www.mpf.mp.br/o-mpf/unidades/pr-al/noticias/membros-do-mpf-de-alagoas-e-da-5a-regiao-realizam-visita-tecnica-a-bairros-afetados-pela-braskem-em-maceio' },
      { label: 'TNH1 · História e cultura sendo recuperados no Pinheiro e região', url: 'https://www.tnh1.com.br/conteudo/noticia/nid/como-fica-maceio-historia-e-cultura-estao-sendo-recuperados-no-pinheiro-e-regiao/' },
      { label: 'Tribuna do Sertão · Natal em Bebedouro (28/12/2025)', url: 'https://www.tribunadosertao.com.br/cidades/2025/12/28/837446-natal-em-bebedouro-a-luz-da-fe-no-epicentro-do-descaso' },
      { label: 'TNH1/Secom · Ordem de serviço para reforma da praça (18/06/2016)', url: 'https://www.tnh1.com.br/noticia/nid/prefeito-assina-ordem-de-servico-para-reforma-da-praca-lucena-maranhao/' },
    ],
    tag: { type: 'NTAG216', status: 'Sem leitura há 7 dias', lastRead: 'há 9 dias', pendingOffline: 0 },
  },
  {
    id: 'santoantonio', plate: '12', name: 'Igreja de Santo Antônio de Pádua', role: 'Antiga matriz do Bebedouro', years: 'Século XIX',
    area: 'Bebedouro', address: 'Em frente à Praça Lucena Maranhão, Bebedouro', kind: 'Patrimônio', group: 'bebedouro', visit: 'Fechado',
    visitNote: 'Fechada à visitação: está na área desocupada e passa por restauração. Conheça pela página, em 3D e em RA.',
    rarity: 'Raro', xp: 150, lat: -9.6238, lng: -35.7576, x: 40, y: 334, hue: '#8a5a3a', views: 156, change: 18, flow: 0,
    summary: 'Edificação do século XIX diante da Praça Lucena Maranhão. No trabalho de restauração, especialistas em patrimônio revelaram uma arte que até então só era conhecida em igrejas como a Catedral. A recuperação de prédios históricos do Bebedouro faz parte das medidas de compensação pelo afundamento do solo.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'O instituto reúne documentos, fotos e objetos da história de Alagoas. [Curadoria: indicar peças ligadas ao Bebedouro.]' },
    facts: [['Época', 'Século XIX'], ['Situação', 'Em restauração · área desocupada'], ['Destaque', 'Pinturas reveladas na restauração'], ['Visitação', 'Fechada']],
    sources: [
      { label: 'TNH1 · História e cultura sendo recuperados no Pinheiro e região', url: 'https://www.tnh1.com.br/conteudo/noticia/nid/como-fica-maceio-historia-e-cultura-estao-sendo-recuperados-no-pinheiro-e-regiao/' },
      { label: 'TNH1 · Caso Braskem: recuperação de prédios históricos (03/12/2024)', url: 'https://www.tnh1.com.br/noticia/nid/caso-braskem-esqueceram-de-tombar-o-hospital-sanatorio/' },
    ],
    tag: { type: 'NTAG216', status: 'Ativa', lastRead: 'há 3 dias', pendingOffline: 0 },
  },
  {
    id: 'solarnunes', plate: '13', name: 'Solar Nunes', role: 'Casarão histórico', years: 'Século XIX',
    area: 'Bebedouro', address: 'Próximo à Igreja de Santo Antônio, Bebedouro', kind: 'Patrimônio', group: 'bebedouro', visit: 'Fechado',
    visitNote: 'Fechado à visitação: imóvel em área desocupada pelo afundamento do solo.',
    rarity: 'Comum', xp: 80, lat: -9.6256, lng: -35.7599, x: 52, y: 372, hue: '#6a5a4a', views: 98, change: 12, flow: 0,
    summary: 'Casarão do século XIX vizinho à Igreja de Santo Antônio, passou por um trabalho delicado de recuperação dentro das ações de preservação do patrimônio do Bebedouro, um dos cinco bairros atingidos pelo afundamento do solo em Maceió.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'O instituto reúne documentos, fotos e objetos da história de Alagoas. [Curadoria: indicar peças ligadas ao Bebedouro.]' },
    facts: [['Época', 'Século XIX'], ['Situação', 'Recuperado · área desocupada'], ['Bairros afetados', 'Pinheiro, Mutange, Bebedouro, Bom Parto e parte do Farol'], ['Visitação', 'Fechada']],
    sources: [
      { label: 'TNH1 · História e cultura sendo recuperados no Pinheiro e região', url: 'https://www.tnh1.com.br/conteudo/noticia/nid/como-fica-maceio-historia-e-cultura-estao-sendo-recuperados-no-pinheiro-e-regiao/' },
      { label: 'TNH1 · Relatório identifica obras afetadas por afundamento de solo', url: 'https://www.tnh1.com.br/noticia/nid/relatorio-identifica-obras-arquitetonicas-afetadas-por-afundamento-de-solo/' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'há 6 dias', pendingOffline: 0 },
  },
  {
    id: 'farol', plate: '14', name: 'Farol de Maceió', role: 'Símbolo da história naval', years: 'Transferido em 1949',
    area: 'Jacintinho', address: 'Vila do Farol, Jacintinho', kind: 'Patrimônio', group: 'alto', visit: 'Restrito',
    visitNote: 'Visitas agendadas com a Capitania dos Portos de Alagoas (Marinha).',
    rarity: 'Lendário', xp: 250, lat: -9.644, lng: -35.724, x: 150, y: 288, hue: '#b8862b', views: 330, change: 9, flow: 22,
    summary: 'O farol que deu nome ao bairro ficava no antigo Alto do Jacutinga. Depois de uma catástrofe que atingiu a cidade em 1949, foi transferido para o Jacintinho. Tornou-se símbolo da história naval de Maceió e recebe visitas de escolas acompanhadas por militares da Capitania dos Portos.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'O instituto reúne documentos, fotos e objetos da história de Alagoas. [Curadoria: indicar peças ligadas ao Farol.]' },
    facts: [['Local original', 'Bairro do Farol (antigo Alto do Jacutinga)'], ['Transferência', '1949, para o Jacintinho'], ['Responsável', 'Marinha · Capitania dos Portos de Alagoas'], ['Visitação', 'Restrita · com agendamento']],
    sources: [
      { label: 'Marinha do Brasil (Com3ºDN) · Farol de Maceió recebe alunos (19/05/2016)', url: 'https://www.marinha.mil.br/com3dn/node/600' },
      { label: 'Marinha do Brasil (Com3ºDN) · Visita ao Farol de Maceió', url: 'https://www.marinha.mil.br/com3dn/node/1650' },
    ],
    tag: { type: 'NTAG215', status: 'Ativa', lastRead: 'há 1 dia', pendingOffline: 0 },
  },
  {
    id: 'ufal', plate: '15', name: 'Ufal · Campus A. C. Simões', role: 'Centro de Interesse Comunitário', years: 'Universidade Federal de Alagoas',
    area: 'Tabuleiro do Martins', address: 'Campus A. C. Simões, Tabuleiro do Martins', kind: 'Patrimônio', group: 'alto', visit: 'Aberto',
    visitNote: 'Aberto ao público nas atividades culturais gratuitas do CIC.',
    rarity: 'Comum', xp: 80, lat: -9.5548, lng: -35.7743, x: 118, y: 150, hue: '#2f5f73', views: 520, change: 15, flow: 38,
    summary: 'O principal campus da Universidade Federal de Alagoas fica no Tabuleiro do Martins. Atrás da praça dos bancos, o Centro de Interesse Comunitário (CIC) recebe atividades gratuitas abertas ao público — oficinas de percussão, dança, música e encontros de arte urbana.', museum: { name: 'Museu Théo Brandão de Antropologia e Folclore (Ufal)', address: 'Av. da Paz, 1490 · Centro', why: 'O museu da Ufal reúne arte popular e folguedos de Alagoas, a partir da coleção doada pelo professor Théo Brandão. Confirme o horário antes de ir.' },
    facts: [['Bairro', 'Tabuleiro do Martins'], ['Espaço cultural', 'CIC, atrás da praça dos bancos'], ['Programação', 'Dança, música e arte urbana gratuitas'], ['Visitação', 'Aberta nas atividades']],
    sources: [
      { label: 'Tribuna do Sertão · Projeto Circularte na Ufal (19/08/2025)', url: 'https://tribunadosertao.com.br/noticias/2025/08/19/710967-projeto-circularte-promove-atividades-de-danca-e-musica-na-ufal' },
      { label: 'Tribuna do Sertão · Vozes da Rua no CIC da Ufal (26/05/2026)', url: 'https://www.tribunadosertao.com.br/alagoas/2026/05/26/908434-evento-vozes-da-rua-arte-resistencia-e-expressao-promove-encontro-entre-arte-urbana-cultura-e-universidade' },
    ],
    tag: { type: 'NTAG215', status: 'Ativa', lastRead: 'há 2 h', pendingOffline: 0 },
  },
  {
    id: 'catedral', plate: '16', name: 'Catedral Metropolitana de Maceió', role: 'Catedral de Nossa Senhora dos Prazeres', years: 'Século XIX',
    area: 'Centro', address: 'Praça Dom Pedro II, Centro', kind: 'Patrimônio', group: 'centro', visit: 'Aberto', rarity: 'Lendário', xp: 250,
    lat: -9.6654, lng: -35.7356, x: 70, y: 540, hue: '#7a5c3a', views: 0, change: 0, flow: 0,
    summary: 'A Catedral Metropolitana de Nossa Senhora dos Prazeres é a igreja mais importante de Maceió e fica de frente para a Praça Dom Pedro II. Foi construída no século XIX, quando Maceió deixou de ser vila e virou a capital da província de Alagoas, em 1839. Nossa Senhora dos Prazeres é a padroeira da cidade. Ao redor da catedral nasceu o centro político de Alagoas, com a Assembleia Legislativa e a Biblioteca Pública na mesma praça.', museum: { name: 'Biblioteca Pública Estadual Graciliano Ramos', address: 'Praça Dom Pedro II, 57 · Centro', why: 'Fica na mesma praça. Lá estão jornais e livros antigos que contam como o Centro cresceu em volta da catedral.' },
    facts: [['Padroeira', 'Nossa Senhora dos Prazeres, padroeira de Maceió'], ['Local', 'Praça Dom Pedro II, Centro'], ['Vizinhos', 'Assembleia Legislativa e Biblioteca Pública'], ['Dado aberto', 'Wikidata Q67176290']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Catedral_metropolitana_maceio.JPG/1280px-Catedral_metropolitana_maceio.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Aleposta', source: 'https://commons.wikimedia.org/wiki/File:Catedral_metropolitana_maceio.JPG', license: 'CC BY-SA 4.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q67176290', importedAt: '2026-11-24' },
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q67176290' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Catedral_metropolitana_maceio.JPG' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.66538&mlon=-35.73561#map=19/-9.66538/-35.73561' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'tavaresbastos', plate: '17', name: 'Palácio Tavares Bastos', role: 'Sede da Assembleia Legislativa', years: 'Século XIX',
    area: 'Centro', address: 'Praça Dom Pedro II, Centro', kind: 'Patrimônio', group: 'centro', visit: 'Aberto', rarity: 'Raro', xp: 150,
    lat: -9.6659, lng: -35.7358, x: 84, y: 528, hue: '#5d6f8a', views: 0, change: 0, flow: 0,
    summary: 'O Palácio Tavares Bastos é a sede da Assembleia Legislativa de Alagoas, na Praça Dom Pedro II. O nome homenageia Aureliano Cândido Tavares Bastos, nascido em Alagoas em 1839. Deputado no Império, ele defendeu a abertura do rio Amazonas à navegação, a descentralização do poder e o fim da escravidão. Morreu jovem, em 1875. O prédio é um dos marcos da arquitetura do Centro e da vida política do estado.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'Guarda documentos da política alagoana no Império, o tempo de Tavares Bastos.' },
    facts: [['Uso atual', 'Assembleia Legislativa de Alagoas'], ['Homenageado', 'Tavares Bastos (1839–1875)'], ['Local', 'Praça Dom Pedro II'], ['Dado aberto', 'Wikidata Q59360376']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/ASSEMBL%C3%89IA_LEGISLATIVA_ESTADUAL_MACEIO.JPG/1280px-ASSEMBL%C3%89IA_LEGISLATIVA_ESTADUAL_MACEIO.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Aleposta', source: 'https://commons.wikimedia.org/wiki/File:ASSEMBL%C3%89IA_LEGISLATIVA_ESTADUAL_MACEIO.JPG', license: 'CC BY-SA 4.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q59360376', importedAt: '2026-11-24' }, person: 'tavares-bastos',
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q59360376' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:ASSEMBL%C3%89IA_LEGISLATIVA_ESTADUAL_MACEIO.JPG' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.66593&mlon=-35.73583#map=19/-9.66593/-35.73583' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'bomjesus', plate: '18', name: 'Igreja Bom Jesus dos Martírios', role: 'Igreja de fachada de azulejos', years: 'Século XIX',
    area: 'Centro', address: 'Praça dos Martírios, Centro', kind: 'Patrimônio', group: 'igrejas', visit: 'Aberto', rarity: 'Lendário', xp: 250,
    lat: -9.6600, lng: -35.7387, x: 84, y: 506, hue: '#3f6fa0', views: 0, change: 0, flow: 0,
    summary: 'A Igreja do Senhor Bom Jesus dos Martírios fica na Praça dos Martírios, ao lado do antigo Palácio do Governo. Chama atenção pela fachada coberta de azulejos e pelas torres, que fazem dela um dos cartões-postais do Centro. É patrimônio histórico de Alagoas e dá nome à praça onde está o monumento a Floriano Peixoto. Por dentro, guarda imagens e altares da devoção popular do século XIX.', museum: { name: 'Museu Palácio Floriano Peixoto (Mupa)', address: 'Praça dos Martírios, 517 · Centro', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'Fica do outro lado da praça. O museu mostra a Maceió do tempo em que a igreja foi erguida.' },
    facts: [['Destaque', 'Fachada de azulejos'], ['Local', 'Praça dos Martírios'], ['Proteção', 'Patrimônio histórico'], ['Dado aberto', 'Wikidata Q67176292']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Igreja_dos_Mart%C3%ADrios%2C_RELU.jpg/1280px-Igreja_dos_Mart%C3%ADrios%2C_RELU.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Grupo de Pesquisa Representações do Lugar (RELU)', source: 'https://commons.wikimedia.org/wiki/File:Igreja_dos_Mart%C3%ADrios,_RELU.jpg', license: 'CC BY-SA 4.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q67176292', importedAt: '2026-11-24' },
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q67176292' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Igreja_dos_Mart%C3%ADrios,_RELU.jpg' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.65995&mlon=-35.73866#map=19/-9.65995/-35.73866' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'rosario', plate: '19', name: 'Igreja de Nossa Senhora do Rosário dos Pretos', role: 'Igreja da irmandade negra', years: 'Século XIX',
    area: 'Centro', address: 'Centro de Maceió', kind: 'Patrimônio', group: 'igrejas', visit: 'Aberto', rarity: 'Raro', xp: 150,
    lat: -9.6632, lng: -35.7370, x: 56, y: 494, hue: '#6a4a7a', views: 0, change: 0, flow: 0,
    summary: 'A Igreja de Nossa Senhora do Rosário dos Pretos foi erguida pela irmandade dos homens negros de Maceió. No tempo da escravidão, as irmandades do Rosário eram um dos poucos espaços em que pessoas negras, escravizadas ou livres, podiam se organizar, juntar dinheiro, ajudar umas às outras e garantir um enterro digno. A igreja é um registro dessa história de resistência no Centro da cidade e é patrimônio histórico.', museum: { name: 'Museu Théo Brandão de Antropologia e Folclore', address: 'Av. da Paz, 1490 · Centro', hours: 'Ter. a sex., 9h às 17h', why: 'O museu da Ufal guarda a cultura popular e afro-alagoana, que nasceu em espaços como as irmandades.' },
    facts: [['Quem construiu', 'Irmandade do Rosário dos Homens Pretos'], ['Local', 'Centro'], ['Tema', 'Memória negra de Maceió'], ['Dado aberto', 'Wikidata Q67176294']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Igreja_de_Nossa_Senhora_do_Ros%C3%A1rio_dos_Pretos%2C_RELU_%2802%29.jpg/1280px-Igreja_de_Nossa_Senhora_do_Ros%C3%A1rio_dos_Pretos%2C_RELU_%2802%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Grupo de Pesquisa Representações do Lugar (RELU)', source: 'https://commons.wikimedia.org/wiki/File:Igreja_de_Nossa_Senhora_do_Ros%C3%A1rio_dos_Pretos,_RELU_(02).jpg', license: 'CC BY-SA 4.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q67176294', importedAt: '2026-11-24' },
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q67176294' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Igreja_de_Nossa_Senhora_do_Ros%C3%A1rio_dos_Pretos,_RELU_(02).jpg' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.66317&mlon=-35.73701#map=19/-9.66317/-35.73701' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'livramento', plate: '20', name: 'Igreja de Nossa Senhora do Livramento', role: 'Igreja do Centro antigo', years: 'Século XIX',
    area: 'Centro', address: 'Rua do Livramento, Centro', kind: 'Patrimônio', group: 'igrejas', visit: 'Aberto', rarity: 'Comum', xp: 80,
    lat: -9.6648, lng: -35.7383, x: 70, y: 530, hue: '#8a7a4a', views: 0, change: 0, flow: 0,
    summary: 'A Igreja de Nossa Senhora do Livramento é uma das igrejas antigas do Centro de Maceió e deu nome à rua onde está. Faz parte do conjunto de igrejas que marcaram o crescimento da cidade no século XIX, quando Maceió virou capital e o comércio do porto de Jaraguá trouxe gente e riqueza. É patrimônio histórico e segue aberta à comunidade.', museum: { name: 'Instituto Histórico e Geográfico de Alagoas', address: 'Rua do Sol, 382 · Centro', hours: 'Seg. a sex., 8h às 12h e 14h às 17h', why: 'Mapas e fotos antigas mostram as ruas do Centro em volta das igrejas.' },
    facts: [['Local', 'Rua do Livramento, Centro'], ['Época', 'Século XIX'], ['Proteção', 'Patrimônio histórico'], ['Dado aberto', 'Wikidata Q67176293']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Igreja_de_Nossa_Senhora_do_Livramento%2C_RELU.jpg/1280px-Igreja_de_Nossa_Senhora_do_Livramento%2C_RELU.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Grupo de Pesquisa Representações do Lugar (RELU)', source: 'https://commons.wikimedia.org/wiki/File:Igreja_de_Nossa_Senhora_do_Livramento,_RELU.jpg', license: 'CC BY-SA 4.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q67176293', importedAt: '2026-11-24' },
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q67176293' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Igreja_de_Nossa_Senhora_do_Livramento,_RELU.jpg' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.66479&mlon=-35.73830#map=19/-9.66479/-35.73830' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'saogoncalo', plate: '21', name: 'Capela de São Gonçalo do Amarante', role: 'Capela histórica', years: 'Antiga',
    area: 'Centro', address: 'Centro de Maceió', kind: 'Patrimônio', group: 'igrejas', visit: 'Aberto', rarity: 'Comum', xp: 80,
    lat: -9.6632, lng: -35.7333, x: 84, y: 518, hue: '#9a6a5a', views: 0, change: 0, flow: 0,
    summary: 'A Capela de São Gonçalo do Amarante é uma das pequenas igrejas históricas do Centro de Maceió. São Gonçalo é um santo português muito popular no Nordeste, ligado às festas e à dança de São Gonçalo, tradição da cultura popular alagoana. A capela é patrimônio histórico e ajuda a contar como a fé e as festas populares moldaram as ruas do Centro.', museum: { name: 'Museu Théo Brandão de Antropologia e Folclore', address: 'Av. da Paz, 1490 · Centro', hours: 'Ter. a sex., 9h às 17h', why: 'O museu tem acervo das danças e festas populares de Alagoas, como as ligadas a São Gonçalo.' },
    facts: [['Santo', 'São Gonçalo do Amarante'], ['Tradição', 'Dança de São Gonçalo'], ['Proteção', 'Patrimônio histórico'], ['Dado aberto', 'Wikidata Q67176288']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Capela_de_S%C3%A3o_Gon%C3%A7alo_de_Amarante_a_beleza_do_Farol.jpg/1280px-Capela_de_S%C3%A3o_Gon%C3%A7alo_de_Amarante_a_beleza_do_Farol.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Blogilberto', source: 'https://commons.wikimedia.org/wiki/File:Capela_de_S%C3%A3o_Gon%C3%A7alo_de_Amarante_a_beleza_do_Farol.jpg', license: 'CC BY-SA 4.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q67176288', importedAt: '2026-11-24' },
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q67176288' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Capela_de_S%C3%A3o_Gon%C3%A7alo_de_Amarante_a_beleza_do_Farol.jpg' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.66319&mlon=-35.73328#map=19/-9.66319/-35.73328' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'associacao', plate: '22', name: 'Associação Comercial de Maceió', role: 'Palácio do comércio de Jaraguá', years: 'Início do século XX',
    area: 'Jaraguá', address: 'Rua Sá e Albuquerque, Jaraguá', kind: 'Patrimônio', group: 'jaragua', visit: 'Aberto', rarity: 'Raro', xp: 150,
    lat: -9.6720, lng: -35.7259, x: 110, y: 446, hue: '#4a7a6a', views: 0, change: 0, flow: 0,
    summary: 'O prédio da Associação Comercial fica em Jaraguá, o bairro do porto, onde Maceió começou a crescer. Por ali saíam açúcar e algodão de Alagoas e chegavam as novidades de fora. O edifício, um dos mais bonitos do bairro, mostra a riqueza do comércio do porto no começo do século XX. É patrimônio histórico e símbolo da revitalização de Jaraguá.', museum: { name: 'Museu da Imagem e do Som de Alagoas (Misa)', address: 'Rua Sá e Albuquerque, 275 · Jaraguá', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'Fica na mesma rua. Guarda fotos e filmes antigos do porto e de Jaraguá.' },
    facts: [['Bairro', 'Jaraguá, antigo porto'], ['Época', 'Início do século XX'], ['Proteção', 'Patrimônio histórico'], ['Dado aberto', 'Wikidata Q67176285']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Pr%C3%A9dio_do_Centro_comercial_de_Macei%C3%B3_-_panoramio.jpg/1280px-Pr%C3%A9dio_do_Centro_comercial_de_Macei%C3%B3_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Duds Nilds', source: 'https://commons.wikimedia.org/wiki/File:Pr%C3%A9dio_do_Centro_comercial_de_Macei%C3%B3_-_panoramio.jpg', license: 'CC BY 3.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q67176285', importedAt: '2026-11-24' },
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q67176285' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Pr%C3%A9dio_do_Centro_comercial_de_Macei%C3%B3_-_panoramio.jpg' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.67202&mlon=-35.72595#map=19/-9.67202/-35.72595' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'doisleoes', plate: '23', name: 'Praça Dois Leões', role: 'Praça dos leões de Jaraguá', years: 'Jaraguá',
    area: 'Jaraguá', address: 'Praça Dois Leões, Jaraguá', kind: 'Praça', group: 'jaragua', visit: 'Aberto', rarity: 'Comum', xp: 80,
    lat: -9.6724, lng: -35.7240, x: 124, y: 434, hue: '#b07a3a', views: 0, change: 0, flow: 0,
    summary: 'A Praça Dois Leões, em Jaraguá, ganhou esse nome por causa das duas esculturas de leão que guardam o espaço. Fica perto do Museu da Imagem e do Som e dos casarões do antigo porto. É um dos pontos de encontro do bairro histórico, revitalizado para receber turistas, eventos e a vida noturna de Maceió.', museum: { name: 'Museu da Imagem e do Som de Alagoas (Misa)', address: 'Rua Sá e Albuquerque, 275 · Jaraguá', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'Fica a poucos passos. Mostra a memória do rádio, do cinema e da fotografia de Alagoas.' },
    facts: [['Esculturas', 'Dois leões'], ['Bairro', 'Jaraguá'], ['Vizinho', 'Museu da Imagem e do Som'], ['Dado aberto', 'Wikidata Q101084268']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Pra%C3%A7a_Dois_Le%C3%B5es_-_panoramio.jpg/1280px-Pra%C3%A7a_Dois_Le%C3%B5es_-_panoramio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Duds Nilds', source: 'https://commons.wikimedia.org/wiki/File:Pra%C3%A7a_Dois_Le%C3%B5es_-_panoramio.jpg', license: 'CC BY 3.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q101084268', importedAt: '2026-11-24' },
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q101084268' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Pra%C3%A7a_Dois_Le%C3%B5es_-_panoramio.jpg' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.67241&mlon=-35.72398#map=19/-9.67241/-35.72398' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'republica', plate: '24', name: 'Memorial à República', role: 'Monumento aos presidentes alagoanos', years: 'Monumento comemorativo',
    area: 'Jaraguá', address: 'Jaraguá, perto da orla', kind: 'Estátua', group: 'jaragua', visit: 'Aberto', rarity: 'Lendário', xp: 250,
    lat: -9.6698, lng: -35.7310, x: 138, y: 470, hue: '#2f6f5f', views: 0, change: 0, flow: 0,
    summary: 'O Memorial à República lembra que Alagoas é a terra dos dois primeiros presidentes do Brasil. O Marechal Deodoro da Fonseca, nascido na antiga capital de Alagoas, hoje a cidade de Marechal Deodoro, proclamou a República em 15 de novembro de 1889. O Marechal Floriano Peixoto, nascido em Ipioca, hoje bairro de Maceió, foi o segundo presidente. O memorial conecta a cidade a esse capítulo da história do país.', museum: { name: 'Museu Palácio Floriano Peixoto (Mupa)', address: 'Praça dos Martírios, 517 · Centro', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'O antigo Palácio do Governo leva o nome de Floriano e guarda a história da República em Alagoas.' },
    facts: [['Tema', 'Proclamação da República'], ['Personagens', 'Deodoro da Fonseca e Floriano Peixoto'], ['Tipo', 'Monumento comemorativo'], ['Dado aberto', 'Wikidata Q56693672']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Memorialarepublica.maceio.jpg/1280px-Memorialarepublica.maceio.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Rodolfo Freire', source: 'https://commons.wikimedia.org/wiki/File:Memorialarepublica.maceio.jpg', license: 'CC BY-SA 4.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q56693672', importedAt: '2026-11-24' }, person: 'deodoro',
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q56693672' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Memorialarepublica.maceio.jpg' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.66976&mlon=-35.73097#map=19/-9.66976/-35.73097' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
  {
    id: 'farolpv', plate: '25', name: 'Farol de Ponta Verde', role: 'Farolete sobre os recifes', years: 'Ponta Verde',
    area: 'Ponta Verde', address: 'Recifes da Ponta Verde', kind: 'Patrimônio', group: 'orla', visit: 'Aberto', rarity: 'Raro', xp: 150,
    lat: -9.6657, lng: -35.6923, x: 260, y: 248, hue: '#2a8aa0', views: 0, change: 0, flow: 0,
    summary: 'O pequeno farol branco e vermelho fica sobre os recifes da Ponta Verde, a ponta de terra que divide as praias de Pajuçara e Ponta Verde. Na maré baixa, dá para chegar perto caminhando pelas piscinas naturais. Ele avisa os barcos sobre os recifes e virou um dos símbolos da orla de Maceió, presente em fotos de moradores e turistas.', museum: { name: 'Museu da Imagem e do Som de Alagoas (Misa)', address: 'Rua Sá e Albuquerque, 275 · Jaraguá', hours: 'Ter. a sex., 8h às 17h · sáb., dom. e feriados, 13h às 17h · entrada gratuita', why: 'Guarda fotos antigas da orla e do mar de Maceió, de antes dos prédios.' },
    facts: [['Local', 'Recifes da Ponta Verde'], ['Acesso', 'Na maré baixa, pelas piscinas naturais'], ['Função', 'Sinalizar os recifes'], ['Dado aberto', 'Wikidata Q10280165']],
    photo: { src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Macei%C3%B3%2C_Alagoas%2C_Brasil_2.jpg/1280px-Macei%C3%B3%2C_Alagoas%2C_Brasil_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail', credit: 'Tissiana Sousa', source: 'https://commons.wikimedia.org/wiki/File:Macei%C3%B3,_Alagoas,_Brasil_2.jpg', license: 'CC BY-SA 2.0 · Wikimedia Commons' },
    origin: { dataset: 'wikidata', id: 'Q10280165', importedAt: '2026-11-24' },
    sources: [
      { label: 'Wikidata · registro aberto do bem (CC0)', url: 'https://www.wikidata.org/wiki/Q10280165' },
      { label: 'Wikimedia Commons · foto, autor e licença', url: 'https://commons.wikimedia.org/wiki/File:Macei%C3%B3,_Alagoas,_Brasil_2.jpg' },
      { label: 'OpenStreetMap · localização (ODbL)', url: 'https://www.openstreetmap.org/?mlat=-9.66567&mlon=-35.69233#map=19/-9.66567/-35.69233' },
    ],
    tag: { type: 'NTAG213', status: 'Ativa', lastRead: 'nunca', pendingOffline: 0 },
  },
]

export const byId = (id: string) => monuments.find((m) => m.id === id)!

// Caminho simulado da caminhada (Centro → orla → Jatiúca)
export const walkPath: [number, number][] = [
  [48, 572], [62, 528], [98, 502], [128, 442], [168, 396], [204, 330], [232, 306], [285, 226], [318, 176], [345, 148],
]

export const quests = [
  { id: 'q1', title: 'Visite 2 monumentos hoje', progress: 1, total: 2, xp: 100 },
  { id: 'q2', title: 'Ouça uma história completa', progress: 0, total: 1, xp: 50 },
  { id: 'q3', title: 'Veja um monumento em realidade aumentada', progress: 0, total: 1, xp: 80 },
]

export const badges = [
  { id: 'b1', name: 'Primeiro passo', desc: 'Primeiro carimbo', need: 1 },
  { id: 'b2', name: 'Leitor da orla', desc: '4 esculturas', need: 4 },
  { id: 'b3', name: 'Guardião do Centro', desc: 'Praças e bustos', need: 7 },
  { id: 'b4', name: 'Memória completa', desc: 'Todos os pontos', need: 25 },
]

export const levelFor = (xp: number) => {
  const level = Math.floor(xp / 300) + 1
  return { level, inLevel: xp % 300, need: 300 }
}

// ===== Monitoramento (números ilustrativos — não são dados reais) =====
export const kpis = {
  acessos: 8642,
  unicos: 5391,
  tempo: '3m 42s',
  checkins: 1128,
  offline: 312,
  jogadores: 846,
}

export const origins = [
  { label: 'Acesso direto', value: 34, color: '#0b2f49' },
  { label: 'QR Code', value: 24, color: '#2c8585' },
  { label: 'Tag NFC', value: 15, color: '#dda93f' },
  { label: 'Busca orgânica', value: 17, color: '#c4683a' },
  { label: 'Redes sociais', value: 10, color: '#a7b4bb' },
]

export const weekly = [232, 341, 298, 486, 441, 628, 590, 782, 712, 838, 804, 930]
export const hourly = [8, 4, 2, 2, 5, 18, 42, 58, 61, 55, 49, 52, 64, 58, 54, 66, 88, 100, 92, 74, 55, 38, 22, 12]

export const funnel = [
  { label: 'Leu a placa (QR/NFC)', value: 4210 },
  { label: 'Abriu a história', value: 3388 },
  { label: 'Ouviu o áudio ou a audiodescrição', value: 1602 },
  { label: 'Fez check-in na trilha', value: 1128 },
  { label: 'Seguiu para o próximo ponto', value: 684 },
]

export const journeys = [
  { path: ['Paulo Gracindo', 'Graciliano Ramos', 'Aurélio Buarque'], share: 22 },
  { path: ['Nise da Silveira', 'Lêdo Ivo'], share: 17 },
  { path: ['Praça dos Martírios', 'Graciliano Ramos'], share: 12 },
  { path: ['Praça dos Martírios', 'Praça Sinimbu', 'Montepio'], share: 9 },
]

// Retenção semanal (% que volta) por coorte de primeiro acesso
export const cohorts = [
  { week: '06 out', size: 412, r: [100, 34, 22, 18, 15] },
  { week: '13 out', size: 488, r: [100, 38, 25, 19] },
  { week: '20 out', size: 530, r: [100, 41, 27] },
  { week: '27 out', size: 602, r: [100, 44] },
  { week: '03 nov', size: 655, r: [100] },
]

export const eventTemplates = [
  { type: 'nfc_read', label: 'Tag NFC lida', offline: true },
  { type: 'qr_scan', label: 'QR Code escaneado', offline: false },
  { type: 'audio_play', label: 'Áudio iniciado', offline: false },
  { type: 'checkin', label: 'Check-in na trilha', offline: false },
  { type: 'stamp', label: 'Carimbo conquistado', offline: false },
  { type: 'sync', label: 'Fila offline sincronizada', offline: true },
  { type: 'open_story', label: 'Realidade aumentada aberta', offline: false },
]

export const fmt = (n: number) => n.toLocaleString('pt-BR')

// ===== Rastreamento (eventos do protótipo) =====
// Anônimo por padrão: id de sessão rotativo (troca a cada 24 h), sem dado pessoal.
// Com login Google + consentimento: jornada vinculada à conta (pseudonimizada no painel).
export interface TrackEvent {
  id: number
  type: 'qr_scan' | 'nfc_read' | 'gps_checkin' | 'stamp' | 'audio_play' | 'audiodesc' | 'open_story' | 'login' | 'logout' | 'sync' | 'pe_link'
  label: string
  monument?: string
  offline: boolean
  synced: boolean
  at: number
  session: string
  identified: boolean
}

export interface User {
  name: string
  email: string
  color: string
}

// ===== Relatos dos visitantes (feedback) =====
export interface Report {
  id: number
  monument: string
  kind: 'Danificado' | 'Sujo ou pichado' | 'Placa / QR / NFC não funciona' | 'Informação errada' | 'Outro'
  note?: string
  photo?: boolean
  media?: { kind: 'image' | 'video'; mime: string; bytes: number; seconds?: number }
  at: number
  status: 'Novo' | 'Em andamento' | 'Resolvido'
}

export const seedReports: Report[] = [
  { id: 1, monument: 'nise', kind: 'Placa / QR / NFC não funciona', note: 'QR da placa riscado, não lê', photo: true, at: Date.now() - 2 * 3600e3, status: 'Novo' },
  { id: 2, monument: 'aurelio', kind: 'Danificado', note: 'Óculos da estátua parecem soltos', at: Date.now() - 26 * 3600e3, status: 'Em andamento' },
  { id: 3, monument: 'montepio', kind: 'Informação errada', note: 'Ano do busto diferente na placa', at: Date.now() - 4 * 86400e3, status: 'Resolvido' },
]
