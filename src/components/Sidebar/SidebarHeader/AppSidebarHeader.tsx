import { SidebarGroupLabel, SidebarHeader } from "@/components/ui/sidebar";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { EmailLogo } from "./EmailLogo/EmailLogo";
import NewPageButton from "./NewPageButton/NewPageButton";
import { SearchForm } from "./Search/SearchSidebar";
import { AutomergeUrl } from "@automerge/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import getJwtPayload from "@/utils/getJwtPayload";

type Props = {
  rootDocUrl: AutomergeUrl;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
};

export default function AppSidebarHeader({ rootDocUrl, setSearchQuery }: Props) {
  const { email } = getJwtPayload();
  const navigate = useNavigate();
  const logoutHandler = async () => {
    localStorage.removeItem(import.meta.env.VITE_LOCAL_STORAGE_TOKEN_KEY);
    await navigate({
      to: "/login",
    });
  };
  return (
    <SidebarHeader className="border-b-1 border-b-gray-200">
      {email ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:p-0! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <EmailLogo email={email} size="sm" />
              <SidebarGroupLabel>{email}</SidebarGroupLabel>
              <ChevronsUpDown className="ml-auto" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={"bottom"}
            sideOffset={4}
          >
            <DropdownMenuItem
              className="flex  items-center justify-between "
              onClick={logoutHandler}
            >
              <span>Log out</span> <LogOut />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <SearchForm
        onChange={e => {
          const value = e.target.value || "";
          setSearchQuery(value);
        }}
      />
      <NewPageButton docUrl={rootDocUrl} />
    </SidebarHeader>
  );
}
