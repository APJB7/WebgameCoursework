const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 576;

const gravity = 1;
const WORLD_SCROLL_LIMIT = 13500;

const GROUND_Y = 505;
const PIPE_Y = 465;
const UPPER_Y = 405;
const HIGH_Y = 305;

/* =========================
   AUDIO
========================= */
const themeSong = new Audio("./sound/themeSong.flac");
themeSong.loop = true;
themeSong.volume = 0.5;

const gameOverSong = new Audio("./sound/gameOver.flac");
gameOverSong.volume = 0.7;

const jumpSong = new Audio("./sound/jumpSound.mp3");
jumpSong.volume = 0.3;

const coinSong = new Audio("./sound/coinSound.mp3");
coinSong.volume = 0.3;

const winSong = new Audio("./sound/levelCompleted.flac");
winSong.volume = 0.5;

let audioUnlocked = false;

document.addEventListener(
  "click",
  () => {
    if (audioUnlocked) return;

    audioUnlocked = true;

    [themeSong, gameOverSong, jumpSong, coinSong, winSong].forEach((sound) => {
      sound
        .play()
        .then(() => {
          sound.pause();
          sound.currentTime = 0;
        })
        .catch(() => {});
    });
  },
  { once: true }
);

/* =========================
   USER
========================= */
const userName =
  localStorage.getItem("loggedInUser") ||
  localStorage.getItem("logInUser") ||
  "Guest";

/* =========================
   IMAGE VARIABLES
========================= */
let platformImage;
let backgroundImage;
let upperPlatform;
let pipe;
let pipe2;
let gladiator;
let gladiator2;
let gladiatorLeft;
let gladiatorLeft2;
let blockImage;
let goomba1;
let collisionBox1;
let koopa1;
let biggerPlatform;
let yellowPipe;
let blockPlatform;
let coinImage;
let flagImage;

/* =========================
   GAME STATE
========================= */
let flag;

let blockInstance;
let blockInstance2;
let blockInstance3;
let blockInstance4;
let blockInstance5;
let blockInstance6;
let blockInstance7;
let blockInstance8;

let movingBlock;
let movingBlock1;
let movingBlock2;
let movingBlock3;
let movingBlock4;
let movingBlock5;

let scrollOffSet = 0;
let score = 0;
let startTime = Date.now();
let timeLeft = 0;

let player;
let platforms = [];
let genericObjects = [];
let coins = [];
let floatingTexts = [];

let animationId;
let gameOver = false;
let levelIntroStart = Date.now();

const keys = {
  right: { pressed: false },
  left: { pressed: false },
};

/* =========================
   FONT
========================= */
const font = new FontFace("Pixelated", "url(./fonts/PixelatedDisplay.ttf)");

font
  .load()
  .then((loadedFont) => {
    document.fonts.add(loadedFont);
  })
  .catch(() => {});

/* =========================
   ASSET LOADING
========================= */
function loadImage(imageSrc) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error(`Could not load image: ${imageSrc}`));
    };

    image.src = imageSrc;
  });
}

