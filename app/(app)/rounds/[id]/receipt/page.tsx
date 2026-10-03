import { ReceiptPage } from "@/components/round/receipt-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReceiptPage roundId={id} />;
}
