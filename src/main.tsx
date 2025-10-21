import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./App.css";
import {
  Repo,
  BroadcastChannelNetworkAdapter,
  WebSocketClientAdapter,
  IndexedDBStorageAdapter,
  RepoContext,
  DocHandle,
} from "@automerge/react";
import { getOrCreateRoot, RootDocument } from "./utils/rootDoc.ts";

const repo = new Repo({
  network: [
    new BroadcastChannelNetworkAdapter(),
    new WebSocketClientAdapter("ws://localhost:3030"),
  ],
  storage: new IndexedDBStorageAdapter(),
});

// Add the repo to the global window object so it can be accessed in the browser console
// This is useful for debugging and testing purposes.
declare global {
  interface Window {
    repo: Repo;
    // We also add the handle to the global window object for debugging
    handle: DocHandle<RootDocument>;
  }
}
window.repo = repo;

// Depending if we have an AutomergeUrl, either find or create the document
const rootDocUrl = getOrCreateRoot(repo);
window.handle = await repo.find(rootDocUrl);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading a document...</div>}>
      <RepoContext.Provider value={repo}>
        test
        <App docUrl={window.handle.url} />
      </RepoContext.Provider>
    </Suspense>
  </React.StrictMode>
);
