const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set the canvas to occupy the full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game variables
let spaceship; // Spaceship
let asteroids = []; // Asteroid array
let powerUps = []; // Power ups array
let bullets = []; // Bullets array
let score = 0;  // Score variable
let gameOver = false; // Game Over bool
let gameRunning = false; // Game running bool
let bgY = 0; // Background position
let explosionParticles = []; // Explotions array
let shieldActive = false; // Shields bool
let shieldCount = 0; // Track the number of shields
let bulletPowerLevel = 0; // Track the bullet power level
let bulletFireRate = 300; // Initial fire rate, in ms
let bulletFireRateTimer; // Fire rate variable
let lives = 1; // Start with 3 lives
let speedBoostTime = 0; // Initialize speedBoostTime to 0
let pulseWaveActive = false; // Pulse wave bool
let pulseWaveRadius = 0; // sets pulse wave radius
let pulseWaveSpeed = 30;// sets pulse wave speed
let shieldImg, shipExplosionImg, asteroidExplosionImg, lifeImg;
let difficultyLevel = 1; // Difficulty integer
let gameTime = 0; // Game time integer
let gameSpeedMultiplier = 1; // game speed multiplier integer
let difficultyInterval; // difficulty levels interval integer
let gamePaused = false; // game pause bool
let pulseWaveDestroyedCount = 0; // sets number of asteroids destroyed by pulse wave
let magnetizeActive = false; // Magnetize power up bool
let magnetizeTime = 0; // Timer for magnetize power-up
let magnetizeEndTime = 0; // Track the end time of the magnetize effect
let totalPausedTime = 0; // Total Paused Time for pause game function
let pauseStartTime = 0; // Pause start time for pause game function
let lastTime = 0; // define and set last time variable
let lastAsteroidFieldTime = 0; // Define and initialize the variable for asteroid field time
let backgroundMusic, laserShotSound, explosionSound, powerUpSound; // Save sounds in vars
let soundEnabled = true; // General sound variable for options menu
let backgroundMusicVolume = 0.5; // background sound var
let fxVolume = 0.5; // fx sound var

// Load Audio files
function loadAudio(src) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.onloadeddata = () => resolve(audio);
        audio.onerror = () => reject(new Error(`Failed to load audio: ${src}`));
    });
}

// Load sounds with promises
Promise.all([
    loadAudio('https://raw.githubusercontent.com/razvanpf/Images/main/backgroundmusic.wav').then(audio => {
        backgroundMusic = audio;
        backgroundMusic.volume = 0.5; // Set initial volume for background music
    }),
    loadAudio('https://raw.githubusercontent.com/razvanpf/Images/main/lasershot.wav').then(audio => {
        laserShotSound = audio;
        laserShotSound.volume = 0.2; // Set initial volume for laser shots
    }),
    loadAudio('https://raw.githubusercontent.com/razvanpf/Images/main/smallblast.wav').then(audio => {
        explosionSound = audio;
        explosionSound.volume = 1; // Set initial volume for explosions
    }),
    loadAudio('https://raw.githubusercontent.com/razvanpf/Images/main/powerup.wav').then(audio => {
        powerUpSound = audio;
        powerUpSound.volume = 0.5; // Set initial volume for power-up sounds
    }),
]).then(() => {
    console.log("All sounds loaded. Game ready.");
    document.getElementById('start-game-btn').disabled = false; // Enable start game button if all assets are loaded
}).catch(err => {
    console.error('Error loading audio files:', err);
});

// Load images with promises
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            console.log(`Image loaded: ${src}`);
            resolve(img);
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            reject(new Error(`Failed to load image: ${src}`));
        };
    });
}


// Initialize images
let spaceshipImg, asteroidImg, magnetImg, bulletImg, bgImg;

function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Spaceship class
class Spaceship {
    constructor() {
        this.width = 60;  
        this.height = 60; 
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.speed = 7;
        this.dx = 0;
        this.dy = 0;
        this.visible = true;  // Visible property for blinking effect
        this.invincible = false;  // Invincible property to control collision
    }

    draw() {
        if (this.visible) {  // Only draw if visible
            ctx.drawImage(spaceshipImg, this.x, this.y, this.width, this.height);
            if (shieldActive) {
                ctx.drawImage(shieldImg, this.x - 10, this.y - 10, this.width + 20, this.height + 20);
            }
        }
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Boundary detection
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
    }
}
// CLASSES //

// Asteroid class 
class Asteroid {
    constructor(x, y, speedX, size, side = null) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.side = side; 

        // Speed X is 0 for top-down asteroids (horizontal speed)
        this.speedX = (side === null) ? 0 : speedX; 
        
        // Speed Y is for top-down asteroids (Vertical speed)
        this.speedY = (side === null) ? (Math.random() * 3 + 1) : 0;

        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 2; 
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.drawImage(asteroidImg, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        // Remove off-screen asteroids
        if (this.side === 'left' && this.x > canvas.width + this.size) {
            const index = asteroids.indexOf(this);
            if (index > -1) asteroids.splice(index, 1);
        } else if (this.side === 'right' && this.x < -this.size) {
            const index = asteroids.indexOf(this);
            if (index > -1) asteroids.splice(index, 1);
        } else if (this.side === null && this.y > canvas.height + this.size) {
            const index = asteroids.indexOf(this);
            if (index > -1) asteroids.splice(index, 1);
        }
    }
}

