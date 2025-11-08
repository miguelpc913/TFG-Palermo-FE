import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./App.css";
import { Repo, IndexedDBStorageAdapter, RepoContext, DocHandle } from "@automerge/react";
import { Page } from "./types/Document.ts";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// const ws = new WebSocketClientAdapter("wss://tfg-palermo-be.onrender.com/");
const repo = new Repo({
  network: [
    // new WebSocketClientAdapter("ws://localhost:3030"),
    // ws,
  ],
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
// Depending if we have an AutomergeUrl, either find or create the document

async function init() {
  // await ws.whenReady();
  // ws.on?.("peer-candidate", async () => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Suspense fallback={<div>Loading a document...</div>}>
        <RepoContext.Provider value={repo}>
          <RouterProvider router={router} />
        </RepoContext.Provider>
      </Suspense>
    </React.StrictMode>
  );
  // });
}
init();
