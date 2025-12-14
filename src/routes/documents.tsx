import Editor from "@/components/Editor/Editor";
import AppSidebar from "@/components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Page } from "@/types/Document";
import { AutomergeUrl, useRepo, useDocument, isValidAutomergeUrl } from "@automerge/react";
import { useEffect } from "react";
import { useHash } from "react-use";
import { createFileRoute, redirect } from "@tanstack/react-router";
import RepoWrapper from "@/hoc/RepoWrapper";
import ConnectionStatus from "@/components/ConnectionStatus/ConnectionStatus";
import getJwtPayload from "@/utils/getJwtPayload";

const token = localStorage.getItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY);
const { rootDocUrl } = getJwtPayload();

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
  useEffect(() => {
    // si no hay selección, limpiamos al instante
    if (!selectedDocUrl) {
      if (doc.children && doc.children.length > 0) {
        setHash(doc.children[0]);
      }
      return;
    }
  }, [selectedDocUrl]);
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

          {selectedDocUrl ? <Editor key={selectedDocUrl} selectedDocUrl={selectedDocUrl} /> : null}
        </main>
      </SidebarProvider>
    </>
  );
}

const WrappedDocuments = () => {
  if (token !== null && isValidAutomergeUrl(rootDocUrl)) {
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
