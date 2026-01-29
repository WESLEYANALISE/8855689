import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para buscar súmula do site tesesesumulas.com.br
async function buscarSumula(numero: number): Promise<{ titulo: string; texto: string; data: string } | null> {
  try {
    const url = `https://tesesesumulas.com.br/sumula/stj/${numero}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Erro ao buscar súmula ${numero}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    if (!doc) {
      console.error(`Erro ao parsear HTML da súmula ${numero}`);
      return null;
    }
    
    // Extrair o texto da súmula
    const tdElements = doc.querySelectorAll('td');
    let textoCompleto = '';
    let dataPublicacao = '';
    
    for (const td of tdElements) {
      const text = td.textContent.trim();
      
      // Buscar a data de publicação
      if (text.includes('Publicada em')) {
        const match = text.match(/Publicada em (\d{2}\/\d{2}\/\d{4})/);
        if (match) {
          dataPublicacao = match[1];
        }
      }
      
      // Buscar o texto da súmula
      if (text.includes(`Súmula ${numero}`)) {
        textoCompleto = text;
        break;
      }
    }
    
    if (!textoCompleto) {
      console.error(`Texto não encontrado para súmula ${numero}`);
      return null;
    }
    
    // Extrair apenas o texto da súmula (remover metadados)
    const lines = textoCompleto.split('\n');
    let textoSumula = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('Súmula') && i + 1 < lines.length) {
        // Pegar a linha seguinte que contém o texto
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.includes('DIREITO') && !nextLine.includes('Publicada')) {
          textoSumula = nextLine.split('(SÚMULA')[0].trim();
          break;
        }
      }
    }
    
    if (!textoSumula) {
      // Tentar método alternativo
      const match = textoCompleto.match(/Súmula \d+\s+(.+?)\s+\(SÚMULA/s);
      if (match) {
        textoSumula = match[1].trim();
      }
    }
    
    if (!textoSumula) {
      console.error(`Não foi possível extrair o texto da súmula ${numero}`);
      return null;
    }
    
    return {
      titulo: `Súmula ${numero}`,
      texto: textoSumula,
      data: dataPublicacao || '01/01/1994'
    };
  } catch (error) {
    console.error(`Erro ao buscar súmula ${numero}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inicio, fim } = await req.json();
    
    console.log(`Populando súmulas ${inicio} a ${fim}`);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resultados = [];
    
    for (let i = inicio; i <= fim; i++) {
      try {
        console.log(`Buscando súmula ${i}...`);
        
        // Buscar súmula do site
        const sumula = await buscarSumula(i);
        
        if (!sumula) {
          resultados.push({
            numero: i,
            sucesso: false,
            erro: 'Não foi possível buscar a súmula do site'
          });
          continue;
        }

        console.log(`Súmula ${i} encontrada: ${sumula.texto.substring(0, 50)}...`);

        // Inserir no banco
        const { error } = await supabaseClient
          .from('SUMULAS STJ')
          .insert({
            id: i,
            'Título da Súmula': sumula.titulo,
            'Texto da Súmula': sumula.texto,
            'Data de Aprovação': sumula.data
          });

        if (error) {
          // Se já existe, não é erro
          if (error.code === '23505') {
            resultados.push({
              numero: i,
              sucesso: true,
              mensagem: 'Súmula já existe no banco'
            });
          } else {
            resultados.push({
              numero: i,
              sucesso: false,
              erro: error.message
            });
          }
        } else {
          resultados.push({
            numero: i,
            sucesso: true
          });
        }

        // Aguardar 2 segundos entre requisições para não sobrecarregar o site
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (err) {
        resultados.push({
          numero: i,
          sucesso: false,
          erro: String(err)
        });
      }
    }

    const sucesso = resultados.filter(r => r.sucesso).length;
    console.log(`Concluído: ${sucesso}/${resultados.length} súmulas inseridas`);

    return new Response(JSON.stringify({ resultados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
