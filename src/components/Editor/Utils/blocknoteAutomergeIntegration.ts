// blocknote-to-automerge-spans.ts
import * as Automerge from "@automerge/automerge";
import { Block } from "@blocknote/core";

/**
 * Minimal span types expected by Automerge.updateSpans / Automerge.spans
 */
export type AMBlockMarker = {
  type: string;
  parents: string[];
  attrs?: Record<string, any>;
  isEmbed?: boolean;
};

export type AMSpan =
  | { type: "block"; value: AMBlockMarker }
  | { type: "text"; value: string; marks?: Record<string, boolean | string | number> };

/**
 * ---- BlockNote-ish types (adapt to your project) ----
 * The only hard requirements for this converter:
 * - block.id (string)
 * - block.type (string)
 * - block.content (inline array) for text-bearing blocks
 * - block.children (Block[]) for nesting
 * - block.props (object) for extra data (heading level, image src, etc.)
 */
export type BNInline =
  | {
      type: "text";
      text: string;
      styles?: { bold?: boolean; italic?: boolean; code?: boolean };
      link?: { href: string; title?: string };
      // allow unknown keys for custom marks
      [k: string]: any;
    }
  | { type: string; [k: string]: any }; // unknown inline nodes are ignored/round-tripped upstream

export type BNBlock = Block;

export type ConvertOptions = {
  /**
   * Prefix for extension marks/blocks to keep them round-trippable
   */
  extPrefix?: string; // default "__ext__blocknote__"

  /**
   * Map a BlockNote block to Automerge block marker type/attrs/isEmbed.
   * Override this if your BlockNote schema uses different names.
   */
  mapBlock?: (
    block: BNBlock,
    parents: string[],
    ctx: { extPrefix: string }
  ) => AMBlockMarker | null;

  /**
   * Map a BlockNote inline node to text+marks. Override if your inline shape differs.
   */
  mapInline?: (
    inline: BNInline,
    ctx: { extPrefix: string }
  ) => Array<{ text: string; marks?: AMSpan["marks"] }>;

  /**
   * Which BlockNote block types should be treated as "containers" that only affect parents[].
   * Example: blockquote container.
   */
  containerTypes?: Set<string>; // default: new Set(["blockquote"])
};

/**
 * ---------- Defaults ----------
 */

const DEFAULT_EXT_PREFIX = "__ext__blocknote__";
const DEFAULT_CONTAINER_TYPES = new Set<string>(["quote", "blockquote"]);

function defaultMapBlock(
  block: BNBlock,
  parents: string[],
  ctx: { extPrefix: string }
): AMBlockMarker | null {
  const attrsBase = {
    [ctx.extPrefix + "meta"]: {
      id: block.id,
      props: block.props ?? {},
    },
  };

  switch (block.type) {
    // ---------- Text blocks ----------
    case "paragraph":
      return { type: "paragraph", parents, attrs: attrsBase, isEmbed: false };

    case "heading": {
      const level = Number((block.props as any)?.level ?? 1);
      return { type: "heading", parents, attrs: { ...attrsBase, level }, isEmbed: false };
    }

    case "docLink":
      return {
        type: ctx.extPrefix + "docLink",
        parents,
        attrs: attrsBase,
        isEmbed: false,
      };

    case "codeBlock": {
      const language = (block.props as any)?.language ?? null;
      return { type: "code-block", parents, attrs: { ...attrsBase, language }, isEmbed: false };
    }

    // NOTE: "quote" is a container handled in visit() via DEFAULT_CONTAINER_TYPES.
    // Do NOT map it here.

    // ---------- List items ----------
    case "bulletListItem":
      return { type: "unordered-list-item", parents, attrs: attrsBase, isEmbed: false };

    case "numberedListItem":
      return { type: "ordered-list-item", parents, attrs: attrsBase, isEmbed: false };

    case "checkListItem":
      // Stable name for round-tripping
      return { type: ctx.extPrefix + "checkListItem", parents, attrs: attrsBase, isEmbed: false };

    case "toggleListItem":
      // Stable name for round-tripping
      return { type: ctx.extPrefix + "toggleListItem", parents, attrs: attrsBase, isEmbed: false };

    // ---------- Embeds / non-text ----------
    case "image": {
      const src = String((block.props as any)?.src ?? "");
      const alt = (block.props as any)?.alt ?? null;
      const title = (block.props as any)?.title ?? null;
      return {
        type: "image",
        parents,
        attrs: { ...attrsBase, src, alt, title },
        isEmbed: true,
      };
    }

    case "video":
    case "audio":
    case "file":
      // No standard schema types for these → extension embed
      return { type: ctx.extPrefix + block.type, parents, attrs: attrsBase, isEmbed: true };

    case "divider":
      // Divider is non-text and should not claim following text → embed
      return { type: ctx.extPrefix + "divider", parents, attrs: attrsBase, isEmbed: true };

    case "table":
      // Tables are complex → extension embed
      return { type: ctx.extPrefix + "table", parents, attrs: attrsBase, isEmbed: true };

    // BlockNote also lists "docLink" (custom spec) in your schema; keep it as extension unless you map it specially.
    default:
      return { type: ctx.extPrefix + block.type, parents, attrs: attrsBase, isEmbed: false };
  }
}

