// buy presets
const buy = document.getElementById("price_buy_input");
const buy_p1 = document.getElementById("buy_p1"); // buy = 0.01
const buy_p2 = document.getElementById("buy_p2"); // buy = 0.02
const buy_p3 = document.getElementById("buy_p3"); // buy = 0.5
const buy_p4 = document.getElementById("buy_p4"); // buy = 1

buy_p1.addEventListener("click", () => { buy.value = 0.01; buyInputDispatch(); });
buy_p2.addEventListener("click", () => { buy.value = 0.02; buyInputDispatch(); });
buy_p3.addEventListener("click", () => { buy.value = 0.5; buyInputDispatch(); });
buy_p4.addEventListener("click", () => { buy.value = 1; buyInputDispatch(); });

function buyInputDispatch() {
    buy.dispatchEvent(new Event('input'));
}

// buy slippage
const buy_slippage = document.getElementById("slippage_buy_input");
const buy_slippage_p1 = document.getElementById("buy_slippage_p1"); // buy_slippage = 0.1% 
const buy_slippage_p2 = document.getElementById("buy_slippage_p2"); // buy_slippage = 0.5%
const buy_slippage_p3 = document.getElementById("buy_slippage_p3"); // buy_slippage = 1%

buy_slippage_p1.addEventListener("click", () => { buy_slippage.value = 0.1; buySlippageInputDispatch(); });
buy_slippage_p2.addEventListener("click", () => { buy_slippage.value = 0.5; buySlippageInputDispatch(); });
buy_slippage_p3.addEventListener("click", () => { buy_slippage.value = 1; buySlippageInputDispatch(); });

function buySlippageInputDispatch() {
    buy_slippage.dispatchEvent(new Event('input'));
}

// sell presets
let holdings = document.getElementById('token_holding').textContent;
const sell = document.getElementById("price_sell_input");
const sell_p1 = document.getElementById("sell_p1"); // sell = 25% of holdings
const sell_p2 = document.getElementById("sell_p2"); // sell = 50% of holdings
const sell_p3 = document.getElementById("sell_p3"); // sell = 100% of holdings

function sellPreset(e) {
    let holdings = document.getElementById('token_holding').textContent;
    holdings = parseFloat(holdings);
    if (holdings == 'NaN') {
        return;
    }

    sell.value = holdings * e;
}

sell_p1.addEventListener("click", () => { sellPreset(0.25); sellInputDispatch(); });
sell_p2.addEventListener("click", () => { sellPreset(0.5); sellInputDispatch(); });
sell_p3.addEventListener("click", () => { sellPreset(1); sellInputDispatch(); });

function sellInputDispatch() {
    sell.dispatchEvent(new Event('input'));
}

// sell slippage
const sell_slippage = document.getElementById("slippage_sell_input");
const sell_slippage_p1 = document.getElementById("sell_slippage_p1"); // sell_slippage = 0.1%
const sell_slippage_p2 = document.getElementById("sell_slippage_p2"); // sell_slippage = 0.5%
const sell_slippage_p3 = document.getElementById("sell_slippage_p3"); // sell_slippage = 1%

sell_slippage_p1.addEventListener("click", () => { sell_slippage.value = 0.1; sellSlippageInputDispatch(); });
sell_slippage_p2.addEventListener("click", () => { sell_slippage.value = 0.5; sellSlippageInputDispatch(); });
sell_slippage_p3.addEventListener("click", () => { sell_slippage.value = 1; sellSlippageInputDispatch(); });

function sellSlippageInputDispatch() {
    sell_slippage.dispatchEvent(new Event('input'));
}