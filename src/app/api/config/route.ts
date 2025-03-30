import { NextResponse } from "next/server";
import { saveConfig, loadConfig } from "@/lib/secure-storage";

export async function GET() {
  try {
    const config = await loadConfig();
    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const config = await request.json();
    
    // Validate required fields
    if (!config.geminiApiKey || !config.mongodbUri || !config.elevenLabsApiKey) {
      return NextResponse.json(
        { error: "Missing required configuration fields" },
        { status: 400 }
      );
    }

    // Save to secure storage
    await saveConfig(config);
    
    return NextResponse.json(config);
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
} 