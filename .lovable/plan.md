
# Plano: Padronização das Videoaulas e Sistema de Progresso

## Objetivo
Padronizar as videoaulas da 1ª Fase da OAB para ficarem idênticas às videoaulas para iniciantes, adicionar botões de navegação no rodapé, implementar barra de progresso e sistema de "continuar de onde parou".

---

## 1. Comparativo Visual (Antes x Depois)

### Lista de Aulas
| Aspecto | Iniciante (modelo) | OAB 1ª Fase (atual) |
|---------|-------------------|---------------------|
| Thumbnail | 16:9, play centralizado | 16:9, play centralizado |
| Número | Canto inferior esquerdo, vermelho | Canto inferior esquerdo, vermelho |
| Layout | Card horizontal com descrição | Card horizontal sem descrição |

**Mudança necessária**: Adicionar descrição na lista OAB (se disponível)

### Player de Vídeo
| Aspecto | Iniciante (modelo) | OAB 1ª Fase (atual) |
|---------|-------------------|---------------------|
| Estado inicial | Thumbnail com botão play | Iframe direto (autoplay) |
| Botões nav | Cards abaixo do vídeo | Barra inline acima das tabs |
| Progresso | Não existe | Não existe |

**Mudanças necessárias**:
- Trocar iframe por thumbnail clicável (igual conceitos)
- Mover navegação para rodapé fixo
- Adicionar barra de progresso

---

## 2. Alterações no Banco de Dados

### Nova Tabela: `videoaulas_progresso`

```sql
CREATE TABLE videoaulas_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  tabela TEXT NOT NULL, -- 'videoaulas_iniciante' ou 'videoaulas_oab_primeira_fase'
  registro_id TEXT NOT NULL, -- ID do registro na tabela
  tempo_atual INTEGER DEFAULT 0, -- segundos assistidos
  duracao_total INTEGER DEFAULT 0, -- duração total em segundos
  percentual NUMERIC DEFAULT 0, -- % assistido
  assistido BOOLEAN DEFAULT false, -- marcado como completo (>90%)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tabela, registro_id)
);
```

---

## 3. Arquivos a Modificar

### 3.1 Lista OAB 1ª Fase
**Arquivo**: `src/pages/VideoaulasOABAreaPrimeiraFase.tsx`

Mudanças:
- Manter o formato atual (já está similar)
- Adicionar ícone de porcentagem assistida (se houver progresso)

### 3.2 Player OAB 1ª Fase
**Arquivo**: `src/pages/VideoaulasOABViewPrimeiraFase.tsx`

Mudanças:
- Trocar iframe direto por thumbnail clicável com botão play (igual `VideoaulaInicianteView.tsx`)
- Adicionar barra de progresso abaixo do vídeo
- Mover botões anterior/próximo para rodapé fixo
- Implementar modal "Continuar de onde parou?"
- Salvar progresso no banco a cada 10 segundos

### 3.3 Player Iniciante (Conceitos)
**Arquivo**: `src/pages/VideoaulaInicianteView.tsx`

Mudanças:
- Mover botões anterior/próximo para rodapé fixo
- Adicionar barra de progresso abaixo do vídeo
- Implementar modal "Continuar de onde parou?"
- Salvar progresso no banco

### 3.4 Novo Componente: Rodapé de Navegação de Vídeo
**Arquivo**: `src/components/videoaulas/VideoNavigationFooter.tsx` (novo)

Componente reutilizável:
```text
+--------------------------------------------------+
| < Anterior      Aula 4 de 16       Próxima >     |
+--------------------------------------------------+
```

### 3.5 Novo Hook: Gerenciamento de Progresso
**Arquivo**: `src/hooks/useVideoProgress.tsx` (novo)

Funcionalidades:
- Buscar progresso salvo do usuário
- Salvar progresso periodicamente (a cada 10s)
- Marcar como completo quando >90%
- Retornar último tempo para continuar

---

## 4. Fluxo do Sistema de Progresso

```text
Usuário abre vídeo
       |
       v
Buscar progresso salvo (se existir)
       |
       v
Se tempo > 0 -> Modal "Continuar de onde parou?"
       |                      |
       v                      v
   Sim (seek)           Não (início)
       |                      |
       +----------+-----------+
                  |
                  v
         Iniciar reprodução
                  |
                  v
   A cada 10s: salvar progresso no banco
                  |
                  v
        Se >90%: marcar como assistido
```

---

## 5. Componente de Barra de Progresso

Localização: Abaixo do player de vídeo

Visual:
```text
+--------------------------------------------------+
|  [===========================                  ] |
|  18:32 / 45:00                           41%     |
+--------------------------------------------------+
```

Características:
- Barra vermelha gradiente
- Tempo atual / duração total
- Porcentagem à direita
- Atualiza em tempo real com o vídeo

---

## 6. Modal "Continuar de Onde Parou"

Exibido quando:
- Usuário tem progresso salvo (>30 segundos)
- Progresso < 90% (não completou)

Visual:
```text
+----------------------------------------+
|     Continuar de onde parou?           |
|                                        |
|  Você assistiu até 18:32 (41%)         |
|                                        |
|  [Começar do Início]  [Continuar]      |
+----------------------------------------+
```

---

## 7. Exibição de Progresso na Lista

Na lista de aulas, cada item mostrará:
- Porcentagem assistida (ex: "45%")
- Check verde se completou (>90%)
- Barra de progresso mini abaixo do título

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/VideoaulasOABAreaPrimeiraFase.tsx` | Adicionar indicador de progresso |
| `src/pages/VideoaulasOABViewPrimeiraFase.tsx` | Refatorar player + rodapé + progresso |
| `src/pages/VideoaulaInicianteView.tsx` | Adicionar rodapé + progresso |
| `src/components/videoaulas/VideoNavigationFooter.tsx` | Criar (novo) |
| `src/components/videoaulas/VideoProgressBar.tsx` | Criar (novo) |
| `src/components/videoaulas/ContinueWatchingModal.tsx` | Criar (novo) |
| `src/hooks/useVideoProgress.tsx` | Criar (novo) |
| Supabase | Criar tabela `videoaulas_progresso` |
