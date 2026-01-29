-- Atualizar "A Sociedade Aberta e Seus Inimigos" com descrição e benefícios completos
UPDATE "BIBLIOTECA-POLITICA"
SET 
  sobre = 'Nesta obra monumental, Karl Popper desenvolve uma crítica filosófica devastadora às bases intelectuais do totalitarismo. Analisando desde Platão até Marx e Hegel, o autor demonstra como certas correntes de pensamento pavimentaram o caminho para regimes autoritários. Popper defende a democracia liberal como a única forma de governo que permite a correção de erros sem derramamento de sangue, introduzindo o conceito revolucionário de "sociedade aberta" - uma sociedade que valoriza a liberdade individual, a racionalidade crítica e a capacidade de mudança pacífica.',
  beneficios = 'Desenvolva pensamento crítico sobre ideologias políticas. Compreenda as raízes filosóficas do autoritarismo. Aprenda a identificar argumentos totalitários disfarçados. Fortaleça sua defesa da democracia com argumentos sólidos.'
WHERE livro ILIKE '%sociedade aberta%';

-- Atualizar "Pedagogia do Oprimido"
UPDATE "BIBLIOTECA-POLITICA"
SET 
  sobre = 'Paulo Freire apresenta sua revolucionária teoria da educação libertadora, que influenciou movimentos sociais em todo o mundo. O livro critica a "educação bancária" tradicional e propõe um modelo dialógico onde educador e educando aprendem juntos. Freire argumenta que a verdadeira educação deve conscientizar os oprimidos sobre sua condição e capacitá-los a transformar a realidade. Uma obra fundamental para entender os debates contemporâneos sobre educação, consciência de classe e transformação social.',
  beneficios = 'Compreenda a visão de esquerda sobre educação e poder. Desenvolva senso crítico sobre métodos educacionais. Entenda a teoria por trás de movimentos sociais. Amplie sua visão sobre o papel transformador da educação.'
WHERE livro ILIKE '%pedagogia do oprimido%';

-- Atualizar "Capitalismo e Liberdade"
UPDATE "BIBLIOTECA-POLITICA"
SET 
  sobre = 'Milton Friedman, ganhador do Prêmio Nobel de Economia, apresenta uma defesa vigorosa do capitalismo de livre mercado e da liberdade individual. O economista argumenta que a liberdade econômica é condição necessária para a liberdade política, criticando a intervenção estatal em áreas como educação, saúde e previdência. Friedman propõe alternativas baseadas no mercado para problemas sociais, incluindo o imposto de renda negativo e os vouchers educacionais. Uma obra essencial para compreender o liberalismo econômico moderno.',
  beneficios = 'Domine os argumentos do liberalismo econômico. Entenda propostas de políticas públicas baseadas no mercado. Desenvolva visão crítica sobre intervenção estatal. Compreenda a relação entre economia e liberdade política.'
WHERE livro ILIKE '%capitalismo e liberdade%';

-- Atualizar "Democracia na América"
UPDATE "BIBLIOTECA-POLITICA"
SET 
  sobre = 'Alexis de Tocqueville realizou uma análise profunda da democracia americana no século XIX que permanece extraordinariamente atual. O pensador francês examina como as instituições democráticas, a cultura cívica e os costumes se inter-relacionam. Tocqueville alerta sobre os perigos da "tirania da maioria" e analisa o papel vital das associações civis, da liberdade de imprensa e da religião na manutenção da liberdade. Uma obra indispensável para entender os fundamentos e os desafios das democracias modernas.',
  beneficios = 'Compreenda os fundamentos das democracias liberais. Identifique ameaças à liberdade mesmo em sistemas democráticos. Entenda a importância da sociedade civil organizada. Desenvolva visão equilibrada sobre democracia e suas limitações.'
WHERE livro ILIKE '%democracia na américa%';

-- Atualizar "Por que as Nações Fracassam"
UPDATE "BIBLIOTECA-POLITICA"
SET 
  sobre = 'Daron Acemoglu e James Robinson apresentam uma teoria abrangente sobre por que algumas nações prosperam enquanto outras permanecem na pobreza. Os autores argumentam que a diferença fundamental está nas instituições: países com instituições "inclusivas" - que protegem direitos de propriedade e oferecem oportunidades iguais - prosperam, enquanto aqueles com instituições "extrativas" - que concentram poder e riqueza nas mãos de poucos - fracassam. Uma análise poderosa baseada em séculos de história que explica as origens da desigualdade global.',
  beneficios = 'Entenda por que alguns países são ricos e outros pobres. Aprenda sobre a importância das instituições políticas. Desenvolva visão histórica sobre desenvolvimento econômico. Compreenda os desafios do Brasil à luz da teoria institucional.'
WHERE livro ILIKE '%nações fracassam%';