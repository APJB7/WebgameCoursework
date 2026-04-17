const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

const gravity = 1

// store the sound files in constants for later use

const themeSong = new Audio('/sound/themeSong.flac');
themeSong.loop = true;
themeSong.volume = 0.5;


const gameOverSong = new Audio ('/sound/gameOver.flac');
gameOverSong.volume = 0.7;

const jumpSong = new Audio ('/sound/jumpSound.mp3')
jumpSong.volume = 0.3;

const coinSong = new Audio('/sound/coinSound.mp3')
coinSong.volume = 0.3;

const winSong = new Audio('/sound/levelCompleted.flac')
winSong.volume = 0.5

//variable to look for the username in the local storage
const userName = localStorage.getItem('logInUser');


// import all the pictures
let platformImage = createImage('/images/Group 296.png')
let backgroundImage = createImage('/images/gameBackgroundSprite.png')
let upperPlatform = createImage('/images/Group 300.png')
let pipe = createImage('images/pipe1.png')
let pipe2 = createImage('/images/pipeBlue.png')
let gladiator = createImage("/images/gladiatoro1.png")
let gladiator2 = createImage("/images/gladiatoro3.png")
let gladiatorLeft = createImage('/images/gladiatoroLeft.png')
let gladiatorLeft2 = createImage('/images/gladiatoroLeft2.png')
let plant = createImage('/images/plant1.png')
let blockImage = createImage('/images/piranhaPlant.png')
let blockImage2 = createImage('/images/plant1.png')
let blockImage3 = createImage('/images/plant1.png')
let goomba1 = createImage('/images/goomba2.png')
let collisionBox1 = createImage('/images/invisibleSpriteFinal.png')
let koopa1 = createImage('/images/koopaa.png')
let biggerPlatform = createImage('/images/biggerPlatform.png')
let yellowPipe = createImage('/images/yellowPipe.png')
let blockPlatform = createImage('/images/blockPlatform.png')
let coinImage = createImage('/images/coin.png')
let flagImage = createImage('/images/winningFlag.png')

let flag
let blockInstance
let blockInstance2
let blockInstance3
let blockInstance4
let blockInstance5
let blockInstance6
let blockInstance7
let blockInstance8
let blockInstance9
let blockInstance10


let movingBlock
let movingBlock1
let movingBlock2
let movingBlock3
let movingBlock4
let movingBlock5


let scrollOffSet = 0

let score = 0;
let startTime = Date.now();
let timeLeft = 0;

//imported font
const font = new FontFace('Pixelated', 'url(fonts/PixelatedDisplay.ttf)');

document.addEventListener('click', () => {
    // This runs only on the first click
    themeSong.play();
    gameOverSong.play(); // Preload or trigger audio context by playing/pausing once
    jumpSong.play();
}, { once: true }); // Only run once and remove after the first click

//player class already instantiated as those values remain fixed
class Player {
    constructor() {
        this.speed = 8
        this.position = {
            x: 100,
            y: 100
        }
        this.velocity = {
            x: 0,
            y: 0
        }
        this.images = [gladiator, gladiator2]
        this.currentImageIndex = 0
        this.image = this.images[this.currentImageIndex]
        this.width = 55
        this.height = 100
        this.canJump = false
        this.frameCounter = 0
        this.facingRight = true // Track the direction
    }

    draw() {
        // save the state of canvas
        c.save()
        if (!this.facingRight) {
            // Flips the context horizontally if facing left
            c.scale(-1, 1)
            c.drawImage(
                this.image,
                -this.position.x - (this.image.width -19), // used to adjust for detection collision when standing on platform
                this.position.y
            )
        } else {
            // draw the right facing image
            c.drawImage(
                this.image,
                this.position.x,
                this.position.y
            )
        }
        c.restore()
    }
    

    update() {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        // Simple gravity effect
        if (this.position.y + this.height + this.velocity.y <= canvas.height) {
            this.velocity.y += gravity
        }

        // Update animation
        this.updateAnimation()
    }

    updateAnimation() {
        // Update animation for both left and right movement
        if (keys.right.pressed || keys.left.pressed) {
            this.frameCounter++

            // Change the image every 10 frames for a smoother animation
            if (this.frameCounter % 10 === 0) {
                this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length
                this.image = this.images[this.currentImageIndex]
            }
        } else {
            // If not moving, reset to the first image
            this.image = this.images[0]
        }
    }
}

class Coin {
    constructor(x, y, image) {
        this.position = { x, y };
        this.image = image;
        this.width = 30; 
        this.height = 30;
        this.collected = false; // Tracks if the coin has been collected
    }

    draw() {
        if (!this.collected) { // Only draw if the coin hasn't been collected
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        }
    }

