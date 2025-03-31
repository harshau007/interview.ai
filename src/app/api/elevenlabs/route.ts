import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Sarah voice ID
const ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });

    const audio = await elevenlabs.generate({
      voice: ELEVENLABS_VOICE_ID,
      text,
      model_id: ELEVENLABS_MODEL_ID,
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
        "Cache-Control": "no-cache",
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