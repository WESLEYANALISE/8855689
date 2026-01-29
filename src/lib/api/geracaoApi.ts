import { supabase } from "@/integrations/supabase/client";

// Tipos
export interface BloggerArtigo {
  id: number;
  titulo: string;
  categoria: string;
  ordem: number;
  conteudo_gerado: string | null;
  url_audio: string | null;
  url_capa: string | null;
  gerado_em: string | null;
  topicos: string[] | null;
}

export interface EstagioBlogArtigo {
  id: number;
  numero: number;
  titulo: string | null;
  artigo_melhorado: string | null;
  link_noticia: string | null;
}

export interface ResenhaLei {
  id: string;
  numero_lei: string;
  ementa: string | null;
  explicacao_lei: string | null;
  explicacao_artigos: any | null;
  ativa: boolean | null;
}

export interface EstatisticasGeracao {
  blogger: { total: number; comConteudo: number; comAudio: number };
  estagioBlog: { total: number; comArtigo: number };
  resenha: { total: number; comExplicacao: number };
}

// Buscar estatísticas gerais
export async function buscarEstatisticasGeracao(): Promise<EstatisticasGeracao> {
  const [bloggerRes, estagioRes, resenhaRes] = await Promise.all([
    supabase.from("BLOGGER_JURIDICO").select("id, conteudo_gerado, url_audio"),
    supabase.from("ESTAGIO-BLOG").select("numero, artigo_melhorado"),
    supabase.from("resenha_diaria").select("id, explicacao_lei")
  ]);

  const blogger = (bloggerRes.data || []) as any[];
  const estagio = (estagioRes.data || []) as any[];
  const resenha = (resenhaRes.data || []) as any[];

  return {
    blogger: {
      total: blogger.length,
      comConteudo: blogger.filter(a => a.conteudo_gerado).length,
      comAudio: blogger.filter(a => a.url_audio).length
    },
    estagioBlog: {
      total: estagio.length,
      comArtigo: estagio.filter(a => a.artigo_melhorado).length
    },
    resenha: {
      total: resenha.length,
      comExplicacao: resenha.filter(r => r.explicacao_lei).length
    }
  };
}

// Blogger Jurídico
export async function buscarBloggerArtigos(categoria?: string): Promise<BloggerArtigo[]> {
  let query = supabase
    .from("BLOGGER_JURIDICO")
    .select("id, titulo, categoria, ordem, conteudo_gerado, url_audio, url_capa, gerado_em, topicos")
    .order("categoria")
    .order("ordem");

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function buscarCategoriasBlogger(): Promise<{ categoria: string; total: number }[]> {
  const { data, error } = await supabase
    .from("BLOGGER_JURIDICO")
    .select("categoria");

  if (error) throw error;

  const counts: Record<string, number> = {};
  (data || []).forEach(item => {
    counts[item.categoria] = (counts[item.categoria] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria));
}

export async function gerarConteudoBlogger(categoria: string, ordem: number, titulo: string, topicos?: string[]) {
  const { data, error } = await supabase.functions.invoke("gerar-conteudo-blogger", {
    body: { categoria, ordem, titulo, topicos }
  });

  if (error) throw error;
  return data;
}

export async function gerarAudioBlogger(texto: string, categoria: string, ordem: number) {
  const { data, error } = await supabase.functions.invoke("gerar-narracao", {
    body: { texto, categoria, ordem }
  });

  if (error) throw error;
  return data;
}

export async function excluirConteudoBlogger(id: number) {
  const { error } = await supabase
    .from("BLOGGER_JURIDICO")
    .update({ conteudo_gerado: null, gerado_em: null, cache_validade: null })
    .eq("id", id);

  if (error) throw error;
}

export async function excluirAudioBlogger(id: number) {
  const { error } = await supabase
    .from("BLOGGER_JURIDICO")
    .update({ url_audio: null })
    .eq("id", id);

  if (error) throw error;
}

export async function gerarCapaBlogger(categoria: string, ordem: number, titulo: string) {
  const { data, error } = await supabase.functions.invoke("gerar-capa-blogger", {
    body: { categoria, ordem, titulo }
  });

  if (error) throw error;
  return data;
}

export async function excluirCapaBlogger(id: number) {
  const { error } = await supabase
    .from("BLOGGER_JURIDICO")
    .update({ url_capa: null })
    .eq("id", id);

  if (error) throw error;
}

// Estágio Blog
export async function buscarEstagioBlogArtigos(): Promise<EstagioBlogArtigo[]> {
  const { data, error } = await supabase
    .from("ESTAGIO-BLOG")
    .select("numero, titulo, artigo_melhorado, link_noticia")
    .order("numero");

  if (error) throw error;
  return (data || []).map((item: any) => ({ ...item, id: item.numero })) as EstagioBlogArtigo[];
}

export async function gerarArtigoEstagioBlog(numero: number) {
  const { data, error } = await supabase.functions.invoke("gerar-artigo-blog", {
    body: { numero }
  });

  if (error) throw error;
  return data;
}

export async function excluirArtigoEstagioBlog(numero: number) {
  const { error } = await (supabase
    .from("ESTAGIO-BLOG") as any)
    .update({ artigo_melhorado: null, cache_validade: null })
    .eq("numero", numero);

  if (error) throw error;
}

// Resenha Diária
export async function buscarResenhaLeis(): Promise<ResenhaLei[]> {
  const { data, error } = await supabase
    .from("resenha_diaria")
    .select("id, numero_lei, ementa, explicacao_lei, ativa")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data || []).map((item: any) => ({ ...item, explicacao_artigos: null })) as ResenhaLei[];
}

export async function gerarExplicacaoResenha(leiId: string) {
  const { data, error } = await supabase.functions.invoke("gerar-explicacoes-resenha", {
    body: { lei_id: leiId }
  });

  if (error) throw error;
  return data;
}

export async function excluirExplicacaoResenha(id: string) {
  const { error } = await supabase
    .from("resenha_diaria")
    .update({ explicacao_lei: null, explicacao_artigos: null })
    .eq("id", id);

  if (error) throw error;
}
