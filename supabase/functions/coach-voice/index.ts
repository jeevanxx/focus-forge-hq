import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MAX_REQUEST_BYTES = 8 * 1024 * 1024;
const TRANSCRIPTION_MODEL = "openai/gpt-transcribe";
const SPEECH_MODEL = "google/gemini-3.1-flash-tts-preview";

const jsonResponse = (payload: unknown, status = 200, retryAfter?: string) => {
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  if (retryAfter) headers["Retry-After"] = retryAfter;
  return new Response(JSON.stringify(payload), { status, headers });
};

const safeGatewayMessage = (body: unknown, fallback: string) => {
  if (body && typeof body === "object") {
    const value = body as { error?: unknown; message?: unknown };
    if (typeof value.error === "string") return value.error;
    if (value.error && typeof value.error === "object" && "message" in value.error) {
      const message = (value.error as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
    if (typeof value.message === "string") return value.message;
  }
  return fallback;
};

const responseBody = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text || `Voice service returned ${response.status}.` };
  }
};

async function readBoundedBody(request: Request): Promise<Uint8Array | Response> {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "Recording is too large. Please send a shorter voice message." }, 413);
  }
  if (!request.body) return jsonResponse({ error: "Audio recording is missing." }, 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return jsonResponse({ error: "Recording is too large. Please send a shorter voice message." }, 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function parseTranscriptionEvent(eventText: string, state: { transcript: string; error: string | null }) {
  const data = eventText.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
  if (!data || data === "[DONE]") return;
  let payload: { type?: string; text?: string; delta?: string; error?: unknown; message?: unknown };
  try {
    payload = JSON.parse(data);
  } catch {
    return;
  }
  if (payload.type === "transcript.text.delta" && typeof payload.delta === "string") state.transcript += payload.delta;
  if (payload.type === "transcript.text.done" && typeof payload.text === "string") state.transcript = payload.text;
  if (payload.type === "error" || payload.error) {
    state.error = safeGatewayMessage(payload, "The recording could not be transcribed.");
  }
}

async function transcribeRequest(request: Request, apiKey: string): Promise<Response> {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return jsonResponse({ error: "Send a microphone recording to transcribe." }, 400);
  }

  const rawBody = await readBoundedBody(request);
  if (rawBody instanceof Response) return rawBody;
  let form: FormData;
  try {
    form = await new Response(rawBody, { headers: { "Content-Type": contentType } }).formData();
  } catch {
    return jsonResponse({ error: "The recording could not be read. Please record it again." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size < 2048 || file.size > MAX_REQUEST_BYTES || !file.type.startsWith("audio/")) {
    return jsonResponse({ error: "Please record a valid audio message and try again." }, 400);
  }

  const upstreamForm = new FormData();
  upstreamForm.append("model", TRANSCRIPTION_MODEL);
  upstreamForm.append("file", file, file.name || "voice-message.wav");
  upstreamForm.append("response_format", "json");
  upstreamForm.append("stream", "true");

  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstreamForm,
  });
  if (!upstream.ok) {
    const payload = await responseBody(upstream);
    return jsonResponse({ error: safeGatewayMessage(payload, `Voice transcription returned ${upstream.status}.`) }, upstream.status, upstream.headers.get("Retry-After") ?? undefined);
  }
  if (!upstream.body) return jsonResponse({ error: "The transcription service returned no result." }, 502);

  const state = { transcript: "", error: null as string | null };
  const reader = upstream.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += chunk.value;
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";
      for (const event of events) parseTranscriptionEvent(event, state);
      if (state.error) break;
    }
    if (buffer.trim() && !state.error) parseTranscriptionEvent(buffer, state);
  } finally {
    reader.releaseLock();
  }
  if (state.error) return jsonResponse({ error: state.error }, 502);
  if (!state.transcript.trim()) return jsonResponse({ error: "I didn't catch that. Please speak clearly and try again." }, 422);
  return jsonResponse({ text: state.transcript.trim() });
}

async function speechRequest(request: Request, apiKey: string): Promise<Response> {
  let payload: { action?: unknown; text?: unknown };
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "A spoken reply needs text." }, 400);
  }
  if (payload.action !== "speak" || typeof payload.text !== "string" || !payload.text.trim() || payload.text.length > 8000) {
    return jsonResponse({ error: "The spoken reply text is missing or too long." }, 400);
  }

  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: SPEECH_MODEL,
      contents: [{ role: "user", parts: [{ text: payload.text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
      },
      stream_format: "sse",
    }),
  });

  if (!upstream.ok) {
    const body = await responseBody(upstream);
    return jsonResponse({ error: safeGatewayMessage(body, `Spoken reply returned ${upstream.status}.`) }, upstream.status, upstream.headers.get("Retry-After") ?? undefined);
  }
  const headers = new Headers(corsHeaders);
  headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "text/event-stream");
  headers.set("Cache-Control", "no-cache");
  return new Response(upstream.body, { status: upstream.status, headers });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Use POST for voice chat." }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  const projectUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !projectUrl || !publishableKey) return jsonResponse({ error: "Please sign in to use voice chat." }, 401);

  const client = createClient(projectUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: authError } = await client.auth.getUser(token);
  if (authError || !userData.user) return jsonResponse({ error: "Please sign in to use voice chat." }, 401);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return jsonResponse({ error: "Voice chat is not configured." }, 500);

  try {
    if ((request.headers.get("Content-Type") ?? "").toLowerCase().includes("multipart/form-data")) {
      return await transcribeRequest(request, apiKey);
    }
    return await speechRequest(request, apiKey);
  } catch {
    return jsonResponse({ error: "Voice chat couldn't complete that request. Please try again." }, 500);
  }
});