// Builds the SEO pages from the app's own data: exercise and yoga guides, workouts and plans, the two calculators,
// the Strong comparison, 404.html and sitemap.xml. Plain static HTML, no trackers.
//   node scripts/build-guides.mjs ../Iron-Log
// Re-run after the app's library changes. It rewrites only the folders it owns (see OWNED); index.html and strong/ are hand-written.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const app = resolve(process.argv[2] ?? '../Iron-Log');
const site = resolve(import.meta.dirname, '..');
const { BUILT_IN, GROUPS, STARTERS, PLANS } = await import(pathToFileURL(join(app, 'src/exercises.ts')).href);
const ORIGIN = 'https://getuplift.pro';
const APP = 'https://app.getuplift.pro/';
const TODAY = new Date().toISOString().slice(0, 10);
const OWNED = ['exercises', 'workouts', 'tools', 'strong-alternative', 'assets/illustrations'];

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const list = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`);
const clip = (s, n = 155) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);
const noDot = (s) => s.replace(/[.\s]+$/, '');
const MUSCLE = { chest: 'chest', triceps: 'triceps', biceps: 'biceps', deltoids: 'shoulders', 'upper-back': 'upper back', 'lower-back': 'lower back',
  hamstring: 'hamstrings', gluteal: 'glutes', trapezius: 'traps', forearm: 'forearms', quadriceps: 'quads', adductors: 'inner thighs', calves: 'calves',
  abs: 'abs', obliques: 'obliques' };
const EQUIP = { Barbell: 'with a barbell', Dumbbell: 'with dumbbells', Machine: 'on a machine', Cable: 'on a cable machine', Bodyweight: 'using your body weight',
  'Bodyweight / Machine': 'with your body weight or an assisted machine', 'Dumbbell / Machine': 'with dumbbells or a machine', 'Cable / Dumbbell': 'with a cable or dumbbells', Wheel: 'with an ab wheel' };
const m = (a = []) => a.map((x) => MUSCLE[x] ?? x);

const pages = []; // [path, html] — path like "/exercises/plank/"
function page({ path, title, desc, body, crumbs = [], script = '', jsonld = [], index = true }) {
  const url = ORIGIN + path;
  const trail = [['Uplift', '/'], ...crumbs];
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trail.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: ORIGIN + p })) }, ...jsonld];
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
${index ? `  <link rel="canonical" href="${url}" />` : '  <meta name="robots" content="noindex" />'}
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${ORIGIN}/assets/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Uplift: a private training log for your phone" />
  <meta property="og:site_name" content="Uplift" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1D2125" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="preload" href="/assets/Archivo-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/assets/site.css" />
  <script type="application/ld+json">${JSON.stringify(ld.length === 1 ? ld[0] : ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <header>
    <div class="wrap">
      <a class="logo" href="/" aria-label="Uplift home">
        <img class="mark-light" src="/assets/mark.svg" alt="" width="34" height="34" />
        <img class="mark-dark" src="/assets/mark-reversed.svg" alt="" width="34" height="34" style="display:none" />
        <span>up<em>lift</em></span>
      </a>
      <a class="btn" href="${APP}">Open the app</a>
    </div>
  </header>
  <main class="wrap">
${crumbs.length ? `    <nav class="crumbs" aria-label="Breadcrumb">${trail.slice(0, -1).map(([n, p]) => `<a href="${p}">${esc(n)}</a> › `).join('')}<span aria-current="page">${esc(trail.at(-1)[0])}</span></nav>\n` : ''}${body}
  </main>
  <footer>
    <div class="wrap">
      <nav>
        <a href="/">Uplift</a>
        <a href="/exercises/">Exercise guides</a>
        <a href="/workouts/">Workouts and plans</a>
        <a href="/tools/one-rep-max-calculator/">1RM calculator</a>
        <a href="/tools/plate-calculator/">Plate calculator</a>
        <a href="/strong-alternative/">Strong alternative</a>
        <a href="/#privacy">Privacy</a>
        <a href="mailto:hello@getuplift.pro?subject=Uplift">Contact</a>
      </nav>
    </div>
  </footer>${script ? `\n  <script>\n    // No trackers: this only does the sums on your device.\n${script}\n  </script>` : ''}
