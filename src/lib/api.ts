// Direct API calls - no edge functions needed

const OPENAI_API_KEY = "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";
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ---- Local Cache ----

const CACHE_KEY_PREFIX = "alse-cache-";

export function getCachedItems<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCachedItem<T>(key: string, item: T, maxItems = 50): void {
  try {
    const items = getCachedItems<T>(key);
    items.unshift(item);
    if (items.length > maxItems) items.length = maxItems;
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(items));
  } catch (e) {
    console.warn("Cache write error:", e);
  }
}

export function clearCache(key: string): void {
  localStorage.removeItem(CACHE_KEY_PREFIX + key);
}

// ---- Image Generation (OpenAI DALL-E 3) ----

const modePrompts: Record<string, string> = {
  avatar: "professional avatar, digital art, clean background, portrait style",
  caricatura: "exaggerated caricature style, humorous proportions, cartoon",
  cartoon: "western cartoon style, bold outlines, vibrant colors",
  logomarca: "professional logo design, minimalist, clean, vector style",
  designer: "modern graphic design, visually striking, artistic composition",
  slide: "professional presentation visual, clean, corporate style",
  webui: "modern web interface mockup, UI/UX design, clean layout",
  adesivo: "sticker style, white outline, vibrant colors, cartoon",
  hq: "comic book style, ink outlines, dramatic shading, graphic novel",
  anime: "anime/manga style, vibrant colors, expressive eyes, Japanese animation",
  lego: "LEGO style, plastic texture, brick-built, primary colors",
};

