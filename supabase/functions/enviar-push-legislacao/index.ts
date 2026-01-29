import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Lei {
  id: string;
  numero_lei: string;
  ementa: string;
  data_publicacao: string;
  url_planalto: string;
  areas_direito: string[];
  artigos: any[];
  explicacao_lei: string;
  explicacoes_artigos: any;
}

interface Inscrito {
  id: string;
  email: string;
  nome: string;
  areas_interesse: string[];
  token_confirmacao: string;
}

function gerarEmailHTML(inscrito: Inscrito, leis: Lei[], dataFormatada: string, baseUrl: string): string {
  const leisCards = leis.map((lei, index) => {
    const areasHtml = lei.areas_direito?.length ? `
      <div style="margin: 12px 0;">
        ${lei.areas_direito.map(area => `
          <span style="display: inline-block; padding: 4px 10px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-radius: 12px; font-size: 11px; margin: 2px 4px 2px 0; font-weight: 500;">
            ${area}
          </span>
        `).join('')}
      </div>
    ` : '';

    // Explicação da lei em formato colapsável (simulado com tabela)
    const explicacaoHtml = lei.explicacao_lei ? `
      <div style="margin: 16px 0; padding: 16px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 8px; border-left: 4px solid #0ea5e9;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 16px; margin-right: 8px;">💡</span>
          <strong style="color: #0369a1; font-size: 13px;">O que esta lei significa?</strong>
        </div>
        <p style="margin: 0; color: #0c4a6e; font-size: 13px; line-height: 1.6;">
          ${lei.explicacao_lei}
        </p>
      </div>
    ` : '';

    // Principais artigos (até 3)
    const artigosHtml = lei.artigos && lei.artigos.length > 0 ? `
      <div style="margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          📋 Principais Artigos
        </p>
        ${lei.artigos.slice(0, 3).map((artigo: any) => `
          <div style="padding: 10px 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #6366f1;">
            <p style="margin: 0 0 4px 0; color: #4f46e5; font-size: 12px; font-weight: 600;">
              ${artigo.numero || artigo.artigo || 'Artigo'}
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
              ${(artigo.texto || artigo.conteudo || '').substring(0, 150)}${(artigo.texto || artigo.conteudo || '').length > 150 ? '...' : ''}
            </p>
          </div>
        `).join('')}
        ${lei.artigos.length > 3 ? `
          <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px;">
            + ${lei.artigos.length - 3} artigos adicionais
          </p>
        ` : ''}
      </div>
    ` : '';

    return `
      <div style="margin-bottom: 28px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
        <!-- Número da Lei com Badge -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #111827; font-size: 18px; font-weight: 700;">
            ${lei.numero_lei}
          </h3>
          <span style="padding: 4px 10px; background: #fef3c7; color: #92400e; border-radius: 6px; font-size: 11px; font-weight: 600;">
            ${new Date(lei.data_publicacao).toLocaleDateString('pt-BR')}
          </span>
        </div>
        
        <!-- Ementa -->
        <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px; line-height: 1.6; font-style: italic; padding: 12px; background: #f9fafb; border-radius: 6px;">
          "${lei.ementa || 'Sem ementa disponível'}"
        </p>
        
        <!-- Áreas do Direito -->
        ${areasHtml}
        
        <!-- Explicação IA -->
        ${explicacaoHtml}
        
        <!-- Artigos -->
        ${artigosHtml}
        
        <!-- Botão -->
        <div style="margin-top: 16px; text-align: center;">
          <a href="${lei.url_planalto}" 
             target="_blank"
             style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
            📖 Ver texto completo no Planalto
          </a>
        </div>
      </div>
    `;
  }).join('');

  const cancelUrl = `${baseUrl}/cancelar-push?token=${inscrito.token_confirmacao}`;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Push de Legislação</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); min-height: 100vh;">
      <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
        
        <!-- Header Card -->
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e40af 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center; position: relative; overflow: hidden;">
          <!-- Decorative elements -->
          <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
          
          <div style="position: relative; z-index: 1;">
            <div style="font-size: 48px; margin-bottom: 12px;">⚖️</div>
            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
              Push de Legislação
            </h1>
            <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">
              ${dataFormatada}
            </p>
          </div>
        </div>
        
        <!-- Stats Banner -->
        <div style="background: white; padding: 20px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: center; gap: 40px; text-align: center;">
            <div>
              <p style="margin: 0; font-size: 32px; font-weight: 700; color: #2563eb;">${leis.length}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Nova(s) Lei(s)</p>
            </div>
            <div style="width: 1px; background: #e5e7eb;"></div>
            <div>
              <p style="margin: 0; font-size: 32px; font-weight: 700; color: #10b981;">${leis.reduce((acc, lei) => acc + (lei.artigos?.length || 0), 0)}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Artigos</p>
            </div>
          </div>
        </div>
        
        <!-- Greeting -->
        <div style="background: white; padding: 24px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
            Olá${inscrito.nome ? ` <strong>${inscrito.nome}</strong>` : ''}! 👋
          </p>
          <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            Confira as novas leis publicadas no Diário Oficial da União. Incluímos explicações simplificadas e os principais artigos de cada legislação.
          </p>
        </div>
        
        <!-- Laws Content -->
        <div style="background: #f3f4f6; padding: 24px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
          ${leisCards}
        </div>
        
        <!-- CTA Section -->
        <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 24px; text-align: center; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
          <p style="margin: 0 0 16px 0; color: #166534; font-size: 14px;">
            🎓 Acesse a Resenha Diária completa para ver todas as atualizações
          </p>
          <a href="${baseUrl}/resenha-diaria" 
             style="display: inline-block; padding: 12px 28px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            Ver Resenha Completa
          </a>
        </div>
        
        <!-- Footer -->
        <div style="background: #1f2937; padding: 24px; border-radius: 0 0 16px 16px; text-align: center;">
          <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.7); font-size: 12px;">
            Você está recebendo este e-mail porque se inscreveu no Push de Legislação.
          </p>
          <p style="margin: 0 0 16px 0; color: rgba(255,255,255,0.5); font-size: 11px;">
            © ${new Date().getFullYear()} Vade Mecum Elite • Todos os direitos reservados
          </p>
          <a href="${cancelUrl}" 
             style="color: #9ca3af; font-size: 11px; text-decoration: underline;">
            Cancelar inscrição
          </a>
        </div>
        
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseUrl = 'https://vademecum.lovable.app';

    // Pegar parâmetros opcionais
    const { forceDate, testEmail } = await req.json().catch(() => ({}));

    // Buscar leis - últimas 24 horas ou data específica
    let query = supabase
      .from('resenha_diaria')
      .select('*')
      .eq('status', 'ativo')
      .order('data_publicacao', { ascending: false });

    if (forceDate) {
      query = query.eq('data_publicacao', forceDate);
    } else {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      query = query.gte('data_publicacao', ontem.toISOString().split('T')[0]);
    }

    const { data: leisDoDia, error: leisError } = await query;

    if (leisError) {
      console.error('Erro ao buscar leis:', leisError);
      throw leisError;
    }

    if (!leisDoDia || leisDoDia.length === 0) {
      console.log('Nenhuma lei nova encontrada');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma lei nova', enviados: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontradas ${leisDoDia.length} leis`);

    // Buscar inscritos ativos
    let inscritosQuery = supabase
      .from('push_legislacao_inscritos')
      .select('*')
      .eq('ativo', true);

    // Se for teste, enviar apenas para o email especificado
    if (testEmail) {
      inscritosQuery = inscritosQuery.eq('email', testEmail);
    }

    const { data: inscritos, error: inscritosError } = await inscritosQuery;

    if (inscritosError) {
      console.error('Erro ao buscar inscritos:', inscritosError);
      throw inscritosError;
    }

    if (!inscritos || inscritos.length === 0) {
      console.log('Nenhum inscrito ativo');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum inscrito ativo', enviados: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Enviando para ${inscritos.length} inscritos`);

    const dataFormatada = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    let enviados = 0;
    const erros: string[] = [];

    for (const inscrito of inscritos) {
      try {
        // Filtrar por áreas de interesse
        let leisFiltradas = leisDoDia as Lei[];
        if (inscrito.areas_interesse && inscrito.areas_interesse.length > 0) {
          leisFiltradas = leisDoDia.filter((lei: any) => 
            lei.areas_direito?.some((area: string) => 
              inscrito.areas_interesse.some((interesse: string) => 
                area.toLowerCase().includes(interesse.toLowerCase()) ||
                interesse.toLowerCase().includes(area.toLowerCase())
              )
            )
          ) as Lei[];
        }

        if (leisFiltradas.length === 0) {
          console.log(`Nenhuma lei relevante para ${inscrito.email}`);
          continue;
        }

        const emailHtml = gerarEmailHTML(inscrito as Inscrito, leisFiltradas, dataFormatada, baseUrl);

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Vade Mecum Elite <noreply@resend.dev>',
            to: [inscrito.email],
            subject: `⚖️ ${leisFiltradas.length} nova(s) lei(s) publicadas - ${dataFormatada}`,
            html: emailHtml,
          }),
        });

        if (resendResponse.ok) {
          enviados++;
          console.log(`Email enviado para ${inscrito.email}`);
          
          await supabase
            .from('push_legislacao_inscritos')
            .update({ ultimo_envio: new Date().toISOString() })
            .eq('id', inscrito.id);
        } else {
          const errorData = await resendResponse.text();
          console.error(`Erro ao enviar para ${inscrito.email}:`, errorData);
          erros.push(`${inscrito.email}: ${errorData}`);
        }
      } catch (emailError) {
        console.error(`Erro ao processar ${inscrito.email}:`, emailError);
        erros.push(`${inscrito.email}: ${emailError}`);
      }
    }

    console.log(`Concluído: ${enviados} enviados, ${erros.length} erros`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enviados, 
        total_leis: leisDoDia.length,
        total_inscritos: inscritos.length,
        erros: erros.length > 0 ? erros : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
