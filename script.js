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