function drawLoadingScreen(message = "Loading game...") {
  c.fillStyle = "#07111f";
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.fillStyle = "rgba(16, 185, 129, 0.18)";
  c.beginPath();
  c.arc(canvas.width / 2, canvas.height / 2 - 20, 110, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "white";
  c.font = '22px "Press Start 2P", Arial, sans-serif';
  c.textAlign = "center";
  c.fillText(message, canvas.width / 2, canvas.height / 2);

  c.font = '13px "Press Start 2P", Arial, sans-serif';
  c.fillStyle = "rgba(255, 255, 255, 0.7)";
  c.fillText("Please wait...", canvas.width / 2, canvas.height / 2 + 45);
}

async function loadGameAssets() {
  drawLoadingScreen();

  [
    platformImage,
    backgroundImage,
    upperPlatform,
    pipe,
    pipe2,
    gladiator,
    gladiator2,
    gladiatorLeft,
    gladiatorLeft2,
    blockImage,
    goomba1,
    collisionBox1,
    koopa1,
    biggerPlatform,
    yellowPipe,
    blockPlatform,
    coinImage,
    flagImage,
  ] = await Promise.all([
    loadImage("./images/Group 296.png"),
    loadImage("./images/gameBackgroundSprite.png"),
    loadImage("./images/Group 300.png"),
    loadImage("./images/pipe1.png"),
    loadImage("./images/pipeBlue.png"),
    loadImage("./images/gladiatoro1.png"),
    loadImage("./images/gladiatoro3.png"),
    loadImage("./images/gladiatoroLeft.png"),
    loadImage("./images/gladiatoroLeft2.png"),
    loadImage("./images/piranhaPlant.png"),
    loadImage("./images/goomba2.png"),
    loadImage("./images/invisibleSpriteFinal.png"),
    loadImage("./images/koopaa.png"),
    loadImage("./images/biggerPlatform.png"),
    loadImage("./images/yellowPipe.png"),
    loadImage("./images/blockPlatform.png"),
    loadImage("./images/coin.png"),
    loadImage("./images/winningFlag.png"),
  ]);
}

/* =========================
   VISUAL HELPERS
========================= */
function drawShadow(x, y, width, opacity = 0.28) {
  c.save();
  c.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  c.beginPath();
  c.ellipse(x + width / 2, y, width / 2.4, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function addFloatingText(text, x, y, color = "255, 215, 0") {
  floatingTexts.push({
    text,
    x,
    y,
    opacity: 1,
    color,
  });
}

function updateFloatingTexts() {
  floatingTexts.forEach((item) => {
    c.save();
    c.fillStyle = `rgba(${item.color}, ${item.opacity})`;
    c.font = '16px "Press Start 2P", "Pixelated", sans-serif';
    c.fillText(item.text, item.x, item.y);
    c.restore();

    item.y -= 1.4;
    item.opacity -= 0.025;
  });

  floatingTexts = floatingTexts.filter((item) => item.opacity > 0);
}

function drawLevelIntro() {
  const elapsed = Date.now() - levelIntroStart;

  if (elapsed > 2200) return;

  const opacity = elapsed < 1700 ? 1 : 1 - (elapsed - 1700) / 500;

  c.save();
  c.fillStyle = `rgba(0, 0, 0, ${0.42 * opacity})`;
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.fillStyle = `rgba(255, 215, 95, ${opacity})`;
  c.font = '34px "Press Start 2P", "Pixelated", sans-serif';
  c.textAlign = "center";
  c.fillText("LEVEL 1", canvas.width / 2, 235);

  c.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  c.font = '18px "Press Start 2P", "Pixelated", sans-serif';
  c.fillText("Collect coins and reach the flag", canvas.width / 2, 280);

  c.restore();
}

/* =========================
   PLAYER
========================= */
class Player {
  constructor() {
    this.speed = 8;

    this.position = {
      x: 100,
      y: 100,
    };

    this.velocity = {
      x: 0,
      y: 0,
    };

    this.rightImages = [gladiator, gladiator2];
    this.leftImages = [gladiatorLeft, gladiatorLeft2];

    this.currentImageIndex = 0;
    this.facingRight = true;
    this.image = this.rightImages[this.currentImageIndex];

    this.width = 55;
    this.height = 100;

    this.canJump = false;
    this.frameCounter = 0;

    this.blockedRight = false;
    this.blockedLeft = false;

    this.hitbox = {
      offsetX: 10,
      offsetY: 8,
      width: 38,
      height: 88,
    };
  }

  draw() {
    const isIdle = !keys.right.pressed && !keys.left.pressed;
    const idleOffset = isIdle ? Math.sin(Date.now() / 250) * 1.5 : 0;

    c.drawImage(this.image, this.position.x, this.position.y + idleOffset);

    // Debug player hitbox:
    // const box = this.getHitbox();
    // c.strokeStyle = "lime";
    // c.lineWidth = 2;
    // c.strokeRect(box.x, box.y, box.width, box.height);
  }

  update() {
    this.blockedRight = false;
    this.blockedLeft = false;

    this.draw();

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.position.y + this.height + this.velocity.y <= canvas.height) {
      this.velocity.y += gravity;
    }

    this.updateAnimation();
  }

  updateAnimation() {
    const activeImages = this.facingRight ? this.rightImages : this.leftImages;

    if (keys.right.pressed || keys.left.pressed) {
      this.frameCounter++;

      if (this.frameCounter % 10 === 0) {
        this.currentImageIndex =
          (this.currentImageIndex + 1) % activeImages.length;
      }
    } else {
      this.currentImageIndex = 0;
    }

    this.image = activeImages[this.currentImageIndex];
  }

  getHitbox() {
    return {
      x: this.position.x + this.hitbox.offsetX,
      y: this.position.y + this.hitbox.offsetY,
      width: this.hitbox.width,
      height: this.hitbox.height,
    };
  }
}

/* =========================
   COIN
========================= */
class Coin {
  constructor(x, y, image) {
    this.position = { x, y };
    this.image = image;
    this.width = 30;
    this.height = 30;
    this.collected = false;
  }

  draw() {
    if (this.collected) return;

    const floatOffset = Math.sin(Date.now() / 180 + this.position.x) * 4;
    const scale = 0.85 + Math.sin(Date.now() / 160 + this.position.x) * 0.12;

    const drawWidth = this.width * scale;
    const drawHeight = this.height;

    c.drawImage(
      this.image,
      this.position.x + (this.width - drawWidth) / 2,
      this.position.y + floatOffset,
      drawWidth,
      drawHeight
    );
  }

  checkCollision(player) {
    if (this.collected) return;

    const playerHitbox = player.getHitbox();

    if (
      playerHitbox.x < this.position.x + this.width &&
      playerHitbox.x + playerHitbox.width > this.position.x &&
      playerHitbox.y < this.position.y + this.height &&
      playerHitbox.y + playerHitbox.height > this.position.y
    ) {
      this.collected = true;
      score += 10;

      addFloatingText("+10", this.position.x, this.position.y, "255, 215, 0");

      coinSong.currentTime = 0;
      coinSong.play().catch(() => {});
    }
  }
}

/* =========================
   FLAG
========================= */
class Flag {
  constructor(x, y, image) {
    this.position = { x, y };
    this.image = image;
    this.width = 120;
    this.height = 370;
    this.reached = false;
  }

  draw() {
    if (!this.reached) {
      c.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
  }

  checkCollision(player) {
    if (this.reached) return;

    const playerHitbox = player.getHitbox();

    if (
      playerHitbox.x < this.position.x + this.width &&
      playerHitbox.x + playerHitbox.width > this.position.x &&
      playerHitbox.y < this.position.y + this.height &&
      playerHitbox.y + playerHitbox.height > this.position.y
    ) {
      this.reached = true;
      score += 1000;
      winGame();
    }
  }
}

/* =========================
   PLATFORM
========================= */
class Platform {
  constructor({ x, y, image, type = "ground" }) {
    this.position = { x, y };
    this.image = image;
    this.type = type;

    this.width = image.width || 110;
    this.height = image.height || 40;

    if (type === "pipe") {
      this.hitbox = {
        offsetX: 8,
        offsetY: 0,
        width: 94,
        height: 80,
      };
    } else if (type === "platform") {
      this.hitbox = {
        offsetX: 0,
        offsetY: 0,
        width: this.width,
        height: Math.max(this.height, 35),
      };
    } else {
      this.hitbox = {
        offsetX: 0,
        offsetY: 0,
        width: this.width,
        height: Math.max(this.height, 45),
      };
    }
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y);

    // Debug platform / pipe hitbox:
    // const box = this.getHitbox();
    // c.strokeStyle = this.type === "pipe" ? "cyan" : "yellow";
    // c.lineWidth = 2;
    // c.strokeRect(box.x, box.y, box.width, box.height);
  }

  getHitbox() {
    return {
      x: this.position.x + this.hitbox.offsetX,
      y: this.position.y + this.hitbox.offsetY,
      width: this.hitbox.width,
      height: this.hitbox.height,
    };
  }
}

/* =========================
   ENEMY WRAPPER
========================= */
class GoombaEnnemy {
  constructor({ x, y, width, height, image, collisionBox, minX, maxX, speed }) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
    this.minX = minX;
    this.maxX = maxX;
    this.speed = speed || 1;
    this.isDefeated = false;

    this.sprite = new Goomba({
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      image,
      minX: this.minX,
      maxX: this.maxX,
      speed: this.speed,
    });

    this.collisionBox = new CollisionBox({
      x: this.position.x,
      y: this.position.y,
      width: this.width,
      height: this.height,
      collisionBox,
      minX: this.minX,
      maxX: this.maxX,
      speed: this.speed,
    });
  }

  update() {
    if (this.isDefeated) return;

    this.sprite.update();
    this.collisionBox.update();

    this.position.x = this.collisionBox.position.x;
    this.position.y = this.collisionBox.position.y;
  }

  checkCollision(player) {
    if (this.isDefeated) return false;
    return this.collisionBox.checkCollision(player);
  }

  isPlayerStomping(player) {
    const playerHitbox = player.getHitbox();
    const playerBottom = playerHitbox.y + playerHitbox.height;
    const enemyTop = this.position.y;

    return (
      player.velocity.y > 0 &&
      playerBottom >= enemyTop &&
      playerBottom <= enemyTop + 24
    );
  }

  defeat() {
    this.isDefeated = true;
    this.sprite.isDefeated = true;
    this.collisionBox.isDefeated = true;

    addFloatingText("+100", this.position.x, this.position.y, "255, 120, 80");
  }

  shift(dx) {
    this.position.x += dx;
    this.minX += dx;
    this.maxX += dx;

    this.sprite.position.x += dx;
    this.sprite.minX += dx;
    this.sprite.maxX += dx;

    this.collisionBox.position.x += dx;
    this.collisionBox.minX += dx;
    this.collisionBox.maxX += dx;
  }
}

/* =========================
   ENEMY COLLISION BOX
========================= */
class CollisionBox {
  constructor({ x, y, width, height, collisionBox, minX, maxX, speed }) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
    this.minX = minX;
    this.maxX = maxX;
    this.speed = speed || 1;
    this.collisionBox = collisionBox;
    this.directionX = "right";
    this.isDefeated = false;
  }

  draw() {
    if (this.isDefeated) return;

    const bounce = Math.sin(Date.now() / 120 + this.position.x) * 2;

    c.save();

    if (this.directionX === "right") {
      c.scale(-1, 1);
      c.drawImage(
        this.collisionBox,
        -this.position.x - this.width,
        this.position.y + bounce,
        this.width,
        this.height
      );
    } else {
      c.drawImage(
        this.collisionBox,
        this.position.x,
        this.position.y + bounce,
        this.width,
        this.height
      );
    }

    c.restore();

    // Debug enemy hitbox:
    // c.strokeStyle = "red";
    // c.lineWidth = 2;
    // c.strokeRect(this.position.x, this.position.y, this.width, this.height);
  }

  update() {
    if (this.isDefeated) return;

    if (this.directionX === "right") {
      this.position.x += this.speed;

      if (this.position.x >= this.maxX) {
        this.position.x = this.maxX;
        this.directionX = "left";
      }
    } else {
      this.position.x -= this.speed;

      if (this.position.x <= this.minX) {
        this.position.x = this.minX;
        this.directionX = "right";
      }
    }

    this.draw();
  }

  checkCollision(player) {
    const playerHitbox = player.getHitbox();

    return (
      playerHitbox.x < this.position.x + this.width &&
      playerHitbox.x + playerHitbox.width > this.position.x &&
      playerHitbox.y < this.position.y + this.height &&
      playerHitbox.y + playerHitbox.height > this.position.y
    );
  }
}

