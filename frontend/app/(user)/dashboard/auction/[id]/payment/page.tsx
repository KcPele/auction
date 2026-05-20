import { PaymentInstructionsScreen } from "@/app/components/user-dashboard/screens/PaymentInstructionsScreen";

export default async function PaymentInstructionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentInstructionsScreen auctionId={id} />;
}
