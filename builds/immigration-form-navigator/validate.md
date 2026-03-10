# Validation Scenario

## Test Case: H-1B to Green Card — Indian National

**User prompt:**
> I'm on an H-1B visa working as a software engineer at Google. I'm from India and I've been in the US for 3 years. My employer is willing to sponsor me for a green card through PERM. I also want to explore the EB-2 NIW self-petition option. What forms do I need and what's the realistic timeline given the India backlog?

## Expected Agent Behavior

1. **analyze_immigration_situation** should:
   - Identify two paths: employer-sponsored (PERM → I-140 → I-485) and self-petition (EB-2 NIW I-140 → I-485)
   - List forms: ETA-9089 (PERM), I-140, I-485, I-765 (EAD), I-131 (Advance Parole)
   - Flag India backlog warning for EB-2/EB-3
   - Mention premium processing for I-140
   - Warn about maintaining H-1B status while I-485 is pending

2. **search_immigration_requirements** should:
   - Search for current EB-2 NIW requirements and approval rates
   - Search for PERM processing times
   - Find current fee information

3. **check_visa_bulletin** should:
   - Check EB-2 India priority dates
   - Check EB-1 India priority dates (alternative path)
   - Reveal the multi-year backlog for India EB-2/EB-3

4. **write_filing_guide** should generate a guide with:
   - Both paths compared (PERM vs NIW)
   - Document checklist for each path
   - Fee summary
   - Realistic timeline acknowledging India backlog (10+ years for EB-2)
   - Common mistakes to avoid
   - Suggestion to consider EB-1A/EB-1B as faster alternatives

## Key Assertions

- Agent identifies BOTH paths (PERM and NIW) with correct forms for each
- Agent correctly warns about India EB-2 backlog (10+ years)
- Agent suggests EB-1 as a potentially faster alternative
- Agent mentions premium processing option for I-140
- Agent warns about not leaving US without Advance Parole while I-485 is pending
- Agent mentions that I-485 can only be filed when priority date is current
- Disclaimer about not being legal advice is included
