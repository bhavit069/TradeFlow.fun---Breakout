chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start_photon") {
        console.log("Received 'start_photon' message in photon_content_script.js");

        start();

        // Send a response back to the background script
        sendResponse({ status: "success" });
    }
});

function overallDataUpdate() {
    try {
        console.log("CHANGE OCCURED, UPDATE THE VARIABLE.");

        // Send the message without expecting a response
        chrome.runtime.sendMessage({ action: "priceUpdate", source: "photon", data: token_info });
    } catch (error) {
        console.error("Error in overallDataUpdate:", error);
    }
}


var token_info = {
    read: true,
    marketCap: null, // fetched
    usd: null, // fetched
    sol: null, // fetched
    address: null, // fetched
    name: '', // fetched 
    image: '', // fetched
}

function start() {
    console.log('Content Script for Photon Started!');

    getBasics();

    getPrices();

    getMarketCap();
}

// fetches the token name, image, and address
function getBasics() {
    const container = document.querySelector('div.l-row.p-show__bar__row.u-align-items-center');
    if (container) {
        container.classList.add('tradeflow-basic-container');

        // 2) Get the two children
        const children = container.children;
        if (children.length >= 2) {
            const firstChild = children[0];
            const secondChild = children[1];

            // 3) Process first child - get img src and data-tippy-content
            const images = firstChild.querySelectorAll('img');
            const tippySpan = firstChild.querySelector('span[data-tippy-content]');

            console.log('Image sources:');
            images.forEach(img => {
                console.log(img.src)
                token_info.image = img.src;
            });

            if (tippySpan) {
                let tokenName = tippySpan.getAttribute('data-tippy-content');
                console.log('Token Name:', tokenName);
                token_info.name = tokenName;
            }

            // 4) Process second child - get first href link (token address)
            const links = secondChild.querySelectorAll('a[href]');
            if (links.length > 0) {
                let tokenLink = links[0].href
                console.log('SOL Scan link:', tokenLink);

                token_info.address = tokenLink.split("account/")[1];
            }

            //5) Call Overall Data Update
            overallDataUpdate();
        }
    } else {
        console.log('(MASTER-WARN): Container not found');
    }
}

// function to format number to 4 significant digits
function formatToFourDigits(input) {
    // Ensure input is treated as a string
    const strInput = input.toString();

    // Convert to float and then to fixed-point string (high precision)
    const floatVal = Number(strInput);
    let full = floatVal.toFixed(20); // ensures no scientific notation

    let [whole, decimal] = full.split(".");
    let result = "0.";
    let sigCount = 0;

    for (let i = 0; i < decimal.length; i++) {
        const digit = decimal[i];
        result += digit;

        if (sigCount > 0 || digit !== "0") {
            sigCount++;
        }

        if (sigCount === 4) break;
    }

    // Pad with zeros to ensure 4 significant digits
    while (sigCount < 4) {
        result += "0";
        sigCount++;
    }

    return result;
}

function getPrices() {
    // 1) Find the divs and add classes
    const priceDivs = document.querySelectorAll('div.l-col.p-show__widget__td');
    if (priceDivs.length >= 2) {
        // Add classes to first two divs
        priceDivs[0].classList.add('tradeflow-price-usd');
        priceDivs[1].classList.add('tradeflow-price-sol');

        // Helper function to convert scientific notation to float
        const convertScientificToFloat = (value) => {
            if (!value) return 0;
            if (typeof value === 'number') return value;
            if (value.includes('e') || value.includes('E')) {
                return parseFloat(value).toFixed(8);
            }
            return value;
        };

        // 2) Get the divs with data-value attribute and setup observers
        const setupPriceObserver = (className, label) => {
            const priceDiv = document.querySelector(`.${className} div[data-value]`);
            if (priceDiv) {
                // Process initial value
                let rawValue = priceDiv.getAttribute('data-value');
                let processedValue = convertScientificToFloat(rawValue);

                // Update token_info based on label
                if (label === 'USD') {
                    let formattedValue = formatToFourDigits(processedValue);
                    token_info.usd = formattedValue;
                } else if (label === 'SOL') {
                    let formattedValue = formatToFourDigits(processedValue);
                    token_info.sol = formattedValue;
                }
                console.log(`${label} price:`, processedValue);
                overallDataUpdate();

                // Setup MutationObserver to watch for changes
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'data-value') {
                            let newRawValue = priceDiv.getAttribute('data-value');
                            let newProcessedValue = convertScientificToFloat(newRawValue);

                            // Update token_info and call overallDataUpdate only if value changed
                            if (label === 'USD') {
                                if (token_info.usd !== newProcessedValue) {
                                    let formattedValue = formatToFourDigits(processedValue);
                                    token_info.usd = formattedValue;
                                    console.log(`New USD price:`, newProcessedValue);
                                    overallDataUpdate();
                                }
                            } else if (label === 'SOL') {
                                if (token_info.sol !== newProcessedValue) {
                                    let formattedValue = formatToFourDigits(processedValue);
                                    token_info.sol = formattedValue;
                                    console.log(`New SOL price:`, newProcessedValue);
                                    overallDataUpdate();
                                }
                            }
                        }
                    });
                });

                observer.observe(priceDiv, {
                    attributes: true,
                    attributeFilter: ['data-value']
                });

                return observer;
            }
            return null;
        };

        // Setup observers for both prices
        const usdObserver = setupPriceObserver('tradeflow-price-usd', 'USD');
        const solObserver = setupPriceObserver('tradeflow-price-sol', 'SOL');

        // Store observers in global scope so they don't get garbage collected
        window.tradeflowPriceObservers = {
            usdObserver,
            solObserver
        };
    } else {
        console.log('Could not find price divs - retrying in 1 second');
        setTimeout(getPrices, 1000); // Retry after 1 second
    }
}

function getMarketCap() {
    const mktCapDivs = document.querySelectorAll('div.l-col-4.p-show__widget__td');
    if (mktCapDivs.length < 2) {
        console.log('Could not find market cap divs');
        return;
    }
    const marketCapDiv = mktCapDivs[1];
    marketCapDiv.classList.add('tradeflow-mktcap');

    const valueDiv = marketCapDiv.querySelector('div[data-value]');
    if (!valueDiv) {
        console.log('Could not find market cap value element');
        return;
    }

    // helper to read the displayed text
    function readText() {
        return valueDiv.textContent.trim();
    }

    // initial read + render
    let lastText = readText();
    console.log('Initial Market Cap:', lastText);
    token_info.marketCap = lastText.replace(/^\$/, '');
    overallDataUpdate();

    // observe for any text or attribute changes
    const observer = new MutationObserver(mutations => {
        let newText = null;

        for (let m of mutations) {
            if (
                m.type === 'characterData' ||
                m.type === 'childList' ||
                (m.type === 'attributes' && m.attributeName === 'data-value')
            ) {
                newText = readText();
                break; // we only need one mutation to trigger a re-read
            }
        }

        if (newText && newText !== lastText) {
            lastText = newText;
            console.log('Market Cap Updated:', lastText);
            token_info.marketCap = lastText.replace(/^\$/, '');
            overallDataUpdate();
        }
    });

    observer.observe(valueDiv, {
        attributes: true,
        attributeFilter: ['data-value'],
        childList: true,
        characterData: true,
        subtree: true
    });

    // keep it alive
    window.tradeflowMktCapObserver = observer;
}