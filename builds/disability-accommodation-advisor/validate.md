# Validation Scenario

## Test Case: ADHD Workplace Accommodation — Open Office Noise

**User prompt:**
> I have ADHD and I work as a data analyst at a mid-size tech company (about 200 employees) in Oregon. Our office is completely open-plan and the noise makes it nearly impossible for me to concentrate. I've been struggling for months and my manager just told me my productivity is slipping. I haven't formally requested accommodation yet. My name is Casey Park.

## Expected Agent Behavior

1. **analyze_accommodation_needs** should:
   - Identify ADA Title I as applicable (200 employees > 15 threshold)
   - Suggest ADHD-relevant accommodations: noise-canceling headphones, private/quiet workspace, remote work, white noise machine, written instructions
   - Note that noise sensitivity is a recognized ADHD barrier
   - Outline the interactive process for first-time requests
   - Mention Oregon may have additional state protections
   - Note FMLA eligibility (200 employees > 50 threshold)

2. **search_accommodation_laws** should:
   - Search for Oregon disability accommodation laws
   - Find ADA/EEOC guidance on ADHD accommodations
   - Find information about open office accommodation requirements

3. **search_accommodation_examples** should:
   - Find JAN recommendations for ADHD workplace accommodations
   - Find examples of noise-reduction accommodations
   - Find community experiences with ADHD workplace accommodations

4. **write_accommodation_request** should generate:
   - Formal request letter to HR citing ADA Title I
   - Describing functional limitation (concentration affected by noise) without requiring diagnosis disclosure
   - Requesting specific accommodations (noise-canceling headphones, quiet workspace, remote work option)
   - Documentation checklist (doctor's letter about functional limitations)
   - Escalation plan if denied
   - EEOC complaint filing guide

## Key Assertions

- Agent does NOT ask for specific diagnosis — works with functional description
- Agent suggests multiple concrete accommodations (not just "talk to HR")
- Agent mentions that most ADHD accommodations cost under $500
- Agent warns about NOT waiting — request BEFORE any performance issues worsen
- Agent mentions JAN as a resource for additional accommodation ideas
- Agent generates a professional request letter that the user can customize
- Disclaimer about not being legal advice is included
