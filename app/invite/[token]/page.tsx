import { InviteLanding } from "@/components/circles/invite-landing";

/**
 * An invite link: resolve the code with the API (it works before sign-in), show which circle it opens, then continue to
 * the circle with the code attached. The code is redeemed when the member presses Join (POST /api/circles/:id/join).
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteLanding code={decodeURIComponent(token)} />;
}
