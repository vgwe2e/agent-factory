# Validation: Repo Health Scanner

## Test Scenario 1: Well-known healthy repo

**Prompt**: "How healthy is facebook/react?"

**Expected behavior**:
1. fetch_repo_info returns: high stars, recent commits, good README, MIT license
2. analyze_community returns: active issues, merged PRs, CONTRIBUTING.md, external mentions
3. write_health_report: Grade A or B, high scores across all categories

## Test Scenario 2: Small but active repo

**Prompt**: "Check sindresorhus/got"

**Expected behavior**:
1. Should recognize a well-maintained utility library
2. Should note active maintenance, good docs
3. Grade B+ or A range

## Test Scenario 3: Potentially abandoned repo

**Prompt**: "Evaluate a repo that hasn't been updated in a year"

**Expected behavior**:
1. fetch_repo_info shows old last_push date
2. analyze_community shows unresponsive issues
3. Grade D or F with clear warning about abandonment risk

## Validation Checklist

- [ ] fetch_repo_info correctly parses GitHub API responses
- [ ] analyze_community checks issues, PRs, and community files
- [ ] write_health_report produces well-graded markdown
- [ ] Grades are calibrated (popular != healthy)
- [ ] Reports saved to ./output/
