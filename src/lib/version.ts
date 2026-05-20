export interface ClastroChangelogEntry {
  date: string;
  summary: string;
  version: string;
  changes: string[];
}

export const CLASTRO_VERSION = "0.1.1";

export const CLASTRO_CHANGELOG: ClastroChangelogEntry[] = [
  {
    version: "0.1.1",
    date: "2026-05-21",
    summary: "Version visibility and public changelog.",
    changes: [
      "Added a shared Clastro version constant that matches package.json.",
      "Added a public changelog page for tracking starter development over time.",
      "Added a visible CMS version badge in the admin sidebar.",
      "Linked the changelog from the demo footer seed data.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-05-21",
    summary: "Initial reusable Clastro CMS starter.",
    changes: [
      "Created the generic Clastro CMS starter from the latest role-aware implementation.",
      "Added the dummy public site for testing pages, posts, products, media, and the live editor.",
      "Provisioned Cloudflare D1, KV, and R2 resources for the deployed demo.",
      "Seeded the starter database with generic content and a first super-admin account.",
      "Added documentation for starting new client projects and porting core upgrades.",
    ],
  },
];
