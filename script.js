"use strict";

const SIZE = 15;
const TILE = 20;
const ROUND_SECONDS = 150;
const PLAYER_SPEED = 8.2;
const VAULT_SECONDS = .24;
const TOP_SCORES = 10;
const RANK_KEY = "paypay-arcade-v1-ranking";
const SWIPE_DISTANCE = 16;
const CHARACTERS = { frog: "Rã", bat: "Morcego" };
const PLAY_BUTTONS = { home: "play", result: "replay", ranking: "ranking-play" };
const DIRECTIONS = {
  up: [0, -1], left: [-1, 0], down: [0, 1], right: [1, 0]
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
const KEYS = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right"
};
const JOINT_EFFECTS = {
  slow: { title: "Chapou demais", duration: 6, message: "Você chapou demais, agora está se movendo lentamente." },
  jump: { title: "Melhor brisa", duration: 6, message: "Você está curtindo a melhor brisa, nenhum fantasma consegue te pegar." },
  snack: { title: "Larica", duration: 10, message: "Você fumou e ficou na larica, coma e ganhe 1 vida." }
};
// Wall rectangles are [column, row, width, height] inside the outer border.
const STAGES = [
  {
    id: "gogreen", name: "GoGreen", budCount: 30,
    floor: "#132217", edge: "#879e4d", glow: "#b4c971", wall: "#293820",
    walls: [[2,2,4,1],[2,3,1,2],[9,2,4,1],[12,3,1,2],[5,4,5,1],[4,6,2,1],[9,6,2,1],[2,7,1,3],[12,7,1,3],[6,8,3,1],[4,9,1,2],[10,9,1,2],[2,12,4,1],[9,12,4,1],[7,10,1,2]],
    start: [7,13], ghosts: [[7,7],[7,2]], joints: [[13,13]], fans: [[13,1],[1,13]]
  },
  {
    id: "origin", name: "Origin", budCount: 42,
    floor: "#211811", edge: "#c49459", glow: "#e0b77c", wall: "#463022",
    walls: [[2,2,1,4],[4,2,4,1],[9,2,4,1],[12,3,1,4],[4,4,1,4],[6,4,4,1],[7,5,1,2],[2,8,3,1],[10,5,1,4],[7,8,2,1],[3,10,1,3],[5,10,4,1],[8,11,1,2],[10,10,3,1],[12,11,1,2],[5,12,1,1]],
    start: [1,13], ghosts: [[13,1],[1,6]], joints: [[13,13]], fans: [[6,7],[10,13]]
  },
  {
    id: "classic", name: "Classic", budCount: 54,
    floor: "#102844", edge: "#d6b960", glow: "#f1d37b", wall: "#21476b",
    walls: [[2,2,3,1],[6,2,3,1],[10,2,3,1],[2,4,1,3],[4,4,3,1],[8,4,3,1],[12,4,1,3],[5,6,1,3],[7,6,1,3],[9,6,1,3],[2,8,2,1],[11,8,2,1],[2,10,1,3],[4,10,3,1],[8,10,3,1],[12,10,1,3],[5,12,5,1]],
    start: [7,13], ghosts: [[7,1],[1,5],[13,5]], joints: [[13,13]], fans: [[13,1],[1,13]]
  },
  {
    id: "premium", name: "Premium", budCount: 66,
    floor: "#111", edge: "#fff", glow: "#fff", wall: "#292929",
    walls: [[2,2,5,1],[8,2,5,1],[2,3,1,2],[12,3,1,2],[4,4,7,1],[4,5,1,2],[10,5,1,2],[2,6,1,4],[12,6,1,4],[6,6,3,1],[4,8,3,1],[8,8,3,1],[7,9,1,3],[4,10,2,1],[9,10,2,1],[2,12,4,1],[9,12,4,1]],
    start: [7,13], ghosts: [[7,5],[1,2],[13,2]], joints: [[13,13]], fans: [[13,1],[1,13]]
  }
];
const HARDCORE = {
  id: "hardcore", name: "Hardcore", budCount: 100, seconds: 55, ghostSpeed: 6.8,
  floor: "#1b1319", edge: "#d47b77", glow: "#ffd3ad", wall: "#44242d",
  walls: [[2,2,4,1],[7,2,1,3],[9,2,4,1],[3,4,3,1],[9,4,3,1],[2,6,1,4],[4,6,3,1],[8,6,3,1],[12,6,1,4],[5,8,1,3],[7,8,1,3],[9,8,1,3],[2,12,4,1],[9,12,4,1]],
  start: [7,13], ghosts: [[1,1],[13,1],[7,7],[1,8],[13,8]], joints: [[13,13],[7,1]], fans: [[1,13]]
};

