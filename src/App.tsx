import { isValidAutomergeUrl, useDocument, useRepo, type AutomergeUrl } from "@automerge/react";
import { SyncControls } from "./components/SyncControls";
import { PageContent } from "./components/PageContent/Pages";
import AppSidebar from "./components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Page } from "./Types/Document";
import { useHash } from "react-use";
import { useEffect } from "react";

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const repo = useRepo();
  const [doc, changeDoc] = useDocument<Page>(docUrl, {
    suspense: true,
  });
  const [hash, setHash] = useHash();
  const handleNewPage = () => {
    const newPage = repo.create<Page>();
    changeDoc(d => d.children.push(newPage.url));
    setHash(newPage.url);
  };
  const cleanHash = hash.slice(1); // Remove the leading '#'
  const selectedDocUrl =
    cleanHash && isValidAutomergeUrl(cleanHash) ? (cleanHash as AutomergeUrl) : null;
  useEffect(() => {
    if (typeof doc.children === "undefined" || doc.children.length === 0) {
      handleNewPage();
    }
  }, [doc]);
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">
          <SidebarTrigger />
          <header>
            <button
              className="mx-auto  max-w-sm items-center gap-x-4 rounded-xl bg-white p-3 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
              onClick={handleNewPage}
            >
              + New page
            </button>
          </header>
          <div key={selectedDocUrl}>
            {selectedDocUrl ? <PageContent selectedDocUrl={selectedDocUrl} /> : null}
          </div>
        </main>
      </SidebarProvider>

      <footer>
        <SyncControls docUrl={docUrl} />
        <p className="footer-copy">Powered by Automerge + Vite + React + TypeScript</p>
      </footer>
    </>
  );
}

export default App;
