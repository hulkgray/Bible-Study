"use client";

import { useAvailableModels } from "@/lib/hooks/use-available-models";
import { Loader2, ChevronDown } from "lucide-react";
import { DEFAULT_MODEL, MODEL_INFO } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { memo } from "react";
import { cn } from "@/lib/utils";

type ModelSelectorProps = {
  modelId: string;
  onModelChange: (modelId: string) => void;
};

const TIER_STYLES: Record<string, string> = {
  flagship: "text-gold",
  balanced: "text-emerald-400",
  fast: "text-sky-400",
};

export const ModelSelector = memo(function ModelSelector({
  modelId = DEFAULT_MODEL,
  onModelChange,
}: ModelSelectorProps) {
  const { models, isLoading, error } = useAvailableModels();

  // Group models by provider
  const grouped = models.reduce(
    (acc, model) => {
      const info = MODEL_INFO[model.id];
      const provider = info?.provider ?? "Other";
      if (!acc[provider]) acc[provider] = [];
      acc[provider].push(model);
      return acc;
    },
    {} as Record<string, typeof models>
  );

  return (
    <Select
      value={modelId}
      onValueChange={onModelChange}
      disabled={isLoading || !!error || !models?.length}
    >
      <SelectTrigger className="w-9 h-9 md:w-[180px] border-0 bg-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:outline-none focus:border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl font-medium text-sm p-0 md:px-3 [&_[data-placeholder]]:hidden md:[&_[data-placeholder]]:block [&>svg]:hidden md:[&>svg]:block">
        <div className="flex items-center justify-center w-full h-full md:hidden">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
        <div className="hidden md:flex items-center gap-2 w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm">Loading</span>
            </>
          ) : error ? (
            <span className="text-red-500 text-sm">Error</span>
          ) : !models?.length ? (
            <span className="text-sm">No models</span>
          ) : (
            <SelectValue placeholder="Select model" />
          )}
        </div>
      </SelectTrigger>

      <SelectContent className="rounded-2xl border-0 shadow-border-medium bg-popover/95 backdrop-blur-sm animate-scale-in min-w-[240px]" align="start" sideOffset={4}>
        {Object.entries(grouped).map(([provider, providerModels]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-2 py-1 font-semibold">
              {provider}
            </SelectLabel>
            {providerModels.map((model) => {
              const info = MODEL_INFO[model.id];
              return (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="rounded-lg transition-colors duration-150 ease-out"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span>{model.label}</span>
                      {info?.tier && (
                        <span
                          className={cn(
                            "text-[9px] uppercase font-bold tracking-wider",
                            TIER_STYLES[info.tier] ?? "text-muted-foreground"
                          )}
                        >
                          {info.tier === "flagship" ? "★" : info.tier === "balanced" ? "◆" : "⚡"}
                        </span>
                      )}
                    </div>
                    {info?.description && (
                      <span className="text-[10px] text-muted-foreground/60 leading-tight">
                        {info.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
});
