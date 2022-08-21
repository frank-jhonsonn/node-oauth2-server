# Node OAuth2 Server [![Status da compilação](https://travis-ci.org/thomseddon/node-oauth2-server.png)](https://travis-ci.org/thomseddon/node-oauth2-server )

Módulo completo, compatível e bem testado para implementação de um servidor/provedor OAuth2 em [node.js](http://nodejs.org/)

## Instalação

```
npm instalar oauth2-server
```

## Começo rápido

O módulo fornece dois middlewares, um para autorização e roteamento, outro para tratamento de erros, use-os como faria com qualquer outro middleware:

``` js
var expresso = exigir('expresso'),
    bodyParser = require('body-parser'),
    oauthserver = require('oauth2-server');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.oauth = oauthserver({
  model: {}, // Veja abaixo as especificações
  concede: ['senha'],
  depurar: verdadeiro
});

app.all('/oauth/token', app.oauth.grant());

app.get('/', app.oauth.authorise(), function (req, res) {
  res.send('Área secreta');
});

app.use(app.oauth.errorHandler());

app.listen(3000);
```

Depois de executar com o node, visitar http://127.0.0.1:3000 deve apresentar uma resposta json informando que seu token de acesso não foi encontrado.

Nota: Como nenhum modelo foi realmente implementado aqui, aprofundar mais, ou seja, passar um token de acesso, apenas causará um erro no servidor. Veja abaixo a especificação do que é exigido do modelo.

## Características

- Suporta autorização_código, senha, refresh_token, client_credentials e tipos de concessão de extensão (personalizados)
- Suporta implicitamente qualquer forma de armazenamento, por exemplo PostgreSQL, MySQL, Mongo, Redis...
- Conjunto de testes completo

## Opções

- *cadeia* **modelo**
 - Objeto modelo (veja abaixo)
- *matriz* **subsídios**
 - tipos de concessão que você deseja suportar, atualmente o módulo suporta `authorization_code`, `password`, `refresh_token` e `client_credentials`
  - Padrão: `[]`
- *função|booleano* **depurar**
 - Se erros `true` serão registrados no console. Você também pode passar uma função personalizada, nesse caso essa função será chamada com o erro como seu primeiro argumento
  - Padrão: `falso`
- *número* **accessTokenLifetime**
 - Vida útil dos tokens de acesso em segundos
 - Se for `null`, os tokens serão considerados como nunca expirando
  - Padrão: `3600`
- *número* **refreshTokenLifetime**
 - Vida útil dos tokens de atualização em segundos
 - Se for `null`, os tokens serão considerados como nunca expirando
  - Padrão: `1209600`
- *número* **authCodeLifetime**
 - Vida útil dos códigos de autenticação em segundos
  - Padrão: `30`
- *regexp* **clientIdRegex**
 - Regex para verificar a integridade do ID do cliente antes de verificar o modelo. Nota: o padrão apenas corresponde a estruturas `client_id` comuns, altere conforme necessário
  - Padrão: `/^[a-z0-9-_]{3,40}$/i`
- *boolean* **passthroughErrors**
 - Se true, os erros **non grant** não serão tratados internamente (para que você possa garantir um formato consistente com o restante de sua API)
- *boolean* **continueAfterResponse**
 - Se true, `next` será chamado mesmo que uma resposta tenha sido enviada (você provavelmente não quer isso)

## Especificação modelo

O módulo requer um objeto de modelo através do qual alguns aspectos ou armazenamento, recuperação e validação personalizada são abstraídos.
O último parâmetro de todos os métodos é um callback do qual o primeiro parâmetro é sempre usado para indicar um erro.

Nota: veja https://github.com/thomseddon/node-oauth2-server/tree/master/examples/postgresql para um exemplo de modelo completo usando postgres.

### Sempre obrigatório

#### getAccessToken (bearerToken, retorno de chamada)
- *string* **bearerToken**
 - O token do portador (token de acesso) que foi fornecido
- *função* **retorno de chamada (erro, accessToken)**
 - *misto* **erro**
     - Verdadeiro para indicar um erro
 - *objeto* **AccessToken**
     - O token de acesso recuperou o armazenamento do formulário ou falsey para indicar o token de acesso inválido
     - Deve conter as seguintes chaves:
         - *data* **expira**
             - A data em que expira
             - `null` para indicar que o token **nunca expira**
         - *misto* **usuário** *ou* *string|número* **userId**
             - Se existir uma chave `user`, ela será salva como `req.user`
             - Caso contrário, deve existir uma chave `userId`, que é salva em `req.user.id`

#### getClient (clientId, clientSecret, callback)
- *string* **clientId**
- *string|null* **clientSecret**
 - Se null, omitir da consulta de pesquisa (somente pesquisar por clientId)
- *função* **retorno de chamada (erro, cliente)**
 - *misto* **erro**
     - Verdadeiro para indicar um erro
 - *objeto* **cliente**
     - O cliente recuperado do armazenamento ou falso para indicar um cliente inválido
     - Salvo em `req.client`
     - Deve conter as seguintes chaves:
         - *string* **clientId**
         - *string* **redirectUri** (somente tipo de concessão `authorization_code`)

#### grantTypeAllowed (clientId, grantType, callback)
- *string* **clientId**
- *string* **grantType**
- *função* **retorno de chamada (erro, permitido)**
 - *misto* **erro**
     - Verdadeiro para indicar um erro
 - *booleano* **permitido**
     - Indica se o grantType é permitido para este clientId

#### saveAccessToken (accessToken, clientId, expira, usuário, retorno de chamada)
- *stri
