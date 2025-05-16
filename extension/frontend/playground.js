
let port = chrome.runtime.connect({ name: "tradingViewPort" });

const usdPriceElement = document.getElementById("price_us");
const solPriceElement = document.getElementById("price_sol");
const overlayElement = document.getElementById("loading_overlay"); // The overlay element
const token_name = document.getElementById("token_name");
const token_image = document.getElementById("token_image");
const token_image_sell = document.getElementById("trx-sell-image");
const market_cap = document.getElementById("market-cap");
const token_holding = document.getElementById("token_holding");
const buyButton = document.getElementById("buy-button");
const sellButton = document.getElementById("sell-button");
const price_buy_input = document.getElementById("price_buy_input");
const slippage_buy_input = document.getElementById("slippage_buy_input");
const price_sell_input = document.getElementById("price_sell_input");
const slippage_sell_input = document.getElementById("slippage_sell_input");
const realtime_usd = document.getElementById("realtime-usd-value");
const solanaPrice = document.getElementById("sol-rate");

var data;
var state = {
    token_name: false,
    usd: false,
    mc: false,
    isReady: false,
    bool: {
        supply: false,
        fetchTokenBalanceStatus: true,
        tokenBalFetched: false
    },
    values: {
        source: null, // playground source
        axiom_usd: null,
        sol_price: null, // price of 1 SOL
        token_holdings: 0, // token holdings
        token_supply: 0 // token supply
    }
}

// fetching SOL balance
fetch('https://tradeflow.fun/solana')
    .then(response => response.json())
    .then(res => {
        console.log(res.price)
        state.values.sol_price = parseFloat(res.price);
        solanaPrice.setAttribute("value", state.values.sol_price);
    })
    .catch(error => {
        // CANT WORK WITH THIS, ALERT THE USER
        console.log("Can't fetch SOL price!")
        // todo: redirect to error page
        solanaPrice.setAttribute("value", 'null');
        state.values.sol_price = null;
    });

// loading config
chrome.storage.local.get(["config"], (result) => {
    console.log("Config loaded!")

    if (result.config) {
        slippage_buy_input.value = result.config.buy_slippage;
        slippage_sell_input.value = result.config.sell_slippage;
    }
});

// on token info update
port.onMessage.addListener((message) => {
    if (message.action === "tokenInfoUpdated") {
        console.log("✅ Data received:", message.data);

        data = message.data; // update the token data
        handle(message.data, message.source) // handle data update
        state.values.source = message.source; // set state

        // check if address available, to fetch supply for AXIOM - for accurate price calculation
        if (message.data.address) {
            if (message.source == "axiom" && !state.bool.supply) {
                getSupply(message.data.address)
                state.bool.supply = true;
            }
        }
    }
});

// handle token info update
function handle(token_info, source) {
    // set token holdings
    if (state.bool.fetchTokenBalanceStatus && token_info.address != null) {
        fetchTokenBalance(token_info.address);
        state.bool.fetchTokenBalanceStatus = false;
    }

    // calculate real time value
    if (state.bool.tokenBalFetched && !state.bool.fetchTokenBalanceStatus) {
        // console.log('Calling RTC price calc')
        calculateRealTimeValue()
    }

    // set token name
    if (token_info.name != '') {
        token_name.textContent = `${token_info.name}`;
        state.token_name = true;
    }

    // set market cap
    if (token_info.marketCap != null) {
        market_cap.textContent = `$${token_info.marketCap}`;
        state.mc = true;

        // no need to calculate SOL price for photon
        if (source != "photon") {
            computeSolanaPrice(token_info.usd, source)
        }
    }

    // these sources have a SOL price in the token_info
    if (source == "dexscreener" || source == "photon") {
        if (token_info.sol) {
            solPriceElement.textContent = `${token_info.sol} SOL`;
            solPriceElement.setAttribute("value", token_info.sol);
        }
    }

    if (token_info.usd != null) {

        if (source == "axiom") {
            // usdPriceElement.textContent = `$${token_info.usd}`;
            // usdPriceElement.setAttribute("value", token_info.usd);
            // state.usd = true;
            if (state.values.token_supply != 0) {
                calculateTokenPrice()
                state.usd = true;
            }
        } else {
            usdPriceElement.textContent = `$${token_info.usd}`;
            usdPriceElement.setAttribute("value", token_info.usd);
            state.usd = true;
        }
    }


    token_image.src = token_info.image;
    token_image.onerror = function () {
        // If the image fails to load, set the fallback image
        token_image.src = 'https://tradeflow.fun/images/user_unknown.png';
    };

    // token_image_sell.src = token_info.image;
    // token_image_sell.onerror = function () {
    //     // If the image fails to load, set the fallback image
    //     token_image_sell.src = 'https://tradeflow.fun/images/user_unknown.png';
    // };
}

