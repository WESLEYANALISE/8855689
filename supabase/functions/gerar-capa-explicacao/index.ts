import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapear temas para CARICATURAS ESPECÍFICAS de pessoas representando cada conceito
function mapearTemaParaCaricatura(titulo: string): { cena: string; personagens: string; ambiente: string } {
  const tituloLower = titulo.toLowerCase();
  
  // ========== CONCEITOS ESPECÍFICOS DE LEGISLAÇÃO ==========
  
  // O que é uma Lei? - Conceito básico
  if (tituloLower.includes("o que é uma lei") || tituloLower.includes("o que é lei") || (tituloLower.includes("lei") && tituloLower.includes("o que"))) {
    return {
      cena: "Brazilian congressman at ornate podium in Congress signing an official law document with ceremonial pen, camera flashes capturing the historic moment, citizens watching from gallery",
      personagens: "distinguished Brazilian legislator in formal suit signing official document, photographers capturing moment, citizens in gallery observing democracy in action, official gazette on desk",
      ambiente: "Brazilian National Congress chamber (Câmara dos Deputados) with iconic curved architecture, Brazilian flag prominently displayed, official law document being signed and stamped, professional atmosphere"
    };
  }
  
  // Hierarquia das Leis / Pirâmide Normativa
  if (tituloLower.includes("hierarquia") || tituloLower.includes("pirâmide") || tituloLower.includes("piramide")) {
    return {
      cena: "majestic golden pyramid with Constitution glowing at the apex, legislators and citizens on different levels looking up in reverence at each tier of law",
      personagens: "supreme court justices at the Constitution tier, federal legislators on complementary laws level, state officials below, municipal workers at base, all looking upward",
      ambiente: "grand ethereal pyramid structure with each level glowing different colors - gold for Constitution, silver for complementary, bronze for ordinary laws, mystical atmosphere"
    };
  }
  
  // Leis Complementares
  if (tituloLower.includes("complementar") && !tituloLower.includes("emenda")) {
    return {
      cena: "expert craftsmen fitting precise golden puzzle pieces between the Constitution and ordinary laws, creating perfect bridges",
      personagens: "meticulous legislators with magnifying glasses examining how pieces fit, Constitution guardians above, ordinary law keepers below, bridge-builders in between",
      ambiente: "workshop where special laws are crafted with extra care, golden tools, precision instruments, blueprint showing quorum requirements (maioria absoluta)"
    };
  }
  
  // Leis Ordinárias
  if (tituloLower.includes("ordinária") || tituloLower.includes("ordinaria") || tituloLower.includes("leis ordinárias") || tituloLower.includes("lei ordinária")) {
    return {
      cena: "busy law factory with conveyor belt producing many regular laws, legislators voting with simple majority, stacks of everyday legislation",
      personagens: "assembly of legislators raising hands in simple majority vote, clerk counting votes, workers organizing and categorizing many different laws",
      ambiente: "productive legislative factory floor with voting machines showing 50%+1, organized shelves of various subject-matter laws, efficient workflow"
    };
  }
  
  // Leis Delegadas
  if (tituloLower.includes("delegada") || tituloLower.includes("delegação legislativa")) {
    return {
      cena: "Congress ceremonially handing a special golden key to the President, authorizing temporary lawmaking power with watchful oversight",
      personagens: "congressional leaders presenting ornate key to president, oversight committee watching closely with binoculars, legislators with control strings attached",
      ambiente: "diplomatic ceremony hall with power transfer symbolism, temporary authorization clock ticking, Congress building visible in background maintaining control"
    };
  }
  
  // Medidas Provisórias
  if (tituloLower.includes("medida provisória") || tituloLower.includes("medidas provisórias") || tituloLower.includes("mp")) {
    return {
      cena: "President urgently signing emergency decree with giant hourglass counting down 60 days, Congress racing to evaluate before time expires",
      personagens: "president signing frantically with urgency stamp, sand falling in massive hourglass, congressional runners racing with evaluation clipboards, anxious citizens watching",
      ambiente: "emergency command center with countdown clocks everywhere, 60+60 day limit prominently displayed, urgency red lighting, speed and deadline atmosphere"
    };
  }
  
  // Decretos
  if (tituloLower.includes("decreto") && !tituloLower.includes("lei")) {
    return {
      cena: "President at executive desk stamping regulations for law enforcement, without creating new rights, implementing what Congress already approved",
      personagens: "president with executive stamp applying regulations, law book open showing original legislation, bureaucrats organizing implementation details, no legislators present",
      ambiente: "presidential executive office with regulatory manuals, implementation flowcharts, law enforcement symbols, 'execution only' signs, administrative atmosphere"
    };
  }
  
  // Portarias e Resoluções
  if (tituloLower.includes("portaria") || tituloLower.includes("resolução") || tituloLower.includes("instrução normativa")) {
    return {
      cena: "department heads in various ministries issuing internal instructions, bureaucratic gears turning within specific agencies",
      personagens: "ministry directors with department badges issuing orders, internal staff receiving instructions, organizational hierarchy visible, specialized agency workers",
      ambiente: "various ministry offices connected like gears, internal memos flowing between departments, agency-specific emblems, administrative machinery working"
    };
  }
  
  // ========== PROCESSO LEGISLATIVO ==========
  
  // Sanção Presidencial
  if (tituloLower.includes("sanção") && !tituloLower.includes("veto")) {
    return {
      cena: "Brazilian President at Palácio do Planalto signing official law document with ceremonial pen, ministers and legislators applauding behind, press documenting the moment",
      personagens: "Brazilian President in formal attire signing at presidential desk, Cabinet members and congressional leaders in background, photographers and press capturing historic signing",
      ambiente: "Palácio do Planalto presidential office with Brazilian flag, official law document on elegant desk, ceremonial pens lined up, celebratory but formal atmosphere"
    };
  }
  
  // Veto Presidencial
  if (tituloLower.includes("veto")) {
    return {
      cena: "Brazilian President with serious expression stamping VETO on congressional bill, advisors explaining legal concerns, document being returned to Congress",
      personagens: "focused Brazilian President reviewing bill with legal advisors pointing to problematic sections, aide preparing veto message document, congressional liaison waiting to receive rejection",
      ambiente: "Palácio do Planalto meeting room with Constitution on table, veto stamp prominently shown on rejected bill, serious deliberative atmosphere, legal advisors with annotated documents"
    };
  }
  
  // Promulgação
  if (tituloLower.includes("promulgação") || tituloLower.includes("promulgar")) {
    return {
      cena: "President of Brazilian Congress at formal ceremony announcing newly promulgated law, holding official document high, legislative leaders assembled for proclamation",
      personagens: "President of Senate or Chamber at ceremonial podium with official document, legislative leaders in formal attire, court scribes recording, historical moment being documented",
      ambiente: "Brazilian Congress formal session hall with historical significance, official promulgation document with seals, Brazilian national symbols, ceremonial proclamation atmosphere"
    };
  }
  
  // Publicação / Diário Oficial
  if (tituloLower.includes("publicação") || tituloLower.includes("diário oficial") || tituloLower.includes("dou")) {
    return {
      cena: "official Diário Oficial da União being printed and distributed, citizens and lawyers reading the newly published law, digital and print versions available",
      personagens: "government printing office workers producing official gazette, lawyers eagerly reading new publication, citizens accessing digital version on computers, legal researchers taking notes",
      ambiente: "Imprensa Nacional publishing house with Diário Oficial being printed, modern digital access terminals alongside traditional print, official Brazilian government publication atmosphere"
    };
  }
  
  // Vacatio Legis
  if (tituloLower.includes("vacatio") || tituloLower.includes("vigência") || tituloLower.includes("vigor")) {
    return {
      cena: "wall calendar with dates marked showing waiting period between publication and law taking effect, lawyers and citizens preparing for new law's enforcement date",
      personagens: "lawyer with calendar marking 45-day vacatio legis period, clients preparing compliance documents, business owners adjusting operations before enforcement, everyone counting down days",
      ambiente: "law office with large calendar showing publication date and enforcement date circled, countdown visible, preparation documents being organized, anticipation atmosphere"
    };
  }
  
  // Revogação de Lei
  if (tituloLower.includes("revogação") || tituloLower.includes("revogar") || tituloLower.includes("revogada")) {
    return {
      cena: "old law gracefully retiring as new law takes its place on the throne, ceremony of transition and replacement",
      personagens: "elderly retiring law with walking cane stepping down, young new law ascending, legislators overseeing peaceful transition, legal historians documenting",
      ambiente: "transition ceremony hall with old law fading to sepia while new law glows with vitality, 'express revogation' and 'tacit revogation' signs"
    };
  }
  
  // ========== ESTRUTURA DA LEI ==========
  
  // Artigo de Lei
  if (tituloLower.includes("artigo") && !tituloLower.includes("constituição")) {
    return {
      cena: "senior lawyer in elegant law office reading a printed Brazilian law document, finger pointing precisely to an article number (Art. 5º), law books on mahogany desk",
      personagens: "distinguished older lawyer with reading glasses examining official gazette, young associate taking notes, the physical legal document prominently displayed showing numbered articles",
      ambiente: "classic Brazilian law firm with leather-bound Códigos on shelves, Diário Oficial open on desk, warm desk lamp lighting the text, realistic legal document with visible article numbering structure"
    };
  }
  
  // Parágrafos (§)
  if (tituloLower.includes("parágrafo") || tituloLower.includes("§")) {
    return {
      cena: "experienced judge at bench reviewing printed law text, pointing to paragraph section (§1º, §2º) within an article, legal code book open showing the hierarchical structure of Brazilian legislation",
      personagens: "focused Brazilian judge in black robes with white collar examining official legal text, law clerk nearby with highlighter marking paragraph references, real printed law document clearly visible",
      ambiente: "Brazilian courtroom or judge's chambers with Constitution and legal codes visible, actual printed legislation showing 'Art. X' followed by '§1º' and '§2º' in proper Brazilian format, realistic legal documentation"
    };
  }
  
  // Incisos (I, II, III)
  if (tituloLower.includes("inciso")) {
    return {
      cena: "law professor at lecture hall pointing to projected Brazilian law text showing Roman numerals I, II, III under an article, students taking notes on legal structure",
      personagens: "animated law professor with pointer indicating inciso numerals in projected law text, engaged law students with legal codes open on their desks, real legislative text visible on screen",
      ambiente: "Brazilian law school lecture hall with actual Código Civil or Constitution projected, visible structure showing 'Art. X' with 'I -', 'II -', 'III -' items listed below, academic legal atmosphere"
    };
  }
  
  // Alíneas (a, b, c)
  if (tituloLower.includes("alínea")) {
    return {
      cena: "meticulous legal analyst highlighting printed Brazilian law showing alíneas a), b), c) under an inciso, demonstrating the nested structure of legislation",
      personagens: "focused legal researcher with highlighters color-coding different alíneas in printed law text, magnifying glass examining fine details, organized notes showing legal structure hierarchy",
      ambiente: "legal research office with multiple law books open, actual Brazilian legislation text showing complete hierarchy: Artigo → Inciso → Alínea (a, b, c), detailed legal documentation visible"
    };
  }
  
  // ========== TIPOS DE NORMAS ==========
  
  // Emenda Constitucional
  if (tituloLower.includes("emenda constitucional") || tituloLower.includes("emenda à constituição")) {
    return {
      cena: "sacred Constitution opened on altar as legislators perform difficult ritual requiring 3/5 supermajority twice to add new golden page",
      personagens: "3/5 of Congress members raising hands in two rounds of voting, Constitution guardian monks watching carefully, new amendment page glowing gold",
      ambiente: "constitutional temple with quorum counters showing 3/5 requirement, two voting rounds displayed, cláusulas pétreas protected in vault, solemn sacred atmosphere"
    };
  }
  
  // Tratados Internacionais
  if (tituloLower.includes("tratado") || tituloLower.includes("internacional") || tituloLower.includes("convenção")) {
    return {
      cena: "diplomats from different nations signing treaty that then must pass through Brazilian Congress for incorporation",
      personagens: "international diplomats with their flags signing, Brazilian Congress reviewing for incorporation, presidential ratification awaiting, foreign affairs minister bridging",
      ambiente: "international conference room merging with Brazilian Congress, world flags transitioning to Brazilian flag, incorporation process flowchart visible"
    };
  }
  
  // Súmula Vinculante
  if (tituloLower.includes("súmula vinculante")) {
    return {
      cena: "STF justices creating binding precedent that sends shockwaves to all courts below, creating mandatory interpretation",
      personagens: "eleven STF ministers voting on súmula, binding chains extending to all lower courts, judges everywhere receiving mandatory interpretation, lawyers adapting",
      ambiente: "STF creating earthquake of binding precedent, all Brazilian courts connected by golden chains to supreme interpretation, 'vinculante' seal prominent"
    };
  }
  
  // Súmula (não vinculante)
  if (tituloLower.includes("súmula") && !tituloLower.includes("vinculante")) {
    return {
      cena: "tribunal creating persuasive summary of repeated decisions, offering guidance rather than binding command to lower courts",
      personagens: "tribunal judges compiling repeated decisions into summary, lower court judges reading with interest but freedom to diverge, scholars consulting",
      ambiente: "judicial library where precedents are organized into summaries, 'orientation' signs rather than 'mandatory' signs, advisory atmosphere"
    };
  }
  
  // Jurisprudência
  if (tituloLower.includes("jurisprudência") || tituloLower.includes("precedente")) {
    return {
      cena: "mountain of past court decisions being studied by lawyers and judges to understand how courts repeatedly interpret the law",
      personagens: "legal researchers climbing stacks of past decisions, pattern-seekers finding repeated interpretations, historians connecting judicial dots",
      ambiente: "massive archive of court decisions, repeated decisions highlighted and grouped, 'consistent interpretation' patterns visible, historical legal library"
    };
  }
  
  // ========== CONSTITUIÇÃO ESPECÍFICA ==========
  
  // Cláusulas Pétreas
  if (tituloLower.includes("cláusula pétrea") || tituloLower.includes("cláusulas pétreas") || tituloLower.includes("petrea")) {
    return {
      cena: "massive stone tablets with untouchable constitutional principles, protected by guardian shields from any amendment attempts",
      personagens: "Constitution guardians with shields protecting stone tablets, amendment attempts bouncing off, fundamental rights carved in eternal stone",
      ambiente: "constitutional fortress with indestructible core, federalism, separation of powers, voting rights, individual guarantees carved in stone, 'cannot abolish' warnings"
    };
  }
  
  // Direitos Fundamentais
  if (tituloLower.includes("direitos fundamentais") || tituloLower.includes("direito fundamental") || tituloLower.includes("garantias fundamentais")) {
    return {
      cena: "citizens wrapped in protective constitutional shields bearing symbols of life, liberty, equality, security, and property",
      personagens: "diverse citizens each holding fundamental right shields, judge enforcing protection, state actors respecting boundaries, rights defenders standing guard",
      ambiente: "constitutional protection zone where Article 5 rights glow as force fields around citizens, fundamental guarantees visible as protective barriers"
    };
  }
  
  // Separação dos Poderes
  if (tituloLower.includes("separação dos poderes") || tituloLower.includes("três poderes") || tituloLower.includes("tripartição")) {
    return {
      cena: "three distinct buildings housing Legislative, Executive, and Judiciary, connected but independent, each with specific powers",
      personagens: "legislators making laws in Congress, president executing in Planalto, judges judging in STF, each staying in their lane but checking others",
      ambiente: "Brasília three powers plaza with each branch clearly separated, checks and balances arrows between them, harmony through independence"
    };
  }
  
  // ========== PROCESSO E JURISDIÇÃO ==========
  
  // Processo Legislativo
  if (tituloLower.includes("processo legislativo") && !tituloLower.includes("especial")) {
    return {
      cena: "bill's journey as adventure through Congress: initiative, committees, voting, Senate review, sanction - complete expedition",
      personagens: "bill as adventurer character going through stages: proposal, committee analysis, floor voting, other house, presidential decision, publication",
      ambiente: "legislative journey map showing all stages as adventure path, committee rooms as challenge zones, voting as boss battles, sanção as victory"
    };
  }
  
  // Quórum de Votação
  if (tituloLower.includes("quórum") || tituloLower.includes("quorum") || tituloLower.includes("maioria")) {
    return {
      cena: "vote counting ceremony with different bars for different types: simple majority, absolute majority, 3/5 supermajority",
      personagens: "vote counters with different measuring sticks for each type of majority, legislators being counted, quorum checker at door ensuring minimum attendance",
      ambiente: "voting chamber with large vote-counting display, different colored bars for each majority type, attendance tracker, threshold indicators"
    };
  }
  
  // ========== PODER JUDICIÁRIO ==========
  
  // STF - Supremo Tribunal Federal
  if (tituloLower.includes("stf") || tituloLower.includes("supremo tribunal federal")) {
    return {
      cena: "eleven supreme justices in semicircle at Brazil's highest court, deciding constitutional matters that affect entire nation",
      personagens: "eleven STF ministers in black robes with white bibs, president of court in center, lawyers arguing major constitutional case, nation watching",
      ambiente: "grand STF courtroom with constitutional symbols, Brazilian highest court architecture, eleven chairs, constitutional guardian atmosphere"
    };
  }
  
  // STJ - Superior Tribunal de Justiça
  if (tituloLower.includes("stj") || tituloLower.includes("superior tribunal de justiça")) {
    return {
      cena: "STJ ministers unifying interpretation of federal laws, ensuring same law means same thing across all of Brazil",
      personagens: "STJ ministers reviewing conflicting lower court decisions, creating unified interpretation, federal law specialists, uniformity enforcers",
      ambiente: "STJ courtroom focused on federal legislation harmony, map of Brazil showing unified interpretation spreading, 'legal uniformity' symbols"
    };
  }
  
  // Tribunais Regionais
  if (tituloLower.includes("trf") || tituloLower.includes("tribunal regional")) {
    return {
      cena: "regional federal judges reviewing federal matters from their specific regions, appeals from federal first instance",
      personagens: "regional federal judges reviewing appeals, federal prosecutors, regional jurisdiction specialists, citizens from various Brazilian regions",
      ambiente: "regional federal court with Brazil region map highlighting jurisdiction, federal matters focus, appeal review chambers"
    };
  }
  
  // ========== DIREITO PENAL ==========
  
  // Crime / Tipo Penal
  if (tituloLower.includes("crime") || tituloLower.includes("tipo penal") || tituloLower.includes("delito")) {
    return {
      cena: "criminal law as protective boundary - showing what happens when line is crossed, investigation and prosecution begin",
      personagens: "citizen approaching legal boundary line, police investigating when crossed, prosecutor preparing charges, defender protecting rights, judge overseeing",
      ambiente: "legal boundary visualization where criminal line is clearly marked, investigation zone, prosecution arena, protection of accused rights visible"
    };
  }
  
  // Pena / Punição
  if (tituloLower.includes("pena") && !tituloLower.includes("cláusula pétrea")) {
    return {
      cena: "judge weighing punishment on scales considering crime severity, circumstances, rehabilitation goals - proportionality at work",
      personagens: "judge with proportionality scales weighing crime severity vs punishment, convicted looking hopeful at rehabilitation, prosecutor and defender watching",
      ambiente: "sentencing chamber with proportionality scales, crime severity on one side, punishment options on other, rehabilitation symbols, human dignity present"
    };
  }
  
  // Presunção de Inocência
  if (tituloLower.includes("inocência") || tituloLower.includes("presunção") || tituloLower.includes("presumido inocente")) {
    return {
      cena: "accused person wrapped in protective 'innocent until proven guilty' shield while prosecution must build complete proof case",
      personagens: "accused wearing golden presumption shield, prosecutor carrying heavy burden of proof backpack, judge waiting for proof threshold, defender maintaining shield",
      ambiente: "courtroom where burden of proof sits entirely on prosecution side, innocence shield protecting accused, 'state must prove' banners"
    };
  }
  
  // ========== DIREITO CIVIL ==========
  
  // Contrato
  if (tituloLower.includes("contrato") && !tituloLower.includes("trabalho")) {
    return {
      cena: "two parties shaking hands while their agreement crystallizes into binding document, mutual obligations being exchanged",
      personagens: "contracting parties shaking hands with commitment energy, notary witnessing, obligations being exchanged as visible packages, lawyer explaining terms",
      ambiente: "contract formation moment with mutual agreement visible as connecting energy, obligation exchanges, 'pacta sunt servanda' principle visible"
    };
  }
  
  // Propriedade
  if (tituloLower.includes("propriedade") && !tituloLower.includes("intelectual")) {
    return {
      cena: "owner with complete bundle of property rights: use, enjoy, dispose, recover - all four powers visible",
      personagens: "property owner holding four symbolic keys (usar, gozar, dispor, reivindicar), registry official confirming ownership, social function inspector",
      ambiente: "property visualization showing all four ownership powers, registry office connection, social function obligation visible, complete ownership bundle"
    };
  }
  
  // Família
  if (tituloLower.includes("família") || tituloLower.includes("casamento") || tituloLower.includes("união estável")) {
    return {
      cena: "various family configurations recognized by law: marriage, stable union, single-parent - all protected equally",
      personagens: "diverse family types standing equal before family court judge, couples, single parents with children, multi-generational families, all receiving protection",
      ambiente: "family court that recognizes all family types equally, constitutional protection umbrella over all, children's best interest at center"
    };
  }
  
  // Sucessão / Herança
  if (tituloLower.includes("sucessão") || tituloLower.includes("herança") || tituloLower.includes("herdeiro")) {
    return {
      cena: "deceased's estate being distributed according to law: legitimate heirs in line, testamentary wishes being respected",
      personagens: "succession judge overseeing distribution, heirs in legal order (descendentes, ascendentes, cônjuge, colaterais), notary with will, inheritance receivers",
      ambiente: "succession proceedings with estate being divided according to legal rules, legitimate portion protected, testamentary portion distributable"
    };
  }
  
  // ========== DIREITO DO TRABALHO ==========
  
  // CLT / Direito do Trabalho
  if (tituloLower.includes("clt") || tituloLower.includes("trabalhist") || tituloLower.includes("trabalhador")) {
    return {
      cena: "workers from all professions protected by labor law umbrella, employer and employee in balanced but protected relationship",
      personagens: "diverse workers (nurse, construction, teacher, office) under protective CLT umbrella, employer respecting rights, labor judge ensuring balance",
      ambiente: "workplace where labor rights are visible protections: 13th salary, FGTS, vacation, hour limits - all as worker shields"
    };
  }
  
  // ========== DIREITO TRIBUTÁRIO ==========
  
  // Tributo / Imposto
  if (tituloLower.includes("tributo") || tituloLower.includes("imposto") || tituloLower.includes("taxa") || tituloLower.includes("contribuição")) {
    return {
      cena: "citizen contributing taxes that transform into public services: schools, hospitals, roads - the exchange visible",
      personagens: "taxpaying citizen placing contribution in public services machine, transformation into schools/hospitals/roads visible, tax authority collecting fairly",
      ambiente: "tax collection to public service transformation machine, mandatory but fair contribution visualization, public benefit output"
    };
  }
  
  // ========== DIREITO ADMINISTRATIVO ==========
  
  // Administração Pública
  if (tituloLower.includes("administração pública") || tituloLower.includes("servidor público") || tituloLower.includes("concurso")) {
    return {
      cena: "public servants following constitutional principles: legality, impersonality, morality, publicity, efficiency - LIMPE visible",
      personagens: "public servants each holding a LIMPE principle, serving citizens equally, no favoritism visible, efficient service delivery, transparent actions",
      ambiente: "government office where LIMPE principles are displayed as guiding stars, public service oriented, citizen-focused, principle-guided"
    };
  }
  
  // ========== DIREITO DO CONSUMIDOR ==========
  
  // Direito do Consumidor / CDC
  if (tituloLower.includes("consumidor") || tituloLower.includes("cdc")) {
    return {
      cena: "consumer with CDC shield being protected from unfair business practices, balance being restored to unequal relationship",
      personagens: "consumer with protective CDC book, PROCON defender at side, business correcting unfair practice, consumer court judge ensuring fairness",
      ambiente: "consumer protection zone where vulnerability is recognized and compensated, fair relationship restoration, information rights visible"
    };
  }
  
  // ========== DIREITO AMBIENTAL ==========
  
  // Meio Ambiente
  if (tituloLower.includes("ambiental") || tituloLower.includes("meio ambiente") || tituloLower.includes("ecológic")) {
    return {
      cena: "nature being protected for current and future generations, environmental prosecutor defending ecosystems in court",
      personagens: "environmental prosecutor defending forest and rivers, future generation children watching, polluter being held accountable, sustainability judge",
      ambiente: "environmental court where nature has standing, future generations represented, sustainable development balance, ecological protection zone"
    };
  }
  
  // ========== DIREITO ELEITORAL ==========
  
  // Direito Eleitoral / Voto
  if (tituloLower.includes("eleitoral") || tituloLower.includes("voto") || tituloLower.includes("eleição")) {
    return {
      cena: "citizens exercising sacred right to vote, electoral justice ensuring fair process, democracy in action",
      personagens: "diverse voters casting ballots in urna eletrônica, electoral judge ensuring fairness, candidates awaiting results, democracy guardians watching",
      ambiente: "Brazilian voting station with urna eletrônica, electoral justice symbols, democratic celebration, civic duty atmosphere"
    };
  }
  
  // ========== CONCEITOS GERAIS ADICIONAIS ==========
  
  // Direitos e Garantias
  if (tituloLower.includes("direito") || tituloLower.includes("garantia")) {
    return {
      cena: "citizen surrounded by protective legal shields representing various rights, state respecting boundaries",
      personagens: "protected citizen with rights shields, rights defenders standing guard, potential violators kept at bay, judge enforcing protections",
      ambiente: "rights protection zone where fundamental guarantees create force field around citizens, state power limited"
    };
  }
  
  // Constituição Federal
  if (tituloLower.includes("constituição") || tituloLower.includes("constitucional") || tituloLower.includes("carta magna")) {
    return {
      cena: "grand assembly of founding figures gathered around glowing Constitutional document, the supreme law being honored",
      personagens: "constitutional assembly members in formal attire, Constitution on pedestal glowing golden, historians documenting, citizens benefiting below",
      ambiente: "majestic constitutional temple with 1988 Constitution as central treasure, democratic redemocratization symbols, supreme law atmosphere"
    };
  }
  
  // Tribunal / Julgamento / STF
  if (tituloLower.includes("tribunal") || tituloLower.includes("julga") || tituloLower.includes("supremo")) {
    return {
      cena: "supreme court justices in semicircle deliberating important case, lawyers arguing, justice being administered",
      personagens: "robed justices in elevated bench, arguing lawyers at podium, attentive audience, court staff, justice being weighed",
      ambiente: "grand supreme court chamber with judicial symbols, gavels, legal books, Brazilian judicial architecture, solemnity and dignity"
    };
  }
  
  // Processo / Ação Judicial
  if (tituloLower.includes("processo") || tituloLower.includes("ação judicial") || tituloLower.includes("procedimento")) {
    return {
      cena: "case file on journey through judicial system: filing, service, response, evidence, judgment - complete path",
      personagens: "case file as character traveling through court stages, court clerks processing, judge reviewing, parties waiting, lawyers guiding",
      ambiente: "judicial processing system visualization, case moving through stages, due process protections visible at each step"
    };
  }
  
  // Default - Direito em geral
  return {
    cena: `photorealistic scene of Brazilian legal professionals working with actual legislation documents representing "${titulo}" - lawyers reading printed laws, judges reviewing cases, legal researchers analyzing texts in realistic Brazilian legal settings`,
    personagens: `Brazilian legal professionals (lawyers in suits, judges in robes, law students with textbooks) specifically working with "${titulo}" concept - real people in authentic Brazilian legal environments`,
    ambiente: `authentic Brazilian legal setting appropriate for "${titulo}" - law firm offices, courtrooms, law school libraries, or government buildings with visible legal documents, Códigos, and official publications related to this topic`
  };
}

