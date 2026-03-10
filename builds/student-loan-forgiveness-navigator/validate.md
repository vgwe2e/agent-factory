# Validation — Student Loan Forgiveness Navigator

## Test Scenario

**Prompt**: "I have $85,000 in Direct Loans from grad school. I've been working as a social worker at a county government agency for 3 years, making $52,000/year. I'm on the standard repayment plan paying $890/month. Family size is 2. Am I eligible for any forgiveness?"

## Expected Agent Behavior

1. **analyze_loan_situation** called with:
   - loan_types: "direct"
   - total_balance: "$85,000"
   - monthly_payment: "$890"
   - income: "$52,000"
   - family_size: "2"
   - employer_type: "government"
   - years_of_payments: "3"
   - repayment_plan: "standard"

2. **search_forgiveness_programs** called with:
   - program: "pslf"
   - specific_question: current PSLF rules or SAVE status

3. **check_repayment_options** called with:
   - income: "$52,000"
   - family_size: "2"
   - total_balance: "$85,000"
   - loan_type: "grad"
   - pursuing_pslf: "yes"

4. **write_forgiveness_guide** called with:
   - primary_program: "pslf"
   - recommended_plan: lowest-payment IDR
   - Includes analysis, research, and comparison from prior tools

## Expected Output

- PSLF eligibility confirmed (government employer + Direct Loans)
- IDR plan comparison showing significant savings vs standard plan
- Recommendation to switch from standard to IDR immediately
- PSLF application steps and annual certification process
- ~7 years remaining to forgiveness
- Warning about SAVE litigation status

## Build Validation

```bash
npx tsc --noEmit    # Must pass
npx next build      # Must pass
```
