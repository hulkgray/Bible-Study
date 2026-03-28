import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";
import { SUPPORTED_MODELS, MODEL_INFO } from "@/lib/constants";

/**
 * GET /api/models — List available AI models.
 * Falls back to local MODEL_INFO when Gateway is unreachable (e.g. local dev behind firewall).
 */
export async function GET() {
  try {
    const allModels = await gateway.getAvailableModels();
    return NextResponse.json({
      models: allModels.models.filter((model) =>
        SUPPORTED_MODELS.includes(model.id)
      ),
    });
  } catch (error) {
    console.warn("[API /models] Gateway unreachable, using local fallback:", (error as Error).message);

    // Build model list from local constants
    const fallbackModels = SUPPORTED_MODELS
      .filter((id) => MODEL_INFO[id])
      .map((id) => ({
        id,
        name: MODEL_INFO[id].label,
      }));

    return NextResponse.json({ models: fallbackModels });
  }
}
