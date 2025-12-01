import Editor from "@/components/Editor/Editor";
import AppSidebar from "@/components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Page } from "@/types/Document";
import { AutomergeUrl, useRepo, useDocument, isValidAutomergeUrl } from "@automerge/react";
import { useState, useEffect } from "react";
import { useHash } from "react-use";
import { createFileRoute, redirect } from "@tanstack/react-router";
import RepoWrapper from "@/hoc/RepoWrapper";
import ConnectionStatus from "@/components/ConnectionStatus/ConnectionStatus";

const token = localStorage.getItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY);
const rootDocUrl = localStorage.getItem(
  import.meta.env.VITE_LOCAL_STORAGE_ROOT_DOC_KEY
) as AutomergeUrl;

function Documents() {
  const repo = useRepo();
  const [doc, changeDoc] = useDocument<Page>(rootDocUrl, { suspense: true });
  const [hash, setHash] = useHash();
  const handleFirstDoc = () => {
    const newPage = repo.create<Page>();
    changeDoc(d => {
      if (d.children && d.children.length === 0) {
        d.children.push(newPage.url);
      } else if (typeof d.children === "undefined") {
        d.children = [newPage.url];
      }
    });
    setHash(newPage.url);
  };

  const cleanHash = hash.slice(1);
  const selectedDocUrl =
    cleanHash && isValidAutomergeUrl(cleanHash) ? (cleanHash as AutomergeUrl) : null;

  const [delayedDocUrl, setDelayedDocUrl] = useState<AutomergeUrl | null>(null);

  useEffect(() => {
    // si no hay selección, limpiamos al instante
    if (!selectedDocUrl) {
      if (doc.children && doc.children.length > 0) {
        setHash(doc.children[0]);
      }
      setDelayedDocUrl(null);
      return;
    }
    const t = setTimeout(() => setDelayedDocUrl(selectedDocUrl), 1);
    return () => clearTimeout(t); // cancela si cambia antes de 1s
  }, [selectedDocUrl]);

  useEffect(() => {
    if (typeof doc.children === "undefined" || doc.children.length === 0) {
      handleFirstDoc();
    }
  }, [doc?.children?.length]);

  useEffect(() => {
    if (typeof doc.children === "undefined" || doc.children.length === 0) {
      handleFirstDoc();
    }
  }, [doc?.children?.length]);

  return (
    <>
      <SidebarProvider open={true}>
        <AppSidebar rootDocUrl={rootDocUrl} />
        <main className="flex-1">
          <div className="flex justify-between m-2">
            <SidebarTrigger />
            <ConnectionStatus />
          </div>

          {selectedDocUrl === null ? (
            <div className="p-4 text-sm text-muted-foreground">Selecciona un documento</div>
          ) : null}
          {/* Opcional: placeholder mientras corre el delay */}
          {delayedDocUrl !== selectedDocUrl && (
            <div className="p-4 text-sm text-muted-foreground">Cargando editor…</div>
          )}

          {delayedDocUrl && delayedDocUrl === selectedDocUrl ? (
            // usar la URL demorada como key fuerza el re-mount tras el delay
            <Editor key={delayedDocUrl} selectedDocUrl={delayedDocUrl} />
          ) : null}
        </main>
      </SidebarProvider>
    </>
  );
}

const WrappedDocuments = () => {
  if (token === null && isValidAutomergeUrl(rootDocUrl)) {
  } else {
    return <RepoWrapper render={() => <Documents />} rootDocUrl={rootDocUrl}></RepoWrapper>;
  }
};
export const Route = createFileRoute("/documents")({
  component: WrappedDocuments,
  beforeLoad: async () => {
    if (token === null && isValidAutomergeUrl(rootDocUrl)) {
      throw redirect({
        to: "/",
      });
    }
  },
});
