import { Page } from "@/Types/Document";
import { AutomergeUrl, useDocument, useRepo } from "@automerge/react";
import { useHash } from "react-use";
import { Plus } from "lucide-react";

export default function NewPageButton({ docUrl }: { docUrl: AutomergeUrl }) {
  const [__, changeDoc] = useDocument<Page>(docUrl, {
    suspense: true,
  });
  const repo = useRepo();
  const handleNewPage = () => {
    const newPage = repo.create<Page>();
    changeDoc(d => d.children.push(newPage.url));
    setHash(newPage.url);
  };
  const [_, setHash] = useHash();

  return (
    <button
      className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm"
      onClick={handleNewPage}
    >
      <Plus /> New page
    </button>
  );
}