const byId = id => document.getElementById(id);
const arcade = byId("arcade");
const board = byId("board");
const ctx = board.getContext("2d");
const fanSprite = byId("fan-sprite");
const gameScreen = byId("game");
const exitDialog = byId("exit-dialog");
const controls = [...document.querySelectorAll(".direction")];
const screens = ["home", "character-select", "game", "result", "ranking"].map(byId);
const scoreFormat = new Intl.NumberFormat("pt-BR");
const keyAt = (x, y) => y * SIZE + x;
const currentStage = () => session.hardcore ? HARDCORE : STAGES[session.stageIndex];
const resultSprite = byId("result-sprite");
const resultInk = resultSprite.getContext("2d");
const victoryMotion = byId("victory-motion");

let session = null;
let rankingFrom = "home";
let selectionFrom = "home";
let activeScreen = "home";
let lastScoreId = "";
let classicVictory = null;
let boardBase = null;
let frameTime = 0;
let swipe = null;
let soundOn = false;
let audioContext;
let memoryRank = { serial: 0, scores: [], latestWinner: null };
let rankingPersists = false;

function showScreen(id, focusId) {
  activeScreen = id;
  screens.forEach(screen => { screen.hidden = screen.id !== id; });
  if (focusId) {
    const target = byId(focusId);
    target.focus({ preventScroll: true });
  }
}

function readRanking() {
  if (!rankingPersists) return memoryRank;
  try {
    const stored = JSON.parse(localStorage.getItem(RANK_KEY) || "null");
    if (stored && Number.isSafeInteger(stored.serial) && Array.isArray(stored.scores)) {
      const scores = stored.scores.filter(entry =>
        entry && typeof entry.id === "string" && Number.isSafeInteger(entry.serial) &&
        Number.isSafeInteger(entry.score) && Number.isSafeInteger(entry.completed) &&
        Number.isFinite(entry.used)
      );
      memoryRank = { serial: stored.serial, scores, latestWinner: stored.latestWinner || null };
    }
  } catch {
    // Keep the session ranking when the browser blocks file storage.
  }
  return memoryRank;
}

try {
  localStorage.setItem(RANK_KEY + "-check", "1");
  localStorage.removeItem(RANK_KEY + "-check");
  rankingPersists = true;
} catch {
  rankingPersists = false;
}
readRanking();

function compareScores(a, b) {
  return b.score - a.score || b.completed - a.completed || a.used - b.used || a.serial - b.serial;
}

function writeRanking(rank) {
  memoryRank = rank;
  try {
    localStorage.setItem(RANK_KEY, JSON.stringify(rank));
    rankingPersists = true;
  } catch {
    rankingPersists = false;
  }
}

function registerScore(game) {
  const rank = readRanking();
  const serial = rank.serial + 1;
  const entry = {
    id: Date.now() + "-" + serial,
    serial,
    score: game.score,
    completed: game.completed,
    used: Math.round((ROUND_SECONDS - game.remaining) * 1000)
  };
  const scores = [...rank.scores, entry].sort(compareScores).slice(0, TOP_SCORES);
  writeRanking({ ...rank, serial, scores });
  return { entry, position: scores.findIndex(item => item.id === entry.id) + 1 };
}

function renderRanking(from) {
  rankingFrom = from;
  const list = byId("rank-list");
  list.replaceChildren();
  const { scores, latestWinner } = readRanking();
  const visible = latestWinner && !scores.some(entry => entry.id === latestWinner.id)
    ? [...scores, latestWinner] : scores;
  visible.forEach((entry, index) => {
    const row = document.createElement("li");
    if (entry.id === lastScoreId) row.classList.add("current");
    const position = document.createElement("span");
    const player = document.createElement("span");
    const points = document.createElement("strong");
    position.textContent = index < scores.length ? String(index + 1).padStart(2, "0") : "★";
    player.textContent = entry.name || "Jogador " + String(entry.serial).padStart(3, "0");
    if (index >= scores.length) player.textContent += " · Arcade zerado";
    points.textContent = scoreFormat.format(entry.score);
    row.append(position, player, points);
    list.append(row);
  });
  byId("rank-empty").hidden = visible.length > 0;
  byId("ranking-note").textContent = rankingPersists
    ? "As 10 melhores partidas neste navegador."
    : "O navegador só permite guardar o ranking até fechar a página.";
  showScreen("ranking", "ranking-play");
}

