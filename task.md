# photos by George — Build Progress

## Status: In Progress

## Completed
- [x] app_init
- [x] design.md
- [x] DB schema (categories, photos + auth)
- [x] db:push
- [x] auth.ts (Google OAuth via better-auth)
- [x] auth-schema generated
- [x] s3.ts lib

## In Progress
- [ ] API middleware (auth middleware)
- [ ] API routes (categories, photos, upload, favorites)
- [ ] Seed categories
- [ ] API index.ts wire-up
- [ ] Frontend: web auth client + api client
- [ ] Frontend: Homepage (hero slideshow + category grid)
- [ ] Frontend: Category page (masonry grid)
- [ ] Frontend: Admin dashboard (protected, upload, manage)
- [ ] Google OAuth secrets prompt
- [ ] Build check

## Key Decisions
- Google OAuth only for admin — email whitelist via better-auth
- S3/Tigris for photo storage — presigned PUT URLs
- Playfair Display + Inter fonts
- Masonry grid for category pages
- Crossfade hero slideshow (CSS)
- Admin at /admin route, protected by requireAuth + admin check
