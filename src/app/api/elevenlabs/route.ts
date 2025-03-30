import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/secure-storage";
import { ElevenLabsClient } from "elevenlabs";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const config = await loadConfig();

    // if (!config?.elevenLabsApiKey) {
    //   return NextResponse.json(
    //     { error: "ElevenLabs API key not configured" },
    //     { status: 400 }
    //   );
    // }

    const elevenlabs = new ElevenLabsClient({
      apiKey: config?.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY,
    });

    const audio = await elevenlabs.generate({
      voice: "Sarah",
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });

    // Convert Readable stream to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
} 