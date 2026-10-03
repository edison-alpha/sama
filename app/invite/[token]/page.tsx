import { redirect } from "next/navigation";

/**
 * Invite links open onboarding first; the token is redeemed at POST /api/circles/[id]/join after sign-in.
 * The starter forwards to the Circle page (mock tokens are `${circleId}-${random}`).
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const circleId = token.split("-").slice(0, 2).join("-");
  redirect(`/start?next=${encodeURIComponent(`/circles/${circleId}?invite=${token}`)}`);
}
