import { DeliveryTrackingScreen } from "@/app/components/user-dashboard/screens/DeliveryTrackingScreen";

export default function DeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 16 — params is a Promise
  // We use a wrapper component to unwrap
  return <DeliveryPageInner params={params} />;
}

import { use } from "react";
function DeliveryPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DeliveryTrackingScreen auctionId={id} />;
}
