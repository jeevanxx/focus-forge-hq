# Architecture decisions
- Keep voice capture and playback in the browser, but route speech model requests through an authenticated Lovable Cloud function so private keys never reach visitors.