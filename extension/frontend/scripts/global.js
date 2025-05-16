document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["username", "id", "balance"], (result) => {
        const balanceElement = document.getElementById("sol-bal");

        if (result.balance !== undefined) {
            let bal = result.balance

            // balanceElement.textContent = parseFloat(bal).toFixed(2).toString(); // Update text content
            balanceElement.textContent = bal.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
            balanceElement.setAttribute("value", result.balance.toString());
        } else {
            balanceElement.textContent = "-"; // Default fallback
        }
    });
});

// script to prevent right click, text selection