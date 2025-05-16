chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start_dexscreener") {
        console.log("Received 'dex' message in dexscreener.js");

        start();

        // Send a response back to the background script
        sendResponse({ status: "success" });
    }
});

let token_info = {
    pumpfun: {
        isPumpfun: false,
        percentage: null
    },
    read: true, // telling the extension that you can read it.
    marketCap: null,
    usd: null,
    sol: null,
    address: null,
    name: '',
    image: '',
}

let pumpfunPriceObserver = null;
let marketCapObserver = null;
let childChangeObservers = [];

function start() {
    console.log('Dexscreener script started');

    kickstart();
}

function overallDataUpdate() {
    try {
        console.log("CHANGE OCCURED, UPDATE THE VARIABLE.");

        // Send the message without expecting a response
        chrome.runtime.sendMessage({ action: "priceUpdate", source: "dexscreener", data: token_info });
    } catch (error) {
        console.error("Error in overallDataUpdate:", error);
    }
}

// independent functions
function fetchCurrentTokenAddress() {
    let twitterMeta = document.querySelector('meta[name="twitter:image"]');
    if (!twitterMeta) {
        twitterMeta = document.querySelector('meta[name="twitter:url"]');
    }

    if (twitterMeta) {
        const contentUrl = twitterMeta.getAttribute("content");
        if (contentUrl) {
            const address = contentUrl.split('/').pop().split('?')[0];
            token_info.address = address;
            overallDataUpdate()
        } else {
            console.error("Meta tag has no content attribute.");
        }
    } else {
        console.error('Failed to load coin address.');
    }
}

function extractTokenNameAndImage() {
    const headers = document.querySelectorAll(".chakra-stack.custom-1v7tkkx");
    headers.forEach((header) => {
        const children = Array.from(header.children);

        // Ensure the header has exactly 3 children: button/div, h2, and div
        if (
            children.length === 3 &&
            (children[0].tagName === "BUTTON" || children[0].tagName === "DIV") &&
            children[1].tagName === "H2" &&
            children[2].tagName === "DIV"
        ) {
            // STEP 1: Get the name from the h2 element's title attribute
            const h2Element = children[1];
            const name = h2Element.getAttribute("title");
            if (name) {
                token_info.name = name;
                overallDataUpdate()
            } else {
                console.error("Title attribute not found in the second child (h2).");
                return;
            }

            // STEP 2: Check the first child for the '?' condition
            const firstChild = children[0];
            if (firstChild.tagName === "DIV" && firstChild.innerHTML.trim() === "?") {
                token_info.image = null;
                overallDataUpdate()
            } else {
                token_info.image = `https://dd.dexscreener.com/ds-data/tokens/solana/${token_info.address}.png`
                overallDataUpdate()
            }
        }
    });
}

// boolean function - determine if it's a pump.fun token or not
function fetchPumpfunStatus() {
    const spans = document.querySelectorAll("span");
    spans.forEach(function (span, index) {
        if (span.textContent.trim() === "Progress") {
            console.log('Progress bar Found at Index ' + index);
            let progressBar = (spans[index + 1]).textContent;
            token_info.pumpfun.percentage = progressBar;
            overallDataUpdate()
            if (progressBar.includes("%")) {
                token_info.pumpfun.isPumpfun = true;
                overallDataUpdate()
                return;
            }
        }
    })
}

// market cap functions
function fetchMarketcap() {
    const spans = document.querySelectorAll("span");
    spans.forEach(function (span, index) {
        if (span.textContent.trim() === "Mkt Cap" || span.textContent.trim() === "Market Cap") {
            console.log('Market Cap Found at Index ' + index);
            let nextElement = (spans[index + 1]);
            nextElement.classList.add("playground_mkt_cap");
            let marketCap = (nextElement.textContent);
            if (!marketCap) {
                // not_sure
                token_info.marketCap = null;
                overallDataUpdate()
            }
            updateMarketCapValue(marketCap)
        }
    })
}

// marketCapObserver
function observeMarketCapChanges() {
    const element = document.querySelector(".playground_mkt_cap");

    if (!element) {
        console.warn("Element with class 'playground_mkt_cap' not found.");
        return;
    }

    updateMarketCapValue(element.textContent);

    marketCapObserver = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === "childList" || mutation.type === "characterData") {
                // Extract and process the updated value
                updateMarketCapValue(element.textContent);
            }
        });
    });

    marketCapObserver.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
    });
}

function updateMarketCapValue(value) {
    token_info.marketCap = (value).split('$').join('');
    overallDataUpdate()
    console.log(`Saving Market Cap Value: ${value}`);
}

// pump.fun price extraction =========================
// Function to extract and update the price
function fetchPumpfunPrice() {
    const spans = document.querySelectorAll("span");
    spans.forEach(function (span) {
        if (span.textContent.trim() === "Price") {
            const targetParentDiv = span.closest(".chakra-stack");
            if (targetParentDiv) {
                targetParentDiv.classList.add("playground-pricing-parent-pump");

                // Select the parent div
                const parentDiv = document.querySelector('.playground-pricing-parent-pump');

                // Get all child <span> elements
                const spans = parentDiv.getElementsByTagName('span');

                // Loop through each <span> element looking for title attribute
                for (let i = 0; i < spans.length; i++) {
                    const span = spans[i];
                    if (span.hasAttribute('title')) {
                        const titleValue = span.getAttribute('title');
                        const match = titleValue.match(/\$([0-9.]+)/);
                        if (match) {
                            const numericValue = match[1];
                            pumpFunPriceChange(numericValue);
                            return;
                        }
                    }
                }

                // Check text content if no title attribute is found
                for (let i = 0; i < spans.length; i++) {
                    const textContent = spans[i].textContent;
                    const match = textContent.match(/\$([0-9.]+)/);
                    if (match) {
                        const numericValue = match[1];
                        pumpFunPriceChange(numericValue);
                        return;
                    }
                }
            }
        }
    });
}

