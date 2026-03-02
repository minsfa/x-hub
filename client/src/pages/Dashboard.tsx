import { useAuth } from "@/contexts/AuthContext";
import OwnerDashboard from "./OwnerDashboard";
import MakerDashboard from "./MakerDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role ?? "OWNER";

  if (role === "MAKER") {
    return <MakerDashboard />;
  }
  return <OwnerDashboard />;
}
