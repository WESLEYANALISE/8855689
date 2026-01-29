import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Mapeamento de tabelas de leis
const TABELAS_LEIS: Record<string, string> = {
  'cf': 'CF - Constituição Federal',
  'cc': 'CC - Código Civil',
  'cp': 'CP - Código Penal',
  'cpc': 'CPC - Código de Processo Civil',
  'cpp': 'CPP - Código de Processo Penal',
  'clt': 'CLT - Consolidação das Leis do Trabalho',
  'cdc': 'CDC – Código de Defesa do Consumidor',
  'eca': 'ECA – Estatuto da Criança e do Adolescente',
  'ctb': 'CTB - Código de Trânsito Brasileiro',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const apiKey = req.headers.get('x-api-key') || url.searchParams.get('api_key');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar API Key
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'API Key é obrigatória. Use o header "x-api-key" ou parâmetro "api_key".',
          docs: 'Solicite sua API Key para acessar a API da Evelyn.'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar API Key
    const { data: keyData, error: keyError } = await supabase
      .from('evelyn_api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('ativo', true)
      .single();

    if (keyError || !keyData) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'API Key inválida ou inativa.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permissões
    const permissoes = keyData.permissoes || [];
    
    // Atualizar último uso e contador
    await supabase
      .from('evelyn_api_keys')
      .update({ 
        ultimo_uso: new Date().toISOString(),
        total_requests: (keyData.total_requests || 0) + 1
      })
      .eq('id', keyData.id);

    // Rate limiting simples (baseado no último minuto)
    // TODO: Implementar rate limiting mais robusto com Redis/cache

    if (!action) {
      return new Response(
        JSON.stringify({
          success: true,
          api: 'Evelyn API Pública',
          versao: '1.0',
          endpoints: [
            { action: 'artigo', params: 'numero, codigo', desc: 'Consultar artigo de lei' },
            { action: 'buscar_lei', params: 'termo, limite', desc: 'Buscar artigos por termo' },
            { action: 'flashcard', params: 'area, tema', desc: 'Obter flashcard aleatório' },
            { action: 'estatisticas', params: '', desc: 'Estatísticas da Evelyn' },
            { action: 'usuario', params: 'telefone', desc: 'Dados de um usuário' },
            { action: 'codigos', params: '', desc: 'Lista de códigos disponíveis' }
          ],
          sua_key: {
            nome: keyData.nome,
            permissoes: permissoes,
            requests_total: keyData.total_requests || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let resultado: any;

    switch (action) {
      case 'artigo': {
        if (!permissoes.includes('artigo')) {
          return errorPermissao('artigo');
        }
        
        const numero = url.searchParams.get('numero');
        const codigo = url.searchParams.get('codigo')?.toLowerCase();

        if (!numero || !codigo) {
          return errorParams('numero e codigo são obrigatórios. Ex: ?action=artigo&numero=5&codigo=cf');
        }

        const tabela = TABELAS_LEIS[codigo];
        if (!tabela) {
          return errorParams(`Código "${codigo}" não encontrado. Use: ${Object.keys(TABELAS_LEIS).join(', ')}`);
        }

        const { data: artigos } = await supabase
          .from(tabela)
          .select('"Número do Artigo", "Artigo", "Comentario", "explicacao_resumido", "Narração"')
          .ilike('"Número do Artigo"', `%${numero}%`)
          .limit(1);

        if (!artigos || artigos.length === 0) {
          resultado = { encontrado: false, mensagem: `Artigo ${numero} não encontrado em ${tabela}` };
        } else {
          const art = artigos[0];
          resultado = {
            encontrado: true,
            artigo: {
              numero: art['Número do Artigo'],
              texto: art['Artigo'],
              comentario: art['Comentario'],
              explicacao: art['explicacao_resumido'],
              narracao_url: art['Narração']
            },
            codigo: { sigla: codigo.toUpperCase(), nome: tabela }
          };
        }
        break;
      }

      case 'buscar_lei': {
        if (!permissoes.includes('buscar_lei')) {
          return errorPermissao('buscar_lei');
        }

        const termo = url.searchParams.get('termo');
        const codigo = url.searchParams.get('codigo')?.toLowerCase();
        const limite = parseInt(url.searchParams.get('limite') || '10');

        if (!termo) {
          return errorParams('termo é obrigatório. Ex: ?action=buscar_lei&termo=furto');
        }

        const tabela = codigo ? TABELAS_LEIS[codigo] : 'CP - Código Penal';

        const { data: artigos } = await supabase
          .from(tabela || 'CP - Código Penal')
          .select('"Número do Artigo", "Artigo"')
          .or(`Artigo.ilike.%${termo}%,Comentario.ilike.%${termo}%`)
          .limit(Math.min(limite, 50));

        resultado = {
          termo,
          codigo: tabela,
          total_encontrados: artigos?.length || 0,
          artigos: artigos?.map((a: any) => ({
            numero: a['Número do Artigo'],
            trecho: a['Artigo']?.substring(0, 300) + '...'
          })) || []
        };
        break;
      }

      case 'flashcard': {
        if (!permissoes.includes('flashcard')) {
          return errorPermissao('flashcard');
        }

        const area = url.searchParams.get('area');
        const tema = url.searchParams.get('tema');

        let query = supabase
          .from('FLASHCARDS_GERADOS')
          .select('id, area, tema, pergunta, resposta, exemplo, base_legal');

        if (area) {
          query = query.ilike('area', `%${area}%`);
        }
        if (tema) {
          query = query.ilike('tema', `%${tema}%`);
        }

        // Pegar aleatório
        const { count } = await supabase
          .from('FLASHCARDS_GERADOS')
          .select('*', { count: 'exact', head: true });

        const randomOffset = Math.floor(Math.random() * Math.min(count || 100, 1000));

        const { data: flashcards } = await query.range(randomOffset, randomOffset);

        if (!flashcards || flashcards.length === 0) {
          resultado = { encontrado: false, mensagem: 'Nenhum flashcard encontrado' };
        } else {
          const f = flashcards[0];
          resultado = {
            encontrado: true,
            flashcard: {
              id: f.id,
              area: f.area,
              tema: f.tema,
              pergunta: f.pergunta,
              resposta: f.resposta,
              exemplo: f.exemplo,
              base_legal: f.base_legal
            }
          };
        }
        break;
      }

      case 'estatisticas': {
        if (!permissoes.includes('estatisticas')) {
          return errorPermissao('estatisticas');
        }

        // Buscar métricas recentes
        const { data: metricasRecentes } = await supabase
          .from('evelyn_metricas_diarias')
          .select('*')
          .order('data', { ascending: false })
          .limit(7);

        const { count: totalUsuarios } = await supabase
          .from('evelyn_usuarios')
          .select('*', { count: 'exact', head: true });

        const { count: totalMensagens } = await supabase
          .from('evelyn_mensagens')
          .select('*', { count: 'exact', head: true });

        const { count: totalConversas } = await supabase
          .from('evelyn_conversas')
          .select('*', { count: 'exact', head: true });

        resultado = {
          totais: {
            usuarios: totalUsuarios || 0,
            mensagens: totalMensagens || 0,
            conversas: totalConversas || 0
          },
          ultimos_7_dias: metricasRecentes || []
        };
        break;
      }

      case 'usuario': {
        const telefone = url.searchParams.get('telefone');

        if (!telefone) {
          return errorParams('telefone é obrigatório');
        }

        const { data: usuario } = await supabase
          .from('evelyn_usuarios')
          .select('id, nome, telefone, created_at, ativo')
          .eq('telefone', telefone.replace(/\D/g, ''))
          .single();

        if (!usuario) {
          resultado = { encontrado: false };
        } else {
          // Buscar progresso
          const { data: progresso } = await supabase
            .from('evelyn_progresso_usuario')
            .select('area, tema, artigos_estudados, flashcards_corretos, nivel')
            .eq('usuario_id', usuario.id)
            .limit(10);

          resultado = {
            encontrado: true,
            usuario: {
              nome: usuario.nome,
              membro_desde: usuario.created_at,
              ativo: usuario.ativo
            },
            progresso: progresso || []
          };
        }
        break;
      }

      case 'codigos': {
        resultado = {
          codigos_disponiveis: Object.entries(TABELAS_LEIS).map(([sigla, nome]) => ({
            sigla,
            nome
          }))
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Ação "${action}" não reconhecida`,
            acoes_disponiveis: ['artigo', 'buscar_lei', 'flashcard', 'estatisticas', 'usuario', 'codigos']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const tempoProcessamento = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        action,
        data: resultado,
        meta: {
          tempo_ms: tempoProcessamento,
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[evelyn-api-publica] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function errorPermissao(acao: string) {
  return new Response(
    JSON.stringify({ 
      success: false,
      error: `Sua API Key não tem permissão para a ação "${acao}"`
    }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function errorParams(mensagem: string) {
  return new Response(
    JSON.stringify({ success: false, error: mensagem }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
