# Badge background art

Drop four images here, named exactly:

| File | Suit theme |
|---|---|
| `gwen.png` | Spider-Gwen |
| `miles.png` | Miles Morales |
| `pavitr.png` | Pavitr Prabhakar |
| `peter.png` | Peter Parker |

Any web format works (`.png`, `.jpg`, `.webp`) as long as the filename matches — edit
`THEMES` in [../badge.js](../badge.js) if you use a different extension.

Aim for roughly 5:3 (the badge canvas is 1000×600). Wider or taller is fine: the image is
centre-cropped to fill, never squashed. Keep each under ~500 KB so the page stays quick.

A missing or broken file is not an error — that theme falls back to its plain gradient.

These files are served from your own origin, which is what keeps the canvas exportable.
Loading art from another site would taint the canvas and break the download button.
