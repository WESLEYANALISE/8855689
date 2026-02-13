

## Plano de Ajustes

### 1. Corrigir botao "Voltar" da pagina Explicacoes

**Problema**: O botao "Voltar" na pagina `/leis/explicacoes` mostra "Inicio" em vez de "Leis". Isso acontece porque o `Header.tsx` tem sua propria copia da funcao `getHierarchicalDestination` que nao inclui a rota `/leis/explicacoes`, fazendo o fallback retornar `/` (Inicio).

**Solucao**: Adicionar a rota `/leis/explicacoes` no mapeamento dentro de `Header.tsx`, apontando para `/?tab=leis`, igual ja esta configurado no hook `useHierarchicalNavigation.ts`.

---

### 2. Pagina de Busca de Leis - Artigos mais buscados e Favoritos

**Problema**: A pagina `/vade-mecum/busca` mostra apenas sugestoes estaticas quando nao ha busca ativa. O usuario quer ver seus artigos mais pesquisados e seus favoritos.

**Solucao**:

- Criar uma tabela `busca_leis_historico` no Supabase para registrar cada busca do usuario (user_id, termo, created_at).
- Na tela inicial da busca (antes de digitar), exibir duas secoes:
  - **Mais Buscados**: Agrupar por termo e ordenar por frequencia (consulta na tabela de historico).
  - **Favoritos**: Reutilizar a logica existente do hook `useLeisFavoritasRecentes` para exibir os artigos favoritados pelo usuario.
- Registrar cada busca executada na tabela de historico.
- Os itens clicaveis preenchem o campo de busca e executam a pesquisa.

---

### 3. Restringir conteudo da pagina de Aulas para nao-admin

**Problema**: Todas as secoes (Areas do Direito, Portugues, OAB) aparecem para qualquer usuario. Apenas as trilhas de Conceitos e OAB devem aparecer para usuarios comuns.

**Solucao**: No componente `MobileTrilhasAprender.tsx`, envolver as secoes 4 (Areas do Direito), 5 (Portugues Juridico) e 6 (OAB) com a condicao `{isAdmin && (...)}`. Assim, apenas o administrador (email `wn7corporation@gmail.com`) vera essas categorias. Usuarios comuns verao apenas o Dashboard de Progresso, Jornada de Estudos e os cards de Conceitos.

---

### Detalhes Tecnicos

**Arquivos a modificar:**

| Arquivo | Alteracao |
|---|---|
| `src/components/Header.tsx` | Adicionar `/leis/explicacoes` -> `/?tab=leis` no `getHierarchicalDestination` |
| `src/pages/VadeMecumBusca.tsx` | Adicionar secoes de "Mais Buscados" e "Favoritos" na tela inicial; registrar buscas |
| `src/components/mobile/MobileTrilhasAprender.tsx` | Envolver secoes 4, 5 e 6 com `{isAdmin && (...)}` |

**Nova tabela Supabase:**

```sql
CREATE TABLE busca_leis_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  termo text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE busca_leis_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON busca_leis_historico FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON busca_leis_historico FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

