
# Plano: Reestruturar Peticoes com Hierarquia e Simplificar Contratos

## Problema Atual

1. **Peticoes mostra categorias "flat"**: A pagina AdvogadoModelos lista todas as ~500+ categorias de forma plana (ex: "01. Trabalhista > 01. Inicial > 01. Assedio moral"), quando deveria mostrar uma hierarquia navegavel com 65 areas principais no primeiro nivel.

2. **Contratos mostra 2 opcoes**: O hub mostra "Modelos de Contratos" e "Criar Contrato", mas deveria mostrar apenas "Criar Contrato".

## Solucao

### 1. Contratos - Apenas "Criar Contrato"

Remover o card "Modelos de Contratos" da aba Contratos em `PeticoesContratosHub.tsx`, deixando apenas o card "Criar Contrato" que navega para `/advogado/contratos/criar`.

### 2. Peticoes - Navegacao Hierarquica em 3 Niveis

Reestruturar `AdvogadoModelos.tsx` para navegar pela hierarquia usando o separador ` > ` das categorias:

- **Nivel 1**: Mostra as 65 areas principais (ex: "01. Trabalhista", "13. Civil", "08. Previdenciario") com contagem total de modelos
- **Nivel 2**: Ao clicar numa area, mostra as subcategorias (ex: "01. Inicial - reclamatoria trabalhista", "02. Defesa trabalhista")
- **Nivel 3**: Ao clicar numa subcategoria, mostra as sub-subcategorias ou os modelos diretamente se nao houver mais niveis

A logica sera:
- Extrair niveis da string de categoria usando `split(' > ')`
- Manter um estado `path` (array de strings) representando o nivel atual de navegacao
- Filtrar categorias que comecam com o path atual para montar a lista do nivel seguinte
- Quando nao houver mais subdivisoes, mostrar os modelos finais

### Detalhes Tecnicos

**Arquivos a modificar:**

1. **`src/pages/PeticoesContratosHub.tsx`**
   - Remover item "Modelos de Contratos" do array `contratosItems`
   - Manter apenas "Criar Contrato"
   - Ajustar layout para card unico centralizado

2. **`src/pages/AdvogadoModelos.tsx`**
   - Substituir `selectedCategory` (string unica) por `navigationPath` (array de strings)
   - Criar funcao `getSubcategories(path)` que:
     - Filtra modelos cujas categorias comecam com o path atual
     - Extrai o proximo nivel da hierarquia
     - Agrupa e conta modelos por subcategoria
   - Atualizar o botao "Voltar" para navegar um nivel acima na hierarquia
   - Quando uma subcategoria nao tem filhos, mostrar os modelos diretamente
   - Manter virtualizacao com react-window para a lista de modelos
   - Manter busca funcionando em todos os niveis
