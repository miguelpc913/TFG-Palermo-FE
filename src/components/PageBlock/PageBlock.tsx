import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { HiOutlineGlobeAlt } from "react-icons/hi";

export const createDocLink = createReactBlockSpec(
  {
    type: "docLink",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
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
      const link = props.block.props.link;
      return (
        <div className="flex items-center gap-1">
          <span contentEditable={false}>
            <HiOutlineGlobeAlt />
          </span>

          <a href={link}>
            <div className={"inline-content"} ref={props.contentRef} />
          </a>
        </div>
      );
    },
  }
);