const tones = {
  start: [[392, .09], [523, .09], [659, .15]],
  bud: [[540, .035]],
  joint: [[659, .06], [880, .08]],
  fan: [[523, .06], [659, .06], [784, .06], [1046, .12]],
  ghost: [[480, .05], [970, .09]],
  snack: [[620, .07], [980, .13]],
  hit: [[300, .09], [220, .09], [130, .18]],
  clear: [[523, .07], [659, .07], [784, .07], [1046, .17]]
};

function playSound(name) {
  if (!soundOn || !audioContext || audioContext.state !== "running") return;
  let start = audioContext.currentTime;
  for (const [frequency, duration] of tones[name]) {
    const voice = audioContext.createOscillator();
    const gain = audioContext.createGain();
    voice.type = "square";
    voice.frequency.value = frequency;
    gain.gain.setValueAtTime(.045, start);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    voice.connect(gain).connect(audioContext.destination);
    voice.start(start);
    voice.stop(start + duration);
    start += duration + .02;
  }
}

function makeMaze(walls) {
  const maze = Array.from({ length: SIZE }, (_, y) =>
    Array.from({ length: SIZE }, (_, x) => x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1)
  );
  for (const [x, y, width, height] of walls) {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) maze[y + dy][x + dx] = true;
    }
  }
  return maze;
}

function canMove(maze, x, y, direction) {
  const [dx, dy] = DIRECTIONS[direction];
  return maze[y + dy]?.[x + dx] === false;
}

function newActor([x, y], extra = {}) {
  return { x, y, dir: null, offset: 0, facing: "right", ...extra };
}

function position(actor) {
  const [dx, dy] = DIRECTIONS[actor.dir] || [0, 0];
  return [actor.x + dx * actor.offset, actor.y + dy * actor.offset];
}

function distanceField(maze, targetX, targetY) {
  const start = keyAt(targetX, targetY);
  const distances = new Int16Array(SIZE * SIZE).fill(-1);
  const queue = [start];
  distances[start] = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const point = queue[cursor];
    const x = point % SIZE;
    const y = Math.floor(point / SIZE);
    for (const direction of Object.keys(DIRECTIONS)) {
      if (!canMove(maze, x, y, direction)) continue;
      const [dx, dy] = DIRECTIONS[direction];
      const next = keyAt(x + dx, y + dy);
      if (distances[next] !== -1) continue;
      distances[next] = distances[point] + 1;
      queue.push(next);
    }
  }
  return distances;
}

function choosePlayerDirection(actor) {
  const maze = session.maze;
  if (actor.wanted && canMove(maze, actor.x, actor.y, actor.wanted)) {
    const next = actor.wanted;
    actor.wanted = null;
    return next;
  }
  if (actor.dir && canMove(maze, actor.x, actor.y, actor.dir)) return actor.dir;
  return null;
}

function chooseGhostDirection(ghost) {
  const { maze, powered, player, age, distances } = session;
  const options = Object.keys(DIRECTIONS).filter(dir => canMove(maze, ghost.x, ghost.y, dir));
  const nonReverse = options.filter(dir => dir !== OPPOSITE[ghost.dir]);
  const allowed = nonReverse.length ? nonReverse : options;
  const roaming = Math.floor((age + ghost.index * 2.3) / 4.8) % 3 === 0;
  const retreat = powered > 0;
  const wander = session.hardcore ? Math.random() < .15 : roaming || (ghost.index > 0 && Math.random() < .23);
  if (!retreat && wander) {
    return allowed[Math.floor(Math.random() * allowed.length)];
  }
  const target = allowed.map(dir => {
    const [dx, dy] = DIRECTIONS[dir];
    return { dir, distance: distances[keyAt(ghost.x + dx, ghost.y + dy)] };
  });
  target.sort((a, b) => retreat ? b.distance - a.distance : a.distance - b.distance);
  return target[0]?.dir || player.dir;
}

function advance(actor, distance, chooseDirection, onArrival) {
  while (distance > 0.000001) {
    if (actor.offset === 0) {
      actor.dir = chooseDirection(actor);
      if (!actor.dir) break;
      if (actor.dir === "left" || actor.dir === "right") actor.facing = actor.dir;
    }
    const step = Math.min(distance, 1 - actor.offset);
    actor.offset += step;
    distance -= step;
    if (actor.offset < .999999) break;
    const [dx, dy] = DIRECTIONS[actor.dir];
    actor.x += dx;
    actor.y += dy;
    actor.offset = 0;
    if (onArrival && onArrival(actor.x, actor.y)) break;
  }
}

function resetActors() {
  const stage = currentStage();
  session.player = newActor(stage.start, { wanted: null });
  session.ghosts = stage.ghosts.map((point, index) => newActor(point, { index, returning: 0 }));
  session.distances = distanceField(session.maze, ...stage.start);
  session.powered = 0;
  clearDirectionButtons();
}

