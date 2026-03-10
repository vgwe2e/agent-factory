# Validation: Dependency Changelog Summarizer

## Test Scenario 1: Scan own package.json

**Prompt**: "Scan package.json and tell me what needs updating"

**Expected behavior**:
1. Agent uses scan_dependencies on "package.json"
2. Finds: next, react, react-dom, @mozilla/readability, linkedom, etc.
3. Uses fetch_changelogs for the most critical ones (next, react)
4. Produces a report via write_update_report

**Expected output**: Markdown report with urgency levels for each dependency

## Test Scenario 2: Specific package inquiry

**Prompt**: "What are the breaking changes in React 19?"

**Expected behavior**:
1. Agent uses fetch_changelogs for "react" with context about v19
2. Finds React 19 release notes / migration guide
3. Summarizes key breaking changes

## Test Scenario 3: Python project

**Prompt**: "Check this requirements.txt: django==4.2\nflask==3.0.0\nrequests==2.31.0"

**Expected behavior**:
1. Agent recognizes pasted text (or user provides a file path)
2. Uses fetch_changelogs for django, flask, requests
3. Produces prioritized update report

## Validation Checklist

- [ ] scan_dependencies correctly parses package.json
- [ ] fetch_changelogs finds and returns release notes
- [ ] write_update_report produces well-formatted markdown
- [ ] Urgency levels are reasonable
- [ ] Reports are saved to ./output/