</body>
</html>
`;
  pages.push([path, html]);
}
const cta = (h, p, label = 'Open Uplift') => `
    <section class="cta">
      <h2>${h}</h2>
      <p>${p}</p>
      <a class="btn" href="${APP}">${label}</a>
      <p class="small" style="margin:14px 0 0">Free. Works on iPhone and Android, no app store and no account. Your data stays on your phone.</p>
    </section>`;

// ---------- exercises ----------
const guides = BUILT_IN.filter((e) => e.exec.length);
const isYoga = (e) => e.group === 'Yoga';
// Yoga poses lead with the English name, which is what people search for ("Tree pose (Vrksasana)").
const display = (e) => { const p = /^(.+?) \((.+)\)$/.exec(e.name); return isYoga(e) && p ? `${p[2]} (${p[1]})` : e.name; };
const short = (e) => { const p = /^(.+?) \((.+)\)$/.exec(e.name); return isYoga(e) && p ? p[2] : e.name; };
const exSlug = new Map(guides.map((e) => [e.id, slug(display(e))]));
const exUrl = (id) => `/exercises/${exSlug.get(id)}/`;
const hasArt = (e) => e.art !== false && existsSync(join(app, 'public/illustrations', e.id, '1.svg'));
const workoutsWith = (id) => STARTERS.filter((t) => t.exercises.some((x) => x.exerciseId === id));
const sectionOf = (g) => (g === 'Yoga' ? 'Yoga poses' : g === 'Pranayama' ? 'Breathing (pranayama)' : g);

function exercisePage(e) {
  const name = display(e), main = m(e.muscles?.main), help = m(e.muscles?.help);
  const yoga = e.kind === 'yoga';
  const works = main.length ? `The ${short(e).toLowerCase()} mainly works your ${list(main)}${help.length ? `, with your ${list(help)} helping` : ''}.` : '';
  const kindLine = e.group === 'Pranayama' ? 'A pranayama breathing practice' : yoga ? 'A yoga pose' : `A ${e.group.toLowerCase()} exercise${EQUIP[e.equip] ? ` ${EQUIP[e.equip]}` : ''}`;
  const title = yoga ? `${name}: how to do it, steps and mistakes to avoid` : `${name}: how to do it, muscles worked and form tips`;
  const desc = clip(yoga ? `How to do ${display(e)}: ${noDot(e.setup[0] ?? e.exec[0])}. Step by step, plus the mistakes to avoid.`
    : `How to do the ${e.name.toLowerCase()} with good form. ${works} Setup, step-by-step cues and the common mistakes to avoid.`);
  const same = guides.filter((x) => x.group === e.group && x.id !== e.id);
  const pos = same.findIndex((x) => guides.indexOf(x) > guides.indexOf(e));
  const similar = [...same.slice(Math.max(0, pos)), ...same.slice(0, Math.max(0, pos))].slice(0, 6);
  const inWorkouts = workoutsWith(e.id);
  const art = hasArt(e) ? `
    <div class="frames">${[1, 2, 3].map((i) => `<span><img src="/assets/illustrations/${e.id}/${i}.svg" alt="${esc(`${name}, position ${i} of 3`)}" width="300" height="300" loading="${i === 1 ? 'eager' : 'lazy'}" /></span>`).join('')}</div>
    <p class="small">Drawings: <a href="https://github.com/bryllim/workout-guide">Workout Guide</a> / Everkinetic, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.</p>` : '';
  const faq = main.length ? [{ q: `What muscles does the ${short(e).toLowerCase()} work?`, a: works }] : [];
  page({
    path: exUrl(e.id), title: `${title} | Uplift`, desc,
    crumbs: [['Exercises', '/exercises/'], [name, exUrl(e.id)]],
    jsonld: faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : [],
    body: `    <div class="eyebrow">${esc(sectionOf(e.group))}</div>
    <h1>${esc(name)}</h1>
    <p class="lead">${esc(kindLine)}.${works ? ` ${esc(works)}` : yoga ? ` Here’s how to ${e.group === 'Pranayama' ? 'sit for it' : 'get into it'}, the steps, and the mistakes to avoid.` : ''}</p>
