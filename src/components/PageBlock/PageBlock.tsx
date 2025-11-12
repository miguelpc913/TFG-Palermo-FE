import { Page } from "@/types/Document";
import createHeadingBlock from "@/utils/createBlock";
import { AutomergeUrl, useDocument } from "@automerge/react";
import { Block, defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";

import { useHash } from "react-use";

export const createDocLink = createReactBlockSpec(
  {
    type: "docLink",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      parentDoc: {
        default: "#noParentFound",
        type: "string",
        editable: false,
        description: "Parent document hash",
      },
      link: {
        default: "#notAddedDoc",
        type: "string",
        editable: false,
        description: "Document hash",
      },
    },
    content: "inline",
  },
  {
    render: props => {
      // Check if the link is internal or external
      const link = props.block.props.link as AutomergeUrl;
      const [doc, changeDoc] = useDocument<Page>(link, { suspense: true });
      const hasBlockUpdate = useRef<boolean>(false);
      const firstContentText =
        props.block.content.length > 0 && typeof props.block.content[0]?.text === "string"
          ? (props.block.content[0].text as string)
          : "";
      const [_, setHash] = useHash();
      useEffect(() => {
        // Update doc based on block
        if (firstContentText !== "Untitled page" && hasBlockUpdate.current) {
          changeDoc(d => {
            let firstBlock = d?.blocks?.[0];
            if (firstBlock?.type === "heading" && firstBlock?.content?.[0]?.text) {
              firstBlock.content[0].text = firstContentText;
            } else {
              d.blocks = [];
              d.blocks[0] = createHeadingBlock(firstContentText) as Block;
            }
          });
        }
      }, [firstContentText]);

      useLayoutEffect(() => {
        // Update block based on doc
        let firstBlock = doc?.blocks?.[0];
        if (firstBlock?.type === "heading" && firstBlock?.content?.[0]?.text) {
          const newBlock = { ...props.block };
          newBlock.content = [{ type: "text", text: firstBlock.content[0].text }];
          props.editor.updateBlock(props.block.id, newBlock);
        } else {
          if (props.block.content[0].text !== "Untitled page") {
            const newBlock = { ...props.block };
            newBlock.content = [{ type: "text", text: "Untitled page" }];
            props.editor.updateBlock(props.block.id, newBlock);
          }
        }
        setTimeout(() => {
          hasBlockUpdate.current = true;
        });
      }, []);

      return (
        <div className="flex items-center gap-1">
          <button
            contentEditable={false}
            onClick={() => {
              setHash(link);
            }}
            style={{
              cursor: "pointer",
            }}
          >
            <IoDocumentTextOutline />
          </button>

          <div
            className={
              "inline-content text-gray-800 underline underline-offset-2 transition-colors"
            }
            ref={props.contentRef}
          />
        </div>
      );
    },
  }
);
