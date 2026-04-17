// Function to display highest scores
function displayHighestScores() {
    const leaderboardContainer = document.getElementById("leaderboardContainer");

    // Retrieve leaderboard data from localStorage
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

    // Calculate the highest score from the users who played
    const highestScores = leaderboard.reduce((acc, entry) => {
        if (!acc[entry.username] || entry.score > acc[entry.username]) {
            acc[entry.username] = entry.score;
        }
        return acc;
    }, {});

    // Convert the highest scores object to an array and sort by score descending in order to get a ranking of highest score
    const sortedScores = Object.entries(highestScores)
        .map(([username, score]) => ({ username, score }))
        .sort((a, b) => b.score - a.score);

    // Display each entry in a formatted list
    sortedScores.forEach(entry => {
        const scoreElement = document.createElement("p");
        scoreElement.textContent = `${entry.username}: ${entry.score}`;
        leaderboardContainer.appendChild(scoreElement);
    });
}

// Run the display function on page load
document.addEventListener("DOMContentLoaded", displayHighestScores);
