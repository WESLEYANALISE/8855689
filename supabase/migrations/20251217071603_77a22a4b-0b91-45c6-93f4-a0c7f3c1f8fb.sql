-- Atualizar artigos duplicados com novos temas únicos

-- casos: substituir duplicata de "Caso Suzane von Richthofen"
UPDATE "BLOGGER_JURIDICO" 
SET titulo = 'Caso Nardoni',
    descricao_curta = 'O crime que chocou o Brasil em 2008',
    termo_wikipedia = 'Caso Isabella Nardoni',
    conteudo_gerado = NULL,
    url_capa = NULL,
    url_audio = NULL
WHERE id = 186;

-- casos: substituir duplicata de "Mensalão"
UPDATE "BLOGGER_JURIDICO" 
SET titulo = 'Caso Lava Jato',
    descricao_curta = 'A maior operação anticorrupção do Brasil',
    termo_wikipedia = 'Operação Lava Jato',
    conteudo_gerado = NULL,
    url_capa = NULL,
    url_audio = NULL
WHERE id = 188;

-- filosofos: substituir duplicata de "Norberto Bobbio"
UPDATE "BLOGGER_JURIDICO" 
SET titulo = 'Rudolf von Jhering',
    descricao_curta = 'A luta pelo direito e o interesse protegido',
    termo_wikipedia = 'Rudolf von Jhering',
    conteudo_gerado = NULL,
    url_capa = NULL,
    url_audio = NULL
WHERE id = 140;

-- historia: substituir duplicata de "Declaração dos Direitos do Homem"
UPDATE "BLOGGER_JURIDICO" 
SET titulo = 'Tribunal de Nuremberg',
    descricao_curta = 'O julgamento dos crimes contra a humanidade',
    termo_wikipedia = 'Julgamentos de Nuremberg',
    conteudo_gerado = NULL,
    url_capa = NULL,
    url_audio = NULL
WHERE id = 159;

-- iniciando: substituir duplicata de "Ramos do Direito"
UPDATE "BLOGGER_JURIDICO" 
SET titulo = 'Hierarquia das Normas',
    descricao_curta = 'A pirâmide de Kelsen e a ordem jurídica',
    termo_wikipedia = 'Pirâmide de Kelsen',
    conteudo_gerado = NULL,
    url_capa = NULL,
    url_audio = NULL
WHERE id = 152;

-- termos: substituir duplicata de "Habeas Corpus"
UPDATE "BLOGGER_JURIDICO" 
SET titulo = 'Ação Civil Pública',
    descricao_curta = 'Proteção de direitos difusos e coletivos',
    termo_wikipedia = 'Ação civil pública',
    conteudo_gerado = NULL,
    url_capa = NULL,
    url_audio = NULL
WHERE id = 175;

-- termos: substituir duplicata de "Mandado de Segurança"
UPDATE "BLOGGER_JURIDICO" 
SET titulo = 'Ação Popular',
    descricao_curta = 'O poder do cidadão contra atos lesivos',
    termo_wikipedia = 'Ação popular',
    conteudo_gerado = NULL,
    url_capa = NULL,
    url_audio = NULL
WHERE id = 176;