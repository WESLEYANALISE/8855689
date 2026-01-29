-- Adicionar coluna ordem_artigo em todas as tabelas de leis

-- Função para normalizar número do artigo
CREATE OR REPLACE FUNCTION public.normalizar_numero_artigo(num TEXT)
RETURNS NUMERIC AS $$
DECLARE
  cleaned TEXT;
  base_num INTEGER;
  suffix_val NUMERIC;
  match_result TEXT[];
BEGIN
  IF num IS NULL OR num = '' THEN
    RETURN 999999;
  END IF;
  
  -- Remove espaços, º, ª e pontos
  cleaned := UPPER(TRIM(num));
  cleaned := REGEXP_REPLACE(cleaned, '[ºª]', '', 'g');
  cleaned := REPLACE(cleaned, '.', '');
  
  -- Extrair número base
  match_result := REGEXP_MATCHES(cleaned, '^(\d+)(?:-?([A-Z]))?');
  
  IF match_result IS NULL THEN
    RETURN 999999;
  END IF;
  
  base_num := match_result[1]::INTEGER;
  
  -- Calcular sufixo (A=1, B=2, etc)
  IF match_result[2] IS NOT NULL THEN
    suffix_val := (ASCII(match_result[2]) - 64) * 0.001;
  ELSE
    suffix_val := 0;
  END IF;
  
  RETURN base_num + suffix_val;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Adicionar coluna e popular em cada tabela
DO $$
DECLARE
  tabelas TEXT[] := ARRAY[
    'CC - Código Civil',
    'CPC – Código de Processo Civil',
    'CP - Código Penal',
    'CPP – Código de Processo Penal',
    'CF - Constituição Federal',
    'CLT - Consolidação das Leis do Trabalho',
    'CDC – Código de Defesa do Consumidor',
    'CE – Código Eleitoral',
    'CF - Código Florestal',
    'CC - Código de Caça',
    'CP - Código de Pesca',
    'CA - Código de Águas',
    'CDM – Código de Minas',
    'CBA Código Brasileiro de Aeronáutica',
    'CBT Código Brasileiro de Telecomunicações',
    'CCOM – Código Comercial',
    'CDUS - Código de Defesa do Usuário',
    'CPI - Código de Propriedade Industrial',
    'CPM – Código Penal Militar',
    'CPPM – Código de Processo Penal Militar',
    'CTB – Código de Trânsito Brasileiro',
    'CTN – Código Tributário Nacional',
    'ECA – Estatuto da Criança e do Adolescente',
    'EI – Estatuto do Idoso',
    'ED – Estatuto do Desarmamento',
    'EPD – Estatuto da Pessoa com Deficiência',
    'EOAB – Estatuto da Ordem dos Advogados do Brasil',
    'ETJ – Estatuto do Torcedor',
    'EREF – Estatuto do Refugiado',
    'EIG – Estatuto da Igualdade Racial',
    'EMID – Estatuto dos Militares',
    'ECID – Estatuto da Cidade',
    'ETERR – Estatuto da Terra',
    'LEP – Lei de Execuções Penais',
    'LIA – Lei de Improbidade Administrativa',
    'LAC – Lei Anticorrupção',
    'LAM – Lei de Abuso de Autoridade',
    'LCR – Lei de Crimes Ambientais',
    'LDA – Lei de Drogas',
    'LGT – Lei Geral de Telecomunicações',
    'LI – Lei de Interceptação Telefônica',
    'LDB – Lei de Diretrizes e Bases da Educação',
    'LINDB – Lei de Introdução às Normas do Direito Brasileiro',
    'LJ – Lei do Júri',
    'LMS – Lei Maria da Penha',
    'LEI 13869 - Abuso de Autoridade',
    'LEI 13709 - LGPD',
    'LEI 9455 - Lei de Tortura',
    'LEI 9613 - Lavagem de Dinheiro',
    'LEI 8072 - Crimes Hediondos',
    'LEI 8429 - Improbidade Administrativa',
    'LEI 12850 - Organização Criminosa',
    'LEI 10826 - Estatuto do Desarmamento',
    'LEI 8666 - Licitações',
    'LEI 14133 - Nova Lei de Licitações',
    'LEI 11343 - Lei de Drogas',
    'LEI 9784 - Processo Administrativo',
    'LEI 8078 - CDC',
    'LEI 9099 - Juizados Especiais',
    'LEI 8112 - Estatuto dos Servidores',
    'LEI 4737 - Código Eleitoral',
    'LEI 9504 - Lei das Eleições',
    'LEI 7716 - Racismo',
    'LEI 12037 - Identificação Criminal'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    BEGIN
      -- Verificar se tabela existe
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
        -- Adicionar coluna se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = t AND column_name = 'ordem_artigo'
        ) THEN
          EXECUTE format('ALTER TABLE public.%I ADD COLUMN ordem_artigo NUMERIC', t);
        END IF;
        
        -- Popular coluna
        EXECUTE format('UPDATE public.%I SET ordem_artigo = public.normalizar_numero_artigo("Número do Artigo")', t);
        
        -- Criar índice para ordenação
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_ordem ON public.%I (ordem_artigo)', 
          REPLACE(REPLACE(t, ' ', '_'), '-', '_'), t);
          
        RAISE NOTICE 'Tabela % atualizada com sucesso', t;
      ELSE
        RAISE NOTICE 'Tabela % não encontrada', t;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erro na tabela %: %', t, SQLERRM;
    END;
  END LOOP;
END $$;