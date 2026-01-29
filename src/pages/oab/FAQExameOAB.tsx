import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    id: "1",
    question: "Onde posso realizar a minha inscrição para o Exame de Ordem?",
    answer: "As inscrições são realizadas exclusivamente pelo site oficial do Exame de Ordem (examedeordem.oab.org.br). Acesse o site, clique em 'Inscrições' e siga as instruções para criar sua conta e realizar a inscrição no período determinado pelo edital."
  },
  {
    id: "2",
    question: "Página de acompanhamento fora do ar - como proceder?",
    answer: "Em casos de instabilidade no sistema, aguarde alguns minutos e tente novamente. Se o problema persistir, entre em contato com a Central de Atendimento da FGV através do e-mail ou telefone disponibilizados no site do Exame de Ordem. Recomendamos limpar o cache do navegador e tentar em modo anônimo."
  },
  {
    id: "3",
    question: "Estudante do 8º semestre pode fazer o Exame?",
    answer: "Sim! Estudantes regularmente matriculados nos dois últimos semestres do curso de Direito (9º e 10º semestres em cursos de 5 anos, ou 7º e 8º semestres em cursos de 4 anos) podem se inscrever no Exame de Ordem. É necessário apresentar declaração da instituição de ensino comprovando a matrícula."
  },
  {
    id: "4",
    question: "Como solicitar reaproveitamento da 1ª fase?",
    answer: "O reaproveitamento da 1ª fase é válido por até 2 anos (4 edições consecutivas) após a aprovação. No momento da inscrição para a 2ª fase, selecione a opção de reaproveitamento e informe o número do Exame em que foi aprovado na 1ª fase. O sistema verificará automaticamente sua aprovação anterior."
  },
  {
    id: "5",
    question: "Posso fazer prova em estado diferente do meu?",
    answer: "Sim, você pode escolher realizar a prova em qualquer estado brasileiro, independentemente de onde reside ou estuda. A escolha do local de prova é feita no momento da inscrição. Lembre-se que, após confirmada, a cidade de prova não poderá ser alterada."
  },
  {
    id: "6",
    question: "Posso fazer 1ª fase no estado A e 2ª fase no estado B?",
    answer: "Sim, é possível realizar a 1ª e a 2ª fase em estados diferentes. A 2ª fase pode ser realizada em qualquer seccional da OAB, independentemente do local onde foi realizada a 1ª fase. Basta selecionar o estado desejado no momento da inscrição para a 2ª fase."
  },
  {
    id: "7",
    question: "Onde consulto meu local de prova?",
    answer: "O local de prova é divulgado no site do Exame de Ordem alguns dias antes da aplicação. Acesse sua área do candidato com CPF e senha, e consulte a seção 'Local de Prova'. Recomendamos conferir o endereço completo e planejar sua rota com antecedência."
  },
  {
    id: "8",
    question: "Posso solicitar isenção da taxa?",
    answer: "Sim, candidatos em situação de vulnerabilidade socioeconômica podem solicitar isenção da taxa de inscrição. O pedido deve ser feito durante o período de inscrições, mediante comprovação de renda familiar per capita de até meio salário mínimo ou inscrição no CadÚnico. Consulte o edital para documentação necessária."
  },
  {
    id: "9",
    question: "Solicitei isenção mas apareceu boleto - e agora?",
    answer: "Se você solicitou isenção e um boleto foi gerado, aguarde a análise do pedido de isenção. O boleto é gerado automaticamente como garantia, mas só precisa ser pago caso a isenção seja indeferida. Acompanhe o resultado do pedido na sua área do candidato."
  },
  {
    id: "10",
    question: "Pagamento pendente após pagar boleto?",
    answer: "O processamento do pagamento por boleto pode levar até 3 dias úteis para ser confirmado no sistema. Aguarde esse prazo antes de entrar em contato. Se após 3 dias úteis o status continuar como 'pendente', entre em contato com a Central de Atendimento com o comprovante de pagamento em mãos."
  },
  {
    id: "11",
    question: "Fui aprovado - como me inscrevo nos quadros da OAB?",
    answer: "Parabéns pela aprovação! Para se inscrever nos quadros da OAB, você deve procurar a Seccional do estado onde deseja atuar. Leve os documentos exigidos (diploma ou certidão de conclusão, identidade, CPF, comprovante de residência, certidões negativas e fotos). Cada seccional pode ter requisitos adicionais - consulte o site da OAB do seu estado."
  }
];

const FAQExameOAB = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/oab/primeira-fase')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Perguntas Frequentes</h1>
            <p className="text-xs text-muted-foreground">Dúvidas sobre o Exame de Ordem</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-900/30 rounded-lg p-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-300">Central de Dúvidas OAB</h3>
              <p className="text-xs text-amber-200/70 mt-1">
                Respostas oficiais para as principais dúvidas sobre inscrição, provas e aprovação no Exame de Ordem.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((item, index) => (
              <AccordionItem 
                key={item.id} 
                value={item.id}
                className={index === faqData.length - 1 ? "border-b-0" : ""}
              >
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 text-left">
                  <span className="text-sm font-medium pr-4">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground text-sm leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Link to Official FAQ */}
        <a 
          href="https://examedeordem.oab.org.br/PerguntasFrequentes"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-neutral-800/70 hover:bg-neutral-700/80 rounded-xl p-4 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Acessar FAQ Oficial da OAB</span>
        </a>
      </div>
    </div>
  );
};

export default FAQExameOAB;
