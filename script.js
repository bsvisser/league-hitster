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

        setupDragEvents(currentChampion);
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
                    <p class="release-date">${new Date(champ.releaseDate).toLocaleDateString()}</p>
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

    let touchStartX, touchStartY;
    let initialX, initialY;

    // For desktop drag-and-drop events (mouse)
    draggable.addEventListener("dragstart", (event) => {
        draggable.style.visibility = 'hidden'; // Hide the card during drag
        event.dataTransfer.setData("text/plain", JSON.stringify(currentChampion));
    });

    draggable.addEventListener("dragend", () => {
        draggable.style.visibility = 'visible'; // Show the card again after drag ends
    });

    // For mobile touch events (no drag and drop)
    draggable.addEventListener("touchstart", (event) => {
        const touch = event.changedTouches[0]; // Get the first touch point

        // Save initial touch position
        touchStartX = touch.pageX;
        touchStartY = touch.pageY;

        // Save the initial position of the draggable card
        const rect = draggable.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;

        // Make the card follow the touch movement
        draggable.style.position = 'absolute'; // Make the card absolute for movement
        draggable.style.zIndex = 10; // Bring the card to the front
    });

    draggable.addEventListener("touchmove", (event) => {
        event.preventDefault(); // Prevent default scroll behavior

        const touch = event.changedTouches[0]; // Get the first touch point

        const deltaX = touch.pageX - touchStartX; // Calculate movement in X
        const deltaY = touch.pageY - touchStartY; // Calculate movement in Y

        // Move the card according to the touch movement
        draggable.style.transform = `translate(${deltaX + initialX}px, ${deltaY + initialY}px)`;
    });

    draggable.addEventListener("touchend", (event) => {
        // End the drag when touch is released
        draggable.style.position = ''; // Reset the position
        draggable.style.transform = ''; // Reset the transform

        // Logic to handle dropping the champion
        const dropZone = detectDropZone(); // Custom function to find drop zone

        if (dropZone) {
            // Handle the drop: Update the timeline, score, etc.
            handleChampionDrop(dropZone, currentChampion);
        } else {
            // If no valid drop zone, reset the card position
            resetCardPosition();
        }
    });

    // This function can check if the card is over a valid drop zone
    function detectDropZone() {
        // You can implement your logic here to find the drop zone
        // For example, check if the card is within the area of the drop zones
        // Return the drop zone if valid, otherwise return null
    }

    // Reset card position after the drop is unsuccessful
    function resetCardPosition() {
        draggable.style.transform = '';
        draggable.style.position = '';
    }

    // Handle champion drop logic (add to timeline, update score, etc.)
    function handleChampionDrop(dropZone, champion) {
        // Add the champion to the timeline or any other logic for dropping
        timeline.push(champion);
        renderTimeline();
        nextRound();
    }
}
let selectedChampion = null; // Keep track of the currently selected champion

// Update the event listeners to handle tapping for mobile devices
function setupTapEvents(currentChampion) {
    const draggable = document.getElementById("draggable-champion");
    
    // For mobile tap (or desktop click) on the current champion
    draggable.addEventListener("click", () => {
        if (selectedChampion === currentChampion) {
            // If the champion is already selected, do nothing
            return;
        }

        // Select the current champion
        selectedChampion = currentChampion;

        // Highlight the selected champion (visually)
        draggable.classList.add("selected");

        // Optionally, you can also show a message or change the UI state
        console.log("Champion selected:", selectedChampion.name);
    });

    // Now, handle tapping the drop zones
    const dropZones = document.querySelectorAll(".drop-between");

    dropZones.forEach(zone => {
        zone.addEventListener("click", (event) => {
            // If no champion is selected, do nothing
            if (!selectedChampion) return;

            const index = parseInt(zone.dataset.index, 10);
            const correctPlacement = checkPlacement(selectedChampion, index);

            if (correctPlacement) {
                // Place the selected champion in the timeline
                addChampionToTimeline(selectedChampion, index);
                renderTimeline();

                // Reset the selected champion
                selectedChampion = null;
                draggable.classList.remove("selected");

                // Proceed to the next round
                nextRound();
            } else {
                // If incorrect, reset the selected champion
                console.log("Incorrect placement");
                selectedChampion = null;
                draggable.classList.remove("selected");
            }
        });
    });
}

// Add this to your existing checkPlacement and addChampionToTimeline logic
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

// Styling for the selected champion
document.styleSheets[0].insertRule(`
    #draggable-champion.selected {
        border: 2px solid #9b4dff;  /* Add a visual cue for the selected champion */
        box-shadow: 0px 0px 10px rgba(155, 77, 255, 0.5);
    }
`, document.styleSheets[0].cssRules.length);

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

            if (correctPlacement) {
                score += 10; // Increment score for correct placement
                document.getElementById('score').textContent = `Score: ${score}`;
                
                addChampionToTimeline(draggedData, index);
                renderTimeline();
                nextRound();
            } else {
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