    checkCollision(player) {
        if (
            !this.collected && // Only check collision if the coin is not collected
            player.position.x < this.position.x + this.width &&
            player.position.x + player.width > this.position.x &&
            player.position.y < this.position.y + this.height &&
            player.position.y + player.height > this.position.y
        ) {
            this.collected = true; // Mark coin as collected
            score += 10; // Increase score
            coinSong.currentTime = 0
            coinSong.play()
        }
    }
}

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
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        }
    }

    checkCollision(player) {
        if (
            player.position.x < this.position.x + this.width &&
            player.position.x + player.width > this.position.x &&
            player.position.y < this.position.y + this.height &&
            player.position.y + player.height > this.position.y
        ) {
            this.reached = true;
            displayWin();
            score = score + 1000
            gameOver = true;
            themeSong.pause()
            winSong.play()

            saveScore();
        }
    }
}

// Update keydown event listener to track direction
addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowRight':
            keys.right.pressed = true
            player.facingRight = true // Face right
            break
        case 'ArrowLeft':
            keys.left.pressed = true
            player.facingRight = false // Face left
            break
        case 'ArrowUp':
            if (player.canJump) {
                player.velocity.y = -15
                player.canJump = false
            }
            jumpSong.currentTime = 0;
            jumpSong.play()
            break
    }
})

class Platform {
    constructor({ x, y, image }) {
        this.position = {
            x,
            y
        }
        this.image = image
        this.width = image.width
        this.height = image.height
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y)
    }
}

class GoombaEnnemy {

    constructor({ x, y, width, height, image, collisionBox, minX, maxX, speed }) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.minX = minX; // The left boundary in world coordinates
        this.maxX = maxX; // The right boundary in world coordinates
        this.speed = speed;
        this.directionX = 'right';
        this.isDefeated = false;
        
        this.sprite = new Goomba({
            x: this.position.x, 
            y: this.position.y, 
            width: this.width, 
            height: this.height,
            image: image, 
            minX: this.minX, 
            maxX: this.maxX,
            speed: this.speed 
        });


        this.collisionBox = new CollisionBox ({
            x: this.position.x,
            y: this.position.y, 
            width: this.width, 
            height: this.height,
            collisionBox: collisionBox,
            minX: this.minX,
            maxX: this.maxX, 
            speed: this.speed 
        });
        
    }


    draw() {
        this.sprite.draw()
        this.collisionBox.draw()
    }
    update() {
        this.sprite.update()
        this.collisionBox.update()
    }

    checkCollision(player, collisionBox) {
        return this.collisionBox.checkCollision(player, collisionBox)
    }


}

class CollisionBox {

    constructor({ x, y, width, height, collisionBox, minX, maxX, speed }) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.minX = minX; // The left boundary in world coordinates
        this.maxX = maxX; // The right boundary in world coordinates
        this.speed = speed;
        this.collisionBox = collisionBox;
        this.directionX = 'right';
    }

    draw() {
        if (this.isDefeated) return;
        c.save(); // Save the current canvas state

        if (this.directionX === 'right') {
            // Flip the image horizontally when moving right
            c.scale(-1, 1);
            c.drawImage(this.collisionBox, -(this.position.x - scrollOffSet) - this.width, this.position.y, this.width, this.height);
        } else {
            // Draw normally when moving left
            c.drawImage(this.collisionBox, this.position.x - scrollOffSet, this.position.y, this.width, this.height);
        }

        c.restore(); // Restore the canvas state
    }

    update() {

        if (this.isDefeated) return; 
        // Move the Goomba based on the current direction
        if (this.directionX === 'right') {
            this.position.x += this.speed;
            if (this.position.x >= this.maxX) {
                this.directionX = 'left';
            }
        } else if (this.directionX === 'left') {
            this.position.x -= this.speed;
            if (this.position.x <= this.minX) {
                this.directionX = 'right';
            }
        }

        // Draw the Goomba at the updated position
        this.draw();
    }

    checkCollision(player) {
        // Adjust the Goomba's position by subtracting the scroll offset
        const adjustedGoombaPosition = {
            x: this.position.x - scrollOffSet,
            y: this.position.y
        };
    
        return (
            player.position.x < adjustedGoombaPosition.x + this.width &&
            player.position.x + player.width > adjustedGoombaPosition.x &&
            player.position.y < adjustedGoombaPosition.y + this.height &&
            player.position.y + player.height > adjustedGoombaPosition.y
        );
    }
    
}

