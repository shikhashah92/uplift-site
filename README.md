# getuplift.pro

The Uplift landing page: one static HTML file (inline CSS, self-hosted Archivo font, no JavaScript beyond the footer
year, no analytics or cookies). The app itself lives at https://app.getuplift.pro (repo: shikhashah92/Iron-Log).

Hosting: GitHub Pages, deploy from branch `main`, root folder. `CNAME` sets the domain `getuplift.pro`; DNS at Porkbun
(A/AAAA for the apex to GitHub Pages, CNAME `www` and `app` to shikhashah92.github.io).

Preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
