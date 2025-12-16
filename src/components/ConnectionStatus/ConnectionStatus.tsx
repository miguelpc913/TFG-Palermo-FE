import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useWsLastMessage } from "@/hooks/useWsLastMessage";
import { Wifi, WifiOff, WifiSync } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function ConnectionStatus() {
  const isHealthy = useBackendHealth(import.meta.env.VITE_API_URL);
  const lastSyncAt = useRef<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastMessage = useWsLastMessage();
  useEffect(() => {
    if (lastMessage?.type !== "sync") return;

    lastSyncAt.current = Date.now();
    setIsSyncing(true);

    const t = setTimeout(() => {
      // if no sync for 500ms → idle
      if (Date.now() - (lastSyncAt.current ?? 0) >= 500) {
        setIsSyncing(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [lastMessage]);

  return isSyncing ? (
    <WifiSync data-testid={"syncing-logo"} />
  ) : (
    <>
      {isHealthy ? (
        <Wifi data-testid={"connected-logo"} />
      ) : (
        <WifiOff data-testid={"not-connected-logo"} />
      )}
    </>
  );
}
