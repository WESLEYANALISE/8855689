import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Paleta de cores por área de direito
const paletasPorArea: Record<string, { corPrincipal: string; corSecundaria: string; corDestaque: string; descricao: string }> = {
  'Direito Penal': { corPrincipal: '#8B0000', corSecundaria: '#1a1a1a', corDestaque: '#D4AF37', descricao: 'deep crimson red, black shadows, golden accents' },
  'Direito Civil': { corPrincipal: '#1E3A5F', corSecundaria: '#F5F5F5', corDestaque: '#C0C0C0', descricao: 'navy blue, clean white, silver tones' },
  'Direito Constitucional': { corPrincipal: '#006400', corSecundaria: '#FFD700', corDestaque: '#00308F', descricao: 'deep green, golden yellow, patriotic blue' },
  'Direito Tributário': { corPrincipal: '#228B22', corSecundaria: '#D4AF37', corDestaque: '#CD7F32', descricao: 'forest green, gold, bronze money tones' },
  'Direito do Trabalho': { corPrincipal: '#CC5500', corSecundaria: '#1E3A5F', corDestaque: '#8B4513', descricao: 'burnt orange, industrial blue, earthy brown' },
  'Direito Trabalhista': { corPrincipal: '#CC5500', corSecundaria: '#1E3A5F', corDestaque: '#8B4513', descricao: 'burnt orange, industrial blue, earthy brown' },
  'Direito Administrativo': { corPrincipal: '#663399', corSecundaria: '#808080', corDestaque: '#FFFFFF', descricao: 'royal purple, institutional gray, white' },
  'Direito Empresarial': { corPrincipal: '#0047AB', corSecundaria: '#D4AF37', corDestaque: '#36454F', descricao: 'corporate blue, gold, charcoal' },
  'Direito Processual Civil': { corPrincipal: '#4682B4', corSecundaria: '#FFFFFF', corDestaque: '#C0C0C0', descricao: 'steel blue, white, silver' },
  'Direito Processual Penal': { corPrincipal: '#800020', corSecundaria: '#696969', corDestaque: '#1a1a1a', descricao: 'burgundy red, dark gray, black' },
  'Direito Ambiental': { corPrincipal: '#228B22', corSecundaria: '#8B4513', corDestaque: '#87CEEB', descricao: 'forest green, earth brown, sky blue' },
  'Direito Internacional': { corPrincipal: '#0047AB', corSecundaria: '#FFFFFF', corDestaque: '#D4AF37', descricao: 'royal blue, white, gold diplomatic' },
  'Direito Eleitoral': { corPrincipal: '#002868', corSecundaria: '#BF0A30', corDestaque: '#FFFFFF', descricao: 'patriotic blue, red, white' },
  'Direito Previdenciário': { corPrincipal: '#FF8C00', corSecundaria: '#FFFDD0', corDestaque: '#8B4513', descricao: 'warm orange, cream, brown' },
  'Direito Digital': { corPrincipal: '#00CED1', corSecundaria: '#4B0082', corDestaque: '#00BFFF', descricao: 'electric cyan, deep purple, neon blue' },
  'Filosofia do Direito': { corPrincipal: '#4B0082', corSecundaria: '#D4AF37', corDestaque: '#FFFDD0', descricao: 'deep indigo, gold, cream' },
  'Ética': { corPrincipal: '#4B0082', corSecundaria: '#D4AF37', corDestaque: '#FFFFFF', descricao: 'deep purple, gold, white' },
  'default': { corPrincipal: '#1E3A5F', corSecundaria: '#D4AF37', corDestaque: '#FFFFFF', descricao: 'navy blue, gold, white' }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAPEAMENTO COMPLETO: Cenas semi-realistas detalhadas para cada tema
// ═══════════════════════════════════════════════════════════════════════════════
interface ContextoVisual {
  cena: string;           // Cena completa semi-realista
  elementos: string;      // Elementos e pessoas na cena
  atmosfera: string;      // Clima/tom emocional
  variacoes: string[];    // 5 variações para gerar
}

const mapaIconesJuridicos: { keywords: string[]; contexto: ContextoVisual }[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PRISÕES E LIBERDADE
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['prisão preventiva'], 
    contexto: {
      cena: 'inside a Brazilian police station, officer handcuffing a suspect, legal documents on desk',
      elementos: 'police officer in uniform, handcuffs being applied, wanted poster on wall, desk with case files',
      atmosfera: 'tense, urgent, institutional lighting',
      variacoes: [
        'suspect being escorted down police corridor by two officers',
        'judge signing arrest warrant with gavel nearby',
        'lawyer visiting client through prison glass partition',
        'police car with suspect in backseat, city night lights',
        'courtroom moment with defendant standing as judge speaks'
      ]
    }
  },
  { 
    keywords: ['prisão em flagrante', 'flagrante'], 
    contexto: {
      cena: 'dramatic arrest scene on Brazilian street at night, police lights flashing',
      elementos: 'police officers with flashlights, suspect against wall, police car with lights, radio communication',
      atmosfera: 'dramatic action, red and blue lights, night scene',
      variacoes: [
        'police raid on building entrance, tactical team positioning',
        'criminal caught running, officer in pursuit',
        'suspect surrender with hands up under police spotlight',
        'evidence bag being sealed at crime scene',
        'police bodycam perspective of arrest moment'
      ]
    }
  },
  { 
    keywords: ['prisão temporária'], 
    contexto: {
      cena: 'temporary detention cell in police station, calendar on wall with crossed days',
      elementos: 'holding cell bars, clock on wall, detainee waiting, guard patrolling',
      atmosfera: 'waiting, temporary confinement, institutional',
      variacoes: [
        'countdown calendar in detention room, days marked',
        'lawyer reviewing temporary detention papers',
        'suspect in interview room with timer visible',
        'police station corridor with cells, time passing',
        'judge reviewing deadline extension request'
      ]
    }
  },
  { 
    keywords: ['liberdade provisória'], 
    contexto: {
      cena: 'person walking out of prison gates into sunlight, family waiting outside',
      elementos: 'prison gates opening, sunlight streaming, person in civilian clothes, relieved expression',
      atmosfera: 'hope, relief, emotional reunion, dawn light',
      variacoes: [
        'man hugging wife outside courthouse after release',
        'signing release papers at prison office desk',
        'walking through metal detector at prison exit',
        'lawyer shaking hands with freed client',
        'sunset silhouette of person leaving detention center'
      ]
    }
  },
  { 
    keywords: ['habeas corpus'], 
    contexto: {
      cena: 'lawyer holding constitutional document in courtroom, dramatic lighting on paper',
      elementos: 'official document with seal, lawyer in robes, judge listening, defendant hopeful',
      atmosfera: 'constitutional protection, dramatic importance, legal ceremony',
      variacoes: [
        'Supreme Court session reviewing habeas corpus petition',
        'lawyer delivering passionate habeas corpus argument',
        'ancient legal books with modern courtroom in background',
        'prison gates opening with habeas corpus document prominent',
        'family celebrating outside court after successful habeas corpus'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRIMES CONTRA A PESSOA
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['homicídio', 'assassinato', 'morte'], 
    contexto: {
      cena: 'crime scene investigation with forensic team, yellow tape, evidence markers',
      elementos: 'forensic investigators in white suits, evidence markers, police photographer, detective taking notes',
      atmosfera: 'somber, investigative, professional gravity',
      variacoes: [
        'detective examining evidence under magnifying glass',
        'forensic team collecting samples at night scene',
        'murder board in police station with victim photos and connections',
        'coroner examining evidence in laboratory',
        'witness being interviewed by detectives'
      ]
    }
  },
  { 
    keywords: ['lesão corporal', 'agressão física'], 
    contexto: {
      cena: 'emergency room with assault victim being treated, police officer taking statement',
      elementos: 'hospital bed, medical staff, police notepad, visible injuries being documented',
      atmosfera: 'urgent medical care, documentation, consequences of violence',
      variacoes: [
        'forensic photographer documenting injuries',
        'victim giving statement to police at hospital',
        'medical report being written with X-ray in background',
        'restraining order document with bruise photos',
        'courtroom showing injury photos as evidence'
      ]
    }
  },
  { 
    keywords: ['ameaça'], 
    contexto: {
      cena: 'person receiving threatening message on phone, dark room, fear on face',
      elementos: 'smartphone with threatening text visible, scared expression, shadows, tension',
      atmosfera: 'fear, intimidation, psychological threat',
      variacoes: [
        'anonymous threatening letter on table, hands trembling',
        'person looking over shoulder at shadowy figure',
        'recording threatening voicemail as evidence',
        'police reviewing threatening messages on phone',
        'victim filing police report about threats'
      ]
    }
  },
  { 
    keywords: ['sequestro', 'cárcere privado'], 
    contexto: {
      cena: 'rescue operation, police tactical team entering building, hostage situation',
      elementos: 'SWAT team, barricaded door, hostage being protected, negotiator',
      atmosfera: 'high tension, rescue mission, dramatic action',
      variacoes: [
        'ransom note with cut-out letters, family photo nearby',
        'police negotiator on phone with kidnapper',
        'victim reunited with family after rescue',
        'surveillance van monitoring kidnapper location',
        'courtroom with kidnapper in handcuffs facing judge'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRIMES CONTRA O PATRIMÔNIO
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['roubo'], 
    contexto: {
      cena: 'masked robber confronting victim in dark alley, threatening gesture',
      elementos: 'masked criminal, victim with hands up, wallet/phone being taken, urban alley',
      atmosfera: 'dangerous, threatening, night crime',
      variacoes: [
        'security camera footage of robbery in progress',
        'bank robbery with masked criminals and hostages',
        'police lineup with robbery suspects',
        'victim describing robber to police sketch artist',
        'recovered stolen items in evidence room'
      ]
    }
  },
  { 
    keywords: ['furto'], 
    contexto: {
      cena: 'thief silently picking lock at night, gloved hands, stealth',
      elementos: 'lockpicks, gloved hands, silent movement, moonlight, valuable items visible',
      atmosfera: 'stealth, silence, night crime, subtlety',
      variacoes: [
        'shoplifter concealing item in bag, security watching',
        'pickpocket in crowded market, hand in pocket',
        'burglar climbing through window at night',
        'stolen goods laid out in police evidence room',
        'fingerprint being dusted on burglarized safe'
      ]
    }
  },
  { 
    keywords: ['estelionato', 'fraude', 'golpe'], 
    contexto: {
      cena: 'con artist in suit presenting fake documents to elderly victim',
      elementos: 'well-dressed fraudster, fake contracts, confused elderly person, money changing hands',
      atmosfera: 'deception, false trust, manipulation',
      variacoes: [
        'computer showing phishing email, someone falling for scam',
        'fake check being examined with magnifying glass',
        'pyramid scheme presentation to victims',
        'police raid on fraudulent call center',
        'victim realizing fraud while looking at bank statement'
      ]
    }
  },
  { 
    keywords: ['extorsão'], 
    contexto: {
      cena: 'threatening figure demanding money from businessman, briefcase of cash',
      elementos: 'intimidating person, scared victim, money envelope, threatening gesture',
      atmosfera: 'coercion, fear, criminal pressure',
      variacoes: [
        'blackmail note with compromising photos threat',
        'business owner being threatened by criminals',
        'wire transfer under duress, gun implied',
        'police surveillance of extortion payment',
        'criminal counting extortion money'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRIMES CONTRA ADMINISTRAÇÃO PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['corrupção'], 
    contexto: {
      cena: 'politician receiving briefcase of money in shadowy office, corrupt deal',
      elementos: 'suit-clad official, briefcase with cash visible, handshake, luxury office',
      atmosfera: 'corruption, secrecy, abuse of power',
      variacoes: [
        'federal police raid on corrupt politicians office',
        'money hidden in walls being discovered',
        'businessman bribing public official in restaurant',
        'politician being arrested live on camera',
        'judge reviewing mountain of corruption evidence'
      ]
    }
  },
  { 
    keywords: ['peculato'], 
    contexto: {
      cena: 'public servant diverting money from government safe, guilty look',
      elementos: 'government office, public funds, official taking money, security cameras',
      atmosfera: 'betrayal of public trust, theft from state',
      variacoes: [
        'audit revealing missing public funds, shocked accountant',
        'public official with expensive car and humble salary',
        'federal police investigating government accounts',
        'court case with evidence of misappropriated funds',
        'former official in orange jumpsuit facing judge'
      ]
    }
  },
  { 
    keywords: ['lavagem de dinheiro'], 
    contexto: {
      cena: 'complex money laundering operation, multiple computer screens, shell company documents',
      elementos: 'financial screens, fake business fronts, international transfers, accountant criminal',
      atmosfera: 'sophisticated crime, hidden wealth, financial web',
      variacoes: [
        'luxury store as front for money laundering',
        'cryptocurrency transaction on dark screen',
        'investigator connecting shell companies on board',
        'seized luxury assets from money laundering case',
        'offshore bank documents being analyzed'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRÁFICO E DROGAS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['tráfico de drogas', 'drogas', 'entorpecentes'], 
    contexto: {
      cena: 'police drug bust, seized packages on table, officers with masks',
      elementos: 'drug packages, precision scale, police in tactical gear, evidence bags',
      atmosfera: 'dangerous operation, criminal underworld, law enforcement victory',
      variacoes: [
        'drug lab being raided by police',
        'drug dealer arrest in favela operation',
        'cocaine being tested by forensic analyst',
        'drug trafficking routes map in police station',
        'helicopter operation over drug territory'
      ]
    }
  },
  { 
    keywords: ['organização criminosa', 'facção', 'milícia'], 
    contexto: {
      cena: 'criminal organization meeting, hierarchy visible, gang symbols',
      elementos: 'multiple criminals, weapons, territory maps, gang leader, loyalty symbols',
      atmosfera: 'organized crime power, hierarchy, territorial control',
      variacoes: [
        'police operation chart showing criminal network',
        'gang members being arrested in coordinated raid',
        'wiretap room monitoring organized crime calls',
        'seized weapons cache from criminal organization',
        'witness protection program relocation scene'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCEDIMENTOS PROCESSUAIS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['inquérito', 'investigação policial'], 
    contexto: {
      cena: 'detective office with investigation board, photos connected by strings',
      elementos: 'murder board, detective with magnifying glass, evidence files, coffee cups',
      atmosfera: 'investigative intensity, puzzle solving, dedication',
      variacoes: [
        'forensic lab analysis under blue light',
        'detective interviewing witness in station',
        'evidence collection at crime scene',
        'police database search on computer',
        'investigation files spread on desk, working late'
      ]
    }
  },
  { 
    keywords: ['denúncia'], 
    contexto: {
      cena: 'prosecutor standing in court presenting charges, confident posture',
      elementos: 'prosecutor in robes, accusation documents, courtroom gallery, defendant watching',
      atmosfera: 'formal accusation, prosecutorial power, beginning of trial',
      variacoes: [
        'prosecutor organizing case files at desk',
        'press conference announcing major charges',
        'typing formal accusation on computer',
        'delivering charges to defense counsel',
        'defendant hearing charges for first time'
      ]
    }
  },
  { 
    keywords: ['audiência', 'oitiva'], 
    contexto: {
      cena: 'Brazilian courtroom in session, witness at stand, all parties present',
      elementos: 'judge at bench, witness being questioned, lawyers at tables, recorder typing',
      atmosfera: 'formal procedure, truth-seeking, legal ceremony',
      variacoes: [
        'witness taking oath with hand on Bible',
        'lawyer cross-examining witness intensely',
        'defendant giving testimony at stand',
        'judge taking notes during testimony',
        'family watching trial from gallery seats'
      ]
    }
  },
  { 
    keywords: ['sentença', 'condenação', 'absolvição'], 
    contexto: {
      cena: 'judge delivering verdict, gavel falling, moment of judgment',
      elementos: 'judge reading sentence, defendant standing, lawyers reacting, gavel impact',
      atmosfera: 'climactic moment, justice served, emotional reactions',
      variacoes: [
        'defendant crying after guilty verdict',
        'celebration after acquittal, family hugging',
        'judge writing lengthy sentence reasoning',
        'media outside court after major verdict',
        'prisoner being led away after sentencing'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RECURSOS E INSTÂNCIAS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['apelação', 'recurso'], 
    contexto: {
      cena: 'lawyer presenting appeal to higher court, stack of legal documents',
      elementos: 'appeals court chamber, lawyer arguing, multiple judges listening, thick case files',
      atmosfera: 'second chance, legal argumentation, higher stakes',
      variacoes: [
        'lawyer reviewing appeal grounds at office',
        'superior court facade, majestic building',
        'judges deliberating in private chamber',
        'courier delivering appeal documents to court',
        'client anxiously awaiting appeal decision'
      ]
    }
  },
  { 
    keywords: ['execução penal', 'cumprimento de pena'], 
    contexto: {
      cena: 'prison daily life, inmates in yard, guard tower, routine',
      elementos: 'prison yard, inmates, guard tower, cell blocks, rehabilitation programs',
      atmosfera: 'serving time, rehabilitation, institutional life',
      variacoes: [
        'prisoner in cell reading law books',
        'parole hearing with prisoner and board',
        'prison work program, inmates learning skills',
        'family visitation day at prison',
        'prisoner release day, gate opening'
      ]
    }
  },
  { 
    keywords: ['prescrição'], 
    contexto: {
      cena: 'old case files covered in dust, clock showing passage of time',
      elementos: 'yellowed documents, cobwebs, old clock, closed case stamp',
      atmosfera: 'time passed, expired justice, statute of limitations',
      variacoes: [
        'lawyer calculating prescription deadline frantically',
        'judge dismissing case due to prescription',
        'old crime file being closed and archived',
        'calendar pages flying showing years passing',
        'frustrated prosecutor as prescription expires'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVAS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['prova', 'provas', 'evidência'], 
    contexto: {
      cena: 'forensic lab with evidence being analyzed, scientific equipment',
      elementos: 'DNA analysis, fingerprint comparison, forensic microscope, evidence bags',
      atmosfera: 'scientific precision, truth discovery, technical expertise',
      variacoes: [
        'CSI collecting evidence at crime scene',
        'ballistics expert examining bullet',
        'digital forensics recovering deleted files',
        'evidence presentation in courtroom',
        'chain of custody documentation'
      ]
    }
  },
  { 
    keywords: ['testemunha', 'testemunho'], 
    contexto: {
      cena: 'witness giving emotional testimony in court, all eyes watching',
      elementos: 'witness at stand, tearful or determined expression, microphone, gallery watching',
      atmosfera: 'truth telling, courage, pivotal moment',
      variacoes: [
        'witness pointing at defendant in identification',
        'protected witness with obscured face',
        'child witness with support person',
        'expert witness explaining technical evidence',
        'witness under intense cross-examination'
      ]
    }
  },
  { 
    keywords: ['perícia', 'perito', 'laudo'], 
    contexto: {
      cena: 'forensic expert working in modern laboratory, analyzing evidence',
      elementos: 'lab coat, scientific instruments, computer analysis, detailed report writing',
      atmosfera: 'technical expertise, scientific method, professional analysis',
      variacoes: [
        'medical examiner conducting autopsy',
        'document examiner detecting forgery',
        'accident reconstruction expert at scene',
        'psychiatric evaluation of defendant',
        'expert presenting findings to court'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SUJEITOS PROCESSUAIS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['advogado', 'defensor', 'defesa'], 
    contexto: {
      cena: 'defense lawyer in Brazilian courtroom, passionate defense speech',
      elementos: 'lawyer in robes, defending client, legal books, persuasive gesture',
      atmosfera: 'advocacy, protection of rights, eloquent defense',
      variacoes: [
        'lawyer meeting client in prison visitation',
        'public defender overwhelmed with case files',
        'defense team strategizing before trial',
        'lawyer dramatically objecting in court',
        'new lawyer receiving OAB credentials'
      ]
    }
  },
  { 
    keywords: ['promotor', 'ministério público', 'acusação'], 
    contexto: {
      cena: 'prosecutor delivering powerful accusation in court, pointing at defendant',
      elementos: 'prosecutor at podium, accusatory gesture, evidence displays, intense expression',
      atmosfera: 'pursuit of justice, state power, accusatory force',
      variacoes: [
        'prosecutor reviewing evidence before trial',
        'press conference announcing major case',
        'prosecutor team discussing strategy',
        'closing arguments with dramatic delivery',
        'prosecutor questioning hostile witness'
      ]
    }
  },
  { 
    keywords: ['juiz', 'magistrado'], 
    contexto: {
      cena: 'judge presiding over courtroom, wearing robes, commanding respect',
      elementos: 'judge at elevated bench, black robes, gavel, scales of justice, courtroom',
      atmosfera: 'authority, impartiality, solemn duty',
      variacoes: [
        'judge writing detailed sentence at desk',
        'judge entering courtroom, all rising',
        'judge deliberating alone in chambers',
        'judge calling order in chaotic courtroom',
        'senior judge mentoring new magistrate'
      ]
    }
  },
  { 
    keywords: ['delegado', 'polícia'], 
    contexto: {
      cena: 'police detective at crime scene directing investigation',
      elementos: 'detective with badge, crime scene tape, forensic team, notepad',
      atmosfera: 'law enforcement authority, investigation leadership',
      variacoes: [
        'detective interrogating suspect in room',
        'police chief at press conference',
        'detective analyzing evidence in office',
        'undercover officer in dangerous situation',
        'police team briefing before operation'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDIDAS CAUTELARES
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['fiança'], 
    contexto: {
      cena: 'family paying bail at courthouse, money and documents being processed',
      elementos: 'cashier window, money counting, bail documents, relieved family, defendant waiting',
      atmosfera: 'hope, financial sacrifice, freedom purchased',
      variacoes: [
        'lawyer explaining bail conditions to client',
        'judge setting bail amount in hearing',
        'family gathering money for bail payment',
        'defendant signing bail conditions agreement',
        'bail bondsman office transaction'
      ]
    }
  },
  { 
    keywords: ['monitoramento', 'tornozeleira'], 
    contexto: {
      cena: 'electronic ankle monitor being attached to persons leg',
      elementos: 'ankle bracelet device, technician attaching, GPS signal, restricted freedom',
      atmosfera: 'technological control, conditional freedom, surveillance',
      variacoes: [
        'person checking boundaries on phone app',
        'monitoring center with multiple screens',
        'violation alert on monitoring system',
        'daily life with ankle monitor visible',
        'technician explaining monitor rules'
      ]
    }
  },
  { 
    keywords: ['interceptação', 'escuta'], 
    contexto: {
      cena: 'police wiretap operation room, officers with headphones listening',
      elementos: 'multiple monitors, recording equipment, headphones, transcription, surveillance',
      atmosfera: 'covert investigation, listening, evidence gathering',
      variacoes: [
        'judge authorizing wiretap warrant',
        'technician installing listening device',
        'criminal unknowingly being recorded',
        'analysts transcribing intercepted calls',
        'prosecutor using wiretap evidence in court'
      ]
    }
  },
  { 
    keywords: ['busca e apreensão'], 
    contexto: {
      cena: 'police tactical team executing search warrant, entering building',
      elementos: 'police with warrant, door being breached, search in progress, evidence found',
      atmosfera: 'action, authorized intrusion, evidence discovery',
      variacoes: [
        'judge signing search warrant',
        'police finding hidden contraband',
        'digital forensics seizing computers',
        'evidence being catalogued and bagged',
        'suspect watching as home is searched'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEIS ESPECIAIS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['maria da penha', 'violência doméstica'], 
    contexto: {
      cena: 'woman seeking help at police station, female officer providing support',
      elementos: 'protective officer, vulnerable woman, restraining order, support services',
      atmosfera: 'protection, empowerment, breaking free',
      variacoes: [
        'woman breaking chain, empowerment symbol',
        'protective measure being signed by judge',
        'support group for domestic violence survivors',
        'police escorting abuser from home',
        'woman starting new life, sunrise'
      ]
    }
  },
  { 
    keywords: ['crimes hediondos'], 
    contexto: {
      cena: 'maximum security prison, heavily guarded, serious atmosphere',
      elementos: 'high walls, multiple guards, isolated cells, heavy security',
      atmosfera: 'extreme gravity, maximum punishment, no mercy',
      variacoes: [
        'heinous crime trial with heavy security',
        'life sentence being pronounced',
        'segregated dangerous criminals unit',
        'parole denial for heinous crime',
        'victim families facing perpetrator in court'
      ]
    }
  },
  { 
    keywords: ['armas', 'desarmamento', 'porte'], 
    contexto: {
      cena: 'gun control operation, weapons being seized and catalogued',
      elementos: 'confiscated weapons on table, police processing, amnesty campaign',
      atmosfera: 'disarmament, public safety, weapon control',
      variacoes: [
        'illegal gun shop being raided',
        'weapon being destroyed in foundry',
        'gun license being denied by police',
        'ballistics matching weapon to crime',
        'weapons amnesty collection point'
      ]
    }
  },
  { 
    keywords: ['trânsito', 'embriaguez ao volante'], 
    contexto: {
      cena: 'DUI checkpoint at night, driver being tested by police',
      elementos: 'breathalyzer test, police officer, car stopped, flashing lights',
      atmosfera: 'enforcement, consequences, public safety',
      variacoes: [
        'drunk driver accident scene, ambulances',
        'breathalyzer showing high reading',
        'license being confiscated after DUI',
        'victim family at anti-drunk driving campaign',
        'court hearing for vehicular homicide'
      ]
    }
  },
  { 
    keywords: ['menor', 'eca', 'adolescente', 'criança'], 
    contexto: {
      cena: 'child protection services helping vulnerable children, safe environment',
      elementos: 'protective adults, children being helped, safe space, counselor',
      atmosfera: 'protection, care, best interests of child',
      variacoes: [
        'juvenile court with child-friendly setting',
        'adoption finalization happy moment',
        'child being removed from dangerous home',
        'youth rehabilitation center activities',
        'guardian ad litem advocating for child'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPETÊNCIA E JURISDIÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['tribunal do júri', 'júri'], 
    contexto: {
      cena: 'jury trial in Brazilian court, jurors in box, dramatic moment',
      elementos: 'jury of citizens, voting urn, defendant anxious, prosecutor and defense',
      atmosfera: 'popular judgment, civic duty, verdict moment',
      variacoes: [
        'jury foreman reading verdict',
        'lawyers making final arguments to jury',
        'citizens being selected for jury duty',
        'jury deliberation room discussion',
        'defendant reaction to jury verdict'
      ]
    }
  },
  { 
    keywords: ['stf', 'supremo', 'foro privilegiado'], 
    contexto: {
      cena: 'Brazilian Supreme Court in session, eleven justices, grand chamber',
      elementos: 'STF building, justices in robes, constitutional case, national importance',
      atmosfera: 'highest authority, constitutional interpretation, national significance',
      variacoes: [
        'STF facade with Brazilian flag',
        'justice reading historic decision',
        'constitutional crisis being debated',
        'politician being judged by STF',
        'protesters outside STF building'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRINCÍPIOS PROCESSUAIS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['ampla defesa', 'contraditório'], 
    contexto: {
      cena: 'balanced courtroom debate, prosecution and defense equally positioned',
      elementos: 'two equal podiums, lawyers facing each other, fair judge, equal time',
      atmosfera: 'fairness, equal opportunity, adversarial balance',
      variacoes: [
        'defense lawyer receiving all evidence from prosecution',
        'both sides presenting arguments equally',
        'judge ensuring both parties can speak',
        'scales perfectly balanced in courtroom',
        'defendant conferring privately with lawyer'
      ]
    }
  },
  { 
    keywords: ['presunção de inocência'], 
    contexto: {
      cena: 'defendant sitting freely in court, presumed innocent until proven guilty',
      elementos: 'defendant without handcuffs, dignified treatment, fair trial, hope',
      atmosfera: 'dignity, constitutional right, benefit of doubt',
      variacoes: [
        'defendant in civilian clothes not prison uniform',
        'innocent until proven guilty sign in court',
        'person cleared of false accusations celebrating',
        'judge instructing jury about presumption',
        'media being admonished for prejudging defendant'
      ]
    }
  },
  { 
    keywords: ['devido processo legal'], 
    contexto: {
      cena: 'systematic legal process, each step being followed properly',
      elementos: 'procedural checklist, proper forms, timeline being respected, fair process',
      atmosfera: 'order, proper procedure, rights protected',
      variacoes: [
        'lawyer ensuring all deadlines are met',
        'procedural flowchart in law office',
        'judge dismissing improperly obtained evidence',
        'all parties receiving proper notification',
        'constitutional rights being read to defendant'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO CIVIL GERAL
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['contrato', 'contratos', 'acordo', 'negócio'], 
    contexto: {
      cena: 'business people signing important contract, handshake, corporate setting',
      elementos: 'contract document, signatures, business attire, conference room, celebration',
      atmosfera: 'deal making, formal agreement, professional transaction',
      variacoes: [
        'lawyers reviewing contract terms carefully',
        'digital contract being signed on tablet',
        'real estate contract closing ceremony',
        'breach of contract dispute in court',
        'notary authenticating important contract'
      ]
    }
  },
  { 
    keywords: ['família', 'casamento', 'divórcio', 'guarda'], 
    contexto: {
      cena: 'family court hearing, parents and children, emotional proceedings',
      elementos: 'family judge, parents, child with support person, mediation room',
      atmosfera: 'emotional, family dynamics, best interests',
      variacoes: [
        'wedding ceremony with legal officiant',
        'divorce papers being signed with sadness',
        'custody arrangement mediation session',
        'child visiting non-custodial parent',
        'family reunification happy moment'
      ]
    }
  },
  { 
    keywords: ['herança', 'sucessão', 'inventário', 'testamento'], 
    contexto: {
      cena: 'lawyer reading will to gathered family, emotional moment',
      elementos: 'old will document, family gathered, lawyer reading, estate papers',
      atmosfera: 'legacy, family inheritance, bittersweet',
      variacoes: [
        'elderly person writing their will',
        'inventory of estate being catalogued',
        'heirs disputing inheritance in court',
        'notary registering inheritance transfer',
        'family home being divided among heirs'
      ]
    }
  },
  { 
    keywords: ['propriedade', 'posse', 'usucapião'], 
    contexto: {
      cena: 'property boundary dispute, surveyors measuring land',
      elementos: 'property markers, measuring equipment, disputed fence, documents',
      atmosfera: 'territorial claim, property rights, ownership proof',
      variacoes: [
        'deed being registered at notary office',
        'adverse possession case in court',
        'property title search in registry',
        'landlord-tenant dispute mediation',
        'eviction proceedings at property'
      ]
    }
  },
  { 
    keywords: ['responsabilidade civil', 'dano', 'indenização'], 
    contexto: {
      cena: 'car accident scene with insurance adjusters assessing damage',
      elementos: 'damaged vehicles, police report, insurance forms, injury victim',
      atmosfera: 'accident consequences, compensation, liability',
      variacoes: [
        'plaintiff presenting injury evidence in court',
        'calculator adding up compensation amounts',
        'doctor testifying about permanent injury',
        'insurance check being handed to victim',
        'negligence case closing arguments'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO DO TRABALHO
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['trabalho', 'trabalhador', 'empregado', 'clt'], 
    contexto: {
      cena: 'worker being hired, signing employment contract, HR office',
      elementos: 'work contract, employee with hard hat, HR manager, workplace',
      atmosfera: 'employment, worker rights, dignity of labor',
      variacoes: [
        'construction workers on job site',
        'factory floor with workers in uniforms',
        'office employee at desk working',
        'worker receiving first paycheck happily',
        'labor union meeting with members'
      ]
    }
  },
  { 
    keywords: ['demissão', 'rescisão', 'justa causa'], 
    contexto: {
      cena: 'employee receiving termination notice, HR meeting, emotional',
      elementos: 'termination letter, box of belongings, HR representative, exit interview',
      atmosfera: 'ending employment, transition, rights verification',
      variacoes: [
        'worker clearing desk after layoff',
        'labor court hearing for unfair dismissal',
        'calculating severance pay on computer',
        'union representative supporting fired worker',
        'unemployment office line'
      ]
    }
  },
  { 
    keywords: ['acidente de trabalho', 'segurança'], 
    contexto: {
      cena: 'workplace accident scene, injured worker, safety violation evidence',
      elementos: 'injured worker, safety equipment, ambulance, accident investigation',
      atmosfera: 'workplace safety, injury, compensation claim',
      variacoes: [
        'safety inspector examining workplace',
        'worker with protective equipment properly worn',
        'physical therapy rehabilitation from work injury',
        'workers compensation claim being filed',
        'safety training session in progress'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DIREITO TRIBUTÁRIO
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['imposto', 'tributo', 'fiscal', 'receita'], 
    contexto: {
      cena: 'tax office with taxpayers filing returns, bureaucracy',
      elementos: 'tax forms, accountant calculating, government building, payment window',
      atmosfera: 'civic duty, complex bureaucracy, financial obligation',
      variacoes: [
        'business owner reviewing tax bills with accountant',
        'tax audit inspection of company books',
        'online tax filing on computer',
        'tax court appeal hearing',
        'tax evasion investigation'
      ]
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRIMES DIGITAIS
  // ═══════════════════════════════════════════════════════════════════════════
  { 
    keywords: ['crime digital', 'cibernético', 'hacker', 'internet'], 
    contexto: {
      cena: 'hacker in dark room with multiple screens, cyber attack in progress',
      elementos: 'multiple monitors, code on screens, hooded figure, matrix-style visuals',
      atmosfera: 'digital threat, modern crime, technology warfare',
      variacoes: [
        'cyber police tracking hacker location',
        'ransomware attack on hospital systems',
        'identity theft operation being dismantled',
        'digital forensics recovering evidence',
        'cyber court proceedings with technical evidence'
      ]
    }
  },
  { 
    keywords: ['calúnia', 'difamação', 'injúria', 'honra'], 
    contexto: {
      cena: 'person devastated by false accusations spreading online',
      elementos: 'social media posts, distressed victim, reputation damage, smartphone',
      atmosfera: 'reputation destruction, public humiliation, fighting back',
      variacoes: [
        'newspaper headline with defamatory content',
        'lawyer filing defamation lawsuit',
        'court ordering content removal',
        'public apology being issued',
        'reputation being rebuilt after vindication'
      ]
    }
  },
];

// Comprimir e converter para WebP usando TinyPNG
async function comprimirParaWebP(imageBytes: Uint8Array, apiKey: string): Promise<Uint8Array> {
  console.log(`[compressao] Comprimindo ${imageBytes.length} bytes e convertendo para WebP...`);
  
  const shrinkResponse = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/octet-stream'
    },
    body: new Blob([new Uint8Array(imageBytes)])
  });

  if (!shrinkResponse.ok) {
    console.error('[compressao] TinyPNG falhou, usando original');
    return imageBytes;
  }

  const result = await shrinkResponse.json();
  if (!result.output?.url) return imageBytes;

  const convertResponse = await fetch(result.output.url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${apiKey}`)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ convert: { type: 'image/webp' } })
  });

  if (!convertResponse.ok) {
    const fallbackResponse = await fetch(result.output.url);
    return new Uint8Array(await fallbackResponse.arrayBuffer());
  }

  const webpBytes = new Uint8Array(await convertResponse.arrayBuffer());
  console.log(`[compressao] WebP: ${imageBytes.length} -> ${webpBytes.length} bytes (${Math.round((1 - webpBytes.length / imageBytes.length) * 100)}% menor)`);
  return webpBytes;
}

// Upload para Supabase Storage
async function uploadParaSupabase(
  supabase: any, bytes: Uint8Array, bucket: string, path: string, contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`);
  
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Erro no upload: ${error.message}`);
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Geração de imagem com Gemini (API direta do Google)
async function gerarImagemComGemini(prompt: string, apiKey: string, keyName: string): Promise<string> {
  console.log(`[gerar-capa-biblioteca] Tentando ${keyName}...`);
  
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
      console.log(`[gerar-capa-biblioteca] ✅ ${keyName} sucesso!`);
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
      console.log(`[gerar-capa-biblioteca] ❌ ${name} falhou: ${msg.substring(0, 100)}`);
      lastError = error instanceof Error ? error : new Error(msg);
      
      // Se não é erro de quota/rate limit, não adianta tentar outra chave
      if (!msg.includes('429') && !msg.includes('RESOURCE_EXHAUSTED') && !msg.includes('quota')) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error('Todas as chaves falharam');
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL: Encontra o contexto visual para o título
// ═══════════════════════════════════════════════════════════════════════════
function encontrarContextoVisual(titulo: string): ContextoVisual {
  const tituloLower = titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // 1. Busca exata por keywords
  for (const mapa of mapaIconesJuridicos) {
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
    for (const mapa of mapaIconesJuridicos) {
      for (const keyword of mapa.keywords) {
        const keywordNorm = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (keywordNorm.includes(palavra) || palavra.includes(keywordNorm.split(' ')[0])) {
          console.log(`[contexto] Match parcial: "${keyword}" para "${palavra}"`);
          return mapa.contexto;
        }
      }
    }
  }
  
  // 3. Fallback inteligente
  console.log(`[contexto] Usando fallback para: "${titulo}"`);
  return gerarFallbackInteligente(titulo);
}

function gerarFallbackInteligente(titulo: string): ContextoVisual {
  const tituloLower = titulo.toLowerCase();
  
  if (tituloLower.includes('processo') || tituloLower.includes('procedimento')) {
    return {
      cena: 'busy courthouse corridor with lawyers walking, files in hand',
      elementos: 'lawyers in robes, court clerks, case files, wooden doors, marble floors',
      atmosfera: 'professional bustle, legal proceedings, institutional',
      variacoes: [
        'lawyer rushing to hearing with documents',
        'court clerk organizing case files',
        'judge entering courtroom dramatically',
        'waiting room full of litigants',
        'legal conference room meeting'
      ]
    };
  }
  
  if (tituloLower.includes('direito') || tituloLower.includes('garantia')) {
    return {
      cena: 'statue of justice with scales and sword, grand courthouse',
      elementos: 'Lady Justice statue, balanced scales, impressive architecture, sunlight',
      atmosfera: 'majesty of law, fundamental rights, protection',
      variacoes: [
        'constitutional law book opening with light',
        'citizen exercising their rights proudly',
        'lawyer defending rights passionately',
        'scales of justice perfectly balanced',
        'sunrise over courthouse symbolizing new rights'
      ]
    };
  }
  
  if (tituloLower.includes('pena') || tituloLower.includes('sanção')) {
    return {
      cena: 'judge delivering sentence in solemn courtroom',
      elementos: 'judge with gavel, defendant standing, serious atmosphere, dark wood',
      atmosfera: 'gravity of punishment, consequences, judicial power',
      variacoes: [
        'gavel coming down in slow motion',
        'prisoner being led away after sentence',
        'scale weighing crime and punishment',
        'prison gates closing behind inmate',
        'rehabilitation program in prison'
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

// Gerar prompt para uma variação específica
function gerarPromptCompleto(titulo: string, area: string, contexto: ContextoVisual, variacao: string, paleta: any): string {
  return `CRITICAL INSTRUCTION - ABSOLUTE TEXT PROHIBITION:
This image MUST contain ZERO text elements. Any image with letters, words, numbers, titles, labels, signs, typography, watermarks, or any written content will be REJECTED. Generate a PURELY VISUAL illustration with NO TEXT WHATSOEVER.

Create a CINEMATIC EDITORIAL ILLUSTRATION in 9:16 vertical format.

VISUAL CONCEPT: "${titulo}"
THEMATIC AREA: ${area || 'Direito'}

SCENE TO ILLUSTRATE:
${variacao}

SCENE ELEMENTS:
${contexto.elementos}

ATMOSPHERE:
${contexto.atmosfera}

VISUAL STYLE REQUIREMENTS:
- Semi-realistic cinematic illustration style
- High detail with visible textures
- Realistic human proportions and expressions
- Dramatic cinematic lighting with strong directional source
- Rich environmental details (objects, clothing, architecture)
- Movie poster aesthetic quality
- Magazine editorial illustration feel

COLOR PALETTE (MANDATORY):
${paleta.descricao}
• Primary: ${paleta.corPrincipal}
• Secondary: ${paleta.corSecundaria}
• Accent: ${paleta.corDestaque}
Apply this color grading throughout the entire composition.

COMPOSITION:
- 9:16 vertical portrait format
- Dynamic, engaging arrangement
- Clear focal point with depth through layering
- Professional premium quality

SCENE DETAILS:
- Realistic fabric textures
- Authentic Brazilian legal settings
- Period-appropriate elements
- Professional attire and equipment
- Environmental storytelling

FINAL CHECK - TEXT PROHIBITION:
- NO text, NO letters, NO words, NO numbers, NO signs, NO labels
- NO typography of any kind
- All signs, documents, or papers in scene must be blank or blurred
- PURELY VISUAL content only`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroId, titulo, area } = await req.json();

    if (!livroId || !titulo) {
      return new Response(
        JSON.stringify({ error: 'livroId e titulo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gerar-capa-biblioteca] Gerando capa para: "${titulo}" (Área: ${area || 'default'})`);

    const TINYPNG_API_KEY = Deno.env.get('TINYPNG_API_KEY');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const paleta = paletasPorArea[area] || paletasPorArea['default'];
    const contexto = encontrarContextoVisual(titulo);
    
    // Selecionar uma variação aleatória
    const variacaoIndex = Math.floor(Math.random() * contexto.variacoes.length);
    const variacao = contexto.variacoes[variacaoIndex];
    
    console.log(`[gerar-capa-biblioteca] Variação escolhida: ${variacao.substring(0, 50)}...`);

    const promptImagem = gerarPromptCompleto(titulo, area, contexto, variacao, paleta);
    const imageBase64 = await gerarImagemComFallback(promptImagem);

    // Converter base64 para Uint8Array
    const binaryString = atob(imageBase64);
    let bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`[gerar-capa-biblioteca] Imagem gerada: ${bytes.length} bytes`);

    // Comprimir e converter para WebP
    if (TINYPNG_API_KEY) {
      bytes = new Uint8Array(await comprimirParaWebP(bytes, TINYPNG_API_KEY));
    }

    // Upload para Supabase Storage como WebP
    const timestamp = Date.now();
    const path = `capas-biblioteca/estudos_${livroId}_${timestamp}.webp`;
    const urlCapa = await uploadParaSupabase(supabase, bytes, 'imagens', path, 'image/webp');

    console.log('[gerar-capa-biblioteca] Capa WebP gerada:', urlCapa);

    // Salvar no banco de dados
    const { error: updateError } = await supabase
      .from('BIBLIOTECA-ESTUDOS')
      .update({ url_capa_gerada: urlCapa })
      .eq('id', livroId);

    if (updateError) console.error('[gerar-capa-biblioteca] Erro ao salvar URL:', updateError);

    return new Response(
      JSON.stringify({ url_capa: urlCapa }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-capa-biblioteca] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