${main.length ? `    <ul class="chips" aria-label="Muscles worked">${main.map((x) => `<li class="main">${esc(x)}</li>`).join('')}${help.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>\n` : ''}${art}
${e.setup.length ? `    <h2>${yoga ? 'Getting into position' : 'Set up'}</h2>\n    <ul class="list">${e.setup.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>\n` : ''}    <h2>How to do it</h2>
    <ol class="steps">${e.exec.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
${e.avoid.length ? `    <h2>Mistakes to avoid</h2>\n    <ul class="list avoid">${e.avoid.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>\n` : ''}${main.length ? `    <h2>Muscles worked</h2>\n    <p>${esc(works)}</p>\n` : ''}${inWorkouts.length ? `    <h2>${yoga ? 'Routines with this pose' : `Workouts with the ${esc(short(e).toLowerCase())}`}</h2>\n    <ul class="links">${inWorkouts.map((t) => `<li><a href="${wUrl(t.id)}"><b>${esc(WORKOUT[t.id][1])}</b><span>${t.exercises.length} ${t.id === 'starter-yoga' ? 'poses' : 'exercises'}</span></a></li>`).join('')}</ul>\n` : ''}    <h2>${yoga ? 'More poses' : `More ${e.group.toLowerCase()} exercises`}</h2>
    <ul class="links">${similar.map((x) => `<li><a href="${exUrl(x.id)}"><b>${esc(display(x))}</b>${x.muscles ? `<span>${esc(list(m(x.muscles.main)))}</span>` : ''}</a></li>`).join('')}</ul>
${cta(yoga ? `Log your ${esc(short(e).toLowerCase())} in Uplift` : `Track your ${esc(e.name.toLowerCase())} in Uplift`,
  yoga ? 'Log rounds and holds, see your practice add up, and keep these cues one tap away while you practise.'
    : 'Last session’s weights and reps fill in for you, it suggests when to add weight, and these form cues are one tap away mid-workout.')}`,
  });
}

// ---------- workouts and plans ----------
const WORKOUT = { // starter id → [slug, title]
  'starter-full-body': ['full-body-workout', 'Full body workout (A)'], 'starter-full-body-b': ['full-body-workout-b', 'Full body workout (B)'],
  'starter-upper': ['upper-body-workout', 'Upper body workout'], 'starter-lower': ['lower-body-workout', 'Lower body workout'],
  'starter-push': ['push-day-workout', 'Push day workout'], 'starter-pull': ['pull-day-workout', 'Pull day workout'], 'starter-legs': ['leg-day-workout', 'Leg day workout'],
  'starter-chest': ['chest-workout', 'Chest workout'], 'starter-back': ['back-workout', 'Back workout'], 'starter-shoulders': ['shoulder-workout', 'Shoulder workout'],
  'starter-arms': ['arm-workout', 'Arm workout'], 'starter-glutes': ['glute-workout', 'Glute workout'], 'starter-core': ['core-workout', 'Core workout'],
  'starter-yoga': ['morning-yoga-routine', 'Morning yoga routine'],
};
const PLAN = { // plan id → [slug, title, sample week]
  'full-body-3': ['full-body-3-day-plan', 'Full body workout plan, 3 days a week', [['Monday', 'starter-full-body'], ['Wednesday', 'starter-full-body-b'], ['Friday', 'starter-full-body']],
    'The next week starts with B, so each workout comes round three times every two weeks.'],
  'upper-lower-4': ['upper-lower-split', 'Upper / lower split, 4 days a week', [['Monday', 'starter-upper'], ['Tuesday', 'starter-lower'], ['Thursday', 'starter-upper'], ['Friday', 'starter-lower']],
    'Two rest days in the week: one in the middle, and the weekend.'],
  ppl: ['push-pull-legs', 'Push pull legs routine, 3 or 6 days a week', [['Monday', 'starter-push'], ['Tuesday', 'starter-pull'], ['Wednesday', 'starter-legs'], ['Thursday', 'starter-push'], ['Friday', 'starter-pull'], ['Saturday', 'starter-legs']],
    'Short on time? Stop after Wednesday and run it once a week. Six days hits every muscle twice.'],
};
for (const t of STARTERS) if (!WORKOUT[t.id]) throw new Error(`No slug for starter ${t.id}: add it to WORKOUT`);
for (const p of PLANS) if (!PLAN[p.id]) throw new Error(`No slug for plan ${p.id}: add it to PLAN`);
const wUrl = (id) => `/workouts/${WORKOUT[id][0]}/`;
const pUrl = (id) => `/workouts/${PLAN[id][0]}/`;
const byId = new Map(BUILT_IN.map((e) => [e.id, e]));
const tpl = new Map(STARTERS.map((t) => [t.id, t]));
const musclesOf = (t) => [...new Set(t.exercises.flatMap((x) => m(byId.get(x.exerciseId)?.muscles?.main)))];
const exRow = (id, yoga) => { const e = byId.get(id); return `<tr><td><a href="${exUrl(id)}">${esc(display(e))}</a></td><td>${yoga ? (e.yoga === 'time' ? 'Time' : e.yoga === 'rounds' ? 'Rounds' : 'Hold') : esc(list(m(e.muscles?.main)))}</td><td>${yoga ? '' : '3'}</td></tr>`; };
const HOW = `<h2>How to run it</h2>
    <ul class="list"><li>Start each exercise with 3 sets. Pick a weight you can lift for about 8–12 reps with good form.</li><li>Rest 1–3 minutes between sets: longer for big lifts like squats, shorter for curls and raises.</li><li>When you reach the top of the rep range on every set, add a little weight next time. Uplift suggests that step for you, from what you did last time.</li><li>Warm up the first exercise with a couple of lighter sets.</li></ul>`;

function workoutPage(t) {
  const [, title] = WORKOUT[t.id], yoga = t.id === 'starter-yoga';
  const muscles = musclesOf(t);
  const plans = PLANS.filter((p) => p.templates.includes(t.id));
  const names = t.exercises.map((x) => short(byId.get(x.exerciseId)));
  page({
    path: wUrl(t.id), title: `${title}: ${t.exercises.length} ${yoga ? 'poses' : 'exercises'}${yoga ? ', step by step' : ' with sets and form tips'} | Uplift`,
    desc: clip(yoga ? `A ${t.exercises.length}-pose morning yoga routine: ${list(names.slice(0, 5))} and more, each with step-by-step cues.`
      : `A ${title.toLowerCase()} you can do at the gym: ${list(names)}. ${t.exercises.length} exercises for your ${list(muscles.slice(0, 4))}, with sets and form cues.`),
    crumbs: [['Workouts', '/workouts/'], [title, wUrl(t.id)]],
    body: `    <div class="eyebrow">${yoga ? 'Yoga routine' : 'Workout'}</div>
    <h1>${esc(title)}</h1>
    <p class="lead">${yoga ? `${t.exercises.length} poses and a breathing practice to start the day, from a Sun salutation to Shavasana.` : `${t.exercises.length} exercises that work your ${esc(list(muscles))}. It takes about 45–60 minutes.`}</p>
    <h2>The ${yoga ? 'poses' : 'exercises'}</h2>
    <div class="table"><table><thead><tr><th>${yoga ? 'Pose' : 'Exercise'}</th><th>${yoga ? 'Log as' : 'Works'}</th><th>${yoga ? '' : 'Sets'}</th></tr></thead><tbody>${t.exercises.map((x) => exRow(x.exerciseId, yoga)).join('')}</tbody></table></div>
    <p class="small">Tap any ${yoga ? 'pose' : 'exercise'} for how to do it and the mistakes to avoid.</p>
    ${yoga ? `<h2>How to practise it</h2>
    <ul class="list"><li>Move slowly and breathe through the nose. Hold each pose for 5–10 breaths.</li><li>For poses done on one side, do both sides.</li><li>Skip anything that hurts, and ease off on a stiff morning.</li></ul>` : HOW}
${plans.length ? `    <h2>Part of these plans</h2>\n    <ul class="links">${plans.map((p) => `<li><a href="${pUrl(p.id)}"><b>${esc(PLAN[p.id][1])}</b><span>${esc(p.about)}</span></a></li>`).join('')}</ul>\n` : ''}${cta(`${esc(title)} is ready in Uplift`, `It’s one of Uplift’s built-in templates. Start a workout, pick it, and tick off your sets: last time’s numbers fill in for you.`)}`,
  });
}

function planPage(p) {
  const [, title, week, note] = PLAN[p.id];
  page({
    path: pUrl(p.id), title: `${title}: free workout plan with exercises | Uplift`,
    desc: clip(`${p.about} A free ${title.toLowerCase()}: the weekly schedule, every workout and exercise, and how to progress.`),
    crumbs: [['Workouts', '/workouts/'], [title, pUrl(p.id)]],
    body: `    <div class="eyebrow">Workout plan · ${esc(p.days)}</div>
    <h1>${esc(title)}</h1>
    <p class="lead">${esc(p.about)}</p>
    <h2>A sample week</h2>
    <div class="table"><table><thead><tr><th>Day</th><th>Workout</th></tr></thead><tbody>${week.map(([d, id]) => `<tr><td>${d}</td><td><a href="${wUrl(id)}">${esc(WORKOUT[id][1])}</a></td></tr>`).join('')}</tbody></table></div>
    <p>${esc(note)} Missed a day? Just do the next workout in the order. The plan doesn’t depend on the day of the week.</p>
${p.templates.map((id) => `    <h2>${esc(WORKOUT[id][1])}</h2>\n    <div class="table"><table><thead><tr><th>Exercise</th><th>Works</th><th>Sets</th></tr></thead><tbody>${tpl.get(id).exercises.map((x) => exRow(x.exerciseId)).join('')}</tbody></table></div>`).join('\n')}
    ${HOW}
${cta(`Run this plan in Uplift`, `${esc(p.name)} is built into Uplift. Pick the plan once and the app tells you which workout is next, whichever day you train.`)}`,
  });
}

// ---------- calculators ----------
const ONE_RM_JS = `
    const $ = (id) => document.getElementById(id);
    const step = () => ($('u').value === 'lb' ? 5 : 2.5);
    const round = (x) => Math.round(x / step()) * step();
    function calc() {
      const w = parseFloat($('w').value.replace(',', '.')), r = Math.round(Number($('r').value)), u = $('u').value;
      if (!(w > 0) || !(r >= 1) || r > 30) { $('out').hidden = true; return; }
      const one = r === 1 ? w : w * (1 + r / 30);
      $('one').textContent = (Math.round(one * 10) / 10) + ' ' + u;
      $('note').textContent = r > 10 ? 'Estimates get rough above 10 reps; a set of 3–6 gives a closer number.' : 'From ' + w + ' ' + u + ' × ' + r + '.';
      $('rows').innerHTML = [100, 95, 90, 85, 80, 75, 70, 65, 60].map((p) => {
        const reps = p === 100 ? 1 : Math.round(30 * (100 / p - 1));
        return '<tr><td>' + p + '%</td><td>' + round(one * p / 100) + ' ' + u + '</td><td>' + reps + '</td></tr>';
      }).join('');
      $('out').hidden = false;
    }
    ['w', 'r', 'u'].forEach((id) => $(id).addEventListener('input', calc));
    calc();`;
const PLATE_JS = `
    const $ = (id) => document.getElementById(id);
    const PLATES = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] };
    const BARS = { kg: [20, 15, 10], lb: [45, 35, 15] };
    // Competition colours, so the picture matches the rack (a lb plate looks like its nearest kg one).
    const COLOUR = ['#D93A3A', '#2F6FDB', '#E8C12E', '#2FA35B', '#F2F2F2', '#3A3A3A', '#B8BCC2'], HEIGHT = [120, 120, 106, 90, 68, 56, 46];
    function bars() { const u = $('u').value; $('b').innerHTML = BARS[u].map((b) => '<option>' + b + '</option>').join(''); }
    function calc() {
      const u = $('u').value, total = parseFloat($('w').value.replace(',', '.')), bar = Number($('b').value);
      if (!(total > 0)) { $('out').hidden = true; return; }
      let rest = Math.max(0, (total - bar) / 2); const side = [];
      for (const p of PLATES[u]) while (rest >= p - 1e-9) { side.push(p); rest -= p; }
      const left = Math.round(rest * 2 * 100) / 100;
      const counts = side.reduce((c, p) => ((c[p] = (c[p] || 0) + 1), c), {});
      $('side').textContent = side.length ? Object.entries(counts).sort((a, b) => b[0] - a[0]).map(([p, n]) => n + ' × ' + p).join(' + ') + ' ' + u : 'Just the bar';
      $('note').textContent = total < bar ? 'That’s less than the bar on its own (' + bar + ' ' + u + ').'
        : left ? 'Can’t make the last ' + left + ' ' + u + ' with standard plates; the nearest you can load is ' + (total - left) + ' ' + u + '.'
        : 'Load the same on each side of a ' + bar + ' ' + u + ' bar, heaviest first.';
      const look = (p) => PLATES[u].indexOf(p) + (u === 'lb' ? 1 : 0);
      $('pic').innerHTML = '<span class="bar"></span>' + side.map((p) => '<i style="height:' + HEIGHT[look(p)] + 'px;background:' + COLOUR[look(p)] + '" title="' + p + ' ' + u + '"></i>').join('');
      $('out').hidden = false;
    }
    $('u').addEventListener('input', () => { bars(); $('w').value = $('u').value === 'lb' ? 135 : 60; calc(); });
    ['w', 'b'].forEach((id) => $(id).addEventListener('input', calc));
    bars(); calc();`;
const tools = () => {
  page({
    path: '/tools/one-rep-max-calculator/', title: 'One-rep max calculator (1RM): estimate your max from any set | Uplift',
    desc: 'Free 1RM calculator: enter a weight and reps to estimate your one-rep max with the Epley formula, plus a table of training weights from 60% to 95%.',
    crumbs: [['One-rep max calculator', '/tools/one-rep-max-calculator/']],
    script: ONE_RM_JS,
    body: `    <div class="eyebrow">Free tool</div>
    <h1>One-rep max calculator</h1>
    <p class="lead">Estimate the most you could lift once, from a set you’ve already done. No need to test a true max.</p>
    <div class="tool">
      <div class="fields">
        <label>Weight lifted<input id="w" inputmode="decimal" value="100" aria-describedby="note" /></label>
        <label>Reps<input id="r" type="number" inputmode="numeric" min="1" max="30" value="5" /></label>
        <label>Unit<select id="u"><option>kg</option><option>lb</option></select></label>
      </div>
      <div class="result" id="out" aria-live="polite">
        <span class="muted">Estimated one-rep max</span><span class="big" id="one"></span>
        <p class="small" id="note"></p>
        <div class="table"><table><thead><tr><th>% of 1RM</th><th>Weight</th><th>About this many reps</th></tr></thead><tbody id="rows"></tbody></table></div>
      </div>
    </div>
    <h2>How it works</h2>
    <p>This uses the Epley formula: <b>1RM = weight × (1 + reps ÷ 30)</b>. Lift 100 kg for 5 reps and your estimated max is 100 × (1 + 5 ÷ 30) ≈ 116.7 kg. Uplift uses the same formula to track your best estimated 1RM for every lift.</p>
    <p>Estimates are closest from heavy sets of 3–6 reps and get rough past 10. They also assume the set was close to your limit: if you had several reps left, your real max is higher.</p>
    <h2>Using the percentages</h2>
    <ul class="list"><li><b>85–95%:</b> heavy sets of 1–5 reps, for strength.</li><li><b>70–85%:</b> sets of 6–12 reps, the usual range for building muscle.</li><li><b>60–70%:</b> lighter sets of 12–20 reps, and warm-ups.</li></ul>
    <h2>Is it safe to test a real one-rep max?</h2>
    <p>For most people training to get fitter, there’s no need. An estimate from a hard set of 3–5 tells you nearly as much, with less risk. If you do test one, warm up well and use a spotter or safety bars.</p>
