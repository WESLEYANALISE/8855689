
## Fix: Back button on Conceitos Trilhante navigating to gray screen

### Problem
The "Voltar" button on `/conceitos/trilhante` navigates to `/?tab=aulas`, but this tab does not exist on the home page. The valid tab for study-related pages is `ferramentas` (labeled "Estudos"). This causes the home page to render with no matching content, resulting in the gray screen.

### Solution
Change the back button navigation in `ConceitosTrilhante.tsx` from `/?tab=aulas` to `/?tab=ferramentas`.

### Technical Details

**File: `src/pages/ConceitosTrilhante.tsx`** (line 111)
- Change `navigate('/?tab=aulas')` to `navigate('/?tab=ferramentas')`

This aligns with the pattern used by all other study pages (AreaTrilhaPage, PrimeiraFase, SegundaFase, AulasPage, etc.) which correctly navigate to `/?tab=ferramentas`.

**Bonus fix: `src/pages/AulasDashboard.tsx`** (line 91)
- Same issue exists here — also change `/?tab=aulas` to `/?tab=ferramentas` for consistency.