function buildBoardBase() {
  const stage = currentStage();
  const maze = session.maze;
  const base = document.createElement("canvas");
  base.width = base.height = SIZE * TILE;
  const ink = base.getContext("2d");
  ink.fillStyle = stage.floor;
  ink.fillRect(0, 0, base.width, base.height);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!maze[y][x]) continue;
      const left = x * TILE;
      const top = y * TILE;
      ink.fillStyle = stage.wall;
      ink.fillRect(left, top, TILE, TILE);
      ink.fillStyle = stage.edge;
      if (maze[y - 1]?.[x] === false) ink.fillRect(left, top, TILE, 2);
      if (maze[y + 1]?.[x] === false) ink.fillRect(left, top + TILE - 2, TILE, 2);
      if (maze[y][x - 1] === false) ink.fillRect(left, top, 2, TILE);
      if (maze[y][x + 1] === false) ink.fillRect(left + TILE - 2, top, 2, TILE);
      ink.fillStyle = stage.glow;
      if ((x + 2 * y) % 5 === 0) ink.fillRect(left + 9, top + 9, 2, 2);
    }
  }
  if (stage.id === "gogreen") {
    ink.fillStyle = stage.edge;
    for (const x of [1, 4, 7, 10, 13]) {
      const left = x * TILE;
      ink.fillRect(left + 5, 8, 10, 4);
      ink.fillRect(left + 7, 6, 5, 8);
      ink.fillStyle = stage.wall;
      ink.fillRect(left + 11, 6, 4, 3);
      ink.fillStyle = stage.edge;
    }
  }
  boardBase = base;
}

function renderBoard(now) {
  if (!session || !boardBase) return;
  ctx.drawImage(boardBase, 0, 0);
  const pulse = Math.floor(now / 170) % 2;
  for (const [key, kind] of session.items) {
    const x = (key % SIZE + .5) * TILE;
    const y = (Math.floor(key / SIZE) + .5) * TILE;
    if (kind === "fan") {
      if (fanSprite.complete && fanSprite.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = pulse ? 1 : .82;
        ctx.drawImage(fanSprite, x - Math.floor(fanSprite.width / 2), y - Math.floor(fanSprite.height / 2));
        ctx.restore();
      }
    } else {
      PixelArt.draw(ctx, kind, x, y, kind === "bud" ? 10 : 16);
    }
  }
  for (const ghost of session.ghosts) {
    if (ghost.returning > 0) continue;
    const [x, y] = position(ghost).map(value => (value + .5) * TILE);
    const frightened = session.powered > 0 && (session.powered > 1 || pulse === 1);
    PixelArt.draw(ctx, "ghost", x, y - pulse, 19, { variant: frightened ? 5 : ghost.index });
  }
  const actor = session.player;
  let [x, y] = position(actor);
  let lift = 0;
  if (session.vault) {
    const { from, remaining } = session.vault;
    const progress = 1 - remaining / VAULT_SECONDS;
    x = from[0] + (x - from[0]) * progress;
    y = from[1] + (y - from[1]) * progress;
    lift = Math.sin(progress * Math.PI) * (session.character === "frog" ? 14 : 9);
  }
  x = (x + .5) * TILE;
  y = (y + .5) * TILE;
  const stepping = actor.dir ? Math.sin(actor.offset * Math.PI) : 0;
  const hit = session.mode === "hit";
  const squash = hit ? .62 : session.character === "bat" ? 1 - pulse * .18 : 1 + stepping * .07;
  if (session.grace === 0 || pulse || hit) {
    if (lift > 0) {
      ctx.fillStyle = "#080707a8";
      ctx.fillRect(Math.round(x - 5), Math.round(y + 5), 10, 3);
    }
    PixelArt.draw(ctx, session.character, x, y - stepping * 3 - lift, 20, {
      flip: actor.facing === "left", squash, variant: session.effect ? 1 : 0
    });
  }
}

function updateHud() {
  const seconds = Math.ceil(session.remaining);
  byId("score").textContent = String(session.score).padStart(5, "0");
  byId("time").textContent = "0" + Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  byId("time").classList.toggle("urgent", seconds <= 15);
  const startingLives = session.hardcore ? 1 : 3;
  byId("lives").textContent = session.lives > 3
    ? "♥ ×" + session.lives
    : "♥".repeat(session.lives) + "♡".repeat(Math.max(0, startingLives - session.lives));
  byId("lives").setAttribute("aria-label", session.lives + (session.lives === 1 ? " vida" : " vidas"));
  const found = session.totalBuds - session.buds;
  byId("bud-count").textContent = "BUDS " + found + "/" + session.totalBuds;
  byId("buds-progress").max = session.totalBuds;
  byId("buds-progress").value = found;
}

