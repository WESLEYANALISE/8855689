import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PIXEL_ID = "2069588673817892";

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ACCESS_TOKEN = Deno.env.get("FACEBOOK_CONVERSIONS_API_TOKEN");
    if (!ACCESS_TOKEN) {
      throw new Error("FACEBOOK_CONVERSIONS_API_TOKEN não configurado");
    }

    const { event_name, event_id, user_data, custom_data, event_source_url, action_source, test_event_code } = await req.json();

    if (!event_name) {
      throw new Error("event_name é obrigatório");
    }

    // Get client IP from request headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || req.headers.get("x-real-ip")
      || "unknown";

    // Build user_data with required parameters
    const hashedUserData: Record<string, string> = {};
    const hashableFields = ["em", "ph", "fn", "ln", "ct", "st", "zp", "country", "db", "ge"];
    
    if (user_data) {
      for (const [key, value] of Object.entries(user_data)) {
        if (value && typeof value === "string") {
          if (hashableFields.includes(key)) {
            hashedUserData[key] = await hashSHA256(value);
          } else {
            hashedUserData[key] = value;
          }
        }
      }
    }

    // Always include client_ip_address (required by Facebook for better matching)
    if (clientIp && clientIp !== "unknown") {
      hashedUserData.client_ip_address = clientIp;
    }

    // Ensure client_user_agent is present
    if (!hashedUserData.client_user_agent) {
      hashedUserData.client_user_agent = req.headers.get("user-agent") || "unknown";
    }

    const eventData = {
      data: [
        {
          event_name,
          event_id: event_id || undefined,
          event_time: Math.floor(Date.now() / 1000),
          action_source: action_source || "website",
          event_source_url: event_source_url || undefined,
          user_data: hashedUserData,
          custom_data: custom_data || undefined,
        },
      ],
      ...(test_event_code && { test_event_code }),
    };

    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Facebook API error:", JSON.stringify(result));
      throw new Error(`Facebook API error [${response.status}]: ${JSON.stringify(result)}`);
    }

    console.log("Facebook event sent:", event_name, JSON.stringify(result));

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
