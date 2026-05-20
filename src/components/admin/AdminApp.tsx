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
    <svg className={styles.statIcon} fill="none" viewBox="0 0 20 20">
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

function IconTrashSmall() {
  return (
    <svg fill="none" viewBox="0 0 16 16">
      <path d="M2.8 4.1h10.4M6.2 1.9h3.6m-5.8 2.2.5 8a1.2 1.2 0 0 0 1.2 1.1h4.6a1.2 1.2 0 0 0 1.2-1.1l.5-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
      <path d="M6.5 6.2v4.1m3-4.1v4.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </svg>
  )
}

const NAV_ICONS: Record<TabKey, ReactNode> = {
  ai: <IconAi />,
  dashboard: <IconDashboard />,
  linkedin: <IconLinkedIn />,
  pages: <IconPages />,
  posts: <IconPosts />,
  products: <IconProducts />,
  media: <IconMedia />,
  settings: <IconSettings />,
  users: <IconUsers />,
}

type User = {
  email: string
  id: string
  name: string
  role: UserRole
}

type UserRole = CmsRole

type Settings = {
  booking: unknown
  contactEmail: string
  contactPhone: string
  defaultOgImage: string
  footer: unknown
  navigation: unknown
  siteName: string
  siteUrl: string
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
  airconType: string
  bestFor: string[]
  brochureHref: string
  brochureLabel: string
  categoryLabel: string
  categorySlug: string
  contentHtml: string
  coolingKw: number
  familyCode: string
  familyName: string
  heroImageAlt?: string
  heroImageUrl: string
  heatingKw: number
  installSummary: string
  installationCost: string
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
  publicUrl: string
  sourceUrl?: string
}

type FeatureFlags = {
  showAiDashboard: boolean
  showBlog: boolean
}

type ManagedUserRecord = {
  createdAt: string
  email: string
  id: string
  name: string
  role: UserRole
  updatedAt: string
}

type UserInvitationRecord = {
  acceptedAt?: string
  createdAt: string
  email: string
  expiresAt: string
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

type TabKey = 'dashboard' | 'settings' | 'ai' | 'linkedin' | 'pages' | 'posts' | 'products' | 'media' | 'users'
type PostListSort = 'recent' | 'title-asc' | 'title-desc' | 'published'
type ProductListSort = 'title-asc' | 'title-desc' | 'category' | 'published'
type UnsavedProductExitChoice = 'cancel' | 'discard' | 'save'

const PRODUCT_TYPE_OPTIONS = [
  {
    value: 'service',
    label: 'Service',
    categorySlug: 'services',
    categoryLabel: 'Services',
  },
  {
    value: 'package',
    label: 'Package',
    categorySlug: 'packages',
    categoryLabel: 'Packages',
  },
  {
    value: 'resource',
    label: 'Resource',
    categorySlug: 'resources',
    categoryLabel: 'Resources',
  },
  {
    value: 'demo',
    label: 'Demo',
    categorySlug: 'demo',
    categoryLabel: 'Demo',
  },
] as const

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
    label: 'Content',
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
      {
        key: 'products',
        label: 'Products',
        description: 'Repeatable demo records',
      },
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
        description: 'Shared SEO and structure data',
      },
    ],
  },
]

const TAB_META: Record<TabKey, { description: string; title: string }> = {
  ai: {
    title: 'AI Settings',
    description: 'Configure provider access, reusable prompts, and AI-assisted content workflows.',
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Overview of content, media, and shared site configuration.',
  },
  linkedin: {
    title: 'LinkedIn',
    description: 'Connect each client LinkedIn account and manage publish access.',
  },
  settings: {
    title: 'Site Settings',
    description: 'Shared settings used across navigation, footer, booking, and SEO defaults.',
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

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function parseJson(value: string, label: string) {
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`Invalid JSON for ${label}.`)
  }
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
    primaryCategory: 'CMS',
    categories: [],
  }
}

function applyProductTypeToDraft(product: ProductRecord, airconType: string): ProductRecord {
  const selectedType = PRODUCT_TYPE_OPTIONS.find((option) => option.value === airconType)

  if (!selectedType) {
    return product
  }

  return {
    ...product,
    airconType: selectedType.value,
    categorySlug: selectedType.categorySlug,
    categoryLabel: selectedType.categoryLabel,
  }
}