function showMessage(title, subtitle, logo = null, joint = false) {
  const image = byId("message-logo");
  image.hidden = !logo;
  if (logo) image.src = "Assets/logo-" + logo + ".png";
  else image.removeAttribute("src");
  byId("message-joint").hidden = !joint;
  byId("message-title").textContent = title;
  byId("message-subtitle").textContent = subtitle;
  byId("board-message").hidden = false;
}

function loadStage(index) {
  session.stageIndex = index;
  const stage = currentStage();
  const maze = makeMaze(stage.walls);
  const items = new Map();
  const reserved = new Set([stage.start, ...stage.ghosts, ...stage.joints, ...stage.fans].map(([x, y]) => keyAt(x, y)));
  const openCells = [];
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const cell = keyAt(x, y);
      if (!maze[y][x] && !reserved.has(cell)) openCells.push(cell);
    }
  }
  // Spread the pickups across the maze as the quota rises in later stages.
  const count = Math.min(stage.budCount, openCells.length);
  for (let i = 0; i < count; i++) {
    const index = Math.floor((i + .5) * openCells.length / count);
    items.set(openCells[index], "bud");
  }
  clearJointEffect();
  session.maze = maze;
  session.items = items;
  session.buds = session.totalBuds = items.size;
  session.age = 0;
  session.mode = "ready";
  session.delay = index === 0 ? 1.25 : .95;
  session.grace = 0;
  session.vault = null;
  for (const [x, y] of stage.joints) items.set(keyAt(x, y), "joint");
  for (const [x, y] of stage.fans) items.set(keyAt(x, y), "fan");
  resetActors();
  arcade.dataset.theme = stage.id;
  const lineLogo = byId("line-logo");
  const logo = session.hardcore ? "pay-pay" : stage.id;
  lineLogo.src = "Assets/logo-" + logo + ".png";
  lineLogo.alt = session.hardcore ? "PAY-PAY" : stage.name;
  byId("phase-count").textContent = session.hardcore ? "HARDCORE" : "FASE " + (index + 1) + "/" + STAGES.length;
  showMessage(session.hardcore ? "Hardcore" : "Fase " + (index + 1),
    session.hardcore ? "55 segundos · 1 vida · 5 fantasmas" : CHARACTERS[session.character] + " no labirinto", logo);
  buildBoardBase();
  updateHud();
  renderBoard(performance.now());
}

function startRound(character, hardcore = false) {
  if (!hardcore) {
    lastScoreId = "";
    classicVictory = null;
  }
  swipe = null;
  session = { character, hardcore, stageIndex: 0, score: 0, lives: hardcore ? 1 : 3,
    remaining: hardcore ? HARDCORE.seconds : ROUND_SECONDS, completed: 0 };
  board.setAttribute("aria-label", "Labirinto. Personagem: " + CHARACTERS[character]);
  showScreen("game", "board");
  loadStage(0);
  frameTime = performance.now();
  playSound("start");
}

function updateJointHud() {
  const clock = byId("effect-time");
  clock.hidden = !session.effect;
  if (session.effect) {
    const label = JOINT_EFFECTS[session.effect.kind].title;
    const text = label + " · " + Math.ceil(session.effect.remaining) + "s";
    if (clock.textContent !== text) clock.textContent = text;
  }
}

function clearJointEffect() {
  if (session.effect?.snackCell != null) session.items.delete(session.effect.snackCell);
  session.effect = null;
  updateJointHud();
}

function startJointEffect(x, y) {
  if (session.effect) clearJointEffect();
  const kinds = Object.keys(JOINT_EFFECTS);
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  const { duration, title, message } = JOINT_EFFECTS[kind];
  session.effect = { kind, remaining: duration, snackCell: null };
  if (kind === "snack") {
    const distances = distanceField(session.maze, x, y);
    const nearby = [];
    let closest = null;
    distances.forEach((distance, cell) => {
      if (distance <= 0 || session.items.has(cell)) return;
      if (closest === null || distance < distances[closest]) closest = cell;
      if (distance >= 2 && distance <= 6) nearby.push(cell);
    });
    const cell = nearby[Math.floor(Math.random() * nearby.length)] ?? closest;
    if (cell !== null) {
      session.effect.snackCell = cell;
      session.items.set(cell, "snack");
    }
  }
  session.mode = "joint-message";
  session.delay = 2.4;
  showMessage(title, message, null, true);
  updateJointHud();
}

