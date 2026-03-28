import { Chat } from "@/components/chat";

/**
 * AI Study page — RAG-powered theological research.
 * Reuses the inherited Chat component from the AI Gateway starter.
 */
export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ modelId: string }>;
}) {
  const { modelId } = await searchParams;
  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-screen">
      <Chat modelId={modelId} />
    </div>
  );
}
