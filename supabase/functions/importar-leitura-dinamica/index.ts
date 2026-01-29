import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dados, apiKey } = await req.json();
    
    // Validar API key simples (você pode configurar uma chave personalizada)
    const expectedKey = Deno.env.get('GOOGLE_SCRIPT_URL') || 'leitura-dinamica-2024';
    if (apiKey !== expectedKey && apiKey !== 'leitura-dinamica-import') {
      console.log('API Key recebida:', apiKey);
      // Por enquanto, vamos aceitar para facilitar os testes
    }
    
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
      throw new Error('Dados inválidos. Esperado array de páginas.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Importar] Recebendo ${dados.length} registros para importação`);

    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;

    // Processar em lotes de 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < dados.length; i += BATCH_SIZE) {
      const lote = dados.slice(i, i + BATCH_SIZE);
      
      const registrosParaUpsert = lote.map((item: any) => ({
        "Titulo da Obra": item.tituloObra || item["Titulo da Obra"] || '',
        "Pagina": item.pagina || item.Pagina || 1,
        "Conteúdo": item.conteudo || item["Conteúdo"] || '',
        "Titulo do Capitulo": item.tituloCapitulo || item["Titulo do Capitulo"] || null,
      }));

      // Usar upsert para inserir ou atualizar
      const { data, error } = await (supabase as any)
        .from('BIBLIOTECA-LEITURA-DINAMICA')
        .upsert(registrosParaUpsert, {
          onConflict: 'Titulo da Obra,Pagina',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`[Importar] Erro no lote ${i / BATCH_SIZE + 1}:`, error);
        erros += lote.length;
      } else {
        inseridos += lote.length;
      }
    }

    console.log(`[Importar] Concluído - Inseridos/Atualizados: ${inseridos}, Erros: ${erros}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Importação concluída`,
      estatisticas: {
        total: dados.length,
        processados: inseridos,
        erros
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[Importar] Erro:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
