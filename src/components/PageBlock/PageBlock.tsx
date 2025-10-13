import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { HiOutlineGlobeAlt } from "react-icons/hi";

export const createDocLink = createReactBlockSpec(
  {
    type: "docLink",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      name: {
        default: "Untitled page",
        type: "string",
        editable: true,
        description: "Enter the name",
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
      const link = props.block.props.link;
      return (
        <div>
          <HiOutlineGlobeAlt />
          <a href={link}>
            <div className={"inline-content"} ref={props.contentRef} />
          </a>
        </div>
      );
    },
  }
);