// Bullet class
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 20;
        this.speed = 10;
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y -= this.speed;
    }
}

// Power-up class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y - 50; // Spawn power ups above the screen with 50 on y axis
        this.size = 30;
        this.speed = 3;
        this.type = type;
        this.img = this.getImageForType(type);
    }

    getImageForType(type) {
        if (type === 'shield') {
            return shieldImg;
        } else if (type === 'clear-asteroids') {
            return asteroidExplosionImg;
        } else if (type === 'life') {
            return lifeImg;
        } else if (type === 'magnetize') { 
            return magnetImg;
        } else if (type === 'bullet') {
            return bulletImg;
        }
    }

    draw() {
        this.drawGlow(); // Draw glow effect first on power ups
        ctx.drawImage(this.img, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }

    drawGlow() {
        ctx.save();
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    
        // Outer edge of the ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 4;
        ctx.stroke();
    
        ctx.restore();
    }

    update() {
        this.y += this.speed * gameSpeedMultiplier;
    }
}


// Initialize the game
function init() {
    console.log("Initializing game...");
    
    // Clear existing intervals or animations
    cancelAnimationFrame(loop); // Cancel any previous game loop
    clearInterval(difficultyInterval); // Clear any difficulty intervals
    clearInterval(bulletFireRateTimer); // Clear bullet fire rate interval

    // Ensure "speedY" for top-down asteroids is reset
    asteroids.forEach(asteroid => {
        if (asteroid.side === null) {
            asteroid.speedY = Math.random() * 3 + 1;
        }
    });
    
    // Re-enable the mousemove event listener in the game initialization
    document.addEventListener('mousemove', handleMouseMove);

    // Reset key game variables on game initialize
    spaceship = new Spaceship(); // New spaceship
    asteroids = []; // resets asteroids array
    powerUps = []; // resets power ups array
    bullets = []; // resets bullets
    score = 0; // resets score
    document.getElementById('score').textContent = score; // Resets score display in UI
    gameOver = false; // Set game over to false
    paused = false; // Reset paused state
    gameRunning = true; // Ensure gameRunning is true
    shieldActive = false; // Resets shield bool
    gameSpeedMultiplier = 1; // Sets game speed multiplier back to default
    shieldCount = 0; // Resets shield count
    bulletPowerLevel = 0; // Resets bullet power up count
    bulletFireRate = 300; // Resets fire rate to default
    difficultyLevel = 1; // Resets difficulty level
    gameTime = 0; // Reset game time
    lastTime = 0; // Reset lastTime to prevent time carryover
    explosionParticles = []; // Resets explotion particle effects array
    pulseWaveActive = false; // Resets any existing pulse wave
    bgY = 0; // Reset background position

    // Hide the game over screen and update UI
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-over').style.display = 'none'; // Ensure it's hidden

    // Reset the final score element
    const finalScoreElement = document.getElementById('final-score');
    if (finalScoreElement) {
        finalScoreElement.textContent = ''; // Clear any previous score
    }

    updateLivesUI();
    updatePowerUpUI;
    resetPowerUpUI();
    gameRunning = true;
    document.body.style.cursor = 'none'; // Hide cursor on start

    // Ensure background music plays and loops
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5; // Set initial volume, can be adjusted in options
    backgroundMusic.play();

    console.log("Game initialized.");

    // Start the game loop
    loop(0); // Start the loop from a clean slate
}

// Game loop

