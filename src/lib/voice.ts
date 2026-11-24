import { supabase } from "@/integrations/supabase/client";

const VOICE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-voice`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const RECORDING_SAMPLE_RATE = 16_000;

export interface VoiceRecorder {
  stop: () => Promise<File>;
}

function encodeWav(chunks: readonly Float32Array[], inputSampleRate: number): Blob {
  const inputLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const input = new Float32Array(inputLength);
  let inputOffset = 0;
  for (const chunk of chunks) {
    input.set(chunk, inputOffset);
    inputOffset += chunk.length;
  }

  const outputLength = Math.floor(input.length * RECORDING_SAMPLE_RATE / inputSampleRate);
  const bytes = new ArrayBuffer(44 + outputLength * 2);
  const view = new DataView(bytes);
  const writeTag = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  writeTag(0, "RIFF");
  view.setUint32(4, 36 + outputLength * 2, true);
  writeTag(8, "WAVE");
  writeTag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, RECORDING_SAMPLE_RATE, true);
  view.setUint32(28, RECORDING_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeTag(36, "data");
  view.setUint32(40, outputLength * 2, true);

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = index * inputSampleRate / RECORDING_SAMPLE_RATE;
    const sourceIndex = Math.floor(sourcePosition);
    const fraction = sourcePosition - sourceIndex;
    const first = input[sourceIndex] ?? 0;
    const second = input[Math.min(sourceIndex + 1, input.length - 1)] ?? first;
    const sample = Math.max(-1, Math.min(1, first + (second - first) * fraction));
    view.setInt16(44 + index * 2, sample * (sample < 0 ? 32768 : 32767), true);
  }
  return new Blob([bytes], { type: "audio/wav" });
}

export async function recordWav(): Promise<VoiceRecorder> {
  if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === "undefined") {
    throw new Error("This browser doesn't support microphone recording.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  let context: AudioContext | undefined;
  try {
    context = new AudioContext();
    if (context.state === "suspended") await context.resume();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const mutedOutput = context.createGain();
    mutedOutput.gain.value = 0;
    const chunks: Float32Array[] = [];
    processor.onaudioprocess = (event) => chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    source.connect(processor);
    processor.connect(mutedOutput);
    mutedOutput.connect(context.destination);
    const audioContext = context;
    let stopped = false;

    return {
      async stop() {
        if (stopped) throw new Error("Recording has already stopped.");
        stopped = true;
        stream.getTracks().forEach((track) => track.stop());
        processor.disconnect();
        source.disconnect();
        mutedOutput.disconnect();
        processor.onaudioprocess = null;
        const audio = encodeWav(chunks, audioContext.sampleRate);
        await audioContext.close();
        if (audio.size < 4096) throw new Error("That recording was too short. Please speak for a moment and try again.");
        if (audio.size > 8 * 1024 * 1024) throw new Error("That recording is too large. Please try a shorter message.");
        return new File([audio], "voice-message.wav", { type: "audio/wav" });
      },
    };
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    await context?.close();
    throw error;
  }
}

async function authenticatedHeaders(): Promise<HeadersInit> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.access_token) throw new Error("Please sign in to use voice chat.");
  return { Authorization: `Bearer ${data.session.access_token}`, apikey: PUBLISHABLE_KEY };
}

async function responseError(response: Response): Promise<Error> {
  const payload = await response.json().catch(() => null) as { error?: unknown; message?: unknown } | null;
  const reason = typeof payload?.error === "string"
    ? payload.error
    : typeof payload?.message === "string"
      ? payload.message
      : `Voice service returned ${response.status}.`;
  return new Error(reason);
}

export async function transcribeVoice(file: File): Promise<string> {
  const headers = await authenticatedHeaders();
  const form = new FormData();
  form.append("file", file, file.name);
  const response = await fetch(VOICE_FUNCTION_URL, { method: "POST", headers, body: form });
  if (!response.ok) throw await responseError(response);
  const payload = await response.json() as { text?: unknown };
  return typeof payload.text === "string" ? payload.text : "";
}

function decodePcm(pending: Uint8Array, incoming: Uint8Array) {
  const bytes = new Uint8Array(pending.length + incoming.length);
  bytes.set(pending);
  bytes.set(incoming, pending.length);
  const usableLength = bytes.length - (bytes.length % 2);
  const view = new DataView(bytes.buffer);
  const samples = new Float32Array(usableLength / 2);
  for (let index = 0; index < samples.length; index += 1) samples[index] = view.getInt16(index * 2, true) / 32768;
  return { samples, pending: bytes.slice(usableLength) };
}

export async function speakCoachReply(text: string, signal: AbortSignal): Promise<void> {
  const context = new AudioContext({ sampleRate: 24_000 });
  const sources = new Set<AudioBufferSourceNode>();
  const playback: Promise<void>[] = [];
  let playhead = 0;
  let pending = new Uint8Array(0);
  let completed = false;
  let samplesPlayed = 0;

  try {
    if (context.state === "suspended") await context.resume();
    const headers = await authenticatedHeaders();
    const response = await fetch(VOICE_FUNCTION_URL, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "speak", text }),
      signal,
    });
    if (!response.ok || !response.body) throw await responseError(response);

    const playEvent = (block: string) => {
      const data = block.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
      if (!data || data === "[DONE]") return;
      const event = JSON.parse(data) as { type?: string; audio?: string; error?: unknown; message?: unknown };
      if (event.type === "error" || event.error) {
        const message = typeof event.error === "string"
          ? event.error
          : typeof event.message === "string"
            ? event.message
            : "The spoken reply was blocked. Please try again later.";
        throw new Error(message);
      }
      if (event.type === "speech.audio.done") {
        completed = true;
        return;
      }
      if (event.type !== "speech.audio.delta" || !event.audio || completed) return;

      const decoded = decodePcm(pending, Uint8Array.from(atob(event.audio), (character) => character.charCodeAt(0)));
      pending = decoded.pending;
      if (!decoded.samples.length) return;
      samplesPlayed += decoded.samples.length;
      const buffer = context.createBuffer(1, decoded.samples.length, 24_000);
      buffer.copyToChannel(decoded.samples, 0);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      sources.add(source);
      playback.push(new Promise<void>((resolve) => {
        source.onended = () => {
          sources.delete(source);
          resolve();
        };
      }));
      playhead = Math.max(playhead, context.currentTime + 0.05);
      source.start(playhead);
      playhead += buffer.duration;
    };

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    try {
      while (true) {
        signal.throwIfAborted();
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += chunk.value;
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? "";
        for (const block of blocks) playEvent(block);
      }
      if (buffer.trim()) playEvent(buffer);
    } finally {
      reader.releaseLock();
    }
    if (!completed || !samplesPlayed || pending.length) throw new Error("The spoken reply was incomplete. Please try again.");
    await Promise.all(playback);
    signal.throwIfAborted();
  } finally {
    for (const source of sources) source.stop();
    await context.close();
  }
}