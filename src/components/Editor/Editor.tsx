import {
  BlockNoteEditor,
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  filterSuggestionItems,
  insertOrUpdateBlock,
} from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { createDocLink } from "../PageBlock/PageBlock";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { Page } from "@/Types/Document";
import { ChangeFn, Doc, Repo, useRepo } from "@automerge/react";

type Props = {
  doc: Doc<Page>;
  changeDoc: (changeFn: ChangeFn<Page>) => void;
};

const insertNewPage = (
  editor: BlockNoteEditor,
  changeDoc: (changeFn: ChangeFn<Page>) => void,
  repo: Repo
) => ({
  title: "Create new page",
  onItemClick: async () => {
    const newPage = repo.create<Page>();
    changeDoc(d => {
      if (d.children) {
        d.children.push(newPage.url);
      } else {
        d.children = [newPage.url];
      }
    });
    insertOrUpdateBlock(editor, {
      type: "docLink",
      content: [],
    });
  },
  aliases: ["Page", "new page"],
  group: "Other",
  icon: <HiOutlineGlobeAlt size={18} />,
  subtext: "Used to insert a new page below.",
});

const getCustomSlashMenuItems = (
  editor: BlockNoteEditor,
  changeDoc: (changeFn: ChangeFn<Page>) => void,
  repo: Repo
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertNewPage(editor, changeDoc, repo),
];

export default function Editor({ doc, changeDoc }: Props) {
  const repo = useRepo();
  const schema = BlockNoteSchema.create({
    inlineContentSpecs: {
      // Adds all default inline content.
      ...defaultInlineContentSpecs,
      // Adds the mention tag
    },
    blockSpecs: {
      ...defaultBlockSpecs,
      docLink: createDocLink(),
    },
  });

  const editor = useCreateBlockNote({
    initialContent: doc.blocks,
    schema,
  });

  const handleEditorChange = () => {
    changeDoc(d => {
      d.blocks = editor.document;
    });
  };

  return (
    <BlockNoteView editor={editor} theme={"light"} onChange={handleEditorChange} slashMenu={false}>
      <SuggestionMenuController
        triggerCharacter={"/"}
        // Replaces the default Slash Menu items with our custom ones.
        getItems={async query =>
          filterSuggestionItems(getCustomSlashMenuItems(editor, changeDoc, repo), query)
        }
      />
    </BlockNoteView>
  );
}