/* =========================
   ENEMY SPRITE
========================= */
class Goomba {
  constructor({ x, y, width, height, image, minX, maxX, speed }) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
    this.minX = minX;
    this.maxX = maxX;
    this.speed = speed || 1;
    this.image = image;
    this.directionX = "right";
    this.isDefeated = false;
  }

  draw() {
    if (this.isDefeated) return;

    const bounce = Math.sin(Date.now() / 120 + this.position.x) * 2;

    drawShadow(this.position.x, this.position.y + this.height, this.width, 0.22);

    c.save();

    if (this.directionX === "right") {
      c.scale(-1, 1);
      c.drawImage(
        this.image,
        -this.position.x - this.width,
        this.position.y + bounce,
        this.width,
        this.height
      );
    } else {
      c.drawImage(
        this.image,
        this.position.x,
        this.position.y + bounce,
        this.width,
        this.height
      );
    }

    c.restore();
  }

  update() {
    if (this.isDefeated) return;

    if (this.directionX === "right") {
      this.position.x += this.speed;

      if (this.position.x >= this.maxX) {
        this.position.x = this.maxX;
        this.directionX = "left";
      }
    } else {
      this.position.x -= this.speed;

      if (this.position.x <= this.minX) {
        this.position.x = this.minX;
        this.directionX = "right";
      }
    }

    this.draw();
  }
}

