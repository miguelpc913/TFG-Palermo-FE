import { AutomergeUrl } from "@automerge/react";
import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { IoDocumentTextOutline } from "react-icons/io5";
import usePageBlock from "./Hooks/usePageBlock";

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
      const { headingText, onClickHandler } = usePageBlock({ link });
      return (
        <div
          className="flex items-center gap-1"
          onClick={onClickHandler}
          style={{
            cursor: "pointer",
          }}
        >
          <button contentEditable={false}>
            <IoDocumentTextOutline />
          </button>

          <div
            className={
              "inline-content text-gray-800 underline underline-offset-2 transition-colors"
            }
            contentEditable={false}
          >
            {headingText}
          </div>
        </div>
      );
    },
  }
);
