import { useEffect, useRef } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
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
  Italic,
  List,
  ListOrdered,
  Redo2,
  UnderlineIcon,
  Undo2,
} from "lucide-react";

interface EditorProps {
  content: string;
  onChange: (html: string) => void;
  printRef: React.RefObject<HTMLDivElement | null>;
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`editor-tool ${active ? "is-active" : ""}`}
      title={label}
      aria-label={label}
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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
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

  if (!editor) return <div className="editor-loading">Loading editor...</div>;

  return (
    <div className="editor-shell">
      <div className="editor-toolbar" role="toolbar" aria-label="Letter formatting">
        <div className="tool-group">
          <ToolButton
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo2 />
          </ToolButton>
          <ToolButton
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo2 />
          </ToolButton>
        </div>
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
        </div>
        <div className="tool-divider" />
        <div className="tool-group">
          <select
            className="font-size-select"
            aria-label="Text style"
            onChange={(event) => {
              const value = event.target.value;
              if (value === "paragraph") {
                editor.chain().focus().setParagraph().run();
              } else {
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: Number(value) as 1 | 2 | 3 })
                  .run();
              }
            }}
            defaultValue="paragraph"
          >
            <option value="paragraph">Normal</option>
            <option value="1">Title</option>
            <option value="2">Heading</option>
            <option value="3">Subheading</option>
          </select>
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
          <ToolButton label="Copy letter" onClick={() => void copyLetter()}>
            <Copy />
          </ToolButton>
          <ToolButton label="Paste text" onClick={() => void pasteText()}>
            <Clipboard />
          </ToolButton>
        </div>
      </div>
      <div ref={printRef} className="letter-page">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
