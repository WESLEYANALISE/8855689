
# Plano: Reformular a aba "Aulas" com seção de Progresso e cards com capas

## Resumo

Remover a barra de busca e as noticias juridicas quando a aba "Aulas" estiver ativa, substituindo por uma secao de **Progresso** no topo (carrossel horizontal mostrando aulas em andamento do usuario). Alem disso, trocar os cards de categorias (gradientes simples) por cards com imagens de fundo cinematograficas. As categorias "Areas do Direito" e "OAB" continuam restritas ao admin.

---

## 1. Ocultar busca e noticias na aba Aulas

**Arquivo**: `src/pages/Index.tsx`

Atualmente a barra de busca e a secao de Noticias Juridicas aparecem em todas as abas mobile. Adicionar uma condicao para esconde-las quando `mainTab === 'iniciante'`.

- Barra de busca (linhas 269-278): adicionar `mainTab !== 'iniciante'` como condicao
- Noticias em Destaque (linhas 281-313): adicionar `mainTab !== 'iniciante'` como condicao

---

## 2. Secao de Progresso (carrossel)

**Arquivo**: `src/components/mobile/MobileTrilhasAprender.tsx`

Adicionar no topo do componente (antes dos cards de categorias) uma secao "Seu Progresso" que:

- Consulta a tabela `conceitos_topicos_progresso` para buscar topicos em andamento do usuario (onde `leitura_completa = false` e `progresso_porcentagem > 0`)
- Consulta tambem `aulas_progresso` e `categorias_progresso` para aulas/topicos de outras categorias
- Exibe um **carrossel horizontal** (scroll) com cards compactos mostrando:
  - Nome do topico/aula
  - Barra de progresso com porcentagem
  - Botao para continuar
- Se o usuario nao tiver nenhum progresso, mostra um estado vazio com mensagem motivacional: "Voce ainda nao iniciou nenhuma aula. Escolha uma categoria abaixo para comecar!"

---

## 3. Cards de categorias com imagens de fundo

**Arquivo**: `src/components/mobile/MobileTrilhasAprender.tsx`

Trocar os cards com gradiente puro por cards com imagens de fundo, usando imagens ja existentes no projeto:

- **Iniciante (Trilha de Conceitos)**: usar `conceitos-thumb.jpg` (ja existe em assets)
- **Areas do Direito**: usar `areas-thumb.jpg` (ja existe em assets)
- **Portugues p/ Concurso**: usar `capa-portugues.jpg` (ja existe em assets)
- **OAB**: usar `oab-primeira-fase-thumb.jpg` (ja existe em assets)

Cada card tera:
- Imagem de fundo com overlay escuro gradiente
- Icone e titulo em branco sobre a imagem
- Seta de navegacao
- Efeito de ring quando ativo

---

## Detalhes Tecnicos

### Index.tsx - Condicoes de visibilidade

```text
Barra de busca mobile:
- De: "md:hidden group flex..."
- Para: adicionar {mainTab !== 'iniciante' && (...)}

Noticias mobile:
- De: "md:hidden space-y-4..."
- Para: adicionar {mainTab !== 'iniciante' && (...)}
```

### MobileTrilhasAprender.tsx - Secao de Progresso

```text
Nova query: buscar de conceitos_topicos_progresso 
  JOIN conceitos_topicos ON id = topico_id
  WHERE user_id = current AND progresso_porcentagem > 0 AND leitura_completa = false
  ORDER BY updated_at DESC

Carrossel: ScrollArea horizontal com cards de ~200px de largura
Cada card: nome do topico, mini progress bar, botao "Continuar"

Estado vazio: icone BookOpen + texto "Nenhuma aula em andamento"
```

### MobileTrilhasAprender.tsx - Cards com imagens

```text
Importar imagens existentes:
  import conceitosThumb from "@/assets/conceitos-thumb.jpg"
  import areasThumb from "@/assets/areas-thumb.jpg" 
  import capaPortugues from "@/assets/capa-portugues.jpg"
  import oabThumb from "@/assets/oab-primeira-fase-thumb.jpg"

Cada card:
  <button className="relative overflow-hidden rounded-2xl h-[120px]">
    <img src={thumb} className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
    <div className="relative z-10 p-4 h-full flex flex-col justify-end">
      <Icon /> + <h3>titulo</h3>
    </div>
  </button>
```

---

## Ordem de Implementacao

1. Editar `Index.tsx` para ocultar busca e noticias na aba Aulas
2. Editar `MobileTrilhasAprender.tsx` para adicionar secao de progresso com carrossel
3. Editar `MobileTrilhasAprender.tsx` para trocar cards de gradiente por cards com imagem de fundo
