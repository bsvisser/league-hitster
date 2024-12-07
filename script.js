let champions = [];
let lives = 3;
let timeline = [];
let score = 0;

// Enhanced game initialization
function initializeGame() {
    // Add a score display
    const gameContainer = document.getElementById("game-container");
    const scoreDisplay = document.createElement('div');
    scoreDisplay.id = 'score';
    scoreDisplay.textContent = `Score: ${score}`;
    gameContainer.insertBefore(scoreDisplay, gameContainer.firstChild);

    // Add lives display
    const livesDisplay = document.createElement('div');
    livesDisplay.id = 'lives';
    livesDisplay.textContent = `Lives: ${lives}\n`;
    gameContainer.insertBefore(livesDisplay, scoreDisplay.nextSibling);
}

// Fetch champion data
fetch('champions.json')
    .then(response => response.json())
    .then(data => {
        champions = shuffleArray(data);
        initializeGame();
        startGame();
    })
    .catch(error => {
        console.error('Error loading champions:', error);
        alert('Failed to load game data. Please refresh the page.');
    });

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startGame() {
    // Reset game state
    timeline = [];
    lives = 3;
    score = 0;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    document.getElementById('score').textContent = `Score: ${score}`;

    // Add first champion to timeline
    const firstChampion = champions.pop();
    timeline.push(firstChampion);
    renderTimeline();
    nextRound();
}

function nextRound() {
    if (lives <= 0) {
        gameOver();
        return;
    }

    if (champions.length === 0) {
        winGame();
        return;
    }

    const currentChampion = champions.pop();

    // Preload the next champion image and call the callback when ready
    preloadImage(currentChampion.image.replace("42px", "86px"), (preloadedImg) => {
        const draggableChampionDiv = document.getElementById("draggable-champion");
        setupDragEvents(currentChampion);

        // Create a new card if none exists
        if (!draggableChampionDiv) {
            const newDraggableCard = document.createElement('div');
            newDraggableCard.id = "draggable-champion";
            newDraggableCard.classList.add("card", "active");
            document.getElementById("game-container").appendChild(newDraggableCard);
        }

        const activeCard = document.getElementById("draggable-champion");

        // Use the preloaded image instead of loading it again
        activeCard.innerHTML = `
            <img src="${preloadedImg.src}" alt="${currentChampion.name}" class="card-image">
            <p>${currentChampion.name}</p>
        `;

        // Set data attributes
        activeCard.dataset.releaseDate = currentChampion.releaseDate;
        activeCard.dataset.name = currentChampion.name;

        // Add the 'active' class to highlight the card (purple color)
        activeCard.classList.add("active");
    });
}

function preloadImage(imageUrl, callback) {
    const img = new Image();  // Create a new Image object
    img.src = imageUrl;       // Set the source to start loading the image
    img.style.display = 'none'; // Make the image invisible (not shown)
    
    img.onload = () => {
        callback(img);  // Execute the callback once the image has loaded
    };

    // Append to the document to trigger loading
    document.body.appendChild(img);
}

function renderTimeline() {
    const timelineDiv = document.getElementById("timeline");
    timelineDiv.innerHTML = timeline
        .map((champ, index) => {
            const isPlaced = index < timeline.length;
            return `
                <div class="card droppable ${isPlaced ? 'placed' : ''}" data-release-date="${champ.releaseDate}" data-index="${index}">
                    <img src="${champ.image}" alt="${champ.name}" class="card-image">
                    <p>${champ.name}</p>
                    <p class="release-date">${formatDate(champ.releaseDate)}</p>
                </div>
            `;
        })
        .join('');
    
    // Add invisible drop zones between the cards
    for (let i = 0; i <= timeline.length; i++) {
        const dropZone = document.createElement('div');
        dropZone.classList.add('drop-between');
        dropZone.dataset.index = i;
        timelineDiv.insertBefore(dropZone, timelineDiv.children[i * 2]);
    }

    setupDropZones();
}

function setupDragEvents(currentChampion) {
    const draggable = document.getElementById("draggable-champion");

    draggable.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify(currentChampion));
        draggable.classList.remove("active");
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    // Function to get the ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (n) => {
        const suffixes = ["th", "st", "nd", "rd"];
        const remainder = n % 100;
        return suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0];
    };

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
}

function setupDropZones() {
    const dropZones = document.querySelectorAll(".drop-between");

    dropZones.forEach(zone => {
        zone.addEventListener("dragover", (event) => {
            event.preventDefault();
            zone.classList.add("drag-over");
        });

        zone.addEventListener("dragleave", () => {
            zone.classList.remove("drag-over");
        });

        zone.addEventListener("drop", (event) => {
            event.preventDefault();
            zone.classList.remove("drag-over");

            const draggedData = JSON.parse(event.dataTransfer.getData("text/plain"));
            const index = parseInt(zone.dataset.index, 10);

            const correctPlacement = checkPlacement(draggedData, index);

            // Select the draggable champion div
            const draggableChampionDiv = document.getElementById("draggable-champion");

            // Add correct or incorrect class based on placement
            if (correctPlacement) {
                draggableChampionDiv.classList.add("correct");
                draggableChampionDiv.classList.remove("incorrect");

                score += 10; // Increment score for correct placement
                document.getElementById('score').textContent = `Score: ${score}`;

                addChampionToTimeline(draggedData, index);
                renderTimeline();
                nextRound();
            } else {
                draggableChampionDiv.classList.add("incorrect");
                draggableChampionDiv.classList.remove("correct");

                lives--;
                document.getElementById("lives").textContent = `Lives: ${lives}`;

                if (lives <= 0) {
                    gameOver();
                } else {
                    nextRound(); // Give a new champion to place after losing a life
                }
            }
        });
    });
}

function checkPlacement(draggedChampion, index) {
    const draggedDate = new Date(draggedChampion.releaseDate);

    const beforeDate = index > 0 ? new Date(timeline[index - 1].releaseDate) : null;
    const afterDate = index < timeline.length ? new Date(timeline[index].releaseDate) : null;

    if (beforeDate && afterDate) {
        return draggedDate > beforeDate && draggedDate < afterDate;
    } else if (beforeDate) {
        return draggedDate > beforeDate;
    } else if (afterDate) {
        return draggedDate < afterDate;
    }

    return true; // First placement is always correct
}

function addChampionToTimeline(champion, index) {
    timeline.splice(index, 0, champion);
}

function gameOver() {
    const finalScore = score;
    alert(`Game Over! Your final score is ${finalScore}`);
    
    // Optional: Implement high score tracking
    const highScore = localStorage.getItem('leagueHitsterHighScore') || 0;
    if (finalScore > highScore) {
        localStorage.setItem('leagueHitsterHighScore', finalScore);
        alert(`New High Score: ${finalScore}!`);
    }
    
    // Restart the game
    champions = shuffleArray(champions.concat(timeline));
    startGame();
}

function winGame() {
    const finalScore = score;
    alert(`Congratulations! You placed all champions correctly. Your final score is ${finalScore}`);
    
    // Optional: Implement high score tracking
    const highScore = localStorage.getItem('leagueHitsterHighScore') || 0;
    if (finalScore > highScore) {
        localStorage.setItem('leagueHitsterHighScore', finalScore);
        alert(`New High Score: ${finalScore}!`);
    }
    
    // Restart the game
    champions = shuffleArray(champions.concat(timeline));
    startGame();
}