// Gerar prompt de imagem com cenas REALISTAS de contexto jurídico brasileiro
function gerarPromptImagem(titulo: string): string {
  const visual = mapearTemaParaCaricatura(titulo);
  
  return `CREATE A PHOTOREALISTIC CINEMATIC IMAGE specifically for: "${titulo}"

CRITICAL REQUIREMENT: This image MUST show REAL legal documents, laws being read, or authentic Brazilian legal settings. NO abstract symbols like § or scales of justice alone. Show PEOPLE INTERACTING WITH ACTUAL LEGISLATION - reading printed laws, signing documents, analyzing legal texts.

STYLE: Photorealistic cinematic style like a high-end legal drama movie still. Real Brazilian professionals in authentic settings. Rich detail, dramatic lighting, professional atmosphere. Think Netflix legal series quality.

MAIN SCENE: ${visual.cena}

CHARACTERS:
${visual.personagens}

SETTING:
${visual.ambiente}

CRITICAL VISUAL REQUIREMENTS:
- MUST BE 16:9 WIDE LANDSCAPE orientation - fill the entire widescreen format completely
- Show REAL printed legal documents, law books, official gazettes, or legal codes being actively used
- Characters must be realistic adult Brazilians in professional attire (suits, judicial robes)
- Visible Brazilian elements: Brazilian flag, Brasília architecture, Portuguese text on documents
- Documents should show realistic legal formatting (Art. X, §1º, I, II, etc.) when appropriate
- Cinematic lighting with warm tones, depth of field, professional photography quality

ABSOLUTELY FORBIDDEN:
- NO abstract symbols floating in air (no giant § symbols, no floating scales)
- NO cartoon or illustrated style - must be photorealistic
- NO fantasy or magical elements
- NO generic stock photo feeling - must be specific to "${titulo}"

TEXT RULES:
- Any visible text on documents MUST be in PORTUGUESE and in UPPERCASE
- No floating text labels or captions
- Document text should look natural and realistic

QUALITY:
- 8K photorealistic quality, cinematic color grading
- Professional photography composition with rule of thirds
- Rich textures in clothing, leather books, wood furniture, paper documents
- The resulting image should look like a still from a prestige legal drama about "${titulo}"`;
}

