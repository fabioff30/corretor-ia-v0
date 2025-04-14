import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components"
import { formatCurrency } from "@/utils/format"

interface DonationReceiptEmailProps {
  name?: string
  amount: number
  transactionId: string
  date: string
}

export const DonationReceiptEmail = ({ name = "Apoiador", amount, transactionId, date }: DonationReceiptEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Recibo da sua doação para o CorretorIA</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Obrigado pela sua doação!</Heading>

          <Text style={text}>Olá {name},</Text>

          <Text style={text}>
            Muito obrigado pela sua generosa doação de {formatCurrency(amount)} para o CorretorIA. Sua contribuição nos
            ajuda a manter esta ferramenta gratuita e acessível para todos.
          </Text>

          <Section style={receipt}>
            <Heading as="h2" style={h2}>
              Recibo da Doação
            </Heading>
            <Text style={receiptText}>
              <strong>Valor:</strong> {formatCurrency(amount)}
            </Text>
            <Text style={receiptText}>
              <strong>Data:</strong> {date}
            </Text>
            <Text style={receiptText}>
              <strong>ID da Transação:</strong> {transactionId}
            </Text>
          </Section>

          <Text style={text}>
            Com sua ajuda, podemos continuar melhorando nossa ferramenta de correção de texto e ajudando milhares de
            pessoas a se comunicarem melhor em português.
          </Text>

          <Text style={text}>
            Se você tiver alguma dúvida sobre sua doação, não hesite em entrar em contato respondendo a este email ou
            escrevendo para contato@corretordetextoonline.com.br.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            CorretorIA - Correção de texto inteligente em português
            <br />© {new Date().getFullYear()} CorretorIA. Todos os direitos reservados.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
}

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "15px 0",
  padding: "0",
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
}

const receipt = {
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  border: "1px solid #eee",
}

const receiptText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
}

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "20px 0",
}

export default DonationReceiptEmail
