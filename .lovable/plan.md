

# Melhorias Completas na Serpentina das Trilhas

Todas as mudancas sao no componente compartilhado `SerpentineNiveis.tsx`, afetando automaticamente Conceitos, OAB e Areas.

---

## 1. Animacoes de Scroll (whileInView)

Trocar `animate` por `whileInView` nos nos e banners. Cada elemento so anima quando entra no viewport do usuario, criando efeito de revelacao progressiva.

- Nos: `whileInView={{ opacity: 1, scale: 1 }}` com `viewport={{ once: true, margin: "-40px" }}`
- SVG paths: `whileInView={{ pathLength: 1 }}` com `viewport={{ once: true }}`
- Delay escalonado resetado por nivel (nao global)

---

## 2. Curvas Bezier nos Conectores SVG

Substituir linhas retas (`L x y`) por curvas quadraticas (`Q cx cy, x y`) para criar um caminho organico e fluido entre os nos. O ponto de controle sera calculado no ponto medio horizontal entre dois nos consecutivos.

---

## 3. Efeito de Energia nos Conectores

Adicionar um `motion.circle` com `animateMotion` que percorre cada path SVG, criando um ponto luminoso viajando pela trilha. Usar `fill` com a cor do nivel e um filtro de glow (`filter: blur`).

---

## 4. Anel de Progresso Circular

Envolver cada no circular com um anel SVG (`circle` com `stroke-dasharray` e `stroke-dashoffset` animado). O anel preenche proporcionalmente ao progresso do item, com a cor do nivel.

---

## 5. Indicador de Conclusao

Nos com progresso = 100% recebem:
- Borda dourada/verde
- Icone de checkmark sobreposto no canto
- Leve brilho (box-shadow animado)

---

## 6. Feedback Tatil (Hover/Tap)

Adicionar nos nos desbloqueados:
- `whileHover={{ scale: 1.06 }}` 
- `whileTap={{ scale: 0.94 }}`
- `cursor: pointer` explicito

---

## 7. Banners com Entrada Lateral

Banners de niveis pares entram com `initial={{ opacity: 0, x: -30 }}` e impares com `x: 30`, usando `whileInView`. Adicionar um glow sutil com `box-shadow` animado.

---

## 8. Stats por Nivel

Abaixo de cada banner, exibir um texto pequeno como "2/5 concluidas" calculado a partir do progresso dos itens daquele nivel. Requer passar `getItemProgresso` para o calculo.

---

## 9. Progresso Geral Funcional

Calcular o progresso real: media de `getItemProgresso` de todos os itens dividido pelo total. Remover o valor hardcoded `0`.

---

## Detalhes Tecnicos

### Arquivo modificado
`src/components/shared/SerpentineNiveis.tsx`

### Mudancas principais

1. **SVG paths (linha 128-141)**: Trocar logica de `L` para curvas `Q` calculando ponto de controle medio. Adicionar `motion.circle` com `animateMotion` por path.

2. **Nos (linhas 207-269)**: Trocar `animate` por `whileInView`. Adicionar anel SVG de progresso ao redor do circulo. Adicionar `whileHover`/`whileTap`. Adicionar checkmark para nos 100%.

3. **Banners (linhas 34-55)**: Trocar `animate` por `whileInView` com direcao alternada. Adicionar contagem "X/Y concluidas".

4. **Progresso geral (linhas 143-144)**: Calcular `progressPercent` como media real dos progressos.

5. **Importacoes**: Adicionar `AnimatePresence`, `Check` do lucide-react e `useInView` se necessario.

Nenhum outro arquivo precisa ser modificado — todas as trilhas (Conceitos, OAB, Areas) usam este componente.

