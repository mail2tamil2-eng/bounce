# Bounce

A retro Nokia-style clone of the classic mobile game **Bounce** (and its
sequel **Bounce Tales**) — guide a ball through side-scrolling brick
corridors, jump over gaps, stretch it thin to squeeze through narrow gaps,
dodge spikes, launch off spring pads, grow or shrink through rings, and
reach the goal gate at the end of each level. Pure HTML/CSS/JS, no build
step, no dependencies.

## Play locally

Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Rules

- The ball falls under gravity and rests where it lands — it doesn't
  bounce on its own. Press **jump** to send it upward; it works mid-air
  too, so tapping it again while airborne climbs even higher.
- Hold **stretch** to squeeze the ball into a thin, tall shape so it can
  pass through narrow gated gaps that block it in its normal round form.
- Gold **spring pads** launch the ball much higher/further than a jump,
  automatically on contact.
- Green **grow rings** and purple **shrink rings** change the ball's size
  for the rest of the level — a bigger ball can't fit through squeeze
  gates, a smaller one fits more easily.
- Red **spikes** and falling into pits cost a life on contact — 3 lives
  per game, shared across all levels.
- Gems add score but aren't required — reach the green **goal gate** at
  the end of the level to clear it.
- Clear all 3 levels to win.

## Controls

- On-screen ◀ / ▶ to move, ▲ to jump, ↕ Stretch to hold
- Arrow keys / A, D to move, Arrow-Up or W to jump, Arrow-Down or S to
  stretch (hold)
- Space to start/resume, P to pause

## Deploy to Vercel

This is a static site, so it deploys with zero configuration:

```bash
npx vercel
```

or connect the repo at [vercel.com/new](https://vercel.com/new) and deploy — no build command or output directory needed.