class Goomba {
    constructor({ x, y, width, height, image, minX, maxX, speed }) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.minX = minX; // The left boundary in world coordinates
        this.maxX = maxX; // The right boundary in world coordinates
        this.speed = speed;
        this.image = image;
        this.directionX = 'right';
        this.isDefeated = false;
    }

    

    draw() {
        if (this.isDefeated) return;
        c.save(); // Save the current canvas state

        if (this.directionX === 'right') {
            // Flip the image horizontally when moving right
            c.scale(-1, 1);
            c.drawImage(this.image, -(this.position.x - scrollOffSet) - this.width, this.position.y, this.width, this.height);
        } else {
            // Draw normally when moving left
            c.drawImage(this.image, this.position.x - scrollOffSet, this.position.y, this.width, this.height);
        }

        c.restore(); // Restore the canvas state
    }

    update() {

        if (this.isDefeated) return; 
        // Move the Goomba based on the current direction
        if (this.directionX === 'right') {
            this.position.x += this.speed;
            if (this.position.x >= this.maxX) {
                this.directionX = 'left';
            }
        } else if (this.directionX === 'left') {
            this.position.x -= this.speed;
            if (this.position.x <= this.minX) {
                this.directionX = 'right';
            }
        }
        console.log(`Goomba Position: X: ${this.position.x}, Y: ${this.position.y}, s: ${scrollOffSet}`);


        // Draw the Goomba at the updated position
        this.draw();
    }

}

class Block {
    constructor({ x, y, width, height, image, minY, maxY, speed }) {
        this.position = {
            x,
            y
        }
        this.width = width
        this.height = height
        this.image = image  // Using the image
        this.minY = minY
        this.maxY = maxY
        this.speed = speed
        this.directionY = 'up' // Initial vertical direction of movement
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y)// this.width, this.height)  // Drawing the block as an image
    }

    update() {
        // Move the block vertically
        if (this.directionY === 'up') {
            this.position.y -= this.speed
            if (this.position.y <= this.maxY) {
                this.directionY = 'down'
            }
        } else {
            this.position.y += this.speed
            if (this.position.y >= this.minY) {
                this.directionY = 'up'
            }
        }

        // Draw the block
        this.draw()
    }

    checkCollision(player) {
        return (
            player.position.x < this.position.x + this.width &&
            player.position.x + player.width > this.position.x &&
            player.position.y + player.height < this.position.y + this.height && // Ensure it's below the Goomba
            player.position.y + player.height + player.velocity.y >= this.position.y // Ensure it's falling onto Goomba
        );
    }
    
}

class GenericObject {
    constructor({ x, y, image, scaleHeight }) {
        this.position = {
            x,
            y
        }
        this.image = image
        this.scaleHeight = scaleHeight
        this.width = (scaleHeight / image.height) * image.width
        this.height = scaleHeight
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
    }
}

// function to create images 
function createImage(imageSrc) {
    const image = new Image()
    image.src = imageSrc
    return image
}

// function to draw the score and the timer on the canvas
function drawScoreAndTimer() {
    c.fillStyle = 'white';
    c.font = '20px "Press Start 2P", sans-serif';
    c.fillText(`Score: ${score}`, 20, 40);
    c.fillText(`Time Left: ${timeLeft}s`, 720, 40);
}

let player = new Player()
let platforms = []
let genericObjects = []
let coins = []
let animationId
let gameOver = false

const keys = {
    right: {
        pressed: false
    },
    left: {
        pressed: false
    }
}