${cta('Track your estimated max automatically', 'Uplift works out your best estimated 1RM from every set you log, and shows it climbing over time for each lift.')}`,
  });
  page({
    path: '/tools/plate-calculator/', title: 'Barbell plate calculator: what to load on each side (kg and lb) | Uplift',
    desc: 'Free plate calculator: enter the weight you want on the bar and see which plates to load on each side, for 20, 15 or 10 kg bars (or 45, 35, 15 lb).',
    crumbs: [['Plate calculator', '/tools/plate-calculator/']],
    script: PLATE_JS,
    body: `    <div class="eyebrow">Free tool</div>
    <h1>Barbell plate calculator</h1>
    <p class="lead">Type the total you want on the bar and see exactly which plates go on each side.</p>
    <div class="tool">
      <div class="fields">
        <label>Total weight<input id="w" inputmode="decimal" value="60" /></label>
        <label>Bar<select id="b"></select></label>
        <label>Unit<select id="u"><option>kg</option><option>lb</option></select></label>
      </div>
      <div class="result" id="out" aria-live="polite">
        <span class="muted">On each side</span><span class="big" id="side"></span>
        <div class="plates" id="pic" aria-hidden="true"></div>
        <p class="small" id="note"></p>
      </div>
    </div>
    <h2>How to load a barbell</h2>
    <ol class="steps"><li>Take the weight of the bar off the total: a standard Olympic bar is 20 kg (45 lb), and women’s and technique bars are often 15 kg or 10 kg.</li><li>Halve what’s left. That’s the weight for each side.</li><li>Make it up with the heaviest plates first, then the smaller ones on the outside. Use collars.</li></ol>
    <p>Example: 100 kg on a 20 kg bar leaves 80 kg, so 40 kg a side: a 25 and a 15. No 15s at your gym? A 25, a 10 and a 5 makes the same.</p>
    <h2>Which plates does it use?</h2>
    <p>Standard sets: 25, 20, 15, 10, 5, 2.5 and 1.25 kg plates, or 45, 35, 25, 10, 5 and 2.5 lb. If a total can’t be made exactly, it tells you the nearest weight you can load.</p>
