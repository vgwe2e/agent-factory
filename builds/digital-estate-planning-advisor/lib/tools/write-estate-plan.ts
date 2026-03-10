import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { ToolDefinition } from '../types'

export const definition: ToolDefinition = {
  name: 'write_estate_plan',
  description:
    'Generate and save a comprehensive digital estate plan with platform-by-platform instructions, password management guide, legal document checklist, and action items. Use as the final step after analyzing digital assets and researching policies.',
  parameters: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Filename for the plan (e.g. "digital-estate-plan.md")',
      },
      person_name: {
        type: 'string',
        description: 'Person\'s name',
      },
      beneficiary: {
        type: 'string',
        description: 'Primary beneficiary or digital executor name',
      },
      state: {
        type: 'string',
        description: 'State of residence',
      },
      estate_analysis: {
        type: 'string',
        description: 'Results from analyze_digital_estate',
      },
      platform_research: {
        type: 'string',
        description: 'Results from search_platform_policies',
      },
      law_research: {
        type: 'string',
        description: 'Results from search_estate_laws',
      },
      accounts_list: {
        type: 'string',
        description: 'Comma-separated list of all accounts/platforms',
      },
      has_will: {
        type: 'string',
        description: '"yes" or "no"',
      },
      has_password_manager: {
        type: 'string',
        description: '"yes" or "no"',
      },
      has_crypto: {
        type: 'string',
        description: '"yes" if person has cryptocurrency',
      },
    },
    required: ['filename'],
  },
}

