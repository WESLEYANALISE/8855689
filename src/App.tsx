import { useEffect, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { TutorialProvider } from "./contexts/TutorialContext";
import { AmbientSoundProvider } from "./contexts/AmbientSoundContext";
import { NarrationPlayerProvider } from "./contexts/NarrationPlayerContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import GlobalAudioPlayer from "./components/GlobalAudioPlayer";
import AmbientSoundPlayer from "./components/AmbientSoundPlayer";
import { GlobalImagePreloader } from "./components/GlobalImagePreloader";
import { PageTracker } from "./components/PageTracker";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Auth pages
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Welcome from "./pages/Welcome";
import EscolherPlano from "./pages/EscolherPlano";

// ALL PAGES - Direct imports for instant loading
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ChatProfessora from "./pages/ChatProfessora";
import ProfessoraChatPage from "./pages/ProfessoraChatPage";

// Vade Mecum
import VadeMecumTodas from "./pages/VadeMecumTodas";
import Codigos from "./pages/Codigos";
import CodigoView from "./pages/CodigoView";
import Constituicao from "./pages/Constituicao";

// Flashcards
import FlashcardsEstudar from "./pages/FlashcardsEstudar";
import FlashcardsArtigosLeiEstudar from "./pages/FlashcardsArtigosLeiEstudar";

// Câmara dos Deputados
import CamaraDeputados from "./pages/CamaraDeputados";
import CamaraDeputadosLista from "./pages/CamaraDeputadosLista";
import CamaraDeputadoDetalhes from "./pages/CamaraDeputadoDetalhes";
import CamaraProposicoes from "./pages/CamaraProposicoes";
import CamaraProposicoesLista from "./pages/CamaraProposicoesLista";
import CamaraVotacoes from "./pages/CamaraVotacoes";
import CamaraDespesas from "./pages/CamaraDespesas";
import CamaraEventos from "./pages/CamaraEventos";
import CamaraOrgaos from "./pages/CamaraOrgaos";
import CamaraFrentes from "./pages/CamaraFrentes";
import CamaraPartidos from "./pages/CamaraPartidos";
import CamaraPartidoDetalhes from "./pages/CamaraPartidoDetalhes";
import CamaraRankings from "./pages/CamaraRankings";
import CamaraRankingDeputados from "./pages/CamaraRankingDeputados";
import CamaraBlocos from "./pages/CamaraBlocos";
import CamaraVotacaoDetalhes from "./pages/CamaraVotacaoDetalhes";
import CamaraProposicaoDetalhes from "./pages/CamaraProposicaoDetalhes";

// Eleições
import Eleicoes from "./pages/Eleicoes";
import EleicoesSituacao from "./pages/EleicoesSituacao";
import EleicoesCandidatos from "./pages/EleicoesCandidatos";
import EleicoesResultados from "./pages/EleicoesResultados";
import EleicoesEleitorado from "./pages/EleicoesEleitorado";
import EleicoesHistorico from "./pages/EleicoesHistorico";
import EleicoesPrestacaoContas from "./pages/EleicoesPrestacaoContas";
import EleicoesLegislacao from "./pages/EleicoesLegislacao";
import EleicoesCalendario from "./pages/EleicoesCalendario";

// Simulação
import SimulacaoJuridica from "./pages/SimulacaoJuridica";
import SimulacaoEscolhaModo from "./pages/SimulacaoEscolhaModo";
import SimulacaoAreas from "./pages/SimulacaoAreas";
import SimulacaoEscolhaEstudo from "./pages/SimulacaoEscolhaEstudo";
import SimulacaoTemas from "./pages/SimulacaoTemas";
import SimulacaoArtigos from "./pages/SimulacaoArtigos";
import SimulacaoEscolhaCaso from "./pages/SimulacaoEscolhaCaso";
import SimulacaoAudienciaNew from "./pages/SimulacaoAudienciaNew";
import SimulacaoAudienciaJuiz from "./pages/SimulacaoAudienciaJuiz";
import SimulacaoFeedback from "./pages/SimulacaoFeedback";
import SimulacaoFeedbackJuiz from "./pages/SimulacaoFeedbackJuiz";
import SimulacaoAvatar from "./pages/SimulacaoAvatar";
import SimulacaoCaso from "./pages/SimulacaoCaso";

// Meu Brasil
import MeuBrasil from "./pages/MeuBrasil";
import MeuBrasilHistoria from "./pages/MeuBrasilHistoria";
import MeuBrasilHistoriaView from "./pages/MeuBrasilHistoriaView";
import MeuBrasilSistemas from "./pages/MeuBrasilSistemas";
import MeuBrasilJuristas from "./pages/MeuBrasilJuristas";
import MeuBrasilJuristaView from "./pages/MeuBrasilJuristaView";
import MeuBrasilInstituicoes from "./pages/MeuBrasilInstituicoes";
import MeuBrasilCasos from "./pages/MeuBrasilCasos";
import MeuBrasilArtigo from "./pages/MeuBrasilArtigo";
import MeuBrasilBusca from "./pages/MeuBrasilBusca";
import DocumentarioMinistro from "./pages/DocumentarioMinistro";

// Jogos Jurídicos
import JogosJuridicos from "./pages/JogosJuridicos";
import JogoConfig from "./pages/JogoConfig";
import JogoRouter from "./pages/jogos/JogoRouter";

// Três Poderes
import TresPoderes from "./pages/TresPoderes";
import TresPoderesExecutivo from "./pages/TresPoderesExecutivo";
import TresPoderesLegislativo from "./pages/TresPoderesLegislativo";
import TresPoderesJudiciario from "./pages/TresPoderesJudiciario";
import TresPoderesBiografia from "./pages/TresPoderesBiografia";

// JuriFlix
import JuriFlix from "./pages/JuriFlix";
import JuriFlixDetalhesEnhanced from "./pages/JuriFlixDetalhesEnhanced";
import JuriFlixEnriquecer from "./pages/JuriFlixEnriquecer";

// Admin/Populating pages
import PopularMeuBrasil from "./pages/PopularMeuBrasil";
import PopularSumulasSTJ from "./pages/PopularSumulasSTJ";
import PopularCPM from "./pages/PopularCPM";
import PopularCPMManual from "./pages/PopularCPMManual";
import PopularSimuladoTJSP from "./pages/PopularSimuladoTJSP";
import GerarQuestoesAdmin from "./pages/Admin/GerarQuestoesAdmin";
import AdminVerificarOcr from "./pages/AdminVerificarOcr";
import RasparLeis from "./pages/Admin/RasparLeis";
import AtualizarLei from "./pages/Admin/AtualizarLei";
import AdminHub from "./pages/Admin/AdminHub";
import AdminUsuarios from "./pages/Admin/AdminUsuarios";
import AdminEvelynUsuarios from "./pages/Admin/AdminEvelynUsuarios";
import AdminBoletins from "./pages/Admin/AdminBoletins";
import EvelynMetricas from "./pages/Admin/EvelynMetricas";
import NarracaoArtigos from "./pages/Admin/NarracaoArtigos";
import LeisPush from "./pages/Admin/LeisPush";
import GeracaoFundos from "./pages/Admin/GeracaoFundos";
import ValidarArtigos from "./pages/Admin/ValidarArtigos";
import HistoricoLeis from "./pages/Admin/HistoricoLeis";
import MonitoramentoLeis from "./pages/Admin/MonitoramentoLeis";
import AdminLeituraDinamica from "./pages/Admin/AdminLeituraDinamica";
import AdminNotificacoesPush from "./pages/Admin/AdminNotificacoesPush";
import AdminSincronizarPeticoes from "./pages/Admin/AdminSincronizarPeticoes";
import AdminExtracaoPeticoes from "./pages/Admin/AdminExtracaoPeticoes";
import PostsJuridicosAdmin from "./pages/Admin/PostsJuridicosAdmin";
import GeracaoCentral from "./pages/Admin/GeracaoCentral";
import AdminAssinaturas from "./pages/Admin/AdminAssinaturas";
import AdminControle from "./pages/Admin/AdminControle";
import AdminUsuarioDetalhes from "./pages/Admin/AdminUsuarioDetalhes";
import AdminCapasBiblioteca from "./pages/AdminCapasBiblioteca";
import NovasLeis from "./pages/NovasLeis";
import PrimeirosPassos from "./pages/PrimeirosPassos";
import NovasLeisView from "./pages/NovasLeisView";
import AssinaturaCallback from "./pages/AssinaturaCallback";
import AssinaturaCheckout from "./pages/AssinaturaCheckout";
import MinhaAssinatura from "./pages/MinhaAssinatura";
import MeusPagamentos from "./pages/MeusPagamentos";
import AtualizacaoLeiFinal from "./pages/ferramentas/AtualizacaoLeiFinal";
import AtualizarLeiHub from "./pages/ferramentas/AtualizarLeiHub";
import OtimizarImagens from "./pages/ferramentas/OtimizarImagens";
import PostsJuridicos from "./pages/PostsJuridicos";
import AdvogadoContratos from "./pages/AdvogadoContratos";
import AdvogadoContratosModelos from "./pages/AdvogadoContratosModelos";
import AdvogadoContratosCriar from "./pages/AdvogadoContratosCriar";
import PeticoesContratosHub from "./pages/PeticoesContratosHub";

// Categorias do Direito
import CategoriasMateriasPage from "./pages/CategoriasMateriasPage";
import CategoriasTopicoEstudo from "./pages/CategoriasTopicoEstudo";
import CategoriasTopicoFlashcards from "./pages/CategoriasTopicoFlashcards";
import CategoriasTopicoQuestoes from "./pages/CategoriasTopicoQuestoes";
import CategoriasProgresso from "./pages/CategoriasProgresso";
import CategoriasHistorico from "./pages/CategoriasHistorico";
import CategoriasEstatisticas from "./pages/CategoriasEstatisticas";

// Diário Oficial
import DiarioOficialHub from "./pages/diario-oficial/DiarioOficialHub";
import BuscaDiarios from "./pages/diario-oficial/BuscaDiarios";
import ConsultaCnpj from "./pages/diario-oficial/ConsultaCnpj";
import BuscaPorTema from "./pages/diario-oficial/BuscaPorTema";
import ExplorarCidades from "./pages/diario-oficial/ExplorarCidades";
import DashboardNacional from "./pages/diario-oficial/DashboardNacional";

// STJ
import AtualizacoesSTJ from "./pages/stj/AtualizacoesSTJ";
import PesquisaProntaSTJ from "./pages/stj/PesquisaProntaSTJ";
import DocumentariosJuridicos from "./pages/ferramentas/DocumentariosJuridicos";
import DocumentarioDetalhes from "./pages/ferramentas/DocumentarioDetalhes";
import AjusteDocumentarios from "./pages/ferramentas/AjusteDocumentarios";
import TCC from "./pages/ferramentas/TCC";
import TCCHub from "./pages/ferramentas/TCCHub";
import TCCBuscar from "./pages/ferramentas/TCCBuscar";
import TCCSugestoes from "./pages/ferramentas/TCCSugestoes";
import TCCTendencias from "./pages/ferramentas/TCCTendencias";
import TCCSalvos from "./pages/ferramentas/TCCSalvos";
import TCCDetalhes from "./pages/ferramentas/TCCDetalhes";

// Senado Federal
import SenadoHub from "./pages/ferramentas/SenadoHub";
import SenadoSenadores from "./pages/ferramentas/SenadoSenadores";
import SenadoSenadorDetalhes from "./pages/ferramentas/SenadoSenadorDetalhes";
import SenadoVotacoes from "./pages/ferramentas/SenadoVotacoes";
import SenadoMaterias from "./pages/ferramentas/SenadoMaterias";
import SenadoComissoes from "./pages/ferramentas/SenadoComissoes";
import SenadoComissaoDetalhes from "./pages/ferramentas/SenadoComissaoDetalhes";
import SenadoAgenda from "./pages/ferramentas/SenadoAgenda";
import EvelynWhatsApp from "./pages/ferramentas/EvelynWhatsApp";
import EvelynConversaDetalhe from "./pages/ferramentas/EvelynConversaDetalhe";
import ReGenerarCapasBibliotecas from "./pages/ferramentas/ReGenerarCapasBibliotecas";
import LocalizadorJuridico from "./pages/ferramentas/LocalizadorJuridico";
import LocalJuridicoDetalhes from "./pages/ferramentas/LocalJuridicoDetalhes";

// Secondary pages
import VideoAula from "./pages/VideoAula";
import Cursos from "./pages/Cursos";
import CursosModulos from "./pages/CursosModulos";
import CursosAulas from "./pages/CursosAulas";
import CursoAulaView from "./pages/CursoAulaView";
import Estatutos from "./pages/Estatutos";
import EstatutoView from "./pages/EstatutoView";
import Sumulas from "./pages/Sumulas";
import SumulaView from "./pages/SumulaView";
import Previdenciario from "./pages/Previdenciario";
import LeiPrevidenciariaBeneficios from "./pages/LeiPrevidenciariaBeneficios";
import LeiPrevidenciariaCusteio from "./pages/LeiPrevidenciariaCusteio";
import Pesquisar from "./pages/Pesquisar";
import PesquisarCategoria from "./pages/PesquisarCategoria";
import AulaInterativaV2 from "./pages/AulaInterativaV2";
import Dicionario from "./pages/Dicionario";
import DicionarioLetra from "./pages/DicionarioLetra";
import Ferramentas from "./pages/Ferramentas";
import BuscarLivros from "./pages/ferramentas/BuscarLivros";
import LeituraDinamica from "./pages/LeituraDinamica";
import BoletinsJuridicos from "./pages/BoletinsJuridicos";
import Estudos from "./pages/Estudos";
import JornadaJuridica from "./pages/JornadaJuridica";
import JornadaJuridicaTrilha from "./pages/JornadaJuridicaTrilha";
import JornadaJuridicaDia from "./pages/JornadaJuridicaDia";
import Advogado from "./pages/Advogado";
import AdvogadoModelos from "./pages/AdvogadoModelos";
import AdvogadoCriar from "./pages/AdvogadoCriar";
import AdvogadoProcessos from "./pages/AdvogadoProcessos";
import AdvogadoConsultaCNPJ from "./pages/AdvogadoConsultaCNPJ";
import AdvogadoPrazos from "./pages/AdvogadoPrazos";
import AdvogadoDiarioOficial from "./pages/AdvogadoDiarioOficial";
import AdvogadoJurisprudencia from "./pages/AdvogadoJurisprudencia";
import Novidades from "./pages/Novidades";
import Suporte from "./pages/Suporte";
import Ajuda from "./pages/Ajuda";
import NumerosDetalhes from "./pages/NumerosDetalhes";
import Estagios from "./pages/Estagios";
import EstagioDetalhes from "./pages/EstagioDetalhes";
import EstagiosDicas from "./pages/EstagiosDicas";
import AssistentePessoal from "./pages/AssistentePessoal";
import NoticiaWebView from "./components/NoticiaWebView";
import JurisprudenciaWebView from "./components/JurisprudenciaWebView";
import VadeMecumBusca from "./pages/VadeMecumBusca";
import LeisExplicacoes from "./pages/LeisExplicacoes";
import VadeMecumSobre from "./pages/VadeMecumSobre";
import NoticiasOAB from "./pages/oab/NoticiasOAB";
import NoticiaOABDetalhe from "./pages/oab/NoticiaOABDetalhe";
import FAQExameOAB from "./pages/oab/FAQExameOAB";
import CalendarioOAB from "./pages/oab/CalendarioOAB";
import BibliotecaOAB from "./pages/BibliotecaOAB";
import BibliotecaOABEstudos from "./pages/BibliotecaOABEstudos";
import BibliotecaOABRevisao from "./pages/BibliotecaOABRevisao";
import BibliotecaOABLivro from "./pages/BibliotecaOABLivro";
import BibliotecaEstudos from "./pages/BibliotecaEstudos";
import BibliotecaEstudosLivro from "./pages/BibliotecaEstudosLivro";
import AulaLivro from "./pages/AulaLivro";
import BibliotecaClassicos from "./pages/BibliotecaClassicos";
import BibliotecaClassicosLivro from "./pages/BibliotecaClassicosLivro";
import BibliotecaClassicosAnalise from "./pages/BibliotecaClassicosAnalise";
import BibliotecaClassicosAnaliseTema from "./pages/BibliotecaClassicosAnaliseTema";
import BibliotecaClassicosAnaliseQuestoes from "./pages/BibliotecaClassicosAnaliseQuestoes";
import LeituraInterativaFormatacao from "./pages/LeituraInterativaFormatacao";
import BibliotecaForaDaToga from "./pages/BibliotecaForaDaToga";
import BibliotecaForaDaTogaLivro from "./pages/BibliotecaForaDaTogaLivro";
import BibliotecaOratoria from "./pages/BibliotecaOratoria";
import BibliotecaOratoriaLivro from "./pages/BibliotecaOratoriaLivro";
import BibliotecaLideranca from "./pages/BibliotecaLideranca";
import BibliotecaLiderancaLivro from "./pages/BibliotecaLiderancaLivro";
import Bibliotecas from "./pages/Bibliotecas";
import BibliotecaFaculdade from "./pages/BibliotecaFaculdade";
import BibliotecaPortugues from "./pages/BibliotecaPortugues";
import BibliotecaPortuguesLivro from "./pages/BibliotecaPortuguesLivro";
import BibliotecaPesquisaCientifica from "./pages/BibliotecaPesquisaCientifica";
import BibliotecaPesquisaCientificaLivro from "./pages/BibliotecaPesquisaCientificaLivro";
import BibliotecaIniciante from "./pages/BibliotecaIniciante";
import BibliotecaBusca from "./pages/BibliotecaBusca";
import BibliotecaPlanoLeitura from "./pages/BibliotecaPlanoLeitura";
import BibliotecaHistorico from "./pages/BibliotecaHistorico";
import BibliotecaFavoritos from "./pages/BibliotecaFavoritos";
import AcessoDesktop from "./pages/AcessoDesktop";
import Analisar from "./pages/Analisar";
import AnalisarResultado from "./pages/AnalisarResultado";
import ResumosJuridicosEscolha from "./pages/ResumosJuridicosEscolha";
import ResumosJuridicosLanding from "./pages/ResumosJuridicosLanding";
import ResumosJuridicosTrilhas from "./pages/ResumosJuridicosTrilhas";
import ResumosPersonalizados from "./pages/ResumosPersonalizados";
import ResumosProntos from "./pages/ResumosProntos";
import ResumosProntosView from "./pages/ResumosProntosView";
import ResumosResultado from "./pages/ResumosResultado";
import PlanoEstudos from "./pages/PlanoEstudos";
import PlanoEstudosResultado from "./pages/PlanoEstudosResultado";
import FlashcardsEscolha from "./pages/FlashcardsEscolha";
import FlashcardsHub from "./pages/FlashcardsHub";
import FlashcardsAreas from "./pages/FlashcardsAreas";
import FlashcardsTemas from "./pages/FlashcardsTemas";
import FlashcardsArtigosLei from "./pages/FlashcardsArtigosLei";
import FlashcardsArtigosConstituicao from "./pages/FlashcardsArtigosConstituicao";
import FlashcardsArtigosCodigosLeis from "./pages/FlashcardsArtigosCodigosLeis";
import FlashcardsArtigosEstatutos from "./pages/FlashcardsArtigosEstatutos";
import FlashcardsArtigosLegislacaoPenal from "./pages/FlashcardsArtigosLegislacaoPenal";
import FlashcardsArtigosPrevidenciario from "./pages/FlashcardsArtigosPrevidenciario";
import FlashcardsArtigosSumulas from "./pages/FlashcardsArtigosSumulas";
import FlashcardsArtigosLeiTemas from "./pages/FlashcardsArtigosLeiTemas";
import ResumosArtigosLei from "./pages/ResumosArtigosLei";
import ResumosArtigosLeiCodigos from "./pages/ResumosArtigosLeiCodigos";
import ResumosArtigosLeiEstatutos from "./pages/ResumosArtigosLeiEstatutos";
import ResumosArtigosLeiLegislacao from "./pages/ResumosArtigosLeiLegislacao";
import ResumosArtigosLeiPrevidenciario from "./pages/ResumosArtigosLeiPrevidenciario";
import ResumosArtigosLeiSumulas from "./pages/ResumosArtigosLeiSumulas";
import ResumosArtigosLeiTemas from "./pages/ResumosArtigosLeiTemas";
import ResumosArtigosLeiView from "./pages/ResumosArtigosLeiView";
import CompleteLeiCodigos from "./pages/CompleteLeiCodigos";
import CompleteLeiArtigos from "./pages/CompleteLeiArtigos";
import CompleteLeiExercicio from "./pages/CompleteLeiExercicio";
import Simulados from "./pages/Simulados";
import SimuladosExames from "./pages/SimuladosExames";
import SimuladosPersonalizado from "./pages/SimuladosPersonalizado";
import SimuladosRealizar from "./pages/SimuladosRealizar";
import SimuladosResultado from "./pages/SimuladosResultado";
import AudioaulasHub from "./pages/AudioaulasHub";
import AudioaulasCategoriaPage from "./pages/AudioaulasCategoriaPage";
import AudioaulasCategoria from "./pages/AudioaulasCategoria";
import AudioaulasTema from "./pages/AudioaulasTema";
import VideoaulasAreas from "./pages/VideoaulasAreas";
import VideoaulasAreasLista from "./pages/VideoaulasAreasLista";
import VideoaulasAreaVideos from "./pages/VideoaulasAreaVideos";
import VideoaulasAreaVideoView from "./pages/VideoaulasAreaVideoView";
import VideoaulasOAB from "./pages/VideoaulasOAB";
import VideoaulasOABArea from "./pages/VideoaulasOABArea";
import VideoaulasOABView from "./pages/VideoaulasOABView";
import VideoaulasOABPrimeiraFase from "./pages/VideoaulasOABPrimeiraFase";
import VideoaulasOABAreaPrimeiraFase from "./pages/VideoaulasOABAreaPrimeiraFase";
import VideoaulasOABViewPrimeiraFase from "./pages/VideoaulasOABViewPrimeiraFase";
import VideoaulasPlaylists from "./pages/VideoaulasPlaylists";
import VideoaulasArea from "./pages/VideoaulasArea";
import VideoaulasPlayer from "./pages/VideoaulasPlayer";
import VideoaulasIniciante from "./pages/VideoaulasIniciante";
import VideoaulaInicianteView from "./pages/VideoaulaInicianteView";
import VideoaulasFaculdade from "./pages/VideoaulasFaculdade";
import VideoaulasFaculdadeArea from "./pages/VideoaulasFaculdadeArea";
import VideoaulaFaculdadeView from "./pages/VideoaulaFaculdadeView";
import Processo from "./pages/Processo";
import NoticiasJuridicas from "./pages/NoticiasJuridicas";
import NoticiaDetalhes from "./pages/NoticiaDetalhes";
import NoticiaAnalise from "./pages/NoticiaAnalise";
import ResumoDoDia from "./pages/ResumoDoDia";
import RankingFaculdades from "./pages/RankingFaculdades";
import RankingUnificado from "./pages/RankingUnificado";
import MetodologiaRanking from "./pages/MetodologiaRanking";
import RankingFaculdadeDetalhes from "./pages/RankingFaculdadeDetalhes";

import OABOQueEstudar from "./pages/OABOQueEstudar";
import OABOQueEstudarArea from "./pages/OABOQueEstudarArea";
import OABFuncoes from "./pages/OABFuncoes";
import SimuladosTJSP from "./pages/SimuladosTJSP";
import TrilhasAprovacao from "./pages/oab/TrilhasAprovacao";
import TrilhaAreaTemas from "./pages/oab/TrilhaAreaTemas";
import TrilhaTemaSubtemas from "./pages/oab/TrilhaTemaSubtemas";
import TrilhaSubtemaEstudo from "./pages/oab/TrilhaSubtemaEstudo";
import TrilhasEtica from "./pages/oab/TrilhasEtica";
import TrilhasEticaTema from "./pages/oab/TrilhasEticaTema";
import TrilhasEticaEstudo from "./pages/oab/TrilhasEticaEstudo";
import TrilhasEticaTemaEstudo from "./pages/oab/TrilhasEticaTemaEstudo";
import OABTrilhasMateria from "./pages/oab/OABTrilhasMateria";
import OABTrilhasTopicos from "./pages/oab/OABTrilhasTopicos";
import OABTrilhasTopicoEstudo from "./pages/oab/OABTrilhasTopicoEstudo";
import OABTrilhasTopicoFlashcards from "./pages/oab/OABTrilhasTopicoFlashcards";
import OABTrilhasTopicoQuestoes from "./pages/oab/OABTrilhasTopicoQuestoes";
import OABTrilhasSubtemaEstudo from "./pages/oab/OABTrilhasSubtemaEstudo";
import OABTrilhasSubtemaFlashcards from "./pages/oab/OABTrilhasSubtemaFlashcards";
import OABTrilhasSubtemaQuestoes from "./pages/oab/OABTrilhasSubtemaQuestoes";
import OABTrilhasAula from "./pages/oab/OABTrilhasAula";

import FaculdadeInicio from "./pages/FaculdadeInicio";
import FaculdadeSemestre from "./pages/FaculdadeSemestre";
import FaculdadeDisciplina from "./pages/FaculdadeDisciplina";
import FaculdadeTopicoEstudo from "./pages/FaculdadeTopicoEstudo";
import FaculdadeTopicoQuestoes from "./pages/FaculdadeTopicoQuestoes";

// Dominando o Direito
import Dominando from "./pages/Dominando";
import DominandoTrilhas from "./pages/DominandoTrilhas";
import DominandoArea from "./pages/DominandoArea";
import DominandoEstudo from "./pages/DominandoEstudo";

// Dashboard de Aulas
import AulasDashboard from "./pages/AulasDashboard";
const AulasPage = lazy(() => import("./pages/AulasPage"));

// Conceitos (Trilhas para Iniciantes)
import ConceitosInicio from "./pages/ConceitosInicio";
import ConceitosTrilhante from "./pages/ConceitosTrilhante";
import ConceitosLivro from "./pages/ConceitosLivro";
import ConceitosLivroTema from "./pages/ConceitosLivroTema";
import ConceitosArea from "./pages/ConceitosArea";
import ConceitosMateria from "./pages/ConceitosMateria";
import ConceitosTopicoEstudo from "./pages/ConceitosTopicoEstudo";
import ConceitosTopicoFlashcards from "./pages/ConceitosTopicoFlashcards";
import ConceitosTopicoQuestoes from "./pages/ConceitosTopicoQuestoes";
import PrimeiraFase from "./pages/oab/PrimeiraFase";
import SegundaFase from "./pages/oab/SegundaFase";
import OabCarreira from "./pages/oab/Carreira";
import AdminTrilhasOAB from "./pages/Admin/AdminTrilhasOAB";
import Tematicas from "./pages/Tematicas";
import TematicaJuridica from "./pages/TematicaJuridica";
import IniciandoDireito from "./pages/IniciandoDireito";
import IniciandoDireitoSobre from "./pages/IniciandoDireitoSobre";
import IniciandoDireitoTemas from "./pages/IniciandoDireitoTemas";
import IniciandoDireitoAula from "./pages/IniciandoDireitoAula";
import IniciandoDireitoTodos from "./pages/IniciandoDireitoTodos";
import MapaMentalAreas from "./pages/MapaMentalAreas";
import MapaMentalTemas from "./pages/MapaMentalTemas";
import LegislacaoPenalEspecial from "./pages/LegislacaoPenalEspecial";
import LepView from "./pages/LepView";
import JuizadosEspeciaisView from "./pages/JuizadosEspeciaisView";
import MariaDaPenhaView from "./pages/MariaDaPenhaView";
import LeiDrogasView from "./pages/LeiDrogasView";
import OrganizacoesCriminosasView from "./pages/OrganizacoesCriminosasView";
import LeiPenalLavagemDinheiro from "./pages/LeiPenalLavagemDinheiro";
import InterceptacaoTelefonicaView from "./pages/InterceptacaoTelefonicaView";
import CrimesHediondosView from "./pages/CrimesHediondosView";
import TorturaView from "./pages/TorturaView";
import CrimesDemocraticosView from "./pages/CrimesDemocraticosView";
import AbusoAutoridadeView from "./pages/AbusoAutoridadeView";
import PacoteAnticrimeView from "./pages/PacoteAnticrimeView";
import { 
  CrimesAmbientaisView, 
  FalenciaView, 
  FeminicidioView, 
  AntiterrorismoView, 
  CrimesFinanceiroView, 
  CrimesTributarioView, 
  FichaLimpaView, 
  CrimesResponsabilidadeView, 
  CrimesTransnacionaisView 
} from "./pages/LeiPenalGenericView";
import LeisOrdinarias from "./pages/LeisOrdinarias";
import LeiImprobidadeView from "./pages/LeiImprobidadeView";
import LeiLicitacoesView from "./pages/LeiLicitacoesView";

// Legal
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import LeiAcaoCivilPublicaView from "./pages/LeiAcaoCivilPublicaView";
import LeiLGPDView from "./pages/LeiLGPDView";
import LeiLRFView from "./pages/LeiLRFView";
import LeiProcessoAdministrativoView from "./pages/LeiProcessoAdministrativoView";
import LeiAcessoInformacaoView from "./pages/LeiAcessoInformacaoView";
import LeiLegislacaoTributariaView from "./pages/LeiLegislacaoTributariaView";
import LeiRegistrosPublicosView from "./pages/LeiRegistrosPublicosView";
import LeiJuizadosCiveisView from "./pages/LeiJuizadosCiveisView";
import LeiAcaoPopularView from "./pages/LeiAcaoPopularView";
import LeiAnticorrupcaoView from "./pages/LeiAnticorrupcaoView";
import LeiMediacaoView from "./pages/LeiMediacaoView";
import LeiADIADCView from "./pages/LeiADIADCView";
import QuestoesFaculdade from "./pages/QuestoesFaculdade";
import QuizFaculdade from "./pages/QuizFaculdade";

import QuestoesHub from "./pages/ferramentas/QuestoesHub";
import QuestoesTemas from "./pages/ferramentas/QuestoesTemas";
import QuestoesResolver from "./pages/ferramentas/QuestoesResolver";
import JurisprudenciasTeste from "./pages/ferramentas/JurisprudenciasTeste";
import Redacao from "./pages/Redacao";
import RedacaoCategoria from "./pages/RedacaoCategoria";
import RedacaoConteudo from "./pages/RedacaoConteudo";
import SimuladosConcurso from "./pages/ferramentas/SimuladosConcurso";
import SimuladoConcursoDetalhes from "./pages/ferramentas/SimuladoConcursoDetalhes";
import SimuladoConcursoResolver from "./pages/ferramentas/SimuladoConcursoResolver";
import SimuladoConcursoResultado from "./pages/ferramentas/SimuladoConcursoResultado";
import SimuladosHub from "./pages/ferramentas/SimuladosHub";
import SimuladoTJSP from "./pages/ferramentas/SimuladoTJSP";
import SimuladoTJSPMaterias from "./pages/ferramentas/SimuladoTJSPMaterias";
import SimuladoEscrevente from "./pages/ferramentas/SimuladoEscrevente";
import SimuladoEscreventeDashboard from "./pages/ferramentas/SimuladoEscreventeDashboard";
import SimuladoEscreventeResolver from "./pages/ferramentas/SimuladoEscreventeResolver";
import SimuladoEscreventeResultado from "./pages/ferramentas/SimuladoEscreventeResultado";
import RasparQuestoes from "./pages/ferramentas/RasparQuestoes";
import ConcursosAbertos from "./pages/ferramentas/ConcursosAbertos";
import STJ from "./pages/ferramentas/STJ";
import Infograficos from "./pages/ferramentas/Infograficos";
import EstatisticasJudiciais from "./pages/ferramentas/EstatisticasJudiciais";
import ConverterImagens from "./pages/ferramentas/ConverterImagens";
import Audiencias from "./pages/ferramentas/Audiencias";
import AudienciaDetalhe from "./pages/ferramentas/AudienciaDetalhe";
import QuestoesArtigosLei from "./pages/QuestoesArtigosLei";
import QuestoesEscolha from "./pages/QuestoesEscolha";
import QuestoesArtigosLeiTemas from "./pages/QuestoesArtigosLeiTemas";
import QuestoesArtigosLeiResolver from "./pages/QuestoesArtigosLeiResolver";
import QuestoesArtigosLeiGerar from "./pages/QuestoesArtigosLeiGerar";
import QuestoesArtigosLeiCodigos from "./pages/QuestoesArtigosLeiCodigos";
import QuestoesArtigosLeiEstatutos from "./pages/QuestoesArtigosLeiEstatutos";
import QuestoesArtigosLeiLegislacaoPenal from "./pages/QuestoesArtigosLeiLegislacaoPenal";
import QuestoesArtigosLeiPrevidenciario from "./pages/QuestoesArtigosLeiPrevidenciario";
import QuestoesArtigosLeiSumulas from "./pages/QuestoesArtigosLeiSumulas";
import BloggerJuridicoHub from "./pages/BloggerJuridicoHub";
import BloggerJuridico from "./pages/BloggerJuridico";
import BloggerJuridicoArtigo from "./pages/BloggerJuridicoArtigo";
import EmAlta from "./pages/EmAlta";
import SeAprofunde from "./pages/SeAprofunde";
import SeAprofundeInstituicao from "./pages/SeAprofundeInstituicao";
import SeAprofundeMembro from "./pages/SeAprofundeMembro";
import SeAprofundeNoticia from "./pages/SeAprofundeNoticia";
import Evelyn from "./pages/Evelyn";
import Politica from "./pages/Politica";
import PoliticaNoticias from "./pages/PoliticaNoticias";
import NoticiaPoliticaDetalhes from "./pages/NoticiaPoliticaDetalhes";
import PoliticaRankings from "./pages/PoliticaRankings";
import SenadoRankingDetalhes from "./pages/SenadoRankingDetalhes";
import ComparadorPoliticos from "./pages/ComparadorPoliticos";
import PoliticaBlog from "./pages/PoliticaBlog";
import PoliticaBlogArtigo from "./pages/PoliticaBlogArtigo";
import PoliticaComoFunciona from "./pages/PoliticaComoFunciona";
import PoliticaComoFuncionaView from "./pages/PoliticaComoFuncionaView";
import PoliticaEstudos from "./pages/PoliticaEstudos";
import PoliticaLivroDetalhe from "./pages/PoliticaLivroDetalhe";
import PoliticaArtigoView from "./pages/PoliticaArtigoView";
import PoliticaDocumentarioDetalhe from "./pages/PoliticaDocumentarioDetalhe";
import TutoriaisHub from "./pages/TutoriaisHub";
import TutorialPage from "./pages/TutorialPage";
import EstudoCarreira from "./pages/EstudoCarreira";
import CarreirasJuridicas from "./pages/CarreirasJuridicas";
import JurisprudenciaCorpus927 from "./pages/JurisprudenciaCorpus927";

// Vade Mecum - Novas páginas
import VadeMecumLegislacao from "./pages/VadeMecumLegislacao";
import VadeMecumResenhaDiaria from "./pages/VadeMecumResenhaDiaria";
import VadeMecumResenhaSobre from "./pages/VadeMecumResenhaSobre";
import VadeMecumResenhaView from "./pages/VadeMecumResenhaView";
import VadeMecumPushLegislacao from "./pages/VadeMecumPushLegislacao";
import ResenhaDiariaSobre from "./pages/ResenhaDiariaSobre";

// Admin pages
import AdminGerarTutoriais from "./pages/AdminGerarTutoriais";
import AdminPushLegislacao from "./pages/Admin/AdminPushLegislacao";
import ImportarInstagram from "./pages/Admin/ImportarInstagram";
import CancelarPush from "./pages/CancelarPush";
import AdminBaseConhecimentoOAB from "./pages/Admin/AdminBaseConhecimentoOAB";

// Aprenda Seu Jeito
import AprendaSeuJeito from "./pages/AprendaSeuJeito";
import AprendaSeuJeitoEstudo from "./pages/AprendaSeuJeitoEstudo";
import Perfil from "./pages/Perfil";
import Assinatura from "./pages/Assinatura";
import TelaHub from "./pages/TelaHub";

// ============= CONFIGURAÇÃO AGRESSIVA DE CACHE =============
// Performance: staleTime 30min reduz re-fetches, gcTime 2h mantém dados em memória
// Padrão stale-while-revalidate: mostra cache imediatamente, atualiza em background
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 1000 * 60 * 30,      // 30 minutos - dados considerados frescos
      gcTime: 1000 * 60 * 60 * 2,     // 2 horas - tempo no garbage collector
    },
    mutations: {
      retry: 1,
    },
  },
});

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

