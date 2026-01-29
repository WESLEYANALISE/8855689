-- Limpar conceitos_livro_temas (mantém capa_url)
UPDATE conceitos_livro_temas SET
  audio_url = NULL,
  conteudo = NULL,
  conteudo_markdown = NULL,
  resumo = NULL,
  exemplos = NULL,
  flashcards = NULL,
  questoes = NULL,
  termos = NULL,
  status = 'pendente';

-- Limpar conceitos_topicos (mantém capa_url)
UPDATE conceitos_topicos SET
  conteudo_gerado = NULL,
  url_narracao = NULL,
  exemplos = NULL,
  flashcards = NULL,
  questoes = NULL,
  termos = NULL,
  complemento = NULL,
  status = 'pendente';