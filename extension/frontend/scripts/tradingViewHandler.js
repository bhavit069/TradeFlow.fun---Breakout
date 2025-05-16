document.addEventListener('DOMContentLoaded', function () {
    // Set up handlers for buy inputs
    const buyPriceInput = document.getElementById('price_buy_input');
    const buySlippageInput = document.getElementById('slippage_buy_input');
    const buyLabelElement = document.getElementById('buy_assist_label');

    buyPriceInput.addEventListener('input', restrictInput);
    buySlippageInput.addEventListener('input', restrictInput);
    buyPriceInput.addEventListener('input', validateBuyInputs);
    buySlippageInput.addEventListener('input', validateBuyInputs);

    // Set up handlers for sell inputs
    const sellPriceInput = document.getElementById('price_sell_input');
    const sellSlippageInput = document.getElementById('slippage_sell_input');
    const sellLabelElement = document.getElementById('sell_assist_label');

    sellPriceInput.addEventListener('input', restrictInput);
    sellSlippageInput.addEventListener('input', restrictInput);
    sellPriceInput.addEventListener('input', validateSellInputs);
    sellSlippageInput.addEventListener('input', validateSellInputs);

    // Common function to restrict input
    function restrictInput(event) {
        let value = event.target.value;

        // Allow only numbers and one decimal point
        value = value.replace(/[^0-9.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        // Limit max value to 100 for slippage inputs
        if (event.target.id === 'slippage_buy_input' || event.target.id === 'slippage_sell_input') {
            if (parseFloat(value) > 100) {
                value = '100';
            }
        }

        event.target.value = value;
    }

    // Validate buy inputs
    function validateBuyInputs() {
        let priceValue = parseFloat(buyPriceInput.value) || 0;
        let slippageValue = parseFloat(buySlippageInput.value) || 0;

        if (priceValue === 0 && slippageValue === 0) {
            buyLabelElement.textContent = "Enter the price and slippage amount.";
        } else if (priceValue === 0) {
            buyLabelElement.textContent = "Enter the price.";
        } else if (slippageValue === 0) {
            buyLabelElement.textContent = "Enter the slippage amount.";
        } else {
            buyLabelElement.textContent = "";
            calculateBuySlippage(priceValue, slippageValue);
        }
    }

    // Validate sell inputs
    function validateSellInputs() {
        let priceValue = parseFloat(sellPriceInput.value) || 0;
        let slippageValue = parseFloat(sellSlippageInput.value) || 0;

        if (priceValue === 0 && slippageValue === 0) {
            sellLabelElement.textContent = "Enter the amount of tokens to sell and slippage amount.";
        } else if (priceValue === 0) {
            sellLabelElement.textContent = "Enter the amount of tokens to sell.";
        } else if (slippageValue === 0) {
            sellLabelElement.textContent = "Enter the slippage amount.";
        } else {
            sellLabelElement.textContent = "";
            calculateSellSlippage(priceValue, slippageValue);
        }
    }
});

// Calculate buy slippage
function calculateBuySlippage(price, slippage) {
    console.log(`Calculating buy slippage with price: ${price} and slippage: ${slippage}`);
    document.getElementById("buy_assist_label").textContent = `You receive min. ${calculateMinTokens(price, slippage)} tokens.`;
}

// Calculate sell slippage
function calculateSellSlippage(price, slippage) {
    console.log(`Calculating sell slippage with price: ${price} and slippage: ${slippage}`);
    document.getElementById("sell_assist_label").textContent = `You will get min. ${calculateMinSOL(price, slippage)} SOL.`;
}

// Helper function to calculate minimum tokens received for buying
function calculateMinTokens(buyAmountInSol, slippagePercent) {
    let tokenPriceElement = document.getElementById("price_sol");
    let token_price_value = tokenPriceElement.getAttribute("value");
    let tokenPrice;
    if (token_price_value == '-') {
        // calculate from SOL price of the token.
        let usd_price = parseFloat(document.getElementById("price_us").getAttribute("value"));
        let solana_rate_element = document.getElementById("sol-rate").getAttribute("value");
        if (solana_rate_element == 'null') return alert("Can't do this coin!");
        let solana_rate = parseFloat(solana_rate_element);

        tokenPrice = (usd_price / solana_rate).toFixed(11);
    } else {
        tokenPrice = parseFloat(token_price_value);
    }

    const effectivePrice = tokenPrice * (1 + slippagePercent / 100);
    return Math.floor(buyAmountInSol / effectivePrice);
}

// Helper function to calculate minimum SOL received for selling
function calculateMinSOL(tokensToSell, slippagePercent) {
    let tokenPriceElement = document.getElementById("price_sol");
    let token_price_value = tokenPriceElement.getAttribute("value");
    let tokenPrice;
    if (token_price_value == '-') {
        // calculate from SOL price of the token.
        let usd_price = parseFloat(document.getElementById("price_us").getAttribute("value"));
        let solana_rate_element = document.getElementById("sol-rate").getAttribute("value");
        if (solana_rate_element == 'null') return alert("Can't do this coin!");
        let solana_rate = parseFloat(solana_rate_element);

        tokenPrice = (usd_price / solana_rate).toFixed(11);
    } else {
        tokenPrice = parseFloat(token_price_value);
    }

    const effectivePrice = tokenPrice * (1 - slippagePercent / 100);
    return (tokensToSell * effectivePrice).toFixed(6);
}



// Button Redirects
document.getElementById('settings-btn').onclick = function () {
    window.open('https://tradeflow.fun/dashboard/config');
};

document.getElementById('user-edu-btn').onclick = function () {
    window.open('https://tradeflow.fun/blog/tradeflow-papertrading-fundamentals');
};

document.getElementById('transactions-btn').onclick = function () {
    window.open('https://tradeflow.fun/transactions/');
};


setTimeout(() => {
    document.getElementById("loading_text").innerHTML = `Please reload the page to see changes!`;
}, 30000);

