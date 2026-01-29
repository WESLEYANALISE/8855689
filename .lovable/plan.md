
## Plano: Sistema de Videoaulas OAB com 20 Playlists do YouTube

### Visão Geral
Implementar um sistema completo de videoaulas para a 1ª Fase da OAB, sincronizando 20 playlists do YouTube que cobrem todas as áreas do exame. O sistema irá buscar vídeos via API do YouTube, armazenar no banco de dados, exibir com thumbnails, e permitir acesso às transcrições.

### Playlists a Serem Integradas
| Área | Playlist ID |
|------|-------------|
| Ética Profissional / Estatuto da OAB | PL8vXuI6zmpgwsu0I9WOuMgSBUx98rdyL |
| Filosofia do Direito | PL8vXuI6zmpdi47p3ijoTP0dECj2hoC-pN |
| Direito Constitucional | PL8vXuI6zmpdibFGqx6usUu1Htsa6X5YvC |
| Direitos Humanos | PL8vXuI6zmpdiICouL1IyYyuWe5i4HotYt |
| Direito Eleitoral | PL8vXuI6zmpdgq9XEO_Wvn_fHuGH-J88nV |
| Direito Internacional | PL8vXuI6zmpdhuNo11n7argrPtoELeJpSC |
| Direito Financeiro | PL2CHFA_bGrZ9HRF4DQ6Y_ct0DwOBAS2cw |
| Direito Tributário | PL8vXuI6zmpdi4O_2o3z6FLQ3b0F4PxhLx |
| Direito Administrativo | PL8vXuI6zmpdhX27XZG8wqPSgtMy7MSUcq |
| Direito Ambiental | PL8vXuI6zmpdhSq3aFFLkGtF43bg7Yo13y |
| Direito Civil | PL8vXuI6zmpdhX8g2wnvM0lqk7pdHhpCUU |
| ECA | PL8vXuI6zmpdjLxIns5TqSwJtrm3krojzQ |
| Direito do Consumidor | PL8vXuI6zmpdg1NC8BKKXnkqWGr2KiMTut |
| Direito Empresarial | PL8vXuI6zmpdiJcZ5w36q-Fl1LNNwkuM8E |
| Processo Civil | PL8vXuI6zmpdhOjBmtGiCcerDadAn-Xu2c |
| Direito Penal | PL8vXuI6zmpdh8CF2fer38Uosf1phfUbH8 |
| Processo Penal | PL8vXuI6zmpdi6eQjQBgY0u_VNEl6f9p8Y |
| Direito Previdenciário | PL8vXuI6zmpdgKdvgqV9QVKp7COhTva5cJ |
| Direito do Trabalho | PL8vXuI6zmpdiUdKYB4fI89MnKd6FWYeJq |
| Processo do Trabalho | PL8vXuI6zmpdiUdKYB4fI89MnKd6FWYeJq |

