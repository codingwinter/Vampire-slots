
// ==========================================
// VAMPIRE SLOTS
// 4 columns x 3 rows
// Virtual VampCoins only
// ==========================================

// ---------- SETTINGS ----------

const COLUMNS = 4;
const ROWS = 3;
const TOTAL_CELLS = COLUMNS * ROWS;
const BONUS_MAX_SPINS = 20;

let savedBalance = localStorage.getItem("vampireBalance");
let balance = savedBalance === null ? 1000 : Number(savedBalance);
let bet = 10;

const MIN_BET = 1;
const MAX_BET = 100;

// Normal game weights add up to 100.

const normalSymbols = [
    { name: "fangs", weight: 46 },
    { name: "blooddrop", weight: 14 },
    { name: "bat", weight: 10 },
    { name: "extra", weight: 20 },
    { name: "skull", weight: 7 },
    { name: "eye", weight: 3 }
];

// Bonus game weights.

const bonusSymbols = [
    { name: "fangs", weight: 65, payout: 0 },
    { name: "coin", weight: 25, payout: 1 },
    { name: "mini", weight: 6, payout: 10 },
    { name: "major", weight: 3, payout: 100 },
    { name: "grand", weight: 1, payout: 1000 }
];

// ---------- HTML ELEMENTS ----------

const balanceDisplay = document.getElementById("balance");
const betDisplay = document.getElementById("betDisplay");

const reels = document.getElementById("reels");
const message = document.getElementById("message");

const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");

const decreaseBetButton = document.getElementById("decreaseBet");
const increaseBetButton = document.getElementById("increaseBet");

const bonusOverlay = document.getElementById("bonusOverlay");
const bonusGrid = document.getElementById("bonusGrid");
const bonusSpinsDisplay = document.getElementById("bonusSpins");
const bonusTotalDisplay = document.getElementById("bonusTotal");
const bonusMessage = document.getElementById("bonusMessage");

const bonusSpinButton = document.getElementById("bonusSpinButton");
const collectButton = document.getElementById("collectButton");

// ---------- GAME VARIABLES ----------

let isSpinning = false;
let bonusActive = false;
let bonusFinished = false;

let bonusSpinsLeft = BONUS_MAX_SPINS;
let bonusTotal = 0;

let bonusCells = [];
let collectedJackpots = [];

// ---------- DISPLAY FUNCTIONS ----------

function saveBalance() {
    localStorage.setItem("vampireBalance", balance);
}

function updateDisplays() {
    if (balanceDisplay) {
        balanceDisplay.textContent = balance;
    }

    if (betDisplay) {
        betDisplay.textContent = bet;
    }

    if (bonusSpinsDisplay) {
        bonusSpinsDisplay.textContent = bonusSpinsLeft;
    }

    if (bonusTotalDisplay) {
        bonusTotalDisplay.textContent = bonusTotal;
    }
}

// ---------- RANDOM SYMBOL ----------

function randomSymbol(symbolList) {
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

// ---------- SYMBOL DISPLAY ----------

function createSymbolContent(symbolName) {
    const wrapper = document.createElement("div");
    wrapper.className = "symbol-content";

    const label = document.createElement("span");
    label.className = "symbol-label";
    label.textContent = symbolName.toUpperCase();

    const img = document.createElement("img");
    img.src = `assets/${symbolName}.png`;
    img.alt = symbolName;
    img.className = "symbol-image";

    img.onload = function () {
        label.style.display = "none";
    };

    img.onerror = function () {
        img.style.display = "block";
        img.remove();
    };

    wrapper.appendChild(img);
    wrapper.appendChild(label);

    return wrapper;
}

function createNormalCell(symbolName) {
    const cell = document.createElement("div");
    cell.className = "symbol";
    cell.appendChild(createSymbolContent(symbolName));

    return cell;
}

// ---------- NORMAL GAME GRID ----------

function createNormalGrid() {
    const grid = [];

    for (let row = 0; row < ROWS; row++) {
        grid[row] = [];

        for (let col = 0; col < COLUMNS; col++) {
            grid[row][col] = randomSymbol(normalSymbols);
        }
    }

    return grid;
}

function displayNormalGrid(grid) {
    if (!reels) return;

    reels.innerHTML = "";

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            reels.appendChild(
                createNormalCell(grid[row][col].name)
            );
        }
    }
}

