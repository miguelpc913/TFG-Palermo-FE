import { isValidAutomergeUrl, useDocument, useRepo, type AutomergeUrl } from "@automerge/react";
import AppSidebar from "./components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Page } from "./Types/Document";
import { useHash } from "react-use";
import { useEffect, useState } from "react";
import Editor from "./components/Editor/Editor";

type Props = {
  rootDocUrl: AutomergeUrl;
};

function App({ rootDocUrl }: Props) {
  const repo = useRepo();
  const [doc, changeDoc] = useDocument<Page>(rootDocUrl, { suspense: true });
  const [hash, setHash] = useHash();
  const handleNewPage = () => {
    const newPage = repo.create<Page>();
    changeDoc(d => {
      if (d.children) {
        d.children.push(newPage.url);
      } else {
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
      setDelayedDocUrl(null);
      return;
    }
    const t = setTimeout(() => setDelayedDocUrl(selectedDocUrl), 1);
    return () => clearTimeout(t); // cancela si cambia antes de 1s
  }, [selectedDocUrl]);

  useEffect(() => {
    if (typeof doc.children === "undefined" || doc.children.length === 0) {
      handleNewPage();
    }
  }, [doc?.children?.length]);
  return (
    <>
      <SidebarProvider open={true}>
        <AppSidebar />
        <main className="flex-1">
          <SidebarTrigger />

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

export default App;
