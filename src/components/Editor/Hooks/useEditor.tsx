import { Page } from "@/types/Document";
import { AutomergeUrl, useDocument, useRepo } from "@automerge/react";
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
import merge from "deepmerge-json";

type Props = {
  selectedDocUrl: AutomergeUrl;
};

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

export default function useEditor({ selectedDocUrl }: Props) {
  const [doc, changeDoc] = useDocument<Page>(selectedDocUrl, { suspense: true });
  const repo = useRepo();
  const editor = useCreateBlockNote({
    schema,
  });

  const applyingRemote = useRef(false);

  const commitTimeout = useRef<number | null>(null);

  useAutomergeDocSubscription<Page>(selectedDocUrl, newDoc => {
    if (!editorCanUpdate.current) return;
    applyingRemote.current = true;
    const mergedResults: Block[] = merge(editor.document, newDoc.blocks);

    const cursorPos = editor.getTextCursorPosition();

    editor.replaceBlocks(editor.document, mergedResults);
    if (cursorPos) {
      const focusedBlock = mergedResults.find(block => block.id === cursorPos.block.id);
      if (focusedBlock) {
        editor.setTextCursorPosition(focusedBlock, "end");
      }
    }
    applyingRemote.current = false;
  });

  const editorCanUpdate = useRef(false);

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

  const scheduleSave = () => {
    if (commitTimeout.current !== null) {
      clearTimeout(commitTimeout.current);
    }

    commitTimeout.current = window.setTimeout(() => {
      commitTimeout.current = null;

      changeDoc((d: Page) => {
        checkChildren(d);
        d.blocks = editor.document as Block[];
      });
      editorCanUpdate.current = true;
    }, 300); // 200–500ms is typical
  };

  const handleEditorChange = () => {
    if (applyingRemote.current) return;

    editorCanUpdate.current = false;
    scheduleSave();
  };

  useEffect(() => {
    setTimeout(() => {
      const initialBlocks = doc?.blocks ? doc?.blocks : [createHeadingBlock("")];
      editor.replaceBlocks(editor.document, initialBlocks);
      if (!editor.isFocused()) {
        editor.focus();
      }
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