function loop(time = 0) {
    if (!gameOver && gameRunning) {
        if (lastTime === 0) lastTime = time; // Reset lastTime if this is the first frame

        const deltaTime = time - lastTime;
        lastTime = time;

        // Adjust game time by subtracting the total paused time
        gameTime += deltaTime - totalPausedTime;
        totalPausedTime = 0; // Reset total paused time after adjusting game time

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update the magnetize timer based on real-time
        if (magnetizeActive) {
            magnetizeTime -= deltaTime; // Decrease by delta time

            if (magnetizeTime <= 0) {
                magnetizeActive = false;
                magnetizeTime = 0;
                updatePowerUpUI(); // UI is cleared when the timer reaches 0
            } else {
                updatePowerUpUI(); // Updates the UI to reflect the remaining magnetize time
            }
        }

        // Difficulty increase
        if (gameTime > 30000 && difficultyLevel === 1) { // After 30 seconds
            increaseDifficultyLevel2();
        } else if (gameTime > 60000 && difficultyLevel === 2) { // After 60 seconds
            increaseDifficultyLevel3();
        } else if (gameTime > 90000 && difficultyLevel === 3) { // After 90 seconds
            increaseDifficultyLevel4();
        } else if (gameTime > 120000 && difficultyLevel === 4) { // After 120 seconds
            increaseDifficultyLevel5();
        }

        // Move background
        bgY += 2 * deltaTime / 16.67 * gameSpeedMultiplier; // Adjust speed based on frame time
        if (bgY >= canvas.height) bgY = 0;

        // Draw background
        ctx.drawImage(bgImg, 0, bgY, canvas.width, canvas.height);
        ctx.drawImage(bgImg, 0, bgY - canvas.height, canvas.width, canvas.height);

        // Adjust asteroid spawn rate based on difficulty level
        let asteroidSpawnRate = 0.04 * (difficultyLevel >= 5 ? 2 : 1) * gameSpeedMultiplier; // Adjusted 0.04 to increase/decrease spawn rate of asteroids
        if (Math.random() < asteroidSpawnRate) {
            if (difficultyLevel >= 3 && Math.random() < 0.5) {
                addSideAsteroids(); // Spawns from sides only from difficulty level 3 and above
            } else {
                // Always spawn from the top
                const x = Math.random() * (canvas.width - 30) + 15;
                const speed = (Math.random() * 3 + 1) * deltaTime / 16.67 * gameSpeedMultiplier;
                const size = Math.random() * 50 + 30;
                asteroids.push(new Asteroid(x, -size, speed, size));
            }
        }

        // Adjust the power-up spawn rate based on magnetize effect
        let powerUpSpawnRate = 0.002 
        if (magnetizeActive) {
            powerUpSpawnRate *= 4;  // Increase spawn rate by 4x when magnetize is active
        }
        
        if (Math.random() < powerUpSpawnRate) {
            const x = Math.random() * (canvas.width - 30) + 15;
            const type = (() => {
                const rand = Math.random();
                if (rand < 0.3) return 'shield';
                if (rand < 0.5) return 'clear-asteroids';
                if (rand < 0.7) return 'magnetize';  // This used to be speed power up.
                if (rand < 0.9) return 'bullet';
                return 'life';
            })();
            powerUps.push(new PowerUp(x, -50, type));
        }

        // Update and draw asteroids
        asteroids.forEach((asteroid, index) => {
            asteroid.update();
            asteroid.draw();

            // Collision detection with asteroids
            if (
                !spaceship.invincible && // Only check collision if not iframes
                spaceship.x < asteroid.x + asteroid.size / 2 &&
                spaceship.x + spaceship.width > asteroid.x - asteroid.size / 2 &&
                spaceship.y < asteroid.y + asteroid.size / 2 &&
                spaceship.y + spaceship.height > asteroid.y - asteroid.size / 2
            ) {
                if (shieldCount > 0) {
                    explode(asteroid.x, asteroid.y, 'asteroids');
                    createParticleEffect(spaceship.x + spaceship.width / 2, spaceship.y + spaceship.height / 2, 'blue');
                    shieldCount--;
                    if (shieldCount === 0) {
                        shieldActive = false;
                    }
                    updatePowerUpUI();
                    asteroids.splice(index, 1);
                } else {
                    // Check if the player has more than one life
                    if (lives > 1) {
                        lives--;
                        updateLivesUI();
                        respawnShip(); // Respawning the ship
                        asteroids.splice(index, 1); // Destroy the asteroid that collided
                    } else {
                        explode(spaceship.x + spaceship.width / 2, spaceship.y + spaceship.height / 2, 'ship');
                        endGame();
                    }
                }
            }

            // Handle asteroid explosion into smaller pieces
            if (difficultyLevel >= 5 && asteroid.size > 60 && Math.random() < 0.005) {
                breakAsteroidsIntoSmallerPieces(asteroid, index);
            }

            // Asteroids are only removed when they are off-screen
            if (asteroid.y > canvas.height || asteroid.x < -100 || asteroid.x > canvas.width + 100) {
                asteroids.splice(index, 1);
                score++;
                document.getElementById('score').textContent = score;
            }
        });

        // Check and spawn asteroid field every minute
        if (difficultyLevel >= 5 && Math.floor(gameTime / 60000) > lastAsteroidFieldTime) {
            spawnAsteroidField();
            lastAsteroidFieldTime = Math.floor(gameTime / 60000);
        }

        // Update and draw bullets
        bullets.forEach((bullet, index) => {
            bullet.update();
            bullet.draw();

            // Check collision with asteroids
            asteroids.forEach((asteroid, asteroidIndex) => {
                if (
                    bullet.x < asteroid.x + asteroid.size / 2 &&
                    bullet.x + bullet.width > asteroid.x - asteroid.size / 2 &&
                    bullet.y < asteroid.y + asteroid.size / 2 &&
                    bullet.y + bullet.height > asteroid.y - asteroid.size / 2
                ) {
                    explode(asteroid.x, asteroid.y, 'asteroids', true);  // Pass true to indicate player action
                    asteroids.splice(asteroidIndex, 1);
                    bullets.splice(index, 1);
                    score++;
                    document.getElementById('score').textContent = score;
                }
            });

            // Remove off-screen bullets
            if (bullet.y < 0) {
                bullets.splice(index, 1);
            }
        });

        // Update and draw power-ups
        powerUps.forEach((powerUp, index) => {
            powerUp.update();
            if (magnetizeActive) {
                const dx = spaceship.x + spaceship.width / 2 - powerUp.x;
                const dy = spaceship.y + spaceship.height / 2 - powerUp.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const pullSpeed = 15;  // Value for stronger or weaker magnetize pull
            
                // Apply pull force
                powerUp.x += (dx / distance) * pullSpeed;
                powerUp.y += (dy / distance) * pullSpeed;
            }
            powerUp.draw();
        
            // Collision detection with power-ups
            if (
                spaceship.x < powerUp.x + powerUp.size &&
                spaceship.x + spaceship.width > powerUp.x &&
                spaceship.y < powerUp.y + powerUp.size &&
                spaceship.y + spaceship.height > powerUp.y
            ) {
                playSound(powerUpSound); // Play power-up sound
                if (powerUp.type === 'shield') {
                    if (shieldCount < 3) {
                        shieldCount++;
                        shieldActive = true;
                        createFloatingText(`Shield x${shieldCount}`, powerUp.x, powerUp.y);
                    } else {
                        score += 5;
                        createFloatingText('+5', powerUp.x, powerUp.y);
                        document.getElementById('score').textContent = score;
                    }
                    updatePowerUpUI();
                } else if (powerUp.type === 'clear-asteroids') {
                    // Start the pulse wave effect
                    startPulseWave();
                    createFloatingText('Pulse Wave', powerUp.x, powerUp.y);
                    setTimeout(() => {
                        asteroids = [] //Cleared by pulse wave.
                        powerUps = []; // Also clear all power-ups
                    }, 50);
                } else if (powerUp.type === 'life') {
                    if (lives < 3) {
                        lives++;
                        createFloatingText('Extra Life', powerUp.x, powerUp.y);
                        updateLivesUI();
                        console.log(lives)
                    } else {
                        score += 20;
                        createFloatingText('+20', powerUp.x, powerUp.y);
                        document.getElementById('score').textContent = score;
                    }
                } else if (powerUp.type === 'magnetize') {  
                    magnetizeActive = true;
                    magnetizeTime = 10000;  // Duration of magnetize effect in milliseconds
                    magnetizeEndTime = gameTime + magnetizeTime;
                    createFloatingText('10s Magnet', powerUp.x, powerUp.y);
                    updatePowerUpUI();  // Update UI to show the magnetize icon
                    
                    const magnetizeInterval = setInterval(() => {
                        magnetizeTime -= 100;
                        if (magnetizeTime <= 0) {
                            clearInterval(magnetizeInterval);
                            magnetizeActive = false;
                            updatePowerUpUI(); // Icon is removed when time is up
                        }
                    }, 100); // Update every 100ms
                } else if (powerUp.type === 'bullet') {
                    if (bulletPowerLevel < 5) {
                        bulletPowerLevel++;
                        if (bulletPowerLevel === 1) {
                            createFloatingText('Turrets x1', powerUp.x, powerUp.y);
                        } else if (bulletPowerLevel === 2) {
                            createFloatingText('+2 Turrets', powerUp.x, powerUp.y);
                        } else if (bulletPowerLevel === 3) {
                            createFloatingText('+3 Turrets', powerUp.x, powerUp.y);
                            bulletFireRate = 150;
                        } else if (bulletPowerLevel === 4) {
                            createFloatingText('Faster Shooting', powerUp.x, powerUp.y);
                            bulletFireRate = 75;
                        }
                    } else {
                        score += 5;
                        createFloatingText('+5', powerUp.x, powerUp.y);
                        document.getElementById('score').textContent = score;
                    }
                    updatePowerUpUI();
                }
                createParticleEffect(powerUp.x, powerUp.y, 'green');
                powerUps.splice(index, 1);
            }

            // Remove off-screen power-ups
            if (powerUp.y > canvas.height) {
                powerUps.splice(index, 1);
            }
        });

        // Update and draw explosion particles
        explosionParticles.forEach((particle, index) => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.size *= 0.95;
            particle.life--;

            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            if (particle.life <= 0) {
                explosionParticles.splice(index, 1);
            }
        });

        // Update spaceship
        spaceship.update();
        spaceship.draw();

        // Draw and update pulse wave if active
        if (pulseWaveActive) {
            updatePulseWave();
        }

        // Handle magnetize duration
        if (magnetizeActive) {
            magnetizeTime -= deltaTime;
            if (magnetizeTime <= 0) {
                magnetizeActive = false;
            }
        }

        document.getElementById('game-time').textContent = formatTime(gameTime);
        requestAnimationFrame(loop);
    }
}