// function init used to initialise the whole game 
function init() {
    // Reinitialize images
    platformImage = createImage('/images/Group 296.png')
    backgroundImage = createImage('/images/gameBackgroundSprite.png')
    upperPlatform = createImage('/images/Group 300.png')
    pipe = createImage('images/pipe1.png')
    pipe2 = createImage('/images/pipeBlue.png')
    blockImage = createImage('/images/piranhaPlant.png')
    blockImage2 = createImage('/images/plant1.png')
    blockImage3 = createImage('/images/plant1.png')
    goomba1 = createImage('/images/goomba2.png')
    koopa1 = createImage('/images/koopaa.png')
    collisionBox1 = createImage('/images/invisibleSpriteFinal.png')
    biggerPlatform = createImage('/images/biggerPlatform.png')
    blockPlatform = createImage('/images/blockPlatform.png')
    coinImage = createImage('/images/coin.png')
    flagImage =createImage('/images/winningFlag.png')
    
    //instantiate the flag
    flag = new Flag(25000, canvas.height - 440, flagImage);

    score = 0;
    startTime = Date.now();
    // Reset player state
    player = new Player()

    // Clear and reset game variables
    platforms = []
    genericObjects = []
    gameOver = false
    scrollOffSet = 0

    // Initialize the block instance
    blockInstance = new Block({
        x: (platformImage.width * 10  + 570) + 2093 - scrollOffSet,
        y: 465, 
        width: 75, 
        height: 135, 
        image: blockImage, 
        minY: 490,
        maxY: 334,
        speed: 1 
    })

    blockInstance2 = new Block({
        x: (platformImage.width * 10  + 360) + 6700 - scrollOffSet, 
        y: 465,
        width: 75,
        height: 135,
        image: blockImage,
        minY: 505, 
        maxY: 405,
        speed: 1 
    })
    blockInstance3 = new Block({
        x: (platformImage.width * 10  + 360) + 13436 - scrollOffSet, 
        y: 465, 
        width: 75, 
        height: 135, 
        image: blockImage3, 
        minY: 490,
        maxY: 320,
        speed: 0.7 
    })

    blockInstance4 = new Block({
        x: (platformImage.width * 10  + 570) + 10230 - scrollOffSet, 
        y: 465,
        width: 75,
        height: 135, 
        image: blockImage, 
        minY: 505, 
        maxY: 405, 
        speed: 1
    })

    blockInstance5 = new Block({
        x: (platformImage.width * 10  + 570) + 18132 - scrollOffSet, 
        y: 465, 
        width: 75, 
        height: 135, 
        image: blockImage,  
        minY: 490,  
        maxY: 334, 
        speed: 1  
    })

    blockInstance6 = new Block({
        x: (platformImage.width * 10  + 570) + 17918 - scrollOffSet, 
        width: 75, 
        height: 135,  
        image: blockImage,  
        minY: 490,  
        maxY: 334,  
        speed: 1  
    })
    
    blockInstance7 = new Block({
        x: (platformImage.width * 10  + 570) + 17697 - scrollOffSet,  
        y: 465,  
        width: 75,  
        height: 135,  
        image: blockImage, 
        minY: 490,  
        maxY: 334,  
        speed: 1  
    })

    blockInstance8 = new Block({
        x: (platformImage.width * 10  + 570) + 22652 - scrollOffSet,  
        y: 465,  
        width: 75,  
        height: 135,  
        image: blockImage,  
        minY: 490, 
        maxY: 334,  
        speed: 1  
    })

    movingBlock = new GoombaEnnemy({
        x: 300,  
        y: 430, 
        width: 67,  
        height: 78,
        image: goomba1, 
        collisionBox: collisionBox1,
        minX: 20 - scrollOffSet,  
        maxX: 340 - scrollOffSet,  
        speed: 1 + scrollOffSet 
    });

    movingBlock1 = new GoombaEnnemy({
        x: 600,
        y: 420, 
        width: 80, 
        height: 84,
        image: koopa1, 
        collisionBox: collisionBox1,
        minX: 200, 
        maxX: 300,
        speed: 1 + scrollOffSet
    });

    movingBlock2 = new GoombaEnnemy({
        x: 1000, 
        y: 430, 
        width: 67, 
        height: 78,
        image: goomba1,
        collisionBox: collisionBox1,
        minX: 1008, 
        maxX: 1148, 
    });

    movingBlock5 = new GoombaEnnemy({
        x: 2700,
        y: 430, 
        width: 67,
        height: 78,
        image: goomba1, 
        collisionBox: collisionBox1,
        minX: 2708, 
        maxX: 2848, 
        speed: 1 
    });

    movingBlock3 = new GoombaEnnemy({
        x: 7000, 
        y: 430, 
        width: 67, 
        height: 78,
        image: goomba1, 
        collisionBox: collisionBox1,
        minX: 7008,
        maxX: 7148, 
        speed: 1 
    });

    movingBlock4 = new GoombaEnnemy({
        x: 8000, 
        y: 430, 
        width: 67, 
        height: 78,
        image: koopa1, 
        collisionBox: collisionBox1,
        minX: 8008, 
        maxX: 8148, 
        speed: 1 
    });

    // to load all my images simulteneously
    let imagesLoaded = 0
    const totalImages = 3
    const checkAllImagesLoaded = () => {
        imagesLoaded++
        if (imagesLoaded === totalImages) {
            // Add generic background
            genericObjects.push(
                new GenericObject({
                    x: 0,
                    y: 0,
                    image: backgroundImage,
                    scaleHeight: canvas.height
                })
            )

            // Add platforms by shifting their locations
            // Add platforms by shifting their locations
            platforms.push(
                new Platform({
                    x: -10,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width - 14,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 2 + 200,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 2+ 600,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 4 + 200 - 30,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 5 + 420,
                    y: 465,
                    image: pipe
                }),
                new Platform({
                    x: platformImage.width * 5 + 530,
                    y: 465,
                    image: pipe
                }),
                new Platform({
                    x: platformImage.width * 5 + 640,
                    y: 465,
                    image: pipe
                }),
                new Platform({
                    x: platformImage.width * 6.5 + 540,
                    y: 405,
                    image: blockPlatform
                }),
                new Platform({
                    x: platformImage.width * 9.2 + 200,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 10.5 + 500,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 10.5 + 860,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 12.5 + 415,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 15.9 - 150,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 15.9 + 400,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 16.3,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 17.9 - 550,
                    y: 505,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 18.5,
                    y: 405,
                    image: blockPlatform
                }),
                new Platform({
                    x: platformImage.width * 19.4,
                    y: 305,
                    image: blockPlatform
                }),
                new Platform({
                    x: platformImage.width * 21.5 +270,
                    y: 305,
                    image: upperPlatform
                }),
                new Platform({
                    x: platformImage.width * 21.5 +400,
                    y: 305,
                    image: upperPlatform
                }),
                new Platform({
                    x: platformImage.width * 21.5 +50,
                    y: 405,
                    image: upperPlatform
                }),
                new Platform({
                    x: platformImage.width * 21.5 + 215,
                    y: 405,
                    image: upperPlatform
                }),new Platform({
                    x: platformImage.width * 21.9 + 232,
                    y: 405,
                    image: upperPlatform
                }),
                new Platform({
                    x: platformImage.width * 21,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 21.9,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 23.9 + 300,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 23.9 + 720,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 25 + 100,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 24 + 600,
                    y: 505,
                    image: yellowPipe
                }),
                
                new Platform({
                    x: platformImage.width * 27.5 + 220,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 29,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 29 + 390,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 31.5,
                    y: 465,
                    image: pipe
                }),
                new Platform({
                    x: platformImage.width * 32.5,
                    y: 465,
                    image: pipe
                }),
                new Platform({
                    x: platformImage.width * 33.5,
                    y: 465,
                    image: pipe
                }),
                new Platform({
                    x: platformImage.width * 34.5,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 35.3,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 36.1,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 37.6,
                    y: 405,
                    image: blockPlatform
                }),
                new Platform({
                    x: platformImage.width * 37.6 + 244,
                    y: 405,
                    image: blockPlatform
                }),
                new Platform({
                    x: platformImage.width * 40.5,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 41,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 39.5 +50,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 42.5 +120,
                    y: 465,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 42.5 +230,
                    y: 465,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 42.5 +340,
                    y: 465,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 42.5 +450,
                    y: 465,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 42.5 +560,
                    y: 465,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 42.5 +670,
                    y: 465,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 42.5 +780,
                    y: 465,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 45.5 - 50,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 45.5 + 200,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 45.5 +600,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 48.5 + 50,
                    y: 405,
                    image: blockPlatform
                }),
                new Platform({
                    x: platformImage.width * 53 - 440,
                    y: 395,
                    image: biggerPlatform
                }),
                new Platform({
                    x: platformImage.width * 53 - 250,
                    y: 395,
                    image: biggerPlatform
                }),
                new Platform({
                    x: platformImage.width * 50 + 100,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 50 + 440,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 53 - 420,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 53 - 50,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 54.5 + 100,
                    y: 465,
                    image: pipe
                }),
                new Platform({
                    x: platformImage.width * 56 - 50,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 56 + 370,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 56.5,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 58 - 75,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 58 + 340,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 58 + 640,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 58 + 1000,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 58 + 1400,
                    y: 505,
                    image: platformImage
                })
            )}
    }

    coins = [
        new Coin(750, 350, coinImage),
        new Coin(950, 300, coinImage),
        new Coin(1150, 350, coinImage),
        new Coin(1500, 350, coinImage),
        new Coin(1650, 350, coinImage),
        new Coin(1800, 350, coinImage),
        new Coin(1950, 350, coinImage),
        new Coin(2320, 350, coinImage),
        new Coin(2695, 250, coinImage),
        new Coin(3245, 250, coinImage),
        new Coin(3345, 250, coinImage),
        new Coin(3445, 250, coinImage),
        new Coin(4200, 350, coinImage),
        new Coin(4300, 350, coinImage),
        new Coin(4400, 350, coinImage),
        new Coin(5000, 350, coinImage),
        new Coin(5200, 350, coinImage),
        new Coin(5400, 350, coinImage),
        new Coin(5600, 350, coinImage),
        new Coin(5800, 350, coinImage),
        new Coin(6000, 350, coinImage),
        new Coin(6700, 350, coinImage),
        new Coin(6900, 350, coinImage),
        new Coin(7100, 280, coinImage),
        new Coin(7300, 350, coinImage),
        new Coin(7900, 280, coinImage),
        new Coin(8020, 280, coinImage),
        new Coin(8230, 180, coinImage),
        new Coin(8390, 180, coinImage),
        new Coin(9220, 450, coinImage),
        new Coin(9320, 450, coinImage),
        new Coin(9420, 450, coinImage),
        new Coin(9520, 450, coinImage),
        new Coin(9620, 450, coinImage),
        new Coin(9420, 350, coinImage),
        new Coin(9520, 350, coinImage),
        new Coin(9620, 350, coinImage),
        new Coin(9420, 250, coinImage),
        new Coin(9520, 250, coinImage),
        new Coin(9620, 250, coinImage),
        new Coin(10510, 350, coinImage),
        new Coin(10660, 350, coinImage),
        new Coin(10810, 280, coinImage),
        new Coin(10960, 350, coinImage),
        new Coin(11110, 350, coinImage),
        new Coin(12000, 350, coinImage),
        new Coin(12100, 350, coinImage),
        new Coin(12200, 350, coinImage),
        new Coin(12300, 350, coinImage),
        new Coin(12400, 350, coinImage),
        new Coin(12500, 350, coinImage),
        new Coin(12600, 350, coinImage),
        new Coin(12700, 350, coinImage),
        new Coin(12800, 350, coinImage),
        new Coin(12900, 350, coinImage),
        new Coin(13000, 350, coinImage),
        new Coin(13400, 350, coinImage),
        new Coin(13815, 350, coinImage),
        new Coin(14235, 350, coinImage),
        new Coin(14690, 350, coinImage),
        new Coin(14890, 350, coinImage),
        new Coin(15090, 350, coinImage),
        new Coin(15290, 350, coinImage),
        new Coin(15490, 350, coinImage),
        new Coin(15990, 300, coinImage),
        new Coin(16090, 300, coinImage),
        new Coin(16190, 300, coinImage),
        new Coin(16290, 300, coinImage),
        new Coin(16890, 350, coinImage),
        new Coin(17090, 350, coinImage),
        new Coin(17290, 350, coinImage),
        new Coin(17490, 350, coinImage),
        new Coin(17690, 350, coinImage),
        new Coin(18300, 400, coinImage),
        new Coin(18500, 400, coinImage),
        new Coin(18700, 400, coinImage),
        new Coin(19400, 350, coinImage),
        new Coin(19600, 350, coinImage),
        new Coin(19800, 350, coinImage),
        new Coin(20000, 350, coinImage),
        new Coin(20200, 350, coinImage),
        new Coin(20620, 280, coinImage),
        new Coin(20780, 280, coinImage),
        new Coin(21380, 450, coinImage),
        new Coin(21580, 450, coinImage),
        new Coin(21780, 450, coinImage),
        new Coin(21980, 450, coinImage),
        new Coin(22180, 450, coinImage),
        new Coin(22080, 350, coinImage),
        new Coin(22180, 350, coinImage),
        new Coin(22280, 350, coinImage),
        new Coin(22380, 350, coinImage),
        new Coin(22380, 450, coinImage),
        new Coin(22580, 450, coinImage),
        new Coin(23780, 450, coinImage),
        new Coin(23880, 450, coinImage),
        new Coin(23980, 450, coinImage),
        new Coin(24080, 450, coinImage),
        new Coin(24180, 450, coinImage),
        new Coin(24280, 450, coinImage),
        new Coin(24380, 450, coinImage),
        new Coin(24480, 450, coinImage),
        new Coin(24580, 450, coinImage),
        new Coin(24680, 450, coinImage),
        new Coin(24780, 450, coinImage),
        new Coin(23880, 350, coinImage),
        new Coin(23980, 350, coinImage),
        new Coin(24080, 350, coinImage),
        new Coin(24180, 350, coinImage),
        new Coin(24280, 350, coinImage),
        new Coin(24380, 350, coinImage),
        new Coin(24480, 350, coinImage),
        new Coin(24580, 350, coinImage),
        new Coin(24680, 350, coinImage),
        new Coin(24780, 350, coinImage),
       

        ]
    // Load images
    backgroundImage.onload = checkAllImagesLoaded
    platformImage.onload = checkAllImagesLoaded
    upperPlatform.onload = checkAllImagesLoaded
}

