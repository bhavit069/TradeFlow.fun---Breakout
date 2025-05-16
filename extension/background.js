// Check Active Tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkActiveTab") {
        console.log('Tab check initiated');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];

            if (activeTab.url && activeTab.url.startsWith("https://neo.bullx.io/terminal")) {
                sendResponse({ onDexScreener: false, pumpfun: false, bullx: true, axiom: false, photon: false });

                // Inject the bullx content script for Bullx
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ["bullx_content_script.js"]
                }).then(() => {
                    console.log("bullx_content_script.js injected successfully");

                    // Send the "start_bullx" message to bullx_content_script.js
                    chrome.tabs.sendMessage(activeTab.id, { action: "start_bullx" }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Failed to send message to bullx_content_script.js:", chrome.runtime.lastError.message);
                        } else if (response && response.status === "success") {
                            console.log("Message 'bullx' sent successfully to bullx_content_script.js");
                        } else {
                            console.error("Failed to send message to bullx_content_script.js", response);
                        }
                    });
                }).catch((error) => {
                    console.error("Failed to inject bullx_content_script.js:", error);
                });

            } else if (activeTab.url && activeTab.url.startsWith("https://dexscreener.com/solana/")) {
                sendResponse({ onDexScreener: true, pumpfun: false, bullx: false, axiom: false, photon: false });

                // Inject the dexscreener_content_script.js script for dexscreener.com
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ["dexscreener_content_script.js"]
                }).then(() => {
                    console.log("dexscreener_content_script.js injected successfully");

                    // Send the "start_dexscreener" message to dexscreener_content_script.js
                    chrome.tabs.sendMessage(activeTab.id, { action: "start_dexscreener" }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Failed to send message to dexscreener_content_script.js:", chrome.runtime.lastError.message);
                        } else if (response && response.status === "success") {
                            console.log("Message 'dex' sent successfully to dexscreener_content_script.js");
                        } else {
                            console.error("Failed to send message to dexscreener_content_script.js", response);
                        }
                    });
                }).catch((error) => {
                    console.error("Failed to inject dexscreener_content_script.js:", error);
                });

            } else if (activeTab.url && activeTab.url.startsWith("https://axiom.trade/meme/")) {
                sendResponse({ onDexScreener: false, pumpfun: false, bullx: false, axiom: true, photon: false });

                // Inject the axiom_content_script.js script for dexscreener.com
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ["axiom_content_script.js"]
                }).then(() => {
                    console.log("axiom_content_script.js injected successfully");

                    // Send the "start_axiom" message to axiom_content_script.js
                    chrome.tabs.sendMessage(activeTab.id, { action: "start_axiom" }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Failed to send message to axiom_content_script.js:", chrome.runtime.lastError.message);
                        } else if (response && response.status === "success") {
                            console.log("Message 'start_axiom' sent successfully to axiom_content_script.js");
                        } else {
                            console.error("Failed to send message to axiom_content_script.js", response);
                        }
                    });
                }).catch((error) => {
                    console.error("Failed to inject axiom_content_script.js:", error);
                });

            } else if (activeTab.url && activeTab.url.startsWith("https://photon-sol.tinyastro.io/en/lp/")) {
                sendResponse({ onDexScreener: false, pumpfun: false, bullx: false, axiom: false, photon: true });

                // Inject the photon_content_script.js script for dexscreener.com
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ["photon_content_script.js"]
                }).then(() => {
                    console.log("photon_content_script.js injected successfully");

                    // Send the "start_photon" message to photon_content_script.js
                    chrome.tabs.sendMessage(activeTab.id, { action: "start_photon" }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Failed to send message to photon_content_script.js:", chrome.runtime.lastError.message);
                        } else if (response && response.status === "success") {
                            console.log("Message 'start_photon' sent successfully to photon_content_script.js");
                        } else {
                            console.error("Failed to send message to photon_content_script.js", response);
                        }
                    });
                }).catch((error) => {
                    console.error("Failed to inject photon_content_script.js:", error);
                });

            } else if (activeTab.url && activeTab.url.startsWith("https://pump.fun/coin/")) {
                // pumpfun
                sendResponse({ onDexScreener: false, pumpfun: true, bullx: false, axiom: false, photon: false });
            } else {
                // menu
                sendResponse({ onDexScreener: false, pumpfun: false, bullx: false, axiom: false, photon: false });
            }
        });
        // Keep the messaging channel open for async response
        return true;
    }
});

