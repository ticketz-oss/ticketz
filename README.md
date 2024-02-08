# Sobre o projeto

Ticketz é um comunicador com recursos de CRM e helpdesk que utiliza
Whatsapp como meio de comunicação com os clientes.

## Autoria original

Este projeto foi iniciado em [um projeto Open Source](https://github.com/canove/whaticket-community)
sob a licença permissiva MIT, e recebeu diversas melhorias por autores não identificados, foi
comercializado como produto "White Label" e de acordo com informações [deste
vídeo acabou em algum momento sendo vazado e publicado abertamente](https://www.youtube.com/watch?v=SX_cGD5RLkQ)

É praticamente impossível identificar e creditar os autores das melhorias, [o
código publicado pelo canal Vem Fazer](https://github.com/vemfazer/whaticket-versao-03-12-canal-vem-fazer)
não menciona licença alguma portanto estou presumindo que todos os autores
estão tranquilos em manter estas alterações sob a mesma licença do projeto
original (MIT)

## Relicenciamento

Como estou fazendo estas alterações e disponibilizando sem custo algum, desejo que
elas estejam disponíveis a todos, por isso estou optando por relicenciar sob a
AGPL, que exige que todo usuário que tenha acesso ao sistema possa obter o
código fonte.

Por isso, se você utilizar diretamente esta versão, é
**muito importante manter o link na tela "Ajuda", que dá acesso ao repositório**.

Caso você faça alterações no código você deve alterar o link para um
repositório ou outra forma de obter o código das suas alterações.

## Objetivo

Este projeto tem por objetivo melhorar e manter abertas as atualizações sobre o Whaticket SAAS publicado.
Melhorias desenvolvidas por mim serão sempre colocadas aqui, dependendo
posso transpor, sempre creditando, códigos e melhorias publicados em outros
projetos também derivados do Whaticket Community ou do Whaticket SAAS.

## Contribuições

Por melhor esforço, procurarei sempre listar aqui as contribuições incorporadas, creditando
autorias, porém o melhor local para observar o que foi feito é o histórico
do repositório.

* [83f6713](https://github.com/allgood/ticketz/commit/83f67132c234f528c13540b3de529ccb54cc3e6a) Aceita documento anexado com legenda)
* [e8f4d32](https://github.com/allgood/ticketz/commit/e8f4d325f46133a2ea828dfe8ca7470f44243bf5) Aceita mensagens editadas -- cherry pick de @Vinicius-Marques6 canove/whaticket-community#605
* [60455d9](https://github.com/allgood/ticketz/commit/60455d9416975a0d1806968815d28f5195d15e64) Mantém aberto e utiliza apenas um websocket com o backend
* [30526b6](https://github.com/allgood/ticketz/commit/30526b6cd6d92e3204e97ff194ef57b7def69979) Um ticket novo ao invés de reabrir ticket fechado
* [2b58d6c](https://github.com/allgood/ticketz/commit/2b58d6c1c424bbcb060f9cc7196bfde4b42926ff) Execução através do docker compose - **Múltiplos commits até esse ponto**

Rodando o projeto:
------------------

O projeto atualmente suporta execução utilizando containers Docker, para a
instalação é necessário ter o Docker Community Edition e o cliente Git
instalados. O ideal é buscar a melhor forma de instalar estes recursos no
sistema operacional de sua preferência. (Não testei em windows, mas tendo
Git e Docker, deve funcionar)

Em ambos os casos é necessário clonar o repositório, necessário então abrir
um terminal de comandos:

```bash
git clone https://github.com/allgood/ticketz.git
cd ticketz
```

## Rodando localmente

Para executar o sistema no servidor local, ficando ele acessível apenas na
própria máquina (para testes), basta então rodar o comando:

```bash
docker compose -f docker-compose-local.yaml up
```

Na primeira execução o sistema vai inicializar os bancos de dados e tabelas,
e após alguns minutos o Ticketz estará acessível pelo endereço http://localhost:3000

O usuário padrão é admin@admin.com e a senha padrão é 123456

A execução pode ser interrompida com Ctrl-C, para iniciar novamente basta
repetir o último comando.

## Rodando e servindo na internet

Tendo um servidor acessível pela internet, é necessário ajustar dois nomes
de DNS a sua escolha, um para o backend e outro para o frontend, por
exemplo:

backend: api.ticketz.exemplo.com.br
frontend: ticketz.exemplo.com.br

É necessário editar os arquivos `.env-backend-acme` e `.env-frontend-acme`
definindo ambos estes nomes.

Estando então na pasta raiz do projeto, basta executar o comando:

```bash
docker compose -f docker-compose-acme.yaml up -d
```

Na primeira execução o sistema vai inicializar os bancos de dados e tabelas,
e após alguns minutos o Ticketz estará acessível pelo endereço do frontend.

O usuário padrão é admin@admin.com e a senha padrão é 123456

Facilitou sua vida?
-------------------

Se este projeto ajudou você em uma tarefa complexa, considere fazer uma doação ao autor pelo PIX abaixo.

![image](https://user-images.githubusercontent.com/6070736/116247400-317e3680-a741-11eb-9434-9f226eec39b5.png)

Chave Pix: 80fd8916-1131-4844-917e-2732eaa2ba74
