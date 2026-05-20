'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import styles from './RichTextEditor.module.css'

type Props = {
  compact?: boolean
  mode?: 'block' | 'inline'
  onChange: (value: string) => void
  value: string
}

const looksLikeHtml = /<\/?[a-z][\s\S]*>/i

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeBlockHtml(value: string) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = value

  Array.from(wrapper.querySelectorAll('h2, h3')).forEach((heading) => {
    const firstElement = heading.firstElementChild
    const onlyNestedStrong =
      heading.childNodes.length === 1 &&
      firstElement &&
      (firstElement.tagName === 'STRONG' || firstElement.tagName === 'B')

    if (onlyNestedStrong) {
      heading.innerHTML = firstElement.innerHTML
    }
  })

  return wrapper.innerHTML.trim()
}

function toBlockEditorContent(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return '<p></p>'
  }

  if (looksLikeHtml.test(trimmed)) {
    return normalizeBlockHtml(trimmed)
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

function toInlineEditorContent(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return '<p></p>'
  }

  if (looksLikeHtml.test(trimmed)) {
    if (/^<p[\s>]/i.test(trimmed)) {
      return trimmed
    }

    return `<p>${trimmed}</p>`
  }

  return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br />')}</p>`
}

function toInlineStoredContent(value: string) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = value

  const children = Array.from(wrapper.children)

  if (
    children.length > 0 &&
    children.every((child) => child instanceof HTMLParagraphElement)
  ) {
    return children
      .map((child) => child.innerHTML.trim())
      .filter(Boolean)
      .join('<br /><br />')
  }

  return wrapper.innerHTML
}

function toStoredContent(value: string) {
  if (value === '<p></p>') {
    return ''
  }

  return normalizeBlockHtml(value)
}

type ToolbarButtonProps = {
  active?: boolean
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  title: string
}

type BlockTypeControl = {
  active: boolean
  icon: ReactNode
  key: 'paragraph' | 'h2' | 'h3'
  onClick: () => void
  title: string
}

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  onClick,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      aria-label={title}
      className={[styles.toolbarButton, active ? styles.toolbarButtonActive : ''].join(' ')}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  )
}

function IconParagraph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M4 5.5h12M4 10h9M4 14.5h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  )
}

function IconHeadingTwo() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M3.2 4.5v11M8 4.5v11M3.2 10h4.8M12 7.1c0-1.4 1.1-2.6 2.7-2.6 1.6 0 2.8 1 2.8 2.5 0 1.1-.5 1.8-1.6 2.7l-3.4 2.8H18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55" />
    </svg>
  )
}

function IconHeadingThree() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M3.2 4.5v11M8 4.5v11M3.2 10h4.8M12.5 5h4l-2.3 2.7c1.7 0 2.8 1 2.8 2.6 0 1.6-1.2 2.9-3.1 2.9-1.4 0-2.5-.5-3.3-1.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55" />
    </svg>
  )
}

function IconBold() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M7 4.5h4.6a3 3 0 0 1 0 6H7zm0 6h5.3a3 3 0 0 1 0 6H7z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  )
}

function IconItalic() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M12.5 4.5h-4m3 0-3 11m0 0h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  )
}

function IconBulletList() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="4.25" cy="5.5" fill="currentColor" r="1.2" />
      <circle cx="4.25" cy="10" fill="currentColor" r="1.2" />
      <circle cx="4.25" cy="14.5" fill="currentColor" r="1.2" />
      <path d="M8 5.5h8M8 10h8M8 14.5h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  )
}

function IconOrderedList() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M2.8 5.9h1.5V4.6m0 1.3v1.3M2.6 11.2h1.9l-1.7 2h1.7M2.7 15.9h1.6a.9.9 0 0 1 0 1.8H2.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M8 5.5h8M8 10h8M8 14.5h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  )
}

function IconUndo() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M7.2 6H15a3 3 0 0 1 0 6H9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M7.2 6 4.5 8.7M7.2 6 4.5 3.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  )
}

function IconRedo() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M12.8 6H5a3 3 0 0 0 0 6h5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M12.8 6 15.5 8.7M12.8 6l2.7-2.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  )
}

