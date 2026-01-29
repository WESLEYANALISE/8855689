-- Tabela para armazenar calendário do Exame de Ordem
CREATE TABLE public.calendario_oab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exame_numero INTEGER NOT NULL,
  exame_titulo TEXT NOT NULL,
  publicacao_edital DATE,
  inscricao_inicio DATE,
  inscricao_fim DATE,
  prova_primeira_fase DATE,
  prova_segunda_fase DATE,
  edital_complementar DATE,
  reaproveitamento_inicio DATE,
  reaproveitamento_fim DATE,
  observacoes TEXT,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para cache das Perguntas Frequentes
CREATE TABLE public.faq_oab_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_calendario_oab_numero ON public.calendario_oab(exame_numero);
CREATE INDEX idx_faq_oab_numero ON public.faq_oab_cache(numero);

-- Habilitar RLS
ALTER TABLE public.calendario_oab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_oab_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (dados públicos da OAB)
CREATE POLICY "Calendário OAB é público" ON public.calendario_oab FOR SELECT USING (true);
CREATE POLICY "FAQ OAB é público" ON public.faq_oab_cache FOR SELECT USING (true);

-- Políticas para service role inserir/atualizar (edge functions)
CREATE POLICY "Service pode gerenciar calendário" ON public.calendario_oab FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service pode gerenciar FAQ" ON public.faq_oab_cache FOR ALL USING (true) WITH CHECK (true);

-- Inserir dados iniciais do calendário (extraídos do site oficial)
INSERT INTO public.calendario_oab (exame_numero, exame_titulo, publicacao_edital, inscricao_inicio, inscricao_fim, prova_primeira_fase, prova_segunda_fase, reaproveitamento_inicio, reaproveitamento_fim) VALUES
(45, '45º EXAME DE ORDEM UNIFICADO', '2025-10-01', '2025-10-06', '2025-10-13', '2025-12-21', '2026-02-22', '2025-10-06', '2025-10-13'),
(46, '46º EXAME DE ORDEM UNIFICADO', '2026-01-26', '2026-02-02', '2026-02-09', '2026-05-03', '2026-06-21', '2026-02-02', '2026-02-09'),
(47, '47º EXAME DE ORDEM UNIFICADO', '2026-05-25', '2026-06-01', '2026-06-08', '2026-08-30', '2026-10-18', '2026-06-01', '2026-06-08'),
(48, '48º EXAME DE ORDEM UNIFICADO', '2026-09-14', '2026-09-21', '2026-09-28', '2026-12-20', '2027-02-21', '2026-09-21', '2026-09-28');

-- Inserir dados iniciais do FAQ
INSERT INTO public.faq_oab_cache (numero, pergunta, resposta) VALUES
(1, 'Onde posso realizar a minha inscrição para o Exame de Ordem?', 'As inscrições são realizadas exclusivamente pelo site oficial do Exame de Ordem (examedeordem.oab.org.br). Acesse o site, clique em "Inscrições" e siga as instruções para criar sua conta e realizar a inscrição no período determinado pelo edital.'),
(2, 'Página de acompanhamento fora do ar - como proceder?', 'Em casos de instabilidade no sistema, aguarde alguns minutos e tente novamente. Se o problema persistir, entre em contato com a Central de Atendimento da FGV através do e-mail ou telefone disponibilizados no site do Exame de Ordem. Recomendamos limpar o cache do navegador e tentar em modo anônimo.'),
(3, 'Estudante do 8º semestre pode fazer o Exame?', 'Sim! Estudantes regularmente matriculados nos dois últimos semestres do curso de Direito (9º e 10º semestres em cursos de 5 anos, ou 7º e 8º semestres em cursos de 4 anos) podem se inscrever no Exame de Ordem. É necessário apresentar declaração da instituição de ensino comprovando a matrícula.'),
(4, 'Como solicitar reaproveitamento da 1ª fase?', 'O reaproveitamento da 1ª fase é válido por até 2 anos (4 edições consecutivas) após a aprovação. No momento da inscrição para a 2ª fase, selecione a opção de reaproveitamento e informe o número do Exame em que foi aprovado na 1ª fase. O sistema verificará automaticamente sua aprovação anterior.'),
(5, 'Posso fazer prova em estado diferente do meu?', 'Sim, você pode escolher realizar a prova em qualquer estado brasileiro, independentemente de onde reside ou estuda. A escolha do local de prova é feita no momento da inscrição. Lembre-se que, após confirmada, a cidade de prova não poderá ser alterada.'),
(6, 'Posso fazer 1ª fase no estado A e 2ª fase no estado B?', 'Sim, é possível realizar a 1ª e a 2ª fase em estados diferentes. A 2ª fase pode ser realizada em qualquer seccional da OAB, independentemente do local onde foi realizada a 1ª fase. Basta selecionar o estado desejado no momento da inscrição para a 2ª fase.'),
(7, 'Onde consulto meu local de prova?', 'O local de prova é divulgado no site do Exame de Ordem alguns dias antes da aplicação. Acesse sua área do candidato com CPF e senha, e consulte a seção "Local de Prova". Recomendamos conferir o endereço completo e planejar sua rota com antecedência.'),
(8, 'Posso solicitar isenção da taxa?', 'Sim, candidatos em situação de vulnerabilidade socioeconômica podem solicitar isenção da taxa de inscrição. O pedido deve ser feito durante o período de inscrições, mediante comprovação de renda familiar per capita de até meio salário mínimo ou inscrição no CadÚnico. Consulte o edital para documentação necessária.'),
(9, 'Solicitei isenção mas apareceu boleto - e agora?', 'Se você solicitou isenção e um boleto foi gerado, aguarde a análise do pedido de isenção. O boleto é gerado automaticamente como garantia, mas só precisa ser pago caso a isenção seja indeferida. Acompanhe o resultado do pedido na sua área do candidato.'),
(10, 'Pagamento pendente após pagar boleto?', 'O processamento do pagamento por boleto pode levar até 3 dias úteis para ser confirmado no sistema. Aguarde esse prazo antes de entrar em contato. Se após 3 dias úteis o status continuar como "pendente", entre em contato com a Central de Atendimento com o comprovante de pagamento em mãos.'),
(11, 'Fui aprovado - como me inscrevo nos quadros da OAB?', 'Parabéns pela aprovação! Para se inscrever nos quadros da OAB, você deve procurar a Seccional do estado onde deseja atuar. Leve os documentos exigidos (diploma ou certidão de conclusão, identidade, CPF, comprovante de residência, certidões negativas e fotos). Cada seccional pode ter requisitos adicionais - consulte o site da OAB do seu estado.');