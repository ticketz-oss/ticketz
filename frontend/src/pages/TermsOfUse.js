import React from "react";
import { Container, Typography, Box, Link } from "@material-ui/core";

const TermsOfUse = () => {
  return (
    <Container component="main" maxWidth="md">
      <Box mt={5}>
        <Typography variant="h4" gutterBottom>
          Termos de Uso
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          1. Aceitação dos Termos
        </Typography>
        <Typography variant="body1" paragraph>
          Ao utilizar o software Meuzap, você concorda com os seguintes Termos de Uso. Caso não concorde com qualquer um dos termos aqui descritos, não utilize o software.
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          2. Definições
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>2.1. Software:</strong> refere-se ao Meuzap, um software open source disponibilizado sob a licença GNU Affero General Public License versão 3.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>2.2. Usuário:</strong> qualquer pessoa física ou jurídica que utilize o software.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>2.3. Desenvolvedor:</strong> a equipe ou indivíduo(s) responsável(eis) pelo desenvolvimento e manutenção do software.
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          3. Uso do Software
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>3.1. Licença:</strong> O software é distribuído sob a licença GNU Affero General Public License versão 3. Você está livre para usar, copiar, modificar e distribuir o software, desde que cumpra os termos da licença.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>3.2. Responsabilidade:</strong> O uso do software é por sua conta e risco. O desenvolvedor não se responsabiliza por quaisquer danos diretos ou indiretos resultantes do uso ou da incapacidade de usar o software.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>3.3. Alterações e Distribuição:</strong> Você pode modificar o software para atender às suas necessidades e distribuí-lo sob a mesma licença, desde que mantenha os avisos de copyright e os termos da licença intactos.
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          4. Propriedade Intelectual
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>4.1. Direitos Autorais:</strong> O software é protegido por direitos autorais e outras leis de propriedade intelectual. Todos os direitos não expressamente concedidos pela licença são reservados.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>4.2. Marcas Registradas:</strong> Quaisquer marcas registradas, logotipos e marcas de serviço exibidos no software são de propriedade de seus respectivos proprietários.
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          5. Privacidade
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>5.1. Coleta de Dados:</strong> O software pode coletar dados de uso para melhorar sua funcionalidade e desempenho. Quaisquer dados coletados serão tratados de acordo com a <Link href="#">Política de Privacidade</Link> do software.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>5.2. Consentimento:</strong> Ao utilizar o software, você concorda com a coleta e o uso de informações conforme descrito na <Link href="#">Política de Privacidade</Link>.
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          6. Modificações dos Termos
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>6.1. Alterações:</strong> O desenvolvedor reserva-se o direito de modificar estes Termos de Uso a qualquer momento. As mudanças serão publicadas nesta página e a data de revisão será atualizada.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>6.2. Notificação:</strong> É sua responsabilidade revisar periodicamente estes Termos de Uso. O uso continuado do software após quaisquer modificações constitui aceitação dos novos termos.
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          7. Legislação Aplicável e Foro
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>7.1. Legislação:</strong> Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>7.2. Foro:</strong> Qualquer disputa decorrente ou relacionada a estes Termos de Uso será resolvida no foro da comarca de [Cidade], Estado de [Estado], com exclusão de qualquer outro, por mais privilegiado que seja.
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          8. Contato
        </Typography>
        <Typography variant="body1" paragraph>
          Se você tiver qualquer dúvida sobre estes Termos de Uso, entre em contato conosco em <Link href="mailto:Robson.lpvoice@gmail.com">Robson.lpvoice@gmail.com</Link>.
        </Typography>
      </Box>
    </Container>
  );
};

export default TermsOfUse;