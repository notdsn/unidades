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

Publicado em https://notdsn.github.io/unidades/ pelo repositório `notdsn/unidades`, branch `main`, raiz `/`. Os arquivos em `dist/` também formam um site estático completo. Somente código é publicado: os registros pessoais permanecem no navegador de cada usuário.

## Uso e regras

- **Registrar:** cole um ou vários textos do WhatsApp, escolha a data, confira os campos e salve. Campos sem valor não viram zero automaticamente.
- **Identificação:** consolidador / consolidado / lição sinalizam consolidação. Negritos, acentos, emoji e espaços são tolerados. Mensagens não estruturadas podem precisar de ajustes na prévia.
- Unidades desconhecidas são criadas automaticamente. Nomes são comparados sem emoji, acentos, espaços extras ou diferença de caixa. Não existe fusão de Unidades; possíveis duplicatas devem ser conferidas/editadas.
- A duplicata é Unidade + semana + tipo (+ nome da pessoa na consolidação). Substituição requer confirmação. Dentro do mesmo lote, prevalece o último registro após a confirmação.
- O total informado é preservado, mesmo que seja diferente da soma das categorias; a prévia mostra um aviso.
- **Consolidação:** o relatório cadastra ou atualiza a pessoa. A lição atual considera relatórios e atualizações manuais datadas, para não regredir ao cadastrar um histórico antigo. “Aceitou Jesus” permite cadastrar uma pessoa sem relatório, com data/observações opcionais.
- **Avisos:** apenas Unidades ativas. Faltante de consolidação somente quando existe pessoa em acompanhamento e nenhum relatório daquele tipo foi registrado na semana. Um relatório de consolidação já satisfaz a Unidade na semana, não é necessário um por pessoa. Pessoas concluídas não geram esse aviso.
- Semana de domingo a sábado, fuso America/Sao_Paulo. Data manual do relatório define a semana; datas na mensagem não são inferidas.
- Avisos existem no painel, não são notificações push nem mensagens automáticas ao WhatsApp.
- Relatórios podem ser corrigidos colando novamente e confirmando a substituição. A versão anterior não é mantida. Edição de cadastro não reescreve relatórios históricos.

## Novos recursos de acompanhamento

1. **Resumo semanal:** o botão no Início monta texto com marcação do WhatsApp, datas da semana selecionada, recebidos/esperados, pendências, totais, pessoas que aceitaram Jesus e Unidades sem encontro. Só copia: não envia. Sem permissão de clipboard, abre caixa selecionável. Quando a data de aceitação não foi informada, a contagem usa `started` (início do acompanhamento).
2. **Contato do líder:** WhatsApp opcional na Unidade; aceita número brasileiro com DDD e com/sem +55. O link `wa.me` contém um pedido educado do relatório. O usuário abre, edita e envia no próprio WhatsApp; nada é enviado automaticamente.
3. **Primeiras visitas:** relatório com visitantes > 0 gera acompanhamento para o domingo seguinte. É por Unidade, não por visitante. Permite adicionar nomes fornecidos pelo usuário e marcar acompanhado ou reabrir. Correção de quantidade reabre o acompanhamento preservando nomes; substituir por zero visitantes ou sem encontro remove o lembrete derivado. Backups antigos ganham acompanhamentos a partir dos relatórios existentes.
4. **Lição sem avanço:** alerta após 21 dias sem aumento da lição registrada, por relatórios ou atualizações manuais. Repetir a mesma lição não reinicia a contagem. Pessoas concluídas e Unidades inativas não entram. Sem relatórios, usa a lição e a data de início conhecidas. Não inventa histórico de lições; informações antigas sem data confiável não permitem determinar o tempo exato.
5. **Não houve encontro:** disponível na pendência e no detalhe da Unidade. Motivos Chuva, Feriado, Sem encontro ou Outro; observação opcional. É um relatório de Unidade com `noMeeting: true` e quatro números zerados. Satisfaz a pendência semanal de Unidade, não a de consolidação, e compartilha a regra de duplicidade com relatório normal. Substituição exige confirmação.
6. **Gráfico:** SVG leve das oito semanas até a selecionada, com participantes, primeiras visitas e aceitação de Jesus. Possui tabela alternativa de valores exatos e legenda. Sem encontro contribui zero; `accepted` é usado preferencialmente e `started` é a alternativa.

O formato continua `version: 1` e a chave continua `unidades.rede.v1`. Campos novos são opcionais para leitura de backups antigos. Novos backups incluem telefone, acompanhamentos de visitantes e eventos de atualização de lição. Todos os novos dados continuam locais.

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
