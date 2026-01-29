-- Atualizar artigos 1º a 13º com os novos links de narração
UPDATE "CC - Código Civil" cc
SET "Narração" = te."Narração"
FROM "TABELA PARA EDITAR" te
WHERE (
  -- Match artigos com º no nome do arquivo (1º, 2º, 3º, etc)
  (cc."Número do Artigo" = '1º' AND te."Artigo" = 'artigo.1º.wav')
  OR (cc."Número do Artigo" = '2º' AND te."Artigo" = 'artigo.2º.wav')
  OR (cc."Número do Artigo" = '3º' AND te."Artigo" = 'artigo.3º.wav')
  OR (cc."Número do Artigo" = '4º' AND te."Artigo" = 'artigo.4º.wav')
  OR (cc."Número do Artigo" = '5º' AND te."Artigo" = 'artigo.5º.wav')
  OR (cc."Número do Artigo" = '6º' AND te."Artigo" = 'artigo.6º.wav')
  OR (cc."Número do Artigo" = '7º' AND te."Artigo" = 'artigo.7º.wav')
  OR (cc."Número do Artigo" = '8º' AND te."Artigo" = 'artigo.8º.wav')
  OR (cc."Número do Artigo" = '9º' AND te."Artigo" = 'artigo.9º.wav')
  OR (cc."Número do Artigo" = '10' AND te."Artigo" = 'artigo.10.wav')
  OR (cc."Número do Artigo" = '11' AND te."Artigo" = 'artigo.11.wav')
  OR (cc."Número do Artigo" = '12' AND te."Artigo" = 'artigo.12.wav')
  OR (cc."Número do Artigo" = '13' AND te."Artigo" = 'artigo.13.wav')
)
AND te."Narração" IS NOT NULL
AND te."Narração" != '';