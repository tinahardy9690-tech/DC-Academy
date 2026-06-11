import { useEffect, useMemo, useRef, useState } from "react";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import {
  Color,
  FontFamily,
  FontSize,
  LineHeight,
  TextStyle,
} from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Clipboard,
  Copy,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  RemoveFormatting,
  Smile,
  Strikethrough,
  SubscriptIcon,
  SuperscriptIcon,
  UnderlineIcon,
  Undo2,
  Unlink,
  X,
} from "lucide-react";

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  printRef: React.RefObject<HTMLDivElement | null>;
}

const fontFamilies = [
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Aptos", value: "Aptos, Calibri, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
  { label: "Garamond", value: "Garamond, serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet", value: '"Trebuchet MS", sans-serif' },
  { label: "Tahoma", value: "Tahoma, sans-serif" },
  { label: "Courier New", value: '"Courier New", monospace' },
] as const;

const fontSizes = [
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "16",
  "18",
  "20",
  "22",
  "24",
  "28",
  "32",
  "36",
] as const;

const emojiOptions = [
  ["😀", "grinning happy smile"],
  ["😃", "happy smile"],
  ["😊", "smiling happy"],
  ["🙂", "smile"],
  ["😉", "wink"],
  ["😍", "love heart eyes"],
  ["🥰", "love hearts"],
  ["😎", "cool sunglasses"],
  ["🤓", "smart glasses"],
  ["🤔", "thinking"],
  ["😌", "relieved"],
  ["😇", "angel"],
  ["😂", "laugh tears"],
  ["🤣", "laughing"],
  ["😅", "nervous laugh"],
  ["🙌", "celebrate hands"],
  ["👏", "clap applause"],
  ["👍", "thumbs up yes"],
  ["👎", "thumbs down no"],
  ["👌", "okay perfect"],
  ["🤝", "handshake agreement"],
  ["🙏", "thanks prayer"],
  ["💪", "strong"],
  ["👀", "eyes review"],
  ["💡", "idea light"],
  ["✅", "check complete"],
  ["❌", "x incorrect"],
  ["⚠️", "warning"],
  ["❗", "important"],
  ["❓", "question"],
  ["⭐", "star"],
  ["🌟", "glowing star"],
  ["✨", "sparkles"],
  ["🔥", "fire"],
  ["💯", "hundred"],
  ["🎉", "celebration"],
  ["🎯", "target"],
  ["🏆", "trophy"],
  ["🎓", "graduation academy"],
  ["📌", "pin"],
  ["📎", "paperclip"],
  ["📄", "document"],
  ["📝", "memo writing"],
  ["✍️", "writing"],
  ["📬", "mail"],
  ["✉️", "envelope"],
  ["📞", "phone"],
  ["📧", "email"],
  ["📅", "calendar"],
  ["⏰", "clock"],
  ["💼", "briefcase"],
  ["⚖️", "legal scales"],
  ["🛡️", "shield protection"],
  ["🔒", "lock secure"],
  ["🔍", "search inspect"],
  ["📈", "chart growth"],
  ["💰", "money"],
  ["💳", "credit card"],
  ["🏦", "bank"],
  ["🏠", "home"],
  ["❤️", "heart"],
  ["💙", "blue heart"],
  ["💚", "green heart"],
  ["➡️", "right arrow"],
  ["⬅️", "left arrow"],
  ["⬆️", "up arrow"],
  ["⬇️", "down arrow"],
] as const;

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`editor-tool ${active ? "is-active" : ""}`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

