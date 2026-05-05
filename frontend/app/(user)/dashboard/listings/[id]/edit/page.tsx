import { Suspense } from "react";
import { EditListingScreen } from "@/app/components/user-dashboard/screens/EditListingScreen";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <EditListingScreen id={id} />
    </Suspense>
  );
}
