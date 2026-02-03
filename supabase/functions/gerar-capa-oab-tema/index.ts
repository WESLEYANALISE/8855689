import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════════════
// PALETA DE CORES POR ÁREA JURÍDICA
// ═══════════════════════════════════════════════════════════════════════════
const paletasPorArea: Record<string, { corPrincipal: string; corSecundaria: string; corDestaque: string; descricao: string }> = {
  'Direito Processual Civil': { corPrincipal: '#4682B4', corSecundaria: '#FFFFFF', corDestaque: '#C0C0C0', descricao: 'steel blue, white, silver' },
  'Direito Processual Penal': { corPrincipal: '#800020', corSecundaria: '#696969', corDestaque: '#1a1a1a', descricao: 'burgundy red, dark gray, black' },
  'Direito Civil': { corPrincipal: '#1E3A5F', corSecundaria: '#F5F5F5', corDestaque: '#C0C0C0', descricao: 'navy blue, clean white, silver tones' },
  'Direito Penal': { corPrincipal: '#8B0000', corSecundaria: '#1a1a1a', corDestaque: '#D4AF37', descricao: 'deep crimson red, black shadows, golden accents' },
  'Direito Constitucional': { corPrincipal: '#006400', corSecundaria: '#FFD700', corDestaque: '#00308F', descricao: 'deep green, golden yellow, patriotic blue' },
  'Direito Tributário': { corPrincipal: '#228B22', corSecundaria: '#D4AF37', corDestaque: '#CD7F32', descricao: 'forest green, gold, bronze money tones' },
  'Direito do Trabalho': { corPrincipal: '#CC5500', corSecundaria: '#1E3A5F', corDestaque: '#8B4513', descricao: 'burnt orange, industrial blue, earthy brown' },
  'Direito Administrativo': { corPrincipal: '#663399', corSecundaria: '#808080', corDestaque: '#FFFFFF', descricao: 'royal purple, institutional gray, white' },
  'Direito Empresarial': { corPrincipal: '#0047AB', corSecundaria: '#D4AF37', corDestaque: '#36454F', descricao: 'corporate blue, gold, charcoal' },
  'Ética Profissional': { corPrincipal: '#4B0082', corSecundaria: '#D4AF37', corDestaque: '#FFFFFF', descricao: 'deep purple, gold, white' },
  'default': { corPrincipal: '#1E3A5F', corSecundaria: '#D4AF37', corDestaque: '#FFFFFF', descricao: 'navy blue, gold, white' }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAPEAMENTO COMPLETO: Cenas semi-realistas para temas de OAB
// ═══════════════════════════════════════════════════════════════════════════
interface ContextoVisual {
  cena: string;
  elementos: string;
  atmosfera: string;
  variacoes: string[];
}

const mapaTemasOAB: { keywords: string[]; contexto: ContextoVisual }[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSO CIVIL - PARTES E SUJEITOS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['litisconsórcio', 'pluralidade de partes'], 
    contexto: {
      cena: 'Multiple plaintiffs or defendants seated together at courtroom table, representing joint litigation',
      elementos: 'group of 3-4 people on same side of courtroom, shared lawyer, multiple case folders, united front',
      atmosfera: 'solidarity, joint action, strength in numbers',
      variacoes: [
        'multiple plaintiffs signing joint petition together at law office',
        'group of defendants with shared defense lawyer in Brazilian court',
        'judge addressing multiple parties at once in formal hearing',
        'lawyers conferring with multiple clients at long conference table',
        'shared verdict document affecting multiple parties simultaneously'
      ]
    }
  },
  { 
    keywords: ['intervenção de terceiros', 'assistência', 'chamamento', 'denunciação da lide'], 
    contexto: {
      cena: 'Third party entering courtroom proceedings mid-trial, joining existing case',
      elementos: 'person walking into court session, existing parties looking surprised, judge allowing entry, new documents being presented',
      atmosfera: 'disruption, new perspective, expanded litigation, complexity',
      variacoes: [
        'new party presenting documents to join ongoing case in court',
        'judge ruling on third party intervention request with gavel',
        'original parties reacting to intervener joining their lawsuit',
        'lawyer introducing new client to complex ongoing case',
        'three-way dispute resolution session with mediator'
      ]
    }
  },
  { 
    keywords: ['capacidade processual', 'legitimidade', 'representação processual'], 
    contexto: {
      cena: 'Lawyer presenting power of attorney document to court clerk, authorization to act',
      elementos: 'legal power of attorney document, lawyer with briefcase, court clerk verifying, official stamps',
      atmosfera: 'authorization, legal capacity, formal verification',
      variacoes: [
        'parent signing papers to represent minor child in court',
        'guardian presenting documents for incapacitated person',
        'company representative showing corporate authorization',
        'lawyer receiving mandate from client with handshake',
        'court clerk verifying capacity documents carefully'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSO CIVIL - TUTELA PROVISÓRIA
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['tutela provisória', 'liminar', 'urgência', 'antecipação', 'tutela de urgência'], 
    contexto: {
      cena: 'Emergency court session at night, judge issuing urgent protective order, clock showing urgency',
      elementos: 'judge signing urgent order, red URGENT stamp, clock showing time pressure, relieved petitioner',
      atmosfera: 'urgency, protection, immediate action, race against time',
      variacoes: [
        'petitioner rushing to court with emergency papers late at night',
        'judge stamping emergency injunction with dramatic lighting',
        'protective order stopping harmful action just in time',
        'lawyer on phone getting emergency hearing approved urgently',
        'clock and gavel representing time-sensitive justice'
      ]
    }
  },
  { 
    keywords: ['tutela de evidência', 'evidência'], 
    contexto: {
      cena: 'Lawyer presenting overwhelming evidence to judge, clear case for immediate relief',
      elementos: 'stack of conclusive documents, confident lawyer, judge nodding in agreement, obvious proof',
      atmosfera: 'clarity, obvious right, undeniable evidence',
      variacoes: [
        'judge reviewing crystal-clear documentary evidence',
        'lawyer presenting irrefutable proof to skeptical opponent',
        'pile of documents supporting undeniable claim',
        'courtroom moment when evidence speaks for itself',
        'contract being shown as proof of undeniable right'
      ]
    }
  },
  { 
    keywords: ['medida cautelar', 'cautelar', 'asseguração'], 
    contexto: {
      cena: 'Assets being secured under judicial order, protective measures being implemented',
      elementos: 'property with seal, judicial officer, secured assets, protective documentation',
      atmosfera: 'preservation, protection, securing rights',
      variacoes: [
        'bank account being frozen by judicial order',
        'property receiving judicial seal for protection',
        'valuables being inventoried for safekeeping',
        'judicial officer implementing protective measure',
        'documents being secured in evidence safe'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSO CIVIL - PETIÇÃO E PROCEDIMENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['petição inicial', 'propositura', 'ajuizamento'], 
    contexto: {
      cena: 'Lawyer filing initial lawsuit at court clerk office, beginning of case',
      elementos: 'lawyer with petition documents, court clerk receiving, protocol stamp, case number being assigned',
      atmosfera: 'beginning, first step, hope for justice',
      variacoes: [
        'lawyer handing petition to clerk at courthouse counter',
        'petition receiving official protocol stamp with date',
        'new case number being registered in court system',
        'plaintiff signing final petition before filing',
        'legal team reviewing petition before submission'
      ]
    }
  },
  { 
    keywords: ['contestação', 'defesa', 'resposta do réu'], 
    contexto: {
      cena: 'Defense lawyer preparing response to lawsuit, building counter-arguments',
      elementos: 'defendant with lawyer, defense documents, rebuttal papers, law books for research',
      atmosfera: 'defense, rebuttal, right to respond, protection',
      variacoes: [
        'defense lawyer writing contestation at desk with focus',
        'defendant reviewing defense strategy with attorney',
        'stack of defense documents being organized',
        'lawyer researching case law for defense arguments',
        'defense team meeting to prepare response strategy'
      ]
    }
  },
  { 
    keywords: ['réplica', 'impugnação'], 
    contexto: {
      cena: 'Lawyer reviewing opponents arguments and preparing counter-response',
      elementos: 'two sets of documents being compared, highlighter marks, response in progress',
      atmosfera: 'back-and-forth, debate, refinement of arguments',
      variacoes: [
        'lawyer highlighting contradictions in opponent arguments',
        'side-by-side comparison of claims and defenses',
        'preparing reply to defense assertions at desk',
        'legal research to counter opposing arguments',
        'notes and annotations on opponent petition'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSO CIVIL - PROVAS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['prova', 'provas', 'instrução probatória', 'produção de provas'], 
    contexto: {
      cena: 'Evidence being presented and examined in court, proof evaluation process',
      elementos: 'evidence table with exhibits, judge examining, lawyers presenting, documentation',
      atmosfera: 'scrutiny, truth-seeking, demonstration',
      variacoes: [
        'lawyer presenting key evidence document to judge',
        'evidence table with numbered exhibits in court',
        'expert examining physical evidence carefully',
        'digital evidence displayed on court screen',
        'chain of custody documentation being verified'
      ]
    }
  },
  { 
    keywords: ['testemunha', 'prova testemunhal', 'oitiva'], 
    contexto: {
      cena: 'Witness testifying in court, sworn testimony under oath',
      elementos: 'witness stand, person testifying, lawyers listening, court reporter',
      atmosfera: 'testimony, truth, oral evidence, solemnity',
      variacoes: [
        'witness raising hand taking oath before testifying',
        'key witness answering lawyers questions in court',
        'lawyer approaching witness stand with document',
        'court reporter recording testimony carefully',
        'witness pointing at defendant during identification'
      ]
    }
  },
  { 
    keywords: ['perícia', 'perito', 'laudo pericial', 'prova pericial'], 
    contexto: {
      cena: 'Expert witness analyzing evidence and preparing technical report',
      elementos: 'expert in lab coat, scientific equipment, detailed report, technical analysis',
      atmosfera: 'technical expertise, scientific analysis, specialized knowledge',
      variacoes: [
        'forensic expert examining evidence in laboratory',
        'expert writing detailed technical report at desk',
        'specialist presenting findings to court with charts',
        'medical expert reviewing documents for case',
        'technical equipment being used for evidence analysis'
      ]
    }
  },
  { 
    keywords: ['documento', 'prova documental', 'documentação'], 
    contexto: {
      cena: 'Important documents being reviewed and authenticated for court use',
      elementos: 'official documents with stamps, magnifying glass, authentication process, files',
      atmosfera: 'documentation, verification, paper trail',
      variacoes: [
        'lawyer examining crucial document with attention',
        'notary authenticating important legal documents',
        'pile of case documents organized with tabs',
        'contract being compared with original for verification',
        'electronic document signature being validated'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSO CIVIL - SENTENÇA E RECURSOS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['sentença', 'julgamento', 'decisão judicial'], 
    contexto: {
      cena: 'Judge delivering sentence in formal courtroom, moment of judgment',
      elementos: 'judge at bench, gavel, written decision, parties awaiting verdict',
      atmosfera: 'judgment, finality, authoritative decision',
      variacoes: [
        'judge reading sentence aloud in packed courtroom',
        'gavel coming down as verdict is pronounced',
        'written sentence document with judicial signature',
        'parties reacting to judges decision moment',
        'court clerk distributing sentence copies'
      ]
    }
  },
  { 
    keywords: ['coisa julgada', 'trânsito em julgado', 'imutabilidade'], 
    contexto: {
      cena: 'Final judgment certificate being stamped, case officially closed forever',
      elementos: 'certificate of finality, stamp FINAL, closed case file, locked archive',
      atmosfera: 'finality, permanence, closure, definitive end',
      variacoes: [
        'case file being stamped TRANSITO EM JULGADO',
        'archive room with old decided cases stored',
        'lawyer receiving certificate of final judgment',
        'judge signing final resolution of long case',
        'closed file with seal being archived forever'
      ]
    }
  },
  { 
    keywords: ['recurso', 'apelação', 'agravo', 'recursal'], 
    contexto: {
      cena: 'Lawyer filing appeal at higher court, challenging lower court decision',
      elementos: 'appeal documents, higher court building, lawyer climbing stairs symbolically, case review',
      atmosfera: 'challenge, review, second chance, hierarchy',
      variacoes: [
        'lawyer preparing appeal brief at desk with focus',
        'appeal being filed at appellate court counter',
        'higher court panel reviewing appealed case',
        'lawyer arguing appeal before three judges',
        'case file moving up to superior court level'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSO CIVIL - EXECUÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['execução', 'cumprimento de sentença', 'executivo'], 
    contexto: {
      cena: 'Court order being enforced, assets being collected to satisfy judgment',
      elementos: 'enforcement officer, seizure order, assets being collected, debtor paying',
      atmosfera: 'enforcement, compulsion, satisfaction of judgment',
      variacoes: [
        'judicial officer serving execution order at door',
        'bank transferring funds to satisfy judgment',
        'assets being inventoried for auction sale',
        'debtor making payment under court supervision',
        'property being appraised for judicial sale'
      ]
    }
  },
  { 
    keywords: ['penhora', 'constrição', 'bens penhorados'], 
    contexto: {
      cena: 'Property being seized by court order, assets frozen for debt payment',
      elementos: 'property with judicial seal, officer documenting, frozen bank account screen, seized goods',
      atmosfera: 'seizure, constraint, security for payment',
      variacoes: [
        'judicial seal being placed on valuable property',
        'bank account showing frozen status by court',
        'vehicle receiving seizure documentation',
        'officer inventorying seized household goods',
        'real estate with judicial attachment notice'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSO CIVIL - PROCEDIMENTOS ESPECIAIS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['inventário', 'partilha', 'herança processual'], 
    contexto: {
      cena: 'Family gathered for inheritance division proceedings, estate distribution',
      elementos: 'family members around table, estate documents, lawyer mediating, assets being divided',
      atmosfera: 'legacy, family, division, bittersweet inheritance',
      variacoes: [
        'lawyer reading will to gathered heirs at table',
        'estate assets being catalogued and valued',
        'family agreeing on property division in office',
        'inheritance documents being signed by all heirs',
        'judge approving final estate partition'
      ]
    }
  },
  { 
    keywords: ['ação monitória', 'monitória'], 
    contexto: {
      cena: 'Creditor presenting promissory note to court for fast-track collection',
      elementos: 'promissory note document, creditor with proof, fast-track stamp, simplified procedure',
      atmosfera: 'expedited collection, documentary proof, efficiency',
      variacoes: [
        'creditor presenting check as proof of debt',
        'judge reviewing monitória petition quickly',
        'promissory note being authenticated for court',
        'fast-track debt collection order being issued',
        'debtor receiving monitória summons to pay'
      ]
    }
  },
  { 
    keywords: ['consignação em pagamento', 'consignação'], 
    contexto: {
      cena: 'Debtor depositing payment at court to clear obligation when creditor refuses',
      elementos: 'deposit slip, bank teller, court deposit order, relieved debtor',
      atmosfera: 'liberation from debt, forced acceptance, legal clearing',
      variacoes: [
        'debtor making judicial deposit at bank counter',
        'court order authorizing consignment deposit',
        'rent payment being deposited due to landlord refusal',
        'judge declaring debt discharged by deposit',
        'deposit receipt as proof of payment attempt'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESSO CIVIL - JURISDIÇÃO E COMPETÊNCIA
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['competência', 'jurisdição', 'foro competente'], 
    contexto: {
      cena: 'Map of Brazil showing different court jurisdictions, case being directed to proper forum',
      elementos: 'Brazil map with court districts, case file with routing, jurisdiction chart, correct court',
      atmosfera: 'organization, proper forum, territorial limits',
      variacoes: [
        'lawyer determining which court has jurisdiction',
        'map showing federal vs state court divisions',
        'case being transferred to competent court',
        'judge declining case for lack of jurisdiction',
        'forum selection clause in contract being analyzed'
      ]
    }
  },
  { 
    keywords: ['conflito de competência', 'competência concorrente'], 
    contexto: {
      cena: 'Two courts disputing which should hear the case, conflict resolution',
      elementos: 'two courthouse buildings, case file in middle, superior court deciding, conflict diagram',
      atmosfera: 'dispute, hierarchy resolution, clarification',
      variacoes: [
        'two judges disagreeing on who should handle case',
        'superior court resolving jurisdiction conflict',
        'case file bouncing between two courts diagram',
        'lawyer petitioning to resolve competency conflict',
        'federal vs state court jurisdiction dispute'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO PENAL - CRIMES ESPECÍFICOS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['homicídio', 'morte', 'matar'], 
    contexto: {
      cena: 'Crime scene investigation with forensic team, yellow tape, evidence markers',
      elementos: 'forensic investigators in white suits, evidence markers, police photographer, detective taking notes',
      atmosfera: 'somber, investigative, professional gravity',
      variacoes: [
        'detective examining evidence under magnifying glass',
        'forensic team collecting samples at night scene',
        'murder board in police station with connections',
        'coroner examining evidence in laboratory',
        'witness being interviewed by detectives'
      ]
    }
  },
  { 
    keywords: ['roubo', 'furto', 'patrimônio'], 
    contexto: {
      cena: 'Police investigating robbery scene, victim giving statement, evidence collection',
      elementos: 'broken lock, police officer, victim describing event, evidence bags',
      atmosfera: 'crime aftermath, investigation, property violation',
      variacoes: [
        'security camera footage showing robbery moment',
        'victim describing robber to police sketch artist',
        'fingerprint being collected from crime scene',
        'stolen goods recovered in police evidence room',
        'police lineup for robbery suspect identification'
      ]
    }
  },
  { 
    keywords: ['corrupção', 'peculato', 'improbidade'], 
    contexto: {
      cena: 'Federal police raiding corrupt officials office, money being seized',
      elementos: 'police in tactical gear, briefcase of cash, politician being arrested, media cameras',
      atmosfera: 'corruption exposed, justice prevailing, accountability',
      variacoes: [
        'money hidden in walls being discovered by police',
        'politician being escorted in handcuffs past cameras',
        'evidence of bribery being catalogued',
        'judge reviewing corruption case evidence',
        'whistleblower providing testimony against officials'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO CONSTITUCIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['constituição', 'constitucional', 'direitos fundamentais'], 
    contexto: {
      cena: 'Brazilian Constitution being studied in law school, fundamental rights emphasized',
      elementos: 'constitution book open, highlighted articles, law student studying, national symbols',
      atmosfera: 'foundation, fundamental rights, supreme law',
      variacoes: [
        'constitution open to fundamental rights chapter',
        'STF building representing constitutional guardian',
        'citizen exercising constitutional rights proudly',
        'constitution anniversary celebration ceremony',
        'lawyer citing constitution in passionate argument'
      ]
    }
  },
  { 
    keywords: ['habeas corpus', 'liberdade'], 
    contexto: {
      cena: 'Lawyer presenting habeas corpus petition, fighting for clients freedom',
      elementos: 'constitutional petition, prison background, hopeful prisoner, urgent filing',
      atmosfera: 'constitutional protection, freedom, urgent remedy',
      variacoes: [
        'lawyer rushing to file habeas corpus at night',
        'prisoner learning of successful habeas corpus',
        'judge granting habeas corpus order dramatically',
        'prison gates opening after habeas corpus granted',
        'family celebrating release on habeas corpus'
      ]
    }
  },
  { 
    keywords: ['mandado de segurança', 'direito líquido'], 
    contexto: {
      cena: 'Citizen filing mandamus against government authority abuse',
      elementos: 'official abuse evidence, mandamus petition, government building, citizen with rights',
      atmosfera: 'citizen vs state, protection of rights, constitutional remedy',
      variacoes: [
        'citizen receiving response to mandamus petition',
        'government official receiving mandamus order',
        'lawyer preparing mandamus against illegal act',
        'judge issuing mandamus with urgency',
        'public authority complying with mandamus order'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTICA E OAB
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['ética', 'ética profissional', 'deontologia'], 
    contexto: {
      cena: 'Lawyer facing ethical dilemma, conscience and professional duty balanced',
      elementos: 'lawyer in contemplation, ethics code book, scales representing choice, integrity',
      atmosfera: 'moral decision, professional integrity, ethical standards',
      variacoes: [
        'lawyer refusing unethical client request firmly',
        'OAB ethics tribunal in session reviewing case',
        'young lawyer studying professional ethics code',
        'mentorship moment about ethical practice',
        'lawyer choosing ethical path despite pressure'
      ]
    }
  },
  { 
    keywords: ['sigilo', 'confidencialidade', 'segredo profissional'], 
    contexto: {
      cena: 'Lawyer protecting client confidential information, trust and secrecy',
      elementos: 'sealed files, locked cabinet, lawyer-client privilege symbol, trust',
      atmosfera: 'confidentiality, trust, sacred duty, protection',
      variacoes: [
        'lawyer locking confidential files in safe',
        'private consultation in soundproof office',
        'shredding sensitive documents securely',
        'lawyer declining to reveal client information',
        'secure communication between lawyer and client'
      ]
    }
  },
  { 
    keywords: ['honorários', 'pagamento', 'remuneração advocatícia'], 
    contexto: {
      cena: 'Professional fee agreement being discussed between lawyer and client',
      elementos: 'fee contract, handshake, transparent pricing, professional service',
      atmosfera: 'fair compensation, professional value, clear agreement',
      variacoes: [
        'lawyer explaining fee structure to new client',
        'fee agreement contract being signed',
        'success fee celebration after case won',
        'billing records organized professionally',
        'client appreciating lawyers work value'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO DO TRABALHO
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['trabalhista', 'trabalho', 'clt', 'empregado'], 
    contexto: {
      cena: 'Worker signing employment contract, rights being established',
      elementos: 'employment contract, worker with hard hat, HR representative, workplace safety',
      atmosfera: 'workers rights, employment, protection, dignity',
      variacoes: [
        'worker receiving first job contract happily',
        'labor union protecting workers rights',
        'safe workplace with proper equipment',
        'employee reviewing rights in CLT booklet',
        'labor court hearing worker complaint'
      ]
    }
  },
  { 
    keywords: ['demissão', 'rescisão', 'dispensa'], 
    contexto: {
      cena: 'Employment termination process, workers rights being verified',
      elementos: 'termination documents, HR office, severance calculation, worker receiving dues',
      atmosfera: 'transition, rights protection, closure',
      variacoes: [
        'worker reviewing termination payment calculation',
        'labor lawyer verifying all dues paid',
        'unemployment insurance application process',
        'worker signing termination with witnesses',
        'labor court ensuring fair severance payment'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO TRIBUTÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['tributo', 'imposto', 'tributário', 'fiscal'], 
    contexto: {
      cena: 'Tax calculation being performed, government revenue collection',
      elementos: 'tax forms, calculator, tax payment receipt, government seal',
      atmosfera: 'obligation, citizenship, public finance',
      variacoes: [
        'accountant calculating complex tax obligations',
        'citizen filing annual tax return',
        'tax audit documents being reviewed',
        'tax refund check being received',
        'tax lawyer defending client in audit'
      ]
    }
  },
  { 
    keywords: ['execução fiscal', 'dívida ativa', 'cobrança fiscal'], 
    contexto: {
      cena: 'Government collecting tax debt, fiscal execution proceedings',
      elementos: 'tax debt notice, government collection, property attachment threat, negotiation',
      atmosfera: 'collection pressure, debt resolution, government authority',
      variacoes: [
        'tax debt notification arriving by mail',
        'taxpayer negotiating payment plan with government',
        'fiscal execution blocking bank accounts',
        'tax lawyer challenging fiscal execution',
        'debt being settled with government discount'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO ADMINISTRATIVO
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['licitação', 'concorrência', 'contratação pública'], 
    contexto: {
      cena: 'Public bidding process, companies competing for government contract',
      elementos: 'sealed bid envelopes, bidding committee, transparency, competition',
      atmosfera: 'fair competition, public interest, transparency',
      variacoes: [
        'companies submitting sealed bids to committee',
        'public bid opening ceremony with witnesses',
        'government contract being signed after bidding',
        'bid evaluation committee analyzing proposals',
        'winning company celebrating government contract'
      ]
    }
  },
  { 
    keywords: ['servidor público', 'concurso público', 'funcionalismo'], 
    contexto: {
      cena: 'Public service entrance exam, citizens competing for government jobs',
      elementos: 'exam room, candidates focused, government building, public career',
      atmosfera: 'meritocracy, public service, career opportunity',
      variacoes: [
        'candidates taking public service exam seriously',
        'public servant being sworn into office',
        'career progression in government service',
        'public employee serving citizens at counter',
        'retirement ceremony for long-serving official'
      ]
    }
  },
  { 
    keywords: ['ato administrativo', 'poder de polícia'], 
    contexto: {
      cena: 'Government official exercising administrative power, public authority',
      elementos: 'official document being signed, government seal, administrative order, authority',
      atmosfera: 'governmental power, public authority, administration',
      variacoes: [
        'mayor signing administrative decree',
        'inspector conducting compliance inspection',
        'licensing authority reviewing permit application',
        'administrative hearing in government office',
        'public authority enforcing regulations'
      ]
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO CIVIL - CONTRATOS E OBRIGAÇÕES
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['contrato', 'obrigação', 'acordo'], 
    contexto: {
      cena: 'Business contract being signed, parties reaching agreement',
      elementos: 'contract document, handshake, signatures, witnesses, celebration',
      atmosfera: 'agreement, partnership, legal binding, business deal',
      variacoes: [
        'executives signing major business contract',
        'lawyer reviewing contract terms carefully',
        'digital contract signature on tablet',
        'contract negotiation meeting in conference room',
        'parties celebrating successful agreement'
      ]
    }
  },
  { 
    keywords: ['responsabilidade civil', 'dano', 'indenização'], 
    contexto: {
      cena: 'Damage compensation case, victim receiving justice for harm suffered',
      elementos: 'evidence of damage, compensation check, lawyer advocating, justice served',
      atmosfera: 'compensation, justice, repair of harm',
      variacoes: [
        'victim receiving compensation for damages',
        'lawyer presenting damage evidence in court',
        'insurance paying out injury claim',
        'calculation of moral damages amount',
        'parties settling damage dispute amicably'
      ]
    }
  },
  { 
    keywords: ['família', 'casamento', 'divórcio', 'guarda'], 
    contexto: {
      cena: 'Family law proceedings, parents and children in emotional hearing',
      elementos: 'family court, parents, child welfare, mediation, emotional moment',
      atmosfera: 'family, emotion, best interest of child, resolution',
      variacoes: [
        'couple signing divorce papers with lawyers',
        'mediation session for custody arrangement',
        'child custody visitation schedule discussion',
        'wedding ceremony with legal officiant',
        'family reunification after court resolution'
      ]
    }
  },
  { 
    keywords: ['propriedade', 'posse', 'usucapião', 'imóvel'], 
    contexto: {
      cena: 'Property ownership dispute, land rights being established',
      elementos: 'property deed, land survey, ownership documents, real estate',
      atmosfera: 'ownership, rights over property, territorial claim',
      variacoes: [
        'surveyor measuring property boundaries',
        'deed being registered at notary office',
        'long-term possessor claiming usucapião rights',
        'property title search in registry office',
        'owner receiving definitive property title'
      ]
    }
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

function encontrarContextoVisual(titulo: string): ContextoVisual {
  const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // 1. Busca exata por keywords
  for (const mapa of mapaTemasOAB) {
    for (const keyword of mapa.keywords) {
      const keywordNorm = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (tituloLower.includes(keywordNorm)) {
        console.log(`[contexto] Match exato: "${keyword}" para "${titulo}"`);
        return mapa.contexto;
      }
    }
  }
  
  // 2. Busca por palavras individuais
  const palavrasTitulo = tituloLower.split(/\s+/).filter(p => p.length > 3);
  for (const palavra of palavrasTitulo) {
    for (const mapa of mapaTemasOAB) {
      for (const keyword of mapa.keywords) {
        const keywordNorm = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (keywordNorm.includes(palavra) || palavra.includes(keywordNorm.split(' ')[0])) {
          console.log(`[contexto] Match parcial: "${keyword}" para "${palavra}"`);
          return mapa.contexto;
        }
      }
    }
  }
  
  // 3. Fallback inteligente baseado no título
  console.log(`[contexto] Usando fallback para: "${titulo}"`);
  return gerarFallbackInteligente(titulo);
}

function gerarFallbackInteligente(titulo: string): ContextoVisual {
  const tituloLower = titulo.toLowerCase();
  
  if (tituloLower.includes('processo') || tituloLower.includes('procedimento')) {
    return {
      cena: 'Busy Brazilian courthouse corridor with lawyers walking, files in hand',
      elementos: 'lawyers in robes, court clerks, case files, wooden doors, marble floors',
      atmosfera: 'professional bustle, legal proceedings, institutional',
      variacoes: [
        'lawyer rushing to hearing with documents',
        'court clerk organizing case files at desk',
        'judge entering courtroom dramatically',
        'waiting room full of litigants',
        'legal conference room meeting'
      ]
    };
  }
  
  if (tituloLower.includes('direito') || tituloLower.includes('garantia')) {
    return {
      cena: 'Statue of justice with scales and sword in grand Brazilian courthouse',
      elementos: 'Lady Justice statue, balanced scales, impressive architecture, sunlight',
      atmosfera: 'majesty of law, fundamental rights, protection',
      variacoes: [
        'constitution book opening with light',
        'citizen exercising their rights proudly',
        'lawyer defending rights passionately',
        'scales of justice perfectly balanced',
        'sunrise over courthouse symbolizing new rights'
      ]
    };
  }
  
  // Fallback genérico
  return {
    cena: `Brazilian legal scene representing the concept of "${titulo}"`,
    elementos: 'law books, legal professionals, courtroom elements, justice symbols',
    atmosfera: 'professional legal environment, education, knowledge',
    variacoes: [
      'law library with student studying',
      'moot court practice session',
      'legal conference presentation',
      'lawyer mentoring young associate',
      'graduation ceremony for law students'
    ]
  };
}

function gerarPromptCompleto(titulo: string, area: string, contexto: ContextoVisual, variacao: string, paleta: any): string {
  return `⛔ MANDATORY: ABSOLUTELY NO TEXT IN IMAGE ⛔

Generate a purely visual scene. DO NOT include:
- Any letters, words, or typography
- Book titles, labels, signs, or banners
- Numbers, dates, or codes
- Any readable content whatsoever

If any document, book, sign or paper appears in scene, it MUST be:
- Completely blank (white/cream colored)
- Blurred beyond recognition
- Shown from angle where text is not visible

---

Create a CINEMATIC PHOTOREALISTIC SCENE in 16:9 horizontal format.

SUBJECT: Visual representation of "${titulo}"
LEGAL AREA: ${area || 'Direito'}

SCENE DESCRIPTION:
${variacao}

KEY VISUAL ELEMENTS (no text on any of them):
${contexto.elementos}

MOOD/ATMOSPHERE:
${contexto.atmosfera}

VISUAL STYLE:
- Photorealistic cinematic quality (like movie still)
- Dramatic lighting with strong directional source
- Rich details in textures, clothing, architecture
- Magazine editorial quality
- Movie poster aesthetic

COLOR GRADING (apply throughout):
${paleta.descricao}
Main tones: ${paleta.corPrincipal}, ${paleta.corSecundaria}, ${paleta.corDestaque}

TECHNICAL SPECS:
- 16:9 widescreen landscape format
- Sharp focus on main subject
- Cinematic depth of field
- Professional photography quality

CRITICAL REMINDERS:
✓ Books shown = blank covers only
✓ Documents shown = blank pages only  
✓ Signs shown = blank or illegible
✓ No watermarks, no labels, no typography
✓ PURE VISUAL STORYTELLING - let the image speak without words`;
}

async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array<ArrayBuffer>> {
  console.log(`[compressao] Comprimindo ${imageBytes.length} bytes...`);
  
  const buffer = new ArrayBuffer(imageBytes.length);
  const view = new Uint8Array(buffer);
  view.set(imageBytes);
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/octet-stream'
    },
    body: buffer
  });

  if (!shrinkResponse.ok) {
    console.log(`[compressao] TinyPNG erro ${shrinkResponse.status}, retornando original`);
    return view;
  }

  const result = await shrinkResponse.json();
  const outputUrl = result.output?.url;
  if (!outputUrl) {
    console.log('[compressao] Sem URL de output, retornando original');
    return view;
  }

  // Converter para WebP
  const convertResponse = await fetch(outputUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ convert: { type: 'image/webp' }, resize: { method: 'fit', width: 1280, height: 720 } })
  });

  if (!convertResponse.ok) {
    const pngResponse = await fetch(outputUrl);
    const pngBuffer = await pngResponse.arrayBuffer();
    return new Uint8Array(pngBuffer);
  }

  const webpBuffer = await convertResponse.arrayBuffer();
  const webpBytes = new Uint8Array(webpBuffer);
  console.log(`[compressao] WebP: ${imageBytes.length} -> ${webpBytes.length} bytes (${Math.round((1 - webpBytes.length / imageBytes.length) * 100)}% menor)`);
  return webpBytes;
}

async function gerarImagemComGemini(prompt: string, apiKey: string, keyName: string): Promise<string> {
  console.log(`[gerar-capa-oab-tema] Tentando ${keyName}...`);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["image", "text"], responseMimeType: "text/plain" }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GEMINI_ERROR_${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      console.log(`[gerar-capa-oab-tema] ✅ ${keyName} sucesso!`);
      return part.inlineData.data;
    }
  }
  throw new Error('Imagem não gerada pela IA');
}

async function gerarImagemComFallback(prompt: string): Promise<string> {
  const keys = [
    { key: Deno.env.get('GEMINI_KEY_1'), name: 'GEMINI_KEY_1' },
    { key: Deno.env.get('GEMINI_KEY_2'), name: 'GEMINI_KEY_2' },
    { key: Deno.env.get('GEMINI_KEY_3'), name: 'GEMINI_KEY_3' },
  ].filter(k => k.key);

  if (keys.length === 0) throw new Error('Nenhuma GEMINI_KEY configurada');

  let lastError: Error | null = null;
  
  for (const { key, name } of keys) {
    try {
      return await gerarImagemComGemini(prompt, key!, name);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`[gerar-capa-oab-tema] ❌ ${name} falhou: ${msg.substring(0, 100)}`);
      lastError = error instanceof Error ? error : new Error(msg);
      
      if (!msg.includes('429') && !msg.includes('RESOURCE_EXHAUSTED') && !msg.includes('quota')) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Todas as chaves falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materia_id, materia_titulo, area_nome } = await req.json();

    if (!materia_id || !materia_titulo) {
      return new Response(
        JSON.stringify({ error: 'materia_id e materia_titulo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gerar-capa-oab-tema] Gerando capa temática para: "${materia_titulo}" (Área: ${area_nome || 'default'})`);

    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe capa versão 2 para esta matéria
    const { data: existingCapa } = await supabase
      .from('oab_trilhas_topicos')
      .select('capa_url')
      .eq('materia_id', materia_id)
      .eq('capa_versao', 2)
      .not('capa_url', 'is', null)
      .limit(1)
      .single();

    if (existingCapa?.capa_url) {
      console.log(`[gerar-capa-oab-tema] ✓ Cache v2: reutilizando capa existente`);
      return new Response(
        JSON.stringify({ success: true, cached: true, capa_url: existingCapa.capa_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paleta = paletasPorArea[area_nome] || paletasPorArea['default'];
    const contexto = encontrarContextoVisual(materia_titulo);
    
    // Selecionar uma variação aleatória
    const variacaoIndex = Math.floor(Math.random() * contexto.variacoes.length);
    const variacao = contexto.variacoes[variacaoIndex];
    
    console.log(`[gerar-capa-oab-tema] Contexto encontrado para: "${materia_titulo}"`);
    console.log(`[gerar-capa-oab-tema] Variação: ${variacao.substring(0, 60)}...`);

    const promptImagem = gerarPromptCompleto(materia_titulo, area_nome, contexto, variacao, paleta);
    const imageBase64 = await gerarImagemComFallback(promptImagem);

    // Converter base64 para Uint8Array
    const binaryString = atob(imageBase64);
    let bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`[gerar-capa-oab-tema] Imagem gerada: ${bytes.length} bytes`);

    // Comprimir e converter para WebP
    if (TINYPNG_API_KEY) {
      bytes = await comprimirParaWebP(bytes, TINYPNG_API_KEY);
    }

    // Upload para Supabase Storage como WebP
    const timestamp = Date.now();
    const path = `oab-trilhas/materias/${materia_id}_${timestamp}.webp`;
    
    const { error: uploadError } = await supabase.storage
      .from('imagens')
      .upload(path, bytes, { contentType: 'image/webp', upsert: true });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(path);
    const capaUrl = urlData.publicUrl;

    console.log(`[gerar-capa-oab-tema] ✓ Capa WebP gerada: ${capaUrl}`);

    // Aplicar capa a TODOS os tópicos desta matéria e marcar como versão 2
    const { data: updated, error: updateError } = await supabase
      .from('oab_trilhas_topicos')
      .update({ capa_url: capaUrl, capa_versao: 2 })
      .eq('materia_id', materia_id)
      .select('id');

    if (updateError) {
      console.error('[gerar-capa-oab-tema] Erro ao atualizar tópicos:', updateError);
    } else {
      console.log(`[gerar-capa-oab-tema] ✓ Capa aplicada a ${updated?.length || 0} aulas da matéria`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        capa_url: capaUrl, 
        aulas_atualizadas: updated?.length || 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-capa-oab-tema] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
