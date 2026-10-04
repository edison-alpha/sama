"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageSkeleton } from "@/components/ui/states";

/** Creating a Circle now happens in a modal on the Circles page; old links to /circles/new open it there. */
export default function NewCirclePage() {
  const router = useRouter();
  useEffect(() => router.replace("/circles?create=1"), [router]);
  return <PageSkeleton />;
}
