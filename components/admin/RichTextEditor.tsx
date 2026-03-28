'use client'

// components/admin/RichTextEditor.tsx
// TipTap-based rich-text editor for post body content.
// Outputs HTML. Toolbar: headings, bold, italic, strike, link, image,
// blockquote, bullet list, ordered list, horizontal rule, undo/redo.

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect } from 'react'
import styles from '@/styles/components/RichTextEditor.module.scss'

interface Props {
  value:    string
  onChange: (html: string) => void
}

export default function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: 'Write the full article here...',
      }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  // Sync external value changes (e.g. when loading existing post)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
    // Only sync when value prop changes, not on every editor update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const setLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL', prev || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className={styles.editorWrapper}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('bold') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('italic') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('strike') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('link') ? styles.active : ''}`}
            onClick={setLink}
            title="Link"
          >
            Link
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={addImage}
            title="Insert image"
          >
            Img
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          >
            UL
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Ordered list"
          >
            OL
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${editor.isActive('blockquote') ? styles.active : ''}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
          >
            &ldquo;&rdquo;
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            ―
          </button>
        </div>

        <div className={styles.toolSep} />

        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            Undo
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            Redo
          </button>
        </div>
      </div>

      {/* ── Editor Content ── */}
      <EditorContent editor={editor} className={styles.editorContent} />
    </div>
  )
}
