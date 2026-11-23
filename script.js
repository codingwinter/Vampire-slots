
// ============================================
// VAMPIRE SLOTS
// Main game and bonus game
// ============================================


// ============================================
// 1. GAME SETTINGS
// ============================================

const ROWS = 4;
const COLUMNS = 4;

let balance = Number(
    localStorage.getItem("vampireBalance")
);

if (!Number.isFinite(balance) || balance < 0) {
    balance = 1000;
}

let bet = 10;
let isSpinning = false;
let bonusActive = false;


// ============================================
// 2. NORMAL GAME SYMBOLS
// ============================================

const symbols = [

    {
        name: "fangs",
        image: "assets/fangs.png",
        payout: 100,
        weight: 18
    },

    {
        name: "blooddrop",
        image: "assets/blooddrop.png",
        payout: 50,
        weight: 18
    },

    {
        name: "bat",
        image: "assets/bat.png",
        payout: 10,
        weight: 20
    },

    {
        name: "extra",
        image: "assets/extra.png",
        payout: 0,
        weight: 10
    },

    {
        name: "skull",
        image: "assets/skull.png",
        payout: 10,
        weight: 20
    },

    {
        name: "eye",
        image: "assets/eye.png",
        payout: 1000,
        weight: 14
    }

];


// ============================================
// 3. BONUS GAME SYMBOLS
// ============================================

const bonusSymbols = [

    {
        name: "fangs",
        image: "assets/fangs.png",
        payout: 0,
        weight: 65
    },

    {
        name: "coin",
        image: "assets/coin.png",
        payout: 1,
        weight: 25
    },

    {
        name: "mini",
        image: "assets/mini.png",
        payout: 10,
        weight: 6
    },

    {
        name: "major",
        image: "assets/major.png",
        payout: 100,
        weight: 3
    },

    {
        name: "grand",
        image: "assets/grand.png",
        payout: 1000,
        weight: 1
    }

];


// ============================================
// 4. HTML ELEMENTS
// ============================================

const reels = document.getElementById("reels");

const balanceDisplay =
    document.getElementById("balance");

const betDisplay =
    document.getElementById("betDisplay");

const message =
    document.getElementById("message");

const spinButton =
    document.getElementById("spinButton");

const increaseBet =
    document.getElementById("increaseBet");

const decreaseBet =
    document.getElementById("decreaseBet");

const resetButton =
    document.getElementById("resetButton");


// Bonus game elements

const bonusOverlay =
    document.getElementById("bonusOverlay");

const bonusGrid =
    document.getElementById("bonusGrid");

const spinsLeftDisplay =
    document.getElementById("spinsLeft");

const bonusWinDisplay =
    document.getElementById("bonusWin");

const bonusMessage =
    document.getElementById("bonusMessage");

const bonusSpinButton =
    document.getElementById("bonusSpinButton");

const collectButton =
    document.getElementById("collectButton");


// ============================================
// 5. SAVE AND UPDATE DISPLAY
// ============================================

function saveGame() {

    localStorage.setItem(
        "vampireBalance",
        balance
    );

}


function updateDisplay() {

    balanceDisplay.textContent =
        balance.toLocaleString();

    betDisplay.textContent =
        bet.toLocaleString();

    increaseBet.disabled =
        isSpinning ||
        bonusActive ||
        bet >= balance;

    decreaseBet.disabled =
        isSpinning ||
        bonusActive ||
        bet <= 1;

    spinButton.disabled =
        isSpinning ||
        bonusActive ||
        balance < bet;

    saveGame();

}


// ============================================
// 6. RANDOM SYMBOL GENERATOR
// ============================================

function getRandomSymbol(symbolList) {

    const totalWeight = symbolList.reduce(
        (total, symbol) => total + symbol.weight,
        0
    );

    let random = Math.random() * totalWeight;

    for (const symbol of symbolList) {

        random -= symbol.weight;

        if (random < 0) {
            return symbol;
        }

    }

    return symbolList[0];

}


// ============================================
// 7. CREATE NORMAL GRID
// ============================================

function createGrid() {

    reels.innerHTML = "";

    for (let i = 0; i < 16; i++) {

        const symbol =
            getRandomSymbol(symbols);

        const cell =
            document.createElement("div");

        cell.className = "symbol";

        const image =
            document.createElement("img");

        image.src = symbol.image;
        image.alt = symbol.name;

        cell.appendChild(image);

        reels.appendChild(cell);

    }

}


// ============================================
// 8. READ NORMAL GRID
// ============================================

