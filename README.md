# @runagentops — landing

Static page. Opens locally. Live Shieldz pay buttons for Loom / autopsy / kit.

Public URL will sit on a cleaner personal host (not the temporary GitHub Pages path).

## Files

| File | What |
|------|------|
| `index.html` | Landing — open this |
| `styles.css` | Plain layout |
| `standup-onepager.md` | Free daily standup sheet (markdown) |
| `README.md` | This note |

## Open locally

```bash
# from this directory
open index.html
# or
python3 -m http.server 8765
# then visit http://127.0.0.1:8765/
```

## Offers (live Shieldz)

| Offer | Price |
|-------|-------|
| Loom Review | $49 |
| Written autopsy | $29 |
| Ops kit (zip) | $39 |

Pay links are hardcoded in `index.html` (`target="_blank"` + `rel="noopener noreferrer"`).

## Keep

- Voice: human, concrete. Not SaaS kit-speak.
- Brand only `@runagentops` — no invented company/legal names.
- Free standup sheet linked (`standup-onepager.md` + X).
- **No** wallet addresses, KYC/phone forms, crypto jargon walls, Polar/Gumroad.

## Deploy

Any static host works. Ship `index.html` + `styles.css` together; `standup-onepager.md` is optional public companion / DM attach.
