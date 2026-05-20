'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import styles from './LiveEditorApp.module.css'

type PageRecord = {
  contentHtml: string
  description: string
  lang: string
  published: boolean
  schema?: unknown
  slug: string
  stylesheets: string[]
  title: string
}

type User = {
  email: string
  name: string
}

type SelectedTarget = {
  editorId: string
  href: string
  html: string
  label: string
  tagName: string
}

const editorInitMessageType = 'clastro:recovered-init'
const editorSelectMessageType = 'clastro:recovered-select'
const editorDraftMessageType = 'clastro:recovered-draft'
const editorSnapshotRequestType = 'clastro:recovered-snapshot-request'
const editorSnapshotResponseType = 'clastro:recovered-snapshot-response'
const editorBackgroundSaveType = 'clastro:recovered-background-save'

export function LiveEditorApp({ initialSlug = '', user }: { initialSlug?: string; user: User }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const snapshotResolvers = useRef(new Map<string, (html: string) => void>())
  const activeSlugRef = useRef(initialSlug.replace(/^\/+|\/+$/g, ''))
  const pagesRef = useRef<PageRecord[]>([])

  const [activeSlug, setActiveSlug] = useState(activeSlugRef.current)
  const [draft, setDraft] = useState<PageRecord | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null)
  const [selectionHref, setSelectionHref] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [reloadToken, setReloadToken] = useState(Date.now())

  // Load all pages once on mount (for draft lookups)
  useEffect(() => {
    async function loadPages() {
      try {
        const response = await fetch('/api/pages')
        if (response.ok) {
          pagesRef.current = (await response.json()) as PageRecord[]
          const targetSlug = activeSlugRef.current
          const initialPage =
            pagesRef.current.find((p) => p.slug === targetSlug) ??
            pagesRef.current.find((p) => p.slug === '') ??
            null

          if (initialPage) {
            activeSlugRef.current = initialPage.slug
            setActiveSlug(initialPage.slug)
          }

          setDraft(initialPage)
        }
      } catch {
        // Pages will be loaded when the iframe sends init
      }
    }
    void loadPages()
  }, [])

  // When the active slug changes, look up the page draft
  useEffect(() => {
    activeSlugRef.current = activeSlug
    const page = pagesRef.current.find((p) => p.slug === activeSlug) ?? null
    setDraft(page)
    setSelectedTarget(null)
    setSelectionHref('')
  }, [activeSlug])

  // Listen for messages from the iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data

      if (data?.type === editorInitMessageType) {
        const slug = String(data.slug ?? '')
        setActiveSlug(slug)
        setStatus('idle')
      }

      if (data?.type === editorSelectMessageType) {
        if (!data.editorId) {
          setSelectedTarget(null)
          setSelectionHref('')
          return
        }

        const nextTarget = {
          editorId: String(data.editorId || ''),
          href: String(data.href || ''),
          html: String(data.html || ''),
          label: String(data.label || 'Selected content'),
          tagName: String(data.tagName || 'div'),
        } satisfies SelectedTarget

        setSelectedTarget(nextTarget)
        setSelectionHref(nextTarget.href)
      }

      // Auto-save from bridge before navigation
      if (data?.type === editorBackgroundSaveType) {
        const slug = String(data.slug ?? '')
        const contentHtml = String(data.contentHtml ?? '')
        const page = pagesRef.current.find((p) => p.slug === slug)

        if (page) {
          const apiUrl = slug ? `/api/pages/${encodeURIComponent(slug)}` : '/api/pages'
          void fetch(apiUrl, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...page, contentHtml }),
          })
            .then(async () => {
              const resp = await fetch('/api/pages')
              if (resp.ok) pagesRef.current = (await resp.json()) as PageRecord[]
            })
            .catch(() => {})
        }
      }

      if (data?.type === editorSnapshotResponseType) {
        const requestId = String(data.requestId || '')
        const resolve = snapshotResolvers.current.get(requestId)

        if (!resolve) {
          return
        }

        snapshotResolvers.current.delete(requestId)
        resolve(String(data.contentHtml || ''))
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  function postToPreview(payload: Record<string, string>) {
    iframeRef.current?.contentWindow?.postMessage(payload, '*')
  }

  function handleHrefChange(nextHref: string) {
    setSelectionHref(nextHref)

    if (selectedTarget) {
      postToPreview({
        type: editorDraftMessageType,
        editorId: selectedTarget.editorId,
        href: nextHref,
      })
    }
  }

  // Only recalculate the iframe URL after a save (reloadToken change).
  // Day-to-day navigation happens inside the iframe via the site's own nav.
  const previewUrl = useMemo(() => {
    const pathname = activeSlugRef.current ? `/${activeSlugRef.current}` : '/'
    return `${pathname}?editor=1&ts=${reloadToken}`
  }, [reloadToken])

  function requestSnapshot() {
    return new Promise<string>((resolve) => {
      const requestId = crypto.randomUUID()
      snapshotResolvers.current.set(requestId, resolve)
      postToPreview({
        type: editorSnapshotRequestType,
        requestId,
      })
    })
  }

  async function savePage() {
    if (!draft) {
      return
    }

    setStatus('saving')

    try {
      const contentHtml = await requestSnapshot()
      const slug = draft.slug
      const url = slug ? `/api/pages/${encodeURIComponent(slug)}` : '/api/pages'

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          contentHtml,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save page.')
      }

      // Refresh pages cache
      try {
        const pagesResponse = await fetch('/api/pages')
        if (pagesResponse.ok) {
          pagesRef.current = (await pagesResponse.json()) as PageRecord[]
        }
      } catch {
        // Non-critical
      }

      setReloadToken(Date.now())
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const saveLabel =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'Saved'
        : status === 'error'
          ? 'Save Failed'
          : 'Save Changes'

  return (
    <div className={styles.app}>
      <header className={styles.chrome}>
        <div className={styles.chromeLeft}>
          <div className={styles.modeBadge}>S</div>
          <div className={styles.modeMeta}>
            <strong>Edit Mode</strong>
            <span>Page: {activeSlug || 'home'}</span>
          </div>
        </div>

        <div className={styles.chromeRight}>
          <span className={styles.userMeta}>{user.name}</span>
          <button
            className={[styles.saveButton, status === 'error' ? styles.saveButtonError : ''].join(' ')}
            disabled={status === 'saving' || !draft}
            onClick={savePage}
            type="button"
          >
            {saveLabel}
          </button>
          <a className={styles.exitButton} href="/admin">
            Exit Editor
          </a>
        </div>
      </header>

      <div className={styles.workspace}>
        <div className={styles.previewFrame}>
          <iframe
            className={styles.preview}
            onLoad={() => {
              try {
                const href = iframeRef.current?.contentWindow?.location.href
                if (href) {
                  const slug = new URL(href).pathname.replace(/^\/|\/$/g, '')
                  setActiveSlug(slug)
                }
              } catch {
                // Cross-origin or unavailable — init message handles it
              }
            }}
            ref={iframeRef}
            src={previewUrl}
            title="Live preview"
          />
        </div>

        {selectedTarget?.tagName === 'a' && (
          <div className={styles.editorDock}>
            <div className={styles.editorCard}>
              <label className={styles.linkField}>
                <span>Link URL</span>
                <input
                  onChange={(event) => handleHrefChange(event.target.value)}
                  value={selectionHref}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
