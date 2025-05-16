chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start_axiom") {
        console.log("Received 'start_axiom' message in axiom.js");

        start();

        // Send a response back to the background script
        sendResponse({ status: "success" });
    }
});

var token_info = {
    read: true,
    marketCap: null,
    usd: null,
    sol: null,
    address: null,
    name: '',
    image: '',
}

function overallDataUpdate() {
    try {
        console.log("CHANGE OCCURED, UPDATE THE VARIABLE.");
        console.log(token_info)
        // Send the message without expecting a response
        chrome.runtime.sendMessage({ action: "priceUpdate", source: "axiom", data: token_info });
    } catch (error) {
        console.error("Error in overallDataUpdate:", error);
    }
}

setTimeout(() => {
    const intervalId = setInterval(overallDataUpdate, 1200); // Call function every 2 seconds

    setTimeout(() => {
        clearInterval(intervalId); // Stop calling the function after 10 seconds
        console.log("Stopped calling the function!");
    }, 20000); // stop trigger script
}, 1000); // delay

function start() {
    // Step 1: Find the div with the specified classes and add the class "tradeflow-container"
    const mainContainer = document.querySelector('div.flex.flex-row.flex-1.max-h-\\[64px\\].min-h-\\[64px\\].border-b.border-primaryStroke.pl-\\[16px\\].pr-\\[16px\\].gap-\\[16px\\].justify-center.items-center');// const mainContainer = document.querySelector('.flex.flex-row.flex-1.max-h-\\[64px\\].min-h-\\[64px\\].border-b.border-primaryStroke.px-\\[16px\\].gap-\\[16px\\].justify-center.items-center');
    if (mainContainer) {
        console.log('Main container found')

        mainContainer.classList.add('tradeflow-container');
        console.log('Class Added')

        // Step 2: Add class "tradeflow-details-container" to the first child
        const firstChild = mainContainer.children[0];
        if (firstChild) {
            firstChild.classList.add('tradeflow-details-container');

            // Step 5: Inside "tradeflow-details-container", add class "tradeflow-image-container" to the first child
            const imageContainer = firstChild.children[0];
            if (imageContainer) {
                imageContainer.classList.add('tradeflow-image-container');

                // Step 8: Inside "tradeflow-image-container", access the second div, find the img tag, and log its src and alt attributes
                const secondDivInImageContainer = imageContainer.querySelector('div:nth-child(2)');
                if (secondDivInImageContainer) {
                    const imgTag = secondDivInImageContainer.querySelector('img');
                    if (imgTag) {
                        token_info.image = imgTag.src;
                        token_info.name = imgTag.alt;

                        console.log(imgTag.src)
                        console.log(imgTag.alt)

                        getAddress(imgTag.src) // fetching and validating token address using string matching
                    }
                }
            }

            // Step 6: Inside "tradeflow-details-container", add class "tradeflow-name-container" to the second child
            const nameContainer = firstChild.children[1];
            if (nameContainer) {
                nameContainer.classList.add('tradeflow-name-container');
            }
        }

        // Step 3: Add class "tradeflow-mktcap-container" to the second child
        const secondChild = mainContainer.children[1];
        if (secondChild) {
            secondChild.classList.add('tradeflow-mktcap-container');
        }

        // Step 4: Add class "tradeflow-price-container" to the third child
        const thirdChild = mainContainer.children[2];
        if (thirdChild) {
            thirdChild.classList.add('tradeflow-price-container');
        }

        overallDataUpdate();
        fetchMarketcap();
        fetchPrice();
    } else {
        console.log('Main container not found')
    }
}

function fetchMarketcap() {
    const marketcapContainer = document.querySelector('.tradeflow-mktcap-container');
    if (!marketcapContainer) {
        console.error('tradeflow-mktcap-container not found');
        return;
    }

    // Function to extract and log marketcap value
    const logMarketcap = () => {
        const span = marketcapContainer.querySelector('span');
        if (span && span.innerHTML.startsWith('$')) {
            let marketcapValue = span.innerHTML;
            marketcapValue = marketcapValue.replace('$', '');
            token_info.marketCap = marketcapValue;
            overallDataUpdate();
            console.log('Marketcap:', marketcapValue);
        }
    };

    // Log initial marketcap value
    logMarketcap();

    // Set up MutationObserver to detect changes
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                logMarketcap();
            }
        }
    });

    // Observe changes in the marketcap container
    observer.observe(marketcapContainer, {
        childList: true,
        subtree: true,
        characterData: true,
    });
}

function fetchPrice() {
    const priceContainer = document.querySelector('.tradeflow-price-container');
    if (!priceContainer) {
        console.error('tradeflow-price-container not found');
        return;
    }

    // Function to extract and log price value
    const logPrice = () => {
        const priceSpan = priceContainer.querySelector('span.text-textPrimary'); // Target the correct span
        if (priceSpan && priceSpan.innerHTML.startsWith('$')) {
            let priceValue = priceSpan.innerHTML;

            // Handle <sub> tags
            const subTag = priceSpan.querySelector('sub');
            if (subTag) {
                const subValue = subTag.textContent; // Get the number inside <sub>
                const zeros = '0'.repeat(Number(subValue) - 1); // Replace <sub> value with zeros
                priceValue = priceValue.replace(`<sub>${subValue}</sub>`, zeros); // Replace <sub> with zeros
            }

            // Ensure the output is a valid number in the format $0.00006
            priceValue = priceValue.replace(/[^0-9.]/g, ''); // Remove non-numeric characters except '.'
            // priceValue = `$${priceValue}`; // Add the '$' back
            token_info.usd = priceValue;
            overallDataUpdate();
            console.log('Price:', priceValue);
        }
    };

    // Log initial price value
    logPrice();

    // Set up MutationObserver to detect changes
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                logPrice();
            }
        }
    });

    // Observe changes in the price container
    observer.observe(priceContainer, {
        childList: true,
        subtree: true,
        characterData: true,
    });
}

function getAddress(link) {
    var tokenAddressSpan;
    const foundSpan = Array.from(document.querySelectorAll('span')).find(span => span.textContent.trim() === "CA:");

    // Check if the span is found and retrieve its sibling
    if (foundSpan) {
        const siblingElement = foundSpan.nextElementSibling;
        if (siblingElement) {
            tokenAddressSpan = siblingElement.textContent;
        }
    } else {
        console.log('Span with text "CA:" not found');
    }

    let pattern = tokenAddressSpan;


    // Extract the string between the last '/' and '.webp'
    const extractedString = link.split('/').pop().split('.webp')[0];

    // Extract the start and end parts of the pattern
    const [patternStart, patternEnd] = pattern.split('...');

    // Check if the extracted string starts with patternStart and ends with patternEnd
    if (
        extractedString.startsWith(patternStart) &&
        extractedString.endsWith(patternEnd)
    ) {
        console.log("The strings match. " + extractedString);
        token_info.address = extractedString;
    } else {
        console.log("The strings do not match.");
    }
}