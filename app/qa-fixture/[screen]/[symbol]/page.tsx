import { notFound } from "next/navigation";

export default async function QaPage({ params }: { params: Promise<{ screen: string; symbol: string }> }) {
  if (process.env.NODE_ENV !== "development" || process.env.SAMA_QA_FIXTURE !== "1" || process.env.NEXT_PUBLIC_SAMA_API_MODE === "live") notFound();
  const { screen, symbol } = await params;
  const { QaFixture } = await import("@/tests/fixtures/session");
  return <QaFixture screen={screen} symbol={symbol} />;
}
