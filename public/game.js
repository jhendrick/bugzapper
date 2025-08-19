class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'menu'; // menu, playing, paused, gameOver
        
        // Game objects
        this.ship = null;
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.keys = {};
        
        // Player statistics tracking
        this.bulletsFired = 0;
        this.asteroidsDestroyed = 0;
        this.gameStartTime = 0;
        this.timePlayed = 0;
        this.lastGameStats = null; // Store the last game's stats for current player
        
        // Image assets
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = 1; // bug image
        
        // Timing
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadImages();
        this.loadScoreboard();
        this.resetGame();
        this.updateStatsButtonState();
    }
    
    loadImages() {
        // Load bug image
        this.images.bug = new Image();
        this.images.bug.onload = () => {
            this.imagesLoaded++;
            console.log('Bug image loaded successfully');
        };
        this.images.bug.onerror = () => {
            console.warn('Failed to load bug image');
            this.imagesLoaded++;
        };
        this.images.bug.src = 'images/bug.png';
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'KeyP' && this.state === 'playing') {
                this.togglePause();
            }
            if (e.code === 'KeyP' && this.state === 'paused') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Button events
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('submit-score').addEventListener('click', () => {
            this.submitScore();
        });
        
        document.getElementById('play-again').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('clear-button').addEventListener('click', () => {
            this.clearScores();
        });
        
        document.getElementById('player-stats-button').addEventListener('click', () => {
            if (this.lastGameStats) {
                this.showPlayerStats();
            } else {
                alert('No game statistics available yet. Play a game first!');
            }
        });
        
        document.getElementById('view-past-stats-button').addEventListener('click', () => {
            this.showPastGameStats();
        });
        
        // Enter key for name input
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitScore();
            }
        });
    }
    
    resetGame() {
        this.score = 0;
        this.lives = 1;
        this.level = 1;
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        
        // Reset statistics
        this.bulletsFired = 0;
        this.asteroidsDestroyed = 0;
        this.gameStartTime = 0;
        this.timePlayed = 0;
        
        // Create ship
        this.ship = new Ship(this.canvas.width / 2, this.canvas.height / 2);
        
        // Create initial asteroids
        this.createAsteroids(4 + this.level);
        
        this.updateUI();
    }
    
    startGame() {
        document.getElementById('scoreboard-section').style.display = 'none';
        document.getElementById('game-section').style.display = 'block';
        document.getElementById('game-over-section').style.display = 'none';
        
        this.resetGame();
        this.state = 'playing';
        this.gameStartTime = Date.now();
        requestAnimationFrame(this.gameLoop);
    }
    
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-overlay').style.display = 'flex';
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-overlay').style.display = 'none';
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    gameLoop(currentTime) {
        if (this.state !== 'playing') return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // Handle input
        this.handleInput();
        
        // Update game objects
        this.ship.update(deltaTime, this.canvas.width, this.canvas.height);
        
        this.bullets.forEach(bullet => bullet.update(deltaTime, this.canvas.width, this.canvas.height));
        this.bullets = this.bullets.filter(bullet => bullet.active);
        
        this.asteroids.forEach(asteroid => asteroid.update(deltaTime, this.canvas.width, this.canvas.height));
        
        this.particles.forEach(particle => particle.update(deltaTime));
        this.particles = this.particles.filter(particle => particle.active);
        
        // Check collisions
        this.checkCollisions();
        
        // Check if all asteroids destroyed
        if (this.asteroids.length === 0) {
            this.level++;
            this.createAsteroids(4 + this.level);
        }
    }
    
    handleInput() {
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.ship.thrust();
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.ship.rotate(-1);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.ship.rotate(1);
        }
        if (this.keys['Space']) {
            const bullet = this.ship.shoot();
            if (bullet) {
                this.bullets.push(bullet);
                this.bulletsFired++;
            }
        }
    }
    
    checkCollisions() {
        // Bullet-asteroid collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                if (this.bullets[i] && this.asteroids[j] && 
                    this.checkCircleCollision(this.bullets[i], this.asteroids[j])) {
                    
                    const asteroid = this.asteroids[j];
                    const bullet = this.bullets[i];
                    
                    // Add score
                    this.score += asteroid.size === 'large' ? 20 : asteroid.size === 'medium' ? 50 : 100;
                    this.asteroidsDestroyed++;
                    this.updateUI();
                    
                    // Create explosion particles
                    this.createExplosion(asteroid.x, asteroid.y, asteroid.size);
                    
                    // Split asteroid if large or medium
                    if (asteroid.size === 'large') {
                        this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, 'medium', this.level));
                        this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, 'medium', this.level));
                    } else if (asteroid.size === 'medium') {
                        this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, 'small', this.level));
                        this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, 'small', this.level));
                    }
                    
                    // Remove bullet and asteroid
                    this.bullets.splice(i, 1);
                    this.asteroids.splice(j, 1);
                    break;
                }
            }
        }
        
        // Ship-asteroid collisions
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            if (this.checkCircleCollision(this.ship, this.asteroids[i])) {
                this.lives--;
                this.updateUI();
                
                // Create explosion
                this.createExplosion(this.ship.x, this.ship.y, 'large');
                
                // Reset ship position
                this.ship.reset(this.canvas.width / 2, this.canvas.height / 2);
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                break;
            }
        }
    }
    
    checkCircleCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.radius + obj2.radius);
    }
    
    createAsteroids(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
            } while (Math.abs(x - this.ship.x) < 100 || Math.abs(y - this.ship.y) < 100);
            
            this.asteroids.push(new Asteroid(x, y, 'large', this.level));
        }
    }
    
    createExplosion(x, y, size) {
        const particleCount = size === 'large' ? 15 : size === 'medium' ? 10 : 5;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(x, y));
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(10, 10, 26, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render stars background
        this.renderStars();
        
        // Render game objects
        this.ship.render(this.ctx);
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        this.asteroids.forEach(asteroid => asteroid.render(this.ctx));
        this.particles.forEach(particle => particle.render(this.ctx));
    }
    
    renderStars() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 73) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    
    updateUI() {
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    gameOver() {
        this.state = 'gameOver';
        this.timePlayed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-section').style.display = 'flex';
        document.getElementById('player-name').focus();
    }
    
    async submitScore() {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }
        
        try {
            // Submit score
            const scoreResponse = await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName,
                    score: this.score
                })
            });
            
            // Submit player statistics
            const statsResponse = await fetch('/api/playerStats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    playerName,
                    bulletsFired: this.bulletsFired,
                    asteroidsDestroyed: this.asteroidsDestroyed,
                    levelReached: this.level,
                    timePlayed: this.timePlayed,
                    score: this.score
                })
            });
            
            if (scoreResponse.ok && statsResponse.ok) {
                // Store the current player's stats locally
                this.lastGameStats = {
                    playerName,
                    bulletsFired: this.bulletsFired,
                    asteroidsDestroyed: this.asteroidsDestroyed,
                    levelReached: this.level,
                    timePlayed: this.timePlayed,
                    score: this.score,
                    timestamp: new Date().toISOString()
                };
                this.loadScoreboard();
                this.backToMenu();
            }
        } catch (error) {
            console.error('Error submitting score and statistics:', error);
        }
    }
    
    async loadScoreboard() {
        try {
            const response = await fetch('/api/scores');
            const scores = await response.json();
            
            const scoreboard = document.getElementById('scoreboard');
            if (scores.length === 0) {
                scoreboard.innerHTML = '<div class="loading">No scores yet. Be the first!</div>';
            } else {
                scoreboard.innerHTML = scores.map((score, index) => `
                    <div class="score-entry">
                        <span class="score-rank">${index + 1}</span>
                        <span class="score-name">${score.playerName}</span>
                        <span class="score-value">${score.score}</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading scoreboard:', error);
            document.getElementById('scoreboard').innerHTML = '<div class="loading">Error loading scores</div>';
        }
    }
    
    async clearScores() {
        if (confirm('Are you sure you want to clear all scores? This action cannot be undone.')) {
            try {
                const response = await fetch('/api/clearScores', {
                    method: 'GET'
                });
                
                if (response.ok) {
                    const result = await response.json();
                    alert(result.message);
                    this.loadScoreboard(); // Reload the scoreboard to show it's empty
                } else {
                    alert('Failed to clear scores');
                }
            } catch (error) {
                console.error('Error clearing scores:', error);
                alert('Error clearing scores. Please try again.');
            }
        }
    }
    
    loadPlayerStats() {
        const statsContainer = document.getElementById('player-stats');
        
        if (!this.lastGameStats) {
            statsContainer.innerHTML = '<div class="loading">No game statistics available yet. Play a game first!</div>';
            return;
        }
        
        const stat = this.lastGameStats;
        statsContainer.innerHTML = `
            <div class="stats-entry">
                <div class="stats-header">
                    <span class="stats-name">${stat.playerName}</span>
                    <span class="stats-date">${new Date(stat.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="stats-details">
                    <div class="stat-item">
                        <span class="stat-label">Score:</span>
                        <span class="stat-value">${stat.score || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Bullets Fired:</span>
                        <span class="stat-value">${stat.bulletsFired}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Asteroids Destroyed:</span>
                        <span class="stat-value">${stat.asteroidsDestroyed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Level Reached:</span>
                        <span class="stat-value">${stat.levelReached}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Time Played:</span>
                        <span class="stat-value">${stat.timePlayed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Accuracy:</span>
                        <span class="stat-value">${stat.asteroidsDestroyed > 0 ? Math.round((stat.asteroidsDestroyed / stat.bulletsFired) * 100) : 0}%</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    showPlayerStats() {
        document.getElementById('scoreboard-section').style.display = 'none';
        document.getElementById('player-stats-section').style.display = 'block';
        this.loadPlayerStats();
    }
    
    async showPastGameStats() {
        document.getElementById('scoreboard-section').style.display = 'none';
        document.getElementById('player-stats-section').style.display = 'block';
        await this.loadPastGameStats();
    }
    
    async loadPastGameStats() {
        const statsContainer = document.getElementById('player-stats');
        statsContainer.innerHTML = '<div class="loading">Loading past game statistics...</div>';
        
        try {
            const response = await fetch('/api/playerStats');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const stats = await response.json();
            
            if (!stats || stats.length === 0) {
                statsContainer.innerHTML = '<div class="loading">No past game statistics available yet. Play some games first!</div>';
                return;
            }
            
            let statsHTML = '<div class="past-stats-title">Past 10 Game Statistics</div>';
            
            stats.forEach((stat, index) => {
                //const accuracy = stat.bulletsFired > 0 ? Math.round((stat.asteroidsDestroyed / stat.bulletsFired) * 100) : 0;
                const timeFormatted = `${Math.floor(stat.timePlayed / 60)}:${(stat.timePlayed % 60).toString().padStart(2, '0')}`;
                
                statsHTML += `
                    <div class="stats-entry ${index === 0 ? 'most-recent' : ''}">
                        <div class="stats-header">
                            <span class="stats-name">${stat.playerName}</span>
                            <span class="stats-date">${new Date(stat.timestamp).toLocaleDateString()}</span>
                            ${index === 0 ? '<span class="most-recent-badge">Most Recent</span>' : ''}
                        </div>
                        <div class="stats-details">
                            <div class="stat-item">
                                <span class="stat-label">Score:</span>
                                <span class="stat-value">${stat.score || 0}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Bullets Fired:</span>
                                <span class="stat-value">${stat.bulletsFired}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Asteroids Destroyed:</span>
                                <span class="stat-value">${stat.asteroidsDestroyed}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Level Reached:</span>
                                <span class="stat-value">${stat.levelReached}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Time Played:</span>
                                <span class="stat-value">${timeFormatted}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Accuracy:</span>
                                <span class="stat-value">${stat.accuracy}%</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            statsContainer.innerHTML = statsHTML;
            
        } catch (error) {
            console.error('Error loading past game stats:', error);
            statsContainer.innerHTML = '<div class="loading">Error loading past game statistics. Please try again.</div>';
        }
    }
    
    backToMenu() {
        this.state = 'menu';
        document.getElementById('scoreboard-section').style.display = 'block';
        document.getElementById('game-section').style.display = 'none';
        document.getElementById('game-over-section').style.display = 'none';
        document.getElementById('player-stats-section').style.display = 'none';
        document.getElementById('pause-overlay').style.display = 'none';
        document.getElementById('player-name').value = '';
        this.updateStatsButtonState();
    }
    
    updateStatsButtonState() {
        const statsButton = document.getElementById('player-stats-button');
        if (this.lastGameStats) {
            statsButton.classList.remove('disabled');
        } else {
            statsButton.classList.add('disabled');
        }
    }
}

class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 10;
        this.thrustPower = 200;
        this.rotationSpeed = 5;
        this.friction = 0.99;
        this.maxSpeed = 300;
        this.lastShot = 0;
        this.shotCooldown = 200; // milliseconds
    }
    
    update(deltaTime, canvasWidth, canvasHeight) {
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Wrap around screen
        if (this.x < 0) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = 0;
        if (this.y < 0) this.y = canvasHeight;
        if (this.y > canvasHeight) this.y = 0;
    }
    
    thrust() {
        const thrustX = Math.cos(this.angle) * this.thrustPower;
        const thrustY = Math.sin(this.angle) * this.thrustPower;
        this.vx += thrustX * 0.016; // Approximate deltaTime
        this.vy += thrustY * 0.016;
    }
    
    rotate(direction) {
        this.angle += direction * this.rotationSpeed * 0.016;
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.shotCooldown) {
            this.lastShot = now;
            return new Bullet(this.x, this.y, this.angle);
        }
        return null;
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Ship body
        ctx.strokeStyle = '#4ecdc4';
        ctx.fillStyle = '#4ecdc4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        // Engine glow when thrusting
        if (game.keys['ArrowUp'] || game.keys['KeyW']) {
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.moveTo(-10, -3);
            ctx.lineTo(-18, 0);
            ctx.lineTo(-10, 3);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Asteroid {
    constructor(x, y, size, level = 1) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.level = level;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
        
        // Increase speed based on level - starts at 50-150, increases by 20 per level
        const baseSpeed = 50 + Math.random() * 100;
        const levelMultiplier = 1 + (level - 1) * 0.3; // 30% speed increase per level
        const speed = baseSpeed * levelMultiplier;
        
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;
        
        // Set radius based on size
        switch (size) {
            case 'large':
                this.radius = 40;
                this.scale = 1.0;
                break;
            case 'medium':
                this.radius = 25;
                this.scale = 0.6;
                break;
            case 'small':
                this.radius = 15;
                this.scale = 0.4;
                break;
        }
        
        // Image properties
        this.image = null;
        this.imageLoaded = false;
        this.loadImage();
        
        // Fallback to geometric shape if image fails to load
        this.useFallback = false;
        this.points = [];
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const variance = 0.3 + Math.random() * 0.4;
            this.points.push({
                x: Math.cos(angle) * this.radius * variance,
                y: Math.sin(angle) * this.radius * variance
            });
        }
    }
    
    loadImage() {
        // Try to get the preloaded image from the game instance
        if (window.game && window.game.images && window.game.images.bug) {
            this.image = window.game.images.bug;
            this.imageLoaded = true;
        } else {
            // Fallback: load image directly
            this.image = new Image();
            this.image.onload = () => {
                this.imageLoaded = true;
            };
            this.image.onerror = () => {
                console.warn('Failed to load bug image, using fallback shape');
                this.useFallback = true;
            };
            this.image.src = 'images/bug.png';
        }
    }
    
    update(deltaTime, canvasWidth, canvasHeight) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.angle += this.rotationSpeed * deltaTime;
        
        // Wrap around screen
        if (this.x < -this.radius) this.x = canvasWidth + this.radius;
        if (this.x > canvasWidth + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvasHeight + this.radius;
        if (this.y > canvasHeight + this.radius) this.y = -this.radius;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Try to render image if loaded
        if (this.imageLoaded && this.image && !this.useFallback) {
            const scaledWidth = this.image.width * this.scale;
            const scaledHeight = this.image.height * this.scale;
            
            ctx.drawImage(
                this.image,
                -scaledWidth / 2,  // Center the image
                -scaledHeight / 2,
                scaledWidth,
                scaledHeight
            );
        } else {
            // Fallback to geometric shape
            ctx.strokeStyle = '#8e44ad';
            ctx.fillStyle = 'rgba(142, 68, 173, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 400;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.radius = 2;
        this.active = true;
        this.life = 2; // seconds
    }
    
    update(deltaTime, canvasWidth, canvasHeight) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        
        // Remove if off screen or expired
        if (this.x < 0 || this.x > canvasWidth ||
            this.y < 0 || this.y > canvasHeight ||
            this.life <= 0) {
            this.active = false;
        }
    }
    
    render(ctx) {
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = (Math.random() - 0.5) * 200;
        this.life = 0.5 + Math.random() * 0.5;
        this.maxLife = this.life;
        this.active = true;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(255, 107, 107, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Start the game
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    window.game = game; // Make game globally accessible for image sharing
});