const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

const gravity = 1

const themeSong = new Audio('/sound/01. Ground Theme.flac');
themeSong.loop = true;
themeSong.volume = 0.5;


const gameOverSong = new Audio ('/sound/08. Lost a Life.flac');
gameOverSong.volume = 0.7;

const jumpSong = new Audio ('sound/cartoon-jump-6462.mp3')
jumpSong.volume = 0.3;

document.addEventListener('click', () => {
    // This runs only on the first click
    themeSong.play();
    gameOverSong.play(); // Preload or trigger audio context by playing/pausing once
    jumpSong.play();
}, { once: true }); // Only run once and remove after the first click


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
            x: this.position.x, // X position near a platform
            y: this.position.y, // Y position (on the platform)
            width: this.width, // Size of the square block (50x50 pixels)
            height: this.height,
            image: image, // Color of the square block
            minX: this.minX, // Minimum X position (left side of the platform)
            maxX: this.maxX, // Maximum X position (right side of the platform)
            speed: this.speed // Speed of movement
        });


        this.collisionBox = new CollisionBox ({
            x: this.position.x, // X position near a platform
            y: this.position.y, // Y position (on the platform)
            width: this.width, // Size of the square block (50x50 pixels)
            height: this.height,
            collisionBox: collisionBox,
            minX: this.minX, // Minimum X position (left side of the platform)
            maxX: this.maxX, // Maximum X position (right side of the platform)
            speed: this.speed // Speed of movement
        });
        
    }


    draw(scrollOffSet) {
        this.sprite.draw(scrollOffSet)
        this.collisionBox.draw(scrollOffSet)
    }
    update(scrollOffSet) {
        this.sprite.update(scrollOffSet)
        this.collisionBox.update(scrollOffSet)
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

    draw(scrollOffSet) {
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

        this.drawCollisionBox();
    }

    drawCollisionBox() {
        c.strokeStyle = 'red'; // Color for the collision box
        c.strokeRect(this.position.x -scrollOffSet, this.position.y, this.width, this.height);
    }

    update(scrollOffSet) {

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
        this.draw(scrollOffSet);
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

    

    draw(scrollOffSet) {
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

    update(scrollOffSet) {

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
        this.draw(scrollOffSet);
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
/*
class Coin {
    constructor(x,y, width, height, image){
        this.position = {
            x,
            y
        }
        this.width = width
        this.height = height
        this.image = image
    }

    draw(c) {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)  // Drawing the block as an image
    }

    update(c) {
        this.draw(c)
    }
}*/

let blockInstance
let blockInstance2
let blockInstance3
let movingBlock
let movingBlock1
let movingBlock2

//let coinSprite


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

function createImage(imageSrc) {
    const image = new Image()
    image.src = imageSrc
    return image
}

// import pictures
let platformImage = createImage('/images/Group 296.png')
let backgroundImage = createImage('/iimages/gameBackgroundSprite.png')
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
let collisionBox1 = createImage('/images/invisibleSprite.png')
let koopa1 = createImage('/images/koopaa.png')
let biggerPlatform = createImage('/images/biggerPlatform.png')

//let coin = createImage('/images/coin.png')


let player = new Player()
let platforms = []
let genericObjects = []
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

let scrollOffSet = 0

let plantInstance

function init() {
    // Reinitialize images
    platformImage = createImage('/images/Group 296.png')
    backgroundImage = createImage('/images/gameBackgroundSprite.png')
    upperPlatform = createImage('/images/Group 300.png')
    pipe = createImage('images/pipe1.png')
    pipe2 = createImage('/images/pipeBlue.png')
   // plant = createImage('/images/plant1.png')
    blockImage = createImage('/images/piranhaPlant.png')
    blockImage2 = createImage('/images/plant1.png')
    blockImage3 = createImage('/images/plant1.png')
    goomba1 = createImage('/images/goomba2.png')
    koopa1 = createImage('/images/koopaa.png')
    collisionBox1 = createImage('/images/invisibleSprite.png')
    biggerPlatform = createImage('/images/biggerPlatform.png')
    
    //coin = createImage('/images/coin.png')

    // Reset player state
    player = new Player()

    // Clear and reset game variables
    platforms = []
    genericObjects = []
    gameOver = false
    scrollOffSet = 0

    // Initialize the block instance
    blockInstance = new Block({
        x: (platformImage.width * 10  + 570) + 2093 - scrollOffSet, // Adjust the x value to position it near the pipe
        y: 465, // Start Y position
        width: 75, // Block width
        height: 135, // Block height
        image: blockImage, // Color of the block
        minY: 490, // Bottom Y value, near the pipe
        maxY: 320, // Top Y value, adjust as needed
        speed: 1 // Speed of the block movement
    })
    
    blockInstance2 = new Block({
        x: (platformImage.width * 10  + 360) + 7103 - scrollOffSet, // Adjust the x value to position it near the pipe
        y: 465, // Start Y position
        width: 75, // Block width
        height: 135, // Block height
        image: blockImage, // Color of the block
        minY: 490, // Bottom Y value, near the pipe
        maxY: 320, // Top Y value, adjust as needed
        speed: 1 // Speed of the block movement
    })

    blockInstance3 = new Block({
        x: (platformImage.width * 10  + 360) + 13436 - scrollOffSet, // Adjust the x value to position it near the pipe
        y: 465, // Start Y position
        width: 75, // Block width
        height: 135, // Block height
        image: blockImage3, // Color of the block
        minY: 490, // Bottom Y value, near the pipe
        maxY: 320, // Top Y value, adjust as needed
        speed: 0.7 // Speed of the block movement
    })

    movingBlock = new GoombaEnnemy({
        x: 300, // X position near a platform
        y: 430, // Y position (on the platform)
        width: 67, // Size of the square block (50x50 pixels)
        height: 78,
        image: goomba1, // Color of the square block
        collisionBox: collisionBox1,
        minX: 20, // Minimum X position (left side of the platform)
        maxX: 340, // Maximum X position (right side of the platform)
        speed: 1 + scrollOffSet// Speed of movement
    });

    movingBlock1 = new GoombaEnnemy({
        x: 600, // X position near a platform
        y: 430, // Y position (on the platform)
        width: 67, // Size of the square block (50x50 pixels)
        height: 78,
        image: koopa1, // Color of the square block
        collisionBox: collisionBox1,
        minX: 200, // Minimum X position (left side of the platform)
        maxX: 300, // Maximum X position (right side of the platform)
        speed: 1 + scrollOffSet// Speed of movement
    });

    movingBlock2 = new GoombaEnnemy({
        x: 1000, // X position near a platform
        y: 430, // Y position (on the platform)
        width: 67, // Size of the square block (50x50 pixels)
        height: 78,
        image: goomba1, // Color of the square block
        collisionBox: collisionBox1,
        minX: 1008, // Minimum X position (left side of the platform)
        maxX: 1148, // Maximum X position (right side of the platform)
        speed: 1 + scrollOffSet // Speed of movement
    });

    /*coin.onload = () => {
        const coinSprite = new Coin(
            100, // x
            400, // y
            28,  // width
            38,  // height
            coin // image
        )}*/

    /*coinSprite = new Coin ({
       x: 100,
       y: 400,
       width: 28,
       height: 38 ,
       image: coin
    })*/

    // Load images synchronously
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
                    x: platformImage.width * 6.5 + 310,
                    y: 432,
                    image: biggerPlatform
                }),
                new Platform({
                    x: platformImage.width * 6.5 + 550,
                    y: 432,
                    image: biggerPlatform
                }),
                new Platform({
                    x: platformImage.width * 8 + 820,
                    y: 405,
                    image: upperPlatform
                }),
                new Platform({
                    x: platformImage.width * 8 + 940,
                    y: 405,
                    image: upperPlatform
                }),
                new Platform({
                    x: platformImage.width * 8 + 310,
                    y: 505,
                    image: platformImage
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
                    x: platformImage.width * 12.5 + 415,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 14.9,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 14.9 + 521,
                    y: 405,
                    image: upperPlatform
                }),
                new Platform({
                    x: platformImage.width * 14.9 + 631,
                    y: 405,
                    image: upperPlatform
                }),
                new Platform({
                    x: platformImage.width * 14.9 + 400,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 17.9 + 200,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 17.9 - 150,
                    y: 465,
                    image: pipe2
                }),
                new Platform({
                    x: platformImage.width * 19.9 + 200,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 21.9 + 200,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 23.9 + 200,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 23.9 + 620,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 26,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 27.5,
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
                    x: platformImage.width * 36.5,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 38,
                    y: 505,
                    image: platformImage
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
                    x: platformImage.width * 41 - 50,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 42.5- 50,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 44 - 50,
                    y: 505,
                    image: platformImage
                }),
                new Platform({
                    x: platformImage.width * 45.5 - 50,
                    y: 505,
                    image: platformImage
                })

            )
        }
    }
    // Load images
    backgroundImage.onload = checkAllImagesLoaded
    platformImage.onload = checkAllImagesLoaded
    upperPlatform.onload = checkAllImagesLoaded
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


