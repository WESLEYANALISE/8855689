
# Plano: Nova Aba "Leis" + Seção OAB na Home

## Visão Geral

Vou reestruturar a navegação da página inicial para:
1. **Renomear a aba "OAB"** no menu de alternância para **"Leis"**
2. **Criar uma nova aba "Leis"** que mostra o Vade Mecum com imagem de fundo (igual à aba "Aulas")
3. **Adicionar uma seção OAB** entre "Estudos" e "Política" na aba de Estudos, com dois cards: 1ª Fase e 2ª Fase

---

## Mudanças Visuais

### 1. Menu de Alternância (Topo)

**Antes:**
```text
[ Aulas ] [ Estudos ] [ OAB ]
```

**Depois:**
```text
[ Aulas ] [ Estudos ] [ Leis ]
```

- O ícone da aba "Leis" será `Scale` (balança de justiça) em vez de `Gavel`

### 2. Nova Aba "Leis" (Vade Mecum)

Quando o usuário clicar em "Leis", verá:
- **Imagem de fundo fixa** (similar à aba Aulas)
- **Conteúdo do Vade Mecum** sobre a imagem
- Layout com as opções principais: Códigos, Estatutos, Legislação Penal, etc.

```text
+--------------------------------------------------+
|      [Imagem de fundo elegante - Planalto]       |
|  +--------------------------------------------+  |
|  |        📜 VADE MECUM COMENTADO             |  |
|  |     Legislação brasileira atualizada       |  |
|  +--------------------------------------------+  |
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | Códigos  |  | Estatutos|  | Leis Esp.|        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | Súmulas  |  | Previd.  |  | Novas L. |        |
|  +----------+  +----------+  +----------+        |
+--------------------------------------------------+
```

### 3. Nova Seção OAB na Aba de Estudos

Será inserida **entre "Estudos" e "Política"**, com:
- Container vermelho (mesmo estilo das outras seções)
- Dois cards lado a lado: **1ª Fase** e **2ª Fase**
- Ao clicar, navega para `/oab/primeira-fase` ou `/oab/segunda-fase`

```text
+--------------------------------------------------+
| 📋 Estudos                                       |
| [Vade Mecum][Biblioteca][Resumos]...             |
+--------------------------------------------------+
|                                                  |
| ⚖️ OAB - Exame da Ordem                          |
| Prepare-se para a aprovação                      |
| +----------------------+ +--------------------+  |
| |   🎯 1ª Fase        | |  📝 2ª Fase        |  |
| |   Prova Objetiva    | |  Prova Prática     |  |
| +----------------------+ +--------------------+  |
|                                                  |
+--------------------------------------------------+
| 🏛️ Política                                      |
| [Livros][Artigos][Documentários]                 |
+--------------------------------------------------+
```

---

## Detalhes Técnicos

### 1. Index.tsx - Alterações no Menu de Alternância

```typescript
// Mudar type MainTab
type MainTab = 'ferramentas' | 'iniciante' | 'leis';  // Antes: 'oab'

// No TabButton, trocar:
<TabButton tab="leis" icon={Scale} label="Leis" />  // Antes: tab="oab" icon={Gavel} label="OAB"
```

### 2. Index.tsx - Nova Aba "Leis" (Vade Mecum)

```tsx
{mainTab === 'leis' && (
  <div className="relative min-h-[500px]">
    {/* Imagem de fundo fixa (estilo igual à aba Aulas) */}
    <div className="fixed left-0 right-0 bottom-0 z-0 pointer-events-none" style={{ top: '160px' }}>
      <img 
        src={heroVadeMecumPlanalto} 
        alt="Vade Mecum"
        className="w-full h-full object-cover object-top opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
    </div>

    {/* Conteúdo do Vade Mecum sobre o fundo */}
    <div className="relative z-10">
      {isDesktop ? (
        <DesktopVadeMecumHome />  // Componente a criar
      ) : (
        <MobileVadeMecumHome />   // Componente a criar
      )}
    </div>
  </div>
)}
```

### 3. Novo Componente: OABHomeSection

Criar `src/components/home/OABHomeSection.tsx`:

```tsx
export const OABHomeSection = ({ isDesktop, navigate }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-500/20 rounded-xl">
          <Gavel className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="font-playfair text-xl font-bold text-amber-100">
            OAB - Exame da Ordem
          </h3>
          <p className="text-white/70 text-xs">Prepare-se para a aprovação</p>
        </div>
      </div>

      {/* Container vermelho com 2 cards */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 border border-red-800/30">
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1ª Fase */}
          <button 
            onClick={() => navigate('/oab/primeira-fase')}
            className="bg-white/15 rounded-xl p-4 text-left hover:bg-white/20 transition-all border border-white/10"
          >
            <div className="bg-white/20 rounded-lg p-2 w-fit mb-3">
              <Target className="w-6 h-6 text-amber-100" />
            </div>
            <h4 className="font-bold text-amber-100 mb-1">1ª Fase</h4>
            <p className="text-white/70 text-xs">Prova Objetiva</p>
          </button>

          {/* Card 2ª Fase */}
          <button 
            onClick={() => navigate('/oab/segunda-fase')}
            className="bg-white/15 rounded-xl p-4 text-left hover:bg-white/20 transition-all border border-white/10"
          >
            <div className="bg-white/20 rounded-lg p-2 w-fit mb-3">
              <FileText className="w-6 h-6 text-amber-100" />
            </div>
            <h4 className="font-bold text-amber-100 mb-1">2ª Fase</h4>
            <p className="text-white/70 text-xs">Prova Prática</p>
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 4. Novo Componente: MobileVadeMecumHome

Criar `src/components/mobile/MobileVadeMecumHome.tsx`:

Mostrará as categorias do Vade Mecum em cards (Códigos, Estatutos, Legislação Penal, etc.) sobre a imagem de fundo.

### 5. Atualizar Ordem na Aba de Estudos

```tsx
{mainTab === 'ferramentas' && (
  <>
    {/* ... Desktop layout ... */}
    {!isDesktop && (
      <>
        {/* Notícias */}
        <NoticiasSection />
        
        {/* Estudos (Em Alta) */}
        <EmAltaSection />
        
        {/* 🆕 OAB - Nova seção */}
        <OABHomeSection isDesktop={isDesktop} navigate={navigate} handleLinkHover={handleLinkHover} />
        
        {/* Política */}
        <PoliticaHomeSection />
        
        {/* Carreiras */}
        <CarreirasSection />
      </>
    )}
  </>
)}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Index.tsx` | Modificar - Renomear aba, adicionar lógica "leis", inserir OABHomeSection |
| `src/components/home/OABHomeSection.tsx` | Criar - Seção OAB com 2 cards |
| `src/components/mobile/MobileVadeMecumHome.tsx` | Criar - Vade Mecum para aba "Leis" mobile |
| `src/components/desktop/DesktopVadeMecumHome.tsx` | Criar - Vade Mecum para aba "Leis" desktop |

---

## Imagens

Vou usar a imagem existente do Vade Mecum como fundo da aba "Leis":
- `heroVadeMecumPlanalto` (`@/assets/hero-vademecum-planalto.webp`)

---

## Resultado Esperado

1. **Menu de alternância**: "Aulas" | "Estudos" | "Leis" (antes era OAB)
2. **Aba "Leis"**: Mostra Vade Mecum com imagem de fundo elegante
3. **Aba "Estudos"**: Agora tem seção OAB entre Estudos e Política
4. **Seção OAB**: Dois cards (1ª Fase e 2ª Fase) que levam às respectivas páginas
