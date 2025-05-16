chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start_bullx") {
        console.log("Received 'start_bullx' message in bullx.js");

        start();

        // Send a response back to the background script
        sendResponse({ status: "success" });
    }
});

function start() {
    console.log('BullX script started');

    initialize()
}

var token_info = {
    read: true,
    marketCap: null,
    usd: null,
    sol: null,
    address: null,
    name: '',
    image: '',
}

var halfName;

function overallDataUpdate() {
    try {
        console.log("CHANGE OCCURED, UPDATE THE VARIABLE.");

        // Send the message without expecting a response
        chrome.runtime.sendMessage({ action: "priceUpdate", source: "bullx", data: token_info });
    } catch (error) {
        console.error("Error in overallDataUpdate:", error);
    }
}

function filterPriceValue(str) {
    // Step 1: Extract the subscript part using regex
    let match = str.match(/0([₀₁₂₃₄₅₆₇₈₉]+)/); // Matches the subscript pattern

    if (!match) return str;

    let subscriptStr = match[1]; // Extracted subscript characters (e.g., "₄" or "₁₂")

    let subscriptValue = subscriptStr.replace(/₀/g, '0')
        .replace(/₁/g, '1')
        .replace(/₂/g, '2')
        .replace(/₃/g, '3')
        .replace(/₄/g, '4')
        .replace(/₅/g, '5')
        .replace(/₆/g, '6')
        .replace(/₇/g, '7')
        .replace(/₈/g, '8')
        .replace(/₉/g, '9');

    let n = parseInt(subscriptValue, 10); // Convert extracted subscript to integer

    let zeroReplacement = "0".repeat(n);
    let finalStr = str.replace(`0${subscriptStr}`, `${zeroReplacement}`);

    let x = finalStr.trim();
    let i = (str.length - 4) + n;
    return parseFloat(x).toFixed(i);
}

function extractPrice() {
    const container = document.querySelector('.tradeflow-token-price-container');
    if (!container) return null;

    // Find the <span> element that contains a price (starts with "$")
    const priceSpan = Array.from(container.querySelectorAll('span'))
        .find(span => span.textContent.trim().startsWith('$'));

    if (!priceSpan) return null;

    // Extract text and remove "$" symbol
    let priceText = priceSpan.textContent.trim().replace('$', '');
    console.log("Initial price " + filterPriceValue(priceText))
    token_info.usd = filterPriceValue(priceText)
    overallDataUpdate()
    // Convert subscript numbers to normal numbers
    // convert 0.0₄7075 to 0.00007075
    priceListener()
}

function extractMktcap() {
    const container = document.querySelector('.tradeflow-token-mktcap-container');
    if (!container) return null;

    // Find the <span> element that contains a price (starts with "$")
    const mktcapSpan = Array.from(container.querySelectorAll('span'))
        .find(span => span.textContent.trim().startsWith('$'));

    if (!mktcapSpan) return null;

    // Extract text and remove "$" symbol
    let mktcapText = mktcapSpan.textContent.trim().replace('$', '');
    console.log("Initial Market Cap " + mktcapText)
    token_info.marketCap = mktcapText
    overallDataUpdate();
    mktcapListener()
}

function priceListener() {
    const targetElement = document.querySelector(".tradeflow-token-price-container");

    if (!targetElement) {
        console.error("Price container not found!");
        return;
    }

    // Create a MutationObserver instance
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList" || mutation.type === "characterData") {
                const priceElement = targetElement.querySelector("span:nth-child(2)"); // Assuming the second <span> holds the price

                if (priceElement) {
                    let i = priceElement.textContent.trim().replace('$', '')
                    let e = filterPriceValue(i)
                    console.log("Price updated:", e);

                    token_info.usd = e
                    overallDataUpdate()
                }
            }
        });
    });

    // Start observing the element for changes in child nodes and text content
    observer.observe(targetElement, {
        childList: true,      // Detect new or removed elements inside the container
        subtree: true,        // Observe deeper changes in child elements
        characterData: true   // Detect changes in text content
    });

    console.log("Listening for price changes...");
}

function mktcapListener() {
    const targetElement = document.querySelector(".tradeflow-token-mktcap-container");

    if (!targetElement) {
        console.error("Market cap container not found!");
        return;
    }

    // Create a MutationObserver instance
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList" || mutation.type === "characterData") {
                const mktcapElement = targetElement.querySelector("span:nth-child(2)"); // Assuming the second <span> holds the market cap

                if (mktcapElement) {
                    let i = mktcapElement.textContent.trim()
                    i = i.replace('$', '');
                    console.log("Market Cap updated:", i);

                    token_info.marketCap = i
                    overallDataUpdate();
                }
            }
        });
    });

    // Start observing the element for changes in child nodes and text content
    observer.observe(targetElement, {
        childList: true,      // Detect new or removed elements inside the container
        subtree: true,        // Observe deeper changes in child elements
        characterData: true   // Detect changes in text content
    });

    console.log("Listening for market cap changes...");
}

// find address
function getAddress() {
    let urlParams = new URLSearchParams(window.location.search);
    let address = urlParams.get('address');
    token_info.address = address;
    overallDataUpdate();
}

