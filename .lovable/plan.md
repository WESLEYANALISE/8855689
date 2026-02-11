

## Substituir Botao WhatsApp por Chatbot de Vendas na Pagina de Assinatura

### O que muda

O botao verde flutuante do WhatsApp na pagina de assinatura sera substituido por um chatbot interno que funciona como um "consultor de vendas" humanizado. Ele responde duvidas sobre o plano Premium, funcionalidades, precos e formas de pagamento usando a IA Gemini.

### Como vai funcionar

1. O botao flutuante verde vira um botao de chat (mesmo estilo, mesma posicao)
2. Ao clicar, abre um modal de chat com a "Consultora Premium"
3. O chat tera perguntas pre-prontas como:
   - "Quais funcoes estao incluidas no Premium?"
   - "Quanto custa e como pago?"
   - "O acesso e realmente vitalicio?"
   - "Posso testar antes de assinar?"
   - "O que muda sem anuncios?"
4. A IA responde de forma humanizada, persuasiva e informativa, sempre baseada nas funcionalidades reais do app
5. As respostas vem do edge function `gemini-chat` ja existente, com um prompt de sistema especifico para vendas

### Detalhes Tecnicos

**Novo componente: `src/components/assinatura/ConsultoraChatModal.tsx`**
- Modal de chat similar ao `ProfessoraChatModal` (mesmo padrao visual)
- Mensagem de boas-vindas humanizada da "Consultora Premium"
- 5-6 perguntas sugeridas pre-definidas sobre o plano
- Envia mensagens para o edge function `gemini-chat` com um prompt de sistema que contem todas as informacoes do plano (preco R$89,90, funcionalidades, beneficios)
- Respostas renderizadas com ReactMarkdown
- Botao "Assinar Agora" embutido no chat quando relevante

**Arquivo modificado: `src/pages/Assinatura.tsx`**
- Remover o link do WhatsApp (linhas 375-384)
- Adicionar estado para controlar abertura do chat
- Adicionar botao flutuante que abre o `ConsultoraChatModal`
- Importar o novo componente

**Edge function `gemini-chat`**: Ja existe e sera reutilizada. O prompt de sistema sera montado no frontend antes de enviar, contendo:
- Todas as funcionalidades do Premium
- Preco e forma de pagamento
- Tom humanizado e persuasivo
- Instrucao para sempre convidar a pessoa a assinar

### Resultado

- O usuario clica no botao flutuante e conversa com uma IA que conhece tudo sobre o plano
- Perguntas sugeridas facilitam a interacao
- A IA responde de forma natural, explicando beneficios e tirando duvidas
- Experiencia mais imersiva do que redirecionar para o WhatsApp
