import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./App.css";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

async function init() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Suspense fallback={<div>Loading a document...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </React.StrictMode>
  );
}
init();
