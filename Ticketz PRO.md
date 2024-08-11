# Ticketz PRO

O Ticketz PRO é o Ticketz com fornecimento de suporte para o uso e operação, e receberá
features exclusivas.

O Ticketz PRO é um produto licenciado para uso na infraestrutura do cliente tanto
para uso próprio quanto para comercialização na modalidade SaaS Whitelabel.

**A Licença e o suporte são fornecidos mediante uma assinatura mensal no valor de R$ 199**

Para efetuar a assinatura basta instalar (ou atualizar) o sistema seguindo as instruções abaixo,
após acessar com a conta admin@admin.com (senha padrão é 123456) basta entrar na
tela **"Configurações"** e preencher o formulário para a assinatura utilizando
cartão de crédito com recorrência automática.

> Quem desejar pagar a assinatura utilizando PIX, Boleto ou outra modalidade suportada
> pelo Mercado Pago pode entrar em contato para fazer a assinatura através de um link
> que permitirá estas formas de pagamento.
>
> Telefone/Whatsapp 49 99981 2291

## Instalação

Para instalar o Ticketz PRO o comando é semelhante ao da versão Open Source,
adicionando apenas um parâmetro para indicar a "branch" a ser utilizada para
a configuração dos containers.

Da mesma maneira, é necessário cumprir o checklist:

- [X] Servidor sem nada instalado além do sistema operacional, preferencialmente Ubuntu 20 ou posterior
- [X] Portas 80 e 443 disponíveis e não filtradas por firewall
- [X] Um hostname configurado do DNS apontando para o servidor

Passado o checklist, o seguinte comando instala o Ticketz PRO:

```bash
curl -sSL get.ticke.tz | sudo bash -s -- -b pro hostname.example.com email@example.com
```

**ATENÇÃO**: O email precisa ser um endereço válido para a correga geração do certificado SSL.

## Atualizar o Ticketz OSS para o Ticketz PRO

O mesmo comando pode atualizar tanto as instalações feitas pelo comando simplificado quanto as feitas
a partir do código fonte. É importante porém salientar que o Ticketz PRO não pode ser personalizado
por não ser fornecido como código aberto.

> **IMPORTANTE:** Caso seja uma instalação feita a partir do código fonte é necessário entrar dentro
> da pasta antes de passar o comando.

```bash
curl -sSL update.ticke.tz | sudo bash -s pro
```

## Atualizações Posteriores

Uma vez alterado para a versão PRO, o comando de atualização é o mesmo de sempre, sem nenhum parâmetro adicional

```bash
curl -sSL update.ticke.tz | sudo bash
```
