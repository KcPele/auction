import { notFound } from "next/navigation";
import { AccessCodesScreen } from "@/app/components/admin-dashboard/screens/AccessCodesScreen";
import { AuctionsScreen } from "@/app/components/admin-dashboard/screens/AuctionsScreen";
import { DisputesScreen } from "@/app/components/admin-dashboard/screens/DisputesScreen";
import { HealthScreen } from "@/app/components/admin-dashboard/screens/HealthScreen";
import { ListingsScreen } from "@/app/components/admin-dashboard/screens/ListingsScreen";
import { MechanicsScreen } from "@/app/components/admin-dashboard/screens/MechanicsScreen";
import { NotificationsScreen } from "@/app/components/admin-dashboard/screens/NotificationsScreen";
import { PaymentsScreen } from "@/app/components/admin-dashboard/screens/PaymentsScreen";
import { SettlementScreen } from "@/app/components/admin-dashboard/screens/SettlementScreen";
import { SettingsScreen } from "@/app/components/admin-dashboard/screens/SettingsScreen";
import { UsersScreen } from "@/app/components/admin-dashboard/screens/UsersScreen";
import { WithdrawalsScreen } from "@/app/components/admin-dashboard/screens/WithdrawalsScreen";

const SCREENS: Record<string, () => React.ReactElement> = {
  auctions: AuctionsScreen,
  "access-codes": AccessCodesScreen,
  listings: ListingsScreen,
  disputes: DisputesScreen,
  users: UsersScreen,
  mechanics: MechanicsScreen,
  payments: PaymentsScreen,
  notifications: NotificationsScreen,
  settings: SettingsScreen,
  settlements: SettlementScreen,
  withdrawals: WithdrawalsScreen,
  health: HealthScreen,
};

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const Screen = SCREENS[section];
  if (!Screen) notFound();
  return <Screen />;
}
