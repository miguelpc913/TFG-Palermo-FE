import { Page } from "@/types/Document";
import createHeadingBlock from "@/utils/createBlock";
import { ChangeFn, Repo } from "@automerge/react";
import { Block, BlockNoteEditor, insertOrUpdateBlock } from "@blocknote/core";
import { HiOutlineGlobeAlt } from "react-icons/hi";

const insertNewPageBlock = (
  editor: BlockNoteEditor,
  changeDoc: (changeFn: ChangeFn<Page>) => void,
  repo: Repo,
  setHash: (newHash: string) => void
) => ({
  title: "Create new page",
  onItemClick: async () => {
    // const headingBlock = createHeadingBlock("") as Block;
    // const spans = blockNoteBlocksToAutomergeSpans([headingBlock]);
    const newPage = repo.create<Page>({ children: [], richText: "" });
    changeDoc(d => {
      d.children ? d.children.push(newPage.url) : (d.children = [newPage.url]);
    });
    setTimeout(() => {
      insertOrUpdateBlock(editor, {
        type: "docLink",
        props: { link: newPage.url, textAlignment: "left", textColor: "default" },
        content: [],
      });
      setTimeout(() => {
        setHash(newPage.url);
      }, 250);
    });
  },
  aliases: ["Page", "new page"],
  group: "Other",
  icon: <HiOutlineGlobeAlt size={18} />,
  subtext: "Used to insert a new page below.",
});

export default insertNewPageBlock;
