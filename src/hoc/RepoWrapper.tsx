import FullPageSpinner from "@/components/FullPageSpinner/FullPageSpinner";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { Page } from "@/types/Document";
import { WebSocketAuthAdapter } from "@/ws/WebSocketAuthAdapter";
import {
  AutomergeUrl,
  DocHandle,
  IndexedDBStorageAdapter,
  Repo,
  RepoContext,
} from "@automerge/react";
import { JSX, useEffect, useState } from "react";

const ws = new WebSocketAuthAdapter(import.meta.env.VITE_SOCKET_URL, undefined, {
  getToken: () => localStorage.getItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY) || "",
  useProtocols: true,
});

const repo = new Repo({
  network: [ws],
  storage: new IndexedDBStorageAdapter(),
});

// Add the repo to the global window object so it can be accessed in the browser console
// This is useful for debugging and testing purposes.
declare global {
  interface Window {
    repo: Repo;
    // We also add the handle to the global window object for debugging
    handle: DocHandle<Page>;
  }
}
window.repo = repo;

type Props = {
  render: () => JSX.Element;
  rootDocUrl: AutomergeUrl;
};

export default function RepoWrapper({ render, rootDocUrl }: Props) {
  const [shouldRender, setShouldRender] = useState(false);
  const isHealthy = useBackendHealth();
  useEffect(() => {
    const connectToSocket = async () => {
      await ws.whenReady();
      setShouldRender(true);
    };
    const findRootDoc = async () => {
      const req = indexedDB.open("automerge-repo");
      req.onsuccess = async () => {
        try {
          const rootDoc = await repo.find(rootDocUrl);
          if (rootDoc.state === "ready") {
            setShouldRender(true);
          }
        } catch (e) {
          connectToSocket();
          console.log("Root doc on local has not been found");
        }
      };
      req.onerror = () => console.warn("IndexedDB not initialized yet");
    };
    connectToSocket();
    if (isHealthy === false) {
      findRootDoc();
    }
  }, [isHealthy]);
  return shouldRender ? (
    <RepoContext.Provider value={repo}>{render()}</RepoContext.Provider>
  ) : (
    <FullPageSpinner />
  );
}
