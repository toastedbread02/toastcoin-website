const API = "https://toastcoin-exchange.dominikkoba22.workers.dev";


let currentRange = "1M";


function money(value) {

    return Number(value || 0)
        .toFixed(4);
}


function number(value) {

    return Number(value || 0)
        .toLocaleString(
            undefined,
            {
                maximumFractionDigits: 8
            }
        );
}


async function api(
    endpoint,
    options = {}
) {

    const response =
        await fetch(
            API + endpoint,
            options
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.error ||
            "Request failed"
        );
    }


    return data;
}


async function loadMarket() {

    try {

        const data =
            await api(
                "/api/market"
            );


        document
            .getElementById("price")
            .textContent =
            money(data.price) +
            " CHF";


        document
            .getElementById("marketInfo")
            .textContent =
            "24h volume: " +
            number(data.volume24h) +
            " TOAST  •  " +
            "Supply: " +
            number(data.supply);


    } catch (error) {

        console.error(error);

    }
}


async function loadChart() {

    try {

        const result =
            await api(
                "/api/history?range=" +
                currentRange
            );


        drawChart(
            result.data
        );


    } catch (error) {

        console.error(error);

    }
}


function drawChart(data) {

    const canvas =
        document.getElementById(
            "chart"
        );


    const empty =
        document.getElementById(
            "chartEmpty"
        );


    const ctx =
        canvas.getContext("2d");


    const rect =
        canvas.getBoundingClientRect();


    const ratio =
        window.devicePixelRatio || 1;


    canvas.width =
        rect.width * ratio;


    canvas.height =
        rect.height * ratio;


    ctx.scale(
        ratio,
        ratio
    );


    const width =
        rect.width;


    const height =
        rect.height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (!data || data.length < 2) {

        empty.style.display =
            "flex";

        return;

    }


    empty.style.display =
        "none";


    const prices =
        data.map(
            item =>
                Number(item.price)
        );


    const min =
        Math.min(...prices);


    const max =
        Math.max(...prices);


    const padding = 30;


    const range =
        max - min || 1;


    ctx.beginPath();


    data.forEach(
        (item, index) => {

            const x =
                padding +
                (
                    index /
                    (data.length - 1)
                ) *
                (width - padding * 2);


            const y =
                height -
                padding -
                (
                    (
                        Number(item.price) -
                        min
                    ) /
                    range
                ) *
                (height - padding * 2);


            if (index === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );
            }

        }
    );


    ctx.strokeStyle =
        "#e4a03a";

    ctx.lineWidth = 2;

    ctx.stroke();


    // Draw price labels.

    ctx.fillStyle =
        "#666";

    ctx.font =
        "12px sans-serif";


    ctx.fillText(
        max.toFixed(5),
        5,
        padding
    );


    ctx.fillText(
        min.toFixed(5),
        5,
        height - padding
    );

}


async function loadOrderBook() {

    try {

        const data =
            await api(
                "/api/orderbook"
            );


        const asks =
            document.getElementById(
                "asks"
            );


        const bids =
            document.getElementById(
                "bids"
            );


        asks.innerHTML =
            data.asks.length
                ? data.asks
                    .map(
                        order => `
                            <div class="order-row ask">
                                <span>
                                    ${money(order.price)}
                                </span>
                                <span>
                                    ${number(order.amount)}
                                </span>
                            </div>
                        `
                    )
                    .join("")
                : `<div class="hint">No asks</div>`;


        bids.innerHTML =
            data.bids.length
                ? data.bids
                    .map(
                        order => `
                            <div class="order-row bid">
                                <span>
                                    ${money(order.price)}
                                </span>
                                <span>
                                    ${number(order.amount)}
                                </span>
                            </div>
                        `
                    )
                    .join("")
                : `<div class="hint">No bids</div>`;


    } catch (error) {

        console.error(error);

    }
}


