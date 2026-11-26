# Glasmacher — A Glassblowing Game

Build glass pieces in a four-step workshop loop and sell them to earn coins.

## Play

Open `index.html` in any browser — no build step, no dependencies, everything is one file.

## How to play

1. **Heat** — hold (mouse or Space) to heat the gather in the furnace, release inside the green zone. Too hot and it drips off the pipe.
2. **Blow** — hold to inflate the bubble to the target size. Heat fades while you work; overblow it and it pops, let it go cold and it cracks.
3. **Shape** — tap when the pointer crosses each green zone to pull the glass into a vase, bottle, bowl or ornament.
4. **Anneal** — tap while the cooling marker is inside the window to finish the piece safely.

Quality is the average of all four stages. Masterworks (92+) earn a 25% bonus. Spend coins in the workshop on six glass colors (Cobalt → Gold Leaf) and three tools (Jacks widen shaping zones, Blowhose slows cooling, Calipers reveal the exact blow target). Progress is saved in your browser.

## Development

`smoke.js` is a headless harness that stubs the canvas and drives the whole game loop through `node`:

```bash
node smoke.js
```

It plays two orders end-to-end, then exercises the pop, cold-crack and overheat failure paths.
