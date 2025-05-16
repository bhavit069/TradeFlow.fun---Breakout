var access;
var quota;

document.addEventListener("DOMContentLoaded", () => {
	// Step 1: Check if the user is logged in
	chrome.cookies.get({ url: "https://tradeflow.fun", name: "token" }, function (cookie) {
		if (cookie) {
			fetch("https://tradeflow.fun/api/hello", {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${cookie.value}`,
				},
			})
				.then((response) => response.json())
				.then((data) => {
					if (data.message === "Authenticated") {
						let status = data.data.status;
						access = status;
						quota = data.data.quota;

						chrome.storage.local.set({
							username: data.data.user.username, id: data.data.user.id, balance: data.data.balance,
							config: data.data.config,
							contests: data.data.contests,
						}, () => {
						});

						// if (status.maintenance) {
						// 	return window.location.href = "static/maintenance.html";
						// }

						checkActiveTab();
					} else {
						redirectToLogin();
					}
				})
				.catch(() => {
					// server_error.html
					connectFailed();
				});
		} else {
			redirectToLogin();
		}
	});
});

function redirectToLogin() {
	window.location.href = "static/login.html";
}

function connectFailed() {
	window.location.href = "static/server_error.html";
}

function checkActiveTab() {
	// Send a message to the background script to check the active tab
	chrome.runtime.sendMessage({ action: "checkActiveTab" }, handleBackgroundResponse);
}

// Function to handle the response from the background script
// function handleBackgroundResponse(response) {
// 	if (response.onDexScreener) {
// 		window.location.href = "tradeViewDexscreener.html"; // dexscreener
// 	} else if (response.bullx) {
// 		window.location.href = "tradeViewBullx.html"; // bullx
// 	} else if (response.pumpfun) {
// 		window.location.href = "static/pumpfun.html";
// 	} else {
// 		window.location.href = "static/menu.html";
// 	}
// }

let popupWindow = null; // Global variable to track the popup window

function handleBackgroundResponse(response) {
	console.log(quota)

	if (response.onDexScreener) {
		if (!access.playground.dexscreener) {
			return window.location.href = "static/unavailable/dexscreener.html";
		}

		window.location.href = "playground.html"; // dexscreener
	} else if (response.bullx) {
		if (!access.playground.bullx) {
			return window.location.href = "static/unavailable/bullx.html";
		}

		window.location.href = "playground.html"; // bullx

	} else if (response.axiom) {
		if (!access.playground.axiom) {
			return window.location.href = "static/unavailable/axiom.html";
		}

		window.location.href = "playground.html"; // axiom
	} else if (response.photon) {
		if (!access.playground.photon) {
			return window.location.href = "static/unavailable/photon.html";
		}

		window.location.href = "playground.html"; // photon
	} else if (response.pumpfun) {
		window.location.href = "static/pumpfun.html";
	} else {
		window.location.href = "static/menu.html";
	}
}

function openPopup(url, name) {
	// Check if a popup window is already open
	if (popupWindow && !popupWindow.closed) {
		// Focus on the existing popup window
		popupWindow.focus();
	} else {
		// Open a new popup window
		popupWindow = window.open(url, name, "width=416,height=650");

		// Close the original popup.html
		window.close();
	}
}