${cta('A plate calculator mid-workout', 'Uplift has this built in: from any barbell exercise, tap Plate calculator and it fills in the weight you’re about to lift.')}`,
  });
};

// ---------- Strong comparison ----------
const strongAlt = () => page({
  path: '/strong-alternative/', title: 'A free Strong app alternative with no account and no limits | Uplift',
  desc: 'Looking for a Strong alternative? Uplift is a free workout tracker with unlimited templates, no account and no subscription. Bring your Strong history with you.',
  crumbs: [['Strong alternative', '/strong-alternative/']],
  body: `    <div class="eyebrow">Strong alternative</div>
    <h1>A free Strong alternative, with nothing to sign up for</h1>
    <p class="lead">Strong is a good app. If you’ve hit the free version’s limit on routines, or don’t want a subscription or an account, Uplift logs your training the same way and keeps every set on your phone.</p>
    <h2>Uplift and Strong side by side</h2>
    <div class="table"><table>
      <thead><tr><th></th><th>Uplift</th><th>Strong (free)</th><th>Strong PRO</th></tr></thead>
      <tbody>
        <tr><td>Price</td><td>Free</td><td>Free</td><td>$4.99 a month or $29.99 a year (US)</td></tr>
        <tr><td>Saved routines / templates</td><td>Unlimited, plus 14 ready-made</td><td>3 custom routines</td><td>Unlimited</td></tr>
        <tr><td>Workout history</td><td>Unlimited</td><td>Unlimited</td><td>Unlimited</td></tr>
        <tr><td>Account</td><td>None: there isn’t one</td><td colspan="2">Free Strong account</td></tr>
        <tr><td>Where your data lives</td><td>Only on your phone</td><td colspan="2">Synced through your Strong account</td></tr>
        <tr><td>How you get it</td><td>From the browser, installs to your Home Screen</td><td colspan="2">App Store and Google Play</td></tr>
        <tr><td>Apple Watch app</td><td>No</td><td colspan="2">Yes</td></tr>
      </tbody>
    </table></div>
    <p class="small">Strong’s details are from its <a href="https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577">App Store listing</a> and <a href="https://www.strong.app/">website</a>, checked in ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}. Prices vary by country.</p>
    <h2>What feels the same</h2>
    <ul class="list"><li>A set table with last time’s numbers already filled in. Type over them and tick each set.</li><li>A rest timer that starts on its own, plus supersets, warm-up and drop sets, and RPE.</li><li>Personal bests, an estimated one-rep max for every lift, and charts over time.</li><li>A plate calculator and templates you can start in one tap.</li></ul>
    <h2>What’s different</h2>
    <ul class="list"><li><b>No account and no server.</b> Nothing is uploaded, so there’s nothing to sign in to, and nothing to leak. Backups are files you keep yourself, and you can lock them with a passphrase.</li><li><b>More than lifting.</b> Yoga poses and breathing, runs, rides and classes, and a weight trend against a target, all in one log.</li><li><b>Form cues and drawings</b> for every built-in lift, one tap away mid-set.</li><li><b>Several people on one phone,</b> each with their own history.</li></ul>
    <h2>Where Strong is the better pick</h2>
    <p>If you want an Apple Watch app, or your workouts synced across a phone and a tablet, Strong does that and Uplift doesn’t. Uplift keeps your data on one phone on purpose. To move to a new phone, you save a backup file and open it there.</p>
    <h2>Bring your Strong history</h2>
    <p>You don’t have to start again. Export a CSV from Strong’s settings and import it in Uplift: every workout, set, warm-up and cardio session comes across, and each workout name becomes a template. <a href="/strong/">Step-by-step guide</a>.</p>
