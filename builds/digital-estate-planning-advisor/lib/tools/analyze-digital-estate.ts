import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'analyze_digital_estate',
  description:
    'Analyze a person\'s digital assets and accounts to create an inventory, assess each platform\'s succession/legacy policies, and identify actions needed. Use this as the FIRST step.',
  parameters: {
    type: 'object',
    properties: {
      accounts: {
        type: 'string',
        description: 'Comma-separated list of platforms/services the person uses (e.g. "Gmail, Facebook, Instagram, Chase Bank, Coinbase, Netflix, iCloud, WordPress, GoDaddy, Dropbox")',
      },
      digital_assets: {
        type: 'string',
        description: 'Types of digital assets: "photos", "documents", "cryptocurrency", "domain_names", "websites", "digital_purchases", "loyalty_points", "nfts", "online_businesses"',
      },
      state: {
        type: 'string',
        description: 'State of residence (for RUFADAA and state-specific laws)',
      },
      has_will: {
        type: 'string',
        description: '"yes" or "no" — whether they have a traditional will',
      },
      has_password_manager: {
        type: 'string',
        description: '"yes" or "no" — whether they use a password manager',
      },
      beneficiary: {
        type: 'string',
        description: 'Who should receive/manage digital assets (spouse, child, executor, etc.)',
      },
      concerns: {
        type: 'string',
        description: 'Specific concerns: "privacy", "financial_accounts", "social_media_legacy", "business_continuity", "crypto_access", "subscription_cancellation"',
      },
    },
    required: ['accounts'],
  },
}

