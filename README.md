# Formula Selector

A React + Vite app for baby formula catalog, barcode validation, nutrition calculator, and clinical recommendation logic.

## Features

- EAN-8 / EAN-13 validation with checksum
- Barcode camera scanner via `@zxing/library`
- Daily calorie and nutrient calculation
- Clinical recommendation rules for formula selection
- Product catalog with filtering and search
- Responsive UI
- Supabase-ready data layer

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Supabase setup

1. Create a project on https://supabase.com
2. Copy the project URL and anon key into `.env.local`
3. Open SQL Editor and run the schema from the provided SQL script
4. Restart the app

## Build

```bash
npm run build
```

## Notes

- The current app uses sample product data in `src/data/products.ts`.
- To connect to live data, use `src/lib/supabase.ts` and the Supabase tables for `products`, `product_barcodes`, and `clinical_decisions`.
