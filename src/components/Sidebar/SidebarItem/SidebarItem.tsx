// AppSidebar.tsx
import React, { Suspense } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  Sidebar,
} from "../ui/sidebar";
import { AutomergeUrl, useDocument } from "@automerge/react";
import { Page } from "@/Types/Document";
import SidebarNode from "./SidebarItem/SidebarNode";

const ROOT_DOC_URL_KEY = "root-doc-url-4";

export default function AppSidebar() {
  const rootUrl =
    typeof window !== "undefined"
      ? (localStorage.getItem(ROOT_DOC_URL_KEY) as AutomergeUrl | null)
      : null;

  if (!rootUrl) return null;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Suspense since useDocument is used with suspense: true */}
              <Suspense fallback={null}>
                <SidebarRootChildren rootUrl={rootUrl} />
              </Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

/** Loads the root doc once and renders *its children* as tree nodes */
function SidebarRootChildren({ rootUrl }: { rootUrl: AutomergeUrl }) {
  const [root] = useDocument<Page>(rootUrl, { suspense: true });
  const children: AutomergeUrl[] = root.children || [];

  return (
    <>
      {children.map(childUrl => (
        <SidebarNode key={childUrl} docUrl={childUrl} />
      ))}
    </>
  );
}
