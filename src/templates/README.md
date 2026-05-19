# PSEO (Programmatic SEO) Templates

This directory is reserved for PSEO template components used by dynamic variant routes.

## How it works

Each tool in `src/data/tools.json` has a `variants` array. When populated, the dynamic route
`src/pages/[...slug].astro` will generate pages for each variant using these templates.

### Example variant entry in tools.json

```json
{
  "slug": "pdf-to-word",
  "variants": [
    {
      "slug": "pdf-to-word/large-files",
      "template": "pdf-variant",
      "params": { "maxSize": "100MB" }
    }
  ]
}
```

### Adding a new PSEO template

1. Create a `.astro` component in this directory (e.g., `PdfVariant.astro`)
2. Accept `params` as a prop to receive variant-specific data
3. Register the template name in the `[...slug].astro` route's template map
4. Add variant entries to the relevant tool in `tools.json`

The `[...slug].astro` dynamic route is currently commented out in the codebase.
Uncomment and configure it when ready to enable PSEO pages.
