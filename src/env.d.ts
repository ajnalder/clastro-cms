/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    runtime?: {
      env?: Partial<Cloudflare.Env>;
    };
    cmsUser?: {
      email: string;
      id: string;
      name: string;
      role: string;
    } | null;
  }
}