function displayWin() {
    c.fillStyle = 'rgba(0, 0, 0, 0.5)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = 'white';
    c.font = '40px Jaro';
    c.fillText('You Win!', canvas.width / 2 - 100, canvas.height / 2 - 20);

    const restartButton = document.createElement('button');
    restartButton.innerText = 'Replay';
    restartButton.style.position = 'absolute';
    restartButton.style.top = '50%';
    restartButton.style.left = '50%';
    restartButton.style.transform = 'translate(-50%, -50%)';
    restartButton.style.padding = '10px 20px';
    restartButton.style.fontSize = '20px';
    restartButton.style.cursor = 'pointer';
    document.body.appendChild(restartButton);

    restartButton.onclick = () => {
        document.body.removeChild(restartButton);
        init();
        animate();
    };
}


function displayGameOver() {
    // Dim the background
    c.fillStyle = 'rgba(0, 0, 0, 0.5)';
    c.fillRect(0, 0, canvas.width, canvas.height);

    // Display "You Lose" text
    c.fillStyle = 'white';
    c.font = '40px Jaro';
    c.fillText('You Lose', canvas.width / 2 - 100, canvas.height / 2 - 20);

    // Stop theme song and play game over song
    themeSong.pause();
    jumpSong.pause();
    themeSong.currentTime = 0;
    gameOverSong.play();

    // Delay showing the restart button by 5 seconds
    setTimeout(() => {
        // Create the restart button
        const restartButton = document.createElement('button');
        restartButton.innerText = 'Restart';
        restartButton.style.position = 'absolute';
        restartButton.style.top = '50%';
        restartButton.style.left = '50%';
        restartButton.style.transform = 'translate(-50%, -50%)';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '20px';
        restartButton.style.cursor = 'pointer';
        
        // Add the button to the document
        document.body.appendChild(restartButton);

        // Restart button click handler
        restartButton.onclick = () => {
            document.body.removeChild(restartButton); // Remove the button
            init(); // Reinitialize the game
            animate(); // Start animation
        };
    }, 2800); // 5000 milliseconds = 5 seconds delay
}