function calculateRealTimeValue() {
    // real time us valuation update
    if (state.values.token_holdings === undefined) {
        return console.log('Failed to calculate real time value, ISSUE with state.values.token_holdings');
    }

    let balance = state.values.token_holdings;
    let value = parseFloat(data.usd) * parseFloat(balance);
    realtime_usd.textContent = `~$${value.toFixed(2)}`
}

function computeSolanaPrice(usd_price, source) {
    if (state.values.sol_price != null) {
        if (source == "dexscreener") {
            return;
        }
        console.log(`Computing SOL Price for - USD: ${usd_price} SOL PRICE: ${state.values.sol_price} SOURCE: ${source}`)
        let solana_price = parseFloat(usd_price) / parseFloat(state.values.sol_price);

        solPriceElement.setAttribute("value", solana_price.toFixed(10));
        solPriceElement.textContent = `${toShortForm(solana_price.toFixed(10))} SOL`;

    }
}

function fetchTokenBalance(address) {
    console.log('Fetching token balance of ' + address);
    chrome.cookies.get({ url: "https://tradeflow.fun", name: "token" }, (cookie) => {
        if (cookie) {
            const token = cookie.value;
            fetch(`https://tradeflow.fun/api/fetchTokenBalance?address=${encodeURIComponent(address)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    console.log(res)
                    if (res.count !== undefined) {
                        // reset values
                        state.values.token_holdings = 0;
                        token_holding.textContent = '-';

                        // fresh
                        state.values.token_holdings = res.count
                        token_holding.textContent = res.count;

                        state.bool.tokenBalFetched = true;

                        console.log('User balance fetched, fetching configs')
                        // fetch user config
                        // todo, move configs to /hello
                        /*
                        fetch(`https://tradeflow.fun/api/fetchConfig`, {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            },
                        })
                            .then((response) => response.json())
                            .then((res) => {
                                if (res.status) {
                                    slippage_buy_input.value = res.config.buy_slippage;
                                    slippage_sell_input.value = res.config.sell_slippage
                                }

                                // ready
                                checkState();

                                calculateRealTimeValue()
                            })
                            .catch((error) => {
                                console.error("Error:", error);
                            });
                        */

                        checkState();

                        calculateRealTimeValue()

                    } else {
                        alert("Failed to fetch token balance.");
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        } else {
            window.location.href = 'loginRedirect.html'
        }
    });
}

function checkState() {
    if (!state.isReady) {
        console.log('Checking if sufficient data has loaded.')
        let { token_name, usd, mc } = state;
        if (token_name && usd && mc && state.bool.tokenBalFetched) {
            overlayElement.style.display = "none";
            state.isReady = true;
        } else {
            if (!token_name) console.log("Condition failed: token_name is false or undefined");
            if (!usd) console.log("Condition failed: usd is false or undefined");
            if (!mc) console.log("Condition failed: mc is false or undefined");
            if (!state.bool.tokenBalFetched) console.log("Condition failed: state.bool.tokenBalFetched is false");
        }

        setInterval(checkState, 75)
    }
}

function getSupply(address) {
    // edit:
    state.values.token_supply = 1000000000;
    // this is not being used pump.fun tokens have a standard supply of 1B.
    // fetch(`https://tradeflow.fun/api/supply?address=${address}`)
    //     .then(response => response.json())
    //     .then(res => {
    //         console.log(res.supply)
    //         state.values.token_supply = parseFloat(res.supply).toFixed(10)
    //     })
    //     .catch(error => {
    //         // CANT WORK WITH THIS, ALERT THE USER
    //         console.log("Can't fetch supply!")
    //         state.bool.supply = false;
    //     });
}

function calculateTokenPrice() {
    let marketCap = convertShorthandToNumber(data.marketCap)
    console.log(`Calculating for supply: ${state.values.token_supply} & Market Cap: ${marketCap}`)

    let price = (marketCap / state.values.token_supply).toFixed(10);
    // data.axiom.usd = price;
    state.values.axiom_usd = price;
    console.log("PRICE IS " + price)
    usdPriceElement.textContent = `$${price}`;
    usdPriceElement.setAttribute("value", price);
}