// ---------- CHECK NORMAL WINS ----------

function checkNormalWins(grid) {
    let totalWin = 0;
    const winningMessages = [];
    const symbolCounts = {};

    // Count all 12 symbols.

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            const name = grid[row][col].name;

            symbolCounts[name] = (symbolCounts[name] || 0) + 1;
        }
    }

    // Two Bats anywhere pay 10 per complete pair.

    const batPairs = Math.floor((symbolCounts.bat || 0) / 2);

    if (batPairs > 0) {
        const prize = batPairs * 10;
        totalWin += prize;
        winningMessages.push(`Bat pairs: ${prize}`);
    }

    // Two Skulls anywhere pay 10 per complete pair.

    const skullPairs = Math.floor((symbolCounts.skull || 0) / 2);

    if (skullPairs > 0) {
        const prize = skullPairs * 10;
        totalWin += prize;
        winningMessages.push(`Skull pairs: ${prize}`);
    }

    // Fangs, Blooddrops and Eyes need four in a horizontal row.

    const rowPayouts = {
        fangs: 100,
        blooddrop: 50,
        eye: 1000
    };

    for (let row = 0; row < ROWS; row++) {
        const firstSymbol = grid[row][0].name;

        const fullRow = grid[row].every(
            symbol => symbol.name === firstSymbol
        );

        if (fullRow && rowPayouts[firstSymbol]) {
            const prize = rowPayouts[firstSymbol];

            totalWin += prize;
            winningMessages.push(`${firstSymbol}: ${prize}`);
        }
    }

    // Three Extras anywhere trigger the bonus game.

    const extraCount = symbolCounts.extra || 0;
    const extraTriggered = extraCount >= 3;

    return {
        totalWin,
        extraCount,
        extraTriggered,
        winningMessages
    };
}

// ---------- NORMAL SPIN ----------

function spin() {
    if (isSpinning || bonusActive) return;

    if (balance < bet) {
        message.textContent = "NOT ENOUGH VAMPCOINS!";
        return;
    }

    isSpinning = true;
    spinButton.disabled = true;

    balance -= bet;
    saveBalance();
    updateDisplays();

    message.textContent = "THE REELS ARE TURNING...";

    setTimeout(() => {
        const grid = createNormalGrid();

        displayNormalGrid(grid);

        const result = checkNormalWins(grid);

        if (result.totalWin > 0) {
            balance += result.totalWin;

            message.textContent =
                `YOU WON ${result.totalWin} VAMPCOINS! ` +
                result.winningMessages.join(" • ");
        } else if (result.extraTriggered) {
            message.textContent =
                `${result.extraCount} EXTRAS! ENTERING THE BONUS...`;
        } else {
            message.textContent = "NO WIN. TRY AGAIN...";
        }

        // Save any normal-game winnings.
        saveBalance();
        updateDisplays();

        isSpinning = false;

        // Three Extras start the bonus game.
        if (result.extraTriggered) {
            spinButton.disabled = true;
            setTimeout(startBonusGame, 500);
        } else {
            spinButton.disabled = false;
        }

    }, 700);
}

// ---------- BET BUTTONS ----------

increaseBetButton.addEventListener("click", () => {
    if (isSpinning || bonusActive) return;

    bet = Math.min(MAX_BET, bet + 1);
    updateDisplays();
});

decreaseBetButton.addEventListener("click", () => {
    if (isSpinning || bonusActive) return;

    bet = Math.max(MIN_BET, bet - 1);
    updateDisplays();
});

// ---------- RESET BUTTON ----------

resetButton.addEventListener("click", () => {
    if (isSpinning || bonusActive) return;

    balance = 1000;
    bet = 10;

    saveBalance();
    updateDisplays();

    message.textContent = "GAME RESET. ENTER THE DARKNESS...";
});

// ---------- START BONUS GAME ----------

function startBonusGame() {
    bonusActive = true;
    bonusFinished = false;

    bonusSpinsLeft = BONUS_MAX_SPINS;
    bonusTotal = 0;

    collectedJackpots = [];

    // Create 12 empty bonus positions.

    bonusCells = Array(TOTAL_CELLS).fill(null);

    bonusOverlay.classList.add("active");

    bonusMessage.textContent =
        "LOCK IN PRIZES! FANGS DO NOT LOCK.";

    bonusSpinButton.disabled = false;
    collectButton.disabled = true;

    displayBonusGrid();
    updateDisplays();
}

