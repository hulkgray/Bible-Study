import { useState, useEffect, useCallback } from "react";
import type { DisplayModel } from "@/lib/display-model";
import type { GatewayLanguageModelEntry } from "@ai-sdk/gateway";
import { SUPPORTED_MODELS, MODEL_INFO } from "@/lib/constants";

const MAX_RETRIES = 2;
const RETRY_DELAY_MILLIS = 3000;

/**
 * Build display models from Gateway response, filtered by SUPPORTED_MODELS.
 * Falls back to local MODEL_INFO if a model isn't in the Gateway response.
 */
function buildModelList(gatewayModels: GatewayLanguageModelEntry[]): DisplayModel[] {
  const gatewayIds = new Set(gatewayModels.map((m) => m.id));

  // Start with models that the Gateway knows about
  const fromGateway = gatewayModels
    .filter((model) => SUPPORTED_MODELS.includes(model.id))
    .map((model) => ({
      id: model.id,
      label: MODEL_INFO[model.id]?.label ?? model.name,
    }));

  // Add any SUPPORTED_MODELS not returned by Gateway (fallback from local metadata)
  const fromLocal = SUPPORTED_MODELS
    .filter((id) => !gatewayIds.has(id) && MODEL_INFO[id])
    .map((id) => ({
      id,
      label: MODEL_INFO[id].label,
    }));

  return [...fromGateway, ...fromLocal];
}

/**
 * Fallback: if Gateway API is unreachable, use local MODEL_INFO as source of truth
 */
function buildFallbackList(): DisplayModel[] {
  return SUPPORTED_MODELS
    .filter((id) => MODEL_INFO[id])
    .map((id) => ({
      id,
      label: MODEL_INFO[id].label,
    }));
}

export function useAvailableModels() {
  const [models, setModels] = useState<DisplayModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchModels = useCallback(
    async (isRetry: boolean = false) => {
      if (!isRetry) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetch("/api/models");
        if (!response.ok) {
          throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        const newModels = buildModelList(data.models);
        setModels(newModels.length > 0 ? newModels : buildFallbackList());
        setError(null);
        setRetryCount(0);
        setIsLoading(false);
      } catch (err) {
        // If the Gateway API is down, use local fallback so the UI still works
        if (retryCount >= MAX_RETRIES) {
          console.warn("[useAvailableModels] Gateway unreachable, using local fallback");
          setModels(buildFallbackList());
          setError(null);
          setIsLoading(false);
        } else {
          setError(
            err instanceof Error ? err : new Error("Failed to fetch models")
          );
          setRetryCount((prev) => prev + 1);
          setIsLoading(true);
        }
      }
    },
    [retryCount]
  );

  useEffect(() => {
    if (retryCount === 0) {
      fetchModels(false);
    } else if (retryCount > 0 && retryCount <= MAX_RETRIES) {
      const timerId = setTimeout(() => {
        fetchModels(true);
      }, RETRY_DELAY_MILLIS);
      return () => clearTimeout(timerId);
    }
  }, [retryCount, fetchModels]);

  return { models, isLoading, error };
}