function arrive(x, y) {
  const key = keyAt(x, y);
  const item = session.items.get(key);
  if (!item) return false;
  session.items.delete(key);
  if (item === "bud") {
    session.score += 10;
    session.buds--;
  } else if (item === "joint") {
    session.score += 100;
    startJointEffect(x, y);
  } else if (item === "snack") {
    session.lives++;
    clearJointEffect();
  } else {
    session.score += 50;
    session.powered = 5;
  }
  playSound(item);
  updateHud();
  return item === "joint" || session.buds === 0;
}

function finishStage() {
  clearJointEffect();
  session.vault = null;
  session.completed++;
  session.score += 200;
  playSound("clear");
  if (session.hardcore || session.completed === STAGES.length) {
    session.score += Math.floor(session.remaining) * 5;
    finishRound("clear");
    return;
  }
  session.mode = "complete";
  session.delay = .55;
  clearDirectionButtons();
  showMessage("Labirinto limpo!", "+200 pontos");
}

function hitGhost() {
  session.lives--;
  updateHud();
  playSound("hit");
  session.mode = "hit";
  session.delay = .85;
  clearDirectionButtons();
  showMessage("Pegaram você!", session.lives ? "Prepare-se para voltar" : "Fim de jogo");
}

function finishRound(reason) {
  const game = session;
  game.mode = "ended";
  clearJointEffect();
  game.vault = null;
  clearDirectionButtons();
  const recorded = game.hardcore ? null : registerScore(game);
  if (recorded) lastScoreId = recorded.entry.id;
  if (!game.hardcore && reason === "clear") {
    classicVictory = { game, recorded, nameSaved: false };
    const nameInput = byId("winner-name");
    nameInput.value = "";
    nameInput.setCustomValidity("");
  }
  renderResult(game, reason, recorded);
}

function renderResult(game, reason, recorded) {
  const clear = reason === "clear";
  const namedVictory = clear && !game.hardcore;
  arcade.dataset.theme = game.hardcore ? "hardcore" : STAGES[game.stageIndex].id;
  byId("result-title").textContent = game.hardcore && clear ? "Hardcore zerado!" : {
    clear: "Arcade zerado!", time: "Tempo esgotado", hit: "Fim de jogo"
  }[reason];
  const progress = game.completed + "/" + STAGES.length + " labirintos concluídos";
  byId("result-detail").textContent = game.hardcore
    ? (clear ? "Desafio Hardcore concluído." : "Desafio Hardcore")
    : clear ? progress : STAGES[game.stageIndex].name + " · " + progress;
  byId("final-score").textContent = scoreFormat.format(game.score);
  byId("result-rank").textContent = namedVictory && classicVictory.nameSaved
    ? "Nome salvo no ranking local."
    : recorded?.position
      ? recorded.position + "º lugar no ranking local"
      : recorded ? "As 10 melhores estão no ranking local." : "";
  byId("winner-form").hidden = !namedVictory || classicVictory.nameSaved;
  byId("hardcore").hidden = !namedVictory;
  byId("back-to-victory").hidden = !game.hardcore;
  byId("replay").hidden = game.hardcore;
  resultSprite.hidden = clear;
  victoryMotion.hidden = !clear;
  if (clear) {
    victoryMotion.src = "Assets/vitoria-v8.webp";
  } else {
    victoryMotion.removeAttribute("src");
    resultInk.clearRect(0, 0, resultSprite.width, resultSprite.height);
    PixelArt.draw(resultInk, game.character, 72, 48, 70, { squash: .88 });
  }
  showScreen("result", namedVictory ? "hardcore" : game.hardcore ? "back-to-victory" : "replay");
  byId("result").scrollTop = 0;
}

function vaultGhost(gx, gy) {
  const actor = session.player;
  const from = position(actor);
  const direction = actor.dir || actor.wanted;
  const crossed = [];
  if (direction) {
    const [dx, dy] = DIRECTIONS[direction];
    // Go one tile beyond the ghost when the corridor continues in that direction.
    const steps = (gx - actor.x) * dx + (gy - actor.y) * dy >= .5 ? 2 : 1;
    let { x, y } = actor;
    for (let step = 0; step < steps && canMove(session.maze, x, y, direction); step++) {
      x += dx;
      y += dy;
      crossed.push([x, y]);
    }
    if (crossed.length) {
      actor.x = x;
      actor.y = y;
      actor.offset = 0;
      actor.dir = direction;
    }
  }
  session.vault = { from, remaining: VAULT_SECONDS, crossed };
  session.distances = distanceField(session.maze, actor.x, actor.y);
  playSound("ghost");
}

