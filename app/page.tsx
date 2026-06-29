import { AuthProvider } from "@/lib/auth";
import AppGate from "@/components/AppGate";

export default function Page() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