function animate() {
    if (gameOver) return;

    themeSong.play();

    animationId = requestAnimationFrame(animate);

    // Clear the canvas
    c.fillStyle = 'white';
    c.fillRect(0, 0, canvas.width, canvas.height);

    

   
    // Draw the background and platforms
    genericObjects.forEach(genericObject => {
        genericObject.draw();
    });

    blockInstance.update();
    blockInstance2.update();
    blockInstance3.update();
    
    //coinSprite.update(c);

    platforms.forEach(platform => {
        platform.draw();
    });

    if (movingBlock && !movingBlock.isDefeated) {
        movingBlock.update(scrollOffSet);
    }

    if (movingBlock && !movingBlock.isDefeated && movingBlock.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock.position.y) {
            // Player jumped on the Goomba
            console.log('Goomba defeated!');
    
            // Mark the Goomba as defeated
            movingBlock.isDefeated = true;
    
            // Add any additional logic like player bounce
            player.velocity.y = -10; // Example: bounce the player upwards slightly
        } else {
            // Player touched the Goomba from the sides or below
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
            console.log('You lose - touched Goomba');
        }
    }

    if (movingBlock1 && !movingBlock1.isDefeated) {
        movingBlock1.update(scrollOffSet);
    }

    if (movingBlock1 && !movingBlock1.isDefeated && movingBlock1.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock1.position.y) {
            // Player jumped on the Goomba
            console.log('Goomba defeated!');
    
            // Mark the Goomba as defeated
            movingBlock1.isDefeated = true;
    
            // Add any additional logic like player bounce
            player.velocity.y = -10; // Example: bounce the player upwards slightly
        } else {
            // Player touched the Goomba from the sides or below
            player.velocity.y = -15;
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
            console.log('You lose - touched Goomba');
        }
    }

    if (movingBlock2 && !movingBlock2.isDefeated) {
        movingBlock2.update(scrollOffSet);
    }

    if (movingBlock2 && !movingBlock2.isDefeated && movingBlock2.checkCollision(player)) {
        // Check if the player is above the Goomba (jumping on it)
        if (player.velocity.y > 0 && player.position.y < movingBlock2.position.y) {
            // Player jumped on the Goomba
            console.log('Goomba defeated!');
    
            // Mark the Goomba as defeated
            movingBlock2.isDefeated = true;
    
            // Add any additional logic like player bounce
            player.velocity.y = -10; // Example: bounce the player upwards slightly
        } else {
            // Player touched the Goomba from the sides or below
            gameOver = true;
            cancelAnimationFrame(animationId);
            displayGameOver();
            console.log('You lose - touched Goomba');
        }
    }


