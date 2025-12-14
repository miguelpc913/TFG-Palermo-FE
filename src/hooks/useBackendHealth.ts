import { useEffect, useState } from "react";

export function useBackendHealth(
  baseUrl: string = import.meta.env.VITE_API_URL,
  intervalMs = 10000
) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000); // 2s timeout

        const res = await fetch(`${baseUrl}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        clearTimeout(timeout);
        if (!cancelled) setIsHealthy(res.ok);
      } catch {
        if (!cancelled) setIsHealthy(false);
      }
    };

    // first check
    checkHealth();
    // periodic checks
    const interval = setInterval(checkHealth, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [baseUrl, intervalMs]);

  return isHealthy;
}