export async function execute(args: Record<string, unknown>): Promise<string> {
  const filename = args.filename as string
  const personName = (args.person_name as string) || '[Your Name]'
  const beneficiary = (args.beneficiary as string) || '[Beneficiary Name]'
  const state = (args.state as string) || '[State]'
  const estateAnalysis = (args.estate_analysis as string) || ''
  const platformResearch = (args.platform_research as string) || ''
  const lawResearch = (args.law_research as string) || ''
  const accountsList = (args.accounts_list as string) || ''
  const hasWill = ((args.has_will as string) || 'no').toLowerCase()
  const hasPasswordManager = ((args.has_password_manager as string) || 'no').toLowerCase()
  const hasCrypto = ((args.has_crypto as string) || 'no').toLowerCase() === 'yes'

  if (!filename) {
    return 'Error: filename is required'
  }

  const today = new Date().toISOString().split('T')[0]
  const accounts = accountsList ? accountsList.split(',').map(a => a.trim()).filter(Boolean) : []

  const report = `# Digital Estate Plan
## ${personName}

**Prepared**: ${today}
**State**: ${state}
**Digital executor / beneficiary**: ${beneficiary}
**Number of accounts**: ${accounts.length || 'See inventory below'}
**Password manager**: ${hasPasswordManager === 'yes' ? 'Yes' : 'Not set up'}
**Traditional will**: ${hasWill === 'yes' ? 'Yes' : 'Not yet'}

---

## Important Disclaimer

**This plan is for informational purposes only. It is NOT legal advice.** Digital estate planning involves complex legal issues that vary by state. Consult an estate planning attorney to ensure your digital assets are properly covered in your will, trust, or power of attorney. Many attorneys offer free initial consultations.

---

${estateAnalysis ? `## Your Digital Estate Analysis

${estateAnalysis}

---

` : ''}${platformResearch ? `## Platform Policy Research

${platformResearch}

---

` : ''}${lawResearch ? `## State Law Research

${lawResearch}

---

` : ''}## Step 1: Set Up Legacy Features (Do This Today)

These platforms offer built-in legacy/succession features. Set them up NOW — it takes 5-10 minutes each.

### Google — Inactive Account Manager
- [ ] Go to [myaccount.google.com/inactive](https://myaccount.google.com/inactive)
- [ ] Set inactivity timeout (recommended: 6 months)
- [ ] Add **${beneficiary}** as a trusted contact
- [ ] Choose what they can access (Gmail, Drive, Photos, YouTube, etc.)
- [ ] Optionally set auto-delete after notification
- [ ] **Covers**: Gmail, Google Drive, Google Photos, YouTube, Google Pay, and all Google services

### Apple — Legacy Contact
- [ ] Go to Settings > [Your Name] > Password & Security > Legacy Contact
- [ ] Add **${beneficiary}** as your Legacy Contact
- [ ] Share the access key with them (they'll need it plus a death certificate)
- [ ] **Covers**: iCloud data (photos, notes, mail, files, backups) — but NOT Keychain, payment info, or licensed media

### Facebook — Legacy Contact
- [ ] Go to [facebook.com/settings](https://www.facebook.com/settings) > Memorialization Settings
- [ ] Choose a Legacy Contact (can manage memorialized profile: pin posts, respond to friend requests, update photo)
- [ ] Decide: memorialization or account deletion after death
- [ ] **Covers**: Facebook profile management after death

---

## Step 2: Set Up a Password Manager

${hasPasswordManager === 'yes' ? '✅ You already have a password manager. Make sure you\'ve completed these steps:' : '⚠️ **This is the single most important step in your digital estate plan.** Without centralized credentials, your executor will need to reset every account individually — a frustrating process that often fails.'}

### Setup Steps
- [ ] **Choose a password manager**: 1Password, Bitwarden (free), or LastPass
- [ ] **Store ALL account credentials** — every account from your inventory
- [ ] **Set up emergency access**:
  - **1Password**: Family plan + shared vault, or print Emergency Kit
  - **Bitwarden**: Emergency Access feature (grant access after configurable wait period)
  - **LastPass**: Emergency Access (grant access after configurable wait period)
- [ ] **Store master password securely**:
  - Option A: Sealed envelope in a fireproof safe
  - Option B: With your estate planning attorney
  - Option C: In a safety deposit box (but note: access may be delayed after death)
  - **Do NOT** store it only digitally — this creates a chicken-and-egg problem

### Emergency Access Card

Create a physical card with this information and store it securely:

\`\`\`
DIGITAL ESTATE ACCESS CARD
For: ${personName}
Date: ${today}

Password Manager: [Name of password manager]
Account Email: [email used for password manager]
Master Password Location: [where the master password is stored]

Emergency Contact: ${beneficiary}

All account credentials are stored in the password manager.
See the digital estate plan document for detailed instructions.
\`\`\`

---

## Step 3: Account Inventory

${accounts.length > 0 ? `### Your Accounts

| # | Account | Category | Action Needed |
|---|---------|----------|---------------|
${accounts.map((a, i) => `| ${i + 1} | ${a} | [category] | Store credentials in password manager |`).join('\n')}

**For each account**, ensure:
- [ ] Username/email stored in password manager
- [ ] Password stored in password manager
- [ ] 2FA recovery codes stored in password manager
- [ ] Legacy feature enabled (if available)` : `### Build Your Inventory

List every account you have. Common categories:

**Email & Cloud**: Gmail, Outlook, Yahoo, iCloud, ProtonMail
**Social Media**: Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Reddit, YouTube
**Financial**: Banks, credit cards, PayPal, Venmo, Zelle, investment accounts
**Cryptocurrency**: Coinbase, Kraken, hardware wallets, DeFi wallets
**Subscriptions**: Netflix, Spotify, Amazon Prime, Disney+, Hulu, NYT, etc.
**Cloud Storage**: Dropbox, Google Drive, OneDrive, iCloud Drive
**Shopping**: Amazon, eBay, Etsy, various retailers
**Professional**: GitHub, Slack, work accounts
**Websites/Domains**: GoDaddy, Namecheap, Cloudflare, hosting providers
**Gaming**: Steam, PlayStation, Xbox, Nintendo
**Health**: Patient portals, fitness apps, telehealth
**Government**: IRS, SSA, state tax, DMV online accounts`}

---

${hasCrypto ? `## Step 4: Cryptocurrency — Special Handling Required

⚠️ **CRITICAL**: Cryptocurrency requires special handling because there is NO password reset, NO customer support, and NO way to recover funds without the private keys or recovery phrases.

### Action Items
- [ ] **Document ALL crypto holdings**: exchange accounts, wallets, DeFi positions
- [ ] **Store recovery phrases (seed phrases)** on paper or metal plate — NEVER digitally
- [ ] **Store recovery phrases in a separate location** from your password manager (fireproof safe, safety deposit box, or split across multiple locations)
- [ ] **Create a step-by-step guide** for your executor explaining how to access each wallet/exchange
- [ ] **Consider a multisig setup** where multiple people must cooperate to access funds
- [ ] **Document the approximate value** of each holding for estate tax purposes

### Where to Store Recovery Phrases
| Method | Pros | Cons |
|--------|------|------|
| Fireproof safe at home | Immediate access | Could be found by unauthorized person |
| Safety deposit box | Very secure | May be sealed after death; slow access |
| With estate attorney | Professional custody | Attorney may not understand crypto |
| Metal backup plate | Fire/water resistant | Expensive ($20-50) |
| Split across locations | Requires collusion to steal | More complex for executor |

### What NOT to Do
- ❌ Store recovery phrases in email, cloud storage, or notes apps
- ❌ Take photos of recovery phrases
- ❌ Share recovery phrases via text or messaging apps
- ❌ Store everything in one place that could be lost to fire/flood

---

` : ''}## ${hasCrypto ? 'Step 5' : 'Step 4'}: Legal Documents

### Will / Trust — Digital Asset Clause

Your will or trust should include a digital asset clause. Here's sample language to discuss with your attorney:

---

**DIGITAL ASSETS PROVISION**

I appoint **${beneficiary}** as my Digital Executor with full authority to access, manage, distribute, and dispose of my digital assets, including but not limited to:

(a) Email accounts and online communications
(b) Social media profiles and content
(c) Financial accounts accessible online
(d) Digital files, photographs, and documents stored locally or in cloud services
(e) Domain names, websites, and online business assets
(f) Cryptocurrency and digital tokens
(g) Digital purchases, subscriptions, and loyalty accounts
(h) Any other digital property

My Digital Executor shall have authority to:
- Access my digital accounts using credentials I have stored in my password manager
- Download, preserve, or delete digital content at their discretion
- Memorialize or close social media accounts
- Transfer digital assets of value to my beneficiaries
- Cancel subscriptions and close accounts

My password manager credentials are stored at: **[reference location — do not include the actual password here]**

---

⚠️ **This is SAMPLE language only.** Have your attorney review and customize it for your state's laws.

### Power of Attorney — Digital Assets

If you become incapacitated (not just after death), a power of attorney with digital asset authority is essential:

- [ ] Ensure your POA explicitly includes digital assets and online accounts
- [ ] Name the same person as your digital agent and digital executor (for consistency)
- [ ] Include authority to access, manage, and make decisions about digital accounts
- [ ] File copies with your attorney, your agent, and in your safe

### HIPAA Authorization

- [ ] If you use online health portals or telehealth, include a HIPAA authorization allowing your agent/executor to access health records

---

## ${hasCrypto ? 'Step 6' : 'Step 5'}: Communication Plan

### Tell ${beneficiary} About This Plan

- [ ] **Show them this document** and walk through the key points
- [ ] **Tell them where the password manager master password is stored**
- [ ] **Give them a copy of the Emergency Access Card**
- [ ] **Explain the legacy features** you've set up (Google, Apple, Facebook)
- [ ] **Discuss your wishes**: What should happen to your social media? Delete or memorialize? What about photos and personal files?
${hasCrypto ? '- [ ] **Walk through crypto access**: Which exchanges, which wallets, where are recovery phrases' : ''}

### Store This Plan
- [ ] Print this document and store with your other estate planning documents
- [ ] Save a digital copy in your password manager
- [ ] Give a copy to your attorney (if applicable)
- [ ] Give a copy to ${beneficiary}

---

## ${hasCrypto ? 'Step 7' : 'Step 6'}: Ongoing Maintenance

This plan needs updating when things change:

| Trigger | Action |
|---------|--------|
| New account created | Add to password manager |
| Password changed | Update password manager |
| New crypto acquired | Document wallet/exchange, store recovery phrase |
| Major life change (marriage, divorce) | Update beneficiary/executor |
| New device | Ensure password manager is synced |
| Annual review | Check all legacy features are still active |

**Set a calendar reminder**: Review this plan every January.

---

## Quick Reference — What Happens Without a Plan

| Situation | Without Plan | With Plan |
|-----------|-------------|-----------|
| Email access | Family must petition court + contact Google/Apple | Inactive Account Manager / Legacy Contact activates |
| Social media | Profiles stay active indefinitely or require proof of death | Legacy Contact manages or deletes per your wishes |
| Financial accounts | Estate process + letters testamentary for each institution | Executor uses password manager + legal documents |
| Cryptocurrency | **Permanently lost** — no recovery possible | Recovery phrases in secure storage; executor follows guide |
| Subscriptions | Keep charging your card/bank for months | Executor cancels immediately from password manager |
| Digital purchases | Stuck in limbo (non-transferable anyway) | At least documented for records |
| Photos & files | May be deleted after account inactivity | Downloaded and preserved per your wishes |

---

## Helpful Resources

- **FreeWill**: https://www.freewill.com/ — Free basic will creation
- **Nolo Estate Planning**: https://www.nolo.com/legal-encyclopedia/estate-planning — DIY estate planning guides
- **AARP Will Guide**: https://www.aarp.org/money/estate-planning/ — Estate planning basics
- **State Bar Referral**: Contact your state bar association for estate planning attorney referrals
- **Uniform Law Commission**: https://www.uniformlaws.org/committees/community-home?CommunityKey=f7237fc4-74c2-4728-81c6-b39a91ecdf22 — RUFADAA information
- **Google Inactive Account Manager**: https://myaccount.google.com/inactive
- **Apple Legacy Contact**: Settings > [Your Name] > Password & Security > Legacy Contact
- **Facebook Memorialization**: https://www.facebook.com/help/1506822589577997

---

*Generated by Digital Estate Planning Advisor — a free, open-source AI agent that helps people create comprehensive digital estate plans. Not legal advice.*
`

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outputDir = join(process.cwd(), 'output')
  const filePath = join(outputDir, sanitized)

  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, report, 'utf-8')
    return `Digital estate plan saved to output/${sanitized} (${report.length} characters)\n\nYour digital estate plan is ready! It includes legacy feature setup instructions, password management guide, account inventory, legal document templates, and a communication plan for ${beneficiary}.`
  } catch (err) {
    return `Write error: ${err instanceof Error ? err.message : 'Unknown error'}`
  }
}