async function loadTrades() {

    try {

        const data =
            await api(
                "/api/trades"
            );


        const container =
            document.getElementById(
                "trades"
            );


        if (!data.trades.length) {

            container.innerHTML =
                `<div class="hint">
                    No trades yet.
                </div>`;

            return;
        }


        container.innerHTML =
            data.trades
                .map(
                    trade => `
                        <div class="trade-row">
                            <span>
                                ${money(trade.price)}
                            </span>

                            <span>
                                ${number(trade.amount)}
                            </span>
                        </div>
                    `
                )
                .join("");


    } catch (error) {

        console.error(error);

    }
}


async function loadWallet() {

    const address =
        document
            .getElementById(
                "walletAddress"
            )
            .value
            .trim();


    if (!address) {

        alert(
            "Enter a wallet address."
        );

        return;
    }


    localStorage.setItem(
        "toastWallet",
        address
    );


    await refreshWallet();

}


async function refreshWallet() {

    const address =
        localStorage.getItem(
            "toastWallet"
        );


    if (!address) {
        return;
    }


    document
        .getElementById(
            "walletAddress"
        )
        .value =
        address;


    try {

        const data =
            await api(
                "/api/balance?address=" +
                encodeURIComponent(
                    address
                )
            );


        document
            .getElementById(
                "toastBalance"
            )
            .textContent =
            number(data.toast);


        document
            .getElementById(
                "toastLocked"
            )
            .textContent =
            number(data.toast_locked);


        document
            .getElementById(
                "chfBalance"
            )
            .textContent =
            Number(data.chf)
                .toFixed(2);


        document
            .getElementById(
                "chfLocked"
            )
            .textContent =
            Number(data.chf_locked)
                .toFixed(2);


        loadMyOrders(address);


    } catch (error) {

        console.error(error);

    }
}


async function loadMyOrders(address) {

    /*
     * The current Worker doesn't expose
     * personal orders yet.
     *
     * We'll add that endpoint next.
     */

    document
        .getElementById(
            "myOrders"
        )
        .innerHTML =
        `<div class="hint">
            Open-order history will appear here
            after the wallet endpoint is added.
        </div>`;
}


async function placeBuy() {

    const address =
        localStorage.getItem(
            "toastWallet"
        );


    if (!address) {

        alert(
            "Load a wallet first."
        );

        return;
    }


    const amount =
        Number(
            document
                .getElementById(
                    "buyAmount"
                )
                .value
        );


    const price =
        Number(
            document
                .getElementById(
                    "buyPrice"
                )
                .value
        );


    if (
        !amount ||
        amount <= 0 ||
        !price ||
        price <= 0
    ) {

        alert(
            "Enter a valid amount and price."
        );

        return;
    }


    try {

        await api(
            "/api/order",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        address,
                        side: "buy",
                        amount,
                        price
                    })
            }
        );


        alert(
            "Buy order placed!"
        );


        await refreshAll();


    } catch (error) {

        alert(
            error.message
        );

    }
}


async function placeSell() {

    const address =
        localStorage.getItem(
            "toastWallet"
        );


    if (!address) {

        alert(
            "Load a wallet first."
        );

        return;
    }


    const amount =
        Number(
            document
                .getElementById(
                    "sellAmount"
                )
                .value
        );


    const price =
        Number(
            document
                .getElementById(
                    "sellPrice"
                )
                .value
        );


    if (
        !amount ||
        amount <= 0 ||
        !price ||
        price <= 0
    ) {

        alert(
            "Enter a valid amount and price."
        );

        return;
    }


    try {

        await api(
            "/api/order",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        address,
                        side: "sell",
                        amount,
                        price
                    })
            }
        );


        alert(
            "Sell order placed!"
        );


        await refreshAll();


    } catch (error) {

        alert(
            error.message
        );

    }
}


