-- Remover a constraint antiga e adicionar uma nova que inclui "texto"
ALTER TABLE public.experiencias_aprendizado 
DROP CONSTRAINT experiencias_aprendizado_fonte_tipo_check;

ALTER TABLE public.experiencias_aprendizado 
ADD CONSTRAINT experiencias_aprendizado_fonte_tipo_check 
CHECK (fonte_tipo IN ('texto', 'pdf', 'lei', 'artigo', 'codigo', 'resumo'));