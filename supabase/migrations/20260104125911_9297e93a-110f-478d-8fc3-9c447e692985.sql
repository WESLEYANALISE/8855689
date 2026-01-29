-- Adicionar coluna biblioteca_slug para mapear ministros às URLs da biblioteca do STF
ALTER TABLE tres_poderes_ministros_stf 
ADD COLUMN IF NOT EXISTS biblioteca_slug TEXT;

-- Popular com os slugs corretos baseados nos nomes dos ministros
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'GilmarMendes' WHERE nome ILIKE '%Gilmar Mendes%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'CarmenLucia' WHERE nome ILIKE '%Cármen Lúcia%' OR nome ILIKE '%Carmen Lucia%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'DiasToffoli' WHERE nome ILIKE '%Dias Toffoli%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'LuizFux' WHERE nome ILIKE '%Luiz Fux%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'RobertoBarroso' WHERE nome ILIKE '%Roberto Barroso%' OR nome ILIKE '%Barroso%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'EdsonFachin' WHERE nome ILIKE '%Edson Fachin%' OR nome ILIKE '%Fachin%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'AlexandreDeMoraes' WHERE nome ILIKE '%Alexandre de Moraes%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'NunesMarques' WHERE nome ILIKE '%Nunes Marques%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'AndreMendonca' WHERE nome ILIKE '%André Mendonça%' OR nome ILIKE '%Andre Mendonca%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'CristianoZanin' WHERE nome ILIKE '%Cristiano Zanin%' OR nome ILIKE '%Zanin%';
UPDATE tres_poderes_ministros_stf SET biblioteca_slug = 'FlavioDino' WHERE nome ILIKE '%Flávio Dino%' OR nome ILIKE '%Flavio Dino%';