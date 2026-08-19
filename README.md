# Bounce

A retro Nokia-style clone of the classic mobile game **Bounce** (and its
sequel **Bounce Tales**) — guide a ball that bounces automatically through
side-scrolling brick corridors, stretch it thin to squeeze through narrow
gaps, dodge spikes, launch off spring pads, and reach the goal gate at the
end of each level. Pure HTML/CSS/JS, no build step, no dependencies.

## Play locally

Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Rules

- The ball bounces automatically off the floor and platforms under
  gravity — you steer it left and right.
- Hold **stretch** to squeeze the ball into a thin, tall shape so it can
  pass through narrow gated gaps that block it in its normal round form.
- Gold **spring pads** launch the ball much higher/further than a normal
  bounce.
- Red **spikes** and falling into pits cost a life on contact — 3 lives
  per game, shared across all levels.
- Gems add score but aren't required — reach the green **goal gate** at
  the end of the level to clear it.
- Clear all 3 levels to win.

## Controls

- On-screen ◀ / ▶ to move, ↕ to stretch (hold)
- Arrow keys / A, D to move, Arrow-Up or W to stretch (hold)
- Space to start/resume, P to pause

## Deploy to Vercel

This is a static site, so it deploys with zero configuration:

```bash
npx vercel
```

or connect the repo at [vercel.com/new](https://vercel.com/new) and deploy — no build command or output directory needed.
