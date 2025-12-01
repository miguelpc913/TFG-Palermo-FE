import { useBackendHealth } from "@/hooks/useBackendHealth";
import { Wifi, WifiOff } from "lucide-react";

export default function ConnectionStatus() {
  const isHealthy = useBackendHealth(import.meta.env.VITE_API_URL);
  return <div className="">{isHealthy ? <Wifi /> : <WifiOff />}</div>;
}