// Function for name and image
function findName() {
    const container = document.querySelector('.tradeflow-token-details-container');

    // Access the first div inside the container
    const firstDiv = container.querySelector('div');

    // Access the second div inside the first div
    const secondDiv = firstDiv.querySelector('div.flex.flex-col.ml-1.md\\:ml-2.flex-1.overflow-hidden');

    // Access the first div inside the second div
    const thirdDiv = secondDiv.querySelector('div.\\!p-0.\\!m-0.\\!h-auto.relative.hover\\:cursor-pointer.flex.gap-1.overflow-hidden.items-center');

    // Access the span inside the third div
    const span = thirdDiv.querySelector('span.flex.gap-1.overflow-hidden.items-center');

    // Access the second child span inside the span
    const secondChildSpan = span.querySelectorAll('span')[1];

    // Add the class "tradeflow-half-name" to the second child span
    secondChildSpan.classList.add('tradeflow-half-name');

    // Get the text content of the second child span
    const textContent = secondChildSpan.textContent;

    // Print the text content
    console.log(textContent); // returns official...
    halfName = textContent;
    simulateHoverOnName();
}

function simulateHoverOnName() {
    const hoverElement = document.querySelector('.tradeflow-half-name');

    if (hoverElement) {
        const mouseOverEvent = new MouseEvent('mouseover', {
            bubbles: true, // Event bubbles up through the DOM
            cancelable: true, // Event can be canceled
            view: window // Associated window
        });
        hoverElement.dispatchEvent(mouseOverEvent);

        // Create and dispatch the "mouseenter" event
        const mouseEnterEvent = new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        hoverElement.dispatchEvent(mouseEnterEvent);

        console.log('Hover effect simulated on the element:', hoverElement);

        // Wait for the tooltip to appear, then call findFullName
        setTimeout(findFullName, 500); // Pass the function reference, don't call it immediately
    } else {
        console.error('Element with class "tradeflow-half-name" not found.');
    }
}

function findFullName() {
    const inputText = halfName;
    // Find all tooltip elements
    const tooltips = document.querySelectorAll('.ant-tooltip-inner');

    // Iterate through tooltips to find the one that matches the input text
    let outputText = null;
    tooltips.forEach(tooltip => {
        const tooltipText = tooltip.textContent.trim();
        if (tooltipText.startsWith(inputText.replace('...', ''))) {
            outputText = tooltipText;
        }
    });

    // Print the output text
    if (outputText) {
        console.log('Token name:', outputText);
        token_info.name = outputText
        overallDataUpdate()
    } else {
        console.error('Full name not found.');
    }
}

// for image
function findImage() {
    // Select the container div
    const container = document.querySelector('.tradeflow-token-details-container');

    if (container) {
        // Find the img tag inside the container with a src starting with "https://image.bullx.io/"
        const imgElement = container.querySelector('img[src^="https://image.bullx.io/"]');

        if (imgElement) {
            // Log the src attribute of the img tag
            console.log("Image Source:", imgElement.src);
            token_info.image = imgElement.src;
            overallDataUpdate();

        } else {
            console.log("No img tag found with src starting with 'https://image.bullx.io/'.");
        }
    } else {
        console.error("Container with class 'tradeflow-token-details-container' not found.");
    }
}

function initialize() {
    // Find the <main> tag
    const mainTag = document.querySelector('main');
    if (!mainTag) {
        console.error('No <main> tag found in the document.');
        return;
    }

    // Check if <main> has a single <div> child
    const mainChildren = mainTag.children;
    if (mainChildren.length !== 1 || mainChildren[0].tagName !== 'DIV') {
        console.error('<main> does not have a single <div> child.');
        return;
    }

    const firstDiv = mainChildren[0];

    // Check if this <div> has exactly two <div> children
    const firstDivChildren = firstDiv.children;
    if (firstDivChildren.length !== 2 || firstDivChildren[0].tagName !== 'DIV' || firstDivChildren[1].tagName !== 'DIV') {
        console.error('The first <div> does not have exactly two <div> children.');
        return;
    }

    // Access the first <div> inside the first <div>
    const nestedFirstDiv = firstDivChildren[0];

    // Check if this <div> has 3 or 4 children
    if (nestedFirstDiv.children.length < 3 || nestedFirstDiv.children.length > 4) {
        console.error('The nested first <div> does not have 3 or 4 children.');
        return;
    }

    // Find the target <div> with the specified class
    const targetDiv = Array.from(nestedFirstDiv.children).find(child =>
        child.classList.contains('text-xs') &&
        child.classList.contains('flex') &&
        child.classList.contains('flex-col') &&
        child.classList.contains('md:flex-row') &&
        child.classList.contains('items-center') &&
        child.classList.contains('font-medium') &&
        child.classList.contains('text-left')
    );

    if (!targetDiv) {
        console.error('No matching <div> found with the specified classes.');
        return;
    }

    // Ensure the target <div> has at least 2 children
    if (targetDiv.children.length < 2) {
        console.error('The target <div> does not have at least 2 children.');
        return;
    }

    // Add the class "tradeflow-token-nav" to the target <div>
    targetDiv.classList.add('tradeflow-token-nav');

    // Add the class "tradeflow-token-details-container" to the first child
    targetDiv.children[0].classList.add('tradeflow-token-details-container');

    // Add the class "tradeflow-token-pricing-container" to the second child
    const pricingContainer = targetDiv.children[1];
    pricingContainer.classList.add('tradeflow-token-pricing-container');

    // Ensure the pricing container has at least 5 children
    if (pricingContainer.children.length < 5) {
        console.error('The pricing container does not have at least 5 children.');
        return;
    }

    // Add classes to the children of the pricing container
    Array.from(pricingContainer.children).forEach((child, index) => {
        // Add specific classes to the first and second children
        if (index === 0) {
            child.classList.add('tradeflow-token-price-container');
        } else if (index === 1) {
            child.classList.add('tradeflow-token-mktcap-container');
        }
    });

    console.log('Classes added successfully.');
    extractPrice()
    extractMktcap()

    // fetch name, image and address
    getAddress();
    findName();
    findImage();
}