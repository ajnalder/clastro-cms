'use client'

import { type DragEvent, type ReactNode, useEffect, useRef, useState } from 'react'

import {
  CMS_ROLE_OPTIONS,
  assignableRolesFor,
  canDeleteUser as canDeleteCmsUser,
  canManageUsers as canManageCmsUsers,
  canUpdateUserRole as canUpdateCmsUserRole,
  formatCmsRole,
  type CmsRole,
} from '../../lib/role-policy'
import { CONTENT_TYPE_DEFINITIONS, type ContentFieldDefinition, type ContentTypeIcon, slugify } from '../../lib/content-types'
import { cn } from '../../lib/utils'
import { CLASTRO_CHANGELOG, CLASTRO_VERSION } from '../../lib/version'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import styles from './AdminApp.module.css'
import { RichTextEditor } from './RichTextEditor'

// ── Inline SVG icons ──────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="7" x="2" y="2" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="7" x="11" y="2" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="7" x="2" y="11" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" width="7" x="11" y="11" />
    </svg>
  )
}

function IconPages() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <path d="M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M12 3v4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconPosts() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <path d="M13.5 3.5l3 3L7 16H4v-3z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M11 6l3 3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconProducts() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <rect height="12" rx="2" stroke="currentColor" strokeWidth="1.5" width="14" x="3" y="5" />
      <path d="M6 5.5V4a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 14 4v1.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M3 10h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconMedia() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <rect height="14" rx="2" stroke="currentColor" strokeWidth="1.5" width="15" x="2.5" y="3" />
      <circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 14l4-4 3 3 3-3 5 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2v2m0 12v2m-8-8h2m12 0h2m-2.3-5.7-1.4 1.4m-8.6 8.6-1.4 1.4m0-11.4 1.4 1.4m8.6 8.6 1.4 1.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconAi() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <path d="M10 2.5l1.7 4.3L16 8.5l-4.3 1.7L10 14.5l-1.7-4.3L4 8.5l4.3-1.7L10 2.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M15.5 13.5l.8 2 .2.5.5.2 2 .8-2 .8-.5.2-.2.5-.8 2-.8-2-.2-.5-.5-.2-2-.8 2-.8.5-.2.2-.5.8-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  )
}

function IconMail() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <rect height="12" rx="2" stroke="currentColor" strokeWidth="1.5" width="15" x="2.5" y="4" />
      <path d="m3 6 7 5 7-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <path d="M3 17V4m0 13h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M6 13.5l3-3.5 3 2.5 4-5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconPlug() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <path d="M7 4v4m6-4v4M5 8h10v2a5 5 0 0 1-5 5 5 5 0 0 1-5-5V8Zm5 7v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconLinkedIn() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <rect height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" width="14" x="3" y="3" />
      <path d="M7 8v5M7 6.5h.01M10 13V9.9c0-1 .8-1.9 1.9-1.9.9 0 1.6.7 1.6 1.6V13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <circle cx="7" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.6" cy="7.2" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.8 16c0-2.6 2.2-4.7 4.9-4.7s4.9 2.1 4.9 4.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M12.1 15c.2-1.8 1.8-3.2 3.8-3.2.5 0 1 .1 1.4.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg className={styles.quickActionArrow} fill="none" viewBox="0 0 16 16">
      <path d="M3 8h10m-4-4l4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  )
}

function IconStarBadge() {
  return (
    <svg fill="none" viewBox="0 0 16 16">
      <path d="M8 1.7l1.7 3.4 3.8.6-2.8 2.7.7 3.8L8 10.4 4.6 12.2l.7-3.8-2.8-2.7 3.8-.6L8 1.7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.3" />
    </svg>
  )
}

function IconLifestyleBadge() {
  return (
    <svg fill="none" viewBox="0 0 16 16">
      <rect x="1.7" y="2.2" width="12.6" height="11.6" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.3" cy="6" r="1.1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2.4 11.2 5.5 8.3l2.1 1.9 2.4-2.3 3.6 3.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  )
}

function IconDragDots() {
  return (
    <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="4" r="1.5" />
      <circle cx="10" cy="4" r="1.5" />
      <circle cx="6" cy="8" r="1.5" />
      <circle cx="10" cy="8" r="1.5" />
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="10" cy="12" r="1.5" />
    </svg>
  )
}

function IconTrashSmall() {
  return (
    <svg fill="none" viewBox="0 0 16 16">
      <path d="M2.8 4.1h10.4M6.2 1.9h3.6m-5.8 2.2.5 8a1.2 1.2 0 0 0 1.2 1.1h4.6a1.2 1.2 0 0 0 1.2-1.1l.5-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
      <path d="M6.5 6.2v4.1m3-4.1v4.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </svg>
  )
}

function IconEditSmall() {
  return (
    <svg className={styles.userAccessActionIcon} fill="none" viewBox="0 0 16 16">
      <path d="M9.8 2.9l3.3 3.3-7.1 7.1H2.8V10z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M8.3 4.4l3.3 3.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  )
}

function IconTag() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <path d="M3 9.5V4a1 1 0 0 1 1-1h5.5a1 1 0 0 1 .7.3l6.4 6.5a1 1 0 0 1 0 1.4l-5.4 5.4a1 1 0 0 1-1.4 0L3.3 10.2A1 1 0 0 1 3 9.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="6.7" cy="6.7" r="1.1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconPeople() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <circle cx="7" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.6" cy="7.2" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.8 16c0-2.6 2.2-4.7 4.9-4.7s4.9 2.1 4.9 4.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M13.5 11.6c2.2.2 3.9 1.9 3.9 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <path d="M10 17.5s5.5-5 5.5-9.2a5.5 5.5 0 0 0-11 0c0 4.2 5.5 9.2 5.5 9.2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="10" cy="8.2" r="1.8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.5" width="14" x="3" y="6" />
      <path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M3 10h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconDocument() {
  return (
    <svg className={styles.navIcon} fill="none" viewBox="0 0 20 20">
      <path d="M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M12 3v4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  )
}

const CONTENT_TYPE_ICON_MAP: Record<ContentTypeIcon, () => ReactNode> = {
  briefcase: () => <IconBriefcase />,
  document: () => <IconDocument />,
  people: () => <IconPeople />,
  pin: () => <IconPin />,
  star: () => <IconStarBadge />,
  tag: () => <IconTag />,
}

const STATIC_NAV_ICONS: Record<StaticTabKey, ReactNode> = {
  ai: <IconAi />,
  dashboard: <IconDashboard />,
  email: <IconMail />,
  integrations: <IconPlug />,
  linkedin: <IconLinkedIn />,
  pages: <IconPages />,
  posts: <IconPosts />,
  products: <IconProducts />,
  media: <IconMedia />,
  settings: <IconSettings />,
  users: <IconUsers />,
}

function getNavIcon(tab: TabKey): ReactNode {
  if (isContentItemTab(tab)) {
    const typeSlug = contentTypeSlugFromTab(tab)
    const def = CONTENT_TYPE_DEFINITIONS.find((entry) => entry.slug === typeSlug)
    return def ? CONTENT_TYPE_ICON_MAP[def.icon]() : <IconDocument />
  }
  return STATIC_NAV_ICONS[tab as StaticTabKey]
}

type User = {
  email: string
  id: string
  name: string
  role: UserRole
}

type UserRole = CmsRole

type NavigationLink = { label: string; link: string }

type FooterColumn = { heading: string; links: NavigationLink[] }

type SiteFooter = {
  columns: FooterColumn[]
  ctaLink: string
  ctaText: string
  emailText: string
  phoneText: string
  tagline: string
}

type SiteNavigation = {
  ctaButtonLink: string
  ctaButtonText: string
  navLinks: NavigationLink[]
  phoneLink: string
  phoneText: string
}

type BookingCard = {
  description: string
  duration: string
  href: string
  price: string
  title: string
}

type SiteBooking = {
  consultation: BookingCard
  note: string
  session: BookingCard
}

type Settings = {
  appleTouchIconUrl: string
  booking: SiteBooking
  contactEmail: string
  contactPhone: string
  defaultOgImage: string
  faviconUrl: string
  footer: SiteFooter
  navigation: SiteNavigation
  socialShareDescription: string
  socialShareTitle: string
  siteName: string
  siteUrl: string
  themeColor: string
}

const BLANK_NAV_LINK: NavigationLink = { label: '', link: '' }
const BLANK_FOOTER_COLUMN: FooterColumn = { heading: '', links: [] }
const BLANK_BOOKING_CARD: BookingCard = {
  description: '',
  duration: '',
  href: '',
  price: '',
  title: '',
}
const BLANK_NAVIGATION: SiteNavigation = {
  ctaButtonLink: '',
  ctaButtonText: '',
  navLinks: [],
  phoneLink: '',
  phoneText: '',
}
const BLANK_FOOTER: SiteFooter = {
  columns: [],
  ctaLink: '',
  ctaText: '',
  emailText: '',
  phoneText: '',
  tagline: '',
}
const BLANK_BOOKING: SiteBooking = {
  consultation: { ...BLANK_BOOKING_CARD },
  note: '',
  session: { ...BLANK_BOOKING_CARD },
}

type AiSettings = {
  altTextGeneration: {
    enabled: boolean
    maxLength: number
    model: string
    promptTemplate: string
  }
  apiKey: string
  blogGeneration: {
    enabled: boolean
    model: string
    promptTemplate: string
    seoPromptTemplate: string
    titleIdeasPromptTemplate: string
  }
  defaultBrandPrompt: string
  imageGeneration: {
    background: string
    enabled: boolean
    model: string
    promptTemplate: string
    quality: string
    size: string
  }
  hasApiKey?: boolean
  provider: string
}

type LinkedInConnection = {
  connected: boolean
  expiresAt?: string | null
  linkedInEmail?: string | null
  linkedInName?: string | null
  linkedInSub?: string | null
  scope?: string | null
}

type LinkedInShareTarget = {
  name: string
  type: 'organization' | 'person'
  urn: string
}

type LinkedInTargetsResponse = {
  connected: boolean
  missingOrgScopes?: string[]
  orgScopesEnabled?: boolean
  permissionError?: boolean
  selectedTargetUrn?: string | null
  targets: LinkedInShareTarget[]
}

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

type PostRecord = {
  authorName: string
  authorRole: string
  authorSlug?: string
  categories: Array<{ label: string }>
  contentHtml: string
  coverImageAlt?: string
  coverImageUrl?: string
  excerpt: string
  featured: boolean
  primaryCategory: string
  published: boolean
  publishedAt: string
  readTime?: string
  seoDescription?: string
  seoTitle?: string
  slug: string
  title: string
}

type ProductRecord = {
  bestFor: string[]
  categoryLabel: string
  categorySlug: string
  contentHtml: string
  heroImageAlt?: string
  heroImageUrl: string
  isFrontPage: boolean
  metaDescription: string
  metaTitle: string
  name: string
  overview: string
  price?: number
  priceLabel?: string
  productImages: ProductImageRecord[]
  published: boolean
  shortDescription: string
  slug: string
  specNotes: string[]
}

type ProductImageRecord = {
  alt?: string
  label?: string
  sortOrder: number
  url: string
}

type MediaRecord = {
  alt?: string
  filename: string
  id: string
  publicUrl: string
  sourceUrl?: string
}

type SettingsAssetField = 'appleTouchIconUrl' | 'defaultOgImage' | 'faviconUrl'

type BrandAssetFieldProps = {
  accept: string
  description: string
  id: string
  label: string
  onUpload: (file: File) => void
  previewShape?: 'icon' | 'wide'
  recommendation: string
  uploading: boolean
  value: string
}

function BrandAssetField({
  accept,
  description,
  id,
  label,
  onUpload,
  previewShape = 'icon',
  recommendation,
  uploading,
  value,
}: BrandAssetFieldProps) {
  const hasAsset = Boolean(value.trim())
  const actionLabel = `${hasAsset ? 'Change' : 'Upload'} ${label.toLowerCase()}`

  return (
    <div className={styles.brandAssetField}>
      <div
        className={[
          styles.brandAssetPreview,
          previewShape === 'wide' ? styles.brandAssetPreviewWide : '',
        ].join(' ')}
      >
        {hasAsset ? (
          <img alt={`Current ${label}`} src={value} />
        ) : (
          <span>No media yet</span>
        )}
      </div>
      <div className={styles.brandAssetCopy}>
        <span className={styles.brandAssetTitle}>{label}</span>
        <small className={styles.fieldHint}>{description}</small>
        <small className={styles.brandAssetRecommendation}>{recommendation}</small>
        <div className={styles.brandAssetActions}>
          <button
            className={styles.secondaryButton}
            disabled={uploading}
            onClick={() => document.getElementById(id)?.click()}
            type="button"
          >
            {uploading ? 'Uploading…' : actionLabel}
          </button>
        </div>
        <input
          accept={accept}
          className={styles.hiddenFileInput}
          id={id}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            if (file) {
              onUpload(file)
            }
            event.currentTarget.value = ''
          }}
          type="file"
        />
      </div>
    </div>
  )
}

interface ContentItemReferenceSelectProps {
  helperText?: string
  label: string
  labelInputProps?: { name?: string; placeholder?: string }
  onChange: (slug: string, item?: { data: Record<string, unknown>; slug: string }) => void
  required?: boolean
  targetType: string
  value: string
}

function ContentItemReferenceSelect({
  helperText,
  label,
  onChange,
  required,
  targetType,
  value,
}: ContentItemReferenceSelectProps) {
  const def = CONTENT_TYPE_DEFINITIONS.find((entry) => entry.slug === targetType)
  const titleField = def?.titleField || 'name'
  const [items, setItems] = useState<Array<{ data: Record<string, unknown>; published: boolean; slug: string }>>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch(`/api/content-items/${encodeURIComponent(targetType)}`)
        if (!response.ok) {
          throw new Error(`Failed to load ${targetType} (${response.status})`)
        }
        const data = (await response.json()) as Array<{
          data: Record<string, unknown>
          published: boolean
          slug: string
        }>
        if (!cancelled) {
          setItems(data || [])
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load options.')
        }
      }
    })()
    return () => { cancelled = true }
  }, [targetType])

  const sortedItems = [...items].sort((left, right) => {
    if (left.published !== right.published) {
      return left.published ? -1 : 1
    }
    const leftTitle = String(left.data?.[titleField] || left.slug)
    const rightTitle = String(right.data?.[titleField] || right.slug)
    return leftTitle.localeCompare(rightTitle)
  })
  const isValueStillKnown = value && sortedItems.some((item) => item.slug === value)
  const showOrphanedValue = value && !isValueStillKnown

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      <div className="relative">
        <select
          className="flex h-10 w-full appearance-none rounded-md border border-input bg-card pl-3 pr-9 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onChange={(event) => {
            const nextSlug = event.target.value
            const picked = items.find((item) => item.slug === nextSlug)
            onChange(nextSlug, picked)
          }}
          value={value}
        >
          <option value="">— None —</option>
          {sortedItems.map((item) => (
            <option key={item.slug} value={item.slug}>
              {String(item.data?.[titleField] || item.slug)}{item.published ? '' : ' (draft)'}
            </option>
          ))}
          {showOrphanedValue && (
            <option value={value}>
              {value} (legacy value)
            </option>
          )}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </div>
      {loadError && <p className="text-xs text-destructive">{loadError}</p>}
      {!loadError && !items.length && (
        <p className="text-xs text-muted-foreground">
          No {def?.labelPlural?.toLowerCase() || targetType} created yet. Add one in the {def?.labelPlural || targetType} tab and it&apos;ll appear here.
        </p>
      )}
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  )
}

interface ContentItemImageFieldProps {
  field: ContentFieldDefinition
  onChange: (value: unknown) => void
  value: string
  wrapperClass: string
}

function ContentItemImageField({ field, onChange, value, wrapperClass }: ContentItemImageFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | null) {
    if (!file) {
      return
    }
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      if (field.label) {
        form.append('alt', field.label)
      }
      const response = await fetch('/api/media/upload', { body: form, method: 'POST' })
      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`)
      }
      const result = (await response.json()) as { filename?: string; publicUrl?: string }
      const url = result.publicUrl || `/api/media/file/${result.filename}`
      onChange(url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const inputClass = 'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  return (
    <div className={cn('space-y-2', wrapperClass)}>
      <span className="block text-xs font-medium text-muted-foreground">
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </span>

      <div className="flex items-start gap-3">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white">
          {value
            ? <img alt="" className="h-full w-full object-contain" src={value} />
            : <span className="text-[10px] text-muted-foreground">No image</span>}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              size="sm"
              type="button"
              variant="outline"
            >
              {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            </Button>
            {value && (
              <Button
                disabled={uploading}
                onClick={() => onChange('')}
                size="sm"
                type="button"
                variant="ghost"
              >
                Remove
              </Button>
            )}
            <input
              accept="image/*"
              className="hidden"
              onChange={(event) => { void handleFile(event.target.files?.[0] || null) }}
              ref={inputRef}
              type="file"
            />
          </div>

          <input
            className={inputClass}
            onChange={(event) => onChange(event.target.value)}
            placeholder="…or paste an image URL"
            type="url"
            value={value}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
    </div>
  )
}

interface ContentItemFieldEditorProps {
  field: ContentFieldDefinition
  isNew: boolean
  onChange: (value: unknown) => void
  slug: string
  updateSlug: (next: string) => void
  value: unknown
}

function ContentItemFieldEditor({
  field,
  isNew,
  onChange,
  slug,
  updateSlug,
  value,
}: ContentItemFieldEditorProps) {
  const wrapperClass = field.type === 'rich-text' || field.type === 'textarea' || field.type === 'image' || field.type === 'boolean'
    ? 'sm:col-span-2'
    : ''

  const inputClass = 'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  const stringValue = typeof value === 'string' ? value : value == null ? '' : String(value)

  if (field.type === 'slug') {
    return (
      <label className={cn('block space-y-1.5', wrapperClass)}>
        <span className="text-xs font-medium text-muted-foreground">
          {field.label}
          {field.required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
        <input
          className={inputClass}
          onChange={(event) => updateSlug(event.target.value)}
          placeholder={field.placeholder || 'auto-generated from name'}
          value={slug}
        />
        {isNew && (
          <p className="text-xs text-muted-foreground">Auto-derived from the title. Edit if you need a custom URL slug.</p>
        )}
        {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
      </label>
    )
  }

  if (field.type === 'textarea') {
    return (
      <label className={cn('block space-y-1.5', wrapperClass)}>
        <span className="text-xs font-medium text-muted-foreground">
          {field.label}
          {field.required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
        <textarea
          className="flex min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          value={stringValue}
        />
        {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
      </label>
    )
  }

  if (field.type === 'rich-text') {
    return (
      <div className={cn('space-y-1.5', wrapperClass)}>
        <span className="block text-xs font-medium text-muted-foreground">
          {field.label}
          {field.required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
        <RichTextEditor onChange={(next) => onChange(next)} value={stringValue} />
        {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
      </div>
    )
  }

  if (field.type === 'boolean') {
    return (
      <label className={cn('flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2.5', wrapperClass)}>
        <input
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="text-sm text-foreground">{field.label}</span>
      </label>
    )
  }

  if (field.type === 'reference') {
    if (!field.targetType) {
      return (
        <div className={cn('space-y-1.5', wrapperClass)}>
          <span className="block text-xs font-medium text-destructive">
            {field.label}: reference field missing `targetType`.
          </span>
        </div>
      )
    }
    return (
      <div className={cn(wrapperClass)}>
        <ContentItemReferenceSelect
          helperText={field.helperText}
          label={field.label}
          onChange={(slug) => onChange(slug)}
          required={field.required}
          targetType={field.targetType}
          value={stringValue}
        />
      </div>
    )
  }

  if (field.type === 'image') {
    return (
      <ContentItemImageField
        field={field}
        onChange={onChange}
        value={stringValue}
        wrapperClass={wrapperClass}
      />
    )
  }

  return (
    <label className={cn('block space-y-1.5', wrapperClass)}>
      <span className="text-xs font-medium text-muted-foreground">
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      <input
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        type={field.type === 'url' ? 'url' : 'text'}
        value={stringValue}
      />
      {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
    </label>
  )
}

type UserFeatureVisibility = {
  showAiBlogTools: boolean
  showAiSettings: boolean
  showLinkedIn: boolean
}

type ManagedUserRecord = {
  createdAt: string
  email: string
  featureVisibility: UserFeatureVisibility
  id: string
  name: string
  role: UserRole
  updatedAt: string
}

type UserAccessDraft = {
  featureVisibility: UserFeatureVisibility
  role: UserRole
}

type UserInvitationRecord = {
  acceptedAt?: string
  createdAt: string
  email: string
  expiresAt: string
  featureVisibility: UserFeatureVisibility
  id: string
  invitedByUserId: string
  name: string
  revokedAt?: string
  role: UserRole
  updatedAt: string
}

type AiPostBuilder = {
  audience: string
  generateImage: boolean
  goal: string
  imagePrompt: string
  loadingDraft: boolean
  loadingTitles: boolean
  open: boolean
  selectedTitle: string
  titleIdeas: string[]
  topic: string
}

type StaticTabKey = 'dashboard' | 'settings' | 'ai' | 'linkedin' | 'email' | 'integrations' | 'pages' | 'posts' | 'products' | 'media' | 'users'
type ContentItemTabKey = `content-item:${string}`
type TabKey = StaticTabKey | ContentItemTabKey

const CONTENT_ITEM_TAB_PREFIX = 'content-item:'
function contentItemTabKey(typeSlug: string): ContentItemTabKey {
  return `${CONTENT_ITEM_TAB_PREFIX}${typeSlug}` as ContentItemTabKey
}
function isContentItemTab(tab: TabKey): tab is ContentItemTabKey {
  return typeof tab === 'string' && tab.startsWith(CONTENT_ITEM_TAB_PREFIX)
}
function contentTypeSlugFromTab(tab: ContentItemTabKey): string {
  return tab.slice(CONTENT_ITEM_TAB_PREFIX.length)
}
type PageListSort = 'slug-asc' | 'slug-desc' | 'published'
type PostListSort = 'recent' | 'title-asc' | 'title-desc' | 'published'
type ProductListSort = 'title-asc' | 'title-desc' | 'category' | 'published'
type UnsavedProductExitChoice = 'cancel' | 'discard' | 'save'
type ThemeMode = 'dark' | 'light'

const ADMIN_THEME_STORAGE_KEY = 'clastro-admin-theme'

const DEFAULT_USER_FEATURE_VISIBILITY: UserFeatureVisibility = {
  showAiBlogTools: true,
  showAiSettings: true,
  showLinkedIn: true,
}

function normalizeUserFeatureVisibility(value?: Partial<UserFeatureVisibility>): UserFeatureVisibility {
  return {
    showAiBlogTools: value?.showAiBlogTools !== false,
    showAiSettings: value?.showAiSettings !== false,
    showLinkedIn: value?.showLinkedIn !== false,
  }
}

function createUserAccessDraft(entry: ManagedUserRecord): UserAccessDraft {
  return {
    featureVisibility: normalizeUserFeatureVisibility(entry.featureVisibility),
    role: entry.role,
  }
}

function userFeatureVisibilityChanged(
  left: UserFeatureVisibility,
  right: UserFeatureVisibility,
) {
  return left.showAiSettings !== right.showAiSettings
    || left.showAiBlogTools !== right.showAiBlogTools
    || left.showLinkedIn !== right.showLinkedIn
}

function userAccessDraftChanged(entry: ManagedUserRecord, draft: UserAccessDraft) {
  return draft.role !== entry.role
    || userFeatureVisibilityChanged(
      normalizeUserFeatureVisibility(entry.featureVisibility),
      draft.featureVisibility,
    )
}

const NAV_SECTIONS: Array<{
  items: Array<{ description: string; key: TabKey; label: string }>
  label: string
}> = [
  {
    label: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        description: 'Summary and quick actions',
      },
    ],
  },
  {
    label: 'Content Pages',
    items: [
      {
        key: 'pages',
        label: 'Pages',
        description: 'Editable marketing pages',
      },
      {
        key: 'posts',
        label: 'Blog Posts',
        description: 'Articles and resources',
      },
    ],
  },
  {
    label: 'Content Items',
    items: [
      {
        key: 'products',
        label: 'Products',
        description: 'Repeatable demo records',
      },
      ...CONTENT_TYPE_DEFINITIONS.map((def) => ({
        description: def.description,
        key: contentItemTabKey(def.slug),
        label: def.labelPlural,
      })),
    ],
  },
  {
    label: 'Manage',
    items: [
      {
        key: 'media',
        label: 'Media',
        description: 'Images and file library',
      },
      {
        key: 'users',
        label: 'Users',
        description: 'Invite editors and manage access',
      },
    ],
  },
  {
    label: 'Config',
    items: [
      {
        key: 'integrations',
        label: 'Integrations',
        description: 'Google Analytics 4 and Search Console',
      },
      {
        key: 'email',
        label: 'Email',
        description: 'Resend API key and form submissions',
      },
      {
        key: 'ai',
        label: 'AI Settings',
        description: 'Models, keys, and prompt templates',
      },
      {
        key: 'linkedin',
        label: 'LinkedIn',
        description: 'Credentials and publishing defaults',
      },
      {
        key: 'settings',
        label: 'Site Settings',
        description: 'Identity and social defaults',
      },
    ],
  },
]

const STATIC_TAB_META: Record<StaticTabKey, { description: string; title: string }> = {
  ai: {
    title: 'AI Settings',
    description: 'Configure provider access, reusable prompts, and AI-assisted content workflows.',
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Overview of content, media, and shared site configuration.',
  },
  email: {
    title: 'Email',
    description: 'Configure Resend and view form submissions captured from the public site.',
  },
  integrations: {
    title: 'Integrations',
    description: 'Connect Google Analytics 4 and Search Console to power the dashboard.',
  },
  linkedin: {
    title: 'LinkedIn',
    description: 'Connect each client LinkedIn account and manage publish access.',
  },
  settings: {
    title: 'Site Settings',
    description: 'Global identity, contact details, favicons, and social preview defaults.',
  },
  pages: {
    title: 'Pages',
    description: 'Manage SEO titles, descriptions, and schema for each page.',
  },
  posts: {
    title: 'Blog Posts',
    description: 'Manage article content, excerpts, categories, and metadata.',
  },
  products: {
    title: 'Products',
    description: 'Manage repeatable product-style records, pricing, specs, and long-form copy.',
  },
  media: {
    title: 'Media',
    description: 'Upload and manage reusable media assets.',
  },
  users: {
    title: 'Users',
    description: 'Create invitation links and manage who can access this CMS.',
  },
}

function getTabMeta(tab: TabKey): { description: string; title: string } {
  if (isContentItemTab(tab)) {
    const typeSlug = contentTypeSlugFromTab(tab)
    const def = CONTENT_TYPE_DEFINITIONS.find((entry) => entry.slug === typeSlug)
    if (def) {
      return {
        title: def.labelPlural,
        description: def.description,
      }
    }
    return { title: 'Content Items', description: 'Manage collection items.' }
  }
  return STATIC_TAB_META[tab as StaticTabKey]
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive whole number.`)
  }

  return parsed
}

function createBlankPostDraft(): PostRecord {
  return {
    slug: '',
    title: '',
    excerpt: '',
    seoTitle: '',
    seoDescription: '',
    contentHtml: '',
    featured: false,
    published: true,
    publishedAt: new Date().toISOString(),
    authorName: 'Clastro Editor',
    authorRole: 'CMS Demo Author',
    authorSlug: '',
    primaryCategory: 'CMS',
    categories: [],
  }
}

function createBlankProductDraft(): ProductRecord {
  return {
    slug: '',
    name: '',
    price: undefined,
    priceLabel: '',
    productImages: [],
    heroImageUrl: '',
    heroImageAlt: '',
    shortDescription: '',
    isFrontPage: false,
    metaTitle: '',
    metaDescription: '',
    categorySlug: '',
    categoryLabel: '',
    overview: '',
    bestFor: [],
    specNotes: [],
    contentHtml: '',
    published: true,
  }
}

function normalizeProductImages(product: Pick<ProductRecord, 'heroImageAlt' | 'heroImageUrl' | 'productImages'>): ProductImageRecord[] {
  const seen = new Set<string>()
  const normalized: ProductImageRecord[] = []

  const pushImage = (
    image: Partial<ProductImageRecord> & { url?: string },
    fallbackSortOrder = normalized.length,
  ) => {
    const url = String(image.url || '').trim()

    if (!url || seen.has(url)) {
      return
    }

    seen.add(url)
    normalized.push({
      url,
      alt: image.alt?.trim() || undefined,
      label: image.label?.trim() || undefined,
      sortOrder: Number.isFinite(Number(image.sortOrder)) ? Number(image.sortOrder) : fallbackSortOrder,
    })
  }

  if (product.heroImageUrl) {
    pushImage({
      url: product.heroImageUrl,
      alt: product.heroImageAlt,
      sortOrder: -1,
    }, -1)
  }

  product.productImages
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((image, index) => pushImage(image, index))

  return normalized.map((image, index) => ({
    ...image,
    sortOrder: index,
  }))
}