export function Editor({ content, onChange, printRef }: EditorProps) {
  const lastExternalContent = useRef(content);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "Generate a letter to begin editing...",
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      lastExternalContent.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (
      editor &&
      content !== lastExternalContent.current &&
      content !== editor.getHTML()
    ) {
      lastExternalContent.current = content;
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const filteredEmojis = useMemo(() => {
    const query = emojiSearch.trim().toLowerCase();
    return query
      ? emojiOptions.filter(([, keywords]) => keywords.includes(query))
      : emojiOptions;
  }, [emojiSearch]);

  async function copyLetter() {
    if (!editor) return;
    await navigator.clipboard.writeText(editor.getText());
  }

  async function pasteText() {
    if (!editor) return;
    try {
      const text = await navigator.clipboard.readText();
      editor.chain().focus().insertContent(text).run();
    } catch {
      // Browser clipboard permissions can be unavailable inside some GHL embeds.
    }
  }

  function editLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const enteredUrl = window.prompt("Enter the web address", previousUrl ?? "");
    if (enteredUrl === null) return;
    if (!enteredUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^(https?:\/\/|mailto:|tel:)/i.test(enteredUrl)
      ? enteredUrl
      : `https://${enteredUrl}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  function clearFormatting() {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .unsetAllMarks()
      .clearNodes()
      .unsetTextAlign()
      .run();
  }

  if (!editor) return <div className="editor-loading">Loading editor...</div>;

  const textStyle = editor.getAttributes("textStyle");
  const currentFont = (textStyle.fontFamily as string | undefined) ?? "";
  const currentSize =
    ((textStyle.fontSize as string | undefined) ?? "").replace("px", "") || "13";
  const currentLineHeight =
    (textStyle.lineHeight as string | undefined) ?? "1.6";

  return (
    <div className="editor-shell">
      <div className="editor-toolbar" role="toolbar" aria-label="Letter formatting">
        <div className="toolbar-row toolbar-row-primary">
          <div className="tool-group">
            <ToolButton
              label="Undo"
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo2 />
            </ToolButton>
            <ToolButton
              label="Redo"
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo2 />
            </ToolButton>
          </div>

          <div className="tool-divider" />

          <select
            className="editor-select style-select"
            aria-label="Paragraph style"
            value={
              editor.isActive("heading", { level: 1 })
                ? "1"
                : editor.isActive("heading", { level: 2 })
                  ? "2"
                  : editor.isActive("heading", { level: 3 })
                    ? "3"
                    : "paragraph"
            }
            onChange={(event) => {
              const value = event.target.value;
              if (value === "paragraph") {
                editor.chain().focus().setParagraph().run();
              } else {
                editor
                  .chain()
                  .focus()
                  .setHeading({ level: Number(value) as 1 | 2 | 3 })
                  .run();
              }
            }}
          >
            <option value="paragraph">Normal text</option>
            <option value="1">Title</option>
            <option value="2">Heading</option>
            <option value="3">Subheading</option>
          </select>

          <select
            className="editor-select font-family-select"
            aria-label="Font family"
            value={currentFont}
            onChange={(event) => {
              const value = event.target.value;
              if (value) editor.chain().focus().setFontFamily(value).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
          >
            <option value="">Default font</option>
            {fontFamilies.map((font) => (
              <option
                key={font.label}
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </option>
            ))}
          </select>

          <select
            className="editor-select compact-select"
            aria-label="Font size"
            value={currentSize}
            onChange={(event) =>
              editor.chain().focus().setFontSize(`${event.target.value}px`).run()
            }
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size} px
              </option>
            ))}
          </select>

          <select
            className="editor-select line-height-select"
            aria-label="Line spacing"
            value={currentLineHeight}
            onChange={(event) =>
              editor.chain().focus().setLineHeight(event.target.value).run()
            }
          >
            <option value="1">Single spacing</option>
            <option value="1.15">1.15 spacing</option>
            <option value="1.4">1.4 spacing</option>
            <option value="1.6">1.6 spacing</option>
            <option value="2">Double spacing</option>
          </select>

          <div className="tool-divider" />

          <div className="tool-group">
            <ToolButton
              label="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold />
            </ToolButton>
            <ToolButton
              label="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic />
            </ToolButton>
            <ToolButton
              label="Underline"
              active={editor.isActive("underline")}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon />
            </ToolButton>
            <ToolButton
              label="Strikethrough"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough />
            </ToolButton>
          </div>
        </div>

        <div className="toolbar-row toolbar-row-secondary">
          <div className="tool-group color-tools">
            <label className="editor-tool color-tool" title="Text color">
              <Palette />
              <span
                className="color-indicator"
                style={{ background: (textStyle.color as string) || "#172033" }}
              />
              <input
                type="color"
                aria-label="Text color"
                value={(textStyle.color as string) || "#172033"}
                onChange={(event) =>
                  editor.chain().focus().setColor(event.target.value).run()
                }
              />
            </label>
            <label className="editor-tool color-tool" title="Highlight color">
              <Highlighter />
              <span
                className="color-indicator"
                style={{
                  background:
                    (editor.getAttributes("highlight").color as string) ||
                    "#fff3a3",
                }}
              />
              <input
                type="color"
                aria-label="Highlight color"
                value={
                  (editor.getAttributes("highlight").color as string) ||
                  "#fff3a3"
                }
                onChange={(event) =>
                  editor
                    .chain()
                    .focus()
                    .setHighlight({ color: event.target.value })
                    .run()
                }
              />
            </label>
            <ToolButton
              label="Remove highlight"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              <X />
            </ToolButton>
          </div>

          <div className="tool-divider" />

          <div className="tool-group">
            <ToolButton
              label="Subscript"
              active={editor.isActive("subscript")}
              onClick={() => editor.chain().focus().toggleSubscript().run()}
            >
              <SubscriptIcon />
            </ToolButton>
            <ToolButton
              label="Superscript"
              active={editor.isActive("superscript")}
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
            >
              <SuperscriptIcon />
            </ToolButton>
            <ToolButton
              label="Block quote"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote />
            </ToolButton>
            <ToolButton
              label="Horizontal line"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus />
            </ToolButton>
          </div>

          <div className="tool-divider" />

          <div className="tool-group">
            <ToolButton
              label="Bullet list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List />
            </ToolButton>
            <ToolButton
              label="Numbered list"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered />
            </ToolButton>
            <ToolButton
              label="Decrease list indent"
              onClick={() => editor.chain().focus().liftListItem("listItem").run()}
            >
              <IndentDecrease />
            </ToolButton>
            <ToolButton
              label="Increase list indent"
              onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
            >
              <IndentIncrease />
            </ToolButton>
          </div>

          <div className="tool-divider" />

          <div className="tool-group">
            <ToolButton
              label="Align left"
              active={editor.isActive({ textAlign: "left" })}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft />
            </ToolButton>
            <ToolButton
              label="Align center"
              active={editor.isActive({ textAlign: "center" })}
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
              <AlignCenter />
            </ToolButton>
            <ToolButton
              label="Align right"
              active={editor.isActive({ textAlign: "right" })}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
              <AlignRight />
            </ToolButton>
            <ToolButton
              label="Justify"
              active={editor.isActive({ textAlign: "justify" })}
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            >
              <AlignJustify />
            </ToolButton>
          </div>

          <div className="tool-divider" />

          <div className="tool-group">
            <ToolButton
              label="Add or edit link"
              active={editor.isActive("link")}
              onClick={editLink}
            >
              <Link2 />
            </ToolButton>
            <ToolButton
              label="Remove link"
              disabled={!editor.isActive("link")}
              onClick={() =>
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
              }
            >
              <Unlink />
            </ToolButton>
            <ToolButton
              label="Insert emoji"
              active={emojiOpen}
              onClick={() => setEmojiOpen((open) => !open)}
            >
              <Smile />
            </ToolButton>
            <ToolButton label="Clear formatting" onClick={clearFormatting}>
              <RemoveFormatting />
            </ToolButton>
          </div>

          <div className="tool-divider" />

          <div className="tool-group">
            <ToolButton label="Copy letter" onClick={() => void copyLetter()}>
              <Copy />
            </ToolButton>
            <ToolButton label="Paste text" onClick={() => void pasteText()}>
              <Clipboard />
            </ToolButton>
          </div>
        </div>
      </div>

      {emojiOpen && (
        <div className="emoji-picker" role="dialog" aria-label="Emoji picker">
          <div className="emoji-picker-heading">
            <span>
              <Smile />
              Insert emoji
            </span>
            <button
              type="button"
              aria-label="Close emoji picker"
              onClick={() => setEmojiOpen(false)}
            >
              <X />
            </button>
          </div>
          <input
            type="search"
            value={emojiSearch}
            onChange={(event) => setEmojiSearch(event.target.value)}
            placeholder="Search emojis..."
            autoFocus
          />
          <div className="emoji-grid">
            {filteredEmojis.map(([emoji, keywords]) => (
              <button
                type="button"
                key={`${emoji}-${keywords}`}
                title={keywords}
                onClick={() => {
                  editor.chain().focus().insertContent(emoji).run();
                  setEmojiOpen(false);
                  setEmojiSearch("");
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          {filteredEmojis.length === 0 && (
            <p className="emoji-empty">No emoji found.</p>
          )}
        </div>
      )}

      <div ref={printRef} className="letter-page">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