function saveScore() {
    const username = localStorage.getItem("loggedInUser");
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

    if (username) {
        // Add the new score to the leaderboard array
        leaderboard.push({ username, score });

        // Save the leaderboard as a JSON object
        localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

    }
    }
function animate() {
    if (gameOver) return;

    themeSong.play();

    animationId = requestAnimationFrame(animate);

    // Clear the canvas
    c.fillStyle = 'white';
    c.fillRect(0, 0, canvas.width, canvas.height);

    const currentTime = Math.floor((Date.now() - startTime) / 1000); // Convert to seconds
    timeLeft = 100 - currentTime; // 300 seconds total
    if (timeLeft <= 0) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        saveScore();
    }

    // Draw the background and platforms
    genericObjects.forEach(genericObject => {
        genericObject.draw();
    });

    //call the block instance
    blockInstance.update();
    blockInstance2.update();
    blockInstance4 .update();
    blockInstance3.update();
    blockInstance5.update();
    blockInstance6.update();
    blockInstance7.update();
    blockInstance8.update();


    platforms.forEach(platform => {
        platform.draw();
    });

    // Draw and check collision for each coin
    coins.forEach(coin => {
        coin.draw();
        coin.checkCollision(player);
    });

    // Draw the flag and check for collision
    flag.draw();
    flag.checkCollision(player);

    drawScoreAndTimer();


    if (movingBlock && !movingBlock.isDefeated) {
        movingBlock.update();
    }

    if (movingBlock && !movingBlock.isDefeated && movingBlock.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock.position.y) {
            // Mark the Goomba as defeated
            movingBlock.isDefeated = true;
            score = score + 100

            player.velocity.y = -10; 
        } else {
            // Player touched the Goomba from the sides or below
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
            
            saveScore();            

        }
    }

    if (movingBlock1 && !movingBlock1.isDefeated) {
        movingBlock1.update();
    }

    if (movingBlock1 && !movingBlock1.isDefeated && movingBlock1.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock1.position.y) {
            // Player jumped on the Goomba
            score = score + 100
    
            // Mark the Goomba as defeated
            movingBlock1.isDefeated = true;

            player.velocity.y = -10; // bounce the player upwards slightly
        } else {
            // Player touched the Goomba from the sides or below
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
            
            saveScore();        }
    }

    if (movingBlock2 && !movingBlock2.isDefeated) {
        movingBlock2.update();
    }

    if (movingBlock2 && !movingBlock2.isDefeated && movingBlock2.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock2.position.y) {
            // Player jumped on the Goomba
       
            movingBlock2.isDefeated = true;
            score = score + 100
    
            
            player.velocity.y = -10; // bounce the player upwards slightly
        } else {
            // Player touched the Goomba from the sides or below
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
            
            saveScore();
            }
    }

    if (movingBlock3 && !movingBlock3.isDefeated) {
        movingBlock3.update();
    }

    if (movingBlock3 && !movingBlock3.isDefeated && movingBlock3.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock3.position.y) {
          
            // Mark the Goomba as defeated
            movingBlock3.isDefeated = true;
            score = score + 100
    
         
            player.velocity.y = -10; // bounce the player upwards slightly
        } else {
            // Player touched the Goomba from the sides or below
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
             
            saveScore();        }
    }

    if (movingBlock4 && !movingBlock4.isDefeated) {
        movingBlock4.update();
    }

    if (movingBlock4 && !movingBlock4.isDefeated && movingBlock4.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock4.position.y) {
        
            // Mark the Goomba as defeated
            movingBlock4.isDefeated = true;
            score = score + 100
    
             
            player.velocity.y = -10; //  bounce the player upwards slightly
        } else {
            // Player touched the Goomba from the sides or below
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
            
            saveScore();        }
    }

    if (movingBlock5 && !movingBlock5.isDefeated) {
        movingBlock5.update();
    }

    if (movingBlock5 && !movingBlock5.isDefeated && movingBlock5.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock5.position.y) {
            // Player jumped on the Goomba
             
            // Mark the Goomba as defeated
            movingBlock5.isDefeated = true;
            score = score + 100
    
            
            player.velocity.y = -10; //  bounce the player upwards slightly
        } else {
            // Player touched the Goomba from the sides or below
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
           
            saveScore();        
        }
    }