/* =========================
   PIRANHA BLOCK
========================= */
class Block {
  constructor({ x, y, width, height, image, minY, maxY, speed, pipeY }) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
    this.image = image;
    this.minY = minY;
    this.maxY = maxY;
    this.speed = speed;
    this.directionY = "up";
    this.pipeY = pipeY;

    this.animationOffset = Math.random() * Math.PI * 2;
    this.warningPulse = 0;
  }

  isVisibleAbovePipe() {
    const visibleBottom = Math.min(this.position.y + this.height, this.pipeY);
    const visibleTop = this.position.y;

    return visibleBottom > visibleTop && visibleTop < this.pipeY;
  }

  drawWarningPulse() {
    if (!this.isVisibleAbovePipe()) return;

    const pulse = 0.45 + Math.sin(Date.now() / 180 + this.animationOffset) * 0.25;
    const visibleHeight = Math.max(0, this.pipeY - this.position.y);
    const centerX = this.position.x + this.width / 2;
    const centerY = this.position.y + Math.min(visibleHeight / 2, 45);

    c.save();
    c.globalAlpha = pulse;
    c.strokeStyle = "rgba(255, 70, 70, 0.45)";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(centerX, centerY, 34 + pulse * 12, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  draw() {
    if (!this.image || !this.image.complete) return;

    const sway = Math.sin(Date.now() / 220 + this.animationOffset) * 3;
    const stretch = Math.sin(Date.now() / 180 + this.animationOffset) * 0.035;
    const scaleX = 1 + stretch;
    const scaleY = 1 - stretch * 0.6;

    const animatedWidth = this.width * scaleX;
    const animatedHeight = this.height * scaleY;

    const drawX = this.position.x + sway + (this.width - animatedWidth) / 2;
    const drawY = this.position.y + (this.height - animatedHeight);

    //this.drawWarningPulse();

    c.save();

    /*
      Clip area:
      Only the part above the pipe is visible.
      The pipe is drawn after the piranha, so the lower body stays hidden.
    */
    c.beginPath();
    c.rect(this.position.x - 18, 0, this.width + 36, this.pipeY);
    c.clip();

    c.drawImage(this.image, drawX, drawY, animatedWidth, animatedHeight);

    c.restore();

    // Debug piranha hitbox:
    // c.strokeStyle = "orange";
    // c.strokeRect(this.position.x, this.position.y, this.width, this.height);
  }

  update() {
    if (this.directionY === "up") {
      this.position.y -= this.speed;

      if (this.position.y <= this.maxY) {
        this.position.y = this.maxY;
        this.directionY = "down";
      }
    } else {
      this.position.y += this.speed;

      if (this.position.y >= this.minY) {
        this.position.y = this.minY;
        this.directionY = "up";
      }
    }

    this.draw();
  }

  checkCollision(player) {
    const playerHitbox = player.getHitbox();

    const visibleTop = this.position.y;
    const visibleBottom = Math.min(this.position.y + this.height, this.pipeY);

    if (visibleBottom <= visibleTop) return false;

    /*
      Slightly smaller hitbox than the sprite so the collision feels fair.
    */
    const piranhaHitbox = {
      x: this.position.x + 12,
      y: visibleTop + 6,
      width: this.width - 24,
      height: visibleBottom - visibleTop - 6,
    };

    return (
      playerHitbox.x < piranhaHitbox.x + piranhaHitbox.width &&
      playerHitbox.x + playerHitbox.width > piranhaHitbox.x &&
      playerHitbox.y < piranhaHitbox.y + piranhaHitbox.height &&
      playerHitbox.y + playerHitbox.height > piranhaHitbox.y
    );
  }
}

/* =========================
   BACKGROUND OBJECT
========================= */
class GenericObject {
  constructor({ x, y, image, scaleHeight }) {
    this.position = { x, y };
    this.image = image;
    this.scaleHeight = scaleHeight;
    this.width = (scaleHeight / image.height) * image.width;
    this.height = scaleHeight;
  }

  draw() {
    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }
}

/* =========================
   HUD
========================= */
function drawScoreAndTimer() {
  c.save();

  c.fillStyle = "rgba(0, 0, 0, 0.45)";
  c.fillRect(14, 14, 300, 58);
  c.fillRect(690, 14, 320, 58);

  c.strokeStyle = "rgba(244, 180, 0, 0.75)";
  c.lineWidth = 2;
  c.strokeRect(14, 14, 300, 58);
  c.strokeRect(690, 14, 320, 58);

  c.drawImage(coinImage, 26, 25, 26, 26);

  c.fillStyle = "#ffffff";
  c.font = '18px "Press Start 2P", "Pixelated", sans-serif';
  c.fillText(`${score}`, 64, 50);

  c.fillStyle = timeLeft <= 20 ? "#ff6b6b" : "#ffffff";
  c.fillText(`Time: ${timeLeft}s`, 710, 50);

  c.restore();
}

/* =========================
   LEVEL BUILDING HELPERS
========================= */
function addGround(startX, count = 1, gap = 0) {
  const platformOverlap = 4;

  for (let i = 0; i < count; i++) {
    platforms.push(
      new Platform({
        x: startX + i * (platformImage.width - platformOverlap + gap),
        y: GROUND_Y,
        image: platformImage,
        type: "ground",
      })
    );
  }
}

function addPlatform(x, y, image) {
  platforms.push(
    new Platform({
      x,
      y,
      image,
      type: "platform",
    })
  );
}

function addPipe(x, y = PIPE_Y, type = "green") {
  const pipePlatform = new Platform({
    x,
    y,
    image: type === "blue" ? pipe2 : pipe,
    type: "pipe",
  });

  platforms.push(pipePlatform);

  return {
    x,
    y,
    width: pipePlatform.getHitbox().width,
    type,
  };
}

function createPiranhaFromPipe(pipeX, pipeY, pipeWidth = 110, options = {}) {
  const piranhaWidth = options.width || 75;
  const piranhaHeight = options.height || 135;
  const centeredX = pipeX + pipeWidth / 2 - piranhaWidth / 2 + 8;

  return new Block({
    x: centeredX + (options.offsetX || 0),
    y: pipeY + (options.startOffsetY || 35),
    width: piranhaWidth,
    height: piranhaHeight,
    image: options.image || blockImage,
    minY: pipeY + (options.startOffsetY || 35),
    maxY: pipeY - (options.riseHeight || 95),
    speed: options.speed || 1,
    pipeY,
  });
}

function addPiranha(pipeObject, options = {}) {
  return createPiranhaFromPipe(pipeObject.x, pipeObject.y, pipeObject.width, {
    speed: options.speed || 1,
    riseHeight: options.riseHeight || 95,
    startOffsetY: options.startOffsetY || 35,
    offsetX: options.offsetX || 0,
  });
}

function addCoinLine(startX, y, amount, spacing = 90) {
  for (let i = 0; i < amount; i++) {
    coins.push(new Coin(startX + i * spacing, y, coinImage));
  }
}

function addCoinArc(startX, baseY, amount, spacing = 80) {
  for (let i = 0; i < amount; i++) {
    const arcY = baseY - Math.sin((i / (amount - 1)) * Math.PI) * 90;
    coins.push(new Coin(startX + i * spacing, arcY, coinImage));
  }
}

function createGroundEnemy(x, enemyType = "goomba", patrolWidth = 180, speed = 1) {
  const isKoopa = enemyType === "koopa";
  const width = isKoopa ? 72 : 58;
  const height = isKoopa ? 78 : 68;

  return new GoombaEnnemy({
    x,
    y: GROUND_Y - height,
    width,
    height,
    image: isKoopa ? koopa1 : goomba1,
    collisionBox: collisionBox1,
    minX: x - patrolWidth / 2,
    maxX: x + patrolWidth / 2,
    speed,
  });
}

function createPlatformEnemy(
  x,
  platformY,
  enemyType = "goomba",
  patrolWidth = 130,
  speed = 1
) {
  const isKoopa = enemyType === "koopa";
  const width = isKoopa ? 72 : 58;
  const height = isKoopa ? 78 : 68;

  return new GoombaEnnemy({
    x,
    y: platformY - height,
    width,
    height,
    image: isKoopa ? koopa1 : goomba1,
    collisionBox: collisionBox1,
    minX: x - patrolWidth / 2,
    maxX: x + patrolWidth / 2,
    speed,
  });
}

/* =========================
   INIT
========================= */
function init() {
  score = 0;
  startTime = Date.now();
  levelIntroStart = Date.now();
  timeLeft = 100;

  player = new Player();

  platforms = [];
  genericObjects = [];
  coins = [];
  floatingTexts = [];

  gameOver = false;
  scrollOffSet = 0;

  keys.right.pressed = false;
  keys.left.pressed = false;

  genericObjects.push(
    new GenericObject({
      x: 0,
      y: 0,
      image: backgroundImage,
      scaleHeight: canvas.height,
    })
  );

  addGround(-10, 4);
  addCoinLine(680, 360, 4, 90);
  movingBlock = createGroundEnemy(820, "goomba", 180, 1);

  addGround(1850, 3);

  const pipe1A = addPipe(2180, PIPE_Y, "green");
  const pipe1B = addPipe(2310, PIPE_Y, "green");

  blockInstance = addPiranha(pipe1B, {
    speed: 0.85,
    riseHeight: 95,
    startOffsetY: 40,
  });

  addCoinArc(2050, 355, 5, 75);

  addPlatform(3300, UPPER_Y, blockPlatform);
  addPlatform(3650, HIGH_Y, blockPlatform);
  addPlatform(4000, UPPER_Y, blockPlatform);

  addGround(4450, 3);

  addCoinLine(3320, 350, 3, 80);
  addCoinLine(3670, 250, 3, 80);
  addCoinLine(4020, 350, 3, 80);

  movingBlock1 = createPlatformEnemy(3670, HIGH_Y, "goomba", 120, 0.8);

  addGround(5450, 3);

  const bluePipe1 = addPipe(5750, PIPE_Y, "blue");

  blockInstance2 = addPiranha(bluePipe1, {
    speed: 0.95,
    riseHeight: 88,
    startOffsetY: 40,
  });

  addCoinArc(5600, 355, 5, 80);

  movingBlock2 = createGroundEnemy(6250, "koopa", 170, 0.95);

  addGround(7200, 4);

  const pipe2A = addPipe(7550, PIPE_Y, "green");
  addPipe(7680, PIPE_Y, "green");
  const pipe2C = addPipe(7810, PIPE_Y, "green");

  blockInstance3 = addPiranha(pipe2A, {
    speed: 1,
    riseHeight: 95,
    startOffsetY: 40,
  });

  blockInstance4 = addPiranha(pipe2C, {
    speed: 1.1,
    riseHeight: 95,
    startOffsetY: 40,
  });

  addCoinLine(7500, 330, 6, 75);

  addPlatform(9000, UPPER_Y, upperPlatform);
  addPlatform(9150, UPPER_Y, upperPlatform);
  addPlatform(9400, HIGH_Y, upperPlatform);
  addPlatform(9550, HIGH_Y, upperPlatform);
  addPlatform(9800, UPPER_Y, upperPlatform);

  addGround(10100, 2);
  addGround(10600, 2);

  addCoinLine(9030, 350, 3, 80);
  addCoinLine(9430, 250, 3, 80);
  addCoinLine(9830, 350, 3, 80);

  movingBlock3 = createPlatformEnemy(9460, HIGH_Y, "goomba", 110, 0.9);

  addGround(11100, 4);

  const blueStart = 11300;

  const bluePipe2A = addPipe(blueStart, PIPE_Y, "blue");
  addPipe(blueStart + 130, PIPE_Y, "blue");
  const bluePipe2B = addPipe(blueStart + 260, PIPE_Y, "blue");
  addPipe(blueStart + 390, PIPE_Y, "blue");
  const bluePipe2C = addPipe(blueStart + 520, PIPE_Y, "blue");

  blockInstance5 = addPiranha(bluePipe2A, {
    speed: 0.9,
    riseHeight: 88,
    startOffsetY: 40,
  });

  blockInstance6 = addPiranha(bluePipe2B, {
    speed: 1.05,
    riseHeight: 88,
    startOffsetY: 40,
  });

  blockInstance7 = addPiranha(bluePipe2C, {
    speed: 0.95,
    riseHeight: 88,
    startOffsetY: 40,
  });

  addCoinLine(11320, 335, 7, 70);

  movingBlock4 = createGroundEnemy(12180, "koopa", 170, 0.95);

  addGround(13000, 5);

  const finalPipe = addPipe(13370, PIPE_Y, "green");

  blockInstance8 = addPiranha(finalPipe, {
    speed: 1.05,
    riseHeight: 95,
    startOffsetY: 40,
  });

  movingBlock5 = createGroundEnemy(13980, "goomba", 180, 1.1);

  addCoinArc(13200, 360, 6, 80);
  addCoinLine(13900, 350, 5, 80);

  flag = new Flag(14650, canvas.height - 440, flagImage);
}

/* =========================
   GAME ENDING
========================= */
function displayWin() {
  c.fillStyle = "rgba(0, 0, 0, 0.5)";
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.fillStyle = "white";
  c.font = "40px Jaro";
  c.textAlign = "left";
  c.fillText("You Win!", canvas.width / 2 - 100, canvas.height / 2 - 20);

  themeSong.pause();
  themeSong.currentTime = 0;

  winSong.currentTime = 0;
  winSong.play().catch(() => {});
}

function displayGameOver() {
  c.fillStyle = "rgba(0, 0, 0, 0.5)";
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.fillStyle = "white";
  c.font = "40px Jaro";
  c.textAlign = "left";
  c.fillText("You Lose", canvas.width / 2 - 100, canvas.height / 2 - 20);

  themeSong.pause();
  jumpSong.pause();

  themeSong.currentTime = 0;
  jumpSong.currentTime = 0;

  gameOverSong.currentTime = 0;
  gameOverSong.play().catch(() => {});

  setTimeout(() => {
    const existingButton = document.querySelector(".restart-button");
    if (existingButton) return;

    const restartButton = document.createElement("button");
    restartButton.className = "restart-button";
    restartButton.innerText = "Restart";
    restartButton.style.position = "absolute";
    restartButton.style.top = "50%";
    restartButton.style.left = "50%";
    restartButton.style.transform = "translate(-50%, -50%)";
    restartButton.style.padding = "10px 20px";
    restartButton.style.fontSize = "20px";
    restartButton.style.cursor = "pointer";
    restartButton.style.zIndex = "100";

    document.body.appendChild(restartButton);

    restartButton.onclick = () => {
      document.body.removeChild(restartButton);
      gameOverSong.pause();
      gameOverSong.currentTime = 0;
      init();
      animate();
    };
  }, 1200);
}

function saveScore() {
  const username =
    localStorage.getItem("loggedInUser") ||
    localStorage.getItem("logInUser") ||
    userName ||
    "Guest";

  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

  leaderboard.push({ username, score });

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function endGame() {
  if (gameOver) return;

  gameOver = true;
  cancelAnimationFrame(animationId);
  displayGameOver();
  saveScore();
}

function winGame() {
  if (gameOver) return;

  gameOver = true;
  cancelAnimationFrame(animationId);
  displayWin();
  saveScore();
}

/* =========================
   HELPERS
========================= */
function handleEnemyCollision(enemy) {
  if (!enemy || enemy.isDefeated) return;

  enemy.update();

  if (enemy.checkCollision(player)) {
    if (enemy.isPlayerStomping(player)) {
      enemy.defeat();
      score += 100;
      player.velocity.y = -10;
    } else {
      endGame();
    }
  }
}

function handleBlockCollision(block) {
  if (!block) return;

  if (block.checkCollision(player)) {
    endGame();
  }
}

function shiftEnemies(dx) {
  const enemies = [
    movingBlock,
    movingBlock1,
    movingBlock2,
    movingBlock3,
    movingBlock4,
    movingBlock5,
  ];

  enemies.forEach((enemy) => {
    if (enemy && !enemy.isDefeated) {
      enemy.shift(dx);
    }
  });
}

function shiftBlocks(dx) {
  [
    blockInstance,
    blockInstance2,
    blockInstance3,
    blockInstance4,
    blockInstance5,
    blockInstance6,
    blockInstance7,
    blockInstance8,
  ].forEach((block) => {
    if (block) {
      block.position.x += dx;
    }
  });
}

function shiftWorld(dx) {
  platforms.forEach((platform) => {
    platform.position.x += dx;
  });

  genericObjects.forEach((genericObject) => {
    genericObject.position.x += dx * 0.12;
  });

  coins.forEach((coin) => {
    coin.position.x += dx;
  });

  if (flag) {
    flag.position.x += dx;
  }

  shiftBlocks(dx);
  shiftEnemies(dx);
}

/* =========================
   IMPORTANT PIPE SCROLL CHECK
========================= */
function willWorldScrollHitPipe(dx) {
  const playerBox = player.getHitbox();

  return platforms.some((platform) => {
    if (platform.type !== "pipe") return false;

    const pipeBox = platform.getHitbox();

    const futurePipeBox = {
      x: pipeBox.x + dx,
      y: pipeBox.y,
      width: pipeBox.width,
      height: pipeBox.height,
    };

    const isOverlapping =
      playerBox.x < futurePipeBox.x + futurePipeBox.width &&
      playerBox.x + playerBox.width > futurePipeBox.x &&
      playerBox.y < futurePipeBox.y + futurePipeBox.height &&
      playerBox.y + playerBox.height > futurePipeBox.y;

    if (!isOverlapping) return false;

    const playerBottom = playerBox.y + playerBox.height;
    const pipeTop = futurePipeBox.y;

    const playerIsAbovePipe = playerBottom <= pipeTop + 10;

    if (playerIsAbovePipe) return false;

    return true;
  });
}

/* =========================
   SOLID PLATFORM / PIPE COLLISION
========================= */
function handlePlatformCollision() {
  player.canJump = false;

  const playerHitbox = player.getHitbox();
  const groundedTolerance = 6;

  platforms.forEach((platform) => {
    const platformBox = platform.getHitbox();

    const isHorizontallyOverlapping =
      playerHitbox.x + playerHitbox.width > platformBox.x &&
      playerHitbox.x < platformBox.x + platformBox.width;

    const isVerticallyOverlapping =
      playerHitbox.y + playerHitbox.height > platformBox.y &&
      playerHitbox.y < platformBox.y + platformBox.height;

    const isColliding = isHorizontallyOverlapping && isVerticallyOverlapping;

    const playerBottom = playerHitbox.y + playerHitbox.height;
    const playerTop = playerHitbox.y;
    const playerRight = playerHitbox.x + playerHitbox.width;
    const playerLeft = playerHitbox.x;

    const platformTop = platformBox.y;
    const platformBottom = platformBox.y + platformBox.height;
    const platformLeft = platformBox.x;
    const platformRight = platformBox.x + platformBox.width;

    const isStandingOnTop =
      isHorizontallyOverlapping &&
      playerBottom <= platformTop + groundedTolerance &&
      playerBottom + Math.max(player.velocity.y, 0) >= platformTop;

    if (isStandingOnTop) {
      player.position.y =
        platformTop - player.hitbox.offsetY - player.hitbox.height;

      player.velocity.y = 0;
      player.canJump = true;
      return;
    }

    if (!isColliding) return;

    const overlapTop = playerBottom - platformTop;
    const overlapBottom = platformBottom - playerTop;
    const overlapLeft = playerRight - platformLeft;
    const overlapRight = platformRight - playerLeft;

    const smallestOverlap = Math.min(
      overlapTop,
      overlapBottom,
      overlapLeft,
      overlapRight
    );

    if (smallestOverlap === overlapBottom && player.velocity.y < 0) {
      player.position.y = platformBottom - player.hitbox.offsetY;
      player.velocity.y = 0;
      return;
    }

    if (platform.type === "pipe") {
      if (
        smallestOverlap === overlapLeft &&
        (player.velocity.x > 0 || keys.right.pressed)
      ) {
        player.position.x =
          platformLeft - player.hitbox.offsetX - player.hitbox.width;

        player.velocity.x = 0;
        player.blockedRight = true;
        return;
      }

      if (
        smallestOverlap === overlapRight &&
        (player.velocity.x < 0 || keys.left.pressed)
      ) {
        player.position.x = platformRight - player.hitbox.offsetX;
        player.velocity.x = 0;
        player.blockedLeft = true;
        return;
      }
    }

    if (smallestOverlap === overlapTop && player.velocity.y >= 0) {
      player.position.y =
        platformTop - player.hitbox.offsetY - player.hitbox.height;

      player.velocity.y = 0;
      player.canJump = true;
    }
  });
}

/* =========================
   ANIMATE
========================= */
function animate() {
  if (gameOver) return;

  animationId = requestAnimationFrame(animate);

  if (audioUnlocked && themeSong.paused) {
    themeSong.play().catch(() => {});
  }

  c.fillStyle = "white";
  c.fillRect(0, 0, canvas.width, canvas.height);

  const currentTime = Math.floor((Date.now() - startTime) / 1000);
  timeLeft = 100 - currentTime;

  if (timeLeft <= 0) {
    endGame();
    return;
  }

  genericObjects.forEach((genericObject) => {
    genericObject.draw();
  });

  /*
    Piranhas are drawn before pipes.
    This makes the pipe hide the lower part of the piranha.
  */
  blockInstance.update();
  blockInstance2.update();
  blockInstance3.update();
  blockInstance4.update();
  blockInstance5.update();
  blockInstance6.update();
  blockInstance7.update();
  blockInstance8.update();

  platforms.forEach((platform) => {
    platform.draw();
  });

  coins.forEach((coin) => {
    coin.draw();
    coin.checkCollision(player);
  });

  flag.draw();
  flag.checkCollision(player);

  drawScoreAndTimer();

  handleEnemyCollision(movingBlock);
  handleEnemyCollision(movingBlock1);
  handleEnemyCollision(movingBlock2);
  handleEnemyCollision(movingBlock3);
  handleEnemyCollision(movingBlock4);
  handleEnemyCollision(movingBlock5);

  handleBlockCollision(blockInstance);
  handleBlockCollision(blockInstance2);
  handleBlockCollision(blockInstance3);
  handleBlockCollision(blockInstance4);
  handleBlockCollision(blockInstance5);
  handleBlockCollision(blockInstance6);
  handleBlockCollision(blockInstance7);
  handleBlockCollision(blockInstance8);

  updateFloatingTexts();

  if (keys.right.pressed && player.position.x < 400 && !player.blockedRight) {
    player.velocity.x = player.speed;
  } else if (
    keys.left.pressed &&
    scrollOffSet === 0 &&
    player.position.x > 0 &&
    !player.blockedLeft
  ) {
    player.velocity.x = -player.speed;
  } else {
    player.velocity.x = 0;
  }

  player.update();

  handlePlatformCollision();

  const rightScrollDx = -(player.speed + 10);
  const leftScrollDx = player.speed + 10;

  const canScrollRight =
    keys.right.pressed &&
    scrollOffSet < WORLD_SCROLL_LIMIT &&
    !player.blockedRight &&
    !willWorldScrollHitPipe(rightScrollDx);

  const canScrollLeft =
    keys.left.pressed &&
    scrollOffSet > 0 &&
    !player.blockedLeft &&
    !willWorldScrollHitPipe(leftScrollDx);

  if (canScrollRight) {
    scrollOffSet += player.speed;
    shiftWorld(rightScrollDx);
  } else if (canScrollLeft) {
    scrollOffSet -= player.speed;
    shiftWorld(leftScrollDx);
  }

  handlePlatformCollision();

  drawLevelIntro();

  if (scrollOffSet > WORLD_SCROLL_LIMIT) {
    winGame();
  }

  if (player.position.y > canvas.height) {
    endGame();
  }
}

/* =========================
   CONTROLS
========================= */
addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowRight":
      keys.right.pressed = true;
      player.facingRight = true;
      break;

    case "ArrowLeft":
      keys.left.pressed = true;
      player.facingRight = false;
      break;

    case "ArrowUp":
      if (player.canJump) {
        player.velocity.y = -15;
        player.canJump = false;
      }

      jumpSong.currentTime = 0;
      jumpSong.play().catch(() => {});
      break;
  }
});

addEventListener("keyup", (e) => {
  switch (e.key) {
    case "ArrowRight":
      keys.right.pressed = false;
      break;

    case "ArrowLeft":
      keys.left.pressed = false;
      break;
  }
});

/* =========================
   START GAME AFTER ASSETS LOAD
========================= */
async function startGame() {
  try {
    await loadGameAssets();
    init();
    animate();
  } catch (error) {
    console.error(error);

    c.fillStyle = "#07111f";
    c.fillRect(0, 0, canvas.width, canvas.height);

    c.fillStyle = "#ff6b6b";
    c.font = "20px Arial";
    c.textAlign = "center";
    c.fillText(
      "Failed to load game assets.",
      canvas.width / 2,
      canvas.height / 2
    );

    c.fillStyle = "white";
    c.font = "14px Arial";
    c.fillText(
      "Check your images, sound and folder paths.",
      canvas.width / 2,
      canvas.height / 2 + 35
    );
  }
}

startGame();