// Helpers (BlockNote content model: text nodes with styles/link)
function marksToInline(text: string, marks?: any) {
  const inline: any = { type: "text", text };

  const styles: any = {};
  if (marks?.strong) styles.bold = true;
  if (marks?.em) styles.italic = true;
  if (Object.keys(styles).length) inline.styles = styles;

  if (typeof marks?.link === "string") {
    try {
      const linkObj = JSON.parse(marks.link);
      inline.link = { href: linkObj.href, title: linkObj.title ?? "" };
    } catch {}
  }

  return inline;
}

type TmpBlock = Block & { __amParents?: string[] };

type BlockWithParents = { block: Block; parents: string[] };

function wrapQuotes(items: BlockWithParents[]): Block[] {
  const out: Block[] = [];
  let quoteChildren: Block[] = [];

  const flush = () => {
    if (!quoteChildren.length) return;
    out.push({
      id: crypto.randomUUID(),
      type: "quote",
      props: {}, // BlockNote quote usually has no required props
      content: [], // quote container has no inline content
      children: quoteChildren,
    } as any);
    quoteChildren = [];
  };

  for (const { block, parents } of items) {
    const inQuote = parents.includes("blockquote");

    if (inQuote) {
      quoteChildren.push(block);
    } else {
      flush();
      out.push(block);
    }
  }

  flush();
  return out;
}