function syncProductDraftImages(product: ProductRecord): ProductRecord {
  const productImages = normalizeProductImages(product)
  const heroImage = productImages[0]

  return {
    ...product,
    productImages,
    heroImageUrl: heroImage?.url || '',
    heroImageAlt: heroImage?.alt || '',
  }
}

function getAiDraftLoadingMessages(generateImage: boolean) {
  return [
    'Mapping the article structure and tone.',
    'Shaping practical sections and cleaner answers.',
    'Writing metadata and search-friendly copy.',
    'Building the five FAQ answers for AEO.',
    ...(generateImage ? ['Generating the cover image and matching alt text.'] : []),
    'Finalizing the draft for editing.',
  ]
}

function compareStringsAscending(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' })
}

function compareStringsDescending(left: string, right: string) {
  return compareStringsAscending(right, left)
}

function comparePublishedStatus(left: boolean, right: boolean) {
  return Number(right) - Number(left)
}

function publishedTimestamp(value?: string) {
  const parsed = Date.parse(value || '')
  return Number.isFinite(parsed) ? parsed : 0
}

function formatUserRole(role: UserRole) {
  return formatCmsRole(role)
}

export function AdminApp({ user }: { user: User }) {
  const isSuperAdmin = user.role === 'super_admin'
  const linkedInComingSoon = true
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [status, setStatus] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)
  const [featureFlags, setFeatureFlags] = useState<UserFeatureVisibility>({
    showAiBlogTools: false,
    showAiSettings: false,
    showLinkedIn: false,
  })

  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<{
    appleTouchIconUrl: string
    booking: SiteBooking
    contactEmail: string
    contactPhone: string
    defaultOgImage: string
    faviconUrl: string
    footer: SiteFooter
    navigation: SiteNavigation
    socialShareDescription: string
    socialShareTitle: string
    siteName: string
    siteUrl: string
    themeColor: string
  }>({
    appleTouchIconUrl: '',
    booking: BLANK_BOOKING,
    contactEmail: '',
    contactPhone: '',
    defaultOgImage: '',
    faviconUrl: '',
    footer: BLANK_FOOTER,
    navigation: BLANK_NAVIGATION,
    socialShareDescription: '',
    socialShareTitle: '',
    siteName: '',
    siteUrl: '',
    themeColor: '',
  })
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null)
  const [aiSettingsDraft, setAiSettingsDraft] = useState({
    provider: 'openai',
    apiKey: '',
    clearApiKey: false,
    hasApiKey: false,
    defaultBrandPrompt: '',
    imageEnabled: true,
    imageModel: '',
    imageSize: '',
    imageQuality: '',
    imageBackground: '',
    imagePromptTemplate: '',
    blogEnabled: true,
    blogModel: '',
    blogTitleIdeasPromptTemplate: '',
    blogPromptTemplate: '',
    blogSeoPromptTemplate: '',
    altTextEnabled: true,
    altTextModel: '',
    altTextMaxLength: '160',
    altTextPromptTemplate: '',
  })
  const [linkedInConnection, setLinkedInConnection] = useState<LinkedInConnection>({ connected: false })
  const [linkedInTargets, setLinkedInTargets] = useState<LinkedInShareTarget[]>([])
  const [selectedLinkedInTargetUrn, setSelectedLinkedInTargetUrn] = useState('')
  const [linkedInTargetsPermissionError, setLinkedInTargetsPermissionError] = useState(false)
  const [linkedInMissingOrgScopes, setLinkedInMissingOrgScopes] = useState<string[]>([])
  const [linkedInOrgScopesEnabled, setLinkedInOrgScopesEnabled] = useState(false)
  const [savingLinkedInTarget, setSavingLinkedInTarget] = useState(false)

  const [pages, setPages] = useState<PageRecord[]>([])
  const [activePageSlug, setActivePageSlug] = useState('')
  const [pageDraft, setPageDraft] = useState<PageRecord | null>(null)

  const [posts, setPosts] = useState<PostRecord[]>([])
  const [activePostSlug, setActivePostSlug] = useState('')
  const [postDraft, setPostDraft] = useState<PostRecord | null>(null)
  const [coverImageLibraryOpen, setCoverImageLibraryOpen] = useState(false)
  const [pageListQuery, setPageListQuery] = useState('')
  const [pageListSort, setPageListSort] = useState<PageListSort>('slug-asc')
  const [postListQuery, setPostListQuery] = useState('')
  const [postListSort, setPostListSort] = useState<PostListSort>('recent')
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [activeProductSlug, setActiveProductSlug] = useState('')
  const [productDraft, setProductDraft] = useState<ProductRecord | null>(null)
  const [managedUsers, setManagedUsers] = useState<ManagedUserRecord[]>([])
  const [userInvitations, setUserInvitations] = useState<UserInvitationRecord[]>([])
  const [creatingInvitation, setCreatingInvitation] = useState(false)
  const [expandedUserAccessId, setExpandedUserAccessId] = useState('')
  const [generatedInviteId, setGeneratedInviteId] = useState('')
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('')
  const [userAccessDrafts, setUserAccessDrafts] = useState<Record<string, UserAccessDraft>>({})
  const [deletingUserId, setDeletingUserId] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState('')
  const [updatingUserFeaturesId, setUpdatingUserFeaturesId] = useState('')
  const [inviteDraft, setInviteDraft] = useState({
    email: '',
    featureVisibility: DEFAULT_USER_FEATURE_VISIBILITY,
    name: '',
    role: 'editor' as UserRole,
  })
  const [productImageLibraryOpen, setProductImageLibraryOpen] = useState(false)
  const [productImageLibraryQuery, setProductImageLibraryQuery] = useState('')
  const [productListQuery, setProductListQuery] = useState('')
  const [productListSort, setProductListSort] = useState<ProductListSort>('category')
  const draggedProductImageIndex = useRef<number | null>(null)
  const [contentItemsByType, setContentItemsByType] = useState<Record<string, Array<{
    data: Record<string, unknown>
    id: string
    published: boolean
    slug: string
  }>>>({})
  const [activeContentItemSlug, setActiveContentItemSlug] = useState('')
  const [contentItemDraft, setContentItemDraft] = useState<{
    data: Record<string, unknown>
    isNew: boolean
    originalSlug: string
    published: boolean
    slug: string
    type: string
  } | null>(null)
  const [contentItemListQuery, setContentItemListQuery] = useState('')
  const [savingContentItem, setSavingContentItem] = useState(false)
  const [contentItemDeleteConfirm, setContentItemDeleteConfirm] = useState<{
    slug: string
    title: string
    type: string
  } | null>(null)
  const [aiPostBuilder, setAiPostBuilder] = useState<AiPostBuilder>({
    topic: '',
    audience: 'Business owners and website editors',
    goal: 'Explain the topic clearly and encourage a next step',
    imagePrompt: '',
    selectedTitle: '',
    titleIdeas: [],
    generateImage: true,
    open: false,
    loadingTitles: false,
    loadingDraft: false,
  })
  const [draftLoadingMessageIndex, setDraftLoadingMessageIndex] = useState(0)

  const [media, setMedia] = useState<MediaRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [mediaEditDraft, setMediaEditDraft] = useState<{ alt: string; id: string } | null>(null)
  const [savingMediaAlt, setSavingMediaAlt] = useState(false)
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null)
  const [mediaDeleteConfirm, setMediaDeleteConfirm] = useState<MediaRecord | null>(null)

  type EmailSettingsState = {
    fromEmail: string
    fromName: string
    hasResendApiKey: boolean
    notificationEmail: string
    resendApiKeyInput: string
  }
  type FormSubmissionRecord = {
    archived: boolean
    createdAt: string
    email: string
    formType: string
    id: string
    message: string
    name: string
    sourcePath?: string
    subject: string
  }
  const [emailSettings, setEmailSettings] = useState<EmailSettingsState>({
    fromEmail: '',
    fromName: '',
    hasResendApiKey: false,
    notificationEmail: '',
    resendApiKeyInput: '',
  })
  const [savingEmailSettings, setSavingEmailSettings] = useState(false)
  const [formSubmissions, setFormSubmissions] = useState<FormSubmissionRecord[]>([])
  const [activeSubmission, setActiveSubmission] = useState<FormSubmissionRecord | null>(null)
  const [submissionDeleteConfirm, setSubmissionDeleteConfirm] = useState<FormSubmissionRecord | null>(null)

  type AnalyticsSettingsState = {
    ga4PropertyId: string
    ga4ServiceAccountJsonInput: string
    gscSiteUrl: string
    hasGa4ServiceAccount: boolean
    googleOauthClientId: string
    googleOauthClientSecretInput: string
    hasGoogleOauthClientSecret: boolean
    hasGoogleOauthConnection: boolean
    googleOauthEmail: string
    googleOauthRedirectUri: string
    googleOauthClientSource: 'deployment' | 'db' | 'none'
  }
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettingsState>({
    ga4PropertyId: '',
    ga4ServiceAccountJsonInput: '',
    gscSiteUrl: '',
    hasGa4ServiceAccount: false,
    googleOauthClientId: '',
    googleOauthClientSecretInput: '',
    hasGoogleOauthClientSecret: false,
    hasGoogleOauthConnection: false,
    googleOauthEmail: '',
    googleOauthRedirectUri: '',
    googleOauthClientSource: 'none',
  })
  const [savingAnalyticsSettings, setSavingAnalyticsSettings] = useState(false)
  const [ga4PropertyList, setGa4PropertyList] = useState<Array<{ propertyId: string; displayName: string; accountDisplayName: string }>>([])
  const [gscSiteList, setGscSiteList] = useState<Array<{ siteUrl: string; permissionLevel: string }>>([])
  const [loadingPropertyLists, setLoadingPropertyLists] = useState(false)

  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d'>('7d')

  type Ga4Totals = {
    sessions: number
    activeUsers: number
    engagementRate: number
    averageSessionDurationSec: number
  }
  type Ga4AnalyticsState = {
    configured: boolean
    error?: string
    loading: boolean
    period: { since: string; until: string; days: number } | null
    totals: Ga4Totals | null
    previousTotals: Ga4Totals | null
    timeseries: Array<{ date: string; sessions: number; activeUsers: number }>
    topPages: Array<{ path: string; title: string; sessions: number; activeUsers: number }>
    topSources: Array<{ source: string; medium: string; sessions: number }>
    deviceBreakdown: Array<{ device: string; sessions: number }>
    countryBreakdown: Array<{ country: string; sessions: number }>
  }
  const [ga4Analytics, setGa4Analytics] = useState<Ga4AnalyticsState>({
    configured: false,
    loading: false,
    period: null,
    totals: null,
    previousTotals: null,
    timeseries: [],
    topPages: [],
    topSources: [],
    deviceBreakdown: [],
    countryBreakdown: [],
  })

  type GscTotals = {
    clicks: number
    impressions: number
    ctr: number
    averagePosition: number
  }
  type GscQueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number }
  type GscAnalyticsState = {
    configured: boolean
    error?: string
    loading: boolean
    period: { since: string; until: string; days: number } | null
    totals: GscTotals | null
    previousTotals: GscTotals | null
    timeseries: Array<{ date: string; clicks: number; impressions: number }>
    topQueries: GscQueryRow[]
    topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>
    strikingDistance: GscQueryRow[]
  }
  const [gscAnalytics, setGscAnalytics] = useState<GscAnalyticsState>({
    configured: false,
    loading: false,
    period: null,
    totals: null,
    previousTotals: null,
    timeseries: [],
    topQueries: [],
    topPages: [],
    strikingDistance: [],
  })

  type FormSubmissionsSummary = {
    loading: boolean
    count: number
    previousCount: number
    unread: number
  }
  const [formSubmissionsSummary, setFormSubmissionsSummary] = useState<FormSubmissionsSummary>({
    loading: false,
    count: 0,
    previousCount: 0,
    unread: 0,
  })

  const [uploadingSettingsAsset, setUploadingSettingsAsset] = useState<SettingsAssetField | ''>('')
  const [sharingToLinkedIn, setSharingToLinkedIn] = useState(false)
  const [unsavedProductDialog, setUnsavedProductDialog] = useState<{ actionLabel: string } | null>(null)
  const unsavedProductDialogResolver = useRef<((choice: UnsavedProductExitChoice) => void) | null>(null)
  const canManageUsers = canManageCmsUsers(user.role)
  const inviteRoleOptions = assignableRolesFor(user.role)
  const canViewAi = isSuperAdmin || featureFlags.showAiSettings
  const canViewBlog = true
  const canUseAiBlogBuilder = isSuperAdmin || featureFlags.showAiBlogTools
  const canViewLinkedIn = isSuperAdmin || featureFlags.showLinkedIn
  const allowedTabs = new Set<TabKey>([
    'dashboard',
    'settings',
    'email',
    'integrations',
    'pages',
    'products',
    'media',
    ...(canViewBlog ? (['posts'] as TabKey[]) : []),
    ...(canViewAi ? (['ai'] as TabKey[]) : []),
    ...(canManageUsers ? (['users'] as TabKey[]) : []),
    ...(canViewLinkedIn ? (['linkedin'] as TabKey[]) : []),
    ...CONTENT_TYPE_DEFINITIONS.map((def) => contentItemTabKey(def.slug) as TabKey),
  ])
  const isTabAllowed = (nextTab: TabKey) => allowedTabs.has(nextTab)
  const normalizedProductImageLibraryQuery = productImageLibraryQuery.trim().toLowerCase()
  const filteredProductImageLibrary = normalizedProductImageLibraryQuery
    ? media.filter((item) => {
        const haystack = `${item.filename} ${item.alt || ''} ${item.publicUrl} ${item.sourceUrl || ''}`.toLowerCase()
        return haystack.includes(normalizedProductImageLibraryQuery)
      })
    : media
  const activeSavedProduct = activeProductSlug ? products.find((entry) => entry.slug === activeProductSlug) || null : null
  const productDraftBaseline = activeSavedProduct ? syncProductDraftImages(activeSavedProduct) : createBlankProductDraft()
  const hasUnsavedProductChanges = Boolean(productDraft)
    && JSON.stringify(syncProductDraftImages(productDraft as ProductRecord)) !== JSON.stringify(productDraftBaseline)

  async function loadUsers() {
    if (!canManageUsers) {
      setManagedUsers([])
      setUserInvitations([])
      return
    }

    const response = await fetch('/api/users')

    if (!response.ok) {
      throw new Error('Failed to load CMS users.')
    }

    const payload = (await response.json()) as {
      invitations: UserInvitationRecord[]
      users: ManagedUserRecord[]
    }

    setManagedUsers(payload.users || [])
    setUserInvitations(payload.invitations || [])
  }

  async function loadAll(options?: { resetActivePost?: boolean }) {
    const [
      settingsResponse,
      featureFlagsResponse,
      aiSettingsResponse,
      linkedInConnectionResponse,
      linkedInTargetsResponse,
      pagesResponse,
      postsResponse,
      productsResponse,
      mediaResponse,
    ] = await Promise.all([
      fetch('/api/settings'),
      fetch('/api/feature-flags'),
      fetch('/api/ai-settings'),
      fetch('/api/linkedin/connection'),
      fetch('/api/linkedin/targets'),
      fetch('/api/pages'),
      fetch('/api/posts'),
      fetch('/api/products'),
      fetch('/api/media'),
    ])

    if (settingsResponse.ok) {
      const nextSettings = (await settingsResponse.json()) as Settings
      setSettings(nextSettings)
      setSettingsDraft({
        siteName: nextSettings.siteName,
        siteUrl: nextSettings.siteUrl,
        faviconUrl: nextSettings.faviconUrl || '',
        appleTouchIconUrl: nextSettings.appleTouchIconUrl || '',
        defaultOgImage: nextSettings.defaultOgImage || '',
        socialShareTitle: nextSettings.socialShareTitle || '',
        socialShareDescription: nextSettings.socialShareDescription || '',
        themeColor: nextSettings.themeColor || '',
        contactEmail: nextSettings.contactEmail || '',
        contactPhone: nextSettings.contactPhone || '',
        navigation: nextSettings.navigation
          ? { ...BLANK_NAVIGATION, ...nextSettings.navigation, navLinks: [...(nextSettings.navigation.navLinks || [])] }
          : { ...BLANK_NAVIGATION },
        footer: nextSettings.footer
          ? { ...BLANK_FOOTER, ...nextSettings.footer, columns: (nextSettings.footer.columns || []).map((col) => ({ ...col, links: [...(col.links || [])] })) }
          : { ...BLANK_FOOTER },
        booking: nextSettings.booking
          ? {
              consultation: { ...BLANK_BOOKING_CARD, ...(nextSettings.booking.consultation || {}) },
              session: { ...BLANK_BOOKING_CARD, ...(nextSettings.booking.session || {}) },
              note: nextSettings.booking.note || '',
            }
          : { ...BLANK_BOOKING },
      })
    }

    if (featureFlagsResponse.ok) {
      const nextFeatureFlags = (await featureFlagsResponse.json()) as UserFeatureVisibility
      setFeatureFlags(nextFeatureFlags)
    }

    if (aiSettingsResponse.ok) {
      const nextAiSettings = (await aiSettingsResponse.json()) as AiSettings
      setAiSettings(nextAiSettings)
      setAiSettingsDraft({
        provider: nextAiSettings.provider,
        apiKey: '',
        clearApiKey: false,
        hasApiKey: Boolean(nextAiSettings.hasApiKey),
        defaultBrandPrompt: nextAiSettings.defaultBrandPrompt || '',
        imageEnabled: nextAiSettings.imageGeneration.enabled,
        imageModel: nextAiSettings.imageGeneration.model || '',
        imageSize: nextAiSettings.imageGeneration.size || '',
        imageQuality: nextAiSettings.imageGeneration.quality || '',
        imageBackground: nextAiSettings.imageGeneration.background || '',
        imagePromptTemplate: nextAiSettings.imageGeneration.promptTemplate || '',
        blogEnabled: nextAiSettings.blogGeneration.enabled,
        blogModel: nextAiSettings.blogGeneration.model || '',
        blogTitleIdeasPromptTemplate: nextAiSettings.blogGeneration.titleIdeasPromptTemplate || '',
        blogPromptTemplate: nextAiSettings.blogGeneration.promptTemplate || '',
        blogSeoPromptTemplate: nextAiSettings.blogGeneration.seoPromptTemplate || '',
        altTextEnabled: nextAiSettings.altTextGeneration.enabled,
        altTextModel: nextAiSettings.altTextGeneration.model || '',
        altTextMaxLength: String(nextAiSettings.altTextGeneration.maxLength || 160),
        altTextPromptTemplate: nextAiSettings.altTextGeneration.promptTemplate || '',
      })
    }

    if (linkedInConnectionResponse.ok) {
      const nextLinkedInConnection = (await linkedInConnectionResponse.json()) as LinkedInConnection
      setLinkedInConnection(nextLinkedInConnection)
    }

    if (linkedInTargetsResponse.ok) {
      const nextLinkedInTargets = (await linkedInTargetsResponse.json()) as LinkedInTargetsResponse
      setLinkedInTargets(nextLinkedInTargets.targets || [])
      setLinkedInTargetsPermissionError(Boolean(nextLinkedInTargets.permissionError))
      setLinkedInMissingOrgScopes(nextLinkedInTargets.missingOrgScopes || [])
      setLinkedInOrgScopesEnabled(Boolean(nextLinkedInTargets.orgScopesEnabled))
      setSelectedLinkedInTargetUrn(nextLinkedInTargets.selectedTargetUrn || '')
    } else {
      setLinkedInTargets([])
      setLinkedInTargetsPermissionError(false)
      setLinkedInMissingOrgScopes([])
      setLinkedInOrgScopesEnabled(false)
      setSelectedLinkedInTargetUrn('')
    }

    if (pagesResponse.ok) {
      const nextPages = (await pagesResponse.json()) as PageRecord[]
      setPages(nextPages)
      if (!activePageSlug && nextPages[0]) {
        setActivePageSlug(nextPages[0].slug)
        setPageDraft(nextPages[0])
      }
    }

    if (postsResponse.ok) {
      const payload = (await postsResponse.json()) as { docs: PostRecord[] }
      setPosts(payload.docs)
      const shouldResetActivePost = options?.resetActivePost || !activePostSlug
      const activePostStillExists = payload.docs.some((entry) => entry.slug === activePostSlug)

      if ((shouldResetActivePost || !activePostStillExists) && payload.docs[0]) {
        setActivePostSlug(payload.docs[0].slug)
        setPostDraft(payload.docs[0])
      } else if (!payload.docs.length) {
        setActivePostSlug('')
        setPostDraft(null)
      }
    }

    if (productsResponse.ok) {
      const payload = (await productsResponse.json()) as { docs: ProductRecord[] }
      const nextProducts = payload.docs.map(syncProductDraftImages)
      setProducts(nextProducts)
      const shouldResetActiveProduct = options?.resetActivePost || !activeProductSlug
      const activeProductStillExists = nextProducts.some((entry) => entry.slug === activeProductSlug)

      if ((shouldResetActiveProduct || !activeProductStillExists) && nextProducts[0]) {
        setActiveProductSlug(nextProducts[0].slug)
        setProductDraft(nextProducts[0])
      } else if (!nextProducts.length) {
        setActiveProductSlug('')
        setProductDraft(null)
      }
    }

    if (mediaResponse.ok) {
      setMedia((await mediaResponse.json()) as MediaRecord[])
    }

    if (canManageUsers) {
      await loadUsers()
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setThemeMode(storedTheme)
      return
    }

    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setThemeMode('dark')
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    if (!isTabAllowed(tab)) {
      setTab('dashboard')
    }
  }, [canManageUsers, canViewAi, canViewBlog, isSuperAdmin, tab])

  useEffect(() => {
    const url = new URL(window.location.href)
    const linkedInStatus = url.searchParams.get('linkedin')
    const linkedInMessage = url.searchParams.get('linkedin_message')

    if (!linkedInStatus) {
      return
    }

    if (linkedInStatus === 'connected') {
      setStatus({ kind: 'info', text: 'LinkedIn account connected.' })
    } else if (linkedInStatus === 'disconnected') {
      setStatus({ kind: 'info', text: 'LinkedIn account disconnected.' })
    } else {
      setStatus({
        kind: 'error',
        text: linkedInMessage || 'LinkedIn connection failed.',
      })
    }

    url.searchParams.delete('linkedin')
    url.searchParams.delete('linkedin_message')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    void loadAll()
  }, [])

  useEffect(() => {
    if (!aiPostBuilder.loadingDraft) {
      setDraftLoadingMessageIndex(0)
      return
    }

    const messages = getAiDraftLoadingMessages(aiPostBuilder.generateImage)
    const interval = window.setInterval(() => {
      setDraftLoadingMessageIndex((current) => (current + 1) % messages.length)
    }, 1600)

    return () => window.clearInterval(interval)
  }, [aiPostBuilder.generateImage, aiPostBuilder.loadingDraft])

  useEffect(() => {
    const nextPage = pages.find((entry) => entry.slug === activePageSlug)
    if (nextPage) {
      setPageDraft(nextPage)
    }
  }, [activePageSlug, pages])

  useEffect(() => {
    const nextPost = posts.find((entry) => entry.slug === activePostSlug)
    if (nextPost) {
      setPostDraft(nextPost)
      setCoverImageLibraryOpen(false)
    }
  }, [activePostSlug, posts])

  useEffect(() => {
    const nextProduct = products.find((entry) => entry.slug === activeProductSlug)
    if (nextProduct) {
      setProductDraft(syncProductDraftImages(nextProduct))
      setProductImageLibraryOpen(false)
    }
  }, [activeProductSlug, products])

  // Load Integrations + analytics whenever the dashboard or integrations tab is active.
  useEffect(() => {
    if (tab !== 'integrations' && tab !== 'dashboard') {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/integrations/analytics')
        if (!response.ok) {
          throw new Error(`Failed to load analytics settings (${response.status})`)
        }
        const data = await response.json() as {
          ga4PropertyId: string
          gscSiteUrl: string
          hasGa4ServiceAccount: boolean
          googleOauthClientId: string
          hasGoogleOauthClientSecret: boolean
          hasGoogleOauthConnection: boolean
          googleOauthEmail: string
          googleOauthRedirectUri: string
          googleOauthClientSource?: 'deployment' | 'db' | 'none'
        }
        if (cancelled) return
        setAnalyticsSettings({
          ga4PropertyId: data.ga4PropertyId || '',
          ga4ServiceAccountJsonInput: '',
          gscSiteUrl: data.gscSiteUrl || '',
          hasGa4ServiceAccount: Boolean(data.hasGa4ServiceAccount),
          googleOauthClientId: data.googleOauthClientId || '',
          googleOauthClientSecretInput: '',
          hasGoogleOauthClientSecret: Boolean(data.hasGoogleOauthClientSecret),
          hasGoogleOauthConnection: Boolean(data.hasGoogleOauthConnection),
          googleOauthEmail: data.googleOauthEmail || '',
          googleOauthRedirectUri: data.googleOauthRedirectUri || '',
          googleOauthClientSource: data.googleOauthClientSource || 'none',
        })
      } catch (error) {
        if (!cancelled) {
          setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to load integrations.' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [tab])

  // When the Integrations tab is active and an auth method is connected,
  // load the property/site picker lists from Google so the admin can choose
  // from dropdowns instead of typing IDs.
  useEffect(() => {
    if (tab !== 'integrations') return
    const hasAuth = analyticsSettings.hasGoogleOauthConnection || analyticsSettings.hasGa4ServiceAccount
    if (!hasAuth) {
      setGa4PropertyList([])
      setGscSiteList([])
      return
    }
    let cancelled = false
    setLoadingPropertyLists(true)
    void (async () => {
      try {
        const [propsRes, sitesRes] = await Promise.all([
          fetch('/api/analytics/ga4/properties'),
          fetch('/api/analytics/search-console/sites'),
        ])
        const propsData = await propsRes.json().catch(() => ({})) as { properties?: Array<{ propertyId: string; displayName: string; accountDisplayName: string }>; error?: string }
        const sitesData = await sitesRes.json().catch(() => ({})) as { sites?: Array<{ siteUrl: string; permissionLevel: string }>; error?: string }
        if (cancelled) return
        setGa4PropertyList(propsData.properties || [])
        setGscSiteList(sitesData.sites || [])
      } finally {
        if (!cancelled) setLoadingPropertyLists(false)
      }
    })()
    return () => { cancelled = true }
  }, [tab, analyticsSettings.hasGoogleOauthConnection, analyticsSettings.hasGa4ServiceAccount])

  // Fetch GA4 + Search Console whenever the dashboard is active or the period changes.
  useEffect(() => {
    if (tab !== 'dashboard') {
      return
    }
    let cancelled = false

    const ga4Configured = (analyticsSettings.hasGoogleOauthConnection || analyticsSettings.hasGa4ServiceAccount) && Boolean(analyticsSettings.ga4PropertyId)
    if (ga4Configured) {
      setGa4Analytics((current) => ({ ...current, loading: true, error: undefined }))
      void (async () => {
        try {
          const response = await fetch(`/api/analytics/ga4?period=${analyticsPeriod}`)
          if (!response.ok) {
            const detail = await response.json().catch(() => ({})) as { error?: string }
            throw new Error(detail.error || `Failed to load GA4 analytics (${response.status})`)
          }
          const data = await response.json() as {
            configured?: boolean
            error?: string
            period?: Ga4AnalyticsState['period']
            timeseries?: Ga4AnalyticsState['timeseries']
            topPages?: Ga4AnalyticsState['topPages']
            topSources?: Ga4AnalyticsState['topSources']
            totals?: Ga4AnalyticsState['totals']
            previousTotals?: Ga4AnalyticsState['previousTotals']
            deviceBreakdown?: Ga4AnalyticsState['deviceBreakdown']
            countryBreakdown?: Ga4AnalyticsState['countryBreakdown']
          }
          if (cancelled) return
          setGa4Analytics({
            configured: Boolean(data.configured),
            error: data.error,
            loading: false,
            period: data.period || null,
            timeseries: data.timeseries || [],
            topPages: data.topPages || [],
            topSources: data.topSources || [],
            totals: data.totals || null,
            previousTotals: data.previousTotals || null,
            deviceBreakdown: data.deviceBreakdown || [],
            countryBreakdown: data.countryBreakdown || [],
          })
        } catch (error) {
          if (!cancelled) {
            setGa4Analytics((current) => ({
              ...current,
              configured: true,
              error: error instanceof Error ? error.message : 'Failed to load GA4 analytics.',
              loading: false,
            }))
          }
        }
      })()
    } else {
      setGa4Analytics({
        configured: false,
        loading: false,
        period: null,
        totals: null,
        previousTotals: null,
        timeseries: [],
        topPages: [],
        topSources: [],
        deviceBreakdown: [],
        countryBreakdown: [],
      })
    }

    const gscConfigured = (analyticsSettings.hasGoogleOauthConnection || analyticsSettings.hasGa4ServiceAccount) && Boolean(analyticsSettings.gscSiteUrl)
    if (gscConfigured) {
      setGscAnalytics((current) => ({ ...current, loading: true, error: undefined }))
      void (async () => {
        try {
          const response = await fetch(`/api/analytics/search-console?period=${analyticsPeriod}`)
          if (!response.ok) {
            const detail = await response.json().catch(() => ({})) as { error?: string }
            throw new Error(detail.error || `Failed to load Search Console data (${response.status})`)
          }
          const data = await response.json() as {
            configured?: boolean
            error?: string
            period?: GscAnalyticsState['period']
            timeseries?: GscAnalyticsState['timeseries']
            topQueries?: GscAnalyticsState['topQueries']
            topPages?: GscAnalyticsState['topPages']
            totals?: GscAnalyticsState['totals']
            previousTotals?: GscAnalyticsState['previousTotals']
            strikingDistance?: GscAnalyticsState['strikingDistance']
          }
          if (cancelled) return
          setGscAnalytics({
            configured: Boolean(data.configured),
            error: data.error,
            loading: false,
            period: data.period || null,
            timeseries: data.timeseries || [],
            topQueries: data.topQueries || [],
            topPages: data.topPages || [],
            totals: data.totals || null,
            previousTotals: data.previousTotals || null,
            strikingDistance: data.strikingDistance || [],
          })
        } catch (error) {
          if (!cancelled) {
            setGscAnalytics((current) => ({
              ...current,
              configured: true,
              error: error instanceof Error ? error.message : 'Failed to load Search Console data.',
              loading: false,
            }))
          }
        }
      })()
    } else {
      setGscAnalytics({
        configured: false,
        loading: false,
        period: null,
        totals: null,
        previousTotals: null,
        timeseries: [],
        topQueries: [],
        topPages: [],
        strikingDistance: [],
      })
    }

    // Form submissions: independent of analytics; always shows on dashboard.
    setFormSubmissionsSummary((current) => ({ ...current, loading: true }))
    void (async () => {
      try {
        const response = await fetch(`/api/dashboard/form-submissions?period=${analyticsPeriod}`)
        if (!response.ok) throw new Error(`Failed to load form submissions summary (${response.status})`)
        const data = await response.json() as { count?: number; previousCount?: number; unread?: number }
        if (cancelled) return
        setFormSubmissionsSummary({
          loading: false,
          count: Number(data.count || 0),
          previousCount: Number(data.previousCount || 0),
          unread: Number(data.unread || 0),
        })
      } catch {
        if (!cancelled) setFormSubmissionsSummary((current) => ({ ...current, loading: false }))
      }
    })()

    return () => { cancelled = true }
  }, [tab, analyticsPeriod, analyticsSettings.hasGoogleOauthConnection, analyticsSettings.hasGa4ServiceAccount, analyticsSettings.ga4PropertyId, analyticsSettings.gscSiteUrl])

  // Load Email tab data (settings + submissions) when activated
  useEffect(() => {
    if (tab !== 'email') {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [settingsRes, submissionsRes] = await Promise.all([
          fetch('/api/email/settings'),
          fetch('/api/email/submissions'),
        ])
        if (!settingsRes.ok) {
          throw new Error(`Failed to load email settings (${settingsRes.status})`)
        }
        if (!submissionsRes.ok) {
          throw new Error(`Failed to load submissions (${submissionsRes.status})`)
        }
        const settings = await settingsRes.json() as {
          fromEmail: string
          fromName: string
          hasResendApiKey: boolean
          notificationEmail: string
        }
        const submissions = await submissionsRes.json() as FormSubmissionRecord[]
        if (cancelled) return
        setEmailSettings({
          fromEmail: settings.fromEmail || '',
          fromName: settings.fromName || '',
          hasResendApiKey: Boolean(settings.hasResendApiKey),
          notificationEmail: settings.notificationEmail || '',
          resendApiKeyInput: '',
        })
        setFormSubmissions(submissions || [])
      } catch (error) {
        if (!cancelled) {
          setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to load email data.' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [tab])

  // Load content items when the active tab changes to a content-item type
  useEffect(() => {
    if (!isContentItemTab(tab)) {
      return
    }
    const typeSlug = contentTypeSlugFromTab(tab)
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch(`/api/content-items/${encodeURIComponent(typeSlug)}`)
        if (!response.ok) {
          throw new Error(`Failed to load ${typeSlug} (${response.status})`)
        }
        const items = (await response.json()) as Array<{
          data: Record<string, unknown>
          id: string
          published: boolean
          slug: string
        }>
        if (cancelled) {
          return
        }
        setContentItemsByType((current) => ({ ...current, [typeSlug]: items }))
      } catch (error) {
        if (!cancelled) {
          setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to load content items.' })
        }
      }
    })()
    setActiveContentItemSlug('')
    setContentItemDraft(null)
    setContentItemListQuery('')
    return () => { cancelled = true }
  }, [tab])

  // Sync the draft when the user picks a different item
  useEffect(() => {
    if (!isContentItemTab(tab) || !activeContentItemSlug) {
      return
    }
    const typeSlug = contentTypeSlugFromTab(tab)
    const items = contentItemsByType[typeSlug] || []
    const existing = items.find((item) => item.slug === activeContentItemSlug)
    if (existing) {
      setContentItemDraft({
        data: { ...existing.data },
        isNew: false,
        originalSlug: existing.slug,
        published: existing.published,
        slug: existing.slug,
        type: typeSlug,
      })
    }
  }, [activeContentItemSlug, contentItemsByType, tab])

  useEffect(() => {
    if (!hasUnsavedProductChanges) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedProductChanges])

  async function saveSettings() {
    try {
      if (!settings) {
        throw new Error('Site settings are still loading.')
      }

      const payload: Settings = {
        siteName: settingsDraft.siteName,
        siteUrl: settingsDraft.siteUrl,
        faviconUrl: settingsDraft.faviconUrl,
        appleTouchIconUrl: settingsDraft.appleTouchIconUrl,
        defaultOgImage: settingsDraft.defaultOgImage,
        socialShareTitle: settingsDraft.socialShareTitle,
        socialShareDescription: settingsDraft.socialShareDescription,
        themeColor: settingsDraft.themeColor,
        contactEmail: settingsDraft.contactEmail,
        contactPhone: settingsDraft.contactPhone,
        navigation: settingsDraft.navigation,
        footer: settingsDraft.footer,
        booking: settingsDraft.booking,
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save site settings.')
      }

      setStatus({ kind: 'info', text: 'Site settings saved.' })
      await loadAll()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save settings.' })
    }
  }

  async function uploadSettingsAsset(field: SettingsAssetField, file: File, label: string) {
    if (!file.size) {
      setStatus({ kind: 'error', text: `Choose a ${label.toLowerCase()} file to upload.` })
      return
    }

    setUploadingSettingsAsset(field)
    setStatus(null)

    try {
      const form = new FormData()
      const alt = `${settingsDraft.siteName || 'Site'} ${label}`
      form.append('file', file)
      form.append('alt', alt)

      const response = await fetch('/api/media/upload', { method: 'POST', body: form })

      if (!response.ok) {
        throw new Error(`Failed to upload ${label.toLowerCase()}.`)
      }

      const result = (await response.json()) as { alt?: string; filename?: string; id?: string; publicUrl?: string; sourceUrl?: string }
      const url = result.publicUrl || `/api/media/file/${result.filename || file.name}`

      setSettingsDraft((current) => ({ ...current, [field]: url }))
      setMedia((current) => [
        {
          alt: result.alt || alt,
          filename: result.filename || file.name,
          id: result.id || url,
          publicUrl: url,
          sourceUrl: result.sourceUrl,
        },
        ...current.filter((item) => item.publicUrl !== url),
      ])
      setStatus({ kind: 'info', text: `${label} uploaded. Save settings to publish this change.` })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : `Failed to upload ${label.toLowerCase()}.` })
    } finally {
      setUploadingSettingsAsset('')
    }
  }

  async function saveAiSettings() {
    try {
      const payload: AiSettings = {
        provider: aiSettingsDraft.provider.trim() || 'openai',
        apiKey: aiSettingsDraft.apiKey.trim(),
        hasApiKey: aiSettingsDraft.hasApiKey,
        defaultBrandPrompt: aiSettingsDraft.defaultBrandPrompt.trim(),
        imageGeneration: {
          enabled: aiSettingsDraft.imageEnabled,
          model: aiSettingsDraft.imageModel.trim(),
          size: aiSettingsDraft.imageSize.trim(),
          quality: aiSettingsDraft.imageQuality.trim(),
          background: aiSettingsDraft.imageBackground.trim(),
          promptTemplate: aiSettingsDraft.imagePromptTemplate.trim(),
        },
        blogGeneration: {
          enabled: aiSettingsDraft.blogEnabled,
          model: aiSettingsDraft.blogModel.trim(),
          titleIdeasPromptTemplate: aiSettingsDraft.blogTitleIdeasPromptTemplate.trim(),
          promptTemplate: aiSettingsDraft.blogPromptTemplate.trim(),
          seoPromptTemplate: aiSettingsDraft.blogSeoPromptTemplate.trim(),
        },
        altTextGeneration: {
          enabled: aiSettingsDraft.altTextEnabled,
          model: aiSettingsDraft.altTextModel.trim(),
          maxLength: parsePositiveInteger(aiSettingsDraft.altTextMaxLength, 'Alt text max length'),
          promptTemplate: aiSettingsDraft.altTextPromptTemplate.trim(),
        },
      }

      const response = await fetch('/api/ai-settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          clearApiKey: aiSettingsDraft.clearApiKey,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save AI settings.')
      }

      setStatus({ kind: 'info', text: 'AI settings saved.' })
      await loadAll()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save AI settings.' })
    }
  }

  async function disconnectLinkedIn() {
    try {
      const response = await fetch('/api/linkedin/disconnect', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect LinkedIn account.')
      }

      setStatus({ kind: 'info', text: 'LinkedIn account disconnected.' })
      setLinkedInTargets([])
      setSelectedLinkedInTargetUrn('')
      setLinkedInTargetsPermissionError(false)
      setLinkedInMissingOrgScopes([])
      setLinkedInOrgScopesEnabled(false)
      await loadAll()
    } catch (error) {
      setStatus({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to disconnect LinkedIn account.',
      })
    }
  }

  async function saveLinkedInTarget() {
    if (!selectedLinkedInTargetUrn) {
      setStatus({ kind: 'error', text: 'Select a LinkedIn publish target first.' })
      return
    }

    try {
      setSavingLinkedInTarget(true)
      const response = await fetch('/api/linkedin/target', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUrn: selectedLinkedInTargetUrn }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save LinkedIn target.')
      }

      setStatus({ kind: 'info', text: 'LinkedIn publish target saved.' })
      await loadAll()
    } catch (error) {
      setStatus({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to save LinkedIn target.',
      })
    } finally {
      setSavingLinkedInTarget(false)
    }
  }

  async function sharePostOnLinkedIn() {
    if (!postDraft) {
      return
    }

    if (!linkedInConnection.connected) {
      setStatus({ kind: 'error', text: 'Connect LinkedIn first.' })
      return
    }

    if (!postDraft.published) {
      setStatus({ kind: 'error', text: 'Publish the post before sharing to LinkedIn.' })
      return
    }

    try {
      setSharingToLinkedIn(true)
      const response = await fetch('/api/linkedin/posts/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug: postDraft.slug,
          targetUrn: selectedLinkedInTargetUrn || undefined,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to share post to LinkedIn.')
      }

      setStatus({ kind: 'info', text: `Shared "${postDraft.title}" to LinkedIn.` })
    } catch (error) {
      setStatus({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Failed to share post to LinkedIn.',
      })
    } finally {
      setSharingToLinkedIn(false)
    }
  }

  async function savePage() {
    if (!pageDraft) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${encodeURIComponent(pageDraft.slug)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(pageDraft),
      })

      if (!response.ok) {
        throw new Error('Failed to save page.')
      }

      setStatus({ kind: 'info', text: `Saved page "${pageDraft.slug || '/'}".` })
      await loadAll()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save page.' })
    }
  }

  async function persistPost(nextPost: PostRecord) {
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(nextPost.slug)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(nextPost),
      })

      if (!response.ok) {
        throw new Error('Failed to save post.')
      }

      setPostDraft(nextPost)
      setStatus({ kind: 'info', text: `Saved post "${nextPost.slug}".` })
      await loadAll()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save post.' })
    }
  }

  async function savePost() {
    if (!postDraft) {
      return
    }

    await persistPost(postDraft)
  }

  async function setPostPublishedState(published: boolean) {
    if (!postDraft) {
      return
    }

    await persistPost({ ...postDraft, published })
  }

  async function deletePost() {
    if (!postDraft) {
      return
    }

    const confirmed = window.confirm(`Delete "${postDraft.title}" permanently? This cannot be undone.`)

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postDraft.slug)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post.')
      }

      setStatus({ kind: 'info', text: `Deleted post "${postDraft.slug}".` })
      setActivePostSlug('')
      setPostDraft(null)
      await loadAll({ resetActivePost: true })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to delete post.' })
    }
  }

  function discardPostDraft() {
    const existingPost = activePostSlug ? posts.find((entry) => entry.slug === activePostSlug) : null

    if (existingPost) {
      setPostDraft(existingPost)
      setStatus({ kind: 'info', text: `Reverted changes to "${existingPost.slug}".` })
      return
    }

    setPostDraft(null)
    setActivePostSlug('')
    setAiPostBuilder((current) => ({ ...current, open: true }))
    setStatus({ kind: 'info', text: 'Draft discarded.' })
  }

  async function uploadPostCoverImage(file: File) {
    if (!postDraft) {
      return
    }

    const fallbackAlt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const alt = postDraft.coverImageAlt || fallbackAlt
    const form = new FormData()
    form.append('file', file)
    form.append('alt', alt)

    try {
      const response = await fetch('/api/media/upload', { method: 'POST', body: form })

      if (!response.ok) {
        throw new Error('Upload failed.')
      }

      const result = (await response.json()) as { filename?: string; id?: string; publicUrl?: string }
      const url = result.publicUrl || `/api/media/file/${result.filename}`

      setPostDraft({ ...postDraft, coverImageAlt: alt, coverImageUrl: url })
      setMedia((current) => [
        {
          alt,
          filename: result.filename || file.name,
          id: result.id || url,
          publicUrl: url,
        },
        ...current.filter((item) => item.publicUrl !== url),
      ])
      setCoverImageLibraryOpen(false)
      setStatus({ kind: 'info', text: 'Image uploaded.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Upload failed.' })
    }
  }

  function selectPostCoverImage(item: MediaRecord) {
    if (!postDraft) {
      return
    }

    const fallbackAlt = item.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

    setPostDraft({
      ...postDraft,
      coverImageAlt: item.alt || postDraft.coverImageAlt || fallbackAlt,
      coverImageUrl: item.publicUrl,
    })
    setCoverImageLibraryOpen(false)
    setStatus({ kind: 'info', text: 'Selected image from media library.' })
  }

  async function persistProduct(nextProduct: ProductRecord) {
    try {
      const normalizedProduct = syncProductDraftImages(nextProduct)
      const response = await fetch(`/api/products/${encodeURIComponent(normalizedProduct.slug)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(normalizedProduct),
      })

      if (!response.ok) {
        throw new Error('Failed to save product.')
      }

      setProductDraft(normalizedProduct)
      setStatus({ kind: 'info', text: `Saved product "${normalizedProduct.slug}".` })
      await loadAll()
      return true
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save product.' })
      return false
    }
  }

  async function saveProduct() {
    if (!productDraft) {
      return
    }

    await persistProduct(productDraft)
  }

  function resolveUnsavedProductDialog(choice: UnsavedProductExitChoice) {
    const resolver = unsavedProductDialogResolver.current
    unsavedProductDialogResolver.current = null
    setUnsavedProductDialog(null)
    resolver?.(choice)
  }

  function promptUnsavedProductDialog(actionLabel: string) {
    setUnsavedProductDialog({ actionLabel })

    return new Promise<UnsavedProductExitChoice>((resolve) => {
      unsavedProductDialogResolver.current = resolve
    })
  }

  async function confirmProductDraftExit(actionLabel = 'leave this product') {
    if (!productDraft || !hasUnsavedProductChanges) {
      return true
    }

    const choice = await promptUnsavedProductDialog(actionLabel)

    if (choice === 'cancel') {
      return false
    }

    if (choice === 'discard') {
      discardProductDraft()
      return true
    }

    return persistProduct(productDraft)
  }

  async function handleTabChange(nextTab: TabKey) {
    if (nextTab === tab) {
      return
    }

    if (!isTabAllowed(nextTab)) {
      setStatus({ kind: 'error', text: 'That section is hidden for this login.' })
      return
    }

    if (tab === 'products' && nextTab !== 'products') {
      const canLeave = await confirmProductDraftExit(`go to ${getTabMeta(nextTab).title}`)
      if (!canLeave) {
        return
      }
    }

    setTab(nextTab)
  }

  async function handleSelectProduct(nextSlug: string) {
    if (nextSlug === activeProductSlug) {
      return
    }

    const nextProduct = products.find((entry) => entry.slug === nextSlug)
    const canLeave = await confirmProductDraftExit(`switch to ${nextProduct?.name || 'another product'}`)
    if (!canLeave) {
      return
    }

    setActiveProductSlug(nextSlug)
  }

  async function handleAddProduct() {
    const canLeave = await confirmProductDraftExit('create a new product')
    if (!canLeave) {
      return
    }

    setProductDraft(createBlankProductDraft())
    setActiveProductSlug('')
  }

  async function setProductPublishedState(published: boolean) {
    if (!productDraft) {
      return
    }

    await persistProduct({ ...productDraft, published })
  }

  async function deleteProduct() {
    if (!productDraft) {
      return
    }

    const confirmed = window.confirm(`Delete "${productDraft.name}" permanently? This cannot be undone.`)

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productDraft.slug)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product.')
      }

      setStatus({ kind: 'info', text: `Deleted product "${productDraft.slug}".` })
      setActiveProductSlug('')
      setProductDraft(null)
      await loadAll({ resetActivePost: true })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to delete product.' })
    }
  }

  function discardProductDraft() {
    const existingProduct = activeProductSlug ? products.find((entry) => entry.slug === activeProductSlug) : null

    if (existingProduct) {
      setProductDraft(syncProductDraftImages(existingProduct))
      setStatus({ kind: 'info', text: `Reverted changes to "${existingProduct.slug}".` })
      return
    }

    setProductDraft(null)
    setActiveProductSlug('')
    setStatus({ kind: 'info', text: 'Product draft discarded.' })
  }

  function updateProductDraftImages(updater: (images: ProductImageRecord[]) => ProductImageRecord[]) {
    if (!productDraft) {
      return
    }

    const nextImages = updater(productDraft.productImages).map((image, index) => ({
      ...image,
      sortOrder: index,
    }))
    const nextHeroImage = nextImages[0]

    const nextProduct = syncProductDraftImages({
      ...productDraft,
      heroImageAlt: nextHeroImage?.alt || '',
      heroImageUrl: nextHeroImage?.url || '',
      productImages: nextImages,
    })

    setProductDraft(nextProduct)
  }

  function makeProductHeroImage(index: number) {
    if (!productDraft || index <= 0 || index >= productDraft.productImages.length) {
      return
    }

    updateProductDraftImages((current) => {
      const nextImages = current.slice()
      const [selectedImage] = nextImages.splice(index, 1)
      nextImages.unshift(selectedImage)
      return nextImages
    })
    setStatus({ kind: 'info', text: 'Updated the hero image.' })
  }

  function makeProductLifestyleImage(index: number) {
    if (!productDraft || index < 0 || index >= productDraft.productImages.length) {
      return
    }

    updateProductDraftImages((current) =>
      current.map((image, currentIndex) => ({
        ...image,
        label:
          currentIndex === index
            ? 'lifestyle'
            : image.label === 'lifestyle'
              ? undefined
              : image.label,
      })),
    )
    setStatus({ kind: 'info', text: 'Updated the lifestyle image.' })
  }

  function removeProductImage(index: number) {
    if (!productDraft || index < 0 || index >= productDraft.productImages.length) {
      return
    }

    updateProductDraftImages((current) => current.filter((_, currentIndex) => currentIndex !== index))
    setStatus({ kind: 'info', text: 'Removed product image.' })
  }

  function clearProductImages() {
    if (!productDraft) {
      return
    }

    setProductDraft({
      ...productDraft,
      productImages: [],
      heroImageAlt: '',
      heroImageUrl: '',
    })
    setStatus({ kind: 'info', text: 'Cleared all product images.' })
  }

  function reorderProductImages(fromIndex: number, toIndex: number) {
    if (!productDraft || fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return
    }

    updateProductDraftImages((current) => {
      const nextImages = current.slice()
      const [movedImage] = nextImages.splice(fromIndex, 1)
      nextImages.splice(toIndex, 0, movedImage)
      return nextImages
    })
  }

  function handleProductImageDragStart(index: number) {
    draggedProductImageIndex.current = index
  }

  function handleProductImageDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
  }

  function handleProductImageDrop(index: number) {
    const fromIndex = draggedProductImageIndex.current
    draggedProductImageIndex.current = null

    if (!Number.isInteger(fromIndex)) {
      return
    }

    reorderProductImages(fromIndex as number, index)
  }

  function handleProductImageDragEnd() {
    draggedProductImageIndex.current = null
  }

  async function uploadProductImages(files: File[]) {
    if (!productDraft || !files.length) {
      return
    }

    try {
      const uploadedImages: ProductImageRecord[] = []

      for (const file of files) {
        const fallbackAlt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        const alt = fallbackAlt
        const form = new FormData()
        form.append('file', file)
        form.append('alt', alt)

        const response = await fetch('/api/media/upload', { method: 'POST', body: form })

        if (!response.ok) {
          throw new Error('Upload failed.')
        }

        const result = (await response.json()) as { filename?: string; id?: string; publicUrl?: string }
        const url = result.publicUrl || `/api/media/file/${result.filename}`

        uploadedImages.push({
          alt,
          sortOrder: uploadedImages.length,
          url,
        })

        setMedia((current) => [
          {
            alt,
            filename: result.filename || file.name,
            id: result.id || url,
            publicUrl: url,
          },
          ...current.filter((item) => item.publicUrl !== url),
        ])
      }

      updateProductDraftImages((current) => [...current, ...uploadedImages])
      setProductImageLibraryOpen(false)
      setStatus({ kind: 'info', text: `Uploaded ${files.length} product image${files.length === 1 ? '' : 's'}.` })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Upload failed.' })
    }
  }

  function selectProductImage(item: MediaRecord) {
    if (!productDraft) {
      return
    }

    const fallbackAlt = item.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')

    updateProductDraftImages((current) => [
      ...current,
      {
        alt: item.alt || fallbackAlt,
        sortOrder: current.length,
        url: item.publicUrl,
      },
    ])
    setStatus({ kind: 'info', text: 'Added product image from the media library.' })
  }

  async function generateAiTitleIdeas() {
    if (!canUseAiBlogBuilder) {
      setStatus({ kind: 'error', text: 'AI blog tools are hidden for this login.' })
      return
    }

    const topic = aiPostBuilder.topic.trim()

    if (!topic) {
      setStatus({ kind: 'error', text: 'Enter a topic or brief before generating title ideas.' })
      return
    }

    setAiPostBuilder((current) => ({ ...current, loadingTitles: true }))
    setStatus(null)

    try {
      const response = await fetch('/api/ai/posts/titles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topic,
          audience: aiPostBuilder.audience,
          goal: aiPostBuilder.goal,
          count: 5,
        }),
      })

      const payload = (await response.json()) as { error?: string; titleIdeas?: string[] }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to generate title ideas.')
      }

      const titleIdeas = payload.titleIdeas || []
      setAiPostBuilder((current) => ({
        ...current,
        titleIdeas,
        selectedTitle: current.selectedTitle || titleIdeas[0] || '',
      }))
      setStatus({ kind: 'info', text: titleIdeas.length ? 'Generated title ideas.' : 'No title ideas were returned.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to generate title ideas.' })
    } finally {
      setAiPostBuilder((current) => ({ ...current, loadingTitles: false }))
    }
  }

  async function generateAiPostDraft() {
    if (!canUseAiBlogBuilder) {
      setStatus({ kind: 'error', text: 'AI blog tools are hidden for this login.' })
      return
    }

    const topic = aiPostBuilder.topic.trim()

    if (!topic) {
      setStatus({ kind: 'error', text: 'Enter a topic or brief before generating a draft.' })
      return
    }

    setAiPostBuilder((current) => ({ ...current, loadingDraft: true }))
    setStatus(null)

    try {
      const response = await fetch('/api/ai/posts/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topic,
          audience: aiPostBuilder.audience,
          goal: aiPostBuilder.goal,
          imagePrompt: aiPostBuilder.imagePrompt,
          selectedTitle: aiPostBuilder.selectedTitle.trim(),
          generateImage: aiPostBuilder.generateImage,
        }),
      })

      const payload = (await response.json()) as { error?: string; post?: PostRecord; warnings?: string[] }

      if (!response.ok || !payload.post) {
        throw new Error(payload.error || 'Failed to generate AI post draft.')
      }

      setPostDraft(payload.post)
      setActivePostSlug('')
      setAiPostBuilder((current) => ({
        ...current,
        open: false,
        selectedTitle: payload.post?.title || current.selectedTitle,
      }))

      const warnings = (payload.warnings || []).filter(Boolean)
      setStatus({
        kind: 'info',
        text: warnings.length
          ? `AI draft generated. Review and save when ready. ${warnings.join(' ')}`
          : 'AI draft generated. Review and save when ready.',
      })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to generate AI post draft.' })
    } finally {
      setAiPostBuilder((current) => ({ ...current, loadingDraft: false }))
    }
  }

  async function uploadMedia(input: { alt: string; files: File[]; sourceUrl: string }) {
    setUploading(true)
    setStatus(null)

    try {
      const files = input.files.filter((file) => file.size > 0)
      const sourceUrl = input.sourceUrl.trim()
      const altText = input.alt.trim()

      if (!files.length && !sourceUrl) {
        throw new Error('Choose one or more files, or enter a source URL.')
      }

      const uploadOne = async (formData: FormData) => {
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Failed to upload media.')
        }
      }

      if (files.length) {
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          if (altText) {
            formData.append('alt', altText)
          }
          await uploadOne(formData)
        }

        setStatus({ kind: 'info', text: `Uploaded ${files.length} media file${files.length === 1 ? '' : 's'}.` })
      } else {
        const formData = new FormData()
        formData.append('sourceUrl', sourceUrl)
        if (altText) {
          formData.append('alt', altText)
        }
        await uploadOne(formData)
        setStatus({ kind: 'info', text: 'Media imported.' })
      }

      await loadAll()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to upload media.' })
    } finally {
      setUploading(false)
    }
  }

  async function saveAnalyticsSettings() {
    setSavingAnalyticsSettings(true)
    try {
      const body: Record<string, unknown> = {
        ga4PropertyId: analyticsSettings.ga4PropertyId,
        gscSiteUrl: analyticsSettings.gscSiteUrl,
        googleOauthClientId: analyticsSettings.googleOauthClientId,
      }
      if (analyticsSettings.ga4ServiceAccountJsonInput) {
        body.ga4ServiceAccountJson = analyticsSettings.ga4ServiceAccountJsonInput
      }
      if (analyticsSettings.googleOauthClientSecretInput) {
        body.googleOauthClientSecret = analyticsSettings.googleOauthClientSecretInput
      }
      const response = await fetch('/api/integrations/analytics', {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      })
      if (!response.ok) {
        throw new Error(`Failed to save (${response.status})`)
      }
      const saved = await response.json() as {
        ga4PropertyId: string
        gscSiteUrl: string
        hasGa4ServiceAccount: boolean
        googleOauthClientId: string
        hasGoogleOauthClientSecret: boolean
        hasGoogleOauthConnection: boolean
        googleOauthEmail: string
      }
      setAnalyticsSettings((current) => ({
        ...current,
        ga4PropertyId: saved.ga4PropertyId || '',
        ga4ServiceAccountJsonInput: '',
        gscSiteUrl: saved.gscSiteUrl || '',
        hasGa4ServiceAccount: Boolean(saved.hasGa4ServiceAccount),
        googleOauthClientId: saved.googleOauthClientId || '',
        googleOauthClientSecretInput: '',
        hasGoogleOauthClientSecret: Boolean(saved.hasGoogleOauthClientSecret),
        hasGoogleOauthConnection: Boolean(saved.hasGoogleOauthConnection),
        googleOauthEmail: saved.googleOauthEmail || '',
      }))
      setStatus({ kind: 'info', text: 'Analytics integrations saved.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save analytics settings.' })
    } finally {
      setSavingAnalyticsSettings(false)
    }
  }

  async function disconnectGoogleAccount() {
    try {
      const response = await fetch('/api/auth/google/disconnect', { method: 'POST' })
      if (!response.ok) throw new Error(`Failed to disconnect (${response.status})`)
      setAnalyticsSettings((current) => ({
        ...current,
        hasGoogleOauthConnection: false,
        googleOauthEmail: '',
      }))
      setGa4PropertyList([])
      setGscSiteList([])
      setStatus({ kind: 'info', text: 'Disconnected Google account.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to disconnect.' })
    }
  }

  async function saveEmailSettings() {
    setSavingEmailSettings(true)
    try {
      const body: Record<string, unknown> = {
        fromEmail: emailSettings.fromEmail,
        fromName: emailSettings.fromName,
        notificationEmail: emailSettings.notificationEmail,
      }
      if (emailSettings.resendApiKeyInput) {
        body.resendApiKey = emailSettings.resendApiKeyInput
      }
      const response = await fetch('/api/email/settings', {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      })
      if (!response.ok) {
        throw new Error(`Failed to save (${response.status})`)
      }
      const saved = await response.json() as {
        fromEmail: string
        fromName: string
        hasResendApiKey: boolean
        notificationEmail: string
      }
      setEmailSettings({
        fromEmail: saved.fromEmail || '',
        fromName: saved.fromName || '',
        hasResendApiKey: Boolean(saved.hasResendApiKey),
        notificationEmail: saved.notificationEmail || '',
        resendApiKeyInput: '',
      })
      setStatus({ kind: 'info', text: 'Email settings saved.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save email settings.' })
    } finally {
      setSavingEmailSettings(false)
    }
  }

  async function archiveSubmission(submission: FormSubmissionRecord, archived: boolean) {
    try {
      const response = await fetch(`/api/email/submissions/${encodeURIComponent(submission.id)}`, {
        body: JSON.stringify({ archived }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error(`Failed to update (${response.status})`)
      }
      setFormSubmissions((current) => current.map((entry) => (
        entry.id === submission.id ? { ...entry, archived } : entry
      )))
      if (activeSubmission?.id === submission.id) {
        setActiveSubmission({ ...submission, archived })
      }
      setStatus({ kind: 'info', text: archived ? 'Submission archived.' : 'Submission restored.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to update submission.' })
    }
  }

  async function deleteSubmission(submission: FormSubmissionRecord) {
    try {
      const response = await fetch(`/api/email/submissions/${encodeURIComponent(submission.id)}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(`Failed to delete (${response.status})`)
      }
      setFormSubmissions((current) => current.filter((entry) => entry.id !== submission.id))
      if (activeSubmission?.id === submission.id) {
        setActiveSubmission(null)
      }
      setSubmissionDeleteConfirm(null)
      setStatus({ kind: 'info', text: 'Submission deleted.' })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to delete submission.' })
    }
  }

  function startNewContentItem(typeSlug: string) {
    const def = CONTENT_TYPE_DEFINITIONS.find((entry) => entry.slug === typeSlug)
    if (!def) {
      return
    }
    const blankData: Record<string, unknown> = {}
    for (const field of def.fields) {
      blankData[field.name] = field.type === 'boolean' ? false : ''
    }
    setActiveContentItemSlug('')
    setContentItemDraft({
      data: blankData,
      isNew: true,
      originalSlug: '',
      published: false,
      slug: '',
      type: typeSlug,
    })
  }

  async function saveContentItem() {
    if (!contentItemDraft) {
      return
    }
    const def = CONTENT_TYPE_DEFINITIONS.find((entry) => entry.slug === contentItemDraft.type)
    if (!def) {
      setStatus({ kind: 'error', text: 'Unknown content type.' })
      return
    }
    const slug = (contentItemDraft.slug || '').trim()
    if (!slug) {
      setStatus({ kind: 'error', text: 'Slug is required.' })
      return
    }
    const titleField = def.titleField || 'name'
    const titleValue = String(contentItemDraft.data[titleField] || '').trim()
    if (!titleValue) {
      setStatus({ kind: 'error', text: `${def.fields.find((f) => f.name === titleField)?.label || 'Title'} is required.` })
      return
    }

    setSavingContentItem(true)
    try {
      const response = await fetch(`/api/content-items/${encodeURIComponent(contentItemDraft.type)}/${encodeURIComponent(contentItemDraft.originalSlug || slug)}`, {
        body: JSON.stringify({
          data: contentItemDraft.data,
          published: contentItemDraft.published,
          slug,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      })
      if (!response.ok) {
        throw new Error(`Failed to save (${response.status})`)
      }
      const saved = (await response.json()) as {
        data: Record<string, unknown>
        id: string
        published: boolean
        slug: string
      }
      setContentItemsByType((current) => {
        const next = { ...current }
        const items = next[contentItemDraft.type] ? [...next[contentItemDraft.type]] : []
        const replaceIndex = items.findIndex((item) => item.slug === contentItemDraft.originalSlug)
        if (replaceIndex >= 0) {
          items.splice(replaceIndex, 1, saved)
        } else {
          items.unshift(saved)
        }
        next[contentItemDraft.type] = items
        return next
      })
      setActiveContentItemSlug(saved.slug)
      setContentItemDraft({
        data: saved.data,
        isNew: false,
        originalSlug: saved.slug,
        published: saved.published,
        slug: saved.slug,
        type: contentItemDraft.type,
      })
      setStatus({ kind: 'info', text: `${def.label} saved.` })
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save content item.' })
    } finally {
      setSavingContentItem(false)
    }
  }

  async function deleteContentItemRecord(typeSlug: string, slug: string) {
    try {
      const response = await fetch(`/api/content-items/${encodeURIComponent(typeSlug)}/${encodeURIComponent(slug)}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(`Failed to delete (${response.status})`)
      }
      setContentItemsByType((current) => {
        const next = { ...current }
        next[typeSlug] = (next[typeSlug] || []).filter((entry) => entry.slug !== slug)
        return next
      })
      if (activeContentItemSlug === slug) {
        setActiveContentItemSlug('')
        setContentItemDraft(null)
      }
      setStatus({ kind: 'info', text: 'Content item deleted.' })
      setContentItemDeleteConfirm(null)
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to delete content item.' })
    }
  }

  async function saveMediaAlt() {
    if (!mediaEditDraft) {
      return
    }
    setSavingMediaAlt(true)
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(mediaEditDraft.id)}`, {
        body: JSON.stringify({ alt: mediaEditDraft.alt }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      })
      if (!response.ok) {
        throw new Error(`Failed to save alt text (${response.status})`)
      }
      setMedia((current) => current.map((item) => (
        item.id === mediaEditDraft.id ? { ...item, alt: mediaEditDraft.alt } : item
      )))
      setStatus({ kind: 'info', text: 'Alt text updated.' })
      setMediaEditDraft(null)
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save alt text.' })
    } finally {
      setSavingMediaAlt(false)
    }
  }

  async function deleteMediaItem(item: MediaRecord) {
    setDeletingMediaId(item.id)
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error(`Failed to delete media (${response.status})`)
      }
      setMedia((current) => current.filter((entry) => entry.id !== item.id))
      setStatus({ kind: 'info', text: `Deleted ${item.filename}.` })
      setMediaDeleteConfirm(null)
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to delete media.' })
    } finally {
      setDeletingMediaId(null)
    }
  }

  async function copyToClipboard(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value)
      setStatus({ kind: 'info', text: successMessage })
    } catch {
      setStatus({ kind: 'error', text: 'Could not copy that link automatically.' })
    }
  }

  async function createInvitation() {
    const email = inviteDraft.email.trim().toLowerCase()
    const name = inviteDraft.name.trim()

    if (!email || !name) {
      setStatus({ kind: 'error', text: 'Add a name and email before creating an invite.' })
      return
    }

    try {
      setCreatingInvitation(true)
      const response = await fetch('/api/users/invitations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          featureVisibility: inviteDraft.featureVisibility,
          name,
          role: inviteDraft.role,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        invitation?: UserInvitationRecord
        inviteUrl?: string
      } | null

      if (!response.ok || !payload?.inviteUrl) {
        throw new Error(payload?.error || 'Failed to create invite link.')
      }

      setGeneratedInviteId(payload.invitation?.id || '')
      setGeneratedInviteUrl(payload.inviteUrl)
      setInviteDraft({
        email: '',
        featureVisibility: DEFAULT_USER_FEATURE_VISIBILITY,
        name: '',
        role: 'editor',
      })
      setStatus({ kind: 'info', text: 'Invite link created. Copy it and send it manually.' })
      await loadUsers()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to create invite link.' })
    } finally {
      setCreatingInvitation(false)
    }
  }

  async function revokeInvitation(id: string) {
    try {
      const response = await fetch(`/api/users/invitations/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to revoke invite.')
      }

      if (generatedInviteId === id) {
        setGeneratedInviteId('')
        setGeneratedInviteUrl('')
      }
      setStatus({ kind: 'info', text: 'Invite revoked.' })
      await loadUsers()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to revoke invite.' })
    }
  }

  function removeUserAccessDraft(userId: string) {
    setUserAccessDrafts((current) => {
      const next = { ...current }
      delete next[userId]
      return next
    })
  }

  function openUserAccessEditor(entry: ManagedUserRecord) {
    setUserAccessDrafts((current) => ({
      ...current,
      [entry.id]: current[entry.id] || createUserAccessDraft(entry),
    }))
    setExpandedUserAccessId(entry.id)
  }

  function updateUserAccessDraft(
    entry: ManagedUserRecord,
    updater: (draft: UserAccessDraft) => UserAccessDraft,
  ) {
    setUserAccessDrafts((current) => ({
      ...current,
      [entry.id]: updater(current[entry.id] || createUserAccessDraft(entry)),
    }))
  }

  async function saveManagedUserAccessDraft(entry: ManagedUserRecord) {
    const draft = userAccessDrafts[entry.id] || createUserAccessDraft(entry)

    if (!userAccessDraftChanged(entry, draft)) {
      setExpandedUserAccessId('')
      removeUserAccessDraft(entry.id)
      return
    }

    if (draft.role !== entry.role && !canUpdateCmsUserRole({
      actorId: user.id,
      actorRole: user.role,
      nextRole: draft.role,
      targetId: entry.id,
      targetRole: entry.role,
    })) {
      setStatus({ kind: 'error', text: 'You cannot assign that role.' })
      return
    }

    const savedFeatureVisibility = normalizeUserFeatureVisibility(entry.featureVisibility)
    const featureVisibilityChanged = userFeatureVisibilityChanged(savedFeatureVisibility, draft.featureVisibility)

    if (featureVisibilityChanged && !isSuperAdmin) {
      setStatus({ kind: 'error', text: 'Only super admins can change feature visibility.' })
      return
    }

    try {
      setUpdatingUserId(entry.id)
      setUpdatingUserFeaturesId(entry.id)

      if (draft.role !== entry.role) {
        const response = await fetch(`/api/users/${encodeURIComponent(entry.id)}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ role: draft.role }),
        })
        const payload = (await response.json().catch(() => null)) as { error?: string } | null

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to update user role.')
        }
      }

      if (featureVisibilityChanged && draft.role !== 'super_admin') {
        const response = await fetch(`/api/users/${encodeURIComponent(entry.id)}/features`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(draft.featureVisibility),
        })
        const payload = (await response.json().catch(() => null)) as { error?: string } | null

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to update feature visibility.')
        }
      }

      setStatus({ kind: 'info', text: `${entry.name}'s access was saved.` })
      setExpandedUserAccessId('')
      removeUserAccessDraft(entry.id)
      await loadUsers()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save user access.' })
    } finally {
      setUpdatingUserId('')
      setUpdatingUserFeaturesId('')
    }
  }

  async function updateManagedUserRole(entry: ManagedUserRecord, nextRole: UserRole) {
    if (entry.role === nextRole) {
      return
    }

    if (!canUpdateCmsUserRole({
      actorId: user.id,
      actorRole: user.role,
      nextRole,
      targetId: entry.id,
      targetRole: entry.role,
    })) {
      setStatus({ kind: 'error', text: 'You cannot assign that role.' })
      return
    }

    try {
      setUpdatingUserId(entry.id)
      const response = await fetch(`/api/users/${encodeURIComponent(entry.id)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update user role.')
      }

      setStatus({ kind: 'info', text: `${entry.name}'s role was updated.` })
      await loadUsers()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to update user role.' })
    } finally {
      setUpdatingUserId('')
    }
  }

  async function updateManagedUserFeatureVisibility(
    entry: ManagedUserRecord,
    key: keyof UserFeatureVisibility,
    value: boolean,
  ) {
    if (!isSuperAdmin) {
      setStatus({ kind: 'error', text: 'Only super admins can change feature visibility.' })
      return
    }

    const nextVisibility = {
      ...(entry.featureVisibility || DEFAULT_USER_FEATURE_VISIBILITY),
      [key]: value,
    }

    try {
      setUpdatingUserFeaturesId(entry.id)
      const response = await fetch(`/api/users/${encodeURIComponent(entry.id)}/features`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(nextVisibility),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update feature visibility.')
      }

      setManagedUsers((current) => current.map((item) => (
        item.id === entry.id
          ? { ...item, featureVisibility: nextVisibility }
          : item
      )))
      setStatus({ kind: 'info', text: `${entry.name}'s feature visibility was updated.` })
      await loadUsers()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to update feature visibility.' })
    } finally {
      setUpdatingUserFeaturesId('')
    }
  }

  async function deleteManagedUser(entry: ManagedUserRecord) {
    if (!canDeleteCmsUser({
      actorId: user.id,
      actorRole: user.role,
      targetId: entry.id,
      targetRole: entry.role,
    })) {
      setStatus({ kind: 'error', text: 'You cannot delete that user.' })
      return
    }

    if (!window.confirm(`Delete ${entry.name} from this CMS?`)) {
      return
    }

    try {
      setDeletingUserId(entry.id)
      const response = await fetch(`/api/users/${encodeURIComponent(entry.id)}`, {
        method: 'DELETE',
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete user.')
      }

      setStatus({ kind: 'info', text: `${entry.name} was removed from this CMS.` })
      await loadUsers()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to delete user.' })
    } finally {
      setDeletingUserId('')
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  const currentMeta = getTabMeta(tab)
  const staticPages = pages.filter((page) => !page.slug.startsWith('blog'))
  const pageStylesheetsInput = pageDraft ? pageDraft.stylesheets.join('\n') : ''
  const postCategoriesInput = postDraft ? postDraft.categories.map((entry) => entry.label).join(', ') : ''
  const productBestForInput = productDraft ? productDraft.bestFor.join('\n') : ''
  const productSpecNotesInput = productDraft ? productDraft.specNotes.join('\n') : ''
  const draftLoadingMessages = getAiDraftLoadingMessages(aiPostBuilder.generateImage)
  const activeDraftLoadingMessage = draftLoadingMessages[draftLoadingMessageIndex] || draftLoadingMessages[0]
  const normalizedPageQuery = pageListQuery.trim().toLowerCase()
  const normalizedPostQuery = postListQuery.trim().toLowerCase()
  const normalizedProductQuery = productListQuery.trim().toLowerCase()
  const visiblePages = [...staticPages]
    .filter((page) => {
      if (!normalizedPageQuery) {
        return true
      }
      const searchable = [page.slug || 'home', page.title].join(' ').toLowerCase()
      return searchable.includes(normalizedPageQuery)
    })
    .sort((left, right) => {
      const leftLabel = left.slug || ''
      const rightLabel = right.slug || ''
      if (pageListSort === 'slug-desc') {
        return compareStringsDescending(leftLabel, rightLabel)
      }
      if (pageListSort === 'published') {
        return (
          comparePublishedStatus(left.published, right.published) ||
          compareStringsAscending(leftLabel, rightLabel)
        )
      }
      return compareStringsAscending(leftLabel, rightLabel)
    })
  const visiblePosts = [...posts]
    .filter((post) => {
      if (!normalizedPostQuery) {
        return true
      }

      const searchable = [
        post.title,
        post.slug,
        post.primaryCategory,
        ...post.categories.map((entry) => entry.label),
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(normalizedPostQuery)
    })
    .sort((left, right) => {
      if (postListSort === 'title-asc') {
        return compareStringsAscending(left.title, right.title)
      }

      if (postListSort === 'title-desc') {
        return compareStringsDescending(left.title, right.title)
      }

      if (postListSort === 'published') {
        return (
          comparePublishedStatus(left.published, right.published) ||
          publishedTimestamp(right.publishedAt) - publishedTimestamp(left.publishedAt) ||
          compareStringsAscending(left.title, right.title)
        )
      }

      return (
        publishedTimestamp(right.publishedAt) - publishedTimestamp(left.publishedAt) ||
        compareStringsAscending(left.title, right.title)
      )
    })
  const visibleProducts = [...products]
    .filter((product) => {
      if (!normalizedProductQuery) {
        return true
      }

      const searchable = [
        product.name,
        product.slug,
        product.categoryLabel,
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(normalizedProductQuery)
    })
    .sort((left, right) => {
      if (productListSort === 'title-asc') {
        return compareStringsAscending(left.name, right.name)
      }

      if (productListSort === 'title-desc') {
        return compareStringsDescending(left.name, right.name)
      }

      if (productListSort === 'published') {
        return (
          comparePublishedStatus(left.published, right.published) ||
          compareStringsAscending(left.name, right.name)
        )
      }

      return (
        compareStringsAscending(left.categoryLabel, right.categoryLabel) ||
        compareStringsAscending(left.name, right.name)
      )
    })
  const navSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((entry) => isTabAllowed(entry.key)),
    }))
    .filter((section) => section.items.length > 0)
  const stats: Array<{ detail: string; icon: ReactNode; label: string; value: string }> = [
    {
      icon: <IconPages />,
      label: 'Pages',
      value: String(pages.length),
      detail: `${pages.filter((page) => page.published).length} published`,
    },
    ...(canViewBlog
      ? [{
          icon: <IconPosts />,
          label: 'Blog Posts',
          value: String(posts.length),
          detail: `${posts.filter((post) => post.published).length} published`,
        }]
      : []),
    {
      icon: <IconProducts />,
      label: 'Products',
      value: String(products.length),
      detail: `${products.filter((product) => product.published).length} published`,
    },
    {
      icon: <IconMedia />,
      label: 'Media Files',
      value: String(media.length),
      detail: 'Available in library',
    },
    {
      icon: <IconUser />,
      label: canManageUsers ? 'CMS Users' : 'Your Access',
      value: canManageUsers ? String(managedUsers.length || 1) : formatUserRole(user.role),
      detail: canManageUsers ? `${userInvitations.length} pending invite${userInvitations.length === 1 ? '' : 's'}` : user.email,
    },
  ]

  return (
    <div
      className={cn(
        styles.app,
        themeMode === 'dark' ? styles.themeDark : styles.themeLight,
        themeMode === 'dark' && 'dark',
        'bg-background text-foreground',
      )}
      data-theme={themeMode}
    >
      <div className="grid min-h-screen grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="sticky top-0 flex h-screen flex-col overflow-y-auto border-r border-white/10 bg-[#070f24] text-slate-200">
          <div className="flex h-[5.5rem] shrink-0 items-center justify-center border-b border-white/10 px-4">
            <img alt="Clastro CMS" className="block h-auto w-full max-w-[12rem]" src="/images/clastro-logo.svg" />
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {section.label}
                </div>
                <div className="flex flex-col gap-1">
                  {section.items.map((entry) => {
                    const isActive = tab === entry.key
                    return (
                      <button
                        className={cn(
                          'group flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                          isActive
                            ? 'bg-cyan-400/15 text-cyan-50 ring-1 ring-inset ring-cyan-400/30'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white',
                        )}
                        key={entry.key}
                        onClick={() => { void handleTabChange(entry.key) }}
                        type="button"
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors',
                            isActive
                              ? 'bg-cyan-400/25 text-cyan-100'
                              : 'bg-white/5 text-slate-300 group-hover:bg-cyan-400/10 group-hover:text-cyan-200',
                          )}
                        >
                          {getNavIcon(entry.key)}
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="text-sm font-medium">{entry.label}</span>
                          <span className="truncate text-xs text-slate-400">{entry.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="space-y-3 border-t border-white/10 px-3 py-4">
            <a
              className="inline-flex items-center self-start rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-200 transition hover:bg-cyan-400/20"
              href="/changelog"
              rel="noreferrer"
              target="_blank"
            >
              v{CLASTRO_VERSION}
            </a>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              <div className="mt-0.5 truncate text-xs text-slate-400" title={user.email}>{user.email}</div>
              <span className="mt-2 inline-flex rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-cyan-200">
                {formatUserRole(user.role)} access
              </span>
            </div>
            <button
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-100"
              onClick={logout}
              type="button"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="flex min-h-screen flex-col bg-background">
          <header className="sticky top-0 z-10 flex h-[5.5rem] shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-background/85 px-8 backdrop-blur">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{currentMeta.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{currentMeta.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                aria-label="CMS colour theme"
                className="inline-flex items-center rounded-md border border-border bg-muted p-0.5 text-xs"
                role="group"
              >
                <button
                  aria-pressed={themeMode === 'light'}
                  className={cn(
                    'rounded px-3 py-1 font-medium transition',
                    themeMode === 'light'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setThemeMode('light')}
                  type="button"
                >
                  Light
                </button>
                <button
                  aria-pressed={themeMode === 'dark'}
                  className={cn(
                    'rounded px-3 py-1 font-medium transition',
                    themeMode === 'dark'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setThemeMode('dark')}
                  type="button"
                >
                  Dark
                </button>
              </div>

              {tab === 'dashboard' && (
                <Button asChild size="sm" variant="outline">
                  <a href="/" rel="noreferrer" target="_blank">View Website</a>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <a href="/admin/edit">Edit Website</a>
              </Button>
              {tab === 'ai' && canViewAi && (
                <Button onClick={saveAiSettings} size="sm" type="button">Save AI Settings</Button>
              )}
              {tab === 'settings' && (
                <Button onClick={saveSettings} size="sm" type="button">Save Settings</Button>
              )}
              {tab === 'email' && (
                <Button disabled={savingEmailSettings} onClick={() => { void saveEmailSettings() }} size="sm" type="button">
                  {savingEmailSettings ? 'Saving…' : 'Save Email Settings'}
                </Button>
              )}
              {tab === 'integrations' && (
                <Button disabled={savingAnalyticsSettings} onClick={() => { void saveAnalyticsSettings() }} size="sm" type="button">
                  {savingAnalyticsSettings ? 'Saving…' : 'Save Integrations'}
                </Button>
              )}
              {tab === 'posts' && canViewBlog && (
                <>
                  {canUseAiBlogBuilder && (
                    <Button
                      onClick={() => {
                        setAiPostBuilder((current) => ({ ...current, open: !current.open }))
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      AI Blog Post
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setPostDraft(createBlankPostDraft())
                      setActivePostSlug('')
                      setAiPostBuilder((current) => ({
                        ...current,
                        open: false,
                        titleIdeas: [],
                        selectedTitle: '',
                      }))
                    }}
                    size="sm"
                    type="button"
                  >
                    Add Post
                  </Button>
                </>
              )}
              {tab === 'products' && (
                <Button onClick={() => { void handleAddProduct() }} size="sm" type="button">
                  Add Product
                </Button>
              )}
              {isContentItemTab(tab) && (() => {
                const typeSlug = contentTypeSlugFromTab(tab)
                const def = CONTENT_TYPE_DEFINITIONS.find((entry) => entry.slug === typeSlug)
                if (!def) {
                  return null
                }
                return (
                  <Button onClick={() => startNewContentItem(typeSlug)} size="sm" type="button">
                    Add {def.label}
                  </Button>
                )
              })()}
            </div>
          </header>

          <div className="flex-1 px-8 py-6">
            {status && (
              <div
                className={cn(
                  'mb-6 rounded-lg border px-4 py-3 text-sm',
                  status.kind === 'error'
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : 'border-cyan-400/30 bg-cyan-400/10 text-cyan-900 dark:text-cyan-200',
                )}
              >
                {status.text}
              </div>
            )}

          {tab === 'dashboard' && (() => {
            type QuickAction = {
              description: string
              href?: string
              icon: ReactNode
              key: string
              onClick?: () => void
              title: string
            }

            const quickActions: QuickAction[] = [
              {
                description: 'Update existing page copy with the WYSIWYG editor.',
                icon: <IconPages />,
                key: 'pages',
                onClick: () => { void handleTabChange('pages') },
                title: 'Edit Pages',
              },
              {
                description: 'Open the visual page editor with live preview.',
                href: '/admin/edit',
                icon: <IconPosts />,
                key: 'live-editor',
                title: 'Launch Live Editor',
              },
              ...(canViewBlog
                ? [{
                    description: 'Create or revise blog posts and metadata.',
                    icon: <IconPosts />,
                    key: 'posts',
                    onClick: () => { void handleTabChange('posts') },
                    title: 'Manage Blog',
                  }]
                : []),
              {
                description: 'Edit demo products, specs, pricing, and long-form copy.',
                icon: <IconProducts />,
                key: 'products',
                onClick: () => { void handleTabChange('products') },
                title: 'Manage Products',
              },
              {
                description: 'Upload assets and manage image URLs.',
                icon: <IconMedia />,
                key: 'media',
                onClick: () => { void handleTabChange('media') },
                title: 'Media Library',
              },
              {
                description: 'Site identity, contact details, and social preview defaults.',
                icon: <IconSettings />,
                key: 'settings',
                onClick: () => { void handleTabChange('settings') },
                title: 'Site Settings',
              },
              ...(canViewAi
                ? [{
                    description: 'API keys, prompts, and automation defaults.',
                    icon: <IconAi />,
                    key: 'ai',
                    onClick: () => { void handleTabChange('ai') },
                    title: 'AI Settings',
                  }]
                : []),
              ...(canManageUsers
                ? [{
                    description: 'Create invite links and control who can edit this site.',
                    icon: <IconUsers />,
                    key: 'users',
                    onClick: () => { void handleTabChange('users') },
                    title: 'Manage Users',
                  }]
                : []),
              ...(canViewLinkedIn
                ? [{
                    description: 'Store app credentials and publishing defaults.',
                    icon: <IconLinkedIn />,
                    key: 'linkedin',
                    onClick: () => { void handleTabChange('linkedin') },
                    title: 'LinkedIn',
                  }]
                : []),
            ]

            const [latestRelease, ...priorReleases] = CLASTRO_CHANGELOG

            const ga4Configured = (analyticsSettings.hasGoogleOauthConnection || analyticsSettings.hasGa4ServiceAccount)
              && Boolean(analyticsSettings.ga4PropertyId)
            const gscConfigured = (analyticsSettings.hasGoogleOauthConnection || analyticsSettings.hasGa4ServiceAccount)
              && Boolean(analyticsSettings.gscSiteUrl)
            const analyticsConfigured = ga4Configured || gscConfigured

            // Number formatting helpers
            const formatNumber = (n: number) => new Intl.NumberFormat().format(Math.round(n))
            const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`
            const formatPosition = (n: number) => n > 0 ? n.toFixed(1) : '—'
            const formatDuration = (sec: number) => {
              if (!sec || !Number.isFinite(sec)) return '0s'
              if (sec < 60) return `${Math.round(sec)}s`
              const m = Math.floor(sec / 60)
              const s = Math.round(sec - m * 60)
              return `${m}m ${s}s`
            }

            // Period-over-period % change with sensible "is higher better?"
            // semantics. averagePosition is the only inverted metric (lower
            // position = better rank), so it flips the up/down colour.
            type ChangeBadge = { pct: number; direction: 'up' | 'down' | 'flat'; isGood: boolean } | null
            function computeChange(current: number | undefined, previous: number | undefined, lowerIsBetter = false): ChangeBadge {
              if (current === undefined || previous === undefined) return null
              if (previous === 0 && current === 0) return { pct: 0, direction: 'flat', isGood: true }
              if (previous === 0) return { pct: 100, direction: 'up', isGood: !lowerIsBetter }
              const pct = ((current - previous) / previous) * 100
              const direction: 'up' | 'down' | 'flat' = Math.abs(pct) < 0.5 ? 'flat' : pct > 0 ? 'up' : 'down'
              const isGood = lowerIsBetter ? direction !== 'up' : direction !== 'down'
              return { pct: Math.abs(pct), direction, isGood }
            }

            const ga4Ts = ga4Analytics.timeseries
            const chartWidth = 600
            const chartHeight = 120
            const sparklineMax = Math.max(1, ...ga4Ts.map((d) => d.sessions))
            const sparklinePoints = ga4Ts.length > 1
              ? ga4Ts.map((d, i) => {
                  const x = (i / (ga4Ts.length - 1)) * chartWidth
                  const y = chartHeight - (d.sessions / sparklineMax) * (chartHeight - 8) - 4
                  return `${x.toFixed(2)},${y.toFixed(2)}`
                }).join(' ')
              : ''

            const periodLabel = ga4Analytics.period
              ? `${ga4Analytics.period.since} → ${ga4Analytics.period.until}`
              : gscAnalytics.period
              ? `${gscAnalytics.period.since} → ${gscAnalytics.period.until}`
              : `Past ${analyticsPeriod}`

            const ga4Totals = ga4Analytics.totals
            const ga4Previous = ga4Analytics.previousTotals
            const gscTotals = gscAnalytics.totals
            const gscPrevious = gscAnalytics.previousTotals
            type KpiTile = { detail: string; label: string; value: string; change: ChangeBadge }
            const kpiTiles: KpiTile[] = []
            if (ga4Totals) {
              kpiTiles.push(
                {
                  label: 'Sessions',
                  value: formatNumber(ga4Totals.sessions),
                  detail: `Avg duration ${formatDuration(ga4Totals.averageSessionDurationSec)}`,
                  change: computeChange(ga4Totals.sessions, ga4Previous?.sessions),
                },
                {
                  label: 'Active users',
                  value: formatNumber(ga4Totals.activeUsers),
                  detail: `Engagement ${formatPercent(ga4Totals.engagementRate)}`,
                  change: computeChange(ga4Totals.activeUsers, ga4Previous?.activeUsers),
                },
              )
            }
            if (gscTotals) {
              kpiTiles.push(
                {
                  label: 'Clicks (search)',
                  value: formatNumber(gscTotals.clicks),
                  detail: `${formatNumber(gscTotals.impressions)} impressions, CTR ${formatPercent(gscTotals.ctr)}`,
                  change: computeChange(gscTotals.clicks, gscPrevious?.clicks),
                },
                {
                  label: 'Avg position',
                  value: formatPosition(gscTotals.averagePosition),
                  detail: 'Lower is better — top results = 1',
                  // Position: lower is better, so flip the good/bad colour mapping.
                  change: computeChange(gscTotals.averagePosition, gscPrevious?.averagePosition, true),
                },
              )
            }
            // 5th tile: Form submissions for the same period — the actual
            // business outcome for a service-driven site.
            kpiTiles.push({
              label: 'Form submissions',
              value: formatNumber(formSubmissionsSummary.count),
              detail: formSubmissionsSummary.unread > 0
                ? `${formSubmissionsSummary.unread} unread in inbox`
                : 'All caught up',
              change: computeChange(formSubmissionsSummary.count, formSubmissionsSummary.previousCount),
            })

            // AI search referrals: derive from existing topSources by host match.
            const AI_REFERRAL_HOSTS = new Set([
              'chatgpt.com', 'chat.openai.com',
              'claude.ai',
              'gemini.google.com', 'bard.google.com',
              'perplexity.ai', 'www.perplexity.ai',
              'copilot.microsoft.com',
              'phind.com',
              'you.com',
            ])
            const aiReferrals = ga4Analytics.topSources.filter((s) => AI_REFERRAL_HOSTS.has(s.source.toLowerCase()))
            const aiReferralTotal = aiReferrals.reduce((acc, s) => acc + s.sessions, 0)

            return (
              <div className="space-y-6">
                {/* ── Analytics block ─────────────────────────────────── */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-foreground">Site Analytics</h2>
                      <p className="text-sm text-muted-foreground">
                        {analyticsConfigured
                          ? `${ga4Configured ? 'Google Analytics 4' : ''}${ga4Configured && gscConfigured ? ' + ' : ''}${gscConfigured ? 'Search Console' : ''}, ${periodLabel}.`
                          : 'Connect Google Analytics 4 and Search Console to surface live traffic data here.'}
                      </p>
                    </div>
                    <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5 text-xs">
                      {(['7d', '30d', '90d'] as const).map((option) => (
                        <button
                          className={cn(
                            'rounded px-3 py-1 font-medium transition',
                            analyticsPeriod === option
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                          key={option}
                          onClick={() => setAnalyticsPeriod(option)}
                          type="button"
                        >
                          {option === '7d' ? '7 days' : option === '30d' ? '30 days' : '90 days'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!analyticsConfigured ? (
                    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <IconChart />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-foreground">No analytics connected yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add a GA4 property and Search Console site under <strong>Integrations</strong> to start showing traffic.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => { void handleTabChange('integrations') }}
                        size="sm"
                        type="button"
                      >
                        Open Integrations
                      </Button>
                    </div>
                  ) : (
                    <>
                      {(ga4Analytics.error || gscAnalytics.error) && (
                        <div className="space-y-2">
                          {ga4Analytics.error && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                              <strong>Couldn&apos;t reach Google Analytics 4:</strong> {ga4Analytics.error}
                            </div>
                          )}
                          {gscAnalytics.error && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                              <strong>Couldn&apos;t reach Search Console:</strong> {gscAnalytics.error}
                            </div>
                          )}
                        </div>
                      )}

                      {(ga4Analytics.loading || gscAnalytics.loading) && !ga4Totals && !gscTotals ? (
                        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                          Loading analytics…
                        </div>
                      ) : kpiTiles.length === 0 && !ga4Analytics.error && !gscAnalytics.error ? (
                        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                          Connected, but no data has been collected yet. Make sure the GA4 tag is firing on the public site and that Search Console has been verified for at least 48 hours.
                        </div>
                      ) : (
                        <>
                          {kpiTiles.length > 0 && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                              {kpiTiles.map((tile) => (
                                <Card className="transition-colors hover:border-cyan-400/30" key={tile.label}>
                                  <CardHeader className="space-y-1 pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                                        {tile.label}
                                      </CardDescription>
                                      {tile.change && tile.change.direction !== 'flat' && (
                                        <span className={cn(
                                          'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                                          tile.change.isGood
                                            ? 'bg-emerald-400/15 text-emerald-300'
                                            : 'bg-rose-400/15 text-rose-300',
                                        )}>
                                          <span aria-hidden="true">{tile.change.direction === 'up' ? '↑' : '↓'}</span>
                                          {tile.change.pct.toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-3xl font-bold leading-none tracking-tight text-foreground">
                                      {tile.value}
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-xs text-muted-foreground">{tile.detail}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}

                          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle>Sessions over time</CardTitle>
                                <CardDescription>Daily GA4 sessions across the period.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {ga4Ts.length > 1 ? (
                                  <svg className="w-full" viewBox={`0 0 ${chartWidth} ${chartHeight + 24}`} preserveAspectRatio="none">
                                    <polyline
                                      fill="none"
                                      points={sparklinePoints}
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      className="text-primary"
                                    />
                                    {ga4Ts.map((d, i) => {
                                      if (i % Math.max(1, Math.floor(ga4Ts.length / 6)) !== 0 && i !== ga4Ts.length - 1) return null
                                      const x = (i / (ga4Ts.length - 1)) * chartWidth
                                      return (
                                        <text
                                          key={d.date}
                                          x={x}
                                          y={chartHeight + 18}
                                          textAnchor={i === 0 ? 'start' : i === ga4Ts.length - 1 ? 'end' : 'middle'}
                                          fontSize="10"
                                          className="fill-muted-foreground"
                                        >
                                          {d.date.slice(5)}
                                        </text>
                                      )
                                    })}
                                  </svg>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle>Top sources</CardTitle>
                                <CardDescription>By sessions (GA4).</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {ga4Analytics.topSources.length > 0 ? (
                                  <ul className="space-y-2 text-sm">
                                    {ga4Analytics.topSources.slice(0, 8).map((entry) => {
                                      const maxSessions = ga4Analytics.topSources[0]?.sessions || 1
                                      const pct = (entry.sessions / maxSessions) * 100
                                      return (
                                        <li className="space-y-1" key={`${entry.source}-${entry.medium}`}>
                                          <div className="flex justify-between text-xs">
                                            <span className="font-medium text-foreground">{entry.source} / {entry.medium}</span>
                                            <span className="text-muted-foreground">{formatNumber(entry.sessions)}</span>
                                          </div>
                                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                          </div>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No source data yet.</p>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle>Top pages</CardTitle>
                                <CardDescription>By sessions (GA4).</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {ga4Analytics.topPages.length > 0 ? (
                                  <ul className="space-y-2 text-sm">
                                    {ga4Analytics.topPages.slice(0, 8).map((entry) => (
                                      <li className="flex items-start justify-between gap-3" key={entry.path}>
                                        <div className="min-w-0 flex-1">
                                          <div className="truncate font-medium text-foreground" title={entry.title || entry.path}>
                                            {entry.title || entry.path}
                                          </div>
                                          <div className="truncate text-xs text-muted-foreground" title={entry.path}>
                                            {entry.path}
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right text-xs">
                                          <div className="font-medium text-foreground">{formatNumber(entry.sessions)}</div>
                                          <div className="text-muted-foreground">{formatNumber(entry.activeUsers)} users</div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No page data yet.</p>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle>Top search queries</CardTitle>
                                <CardDescription>By clicks (Search Console).</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {gscAnalytics.topQueries.length > 0 ? (
                                  <ul className="space-y-2 text-sm">
                                    {gscAnalytics.topQueries.slice(0, 8).map((entry) => (
                                      <li className="flex items-start justify-between gap-3" key={entry.query}>
                                        <div className="min-w-0 flex-1">
                                          <div className="truncate font-medium text-foreground" title={entry.query}>
                                            {entry.query || '(no query)'}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            pos {formatPosition(entry.position)} · CTR {formatPercent(entry.ctr)}
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right text-xs">
                                          <div className="font-medium text-foreground">{formatNumber(entry.clicks)}</div>
                                          <div className="text-muted-foreground">{formatNumber(entry.impressions)} imp.</div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No query data yet.</p>
                                )}
                              </CardContent>
                            </Card>
                          </div>

                          {/* ── SEO striking-distance opportunities ───── */}
                          {gscAnalytics.strikingDistance.length > 0 && (
                            <Card className="border-cyan-400/20">
                              <CardHeader className="pb-2">
                                <CardTitle>SEO opportunities (striking distance)</CardTitle>
                                <CardDescription>
                                  Queries ranking position 4–20 with 50+ impressions — small content/optimisation pushes move these to page 1.
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                                        <th className="pb-2">Query</th>
                                        <th className="pb-2 text-right">Position</th>
                                        <th className="pb-2 text-right">Impressions</th>
                                        <th className="pb-2 text-right">Clicks</th>
                                        <th className="pb-2 text-right">CTR</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {gscAnalytics.strikingDistance.map((entry) => (
                                        <tr className="border-b border-border/40 last:border-0" key={entry.query}>
                                          <td className="py-2 pr-3 font-medium text-foreground">{entry.query}</td>
                                          <td className="py-2 text-right text-foreground">{formatPosition(entry.position)}</td>
                                          <td className="py-2 text-right text-muted-foreground">{formatNumber(entry.impressions)}</td>
                                          <td className="py-2 text-right text-muted-foreground">{formatNumber(entry.clicks)}</td>
                                          <td className="py-2 text-right text-muted-foreground">{formatPercent(entry.ctr)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* ── Device + Country + AI referrals ───────── */}
                          <div className="grid gap-6 lg:grid-cols-3">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle>Devices</CardTitle>
                                <CardDescription>By sessions (GA4).</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {ga4Analytics.deviceBreakdown.length > 0 ? (
                                  (() => {
                                    const total = ga4Analytics.deviceBreakdown.reduce((acc, d) => acc + d.sessions, 0) || 1
                                    return (
                                      <ul className="space-y-2 text-sm">
                                        {ga4Analytics.deviceBreakdown.map((entry) => {
                                          const pct = (entry.sessions / total) * 100
                                          return (
                                            <li className="space-y-1" key={entry.device}>
                                              <div className="flex justify-between text-xs">
                                                <span className="font-medium text-foreground capitalize">{entry.device}</span>
                                                <span className="text-muted-foreground">{formatNumber(entry.sessions)} · {pct.toFixed(0)}%</span>
                                              </div>
                                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                              </div>
                                            </li>
                                          )
                                        })}
                                      </ul>
                                    )
                                  })()
                                ) : (
                                  <p className="text-sm text-muted-foreground">No device data yet.</p>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle>Countries</CardTitle>
                                <CardDescription>Top 6 by sessions (GA4).</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {ga4Analytics.countryBreakdown.length > 0 ? (
                                  <ul className="space-y-2 text-sm">
                                    {ga4Analytics.countryBreakdown.slice(0, 6).map((entry) => {
                                      const maxSessions = ga4Analytics.countryBreakdown[0]?.sessions || 1
                                      const pct = (entry.sessions / maxSessions) * 100
                                      return (
                                        <li className="space-y-1" key={entry.country}>
                                          <div className="flex justify-between text-xs">
                                            <span className="font-medium text-foreground">{entry.country}</span>
                                            <span className="text-muted-foreground">{formatNumber(entry.sessions)}</span>
                                          </div>
                                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                          </div>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No country data yet.</p>
                                )}
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle>AI search referrals</CardTitle>
                                <CardDescription>Sessions sent by ChatGPT, Claude, Gemini, Perplexity, Copilot, etc.</CardDescription>
                              </CardHeader>
                              <CardContent>
                                {aiReferralTotal > 0 ? (
                                  <div className="space-y-3">
                                    <div className="text-3xl font-bold leading-none tracking-tight text-foreground">{formatNumber(aiReferralTotal)}</div>
                                    <ul className="space-y-1 text-xs text-muted-foreground">
                                      {aiReferrals.map((entry) => (
                                        <li className="flex justify-between" key={`${entry.source}-${entry.medium}`}>
                                          <span>{entry.source}</span>
                                          <span>{formatNumber(entry.sessions)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No AI referrals yet — Clastro will surface them automatically when ChatGPT, Claude, or other assistants link to your site.
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* ── CMS state strip ─────────────────────────────────── */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>CMS state</CardTitle>
                    <CardDescription>What&apos;s in the database right now.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                      {stats.map((item) => (
                        <div className="flex items-center gap-3 rounded-md border border-border bg-background/40 p-3" key={item.label}>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                            {item.icon}
                          </span>
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="text-lg font-semibold leading-none text-foreground">{item.value}</p>
                            <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-8 lg:grid-cols-3">
                  <section className="space-y-4 lg:col-span-2">
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold tracking-tight text-foreground">Quick Actions</h2>
                      <p className="text-sm text-muted-foreground">Jump straight into the most common admin flows.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {quickActions.map((action) => {
                        const inner = (
                          <>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:text-primary">
                              {action.icon}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                              <span className="text-sm font-semibold text-foreground">{action.title}</span>
                              <span className="text-xs text-muted-foreground">{action.description}</span>
                            </span>
                            <span className="text-muted-foreground transition-colors group-hover:text-primary">
                              <IconArrowRight />
                            </span>
                          </>
                        )
                        const className = 'group flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-cyan-400/30 hover:bg-accent/60'
                        return action.href
                          ? (
                              <a className={className} href={action.href} key={action.key}>
                                {inner}
                              </a>
                            )
                          : (
                              <button className={className} key={action.key} onClick={action.onClick} type="button">
                                {inner}
                              </button>
                            )
                      })}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h2 className="text-base font-semibold tracking-tight text-foreground">What&apos;s New</h2>
                        <p className="text-sm text-muted-foreground">Latest Clastro release notes.</p>
                      </div>
                      <a
                        className="text-xs font-medium text-primary hover:underline"
                        href="/changelog"
                        rel="noreferrer"
                        target="_blank"
                      >
                        View all →
                      </a>
                    </div>

                    <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
                      <article className="rounded-lg border border-cyan-400/25 bg-accent/40 p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-sm font-semibold text-foreground">v{latestRelease.version}</h3>
                          <span className="inline-flex items-center rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-cyan-200">
                            Latest
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{latestRelease.date}</p>
                        <p className="mt-2 text-sm text-foreground">{latestRelease.summary}</p>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {latestRelease.changes.map((change) => (
                            <li className="flex gap-2.5" key={change}>
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </article>

                      {priorReleases.map((entry) => (
                        <article className="rounded-lg border border-border p-4" key={entry.version}>
                          <div className="flex items-baseline justify-between gap-3">
                            <h3 className="text-sm font-semibold text-foreground">v{entry.version}</h3>
                            <span className="text-xs text-muted-foreground">{entry.date}</span>
                          </div>
                          <p className="mt-2 text-sm text-foreground">{entry.summary}</p>
                          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {entry.changes.map((change) => (
                              <li className="flex gap-2.5" key={change}>
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            )
          })()}

          {tab === 'ai' && canViewAi && (
            <section className={styles.formStack}>
              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Provider Access</h2>
                </div>
                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span>Provider</span>
                    <input
                      value={aiSettingsDraft.provider}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, provider: event.target.value }))}
                      placeholder="openai"
                    />
                  </label>
                  <div className={styles.field}>
                    <span id="ai-api-key-label">API Key</span>
                    <div className={styles.apiKeyControl}>
                      <div className={styles.apiKeyInputRow}>
                        <input
                          aria-labelledby="ai-api-key-label"
                          type="password"
                          autoComplete="off"
                          value={aiSettingsDraft.apiKey}
                          onChange={(event) =>
                            setAiSettingsDraft((current) => ({
                              ...current,
                              apiKey: event.target.value,
                              clearApiKey: false,
                            }))}
                          placeholder={aiSettingsDraft.hasApiKey ? "Enter a new key to replace the stored key" : "sk-..."}
                        />
                        <button
                          className={[styles.secondaryButton, styles.apiKeyClearButton].join(' ')}
                          disabled={!aiSettingsDraft.hasApiKey || aiSettingsDraft.clearApiKey}
                          onClick={() =>
                            setAiSettingsDraft((current) => ({
                              ...current,
                              apiKey: '',
                              clearApiKey: true,
                            }))}
                          type="button"
                        >
                          Clear key
                        </button>
                      </div>
                    </div>
                    <small className={styles.fieldHint}>
                      {aiSettingsDraft.clearApiKey
                        ? 'The stored key will be cleared when you save AI settings.'
                        : aiSettingsDraft.hasApiKey
                          ? 'A key is already stored and is never shown again. If you wish to update your key, paste a new key here and save AI settings. Leave this blank to keep the stored key.'
                          : 'Stored server-side only. If you wish to update your key later, paste a new key here and save AI settings.'}
                    </small>
                  </div>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Shared Brand Prompt</span>
                    <textarea
                      value={aiSettingsDraft.defaultBrandPrompt}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, defaultBrandPrompt: event.target.value }))}
                      placeholder="Reusable brand and tone guidance applied across AI features."
                    />
                    <small className={styles.fieldHint}>Use this for site-wide tone, brand voice, constraints, and style guidance.</small>
                  </label>
                </div>
              </section>

              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Image Generation</h2>
                </div>
                <div className={styles.grid}>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span className={styles.toggleLabel}>
                      <input
                        checked={aiSettingsDraft.imageEnabled}
                        className={styles.toggleInput}
                        onChange={(event) => setAiSettingsDraft((current) => ({ ...current, imageEnabled: event.target.checked }))}
                        type="checkbox"
                      />
                      Enable image generation
                    </span>
                  </label>
                  <label className={styles.field}>
                    <span>Model</span>
                    <input
                      value={aiSettingsDraft.imageModel}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, imageModel: event.target.value }))}
                      placeholder="gpt-image-1.5"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Size</span>
                    <input
                      value={aiSettingsDraft.imageSize}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, imageSize: event.target.value }))}
                      placeholder="1536x1024"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Quality</span>
                    <input
                      value={aiSettingsDraft.imageQuality}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, imageQuality: event.target.value }))}
                      placeholder="high"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Background</span>
                    <input
                      value={aiSettingsDraft.imageBackground}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, imageBackground: event.target.value }))}
                      placeholder="auto"
                    />
                  </label>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Prompt Template</span>
                    <textarea
                      value={aiSettingsDraft.imagePromptTemplate}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, imagePromptTemplate: event.target.value }))}
                      placeholder='Use placeholders like {{title}} and {{excerpt}}.'
                    />
                  </label>
                </div>
              </section>

              {canViewBlog && (
                <section className={styles.sectionCard}>
                  <div className={styles.sectionCardHeader}>
                    <h2>Blog Generation</h2>
                  </div>
                  <div className={styles.grid}>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span className={styles.toggleLabel}>
                        <input
                          checked={aiSettingsDraft.blogEnabled}
                          className={styles.toggleInput}
                          onChange={(event) => setAiSettingsDraft((current) => ({ ...current, blogEnabled: event.target.checked }))}
                          type="checkbox"
                        />
                        Enable blog generation
                      </span>
                    </label>
                    <label className={styles.field}>
                      <span>Model</span>
                      <input
                        value={aiSettingsDraft.blogModel}
                        onChange={(event) => setAiSettingsDraft((current) => ({ ...current, blogModel: event.target.value }))}
                        placeholder="gpt-4.1"
                      />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Title Ideas Prompt Template</span>
                      <textarea
                        value={aiSettingsDraft.blogTitleIdeasPromptTemplate}
                        onChange={(event) => setAiSettingsDraft((current) => ({ ...current, blogTitleIdeasPromptTemplate: event.target.value }))}
                        placeholder='Use placeholders like {{topic}}, {{audience}}, {{goal}}, and {{count}}.'
                      />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Post Prompt Template</span>
                      <textarea
                        value={aiSettingsDraft.blogPromptTemplate}
                        onChange={(event) => setAiSettingsDraft((current) => ({ ...current, blogPromptTemplate: event.target.value }))}
                        placeholder='Use placeholders like {{topic}}, {{audience}}, {{goal}}, and {{siteName}}.'
                      />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>SEO Prompt Template</span>
                      <textarea
                        value={aiSettingsDraft.blogSeoPromptTemplate}
                        onChange={(event) => setAiSettingsDraft((current) => ({ ...current, blogSeoPromptTemplate: event.target.value }))}
                        placeholder="Prompt used to generate SEO title and meta description."
                      />
                    </label>
                  </div>
                </section>
              )}

              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Alt Text Generation</h2>
                </div>
                <div className={styles.grid}>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span className={styles.toggleLabel}>
                      <input
                        checked={aiSettingsDraft.altTextEnabled}
                        className={styles.toggleInput}
                        onChange={(event) => setAiSettingsDraft((current) => ({ ...current, altTextEnabled: event.target.checked }))}
                        type="checkbox"
                      />
                      Enable automatic alt text generation
                    </span>
                  </label>
                  <label className={styles.field}>
                    <span>Model</span>
                    <input
                      value={aiSettingsDraft.altTextModel}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, altTextModel: event.target.value }))}
                      placeholder="gpt-4.1-mini"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Max Length</span>
                    <input
                      value={aiSettingsDraft.altTextMaxLength}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, altTextMaxLength: event.target.value }))}
                      placeholder="160"
                    />
                  </label>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Prompt Template</span>
                    <textarea
                      value={aiSettingsDraft.altTextPromptTemplate}
                      onChange={(event) => setAiSettingsDraft((current) => ({ ...current, altTextPromptTemplate: event.target.value }))}
                      placeholder="Prompt used to generate alt text from the uploaded image context."
                    />
                  </label>
                </div>
              </section>
            </section>
          )}

          {tab === 'settings' && (
            <section className={styles.formStack}>
              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>General</h2>
                </div>
                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span>Site name</span>
                    <input value={settingsDraft.siteName} onChange={(event) => setSettingsDraft((current) => ({ ...current, siteName: event.target.value }))} />
                  </label>
                  <label className={styles.field}>
                    <span>Site URL</span>
                    <input value={settingsDraft.siteUrl} onChange={(event) => setSettingsDraft((current) => ({ ...current, siteUrl: event.target.value }))} />
                  </label>
                  <label className={styles.field}>
                    <span>Contact email</span>
                    <input value={settingsDraft.contactEmail} onChange={(event) => setSettingsDraft((current) => ({ ...current, contactEmail: event.target.value }))} />
                  </label>
                  <label className={styles.field}>
                    <span>Contact phone</span>
                    <input value={settingsDraft.contactPhone} onChange={(event) => setSettingsDraft((current) => ({ ...current, contactPhone: event.target.value }))} />
                  </label>
                </div>
              </section>

              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Brand & Sharing</h2>
                </div>
                <div className={styles.grid}>
                  <div className={styles.brandAssetGrid}>
                    <BrandAssetField
                      accept=".svg,.png,.ico,image/svg+xml,image/png,image/x-icon,image/vnd.microsoft.icon"
                      description="Small browser tab icon. Upload once and Clastro stores it in the media library."
                      id="settings-favicon-upload"
                      label="Favicon"
                      onUpload={(file) => { void uploadSettingsAsset('faviconUrl', file, 'Favicon') }}
                      recommendation="Recommended: SVG, PNG, or ICO; 32 x 32 px minimum; keep it simple and square."
                      uploading={uploadingSettingsAsset === 'faviconUrl'}
                      value={settingsDraft.faviconUrl}
                    />
                    <BrandAssetField
                      accept="image/*"
                      description="Used when someone saves the site to a phone or tablet home screen."
                      id="settings-apple-touch-icon-upload"
                      label="Apple touch icon"
                      onUpload={(file) => { void uploadSettingsAsset('appleTouchIconUrl', file, 'Apple touch icon') }}
                      recommendation="Recommended: 180 x 180 px PNG; square with clear padding for mobile home screens."
                      uploading={uploadingSettingsAsset === 'appleTouchIconUrl'}
                      value={settingsDraft.appleTouchIconUrl}
                    />
                    <BrandAssetField
                      accept="image/*"
                      description="Default image for social previews when a page does not set its own image."
                      id="settings-social-share-image-upload"
                      label="Social share image"
                      onUpload={(file) => { void uploadSettingsAsset('defaultOgImage', file, 'Social share image') }}
                      previewShape="wide"
                      recommendation="Recommended: 1200 x 630 px JPG or PNG; keep key text and logos centred."
                      uploading={uploadingSettingsAsset === 'defaultOgImage'}
                      value={settingsDraft.defaultOgImage}
                    />
                  </div>
                  <label className={styles.field}>
                    <span>Browser theme colour</span>
                    <input value={settingsDraft.themeColor} onChange={(event) => setSettingsDraft((current) => ({ ...current, themeColor: event.target.value }))} placeholder="#020024" />
                    <small className={styles.fieldHint}>Used by supporting mobile browsers for the top browser bar.</small>
                  </label>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Default social share title</span>
                    <input value={settingsDraft.socialShareTitle} onChange={(event) => setSettingsDraft((current) => ({ ...current, socialShareTitle: event.target.value }))} />
                    <small className={styles.fieldHint}>Fallback title for social previews when a page does not provide a specific one.</small>
                  </label>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Default social share description</span>
                    <textarea value={settingsDraft.socialShareDescription} onChange={(event) => setSettingsDraft((current) => ({ ...current, socialShareDescription: event.target.value }))} />
                    <small className={styles.fieldHint}>Fallback description for Open Graph and social cards.</small>
                  </label>
                </div>
              </section>

              {/* ── Navigation ───────────────────────────────────────── */}
              <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">Navigation</h2>
                  <p className="text-sm text-muted-foreground">Top-of-site header menu, CTA button, and phone link.</p>
                </div>

                <div className="space-y-3">
                  <span className="block text-xs font-medium text-muted-foreground">Menu links</span>
                  {settingsDraft.navigation.navLinks.map((link, index) => (
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]" key={index}>
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onChange={(event) => setSettingsDraft((current) => ({
                          ...current,
                          navigation: {
                            ...current.navigation,
                            navLinks: current.navigation.navLinks.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry),
                          },
                        }))}
                        placeholder="Label (e.g. About)"
                        value={link.label}
                      />
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onChange={(event) => setSettingsDraft((current) => ({
                          ...current,
                          navigation: {
                            ...current.navigation,
                            navLinks: current.navigation.navLinks.map((entry, i) => i === index ? { ...entry, link: event.target.value } : entry),
                          },
                        }))}
                        placeholder="/about"
                        value={link.link}
                      />
                      <Button
                        onClick={() => setSettingsDraft((current) => ({
                          ...current,
                          navigation: {
                            ...current.navigation,
                            navLinks: current.navigation.navLinks.filter((_, i) => i !== index),
                          },
                        }))}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => setSettingsDraft((current) => ({
                      ...current,
                      navigation: {
                        ...current.navigation,
                        navLinks: [...current.navigation.navLinks, { ...BLANK_NAV_LINK }],
                      },
                    }))}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    + Add menu link
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">CTA button label</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, navigation: { ...current.navigation, ctaButtonText: event.target.value } }))}
                      placeholder="Book a call"
                      value={settingsDraft.navigation.ctaButtonText}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">CTA button link</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, navigation: { ...current.navigation, ctaButtonLink: event.target.value } }))}
                      placeholder="/contact"
                      value={settingsDraft.navigation.ctaButtonLink}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Phone display text</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, navigation: { ...current.navigation, phoneText: event.target.value } }))}
                      placeholder="+64 21 000 0000"
                      value={settingsDraft.navigation.phoneText}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Phone link (tel:)</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, navigation: { ...current.navigation, phoneLink: event.target.value } }))}
                      placeholder="tel:+64210000000"
                      value={settingsDraft.navigation.phoneLink}
                    />
                  </label>
                </div>
              </section>

              {/* ── Footer ───────────────────────────────────────────── */}
              <section className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">Footer</h2>
                  <p className="text-sm text-muted-foreground">Tagline, CTA, contact lines, and the column-of-links groups along the bottom of every page.</p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Tagline</span>
                  <textarea
                    className="flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, footer: { ...current.footer, tagline: event.target.value } }))}
                    placeholder="A short sentence about the site."
                    value={settingsDraft.footer.tagline}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">CTA text</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, footer: { ...current.footer, ctaText: event.target.value } }))}
                      placeholder="Get in touch"
                      value={settingsDraft.footer.ctaText}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">CTA link</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, footer: { ...current.footer, ctaLink: event.target.value } }))}
                      placeholder="/contact"
                      value={settingsDraft.footer.ctaLink}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Email line</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, footer: { ...current.footer, emailText: event.target.value } }))}
                      placeholder="hello@example.com"
                      value={settingsDraft.footer.emailText}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Phone line</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setSettingsDraft((current) => ({ ...current, footer: { ...current.footer, phoneText: event.target.value } }))}
                      placeholder="+64 21 000 0000"
                      value={settingsDraft.footer.phoneText}
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <span className="block text-xs font-medium text-muted-foreground">Link columns</span>
                  {settingsDraft.footer.columns.map((column, colIndex) => (
                    <div className="space-y-3 rounded-md border border-border bg-background/40 p-3" key={colIndex}>
                      <div className="flex gap-2">
                        <input
                          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setSettingsDraft((current) => ({
                            ...current,
                            footer: {
                              ...current.footer,
                              columns: current.footer.columns.map((c, i) => i === colIndex ? { ...c, heading: event.target.value } : c),
                            },
                          }))}
                          placeholder="Column heading"
                          value={column.heading}
                        />
                        <Button
                          onClick={() => setSettingsDraft((current) => ({
                            ...current,
                            footer: {
                              ...current.footer,
                              columns: current.footer.columns.filter((_, i) => i !== colIndex),
                            },
                          }))}
                          size="sm"
                          type="button"
                          variant="destructive"
                        >
                          Remove column
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {column.links.map((link, linkIndex) => (
                          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]" key={linkIndex}>
                            <input
                              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onChange={(event) => setSettingsDraft((current) => ({
                                ...current,
                                footer: {
                                  ...current.footer,
                                  columns: current.footer.columns.map((c, i) => i === colIndex
                                    ? { ...c, links: c.links.map((l, j) => j === linkIndex ? { ...l, label: event.target.value } : l) }
                                    : c),
                                },
                              }))}
                              placeholder="Label"
                              value={link.label}
                            />
                            <input
                              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onChange={(event) => setSettingsDraft((current) => ({
                                ...current,
                                footer: {
                                  ...current.footer,
                                  columns: current.footer.columns.map((c, i) => i === colIndex
                                    ? { ...c, links: c.links.map((l, j) => j === linkIndex ? { ...l, link: event.target.value } : l) }
                                    : c),
                                },
                              }))}
                              placeholder="/about"
                              value={link.link}
                            />
                            <Button
                              onClick={() => setSettingsDraft((current) => ({
                                ...current,
                                footer: {
                                  ...current.footer,
                                  columns: current.footer.columns.map((c, i) => i === colIndex
                                    ? { ...c, links: c.links.filter((_, j) => j !== linkIndex) }
                                    : c),
                                },
                              }))}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => setSettingsDraft((current) => ({
                            ...current,
                            footer: {
                              ...current.footer,
                              columns: current.footer.columns.map((c, i) => i === colIndex
                                ? { ...c, links: [...c.links, { ...BLANK_NAV_LINK }] }
                                : c),
                            },
                          }))}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          + Add link
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={() => setSettingsDraft((current) => ({
                      ...current,
                      footer: {
                        ...current.footer,
                        columns: [...current.footer.columns, { ...BLANK_FOOTER_COLUMN, links: [] }],
                      },
                    }))}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    + Add column
                  </Button>
                </div>
              </section>

              {/* ── Booking modal ────────────────────────────────────── */}
              <section className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">Booking modal</h2>
                  <p className="text-sm text-muted-foreground">The two cards shown in the booking modal, plus the footer note.</p>
                </div>

                {(['consultation', 'session'] as const).map((cardKey) => (
                  <div className="space-y-3 rounded-md border border-border bg-background/40 p-3" key={cardKey}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {cardKey === 'consultation' ? 'First card' : 'Second card'}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1.5 sm:col-span-2">
                        <span className="text-xs font-medium text-muted-foreground">Title</span>
                        <input
                          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setSettingsDraft((current) => ({
                            ...current,
                            booking: { ...current.booking, [cardKey]: { ...current.booking[cardKey], title: event.target.value } },
                          }))}
                          placeholder="Discovery call"
                          value={settingsDraft.booking[cardKey].title}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Duration</span>
                        <input
                          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setSettingsDraft((current) => ({
                            ...current,
                            booking: { ...current.booking, [cardKey]: { ...current.booking[cardKey], duration: event.target.value } },
                          }))}
                          placeholder="15 minutes"
                          value={settingsDraft.booking[cardKey].duration}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Price / label</span>
                        <input
                          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setSettingsDraft((current) => ({
                            ...current,
                            booking: { ...current.booking, [cardKey]: { ...current.booking[cardKey], price: event.target.value } },
                          }))}
                          placeholder="Free"
                          value={settingsDraft.booking[cardKey].price}
                        />
                      </label>
                      <label className="block space-y-1.5 sm:col-span-2">
                        <span className="text-xs font-medium text-muted-foreground">Description</span>
                        <textarea
                          className="flex min-h-16 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setSettingsDraft((current) => ({
                            ...current,
                            booking: { ...current.booking, [cardKey]: { ...current.booking[cardKey], description: event.target.value } },
                          }))}
                          placeholder="Short description"
                          value={settingsDraft.booking[cardKey].description}
                        />
                      </label>
                      <label className="block space-y-1.5 sm:col-span-2">
                        <span className="text-xs font-medium text-muted-foreground">Link (where the card sends people)</span>
                        <input
                          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setSettingsDraft((current) => ({
                            ...current,
                            booking: { ...current.booking, [cardKey]: { ...current.booking[cardKey], href: event.target.value } },
                          }))}
                          placeholder="/contact or https://cal.com/you"
                          value={settingsDraft.booking[cardKey].href}
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Note (small text shown under the cards)</span>
                  <textarea
                    className="flex min-h-16 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => setSettingsDraft((current) => ({ ...current, booking: { ...current.booking, note: event.target.value } }))}
                    placeholder="Leave blank to hide."
                    value={settingsDraft.booking.note}
                  />
                </label>
              </section>
            </section>
          )}

          {tab === 'users' && canManageUsers && (
            <section className={styles.formStack}>
              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Invite a User</h2>
                  <span className={styles.counterPill}>{userInvitations.length} pending</span>
                </div>
                <p className={styles.muted}>
                  Create a one-time invite link here, then send it manually to your client or editor.
                </p>
                <div className={styles.inviteUserGrid}>
                  <label className={styles.field}>
                    <span>Name</span>
                    <input
                      onChange={(event) => setInviteDraft((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Client name"
                      value={inviteDraft.name}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Email</span>
                    <input
                      onChange={(event) => setInviteDraft((current) => ({ ...current, email: event.target.value }))}
                      placeholder="client@example.com"
                      type="email"
                      value={inviteDraft.email}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Role</span>
                    <select
                      onChange={(event) => setInviteDraft((current) => ({
                        ...current,
                        featureVisibility: event.target.value === 'super_admin'
                          ? DEFAULT_USER_FEATURE_VISIBILITY
                          : current.featureVisibility,
                        role: event.target.value as UserRole,
                      }))}
                      value={inviteDraft.role}
                    >
                      {CMS_ROLE_OPTIONS
                        .filter((option) => inviteRoleOptions.includes(option.value))
                        .map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                  </label>
                  <div className={cn(styles.fieldWide, 'space-y-3')}>
                    <div className="space-y-1">
                      <strong className="text-sm font-semibold text-foreground">Select user access</strong>
                      <small className={styles.fieldHint}>
                        Configure access before creating the invite link, so the client sees the right CMS tools on first login.
                      </small>
                    </div>
                    {inviteDraft.role === 'super_admin' ? (
                      <small className={styles.fieldHint}>
                        Super admin invites always include every CMS tool.
                      </small>
                    ) : (
                      <div className={styles.visibilityToggleGrid}>
                        <label className={styles.visibilityToggle}>
                          <input
                            checked={inviteDraft.featureVisibility.showAiSettings}
                            onChange={(event) => setInviteDraft((current) => ({
                              ...current,
                              featureVisibility: {
                                ...current.featureVisibility,
                                showAiSettings: event.target.checked,
                              },
                            }))}
                            type="checkbox"
                          />
                          Show AI settings
                        </label>
                        <label className={styles.visibilityToggle}>
                          <input
                            checked={inviteDraft.featureVisibility.showAiBlogTools}
                            onChange={(event) => setInviteDraft((current) => ({
                              ...current,
                              featureVisibility: {
                                ...current.featureVisibility,
                                showAiBlogTools: event.target.checked,
                              },
                            }))}
                            type="checkbox"
                          />
                          Show AI blog tools
                        </label>
                        <label className={styles.visibilityToggle}>
                          <input
                            checked={inviteDraft.featureVisibility.showLinkedIn}
                            onChange={(event) => setInviteDraft((current) => ({
                              ...current,
                              featureVisibility: {
                                ...current.featureVisibility,
                                showLinkedIn: event.target.checked,
                              },
                            }))}
                            type="checkbox"
                          />
                          Show LinkedIn tools
                        </label>
                      </div>
                    )}
                  </div>
                  <div className={[styles.field, styles.inviteActions].join(' ')}>
                    <span>Actions</span>
                    <div className={styles.buttonRow}>
                      <button
                        className={styles.primaryButton}
                        disabled={creatingInvitation}
                        onClick={() => { void createInvitation() }}
                        type="button"
                      >
                        {creatingInvitation ? 'Creating…' : 'Create Configured Invite Link'}
                      </button>
                    </div>
                  </div>
                  <p className={[styles.fieldWide, styles.inviteHelpText].join(' ')}>
                    Invite links are one-time setup links. Site owners can invite editors and collaborators.
                  </p>
                </div>
              </section>

              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Current Access</h2>
                  <span className={styles.counterPill}>{managedUsers.length}</span>
                </div>
                <div className={styles.userAccessList}>
                  {managedUsers.map((entry) => {
                    const canDeleteEntry = canDeleteCmsUser({
                      actorId: user.id,
                      actorRole: user.role,
                      targetId: entry.id,
                      targetRole: entry.role,
                    })
                    const roleOptions = canDeleteEntry
                      ? CMS_ROLE_OPTIONS.filter((option) => assignableRolesFor(user.role).includes(option.value))
                      : CMS_ROLE_OPTIONS.filter((option) => option.value === entry.role)
                    const isExpanded = expandedUserAccessId === entry.id
                    const draft = userAccessDrafts[entry.id] || createUserAccessDraft(entry)
                    const hasUserAccessChanges = userAccessDraftChanged(entry, draft)
                    const canEditFeatureVisibility = isSuperAdmin && draft.role !== 'super_admin'
                    const isSavingUserAccess = updatingUserId === entry.id || updatingUserFeaturesId === entry.id

                    return (
                      <article className={styles.userAccessCard} key={entry.id}>
                        <div className={styles.userAccessHeader}>
                          <div>
                            <strong>{entry.name}</strong>
                            <span>{entry.email}</span>
                          </div>
                          <span className={[
                            styles.badge,
                            entry.role === 'super_admin' ? styles.badgeInfo : styles.badgeMuted,
                          ].join(' ')}>
                            {formatUserRole(entry.role)}
                          </span>
                          {isExpanded && hasUserAccessChanges ? (
                            <button
                              aria-label={`Save changes for ${entry.name}`}
                              className={styles.userAccessSaveButton}
                              disabled={isSavingUserAccess}
                              onClick={() => void saveManagedUserAccessDraft(entry)}
                              type="button"
                            >
                              {isSavingUserAccess ? 'Saving...' : 'Save changes'}
                            </button>
                          ) : (
                            <button
                              aria-label={isExpanded ? `Done editing ${entry.name}` : `Edit access for ${entry.name}`}
                              className={styles.userAccessIconButton}
                              disabled={isSavingUserAccess}
                              onClick={() => {
                                if (!isExpanded) {
                                  openUserAccessEditor(entry)
                                  return
                                }

                                setExpandedUserAccessId('')
                                removeUserAccessDraft(entry.id)
                              }}
                              title={isExpanded ? 'Done editing' : 'Edit access'}
                              type="button"
                            >
                              <IconEditSmall />
                            </button>
                          )}
                        </div>
                        {isExpanded && (
                          <div className={styles.userAccessPanel}>
                            <div className={styles.userAccessControls}>
                              <label className={styles.field}>
                                <span>Role</span>
                                <select
                                  className={styles.roleSelect}
                                  disabled={!canDeleteEntry || isSavingUserAccess}
                                  onChange={(event) => updateUserAccessDraft(entry, (current) => ({
                                    ...current,
                                    featureVisibility: event.target.value === 'super_admin'
                                      ? DEFAULT_USER_FEATURE_VISIBILITY
                                      : current.featureVisibility,
                                    role: event.target.value as UserRole,
                                  }))}
                                  value={draft.role}
                                >
                                  {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </label>
                              <button
                                className={styles.dangerButton}
                                disabled={!canDeleteEntry || deletingUserId === entry.id}
                                onClick={() => { void deleteManagedUser(entry) }}
                                type="button"
                              >
                                {deletingUserId === entry.id ? 'Deleting…' : 'Delete User'}
                              </button>
                            </div>
                            <div className={styles.userFeatureVisibility}>
                              <span>Feature visibility</span>
                              {canEditFeatureVisibility ? (
                                <>
                                  <div className={styles.visibilityToggleGrid}>
                                    <label className={styles.visibilityToggle}>
                                      <input
                                        checked={draft.featureVisibility.showAiSettings}
                                        disabled={isSavingUserAccess}
                                        onChange={(event) => updateUserAccessDraft(entry, (current) => ({
                                          ...current,
                                          featureVisibility: {
                                            ...current.featureVisibility,
                                            showAiSettings: event.target.checked,
                                          },
                                        }))}
                                        type="checkbox"
                                      />
                                      Show AI settings
                                    </label>
                                    <label className={styles.visibilityToggle}>
                                      <input
                                        checked={draft.featureVisibility.showAiBlogTools}
                                        disabled={isSavingUserAccess}
                                        onChange={(event) => updateUserAccessDraft(entry, (current) => ({
                                          ...current,
                                          featureVisibility: {
                                            ...current.featureVisibility,
                                            showAiBlogTools: event.target.checked,
                                          },
                                        }))}
                                        type="checkbox"
                                      />
                                      Show AI blog tools
                                    </label>
                                    <label className={styles.visibilityToggle}>
                                      <input
                                        checked={draft.featureVisibility.showLinkedIn}
                                        disabled={isSavingUserAccess}
                                        onChange={(event) => updateUserAccessDraft(entry, (current) => ({
                                          ...current,
                                          featureVisibility: {
                                            ...current.featureVisibility,
                                            showLinkedIn: event.target.checked,
                                          },
                                        }))}
                                        type="checkbox"
                                      />
                                      Show LinkedIn tools
                                    </label>
                                  </div>
                                  <small className={styles.fieldHint}>
                                    Controls what this login can see in the CMS. Role permissions still apply.
                                  </small>
                                </>
                              ) : (
                                <small className={styles.fieldHint}>
                                  Super admin logins always see every CMS tool. Visibility toggles apply to site owners, editors, and collaborators.
                                </small>
                              )}
                            </div>
                            <small className={styles.fieldHint}>
                              Added {new Date(entry.createdAt).toLocaleDateString()}
                              {!canDeleteEntry && entry.role === 'super_admin' ? ' · Super admin access is protected.' : ''}
                              {!canDeleteEntry && entry.id === user.id ? ' · This is your current login.' : ''}
                            </small>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Pending Invitations</h2>
                  <span className={styles.counterPill}>{userInvitations.length}</span>
                </div>
                {userInvitations.length ? (
                  <div className={styles.userAccessList}>
                    {userInvitations.map((entry) => {
                      const featureVisibility = entry.featureVisibility || DEFAULT_USER_FEATURE_VISIBILITY
                      const hasFreshInviteLink = generatedInviteId === entry.id && Boolean(generatedInviteUrl)

                      return (
                        <article className={styles.userAccessCard} key={entry.id}>
                          <div className={styles.userAccessHeader}>
                            <div>
                              <strong>{entry.name}</strong>
                              <span>{entry.email} · {formatUserRole(entry.role)}</span>
                            </div>
                            <span className={[styles.badge, styles.badgeMuted].join(' ')}>
                              Expires {new Date(entry.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                          {hasFreshInviteLink && (
                            <div className={[styles.field, styles.inviteLinkCard].join(' ')}>
                              <span>Invite link ready</span>
                              <div className={styles.inviteLinkRow}>
                                <input readOnly value={generatedInviteUrl} />
                                <button
                                  className={styles.secondaryButton}
                                  onClick={() => { void copyToClipboard(generatedInviteUrl, 'Invite link copied.') }}
                                  type="button"
                                >
                                  Copy Link
                                </button>
                              </div>
                            </div>
                          )}
                          <div className={styles.userFeatureVisibility}>
                            <span>Prepared access</span>
                            <div className={styles.visibilityToggleGrid}>
                              <span className={[
                                styles.visibilityPill,
                                featureVisibility.showAiSettings ? styles.visibilityPillOn : styles.visibilityPillOff,
                              ].join(' ')}>
                                AI settings {featureVisibility.showAiSettings ? 'visible' : 'hidden'}
                              </span>
                              <span className={[
                                styles.visibilityPill,
                                featureVisibility.showAiBlogTools ? styles.visibilityPillOn : styles.visibilityPillOff,
                              ].join(' ')}>
                                AI blog tools {featureVisibility.showAiBlogTools ? 'visible' : 'hidden'}
                              </span>
                              <span className={[
                                styles.visibilityPill,
                                featureVisibility.showLinkedIn ? styles.visibilityPillOn : styles.visibilityPillOff,
                              ].join(' ')}>
                                LinkedIn tools {featureVisibility.showLinkedIn ? 'visible' : 'hidden'}
                              </span>
                            </div>
                            <small className={styles.fieldHint}>
                              These settings apply as soon as the client accepts the invitation.
                            </small>
                          </div>
                          <div className={styles.buttonRow}>
                            <button
                              className={styles.secondaryButton}
                              onClick={() => { void revokeInvitation(entry.id) }}
                              type="button"
                            >
                              Revoke Invite
                            </button>
                          </div>
                          {!hasFreshInviteLink && (
                            <small className={styles.fieldHint}>
                              Invite links are only shown once when created. Revoke and create a new invite if the link was not copied.
                            </small>
                          )}
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <p className={styles.muted}>No pending invitations yet.</p>
                )}
              </section>
            </section>
          )}

          {tab === 'linkedin' && canViewLinkedIn && (
            <section className={styles.formStack}>
              {linkedInComingSoon ? (
                <section className={styles.sectionCard}>
                  <div className={styles.sectionCardHeader}>
                    <h2>LinkedIn Publishing</h2>
                    <span className={[styles.badge, styles.badgeMuted].join(' ')}>Coming Soon</span>
                  </div>
                  <p className={styles.pageDescription} style={{ marginTop: 0 }}>
                    LinkedIn connect and post publishing are temporarily disabled while app permissions are being finalized.
                  </p>
                  <small className={styles.fieldHint}>
                    Once approved, this tab will allow connect/disconnect, destination selection (profile/company), and one-click post sharing.
                  </small>
                </section>
              ) : (
                <section className={styles.sectionCard}>
                  <div className={styles.sectionCardHeader}>
                    <h2>Connected Account</h2>
                    <span className={[styles.badge, linkedInConnection.connected ? styles.badgeSuccess : styles.badgeMuted].join(' ')}>
                      {linkedInConnection.connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <div className={styles.grid}>
                    <div className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>LinkedIn account</span>
                      <small className={styles.fieldHint}>
                        {linkedInConnection.connected
                          ? `${linkedInConnection.linkedInName || 'LinkedIn member'}${linkedInConnection.linkedInEmail ? ` (${linkedInConnection.linkedInEmail})` : ''}`
                          : 'No LinkedIn account is connected yet.'}
                      </small>
                      {linkedInConnection.connected && linkedInConnection.expiresAt && (
                        <small className={styles.fieldHint}>Token expiry: {new Date(linkedInConnection.expiresAt).toLocaleString()}</small>
                      )}
                    </div>
                    <div className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Actions</span>
                      <div className={styles.buttonRow}>
                        {linkedInConnection.connected ? (
                          <button className={styles.primaryButton} disabled type="button">
                            Connected to LinkedIn
                          </button>
                        ) : (
                          <a className={styles.primaryButton} href="/api/linkedin/connect">
                            Connect LinkedIn
                          </a>
                        )}
                        {linkedInConnection.connected && (
                          <button className={styles.secondaryButton} onClick={disconnectLinkedIn} type="button">
                            Disconnect
                          </button>
                        )}
                      </div>
                      <small className={styles.fieldHint}>
                        Clients only click Connect and approve once. The CMS stores their token securely.
                      </small>
                      {linkedInConnection.connected && (
                        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
                          <label className={styles.field}>
                            <span>Post destination</span>
                            <select
                              onChange={(event) => setSelectedLinkedInTargetUrn(event.target.value)}
                              value={selectedLinkedInTargetUrn}
                            >
                              {linkedInTargets.map((target) => (
                                <option key={target.urn} value={target.urn}>
                                  {target.type === 'organization' ? `${target.name} (Company)` : `${target.name} (Profile)`}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className={styles.buttonRow}>
                            <button
                              className={styles.secondaryButton}
                              disabled={!selectedLinkedInTargetUrn || savingLinkedInTarget}
                              onClick={() => {
                                void saveLinkedInTarget()
                              }}
                              type="button"
                            >
                              {savingLinkedInTarget ? 'Saving...' : 'Save Destination'}
                            </button>
                          </div>
                          {linkedInTargetsPermissionError && (
                            <small className={styles.fieldHint}>
                              {linkedInMissingOrgScopes.length
                                ? `Company pages are unavailable for this connection. Reconnect after LinkedIn grants scopes: ${linkedInMissingOrgScopes.join(', ')}.`
                                : 'Company pages are not available for this LinkedIn connection yet. Confirm this user is a page admin and reconnect LinkedIn.'}
                            </small>
                          )}
                          {!linkedInOrgScopesEnabled && (
                            <small className={styles.fieldHint}>
                              Company posting is currently disabled for this app configuration. Personal profile posting remains active.
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </section>
          )}

          {tab === 'pages' && (
            <section className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">All Pages</h2>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                    {staticPages.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="relative">
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 16 16"
                    >
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="m11 11 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                    </svg>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setPageListQuery(event.target.value)}
                      placeholder="Search pages"
                      type="search"
                      value={pageListQuery}
                    />
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Sort by</span>
                    <div className="relative">
                      <select
                        className="flex h-10 w-full appearance-none rounded-md border border-input bg-card pl-3 pr-9 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onChange={(event) => setPageListSort(event.target.value as PageListSort)}
                        value={pageListSort}
                      >
                        <option value="slug-asc">Path A → Z</option>
                        <option value="slug-desc">Path Z → A</option>
                        <option value="published">Published first</option>
                      </select>
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 16 16"
                      >
                        <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  {visiblePages.map((page) => {
                    const isActive = activePageSlug === page.slug
                    return (
                      <button
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition-all',
                          isActive
                            ? 'border-cyan-400/40 bg-accent/60 text-foreground'
                            : 'border-border bg-card text-foreground hover:border-cyan-400/30 hover:bg-accent/40',
                        )}
                        key={page.slug || 'home'}
                        onClick={() => setActivePageSlug(page.slug)}
                        type="button"
                      >
                        <strong className="truncate text-sm font-semibold">
                          {page.slug ? `/${page.slug}` : '/ (home)'}
                        </strong>
                        <Badge variant={page.published ? 'accent' : 'muted'}>
                          {page.published ? 'Published' : 'Draft'}
                        </Badge>
                      </button>
                    )
                  })}
                  {!visiblePages.length && (
                    <p className="text-sm text-muted-foreground">No pages match that search.</p>
                  )}
                </div>
              </section>

              {pageDraft && (
                <section className={styles.editorPane}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Editing page</p>
                      <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                        {pageDraft.slug ? `/${pageDraft.slug}` : '/ (home)'}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" type="button" variant="outline">
                        <a href={pageDraft.slug ? `/admin/edit?page=${encodeURIComponent(pageDraft.slug)}` : '/admin/edit'}>
                          Edit content
                        </a>
                      </Button>
                      <Button onClick={savePage} size="sm" type="button">
                        Save SEO
                      </Button>
                    </div>
                  </div>
                  <div className={styles.grid}>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Meta Title</span>
                      <input value={pageDraft.title} onChange={(event) => setPageDraft({ ...pageDraft, title: event.target.value })} placeholder="Page title for SEO and browser tab" />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Meta Description</span>
                      <textarea value={pageDraft.description} onChange={(event) => setPageDraft({ ...pageDraft, description: event.target.value })} placeholder="Short description for search engines (150–160 characters)" />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Schema JSON (optional)</span>
                      <textarea value={pageDraft.schema ? JSON.stringify(pageDraft.schema, null, 2) : ''} onChange={(event) => {
                        const val = event.target.value.trim()
                        try {
                          setPageDraft({ ...pageDraft, schema: val ? JSON.parse(val) : undefined })
                        } catch {
                          // Let user keep typing invalid JSON
                        }
                      }} placeholder='{"@type": "WebPage", ...}' />
                    </label>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.primaryButton} onClick={savePage} type="button">Save SEO</button>
                  </div>
                </section>
              )}
            </section>
          )}

          {tab === 'posts' && canViewBlog && (
            <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">All Posts</h2>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                    {posts.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="relative">
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 16 16"
                    >
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="m11 11 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                    </svg>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setPostListQuery(event.target.value)}
                      placeholder="Search posts"
                      type="search"
                      value={postListQuery}
                    />
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Sort by</span>
                    <div className="relative">
                      <select
                        className="flex h-10 w-full appearance-none rounded-md border border-input bg-card pl-3 pr-9 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onChange={(event) => setPostListSort(event.target.value as PostListSort)}
                        value={postListSort}
                      >
                        <option value="recent">Newest first</option>
                        <option value="title-asc">Title A → Z</option>
                        <option value="title-desc">Title Z → A</option>
                        <option value="published">Published first</option>
                      </select>
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 16 16"
                      >
                        <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  {visiblePosts.map((post) => {
                    const isActive = activePostSlug === post.slug
                    return (
                      <button
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                          isActive
                            ? 'border-cyan-400/40 bg-accent/60'
                            : 'border-border bg-card hover:border-cyan-400/30 hover:bg-accent/40',
                        )}
                        key={post.slug}
                        onClick={() => {
                          setActivePostSlug(post.slug)
                          setAiPostBuilder((current) => ({ ...current, open: false }))
                        }}
                        type="button"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent/60 text-muted-foreground">
                          {post.coverImageUrl ? (
                            <img alt={post.coverImageAlt || post.title} className="h-full w-full object-cover" src={post.coverImageUrl} />
                          ) : (
                            <IconPosts />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <strong className="truncate text-sm font-semibold text-foreground">{post.title}</strong>
                          <Badge className="self-start" variant={post.published ? 'accent' : 'muted'}>
                            {post.published ? 'Published' : 'Archived'}
                          </Badge>
                        </div>
                      </button>
                    )
                  })}
                  {!visiblePosts.length && (
                    <p className="text-sm text-muted-foreground">No posts match that search yet.</p>
                  )}
                </div>
              </section>

              {((canUseAiBlogBuilder && aiPostBuilder.open) || postDraft) && (
                <section className={styles.editorPane}>
                  {canUseAiBlogBuilder && aiPostBuilder.open && (
                    <section className={styles.aiBuilderCard}>
                      <div className={styles.sectionCardHeader}>
                        <h2>AI Draft Builder</h2>
                      </div>
                      <p className={styles.aiBuilderIntro}>
                        Structured response schema, read time, SEO metadata, and FAQ schema are handled server-side. This form controls the brief, title direction, and image generation options.
                      </p>
                      <div className={styles.grid}>
                        <label className={[styles.field, styles.fieldWide].join(' ')}>
                          <span>Topic or brief</span>
                          <textarea
                            value={aiPostBuilder.topic}
                            onChange={(event) => setAiPostBuilder((current) => ({ ...current, topic: event.target.value }))}
                            placeholder="Example: Write a practical article about how to keep website content fresh after launch."
                          />
                          <small className={styles.fieldHint}>This is the working brief. You can use it directly or generate five title ideas from it first.</small>
                        </label>
                        <label className={styles.field}>
                          <span>Audience</span>
                          <input
                            value={aiPostBuilder.audience}
                            onChange={(event) => setAiPostBuilder((current) => ({ ...current, audience: event.target.value }))}
                            placeholder="Business owners, editors, clients, or a specific audience"
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Goal</span>
                          <input
                            value={aiPostBuilder.goal}
                            onChange={(event) => setAiPostBuilder((current) => ({ ...current, goal: event.target.value }))}
                            placeholder="Explain, build trust, encourage a next step"
                          />
                        </label>
                        <label className={[styles.field, styles.fieldWide].join(' ')}>
                          <span>Image prompt add-on</span>
                          <textarea
                            value={aiPostBuilder.imagePrompt}
                            onChange={(event) => setAiPostBuilder((current) => ({ ...current, imagePrompt: event.target.value }))}
                            placeholder="Optional. Example: avoid the generic upset-couple-on-a-couch scene; use a more editorial image about emotional distance, repair, or conversation in natural light."
                          />
                          <small className={styles.fieldHint}>Adds one-off visual direction for this post only, so you can push the image away from repeated compositions.</small>
                        </label>
                        <label className={[styles.field, styles.fieldWide].join(' ')}>
                          <span>Selected title</span>
                          <input
                            value={aiPostBuilder.selectedTitle}
                            onChange={(event) => setAiPostBuilder((current) => ({ ...current, selectedTitle: event.target.value }))}
                            placeholder="Optional. Leave blank to let AI choose one from the brief."
                          />
                        </label>
                        <label className={[styles.field, styles.fieldWide].join(' ')}>
                          <span className={styles.toggleLabel}>
                            <input
                              checked={aiPostBuilder.generateImage}
                              className={styles.toggleInput}
                              onChange={(event) => setAiPostBuilder((current) => ({ ...current, generateImage: event.target.checked }))}
                              type="checkbox"
                            />
                            Generate a cover image and alt text
                          </span>
                        </label>
                      </div>
                      {aiPostBuilder.titleIdeas.length > 0 && (
                        <div className={styles.titleIdeas}>
                          {aiPostBuilder.titleIdeas.map((title) => (
                            <button
                              className={[styles.titleIdeaButton, aiPostBuilder.selectedTitle === title ? styles.titleIdeaButtonActive : ''].join(' ')}
                              key={title}
                              onClick={() => setAiPostBuilder((current) => ({ ...current, selectedTitle: title }))}
                              type="button"
                            >
                              {title}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className={styles.inlineActions}>
                        <button
                          className={styles.secondaryButton}
                          disabled={aiPostBuilder.loadingTitles || aiPostBuilder.loadingDraft}
                          onClick={generateAiTitleIdeas}
                          type="button"
                        >
                          {aiPostBuilder.loadingTitles ? 'Generating Titles…' : 'Get 5 Titles'}
                        </button>
                        <button
                          className={styles.primaryButton}
                          disabled={aiPostBuilder.loadingDraft}
                          onClick={generateAiPostDraft}
                          type="button"
                        >
                          {aiPostBuilder.loadingDraft ? 'Generating Draft…' : 'Generate Draft'}
                        </button>
                      </div>
                      {aiPostBuilder.loadingDraft && (
                        <div className={styles.draftLoadingCard}>
                          <div className={styles.draftLoadingOrb} aria-hidden="true">
                            <span />
                            <span />
                            <span />
                          </div>
                          <div className={styles.draftLoadingCopy}>
                            <strong>Working on the draft now.</strong>
                            <p>{activeDraftLoadingMessage}</p>
                            <span>Hang in there. You can review and edit everything before saving.</span>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {!aiPostBuilder.open && postDraft && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                        <div className="min-w-0 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            {activePostSlug ? 'Editing post' : 'New post'}
                          </p>
                          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                            {postDraft.title || 'New Post'}
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm">
                            <input
                              checked={postDraft.published}
                              onChange={(event) => setPostDraft({ ...postDraft, published: event.target.checked })}
                              type="checkbox"
                            />
                            <span className="text-foreground">Published</span>
                          </label>
                          {activePostSlug && (
                            <Button onClick={deletePost} size="sm" type="button" variant="destructive">
                              Delete
                            </Button>
                          )}
                          <Button onClick={() => { void savePost() }} size="sm" type="button">
                            Save
                          </Button>
                        </div>
                      </div>
                      <div className={styles.grid}>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Title</span>
                      <input
                        autoFocus={!postDraft.title}
                        onChange={(event) => {
                          const nextTitle = event.target.value
                          const autoSlugMatch = !postDraft.slug || postDraft.slug === slugify(postDraft.title)
                          const nextSlug = autoSlugMatch ? slugify(nextTitle) : postDraft.slug
                          setPostDraft({ ...postDraft, slug: nextSlug, title: nextTitle })
                        }}
                        placeholder="e.g. Five things we learned shipping a starter CMS"
                        value={postDraft.title}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Slug</span>
                      <input
                        onChange={(event) => setPostDraft({ ...postDraft, slug: event.target.value })}
                        placeholder="auto-generated from title"
                        value={postDraft.slug}
                      />
                      <small className={styles.fieldHint}>Used in the URL. Auto-fills from the title until you edit it manually.</small>
                    </label>
                    <label className={styles.field}>
                      <span>Published at</span>
                      <input value={postDraft.publishedAt} onChange={(event) => setPostDraft({ ...postDraft, publishedAt: event.target.value })} />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Excerpt</span>
                      <textarea value={postDraft.excerpt} onChange={(event) => setPostDraft({ ...postDraft, excerpt: event.target.value })} />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>SEO title</span>
                      <input value={postDraft.seoTitle || ''} onChange={(event) => setPostDraft({ ...postDraft, seoTitle: event.target.value })} placeholder="Used for the browser title, search results, and social previews." />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Meta description</span>
                      <textarea value={postDraft.seoDescription || ''} onChange={(event) => setPostDraft({ ...postDraft, seoDescription: event.target.value })} placeholder="Used for search snippets and social sharing description." />
                    </label>
                    <div className={styles.fieldWide} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                      <div className={styles.coverImageColumn}>
                        <div
                          className={styles.coverImageFrame}
                          style={{
                            background: postDraft.coverImageUrl ? '#000' : '#f4f6f8',
                          }}
                        >
                          {postDraft.coverImageUrl ? (
                            <>
                              <img
                                alt={postDraft.coverImageAlt || ''}
                                src={postDraft.coverImageUrl}
                                style={{ display: 'block', height: '100%', objectFit: 'cover', width: '100%' }}
                              />
                              <div className={styles.coverImageBadge}>
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 14l4-4 3 3 3-3 5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Current cover image
                              </div>
                            </>
                          ) : (
                            <>
                              <svg width="32" height="32" viewBox="0 0 20 20" fill="none" style={{ color: '#9ca4ae' }}><rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 14l4-4 3 3 3-3 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <span style={{ color: '#66707a', fontSize: '0.88rem' }}>No cover image selected</span>
                            </>
                          )}
                        </div>
                        <div className={styles.coverImageActions}>
                          <button
                            className={styles.secondaryButton}
                            onClick={() => document.getElementById('cover-upload')?.click()}
                            type="button"
                          >
                            Upload New
                          </button>
                          <button
                            className={styles.secondaryButton}
                            onClick={() => setCoverImageLibraryOpen((current) => !current)}
                            type="button"
                          >
                            {coverImageLibraryOpen ? 'Hide Library' : 'Choose From Library'}
                          </button>
                        </div>
                        {coverImageLibraryOpen && (
                          <div className={styles.coverLibrary}>
                            {media.length ? (
                              <div className={styles.coverLibraryGrid}>
                                {media.map((item) => (
                                  <button
                                    className={styles.coverLibraryItem}
                                    key={item.publicUrl}
                                    onClick={() => selectPostCoverImage(item)}
                                    type="button"
                                  >
                                    <div className={styles.coverLibraryThumb}>
                                      <img alt={item.alt || item.filename} className={styles.coverLibraryPreview} loading="lazy" src={item.publicUrl} />
                                    </div>
                                    <div className={styles.coverLibraryMeta}>
                                      <strong>{item.filename}</strong>
                                      <span>{item.alt || 'No alt text yet'}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className={styles.muted}>No media available yet. Upload an image first or use the media section.</p>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        accept="image/*"
                        id="cover-upload"
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            await uploadPostCoverImage(file)
                          }
                          event.currentTarget.value = ''
                        }}
                        style={{ display: 'none' }}
                        type="file"
                      />
                      <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
                        <label className={styles.field}>
                          <span>Alt text</span>
                          <input value={postDraft.coverImageAlt || ''} onChange={(event) => setPostDraft({ ...postDraft, coverImageAlt: event.target.value })} placeholder="Describe the image" />
                        </label>
                        <label className={styles.field}>
                          <span>Image URL</span>
                          <input value={postDraft.coverImageUrl || ''} readOnly style={{ color: '#8b939c', fontSize: '0.85rem' }} />
                        </label>
                      </div>
                    </div>
                    <label className={styles.field}>
                      <span>Primary category</span>
                      <input value={postDraft.primaryCategory} onChange={(event) => setPostDraft({ ...postDraft, primaryCategory: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Read time</span>
                      <input value={postDraft.readTime || ''} onChange={(event) => setPostDraft({ ...postDraft, readTime: event.target.value })} />
                    </label>
                    <div className={[styles.field, styles.fieldWide].join(' ')}>
                      <ContentItemReferenceSelect
                        helperText="Pick a linked Author content item. Selecting one auto-fills the name and role below; you can still override them manually for one-off bylines."
                        label="Linked author"
                        onChange={(slug, item) => {
                          if (!slug) {
                            setPostDraft({ ...postDraft, authorSlug: '' })
                            return
                          }
                          const nextName = item && typeof item.data?.name === 'string' && item.data.name
                            ? String(item.data.name)
                            : postDraft.authorName
                          const nextRole = item && typeof item.data?.role === 'string' && item.data.role
                            ? String(item.data.role)
                            : postDraft.authorRole
                          setPostDraft({
                            ...postDraft,
                            authorName: nextName,
                            authorRole: nextRole,
                            authorSlug: slug,
                          })
                        }}
                        targetType="author"
                        value={postDraft.authorSlug || ''}
                      />
                    </div>
                    <label className={styles.field}>
                      <span>Author name</span>
                      <input value={postDraft.authorName} onChange={(event) => setPostDraft({ ...postDraft, authorName: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Author role</span>
                      <input value={postDraft.authorRole} onChange={(event) => setPostDraft({ ...postDraft, authorRole: event.target.value })} />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Categories, comma separated</span>
                      <textarea value={postCategoriesInput} onChange={(event) => setPostDraft({ ...postDraft, categories: event.target.value.split(',').map((value) => value.trim()).filter(Boolean).map((label) => ({ label })) })} />
                    </label>
                    <div className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Article body</span>
                      <RichTextEditor value={postDraft.contentHtml} onChange={(value) => setPostDraft({ ...postDraft, contentHtml: value })} />
                    </div>
                    {canViewLinkedIn && linkedInConnection.connected && linkedInTargets.length > 0 && (
                      <label className={[styles.field, styles.fieldWide].join(' ')}>
                        <span>LinkedIn share destination</span>
                        <select
                          onChange={(event) => setSelectedLinkedInTargetUrn(event.target.value)}
                          value={selectedLinkedInTargetUrn}
                        >
                          {linkedInTargets.map((target) => (
                            <option key={target.urn} value={target.urn}>
                              {target.type === 'organization' ? `${target.name} (Company)` : `${target.name} (Profile)`}
                            </option>
                          ))}
                        </select>
                        <small className={styles.fieldHint}>
                          The selected destination will be used when you click “Share on LinkedIn”.
                        </small>
                      </label>
                    )}
                      </div>
                      <div className={styles.actions}>
                        {canViewLinkedIn && (
                          <button
                            className={styles.secondaryButton}
                            disabled
                            type="button"
                          >
                            LinkedIn (Coming Soon)
                          </button>
                        )}
                        <button
                          className={styles.secondaryButton}
                          onClick={() => {
                            void setPostPublishedState(!postDraft.published)
                          }}
                          type="button"
                        >
                          {postDraft.published ? 'Archive Post' : 'Publish Post'}
                        </button>
                        <button className={styles.secondaryButton} onClick={discardPostDraft} type="button">Discard Post</button>
                        <button className={styles.primaryButton} onClick={() => { void savePost() }} type="button">Save Post</button>
                        <button className={styles.dangerButton} onClick={deletePost} type="button">Delete Post</button>
                      </div>
                    </>
                  )}
                </section>
              )}
            </section>
          )}

          {tab === 'products' && (
            <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">All Products</h2>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                    {products.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="relative">
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 16 16"
                    >
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="m11 11 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                    </svg>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setProductListQuery(event.target.value)}
                      placeholder="Search products"
                      type="search"
                      value={productListQuery}
                    />
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Sort by</span>
                    <div className="relative">
                      <select
                        className="flex h-10 w-full appearance-none rounded-md border border-input bg-card pl-3 pr-9 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onChange={(event) => setProductListSort(event.target.value as ProductListSort)}
                        value={productListSort}
                      >
                        <option value="category">Category</option>
                        <option value="title-asc">Title A → Z</option>
                        <option value="title-desc">Title Z → A</option>
                        <option value="published">Published first</option>
                      </select>
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 16 16"
                      >
                        <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  {visibleProducts.map((product) => {
                    const isActive = activeProductSlug === product.slug
                    return (
                      <button
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                          isActive
                            ? 'border-cyan-400/40 bg-accent/60'
                            : 'border-border bg-card hover:border-cyan-400/30 hover:bg-accent/40',
                        )}
                        key={product.slug}
                        onClick={() => { void handleSelectProduct(product.slug) }}
                        type="button"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent/60 text-muted-foreground">
                          {product.heroImageUrl ? (
                            <img alt={product.heroImageAlt || product.name} className="h-full w-full object-cover" src={product.heroImageUrl} />
                          ) : (
                            <IconProducts />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <strong className="truncate text-sm font-semibold text-foreground">{product.name}</strong>
                          <Badge className="self-start" variant={product.published ? 'accent' : 'muted'}>
                            {product.published ? 'Published' : 'Archived'}
                          </Badge>
                        </div>
                      </button>
                    )
                  })}
                  {!visibleProducts.length && (
                    <p className="text-sm text-muted-foreground">No products match that search yet.</p>
                  )}
                </div>
              </section>

              {productDraft && (
                <section className={styles.editorPane}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {activeProductSlug ? 'Editing product' : 'New product'}
                      </p>
                      <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                        {productDraft.name || 'New Product'}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm">
                        <input
                          checked={productDraft.published}
                          onChange={(event) => setProductDraft({ ...productDraft, published: event.target.checked })}
                          type="checkbox"
                        />
                        <span className="text-foreground">Published</span>
                      </label>
                      {activeProductSlug && (
                        <Button onClick={deleteProduct} size="sm" type="button" variant="destructive">
                          Delete
                        </Button>
                      )}
                      <Button onClick={() => { void saveProduct() }} size="sm" type="button">
                        Save
                      </Button>
                    </div>
                  </div>
                  <div className={styles.grid}>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Name</span>
                      <input
                        autoFocus={!productDraft.name}
                        onChange={(event) => {
                          const nextName = event.target.value
                          const autoSlugMatch = productDraft.slug === slugify(productDraft.name) || !productDraft.slug
                          const nextSlug = autoSlugMatch ? slugify(nextName) : productDraft.slug
                          setProductDraft({ ...productDraft, name: nextName, slug: nextSlug })
                        }}
                        placeholder="e.g. Acme Pro Cooler 2000"
                        value={productDraft.name}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Slug</span>
                      <input
                        onChange={(event) => setProductDraft({ ...productDraft, slug: event.target.value })}
                        placeholder="auto-generated from name"
                        value={productDraft.slug}
                      />
                      <small className={styles.fieldHint}>Used in the URL. Auto-fills from the name until you edit it manually.</small>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.toggleLabel}>
                        <input
                          checked={productDraft.isFrontPage}
                          className={styles.toggleInput}
                          onChange={(event) => setProductDraft({ ...productDraft, isFrontPage: event.target.checked })}
                          type="checkbox"
                        />
                        Featured on front-end lists
                      </span>
                      <small className={styles.fieldHint}>Use this flag where the site prioritizes featured products.</small>
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Short description</span>
                      <textarea value={productDraft.shortDescription} onChange={(event) => setProductDraft({ ...productDraft, shortDescription: event.target.value })} />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>SEO title</span>
                      <input value={productDraft.metaTitle} onChange={(event) => setProductDraft({ ...productDraft, metaTitle: event.target.value })} />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Meta description</span>
                      <textarea value={productDraft.metaDescription} onChange={(event) => setProductDraft({ ...productDraft, metaDescription: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Price (NZD)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={productDraft.price ?? ''}
                        onChange={(event) => {
                          const value = event.target.value.trim()
                          setProductDraft({ ...productDraft, price: value ? Number(value) : undefined })
                        }}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Price label</span>
                      <input value={productDraft.priceLabel || ''} onChange={(event) => setProductDraft({ ...productDraft, priceLabel: event.target.value })} />
                    </label>
                    <div className={[styles.fieldWide, styles.productMediaLayout].join(' ')}>
                      <div className={styles.coverImageColumn}>
                        <div className={styles.productImagesPanel}>
                          <div className={styles.productImagesHeading}>
                            <strong>Product Images</strong>
                            <span>The hero stays full width here. Add the rest underneath, drag thumbnails to reorder, or drop one onto the hero to promote it.</span>
                          </div>
                          <div
                            className={[styles.coverImageFrame, styles.productImageHeroFrame].join(' ')}
                            onDragOver={handleProductImageDragOver}
                            onDrop={() => handleProductImageDrop(0)}
                            style={{
                              background: productDraft.heroImageUrl ? '#fff' : '#f4f6f8',
                            }}
                          >
                            {productDraft.heroImageUrl ? (
                              <>
                                <div className={styles.productImageBadges}>
                                  <div className={styles.productImageBadge}>Hero</div>
                                  {productDraft.productImages[0]?.label === 'lifestyle' && (
                                    <div className={[styles.productImageBadge, styles.productImageBadgeLifestyle].join(' ')}>
                                      Lifestyle
                                    </div>
                                  )}
                                </div>
                                <div className={styles.productImageToolbar}>
                                  <button
                                    className={[styles.productImageIconButton, styles.productImageIconButtonActive].join(' ')}
                                    disabled
                                    title="Current hero image"
                                    aria-label="Current hero image"
                                    type="button"
                                  >
                                    <IconStarBadge />
                                  </button>
                                  {productDraft.productImages[0]?.label === 'lifestyle' ? (
                                    <button
                                      className={[styles.productImageIconButton, styles.productImageIconButtonLifestyle, styles.productImageIconButtonActive].join(' ')}
                                      disabled
                                      title="Current lifestyle image"
                                      aria-label="Current lifestyle image"
                                      type="button"
                                    >
                                      <IconLifestyleBadge />
                                    </button>
                                  ) : (
                                    <button
                                      className={[styles.productImageIconButton, styles.productImageIconButtonLifestyle].join(' ')}
                                      onClick={() => makeProductLifestyleImage(0)}
                                      title="Make lifestyle image"
                                      aria-label="Make lifestyle image"
                                      type="button"
                                    >
                                      <IconLifestyleBadge />
                                    </button>
                                  )}
                                  <button
                                    className={[styles.productImageIconButton, styles.productImageIconButtonDanger].join(' ')}
                                    onClick={() => removeProductImage(0)}
                                    title="Remove image"
                                    aria-label="Remove image"
                                    type="button"
                                  >
                                    <IconTrashSmall />
                                  </button>
                                </div>
                                <img
                                  alt={productDraft.heroImageAlt || ''}
                                  src={productDraft.heroImageUrl}
                                  style={{ display: 'block', height: '100%', objectFit: 'contain', width: '100%' }}
                                />
                                <div className={styles.coverImageBadge}>
                                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 14l4-4 3 3 3-3 5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                  Current hero image
                                </div>
                              </>
                            ) : (
                              <>
                                <svg width="32" height="32" viewBox="0 0 20 20" fill="none" style={{ color: '#9ca4ae' }}><rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 14l4-4 3 3 3-3 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                <span style={{ color: '#66707a', fontSize: '0.88rem' }}>No product image selected</span>
                              </>
                            )}
                          </div>
                          {productDraft.heroImageUrl && (
                            <label className="flex flex-col gap-1.5 px-3 pt-3">
                              <span className="text-xs font-medium text-muted-foreground">Hero image alt text</span>
                              <input
                                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                onChange={(event) => {
                                  const nextAlt = event.target.value
                                  updateProductDraftImages((current) => current.map((entry, currentIndex) => (
                                    currentIndex === 0 ? { ...entry, alt: nextAlt } : entry
                                  )))
                                }}
                                placeholder={productDraft.heroImageAlt ? '' : 'Describe the hero image for accessibility and SEO'}
                                value={productDraft.heroImageAlt || ''}
                              />
                            </label>
                          )}
                          {productDraft.productImages.length > 1 ? (
                            <div className={styles.productImageThumbSection}>
                              <div className={styles.productImageThumbHeader}>
                                <strong>Gallery Images</strong>
                                <span>Use the star to promote one to hero, or tag a thumbnail as the lifestyle image for the page header.</span>
                              </div>
                              <div className={styles.productImageThumbGrid}>
                                {productDraft.productImages.slice(1).map((image, offset) => {
                                  const index = offset + 1

                                  return (
                                    <div
                                      className={styles.productImageThumbItem}
                                      draggable
                                      key={`${image.url}-${index}`}
                                      onDragEnd={handleProductImageDragEnd}
                                      onDragOver={handleProductImageDragOver}
                                      onDragStart={() => handleProductImageDragStart(index)}
                                      onDrop={() => handleProductImageDrop(index)}
                                    >
                                      {image.label === 'lifestyle' && (
                                        <div className={styles.productImageBadges}>
                                          <div className={[styles.productImageBadge, styles.productImageBadgeLifestyle].join(' ')}>
                                            Lifestyle
                                          </div>
                                        </div>
                                      )}
                                      <div className={styles.productImageToolbar}>
                                        <button
                                          className={styles.productImageIconButton}
                                          onClick={() => makeProductHeroImage(index)}
                                          title="Make hero image"
                                          aria-label="Make hero image"
                                          type="button"
                                        >
                                          <IconStarBadge />
                                        </button>
                                        {image.label === 'lifestyle' ? (
                                          <button
                                            className={[styles.productImageIconButton, styles.productImageIconButtonLifestyle, styles.productImageIconButtonActive].join(' ')}
                                            disabled
                                            title="Current lifestyle image"
                                            aria-label="Current lifestyle image"
                                            type="button"
                                          >
                                            <IconLifestyleBadge />
                                          </button>
                                        ) : (
                                          <button
                                            className={[styles.productImageIconButton, styles.productImageIconButtonLifestyle].join(' ')}
                                            onClick={() => makeProductLifestyleImage(index)}
                                            title="Make lifestyle image"
                                            aria-label="Make lifestyle image"
                                            type="button"
                                          >
                                            <IconLifestyleBadge />
                                          </button>
                                        )}
                                        <button
                                          className={[styles.productImageIconButton, styles.productImageIconButtonDanger].join(' ')}
                                          onClick={() => removeProductImage(index)}
                                          title="Remove image"
                                          aria-label="Remove image"
                                          type="button"
                                        >
                                          <IconTrashSmall />
                                        </button>
                                        <div aria-hidden="true" className={styles.productImageDragHandle} title="Drag to reorder">
                                          <IconDragDots />
                                        </div>
                                      </div>
                                      <img
                                        alt={image.alt || productDraft.name}
                                        className={styles.productImagePreview}
                                        src={image.url}
                                      />
                                      <div className={styles.productImageMeta}>
                                        <div className={styles.productImageCaption}>
                                          <strong>{`Image ${index + 1}`}</strong>
                                          <span>
                                            {image.label === 'lifestyle'
                                              ? 'Used in the page header as the lifestyle image.'
                                              : 'Gallery image shown after the hero.'}
                                          </span>
                                        </div>
                                        <input
                                          aria-label={`Alt text for image ${index + 1}`}
                                          className="flex h-9 w-full rounded-md border border-input bg-card px-2.5 py-1.5 text-xs text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                          onChange={(event) => {
                                            const nextAlt = event.target.value
                                            updateProductDraftImages((current) => current.map((entry, currentIndex) => (
                                              currentIndex === index ? { ...entry, alt: nextAlt } : entry
                                            )))
                                          }}
                                          placeholder={image.alt ? '' : 'No alt text — click to add'}
                                          value={image.alt || ''}
                                        />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : productDraft.productImages.length ? (
                            <p className={styles.muted}>Add more images to build out the product gallery below the hero.</p>
                          ) : (
                            <p className={styles.muted}>No images yet. Upload one or add from the media library to create the hero and gallery.</p>
                          )}
                          <div className={styles.coverImageActions}>
                            <button
                              className={styles.secondaryButton}
                              onClick={() => document.getElementById('product-upload')?.click()}
                              type="button"
                            >
                              Upload Images
                            </button>
                            <button
                              className={styles.secondaryButton}
                              onClick={() => setProductImageLibraryOpen((current) => !current)}
                              type="button"
                            >
                              {productImageLibraryOpen ? 'Hide Library' : 'Choose From Library'}
                            </button>
                            <button
                              className={styles.secondaryButton}
                              disabled={!productDraft.productImages.length}
                              onClick={clearProductImages}
                              type="button"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                      </div>
                      <input
                        accept="image/*"
                        id="product-upload"
                        onChange={async (event) => {
                          const files = Array.from(event.target.files || [])
                          if (files.length) {
                            await uploadProductImages(files)
                          }
                          event.currentTarget.value = ''
                        }}
                        style={{ display: 'none' }}
                        type="file"
                        multiple
                      />
                      {productImageLibraryOpen && (
                        <div className={[styles.coverLibrary, styles.productMediaLibrary].join(' ')}>
                          {media.length ? (
                            <>
                              <div className={styles.coverLibraryToolbar}>
                                <label className={styles.coverLibrarySearch}>
                                  <span>Search library</span>
                                  <input
                                    placeholder="Search by filename, alt text, or product code"
                                    type="search"
                                    value={productImageLibraryQuery}
                                    onChange={(event) => setProductImageLibraryQuery(event.target.value)}
                                  />
                                </label>
                                <p className={styles.coverLibraryCount}>
                                  {filteredProductImageLibrary.length} of {media.length} image{media.length === 1 ? '' : 's'}
                                </p>
                              </div>
                              {filteredProductImageLibrary.length ? (
                                <div className={styles.coverLibraryGrid}>
                                  {filteredProductImageLibrary.map((item) => (
                                    <button
                                      className={styles.coverLibraryItem}
                                      key={item.publicUrl}
                                      onClick={() => selectProductImage(item)}
                                      type="button"
                                    >
                                      <div className={styles.coverLibraryThumb}>
                                        <img
                                          alt={item.alt || item.filename}
                                          className={styles.coverLibraryPreview}
                                          loading="lazy"
                                          src={item.publicUrl}
                                        />
                                      </div>
                                      <div className={styles.coverLibraryMeta}>
                                        <strong>{item.filename}</strong>
                                        <span>{item.alt || 'No alt text yet'}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className={styles.muted}>No library images match that search yet.</p>
                              )}
                            </>
                          ) : (
                            <p className={styles.muted}>No media available yet. Upload an image first or use the media section.</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={styles.field}>
                      <ContentItemReferenceSelect
                        helperText="Picks from your Categories collection. Add or edit categories in the Categories tab."
                        label="Category"
                        onChange={(slug, item) => {
                          const label = item && typeof item.data?.name === 'string'
                            ? item.data.name
                            : slug
                          setProductDraft({ ...productDraft, categoryLabel: label, categorySlug: slug })
                        }}
                        targetType="category"
                        value={productDraft.categorySlug}
                      />
                    </div>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Overview</span>
                      <textarea value={productDraft.overview} onChange={(event) => setProductDraft({ ...productDraft, overview: event.target.value })} />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Best for</span>
                      <textarea
                        value={productBestForInput}
                        onChange={(event) => setProductDraft({ ...productDraft, bestFor: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })}
                        placeholder="One line per use case"
                      />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Spec notes</span>
                      <textarea
                        value={productSpecNotesInput}
                        onChange={(event) => setProductDraft({ ...productDraft, specNotes: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })}
                        placeholder="One line per note"
                      />
                    </label>
                    <div className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Product body</span>
                      <RichTextEditor value={productDraft.contentHtml} onChange={(value) => setProductDraft({ ...productDraft, contentHtml: value })} />
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => {
                        void setProductPublishedState(!productDraft.published)
                      }}
                      type="button"
                    >
                      {productDraft.published ? 'Archive Product' : 'Publish Product'}
                    </button>
                    <button className={styles.secondaryButton} onClick={discardProductDraft} type="button">Discard Product</button>
                    <button className={styles.primaryButton} onClick={() => { void saveProduct() }} type="button">Save Product</button>
                    <button className={styles.dangerButton} onClick={deleteProduct} type="button">Delete Product</button>
                  </div>
                </section>
              )}
            </section>
          )}

          {tab === 'media' && (
            <section className={styles.formStack}>
              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Upload</h2>
                </div>
                <form
                  className={styles.mediaUpload}
                  onSubmit={(event) => {
                    event.preventDefault()
                    const form = event.currentTarget
                    const fileInput = form.elements.namedItem('file') as HTMLInputElement | null
                    const sourceUrlInput = form.elements.namedItem('sourceUrl') as HTMLInputElement | null
                    const altInput = form.elements.namedItem('alt') as HTMLInputElement | null
                    const files = Array.from(fileInput?.files || [])
                    void uploadMedia({
                      alt: altInput?.value || '',
                      files,
                      sourceUrl: sourceUrlInput?.value || '',
                    }).then(() => form.reset())
                  }}
                >
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Upload files</span>
                      <input multiple name="file" type="file" />
                      <small className={styles.fieldHint}>Select one or more images/files from your computer.</small>
                    </label>
                    <label className={styles.field}>
                      <span>Or import from URL</span>
                      <input name="sourceUrl" placeholder="https://..." />
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Alt text</span>
                      <input name="alt" />
                    </label>
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.primaryButton} disabled={uploading} type="submit">
                      {uploading ? 'Uploading…' : 'Upload Media'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">Library</h2>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                    {media.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {media.map((item) => {
                    const isDeleting = deletingMediaId === item.id
                    return (
                      <article
                        className={cn(
                          'group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-cyan-400/30',
                          isDeleting && 'opacity-50',
                        )}
                        key={item.id}
                      >
                        <button
                          aria-label={`Edit alt text for ${item.filename}`}
                          className="block aspect-[4/3] overflow-hidden bg-white"
                          onClick={() => setMediaEditDraft({ alt: item.alt || '', id: item.id })}
                          type="button"
                        >
                          {item.publicUrl && (
                            <img
                              alt={item.alt || item.filename}
                              className="h-full w-full object-contain"
                              src={item.publicUrl}
                            />
                          )}
                        </button>

                        <div className="flex flex-1 flex-col gap-1 border-t border-border p-3">
                          <strong className="truncate text-sm font-semibold text-foreground" title={item.filename}>
                            {item.filename}
                          </strong>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {item.alt || 'No alt text yet'}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-1 border-t border-border bg-card/60 px-2 py-1.5">
                          <button
                            aria-label={`Edit alt text for ${item.filename}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            onClick={() => setMediaEditDraft({ alt: item.alt || '', id: item.id })}
                            type="button"
                          >
                            <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
                              <path d="m10.5 2.5 3 3-8 8H2.5v-3l8-8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                              <path d="m8.5 4.5 3 3" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </button>
                          <button
                            aria-label={`Delete ${item.filename}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                            disabled={isDeleting}
                            onClick={() => setMediaDeleteConfirm(item)}
                            type="button"
                          >
                            <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
                              <path d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4 4.5l.7 8.6a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                            </svg>
                          </button>
                        </div>
                      </article>
                    )
                  })}
                  {!media.length && (
                    <p className="col-span-full text-sm text-muted-foreground">No media uploaded yet.</p>
                  )}
                </div>
              </section>
            </section>
          )}

          {tab === 'integrations' && (
            <div className="space-y-6">
              {/* ── Google Account (OAuth) ──────────────────────────── */}
              <section className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">Google Account</h2>
                    <p className="text-sm text-muted-foreground">
                      Sign in with your own Google account (the one that already has access to your clients&apos; GA4 + Search Console). One sign-in covers both. The connection is only visible to super admins.
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                    analyticsSettings.hasGoogleOauthConnection
                      ? 'bg-cyan-400/15 text-cyan-200'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {analyticsSettings.hasGoogleOauthConnection ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                {analyticsSettings.hasGoogleOauthConnection ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-cyan-400/30 bg-cyan-400/5 p-4">
                    <div className="text-sm">
                      <div className="text-foreground">Connected as <strong>{analyticsSettings.googleOauthEmail || '(unknown email)'}</strong></div>
                      <div className="text-xs text-muted-foreground">Refresh token stored encrypted. Disconnect at any time.</div>
                    </div>
                    <Button onClick={() => { void disconnectGoogleAccount() }} size="sm" type="button" variant="outline">
                      Disconnect
                    </Button>
                  </div>
                ) : analyticsSettings.googleOauthClientSource === 'deployment' ? (
                  // Operator pre-provisioned the OAuth client via Cloudflare env vars.
                  // Skip the Client ID / Secret fields entirely — just show the button.
                  <div className="space-y-4">
                    <a
                      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                      href="/api/auth/google/start"
                    >
                      Connect Google account
                    </a>
                    <p className="text-xs text-muted-foreground">
                      You&apos;ll be redirected to Google to grant Clastro read access to GA4 and Search Console for whichever account you sign in with.
                    </p>
                  </div>
                ) : (
                  // First-time setup: admin pastes their own OAuth client.
                  // Surfaced only on starter forks where the operator hasn't set
                  // GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET via wrangler.
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">OAuth Client ID</span>
                        <input
                          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 font-mono text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setAnalyticsSettings((current) => ({ ...current, googleOauthClientId: event.target.value }))}
                          placeholder="e.g. 123456789-abc...apps.googleusercontent.com"
                          value={analyticsSettings.googleOauthClientId}
                        />
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">OAuth Client Secret</span>
                        <input
                          autoComplete="off"
                          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 font-mono text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setAnalyticsSettings((current) => ({ ...current, googleOauthClientSecretInput: event.target.value }))}
                          placeholder={analyticsSettings.hasGoogleOauthClientSecret ? '••••••••  (stored)' : 'GOCSPX-...'}
                          type="password"
                          value={analyticsSettings.googleOauthClientSecretInput}
                        />
                      </label>
                    </div>
                    {analyticsSettings.googleOauthRedirectUri && (
                      <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs">
                        <div className="font-medium text-foreground">When creating your OAuth Client ID in GCP, add this exact redirect URI:</div>
                        <code className="mt-1 block break-all font-mono text-foreground">{analyticsSettings.googleOauthRedirectUri}</code>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Create at console.cloud.google.com → APIs &amp; Services → Credentials → <strong>Create credentials → OAuth client ID → Web application</strong>. Tip: set the <code className="font-mono">GOOGLE_OAUTH_CLIENT_ID</code> + <code className="font-mono">GOOGLE_OAUTH_CLIENT_SECRET</code> Cloudflare bindings on this deployment to skip this UI entirely.
                    </p>
                    {analyticsSettings.googleOauthClientId && analyticsSettings.hasGoogleOauthClientSecret && (
                      <a
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                        href="/api/auth/google/start"
                      >
                        Connect Google account
                      </a>
                    )}
                  </div>
                )}
              </section>

              {/* ── Google Analytics 4 ──────────────────────────────── */}
              <section className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">Google Analytics 4</h2>
                    <p className="text-sm text-muted-foreground">
                      Sessions, active users, engagement, top pages, and top sources for the public site. Used to power the Dashboard.
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                    analyticsSettings.ga4PropertyId
                      ? 'bg-cyan-400/15 text-cyan-200'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {analyticsSettings.ga4PropertyId ? 'Configured' : 'Not configured'}
                  </span>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">GA4 Property</span>
                  {ga4PropertyList.length > 0 ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setAnalyticsSettings((current) => ({ ...current, ga4PropertyId: event.target.value }))}
                      value={analyticsSettings.ga4PropertyId}
                    >
                      <option value="">— Select a property —</option>
                      {ga4PropertyList.map((entry) => (
                        <option key={entry.propertyId} value={entry.propertyId}>
                          {entry.accountDisplayName} → {entry.displayName} ({entry.propertyId})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setAnalyticsSettings((current) => ({ ...current, ga4PropertyId: event.target.value }))}
                      placeholder="e.g. 312345678"
                      value={analyticsSettings.ga4PropertyId}
                    />
                  )}
                  <small className="text-xs text-muted-foreground">
                    {ga4PropertyList.length > 0
                      ? 'Pick the GA4 property that powers this site\'s dashboard.'
                      : loadingPropertyLists
                      ? 'Loading properties from Google…'
                      : 'Connect a Google account above to populate this dropdown, or type a numeric property ID.'}
                  </small>
                </label>
              </section>

              {/* ── Google Search Console ───────────────────────────── */}
              <section className="space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">Google Search Console</h2>
                    <p className="text-sm text-muted-foreground">
                      Top queries, clicks, impressions, CTR, and average position from organic search.
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                    analyticsSettings.gscSiteUrl
                      ? 'bg-cyan-400/15 text-cyan-200'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {analyticsSettings.gscSiteUrl ? 'Configured' : 'Not configured'}
                  </span>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Search Console site</span>
                  {gscSiteList.length > 0 ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setAnalyticsSettings((current) => ({ ...current, gscSiteUrl: event.target.value }))}
                      value={analyticsSettings.gscSiteUrl}
                    >
                      <option value="">— Select a site —</option>
                      {gscSiteList.map((entry) => (
                        <option key={entry.siteUrl} value={entry.siteUrl}>
                          {entry.siteUrl} ({entry.permissionLevel.replace(/^site/, '').toLowerCase()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setAnalyticsSettings((current) => ({ ...current, gscSiteUrl: event.target.value }))}
                      placeholder="sc-domain:example.com   or   https://www.example.com/"
                      value={analyticsSettings.gscSiteUrl}
                    />
                  )}
                  <small className="text-xs text-muted-foreground">
                    {gscSiteList.length > 0
                      ? 'Pick the Search Console property that powers this site\'s dashboard.'
                      : loadingPropertyLists
                      ? 'Loading sites from Google…'
                      : 'Connect a Google account above to populate this dropdown, or type the property identifier.'}
                  </small>
                </label>
              </section>

              {/* ── Service account (fallback) ──────────────────────── */}
              <details className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Advanced: use a service account instead
                </summary>
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Use a Google service-account JSON key as a fallback / unattended auth method. Note: Search Console&apos;s &quot;Add user&quot; UI is hostile to service-account emails; the OAuth flow above is the recommended path.
                  </p>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Service account JSON</span>
                    <textarea
                      autoComplete="off"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-card px-3 py-2 font-mono text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => setAnalyticsSettings((current) => ({ ...current, ga4ServiceAccountJsonInput: event.target.value }))}
                      placeholder={analyticsSettings.hasGa4ServiceAccount ? '••••••••  (stored)' : 'Paste the entire service-account JSON key here'}
                      value={analyticsSettings.ga4ServiceAccountJsonInput}
                    />
                    <small className="text-xs text-muted-foreground">
                      JSON is stored encrypted. OAuth (above) takes precedence when both are configured.
                    </small>
                  </label>
                </div>
              </details>
            </div>
          )}

          {tab === 'email' && (
            <div className="grid gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
              {/* Settings column */}
              <section className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">Resend</h2>
                  <p className="text-sm text-muted-foreground">Configure outbound email via Resend. The API key is stored encrypted.</p>
                </div>

                <div className="space-y-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Resend API key</span>
                    <input
                      autoComplete="off"
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setEmailSettings((current) => ({ ...current, resendApiKeyInput: event.target.value }))}
                      placeholder={emailSettings.hasResendApiKey ? '••••••••  (stored)' : 're_…'}
                      type="password"
                      value={emailSettings.resendApiKeyInput}
                    />
                    <p className="text-xs text-muted-foreground">
                      {emailSettings.hasResendApiKey
                        ? 'A key is stored. Enter a new one only if you want to rotate it.'
                        : 'Find your key at resend.com → API Keys.'}
                    </p>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">From address</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setEmailSettings((current) => ({ ...current, fromEmail: event.target.value }))}
                      placeholder="noreply@yoursite.com"
                      type="email"
                      value={emailSettings.fromEmail}
                    />
                    <p className="text-xs text-muted-foreground">Must be on a domain verified in Resend.</p>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">From name (optional)</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setEmailSettings((current) => ({ ...current, fromName: event.target.value }))}
                      placeholder="Your Site"
                      value={emailSettings.fromName}
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Notify on new submission</span>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setEmailSettings((current) => ({ ...current, notificationEmail: event.target.value }))}
                      placeholder="you@example.com"
                      type="email"
                      value={emailSettings.notificationEmail}
                    />
                    <p className="text-xs text-muted-foreground">When a form is submitted, send a notification to this address. Leave blank to skip.</p>
                  </label>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
                  <p className="mb-2 font-semibold text-foreground">Public endpoint</p>
                  <code className="block break-all font-mono text-foreground">POST /api/forms/contact</code>
                  <p className="mt-2">Accepts JSON or form-data with <code className="font-mono">name</code>, <code className="font-mono">email</code>, <code className="font-mono">subject</code>, <code className="font-mono">message</code>. Replace <code className="font-mono">contact</code> in the URL to capture other form types (e.g. <code className="font-mono">/api/forms/quote</code>).</p>
                </div>
              </section>

              {/* Submissions column */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">Inbox</h2>
                    <p className="text-sm text-muted-foreground">Form submissions captured from the public site.</p>
                  </div>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                    {formSubmissions.filter((entry) => !entry.archived).length}
                  </span>
                </div>

                {!formSubmissions.length ? (
                  <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    No submissions yet. When a form on your public site posts to <code className="font-mono">/api/forms/contact</code>, the message will appear here.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Received</th>
                          <th className="px-3 py-2 text-left font-medium">From</th>
                          <th className="px-3 py-2 text-left font-medium">Subject</th>
                          <th className="px-3 py-2 text-left font-medium">Type</th>
                          <th className="px-3 py-2 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formSubmissions.map((entry) => (
                          <tr
                            className={cn(
                              'border-t border-border transition-colors',
                              entry.archived ? 'bg-muted/30 text-muted-foreground' : 'hover:bg-accent/40',
                            )}
                            key={entry.id}
                          >
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {entry.createdAt ? new Date(entry.createdAt + 'Z').toLocaleString() : '—'}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                className="text-left text-sm font-medium text-foreground hover:underline"
                                onClick={() => setActiveSubmission(entry)}
                                type="button"
                              >
                                {entry.name || entry.email || '(no name)'}
                              </button>
                              {entry.email && <div className="text-xs text-muted-foreground">{entry.email}</div>}
                            </td>
                            <td className="px-3 py-2 text-sm text-foreground">
                              <button
                                className="text-left hover:underline"
                                onClick={() => setActiveSubmission(entry)}
                                type="button"
                              >
                                {entry.subject || <span className="text-muted-foreground italic">(no subject)</span>}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline">{entry.formType}</Badge>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-1">
                                <button
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                  onClick={() => { void archiveSubmission(entry, !entry.archived) }}
                                  title={entry.archived ? 'Restore' : 'Archive'}
                                  type="button"
                                >
                                  {entry.archived ? '↶' : '✓'}
                                </button>
                                <button
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setSubmissionDeleteConfirm(entry)}
                                  title="Delete"
                                  type="button"
                                >
                                  <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
                                    <path d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M4 4.5l.7 8.6a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {isContentItemTab(tab) && (() => {
            const typeSlug = contentTypeSlugFromTab(tab)
            const def = CONTENT_TYPE_DEFINITIONS.find((entry) => entry.slug === typeSlug)
            if (!def) {
              return (
                <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                  Unknown content type <strong className="font-semibold text-foreground">{typeSlug}</strong>.
                </div>
              )
            }

            const items = contentItemsByType[typeSlug] || []
            const titleField = def.titleField || 'name'
            const normalizedQuery = contentItemListQuery.trim().toLowerCase()
            const visibleItems = !normalizedQuery
              ? items
              : items.filter((entry) => {
                  const haystack = [
                    entry.slug,
                    String(entry.data?.[titleField] || ''),
                    ...def.fields.map((field) => String(entry.data?.[field.name] || '')),
                  ].join(' ').toLowerCase()
                  return haystack.includes(normalizedQuery)
                })

            function updateDraftField(fieldName: string, value: unknown) {
              setContentItemDraft((current) => {
                if (!current) {
                  return current
                }
                const nextData = { ...current.data, [fieldName]: value }
                const next: typeof current = { ...current, data: nextData }
                if (fieldName === titleField && current.isNew) {
                  const previousName = String(current.data[titleField] || '')
                  const autoFromPrevious = slugify(previousName)
                  // Keep syncing as long as the slug still matches what was auto-derived
                  // from the previous name (or the slug is empty). Once the user types
                  // anything else into the slug field manually, stop auto-syncing.
                  if (!current.slug || current.slug === autoFromPrevious) {
                    next.slug = slugify(String(value || ''))
                  }
                }
                return next
              })
            }

            const draftBelongsToThisType = contentItemDraft && contentItemDraft.type === typeSlug

            return (
              <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                {/* LIST PANE */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold tracking-tight text-foreground">All {def.labelPlural}</h2>
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                      {items.length}
                    </span>
                  </div>

                  <div className="relative">
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 16 16"
                    >
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="m11 11 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                    </svg>
                    <input
                      className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onChange={(event) => setContentItemListQuery(event.target.value)}
                      placeholder={`Search ${def.labelPlural.toLowerCase()}`}
                      type="search"
                      value={contentItemListQuery}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {visibleItems.map((entry) => {
                      const isActive = activeContentItemSlug === entry.slug && !contentItemDraft?.isNew
                      const title = String(entry.data?.[titleField] || entry.slug || '(untitled)')
                      return (
                        <button
                          className={cn(
                            'flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition-all',
                            isActive
                              ? 'border-cyan-400/40 bg-accent/60 text-foreground'
                              : 'border-border bg-card text-foreground hover:border-cyan-400/30 hover:bg-accent/40',
                          )}
                          key={entry.id}
                          onClick={() => setActiveContentItemSlug(entry.slug)}
                          type="button"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{title}</span>
                            <span className="block truncate text-xs text-muted-foreground">/{entry.slug}</span>
                          </span>
                          <Badge variant={entry.published ? 'accent' : 'muted'}>
                            {entry.published ? 'Published' : 'Draft'}
                          </Badge>
                        </button>
                      )
                    })}
                    {!visibleItems.length && !items.length && (
                      <p className="text-sm text-muted-foreground">
                        No {def.labelPlural.toLowerCase()} yet. Click <strong className="font-semibold text-foreground">Add {def.label}</strong> to create one.
                      </p>
                    )}
                    {!visibleItems.length && items.length > 0 && (
                      <p className="text-sm text-muted-foreground">No matches for that search.</p>
                    )}
                  </div>
                </section>

                {/* EDITOR PANE */}
                {draftBelongsToThisType && contentItemDraft ? (
                  <section className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="min-w-0 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {contentItemDraft.isNew ? `New ${def.label}` : `Editing ${def.label}`}
                        </p>
                        <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                          {String(contentItemDraft.data[titleField] || `New ${def.label}`)}
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm">
                          <input
                            checked={contentItemDraft.published}
                            onChange={(event) => setContentItemDraft((current) => current && { ...current, published: event.target.checked })}
                            type="checkbox"
                          />
                          <span className="text-foreground">Published</span>
                        </label>
                        {!contentItemDraft.isNew && (
                          <Button
                            onClick={() => setContentItemDeleteConfirm({
                              slug: contentItemDraft.originalSlug,
                              title: String(contentItemDraft.data[titleField] || contentItemDraft.originalSlug),
                              type: contentItemDraft.type,
                            })}
                            size="sm"
                            type="button"
                            variant="destructive"
                          >
                            Delete
                          </Button>
                        )}
                        <Button
                          disabled={savingContentItem}
                          onClick={() => { void saveContentItem() }}
                          size="sm"
                          type="button"
                        >
                          {savingContentItem ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {def.fields.map((field) => (
                        <ContentItemFieldEditor
                          field={field}
                          isNew={contentItemDraft.isNew}
                          key={field.name}
                          onChange={(value) => updateDraftField(field.name, value)}
                          slug={contentItemDraft.slug}
                          updateSlug={(nextSlug) => setContentItemDraft((current) => current && { ...current, slug: nextSlug })}
                          value={contentItemDraft.data[field.name]}
                        />
                      ))}
                    </div>
                  </section>
                ) : (
                  <section className="flex min-h-[16rem] items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    {items.length
                      ? `Select a ${def.label.toLowerCase()} from the list, or click "Add ${def.label}" to create one.`
                      : `No ${def.labelPlural.toLowerCase()} yet — click "Add ${def.label}" up top to create your first.`}
                  </section>
                )}
              </section>
            )
          })()}
          </div>
        </main>
      </div>

      {mediaEditDraft && (() => {
        const editingItem = media.find((entry) => entry.id === mediaEditDraft.id)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => { if (!savingMediaAlt) { setMediaEditDraft(null) } }}
            role="presentation"
          >
            <div
              aria-labelledby="edit-media-alt-title"
              aria-modal="true"
              className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="space-y-1 border-b border-border p-5">
                <h2 className="text-base font-semibold tracking-tight text-foreground" id="edit-media-alt-title">
                  Edit alt text
                </h2>
                <p className="truncate text-xs text-muted-foreground" title={editingItem?.filename}>
                  {editingItem?.filename}
                </p>
              </div>

              {editingItem?.publicUrl && (
                <div className="flex max-h-48 items-center justify-center overflow-hidden border-b border-border bg-white">
                  <img
                    alt={mediaEditDraft.alt || editingItem.filename}
                    className="max-h-48 w-full object-contain"
                    src={editingItem.publicUrl}
                  />
                </div>
              )}

              <div className="space-y-2 p-5">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Alt text</span>
                  <textarea
                    autoFocus
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onChange={(event) => setMediaEditDraft({ ...mediaEditDraft, alt: event.target.value })}
                    placeholder="Describe the image for accessibility and SEO"
                    value={mediaEditDraft.alt}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border p-4">
                <Button
                  disabled={savingMediaAlt}
                  onClick={() => setMediaEditDraft(null)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={savingMediaAlt}
                  onClick={() => { void saveMediaAlt() }}
                  size="sm"
                  type="button"
                >
                  {savingMediaAlt ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {activeSubmission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setActiveSubmission(null)}
          role="presentation"
        >
          <div
            aria-labelledby="submission-view-title"
            aria-modal="true"
            className="w-full max-w-2xl rounded-xl border border-border bg-card text-card-foreground shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="space-y-1 border-b border-border p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                  {activeSubmission.formType} submission
                </p>
                <span className="text-xs text-muted-foreground">
                  {activeSubmission.createdAt ? new Date(activeSubmission.createdAt + 'Z').toLocaleString() : ''}
                </span>
              </div>
              <h2 className="text-base font-semibold tracking-tight text-foreground" id="submission-view-title">
                {activeSubmission.subject || '(no subject)'}
              </h2>
              <p className="text-sm text-muted-foreground">
                From <strong className="font-semibold text-foreground">{activeSubmission.name || '(no name)'}</strong>
                {activeSubmission.email && (
                  <>
                    {' '}&middot;{' '}
                    <a className="text-primary hover:underline" href={`mailto:${activeSubmission.email}`}>
                      {activeSubmission.email}
                    </a>
                  </>
                )}
              </p>
              {activeSubmission.sourcePath && (
                <p className="truncate text-xs text-muted-foreground">Source: {activeSubmission.sourcePath}</p>
              )}
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-5">
              <pre className="whitespace-pre-wrap break-words text-sm text-foreground">{activeSubmission.message || '(no message)'}</pre>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border p-4">
              <Button
                onClick={() => { void archiveSubmission(activeSubmission, !activeSubmission.archived) }}
                size="sm"
                type="button"
                variant="outline"
              >
                {activeSubmission.archived ? 'Restore' : 'Archive'}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSubmissionDeleteConfirm(activeSubmission)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  Delete
                </Button>
                <Button
                  onClick={() => setActiveSubmission(null)}
                  size="sm"
                  type="button"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {submissionDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSubmissionDeleteConfirm(null)}
          role="presentation"
        >
          <div
            aria-labelledby="delete-submission-title"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="space-y-1 border-b border-border p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-destructive">Delete submission</p>
              <h2 className="text-base font-semibold tracking-tight text-foreground" id="delete-submission-title">
                Delete this submission?
              </h2>
              <p className="text-sm text-muted-foreground">
                The submission from {submissionDeleteConfirm.name || submissionDeleteConfirm.email || 'this contact'} will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border p-4">
              <Button onClick={() => setSubmissionDeleteConfirm(null)} size="sm" type="button" variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => { void deleteSubmission(submissionDeleteConfirm) }}
                size="sm"
                type="button"
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {contentItemDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setContentItemDeleteConfirm(null)}
          role="presentation"
        >
          <div
            aria-labelledby="delete-content-item-title"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="space-y-1 border-b border-border p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-destructive">Delete item</p>
              <h2 className="text-base font-semibold tracking-tight text-foreground" id="delete-content-item-title">
                Delete &ldquo;{contentItemDeleteConfirm.title}&rdquo;?
              </h2>
              <p className="text-sm text-muted-foreground">
                This removes the item from this collection. Pages or products that reference it may need to be updated. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border p-4">
              <Button
                onClick={() => setContentItemDeleteConfirm(null)}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => { void deleteContentItemRecord(contentItemDeleteConfirm.type, contentItemDeleteConfirm.slug) }}
                size="sm"
                type="button"
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {mediaDeleteConfirm && (() => {
        const deletingThis = deletingMediaId === mediaDeleteConfirm.id
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => { if (!deletingThis) { setMediaDeleteConfirm(null) } }}
            role="presentation"
          >
            <div
              aria-labelledby="delete-media-title"
              aria-modal="true"
              className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="space-y-1 border-b border-border p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-destructive">Delete media</p>
                <h2 className="text-base font-semibold tracking-tight text-foreground" id="delete-media-title">
                  Delete &ldquo;{mediaDeleteConfirm.filename}&rdquo;?
                </h2>
                <p className="text-sm text-muted-foreground">
                  This removes the file from the media library and storage. References in posts or products that still point to this file will break. This cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border p-4">
                <Button
                  disabled={deletingThis}
                  onClick={() => setMediaDeleteConfirm(null)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={deletingThis}
                  onClick={() => { void deleteMediaItem(mediaDeleteConfirm) }}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  {deletingThis ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {unsavedProductDialog && (
        <div className={styles.modalOverlay} role="presentation">
          <div
            aria-labelledby="unsaved-product-dialog-title"
            aria-modal="true"
            className={styles.modalCard}
            role="dialog"
          >
            <p className={styles.modalEyebrow}>Unsaved Product Changes</p>
            <h2 className={styles.modalTitle} id="unsaved-product-dialog-title">Save before you continue?</h2>
            <p className={styles.modalText}>
              This product has changes that haven&apos;t been saved yet. You can save them before you {unsavedProductDialog.actionLabel}, discard them, or keep editing.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} onClick={() => resolveUnsavedProductDialog('cancel')} type="button">
                Keep Editing
              </button>
              <button className={styles.dangerButton} onClick={() => resolveUnsavedProductDialog('discard')} type="button">
                Discard Changes
              </button>
              <button className={styles.primaryButton} onClick={() => resolveUnsavedProductDialog('save')} type="button">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