// Create explosion effect
function explode(x, y, type, isPlayerAction = false) {
    if (type === 'ship') {
        playSound(explosionSound);
        ctx.drawImage(shipExplosionImg, x - 50, y - 50, 100, 100);
    } else if (type === 'asteroids') {
        playSound(explosionSound);
        ctx.drawImage(asteroidExplosionImg, x - 50, y - 50, 100, 100);
    }

    if (isPlayerAction && type === 'asteroids') {
        // Only create floating text for player actions (e.g: shooting)
        createFloatingText('+2', x, y);
    }

    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const size = Math.random() * 3 + 2;

        const explosion = {
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            size: size,
            life: 20,
            color: type === 'ship' ? 'orange' : 'red'
        };

        explosionParticles.push(explosion);
    }
}

// Create particle effect
function createParticleEffect(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        const size = Math.random() * 3 + 2;

        const particle = {
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            size: size,
            life: 20,
            color: color
        };

        explosionParticles.push(particle);
    }
}

// Floating bonus text
function createFloatingText(text, x, y) {
    console.log(`Creating floating text: "${text}" at (${x}, ${y})`);

    // Create a new div element
    const textElement = document.createElement('div');
    textElement.className = 'floating-text';
    textElement.textContent = text;

    // Position the div at the specified location
    textElement.style.left = `${x}px`;
    textElement.style.top = `${y}px`;

    // Append the div to the body or a container element
    document.body.appendChild(textElement);

    // Trigger the fade out and move up effect
    requestAnimationFrame(() => {
        textElement.style.transform = 'translateY(-50px)';
        textElement.style.opacity = '0';
    });

    // Remove the element after the animation is complete
    setTimeout(() => {
        textElement.remove();
        console.log('Text removed');
    }, 3000); // 3 seconds
}