function getGrid() {

    const grid = [];

    for (let row = 0; row < ROWS; row++) {

        const currentRow = [];

        for (let col = 0; col < COLUMNS; col++) {

            const index =
                row * COLUMNS + col;

            const image =
                reels.children[index].querySelector("img");

            const symbol = symbols.find(
                item => item.name === image.alt
            );

            currentRow.push(symbol);

        }

        grid.push(currentRow);

    }

    return grid;

}


// ============================================
// 9. CHECK NORMAL WINNING ROWS
// ============================================

function checkWins(grid) {

    let totalWin = 0;

    let winningCells = [];

    let bonusTriggered = false;

    let winningNames = [];

    for (let row = 0; row < ROWS; row++) {

        const firstSymbol = grid[row][0];

        const allMatch = grid[row].every(
            symbol => symbol.name === firstSymbol.name
        );

        if (!allMatch) {
            continue;
        }

        winningNames.push(firstSymbol.name);

        // EXTRA starts the bonus game

        if (firstSymbol.name === "extra") {

            bonusTriggered = true;

            continue;

        }

        // Calculate normal payouts

        totalWin += firstSymbol.payout;

        // Highlight all four winning positions

        for (let col = 0; col < COLUMNS; col++) {

            winningCells.push(
                row * COLUMNS + col
            );

        }

    }

    return {
        totalWin,
        winningCells,
        bonusTriggered,
        winningNames
    };

}


// ============================================
// 10. HIGHLIGHT WINNING SYMBOLS
// ============================================

function highlightWins(cellsToHighlight) {

    for (const index of cellsToHighlight) {

        reels.children[index].classList.add(
            "winning"
        );

    }

}


// ============================================
// 11. NORMAL SPIN
// ============================================

function spin() {

    if (
        isSpinning ||
        bonusActive ||
        balance < bet
    ) {
        return;
    }

    isSpinning = true;

    balance -= bet;

    updateDisplay();

    message.textContent = "SPINNING...";

    createGrid();

    setTimeout(() => {

        const grid = getGrid();

        const result = checkWins(grid);

        // Add normal winnings

        balance += result.totalWin;

        highlightWins(result.winningCells);

        if (result.totalWin > 0) {

            message.textContent =
                "YOU WON " +
                result.totalWin +
                " VAMPCOINS!";

        } else {

            message.textContent = "NO WIN...";

        }

        // Finish normal spin before bonus starts

        isSpinning = false;

        updateDisplay();

        // Open bonus game if EXTRA row appeared

        if (result.bonusTriggered) {

            message.textContent =
                "EXTRA BONUS UNLOCKED!";

            setTimeout(() => {

                startBonusGame();

            }, 1200);

        }

        else if (balance < bet) {

            message.textContent =
                "NOT ENOUGH VAMPCOINS!";

        }

    }, 1000);

}


// ============================================
// 12. BET CONTROLS
// ============================================

increaseBet.addEventListener("click", () => {

    if (
        !isSpinning &&
        !bonusActive &&
        bet < balance
    ) {

        bet = Math.min(bet + 10, balance);

        updateDisplay();

    }

});


decreaseBet.addEventListener("click", () => {

    if (
        !isSpinning &&
        !bonusActive
    ) {

        bet = Math.max(1, bet - 10);

        updateDisplay();

    }

});


spinButton.addEventListener("click", spin);


// ============================================
// 13. BONUS GAME SETTINGS
// ============================================

let bonusSpinsLeft = 20;

let bonusTotal = 0;

let bonusCells = [];

let collectedJackpots = [];

let bonusSpinning = false;


// ============================================
// 14. START BONUS GAME
// ============================================

function startBonusGame() {

    bonusActive = true;

    bonusSpinsLeft = 20;

    bonusTotal = 0;

    collectedJackpots = [];

    bonusSpinning = false;

    // Create 16 empty bonus positions

    bonusCells = Array.from(
        { length: 16 },
        () => null
    );

    bonusGrid.innerHTML = "";

    for (let i = 0; i < 16; i++) {

        const cell =
            document.createElement("div");

        cell.className = "bonus-cell";

        cell.id = "bonus-cell-" + i;

        bonusGrid.appendChild(cell);

    }

    spinsLeftDisplay.textContent =
        bonusSpinsLeft;

    bonusWinDisplay.textContent =
        bonusTotal;

    bonusMessage.textContent =
        "COLLECT YOUR PRIZES!";

    bonusSpinButton.classList.remove("hidden");

    bonusSpinButton.disabled = false;

    collectButton.classList.add("hidden");

    bonusOverlay.classList.remove("hidden");

    updateDisplay();

}


