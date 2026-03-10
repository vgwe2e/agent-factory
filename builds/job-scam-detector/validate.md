# Validation: Job Scam Detector

## Test Scenario 1: Obvious Scam

**Prompt**: "Check this job posting: Work from home, earn $5000/week, no experience needed. Send $50 processing fee to get started. Contact hiring.manager2024@gmail.com"

**Expected behavior**:
1. Agent recognizes pasted text (skips fetch_job_posting)
2. Agent attempts to verify the employer (no company name — red flag)
3. Agent generates a risk report with score 9-10 (SCAM)
4. Red flags: processing fee, unrealistic salary, no company name, Gmail contact, no experience needed

**Expected red flags**: money request, Gmail domain, unrealistic pay, vague description, no company name

## Test Scenario 2: Legitimate-Looking Posting

**Prompt**: "Is this job legit? Senior Software Engineer at Microsoft, Redmond WA. $180K-$250K. Requires 5+ years experience with distributed systems. Apply at careers.microsoft.com"

**Expected behavior**:
1. Agent notes this is pasted text
2. Agent uses verify_employer for "Microsoft" — finds extensive web presence
3. Agent generates a risk report with score 1-2 (SAFE)
4. Green flags: well-known company, realistic salary, specific requirements, official careers domain

## Test Scenario 3: Suspicious but Ambiguous

**Prompt**: "Found this on Indeed: Data Entry Specialist, FlexWork Solutions LLC. Remote, $35/hour, no experience required. Send resume to hr@flexworksolutions.net"

**Expected behavior**:
1. Agent notes pasted text
2. Agent uses verify_employer for "FlexWork Solutions LLC" — may find limited presence
3. Agent generates report with score 5-7 (CAUTION or LIKELY SCAM)
4. Red flags: no experience needed, somewhat high pay for data entry, generic company name
5. Recommendation: research independently before proceeding

## Validation Checklist

- [ ] All 3 tools execute without errors
- [ ] Tool chain follows correct order: fetch → verify → report
- [ ] Risk scores are calibrated reasonably
- [ ] Reports include actionable next steps
- [ ] Output files are saved to ./output/