// End the game
function endGame() {
    backgroundMusic.pause(); // Stop the background music
    backgroundMusic.currentTime = 0; // Reset to the beginning
    if (lives > 1) {
        lives--;
        updateLivesUI();
        respawnShip();
    } else {
        console.log("Game over. Final score:", score);
        addScoreToLeaderboard(score); // Add score to leaderboard on game over
        bulletPowerLevel = 0;
        gameOver = true;
        gameRunning = false;
        gamePaused = false; // gamePaused is false in case the player paused before dying
        document.getElementById('final-score').textContent = score;
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over').querySelector('h1').textContent = 'Destroyed!'; // Says "Destroyed" on game over
        document.getElementById('restart-btn').textContent = 'Restart'; // Button changed to "Restart" from "Resume"
        document.getElementById('game-over').style.display = 'block'; // Show the game over screen
        document.body.style.cursor = 'auto'; // Show cursor on game over
    }
}

// Respawn the ship after a hit
function respawnShip() {
    spaceship = new Spaceship(); // Reset spaceship
    shieldCount = 0; // Reset shield count
    bulletPowerLevel = 0; // Reset bullet power level
    bulletFireRate = 300; // Reset firing rate
    shieldActive = false;
    updatePowerUpUI(); // Update the UI to remove power-up icons

    spaceship.invincible = true; // Make the spaceship invincible

    let blinkInterval = setInterval(() => {
        spaceship.visible = !spaceship.visible; // Toggle visibility for blinking
    }, 50); // Blinking interval

    setTimeout(() => {
        clearInterval(blinkInterval); // Stop blinking after 3 seconds
        spaceship.visible = true; // Ensure spaceship is visible after blinking
        spaceship.invincible = false; // Remove invincibility after 3 seconds
        gameRunning = true;
    }, 3000); // 3 seconds of invincibility
}

// Pulse wave effect for clearing asteroids
function startPulseWave() {
    pulseWaveActive = true;
    pulseWaveRadius = 0;
}

// Update pulse wave during loop
function updatePulseWave() {
    if (pulseWaveActive) {
        pulseWaveRadius += 20; // Pulse wave speed

        // Draw the pulse wave
        ctx.beginPath();
        ctx.arc(spaceship.x + spaceship.width / 2, spaceship.y + spaceship.height / 2, pulseWaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';  // Semi-transparent white for the wave
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.closePath();

        // Check for collisions with asteroids
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            const dist = Math.sqrt(
                Math.pow(asteroid.x - (spaceship.x + spaceship.width / 2), 2) +
                Math.pow(asteroid.y - (spaceship.y + spaceship.height / 2), 2)
            );

            if (dist < pulseWaveRadius + asteroid.size / 2) {
                // Trigger explosion effect
                explode(asteroid.x, asteroid.y, 'asteroids', false);

                pulseWaveDestroyedCount++; // Increment the count

                // Ensure asteroid is removed only after explosion
                setTimeout(() => {
                    asteroids.splice(i, 1); // Remove the asteroid after the explosion is shown
                }, 100); // Delay time before clearing asteroid from screen
            }
        }

        // Stop the pulse wave once it has traveled beyond the screen
        if (pulseWaveRadius > canvas.width * 1.5) {
            pulseWaveActive = false;

            if (pulseWaveDestroyedCount > 0) {
                // Display the sum in the center of the screen
                const pulseScore = pulseWaveDestroyedCount * 2;
                createFloatingText(`+${pulseScore}`, canvas.width / 2, canvas.height / 2);

                // Add the score to the total score
                score += pulseScore;
                document.getElementById('score').textContent = score;

                // Reset the count after displaying
                pulseWaveDestroyedCount = 0;
            }
        }
    }
}

// Update the lives UI in the top left corner
function updateLivesUI() {
    const livesUI = document.getElementById('lives');
    livesUI.innerHTML = ''; // Clear existing lives

    for (let i = 0; i < lives; i++) {
        const lifeIcon = document.createElement('img');
        lifeIcon.src = spaceshipImg.src; // Use the spaceship image for lives
        lifeIcon.style.width = '40px';
        lifeIcon.style.height = '40px';
        lifeIcon.style.marginRight = '5px';
        livesUI.appendChild(lifeIcon);
    }
}

// Handle mouse movement to update spaceship position
function handleMouseMove(e) {
    if (spaceship) {  // Check if spaceship is initialized
        const rect = canvas.getBoundingClientRect();
        spaceship.x = e.clientX - rect.left - spaceship.width / 2;
        spaceship.y = e.clientY - rect.top - spaceship.height / 2;
    }
}

// Event listener for firing bullets
document.addEventListener('mousedown', (e) => {
    if (gameRunning && bulletPowerLevel > 0) {
        fireBullets();
        bulletFireRateTimer = setInterval(fireBullets, bulletFireRate);
    }
});

document.addEventListener('mouseup', (e) => {
    clearInterval(bulletFireRateTimer);
});

// Fire bullets based on the current power level
function fireBullets() {
    if (gameRunning && bulletPowerLevel > 0) {
        if (bulletPowerLevel >= 1) {
            bullets.push(new Bullet(spaceship.x + spaceship.width / 2 - 2.5, spaceship.y));
            playSound(laserShotSound);
        }
        if (bulletPowerLevel >= 2) {
            bullets.push(new Bullet(spaceship.x + spaceship.width / 2 - 20, spaceship.y));
            bullets.push(new Bullet(spaceship.x + spaceship.width / 2 + 15, spaceship.y));
        }
        if (bulletPowerLevel >= 3) {
            bullets.push(new Bullet(spaceship.x + spaceship.width / 2 - 35, spaceship.y));
            bullets.push(new Bullet(spaceship.x + spaceship.width / 2 + 30, spaceship.y));
        }
    }
}

