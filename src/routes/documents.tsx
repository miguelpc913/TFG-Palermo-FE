import Editor from "@/components/Editor/Editor";
import AppSidebar from "@/components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Page } from "@/types/Document";
import { AutomergeUrl, useRepo, useDocument, isValidAutomergeUrl } from "@automerge/react";
import { Suspense, useEffect } from "react";
import { useHash } from "react-use";
import { createFileRoute, redirect } from "@tanstack/react-router";
import RepoWrapper from "@/hoc/RepoWrapper";
import ConnectionStatus from "@/components/ConnectionStatus/ConnectionStatus";
import getJwtPayload from "@/utils/getJwtPayload";
import FullPageSpinner from "@/components/FullPageSpinner/FullPageSpinner";

function Documents() {
  const { rootDocUrl } = getJwtPayload();
  const repo = useRepo();
  const [doc, changeDoc] = useDocument<Page>(rootDocUrl, { suspense: true });
  const [hash, setHash] = useHash();
  const handleFirstDoc = () => {
    const newPage = repo.create<Page>();
    changeDoc((d: Page) => {
      if (d.children && d.children.length === 0) {
        d.children.push(newPage.url);
      } else if (typeof d.children === "undefined") {
        d.children = [newPage.url];
      }
    });
    setHash(newPage.url);
  };
  console.log(rootDocUrl, "root doc");
  console.log(hash);
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
  if (!rootDocUrl) return;
  return (
    <>
      <SidebarProvider open={true}>
        <AppSidebar rootDocUrl={rootDocUrl} />
        <main className="flex-1">
          <div className="flex justify-between m-2 md:py-0 pt-5">
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
  const token = localStorage.getItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY);
  const { rootDocUrl } = getJwtPayload();
  if (token !== null && isValidAutomergeUrl(rootDocUrl) && rootDocUrl) {
    console.log("tried to render repo wrapper");

    return (
      <RepoWrapper
        render={() => (
          <Suspense fallback={<FullPageSpinner />}>
            <Documents />
          </Suspense>
        )}
        rootDocUrl={rootDocUrl}
      ></RepoWrapper>
    );
  }
};

export const Route = createFileRoute("/documents")({
  component: WrappedDocuments,
  beforeLoad: async () => {
    const token = localStorage.getItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY);
    const { rootDocUrl } = getJwtPayload();
    if ((token === null || !isValidAutomergeUrl(rootDocUrl)) && rootDocUrl) {
      localStorage.removeItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY);
      throw redirect({
        to: "/login",
      });
    }
  },
});