// Function to update the price only if it has changed
function pumpFunPriceChange(newPrice) {
    if (token_info.usd !== newPrice) {
        token_info.usd = newPrice; // Update the last known price
        overallDataUpdate()
        console.log(`Price updated: $${newPrice}`);
        // Perform additional actions to update the UI
    }
}

// Observe for changes in the DOM
function pumpfunPriceListner() {
    const targetNode = document.body; // Observe the entire body or a specific node
    const config = { childList: true, subtree: true, characterData: true };

    pumpfunPriceObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                fetchPumpfunPrice();
            }
        }
    });

    pumpfunPriceObserver.observe(targetNode, config);
}

// dexscreener native handling =========================
function assignPlaygroundClass() {
    // Get all spans in the document
    const spans = document.querySelectorAll("span");

    // Iterate over the spans to find the one with the text "Price USD"
    spans.forEach((span) => {
        if (span.textContent.trim() === "Price USD") {
            // Find the parent of the parent div of this span
            const targetParentDiv = span.closest(".chakra-stack").parentElement;

            if (targetParentDiv) {
                // Add the class to the parent
                targetParentDiv.classList.add("playground-pricing-parent");

                // Check if the parent has exactly 2 children and both are <div>
                const children = Array.from(targetParentDiv.children);
                if (
                    children.length === 2 &&
                    children.every((child) => child.tagName === "DIV")
                ) {
                    // Add specific classes to the first and second child
                    const usdBox = children[0];
                    const solBox = children[1];

                    usdBox.classList.add("playground-price-usd-box");
                    solBox.classList.add("playground-price-sol-box");

                    console.log("Class added to parent:", targetParentDiv);

                    // Extract initial values and log them
                    extractInitialValue(usdBox, "USD");
                    extractInitialValue(solBox, "SOL");

                    // Monitor changes in children of both boxes
                    observeChildChanges(usdBox, "USD");
                    observeChildChanges(solBox, "SOL");
                }
            }
        }
    });
}

function extractInitialValue(element, label) {
    const nestedSpan = element.querySelector("span[title]");
    let value;

    if (nestedSpan) {
        // If a nested span with a title exists, extract the numeric part of the title attribute
        value = nestedSpan.getAttribute("title").match(/[0-9.]+/);
    } else {
        // Otherwise, extract the numeric part of the text content
        value = element.textContent.match(/[0-9.]+/);
    }

    if (value) {
        // Log the initial value
        console.log(`${label} (Initial): ${value[0]}`);
        if (label === "USD") {
            updateUSDPrice(value[0]);
        } else if (label === "SOL") {
            updateSOLPrice(value[0]);
        }
    }
}

function observeChildChanges(element, label) {
    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === "childList" || mutation.type === "characterData") {
                const nestedSpan = element.querySelector("span[title]");
                let value;

                if (nestedSpan) {
                    // If a nested span with a title exists, extract the numeric part of the title attribute
                    value = nestedSpan.getAttribute("title").match(/[0-9.]+/);
                } else {
                    // Otherwise, extract the numeric part of the text content
                    value = element.textContent.match(/[0-9.]+/);
                }

                if (value) {
                    // Update and log the value
                    if (label === "USD") {
                        updateUSDPrice(value[0]);
                    } else if (label === "SOL") {
                        updateSOLPrice(value[0]);
                    }
                }
            }
        });
    });

    // Start observing the element
    observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    childChangeObservers.push(observer);
}

function updateUSDPrice(value) {
    token_info.usd = value;
    overallDataUpdate()
    console.log('Price changed USD! ' + value)
}

function updateSOLPrice(value) {
    token_info.sol = value;
    overallDataUpdate()
    console.log('Price changed SOL! ' + value)
}

function invalidToken() {
    const messages = [
        "Token or Pair Not Found",
        "We can't seem to find the token or pair you're looking for."
    ];

    const found = messages.some(msg => document.body.innerText.includes(msg));
    console.log(found);
    return found;
}

function kickstart() {
    fetchCurrentTokenAddress()
    extractTokenNameAndImage()
    // upto this point address, name, image will get be fetched

    // first check if pump fun or not
    fetchPumpfunStatus()
    if (token_info.pumpfun.isPumpfun) {
        // check if it's readable
        fetchMarketcap()
        if (token_info.marketCap == false && parseInt(token_info.percentage.replace('%', '')) == 0) {
            // coin cannot be read because no market cap is present, and the bonding curve is at 0, 
            token_info.read = false;
            overallDataUpdate()
            return;
        }

        observeMarketCapChanges()
        fetchPumpfunPrice()
        pumpfunPriceListner()
    } else {
        // it's a dexscreener listed coin
        assignPlaygroundClass()
        fetchMarketcap()
        observeMarketCapChanges()
    }
}