function createBlankProductDraft(): ProductRecord {
  return {
    slug: '',
    name: '',
    price: undefined,
    priceLabel: '',
    productImages: [],
    coolingKw: 0,
    heatingKw: 0,
    heroImageUrl: '',
    heroImageAlt: '',
    shortDescription: '',
    installationCost: 'demo-only',
    isFrontPage: false,
    airconType: 'service',
    metaTitle: '',
    metaDescription: '',
    familyCode: '',
    familyName: '',
    categorySlug: 'services',
    categoryLabel: 'Services',
    installSummary: 'Demo implementation notes',
    brochureLabel: '',
    brochureHref: '',
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
  const [status, setStatus] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    showAiDashboard: false,
    showBlog: false,
  })
  const [featureFlagsDraft, setFeatureFlagsDraft] = useState<FeatureFlags>({
    showAiDashboard: false,
    showBlog: false,
  })

  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsDraft, setSettingsDraft] = useState({
    bookingJson: '',
    contactEmail: '',
    contactPhone: '',
    defaultOgImage: '',
    footerJson: '',
    navigationJson: '',
    siteName: '',
    siteUrl: '',
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
  const [postListQuery, setPostListQuery] = useState('')
  const [postListSort, setPostListSort] = useState<PostListSort>('recent')
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [activeProductSlug, setActiveProductSlug] = useState('')
  const [productDraft, setProductDraft] = useState<ProductRecord | null>(null)
  const [managedUsers, setManagedUsers] = useState<ManagedUserRecord[]>([])
  const [userInvitations, setUserInvitations] = useState<UserInvitationRecord[]>([])
  const [creatingInvitation, setCreatingInvitation] = useState(false)
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('')
  const [deletingUserId, setDeletingUserId] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState('')
  const [inviteDraft, setInviteDraft] = useState({
    email: '',
    name: '',
    role: 'editor' as UserRole,
  })
  const [productImageLibraryOpen, setProductImageLibraryOpen] = useState(false)
  const [productImageLibraryQuery, setProductImageLibraryQuery] = useState('')
  const [productListQuery, setProductListQuery] = useState('')
  const [productListSort, setProductListSort] = useState<ProductListSort>('category')
  const draggedProductImageIndex = useRef<number | null>(null)
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
  const [sharingToLinkedIn, setSharingToLinkedIn] = useState(false)
  const [unsavedProductDialog, setUnsavedProductDialog] = useState<{ actionLabel: string } | null>(null)
  const unsavedProductDialogResolver = useRef<((choice: UnsavedProductExitChoice) => void) | null>(null)
  const canManageUsers = canManageCmsUsers(user.role)
  const inviteRoleOptions = assignableRolesFor(user.role)
  const canViewAi = isSuperAdmin || featureFlags.showAiDashboard
  const canViewBlog = isSuperAdmin || featureFlags.showBlog
  const canUseAiBlogBuilder = isSuperAdmin || (featureFlags.showAiDashboard && featureFlags.showBlog)
  const allowedTabs = new Set<TabKey>([
    'dashboard',
    'settings',
    'pages',
    'products',
    'media',
    ...(canViewBlog ? (['posts'] as TabKey[]) : []),
    ...(canViewAi ? (['ai'] as TabKey[]) : []),
    ...(canManageUsers ? (['users'] as TabKey[]) : []),
    ...(isSuperAdmin ? (['linkedin'] as TabKey[]) : []),
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
        defaultOgImage: nextSettings.defaultOgImage || '',
        contactEmail: nextSettings.contactEmail || '',
        contactPhone: nextSettings.contactPhone || '',
        navigationJson: prettyJson(nextSettings.navigation),
        footerJson: prettyJson(nextSettings.footer),
        bookingJson: prettyJson(nextSettings.booking),
      })
    }

    if (featureFlagsResponse.ok) {
      const nextFeatureFlags = (await featureFlagsResponse.json()) as FeatureFlags
      setFeatureFlags(nextFeatureFlags)
      setFeatureFlagsDraft(nextFeatureFlags)
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
      const payload: Settings = {
        siteName: settingsDraft.siteName,
        siteUrl: settingsDraft.siteUrl,
        defaultOgImage: settingsDraft.defaultOgImage,
        contactEmail: settingsDraft.contactEmail,
        contactPhone: settingsDraft.contactPhone,
        navigation: parseJson(settingsDraft.navigationJson, 'navigation'),
        footer: parseJson(settingsDraft.footerJson, 'footer'),
        booking: parseJson(settingsDraft.bookingJson, 'booking'),
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

  async function saveFeatureFlags() {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(featureFlagsDraft),
      })

      if (!response.ok) {
        throw new Error('Failed to save feature visibility.')
      }

      setFeatureFlags(featureFlagsDraft)
      setStatus({ kind: 'info', text: 'Feature visibility saved.' })
      await loadAll()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to save feature visibility.' })
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

      const result = (await response.json()) as { filename?: string; publicUrl?: string }
      const url = result.publicUrl || `/api/media/file/${result.filename}`

      setPostDraft({ ...postDraft, coverImageAlt: alt, coverImageUrl: url })
      setMedia((current) => [
        {
          alt,
          filename: result.filename || file.name,
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
      const canLeave = await confirmProductDraftExit(`go to ${TAB_META[nextTab].title}`)
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

        const result = (await response.json()) as { filename?: string; publicUrl?: string }
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

  async function uploadMedia(formData: FormData) {
    setUploading(true)
    setStatus(null)

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload media.')
      }

      setStatus({ kind: 'info', text: 'Media uploaded.' })
      await loadAll()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to upload media.' })
    } finally {
      setUploading(false)
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
          name,
          role: inviteDraft.role,
        }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string; inviteUrl?: string } | null

      if (!response.ok || !payload?.inviteUrl) {
        throw new Error(payload?.error || 'Failed to create invite link.')
      }

      setGeneratedInviteUrl(payload.inviteUrl)
      setInviteDraft({
        email: '',
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

      setStatus({ kind: 'info', text: 'Invite revoked.' })
      await loadUsers()
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Failed to revoke invite.' })
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

  const currentMeta = TAB_META[tab]
  const staticPages = pages.filter((page) => !page.slug.startsWith('blog'))
  const pageStylesheetsInput = pageDraft ? pageDraft.stylesheets.join('\n') : ''
  const postCategoriesInput = postDraft ? postDraft.categories.map((entry) => entry.label).join(', ') : ''
  const productBestForInput = productDraft ? productDraft.bestFor.join('\n') : ''
  const productSpecNotesInput = productDraft ? productDraft.specNotes.join('\n') : ''
  const draftLoadingMessages = getAiDraftLoadingMessages(aiPostBuilder.generateImage)
  const activeDraftLoadingMessage = draftLoadingMessages[draftLoadingMessageIndex] || draftLoadingMessages[0]
  const normalizedPostQuery = postListQuery.trim().toLowerCase()
  const normalizedProductQuery = productListQuery.trim().toLowerCase()
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
        product.familyName,
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
    <div className={styles.app}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brandBlock}>
            <img alt="Clastro CMS" className={styles.brandLogo} src="/images/clastro-logo.svg" />
          </div>

          <nav className={styles.nav}>
            {navSections.map((section) => (
              <div className={styles.navGroup} key={section.label}>
                <div className={styles.navGroupLabel}>{section.label}</div>
                <div className={styles.navGroupItems}>
                  {section.items.map((entry) => (
                    <button
                      className={[styles.navButton, tab === entry.key ? styles.navButtonActive : ''].join(' ')}
                      key={entry.key}
                      onClick={() => { void handleTabChange(entry.key) }}
                      type="button"
                    >
                      {NAV_ICONS[entry.key]}
                      <div className={styles.navButtonText}>
                        <span className={styles.navButtonTitle}>{entry.label}</span>
                        <span className={styles.navButtonMeta}>{entry.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.userCard}>
              <strong>{user.name}</strong>
              <span className={styles.userEmail} title={user.email}>{user.email}</span>
              <span className={styles.userRole}>{formatUserRole(user.role)} access</span>
            </div>
            <button className={styles.logoutButton} onClick={logout} type="button">Log out</button>
          </div>
        </aside>

        <main className={styles.content}>
          <header className={styles.topbar}>
            <div>
              <h1 className={styles.pageTitle}>{currentMeta.title}</h1>
              <p className={styles.pageDescription}>{currentMeta.description}</p>
            </div>

            <div className={styles.topbarActions}>
            {tab === 'dashboard' && (
              <a
                className={styles.secondaryButton}
                href="/"
                target="_blank"
                rel="noreferrer"
              >
                View Website
              </a>
            )}
            <a className={styles.secondaryButton} href="/admin/edit">
              Edit Website
            </a>
            {tab === 'ai' && canViewAi && (
              <button className={styles.primaryButton} onClick={saveAiSettings} type="button">Save AI Settings</button>
            )}
            {tab === 'settings' && (
              <button className={styles.primaryButton} onClick={saveSettings} type="button">Save Settings</button>
            )}
            {tab === 'posts' && canViewBlog && (
              <>
                {canUseAiBlogBuilder && (
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      setAiPostBuilder((current) => ({ ...current, open: !current.open }))
                    }}
                    type="button"
                  >
                    AI Blog Post
                  </button>
                )}
                <button
                  className={styles.primaryButton}
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
                  type="button"
                >
                  Add Post
                </button>
              </>
            )}
            {tab === 'products' && (
              <button
                className={styles.primaryButton}
                onClick={() => { void handleAddProduct() }}
                type="button"
              >
                Add Product
              </button>
            )}
            </div>
          </header>

          {status && (
            <div className={[styles.status, status.kind === 'error' ? styles.statusError : styles.statusInfo].join(' ')}>
              {status.text}
            </div>
          )}

          {tab === 'dashboard' && (
            <section className={styles.dashboard}>
              <div className={styles.statGrid}>
                {stats.map((item) => (
                  <article className={styles.statCard} key={item.label}>
                    <div className={styles.statIcon}>{item.icon}</div>
                    <span className={styles.statLabel}>{item.label}</span>
                    <strong className={styles.statValue}>{item.value}</strong>
                    <span className={styles.statMeta}>{item.detail}</span>
                  </article>
                ))}
              </div>

              <div className={styles.dashboardGrid}>
                <section className={styles.sectionCard}>
                  <div className={styles.sectionCardHeader}>
                    <h2>Quick Actions</h2>
                  </div>
                  <div className={styles.quickActions}>
                    <button className={styles.quickAction} onClick={() => { void handleTabChange('pages') }} type="button">
                      <div className={styles.quickActionIcon}><IconPages /></div>
                      <div className={styles.quickActionBody}>
                        <strong>Edit Pages</strong>
                        <span>Update existing page copy with the WYSIWYG editor.</span>
                      </div>
                      <IconArrowRight />
                    </button>
                    <a className={styles.quickAction} href="/admin/edit">
                      <div className={styles.quickActionIcon}><IconPosts /></div>
                      <div className={styles.quickActionBody}>
                        <strong>Launch Live Editor</strong>
                        <span>Open the visual page editor with live preview.</span>
                      </div>
                      <IconArrowRight />
                    </a>
                    {canViewBlog && (
                      <button className={styles.quickAction} onClick={() => { void handleTabChange('posts') }} type="button">
                        <div className={styles.quickActionIcon}><IconPosts /></div>
                        <div className={styles.quickActionBody}>
                          <strong>Manage Blog</strong>
                          <span>Create or revise blog posts and metadata.</span>
                        </div>
                        <IconArrowRight />
                      </button>
                    )}
                    <button className={styles.quickAction} onClick={() => { void handleTabChange('products') }} type="button">
                      <div className={styles.quickActionIcon}><IconProducts /></div>
                      <div className={styles.quickActionBody}>
                        <strong>Manage Products</strong>
                        <span>Edit demo products, specs, pricing, and long-form copy.</span>
                      </div>
                      <IconArrowRight />
                    </button>
                    <button className={styles.quickAction} onClick={() => { void handleTabChange('media') }} type="button">
                      <div className={styles.quickActionIcon}><IconMedia /></div>
                      <div className={styles.quickActionBody}>
                        <strong>Media Library</strong>
                        <span>Upload assets and manage image URLs.</span>
                      </div>
                      <IconArrowRight />
                    </button>
                    <button className={styles.quickAction} onClick={() => { void handleTabChange('settings') }} type="button">
                      <div className={styles.quickActionIcon}><IconSettings /></div>
                      <div className={styles.quickActionBody}>
                        <strong>Site Settings</strong>
                        <span>Navigation, footer, booking, and SEO defaults.</span>
                      </div>
                      <IconArrowRight />
                    </button>
                    {canViewAi && (
                      <button className={styles.quickAction} onClick={() => { void handleTabChange('ai') }} type="button">
                        <div className={styles.quickActionIcon}><IconAi /></div>
                        <div className={styles.quickActionBody}>
                          <strong>AI Settings</strong>
                          <span>API keys, prompts, and automation defaults.</span>
                        </div>
                        <IconArrowRight />
                      </button>
                    )}
                    {canManageUsers && (
                      <button className={styles.quickAction} onClick={() => { void handleTabChange('users') }} type="button">
                        <div className={styles.quickActionIcon}><IconUsers /></div>
                        <div className={styles.quickActionBody}>
                          <strong>Manage Users</strong>
                          <span>Create invite links and control who can edit this site.</span>
                        </div>
                        <IconArrowRight />
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button className={styles.quickAction} onClick={() => { void handleTabChange('linkedin') }} type="button">
                        <div className={styles.quickActionIcon}><IconLinkedIn /></div>
                        <div className={styles.quickActionBody}>
                          <strong>LinkedIn</strong>
                          <span>Store app credentials and publishing defaults.</span>
                        </div>
                        <IconArrowRight />
                      </button>
                    )}
                  </div>
                </section>

                <section className={styles.sectionCard}>
                  <div className={styles.sectionCardHeader}>
                    <h2>Model Summary</h2>
                  </div>
                  <ul className={styles.summaryList}>
                    <li>Pages are stored as structured records with locked frontend layout.</li>
                    <li>Blog posts remain a dedicated repeated content type.</li>
                    <li>Media records are stored in D1 with file objects handled separately.</li>
                    <li>Shared navigation, footer, and booking content live under site settings.</li>
                    <li>AI automations can be configured separately with provider keys and reusable prompt templates.</li>
                    <li>Social publishing credentials can be stored separately so secrets never leak into public site settings.</li>
                  </ul>
                </section>
              </div>
            </section>
          )}

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
                  <label className={styles.field}>
                    <span>API Key</span>
                    <input
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
                    <small className={styles.fieldHint}>
                      {aiSettingsDraft.hasApiKey
                        ? 'A key is already stored. It is never shown again in the admin UI. Leave this blank to keep it unchanged.'
                        : 'Stored server-side only. The raw key is never returned to the browser after saving.'}
                    </small>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.toggleLabel}>
                      <input
                        checked={aiSettingsDraft.clearApiKey}
                        className={styles.toggleInput}
                        disabled={!aiSettingsDraft.hasApiKey}
                        onChange={(event) => setAiSettingsDraft((current) => ({ ...current, clearApiKey: event.target.checked }))}
                        type="checkbox"
                      />
                      Clear stored API key
                    </span>
                  </label>
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
              {isSuperAdmin && (
                <section className={styles.sectionCard}>
                  <div className={styles.sectionCardHeader}>
                    <h2>Super Admin Controls</h2>
                    <button className={styles.secondaryButton} onClick={saveFeatureFlags} type="button">
                      Save Visibility
                    </button>
                  </div>
                  <div className={styles.grid}>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span className={styles.toggleLabel}>
                        <input
                          checked={featureFlagsDraft.showAiDashboard}
                          className={styles.toggleInput}
                          onChange={(event) => setFeatureFlagsDraft((current) => ({
                            ...current,
                            showAiDashboard: event.target.checked,
                          }))}
                          type="checkbox"
                        />
                        Show AI dashboard and AI settings to non-super-admin logins
                      </span>
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span className={styles.toggleLabel}>
                        <input
                          checked={featureFlagsDraft.showBlog}
                          className={styles.toggleInput}
                          onChange={(event) => setFeatureFlagsDraft((current) => ({
                            ...current,
                            showBlog: event.target.checked,
                          }))}
                          type="checkbox"
                        />
                        Show blog management and AI blog tools to non-super-admin logins
                      </span>
                    </label>
                  </div>
                </section>
              )}

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
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Default OG image URL</span>
                    <input value={settingsDraft.defaultOgImage} onChange={(event) => setSettingsDraft((current) => ({ ...current, defaultOgImage: event.target.value }))} />
                  </label>
                </div>
              </section>

              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Structured JSON</h2>
                </div>
                <div className={styles.grid}>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Navigation JSON</span>
                    <textarea value={settingsDraft.navigationJson} onChange={(event) => setSettingsDraft((current) => ({ ...current, navigationJson: event.target.value }))} />
                  </label>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Footer JSON</span>
                    <textarea value={settingsDraft.footerJson} onChange={(event) => setSettingsDraft((current) => ({ ...current, footerJson: event.target.value }))} />
                  </label>
                  <label className={[styles.field, styles.fieldWide].join(' ')}>
                    <span>Booking modal JSON</span>
                    <textarea value={settingsDraft.bookingJson} onChange={(event) => setSettingsDraft((current) => ({ ...current, bookingJson: event.target.value }))} />
                  </label>
                </div>
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
                      onChange={(event) => setInviteDraft((current) => ({ ...current, role: event.target.value as UserRole }))}
                      value={inviteDraft.role}
                    >
                      {CMS_ROLE_OPTIONS
                        .filter((option) => inviteRoleOptions.includes(option.value))
                        .map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <small className={styles.fieldHint}>Invite links are one-time setup links. Site owners can invite editors and collaborators.</small>
                  </label>
                  <div className={[styles.field, styles.inviteActions].join(' ')}>
                    <span>Actions</span>
                    <div className={styles.buttonRow}>
                      <button
                        className={styles.primaryButton}
                        disabled={creatingInvitation}
                        onClick={() => { void createInvitation() }}
                        type="button"
                      >
                        {creatingInvitation ? 'Creating…' : 'Create Invite Link'}
                      </button>
                    </div>
                  </div>
                  {generatedInviteUrl && (
                    <div className={[styles.field, styles.fieldWide, styles.inviteLinkCard].join(' ')}>
                      <span>Latest invite link</span>
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
                      <small className={styles.fieldHint}>
                        This link lets the invited person set their password and log into the CMS.
                      </small>
                    </div>
                  )}
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
                        </div>
                        <div className={styles.userAccessControls}>
                          <label className={styles.field}>
                            <span>Role</span>
                            <select
                              className={styles.roleSelect}
                              disabled={!canDeleteEntry || updatingUserId === entry.id}
                              onChange={(event) => { void updateManagedUserRole(entry, event.target.value as UserRole) }}
                              value={entry.role}
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
                        <small className={styles.fieldHint}>
                          Added {new Date(entry.createdAt).toLocaleDateString()}
                          {!canDeleteEntry && entry.role === 'super_admin' ? ' · Super admin access is protected.' : ''}
                          {!canDeleteEntry && entry.id === user.id ? ' · This is your current login.' : ''}
                        </small>
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
                    {userInvitations.map((entry) => (
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
                        <div className={styles.buttonRow}>
                          <button
                            className={styles.secondaryButton}
                            onClick={() => { void revokeInvitation(entry.id) }}
                            type="button"
                          >
                            Revoke Invite
                          </button>
                        </div>
                        <small className={styles.fieldHint}>
                          Invite links are only shown once when created, so copy the latest one above if you still need to send it.
                        </small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>No pending invitations yet.</p>
                )}
              </section>
            </section>
          )}

          {tab === 'linkedin' && isSuperAdmin && (
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
            <section className={styles.editorLayout}>
              <section className={styles.listPane}>
                <div className={styles.sectionCardHeader}>
                  <h2>All Pages</h2>
                  <span className={styles.counterPill}>{staticPages.length}</span>
                </div>
                <div className={styles.list}>
                  {staticPages.map((page) => (
                    <button
                      className={[styles.listItem, activePageSlug === page.slug ? styles.listItemActive : ''].join(' ')}
                      key={page.slug || 'home'}
                      onClick={() => setActivePageSlug(page.slug)}
                      type="button"
                    >
                      <div className={styles.listItemTop}>
                        <strong>{page.slug ? `/${page.slug}` : '/ (home)'}</strong>
                        <span className={[styles.badge, page.published ? styles.badgeSuccess : styles.badgeMuted].join(' ')}>
                          {page.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {pageDraft && (
                <section className={styles.editorPane}>
                  <div className={styles.sectionCardHeader}>
                    <h2>{pageDraft.slug ? `/${pageDraft.slug}` : '/ (home)'}</h2>
                    <a
                      className={styles.secondaryButton}
                      href={pageDraft.slug ? `/admin/edit?page=${encodeURIComponent(pageDraft.slug)}` : '/admin/edit'}
                    >
                      Edit Content
                    </a>
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
            <section className={styles.editorLayout}>
              <section className={styles.listPane}>
                <div className={styles.sectionCardHeader}>
                  <h2>All Posts</h2>
                  <span className={styles.counterPill}>{posts.length}</span>
                </div>
                <div className={styles.listControls}>
                  <input
                    className={styles.listSearch}
                    onChange={(event) => setPostListQuery(event.target.value)}
                    placeholder="Search posts"
                    value={postListQuery}
                  />
                  <select
                    className={styles.listSort}
                    onChange={(event) => setPostListSort(event.target.value as PostListSort)}
                    value={postListSort}
                  >
                    <option value="recent">Newest first</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="published">Published first</option>
                  </select>
                </div>
                <div className={styles.list}>
                  {visiblePosts.map((post) => (
                    <button
                      className={[styles.listItem, activePostSlug === post.slug ? styles.listItemActive : ''].join(' ')}
                      key={post.slug}
                      onClick={() => {
                        setActivePostSlug(post.slug)
                        setAiPostBuilder((current) => ({ ...current, open: false }))
                      }}
                      type="button"
                    >
                      <div className={styles.contentListItem}>
                        <div className={styles.contentListThumb}>
                          {post.coverImageUrl ? (
                            <img alt={post.coverImageAlt || post.title} className={styles.contentListThumbImage} src={post.coverImageUrl} />
                          ) : (
                            <div className={styles.contentListThumbPlaceholder}>
                              <IconPosts />
                            </div>
                          )}
                        </div>
                        <div className={styles.contentListBody}>
                          <strong className={styles.contentListTitle}>{post.title}</strong>
                          <div className={styles.contentListFooter}>
                            <span className={[styles.badge, post.published ? styles.badgeSuccess : styles.badgeMuted].join(' ')}>
                              {post.published ? 'Published' : 'Archived'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {!visiblePosts.length && (
                    <p className={styles.muted}>No posts match that search yet.</p>
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
                      <div className={styles.sectionCardHeader}>
                        <h2>{postDraft.title || 'New Post'}</h2>
                      </div>
                      <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Slug</span>
                      <input value={postDraft.slug} onChange={(event) => setPostDraft({ ...postDraft, slug: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Published at</span>
                      <input value={postDraft.publishedAt} onChange={(event) => setPostDraft({ ...postDraft, publishedAt: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span className={styles.toggleLabel}>
                        <input
                          checked={postDraft.published}
                          className={styles.toggleInput}
                          onChange={(event) => setPostDraft({ ...postDraft, published: event.target.checked })}
                          type="checkbox"
                        />
                        Published
                      </span>
                      <small className={styles.fieldHint}>Turn this off to archive the post without deleting it.</small>
                    </label>
                    <label className={[styles.field, styles.fieldWide].join(' ')}>
                      <span>Title</span>
                      <input value={postDraft.title} onChange={(event) => setPostDraft({ ...postDraft, title: event.target.value })} />
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
                    {linkedInConnection.connected && linkedInTargets.length > 0 && (
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
                        <button
                          className={styles.secondaryButton}
                          disabled
                          type="button"
                        >
                          LinkedIn (Coming Soon)
                        </button>
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
            <section className={styles.editorLayout}>
              <section className={styles.listPane}>
                <div className={styles.sectionCardHeader}>
                  <h2>All Products</h2>
                  <span className={styles.counterPill}>{products.length}</span>
                </div>
                <div className={styles.listControls}>
                  <input
                    className={styles.listSearch}
                    onChange={(event) => setProductListQuery(event.target.value)}
                    placeholder="Search products"
                    value={productListQuery}
                  />
                  <select
                    className={styles.listSort}
                    onChange={(event) => setProductListSort(event.target.value as ProductListSort)}
                    value={productListSort}
                  >
                    <option value="category">Sort by category</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="published">Published first</option>
                  </select>
                </div>
                <div className={styles.list}>
                  {visibleProducts.map((product) => (
                    <button
                      className={[styles.listItem, activeProductSlug === product.slug ? styles.listItemActive : ''].join(' ')}
                      key={product.slug}
                      onClick={() => { void handleSelectProduct(product.slug) }}
                      type="button"
                    >
                      <div className={styles.contentListItem}>
                        <div className={styles.contentListThumb}>
                          {product.heroImageUrl ? (
                            <img alt={product.heroImageAlt || product.name} className={styles.contentListThumbImage} src={product.heroImageUrl} />
                          ) : (
                            <div className={styles.contentListThumbPlaceholder}>
                              <IconProducts />
                            </div>
                          )}
                        </div>
                        <div className={styles.contentListBody}>
                          <strong className={styles.contentListTitle}>{product.name}</strong>
                          <div className={styles.contentListFooter}>
                            <span className={[styles.badge, product.published ? styles.badgeSuccess : styles.badgeMuted].join(' ')}>
                              {product.published ? 'Published' : 'Archived'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {!visibleProducts.length && (
                    <p className={styles.muted}>No products match that search yet.</p>
                  )}
                </div>
              </section>

              {productDraft && (
                <section className={styles.editorPane}>
                  <div className={styles.sectionCardHeader}>
                    <h2>{productDraft.name || 'New Product'}</h2>
                  </div>
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Slug</span>
                      <input value={productDraft.slug} onChange={(event) => setProductDraft({ ...productDraft, slug: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Product type</span>
                      <select
                        value={productDraft.airconType}
                        onChange={(event) => setProductDraft(applyProductTypeToDraft(productDraft, event.target.value))}
                      >
                        {PRODUCT_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field}>
                      <span className={styles.toggleLabel}>
                        <input
                          checked={productDraft.published}
                          className={styles.toggleInput}
                          onChange={(event) => setProductDraft({ ...productDraft, published: event.target.checked })}
                          type="checkbox"
                        />
                        Published
                      </span>
                      <small className={styles.fieldHint}>Turn this off to archive the product without deleting it.</small>
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
                      <span>Name</span>
                      <input value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} />
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
                    <label className={styles.field}>
                      <span>Heating kW</span>
                      <input
                        type="number"
                        step="0.1"
                        value={productDraft.heatingKw}
                        onChange={(event) => setProductDraft({ ...productDraft, heatingKw: Number(event.target.value || 0) })}
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Cooling kW</span>
                      <input
                        type="number"
                        step="0.1"
                        value={productDraft.coolingKw}
                        onChange={(event) => setProductDraft({ ...productDraft, coolingKw: Number(event.target.value || 0) })}
                      />
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
                                        <div className={styles.productImageDragHandle} aria-hidden="true">⋮⋮</div>
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
                      <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
                        <label className={styles.field}>
                          <span>Alt text</span>
                          <input
                            value={productDraft.heroImageAlt || ''}
                            onChange={(event) => {
                              const nextAlt = event.target.value
                              setProductDraft(syncProductDraftImages({
                                ...productDraft,
                                heroImageAlt: nextAlt,
                                productImages: productDraft.productImages.map((image, index) => (
                                  index === 0
                                    ? { ...image, alt: nextAlt }
                                    : image
                                )),
                              }))
                            }}
                            placeholder="Describe the hero product image"
                          />
                        </label>
                        <label className={styles.field}>
                          <span>Image URL</span>
                          <input value={productDraft.heroImageUrl || ''} readOnly style={{ color: '#8b939c', fontSize: '0.85rem' }} />
                        </label>
                      </div>
                    </div>
                    <label className={styles.field}>
                      <span>Family code</span>
                      <input value={productDraft.familyCode} onChange={(event) => setProductDraft({ ...productDraft, familyCode: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Family name</span>
                      <input value={productDraft.familyName} onChange={(event) => setProductDraft({ ...productDraft, familyName: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Category slug</span>
                      <input value={productDraft.categorySlug} readOnly style={{ color: '#8b939c', fontSize: '0.85rem' }} />
                    </label>
                    <label className={styles.field}>
                      <span>Category label</span>
                      <input value={productDraft.categoryLabel} readOnly style={{ color: '#8b939c', fontSize: '0.85rem' }} />
                    </label>
                    <label className={styles.field}>
                      <span>Installation cost tag</span>
                      <input value={productDraft.installationCost} onChange={(event) => setProductDraft({ ...productDraft, installationCost: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Install summary</span>
                      <input value={productDraft.installSummary} onChange={(event) => setProductDraft({ ...productDraft, installSummary: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Brochure label</span>
                      <input value={productDraft.brochureLabel} onChange={(event) => setProductDraft({ ...productDraft, brochureLabel: event.target.value })} />
                    </label>
                    <label className={styles.field}>
                      <span>Brochure URL</span>
                      <input value={productDraft.brochureHref} onChange={(event) => setProductDraft({ ...productDraft, brochureHref: event.target.value })} />
                    </label>
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
                    void uploadMedia(new FormData(form))
                    form.reset()
                  }}
                >
                  <div className={styles.grid}>
                    <label className={styles.field}>
                      <span>Upload file</span>
                      <input name="file" type="file" />
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

              <section className={styles.sectionCard}>
                <div className={styles.sectionCardHeader}>
                  <h2>Library</h2>
                  <span className={styles.counterPill}>{media.length}</span>
                </div>
                <div className={styles.mediaGrid}>
                  {media.map((item) => (
                    <article className={styles.mediaCard} key={item.publicUrl}>
                      {item.publicUrl && <img alt={item.alt || item.filename} className={styles.mediaPreview} src={item.publicUrl} />}
                      <div className={styles.mediaMeta}>
                        <strong>{item.filename}</strong>
                        <div className={styles.muted}>{item.alt || 'No alt text yet'}</div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}
        </main>
      </div>

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
