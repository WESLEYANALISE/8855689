import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PIXEL_ID = "2069588673817892";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ACCESS_TOKEN = Deno.env.get("FACEBOOK_CONVERSIONS_API_TOKEN");
    if (!ACCESS_TOKEN) {
      throw new Error("FACEBOOK_CONVERSIONS_API_TOKEN não configurado");
    }

    const { event_name, event_id, event_time, user_data, custom_data, event_source_url, action_source, test_event_code } = await req.json();

    if (!event_name) {
      throw new Error("event_name é obrigatório");
    }

    // Hash user data fields for privacy (Facebook requires SHA256)
    const hashedUserData: Record<string, string> = {};
    if (user_data) {
      for (const [key, value] of Object.entries(user_data)) {
        if (value && typeof value === "string") {
          // Facebook expects pre-hashed or we hash here
          if (["em", "ph", "fn", "ln", "ct", "st", "zp", "country", "db", "ge"].includes(key)) {
            const encoder = new TextEncoder();
            const data = encoder.encode((value as string).toLowerCase().trim());
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            hashedUserData[key] = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
          } else {
            hashedUserData[key] = value as string;
          }
        }
      }
    }

    const eventData = {
      data: [
        {
          event_name,
          event_id: event_id || undefined,
          event_time: (() => {
            let t = event_time || Math.floor(Date.now() / 1000);
            // If timestamp is in milliseconds (13+ digits), convert to seconds
            if (t > 9999999999) t = Math.floor(t / 1000);
            return t;
          })(),
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
