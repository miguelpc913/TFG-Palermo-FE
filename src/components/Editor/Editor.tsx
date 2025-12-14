import { AutomergeUrl } from "@automerge/react";
import { filterSuggestionItems } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { SuggestionMenuController } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { useHash } from "react-use";
import getCustomSlashMenuItems from "./Utils/getCustomSlashMenuItems";
import useEditor from "./Hooks/useEditor";

type Props = {
  selectedDocUrl: AutomergeUrl;
};

export default function Editor({ selectedDocUrl }: Props) {
  const [_, setHash] = useHash();

  const { handleEditorChange, editor, changeDoc, repo } = useEditor({ selectedDocUrl });

  return (
    <BlockNoteView
      key={selectedDocUrl}
      editor={editor}
      autoFocus={true}
      theme="light"
      onChange={handleEditorChange}
      slashMenu={false}
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async query =>
          filterSuggestionItems(getCustomSlashMenuItems(editor, changeDoc, repo, setHash), query)
        }
      />
    </BlockNoteView>
  );
}
