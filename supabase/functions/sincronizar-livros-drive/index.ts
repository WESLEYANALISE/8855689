import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini para fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean);

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

// Extrair ID da pasta do link do Drive
function extractFolderId(url: string): string | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : url; // Se não encontrar padrão, assume que é o ID direto
}

// Listar arquivos PDF de uma pasta do Drive
async function listDriveFiles(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/pdf'&key=${apiKey}&fields=files(id,name,mimeType,webViewLink)`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.text();
    console.error('Erro ao listar arquivos:', error);
    throw new Error(`Erro ao listar arquivos: ${response.status}`);
  }
  
  const data = await response.json();
  return data.files || [];
}

// Extrair título e autor do nome do arquivo
function parseFileName(fileName: string): { titulo: string; autor: string } {
  let name = fileName.replace(/\.pdf$/i, '');
  
  // Remove numeração inicial (ex: "01.", "01-", "01 -")
  name = name.replace(/^\d+[\.\-\s]+/, '');
  
  // Substitui hífens por espaços
  name = name.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  
  let titulo = name;
  let autor = '';
  
  // Tenta extrair autor após "—" ou "–"
  const dashMatch = name.match(/^(.+?)\s*[—–]\s*(.+)$/);
  if (dashMatch) {
    titulo = dashMatch[1].trim();
    autor = dashMatch[2].trim();
  } else {
    // Tenta extrair autor entre parênteses
    const parenMatch = name.match(/^(.+?)\s*\((.+?)\)$/);
    if (parenMatch) {
      titulo = parenMatch[1].trim();
      autor = parenMatch[2].trim();
    }
  }
  
  return { titulo, autor };
}

// Buscar capa no Google Books
async function buscarCapaGoogleBooks(titulo: string, autor?: string): Promise<string | null> {
  try {
    const query = autor ? `${titulo}+inauthor:${autor}` : titulo;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    
    if (thumbnail) {
      return thumbnail.replace('zoom=1', 'zoom=3').replace('http://', 'https://');
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar capa:', error);
    return null;
  }
}

// Gerar conteúdo com Gemini
async function gerarConteudoGemini(titulo: string, autor: string, area: string): Promise<{ sobre: string; beneficios: string } | null> {
  const orientacaoDescricao: Record<string, string> = {
    'esquerda': 'pensamento de esquerda, progressista, socialista ou social-democrata',
    'centro': 'pensamento centrista, liberal moderado ou pragmático',
    'direita': 'pensamento de direita, conservador, liberal clássico ou libertário'
  };

  const prompt = `Analise este livro político e retorne um JSON:

LIVRO: ${titulo}
AUTOR: ${autor || 'Desconhecido'}
ORIENTAÇÃO: ${area} (${orientacaoDescricao[area] || area})

Retorne APENAS um JSON válido:
{
  "sobre": "Descrição do livro em 2-3 frases. Seja conciso e objetivo.",
  "beneficios": "3 benefícios de ler este livro. Cada benefício em uma frase. Separe com quebras de linha."
}`;

  for (const apiKey of GEMINI_KEYS) {
    if (!apiKey) continue;
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
          })
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) continue;
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0]
          .replace(/[\x00-\x1F\x7F]/g, ' ')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '')
          .replace(/\t/g, ' ');
        
        try {
          const parsed = JSON.parse(jsonStr);
          return { 
            sobre: (parsed.sobre || '').replace(/\\n/g, '\n'), 
            beneficios: (parsed.beneficios || '').replace(/\\n/g, '\n') 
          };
        } catch {
          return { sobre: 'Livro de filosofia política.', beneficios: '' };
        }
      }
    } catch (error) {
      console.error('Erro com Gemini:', error);
      continue;
    }
  }
  
  return { sobre: 'Livro de filosofia política.', beneficios: '' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DRIVE_API_KEY = Deno.env.get('GOOGLE_DRIVE_API_KEY');
    if (!DRIVE_API_KEY) {
      throw new Error('GOOGLE_DRIVE_API_KEY não configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Aceita pastas por orientação
    const body = await req.json().catch(() => ({}));
    
    // Pastas padrão
    const pastas = body.pastas || {
      direita: '1r_sDJ-Uz088pTUpcVi-10XjwJy7HnmLM',
      esquerda: '1DYwQFAOUDyPqbtdaZV-_01kgH4IDJsLd',
      centro: '19wJaKgiUKn5Kl6XUo9lsMEXoYvIte7I-'
    };

    // Se passou apenas uma orientação específica, processa só ela
    const orientacaoUnica = body.orientacao;
    
    const resultados: any[] = [];
    const orientacoes = orientacaoUnica ? [orientacaoUnica] : Object.keys(pastas);

    for (const area of orientacoes) {
      const folderId = pastas[area];
      if (!folderId) continue;

      console.log(`\n📁 Processando pasta ${area.toUpperCase()}...`);
      
      const files = await listDriveFiles(folderId, DRIVE_API_KEY);
      console.log(`   ${files.length} arquivos encontrados`);

      for (const file of files) {
        const { titulo, autor } = parseFileName(file.name);
        console.log(`   → ${titulo} (${autor || 'sem autor'})`);

        try {
          // Verificar se já existe com dados completos
          const { data: existente } = await supabase
            .from('BIBLIOTECA-POLITICA')
            .select('id, link, imagem, sobre')
            .eq('livro', titulo)
            .maybeSingle();

          if (existente?.link && existente?.imagem && existente?.sobre) {
            console.log(`     ✓ Completo, pulando`);
            resultados.push({ titulo, area, status: 'existente' });
            continue;
          }

          // Buscar capa
          let capaUrl = existente?.imagem || null;
          if (!capaUrl) {
            capaUrl = await buscarCapaGoogleBooks(titulo, autor);
          }

          // Gerar descrição
          let sobre = existente?.sobre || null;
          let beneficios = null;
          if (!sobre) {
            const conteudo = await gerarConteudoGemini(titulo, autor, area);
            if (conteudo) {
              sobre = conteudo.sobre;
              beneficios = conteudo.beneficios;
            }
          }

          const driveLink = `https://drive.google.com/file/d/${file.id}/preview`;

          const dadosLivro = {
            livro: titulo,
            autor: autor || null,
            area,
            link: driveLink,
            imagem: capaUrl,
            sobre,
            beneficios,
          };

          if (existente) {
            await supabase.from('BIBLIOTECA-POLITICA').update(dadosLivro).eq('id', existente.id);
            resultados.push({ titulo, area, status: 'atualizado' });
          } else {
            await supabase.from('BIBLIOTECA-POLITICA').insert(dadosLivro);
            resultados.push({ titulo, area, status: 'inserido' });
          }

          console.log(`     ✓ Salvo!`);
          
          // Delay menor
          await new Promise(r => setTimeout(r, 800));
          
        } catch (error) {
          console.error(`     ✗ Erro:`, error);
          resultados.push({ titulo, area, status: 'erro', erro: String(error) });
        }
      }
    }

    return new Response(
      JSON.stringify({
        total: resultados.length,
        inseridos: resultados.filter(r => r.status === 'inserido').length,
        atualizados: resultados.filter(r => r.status === 'atualizado').length,
        existentes: resultados.filter(r => r.status === 'existente').length,
        erros: resultados.filter(r => r.status === 'erro').length,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
