import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const TermosDeUso = () => {
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
    hr: () => <hr className="border-border/40 my-8" />
  };

  const termos = `# Termos de Uso

**Última atualização: 04 de janeiro de 2026**

Bem-vindo ao **JurisIA** ("Aplicativo", "Plataforma", "nós" ou "nosso"). Ao acessar ou utilizar nossos serviços, você ("Usuário" ou "você") concorda integralmente com os presentes Termos de Uso. Leia atentamente antes de prosseguir.

---

## 1. Aceitação dos Termos

1.1. Ao criar uma conta, acessar ou utilizar o JurisIA, você declara ter lido, compreendido e concordado com estes Termos de Uso, bem como com nossa Política de Privacidade.

1.2. Caso você não concorde com qualquer disposição destes Termos, você deve cessar imediatamente o uso do Aplicativo.

1.3. Estes Termos constituem um contrato vinculante entre você e o JurisIA, nos termos do Código Civil Brasileiro (Lei nº 10.406/2002) e do Marco Civil da Internet (Lei nº 12.965/2014).

---

## 2. Descrição dos Serviços

2.1. O JurisIA é uma plataforma educacional que oferece:

- Acesso a legislação brasileira atualizada (Vade Mecum)
- Ferramentas de estudo para estudantes de Direito
- Simulados e questões preparatórias
- Assistente virtual com inteligência artificial
- Conteúdos jurídicos educacionais
- Audioaulas e videoaulas
- Flashcards e resumos

2.2. O conteúdo disponibilizado possui **caráter exclusivamente educacional e informativo**, não substituindo consultoria jurídica profissional.

2.3. Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer funcionalidade a qualquer momento, com ou sem aviso prévio.

---

## 3. Cadastro e Conta de Usuário

3.1. Para utilizar determinados recursos, é necessário criar uma conta fornecendo informações verdadeiras, completas e atualizadas.

3.2. Você é o único responsável por:
- Manter a confidencialidade de sua senha
- Todas as atividades realizadas em sua conta
- Notificar imediatamente qualquer uso não autorizado

3.3. É vedado:
- Criar contas com informações falsas
- Criar múltiplas contas para uma mesma pessoa
- Compartilhar credenciais de acesso
- Transferir ou vender sua conta a terceiros

3.4. Podemos suspender ou encerrar contas que violem estes Termos, sem aviso prévio.

---

## 4. Condições de Uso

4.1. Ao utilizar o JurisIA, você concorda em:
- Utilizar a plataforma apenas para fins lícitos
- Respeitar os direitos de propriedade intelectual
- Não realizar engenharia reversa ou decompilação
- Não tentar acessar áreas restritas do sistema
- Não disseminar vírus ou códigos maliciosos
- Não utilizar bots, scrapers ou automação não autorizada
- Não comercializar ou redistribuir conteúdo da plataforma

4.2. É expressamente proibido:
- Reproduzir, modificar ou criar obras derivadas sem autorização
- Utilizar o conteúdo para fins comerciais sem licenciamento
- Remover avisos de direitos autorais ou marcas registradas
- Fraudar sistemas de assinatura ou pagamento

---

## 5. Propriedade Intelectual

5.1. Todo o conteúdo do JurisIA, incluindo mas não limitado a textos, gráficos, logotipos, ícones, imagens, clipes de áudio, downloads digitais, compilações de dados e software, é propriedade do JurisIA ou de seus licenciadores e está protegido pelas leis brasileiras de propriedade intelectual, incluindo:
- Lei de Direitos Autorais (Lei nº 9.610/1998)
- Lei de Propriedade Industrial (Lei nº 9.279/1996)
- Lei de Software (Lei nº 9.609/1998)

5.2. A legislação brasileira disponibilizada na plataforma (Constituição, Códigos, Leis) é de domínio público, porém a organização, formatação, comentários, explicações e funcionalidades agregadas são de nossa propriedade exclusiva.

5.3. Conteúdos gerados por inteligência artificial dentro da plataforma são de propriedade do JurisIA.

---

## 6. Planos e Pagamentos

6.1. O JurisIA oferece:
- **Plano Gratuito**: Acesso limitado a funcionalidades básicas
- **Plano Premium**: Acesso completo mediante assinatura

6.2. As assinaturas são renovadas automaticamente, salvo cancelamento pelo usuário antes do término do período contratado.

6.3. Os pagamentos são processados por plataformas de terceiros (Stripe, Pix, cartão de crédito), sujeitos aos termos desses provedores.

6.4. **Política de Reembolso**: 
- Solicitações de reembolso devem ser feitas em até 7 (sete) dias após a compra, conforme o Código de Defesa do Consumidor (Lei nº 8.078/1990)
- Após esse período, não serão concedidos reembolsos proporcionais

6.5. Reservamo-nos o direito de alterar preços e planos, comunicando previamente aos usuários.

---

## 7. Limitação de Responsabilidade

7.1. O JurisIA é fornecido "como está" e "conforme disponibilidade", sem garantias de qualquer tipo, expressas ou implícitas.

7.2. **Não nos responsabilizamos por**:
- Decisões tomadas com base em conteúdos da plataforma
- Erros, omissões ou desatualização de informações
- Interrupções temporárias do serviço
- Perda de dados do usuário
- Danos indiretos, incidentais ou consequenciais
- Uso de conteúdos em processos judiciais ou administrativos

7.3. A legislação exibida pode conter erros de digitação ou não refletir alterações recentes. **Sempre consulte as fontes oficiais** (Planalto, diários oficiais) para fins profissionais.

7.4. As respostas da inteligência artificial são geradas automaticamente e podem conter imprecisões. Não constituem aconselhamento jurídico.

---

## 8. Isenção de Responsabilidade Jurídica

8.1. O JurisIA **NÃO** é um escritório de advocacia e **NÃO** presta serviços de assistência jurídica.

8.2. Nenhum conteúdo, resposta ou material disponibilizado deve ser interpretado como:
- Parecer jurídico
- Orientação para casos concretos
- Substituição de advogado habilitado na OAB

8.3. Para questões jurídicas específicas, consulte sempre um advogado devidamente inscrito na Ordem dos Advogados do Brasil.

---

## 9. Indenização

9.1. Você concorda em indenizar, defender e isentar o JurisIA, seus diretores, funcionários, parceiros e afiliados de qualquer reclamação, dano, perda, responsabilidade, custo ou despesa (incluindo honorários advocatícios) decorrentes de:
- Violação destes Termos
- Uso indevido da plataforma
- Violação de direitos de terceiros

---

## 10. Modificações dos Termos

10.1. Podemos alterar estes Termos a qualquer momento, publicando a versão atualizada no Aplicativo.

10.2. Alterações substanciais serão comunicadas por e-mail ou notificação na plataforma.

10.3. O uso continuado após as alterações constitui aceitação dos novos Termos.

---

## 11. Disposições Gerais

11.1. **Legislação Aplicável**: Estes Termos são regidos pelas leis da República Federativa do Brasil.

11.2. **Foro**: Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.

11.3. **Integralidade**: Estes Termos, juntamente com a Política de Privacidade, constituem o acordo integral entre as partes.

11.4. **Independência das Cláusulas**: A invalidade de qualquer disposição não afetará as demais.

11.5. **Tolerância**: A tolerância quanto a eventual descumprimento não implica renúncia a direitos.

---

## 12. Contato

Para dúvidas sobre estes Termos de Uso, entre em contato:

- **E-mail**: wn7corporation@gmail.com
- **Suporte no Aplicativo**: Menu > Suporte

---

*Ao utilizar o JurisIA, você reconhece ter lido, compreendido e concordado com estes Termos de Uso.*
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
        <h1 className="text-sm font-bold">Termos de Uso - Direito Premium</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 pb-24">
          <div className="animate-fade-in">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
              {termos}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermosDeUso;