// MAIN MENU BUTTONS //

// Start the game
document.getElementById('start-game-btn').addEventListener('click', () => {
    console.log("Start Game button clicked.");
    
    // Hide the main menu and show the game container
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-container').classList.remove('hidden');
    document.getElementById('game-container').style.display = 'block';

    gameOver = false;
    gamePaused = false;
    gameRunning = true; // gameRunning is true at start
    
    // Initialize the game
    init();
});

// Restart the game
document.getElementById('restart-btn').addEventListener('click', () => {
    if (gamePaused) {
        resumeGame();
    } else {
        console.log("Restart button clicked.");
        
        // Hide the game container and main menu temporarily
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('main-menu').style.display = 'none';
    
        // Simulate going back to the main menu and starting the game again
        setTimeout(() => {
            // Go back to the main menu
            document.getElementById('game-container').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
    
            // Start the game immediately
            document.getElementById('start-game-btn').click();
    
            // Show the game container again
            setTimeout(() => {
                document.getElementById('game-container').style.display = 'block';
            }, 50); // DELAY
        }, 50);  // Minimal delay to simulate the transition
    }
});

// Back to main menu
document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    console.log("Back to Main Menu button clicked.");
    
    // Ensure both containers are properly hidden
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('main-menu').style.display = 'block';
    
    // Reset game states
    gameRunning = false;
    gameOver = false;
    gamePaused = false;
    
    cancelAnimationFrame(loop); // Cancel the game loop
    clearInterval(difficultyInterval); // Stop difficulty interval when going back to main menu
    gameTime = 0; // Reset game time when returning to main menu
    lastTime = 0; // Reset lastTime to prevent time carryover
    document.body.style.cursor = 'auto'; // Show cursor on game over
});

// Ensure that all images are fully loaded before using them
Promise.all([
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/spaceship.png').then(img => spaceshipImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/asteroid.png').then(img => asteroidImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/powerup.png').then(img => powerUpImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/bullet.png').then(img => bulletImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/spacebackgroundpng.png').then(img => bgImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/shipexplosion.png').then(img => shipExplosionImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/asteroidexplosion.png').then(img => asteroidExplosionImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/shield.png').then(img => shieldImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/heart.png').then(img => lifeImg = img),
    loadImage('https://raw.githubusercontent.com/razvanpf/Images/main/magnetpng.png').then(img => magnetImg = img)
]).then(() => {
    // Ensure the game only starts after all images are loaded
    console.log("All images loaded. Game ready.");
    document.getElementById('start-game-btn').disabled = false; // Enable start game button if all images are loaded
}).catch(err => {
    console.error('Error loading images:', err);
});

// Adjust the canvas size so that it's centered
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas); // Adjust canvas size if the window is resized
resizeCanvas(); // Initial call to set up the canvas size correctly

// Power UP UI Changes:

function updatePowerUpUI() {
    const shieldInfo = document.getElementById('shield-info');
    const speedInfo = document.getElementById('speed-info');
    const bulletInfo = document.getElementById('bullet-info');

    // Update shield display
    if (shieldCount > 0) {
        shieldInfo.classList.remove('hidden');
        document.getElementById('shield-count').textContent = `x${shieldCount}`;
    } else {
        shieldInfo.classList.add('hidden');
        document.getElementById('shield-count').textContent = '';
    }

    // Update magnetize display (reusing the speed icon placeholder for now, will change later)
    if (magnetizeActive) {
        speedInfo.classList.remove('hidden');
        document.getElementById('speed-count').textContent = `${Math.ceil(magnetizeTime / 1000)}s`;
    } else {
        speedInfo.classList.add('hidden');
    }

    // Update bullet display
    if (bulletPowerLevel > 0) {
        bulletInfo.classList.remove('hidden');
        const bulletCountText = bulletPowerLevel < 5 ? `x${bulletPowerLevel}` : 'x5';
        document.getElementById('bullet-count').textContent = bulletCountText;
    } else {
        bulletInfo.classList.add('hidden');
        document.getElementById('bullet-count').textContent = '';
    }
}
    // Reset Power Up UI 
    function resetPowerUpUI() {
        const shieldInfo = document.getElementById('shield-info');
        const speedInfo = document.getElementById('speed-info');
        const bulletInfo = document.getElementById('bullet-info');

        // Hide all power-up UI elements
        shieldInfo.classList.add('hidden');
        speedInfo.classList.add('hidden');
        bulletInfo.classList.add('hidden');

        // Clear the content
        document.getElementById('shield-count').textContent = '';
        document.getElementById('speed-count').textContent = '';
        document.getElementById('bullet-count').textContent = '';
    }

// Show or hide the power-up container based on game state
function togglePowerUpUI(visible) {
    const powerUpContainer = document.getElementById('power-up-container');
    powerUpContainer.style.display = visible ? 'flex' : 'none';
}

// When the game starts, show the power-up UI border
document.getElementById('start-game-btn').addEventListener('click', () => {
    togglePowerUpUI(true);
    init();
});

// When the game ends, hide the power-up UI border
document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    togglePowerUpUI(false);
});


