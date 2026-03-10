# Validation: Property Tax Appeal Advisor

## Test Scenario

**Prompt**: "My property at 456 Oak Ave, Naperville, IL 60540 is assessed at $425,000. It's a 3-bedroom, 2-bathroom single family home, about 1,800 square feet, built in 1995. I think that's too high compared to recent sales nearby. Can you help me determine if I should appeal?"

## Expected Tool Chain

1. `search_comparable_sales` — searches for recently sold homes near Naperville, IL with 3BR, ~1800 sqft
2. `web_fetch` — fetches Zillow/Redfin property pages for specific comparable sale prices
3. `analyze_assessment` — compares $425,000 assessed value against comparable sales
4. `web_search` — searches for "DuPage County IL property tax appeal process deadlines 2026"
5. `web_fetch` — fetches DuPage County assessor website for appeal forms and deadlines
6. `write_appeal_report` — generates comprehensive report with comps, process, and draft letter

## Expected Output

A saved markdown report (`output/456-oak-ave-appeal.md` or similar) containing:

- [ ] Assessment analysis showing whether $425K is above/below market
- [ ] 3+ comparable sales with addresses, sale prices, dates, and property details
- [ ] DuPage County-specific appeal deadlines and filing instructions
- [ ] County assessor contact information
- [ ] Draft appeal letter addressed to the Board of Review
- [ ] Estimated annual tax savings if appeal succeeds
- [ ] Tips for presenting the case at a hearing
- [ ] Disclaimer that this is not legal/tax advice

## Validation Criteria

- [ ] `npm install` succeeds without errors
- [ ] `npm run dev` starts the development server
- [ ] Agent responds with a structured, multi-step research process
- [ ] Comparable sales data is gathered from real sources
- [ ] Appeal process is specific to DuPage County, IL (not generic)
- [ ] Report is saved to the output directory
- [ ] Agent provides honest assessment (even if the property is fairly assessed)
