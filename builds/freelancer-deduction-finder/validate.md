# Validation Test: Freelancer Deduction Finder

## Test Scenario

**User prompt**: "I'm a freelance web developer making about $85,000 per year. I work from a dedicated home office (150 sq ft), drive to client meetings about twice a week, pay $400/month for health insurance for my family, and spend on: software subscriptions (GitHub, VS Code extensions, cloud hosting), a new laptop ($2,200), internet ($100/mo), phone ($80/mo), online courses, and occasional business travel."

## Expected Agent Behavior

1. **search_deductions** called with profession "web developer" → returns IRS deduction sources
2. **analyze_expenses** called with full profile → returns structured analysis covering:
   - Self-employment tax deduction (automatic)
   - QBI deduction (up to 20%)
   - Home office deduction ($750 simplified or more via regular method)
   - Vehicle/mileage deduction
   - Self-employed health insurance ($4,800/year)
   - Equipment (Section 179 for laptop)
   - Software subscriptions
   - Internet (business %)
   - Phone (business %)
   - Education/professional development
   - Travel expenses
3. **web_search** or **web_fetch** used to verify current mileage rate and Section 179 limits
4. **write_deduction_report** called with comprehensive summary → saves report to output/

## Expected Output

A markdown report in `output/` containing:
- [ ] 10+ applicable deductions identified
- [ ] Estimated total savings range (should be $8,000 - $15,000+ given the profile)
- [ ] IRS form references for each deduction (Schedule C, Form 8829, Schedule SE, etc.)
- [ ] Specific dollar ranges for each deduction
- [ ] Action items (track mileage, measure office, keep receipts, etc.)
- [ ] Record-keeping checklist
- [ ] Disclaimer about not being tax advice

## Pass Criteria

- [ ] `npm install && npm run dev` succeeds
- [ ] Agent identifies at least 10 applicable deductions
- [ ] Report includes IRS form references
- [ ] Estimated savings are in a reasonable range
- [ ] Disclaimer is included
- [ ] Report is saved to output/ directory
