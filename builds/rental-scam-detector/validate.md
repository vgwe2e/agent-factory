# Validation Scenarios

## Scenario 1: Obvious scam signals
**Input**: "Is this legit? 3BR apartment in Manhattan for $600/mo. Landlord is deployed overseas and wants me to wire $2400 via Western Union. Contact: rentals4u@gmail.com"
**Expected**: Score 8-10, HIGH RISK, flags: below-market price, remote landlord, wire transfer, personal email.

## Scenario 2: Legitimate-sounding listing
**Input**: "Check this listing: 2BR at 456 Oak Ave, Portland OR for $1,800/mo from Pacific Property Management. Contact: leasing@pacificpm.com"
**Expected**: Score 1-4, LOW RISK. Company email, reasonable price, verifiable management company.

## Scenario 3: Ambiguous listing
**Input**: "Found on Craigslist: 1BR near downtown Austin for $950/mo. No photos, just a phone number: 512-555-1234."
**Expected**: Score 4-7, MODERATE RISK. Craigslist platform risk, no photos, but price may be reasonable.