export function spansToBlockNoteBlocks(spans: AMSpan[], extPrefix = "__ext__blocknote__"): Block[] {
  const items: Array<{ block: Block; parents: string[] }> = [];

  let current: Block | null = null;
  let currentParents: string[] = [];

  const flush = () => {
    if (current) {
      items.push({ block: current, parents: currentParents });
      current = null;
      currentParents = [];
    }
  };

  const startBlock = (marker: any) => {
    flush();

    const meta = marker.attrs?.[extPrefix + "meta"];
    const idFromMeta = meta?.id;
    const propsFromMeta = meta?.props ?? {};

    const base = {
      id: idFromMeta ?? crypto.randomUUID(),
      props: propsFromMeta,
      content: [],
      children: [],
    } as any;

    const parents = (marker.parents ?? []) as string[];

    switch (marker.type) {
      case "heading":
        current = {
          ...base,
          type: "heading",
          props: { ...base.props, level: marker.attrs?.level ?? 1 },
        };
        currentParents = parents;
        return;

      case "paragraph":
        current = { ...base, type: "paragraph" };
        currentParents = parents;
        return;

      case "code-block":
        current = {
          ...base,
          type: "codeBlock",
          props: { ...base.props, language: marker.attrs?.language ?? undefined },
        };
        currentParents = parents;
        return;

      case "unordered-list-item":
        current = { ...base, type: "bulletListItem" };
        currentParents = parents;
        return;

      case "ordered-list-item":
        current = { ...base, type: "numberedListItem" };
        currentParents = parents;
        return;

      case "__ext__blocknote__checkListItem":
        current = { ...base, type: "checkListItem" };
        currentParents = parents;
        return;

      case "__ext__blocknote__toggleListItem":
        current = { ...base, type: "toggleListItem" };
        currentParents = parents;
        return;

      case "__ext__blocknote__docLink":
        current = {
          ...base,
          type: "docLink",
          props: {
            ...propsFromMeta,
            link: propsFromMeta.link ?? "#notAddedDoc",
            parentDoc: propsFromMeta.parentDoc ?? "#noParentFound",
            textAlignment: propsFromMeta.textAlignment ?? "left",
            textColor: propsFromMeta.textColor ?? "default",
          },
        };
        currentParents = parents;
        return;

      case "image": {
        // embed => push immediately as a block item
        const img: Block = {
          ...base,
          type: "image",
          props: {
            ...base.props,
            src: marker.attrs?.src,
            alt: marker.attrs?.alt ?? null,
            title: marker.attrs?.title ?? null,
          },
          content: [],
          children: [],
        } as any;

        items.push({ block: img, parents });
        current = null;
        currentParents = [];
        return;
      }

      default:
        // fallback so text still shows
        current = { ...base, type: "paragraph" };
        currentParents = parents;
        return;
    }
  };

  const appendText = (text: string, marks?: any) => {
    if (!current) {
      // if text appears without a marker, create a paragraph
      current = {
        id: crypto.randomUUID(),
        type: "paragraph",
        props: {},
        content: [],
        children: [],
      } as any;
      currentParents = [];
    }
    (current.content as any[]).push(marksToInline(text, marks));
  };

  if (spans) {
    for (const s of spans) {
      if (s.type === "block") startBlock(s.value);
      else appendText(s.value, s.marks);
    }
  }

  flush();

  // ✅ This is what makes quote render
  const wrapped = wrapQuotes(items);

  return wrapped.length
    ? wrapped
    : ([
        { id: crypto.randomUUID(), type: "paragraph", props: {}, content: [], children: [] },
      ] as any);
}

function defaultMapInline(inline: BNInline, ctx: { extPrefix: string }) {
  if (inline?.type !== "text" || typeof (inline as any).text !== "string") return [];

  const t = inline as Extract<BNInline, { type: "text" }>;
  const marks: AMSpan["marks"] = {};

  if (t.styles?.bold) marks.strong = true;
  if (t.styles?.italic) marks.em = true;

  if (t.link?.href) {
    marks.link = JSON.stringify({
      href: t.link.href,
      title: t.link.title ?? "",
    });
  }

  // Schema doesn’t define code span; keep it as extension mark
  if (t.styles?.code) marks[ctx.extPrefix + "code"] = true;

  return Object.keys(marks).length ? [{ text: t.text, marks }] : [{ text: t.text }];
}

/**
 * ---------- Convert BlockNote blocks → Automerge spans ----------
 */
