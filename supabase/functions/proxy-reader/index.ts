import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only allow specific domains for security
    const allowedDomains = ['online.fliphtml5.com', 'fliphtml5.com'];
    const targetHostname = new URL(targetUrl).hostname;
    const isAllowed = allowedDomains.some(d => targetHostname === d || targetHostname.endsWith('.' + d));

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });

    // Read response as text
    const bodyText = await response.text();
    const looksLikeHtml = bodyText.trimStart().startsWith('<!') || bodyText.trimStart().toLowerCase().startsWith('<html');

    if (looksLikeHtml) {
      // Inject <base> tag so relative resources (JS, CSS, images) load from the original domain
      const basePath = targetUrl.endsWith('/') ? targetUrl : targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const baseTag = `<base href="${basePath}">`;

      let html = bodyText;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<head ')) {
        html = html.replace(/<head\s[^>]*>/, `$&${baseTag}`);
      } else {
        html = baseTag + html;
      }

      return new Response(html, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          // Must explicitly set CSP to allow content rendering - Supabase adds restrictive sandbox CSP by default
          'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
        },
      });
    }

    // Non-HTML content: return as-is
    const originalContentType = response.headers.get('content-type') || 'application/octet-stream';
    return new Response(bodyText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': originalContentType,
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy fetch failed', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
