# Validation — Digital Estate Planning Advisor

## Test Scenario

**Prompt**: "I need help planning what happens to my digital life. I use Gmail, Facebook, Instagram, Amazon, Netflix, Coinbase, Dropbox, and GoDaddy. I have some Bitcoin and a couple domain names. I live in California and don't have a will yet. My wife Sarah should get access to everything."

## Expected Agent Behavior

1. **analyze_digital_estate** called with:
   - accounts: "Gmail, Facebook, Instagram, Amazon, Netflix, Coinbase, Dropbox, GoDaddy"
   - digital_assets: includes "cryptocurrency", "domain_names"
   - state: "California"
   - has_will: "no"
   - beneficiary: "Sarah" or "wife"
   - has_password_manager: determined from conversation

2. **search_platform_policies** called for specific platforms (likely Coinbase for crypto estate access)

3. **search_estate_laws** called with:
   - state: "California"
   - topic: "RUFADAA" or "digital assets"

4. **write_estate_plan** called with all gathered information

## Expected Output

- Google Inactive Account Manager setup instructions
- Facebook Legacy Contact setup instructions
- Coinbase crypto access documentation for estate
- Password manager recommendation and setup guide
- Crypto recovery phrase storage instructions
- Will template with digital asset clause
- Emergency access card template
- California RUFADAA information
- Communication plan for Sarah

## Build Validation

```bash
npx tsc --noEmit    # Must pass
npx next build      # Must pass
```