// Check for player collision with the block
    if (blockInstance.checkCollision(player)) {
        player.velocity.y = -15;
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
    }

    if (blockInstance2.checkCollision(player)) {
        player.velocity.y = -15;
        gameOver = true
        cancelAnimationFrame(animationId)
        
        displayGameOver()
        console.log('You lose')
    }

    if (blockInstance3.checkCollision(player)) {
        player.velocity.y = -15;
        gameOver = true
        cancelAnimationFrame(animationId)
        displayGameOver()
        console.log('You lose')
    }

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
    } else if (keys.left.pressed && scrollOffSet > 0) {
        scrollOffSet -= player.speed; // Update the scroll offset
        platforms.forEach(platform => {
            platform.position.x += player.speed + 10; // Move platforms with the player
        });
        genericObjects.forEach(genericObject => {
            genericObject.position.x += 2; // Keep the background moving
        });
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

    /*if (keys.right.pressed && scrollOffSet < 15000) {
        movingBlock.position.x -= player.speed + 10
        
    } else if (keys.left.pressed && scrollOffSet > 0) {
        movingBlock.position.x += player.speed + 10
    }*/

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
    }
}

// Then call the init function
init()
animate()

/*addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowRight':
            keys.right.pressed = true
            break
        case 'ArrowLeft':
            keys.left.pressed = true
            break
        case 'ArrowUp':
            if (player.canJump) {
                player.velocity.y = -15
                player.canJump = false
            }
            jumpSong.play()
            break
    }
})*/

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
