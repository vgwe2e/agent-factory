# Validation — Tenant Dispute Advisor

## Test Scenario

**Prompt**: "My landlord in Portland, Oregon hasn't fixed the broken heater in my apartment for 6 weeks. I've texted him about it three times and he just says 'I'll get to it.' My rent is $1,800/month, I have a year lease ending in August, and I have screenshots of all the texts. The landlord is Greenfield Property Management. What can I do?"

## Expected Agent Behavior

1. **analyze_tenant_dispute** called with:
   - state: "Oregon"
   - dispute_description: mentions broken heater, 6 weeks, landlord promised but didn't fix
   - dispute_type: should auto-classify as "habitability"
   - rent_amount: "$1,800"
   - lease_type: "fixed_term"
   - has_documented_issue: "yes"
   - landlord_response: "promised_but_didnt"

2. **search_tenant_rights** called with:
   - state: "Oregon"
   - city: "Portland"
   - topic: related to habitability, repair and deduct, warranty of habitability

3. **research_landlord_record** called with:
   - landlord_name: "Greenfield Property Management"
   - city_state: "Portland, Oregon"

4. **write_tenant_action_plan** called with:
   - dispute_type: "habitability"
   - landlord_name: "Greenfield Property Management"
   - state: "Oregon"
   - property_address, tenant_name as provided
   - Includes dispute_analysis, rights_research, landlord_research from prior tool results

## Expected Output

- Demand letter citing Oregon warranty of habitability
- Repair and deduct procedure for Oregon
- Code enforcement filing instructions
- Documentation checklist
- Escalation timeline (14-day demand → code enforcement → small claims)
- Legal aid resources (Oregon-specific)

## Build Validation

```bash
npx tsc --noEmit    # Must pass
npx next build      # Must pass
```