const App = () => {
  // Handler global para erros assíncronos não tratados - previne tela branca
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault(); // Previne crash
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
        <SubscriptionProvider>
        <NarrationPlayerProvider>
          <BrowserRouter>
            <TutorialProvider>
            <ScrollToTop />
            <PageTracker />
            <GlobalImagePreloader />
            
            {/* Auth routes - outside Layout for full-screen experience */}
            <Routes>
               <Route path="/welcome" element={<Navigate to="/auth" replace />} />
               <Route path="/auth" element={<Auth />} />
              <Route path="/escolher-plano" element={
                <ProtectedRoute skipOnboardingCheck>
                  <EscolherPlano />
                </ProtectedRoute>
              } />
              <Route path="/onboarding" element={
                <ProtectedRoute skipOnboardingCheck>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="*" element={
                <AudioPlayerProvider>
                  <AmbientSoundProvider>
                  <Layout>
                    <Routes>
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/assinatura" element={<Assinatura />} />
              <Route path="/assinatura/checkout" element={<AssinaturaCheckout />} />
              <Route path="/assinatura/callback" element={<AssinaturaCallback />} />
              <Route path="/minha-assinatura" element={<ProtectedRoute><MinhaAssinatura /></ProtectedRoute>} />
              <Route path="/em-alta" element={<EmAlta />} />
              <Route path="/primeiros-passos" element={<PrimeirosPassos />} />
              <Route path="/se-aprofunde" element={<SeAprofunde />} />
              <Route path="/se-aprofunde/:instituicao" element={<SeAprofundeInstituicao />} />
              <Route path="/se-aprofunde/:instituicao/membro/:membroId" element={<SeAprofundeMembro />} />
              <Route path="/se-aprofunde/:instituicao/noticia/:noticiaId" element={<SeAprofundeNoticia />} />
              <Route path="/evelyn" element={<Evelyn />} />
              <Route path="/carreira/:id" element={<EstudoCarreira />} />
              <Route path="/aprenda-seu-jeito" element={<AprendaSeuJeito />} />
              <Route path="/aprenda-seu-jeito/:id" element={<AprendaSeuJeitoEstudo />} />
              <Route path="/vade-mecum" element={<VadeMecumTodas />} />
              <Route path="/vade-mecum/busca" element={<VadeMecumBusca />} />
              <Route path="/leis/explicacoes" element={<LeisExplicacoes />} />
              <Route path="/vade-mecum/sobre" element={<VadeMecumSobre />} />
              <Route path="/vade-mecum/legislacao" element={<VadeMecumLegislacao />} />
              <Route path="/vade-mecum/resenha-diaria" element={<VadeMecumResenhaDiaria />} />
              <Route path="/vade-mecum/resenha-sobre" element={<VadeMecumResenhaSobre />} />
              <Route path="/vade-mecum/resenha/:id" element={<VadeMecumResenhaView />} />
              <Route path="/resenha-diaria-sobre" element={<ResenhaDiariaSobre />} />
              <Route path="/vade-mecum/push-legislacao" element={<VadeMecumPushLegislacao />} />
              <Route path="/jurisprudencia-corpus-927" element={<JurisprudenciaCorpus927 />} />
              <Route path="/codigos" element={<Codigos />} />
              <Route path="/codigo/:id" element={<CodigoView />} />
              <Route path="/legislacao-penal-especial" element={<LegislacaoPenalEspecial />} />
              <Route path="/lei-penal/lep" element={<LepView />} />
              <Route path="/lei-penal/juizados-especiais" element={<JuizadosEspeciaisView />} />
              <Route path="/lei-penal/maria-da-penha" element={<MariaDaPenhaView />} />
              <Route path="/lei-penal/lei-drogas" element={<LeiDrogasView />} />
              <Route path="/lei-penal/organizacoes-criminosas" element={<OrganizacoesCriminosasView />} />
              <Route path="/lei-penal/lavagem-dinheiro" element={<LeiPenalLavagemDinheiro />} />
              <Route path="/lei-penal/interceptacao-telefonica" element={<InterceptacaoTelefonicaView />} />
              <Route path="/lei-penal/crimes-hediondos" element={<CrimesHediondosView />} />
              <Route path="/lei-penal/tortura" element={<TorturaView />} />
              <Route path="/lei-penal/crimes-democraticos" element={<CrimesDemocraticosView />} />
            <Route path="/lei-penal/abuso-autoridade" element={<AbusoAutoridadeView />} />
            <Route path="/lei-penal/pacote-anticrime" element={<PacoteAnticrimeView />} />
            <Route path="/lei-penal/crimes-ambientais" element={<CrimesAmbientaisView />} />
            <Route path="/lei-penal/falencia" element={<FalenciaView />} />
            <Route path="/lei-penal/feminicidio" element={<FeminicidioView />} />
            <Route path="/lei-penal/antiterrorismo" element={<AntiterrorismoView />} />
            <Route path="/lei-penal/crimes-financeiro" element={<CrimesFinanceiroView />} />
            <Route path="/lei-penal/crimes-tributario" element={<CrimesTributarioView />} />
            <Route path="/lei-penal/ficha-limpa" element={<FichaLimpaView />} />
            <Route path="/lei-penal/crimes-responsabilidade" element={<CrimesResponsabilidadeView />} />
            <Route path="/lei-penal/crimes-transnacionais" element={<CrimesTransnacionaisView />} />
            
            {/* Leis Ordinárias */}
            <Route path="/leis-ordinarias" element={<LeisOrdinarias />} />
            <Route path="/leis-ordinarias/improbidade" element={<LeiImprobidadeView />} />
            <Route path="/leis-ordinarias/licitacoes" element={<LeiLicitacoesView />} />
            <Route path="/leis-ordinarias/acao-civil-publica" element={<LeiAcaoCivilPublicaView />} />
            <Route path="/leis-ordinarias/lgpd" element={<LeiLGPDView />} />
            <Route path="/leis-ordinarias/lrf" element={<LeiLRFView />} />
            <Route path="/leis-ordinarias/processo-administrativo" element={<LeiProcessoAdministrativoView />} />
            <Route path="/leis-ordinarias/acesso-informacao" element={<LeiAcessoInformacaoView />} />
            <Route path="/leis-ordinarias/legislacao-tributaria" element={<LeiLegislacaoTributariaView />} />
            <Route path="/leis-ordinarias/registros-publicos" element={<LeiRegistrosPublicosView />} />
            <Route path="/leis-ordinarias/juizados-civeis" element={<LeiJuizadosCiveisView />} />
            <Route path="/leis-ordinarias/acao-popular" element={<LeiAcaoPopularView />} />
            <Route path="/leis-ordinarias/anticorrupcao" element={<LeiAnticorrupcaoView />} />
            <Route path="/leis-ordinarias/mediacao" element={<LeiMediacaoView />} />
            <Route path="/leis-ordinarias/adi-adc" element={<LeiADIADCView />} />
            
            <Route path="/estudos" element={<Estudos />} />
            <Route path="/jornada-juridica" element={<JornadaJuridica />} />
            <Route path="/jornada-juridica/trilha" element={<JornadaJuridicaTrilha />} />
            <Route path="/jornada-juridica/dia/:dia" element={<JornadaJuridicaDia />} />
            <Route path="/video-aula" element={<VideoAula />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/cursos/modulos" element={<CursosModulos />} />
              <Route path="/cursos/aulas" element={<CursosAulas />} />
              <Route path="/cursos/aula" element={<CursoAulaView />} />
              <Route path="/constituicao" element={<Constituicao />} />
              <Route path="/estatutos" element={<Estatutos />} />
              <Route path="/estatuto/:id" element={<EstatutoView />} />
            <Route path="/sumulas" element={<Sumulas />} />
            <Route path="/sumula/:id" element={<SumulaView />} />
            <Route path="/jurisprudencia-corpus927" element={<JurisprudenciaCorpus927 />} />
            <Route path="/novas-leis" element={<NovasLeis />} />
            <Route path="/novas-leis/:id" element={<NovasLeisView />} />
            <Route path="/admin/leis-push" element={<LeisPush />} />
            <Route path="/admin/validar-artigos" element={<ValidarArtigos />} />
            
            {/* Previdenciário */}
            <Route path="/previdenciario" element={<Previdenciario />} />
            <Route path="/lei-previdenciaria/beneficios" element={<LeiPrevidenciariaBeneficios />} />
            <Route path="/lei-previdenciaria/custeio" element={<LeiPrevidenciariaCusteio />} />
            
            <Route path="/pesquisar" element={<Pesquisar />} />
            <Route path="/pesquisar/categoria/:categoriaId" element={<PesquisarCategoria />} />
              <Route path="/chat-professora" element={<ChatProfessora />} />
              <Route path="/professora" element={<ProfessoraChatPage />} />
              <Route path="/videoaulas" element={<TelaHub />} />
              <Route path="/aula-interativa" element={<AulaInterativaV2 />} />
              <Route path="/ferramentas" element={<Ferramentas />} />
              <Route path="/leitura-dinamica" element={<LeituraDinamica />} />
              <Route path="/ferramentas/boletins" element={<BoletinsJuridicos />} />
              <Route path="/ferramentas/jurisprudencias-teste" element={<JurisprudenciasTeste />} />
              <Route path="/questoes" element={<Navigate to="/ferramentas/questoes" replace />} />
              <Route path="/ferramentas/questoes" element={<QuestoesHub />} />
              <Route path="/ferramentas/questoes/temas" element={<QuestoesTemas />} />
              <Route path="/ferramentas/questoes/resolver" element={<QuestoesResolver />} />
              <Route path="/questoes/artigos-lei" element={<QuestoesEscolha />} />
              <Route path="/questoes/artigos-lei/temas" element={<QuestoesArtigosLeiTemas />} />
              <Route path="/questoes/artigos-lei/resolver" element={<QuestoesArtigosLeiResolver />} />
              <Route path="/questoes/artigos-lei/gerar" element={<QuestoesArtigosLeiGerar />} />
              <Route path="/questoes/artigos-lei/codigos" element={<QuestoesArtigosLeiCodigos />} />
              <Route path="/questoes/artigos-lei/estatutos" element={<QuestoesArtigosLeiEstatutos />} />
              <Route path="/questoes/artigos-lei/legislacao-penal" element={<QuestoesArtigosLeiLegislacaoPenal />} />
              <Route path="/questoes/artigos-lei/previdenciario" element={<QuestoesArtigosLeiPrevidenciario />} />
              <Route path="/questoes/artigos-lei/sumulas" element={<QuestoesArtigosLeiSumulas />} />
              <Route path="/ferramentas/simulados" element={<SimuladosConcurso />} />
              <Route path="/ferramentas/simulados/escrevente" element={<SimuladoEscrevente />} />
              <Route path="/ferramentas/simulados/escrevente/:ano" element={<SimuladoEscreventeDashboard />} />
              <Route path="/ferramentas/simulados/escrevente/:ano/resolver" element={<SimuladoEscreventeResolver />} />
              <Route path="/ferramentas/simulados/escrevente/:ano/resultado" element={<SimuladoEscreventeResultado />} />
              <Route path="/ferramentas/simulados/:concurso" element={<SimuladoConcursoDetalhes />} />
              <Route path="/ferramentas/simulados/:concurso/resolver" element={<SimuladoConcursoResolver />} />
              <Route path="/ferramentas/simulados/:concurso/resultado" element={<SimuladoConcursoResultado />} />
              <Route path="/ferramentas/raspar-questoes" element={<RasparQuestoes />} />
              <Route path="/ferramentas/concursos-abertos" element={<ConcursosAbertos />} />
              <Route path="/ferramentas/stj" element={<STJ />} />
              <Route path="/ferramentas/infograficos" element={<Infograficos />} />
              <Route path="/ferramentas/estatisticas" element={<EstatisticasJudiciais />} />
              <Route path="/ferramentas/converter-imagens" element={<ConverterImagens />} />
              <Route path="/ferramentas/audiencias" element={<Audiencias />} />
              <Route path="/ferramentas/audiencias/:id" element={<AudienciaDetalhe />} />
              <Route path="/ferramentas/evelyn-whatsapp" element={<EvelynWhatsApp />} />
              <Route path="/ferramentas/evelyn-whatsapp/conversa/:conversaId" element={<EvelynConversaDetalhe />} />
              <Route path="/ferramentas/regerar-capas-bibliotecas" element={<ReGenerarCapasBibliotecas />} />
              <Route path="/ferramentas/locais-juridicos" element={<LocalizadorJuridico />} />
              <Route path="/ferramentas/locais-juridicos/:placeId" element={<LocalJuridicoDetalhes />} />
              <Route path="/ferramentas/buscar-livros" element={<BuscarLivros />} />
              <Route path="/dicionario" element={<Dicionario />} />
              <Route path="/dicionario/:letra" element={<DicionarioLetra />} />
              <Route path="/bibliotecas" element={<Bibliotecas />} />
              <Route path="/biblioteca-iniciante" element={<BibliotecaIniciante />} />
              <Route path="/biblioteca/busca" element={<BibliotecaBusca />} />
              <Route path="/biblioteca/plano-leitura" element={<BibliotecaPlanoLeitura />} />
              <Route path="/biblioteca/historico" element={<BibliotecaHistorico />} />
              <Route path="/biblioteca/favoritos" element={<BibliotecaFavoritos />} />
              <Route path="/biblioteca" element={<Navigate to="/bibliotecas" replace />} />
            <Route path="/biblioteca-oab" element={<BibliotecaOAB />} />
            <Route path="/biblioteca-oab/estudos" element={<BibliotecaOABEstudos />} />
            <Route path="/biblioteca-oab/revisao" element={<BibliotecaOABRevisao />} />
            <Route path="/biblioteca-oab/:livroId" element={<BibliotecaOABLivro />} />
            <Route path="/biblioteca-estudos" element={<BibliotecaEstudos />} />
            <Route path="/biblioteca-estudos/:livroId" element={<BibliotecaEstudosLivro />} />
            <Route path="/biblioteca-estudos/:livroId/aula" element={<AulaLivro />} />
            <Route path="/admin/capas-biblioteca" element={<AdminCapasBiblioteca />} />
            <Route path="/biblioteca-classicos" element={<BibliotecaClassicos />} />
            <Route path="/biblioteca-classicos/:livroId" element={<BibliotecaClassicosLivro />} />
            <Route path="/biblioteca-classicos/:livroId/analise" element={<BibliotecaClassicosAnalise />} />
            <Route path="/biblioteca-classicos/:livroId/analise/:temaId" element={<BibliotecaClassicosAnaliseTema />} />
            <Route path="/biblioteca-classicos/:livroId/analise/:temaId/questoes" element={<BibliotecaClassicosAnaliseQuestoes />} />
            <Route path="/biblioteca-classicos/formatar" element={<LeituraInterativaFormatacao />} />
            <Route path="/biblioteca-fora-da-toga" element={<BibliotecaForaDaToga />} />
            <Route path="/biblioteca-fora-da-toga/:livroId" element={<BibliotecaForaDaTogaLivro />} />
            <Route path="/biblioteca-oratoria" element={<BibliotecaOratoria />} />
            <Route path="/biblioteca-oratoria/:livroId" element={<BibliotecaOratoriaLivro />} />
            <Route path="/biblioteca-lideranca" element={<BibliotecaLideranca />} />
            <Route path="/biblioteca-lideranca/:livroId" element={<BibliotecaLiderancaLivro />} />
            <Route path="/biblioteca-faculdade" element={<BibliotecaFaculdade />} />
            <Route path="/biblioteca-portugues" element={<BibliotecaPortugues />} />
            <Route path="/biblioteca-portugues/:livroId" element={<BibliotecaPortuguesLivro />} />
            <Route path="/biblioteca-pesquisa-cientifica" element={<BibliotecaPesquisaCientifica />} />
            <Route path="/biblioteca-pesquisa-cientifica/:livroId" element={<BibliotecaPesquisaCientificaLivro />} />
              <Route path="/blogger-juridico" element={<BloggerJuridicoHub />} />
              <Route path="/blogger-juridico/artigos" element={<BloggerJuridico />} />
              <Route path="/blogger-juridico/:categoria/:ordem" element={<BloggerJuridicoArtigo />} />
              <Route path="/faculdade/questoes" element={<QuestoesFaculdade />} />
              <Route path="/faculdade/questoes/quiz" element={<QuizFaculdade />} />
              <Route path="/admin/gerar-questoes" element={<GerarQuestoesAdmin />} />
              <Route path="/admin/usuario/:userId" element={<AdminUsuarioDetalhes />} />
              <Route path="/mapa-mental" element={<MapaMentalAreas />} />
              <Route path="/mapa-mental/area/:area" element={<MapaMentalTemas />} />
              <Route path="/acesso-desktop" element={<AcessoDesktop />} />
              <Route path="/analisar" element={<Analisar />} />
              <Route path="/analisar/resultado" element={<AnalisarResultado />} />
              <Route path="/resumos-juridicos" element={<Navigate to="/resumos-juridicos/prontos" replace />} />
              <Route path="/resumos-juridicos/prontos" element={<ResumosJuridicosEscolha />} />
              <Route path="/resumos-juridicos/prontos/:area" element={<ResumosProntos />} />
              <Route path="/resumos-juridicos/prontos/:area/:tema" element={<ResumosProntosView />} />
              <Route path="/resumos-juridicos/personalizado" element={<ResumosPersonalizados />} />
              <Route path="/resumos-juridicos/resultado" element={<ResumosResultado />} />
              <Route path="/resumos-juridicos/artigos-lei" element={<ResumosArtigosLei />} />
              <Route path="/resumos-juridicos/artigos-lei/codigos" element={<ResumosArtigosLeiCodigos />} />
              <Route path="/resumos-juridicos/artigos-lei/estatutos" element={<ResumosArtigosLeiEstatutos />} />
              <Route path="/resumos-juridicos/artigos-lei/legislacao-penal" element={<ResumosArtigosLeiLegislacao />} />
              <Route path="/resumos-juridicos/artigos-lei/previdenciario" element={<ResumosArtigosLeiPrevidenciario />} />
              <Route path="/resumos-juridicos/artigos-lei/sumulas" element={<ResumosArtigosLeiSumulas />} />
              <Route path="/resumos-juridicos/artigos-lei/temas" element={<ResumosArtigosLeiTemas />} />
              <Route path="/resumos-juridicos/artigos-lei/view" element={<ResumosArtigosLeiView />} />
              <Route path="/plano-estudos" element={<PlanoEstudos />} />
              <Route path="/plano-estudos/resultado" element={<PlanoEstudosResultado />} />
              <Route path="/flashcards" element={<Navigate to="/flashcards/areas" replace />} />
              <Route path="/flashcards/escolha" element={<FlashcardsEscolha />} />
              <Route path="/flashcards/areas" element={<FlashcardsAreas />} />
              <Route path="/flashcards/temas" element={<FlashcardsTemas />} />
              <Route path="/flashcards/estudar" element={<FlashcardsEstudar />} />
              <Route path="/flashcards/artigos-lei" element={<FlashcardsArtigosLei />} />
              <Route path="/flashcards/artigos-lei/constituicao" element={<FlashcardsArtigosConstituicao />} />
              <Route path="/flashcards/artigos-lei/codigos" element={<FlashcardsArtigosCodigosLeis />} />
              <Route path="/flashcards/artigos-lei/estatutos" element={<FlashcardsArtigosEstatutos />} />
              <Route path="/flashcards/artigos-lei/legislacao-penal" element={<FlashcardsArtigosLegislacaoPenal />} />
              <Route path="/flashcards/artigos-lei/previdenciario" element={<FlashcardsArtigosPrevidenciario />} />
              <Route path="/flashcards/artigos-lei/sumulas" element={<FlashcardsArtigosSumulas />} />
              <Route path="/flashcards/artigos-lei/temas" element={<FlashcardsArtigosLeiTemas />} />
              <Route path="/flashcards/artigos-lei/estudar" element={<FlashcardsArtigosLeiEstudar />} />
              <Route path="/flashcards/complete-lei" element={<CompleteLeiCodigos />} />
              <Route path="/flashcards/complete-lei/artigos" element={<CompleteLeiArtigos />} />
              <Route path="/flashcards/complete-lei/exercicio" element={<CompleteLeiExercicio />} />
              <Route path="/tematicas" element={<Tematicas />} />
              <Route path="/tematica-juridica" element={<TematicaJuridica />} />
              
              <Route path="/oab-funcoes" element={<OABFuncoes />} />
              <Route path="/oab/o-que-estudar" element={<OABOQueEstudar />} />
              <Route path="/oab/o-que-estudar/:area" element={<OABOQueEstudarArea />} />
              <Route path="/oab/trilhas-aprovacao" element={<TrilhasAprovacao />} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId" element={<OABTrilhasMateria />} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId" element={<OABTrilhasTopicos />} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId/estudo/:resumoId" element={<OABTrilhasSubtemaEstudo />} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId/estudo/:resumoId/aula" element={<OABTrilhasAula />} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId/estudo/:resumoId/flashcards" element={<OABTrilhasSubtemaFlashcards />} />
              <Route path="/oab/trilhas-aprovacao/materia/:materiaId/topicos/:topicoId/estudo/:resumoId/questoes" element={<OABTrilhasSubtemaQuestoes />} />
              <Route path="/oab/trilhas-aprovacao/topico/:id" element={<OABTrilhasTopicoEstudo />} />
              <Route path="/oab/trilhas-aprovacao/topico/:id/flashcards" element={<OABTrilhasTopicoFlashcards />} />
              <Route path="/oab/trilhas-aprovacao/topico/:id/questoes" element={<OABTrilhasTopicoQuestoes />} />
              
              {/* Rotas legadas para compatibilidade */}
              <Route path="/oab/trilhas-aprovacao/:area" element={<TrilhaAreaTemas />} />
              <Route path="/oab/trilhas-aprovacao/:area/:tema" element={<TrilhaTemaSubtemas />} />
              <Route path="/oab/trilhas-aprovacao/:area/:tema/:subtemaId" element={<TrilhaSubtemaEstudo />} />
              
              {/* Ética Profissional OAB */}
              <Route path="/oab/trilhas-etica" element={<TrilhasEtica />} />
              <Route path="/oab/trilhas-etica/:temaId" element={<TrilhasEticaTema />} />
              <Route path="/oab/trilhas-etica/estudo/:temaId" element={<TrilhasEticaTemaEstudo />} />
              <Route path="/oab/trilhas-etica/topico/:topicoId" element={<TrilhasEticaEstudo />} />
              
              {/* Faculdade USP */}
              <Route path="/faculdade" element={<Navigate to="/estudos" replace />} />
              <Route path="/faculdade/trilhas" element={<FaculdadeInicio />} />
              <Route path="/faculdade/semestre/:numero" element={<FaculdadeSemestre />} />
              <Route path="/faculdade/disciplina/:codigo" element={<FaculdadeDisciplina />} />
              <Route path="/faculdade/topico/:id" element={<FaculdadeTopicoEstudo />} />
              <Route path="/faculdade/topico/:id/questoes" element={<FaculdadeTopicoQuestoes />} />
              
              {/* Dominando o Direito */}
              <Route path="/dominando" element={<Dominando />} />
              <Route path="/dominando/trilhas" element={<DominandoTrilhas />} />
              <Route path="/dominando/area/:areaNome" element={<DominandoArea />} />
              <Route path="/dominando/estudo/:disciplinaId" element={<DominandoEstudo />} />
              
              {/* Dashboard de Aulas */}
              <Route path="/aulas" element={<AulasPage />} />
              <Route path="/aulas/dashboard" element={<AulasDashboard />} />
              
              {/* Conceitos (Trilhas para Iniciantes) */}
              <Route path="/conceitos/trilhas" element={<ConceitosInicio />} />
              <Route path="/conceitos/trilhante" element={<ConceitosTrilhante />} />
              <Route path="/conceitos/livro/:trilha" element={<ConceitosLivro />} />
              <Route path="/conceitos/livro/tema/:id" element={<ConceitosLivroTema />} />
              <Route path="/conceitos/area/:areaOrdem" element={<ConceitosArea />} />
              <Route path="/conceitos/materia/:id" element={<ConceitosMateria />} />
              <Route path="/conceitos/topico/:id" element={<ConceitosTopicoEstudo />} />
              <Route path="/conceitos/topico/:id/flashcards" element={<ConceitosTopicoFlashcards />} />
              <Route path="/conceitos/topico/:id/questoes" element={<ConceitosTopicoQuestoes />} />
              
              <Route path="/oab/primeira-fase" element={<PrimeiraFase />} />
              <Route path="/oab/segunda-fase" element={<SegundaFase />} />
              <Route path="/oab/noticias" element={<NoticiasOAB />} />
              <Route path="/oab/noticias/:id" element={<NoticiaOABDetalhe />} />
              <Route path="/oab/faq" element={<FAQExameOAB />} />
              <Route path="/oab/calendario" element={<CalendarioOAB />} />
              <Route path="/oab/carreira" element={<OabCarreira />} />
              <Route path="/admin/trilhas-oab" element={<AdminTrilhasOAB />} />
              <Route path="/videoaulas-oab" element={<VideoaulasOAB />} />
              <Route path="/videoaulas-oab-1fase" element={<VideoaulasOABPrimeiraFase />} />
              <Route path="/videoaulas/oab" element={<Navigate to="/videoaulas-oab" replace />} />
              <Route path="/videoaulas/oab/:area" element={<VideoaulasOABArea />} />
              <Route path="/videoaulas/oab/:area/:id" element={<VideoaulasOABView />} />
              <Route path="/videoaulas/oab-1fase/:area" element={<VideoaulasOABAreaPrimeiraFase />} />
              <Route path="/videoaulas/oab-1fase/:area/:id" element={<VideoaulasOABViewPrimeiraFase />} />
              <Route path="/simulados" element={<SimuladosHub />} />
              <Route path="/simulados/tjsp" element={<SimuladoTJSPMaterias />} />
              <Route path="/simulados/tjsp/resolver" element={<SimuladoTJSP />} />
              <Route path="/simulados/antigos" element={<Simulados />} />
              <Route path="/simulados/exames" element={<SimuladosExames />} />
              <Route path="/simulados/personalizado" element={<SimuladosPersonalizado />} />
              <Route path="/simulados/realizar" element={<SimuladosRealizar />} />
              <Route path="/simulados/resultado" element={<SimuladosResultado />} />
              <Route path="/meus-pagamentos" element={<MeusPagamentos />} />
              <Route path="/audioaulas" element={<AudioaulasHub />} />
              <Route path="/audioaulas/categoria/:categoria" element={<AudioaulasCategoriaPage />} />
              <Route path="/audioaulas/:categoria/:area" element={<AudioaulasCategoria />} />
              <Route path="/audioaulas/audioaulas/:area" element={<AudioaulasTema />} />
              <Route path="/juriflix" element={<JuriFlix />} />
              <Route path="/juriflix/:id" element={<JuriFlixDetalhesEnhanced />} />
              <Route path="/juriflix-enriquecer" element={<JuriFlixEnriquecer />} />
              <Route path="/redacao" element={<Redacao />} />
              <Route path="/redacao/:categoria" element={<RedacaoCategoria />} />
              <Route path="/redacao/conteudo/:id" element={<RedacaoConteudo />} />
              <Route path="/advogado" element={<Advogado />} />
              <Route path="/advogado/modelos" element={<AdvogadoModelos />} />
              <Route path="/peticoes" element={<PeticoesContratosHub />} />
              <Route path="/advogado/criar" element={<AdvogadoCriar />} />
              <Route path="/advogado/processos" element={<AdvogadoProcessos />} />
              <Route path="/advogado/consulta-cnpj" element={<AdvogadoConsultaCNPJ />} />
              <Route path="/advogado/prazos" element={<AdvogadoPrazos />} />
              <Route path="/advogado/diario-oficial-uniao" element={<AdvogadoDiarioOficial />} />
              <Route path="/advogado/jurisprudencia" element={<AdvogadoJurisprudencia />} />
              <Route path="/advogado/contratos" element={<AdvogadoContratos />} />
              <Route path="/advogado/contratos/modelos" element={<AdvogadoContratosModelos />} />
              <Route path="/advogado/contratos/criar" element={<AdvogadoContratosCriar />} />
              <Route path="/videoaulas" element={<VideoaulasIniciante />} />
              <Route path="/videoaulas/iniciante" element={<VideoaulasIniciante />} />
              <Route path="/videoaulas/iniciante/:id" element={<VideoaulaInicianteView />} />
              <Route path="/videoaulas/faculdade" element={<VideoaulasFaculdade />} />
              <Route path="/videoaulas/faculdade/:area" element={<VideoaulasFaculdadeArea />} />
              <Route path="/videoaulas/faculdade/:area/:videoId" element={<VideoaulaFaculdadeView />} />
              <Route path="/videoaulas/areas" element={<VideoaulasAreasLista />} />
              <Route path="/videoaulas/areas/:area" element={<VideoaulasAreaVideos />} />
              <Route path="/videoaulas/areas/:area/:id" element={<VideoaulasAreaVideoView />} />
              <Route path="/videoaulas/area/:area" element={<VideoaulasArea />} />
              <Route path="/videoaulas/:area" element={<VideoaulasPlaylists />} />
              <Route path="/videoaulas/player" element={<VideoaulasPlayer />} />
              <Route path="/eleicoes" element={<Eleicoes />} />
              <Route path="/eleicoes/situacao" element={<EleicoesSituacao />} />
              <Route path="/eleicoes/candidatos" element={<EleicoesCandidatos />} />
              <Route path="/eleicoes/resultados" element={<EleicoesResultados />} />
              <Route path="/eleicoes/eleitorado" element={<EleicoesEleitorado />} />
              <Route path="/eleicoes/historico" element={<EleicoesHistorico />} />
              <Route path="/eleicoes/prestacao-contas" element={<EleicoesPrestacaoContas />} />
              <Route path="/eleicoes/legislacao" element={<EleicoesLegislacao />} />
              <Route path="/eleicoes/calendario" element={<EleicoesCalendario />} />
              <Route path="/camara-deputados" element={<CamaraDeputados />} />
              <Route path="/camara-deputados/deputados" element={<CamaraDeputadosLista />} />
              <Route path="/camara-deputados/deputado/:id" element={<CamaraDeputadoDetalhes />} />
              <Route path="/camara-deputados/proposicoes" element={<CamaraProposicoes />} />
              <Route path="/camara-deputados/proposicoes/:tipo" element={<CamaraProposicoesLista />} />
              <Route path="/camara-deputados/proposicao/:id" element={<CamaraProposicaoDetalhes />} />
          <Route path="/camara-deputados/votacoes" element={<CamaraVotacoes />} />
          <Route path="/camara-deputados/votacao/:id" element={<CamaraVotacaoDetalhes />} />
          <Route path="/camara-deputados/rankings" element={<CamaraRankings />} />
          <Route path="/camara-deputados/ranking/:tipo" element={<CamaraRankingDeputados />} />
          <Route path="/camara-deputados/blocos" element={<CamaraBlocos />} />
              <Route path="/camara-deputados/despesas" element={<CamaraDespesas />} />
              <Route path="/camara-deputados/eventos" element={<CamaraEventos />} />
              <Route path="/camara-deputados/orgaos" element={<CamaraOrgaos />} />
              <Route path="/camara-deputados/frentes" element={<CamaraFrentes />} />
              <Route path="/camara-deputados/partidos" element={<CamaraPartidos />} />
              <Route path="/camara-deputados/partidos/:id" element={<CamaraPartidoDetalhes />} />
              <Route path="/politica" element={<Politica />} />
              <Route path="/politica/noticias" element={<PoliticaNoticias />} />
              <Route path="/politica/noticias/:id" element={<NoticiaPoliticaDetalhes />} />
              <Route path="/politica/rankings" element={<PoliticaRankings />} />
              <Route path="/politica/rankings/unificado" element={<RankingUnificado />} />
              <Route path="/politica/rankings/metodologia" element={<MetodologiaRanking />} />
              <Route path="/politica/rankings/:tipo" element={<CamaraRankingDeputados />} />
              <Route path="/politica/rankings/senadores/:tipo" element={<SenadoRankingDetalhes />} />
              <Route path="/politica/comparador" element={<ComparadorPoliticos />} />
              <Route path="/politica/blog" element={<PoliticaBlog />} />
              <Route path="/politica/blog/:id" element={<PoliticaBlogArtigo />} />
              <Route path="/politica/como-funciona" element={<PoliticaComoFunciona />} />
              <Route path="/politica/como-funciona/:topico" element={<PoliticaComoFuncionaView />} />
              <Route path="/politica/estudos/:orientacao" element={<PoliticaEstudos />} />
              <Route path="/politica/livro/:livroId" element={<PoliticaLivroDetalhe />} />
              <Route path="/politica/artigo/:artigoId" element={<PoliticaArtigoView />} />
              <Route path="/politica/documentario/:documentarioId" element={<PoliticaDocumentarioDetalhe />} />
              <Route path="/processo" element={<Processo />} />
              <Route path="/noticias-juridicas" element={<NoticiasJuridicas />} />
              <Route path="/noticias-juridicas/:noticiaId" element={<NoticiaDetalhes />} />
              <Route path="/noticia-webview" element={<NoticiaWebView />} />
              <Route path="/jurisprudencia-webview" element={<JurisprudenciaWebView />} />
              <Route path="/noticia-analise" element={<NoticiaAnalise />} />
              <Route path="/resumo-do-dia/:tipo" element={<ResumoDoDia />} />
              <Route path="/ranking-faculdades" element={<RankingFaculdades />} />
              <Route path="/ranking-faculdades/:id" element={<RankingFaculdadeDetalhes />} />
              <Route path="/novidades" element={<Novidades />} />
              <Route path="/stj/atualizacoes" element={<AtualizacoesSTJ />} />
              <Route path="/stj/pesquisa-pronta" element={<PesquisaProntaSTJ />} />
              <Route path="/ferramentas/documentarios-juridicos" element={<DocumentariosJuridicos />} />
              <Route path="/ferramentas/documentarios-juridicos/:id" element={<DocumentarioDetalhes />} />
              <Route path="/ferramentas/ajuste-documentarios" element={<AjusteDocumentarios />} />
              <Route path="/ferramentas/tcc" element={<TCCHub />} />
              <Route path="/ferramentas/tcc/buscar" element={<TCCBuscar />} />
              <Route path="/ferramentas/tcc/sugestoes" element={<TCCSugestoes />} />
              <Route path="/ferramentas/tcc/tendencias" element={<TCCTendencias />} />
              <Route path="/ferramentas/tcc/salvos" element={<TCCSalvos />} />
              <Route path="/ferramentas/tcc/:id" element={<TCCDetalhes />} />
              
              {/* Senado Federal */}
              <Route path="/ferramentas/senado" element={<SenadoHub />} />
              <Route path="/ferramentas/senado/senadores" element={<SenadoSenadores />} />
              <Route path="/ferramentas/senado/senador/:codigo" element={<SenadoSenadorDetalhes />} />
              <Route path="/senado/senador/:id" element={<SenadoSenadorDetalhes />} />
              <Route path="/ferramentas/senado/votacoes" element={<SenadoVotacoes />} />
              <Route path="/ferramentas/senado/materias" element={<SenadoMaterias />} />
              <Route path="/ferramentas/senado/comissoes" element={<SenadoComissoes />} />
              <Route path="/ferramentas/senado/comissao/:codigo" element={<SenadoComissaoDetalhes />} />
              <Route path="/ferramentas/senado/agenda" element={<SenadoAgenda />} />
              <Route path="/ferramentas/atualizacao-lei-final" element={<AtualizacaoLeiFinal />} />
              <Route path="/ferramentas/atualizar-lei" element={<AtualizarLeiHub />} />
              
              <Route path="/suporte" element={<Suporte />} />
              <Route path="/ajuda" element={<Ajuda />} />
              <Route path="/numeros-detalhes" element={<NumerosDetalhes />} />
              <Route path="/assistente-pessoal" element={<AssistentePessoal />} />
              <Route path="/meu-brasil" element={<MeuBrasil />} />
              <Route path="/meu-brasil/historia" element={<MeuBrasilHistoria />} />
              <Route path="/meu-brasil/historia/:periodo" element={<MeuBrasilHistoriaView />} />
              <Route path="/meu-brasil/sistemas" element={<MeuBrasilSistemas />} />
              <Route path="/meu-brasil/juristas" element={<MeuBrasilJuristas />} />
              <Route path="/meu-brasil/jurista/:nome" element={<MeuBrasilJuristaView />} />
              <Route path="/meu-brasil/instituicoes" element={<MeuBrasilInstituicoes />} />
              <Route path="/meu-brasil/instituicao/:titulo" element={<MeuBrasilArtigo />} />
              <Route path="/meu-brasil/casos" element={<MeuBrasilCasos />} />
              <Route path="/meu-brasil/busca" element={<MeuBrasilBusca />} />
              <Route path="/meu-brasil/artigo/:titulo" element={<MeuBrasilArtigo />} />
              <Route path="/meu-brasil/sistema/:titulo" element={<MeuBrasilArtigo />} />
              <Route path="/meu-brasil/caso/:titulo" element={<MeuBrasilArtigo />} />
              <Route path="/meu-brasil/documentario/:nome" element={<DocumentarioMinistro />} />
              <Route path="/popular-meu-brasil" element={<PopularMeuBrasil />} />
              <Route path="/popular-sumulas-stj" element={<PopularSumulasSTJ />} />
              <Route path="/popular-cpm" element={<PopularCPM />} />
              <Route path="/popular-cpm-manual" element={<PopularCPMManual />} />
            <Route path="/simulados/tjsp" element={<SimuladosTJSP />} />
            <Route path="/popular-simulado-tjsp" element={<PopularSimuladoTJSP />} />
              <Route path="/iniciando-direito" element={<IniciandoDireito />} />
              <Route path="/iniciando-direito/todos" element={<IniciandoDireitoTodos />} />
              <Route path="/iniciando-direito/:area/sobre" element={<IniciandoDireitoSobre />} />
              <Route path="/iniciando-direito/:area/temas" element={<IniciandoDireitoTemas />} />
              <Route path="/iniciando-direito/:area/aula/:tema" element={<IniciandoDireitoAula />} />
              <Route path="/simulacao-juridica" element={<SimulacaoJuridica />} />
              <Route path="/simulacao-juridica/modo" element={<SimulacaoEscolhaModo />} />
              <Route path="/simulacao-juridica/areas" element={<SimulacaoAreas />} />
              <Route path="/simulacao-juridica/escolha-estudo/:area" element={<SimulacaoEscolhaEstudo />} />
              <Route path="/simulacao-juridica/temas/:area" element={<SimulacaoTemas />} />
              <Route path="/simulacao-juridica/artigos/:area" element={<SimulacaoArtigos />} />
              <Route path="/simulacao-juridica/escolha-caso" element={<SimulacaoEscolhaCaso />} />
              <Route path="/simulacao-juridica/audiencia/:id" element={<SimulacaoAudienciaNew />} />
              <Route path="/simulacao-juridica/audiencia-juiz/:id" element={<SimulacaoAudienciaJuiz />} />
              <Route path="/simulacao-juridica/feedback/:id" element={<SimulacaoFeedback />} />
              <Route path="/simulacao-juridica/feedback-juiz/:id" element={<SimulacaoFeedbackJuiz />} />
              <Route path="/simulacao-juridica/avatar" element={<SimulacaoAvatar />} />
              <Route path="/simulacao-juridica/caso/:id" element={<SimulacaoCaso />} />
              <Route path="/jogos-juridicos" element={<JogosJuridicos />} />
              <Route path="/jogos-juridicos/:tipo/config" element={<JogoConfig />} />
              <Route path="/jogos-juridicos/:tipo/jogar" element={<JogoRouter />} />
              <Route path="/admin" element={<AdminHub />} />
              <Route path="/admin/geracao" element={<GeracaoCentral />} />
              <Route path="/admin/verificar-ocr" element={<AdminVerificarOcr />} />
              <Route path="/admin/gerar-tutoriais" element={<AdminGerarTutoriais />} />
              <Route path="/admin/raspar-leis" element={<RasparLeis />} />
              <Route path="/admin/atualizar-lei/:tableName" element={<AtualizarLei />} />
              <Route path="/admin/narracao" element={<NarracaoArtigos />} />
              <Route path="/admin/geracao-fundos" element={<GeracaoFundos />} />
              <Route path="/admin/gerar-questoes" element={<GerarQuestoesAdmin />} />
              <Route path="/admin/historico-leis" element={<HistoricoLeis />} />
              <Route path="/admin/posts-juridicos" element={<PostsJuridicosAdmin />} />
              <Route path="/admin/push-legislacao" element={<AdminPushLegislacao />} />
              <Route path="/admin/monitoramento-leis" element={<MonitoramentoLeis />} />
              <Route path="/admin/leitura-dinamica" element={<AdminLeituraDinamica />} />
              <Route path="/admin/base-conhecimento-oab" element={<AdminBaseConhecimentoOAB />} />
              <Route path="/admin/notificacoes-push" element={<AdminNotificacoesPush />} />
              <Route path="/admin/sincronizar-peticoes" element={<AdminSincronizarPeticoes />} />
              <Route path="/admin/extracao-peticoes" element={<AdminExtracaoPeticoes />} />
              <Route path="/admin/otimizar-imagens" element={<OtimizarImagens />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/assinaturas" element={<AdminAssinaturas />} />
              <Route path="/admin/evelyn-usuarios" element={<AdminEvelynUsuarios />} />
              <Route path="/admin/boletins" element={<AdminBoletins />} />
              <Route path="/admin/evelyn-metricas" element={<EvelynMetricas />} />
              <Route path="/admin/importar-instagram" element={<ImportarInstagram />} />
              <Route path="/admin/controle" element={<AdminControle />} />
              <Route path="/posts-juridicos" element={<PostsJuridicos />} />
              <Route path="/cancelar-push" element={<CancelarPush />} />
              <Route path="/tutoriais" element={<TutoriaisHub />} />
              <Route path="/tutoriais/:secao" element={<TutorialPage />} />
              
              {/* Diário Oficial */}
              <Route path="/diario-oficial" element={<DiarioOficialHub />} />
              <Route path="/diario-oficial/busca" element={<BuscaDiarios />} />
              <Route path="/diario-oficial/cnpj" element={<ConsultaCnpj />} />
              <Route path="/diario-oficial/temas" element={<BuscaPorTema />} />
              <Route path="/diario-oficial/cidades" element={<ExplorarCidades />} />
              <Route path="/diario-oficial/dashboard" element={<DashboardNacional />} />
              
              {/* Três Poderes */}
              <Route path="/tres-poderes" element={<TresPoderes />} />
              <Route path="/tres-poderes/executivo" element={<TresPoderesExecutivo />} />
              <Route path="/tres-poderes/executivo/presidente/:nome" element={<TresPoderesBiografia />} />
              <Route path="/tres-poderes/legislativo" element={<TresPoderesLegislativo />} />
              <Route path="/tres-poderes/legislativo/deputado/:id" element={<TresPoderesBiografia />} />
              <Route path="/tres-poderes/legislativo/senador/:id" element={<TresPoderesBiografia />} />
              <Route path="/tres-poderes/judiciario" element={<TresPoderesJudiciario />} />
              <Route path="/tres-poderes/judiciario/ministro/:nome" element={<TresPoderesBiografia />} />
              
               {/* Categorias do Direito */}
              <Route path="/categorias/:categoria" element={<CategoriasMateriasPage />} />
              <Route path="/categorias/topico/:id" element={<CategoriasTopicoEstudo />} />
              <Route path="/categorias/topico/:id/flashcards" element={<CategoriasTopicoFlashcards />} />
              <Route path="/categorias/topico/:id/questoes" element={<CategoriasTopicoQuestoes />} />
              <Route path="/categorias/progresso" element={<CategoriasProgresso />} />
              <Route path="/categorias/historico" element={<CategoriasHistorico />} />
              <Route path="/categorias/estatisticas" element={<CategoriasEstatisticas />} />

               {/* Carreiras Jurídicas */}
              <Route path="/carreiras-juridicas" element={<CarreirasJuridicas />} />
              <Route path="/estudo-carreira/:carreira" element={<EstudoCarreira />} />

              {/* Legal */}
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
              
              <Route path="*" element={<NotFound />} />
              </Routes>
              </Layout>
              <GlobalAudioPlayer />
              <AmbientSoundPlayer />
              </AmbientSoundProvider>
            </AudioPlayerProvider>
              } />
            </Routes>
            </TutorialProvider>
          </BrowserRouter>
        </NarrationPlayerProvider>
        </SubscriptionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