buyButton.addEventListener('click', () => {
    buyButton.disabled = true;
    buyButton.innerHTML = `<span class="order-loader"></span>`;
    // disable inputs
    price_buy_input.disabled = true;
    slippage_buy_input.disabled = true;

    chrome.cookies.get({ url: "https://tradeflow.fun", name: "token" }, (cookie) => {
        if (cookie) {
            const token = cookie.value;
            setTimeout(() => {

                let session = data;
                let source = state.values.source;

                if (source == "axiom") {
                    session.usd = state.values.axiom_usd
                }

                if (source != "dexscreener") {
                    let sol_price = solPriceElement.getAttribute("value");
                    session.sol = sol_price;
                }

                let token_info = {
                    ...session,
                    source: state.values.source,
                    order: {
                        price: price_buy_input.value,
                        slippage: slippage_buy_input.value,
                        sol_rate: state.values.sol_price
                    }
                }

                fetch("https://tradeflow.fun/api/v2/order/test-buy", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(token_info),
                })
                    .then((response) => response.ok ? response.json() : Promise.reject("Failed to place order."))
                    .then((data) => {
                        // originally the timer used to be here
                        console.log('ORDER COMPLETE')


                        // token_holding.textContent = '-';
                        // token_info.address = null;
                        // windowClosed();
                        window.location.href = 'static/playground/buy_execute.html';

                        console.log(data);
                    })
                    .catch((error) => {
                        console.error(error);
                        window.location.href = 'static/playground/failed.html';
                    });
            }, 1500);
        } else {
            // send to login
        }
    });
})

sellButton.addEventListener('click', () => {
    sellButton.disabled = true;
    sellButton.innerHTML = `<span class="order-loader"></span>`;
    // disable inputs
    price_sell_input.disabled = true;
    slippage_sell_input.disabled = true;

    chrome.cookies.get({ url: "https://tradeflow.fun", name: "token" }, (cookie) => {
        if (cookie) {
            const token = cookie.value;
            setTimeout(() => {

                let session = data;
                let source = state.values.source;

                if (source == "axiom") {
                    session.usd = state.values.axiom_usd
                }

                if (source != "dexscreener") {
                    let sol_price = solPriceElement.getAttribute("value");
                    session.sol = sol_price;
                }

                let token_info = {
                    ...session,
                    source: state.values.source,
                    order: {
                        price: price_sell_input.value,
                        slippage: slippage_sell_input.value,
                        sol_rate: state.values.sol_price
                    }
                }

                fetch("https://tradeflow.fun/api/v2/order/test-sell", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(token_info),
                })
                    .then((response) => response.ok ? response.json() : Promise.reject("Failed to place order."))
                    .then((data) => {
                        // originally the timer used to be here
                        console.log('ORDER COMPLETE')


                        // token_holding.textContent = '-';
                        // token_info.address = null;
                        // windowClosed();
                        // window.location.href = nextPage;
                        window.location.href = 'static/playground/sell_execute.html';

                        console.log(data);
                    })
                    .catch((error) => {
                        console.error(error);
                        window.location.href = 'static/playground/failed.html';
                    });
            }, 1500);
        } else {
            // send to login
        }
    });
})


// NUMBER HELPERS
// convert a long number to short hand
function toShortForm(num) {
    let str = num.toString(); // Convert to string
    const subscriptMap = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    if (str.includes("e")) {
        str = num.toFixed(20); // Convert scientific notation to full decimal
    }

    let match = str.match(/0\.0*(\d+)/); // Match leading zeros after decimal and capture digits

    if (!match) return str; // Return original if no match

    let zeroCount = match[0].length - match[1].length - 2; // Count leading zeros after "0."
    let significantDigits = match[1].slice(0, 4); // Take first 4 significant digits

    let subscript = zeroCount.toString().split('').map(digit => subscriptMap[digit] || digit).join('');

    return `0.0${subscript}${significantDigits}`;
}

// convert a 3.5k to 3500
function convertShorthandToNumber(shorthand) {
    const units = {
        'K': 1_000,
        'M': 1_000_000,
        'B': 1_000_000_000
    };

    const unit = shorthand.slice(-1);
    const number = parseFloat(shorthand.slice(0, -1));

    if (units[unit]) {
        return number * units[unit];
    } else {
        return parseFloat(shorthand);
    }
}

// Notify background.js that the popup is ready
port.postMessage({ action: "ready" });

// Handle popup close (optional)
window.addEventListener("unload", () => {
    port.disconnect();
});