// Platform-specific legacy/succession policies (as of 2025)
const PLATFORM_POLICIES: Record<string, { category: string; legacyOption: string; dataDownload: string; notes: string }> = {
  google: {
    category: 'Email & Cloud',
    legacyOption: 'Inactive Account Manager — set up trusted contacts who get notified and can download data after inactivity period (3-18 months). Can also auto-delete.',
    dataDownload: 'Google Takeout — download all data (Gmail, Drive, Photos, etc.)',
    notes: 'Set up Inactive Account Manager NOW at myaccount.google.com/inactive. Covers Gmail, Drive, Photos, YouTube, and all Google services.',
  },
  gmail: {
    category: 'Email & Cloud',
    legacyOption: 'Same as Google — use Inactive Account Manager',
    dataDownload: 'Google Takeout',
    notes: 'Gmail is part of Google account. See Google entry.',
  },
  apple: {
    category: 'Email & Cloud',
    legacyOption: 'Legacy Contact — designate someone who can access your Apple ID data after death. Added in iOS 15.2.',
    dataDownload: 'Request data at privacy.apple.com',
    notes: 'Legacy Contact gets access to iCloud data (photos, notes, mail, etc.) but NOT Keychain passwords, payment info, or licensed media.',
  },
  icloud: {
    category: 'Email & Cloud',
    legacyOption: 'Same as Apple — use Legacy Contact feature',
    dataDownload: 'privacy.apple.com',
    notes: 'See Apple entry. iCloud is part of Apple ID.',
  },
  facebook: {
    category: 'Social Media',
    legacyOption: 'Legacy Contact — person who can manage memorialized profile (pin posts, respond to friend requests, update profile photo). OR request account deletion after death.',
    dataDownload: 'Settings > Your Information > Download Your Information',
    notes: 'Set Legacy Contact at facebook.com/settings > Memorialization Settings. Memorialization freezes the profile with "Remembering" badge.',
  },
  instagram: {
    category: 'Social Media',
    legacyOption: 'Memorialization request by family member. No legacy contact feature. Account can be memorialized or removed.',
    dataDownload: 'Settings > Your Activity > Download Your Information',
    notes: 'Instagram does NOT have a pre-death legacy contact feature. Family must request memorialization after death with proof.',
  },
  twitter: {
    category: 'Social Media',
    legacyOption: 'No legacy contact. Deactivation request by family/estate with death certificate.',
    dataDownload: 'Settings > Your Account > Download Archive',
    notes: 'X/Twitter has no pre-death planning option. Estate must contact support after death.',
  },
  x: {
    category: 'Social Media',
    legacyOption: 'Same as Twitter',
    dataDownload: 'Settings > Your Account > Download Archive',
    notes: 'See Twitter entry.',
  },
  linkedin: {
    category: 'Social Media',
    legacyOption: 'No legacy contact. Memorialization or removal by verified family member.',
    dataDownload: 'Settings > Data Privacy > Get a copy of your data',
    notes: 'LinkedIn has no pre-death planning. Family must submit removal request with proof of death.',
  },
  tiktok: {
    category: 'Social Media',
    legacyOption: 'No formal legacy policy. Account deactivation by family with proof of death.',
    dataDownload: 'Settings > Account > Download your data',
    notes: 'TikTok has minimal legacy policies. Download data proactively.',
  },
  youtube: {
    category: 'Social Media',
    legacyOption: 'Part of Google — Inactive Account Manager applies',
    dataDownload: 'Google Takeout',
    notes: 'YouTube is part of Google account. Monetized channels may have additional considerations.',
  },
  paypal: {
    category: 'Financial',
    legacyOption: 'Estate must contact PayPal with death certificate and letters testamentary to claim balance.',
    dataDownload: 'Activity > Download statements',
    notes: 'Close the account AFTER transferring balance. Outstanding transactions may complicate closure.',
  },
  venmo: {
    category: 'Financial',
    legacyOption: 'Same process as PayPal (parent company). Estate must contact with documentation.',
    dataDownload: 'Statements section in app',
    notes: 'Transfer balance to bank account before closure if possible.',
  },
  coinbase: {
    category: 'Cryptocurrency',
    legacyOption: 'Estate must contact with death certificate, probate documents, and government ID. Process can take months.',
    dataDownload: 'Reports section — transaction history',
    notes: 'CRITICAL: Without account credentials or estate process, crypto may be permanently lost. Document recovery phrases separately.',
  },
  amazon: {
    category: 'E-Commerce & Subscriptions',
    legacyOption: 'No formal transfer. Estate can contact to close account. Digital purchases (Kindle, Audible) are NON-TRANSFERABLE.',
    dataDownload: 'Request Your Information tool',
    notes: 'Amazon digital purchases die with the account holder. Physical order history can be accessed.',
  },
  netflix: {
    category: 'E-Commerce & Subscriptions',
    legacyOption: 'No legacy option. Cancel subscription through account settings or contact support.',
    dataDownload: 'Account > Download your personal information',
    notes: 'Subscription-only service — just needs cancellation.',
  },
  spotify: {
    category: 'E-Commerce & Subscriptions',
    legacyOption: 'No legacy option. Family member can request closure with proof of death.',
    dataDownload: 'Privacy Settings > Download your data',
    notes: 'Playlists are non-transferable. Download data for records.',
  },
  dropbox: {
    category: 'Cloud Storage',
    legacyOption: 'No legacy contact feature. Estate must contact support with documentation.',
    dataDownload: 'Download files directly or use desktop sync',
    notes: 'Download important files proactively. Shared folders remain accessible to other members.',
  },
  wordpress: {
    category: 'Websites & Domains',
    legacyOption: 'WordPress.com: contact support. Self-hosted: whoever has hosting access controls it.',
    dataDownload: 'Tools > Export for WordPress.com. WP Admin > Export for self-hosted.',
    notes: 'If self-hosted, document hosting provider credentials, FTP access, and database access.',
  },
  godaddy: {
    category: 'Websites & Domains',
    legacyOption: 'Domain transfer to estate/beneficiary with documentation. Account holder change request.',
    dataDownload: 'Domain and hosting management through dashboard',
    notes: 'Domains are ASSETS with real value. Document registrar credentials. Enable auto-renew to prevent expiration.',
  },
  steam: {
    category: 'Digital Purchases',
    legacyOption: 'Accounts and games are NON-TRANSFERABLE per Steam Subscriber Agreement. No official legacy policy.',
    dataDownload: 'Account > Data Related to Your Steam Account',
    notes: 'Steam libraries (potentially worth thousands) cannot be transferred. This is a known pain point with no solution.',
  },
}