// DIFICULTY FUNCTIONS //
function increaseDifficultyLevel2() {
    difficultyLevel = 2;
    gameSpeedMultiplier *= 1.5;  // Increase the game speed multiplier
    bgY += 2 * gameSpeedMultiplier;
    asteroids.forEach(asteroid => asteroid.speed *= gameSpeedMultiplier); // Apply the multiplier
    console.log("Difficulty Level 2 Reached. Game Speed Multiplier:", gameSpeedMultiplier);
}

function increaseDifficultyLevel3() {
    difficultyLevel = 3;
    asteroids.forEach(asteroid => asteroid.speed *= gameSpeedMultiplier);
    addSideAsteroids();
    console.log("Difficulty Level 3 Reached. Game Speed Multiplier:", gameSpeedMultiplier);
}

function increaseDifficultyLevel4() {
    difficultyLevel = 4;
    bgY += 2 * gameSpeedMultiplier;
    asteroids.forEach(asteroid => asteroid.speed *= gameSpeedMultiplier); // Further increase speed
    console.log("Difficulty Level 4 Reached. Game Speed Multiplier:", gameSpeedMultiplier);
}

function increaseDifficultyLevel5() {
    difficultyLevel = 5;
    breakAsteroidsIntoSmallerPieces();
    console.log("Difficulty Level 5 Reached. Game Speed Multiplier:", gameSpeedMultiplier);
}
////////////////////

// Add side asteroids that travel horizontally
function addSideAsteroids() {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = (side === 'left') ? -50 : canvas.width + 50; // Spawning just outside the canvas
    const y = Math.random() * (canvas.height - 100) + 50; // Spawn within screen height

    const speedX = (side === 'left') ? 2 * gameSpeedMultiplier : -2 * gameSpeedMultiplier; // Moving right or left
    const size = Math.random() * 50 + 30; // Random size

    asteroids.push(new Asteroid(x, y, speedX, size, side));
}
// Exploding asteroid
function breakAsteroidsIntoSmallerPieces(asteroid, index) {
    if (asteroid && asteroid.size > 60 && Math.random() < 0.3) { // Higher chance to break large asteroids
        explode(asteroid.x, asteroid.y, 'asteroids', false);

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speedX = Math.cos(angle) * (Math.random() * 1.5 + 0.5); // Randomized horizontal speed
            const speedY = Math.sin(angle) * (Math.random() * 1.5 + 0.5); // Randomized vertical speed
            const size = asteroid.size / 3;
            const newX = asteroid.x + Math.cos(angle) * size;
            const newY = asteroid.y + Math.sin(angle) * size;

            // Smaller pieces can move in any direction (not limited to side or top-down)
            asteroids.push(new Asteroid(newX, newY, speedX, size, 'fragment'));
        }

        asteroids.splice(index, 1); // Remove the original large asteroid
    }
}

function spawnAsteroidField() {
    const fieldHeight = 100;
    for (let y = 0; y < fieldHeight; y += 50) { // Size
        for (let x = 0; x < canvas.width; x += 50) {
            const size = 50;
            const speed = 1; // Slow moving asteroid field
            asteroids.push(new Asteroid(x, y - size, speed, size));
        }
    }
}

// PAUSE MENU //

//Pause Game 
function pauseGame() {
    if (!gameOver && gameRunning && !gamePaused) {
        gamePaused = true;
        gameRunning = false;

        // Record when the game was paused
        pauseStartTime = performance.now();

        // Show the pause menu
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('game-over').querySelector('h1').textContent = 'Paused';
        document.getElementById('restart-btn').textContent = 'Resume';

        // Update the score display in the pause menu
        const finalScoreElement = document.getElementById('final-score');
        if (finalScoreElement) {
            finalScoreElement.textContent = score; // Show the current score
        }

        // Show the cursor
        document.body.style.cursor = 'auto';

        // Ensure main menu is hidden during pause
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('main-menu').style.display = 'none';

        // Remove mousemove event listener to stop tracking the mouse
        document.removeEventListener('mousemove', handleMouseMove);
    }
}

function resumeGame() {
    if (gamePaused) {
        backgroundMusic.play(); // Resume background music
        gamePaused = false;
        gameRunning = true;

        // Add the paused time to the totalPausedTime
        totalPausedTime += performance.now() - pauseStartTime;

        // Hide the pause menu
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('game-over').style.display = 'none';

        // Ensure main menu stays hidden during resume
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('main-menu').style.display = 'none';

        // Hide the cursor again
        document.body.style.cursor = 'none';

        // Re-add the mousemove event listener after a slight delay
        setTimeout(() => {
            document.addEventListener('mousemove', handleMouseMove);
        }, 100);  // Adjust this delay if needed

        // Resume the game loop without any adjustments to lastTime
        requestAnimationFrame(loop);
    }
}

// Event listener for the ESC key to toggle pause
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (gamePaused) {
            resumeGame();
        } else if (gameRunning && !gameOver) {
            pauseGame();
        }
    }
});


// Ensure popup is hidden initially
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('options-popup').classList.add('hidden');
});

// Toggle Options Popup
document.getElementById('options-btn').addEventListener('click', function () {
    document.getElementById('options-popup').classList.remove('hidden');
});

document.getElementById('close-popup-btn').addEventListener('click', function () {
    document.getElementById('options-popup').classList.add('hidden');
});

// Event listener for the leaderboard button
document.getElementById('leaderboards-btn').addEventListener('click', function() {
    showLeaderboard();
});

