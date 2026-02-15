

# Tela de Boas-Vindas com Carrossel + Tela da Evelyn

## Resumo

Criar um novo fluxo de entrada antes da autenticacao. Ao acessar o app, o usuario vera um carrossel fullscreen com slides sobre os beneficios do Direito Premium (imagens juridicas + frases impactantes), seguido de dois botoes: "Quero ser Aluno" e "Ja sou Aluno". Apos isso, uma tela intermediaria apresenta a Evelyn (assistente IA via WhatsApp) com opcao de fornecer o numero de telefone.

---

## Fluxo Completo

```text
[Carrossel de Boas-Vindas]  -->  "Quero ser Aluno"  -->  [Tela Evelyn]  -->  "Sim" (coleta telefone)  -->  /auth (modo signup)
                                                                          -->  "Nao"                   -->  /auth (modo signup)
                             -->  "Ja sou Aluno"     -->  /auth (modo login)
```

---

## Parte 1: Novo Carrossel de Boas-Vindas (substituir Welcome.tsx)

A pagina `/welcome` sera totalmente reescrita como um carrossel fullscreen swipavel com 5-6 slides. Cada slide tera:

- Imagem de fundo fullscreen (reutilizando assets existentes como `themis-full.webp`, `estudos-section.webp`, `biblioteca-section-opt.webp`, `evelyn-ai-section.webp`, `oab-section.webp`, `vade-mecum-section.webp`)
- Frase principal em negrito sobre o beneficio
- Subtitulo explicativo
- Barra de progresso no topo (indicando qual slide esta ativo, como na imagem de referencia)

### Slides planejados:

1. **Videoaulas e Trilhas de Estudo** - "Domine todas as materias do Direito com videoaulas e trilhas personalizadas" (fundo: estudos-section)
2. **Vade Mecum Inteligente** - "Acesse todas as leis comentadas, com narracao e destaques" (fundo: vade-mecum-section)
3. **Biblioteca Juridica** - "Mais de 1.200 livros juridicos ao seu alcance" (fundo: biblioteca-section-opt)
4. **Evelyn - IA Assistente** - "Tire duvidas por audio, texto, imagem ou PDF com nossa IA no WhatsApp" (fundo: evelyn-ai-section)
5. **OAB e Concursos** - "Preparacao completa para OAB 1a e 2a fase e concursos publicos" (fundo: oab-section)
6. **Tudo em um so lugar** - "Flashcards, questoes, mapas mentais e muito mais para sua aprovacao" (fundo: themis-full)

Na parte inferior de todos os slides, aparecerao os dois botoes fixos:
- **"Quero ser Aluno(a)!"** - botao primario (vermelho/primary)
- **"Ja sou Aluno(a)"** - botao outline/secundario

O carrossel tera auto-play (5 segundos por slide) e swipe manual.

---

## Parte 2: Tela da Evelyn (nova pagina intermediaria)

Quando o usuario clica "Quero ser Aluno(a)!", ele sera direcionado para uma nova tela intermediaria (`/bem-vindo-evelyn`) antes de ir para `/auth`.

Esta tela tera:
- Video da Evelyn (YouTube embed: `HlE9u1c_MPQ`, ja usado no app)
- Texto explicativo: "Conheca a Evelyn, sua assistente pessoal juridica no WhatsApp. Ela entende audio, texto, imagem e PDF!"
- Pergunta: "Quer que a Evelyn te envie uma mensagem para voce interagir com ela?"
- Botao **"Sim, quero!"**: expande um formulario de telefone com:
  - Input de telefone (usando o componente `PhoneInput` ja existente)
  - Botao de confirmar
  - Mensagem: "A Evelyn vai te enviar uma mensagem em breve!"
  - Apos confirmacao, salva o telefone temporariamente (localStorage) e redireciona para `/auth` (modo signup)
- Botao **"Nao, obrigado"**: redireciona direto para `/auth` (modo signup)

---

## Parte 3: Corrigir build error existente

O build error atual precisa ser corrigido primeiro. Vou verificar e corrigir qualquer erro de compilacao no `SerpentineNiveis.tsx` que foi editado na mensagem anterior.

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/pages/BemVindoEvelyn.tsx` - Tela intermediaria com video da Evelyn e coleta de telefone

### Arquivos a modificar:
- `src/pages/Welcome.tsx` - Reescrever como carrossel fullscreen com slides de beneficios e botoes "Quero ser Aluno" / "Ja sou Aluno"
- `src/App.tsx` - Adicionar rota `/bem-vindo-evelyn` e ajustar rota `/welcome` para nao redirecionar mais para `/auth`
- `src/components/shared/SerpentineNiveis.tsx` - Corrigir build error existente

### Logica de navegacao:
- `/welcome` agora mostra o carrossel (nao redireciona mais para `/auth`)
- "Quero ser Aluno(a)!" -> `/bem-vindo-evelyn`
- "Ja sou Aluno(a)" -> `/auth` (modo login)
- Na tela Evelyn, "Sim" -> coleta telefone -> salva em localStorage -> `/auth?mode=signup`
- Na tela Evelyn, "Nao" -> `/auth?mode=signup`
- No fluxo de cadastro, se houver telefone no localStorage, sera associado ao perfil apos o signup

### Componentes reutilizados:
- `PhoneInput` - ja existe no projeto para input de telefone
- `framer-motion` - para animacoes de transicao entre slides
- `embla-carousel-react` - ja instalado, usado para o carrossel swipavel
- Imagens da pasta `src/assets/landing/` e `src/assets/`

### Seguranca do telefone:
- Telefone armazenado temporariamente em localStorage
- Limpo apos associacao ao perfil ou apos 24h
- Validacao de formato antes de salvar

