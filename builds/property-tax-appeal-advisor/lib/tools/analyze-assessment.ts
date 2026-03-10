import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'analyze_assessment',
  description:
    'Analyze a property tax assessment against comparable sales data to determine if the property is overassessed. Takes the assessed value and comparable sale prices, then calculates whether an appeal is likely worth pursuing.',
  parameters: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'The property address being assessed',
      },
      assessed_value: {
        type: 'string',
        description: 'Current assessed value from the county assessor (e.g. "$350,000")',
      },
      tax_rate: {
        type: 'string',
        description: 'Property tax rate as a percentage (e.g. "1.2%") or annual tax amount (e.g. "$4,200")',
      },
      comparable_sales: {
        type: 'string',
        description: 'Comparable sales data as text. Include sale prices, dates, addresses, and property details for each comp. Separate entries with newlines.',
      },
      property_details: {
        type: 'string',
        description: 'Details about the subject property: square footage, bedrooms, bathrooms, lot size, year built, condition notes, and any issues that might lower value.',
      },
      state: {
        type: 'string',
        description: 'State where the property is located (e.g. "Illinois", "Texas"). Needed for state-specific appeal rules.',
      },
    },
    required: ['address', 'assessed_value', 'comparable_sales', 'state'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const address = args.address as string
  const assessedValueStr = args.assessed_value as string
  const taxRate = (args.tax_rate as string) || 'Not provided'
  const comparableSales = args.comparable_sales as string
  const propertyDetails = (args.property_details as string) || 'Not provided'
  const state = args.state as string

  if (!address || !assessedValueStr || !comparableSales || !state) {
    return 'Error: address, assessed_value, comparable_sales, and state are required'
  }

  // Parse assessed value
  const assessedValue = parseFloat(assessedValueStr.replace(/[$,]/g, ''))
  if (isNaN(assessedValue)) {
    return `Error: Could not parse assessed value "${assessedValueStr}". Use format like "$350,000".`
  }

  const sections: string[] = []
  sections.push(`# Property Assessment Analysis\n`)
  sections.push(`**Property**: ${address}`)
  sections.push(`**State**: ${state}`)
  sections.push(`**Current Assessed Value**: $${assessedValue.toLocaleString()}`)
  sections.push(`**Tax Rate / Annual Tax**: ${taxRate}`)
  sections.push(`**Property Details**: ${propertyDetails}`)
  sections.push('')

  // Analyze comparable sales
  sections.push(`## Comparable Sales Data\n`)
  sections.push(comparableSales)
  sections.push('')

  // Extract sale prices from comparable sales text
  const priceMatches = comparableSales.match(/\$[\d,]+(?:\.\d{2})?(?:\s*(?:k|K))?/g) || []
  const prices: number[] = []
  for (const match of priceMatches) {
    const cleaned = match.replace(/[$,]/g, '')
    let value = parseFloat(cleaned)
    if (match.toLowerCase().includes('k')) value *= 1000
    if (value > 10000 && value < 50000000) { // Reasonable home price range
      prices.push(value)
    }
  }

  sections.push(`## Assessment Analysis\n`)

  if (prices.length === 0) {
    sections.push('⚠️ Could not automatically extract sale prices from comparable sales data.')
    sections.push('Please review the comparable sales manually and determine the average sale price.')
    sections.push(`\nIf comparable homes sold for less than $${assessedValue.toLocaleString()}, your property may be overassessed.`)
  } else {
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    const medianPrice = [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const overassessmentPct = ((assessedValue - avgPrice) / avgPrice) * 100

    sections.push(`### Comparable Sale Price Summary`)
    sections.push(`- **Number of comps**: ${prices.length}`)
    sections.push(`- **Average sale price**: $${Math.round(avgPrice).toLocaleString()}`)
    sections.push(`- **Median sale price**: $${Math.round(medianPrice).toLocaleString()}`)
    sections.push(`- **Price range**: $${Math.round(minPrice).toLocaleString()} – $${Math.round(maxPrice).toLocaleString()}`)
    sections.push('')

    sections.push(`### Assessment vs. Market Value`)
    sections.push(`- **Your assessed value**: $${assessedValue.toLocaleString()}`)
    sections.push(`- **Average comp sale price**: $${Math.round(avgPrice).toLocaleString()}`)
    sections.push(`- **Difference**: $${Math.abs(Math.round(assessedValue - avgPrice)).toLocaleString()} (${overassessmentPct > 0 ? 'over' : 'under'}assessed by ${Math.abs(overassessmentPct).toFixed(1)}%)`)
    sections.push('')

    if (overassessmentPct > 10) {
      sections.push(`### ✅ STRONG CASE FOR APPEAL`)
      sections.push(`Your property appears to be **overassessed by ${overassessmentPct.toFixed(1)}%** compared to comparable sales.`)
      sections.push(`This is well above the typical 5-10% threshold where appeals are worth pursuing.`)
      const potentialReduction = assessedValue - avgPrice
      sections.push(`\n**Potential assessment reduction**: ~$${Math.round(potentialReduction).toLocaleString()}`)
      // Estimate tax savings (rough — using common effective rates)
      const estimatedTaxSavings = potentialReduction * 0.012 // ~1.2% average effective rate
      sections.push(`**Estimated annual tax savings**: ~$${Math.round(estimatedTaxSavings).toLocaleString()} (at ~1.2% effective rate, varies by jurisdiction)`)
    } else if (overassessmentPct > 5) {
      sections.push(`### ⚠️ MODERATE CASE FOR APPEAL`)
      sections.push(`Your property appears to be **overassessed by ${overassessmentPct.toFixed(1)}%**.`)
      sections.push(`This is in the borderline range. An appeal may be worth pursuing if you have strong comparable sales data.`)
    } else if (overassessmentPct > 0) {
      sections.push(`### ℹ️ WEAK CASE FOR APPEAL`)
      sections.push(`Your property appears to be only **${overassessmentPct.toFixed(1)}% above** comparable sale prices.`)
      sections.push(`This small difference may not justify the time and effort of an appeal, but you could still try.`)
    } else {
      sections.push(`### ❌ NO CASE FOR APPEAL`)
      sections.push(`Your property appears to be **fairly or under-assessed** compared to comparable sales.`)
      sections.push(`Your assessment is ${Math.abs(overassessmentPct).toFixed(1)}% below the average comp sale price.`)
    }
  }

  sections.push('')
  sections.push(`## Next Steps`)
  sections.push(`1. **Verify comps**: Ensure comparable properties are truly similar (size, condition, location, age)`)
  sections.push(`2. **Check assessment details**: Look for factual errors (wrong sqft, bedroom count, lot size) on the assessor's record`)
  sections.push(`3. **Research your county's appeal process**: Deadlines, forms, and filing requirements vary by county`)
  sections.push(`4. **Use write_appeal_report** to generate a complete appeal guide with a draft appeal letter`)
  sections.push('')
  sections.push(`⚠️ **Important**: This analysis is for informational purposes only. Assessment practices, equalization ratios, and appeal rules vary significantly by state and county.`)

  return sections.join('\n')
}
