

# Teste Gratuito de 3 Dias da Evelyn + Coleta de Telefone na Primeira Visita

## Resumo

Remover a coleta de telefone do onboarding (tela BemVindoEvelyn) e mover toda a logica para a pagina da Evelyn no menu de rodape. Usuarios gratuitos verao "Teste gratis por 3 dias" em vez de "Seja Premium para acessar". Ao clicar, configuram o numero e a Evelyn envia a primeira mensagem. No backend, a Evelyn identifica usuarios em teste e, apos 3 dias, avisa que o teste expirou e envia o link da assinatura.

---

## Fluxo do Usuario

```text
[Menu Rodape] -> Clica "Evelyn"
  -> Se Premium: botao "Acessar agora" (como hoje)
  -> Se Gratuito:
     -> Primeira vez: Tela explicativa + coleta de telefone + cadastro
     -> Ja cadastrado (em teste): botao "Acessar agora" 
     -> Teste expirado: mensagem de expirado + link assinatura
```

---

## Parte 1: Tela da Evelyn (src/pages/Evelyn.tsx)

### Substituir o botao "Seja Premium" por "Teste gratis por 3 dias"

Para usuarios gratuitos sem Evelyn:
- Em vez do botao dourado "Seja Premium para acessar", mostrar um botao verde "Teste gratis por 3 dias"
- Abaixo, texto explicativo: "Experimente a Evelyn gratuitamente! Ela entende audio, texto, imagem e PDF."
- Ao clicar, expandir o formulario de configuracao de numero (nome, telefone, perfil) -- ja existe na aba "Configuracoes"
- Apos cadastrar, chamar a edge function `evelyn-enviar-mensagem` para enviar a primeira mensagem automatica da Evelyn para o usuario
- Mostrar confirmacao e botao "Acessar agora" para abrir o WhatsApp

### Verificar status do teste

- Ao carregar a pagina, verificar na tabela `evelyn_usuarios` se o usuario ja tem cadastro pelo telefone do profile
- Se tem cadastro e `data_primeiro_contato` + 3 dias > agora: mostrar "Acessar agora" com badge "Teste ativo - X dias restantes"
- Se tem cadastro e teste expirou: mostrar "Teste expirado" com link para /assinatura

---

## Parte 2: Tela BemVindoEvelyn (src/pages/BemVindoEvelyn.tsx)

- Remover a coleta de telefone desta pagina
- Manter o video e a explicacao sobre a Evelyn
- Simplificar: apos assistir/ver, botao unico "Continuar" que vai para `/auth?mode=signup`
- A pergunta "Quer que a Evelyn te envie mensagem?" sera removida daqui (movida para a pagina Evelyn)

---

## Parte 3: Backend - Edge Function processar-mensagem-evelyn

### Reativar periodo de teste de 3 dias

No arquivo `supabase/functions/processar-mensagem-evelyn/index.ts`:

1. **Mudar `ACESSO_LIVRE = true` para `false`** (ou criar logica condicional)
2. **Adicionar verificacao de teste gratuito**: 
   - Se `data_primeiro_contato` >= 15/02/2026 (hoje): aplicar regra de 3 dias
   - Se `data_primeiro_contato` < 15/02/2026: manter acesso livre (usuarios antigos)
3. **Quando teste expira**: 
   - Se usuario manda mensagem apos 3 dias e nao e Premium:
   - Enviar mensagem: "Seu periodo de teste gratuito da Evelyn expirou. Para continuar usando, assine o Direito Premium: https://www.direitopremium.com.br/assinatura"
   - Marcar `periodo_teste_expirado = true`
   - Nao processar mais mensagens ate virar Premium

### Logica de data

```text
Se data_primeiro_contato >= '2026-02-15':
  diasUsados = (agora - data_primeiro_contato) em dias
  Se diasUsados > 3 E nao e Premium:
    -> Enviar aviso de expiracao + link assinatura
    -> Nao responder mensagem
  Senao:
    -> Responder normalmente
Senao:
  -> Acesso livre (usuarios antigos)
```

---

## Parte 4: Edge Function para Enviar Primeira Mensagem

Reutilizar a edge function `evelyn-enviar-mensagem` ja existente para enviar a mensagem de boas-vindas automatica quando o usuario se cadastra na pagina da Evelyn.

Mensagem automatica: "Ola, [nome]! Sou a Evelyn, sua assistente juridica. Voce tem um teste gratuito de 3 dias! Me pergunte qualquer coisa sobre Direito."

---

## Detalhes Tecnicos

### Arquivos a modificar:

1. **`src/pages/Evelyn.tsx`** (linhas 295-317):
   - Substituir bloco `hasEvelynAccess ? ... : ...` por logica com 3 estados: Premium, Teste Ativo, Teste Nao Iniciado, Teste Expirado
   - Adicionar estado `trialStatus` com useEffect que consulta `evelyn_usuarios` pelo telefone do profile
   - Adicionar formulario inline (similar ao da aba Configuracoes) para coleta de numero na primeira vez
   - Apos cadastro, chamar edge function para enviar primeira mensagem

2. **`src/pages/BemVindoEvelyn.tsx`**:
   - Remover estados `showPhoneForm`, `phoneNumber`, `fullNumber`, `confirmed`
   - Remover pergunta sobre Evelyn enviar mensagem
   - Simplificar para: video + explicacao + botao "Continuar" -> `/auth?mode=signup`

3. **`supabase/functions/processar-mensagem-evelyn/index.ts`** (linhas 4-8, 2847-2849):
   - Adicionar constante `DATA_CORTE_TESTE = '2026-02-15'`
   - Adicionar `DIAS_TESTE = 3`
   - Na secao "ACESSO LIVRE" (linha 2847), adicionar verificacao:
     - Se `data_primeiro_contato >= DATA_CORTE_TESTE` e `diasUsados > DIAS_TESTE` e `!isPremiumUser`:
       - Enviar mensagem de expiracao com link
       - Retornar sem processar
     - Se ainda no teste: continuar normalmente

4. **`supabase/functions/mercadopago-webhook/index.ts`** (linhas 110-116):
   - Manter logica existente que marca `periodo_teste_expirado = false` quando usuario assina (ja existe)

### Nenhuma tabela nova necessaria
A tabela `evelyn_usuarios` ja possui os campos: `data_primeiro_contato`, `periodo_teste_expirado`, `aviso_teste_enviado`, `autorizado`.