${cta('Try Uplift now', 'Open it in your phone’s browser and log a workout in under a minute. Nothing to download from a store and nothing to sign up for.')}`,
});

// ---------- indexes ----------
function exerciseIndex() {
  const groups = [...GROUPS, 'Yoga', 'Pranayama'];
  page({
    path: '/exercises/', title: 'Exercise guides: how to do 113 gym exercises and yoga poses | Uplift',
    desc: 'Free exercise guides with form cues: how to do each lift, the muscles it works and the mistakes to avoid. Chest, back, shoulders, legs, arms, core, yoga and breathing.',
    crumbs: [['Exercises', '/exercises/']],
    body: `    <div class="eyebrow">Exercise library</div>
    <h1>Exercise guides</h1>
    <p class="lead">How to do ${guides.length} gym exercises, yoga poses and breathing practices: the setup, the steps, the muscles worked and the mistakes to avoid. These are the same cues Uplift shows you mid-workout.</p>
    <nav aria-label="Jump to"><ul class="chips">${groups.map((g) => `<li><a href="#${slug(g)}">${esc(sectionOf(g))}</a></li>`).join('')}</ul></nav>
${groups.map((g) => `    <h2 id="${slug(g)}">${esc(sectionOf(g))}</h2>\n    <ul class="links">${guides.filter((e) => e.group === g).map((e) => `<li><a href="${exUrl(e.id)}"><b>${esc(display(e))}</b>${e.muscles ? `<span>${esc(list(m(e.muscles.main)))}</span>` : ''}</a></li>`).join('')}</ul>`).join('\n')}
    <p class="small" style="margin-top:28px">Want ready-made sessions? See <a href="/workouts/">workouts and plans</a>.</p>
