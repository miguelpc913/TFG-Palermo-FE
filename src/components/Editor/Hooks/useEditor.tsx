import { Page } from "@/types/Document";
import { AutomergeUrl, useDocument, useRepo } from "@automerge/react";
import * as Automerge from "@automerge/automerge";
import {
  Block,
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
} from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef } from "react";
import createHeadingBlock from "@/utils/createBlock";
import { createDocLink } from "@/components/PageBlock/PageBlock";
import { useAutomergeDocSubscription } from "@/hooks/useAutomergeDocSubscription";
import {
  blockNoteBlocksToAutomergeSpans,
  markRangesFromSpans,
  AMSpan,
  spansToBlockNoteBlocks,
} from "../Utils/blocknoteAutomergeIntegration";

type Props = {
  selectedDocUrl: AutomergeUrl;
};
const { audio, image, file, video, quote, table, divider, ...blockSpecsWithoutQuoteTableDivider } =
  defaultBlockSpecs;

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
  },
  blockSpecs: {
    ...blockSpecsWithoutQuoteTableDivider,
    docLink: createDocLink(),
  },
});

export default function useEditor({ selectedDocUrl }: Props) {
  const [doc, changeDoc] = useDocument<Page>(selectedDocUrl, { suspense: true });
  const repo = useRepo();
  const editor = useCreateBlockNote({ schema });

  const applyingRemote = useRef(false);
  const editorCanUpdate = useRef(false);
  const commitTimeout = useRef<number | null>(null);

  // ---- Remote → Editor (use richText as source of truth) ----
  useAutomergeDocSubscription<Page>(selectedDocUrl, newDoc => {
    if (!editorCanUpdate.current) return;

    applyingRemote.current = true;
    const spans = Automerge.spans(newDoc as any, ["richText"]) as AMSpan[];
    const nextBlocks = spansToBlockNoteBlocks(spans);
    // Keep cursor as best-effort: restore by block id if possible
    const cursor = editor.getTextCursorPosition?.();

    editor.replaceBlocks(editor.document, nextBlocks);

    if (cursor?.block?.id) {
      const b = editor.document.find((x: any) => x.id === cursor.block.id);
      if (b) editor.setTextCursorPosition(b, cursor.offset ?? "end");
    }

    applyingRemote.current = false;
  });

  const restoreDeletedChildren = (d: Page, editorUrls: string[]) => {
    const restoredChildrenIndex = editorUrls.findIndex(editorUrl => {
      return !d.children.includes(editorUrl);
    });
    if (restoredChildrenIndex > -1) {
      d.children.splice(restoredChildrenIndex, 0, editorUrls[restoredChildrenIndex]);
    }
  };

  const deleteChildren = (d: Page, editorUrls: string[]) => {
    const deletedChildrenIndex = d.children.findIndex(childUrl => {
      return !editorUrls.includes(childUrl);
    });
    if (deletedChildrenIndex > -1) {
      d.children.splice(deletedChildrenIndex, 1);
    }
  };

  const checkChildren = (d: Page) => {
    const editorUrls = editor.document
      .filter(block => block.type === "docLink")
      .map(block => {
        return block.props.link as string;
      });
    const shouldCheckChildren = d.children && editorUrls.length !== d.children.length;
    if (shouldCheckChildren) {
      const shouldRestoreChildren = d.children && editorUrls.length > d.children.length;
      const shouldDeleteChildren = d.children && editorUrls.length < d.children.length;
      if (shouldRestoreChildren) {
        restoreDeletedChildren(d, editorUrls);
      } else if (shouldDeleteChildren) {
        deleteChildren(d, editorUrls);
      }
    }
  };

  // ---- Local editor change → Automerge richText ----
  const scheduleSave = () => {
    if (commitTimeout.current !== null) clearTimeout(commitTimeout.current);

    commitTimeout.current = window.setTimeout(() => {
      commitTimeout.current = null;

      changeDoc((d: any) => {
        // 1) children from docLink blocks
        checkChildren(d);

        // 2) blocks -> spans -> updateSpans into richText
        const spans = blockNoteBlocksToAutomergeSpans(editor.document as any);

        Automerge.updateSpans(d, ["richText"], spans as any);

        // 3) apply marks (updateSpans doesn't)
        const ranges = markRangesFromSpans(spans);
        for (const r of ranges) {
          Automerge.mark(
            d,
            ["richText"],
            { start: r.start, end: r.end, expand: r.name === "link" ? "none" : "both" },
            r.name,
            r.value
          );
        }
      });

      editorCanUpdate.current = true;
    }, 300);
  };

  const handleEditorChange = () => {
    if (applyingRemote.current) return;

    editorCanUpdate.current = false;
    scheduleSave();
  };

  // ---- Initial load: richText -> editor ----
  useEffect(() => {
    // Wait a tick so editor is ready
    setTimeout(() => {
      const spans = doc?.richText ? (Automerge.spans(doc as any, ["richText"]) as AMSpan[]) : [];
      const initialBlocks = spans.length
        ? spansToBlockNoteBlocks(spans)
        : ([createHeadingBlock("")] as any);

      applyingRemote.current = true;
      editor.replaceBlocks(editor.document, initialBlocks);
      applyingRemote.current = false;

      if (!editor.isFocused()) editor.focus();
      editorCanUpdate.current = true;
    });
  }, [editor]);

  return {
    handleEditorChange,
    editor,
    changeDoc,
    repo,
  };
}
