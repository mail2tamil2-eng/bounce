# Bounce

A retro Nokia-style clone of the classic mobile game **Bounce** — guide a
bouncing ball through brick levels, dodge spikes, use spring pads, and
collect every coin to clear the stage. Pure HTML/CSS/JS, no build step, no
dependencies.

## Play locally

Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Rules

- The ball bounces automatically off the floor and platforms — you only
  steer it left and right.
- Collect all the coins on a level to clear it and move to the next one.
- Gold **spring pads** launch the ball much higher than a normal bounce.
- Red **spikes** cost you a life on contact — 3 lives per game.
- Run out of lives and it's game over; clear all levels to win.

## Controls

- On-screen ◀ / ▶ buttons, or swipe/tap them (mobile)
- Arrow keys / A & D (desktop)
- Space to start/resume, P to pause

## Deploy to Vercel

This is a static site, so it deploys with zero configuration:

```bash
npx vercel
```

or connect the repo at [vercel.com/new](https://vercel.com/new) and deploy — no build command or output directory needed.
