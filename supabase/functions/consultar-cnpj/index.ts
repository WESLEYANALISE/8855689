import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj } = await req.json();

    if (!cnpj || cnpj.length !== 14) {
      return new Response(
        JSON.stringify({ error: "CNPJ inválido. Deve conter 14 dígitos." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Consultando CNPJ: ${cnpj}`);

    // Usar a API gratuita BrasilAPI
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: "CNPJ não encontrado na base da Receita Federal" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();

    // Formatar resposta
    const empresaFormatada = {
      cnpj: formatarCNPJ(cnpj),
      razao_social: data.razao_social || "",
      nome_fantasia: data.nome_fantasia || "",
      situacao_cadastral: data.descricao_situacao_cadastral || "",
      data_situacao_cadastral: formatarData(data.data_situacao_cadastral),
      data_inicio_atividade: formatarData(data.data_inicio_atividade),
      cnae_fiscal_principal: {
        codigo: String(data.cnae_fiscal || ""),
        descricao: data.cnae_fiscal_descricao || ""
      },
      natureza_juridica: data.natureza_juridica || "",
      porte: data.porte || data.descricao_porte || "",
      capital_social: data.capital_social || 0,
      endereco: {
        logradouro: `${data.descricao_tipo_de_logradouro || ""} ${data.logradouro || ""}`.trim(),
        numero: data.numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        municipio: data.municipio || "",
        uf: data.uf || "",
        cep: formatarCEP(data.cep || "")
      },
      telefone: formatarTelefone(data.ddd_telefone_1, data.ddd_telefone_2),
      email: data.email || "",
      socios: (data.qsa || []).map((socio: any) => ({
        nome: socio.nome_socio || "",
        qualificacao: socio.qualificacao_socio || ""
      }))
    };

    console.log(`CNPJ ${cnpj} encontrado: ${empresaFormatada.razao_social}`);

    return new Response(
      JSON.stringify(empresaFormatada),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao consultar CNPJ:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao consultar CNPJ. Tente novamente." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

function formatarCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function formatarData(data: string | null): string {
  if (!data) return "";
  try {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  } catch {
    return data;
  }
}

function formatarCEP(cep: string): string {
  const numeros = cep.replace(/\D/g, "");
  return numeros.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

function formatarTelefone(ddd1?: string, ddd2?: string): string {
  const telefones = [];
  if (ddd1) telefones.push(ddd1);
  if (ddd2) telefones.push(ddd2);
  return telefones.join(" / ");
}
