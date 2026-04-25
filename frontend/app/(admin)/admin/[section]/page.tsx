import { notFound } from "next/navigation";
import { PlaceholderScreen } from "@/app/components/admin-dashboard/screens/PlaceholderScreen";

const VALID = new Set([
  "auctions",
  "access-codes",
  "listings",
  "disputes",
  "users",
  "mechanics",
  "payments",
  "notifications",
  "settings",
]);

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!VALID.has(section)) notFound();
  return <PlaceholderScreen section={section} />;
}