function categorizeAccount(account: string): { name: string; key: string } {
  const lower = account.toLowerCase().trim()
  // Map common names to keys
  const mapping: Record<string, string> = {
    google: 'google', gmail: 'gmail', 'google drive': 'google', 'google photos': 'google',
    apple: 'apple', icloud: 'icloud', 'apple id': 'apple',
    facebook: 'facebook', fb: 'facebook', meta: 'facebook',
    instagram: 'instagram', ig: 'instagram',
    twitter: 'twitter', x: 'x',
    linkedin: 'linkedin',
    tiktok: 'tiktok',
    youtube: 'youtube', yt: 'youtube',
    paypal: 'paypal',
    venmo: 'venmo',
    coinbase: 'coinbase',
    amazon: 'amazon',
    netflix: 'netflix',
    spotify: 'spotify',
    dropbox: 'dropbox',
    wordpress: 'wordpress', wp: 'wordpress',
    godaddy: 'godaddy', 'go daddy': 'godaddy',
    steam: 'steam',
  }

  for (const [key, value] of Object.entries(mapping)) {
    if (lower.includes(key)) return { name: account.trim(), key: value }
  }
  return { name: account.trim(), key: '' }
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const accountsRaw = (args.accounts as string) || ''
  const digitalAssets = (args.digital_assets as string) || ''
  const state = (args.state as string) || ''
  const hasWill = ((args.has_will as string) || 'no').toLowerCase()
  const hasPasswordManager = ((args.has_password_manager as string) || 'no').toLowerCase()
  const beneficiary = (args.beneficiary as string) || '[not specified]'
  const concerns = (args.concerns as string) || ''

  if (!accountsRaw) {
    return 'Error: accounts is required — list the platforms and services you use'
  }

  const accounts = accountsRaw.split(',').map(a => categorizeAccount(a))

  const results: string[] = []
  results.push('## Digital Estate Analysis')
  results.push('')
  results.push(`**Accounts inventoried**: ${accounts.length}`)
  results.push(`**State**: ${state || 'not specified'}`)
  results.push(`**Has traditional will**: ${hasWill}`)
  results.push(`**Uses password manager**: ${hasPasswordManager}`)
  results.push(`**Designated beneficiary**: ${beneficiary}`)
  results.push('')

  // Categorize accounts
  const categories: Record<string, typeof accounts> = {}
  for (const acc of accounts) {
    const policy = PLATFORM_POLICIES[acc.key]
    const cat = policy?.category || 'Other'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(acc)
  }

  // Platform-by-platform analysis
  results.push('### Account Inventory & Legacy Policies')
  results.push('')

  let hasLegacyFeature = 0
  let needsProactiveAction = 0
  let hasCrypto = false
  let hasFinancial = false
  let hasDomains = false

  for (const [category, accs] of Object.entries(categories)) {
    results.push(`#### ${category}`)
    results.push('')

    for (const acc of accs) {
      const policy = PLATFORM_POLICIES[acc.key]
      if (policy) {
        results.push(`**${acc.name}**`)
        results.push(`- **Legacy option**: ${policy.legacyOption}`)
        results.push(`- **Data download**: ${policy.dataDownload}`)
        results.push(`- **Note**: ${policy.notes}`)
        results.push('')

        if (policy.legacyOption.includes('Legacy Contact') || policy.legacyOption.includes('Inactive Account Manager')) {
          hasLegacyFeature++
        } else {
          needsProactiveAction++
        }
        if (category === 'Cryptocurrency') hasCrypto = true
        if (category === 'Financial') hasFinancial = true
        if (category === 'Websites & Domains') hasDomains = true
      } else {
        results.push(`**${acc.name}**`)
        results.push('- **Legacy option**: Unknown — check platform settings or contact support')
        results.push('- **Data download**: Check platform settings for export/download option')
        results.push('- **Note**: Use `search_platform_policies` to research this platform\'s specific policies')
        results.push('')
        needsProactiveAction++
      }
    }
  }

  // Digital assets analysis
  if (digitalAssets) {
    results.push('### Digital Asset Considerations')
    results.push('')
    const assets = digitalAssets.toLowerCase()
    if (assets.includes('crypto')) {
      hasCrypto = true
      results.push('**Cryptocurrency**')
      results.push('- ⚠️ **CRITICAL**: Without private keys or recovery phrases, crypto is PERMANENTLY LOST')
      results.push('- Store recovery phrases in a fireproof safe or safety deposit box')
      results.push('- Document which exchanges hold your crypto (Coinbase, Kraken, etc.)')
      results.push('- Consider a hardware wallet with documented recovery process')
      results.push('- Do NOT store recovery phrases digitally unless encrypted')
      results.push('')
    }
    if (assets.includes('domain')) {
      hasDomains = true
      results.push('**Domain Names**')
      results.push('- Domains are valuable assets — some worth thousands or more')
      results.push('- Document registrar (GoDaddy, Namecheap, Cloudflare, etc.) and login credentials')
      results.push('- Enable auto-renew to prevent expiration during estate settlement')
      results.push('- Consider transferring to a registrar that supports organization accounts')
      results.push('')
    }
    if (assets.includes('digital_purchases')) {
      results.push('**Digital Purchases (Kindle, iTunes, Steam, etc.)**')
      results.push('- ⚠️ Most digital purchases are NON-TRANSFERABLE — they are licensed, not owned')
      results.push('- Kindle books, iTunes purchases, Steam games, and app purchases typically die with the account')
      results.push('- Consider downloading DRM-free copies where possible')
      results.push('')
    }
    if (assets.includes('online_business')) {
      results.push('**Online Businesses**')
      results.push('- Document all business accounts, revenue streams, and operational procedures')
      results.push('- Include hosting, payment processing, vendor relationships, and customer data')
      results.push('- Create a business continuity plan separate from personal digital estate')
      results.push('')
    }
    if (assets.includes('loyalty') || assets.includes('points')) {
      results.push('**Loyalty Points & Miles**')
      results.push('- Most airline miles and hotel points are NON-TRANSFERABLE after death')
      results.push('- Some programs allow transfer to spouse or estate with documentation')
      results.push('- Consider using points proactively or transferring to family while alive')
      results.push('')
    }
  }

  // Urgency assessment
  results.push('### Priority Actions')
  results.push('')
  results.push('**Set up NOW (platforms with legacy features):**')
  if (accounts.some(a => a.key === 'google' || a.key === 'gmail')) {
    results.push('- [ ] **Google Inactive Account Manager** — myaccount.google.com/inactive')
  }
  if (accounts.some(a => a.key === 'apple' || a.key === 'icloud')) {
    results.push('- [ ] **Apple Legacy Contact** — Settings > [Your Name] > Password & Security > Legacy Contact')
  }
  if (accounts.some(a => a.key === 'facebook')) {
    results.push('- [ ] **Facebook Legacy Contact** — facebook.com/settings > Memorialization Settings')
  }
  results.push('')

  results.push('**Download data proactively:**')
  for (const acc of accounts) {
    const policy = PLATFORM_POLICIES[acc.key]
    if (policy?.dataDownload && !policy.dataDownload.includes('Same as')) {
      results.push(`- [ ] **${acc.name}**: ${policy.dataDownload}`)
    }
  }
  results.push('')

  // Password manager warning
  if (hasPasswordManager !== 'yes') {
    results.push('### ⚠️ Password Manager Required')
    results.push('')
    results.push('You need a password manager to make your digital estate accessible. Without one, your executor/beneficiary will need to reset passwords on every account — a slow, frustrating process that may fail.')
    results.push('')
    results.push('**Recommended**: Set up a password manager (1Password, Bitwarden, LastPass) and:')
    results.push('1. Store ALL account credentials')
    results.push('2. Set up emergency access for your designated beneficiary')
    results.push('3. Store the master password in a sealed envelope in a safe or with your attorney')
    results.push('4. Include the password manager in your will/estate documents')
    results.push('')
  }

  // Will warning
  if (hasWill !== 'yes') {
    results.push('### ⚠️ You Need a Will')
    results.push('')
    results.push('Without a will, your digital assets are subject to intestacy laws — a court decides who gets what. A will should:')
    results.push('1. Name a **digital executor** — someone tech-savvy who can manage your digital accounts')
    results.push('2. Include a **digital asset clause** granting the executor authority over online accounts')
    results.push('3. Reference (but not contain) your password manager master password location')
    results.push('')
  }

  // State law note
  if (state) {
    results.push(`### State Law: ${state}`)
    results.push('')
    results.push(`Most states have adopted the **Revised Uniform Fiduciary Access to Digital Assets Act (RUFADAA)**, which governs fiduciary access to digital assets after death or incapacity.`)
    results.push('')
    results.push(`Use \`search_estate_laws\` to check ${state}'s specific digital estate law.`)
    results.push('')
  }

  // Summary stats
  results.push('### Summary')
  results.push('')
  results.push(`- **${hasLegacyFeature}** accounts have built-in legacy features — set them up now`)
  results.push(`- **${needsProactiveAction}** accounts require proactive data backup or estate documentation`)
  if (hasCrypto) results.push('- **Cryptocurrency** requires special handling — recovery phrases are critical')
  if (hasFinancial) results.push('- **Financial accounts** require estate documentation for access')
  if (hasDomains) results.push('- **Domain names** are transferable assets — document registrar access')
  results.push('')
  results.push('### Next Steps')
  results.push('1. Use `search_platform_policies` for detailed policies on specific platforms')
  results.push('2. Use `search_estate_laws` for your state\'s digital estate laws')
  results.push('3. Use `write_estate_plan` to generate your comprehensive digital estate plan')

  return results.join('\n')
}