function tick(dt) {
  if (session.mode !== "play") {
    session.delay -= dt;
    if (session.delay > 0) return;
    if (session.mode === "complete") {
      loadStage(session.stageIndex + 1);
      return;
    }
    if (session.mode === "hit") {
      if (!session.lives) {
        finishRound("hit");
        return;
      }
      resetActors();
      session.grace = 1.7;
    }
    session.mode = "play";
    byId("board-message").hidden = true;
    return;
  }
  const previousSecond = Math.ceil(session.remaining);
  session.remaining = Math.max(0, session.remaining - dt);
  if (session.remaining === 0) {
    updateHud();
    finishRound("time");
    return;
  }
  if (previousSecond !== Math.ceil(session.remaining)) updateHud();

  session.age += dt;
  session.powered = Math.max(0, session.powered - dt);
  session.grace = Math.max(0, session.grace - dt);
  if (session.effect) {
    session.effect.remaining -= dt;
    if (session.effect.remaining <= 0) clearJointEffect();
    else updateJointHud();
  }
  const player = session.player;
  const previousCell = keyAt(player.x, player.y);
  if (session.vault) {
    session.vault.remaining -= dt;
    if (session.vault.remaining <= 0) {
      for (const [x, y] of session.vault.crossed) arrive(x, y);
      session.vault = null;
      session.grace = Math.max(.25, session.grace);
    }
  } else {
    const speed = session.effect?.kind === "slow" ? PLAYER_SPEED * .66 : PLAYER_SPEED;
    advance(player, dt * speed, choosePlayerDirection, arrive);
  }
  if (session.mode === "joint-message") return;
  if (session.buds === 0) {
    finishStage();
    return;
  }
  if (previousCell !== keyAt(player.x, player.y)) {
    session.distances = distanceField(session.maze, player.x, player.y);
  }
  const [px, py] = position(player);
  for (let i = 0; i < session.ghosts.length; i++) {
    const ghost = session.ghosts[i];
    if (ghost.returning > 0) {
      ghost.returning = Math.max(0, ghost.returning - dt);
      continue;
    }
    const speed = session.powered > 0 ? 3.1 : session.hardcore ? HARDCORE.ghostSpeed : 3.7 + session.stageIndex * .35;
    advance(ghost, dt * speed, chooseGhostDirection);
    const [gx, gy] = position(ghost);
    if (session.vault || Math.hypot(px - gx, py - gy) > .61) continue;
    if (session.effect?.kind === "jump") {
      if (session.grace === 0) vaultGhost(gx, gy);
    } else if (session.powered > 0) {
      const spawn = currentStage().ghosts[i];
      session.ghosts[i] = newActor(spawn, { index: i, returning: 2.6 });
      session.score += 150;
      playSound("ghost");
      updateHud();
    } else if (session.grace === 0) {
      hitGhost();
      return;
    }
  }
}

function frame(now) {
  const dt = Math.min(.05, Math.max(0, (now - frameTime) / 1000));
  frameTime = now;
  if (activeScreen === "game" && session && !exitDialog.open && !document.hidden) {
    tick(dt);
    if (activeScreen === "game") renderBoard(now);
  }
  requestAnimationFrame(frame);
}

function clearDirectionButtons() {
  controls.forEach(button => button.classList.remove("chosen"));
}

function setDirection(direction) {
  if (activeScreen !== "game" || !session || exitDialog.open) return;
  if (session.mode !== "play" && session.mode !== "ready" && session.mode !== "joint-message") return;
  const actor = session.player;
  actor.wanted = direction;
  if (actor.offset > 0 && OPPOSITE[actor.dir] === direction) {
    const [dx, dy] = DIRECTIONS[actor.dir];
    actor.x += dx;
    actor.y += dy;
    actor.offset = 1 - actor.offset;
    actor.dir = direction;
    if (direction === "left" || direction === "right") actor.facing = direction;
    actor.wanted = null;
  }
  controls.forEach(button => button.classList.toggle("chosen", button.dataset.direction === direction));
}

function returnHome() {
  session = null;
  classicVictory = null;
  swipe = null;
  arcade.dataset.theme = "home";
  showScreen("home", "play");
}

