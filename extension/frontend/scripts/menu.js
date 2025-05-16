document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["username", "id", "balance", "contests"], (result) => {
        let name = document.getElementById("name");
        name.textContent = result.username;

        console.log(result.contests);

        if (result.contests.current.status === "started") {
            console.log("User is in contest");

            document.getElementById("banner_image").style.display = "none";

            let endtime = result.contests.contestEnd;
            let endDate = new Date(endtime + " UTC");

            // Show contest section
            document.getElementById("contest_container").style.display = "block";

            // Start countdown
            updateTimer(endDate);
            timerInterval = setInterval(() => updateTimer(endDate), 1000);
        }

        document.getElementById("transactions-button").setAttribute("userID", result.id);
    });
});

let timerInterval;

function updateTimer(endDate) {
    const now = new Date();
    const diffInSeconds = Math.floor((endDate - now) / 1000);

    const timerElement = document.getElementById("contest_timer");
    if (!timerElement) return;

    if (diffInSeconds > 0) {
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;

        const parts = [];
        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

        timerElement.textContent = parts.join(' ') + ' left';
    } else {
        clearInterval(timerInterval);
        timerElement.textContent = "Time ended";
    }
}


/*
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["username", "id", "balance", "contests"], (result) => {
        let name = document.getElementById("name");
        name.textContent = result.username;

        console.log(result.contests)

        if (result.contests.current.status == "started") {
            console.log('User is in contest')

            document.getElementById("banner_image").style.display = "none";

            // set the timer
            let endtime = result.contests.contestEnd;
            let endDate = new Date(endtime + " UTC"); // Parse as UTC

            // Initial call
            updateTimer(endDate);

            let timerInterval = setInterval(() => updateTimer(endDate), 1000);



            document.getElementById("contest_container").style.display = "block";
        }

        document.getElementById("transactions-button").setAttribute("userID", result.id);
    });
});

function updateTimer(endDate) {
    let now = new Date(); // Get current time in UTC
    let diffInSeconds = Math.floor((endDate - now) / 1000); // Difference in seconds

    let timerElement = document.getElementById("contest_timer");

    if (diffInSeconds > 0) {
        let hours = Math.floor(diffInSeconds / 3600);
        let minutes = Math.floor((diffInSeconds % 3600) / 60);
        let seconds = diffInSeconds % 60;

        timerElement.textContent = `${hours} hours ${minutes} minutes ${seconds} seconds left`;
    } else {
        timerElement.textContent = "Time ended";
        clearInterval(timerInterval); // Stop updating once time has passed
    }
}
*/



document.getElementById('dashboard-button').onclick = function () {
    window.open('https://tradeflow.fun/dashboard');
};

document.getElementById('transactions-button').onclick = function () {
    let url = `https://tradeflow.fun/transactions/${document.getElementById("transactions-button").getAttribute("userID")}?src=extension`
    window.open(url);
};


// document.getElementById('gsLink').onclick = function () {
//     window.open('https://tradeflow.fun/launch');
// };


document.getElementById('dexLink').onclick = function () {
    window.open('https://dexscreener.com/solana');
};

document.getElementById('axiomLink').onclick = function () {
    window.open('https://axiom.trade/pulse');
};

document.getElementById('photonLink').onclick = function () {
    window.open('https://photon-sol.tinyastro.io/en/discover');
};

document.getElementById('bullxLink').onclick = function () {
    window.open('https://neo.bullx.io/');
};

document.getElementById('getPremium').onclick = function () {
    window.open('https://tradeflow.fun/premiuim?source=extension');
};



document.getElementById('rugcheckLink').onclick = function () {
    window.open('https://rugcheck.xyz/');
};

document.getElementById('trenchbotLink').onclick = function () {
    window.open('https://trench.bot/');
};

