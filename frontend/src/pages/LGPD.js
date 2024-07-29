import React from "react";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Box from "@material-ui/core/Box";
import Link from "@material-ui/core/Link";

const LGPD = () => {
  return (
    <Container component="main" maxWidth="md">
      <Box mt={5}>
        <Typography variant="h4" gutterBottom>
          Regras da LGPD (Lei Geral de Proteção de Dados)
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Introdução</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          A Lei Geral de Proteção de Dados Pessoais (LGPD) foi criada para proteger os direitos fundamentais de liberdade e de privacidade e o livre desenvolvimento da personalidade da pessoa natural. Esta política de privacidade explica como coletamos, usamos, divulgamos e protegemos as suas informações pessoais, de acordo com a LGPD.
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Coleta de Dados Pessoais</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          Nós coletamos informações pessoais que você nos fornece diretamente, como ao se cadastrar em nossos serviços, preencher formulários ou entrar em contato conosco. As informações pessoais que coletamos podem incluir:
        </Typography>
        <Typography variant="body2" paragraph>
          - Nome<br />
          - Endereço de e-mail<br />
          - Número de telefone<br />
          - Informações de pagamento<br />
          - Informações de uso do serviço
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Uso dos Dados Pessoais</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          Nós usamos as suas informações pessoais para:
        </Typography>
        <Typography variant="body2" paragraph>
          - Fornecer, operar e manter nossos serviços<br />
          - Melhorar, personalizar e expandir nossos serviços<br />
          - Compreender e analisar como você usa nossos serviços<br />
          - Desenvolver novos produtos, serviços, recursos e funcionalidades<br />
          - Comunicar com você, diretamente ou através de nossos parceiros, inclusive para atendimento ao cliente, fornecer atualizações e outras informações relacionadas ao serviço, e para fins de marketing e promoção<br />
          - Processar suas transações e gerenciar pedidos<br />
          - Prevenir fraudes e proteger nossos serviços
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Compartilhamento de Dados Pessoais</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          Nós não vendemos, comercializamos ou transferimos suas informações pessoais a terceiros, exceto quando necessário para operar nossos serviços, cumprir a lei, proteger nossos direitos, ou para operar nosso negócio.
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Seus Direitos</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          De acordo com a LGPD, você tem o direito de:
        </Typography>
        <Typography variant="body2" paragraph>
          - Confirmar a existência de tratamento de dados pessoais<br />
          - Acessar os seus dados pessoais<br />
          - Corrigir dados incompletos, inexatos ou desatualizados<br />
          - Anonimizar, bloquear ou eliminar dados desnecessários, excessivos ou tratados em desconformidade com a LGPD<br />
          - Portar seus dados pessoais a outro fornecedor de serviço ou produto<br />
          - Eliminar dados pessoais tratados com seu consentimento<br />
          - Obter informações sobre as entidades públicas ou privadas com as quais compartilhamos seus dados<br />
          - Ser informado sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa<br />
          - Revogar seu consentimento a qualquer momento
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Segurança dos Dados Pessoais</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          Implementamos medidas de segurança para proteger suas informações pessoais contra acessos não autorizados, alteração, divulgação ou destruição. No entanto, é importante lembrar que nenhum método de transmissão pela internet ou método de armazenamento eletrônico é 100% seguro.
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Alterações a esta Política</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          Podemos atualizar nossa política de privacidade periodicamente para refletir mudanças em nossas práticas de privacidade. Recomendamos que você reveja esta política regularmente para se manter informado sobre como estamos protegendo suas informações.
        </Typography>

        <Typography variant="body1" paragraph>
          <strong>Contato</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          Se você tiver alguma dúvida sobre esta política de privacidade, entre em contato conosco:
        </Typography>
        <Typography variant="body2" paragraph>
          - Endereço: Rua Aristoteles dos Santos, 171 Jardim Brasília - Uberlândia - MG, CEP: 38401886<br />
          - E-mail: <Link href="mailto:robson.lpvoice@gmail.com">robson.lpvoice@gmail.com</Link><br />
          - Telefone: (34) 9-9961-1376
        </Typography>
      </Box>
    </Container>
  );
};

export default LGPD;