${cta('Every guide, in your pocket at the gym', 'Uplift shows these cues and drawings for each built-in exercise while you log your sets.')}`,
  });
}
function workoutIndex() {
  page({
    path: '/workouts/', title: 'Free workout plans and routines: push pull legs, upper/lower, full body | Uplift',
    desc: 'Free workout plans for the gym: push pull legs, an upper/lower split and a 3-day full body plan, plus chest, back, leg, arm, glute and core workouts.',
    crumbs: [['Workouts', '/workouts/']],
    body: `    <div class="eyebrow">Workouts and plans</div>
    <h1>Free workout plans and routines</h1>
    <p class="lead">Ready-made plans and single workouts, with every exercise linked to how to do it. They’re all built into Uplift, so you can start one at the gym in a tap.</p>
    <h2>Plans</h2>
    <ul class="links">${PLANS.map((p) => `<li><a href="${pUrl(p.id)}"><b>${esc(PLAN[p.id][1])}</b><span>${esc(p.about)}</span></a></li>`).join('')}</ul>
    <h2>Single workouts</h2>
    <ul class="links">${STARTERS.map((t) => `<li><a href="${wUrl(t.id)}"><b>${esc(WORKOUT[t.id][1])}</b><span>${t.exercises.length} ${t.id === 'starter-yoga' ? 'poses' : 'exercises'}${t.id === 'starter-yoga' ? '' : ` · ${esc(list(musclesOf(t).slice(0, 3)))}`}</span></a></li>`).join('')}</ul>