async function claimFaucet() {

    const address =
        localStorage.getItem(
            "toastWallet"
        );


    if (!address) {

        alert(
            "Load a wallet first."
        );

        return;
    }


    const message =
        document.getElementById(
            "faucetMessage"
        );


    message.textContent =
        "Claiming...";


    try {

        const data =
            await api(
                "/api/faucet",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            address
                        })
                }
            );


        if (data.success) {

            message.textContent =
                "Received " +
                number(data.toast) +
                " TOAST and " +
                Number(data.chf)
                    .toFixed(2) +
                " test CHF.";

        } else {

            const minutes =
                Math.ceil(
                    data.cooldown / 60
                );


            message.textContent =
                "Come back in " +
                minutes +
                " minutes.";
        }


        await refreshAll();


    } catch (error) {

        message.textContent =
            error.message;
    }
}


function updateTotals() {

    const buyAmount =
        Number(
            document
                .getElementById(
                    "buyAmount"
                )
                .value
        ) || 0;


    const buyPrice =
        Number(
            document
                .getElementById(
                    "buyPrice"
                )
                .value
        ) || 0;


    const sellAmount =
        Number(
            document
                .getElementById(
                    "sellAmount"
                )
                .value
        ) || 0;


    const sellPrice =
        Number(
            document
                .getElementById(
                    "sellPrice"
                )
                .value
        ) || 0;


    document
        .getElementById(
            "buyTotal"
        )
        .textContent =
        "Total: " +
        (buyAmount * buyPrice)
            .toFixed(4) +
        " CHF";


    document
        .getElementById(
            "sellTotal"
        )
        .textContent =
        "Value: " +
        (sellAmount * sellPrice)
            .toFixed(4) +
        " CHF";
}


async function refreshAll() {

    await Promise.all([
        loadMarket(),
        loadChart(),
        loadOrderBook(),
        loadTrades(),
        refreshWallet()
    ]);

}


document
    .querySelectorAll(".range")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    document
                        .querySelectorAll(
                            ".range"
                        )
                        .forEach(
                            b =>
                                b.classList
                                    .remove(
                                        "active"
                                    )
                        );


                    button.classList
                        .add("active");


                    currentRange =
                        button.dataset.range;


                    await loadChart();

                }
            );

        }
    );


document
    .querySelectorAll("input")
    .forEach(
        input => {

            input.addEventListener(
                "input",
                updateTotals
            );

        }
    );


refreshAll();


setInterval(
    refreshAll,
    10000
);

const minerWallet = document.getElementById("wallet");
const mineButton = document.getElementById("mineButton");
const minerStatus = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const minedElement = document.getElementById("mined");
const progressElement = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const hashrateElement = document.getElementById("hashrate");
const timeElement = document.getElementById("time");

let mining = false;
let miningStart = 0;
let miningTimer = null;
let miningSession = null;

const MINING_DURATION = 10 * 60 * 1000;
const MINING_REWARD = 100;

function formatTime(milliseconds) {
const totalSeconds = Math.max(
0,
Math.ceil(milliseconds / 1000)
);

```
const minutes = Math.floor(totalSeconds / 60);
const seconds = totalSeconds % 60;

return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
);
```

}

function setMinerStatus(text, active) {
minerStatus.textContent = text;

```
if (active) {
    statusDot.classList.add("active");
} else {
    statusDot.classList.remove("active");
}
```

}

function updateMinerUI() {
if (!mining) {
return;
}

```
const elapsed = Date.now() - miningStart;
const remaining = Math.max(
    0,
    MINING_DURATION - elapsed
);

const progress = Math.min(
    100,
    (elapsed / MINING_DURATION) * 100
);

const earned =
    (progress / 100) * MINING_REWARD;

progressElement.style.width =
    progress + "%";

progressText.textContent =
    Math.floor(progress) +
    "% • " +
    formatTime(remaining) +
    " remaining";

timeElement.textContent =
    formatTime(remaining);

minedElement.textContent =
    earned.toFixed(4);

// Lightweight simulated hashrate display.
const hashRate =
    Math.floor(
        850 +
        Math.random() * 350
    );

hashrateElement.textContent =
    hashRate.toLocaleString() +
    " H/s";

if (remaining <= 0) {
    finishMining();
}
```

}

