// AppSidebar.tsx
import { Suspense } from "react";
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
import { Page } from "@/types/Document";
import SidebarNode from "./SidebarItem/SidebarNode";
import NewPageButton from "./NewPageButton/NewPageButton";

type Props = {
  rootDocUrl: AutomergeUrl;
};

export default function AppSidebar({ rootDocUrl }: Props) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Suspense since useDocument is used with suspense: true */}
              <Suspense fallback={null}>
                <SidebarRootChildren rootUrl={rootDocUrl} />
              </Suspense>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NewPageButton docUrl={rootDocUrl} />
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
