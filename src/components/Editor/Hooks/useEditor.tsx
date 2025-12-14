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
import isEqual from "fast-deep-equal"; // optional but helpful
import createHeadingBlock from "@/utils/createBlock";
import { createDocLink } from "@/components/PageBlock/PageBlock";

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

  // Avoid echoing our own programmatic updates back into Automerge:
  const applyingRemote = useRef(false);
  const editorIsMounted = useRef(false);
  // 1) Push Automerge -> BlockNote (remote changes)
  useEffect(() => {
    if (!editorIsMounted.current) return;
    if (isEqual(editor.document, doc.blocks)) return;

    applyingRemote.current = true;
    if (doc.blocks) {
      editor.replaceBlocks(editor.document, doc.blocks);
    }

    applyingRemote.current = false;
  }, [editor, doc.blocks]);

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

  const saveEditor = async () => {
    changeDoc((d: Page) => {
      checkChildren(d);
      d.blocks = editor.document as Block[];
    });
  };

  const handleEditorChange = () => {
    if (applyingRemote.current) return; // ignore our programmatic sync
    saveEditor();
  };

  editor.onMount(() => {
    setTimeout(() => {
      editor.replaceBlocks(editor.document, doc.blocks || createHeadingBlock(""));
      if (!editor.isFocused()) {
        editor.focus();
      }
      editorIsMounted.current = true;
    });
  });

  return {
    handleEditorChange,
    editor,
    changeDoc,
    repo,
  };
}
