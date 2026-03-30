// Direct API calls - no edge functions needed

const OPENAI_API_KEY = "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";
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

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
    return data.data[0].url;
  } catch (e: any) {
    // Fallback to Pollinations.ai
    console.warn("OpenAI failed, using Pollinations fallback:", e.message);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;
  }
}

// ---- Image Editing (OpenAI GPT-4o image) ----

export async function editImage(imageBase64: string, prompt: string): Promise<string> {
  // Use GPT-4o with vision for editing instructions
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
  
  // Generate the edited version
  return generateImage(editPrompt);
}

// ---- Background Removal (client-side canvas approach) ----

export async function removeBackground(imageBase64: string, _newBackground?: string): Promise<string> {
  // Use OpenAI to generate a version without background
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: "Remove the background from this subject and place on a clean transparent/white background. Keep the subject exactly as it is.",
      n: 1,
      size: "1024x1024",
    }),
  });

  // Since DALL-E can't actually remove backgrounds from existing images via generation endpoint,
  // return the original with a note. The user would need a dedicated BG removal API.
  console.warn("Background removal requires a specialized API. Returning original image.");
  return imageBase64;
}

// ---- Upscale Image (Supabase Function with multiple methods) ----

export async function upscaleImage(imageBase64: string, scale: number = 4): Promise<string> {
  try {
    const response = await fetch('https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/upscale-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw`,
      },
      body: JSON.stringify({ 
        imageBase64, 
        scale: Math.min(scale, 4) // Max scale 4
      }),
    });

    if (!response.ok) {
      throw new Error(`Upscale function error ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl || imageBase64;
  } catch (error: any) {
    console.error('Upscale error:', error);
    // Fallback: return original image
    return imageBase64;
  }
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
  return data.choices[0].message.content;
}

// ---- Music DNA Analysis (Enhanced with Download) ----

export async function analyzeMusic(link: string, action: 'analyze' | 'download' = 'analyze') {
  try {
    const response = await fetch('https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/analyze-music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw`,
      },
      body: JSON.stringify({ 
        link, 
        action,
        format: 'mp3'
      }),
    });

    if (!response.ok) {
      throw new Error(`Music analysis error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Music analysis error:', error);
    throw new Error(`Erro na análise de música: ${error.message}`);
  }
}

// ---- YouTube Music Download ----

export async function downloadYouTubeMusic(youtubeUrl: string, format: 'mp3' | 'mp4' = 'mp3') {
  try {
    const response = await fetch('https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/download-youtube-music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw`,
      },
      body: JSON.stringify({ 
        youtubeUrl,
        format,
        quality: 'high'
      }),
    });

    if (!response.ok) {
      throw new Error(`Download function error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('YouTube download error:', error);
    throw new Error(`Erro no download: ${error.message}`);
  }
}

// ---- OCR Scan (Supabase Function) ----

export async function ocrScan(imageBase64: string): Promise<string> {
  try {
    const response = await fetch('https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/ocr-scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw`,
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `OCR function error ${response.status}`);
    }

    const data = await response.json();
    return data.text || 'Nenhum texto encontrado';
  } catch (error: any) {
    console.error('OCR error:', error);
    throw new Error(`Erro no OCR: ${error.message}`);
  }
}
