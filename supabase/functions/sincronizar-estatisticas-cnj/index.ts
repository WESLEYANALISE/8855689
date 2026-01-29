import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dados estáticos simulados do CNJ DataJud (baseados em dados públicos)
// Em produção, isso seria substituído por chamadas reais à API DataJud
const DADOS_CNJ = {
  kpis: {
    casos_novos: 28500000,
    casos_pendentes: 82400000,
    casos_baixados: 31200000,
    taxa_congestionamento: 68.4,
    iad: 1.09,
    tempo_medio_baixa: 918,
    magistrados_ativos: 18200,
    servidores_ativos: 267000,
    despesa_total: 115000000000,
    custo_processo: 1395
  },
  tribunais: [
    { sigla: "TJSP", nome: "Tribunal de Justiça de São Paulo", novos: 6200000, pendentes: 24500000, baixados: 6800000, congestionamento: 78.2 },
    { sigla: "TJRJ", nome: "Tribunal de Justiça do Rio de Janeiro", novos: 2800000, pendentes: 12300000, baixados: 2900000, congestionamento: 80.9 },
    { sigla: "TJMG", nome: "Tribunal de Justiça de Minas Gerais", novos: 2100000, pendentes: 7800000, baixados: 2200000, congestionamento: 71.8 },
    { sigla: "TJRS", nome: "Tribunal de Justiça do Rio Grande do Sul", novos: 1500000, pendentes: 4200000, baixados: 1600000, congestionamento: 65.4 },
    { sigla: "TJPR", nome: "Tribunal de Justiça do Paraná", novos: 1200000, pendentes: 3100000, baixados: 1300000, congestionamento: 62.8 },
    { sigla: "TRF1", nome: "Tribunal Regional Federal 1ª Região", novos: 890000, pendentes: 2800000, baixados: 920000, congestionamento: 67.2 },
    { sigla: "TRF3", nome: "Tribunal Regional Federal 3ª Região", novos: 750000, pendentes: 2100000, baixados: 780000, congestionamento: 64.5 },
    { sigla: "TRT2", nome: "Tribunal Regional do Trabalho 2ª Região", novos: 680000, pendentes: 1500000, baixados: 720000, congestionamento: 52.3 },
    { sigla: "TST", nome: "Tribunal Superior do Trabalho", novos: 420000, pendentes: 980000, baixados: 450000, congestionamento: 54.1 },
    { sigla: "STJ", nome: "Superior Tribunal de Justiça", novos: 380000, pendentes: 520000, baixados: 410000, congestionamento: 43.2 },
  ],
  assuntos: [
    { nome: "Obrigações", quantidade: 4850000, percentual: 17.0 },
    { nome: "Responsabilidade Civil", quantidade: 3420000, percentual: 12.0 },
    { nome: "Contratos", quantidade: 2850000, percentual: 10.0 },
    { nome: "Direito de Família", quantidade: 2560000, percentual: 9.0 },
    { nome: "Direito do Consumidor", quantidade: 2280000, percentual: 8.0 },
    { nome: "Direito Tributário", quantidade: 1990000, percentual: 7.0 },
    { nome: "Direito Previdenciário", quantidade: 1710000, percentual: 6.0 },
    { nome: "Direito Penal", quantidade: 1420000, percentual: 5.0 },
    { nome: "Direito Trabalhista", quantidade: 1140000, percentual: 4.0 },
    { nome: "Direito Administrativo", quantidade: 850000, percentual: 3.0 },
    { nome: "Outros", quantidade: 5430000, percentual: 19.0 }
  ],
  classes: [
    { nome: "Procedimento Comum Cível", quantidade: 8200000, percentual: 28.8 },
    { nome: "Execução Fiscal", quantidade: 5100000, percentual: 17.9 },
    { nome: "Cumprimento de Sentença", quantidade: 3800000, percentual: 13.3 },
    { nome: "Procedimento Especial", quantidade: 2900000, percentual: 10.2 },
    { nome: "Ação Penal", quantidade: 2100000, percentual: 7.4 },
    { nome: "Juizado Especial Cível", quantidade: 1800000, percentual: 6.3 },
    { nome: "Execução de Título", quantidade: 1500000, percentual: 5.3 },
    { nome: "Recurso Inominado", quantidade: 1200000, percentual: 4.2 },
    { nome: "Habeas Corpus", quantidade: 450000, percentual: 1.6 },
    { nome: "Mandado de Segurança", quantidade: 380000, percentual: 1.3 },
    { nome: "Outros", quantidade: 1070000, percentual: 3.7 }
  ],
  tempos: {
    tempo_inicio_baixa: 918,
    tempo_pendente: 1348,
    tempo_conhecimento: 765,
    tempo_execucao: 1520,
    por_grau: [
      { grau: "1º Grau", tempo_medio: 1245 },
      { grau: "2º Grau", tempo_medio: 342 },
      { grau: "Tribunais Superiores", tempo_medio: 287 },
      { grau: "Juizados Especiais", tempo_medio: 198 }
    ]
  },
  conciliacao: {
    taxa_conciliacao: 12.5,
    acordos_realizados: 3200000,
    economia_estimada: 15000000000,
    por_area: [
      { area: "Família", taxa: 28.3 },
      { area: "Consumidor", taxa: 22.1 },
      { area: "Trabalhista", taxa: 31.5 },
      { area: "Cível", taxa: 15.2 },
      { area: "Previdenciário", taxa: 8.4 }
    ]
  },
  processos_antigos: {
    total_15_anos: 890000,
    percentual_acervo: 1.1,
    meta_reducao: 30,
    por_tribunal: [
      { sigla: "TJSP", quantidade: 245000 },
      { sigla: "TJRJ", quantidade: 156000 },
      { sigla: "TJMG", quantidade: 98000 },
      { sigla: "TRF1", quantidade: 87000 },
      { sigla: "TRF3", quantidade: 72000 },
      { sigla: "TRT2", quantidade: 54000 },
      { sigla: "TJRS", quantidade: 48000 },
      { sigla: "Outros", quantidade: 130000 }
    ]
  },
  indicadores: {
    taxa_recorribilidade_interna: 8.2,
    taxa_recorribilidade_externa: 6.5,
    taxa_reforma_decisao: 12.3,
    processos_sentenciados: 26800000,
    decisoes_terminativas: 31200000,
    audiencias_realizadas: 4500000,
    sentenças_homologatórias: 2100000
  },
  mapas: [
    { uf: "SP", novos: 6200000, pendentes: 24500000, taxa: 78.2 },
    { uf: "RJ", novos: 2800000, pendentes: 12300000, taxa: 80.9 },
    { uf: "MG", novos: 2100000, pendentes: 7800000, taxa: 71.8 },
    { uf: "RS", novos: 1500000, pendentes: 4200000, taxa: 65.4 },
    { uf: "PR", novos: 1200000, pendentes: 3100000, taxa: 62.8 },
    { uf: "BA", novos: 980000, pendentes: 3500000, taxa: 72.1 },
    { uf: "SC", novos: 850000, pendentes: 2100000, taxa: 59.8 },
    { uf: "GO", novos: 720000, pendentes: 2800000, taxa: 74.5 },
    { uf: "PE", novos: 680000, pendentes: 2400000, taxa: 71.2 },
    { uf: "CE", novos: 620000, pendentes: 2100000, taxa: 70.5 },
    { uf: "DF", novos: 580000, pendentes: 1800000, taxa: 68.9 },
    { uf: "ES", novos: 420000, pendentes: 1500000, taxa: 72.3 },
    { uf: "MT", novos: 380000, pendentes: 1200000, taxa: 68.4 },
    { uf: "MS", novos: 320000, pendentes: 980000, taxa: 67.2 },
    { uf: "PA", novos: 380000, pendentes: 1400000, taxa: 73.5 },
    { uf: "AM", novos: 280000, pendentes: 850000, taxa: 67.8 },
    { uf: "MA", novos: 310000, pendentes: 1100000, taxa: 71.9 },
    { uf: "RN", novos: 240000, pendentes: 780000, taxa: 69.4 },
    { uf: "PB", novos: 220000, pendentes: 720000, taxa: 68.7 },
    { uf: "PI", novos: 180000, pendentes: 580000, taxa: 69.1 },
    { uf: "AL", novos: 190000, pendentes: 620000, taxa: 69.8 },
    { uf: "SE", novos: 150000, pendentes: 480000, taxa: 68.2 },
    { uf: "TO", novos: 120000, pendentes: 380000, taxa: 68.5 },
    { uf: "RO", novos: 140000, pendentes: 420000, taxa: 67.5 },
    { uf: "AC", novos: 65000, pendentes: 180000, taxa: 64.2 },
    { uf: "AP", novos: 55000, pendentes: 150000, taxa: 63.8 },
    { uf: "RR", novos: 42000, pendentes: 120000, taxa: 65.1 }
  ]
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔄 Iniciando sincronização das estatísticas do CNJ...");
    console.log("⏰ Horário da execução:", new Date().toISOString());

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dataAtual = new Date().toISOString();
    const tipos = ['kpis', 'tribunais', 'assuntos', 'classes', 'tempos', 'conciliacao', 'processos_antigos', 'indicadores', 'mapas'];
    
    let totalAtualizados = 0;
    let erros: string[] = [];

    for (const tipo of tipos) {
      try {
        const dados = DADOS_CNJ[tipo as keyof typeof DADOS_CNJ];
        
        if (!dados) {
          console.log(`⚠️ Dados não encontrados para tipo: ${tipo}`);
          continue;
        }

        // Verificar se já existe registro para este tipo
        const { data: existente } = await supabase
          .from('cache_estatisticas_cnj')
          .select('id')
          .eq('tipo', tipo)
          .eq('periodo', 'ano')
          .single();

        if (existente) {
          // Atualizar registro existente
          const { error } = await supabase
            .from('cache_estatisticas_cnj')
            .update({
              dados: dados,
              updated_at: dataAtual
            })
            .eq('id', existente.id);

          if (error) {
            console.error(`❌ Erro ao atualizar ${tipo}:`, error);
            erros.push(`${tipo}: ${error.message}`);
          } else {
            console.log(`✅ Atualizado: ${tipo}`);
            totalAtualizados++;
          }
        } else {
          // Inserir novo registro
          const { error } = await supabase
            .from('cache_estatisticas_cnj')
            .insert({
              tipo: tipo,
              periodo: 'ano',
              ramo_justica: 'todos',
              dados: dados
            });

          if (error) {
            console.error(`❌ Erro ao inserir ${tipo}:`, error);
            erros.push(`${tipo}: ${error.message}`);
          } else {
            console.log(`✅ Inserido: ${tipo}`);
            totalAtualizados++;
          }
        }
      } catch (err) {
        console.error(`❌ Erro ao processar ${tipo}:`, err);
        erros.push(`${tipo}: ${String(err)}`);
      }
    }

    const resultado = {
      sucesso: erros.length === 0,
      mensagem: `Sincronização concluída: ${totalAtualizados}/${tipos.length} tipos atualizados`,
      data_execucao: dataAtual,
      tipos_atualizados: totalAtualizados,
      erros: erros.length > 0 ? erros : undefined
    };

    console.log("📊 Resultado da sincronização:", resultado);

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Erro fatal na sincronização:", error);
    return new Response(JSON.stringify({
      sucesso: false,
      erro: String(error),
      data_execucao: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
