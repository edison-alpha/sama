import { RoundJourney } from "@/components/round/round-journey";

export default async function RoundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoundJourney roundId={id} />;
}
