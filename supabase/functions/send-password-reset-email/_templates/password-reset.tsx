import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
  Hr,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface PasswordResetEmailProps {
  userName?: string;
  resetLink: string;
}

export const PasswordResetEmail = ({
  userName,
  resetLink,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Redefinir sua senha - Vade Mecum Elite</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Heading style={logo}>⚖️ Vade Mecum Elite</Heading>
        </Section>

        {/* Content */}
        <Section style={content}>
          <Heading style={h1}>Redefinir sua senha</Heading>
          
          <Text style={text}>
            Olá{userName ? `, ${userName}` : ''}!
          </Text>
          
          <Text style={text}>
            Recebemos uma solicitação para redefinir a senha da sua conta no Vade Mecum Elite. 
            Clique no botão abaixo para criar uma nova senha:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Redefinir Minha Senha
            </Button>
          </Section>

          <Text style={textSmall}>
            Ou copie e cole este link no seu navegador:
          </Text>
          <Text style={linkText}>
            {resetLink}
          </Text>

          <Hr style={hr} />

          <Text style={warningText}>
            ⚠️ Se você não solicitou a redefinição de senha, ignore este e-mail. 
            Sua senha permanecerá inalterada.
          </Text>

          <Text style={textSmall}>
            Este link expira em 1 hora por motivos de segurança.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            © 2024 Vade Mecum Elite - Todos os direitos reservados
          </Text>
          <Text style={footerText}>
            Dúvidas? Entre em contato conosco.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const header = {
  background: 'linear-gradient(135deg, #1e3a5f 0%, #dc2626 100%)',
  borderRadius: '8px 8px 0 0',
  padding: '32px 40px',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '0 0 8px 8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
}

const h1 = {
  color: '#1e3a5f',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const textSmall = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '12px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const linkText = {
  color: '#dc2626',
  fontSize: '12px',
  lineHeight: '20px',
  wordBreak: 'break-all' as const,
  margin: '8px 0 24px',
}

const hr = {
  borderColor: '#e5e5e5',
  margin: '24px 0',
}

const warningText = {
  color: '#856404',
  backgroundColor: '#fff3cd',
  borderRadius: '6px',
  padding: '12px 16px',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0',
}

const footer = {
  textAlign: 'center' as const,
  marginTop: '24px',
}

const footerText = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '4px 0',
}