// Chaves Gemini para fallback
const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

async function gerarImagemGemini(prompt: string): Promise<string | null> {
  for (const apiKey of API_KEYS) {
    try {
      console.log(`Tentando gerar imagem com chave Gemini...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Gemini Image falhou com status ${response.status}: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          console.log("Imagem gerada com sucesso!");
          return part.inlineData.data;
        }
      }
    } catch (error) {
      console.error("Erro com Gemini Image:", error);
    }
  }
  return null;
}

async function comprimirComTinyPNG(imageBytes: Uint8Array): Promise<Uint8Array> {
  const tinyPngKey = Deno.env.get("TINYPNG_API_KEY");
  if (!tinyPngKey) return imageBytes;

  try {
    const uploadResponse = await fetch("https://api.tinify.com/shrink", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${tinyPngKey}`)}`,
        "Content-Type": "image/png",
      },
      body: imageBytes as unknown as BodyInit,
    });

    if (!uploadResponse.ok) return imageBytes;

    const result = await uploadResponse.json();
    const outputUrl = result.output?.url;
    if (!outputUrl) return imageBytes;

    // Converter para WebP
    const convertResponse = await fetch(outputUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${tinyPngKey}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ convert: { type: ["image/webp"] } }),
    });

    if (!convertResponse.ok) {
      const downloadResponse = await fetch(outputUrl);
      return new Uint8Array(await downloadResponse.arrayBuffer());
    }

    return new Uint8Array(await convertResponse.arrayBuffer());
  } catch (error) {
    console.error("Erro TinyPNG:", error);
    return imageBytes;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ordem, titulo } = await req.json();

    if (!ordem || !titulo) {
      return new Response(
        JSON.stringify({ error: "Parâmetros 'ordem' e 'titulo' são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gerar prompt específico para o título
    const prompt = gerarPromptImagem(titulo);
    console.log(`Gerando capa específica para: "${titulo}"`);

    // Gerar imagem com Gemini (API direta)
    const imageBase64 = await gerarImagemGemini(prompt);

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Falha ao gerar imagem com todas as APIs disponíveis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Converter base64 para bytes
    const imageBytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    // Comprimir e converter para WebP
    const compressedBytes = await comprimirComTinyPNG(imageBytes);

    // Upload para Storage
    const fileName = `lei-seca/explicacao-${ordem}-${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("gerador-imagens")
      .upload(fileName, compressedBytes, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);
      return new Response(
        JSON.stringify({ error: `Erro no upload: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from("gerador-imagens")
      .getPublicUrl(fileName);

    const url_capa = publicUrlData.publicUrl;

    // Atualizar tabela
    const { error: updateError } = await supabase
      .from("lei_seca_explicacoes")
      .update({ url_capa })
      .eq("ordem", ordem);

    if (updateError) {
      console.error("Erro ao atualizar tabela:", updateError);
      return new Response(
        JSON.stringify({ error: `Erro ao atualizar: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url_capa,
        titulo_processado: titulo,
        message: `Capa específica gerada para: "${titulo}"`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
