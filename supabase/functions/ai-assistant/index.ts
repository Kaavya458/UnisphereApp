const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Tries the main model first, then a backup model if Gemini is busy.
const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash"];
const BUSY_CODES = [429, 500, 503, 504];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { question } = await req.json();
    if (!question?.trim()) return json({ error: "Question is required" }, 400);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "GEMINI_API_KEY secret is missing" }, 500);

    const body = JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: "You are UniSphere AI Study Assistant for college students. Explain in simple language with short examples. Keep answers short and clear (under 200 words) unless the student asks for more detail. Use bullet points where helpful.",
          },
        ],
      },
      contents: [{ parts: [{ text: question }] }],
      generationConfig: {
        thinkingConfig: { thinkingLevel: "low" },
        maxOutputTokens: 1500,
      },
    });

    let lastError = "Gemini error";

    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            body,
          }
        );
        const data = await res.json();

        if (res.ok) {
          const answer =
            data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No answer received.";
          return json({ answer });
        }

        lastError = data.error?.message ?? "Gemini error";
        if (!BUSY_CODES.includes(res.status)) return json({ error: lastError }, 502);
        await wait(1000);
      }
    }

    return json({ error: "The AI is very busy right now. Please try again in a minute. (" + lastError + ")" }, 502);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});