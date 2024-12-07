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

            // Visual feedback for correct or incorrect placement
            const dropZone = event.target;
            const draggableCard = document.getElementById("draggable-champion");

            if (correctPlacement) {
                dropZone.style.backgroundColor = 'green';  // Correct placement: Green color
                draggableCard.style.border = '5px solid green'; // Highlight the dragged card in green

                score += 10; // Increment score for correct placement
                document.getElementById('score').textContent = `Score: ${score}`;
                
                addChampionToTimeline(draggedData, index);
                renderTimeline();
                nextRound();
            } else {
                dropZone.style.backgroundColor = 'red';  // Incorrect placement: Red color
                draggableCard.style.border = '5px solid red'; // Highlight the dragged card in red

                lives--;
                document.getElementById("lives").textContent = `Lives: ${lives}`;

                if (lives <= 0) {
                    gameOver();
                } else {
                    setTimeout(() => {
                        // Reset the color after a short delay
                        dropZone.style.backgroundColor = '';
                        draggableCard.style.border = '';

                        nextRound(); // Give a new champion to place after losing a life
                    }, 500);
                }
            }
        });
    });
}
