---
name: cross-platform-attribution
description: "Crucial Orchestrator logic. When evaluating budget shifts between Meta Ads and Google Ads, evaluating true incrementality, deduplicating conversions, and avoiding double counting. Triggers on 'cross-platform budget', 'shift budget between google and meta', 'double counting', 'true ROAS'."
metadata:
  version: 1.0.0
---

# TulipAI — Cross-Platform Attribution & Orchestration

**CRITICAL DIRECTIVE FOR THE ORCHESTRATOR:** 
When asked to evaluate or shift budgets across multiple platforms (e.g., moving budget from Meta to Google), you MUST NOT rely solely on the summed totals of in-platform conversion reporting.

## The Double-Counting Trap
- **Google Ads** tracks conversions via the Google Tag and claims credit if the user interacted with a Google Ad (e.g., within 30 days).
- **Meta Ads** tracks conversions via the Pixel/CAPI and claims credit if the user clicked or viewed a Meta Ad (e.g., 7-day click, 1-day view).
- **The Result:** If a user views a Meta ad on Monday, searches on Google on Tuesday, and buys, **both platforms report 1 purchase.** Summing them yields 2 purchases, inflating total ROAS and distorting budget reallocation logic.

## Standard Operating Procedure for Cross-Platform Budgets

1. **Reject Isolated Comparisons for Absolute Budgets:** 
   If the user asks "Which platform is performing better?", you can compare their internal trends (e.g., Meta's CPA dropped 10% this week). However, if the user asks "Should we shift $10k from Meta to Google based on these numbers?", warn them about double-counting.

2. **Demand a Single Source of Truth:**
   To make accurate cross-platform budget shifts, instruct the user or the AI node to fetch data from a deduplicated tracking source. Examples:
   - **Google Analytics 4 (GA4):** Uses a data-driven or last-click model that assigns fractional or absolute credit, ensuring 1 purchase = 1 purchase.
   - **Backend CRM / Database (e.g., Shopify, Salesforce):** With properly tracked UTM parameters.
   - **Third-Party Trackers:** Northbeam, TripleWhale, Rockerbox.

3. **UTM Parameter Integrity:**
   Ensure both platforms are utilizing robust UTMs so the Single Source of Truth can accurately allocate credit.
   - Google: `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}`
   - Meta: `utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}`

4. **Incrementality over Attribution:**
   Remind the user that Meta often drives top-of-funnel awareness (Views) that Google captures at the bottom of the funnel (Branded Search). Cutting Meta budget entirely because its "Last Click ROAS" looks poor in GA4 may cause Google Search volumes to collapse weeks later. 

**Execution Rule:** When proposing a `BudgetShift` payload in the `AnalystNode`, document in the `reasoning` field whether the shift is based on deduplicated data (GA4) or isolated platform data (with a warning of double-counting).