async function startMining() {
if (mining) {
return;
}

```
const address =
    minerWallet.value.trim();

if (!address) {
    alert(
        "Enter your ToastCoin wallet address first."
    );

    minerWallet.focus();

    return;
}

mineButton.disabled = true;
mineButton.textContent = "Starting...";

try {
    const response = await api(
        "/api/miner/start",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                address
            })
        }
    );

    miningSession =
        response.sessionId ||
        response.session_id ||
        response;

    localStorage.setItem(
        "toastMinerWallet",
        address
    );

    mining = true;
    miningStart = Date.now();

    setMinerStatus(
        "Mining TOAST...",
        true
    );

    mineButton.disabled = false;
    mineButton.textContent =
        "Stop Mining";

    progressElement.style.width =
        "0%";

    minedElement.textContent =
        "0.0000";

    clearInterval(miningTimer);

    miningTimer = setInterval(
        updateMinerUI,
        250
    );

    updateMinerUI();

} catch (error) {
    console.error(
        "Miner start error:",
        error
    );

    mineButton.disabled = false;
    mineButton.textContent =
        "Start Mining";

    setMinerStatus(
        "Unable to start mining",
        false
    );

    alert(
        error.message ||
        "Could not start ToastMiner."
    );
}
```

}

async function finishMining() {
if (!mining) {
return;
}

```
mining = false;

clearInterval(miningTimer);
miningTimer = null;

mineButton.disabled = true;
mineButton.textContent =
    "Claiming TOAST...";

setMinerStatus(
    "Mining complete",
    false
);

progressElement.style.width =
    "100%";

progressText.textContent =
    "100% • Mining complete";

timeElement.textContent =
    "00:00";

minedElement.textContent =
    MINING_REWARD.toFixed(4);

try {
    const address =
        minerWallet.value.trim();

    const result = await api(
        "/api/miner/claim",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                address,
                sessionId:
                    miningSession
            })
        }
    );

    const reward =
        Number(
            result.reward ||
            result.toast ||
            MINING_REWARD
        );

    minedElement.textContent =
        reward.toFixed(4);

    setMinerStatus(
        "Reward claimed",
        false
    );

    mineButton.disabled = false;
    mineButton.textContent =
        "Start Mining";

    alert(
        "You mined " +
        reward.toFixed(4) +
        " TOAST!"
    );

    if (typeof refreshAll === "function") {
        await refreshAll();
    }

} catch (error) {
    console.error(
        "Miner claim error:",
        error
    );

    setMinerStatus(
        "Claim failed",
        false
    );

    mineButton.disabled = false;
    mineButton.textContent =
        "Start Mining";

    alert(
        error.message ||
        "Could not claim your mining reward."
    );
}
```

}

async function stopMining() {
if (!mining) {
return;
}

```
const address =
    minerWallet.value.trim();

mining = false;

clearInterval(miningTimer);
miningTimer = null;

mineButton.disabled = true;
mineButton.textContent =
    "Stopping...";

try {
    await api(
        "/api/miner/stop",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                address,
                sessionId:
                    miningSession
            })
        }
    );

} catch (error) {
    console.error(
        "Miner stop error:",
        error
    );
}

setMinerStatus(
    "Mining stopped",
    false
);

mineButton.disabled = false;
mineButton.textContent =
    "Start Mining";

progressElement.style.width =
    "0%";

progressText.textContent =
    "0% • 10:00 remaining";

timeElement.textContent =
    "10:00";

minedElement.textContent =
    "0.0000";

hashrateElement.textContent =
    "0 H/s";
```

}

if (mineButton) {
mineButton.addEventListener(
"click",
() => {
if (mining) {
stopMining();
} else {
startMining();
}
}
);
}

const savedMinerWallet =
localStorage.getItem(
"toastMinerWallet"
);

if (
savedMinerWallet &&
minerWallet
) {
minerWallet.value =
savedMinerWallet;
}
