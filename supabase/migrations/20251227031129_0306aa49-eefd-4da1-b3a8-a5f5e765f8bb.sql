-- Deletar documentários que não começam com "Audiodescrição"
DELETE FROM documentarios_juridicos WHERE titulo NOT ILIKE 'Audiodescrição%';