// SOUNDS //

// Toggle sound ON/OFF
document.getElementById('sound-toggle').addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    
    // Update button text
    const soundToggleButton = document.getElementById('sound-toggle');
    soundToggleButton.textContent = soundEnabled ? 'ON' : 'OFF';
    
    // Mute/Unmute background music and FX sounds
    backgroundMusic.muted = !soundEnabled;
    laserShotSound.muted = !soundEnabled;
    explosionSound.muted = !soundEnabled;
    powerUpSound.muted = !soundEnabled;

    // Stop or resume background music based on the toggle
    if (!soundEnabled) {
        backgroundMusic.pause();
    } else {
        backgroundMusic.play();
    }
});

// Adjust background music volume
document.getElementById('bg-music-slider').addEventListener('input', (e) => {
    backgroundMusicVolume = e.target.value / 100;
    backgroundMusic.volume = backgroundMusicVolume;
});

// Adjust FX sound volume
document.getElementById('fx-music-slider').addEventListener('input', (e) => {
    fxVolume = e.target.value / 100;
    laserShotSound.volume = fxVolume;
    explosionSound.volume = fxVolume;
    powerUpSound.volume = fxVolume;
});

// Play or mute sounds based on options
function playSound(sound) {
    if (soundEnabled) {  // Only play sound if sound is enabled
        sound.pause();   // Pause the sound if it's already playing
        sound.currentTime = 0; // Reset the sound to the start
        sound.play();    // Play the sound again
    }
}

// LEADERBOARDS //

// Retrieve leaderboard data from local storage
function getLeaderboard() {
    const leaderboard = localStorage.getItem('leaderboard');
    return leaderboard ? JSON.parse(leaderboard) : [];
}

// Save leaderboard data to local storage
function saveLeaderboard(leaderboard) {
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Add a new score to the leaderboard
function addScoreToLeaderboard(score) {
    const leaderboard = getLeaderboard();

    // Create a new entry with date/time and score
    const now = new Date();
    const newEntry = {
        date: now.toLocaleDateString('en-GB'),
        time: formatTime(gameTime),
        score: score
    };

    // Add the new entry to the top of the leaderboard
    leaderboard.unshift(newEntry);

    // Keep only the last 10 entries
    if (leaderboard.length > 10) {
        leaderboard.pop();
    }

    // Save the updated leaderboard to local storage
    saveLeaderboard(leaderboard);
}

// Populate the leaderboard popup with entries
function populateLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardEntries = document.getElementById('leaderboard-entries');
    leaderboardEntries.innerHTML = '';

    if (leaderboard.length === 0) {
        leaderboardEntries.innerHTML = '<p>No entries yet.</p>';
    } else {
        leaderboard.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            entryDiv.innerHTML = `
                <span>${entry.date}</span>
                <span>${entry.time}</span>
                <span>${entry.score}</span>
            `;
            leaderboardEntries.appendChild(entryDiv);
        });
    }
}

// Show the leaderboard popup
function showLeaderboard() {
    populateLeaderboard();
    document.getElementById('leaderboard-popup').classList.remove('hidden');
}

// Hide the leaderboard popup
function hideLeaderboard() {
    document.getElementById('leaderboard-popup').classList.add('hidden');
}

// Event listener for the close button in the leaderboard popup
document.getElementById('close-leaderboard-btn').addEventListener('click', function() {
    hideLeaderboard();
});

// Show the clear leaderboard confirmation popup
document.getElementById('clear-leaderboard-btn').addEventListener('click', function () {
    document.getElementById('clear-leaderboard-popup').classList.remove('hidden');
});

// Confirm clearing the leaderboard
document.getElementById('confirm-clear-btn').addEventListener('click', function () {
    // Clear leaderboard data from localStorage
    localStorage.removeItem('leaderboard');

    // Clear the leaderboard entries from the UI
    document.getElementById('leaderboard-entries').innerHTML = '';

    // Hide the confirmation popup
    document.getElementById('clear-leaderboard-popup').classList.add('hidden');

    // Show the notification
    showNotification('Leaderboards Cleared');
});

// Cancel clearing the leaderboard
document.getElementById('cancel-clear-btn').addEventListener('click', function () {
    // Just hide the confirmation popup
    document.getElementById('clear-leaderboard-popup').classList.add('hidden');
});

// Notification with custom style and animation
function showNotification(message, color = "rgba(42, 42, 42, 0.9)") {
    const notification = document.createElement('div');
    notification.textContent = message.toUpperCase(); 
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.backgroundColor = color;
    notification.style.color = 'white';
    notification.style.paddingLeft = '50px';
    notification.style.paddingRight = '50px';
    notification.style.paddingTop = '10px';
    notification.style.paddingBottom = '10px';
    notification.style.border = '1px solid blue'; 
    notification.style.borderRadius = '5px'; 
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.8)';
    notification.style.opacity = '0'; // Start with opacity 0 for animation
    notification.style.transition = 'opacity 0.5s ease, transform 0.5s ease'; // Smooth slide-in/out animation
    document.body.appendChild(notification);
    
    // Trigger the animation (slide in)
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translate(-50%, -45%)'; // Slightly move up when appearing
    }, 10); // Small delay to ensure the transition applies

    // Slide out and remove the notification after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -55%)'; // Move down when disappearing
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500); // Wait for the animation to finish before removing
    }, 2000); // Duration before starting to hide
}