// After installation redirect
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: 'https://tradeflow.fun/welcome'
        });
    }
});

let ports = {}; // Store ports indexed by tabId
let messageQueue = {}; // Store messages indexed by tabId
const MAX_QUEUE_SIZE = 100; // Maximum number of messages to store per tab

// Listen for frontend (popup) connection
chrome.runtime.onConnect.addListener((newPort) => {
    if (newPort.name === "tradingViewPort") {
        let tabId = null;

        // Get the sender's tab ID
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                tabId = tabs[0].id;
                ports[tabId] = newPort; // Store port for this tab

                console.log(`✅ Playground connected for tab ${tabId}`);

                // Process the queue for this tab
                processQueue(tabId);
            }
        });

        // Listen for messages from the popup
        newPort.onMessage.addListener((msg) => {
            if (msg.action === "ready") {
                console.log(`✅ Playground is ready for tab ${tabId}`);
            } else {
                console.log("Received unknown message from frontend:", msg);
            }
        });

        // Handle port disconnect (popup closed)
        newPort.onDisconnect.addListener(() => {
            if (tabId) {
                delete ports[tabId];
                console.log(`❌ Port disconnected for tab ${tabId}`);
            }
        });
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender) => {
    try {
        if (!message || !message.action) {
            throw new Error("Invalid message format");
        }

        if (message.action === "priceUpdate" && sender?.tab?.id) {
            const tabId = sender.tab.id;

            if (ports[tabId]) {
                // If the frontend is connected, send the message immediately
                ports[tabId].postMessage({ action: "tokenInfoUpdated", data: message.data, source: message.source });
            } else {
                // If the frontend is not connected, add the message to the queue
                addToQueue(tabId, message);
                console.warn(`⚠️ No frontend found for tab ${tabId}, adding message to queue.`);
            }
        }
    } catch (error) {
        console.error("Error handling message:", error);
    }
});

// Handle extension context invalidation
chrome.runtime.onSuspend.addListener(() => {
    console.log("Extension is about to be suspended, cleaning up...");
    Object.keys(ports).forEach((tabId) => {
        if (ports[tabId]) {
            ports[tabId].disconnect();
            delete ports[tabId];
        }
    });
    messageQueue = {}; // Clear the queue
});

// Clean up ports on tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    if (ports[tabId]) {
        ports[tabId].disconnect();
        delete ports[tabId];
        console.log(`❌ Port disconnected for tab ${tabId} (tab removed)`);
    }
    delete messageQueue[tabId]; // Clear the queue for this tab
});

// Add a message to the queue
function addToQueue(tabId, message) {
    if (!messageQueue[tabId]) {
        messageQueue[tabId] = [];
    }

    // Limit the queue size
    if (messageQueue[tabId].length >= MAX_QUEUE_SIZE) {
        console.warn(`⚠️ Queue for tab ${tabId} is full, dropping oldest message.`);
        messageQueue[tabId].shift(); // Remove the oldest message
    }

    messageQueue[tabId].push(message); // Add the new message
}

// Process the queue for a specific tab
function processQueue(tabId) {
    if (messageQueue[tabId] && messageQueue[tabId].length > 0) {
        console.log(`Processing queue for tab ${tabId} (${messageQueue[tabId].length} messages)`);

        // Send all messages in the queue
        messageQueue[tabId].forEach((message) => {
            if (ports[tabId]) {
                ports[tabId].postMessage({ action: "tokenInfoUpdated", data: message.data, source: message.source });
            }
        });

        // Clear the queue
        messageQueue[tabId] = [];
    }
}