[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)
[![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](README.pt.md)

# Sobre o projeto

Ticketz é um comunicador com recursos de CRM e helpdesk que utiliza
Whatsapp como meio de comunicação com os clientes.

## Autoria original

Este projeto foi iniciado em [um projeto Open
Source](https://github.com/canove/whaticket-community), publicado pelo
desenvolvedor [Cassio Santos](https://github.com/canove) sob a licença permissiva
MIT. Depois recebeu diversas melhorias por autores não identificados e foi
comercializado diretamente entre desenvolvedores e usuários com fornecimento
de código fonte, e de acordo com informações [deste vídeo acabou em algum momento
sendo vazado e publicado abertamente](https://www.youtube.com/watch?v=SX_cGD5RLkQ)

Após algumas pesquisas foi ainda identificado que a primeira versão SaaS do
Whaticket foi criada pelo desenvolvedor [Wender Teixeira](https://github.com/w3nder), inclusive uma versão do [Whaticket Single](https://github.com/unkbot/whaticket-free) que faz uso da biblioteca Baileys para acesso ao Whatsapp.

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
**muito importante manter o link na tela "Sobre o Ticketz", que dá acesso ao repositório**. Se você desejar pode mover o link para o código fonte para outro lugar, mas ele deve ser facilmente acessível por qualquer usuário do sistema.

Caso você faça alterações no código você deve alterar o link para um
repositório ou outra forma de obter o código das suas alterações.

Se você deseja utilizar partes do código para corrigir algum código **para seu próprio em uso**, fique a vontade e não precisa se preocupar com a licença AGPL, Porém se você deseja utilizar qualquer parte adicionada nesse projeto em um sistema que você comercializa, ou você deve fornecer o código de todo o seu sistema ao usuários dele ou você deve contatar o autor do código para licenciar ele sob critérios diferentes.

## Objetivo

Este projeto tem por objetivo melhorar e manter abertas as atualizações sobre o Whaticket
SaaS publicado. Principalmente direcionadas à qualidade da aplicação e à
facilidade de instalação e utilização.

As melhorias desenvolvidas por mim serão colocadas aqui, dependendo posso transpor,
sempre creditando, códigos e melhorias publicados em outros projetos também derivados
do Whaticket Community ou do Whaticket SaaS.

## Contribuindo de Volta

Sempre que possível pretendo fazer backport de alguns ajustes feitos aqui
aos projetos originais

Início Muito Rápido em um Servidor Público
------------------------------------------

Existem imagens Docker fornecidas pelo projeto, então você pode fazer o **ticketz** funcionar muito facilmente em um servidor público (baremetal ou VPS).

### Primeira configuração

Antes de começar, você deve completar esta lista de verificação:

- [ ] Ter um servidor limpo rodando Ubuntu 20 ou mais recente
- [ ] Portas 80 e 443 disponíveis e não filtradas pelo firewall
- [ ] Dois nomes de host com DNS configurado apontando para o seu servidor (um para o backend e outro para o frontend)

Após isso, basta fazer login no seu servidor e emitir o seguinte comando, substituindo os nomes de host que você já configurou e seu endereço de email:

```bash
curl -sSL get.ticke.tz | sudo bash -s backend.exemplo.com frontend.exemplo.com nome@exemplo.com
```

Após alguns minutos, você terá o servidor rodando no nome que você deu para o host do frontend.

O login padrão é `admin@admin.com` e a senha padrão é `123456`, você deve alterá-la imediatamente.

### Atualização

A atualização é tão fácil quanto a instalação, você só precisa fazer login no seu servidor usando o mesmo nome de usuário que você usou na instalação e emitir o seguinte comando:

```bash
curl -sSL update.ticke.tz | sudo bash
```

Seu servidor ficará fora do ar e após alguns minutos ele estará rodando na última versão lançada.

### Inspecionar logs

Como todos os elementos estão rodando em containers, os logs devem ser verificados através do comando docker.

Você deve fazer login no seu servidor usando o mesmo usuário que você usou para a instalação.

Primeiro você precisa mover o diretório atual para a pasta de instalação:

```bash
cd ~/ticketz-docker-acme
```

Após isso, você pode obter um relatório completo de logs com o seguinte comando:

```bash
docker compose logs -t
```

Se você quiser "seguir" os logs em tempo real, basta adicionar um parâmetro `-f` a esse comando:

```bash
docker compose logs -t -f
```

Rodando o projeto a partir do Código Fonte usando Docker:
---------------------------------------------------------

Para a
instalação é necessário ter o Docker Community Edition e o cliente Git
instalados. O ideal é buscar a melhor forma de instalar estes recursos no
sistema operacional de sua preferência. [O guia oficial de instalação do
Docker pode ser encontrado aqui](https://docs.docker.com/engine/install/).


Em ambos os casos é necessário clonar o repositório, necessário então abrir
um terminal de comandos:

```bash
git clone https://github.com/allgood/ticketz.git
cd ticketz
```

## Rodando localmente

Por padrão a configuração está ajustada para executar o sistema apenas no
próprio computador. Para executar em uma rede local é necessário editar os
arquivos `.env-backend-local` e `.env-frontend-local` e alterar os endereços
de backend e frontend de `localhost` para o ip desejado, por exemplo
`192.168.0.10`

Para executar o sistema basta executar o comando abaixo:

```bash
docker compose -f docker-compose-local.yaml up -d
```

Na primeira execução o sistema vai inicializar os bancos de dados e tabelas,
e após alguns minutos o Ticketz estará acessível pela porta 3000

O usuário padrão é admin@admin.com e a senha padrão é 123456

A aplicação irá se reiniciar automaticamente a cada reboot do servidor.

A execução pode ser interrompida com o comando:

```bash
docker compose -f docker-compose-local.yaml down
```


## Rodando e servindo na internet

Tendo um servidor acessível pela internet, é necessário ajustar dois nomes
de DNS a sua escolha, um para o backend e outro para o frontend, e também um
endereço de email para cadastro dos certificados, por exemplo:

* **backend:** api.ticketz.exemplo.com.br
* **frontend:** ticketz.exemplo.com.br
* **email:** ticketz@exemplo.com.br

É necessário editar os arquivos `.env-backend-acme` e `.env-frontend-acme`
definindo neles estes valores.

Se desejar utilizar reCAPTCHA na inscrição de empresas também é necessário
inserir as chaves secretas e de site nos arquivos de backend e frontend,
respectivamente.

Este guia presume que o terminal está aberto e logado com um usuário comum
que tem permissão para utilizar o comando `sudo` para executar comandos como
root.

Estando então na pasta raiz do projeto, executa-se o seguinte comando para
iniciar o serviço:

```bash
sudo docker compose -f docker-compose-acme.yaml up -d
```

Na primeira execução o Docker irá fazer a compilação do código e criação dos
conteiners, e após isso o ticketz vai inicializar os bancos de dados e
tabelas. Esta operação pode levar bastante tempo, depois disso o Ticketz
estará acessível pelo endereço fornecido para oo frontend.

O usuário padrão é admin@admin.com e a senha padrão é 123456

A aplicação irá se reiniciar automaticamente a cada reboot do servidor.

Para encerrar o serviço utiliza-se o seguinte comando:

```bash
sudo docker compose -f docker-compose-acme.yaml down
```

Aviso Importante
----------------

Este projeto não está afiliado à Meta, WhatsApp ou qualquer outra empresa.
A utilização do código fornecido é de responsabilidade exclusiva dos usuários
e não implica em qualquer responsabilidade para o autor ou colaboradores do projeto.


Facilitou sua vida?
-------------------

Se este projeto ajudou você em uma tarefa complexa, considere fazer uma doação ao autor pelo Paypal ou PIX.

![image](https://github.com/ticketz-oss/ticketz/assets/6070736/8e85b263-73ca-4fb4-9bdc-03fff356b6ff)

Chave Pix: 0699c69d-0951-4686-a5b7-c6cd21aa7e15

[![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=X6XHVCPMRQEL4)