// Check for player collision with the block
    if (blockInstance.checkCollision(player)) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
        saveScore();    }

    if (blockInstance2.checkCollision(player)) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
        saveScore();    }

    if (blockInstance3.checkCollision(player)) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
        saveScore();    }

    if (blockInstance4.checkCollision(player)) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
        saveScore();    }
    if (blockInstance5.checkCollision(player)) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
        saveScore();    }

    if (blockInstance6.checkCollision(player)) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
        saveScore();    }

    if (blockInstance7.checkCollision(player)) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
        saveScore();    }

    if (blockInstance8.checkCollision(player)) {
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
        saveScore();    }


    // Update and draw the player
    player.update();
   

    // Player movement logic
    if (keys.right.pressed && player.position.x < 400) {
        player.velocity.x = player.speed; // Move right
    } else if (
        (keys.left.pressed && player.position.x > 20000) || // Allow going back to starting point
        (keys.left.pressed && scrollOffSet === 0 && player.position.x > 0)
    ) {
        player.velocity.x = -player.speed; // Move left
    } else {
        player.velocity.x = 0; // Stop horizontal movement
    }

    // Scroll logic
    if (keys.right.pressed && scrollOffSet < 15000) {
        scrollOffSet += player.speed; // Update the scroll offset
        platforms.forEach(platform => {
            platform.position.x -= player.speed + 10; // Move platforms with the player
        });
        genericObjects.forEach(genericObject => {
            genericObject.position.x -= 2; // Keep the background moving
        });
        // Scroll coins with the background
        coins.forEach(coin => {
            coin.position.x -= player.speed + 10; // Adjust as needed
        });
        flag.position.x -= player.speed + 10
    } else if (keys.left.pressed && scrollOffSet > 0) {
        scrollOffSet -= player.speed; // Update the scroll offset
        platforms.forEach(platform => {
            platform.position.x += player.speed + 10; // Move platforms with the player
        });
        genericObjects.forEach(genericObject => {
            genericObject.position.x += 2; // Keep the background moving
        });
        // Scroll coins with the background
        coins.forEach(coin => {
            coin.position.x += player.speed + 10; // Adjust as needed
        });
        flag.position.x += player.speed + 10
    }

        // Scroll logic for block
    if (keys.right.pressed && scrollOffSet < 15000) {
        blockInstance.position.x -= player.speed + 10
    } else if (keys.left.pressed && scrollOffSet > 0) {
        blockInstance.position.x += player.speed + 10
    }

    if (keys.right.pressed && scrollOffSet < 15000) {
        blockInstance2.position.x -= player.speed + 10
    } else if (keys.left.pressed && scrollOffSet > 0) {
        blockInstance2.position.x += player.speed + 10
    }

    if (keys.right.pressed && scrollOffSet < 15000) {
        blockInstance3.position.x -= player.speed + 10
    } else if (keys.left.pressed && scrollOffSet > 0) {
        blockInstance3.position.x += player.speed + 10
    }

    if (keys.right.pressed && scrollOffSet < 15000) {
        blockInstance4.position.x -= player.speed + 10
        
    } else if (keys.left.pressed && scrollOffSet > 0) {
        blockInstance4.position.x  += player.speed + 10
    }

    if (keys.right.pressed && scrollOffSet < 15000) {
        blockInstance5.position.x -= player.speed + 10
        
    } else if (keys.left.pressed && scrollOffSet > 0) {
        blockInstance5.position.x  += player.speed + 10
    }

    if (keys.right.pressed && scrollOffSet < 15000) {
        blockInstance6.position.x -= player.speed + 10
        
    } else if (keys.left.pressed && scrollOffSet > 0) {
        blockInstance6.position.x  += player.speed + 10
    }

    if (keys.right.pressed && scrollOffSet < 15000) {
        blockInstance7.position.x -= player.speed + 10
        
    } else if (keys.left.pressed && scrollOffSet > 0) {
        blockInstance7.position.x  += player.speed + 10
    }

    if (keys.right.pressed && scrollOffSet < 15000) {
        blockInstance8.position.x -= player.speed + 10
        
    } else if (keys.left.pressed && scrollOffSet > 0) {
        blockInstance8.position.x  += player.speed + 10
    }

    

    // Collision detection with platforms
    platforms.forEach(platform => {
        if (
            player.position.y + player.height <= platform.position.y &&
            player.position.y + player.height + player.velocity.y >= platform.position.y &&
            player.position.x + player.width >= platform.position.x &&
            player.position.x <= platform.position.x + platform.width
        ) {
            player.velocity.y = 0;
            player.canJump = true;
        }
    });

    // Win/Lose conditions
    if (scrollOffSet > 15000) {
        console.log('You win');
        themeSong.pause();
    }

    if (player.position.y > canvas.height) {
        gameOver = true;
        cancelAnimationFrame(animationId);
        displayGameOver();
        console.log('You lose');
        saveScore(userName, score);
    }
}

// Then call the init function
init()
animate()

addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowRight':
            keys.right.pressed = false
            break
        case 'ArrowLeft':
            keys.left.pressed = false
            break
    }
})
