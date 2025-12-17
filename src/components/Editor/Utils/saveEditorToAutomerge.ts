import { BlockNoteEditor } from "@blocknote/core";
import { applyBlockNoteToAutomergeRichText } from "./blocknoteAutomergeIntegration";
import { Page } from "@/types/Document";

function saveEditorToAutomerge(pageDoc: Page, editor: BlockNoteEditor) {
  const { doc: nextDoc } = applyBlockNoteToAutomergeRichText({
    doc: pageDoc,
    path: ["richText"], // <-- this is the Page.richText string
    blocks: editor.document, // <-- BlockNote blocks
    clearMarks: false, // turn on only if your Automerge has unmark()
  });

  return nextDoc;
}

export default saveEditorToAutomerge;
