import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const livroTitulo = "O Caso dos Exploradores de Cavernas";
    
    // URLs das imagens no projeto (preview)
    const baseUrl = "https://id-preview--4353d950-c8ff-42ea-b026-8d0a21ba173a.lovable.app";
    
    const imagensParaUpload = [
      {
        url: `${baseUrl}/leitura-imagens/exploradores-cavernas/sextante.jpg`,
        nome: "sextante.jpg",
        descricao: "Sextante do naufrágio de Dudley"
      },
      {
        url: `${baseUrl}/leitura-imagens/exploradores-cavernas/case-document.jpg`,
        nome: "case-document.jpg",
        descricao: "Documento do caso U.S. v. Holmes"
      },
      {
        url: `${baseUrl}/leitura-imagens/exploradores-cavernas/london-news.jpg`,
        nome: "london-news.jpg",
        descricao: "Artigo do The Illustrated London News"
      }
    ];

    const resultados: Array<{ nome: string; url: string; sucesso: boolean }> = [];
    const urlsUpload: Record<string, string> = {};

    for (const img of imagensParaUpload) {
      try {
        console.log(`[DOWNLOAD] Baixando: ${img.url}`);
        const response = await fetch(img.url);
        
        if (!response.ok) {
          console.error(`[ERRO] Falha ao baixar ${img.nome}: ${response.status}`);
          resultados.push({ nome: img.nome, url: '', sucesso: false });
          continue;
        }
        
        const blob = await response.arrayBuffer();
        const filePath = `livros/exploradores_cavernas/${img.nome}`;
        
        console.log(`[UPLOAD] Enviando para Storage: ${filePath}`);
        
        const { error: uploadError } = await supabase.storage
          .from('leitura-imagens')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error(`[ERRO] Upload: ${uploadError.message}`);
          resultados.push({ nome: img.nome, url: '', sucesso: false });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('leitura-imagens')
          .getPublicUrl(filePath);

        urlsUpload[img.nome] = urlData.publicUrl;
        resultados.push({ nome: img.nome, url: urlData.publicUrl, sucesso: true });
        console.log(`[OK] Upload concluído: ${urlData.publicUrl}`);
      } catch (e) {
        console.error(`[ERRO] ${img.nome}:`, e);
        resultados.push({ nome: img.nome, url: '', sucesso: false });
      }
    }

    // Agora atualizar o conteúdo das páginas OCR
    if (Object.keys(urlsUpload).length > 0) {
      console.log(`\n[ATUALIZANDO] Conteúdo OCR das páginas 12 e 13...`);
      
      // Página 12 - inserir sextante e case-document
      const { data: pag12 } = await supabase
        .from('BIBLIOTECA-LEITURA-DINAMICA')
        .select('id')
        .ilike('Titulo da Obra', `%${livroTitulo}%`)
        .eq('Pagina', 12)
        .single();

      if (pag12) {
        // Texto em inglês a ser substituído
        const textoIngles = `Case No. 15,383.

UNITED STATES v. HOLMES.

[1 Wall. Jr. 1.]¹

Circuit Court, E. D. Pennsylvania. April 22, 1842.

CONDUCT OF TRIAL—ADMISSION OF PERSONS WITHIN BAR—HOMICIDE BY SEAMEN—SHIPWRECK—ABANDONMENT OF PASSENGERS.

1. Although this court is deprived, by the act of March 2, 1831, of the power to punish, as for a contempt of court, the publication during trial, of testimony in a case, yet, having power to regulate the admission of persons, and the character of proceedings within its own bar, the court can exclude from within the bar any person coming there to report testimony during the trial.

[Cited in U. S. v. Anon., 21 Fed. 768.]

2. Seamen have no right, even in cases of extreme peril to their own lives, to sacrifice the lives of passengers, for the sake of preserving their own. On the contrary, being common carriers, and so paid to protect and carry the passengers, the seamen, beyond the number necessary to navigate the boat, in no circumstances can claim exemption from the common lot of the passengers.`;

        const novoConteudoPag12 = `O caso dos exploradores de cavernas foi inspirado em dois casos reais de naufrágio: U.S. v. Holmes (1842) e Regina v. Dudley & Stephens (1884).

![Sextante do naufrágio](${urlsUpload['sextante.jpg'] || ''})

Sextante presente no naufrágio que Dudley levou para Austrália após sua soltura. O objeto foi comprado por um colecionador de antiguidade náutica, pagou na época £ 37. Só após a compra descobriu a história fatídica o que valorizou o sextante em mais de £ 1.000

![Documento do caso U.S. v. Holmes](${urlsUpload['case-document.jpg'] || ''})

No caso U.S. v. Holmes (1842) não houve canibalismo, mas os homicídios foram praticados como forma de aliviar a carga do bote salva-vidas, que estava ameaçado pela superlotação. Alexander Holmes foi considerado culpado e condenado a seis meses de prisão e uma multa de US$ 20. Nenhum dos outros membros da equipe foi levado a julgamento.`;

        await supabase
          .from('BIBLIOTECA-LEITURA-DINAMICA')
          .update({ 'Conteúdo': novoConteudoPag12 })
          .eq('id', (pag12 as Record<string, unknown>)['id']);
          
        console.log('[OK] Página 12 atualizada');
      }

      // Página 13 - inserir london-news
      const { data: pag13 } = await supabase
        .from('BIBLIOTECA-LEITURA-DINAMICA')
        .select('id')
        .ilike('Titulo da Obra', `%${livroTitulo}%`)
        .eq('Pagina', 13)
        .single();

      if (pag13) {
        const novoConteudoPag13 = `![Artigo do The Illustrated London News](${urlsUpload['london-news.jpg'] || ''})

Artigo publicado pelo The Illustrated London News sobre o naufrágio do iate Mignonette em 1884, conhecido como Regina v. Dudley e Stephens. A beira da morte pela fome Dudley e Stephens mataram um jovem de 17 anos para que pudessem comê-lo. Dudley e Stephens foram condenados à morte. No entanto, devido a um protesto público, a sentença foi reduzida para seis meses de prisão.`;

        await supabase
          .from('BIBLIOTECA-LEITURA-DINAMICA')
          .update({ 'Conteúdo': novoConteudoPag13 })
          .eq('id', (pag13 as Record<string, unknown>)['id']);
          
        console.log('[OK] Página 13 atualizada');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        resultados,
        urlsUpload,
        message: 'Imagens enviadas e conteúdo atualizado'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ERRO GERAL]', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