${cta('Start any of these in Uplift', 'Pick a plan and Uplift tells you which workout is next. Your sets fill in from last time, so you just lift and tick.')}`,
  });
}
function notFound() {
  page({
    path: '/404.html', index: false, title: 'Page not found | Uplift', desc: 'This page doesn’t exist. Try the exercise guides, workout plans or calculators.',
    body: `    <h1>That page isn’t here</h1>
    <p class="lead">It may have moved. Try one of these:</p>
    <ul class="links" style="margin-top:24px"><li><a href="/"><b>Uplift home</b><span>The private training log</span></a></li><li><a href="/exercises/"><b>Exercise guides</b><span>How to do ${guides.length} exercises and poses</span></a></li><li><a href="/workouts/"><b>Workouts and plans</b><span>Push pull legs, upper/lower, full body</span></a></li><li><a href="/tools/one-rep-max-calculator/"><b>1RM calculator</b><span>Estimate your max from any set</span></a></li></ul>`,
  });
}

// ---------- build ----------
for (const d of OWNED) rmSync(join(site, d), { recursive: true, force: true });
for (const e of guides) if (hasArt(e)) cpSync(join(app, 'public/illustrations', e.id), join(site, 'assets/illustrations', e.id), { recursive: true });
cpSync(join(app, 'public/illustrations/LICENSE.md'), join(site, 'assets/illustrations/LICENSE.md'));
guides.forEach(exercisePage);
STARTERS.forEach(workoutPage);
PLANS.forEach(planPage);
tools(); strongAlt(); exerciseIndex(); workoutIndex(); notFound();

const seen = new Set();
for (const [p, html] of pages) {
  if (seen.has(p)) throw new Error(`Two pages at ${p}`);
  seen.add(p);
  const file = p.endsWith('.html') ? join(site, p) : join(site, p, 'index.html');
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, html);
}
const urls = ['/', '/strong/', ...pages.map(([p]) => p).filter((p) => !p.endsWith('.html'))];
writeFileSync(join(site, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log(`${pages.length} pages, ${urls.length} in sitemap.xml`);
