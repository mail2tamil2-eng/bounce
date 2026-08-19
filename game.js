(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const levelEl = document.getElementById("level");
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const overlay = document.getElementById("overlay");
  const overlayTitle = overlay.querySelector(".overlay-title");
  const overlaySub = overlay.querySelector(".overlay-sub");
  const pauseBtn = document.getElementById("pauseBtn");
  const stretchBtn = document.getElementById("stretchBtn");

  const VIEW_COLS = 12;
  const GRID_H = 16;
  const CELL = canvas.width / VIEW_COLS;

  const NORMAL_HALF_W = CELL * 0.32;
  const NORMAL_HALF_H = CELL * 0.32;
  const STRETCH_HALF_W = CELL * 0.16;
  const STRETCH_HALF_H = CELL * 0.46;

  const GRAVITY = 900; // px/s^2
  const MAX_FALL = 620; // px/s
  const BOUNCE_VELOCITY = -430; // px/s, normal landing bounce
  const SPRING_VELOCITY = -680; // px/s, spring pad boost
  const MOVE_SPEED = 160; // px/s
  const STEP = CELL * 0.5; // collision sub-step, stays under one cell

  const START_LIVES = 3;
  const COIN_SCORE = 50;
  const LEVEL_BONUS = 200;

  const COLORS = {
    brickA: "#b5432a",
    brickB: "#8f3220",
    mortar: "#3a1710",
    spike: "#e8e8e8",
    spikeBase: "#555",
    spring: "#e0a72b",
    springDark: "#8a5f10",
    coin: "#ffd23f",
    coinShine: "#fff6cf",
    ball: "#e0342a",
    ballShine: "#ff8f7a",
    gate: "#2ecc71",
    gateDark: "#1c8c4e",
    squeeze: "#c9c9c9",
  };

  let grid, levelWidth, levelIndex, startCol, startRow;
  let ball, vx, vy, stretching, cameraX;
  let score, lives, running, paused, state;
  let input = { left: false, right: false, stretch: false };
  let lastTime = 0;
  let stateTimer = 0;

  function isSolid(tile) {
    if (tile === "#" || tile === "F") return true;
    if (tile === "N") return !stretching;
    return false;
  }

  function loadLevel(index) {
    levelIndex = index;
    const data = LEVELS[index];
    levelWidth = data.width;
    grid = data.grid.map((row) => row.slice());
    startCol = 2;
    startRow = 13;
    for (let r = 0; r < GRID_H; r++) {
      for (let c = 0; c < levelWidth; c++) {
        if (grid[r][c] === "B") {
          startCol = c;
          startRow = r;
          grid[r][c] = ".";
        }
      }
    }
    ball = { x: startCol * CELL + CELL / 2, y: startRow * CELL + CELL / 2 };
    vx = 0;
    vy = 0;
    stretching = false;
    cameraX = 0;
    updateCamera();
    levelEl.textContent = `LEVEL ${index + 1}`;
  }

  function respawnBall() {
    ball.x = startCol * CELL + CELL / 2;
    ball.y = startRow * CELL + CELL / 2;
    vx = 0;
    vy = 0;
    stretching = false;
    updateCamera();
  }

  function updateLives() {
    livesEl.innerHTML = "";
    for (let i = 0; i < lives; i++) {
      const dot = document.createElement("span");
      dot.className = "heart";
      livesEl.appendChild(dot);
    }
  }

  function updateScore() {
    scoreEl.textContent = String(score).padStart(5, "0");
  }

  function showOverlay(title, sub) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    overlay.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function tileAt(col, row) {
    if (row < 0) return "#"; // ceiling cap
    if (row >= GRID_H) return "."; // below the floor: let pits fall through to death
    if (col < 0 || col >= levelWidth) return "#"; // side walls
    return grid[row][col];
  }

  function currentHalfExtents() {
    return stretching
      ? { hw: STRETCH_HALF_W, hh: STRETCH_HALF_H }
      : { hw: NORMAL_HALF_W, hh: NORMAL_HALF_H };
  }

  function moveXStep(dx, hw, hh) {
    ball.x += dx;
    const top = ball.y - hh + 1;
    const bottom = ball.y + hh - 1;
    const rTop = Math.floor(top / CELL);
    const rBottom = Math.floor(bottom / CELL);
    if (dx > 0) {
      const col = Math.floor((ball.x + hw) / CELL);
      for (let r = rTop; r <= rBottom; r++) {
        if (isSolid(tileAt(col, r))) {
          ball.x = col * CELL - hw;
          vx = 0;
          return true;
        }
      }
    } else if (dx < 0) {
      const col = Math.floor((ball.x - hw) / CELL);
      for (let r = rTop; r <= rBottom; r++) {
        if (isSolid(tileAt(col, r))) {
          ball.x = (col + 1) * CELL + hw;
          vx = 0;
          return true;
        }
      }
    }
    return false;
  }

  function moveYStep(dy, hw, hh) {
    ball.y += dy;
    const left = ball.x - hw + 1;
    const right = ball.x + hw - 1;
    const cLeft = Math.floor(left / CELL);
    const cRight = Math.floor(right / CELL);
    if (dy > 0) {
      const row = Math.floor((ball.y + hh) / CELL);
      for (let c = cLeft; c <= cRight; c++) {
        const tile = tileAt(c, row);
        if (isSolid(tile)) {
          ball.y = row * CELL - hh;
          vy = tile === "F" ? SPRING_VELOCITY : BOUNCE_VELOCITY;
          return true;
        }
      }
    } else if (dy < 0) {
      const row = Math.floor((ball.y - hh) / CELL);
      for (let c = cLeft; c <= cRight; c++) {
        if (isSolid(tileAt(c, row))) {
          ball.y = (row + 1) * CELL + hh;
          vy = 0;
          return true;
        }
      }
    }
    return false;
  }

  function moveX(dx, hw, hh) {
    if (dx === 0) return;
    const steps = Math.max(1, Math.ceil(Math.abs(dx) / STEP));
    const stepDx = dx / steps;
    for (let i = 0; i < steps; i++) {
      if (moveXStep(stepDx, hw, hh)) break;
    }
  }

  function moveY(dy, hw, hh) {
    if (dy === 0) return;
    const steps = Math.max(1, Math.ceil(Math.abs(dy) / STEP));
    const stepDy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (moveYStep(stepDy, hw, hh)) break;
    }
  }

  function checkPickupsAndHazards(hw, hh) {
    const cMin = Math.floor((ball.x - hw) / CELL);
    const cMax = Math.floor((ball.x + hw) / CELL);
    const rMin = Math.floor((ball.y - hh) / CELL);
    const rMax = Math.floor((ball.y + hh) / CELL);
    let hazard = false;
    let goal = false;
    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        if (r < 0 || r >= GRID_H || c < 0 || c >= levelWidth) continue;
        const tile = grid[r][c];
        if (tile === "C") {
          grid[r][c] = ".";
          score += COIN_SCORE;
          updateScore();
        } else if (tile === "X") {
          hazard = true;
        } else if (tile === "G") {
          goal = true;
        }
      }
    }
    return { hazard, goal };
  }

  function updateCamera() {
    const viewW = VIEW_COLS * CELL;
    const levelWidthPx = levelWidth * CELL;
    cameraX = ball.x - viewW / 2;
    cameraX = Math.max(0, Math.min(cameraX, Math.max(0, levelWidthPx - viewW)));
  }

  function loseLife() {
    lives -= 1;
    updateLives();
    if (lives <= 0) {
      gameOver();
    } else {
      respawnBall();
    }
  }

  function gameOver() {
    running = false;
    state = "gameover";
    showOverlay("GAME OVER", `Score: ${score}  ·  Tap to retry`);
  }

  function levelComplete() {
    state = "levelcomplete";
    score += LEVEL_BONUS;
    updateScore();
    if (levelIndex + 1 >= LEVELS.length) {
      running = false;
      state = "win";
      showOverlay("YOU WIN!", `Final score: ${score}  ·  Tap to play again`);
    } else {
      showOverlay("LEVEL CLEAR!", `+${LEVEL_BONUS} bonus`);
      stateTimer = 1.4;
    }
  }

  function update(dt) {
    if (paused || !running) return;

    stretching = input.stretch;
    const { hw, hh } = currentHalfExtents();

    vy += GRAVITY * dt;
    if (vy > MAX_FALL) vy = MAX_FALL;
    vx = ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * MOVE_SPEED;

    moveX(vx * dt, hw, hh);
    moveY(vy * dt, hw, hh);

    const result = checkPickupsAndHazards(hw, hh);
    if (result.hazard) {
      loseLife();
      return;
    }
    if (result.goal) {
      levelComplete();
      return;
    }

    if (ball.y - hh > canvas.height) {
      loseLife();
      return;
    }

    updateCamera();
  }

  function drawBrick(x, y, size, alt) {
    ctx.fillStyle = alt ? COLORS.brickB : COLORS.brickA;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = COLORS.mortar;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }

  function drawSpike(x, y, size) {
    ctx.fillStyle = COLORS.spikeBase;
    ctx.fillRect(x, y + size - 3, size, 3);
    ctx.fillStyle = COLORS.spike;
    const teeth = 3;
    const w = size / teeth;
    for (let i = 0; i < teeth; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * w, y + size - 3);
      ctx.lineTo(x + i * w + w / 2, y + 2);
      ctx.lineTo(x + i * w + w, y + size - 3);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawSpring(x, y, size) {
    ctx.fillStyle = COLORS.springDark;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = COLORS.spring;
    ctx.fillRect(x + 2, y + size * 0.35, size - 4, size * 0.4);
    ctx.strokeStyle = "#5c3c08";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const yy = y + size * 0.4 + i * 3;
      ctx.beginPath();
      ctx.moveTo(x + 3, yy);
      ctx.lineTo(x + size - 3, yy);
      ctx.stroke();
    }
  }

  function drawCoin(x, y, size) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size * 0.32;
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.coinShine;
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSqueezeGate(x, y, size) {
    ctx.fillStyle = COLORS.squeeze;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size * 0.4, y);
    ctx.lineTo(x + size * 0.15, y + size / 2);
    ctx.lineTo(x + size * 0.4, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size * 0.6, y);
    ctx.lineTo(x + size * 0.85, y + size / 2);
    ctx.lineTo(x + size * 0.6, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();
  }

  function drawGoal(x, y, size) {
    ctx.fillStyle = COLORS.gateDark;
    ctx.fillRect(x + size * 0.35, y - size * 0.6, size * 0.15, size * 1.6);
    ctx.fillStyle = COLORS.gate;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.5, y - size * 0.55);
    ctx.lineTo(x + size * 1.05, y - size * 0.3);
    ctx.lineTo(x + size * 0.5, y - size * 0.05);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = "#2a1610";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    const colStart = Math.max(0, Math.floor(cameraX / CELL) - 1);
    const colEnd = Math.min(levelWidth - 1, colStart + VIEW_COLS + 2);

    for (let r = 0; r < GRID_H; r++) {
      for (let c = colStart; c <= colEnd; c++) {
        const tile = grid[r][c];
        const x = c * CELL;
        const y = r * CELL;
        if (tile === "#") {
          drawBrick(x, y, CELL, (r + c) % 2 === 0);
        } else if (tile === "X") {
          drawSpike(x, y, CELL);
        } else if (tile === "F") {
          drawSpring(x, y, CELL);
        } else if (tile === "C") {
          drawCoin(x, y, CELL);
        } else if (tile === "N") {
          drawSqueezeGate(x, y, CELL);
        } else if (tile === "G") {
          drawGoal(x, y, CELL);
        }
      }
    }

    if (running || paused) {
      const { hw, hh } = currentHalfExtents();
      const grad = ctx.createRadialGradient(
        ball.x - hw * 0.3, ball.y - hh * 0.3, 1,
        ball.x, ball.y, Math.max(hw, hh)
      );
      grad.addColorStop(0, COLORS.ballShine);
      grad.addColorStop(1, COLORS.ball);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y, hw, hh, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function startGame() {
    score = 0;
    lives = START_LIVES;
    updateScore();
    updateLives();
    loadLevel(0);
    running = true;
    paused = false;
    state = "playing";
    hideOverlay();
  }

  function nextLevel() {
    loadLevel(levelIndex + 1);
    running = true;
    state = "playing";
    hideOverlay();
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    state = paused ? "paused" : "playing";
    pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
    if (paused) {
      showOverlay("PAUSED", "Tap to resume");
    } else {
      hideOverlay();
    }
  }

  function handlePrimaryAction() {
    if (state === "levelcomplete") return; // auto-advances
    if (!running) {
      startGame();
      return;
    }
    if (paused) togglePause();
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    if (state === "levelcomplete") {
      stateTimer -= dt;
      if (stateTimer <= 0) nextLevel();
    } else {
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function handleKey(e) {
    if (e.code === "Space") {
      e.preventDefault();
      handlePrimaryAction();
      return;
    }
    if (e.code === "KeyP") {
      togglePause();
      return;
    }
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      input.left = true;
      e.preventDefault();
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      input.right = true;
      e.preventDefault();
    }
    if (e.code === "ArrowUp" || e.code === "KeyW") {
      input.stretch = true;
      stretchBtn.classList.add("active");
      e.preventDefault();
    }
  }

  function handleKeyUp(e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") input.right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") {
      input.stretch = false;
      stretchBtn.classList.remove("active");
    }
  }

  document.addEventListener("keydown", handleKey);
  document.addEventListener("keyup", handleKeyUp);

  overlay.addEventListener("click", handlePrimaryAction);
  pauseBtn.addEventListener("click", togglePause);

  document.querySelectorAll(".pad[data-dir]").forEach((btn) => {
    const dir = btn.dataset.dir;
    const setOn = (e) => {
      e.preventDefault();
      if (!running) {
        startGame();
        return;
      }
      if (dir === "left") input.left = true;
      if (dir === "right") input.right = true;
    };
    const setOff = (e) => {
      e.preventDefault();
      if (dir === "left") input.left = false;
      if (dir === "right") input.right = false;
    };
    btn.addEventListener("touchstart", setOn, { passive: false });
    btn.addEventListener("touchend", setOff, { passive: false });
    btn.addEventListener("touchcancel", setOff, { passive: false });
    btn.addEventListener("mousedown", setOn);
    btn.addEventListener("mouseup", setOff);
    btn.addEventListener("mouseleave", setOff);
  });

  (function setupStretchButton() {
    const setOn = (e) => {
      e.preventDefault();
      if (!running) {
        startGame();
        return;
      }
      input.stretch = true;
      stretchBtn.classList.add("active");
    };
    const setOff = (e) => {
      e.preventDefault();
      input.stretch = false;
      stretchBtn.classList.remove("active");
    };
    stretchBtn.addEventListener("touchstart", setOn, { passive: false });
    stretchBtn.addEventListener("touchend", setOff, { passive: false });
    stretchBtn.addEventListener("touchcancel", setOff, { passive: false });
    stretchBtn.addEventListener("mousedown", setOn);
    stretchBtn.addEventListener("mouseup", setOff);
    stretchBtn.addEventListener("mouseleave", setOff);
  })();

  running = false;
  paused = false;
  state = "start";
  loadLevel(0);
  score = 0;
  lives = START_LIVES;
  updateScore();
  updateLives();
  draw();
  showOverlay("BOUNCE", "Tap ◀▶ to move, hold ↕ to stretch through gaps");
  requestAnimationFrame((t) => {
    lastTime = t;
    requestAnimationFrame(loop);
  });
})();
