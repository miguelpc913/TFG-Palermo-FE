import { PartialBlock } from "@blocknote/core";

const createHeadingBlock = (text: string) => {
  return {
    type: "heading",
    props: {
      backgroundColor: "default",
      textColor: "default",
      textAlignment: "left",
      level: 1,
      isToggleable: false,
    },
    content: [
      {
        type: "text",
        text: text,
        styles: {},
      },
    ],
    children: [],
  } as PartialBlock;
};

export default createHeadingBlock;