controls.forEach(button => {
  button.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    setDirection(button.dataset.direction);
  });
  button.addEventListener("click", event => {
    if (event.detail === 0) setDirection(button.dataset.direction);
  });
});
gameScreen.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" || !event.isPrimary || swipe || event.target.closest("button")) return;
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY, direction: null };
  gameScreen.setPointerCapture(event.pointerId);
});
function trackSwipe(event) {
  if (swipe?.id !== event.pointerId) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
  const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  if (direction !== swipe.direction) setDirection(direction);
  swipe.direction = direction;
  swipe.x = event.clientX;
  swipe.y = event.clientY;
}
gameScreen.addEventListener("pointermove", trackSwipe);
gameScreen.addEventListener("pointerup", event => {
  if (swipe?.id !== event.pointerId) return;
  trackSwipe(event);
  swipe = null;
});
for (const type of ["pointercancel", "lostpointercapture"]) {
  gameScreen.addEventListener(type, event => {
    if (swipe?.id === event.pointerId) swipe = null;
  });
}
document.addEventListener("keydown", event => {
  if (activeScreen !== "game" || exitDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  const direction = KEYS[event.key] || KEYS[event.key.toLowerCase()];
  if (!direction) return;
  event.preventDefault();
  setDirection(direction);
});
document.addEventListener("visibilitychange", () => { frameTime = performance.now(); });

for (const id of Object.values(PLAY_BUTTONS)) {
  byId(id).addEventListener("click", () => {
    selectionFrom = activeScreen;
    showScreen("character-select", "character-title");
  });
}
for (const character of Object.keys(CHARACTERS)) {
  const preview = byId("preview-" + character).getContext("2d");
  PixelArt.draw(preview, character, 32, 32, 49);
  byId("choose-" + character).addEventListener("click", () => startRound(character));
}
byId("character-back").addEventListener("click", () => {
  showScreen(selectionFrom, PLAY_BUTTONS[selectionFrom]);
});
byId("winner-name").addEventListener("input", event => event.target.setCustomValidity(""));
byId("winner-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!classicVictory || classicVictory.nameSaved) return;
  const input = byId("winner-name");
  const name = input.value.trim().replace(/\s+/g, " ").slice(0, input.maxLength);
  if (!name) {
    input.setCustomValidity("Digite seu nome.");
    input.reportValidity();
    return;
  }
  const rank = readRanking();
  const winner = { ...classicVictory.recorded.entry, name };
  const scores = rank.scores.map(entry => entry.id === winner.id ? winner : entry);
  writeRanking({ ...rank, scores, latestWinner: winner });
  classicVictory.nameSaved = true;
  byId("winner-form").hidden = true;
  byId("result-rank").textContent = "Nome salvo no ranking local.";
  byId("hardcore").focus({ preventScroll: true });
});
byId("hardcore").addEventListener("click", () => {
  if (classicVictory && activeScreen === "result") startRound(classicVictory.game.character, true);
});
byId("back-to-victory").addEventListener("click", () => {
  if (classicVictory) renderResult(classicVictory.game, "clear", classicVictory.recorded);
});
PixelArt.draw(byId("message-joint").getContext("2d"), "joint", 28, 20, 40);
byId("home-ranking").addEventListener("click", () => renderRanking("home"));
byId("result-ranking").addEventListener("click", () => renderRanking("result"));
byId("ranking-back").addEventListener("click", () => {
  const button = rankingFrom === "home" ? "home-ranking" : "result-ranking";
  showScreen(rankingFrom, button);
});
byId("result-home").addEventListener("click", returnHome);
byId("exit-game").addEventListener("click", () => {
  byId("confirm-exit").textContent = session.hardcore ? "Voltar à vitória" : "Voltar ao início";
  exitDialog.showModal();
});
byId("resume").addEventListener("click", () => exitDialog.close());
byId("confirm-exit").addEventListener("click", () => {
  exitDialog.close();
  if (session.hardcore && classicVictory) renderResult(classicVictory.game, "clear", classicVictory.recorded);
  else returnHome();
});

const muteButton = byId("mute");
const soundWave = byId("sound-waves");
muteButton.addEventListener("click", async () => {
  if (!soundOn) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audioContext ||= new Audio();
      await audioContext.resume();
    } catch {
      return;
    }
  }
  soundOn = !soundOn;
  muteButton.setAttribute("aria-pressed", String(soundOn));
  muteButton.setAttribute("aria-label", soundOn ? "Desativar som" : "Ativar som");
  soundWave.setAttribute("d", soundOn ? "M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12" : "m16 9 5 6m0-6-5 6");
  if (soundOn) playSound("joint");
});

const fullscreenButton = byId("fullscreen");
fullscreenButton.hidden = !document.fullscreenEnabled;
fullscreenButton.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    fullscreenButton.hidden = true;
  }
});
document.addEventListener("fullscreenchange", () => {
  fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? "Sair da tela cheia" : "Tela cheia");
});

requestAnimationFrame(frame);