---

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  VideoaulasOABPrimeiraFase.tsx  ← Nova página principal         │
│  VideoaulasOABAreaPrimeiraFase.tsx ← Lista de vídeos por área   │
│  VideoaulasOABViewPrimeiraFase.tsx ← Player + Conteúdo          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTIONS (Deno)                        │
├─────────────────────────────────────────────────────────────────┤
│  sincronizar-videoaulas-oab-primeira-fase  ← Sincroniza todas   │
│  processar-videoaula-oab (existente)       ← Gera conteúdo      │
│  buscar-videos-playlist (existente)        ← Busca vídeos       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS (Supabase)                    │
├─────────────────────────────────────────────────────────────────┤
│  videoaulas_oab_primeira_fase ← Nova tabela para vídeos         │
│  Campos: id, video_id, playlist_id, area, titulo, descricao,    │
│          thumbnail, duracao, ordem, transcricao, sobre_aula,    │
│          flashcards, questoes, publicado_em, created_at         │
└─────────────────────────────────────────────────────────────────┘
```

---

### Etapas de Implementação

#### Etapa 1: Criar Nova Tabela no Banco de Dados
Criar a tabela `videoaulas_oab_primeira_fase` com estrutura otimizada:
- `id` (serial primary key)
- `video_id` (text, unique) - ID do vídeo no YouTube
- `playlist_id` (text) - ID da playlist de origem
- `area` (text) - Área do direito (ex: "Direito Constitucional")
- `titulo` (text) - Título do vídeo
- `descricao` (text) - Descrição do vídeo
- `thumbnail` (text) - URL da thumbnail
- `duracao` (text) - Duração formatada
- `ordem` (integer) - Posição na playlist
- `transcricao` (text) - Transcrição do vídeo
- `sobre_aula` (text) - Resumo gerado por IA
- `flashcards` (jsonb) - Cards de estudo
- `questoes` (jsonb) - Questões de revisão
- `publicado_em` (timestamptz) - Data de publicação no YouTube
- `created_at` (timestamptz) - Data de inserção

#### Etapa 2: Criar Edge Function de Sincronização
Nova função `sincronizar-videoaulas-oab-primeira-fase` que:
1. Itera sobre as 20 playlists configuradas
2. Usa a API do YouTube para buscar todos os vídeos de cada playlist
3. Mapeia cada vídeo para a área correspondente
4. Faz upsert no banco (insere novos, atualiza existentes)
5. Retorna estatísticas de sincronização

#### Etapa 3: Criar Páginas do Frontend

**Página Principal (VideoaulasOABPrimeiraFase.tsx)**
- Lista as 20 áreas como cards visuais
- Mostra quantidade de aulas por área
- Barra de pesquisa para filtrar áreas
- Design consistente com o tema vermelho da OAB

**Página de Área (VideoaulasOABAreaPrimeiraFase.tsx)**
- Lista todos os vídeos da área selecionada
- Layout responsivo (sidebar no desktop, lista no mobile)
- Thumbnails de alta qualidade
- Pesquisa dentro da área

**Página de Visualização (VideoaulasOABViewPrimeiraFase.tsx)**
- Player de vídeo embedado do YouTube
- Tabs: Sobre | Flashcards | Questões
- Botão para gerar conteúdo via IA
- Navegação entre aulas (anterior/próxima)

#### Etapa 4: Configurar Rotas
Adicionar novas rotas no App.tsx:
- `/videoaulas-oab-1fase` → Página principal
- `/videoaulas/oab-1fase/:area` → Lista de vídeos por área
- `/videoaulas/oab-1fase/:area/:id` → Visualização de vídeo

#### Etapa 5: Integração com Processamento de Conteúdo
Reutilizar a edge function existente `processar-videoaula-oab` adaptada para:
- Buscar transcrição do YouTube
- Gerar resumo "Sobre esta aula" via Gemini
- Criar flashcards automaticamente
- Gerar questões de revisão

---

### Detalhes Técnicos

#### Mapeamento de Playlists
Será criado um objeto de configuração com o mapeamento:
```text
PLAYLISTS_OAB = [
  { area: "Ética Profissional / Estatuto da OAB", playlistId: "PL8vXuI6zmpgwsu0I9WOuMgSBUx98rdyL" },
  { area: "Filosofia do Direito", playlistId: "PL8vXuI6zmpdi47p3ijoTP0dECj2hoC-pN" },
  ... (20 playlists)
]
```

#### Chave da API do YouTube
O sistema já usa `YOUTUBE_API_KEY` em outras funções. Será verificado se está configurada e disponível para uso.

#### Sincronização Incremental
A função de sincronização fará:
- Buscar vídeos existentes no banco
- Comparar com vídeos da API do YouTube
- Inserir novos vídeos
- Atualizar metadados de existentes (título, thumbnail, etc.)
- Manter conteúdo gerado (transcrição, flashcards, questões)

#### RLS (Row Level Security)
A nova tabela será configurada com:
- Leitura pública (qualquer usuário pode ver vídeos)
- Escrita restrita a service role (apenas edge functions)

---

### Arquivos a Serem Criados/Modificados

**Novos Arquivos:**
1. `supabase/functions/sincronizar-videoaulas-oab-primeira-fase/index.ts`
2. `src/pages/VideoaulasOABPrimeiraFase.tsx`
3. `src/pages/VideoaulasOABAreaPrimeiraFase.tsx`
4. `src/pages/VideoaulasOABViewPrimeiraFase.tsx`

**Arquivos Modificados:**
1. `src/App.tsx` - Adicionar novas rotas
2. `supabase/config.toml` - Registrar nova edge function
3. `src/pages/oab/PrimeiraFase.tsx` - Atualizar link para nova página

---

### Benefícios

- **Conteúdo Centralizado**: Todas as 20 áreas da OAB em um só lugar
- **Sincronização Automática**: Novos vídeos são detectados automaticamente
- **Geração de Conteúdo por IA**: Transcrições, resumos, flashcards e questões
- **Experiência Consistente**: Design unificado com as outras seções do app
- **Performance**: Cache no banco evita chamadas repetidas à API do YouTube

---

### Pré-requisitos
- Verificar se `YOUTUBE_API_KEY` está configurada como secret no Supabase
- Criar tabela `videoaulas_oab_primeira_fase` antes de rodar sincronização
