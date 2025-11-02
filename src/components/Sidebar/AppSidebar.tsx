// AppSidebar.tsx
import React, { Suspense } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  Sidebar,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { AutomergeUrl, useDocument } from "@automerge/react";
import { Page } from "@/Types/Document";
import SidebarNode from "./SidebarItem/SidebarNode";
import NewPageButton from "./NewPageButton/NewPageButton";

export default function AppSidebar() {
  const rootUrl = "automerge:3hf4GDwxXBYJ7xRU2DuJ35F9ar2T" as AutomergeUrl;

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
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NewPageButton docUrl={rootUrl} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

/** Loads the root doc once and renders *its children* as tree nodes */
function SidebarRootChildren({ rootUrl }: { rootUrl: AutomergeUrl }) {
  const [root] = useDocument<Page>(rootUrl);
  const children: AutomergeUrl[] = root?.children || [];
  return (
    <Suspense fallback={null}>
      {children.map(childUrl => (
        <Suspense fallback={null} key={childUrl}>
          <SidebarNode key={childUrl} docUrl={childUrl} />
        </Suspense>
      ))}
    </Suspense>
  );
}