// ---------- BONUS GRID DISPLAY ----------

function displayBonusGrid() {
    bonusGrid.innerHTML = "";

    bonusCells.forEach(symbolName => {
        const cell = document.createElement("div");

        if (symbolName !== null) {
            cell.className = "bonus-cell locked";
            cell.appendChild(createSymbolContent(symbolName));
        } else {
            cell.className = "bonus-cell unlocked";
            cell.textContent = "?";
        }

        bonusGrid.appendChild(cell);
    });
}

// ---------- BONUS SYMBOL SELECTION ----------

function getAvailableBonusSymbols() {
    return bonusSymbols.filter(symbol => {
        const isJackpot = ["mini", "major", "grand"].includes(
            symbol.name
        );

        if (isJackpot && collectedJackpots.includes(symbol.name)) {
            return false;
        }

        return true;
    });
}

// ---------- BONUS SPIN ----------

function bonusSpin() {
    if (!bonusActive || bonusFinished || bonusSpinsLeft <= 0) {
        return;
    }

    const unlockedPositions = [];

    bonusCells.forEach((symbolName, index) => {
        if (symbolName === null) {
            unlockedPositions.push(index);
        }
    });

    if (unlockedPositions.length === 0) {
        endBonusGame("ALL POSITIONS ARE LOCKED!");
        return;
    }

    bonusSpinButton.disabled = true;

    bonusSpinsLeft--;

    let newLocks = 0;
    let newPrizes = 0;

    unlockedPositions.forEach(index => {
        const symbol = randomSymbol(getAvailableBonusSymbols());

        // Fangs are blank: no prize and no lock.

        if (symbol.name === "fangs") {
            return;
        }

        // Lock the prize into its position.

        bonusCells[index] = symbol.name;

        newLocks++;
        newPrizes += symbol.payout;
        bonusTotal += symbol.payout;

        // Mini, Major and Grand can each be won once.

        if (
            ["mini", "major", "grand"].includes(symbol.name) &&
            !collectedJackpots.includes(symbol.name)
        ) {
            collectedJackpots.push(symbol.name);
        }
    });

    displayBonusGrid();
    updateDisplays();

    if (newLocks === 0) {
        bonusMessage.textContent =
            "NO PRIZES LOCKED THIS TIME. TRY AGAIN!";
    } else {
        bonusMessage.textContent =
            `YOU LOCKED ${newLocks} PRIZES! +${newPrizes} VAMPCOINS`;
    }

    const allLocked = bonusCells.every(
        symbolName => symbolName !== null
    );

    if (allLocked) {
        endBonusGame("ALL 12 POSITIONS ARE LOCKED!");
        return;
    }

    if (bonusSpinsLeft <= 0) {
        endBonusGame("YOUR 20 BONUS SPINS ARE FINISHED!");
        return;
    }

    bonusSpinButton.disabled = false;
}

// ---------- END BONUS GAME ----------

function endBonusGame(reason) {
    bonusFinished = true;

    bonusSpinButton.disabled = true;
    collectButton.disabled = false;

    bonusMessage.textContent =
        `${reason} COLLECT ${bonusTotal} VAMPCOINS!`;
}

// ---------- COLLECT BONUS ----------

function collectBonus() {
    if (!bonusActive || !bonusFinished) return;

    balance += bonusTotal;

    saveBalance();
    updateDisplays();

    bonusActive = false;
    bonusFinished = false;

    bonusOverlay.classList.remove("active");

    message.textContent =
        `YOU COLLECTED ${bonusTotal} VAMPCOINS!`;

    spinButton.disabled = false;
}

// ---------- BUTTON EVENTS ----------

spinButton.addEventListener("click", spin);

bonusSpinButton.addEventListener("click", bonusSpin);

collectButton.addEventListener("click", collectBonus);

// ---------- START THE GAME ----------

updateDisplays();

displayNormalGrid(createNormalGrid());

bonusOverlay.classList.remove("active");
collectButton.disabled = true;
