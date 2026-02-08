
# Plano: Integração com API do YouTube para Áreas do Direito

## Resumo do Problema
A seção "Áreas do Direito" nas Videoaulas não está exibindo os vídeos porque:
- A página busca vídeos de uma tabela local do banco de dados (`VIDEO AULAS-NOVO`)
- Mas as playlists são externas do YouTube e não estão indexadas localmente
- Já existe uma função pronta (`buscar-videos-playlist`) que busca vídeos diretamente do YouTube

## Solução Proposta
Modificar a página para buscar os vídeos diretamente da API do YouTube usando a função existente quando não houver registros locais.

---

## Alterações Necessárias

### 1. Modificar `src/pages/VideoaulasAreaVideos.tsx`
**Objetivo**: Integrar com a edge function para buscar vídeos do YouTube

**Mudanças**:
- Primeiro tenta buscar da tabela local (`VIDEO AULAS-NOVO`)
- Se não encontrar resultados, chama `buscar-videos-playlist` passando a URL da playlist
- Formata os dados retornados da API do YouTube para exibição
- Adiciona estados de loading e erro específicos para a busca no YouTube

```text
Fluxo de dados:
┌─────────────────────────┐
│  Página carrega         │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Busca na tabela local   │
│ (VIDEO AULAS-NOVO)      │
└───────────┬─────────────┘
            ▼
      ┌─────────────┐
      │ Tem vídeos? │
      └──────┬──────┘
       Sim   │   Não
        ▼    │    ▼
  ┌─────────┐│┌──────────────────┐
  │ Exibir  │││ Buscar da API    │
  │ lista   │││ YouTube via      │
  │ local   │││ buscar-videos-   │
  └─────────┘││ playlist         │
             │└────────┬─────────┘
             │         ▼
             │   ┌───────────────┐
             │   │ Exibir vídeos │
             │   │ do YouTube    │
             └───┴───────────────┘
```

### 2. Modificar `src/pages/VideoaulasAreaVideoView.tsx`
**Objetivo**: Suportar reprodução de vídeos vindos do YouTube (não cadastrados localmente)

**Mudanças**:
- Detectar se o ID é numérico (local) ou string (YouTube videoId)
- Se for do YouTube, buscar dados mínimos (título, thumbnail) sem depender da tabela
- Adaptar a lógica de exibição para funcionar com dados do YouTube
- Desabilitar geração de conteúdo IA para vídeos não cadastrados (ou criar fluxo para isso)

### 3. Atualizar rotas em `src/App.tsx`
**Objetivo**: Suportar parâmetros dinâmicos para vídeos do YouTube

**Mudanças**:
- Alterar a rota para aceitar tanto IDs numéricos quanto videoIds do YouTube
- Exemplo: `/videoaulas/areas/:area/:id` onde `id` pode ser um número ou um videoId do YouTube

---

## Detalhes Técnicos

### Interface para vídeos do YouTube
```typescript
interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
}
```

### Query para buscar da API do YouTube
```typescript
const { data: youtubeVideos } = useQuery({
  queryKey: ["youtube-playlist-videos", areaPlaylist?.playlistId],
  queryFn: async () => {
    const { data, error } = await supabase.functions.invoke(
      'buscar-videos-playlist',
      { body: { playlistLink: areaPlaylist.playlistUrl } }
    );
    if (error) throw error;
    return data.videos as YouTubeVideo[];
  },
  enabled: !!areaPlaylist && (!videoaulas || videoaulas.length === 0),
});
```

### Chaves de API
A edge function `buscar-videos-playlist` já usa as chaves `GEMINI_KEY_1`, `GEMINI_KEY_2`, `GEMINI_KEY_3` que funcionam para a YouTube Data API. Estas chaves já estão configuradas no projeto.

---

## Arquivos a Modificar
1. **`src/pages/VideoaulasAreaVideos.tsx`** - Adicionar busca na API do YouTube
2. **`src/pages/VideoaulasAreaVideoView.tsx`** - Suportar reprodução de vídeos do YouTube
3. **`src/data/videoaulasAreasPlaylists.ts`** - (nenhuma alteração necessária)
4. **`src/App.tsx`** - Possível ajuste de rota

---

## Resultado Esperado
- Ao entrar em qualquer área (ex: "Direito Administrativo"), a lista de vídeos aparecerá automaticamente
- Cada vídeo mostrará: thumbnail, título, descrição resumida
- Ao clicar, o vídeo será reproduzido normalmente
- A experiência será idêntica às videoaulas da OAB 1ª Fase
