// Levels are built programmatically rather than hand-typed as ASCII, since
// each one is much wider than the screen (side-scrolling corridor) and
// manual character-counting across 40-70 columns is error prone.
//
// Tile legend:
//   #  solid brick (wall / floor / ceiling)
//   .  empty space
//   C  gem (score only, not required to finish)
//   F  spring pad (solid + big bounce)
//   X  spike (hazard, not solid — the ball passes through it and gets hurt)
//   N  narrow squeeze gate: solid UNLESS the ball is stretched
//   G  goal gate — touch it to clear the level
//   B  ball start position (cleared to '.' once loaded)

const GRID_H = 16;

function blankLevel(width) {
  const grid = [];
  for (let r = 0; r < GRID_H; r++) grid.push(new Array(width).fill("."));
  return grid;
}

function hLine(g, row, c0, c1, ch) {
  for (let c = c0; c <= c1; c++) g[row][c] = ch;
}

function vLine(g, col, r0, r1, ch) {
  for (let r = r0; r <= r1; r++) g[r][col] = ch;
}

function set(g, row, col, ch) {
  g[row][col] = ch;
}

function buildLevel(width, fn) {
  const grid = blankLevel(width);
  hLine(grid, 0, 0, width - 1, "#"); // ceiling
  hLine(grid, GRID_H - 1, 0, width - 1, "#"); // floor
  vLine(grid, 0, 0, GRID_H - 1, "#"); // left wall
  vLine(grid, width - 1, 0, GRID_H - 1, "#"); // right wall
  fn(grid, width);
  return { width, height: GRID_H, grid };
}

function pit(g, c0, c1) {
  hLine(g, GRID_H - 1, c0, c1, ".");
}

function squeezeGate(g, col, gapTopRow, gapRows) {
  vLine(g, col, 1, GRID_H - 2, "#");
  for (let i = 0; i < gapRows; i++) set(g, gapTopRow + i, col, "N");
}

const LEVELS = [
  buildLevel(40, (g) => {
    set(g, 13, 2, "B");
    set(g, 13, 6, "C");
    set(g, 13, 10, "C");
    set(g, 14, 15, "X");
    pit(g, 18, 19);
    set(g, 14, 22, "F");
    set(g, 13, 26, "C");
    squeezeGate(g, 30, 8, 6);
    set(g, 13, 33, "C");
    set(g, 14, 35, "X");
    set(g, 13, 37, "C");
    set(g, 12, 38, "G");
  }),
  buildLevel(52, (g) => {
    set(g, 13, 2, "B");
    set(g, 13, 5, "C");
    set(g, 14, 8, "X");
    pit(g, 11, 12);
    set(g, 13, 15, "C");
    set(g, 14, 18, "F");
    squeezeGate(g, 22, 7, 5);
    set(g, 13, 25, "C");
    pit(g, 28, 29);
    set(g, 14, 33, "X");
    set(g, 13, 34, "X"); // stacked hazard: must clear a taller arc
    set(g, 13, 37, "C");
    squeezeGate(g, 40, 8, 5);
    set(g, 13, 43, "C");
    set(g, 14, 46, "F");
    set(g, 13, 48, "C");
    set(g, 12, 50, "G");
  }),
  buildLevel(64, (g) => {
    set(g, 13, 2, "B");
    set(g, 13, 5, "C");
    pit(g, 8, 9);
    set(g, 14, 13, "X");
    squeezeGate(g, 17, 7, 5);
    set(g, 13, 20, "C");
    set(g, 14, 23, "F");
    pit(g, 26, 27);
    set(g, 14, 31, "X");
    set(g, 13, 32, "X");
    set(g, 13, 34, "C");
    squeezeGate(g, 38, 6, 4);
    set(g, 13, 41, "C");
    pit(g, 44, 45);
    set(g, 14, 49, "F");
    squeezeGate(g, 53, 8, 4);
    set(g, 14, 56, "X");
    set(g, 13, 58, "C");
    set(g, 13, 60, "C");
    set(g, 12, 62, "G");
  }),
];
