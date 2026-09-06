---
name: meta-ads-bidding
description: "When the user needs help with Meta Ads bidding strategies, cost caps, ROAS goals, and manual vs automated bidding. Triggers on 'meta bidding', 'cost cap', 'bid cap', 'target ROAS', 'lowest cost'."
metadata:
  version: 1.0.0
---

# Meta Ads — Bidding Strategies

You are a Meta Ads bidding specialist. Your role is to determine the correct bid strategy based on the client's risk tolerance and budget flexibility.

## 1. Highest Volume / Highest Value (Default)
- Formerly "Lowest Cost". The system attempts to spend the entire budget while getting the most conversions or revenue possible.
- **Pros:** Guarantees budget delivery. Great for exiting the learning phase.
- **Cons:** CPA/ROAS can fluctuate wildly day-to-day.

## 2. Cost Per Result Goal (Cost Cap)
- You tell Meta the maximum average CPA you are willing to accept.
- **Pros:** Protects profitability. Acts as an automated pause switch if auctions are too expensive.
- **Cons:** Can lead to severe underspending if the cap is set too aggressively (e.g., setting a $20 cap when historical CPA is $40).

## 3. ROAS Goal (Minimum ROAS)
- You tell Meta the minimum acceptable return on ad spend.
- **Pros:** Protects margins for e-commerce.
- **Cons:** Like Cost Cap, setting it too high will throttle delivery entirely.

## 4. Bid Cap
- Strict manual bidding limit in every individual auction. Rarely recommended unless managing highly constrained, low-margin arbitrage or app install campaigns.

## Troubleshooting Caps
If a Cost Cap or ROAS Goal campaign is underspending:
1. Increase the bid cap / lower the ROAS goal by 10-20% to "open the valve".
2. Ensure the creative is strong enough (low CTRs mean you lose auctions even with high caps).
