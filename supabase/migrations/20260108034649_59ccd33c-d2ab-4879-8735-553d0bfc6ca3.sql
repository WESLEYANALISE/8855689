-- Adicionar colunas para sobre/análise gerados pela IA e contador de comentários
ALTER TABLE politica_documentarios 
ADD COLUMN IF NOT EXISTS sobre_gerado TEXT,
ADD COLUMN IF NOT EXISTS analise_gerada TEXT,
ADD COLUMN IF NOT EXISTS total_comentarios INTEGER DEFAULT 0;

-- Criar função para atualizar contador de comentários automaticamente
CREATE OR REPLACE FUNCTION update_documentario_comentarios_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE politica_documentarios 
    SET total_comentarios = (
      SELECT COUNT(*) FROM politica_documentarios_comentarios 
      WHERE documentario_id = NEW.documentario_id
    )
    WHERE id = NEW.documentario_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE politica_documentarios 
    SET total_comentarios = (
      SELECT COUNT(*) FROM politica_documentarios_comentarios 
      WHERE documentario_id = OLD.documentario_id
    )
    WHERE id = OLD.documentario_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar contador
DROP TRIGGER IF EXISTS trigger_update_documentario_comentarios_count ON politica_documentarios_comentarios;
CREATE TRIGGER trigger_update_documentario_comentarios_count
AFTER INSERT OR DELETE ON politica_documentarios_comentarios
FOR EACH ROW
EXECUTE FUNCTION update_documentario_comentarios_count();

-- Atualizar contadores existentes
UPDATE politica_documentarios 
SET total_comentarios = (
  SELECT COUNT(*) FROM politica_documentarios_comentarios 
  WHERE documentario_id = politica_documentarios.id
);

-- Habilitar realtime para comentários
ALTER PUBLICATION supabase_realtime ADD TABLE politica_documentarios_comentarios;