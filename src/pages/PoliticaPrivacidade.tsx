import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  const customComponents: Components = {
    p: ({ children }) => (
      <p className="text-[15px] leading-relaxed text-foreground/90 mb-4">
        {children}
      </p>
    ),
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-accent mb-6 mt-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-accent mb-4 mt-8">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-medium text-foreground mb-3 mt-6">
        {children}
      </h3>
    ),
    strong: ({ children }) => (
      <strong className="text-foreground font-bold">{children}</strong>
    ),
    ul: ({ children }) => (
      <ul className="space-y-2 my-4 list-disc list-inside">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="space-y-2 my-4 list-decimal list-inside">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-[15px] text-foreground/90 leading-relaxed ml-2">
        {children}
      </li>
    ),
    hr: () => <hr className="border-border/40 my-8" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse border border-border/40 text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-secondary/50">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="border border-border/40 px-4 py-2 text-left font-semibold">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border border-border/40 px-4 py-2">{children}</td>
    )
  };

  const politica = `# Política de Privacidade

**Última atualização: 04 de janeiro de 2026**

O **JurisIA** ("nós", "nosso" ou "Aplicativo") está comprometido com a proteção dos dados pessoais dos seus usuários, em conformidade com a **Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)** e demais normas aplicáveis.

Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos suas informações.

---

## 1. Definições Importantes

Para os fins desta Política:

- **Dados Pessoais**: Informações relacionadas a uma pessoa natural identificada ou identificável
- **Dados Sensíveis**: Dados sobre origem racial, convicção religiosa, opinião política, saúde, vida sexual, dados genéticos ou biométricos
- **Tratamento**: Toda operação realizada com dados pessoais (coleta, armazenamento, uso, compartilhamento, exclusão)
- **Titular**: Pessoa natural a quem se referem os dados pessoais
- **Controlador**: Pessoa responsável pelas decisões sobre o tratamento de dados (JurisIA)
- **Operador**: Pessoa que realiza o tratamento em nome do controlador
- **ANPD**: Autoridade Nacional de Proteção de Dados

---

## 2. Dados que Coletamos

### 2.1. Dados fornecidos diretamente por você:

- **Dados de cadastro**: Nome, e-mail, senha (criptografada)
- **Dados de perfil**: Foto (opcional), área de interesse, nível de estudo
- **Dados de pagamento**: Processados por terceiros (Stripe) - não armazenamos dados de cartão
- **Dados de comunicação**: Mensagens enviadas ao suporte, feedback

### 2.2. Dados coletados automaticamente:

- **Dados de uso**: Páginas visitadas, funcionalidades utilizadas, tempo de sessão
- **Dados do dispositivo**: Tipo de dispositivo, sistema operacional, navegador
- **Dados de conexão**: Endereço IP, data e hora de acesso
- **Cookies e tecnologias similares**: Preferências, sessão de autenticação

### 2.3. Dados gerados na plataforma:

- **Progresso de estudos**: Artigos lidos, flashcards revisados, simulados realizados
- **Interações com IA**: Perguntas e respostas do chat com a professora virtual
- **Anotações e grifos**: Marcações feitas em artigos de lei
- **Favoritos**: Conteúdos salvos pelo usuário

---

## 3. Finalidades do Tratamento

Utilizamos seus dados pessoais para as seguintes finalidades:

| Finalidade | Base Legal (LGPD) |
|------------|-------------------|
| Prestação do serviço contratado | Execução de contrato (Art. 7º, V) |
| Criação e gerenciamento de conta | Execução de contrato (Art. 7º, V) |
| Processamento de pagamentos | Execução de contrato (Art. 7º, V) |
| Personalização da experiência | Legítimo interesse (Art. 7º, IX) |
| Envio de comunicações sobre o serviço | Execução de contrato (Art. 7º, V) |
| Envio de marketing (opcional) | Consentimento (Art. 7º, I) |
| Melhoria e desenvolvimento do aplicativo | Legítimo interesse (Art. 7º, IX) |
| Segurança e prevenção de fraudes | Legítimo interesse (Art. 7º, IX) |
| Cumprimento de obrigações legais | Obrigação legal (Art. 7º, II) |
| Análises estatísticas e relatórios | Legítimo interesse (Art. 7º, IX) |

---

## 4. Compartilhamento de Dados

### 4.1. Com quem compartilhamos:

- **Provedores de infraestrutura**: Supabase (banco de dados), Vercel (hospedagem)
- **Processadores de pagamento**: Stripe
- **Serviços de e-mail**: Para comunicações transacionais
- **Serviços de análise**: Para métricas de uso (dados anonimizados)
- **Autoridades públicas**: Quando exigido por lei ou ordem judicial

### 4.2. Não compartilhamos:

- Dados com terceiros para fins de marketing sem seu consentimento
- Dados sensíveis (não coletamos)
- Dados com empresas para venda ou comercialização

### 4.3. Transferência internacional:

Alguns de nossos provedores estão localizados fora do Brasil. Nestes casos, garantimos que a transferência é realizada de forma segura, com cláusulas contratuais padrão ou para países com nível adequado de proteção, conforme exigido pela LGPD.

---

## 5. Armazenamento e Segurança

### 5.1. Medidas de segurança:

- Criptografia de dados em trânsito (HTTPS/TLS)
- Criptografia de senhas (bcrypt/hash)
- Controle de acesso baseado em funções
- Monitoramento de atividades suspeitas
- Backups regulares e seguros
- Políticas de segurança da informação

### 5.2. Período de retenção:

- **Dados de conta**: Enquanto a conta estiver ativa + 5 anos após exclusão (obrigação legal)
- **Dados de pagamento**: Conforme exigência fiscal (5 anos)
- **Logs de acesso**: 6 meses (Marco Civil da Internet)
- **Dados de uso**: 2 anos para análises
- **Após exclusão**: Dados são anonimizados ou excluídos definitivamente

---

## 6. Seus Direitos (Art. 18 da LGPD)

Você tem direito a:

1. **Confirmação e acesso**: Saber se tratamos seus dados e acessá-los
2. **Correção**: Corrigir dados incompletos, inexatos ou desatualizados
3. **Anonimização, bloqueio ou eliminação**: De dados desnecessários ou excessivos
4. **Portabilidade**: Receber seus dados em formato estruturado
5. **Eliminação**: Solicitar a exclusão de dados tratados com consentimento
6. **Informação sobre compartilhamento**: Saber com quem seus dados são compartilhados
7. **Revogação do consentimento**: Retirar consentimento a qualquer momento
8. **Oposição**: Opor-se a tratamento em desconformidade com a LGPD

### Como exercer seus direitos:

- **Pelo aplicativo**: Menu > Perfil > Meus Dados
- **Por e-mail**: wn7corporation@gmail.com
- **Prazo de resposta**: Até 15 dias úteis

---

## 7. Cookies e Tecnologias de Rastreamento

### 7.1. O que são cookies:

Cookies são pequenos arquivos armazenados no seu dispositivo para lembrar preferências e melhorar sua experiência.

### 7.2. Tipos de cookies que utilizamos:

- **Cookies essenciais**: Necessários para o funcionamento (autenticação, segurança)
- **Cookies de preferências**: Salvam suas configurações (tema, idioma)
- **Cookies analíticos**: Ajudam a entender como você usa o aplicativo

### 7.3. Gerenciamento:

Você pode desativar cookies nas configurações do navegador, mas algumas funcionalidades podem ser afetadas.

---

## 8. Menores de Idade

8.1. O JurisIA é destinado a maiores de 16 anos.

8.2. Menores de 16 anos só podem utilizar com consentimento de pais ou responsáveis legais.

8.3. Não coletamos intencionalmente dados de menores de 13 anos. Se identificarmos, excluiremos imediatamente.

---

## 9. Alterações na Política

9.1. Esta Política pode ser atualizada periodicamente.

9.2. Alterações significativas serão comunicadas por:
- Notificação no aplicativo
- E-mail (para alterações materiais)
- Atualização da data de "última atualização"

9.3. Recomendamos revisar periodicamente esta Política.

---

## 10. Incidentes de Segurança

10.1. Em caso de incidente de segurança que possa acarretar risco aos titulares, comunicaremos:
- A Autoridade Nacional de Proteção de Dados (ANPD)
- Os titulares afetados

10.2. A comunicação incluirá:
- Natureza dos dados afetados
- Medidas técnicas e de segurança adotadas
- Riscos relacionados
- Medidas para reverter ou mitigar efeitos

---

## 11. Encarregado de Dados (DPO)

Conforme a LGPD, indicamos um Encarregado pelo Tratamento de Dados Pessoais:

- **Canal de contato**: wn7corporation@gmail.com
- **Atribuições**: Receber reclamações, prestar esclarecimentos, adotar providências

---

## 12. Disposições Finais

12.1. Esta Política é regida pelas leis brasileiras, especialmente:
- Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
- Marco Civil da Internet (Lei nº 12.965/2014)
- Código de Defesa do Consumidor (Lei nº 8.078/1990)

12.2. Dúvidas não esclarecidas podem ser direcionadas à ANPD.

---

## 13. Contato

Para questões sobre privacidade e proteção de dados:

- **E-mail**: wn7corporation@gmail.com
- **Suporte no Aplicativo**: Menu > Suporte

---

*Ao utilizar o JurisIA, você declara ter lido e compreendido esta Política de Privacidade.*
`;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-lg px-3 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-sm font-bold">Política de Privacidade - Direito Premium</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 pb-24">
          <div className="animate-fade-in">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
              {politica}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
