# Configuração do ambiente de desenvolvimento local

> **AVISO**
>
> Esta é uma configuração exclusivamente para desenvolvimento local.
>
> NÃO TENTE EXECUTÁ-LA EM UM SERVIDOR PUBLICAMENTE ACESSÍVEL

## Instalar o Docker

A configuração sugerida para desenvolvimento utiliza o Docker para executar duas dependências: `postgres` e `redis`, além de configurar um container rodando `pgadmin4` caso você sinta a necessidade de interagir diretamente com o banco de dados (recomendo evitar isso sempre que possível).

Você pode instalar o Docker usando o [site oficial de download e instruções](https://docs.docker.com/engine/install/).

### Acessar o Docker como usuário no Linux

Se você estiver usando Linux, é recomendável adicionar seu usuário ao grupo docker, assim poderá emitir comandos sem precisar usar o root:

```bash
adduser username docker
```

Pode ser necessário fazer logoff e logon novamente antes de prosseguir. Apenas fechar a janela do terminal não será suficiente — é necessário realizar um logoff completo no ambiente gráfico.

## Instalar NodeJS

Para desenvolver no Ticketz, você precisa ter o NodeJS 20 instalado. Caso ainda não tenha, pode obtê-lo no [site oficial do NodeJS](https://nodejs.org/en/download/prebuilt-binaries).

Após a instalação, verifique se o Node e o npm estão disponíveis executando os seguintes comandos em um terminal:

```bash
node -v

npm -v
```

## Baixar o repositório

Você precisa clonar este repositório no seu computador antes de realizar qualquer outro passo:

```bash
git clone https://github.com/ticketz-oss/ticketz
```

Qualquer comando a seguir deverá ser executado dentro do diretório clonado, a menos que especificado de outra forma:

```bash
cd ticketz
```

## Executar postgres e redis com Docker

O Ticketz fornece uma configuração do docker-compose para executar `postgres` e `redis`. Inicie com:

```bash
docker compose -f docker-compose-dev.yaml up -d
```

Após alguns segundos, você terá:

- Postgres rodando na porta 5432 do localhost. Ele criará automaticamente um usuário e um banco de dados, ambos com o nome `ticketz`. O usuário `ticketz` aceitará qualquer senha.
- Redis rodando na porta 6379 do localhost.
- PgAdmin4 rodando em https://localhost:8081 — O nome de usuário é `admin@ticketz.host` e a senha é `123456`. Já haverá uma conexão de servidor configurada. Quando solicitado a senha do usuário `ticketz`, você pode inserir qualquer coisa.

## Backend

Os comandos a seguir devem ser emitidos na pasta `backend`. Certifique-se de entrar nela antes de continuar.

### Instalar dependências

O comando a seguir instalará as dependências do backend:

```bash
npm ci
```

### Arquivo de configuração

O exemplo de configuração padrão deve ser copiado para o arquivo de configuração. Ele já possui um bom conjunto de parâmetros padrão.

**No Linux:**

```bash
cp .env.dev .env
```

**No Windows:**

```powershell
copy .env.dev .env
```

### Inicializar o banco de dados

O banco de dados criado estará vazio. Para inicializá-lo, execute os seguintes comandos:

```bash
npm run build

npx sequelize db:migrate

npx sequelize db:seed:all
```

### Executar o backend

Você pode abrir um novo terminal, navegar até a pasta `backend` e executar este comando:

```bash
npm run dev:server
```

Deixe-o rodando. Ele monitorará alterações nos arquivos e reiniciará automaticamente. Também se conectará ao depurador caso seja iniciado de um ambiente configurado no VSCode.

## Frontend

Entre na pasta `frontend` antes dos próximos passos.

### Instalar dependências

O comando a seguir instalará as dependências do frontend:

```bash
npm ci
```

### Executar o frontend

```bash
npm run start
```

Após alguns minutos, a janela do frontend será aberta em http://localhost:3000.

Deixe o comando rodando. Ele monitorará alterações nos arquivos e recarregará conforme necessário.

## Manutenção

### Serviços do Docker

Você pode parar, limpar os dados e reiniciar os serviços Docker de `postgres`, `redis` e `pgadmin`.

Todos os comandos devem ser executados dentro da pasta base do projeto (geralmente `ticketz`).

#### Parar os serviços

```bash
docker compose -f docker-compose-dev.yaml down
```

#### Remover os dados (resetar)

Os nomes dos volumes podem ser diferentes caso você tenha clonado a pasta com um nome diferente de `ticketz`.

```bash
docker volume rm ticketz_postgres_data
docker volume rm ticketz_redis_data
```

#### (Re)iniciar os serviços

```bash
docker compose -f docker-compose-dev.yaml up -d
```

### Alterar configurações

Por padrão, estas são as portas utilizadas neste guia:

- Postgres: 5432
- Redis: 6379
- PgAdmin: 8081
- Backend do Ticketz: 8080
- Frontend do Ticketz: 3000

Você pode alterar as portas de `postgres`, `redis` e `pgadmin` editando o arquivo `docker-compose-dev.yaml`.

Para alterar a porta do backend do Ticketz, edite o arquivo `.env` e também crie o arquivo `config-dev.json` em `frontend/public`, usando como base o `frontend/public/config-dev-example.json`.

Para alterar a porta do frontend do Ticketz, crie um arquivo `.env` na pasta `frontend` configurando a porta desejada:

```bash
PORT=3001
```
