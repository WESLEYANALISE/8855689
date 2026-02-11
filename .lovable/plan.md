
## Pagina de Apresentacao (Landing Page) antes da Autenticacao

### Objetivo
Criar uma pagina `/welcome` que sera exibida antes da tela de login/cadastro. Funcionara como uma vitrine do app com carrossel de prints, video demonstrativo e CTA para cadastro.

### Estrutura da Pagina

A pagina tera as seguintes secoes, em ordem vertical:

**1. Hero Section**
- Fundo com imagem da deusa Themis (`themis-full.webp`) com overlay escuro e gradiente
- Logo "Direito Premium" no topo
- Headline chamativa focada na dor do estudante: "Cansado de estudar Direito sem rumo?"
- Subtitulo persuasivo: "Tudo do Direito em um so lugar. Aulas, leis, flashcards e IA."
- Animacao de entrada (fade-in + slide-up) com framer-motion

**2. Secao "Demonstrativo" - Video do YouTube**
- Titulo da secao: "Demonstrativo"
- Embed do YouTube Shorts `vx7xFDI_MDE` em formato vertical responsivo
- Borda estilizada e sombra

**3. Carrossel de Screenshots do App**
- Usando o componente Carousel (Embla) ja existente no projeto
- 7 imagens fornecidas pelo usuario (prints do app) copiadas para `src/assets/landing/`
- Cada slide mostra uma imagem em formato vertical (mockup de celular)
- Indicadores de paginacao (dots) na parte inferior
- Auto-play com pausa ao tocar
- Responsivo: imagens com altura adequada em mobile e desktop

**4. Secao de Funcionalidades**
- Grid com icones e descricoes curtas das funcionalidades principais:
  - Videoaulas de todas as materias
  - Jornada Juridica com aulas explicativas
  - Flashcards inteligentes
  - Biblioteca Juridica com +1200 livros
  - Preparacao OAB 1a e 2a Fase
  - Vade Mecum Comentado
  - Estudos de Politica e Atualidades
- Cada item com icone do Lucide e animacao de entrada escalonada

**5. CTA Final**
- Botao grande e destacado: "Comecar Agora" ou "Acessar Gratuitamente"
- Animacao pulsante para chamar atencao
- Ao clicar, navega para `/auth`
- Texto de apoio abaixo: "Cadastro rapido e gratuito"

### Mudancas Tecnicas

**Arquivos novos:**
- `src/pages/Welcome.tsx` - Pagina completa com todas as secoes

**Arquivos de imagem (copiar das uploads para o projeto):**
- `src/assets/landing/welcome-1.png` (imagem 1 - Estude tudo sobre o Direito)
- `src/assets/landing/welcome-2.png` (imagem 2 - Vade Mecum Comentado)
- `src/assets/landing/welcome-3.png` (imagem 3 - Videoaulas)
- `src/assets/landing/welcome-4.png` (imagem 4 - Jornada Juridica)
- `src/assets/landing/welcome-5.png` (imagem 5 - Flashcards)
- `src/assets/landing/welcome-6.png` (imagem 6 - Biblioteca Juridica)
- `src/assets/landing/welcome-7.png` (imagem 7 - OAB)
- `src/assets/landing/welcome-8.png` (imagem 8 - Politica)

**Arquivos modificados:**
- `src/App.tsx` - Adicionar rota `/welcome` fora do Layout e do ProtectedRoute
- `src/components/auth/ProtectedRoute.tsx` - Quando usuario nao autenticado, redirecionar para `/welcome` em vez de `/auth`

### Fluxo do Usuario

```text
Usuario abre o app
       |
       v
  /welcome (Landing Page)
       |
  [Navega pelo carrossel, assiste video]
       |
  [Clica "Comecar Agora"]
       |
       v
    /auth (Login / Cadastro)
       |
       v
  /onboarding (se novo)
       |
       v
    / (Home)
```

### Tecnologias Utilizadas
- Framer Motion (ja instalado) para animacoes de entrada
- Embla Carousel (ja instalado) com autoplay para o carrossel de imagens
- YouTube iframe embed para o video
- Tailwind CSS para layout e responsividade
- Assets da deusa Themis ja existentes no projeto para o fundo
