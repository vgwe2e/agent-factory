# Validation Scenarios

## Scenario 1: Known clean domain
**Input**: "Check google.com"
**Expected**: Score 8-10, CLEAN label, long registration history, proper DNS, no blacklists.

## Scenario 2: Expired/parked domain
**Input**: "Check some-random-expired-domain.com"
**Expected**: Score varies. Should detect if domain is parked, check Wayback history, note any reputation issues.

## Scenario 3: Known problematic domain
**Input**: "Check a domain with known spam history"
**Expected**: Score 1-4, HAUNTED label, blacklist appearances noted, recommendation to skip.
