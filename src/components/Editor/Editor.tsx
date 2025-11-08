import { useEffect, useRef } from "react";
import isEqual from "fast-deep-equal"; // optional but helpful
import { Page } from "@/Types/Document";
import { AutomergeUrl, ChangeFn, Repo, useDocument, useRepo } from "@automerge/react";
import {
  Block,
  BlockNoteEditor,
  BlockNoteSchema,
  createHeadingBlockSpec,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  filterSuggestionItems,
  insertOrUpdateBlock,
  PartialBlock,
} from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { createDocLink } from "../PageBlock/PageBlock";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import createHeadingBlock from "@/utils/createBlock";
import { EditorProvider } from "@/providers/EditorContext";

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
    const newPage = repo.create<Page>({ children: [], blocks: [{}] });
    changeDoc(d => {
      d.children ? d.children.push(newPage.url) : (d.children = [newPage.url]);
    });
    setTimeout(() => {
      insertOrUpdateBlock(editor, {
        type: "docLink",
        props: { link: newPage.url, textAlignment: "left", textColor: "default" },
        content: [{ type: "text", text: "Untitled page" }],
      });
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

const emptyHeader = createHeadingBlock("");

export default function Editor({ selectedDocUrl }: Props) {
  const [doc, changeDoc] = useDocument<Page>(selectedDocUrl, { suspense: true });
  const repo = useRepo();
  const editor = useCreateBlockNote({
    initialContent: doc.blocks || [{ emptyHeader }], // used only once (first mount)
    schema,
  });

  // Avoid echoing our own programmatic updates back into Automerge:
  const applyingRemote = useRef(false);

  // 1) Push Automerge -> BlockNote (remote changes)
  useEffect(() => {
    if (isEqual(editor.document, doc.blocks)) return;

    applyingRemote.current = true;
    if (doc.blocks) {
      editor.replaceBlocks(editor.document, doc.blocks);
    }

    applyingRemote.current = false;
  }, [editor, doc.blocks]);

  useEffect(() => {
    if (editor.document.length !== doc.blocks.length) {
    }
  }, [editor.document]);

  const saveEditor = () => {
    changeDoc(d => {
      const editorUrls = editor.document
        .filter(block => block.type === "docLink")
        .map(block => {
          return block.props.link;
        });
      if (editorUrls.length !== d.children.length) {
        const deletedChildrenIndex = d.children.findIndex(childUrl => {
          return !editorUrls.includes(childUrl);
        });
        if (deletedChildrenIndex > -1) {
          repo.delete(d.children[deletedChildrenIndex]);
          d.children.splice(deletedChildrenIndex, 1);
        }
      }

      d.blocks = editor.document;
    });
  };

  const handleEditorChange = () => {
    if (applyingRemote.current) return; // ignore our programmatic sync

    saveEditor();
  };

  return (
    <BlockNoteView
      key={selectedDocUrl} // ensures a clean editor when switching docs
      editor={editor}
      theme="light"
      onChange={handleEditorChange}
      slashMenu={false}
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async query =>
          filterSuggestionItems(
            getCustomSlashMenuItems(editor, changeDoc, repo, selectedDocUrl),
            query
          )
        }
      />
    </BlockNoteView>
  );
}
