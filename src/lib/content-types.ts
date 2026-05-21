/**
 * Generic content-item type registry.
 *
 * To add a new content type (e.g. authors, locations), append a definition
 * to CONTENT_TYPE_DEFINITIONS below. The admin UI auto-generates the
 * navigation entry, list pane, and editor form from the definition.
 */

export type ContentFieldType =
  | 'text'
  | 'textarea'
  | 'rich-text'
  | 'slug'
  | 'image'
  | 'url'
  | 'boolean'
  | 'reference'

export interface ContentFieldDefinition {
  helperText?: string
  label: string
  name: string
  placeholder?: string
  required?: boolean
  /** For `slug` fields: the source field whose value is auto-slugified. */
  sourceField?: string
  /** For `reference` fields: which content-type slug this field points to. */
  targetType?: string
  type: ContentFieldType
}

export type ContentTypeIcon = 'tag' | 'people' | 'pin' | 'document' | 'star' | 'briefcase'

export interface ContentTypeDefinition {
  description: string
  fields: ContentFieldDefinition[]
  icon: ContentTypeIcon
  label: string
  labelPlural: string
  /** Field that supplies the slug in the list view. Defaults to `slug`. */
  slugField?: string
  /** DB type discriminator and URL segment. */
  slug: string
  /** Field shown as the title in lists. Defaults to `name`. */
  titleField?: string
}

export const CONTENT_TYPE_DEFINITIONS: ContentTypeDefinition[] = [
  {
    slug: 'category',
    label: 'Category',
    labelPlural: 'Categories',
    description: 'Group products and items together',
    icon: 'tag',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'slug', sourceField: 'name', required: true },
      { name: 'heroImageUrl', label: 'Hero image', type: 'image' },
      { name: 'heroImageAlt', label: 'Hero image alt text', type: 'text', helperText: 'Used for accessibility and SEO.' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Short summary of this category.' },
    ],
  },
  {
    slug: 'author',
    label: 'Author',
    labelPlural: 'Authors',
    description: 'Bylines for blog posts and articles',
    icon: 'people',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'slug', sourceField: 'name', required: true },
      { name: 'role', label: 'Role / title', type: 'text', placeholder: 'e.g. Senior Editor' },
      { name: 'photoUrl', label: 'Photo', type: 'image' },
      { name: 'photoAlt', label: 'Photo alt text', type: 'text' },
      { name: 'bio', label: 'Short bio', type: 'textarea' },
    ],
  },
  {
    slug: 'team-member',
    label: 'Team Member',
    labelPlural: 'Team Members',
    description: 'People for team lists and bios',
    icon: 'people',
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'slug', sourceField: 'name', required: true },
      { name: 'role', label: 'Role / title', type: 'text', placeholder: 'e.g. Founder, Lead Designer' },
      { name: 'photoUrl', label: 'Photo', type: 'image' },
      { name: 'photoAlt', label: 'Photo alt text', type: 'text' },
      { name: 'bio', label: 'Bio', type: 'rich-text' },
    ],
  },
]

export function getContentTypeDefinition(slug: string): ContentTypeDefinition | undefined {
  return CONTENT_TYPE_DEFINITIONS.find((def) => def.slug === slug)
}

export function defaultContentItemData(type: ContentTypeDefinition): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const field of type.fields) {
    data[field.name] = field.type === 'boolean' ? false : ''
  }
  return data
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