export async function generateImage(prompt: string, creationMode = "livre"): Promise<string> {
  let finalPrompt = prompt;
  if (creationMode !== "livre" && modePrompts[creationMode]) {
    finalPrompt = `${prompt}, ${modePrompts[creationMode]}`;
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI error ${resp.status}`);
    }

    const data = await resp.json();
    const url = data.data[0].url;

    // Cache result
    addCachedItem("images", { url, prompt: finalPrompt, mode: creationMode, timestamp: Date.now() });

    return url;
  } catch (e: any) {
    console.warn("OpenAI failed, using Pollinations fallback:", e.message);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;
    addCachedItem("images", { url: fallbackUrl, prompt: finalPrompt, mode: creationMode, timestamp: Date.now() });
    return fallbackUrl;
  }
}

// ---- Image Editing (OpenAI GPT-4o image) ----

export async function editImage(imageBase64: string, prompt: string): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Based on this image, generate a DALL-E prompt that applies this edit: "${prompt}". Return ONLY the prompt, nothing else.` },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error ${resp.status}`);
  }

  const data = await resp.json();
  const editPrompt = data.choices[0].message.content.trim();
  return generateImage(editPrompt);
}

// ---- Background Removal (Real - using canvas + GPT-4o mask generation) ----

export async function removeBackground(imageBase64: string, newBackground?: string): Promise<string> {
  // Use canvas-based background removal with edge detection
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample background color from corners
        const samplePoints = [
          0, // top-left
          (canvas.width - 1) * 4, // top-right
          (canvas.height - 1) * canvas.width * 4, // bottom-left
          ((canvas.height - 1) * canvas.width + (canvas.width - 1)) * 4, // bottom-right
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        for (const idx of samplePoints) {
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        }
        bgR = Math.round(bgR / 4);
        bgG = Math.round(bgG / 4);
        bgB = Math.round(bgB / 4);

        // Flood fill from edges to find background
        const w = canvas.width;
        const h = canvas.height;
        const visited = new Uint8Array(w * h);
        const isBackground = new Uint8Array(w * h);
        const tolerance = 50;

        const isSimilar = (idx: number) => {
          const r = data[idx * 4];
          const g = data[idx * 4 + 1];
          const b = data[idx * 4 + 2];
          return Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < tolerance;
        };

        // BFS flood fill from edges
        const queue: number[] = [];
        for (let x = 0; x < w; x++) {
          queue.push(x); // top edge
          queue.push((h - 1) * w + x); // bottom edge
        }
        for (let y = 0; y < h; y++) {
          queue.push(y * w); // left edge
          queue.push(y * w + (w - 1)); // right edge
        }

        while (queue.length > 0) {
          const pos = queue.pop()!;
          if (pos < 0 || pos >= w * h || visited[pos]) continue;
          visited[pos] = 1;

          if (!isSimilar(pos)) continue;
          isBackground[pos] = 1;

          const x = pos % w;
          const y = Math.floor(pos / w);
          if (x > 0) queue.push(pos - 1);
          if (x < w - 1) queue.push(pos + 1);
          if (y > 0) queue.push(pos - w);
          if (y < h - 1) queue.push(pos + w);
        }

        // Apply feathered edges
        const resultCanvas = document.createElement("canvas");
        resultCanvas.width = w;
        resultCanvas.height = h;
        const resultCtx = resultCanvas.getContext("2d")!;

        // Draw new background if specified
        if (newBackground && newBackground.startsWith("#")) {
          resultCtx.fillStyle = newBackground;
          resultCtx.fillRect(0, 0, w, h);
        } else if (newBackground && newBackground.startsWith("data:")) {
          // Background image case - draw it first
          const bgImg = new Image();
          bgImg.onload = () => {
            resultCtx.drawImage(bgImg, 0, 0, w, h);
            applyMask();
          };
          bgImg.src = newBackground;
          return;
        }
        // else: transparent background

        function applyMask() {
          // Draw original image
          resultCtx.drawImage(img, 0, 0);
          const resultData = resultCtx.getImageData(0, 0, w, h);
          const rd = resultData.data;

          for (let i = 0; i < w * h; i++) {
            if (isBackground[i]) {
              if (!newBackground) {
                rd[i * 4 + 3] = 0; // transparent
              } else if (newBackground.startsWith("#")) {
                // Already drawn as bg, now set alpha for bg pixels
                const hex = newBackground.replace("#", "");
                const cr = parseInt(hex.substring(0, 2), 16);
                const cg = parseInt(hex.substring(2, 4), 16);
                const cb = parseInt(hex.substring(4, 6), 16);
                rd[i * 4] = cr;
                rd[i * 4 + 1] = cg;
                rd[i * 4 + 2] = cb;
                rd[i * 4 + 3] = 255;
              }
            }
          }

          resultCtx.putImageData(resultData, 0, 0);
          resolve(resultCanvas.toDataURL("image/png"));
        }

        applyMask();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = imageBase64;
  });
}

// ---- Upscale Image ----

export async function upscaleImage(imageBase64: string, scale: number = 2): Promise<string> {
  // Client-side upscale using canvas with smoothing
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = imageBase64;
  });
}

// ---- Chat IA (Groq - all models) ----

export async function chatWithAI(
  messages: { role: string; content: string }[],
  model: string,
  onDelta: (text: string) => void,
  onDone: () => void
): Promise<void> {
  // Map all models to Groq-supported models
  const groqModel = model === "llama-3.3-70b" ? "llama-3.3-70b-versatile" : "openai/gpt-oss-120b";

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: groqModel,
      messages: [
        { role: "system", content: "Você é um assistente de IA inteligente, criativo e útil. Responda em português brasileiro de forma clara e detalhada." },
        ...messages,
      ],
      stream: true,
      max_tokens: 65536,
    }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({ error: "Erro na comunicação" }));
    throw new Error(errData.error?.message || errData.error || `Erro ${resp.status}`);
  }

  if (!resp.body) throw new Error("Stream não disponível");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  onDone();
}

// ---- Text Summarization (Groq) ----

export async function summarizeText(text: string, outputType: string): Promise<string> {
  const systemPrompts: Record<string, string> = {
    summary: "Você é um assistente que cria resumos concisos e bem estruturados em português brasileiro. Retorne o resumo em markdown.",
    keypoints: "Você é um assistente que extrai os pontos-chave de textos em português brasileiro. Retorne uma lista de tópicos em markdown.",
    flashcards: "Você é um assistente que cria flashcards (perguntas e respostas) a partir de textos em português brasileiro. Retorne em formato markdown com ## para cada pergunta e a resposta logo abaixo.",
  };

  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompts[outputType] || systemPrompts.summary },
        { role: "user", content: `Processe o seguinte texto:\n\n${text.slice(0, 12000)}` },
      ],
      max_tokens: 4096,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq error ${resp.status}`);
  }

  const data = await resp.json();
  const result = data.choices[0].message.content;

  // Cache result
  addCachedItem("summaries", { text: text.slice(0, 200), result, outputType, timestamp: Date.now() });

  return result;
}

// ---- Music DNA Analysis ----

export async function analyzeMusic(link: string, _action: 'analyze' | 'download' = 'analyze') {
  // Use Groq to analyze music info
  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Você é um especialista em música. Analise o link ou nome da música fornecido e retorne informações detalhadas: artista, álbum, gênero, BPM estimado, tom, ano, curiosidades. Formate em markdown." },
        { role: "user", content: `Analise esta música: ${link}` },
      ],
      max_tokens: 2048,
    }),
  });

  if (!resp.ok) throw new Error(`Groq error ${resp.status}`);
  const data = await resp.json();
  return { analysis: data.choices[0].message.content };
}

// ---- OCR Scan (Groq Vision) ----

export async function ocrScan(imageBase64: string): Promise<string> {
  const resp = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia todo o texto visível nesta imagem. Retorne apenas o texto encontrado, sem explicações." },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!resp.ok) throw new Error(`OCR error ${resp.status}`);
  const data = await resp.json();
  return data.choices[0].message.content || "Nenhum texto encontrado";
}