export function RichTextEditor({ compact = false, mode = 'block', onChange, value }: Props) {
  const lastSyncedValueRef = useRef(value)
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const floatingMenuRef = useRef<HTMLDivElement | null>(null)
  const suppressFloatingMenuUntilRef = useRef(0)
  const [floatingMenu, setFloatingMenu] = useState({
    left: 0,
    top: 0,
    visible: false,
  })

  const editor = useEditor({
    immediatelyRender: false,
    content: mode === 'inline' ? toInlineEditorContent(value) : toBlockEditorContent(value),
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: mode === 'inline' ? false : undefined,
        code: false,
        codeBlock: false,
        heading: mode === 'inline' ? false : { levels: [2, 3] },
        horizontalRule: false,
        listItem: mode === 'inline' ? false : undefined,
        orderedList: mode === 'inline' ? false : undefined,
      }),
    ],
    onUpdate: ({ editor: nextEditor }) => {
      const html = nextEditor.getHTML()
      const nextStoredValue = mode === 'inline' ? toInlineStoredContent(html) : toStoredContent(html)

      lastSyncedValueRef.current = nextStoredValue
      onChange(nextStoredValue)
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    const nextContent =
      mode === 'inline' ? toInlineEditorContent(value) : toBlockEditorContent(value)
    const lastSyncedContent =
      mode === 'inline'
        ? toInlineEditorContent(lastSyncedValueRef.current)
        : toBlockEditorContent(lastSyncedValueRef.current)

    if (nextContent === lastSyncedContent) {
      return
    }

    if (editor.getHTML() === nextContent) {
      lastSyncedValueRef.current = value
      return
    }

    editor.commands.setContent(nextContent, { emitUpdate: false })
    lastSyncedValueRef.current = value
  }, [editor, mode, value])

  useEffect(() => {
    if (!editor || mode !== 'block') {
      setFloatingMenu((current) => (current.visible ? { ...current, visible: false } : current))
      return
    }

    const updateFloatingMenu = () => {
      const container = surfaceRef.current

      if (!container || !editor.isFocused) {
        setFloatingMenu((current) => (current.visible ? { ...current, visible: false } : current))
        return
      }

      if (Date.now() < suppressFloatingMenuUntilRef.current) {
        setFloatingMenu((current) => (current.visible ? { ...current, visible: false } : current))
        return
      }

      const { from, to } = editor.state.selection
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)
      const rect = container.getBoundingClientRect()
      const midpoint = ((start.left + end.right) / 2) - rect.left
      const menuWidth = floatingMenuRef.current?.offsetWidth ?? 248
      const menuHeight = floatingMenuRef.current?.offsetHeight ?? 44
      const halfMenuWidth = menuWidth / 2
      const edgePadding = 14
      const verticalGap = 10
      const selectionTop = Math.min(start.top, end.top) - rect.top
      const minLeft = edgePadding + halfMenuWidth
      const maxLeft = Math.max(minLeft, rect.width - edgePadding - halfMenuWidth)

      setFloatingMenu({
        left: Math.min(Math.max(minLeft, midpoint), maxLeft),
        top: selectionTop - menuHeight - verticalGap,
        visible: true,
      })
    }

    const hideFloatingMenu = () => {
      setFloatingMenu((current) => (current.visible ? { ...current, visible: false } : current))
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (
        target instanceof Node &&
        floatingMenuRef.current?.contains(target)
      ) {
        return
      }

      suppressFloatingMenuUntilRef.current = Date.now() + 180
      hideFloatingMenu()
    }

    const handlePointerUp = () => {
      window.setTimeout(updateFloatingMenu, 190)
    }

    const timeout = window.setTimeout(updateFloatingMenu, 0)
    const container = surfaceRef.current

    container?.addEventListener('pointerdown', handlePointerDown, true)

    editor.on('selectionUpdate', updateFloatingMenu)
    editor.on('transaction', updateFloatingMenu)
    editor.on('focus', updateFloatingMenu)
    editor.on('blur', hideFloatingMenu)
    window.addEventListener('pointerup', handlePointerUp, true)

    return () => {
      window.clearTimeout(timeout)
      container?.removeEventListener('pointerdown', handlePointerDown, true)
      editor.off('selectionUpdate', updateFloatingMenu)
      editor.off('transaction', updateFloatingMenu)
      editor.off('focus', updateFloatingMenu)
      editor.off('blur', hideFloatingMenu)
      window.removeEventListener('pointerup', handlePointerUp, true)
    }
  }, [editor, mode])

  if (!editor) {
    return null
  }

  const activeBlockType: BlockTypeControl['key'] =
    editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'paragraph'

  const blockTypeControls: BlockTypeControl[] = [
    {
      active: editor.isActive('paragraph'),
      icon: <IconParagraph />,
      key: 'paragraph',
      onClick: () => editor.chain().focus().setParagraph().run(),
      title: 'Paragraph',
    },
    {
      active: editor.isActive('heading', { level: 2 }),
      icon: <IconHeadingTwo />,
      key: 'h2',
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      title: 'Heading 2',
    },
    {
      active: editor.isActive('heading', { level: 3 }),
      icon: <IconHeadingThree />,
      key: 'h3',
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      title: 'Heading 3',
    },
  ]

  const orderedFloatingBlockTypeControls = [
    ...blockTypeControls.filter((control) => control.key === activeBlockType),
    ...blockTypeControls.filter((control) => control.key !== activeBlockType),
  ]

  return (
    <div className={[styles.root, compact ? styles.compact : ''].join(' ')}>
      <div className={styles.toolbar}>
        {mode === 'block' && (
          <ToolbarButton
            active={editor.isActive('paragraph')}
            onClick={() => editor.chain().focus().setParagraph().run()}
            title="Paragraph"
          >
            <IconParagraph />
          </ToolbarButton>
        )}
        {mode === 'block' && (
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <IconHeadingTwo />
          </ToolbarButton>
        )}
        {mode === 'block' && (
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3"
          >
            <IconHeadingThree />
          </ToolbarButton>
        )}
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <IconBold />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <IconItalic />
        </ToolbarButton>
        {mode === 'block' && (
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet list"
          >
            <IconBulletList />
          </ToolbarButton>
        )}
        {mode === 'block' && (
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered list"
          >
            <IconOrderedList />
          </ToolbarButton>
        )}
        <ToolbarButton
          disabled={!editor.can().chain().focus().undo().run()}
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <IconUndo />
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor.can().chain().focus().redo().run()}
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <IconRedo />
        </ToolbarButton>
      </div>

      <div className={styles.surface} ref={surfaceRef}>
        {mode === 'block' && floatingMenu.visible && (
          <div
            className={styles.floatingMenu}
            ref={floatingMenuRef}
            style={{
              left: floatingMenu.left,
              top: floatingMenu.top,
              transform: 'translateX(-50%)',
            }}
          >
            {orderedFloatingBlockTypeControls.map((control) => (
              <ToolbarButton
                active={control.active}
                key={control.key}
                onClick={control.onClick}
                title={control.title}
              >
                {control.icon}
              </ToolbarButton>
            ))}
            <ToolbarButton
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <IconBold />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <IconItalic />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet list"
            >
              <IconBulletList />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered list"
            >
              <IconOrderedList />
            </ToolbarButton>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
