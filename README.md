# getuplift.pro

The Uplift landing page: one static HTML file (inline CSS, self-hosted Archivo font, no JavaScript beyond the footer
year, no analytics or cookies). The app itself lives at https://app.getuplift.pro (repo: shikhashah92/Iron-Log).

Hosting: GitHub Pages, deploy from branch `main`, root folder. `CNAME` sets the domain `getuplift.pro`; DNS at Porkbun
(A/AAAA for the apex to GitHub Pages, CNAME `www` and `app` to shikhashah92.github.io).

Preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

## Guides, workouts and tools (SEO pages)

Most of the site is generated from the app's own data by `scripts/build-guides.mjs`: 113 exercise and yoga guides
(`/exercises/`), the built-in workouts and plans (`/workouts/`), the 1RM and plate calculators (`/tools/`), the Strong
comparison (`/strong-alternative/`), `404.html` and `sitemap.xml`. The pages share `assets/site.css`. Rebuild after the
app's library changes (Node 23.6 or later, which can import the app's TypeScript):

```bash
node scripts/build-guides.mjs ../Iron-Log
```

It rewrites only the folders it owns. `index.html` and `strong/` are written by hand. The Strong prices and limits on
`/strong-alternative/` come from Strong's App Store listing, so check them again now and then.

What each page type targets:

1. **Exercise guides**: "how to do X", "X muscles worked", "X form". One page per lift or pose, using the app's cues,
   drawings (CC BY-SA, credited on each page) and muscle map.
2. **Workouts and plans**: "push pull legs routine", "upper lower split", "chest workout", "leg day workout".
3. **Calculators**: "1RM calculator", "plate calculator". People search for these a lot, and other sites link to them.
4. **Strong alternative and import**: people who are already switching apps.
5. **Plumbing**: `sitemap.xml`, `robots.txt`, structured data (SoftwareApplication, Organization, breadcrumbs, FAQ),
   a `404.html` with links, and the "Free guides" section on the home page linking it all.

After a deploy, submit `https://getuplift.pro/sitemap.xml` in Google Search Console and Bing Webmaster Tools (each needs
a DNS TXT record at Porkbun to verify the domain). Search Console also shows which queries bring people in, so no
analytics are needed on the site.
