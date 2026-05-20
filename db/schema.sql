PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  token_hash TEXT NOT NULL UNIQUE,
  invited_by_user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'site',
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  default_og_image TEXT,
  navigation_json TEXT NOT NULL,
  footer_json TEXT NOT NULL,
  booking_json TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  provider TEXT NOT NULL DEFAULT 'openai',
  api_key TEXT,
  default_brand_prompt TEXT NOT NULL,
  image_generation_json TEXT NOT NULL,
  blog_generation_json TEXT NOT NULL,
  alt_text_generation_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_feature_flags (
  id TEXT PRIMARY KEY DEFAULT 'default',
  show_ai_dashboard INTEGER NOT NULL DEFAULT 0,
  show_blog INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS linkedin_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enabled INTEGER NOT NULL DEFAULT 0,
  client_id TEXT NOT NULL DEFAULT '',
  client_secret TEXT,
  access_token TEXT,
  author_urn TEXT NOT NULL DEFAULT '',
  organization_urn TEXT NOT NULL DEFAULT '',
  default_post_cta TEXT NOT NULL DEFAULT 'Read more on the site.',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS linkedin_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  linkedin_sub TEXT NOT NULL,
  linkedin_name TEXT,
  linkedin_email TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TEXT,
  scope TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'en',
  stylesheets_json TEXT NOT NULL DEFAULT '[]',
  content_html TEXT NOT NULL,
  schema_json TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content_html TEXT NOT NULL,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  published_at TEXT NOT NULL,
  read_time TEXT,
  author_name TEXT NOT NULL DEFAULT 'Clastro Editor',
  author_role TEXT NOT NULL DEFAULT 'CMS Demo Author',
  primary_category TEXT NOT NULL,
  categories_json TEXT NOT NULL DEFAULT '[]',
  seo_title TEXT,
  seo_description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price REAL,
  price_label TEXT,
  cooling_kw REAL NOT NULL DEFAULT 0,
  heating_kw REAL NOT NULL DEFAULT 0,
  hero_image_url TEXT NOT NULL,
  hero_image_alt TEXT,
  short_description TEXT NOT NULL,
  installation_cost TEXT NOT NULL,
  is_front_page INTEGER NOT NULL DEFAULT 0,
  aircon_type TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  family_code TEXT NOT NULL,
  family_name TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  category_label TEXT NOT NULL,
  install_summary TEXT NOT NULL,
  brochure_label TEXT NOT NULL,
  brochure_href TEXT NOT NULL,
  overview TEXT NOT NULL,
  best_for_json TEXT NOT NULL DEFAULT '[]',
  spec_notes_json TEXT NOT NULL DEFAULT '[]',
  content_html TEXT NOT NULL DEFAULT '',
  product_images_json TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  source_url TEXT,
  alt TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pages_published ON pages(published);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published);
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename);
CREATE INDEX IF NOT EXISTS idx_linkedin_connections_user_id ON linkedin_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token_hash ON user_invitations(token_hash);
