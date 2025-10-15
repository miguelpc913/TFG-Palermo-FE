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
import { AutomergeUrl, ChangeFn, Repo, useDocument, useRepo } from "@automerge/react";
import { useEffect } from "react";

type Props = {
  selectedDocUrl: AutomergeUrl;
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

export default function Editor({ selectedDocUrl }: Props) {
  const [doc, changeDoc] = useDocument<Page>(selectedDocUrl, { suspense: true });
  const repo = useRepo();

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
        getItems={async query =>
          filterSuggestionItems(getCustomSlashMenuItems(editor, changeDoc, repo), query)
        }
      />
    </BlockNoteView>
  );
}