export function blockNoteBlocksToAutomergeSpans(
  blocks: Block[],
  opts: ConvertOptions = {}
): AMSpan[] {
  const extPrefix = opts.extPrefix ?? DEFAULT_EXT_PREFIX;
  const mapBlock = opts.mapBlock ?? defaultMapBlock;
  const mapInline = opts.mapInline ?? defaultMapInline;
  const containerTypes = opts.containerTypes ?? DEFAULT_CONTAINER_TYPES;

  const spans: AMSpan[] = [];

  function pushTextRuns(runs: Array<{ text: string; marks?: AMSpan["marks"] }>) {
    for (const r of runs) {
      if (!r.text) continue;
      const prev = spans[spans.length - 1];
      if (
        prev?.type === "text" &&
        JSON.stringify(prev.marks ?? {}) === JSON.stringify(r.marks ?? {})
      ) {
        prev.value += r.text;
      } else {
        spans.push(
          r.marks
            ? { type: "text", value: r.text, marks: r.marks }
            : { type: "text", value: r.text }
        );
      }
    }
  }

  function visit(block: BNBlock, parents: string[]) {
    // ✅ quote/blockquote container: does not emit a marker, only adds "blockquote" to parents for children
    if (containerTypes.has(block.type)) {
      const nextParents = [...parents, "blockquote"];
      for (const child of block.children ?? []) visit(child, nextParents);
      return;
    }

    const marker = mapBlock(block, parents, { extPrefix });
    if (!marker) return;

    spans.push({ type: "block", value: marker });

    // Text belongs to block unless embed
    if (!marker.isEmbed) {
      const inline = (block as any).content ?? [];
      const runs = inline.flatMap((n: any) => mapInline(n, { extPrefix }));
      pushTextRuns(runs);
    }

    // Children are nested inside this block type
    const childParents = [...parents, marker.type];
    for (const child of block.children ?? []) visit(child, childParents);
  }

  for (const b of blocks) visit(b, []);
  return spans;
}

/**
 * ---------- Marks reconciliation ----------
 * updateSpans() updates structure, not marks, so we apply marks from spans.
 */

export type MarkRange = {
  name: string;
  value: boolean | string | number;
  start: number;
  end: number;
};

export function markRangesFromSpans(spans: AMSpan[]): MarkRange[] {
  const ranges: MarkRange[] = [];
  let idx = 0;

  for (const s of spans) {
    if (s.type === "block") {
      idx += 1; // block markers occupy 1 position
      continue;
    }
    const start = idx;
    const end = idx + s.value.length;

    if (s.marks) {
      for (const [name, value] of Object.entries(s.marks)) {
        ranges.push({ name, value: value as any, start, end });
      }
    }

    idx = end;
  }

  return ranges;
}

function expandForMark(name: string) {
  // Links usually shouldn’t expand when typing at boundary
  if (name === "link") return "none" as const;
  return "both" as const;
}

/**
 * Applies structure + text with updateSpans, then applies marks.
 * If your Automerge build provides `unmark`, you can clear stale marks before reapplying.
 */
export function applyBlockNoteToAutomergeRichText<TDoc extends Record<string, any>>(args: {
  doc: TDoc;
  path: Automerge.Prop[];
  blocks: BNBlock[];
  opts?: ConvertOptions;
  clearMarks?: boolean; // best effort: only works if Automerge.unmark exists
}): { doc: TDoc; spans: AMSpan[] } {
  const { doc, path, blocks, opts, clearMarks = false } = args;

  const spans = blockNoteBlocksToAutomergeSpans(blocks, opts);
  const ranges = markRangesFromSpans(spans);

  const next = Automerge.change(doc, d => {
    Automerge.updateSpans(d, path, spans as any);

    // Best effort: clear marks if supported, then reapply.
    // (Some builds expose Automerge.unmark; if yours doesn't, set clearMarks=false.)
    if (clearMarks && typeof (Automerge as any).unmark === "function") {
      // Remove all marks by iterating current marks (API depends on version; this is "best effort").
      const current = Automerge.marks(d, path) as Array<{
        name: string;
        start: number;
        end: number;
        value: any;
      }>;
      for (const m of current) {
        (Automerge as any).unmark(d, path, { start: m.start, end: m.end }, m.name);
      }
    }

    // Apply desired marks
    for (const r of ranges) {
      Automerge.mark(
        d,
        path,
        { start: r.start, end: r.end, expand: expandForMark(r.name) },
        r.name,
        r.value
      );
    }
  });

  return { doc: next as TDoc, spans };
}
