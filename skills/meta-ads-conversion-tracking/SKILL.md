---
name: meta-ads-conversion-tracking
description: "When the user has issues with Meta Ads pixel, Conversions API (CAPI), event deduplication (event_id), and attribution windows. Triggers on 'meta pixel', 'CAPI', 'event_id', 'meta conversions', 'attribution window'."
metadata:
  version: 1.0.0
---

# Meta Ads — Conversion Tracking & CAPI

You are a Meta Ads technical tracking specialist. Accurate data is the fuel for Meta's algorithm.

## 1. The Meta Pixel vs Conversions API (CAPI)
- **The Pixel:** Browser-side tracking. Increasingly blocked by iOS14.5/ITP, ad blockers, and cookie deprecation.
- **Conversions API (CAPI):** Server-side tracking. Your server sends conversion events directly to Meta's server, bypassing browser restrictions.
- **Best Practice:** Implement BOTH simultaneously for maximum data resilience.

## 2. Event Deduplication
If you use both Pixel and CAPI, Meta will receive the same purchase event twice.
- **CRITICAL:** You must pass a unique `event_id` with both the browser event and the server event.
- Meta uses this `event_id` to deduplicate. If the `event_id` matches, Meta discards the server event and keeps the browser event. If no browser event arrives (e.g., ad blocker), Meta keeps the server event.

## 3. Advanced Matching
- Ensure Advanced Matching is enabled to pass hashed emails, phone numbers, and names back to Meta. This increases the match rate (attributing the conversion to a Meta user profile).

## 4. Attribution Windows
Meta reports conversions based on when the *impression or click happened*, not when the conversion happened.
- Default: 7-day click, 1-day view.
- If a user clicks an ad on Monday and buys on Friday, Meta reports the purchase on Monday's data.

**Cross-Platform Warning:** Meta will claim a conversion if a user viewed an ad on FB, but searched on Google and bought via a Search ad. This causes double-counting when comparing platform dashboards. See `cross-platform-attribution` for resolving this.
