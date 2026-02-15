

# Ajustes no Carrossel de Boas-Vindas e Tela de Autenticacao

## 1. Imagens proprias para mobile no carrossel

As imagens atuais (`estudos-section.webp`, `vade-mecum-section.webp`, etc.) sao horizontais/paisagem e ficam esticadas ou cortadas no mobile. O carrossel precisa usar imagens no formato vertical (retrato) otimizadas para mobile.

O projeto ja possui imagens verticais na pasta `src/assets/landing/`: `welcome-1.webp`, `welcome-2.png` ate `welcome-8.png`. Alem disso, existem imagens como `themis-full.webp`, `advogado-discursando-vertical.webp`, e assets de onboarding que sao verticais.

**Solucao**: Cada slide tera duas imagens - uma para mobile (vertical, usando assets existentes ou os welcome-*.png) e outra para desktop (horizontal, mantendo as atuais). O componente usara `object-position: center` para garantir foco central nas imagens.

---

## 2. Melhorar textos e frases dos slides

Tornar as frases mais impactantes e focadas nos beneficios concretos para o usuario, com linguagem persuasiva e juridica.

Novos textos planejados:

| Slide | Titulo | Subtitulo |
|-------|--------|-----------|
| 1 | Domine todas as materias do Direito | Videoaulas completas, trilhas personalizadas e aulas interativas para voce estudar no seu ritmo. |
| 2 | Vade Mecum Inteligente e Comentado | Todas as leis com narracao por voz, destaques coloridos, anotacoes pessoais e comentarios de especialistas. |
| 3 | A maior Biblioteca Juridica Digital | Mais de 1.200 livros de doutrina, legislacao, OAB e concursos na palma da sua mao. |
| 4 | Evelyn: Sua Professora Particular 24h | Tire duvidas por audio, texto, imagem ou PDF com a assistente que entende de Direito como ninguem. |
| 5 | Aprovacao na OAB e Concursos Publicos | Simulados cronometrados, questoes comentadas, 1a e 2a fase da OAB e concursos — tudo em um so lugar. |
| 6 | Tudo para a sua aprovacao | Flashcards, mapas mentais, resumos inteligentes e mais de 10.000 questoes para voce dominar o Direito. |

---

## 3. Tela de autenticacao: separar "Cadastrar" e "Entrar"

Atualmente, a pagina `/auth` sempre abre no modo login. O parametro `?mode=` na URL nao e lido pelo componente.

**Correcoes**:

- Fazer `Auth.tsx` ler o parametro `mode` da URL: se `?mode=login`, abre em modo login. Se `?mode=signup`, abre em modo cadastro.
- Quando vem de "Quero ser Aluno" (via `/bem-vindo-evelyn` -> `/auth?mode=signup`): mostrar **apenas** o formulario de cadastro, sem a aba "Entrar".
- Quando vem de "Ja sou Aluno" (`/auth?mode=login`): mostrar **apenas** o formulario de login, sem a aba "Cadastrar".
- Adicionar um link discreto embaixo para quem quer trocar ("Ja tem conta? Entre aqui" / "Nao tem conta? Cadastre-se").

---

## Detalhes Tecnicos

### Arquivo: `src/pages/Welcome.tsx`

1. Adicionar import de imagens verticais existentes (welcome-1.webp e outros assets verticais do projeto)
2. Atualizar array `slides` para incluir campo `mobileImage` com imagens verticais
3. Usar `useIsMobile()` ou media query para selecionar imagem correta
4. Melhorar `object-position: center` nas imagens para centralizar o foco
5. Atualizar textos dos slides com frases mais impactantes

### Arquivo: `src/pages/Auth.tsx`

1. **Linha 70**: Alterar inicializacao do `mode` para ler `searchParams.get('mode')`:
   ```
   const urlMode = searchParams.get('mode');
   const initialMode = isRecoveryFromUrl ? 'reset' : (urlMode === 'signup' ? 'signup' : 'login');
   ```

2. **Linhas 402-429**: Adicionar variavel `hideToggle` que esconde o toggle de abas quando `urlMode` esta definido. Substituir o toggle por um link discreto:
   - Se modo signup: "Ja tem conta? Entre aqui" (link para `/auth?mode=login`)
   - Se modo login: "Nao tem conta? Cadastre-se" (link para `/auth?mode=signup`)

### Nenhum outro arquivo precisa ser modificado.

