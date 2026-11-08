# Unidades · Rede Pastor Jorge

Aplicativo estático, em português, para registrar relatórios de Unidade e acompanhar a consolidação. Sem conta, backend, analytics ou dependências de execução.

## Abrir

```sh
cd /workspace/unidades
npm start
# http://localhost:8080
```

Sirva por HTTP/HTTPS (não abra index.html diretamente via file://, pois usa módulos ES).

## Verificar

```sh
npm ci
npm test
npm run build
```

Os testes incluem parser, semana de domingo a sábado em America/Sao_Paulo, alertas, duplicatas, importação inválida, cadastro manual e fluxos completos com DOM simulado. Não houve validação visual em navegador real.

## Publicar

Os arquivos em `dist/` são todo o site. Podem ser hospedados em qualquer serviço estático, incluindo GitHub Pages na subpasta `/unidades/`. A publicação exige autorização explícita do proprietário. Nenhum repositório foi criado e nenhum dado foi publicado durante a implementação.

## Uso e regras

- **Registrar:** cole um ou vários textos do WhatsApp, escolha a data, confira os campos e salve. Campos sem valor não viram zero automaticamente.
- **Identificação:** consolidador / consolidado / lição sinalizam consolidação. Negritos, acentos, emoji e espaços são tolerados. Mensagens não estruturadas podem precisar de ajustes na prévia.
- Unidades desconhecidas são criadas automaticamente. Nomes são comparados sem emoji, acentos, espaços extras ou diferença de caixa. Não existe fusão de Unidades; possíveis duplicatas devem ser conferidas/editadas.
- A duplicata é Unidade + semana + tipo (+ nome da pessoa na consolidação). Substituição requer confirmação. Dentro do mesmo lote, prevalece o último registro após a confirmação.
- O total informado é preservado, mesmo que seja diferente da soma das categorias; a prévia mostra um aviso.
- **Consolidação:** o relatório cadastra ou atualiza a pessoa. A lição atual usa o relatório mais recente por data, para não regredir ao cadastrar um histórico antigo. “Aceitou Jesus” permite cadastrar uma pessoa sem relatório, com data/observações opcionais.
- **Avisos:** apenas Unidades ativas. Faltante de consolidação somente quando existe pessoa em acompanhamento e nenhum relatório daquele tipo foi registrado na semana. Um relatório de consolidação já satisfaz a Unidade na semana, não é necessário um por pessoa. Pessoas concluídas não geram esse aviso.
- Semana de domingo a sábado, fuso America/Sao_Paulo. Data manual do relatório define a semana; datas na mensagem não são inferidas.
- Avisos existem no painel, não são notificações push nem mensagens automáticas ao WhatsApp.
- Relatórios podem ser corrigidos colando novamente e confirmando a substituição. A versão anterior não é mantida. Edição de cadastro não reescreve relatórios históricos.

## Dados e privacidade

LocalStorage (`unidades.rede.v1`). Não há sincronização entre celulares, login ou recuperação na nuvem. Exporte JSON regularmente usando a engrenagem ou o rodapé. Importação valida o arquivo e solicita confirmação antes de substituir o cadastro inteiro. Não há exclusão silenciosa de registros nem dados de exemplo salvos. Nomes nos placeholders e testes são apenas os exemplos fornecidos.

**O backup contém informações pessoais e religiosas. Guarde-o em local seguro, evite computadores compartilhados e respeite as pessoas cadastradas.** Não há criptografia do localStorage. O dispositivo e o navegador precisam estar protegidos.

Manifest e service worker permitem reabrir offline após a primeira visita. A instalação na tela inicial depende do navegador (no iPhone, menu Compartilhar do Safari). Para verificar atualizações, abra com internet.

## Estrutura

- `index.html`, `style.css`: layout responsivo, navegação e estados vazios.
- `app.js`: telas, formulários, armazenamento e backup.
- `core.js`: parser, matching, semanas, alertas e validação.
- `tests/`: testes Node e jsdom.
- `manifest.webmanifest`, `icon.svg`, `sw.js`: instalação básica e cache offline.
