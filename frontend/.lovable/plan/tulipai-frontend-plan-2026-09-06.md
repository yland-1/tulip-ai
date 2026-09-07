# TulipAI frontend plan

## Experience
- Replace the placeholder home page with a full-screen TulipAI experience using exactly `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260815_040604_b04410ba-c173-4b68-826d-212a24bccdad.mp4` as the fixed background video, plus a fixed dark readability overlay; no substitute media will be used.
- Build a centered get-started state with the TulipAI wordmark, concise positioning line, prominent glass prompt composer, send control, and three selectable prompt suggestions.
- On prompt submission, transition within the page into a full-height active conversation while preserving the video backdrop.
- Add a restrained glass header with TulipAI identity and a New Chat control that returns to the start state.

## Chat interface
- Use the official AI Elements foundations for conversation scrolling, assistant/user messages, prompt input, and loading treatment, styled to match TulipAI rather than creating parallel chat primitives.
- Seed the active view with a polished example exchange based on the submitted prompt; keep user messages right-aligned and high-contrast, and assistant content unfilled or subtly glass-backed for readability.
- Keep the bottom composer anchored and usable at desktop and mobile sizes, with correct spacing around its icon submit control.
- Add smooth, reduced-motion-aware transitions between the start and active states and subtle message arrival feedback.

## Approval workflow
- Create a reusable HITL Approval Card inside an assistant response with the requested pending-action title, platform, campaign ID, and proposed change fields.
- Provide clear Approve & Deploy and Reject actions with green/red semantic states.
- Make both actions functional in the frontend: lock the decision after selection and replace the pending state with an explicit approved or rejected confirmation.

## Visual system
- Define a dark enterprise palette, translucent surfaces, borders, shadows, gradients, and typography as semantic tokens in the global Tailwind design system.
- Use Lucide icons for controls and a distinctive TulipAI tulip mark rather than a generic AI sparkle symbol.
- Preserve strong contrast over moving video, use restrained glass blur, compact radii, and responsive sizing without adding unrelated sections or stock imagery.

## Technical implementation
- Install the required AI Elements `conversation`, `message`, `prompt-input`, and `shimmer` source components and inspect their local exports before composing the page.
- Keep the experience at `/`, update its route-specific title, description, Open Graph, and Twitter metadata, and remove generic project metadata from the root document.
- Use local React state for this frontend-only demonstration; no account system, persistence, or live AI service is included.
- Validate the finished page with lint/build checks and browser checks at desktop and mobile widths, including home submission, suggestion selection, New Chat, composer behavior, scrolling, and both approval outcomes.