// ============================================
// 15. BONUS SYMBOL GENERATOR
// ============================================

function getBonusSymbol() {

    // Big prizes can only be collected once

    const availableSymbols =
        bonusSymbols.filter(symbol => {

            if (
                symbol.name === "mini" ||
                symbol.name === "major" ||
                symbol.name === "grand"
            ) {

                return !collectedJackpots.includes(
                    symbol.name
                );

            }

            return true;

        });

    return getRandomSymbol(availableSymbols);

}


// ============================================
// 16. DISPLAY BONUS SYMBOL
// ============================================

function displayBonusSymbol(index, symbol) {

    const cell = document.getElementById(
        "bonus-cell-" + index
    );

    cell.innerHTML = "";

    const image =
        document.createElement("img");

    image.src = symbol.image;
    image.alt = symbol.name;

    cell.appendChild(image);

    cell.classList.add("locked");

}


// ============================================
// 17. BONUS SPIN
// ============================================

function bonusSpin() {

    if (
        !bonusActive ||
        bonusSpinning ||
        bonusSpinsLeft <= 0
    ) {
        return;
    }

    bonusSpinning = true;

    bonusSpinButton.disabled = true;

    bonusMessage.textContent =
        "SPINNING FOR PRIZES...";

    // Reduce remaining spins

    bonusSpinsLeft--;

    spinsLeftDisplay.textContent =
        bonusSpinsLeft;

    let newPrizes = 0;

    let newPrizeNames = [];

    // Roll all positions that are not locked

    for (let i = 0; i < 16; i++) {

        // Already collected positions stay locked

        if (bonusCells[i] !== null) {
            continue;
        }

        const symbol = getBonusSymbol();

        // Fangs give no prize and do not lock

        if (symbol.name === "fangs") {
            continue;
        }

        // Lock the new prize

        bonusCells[i] = symbol;

        newPrizes++;

        newPrizeNames.push(symbol.name);

        displayBonusSymbol(i, symbol);

        // Add prize value

        bonusTotal += symbol.payout;

        // Big jackpots only once per bonus round

        if (
            symbol.name === "mini" ||
            symbol.name === "major" ||
            symbol.name === "grand"
        ) {

            collectedJackpots.push(
                symbol.name
            );

        }

    }

    bonusWinDisplay.textContent =
        bonusTotal.toLocaleString();

    // Show result

    setTimeout(() => {

        if (newPrizes > 0) {

            bonusMessage.textContent =
                "NEW PRIZE: " +
                newPrizeNames.join(", ").toUpperCase();

        } else {

            bonusMessage.textContent =
                "NO NEW PRIZES!";

        }

        // Check if all 16 positions are locked

        const allLocked = bonusCells.every(
            cell => cell !== null
        );

        // End if no spins remain or grid is full

        if (
            bonusSpinsLeft <= 0 ||
            allLocked
        ) {

            finishBonusGame();

        } else {

            bonusSpinning = false;

            bonusSpinButton.disabled = false;

        }

    }, 700);

}


// ============================================
// 18. FINISH BONUS GAME
// ============================================

function finishBonusGame() {

    bonusSpinning = false;

    bonusSpinButton.disabled = true;

    bonusSpinButton.classList.add("hidden");

    bonusMessage.textContent =
        "BONUS COMPLETE!";

    collectButton.classList.remove("hidden");

}


// ============================================
// 19. COLLECT BONUS PRIZES
// ============================================

function collectBonus() {

    if (
        !bonusActive ||
        bonusSpinning
    ) {
        return;
    }

    balance += bonusTotal;

    saveGame();

    bonusMessage.textContent =
        "YOU COLLECTED " +
        bonusTotal +
        " VAMPCOINS!";

    bonusActive = false;

    bonusOverlay.classList.add("hidden");

    message.textContent =
        "BONUS COMPLETE!";

    updateDisplay();

    if (balance < bet) {

        message.textContent =
            "NOT ENOUGH VAMPCOINS!";

    }

}


// ============================================
// 20. BONUS BUTTONS
// ============================================

bonusSpinButton.addEventListener(
    "click",
    bonusSpin
);

collectButton.addEventListener(
    "click",
    collectBonus
);


// ============================================
// 21. RESET GAME
// ============================================

resetButton.addEventListener("click", () => {

    if (
        isSpinning ||
        bonusActive
    ) {
        return;
    }

    balance = 1000;

    bet = 10;

    message.textContent =
        "GOOD LUCK...";

    createGrid();

    updateDisplay();

});


// ============================================
// 22. START GAME
// ============================================

createGrid();

updateDisplay();
