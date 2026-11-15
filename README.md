# Precision Jiu Jitsu website

The repository contains the website source for GitHub and Vercel. `index.html` is the single current homepage and contains the latest design and SEO work. The build publishes it and generates the additional pages from maintained content and templates. The older homepage is archived outside the repository in `Website working files/Homepage archive`.

## Review locally

Use Node.js 24 and npm. There are no application package dependencies.

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:8765/`. Use this server to review the full site because nested clean routes need HTTP routing. Stop it with Ctrl+C. The local server always returns pages with `noindex, nofollow`, regardless of launch settings.

```powershell
npm test
npm run build
```

The build writes an isolated `dist` folder. It clears only that generated folder before rebuilding, so removed pages cannot remain in a later deployment. It does not edit source HTML. Never point Vercel at the repository root as its static output.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Academy, video hero, coaches, schedule, member videos and trial request |
| `/shawn-melanson` | Instructor background, competition results and selected instructionals |
| `/instructionals` | Complete seven course library and topic guidance |
| `/instructionals/arm-bar-it-all` | Armbar curriculum, public sample and preview |
| `/instructionals/precision-wrestling-for-jiu-jitsu` | Standing wrestling curriculum, public sample and preview |
| `/instructionals/modernized-headquarters-passing` | Headquarters passing curriculum and public preview |
| `/instructionals/precision-top-stuff` | Top game curriculum, public sample and preview |
| `/instructionals/butterfly-half-and-knee-shield` | Guard attacks curriculum, public sample and preview |
| `/instructionals/seated-sweeps-and-wrestle-ups` | Seated offense curriculum, public sample and preview |
| `/instructionals/leg-drag-system` | Leg drag curriculum and public preview |
| `/adult-no-gi-jiu-jitsu` | Adult program, coaching, timetable and first visit questions |
| `/kids-jiu-jitsu` | Confirmed ages 5 and up, timetable and parent questions |
| `/first-class` | Visit process, clothing, directions and contact |
| `/privacy` | Enquiry handling and external services |

There is also a branded `404.html`, circular SVG favicon, browser manifest, `llms.txt`, `robots.txt` and `sitemap.xml`. `README.md` is repository documentation and is excluded from the public output. No service worker or offline cache is installed.

## Maintain content

1. Edit homepage content in `index.html` and instructor content in `shawn-melanson.html`. There is one homepage source to maintain.
2. Edit class times in `scripts/data/schedule.json`. Both the rendered homepage and local program pages use this source. The handwritten homepage also retains readable reference times, which the build replaces with the maintained schedule.
3. Edit verified publisher facts and public player URLs in `scripts/data/courses.json`. The seven course routes, original explanatory material and page metadata live in `scripts/site-data.mjs`.
4. Edit shared new page markup in `scripts/render-pages.mjs` and styling in `site-assets/pages.css`. Existing homepage styling stays in `site-assets/site.css`; profile styling stays in `site-assets/shawn-melanson.css`.
5. Add a new page to the registry in `scripts/site-data.mjs`. The build, local server and production sitemap all use that registry. New pages need unique content, metadata, an internal entry link and a useful purpose.
6. Recheck course sources when the publisher changes its catalog. The current curriculum and player inventory was checked November 15, 2026. Prices are deliberately left with the publisher because offers change.

The site has seven public previews and five additional free samples. Permission to use those public players was confirmed by Ryan. Full courses stay on BJJ Fanatics. Players load only after a visitor chooses to load one. Cover art is requested from the publisher; the media is not copied into this repository. Keep the publisher fallback link if an embed changes or becomes unavailable.

Shawn’s profile displays all seven courses. Its catalog block is generated from the same course data during local preview and production builds, using `renderProfileCatalog` in `scripts/render-pages.mjs`. The marked block in the source HTML is a readable reference copy. Keep the catalog data authoritative when making future changes. The Leg Drag listing has 33 curriculum chapters across two volumes; that total includes introductory and closing sections.

The Air Jail section embeds a 54 second excerpt from the official Fighting for Your Life Podcast interview, from 27:24 to 28:18, after a visitor chooses to load it. The segment was located through the public episode captions. A separate link opens the complete interview. Its YouTube thumbnail can load before playback. The opening competition video remains silent and separate from this optional interview. The privacy page describes these providers.

Seminar and private training buttons prepare email to the verified Precision gym inbox. They do not send a message, take payment or confirm availability. Retreat information links to Hero Academy because the organizer’s dates have changed and its pages currently disagree. Do not copy a fixed date from an older search result.

The profile’s IBJJF medals link to the federation’s official result pages. Kansas City 2020 was a gi result. Its press links distinguish course reviews from competition reporting. The student quote comes from the existing member testimonial video, which is linked beside the quote. Travel totals and an unverified personal Facebook account are omitted.

Course summaries and study suggestions are authored page content based on the published curriculum. They are not personal quotes, transcripts or reviews of the complete courses. Shawn should review the wording and may add original coaching commentary later. VideoObject markup is omitted because verified upload dates and complete sample metadata were not available. No publisher ratings are imported into academy review schema.

## Vercel and indexing

`vercel.json` uses the existing static setup, `npm run build`, output `dist`, clean URLs and the trial API. Research notes, tests, server internals and documentation are not copied into static output.

Keep these settings for the current preview:

```text
SITE_URL=https://precisionjiujitsunh.com
SITE_LAUNCH_READY=false
```

`SITE_URL` is the intended canonical origin. It must be HTTPS without a path, query or credentials. The existing canonical value is a launch placeholder while the Vercel site remains a review preview. Confirm the final public domain before launch.

Public indexing requires both `VERCEL_ENV=production` and `SITE_LAUNCH_READY=true`. A preview deployment remains excluded even if the launch flag is accidentally true. Vercel supplies `VERCEL_ENV`; do not override it. While excluded, every page carries `noindex, nofollow`, and the generated sitemap is empty. Crawling is allowed so search engines can read that directive. This is indexing protection, not password protection.

At an approved launch, the build generates a complete sitemap with all 14 canonical public pages and adds its address to robots.txt. The 404 page always stays excluded. `llms.txt` is a readable navigation aid, not a ranking guarantee or access control mechanism. Google does not require a special AI file for AI search inclusion. References: [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [robots.txt guidance](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt), [llms.txt proposal](https://llmstxt.org/).

Before changing DNS or enabling indexing:

1. Confirm the public domain, canonical origin and Vercel domain setup. Keep preview deployments excluded.
2. Obtain the existing Search Console baseline and valuable old URLs. Current redirects preserve `/about`, `/services`, `/contact` and `/index.html`; map any additional useful old URLs before replacing the current public site.
3. Configure and test the enquiry provider, including actual inbox receipt and the staff response process.
4. Review the pages with Shawn, check current schedule and contact details, and check all public players.
5. Review the privacy notice before adding analytics or changing data collection.
6. After the approved deployment, check page and header directives, redirects, canonicals, the sitemap and mobile rendering on the actual domain. Submit the sitemap in Search Console and Bing Webmaster Tools using the owner’s accounts.

## Trial requests

Copy `.env.example` to `.env.local` for local configuration. Set the same server secrets in Vercel when ready. Never commit actual credentials.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend server key |
| `TRIAL_FROM_EMAIL` | Sender on a domain verified with Resend |
| `TRIAL_TO_EMAIL` | Intended gym inbox |
| `SITE_URL` | Intended public origin |
| `SITE_LAUNCH_READY` | Explicit indexing switch, initially false |

Without provider credentials, the form clearly reports that sending is unavailable and offers prepared email and phone alternatives. Preparing or copying an email does not send it. A successful API response means the email provider accepted the request. It does not prove inbox delivery, a confirmed class or a membership sale. Confirm those outcomes with the gym.

## Measurement

`site-assets/measurement.js` supplies privacy limited browser events through `window.PrecisionMeasurement.track` and the `precision:measurement` CustomEvent. It installs no analytics provider, cookies, advertising pixel, storage or automatic page view reporting. These hooks provide infrastructure; no reporting dashboard is active until a provider is deliberately connected.

| Event | Meaning |
| --- | --- |
| `trial_request_accepted` | API and email provider accepted a request |
| `phone_click` | Visitor selected a phone link |
| `email_click` | Visitor selected an email link |
| `instructional_click_out` | Visitor selected a course purchase link |
| `course_player_loaded` | Visitor loaded a public iframe |

Only event name, page path, course slug and placement can be included. Form values, email addresses, phone numbers entered by visitors, query strings and message text are excluded. Player loading is not playback or completion. Cross domain players are not treated as observable lesson progress.

Connect a chosen analytics provider to these events only after its privacy and consent requirements have been addressed. Record confirmed trials, attendance and memberships separately. For course sales, obtain Shawn’s approved attribution links or publisher reports; clicks alone do not prove purchases. No affiliate attribution has been invented.

## Quality checks and continuing work

Tests cover request validation and failure handling, source preservation, preview and production indexing, metadata and schema, and internal page and asset discovery. The build includes only the static asset folders on its allow list. GitHub Actions runs the tests and build on pushes and pull requests.

Local review on November 15, 2026: all 11 automated tests passed, all 14 routes responded successfully, and all seven public previews plus five free samples played in the browser. Responsive checks included desktop and mobile widths of 390 and 320 pixels. The homepage retained its transparent header and autoplaying, muted, looping video. These checks are local verification, not production field performance measurements.

Research reports, screenshots and other working material belong in the separate `Website working files` folder outside this repository. Build output is ignored by Git. Commit source, content, tests and documentation through GitHub Desktop when the review is complete.

Ongoing work from the strategy requires the owner’s accounts and real observations: Google Business Profile updates, Search Console and Bing setup, analytics selection, publisher sales attribution, new coaching contributions, partnerships and periodic performance reviews. No traffic, sales, field performance or ranking baseline is invented here. Review public results after sufficient real activity before adding more pages.
