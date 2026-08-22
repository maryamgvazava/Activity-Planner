# Georgia Land Marketplace

A small web app that keeps two databases:

1. **Lands for sale** — location, area (m²), cadastral code, category, owner,
   phone number, and the source post's link (plus price, added so the
   price/price-per-m² filters below have something to filter on).
2. **People who want to buy land** — location, area (m²), price or price
   range (with currency), advertiser name, phone number, and the source
   post's link.

Both are populated from ss.ge, home.ge, and Facebook posts containing
`იყიდება`, `ვყიდი` (for sale) or `ვიყიდი` (wants to buy), or entered/imported
manually. Listings are only accepted if their location resolves to somewhere
in Georgia.

You can filter either database by price, location, area (m²), and price per
m², and — for any land listing — search the buyers database for the top 10
best-matching buyers; the result is saved into its own `matches` store so you
can revisit it later without recomputing.

## Running it

```bash
npm install
npm run seed     # optional: adds a few sample rows so the UI isn't empty
npm start
```

Then open http://localhost:3000.

All data lives in `data/db.json` (a plain JSON file — no database server to
install). Delete it to start over.

## Populating data

### Manually / in bulk
- Use "+ Add land manually" / "+ Add buyer manually" in the UI.
- Or "Import CSV" — headers should match the API field names, e.g. for lands:
  `location,areaM2,cadastralCode,category,ownerName,phoneNumber,price,currency,sourceUrl,source`;
  for buyers: `location,areaM2,priceMin,priceMax,currency,advertiserName,phoneNumber,sourceUrl,source`.

### ss.ge / home.ge scrapers
`npm run scrape:ssge`, `npm run scrape:homege`, or click the buttons in the
UI. These do a plain, polite HTTP fetch of the public "land for sale" search
pages (see `.env.example` for the URLs) and parse the listing cards.

**Important caveat:** the CSS selectors in `server/scrapers/config.js` are a
best-effort starting point, not verified against the live sites — this
environment has no network access to ss.ge/home.ge to check their current
markup, and listing sites change their HTML periodically anyway. Run:

```bash
node server/scrapers/ssge.js --debug
```

which dumps the fetched page to `data/debug-ssge.html` so you can open it and
adjust the selectors in `config.js` to match reality. Also note that these
sites typically only reveal the phone number after an in-page "show number"
click, so `phoneNumber`/`cadastralCode`/`ownerName` will usually come back
empty from the scraper and need to be filled in by hand or by extending
`server/scrapers/genericSiteScraper.js` to hit the listing's detail page.

### Facebook
Facebook's Terms of Service prohibit scraping its HTML, and in practice it's
also blocked by login walls and bot detection — so this project doesn't do
that. Instead `server/scrapers/facebook.js` reads posts through the official
**Graph API**, from Pages/Groups you (the token owner) already have
legitimate permission to read:

1. Create a Meta developer app and generate a Page access token (see
   `.env.example` for the exact steps and required env vars:
   `FB_ACCESS_TOKEN`, `FB_PAGE_IDS`, `FB_GROUP_IDS`).
2. Run `npm run scrape:facebook` or click "Run Facebook ingest" in the UI.

Posts are classified by keyword — `იყიდება`/`ვყიდი` → lands-for-sale,
`ვიყიდი` → wants-to-buy — but only if the post also contains a land-related
word (მიწა, ნაკვეთი, საკადასტრო, …), so posts about selling/buying unrelated
things aren't pulled in. Phone number, area, price and location are then
extracted from the post text with regular expressions
(`server/scrapers/extract.js`); anything that can't be extracted is left
blank for manual follow-up.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/lands` | list + filter (`location`, `category`, `source`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, `minPricePerM2`, `maxPricePerM2`, `sortBy`, `order`) |
| POST/PUT/DELETE | `/api/lands[/:id]` | create/update/delete |
| GET | `/api/buyers` | list + filter (same shape, price filters match against the buyer's price range) |
| POST/PUT/DELETE | `/api/buyers[/:id]` | create/update/delete |
| POST | `/api/matches/:landId/search` | compute + persist the top 10 matching buyers for a land |
| GET | `/api/matches/:landId` | fetch the previously saved matches |
| POST | `/api/ingest/run/:source` | trigger `ssge` / `homege` / `facebook` |
| POST | `/api/ingest/import/lands` / `/buyers` | CSV upload (multipart field `file`) |

## Matching algorithm

For a land listing and a buyer, `server/lib/matching.js` scores:
- **Location** (0–40): exact/substring match, partial credit for shared
  region keywords.
- **Area** (0–30): closer desired vs. actual m² scores higher, falling to 0
  once they differ by 60%+.
- **Price** (0–30): full score if the land's price falls inside the buyer's
  price range, tapering off outside it; neutral (15) if either side didn't
  give a price.

Scheduling repeated scrapes is left to your OS/cron (or a process manager)
around `npm run scrape:all`.
