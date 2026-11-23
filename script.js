
// ==========================================
// VAMPIRE SLOTS
// Main game and bonus game
// Virtual VampCoins only - no real money
// ==========================================

// ---------- GAME SETTINGS ----------

let balance = Number(localStorage.getItem("vampireBalance")) || 1000;
let bet = 10;

const MAX_BET = 100;
const MIN_BET = 1;

// Normal symbol weights add up to 100.
// These give approximately a 17.5% chance
// of at least one winning row per spin.

const normalSymbols = [
    { name: "fangs", weight: 46, payout: 100 },
    { name: "blooddrop", weight: 14, payout: 50 },
    { name: "bat", weight: 10, payout: 10 },
    { name: "extra", weight: 20, payout: 0 },
    { name: "skull", weight: 7, payout: 10 },
    { name: "eye", weight: 3, payout: 1000 }
];

// Bonus game symbols.
// Fangs do not lock and do not pay.
// Coins and jackpots lock into place.

const bonusSymbols = [
    { name: "fangs", weight: 65, payout: 0 },
    { name: "coin", weight: 25, payout: 1 },
    { name: "mini", weight: 6, payout: 10 },
    { name: "major", weight: 3, payout: 100 },
    { name: "grand", weight: 1, payout: 1000 }
];

const GRID_SIZE = 4;
const BONUS_MAX_SPINS = 20;

// ---------- HTML ELEMENTS ----------

const balanceDisplay = document.getElementById("balance");
const betDisplay = document.getElementById("bet");

const reels = document.getElementById("reels");
const message = document.getElementById("message");

const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");

const bonusOverlay = document.getElementById("bonusOverlay");
const bonusGrid = document.getElementById("bonusGrid");
const bonusSpinsDisplay = document.getElementById("bonusSpins");
const bonusTotalDisplay = document.getElementById("bonusTotal");
const bonusMessage = document.getElementById("bonusMessage");

const bonusSpinButton = document.getElementById("bonusSpinButton");
const collectButton = document.getElementById("collectButton");

const betUpButton = document.getElementById("betUp");
const betDownButton = document.getElementById("betDown");

// ---------- GAME VARIABLES ----------

let isSpinning = false;
let bonusActive = false;

let bonusSpinsLeft = BONUS_MAX_SPINS;
let bonusTotal = 0;
let bonusCells = [];
let collectedJackpots = [];

// ---------- HELPER FUNCTIONS ----------

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

function createSymbolImage(symbolName) {
    const img = document.createElement("img");

    img.src = `assets/${symbolName}.png`;
    img.alt = symbolName;
    img.className = "symbol-image";

    img.onerror = function () {
        this.style.display = "none";
    };

    return img;
}

function createCell(symbolName, className = "symbol-cell") {
    const cell = document.createElement("div");
    cell.className = className;

    cell.appendChild(createSymbolImage(symbolName));

    return cell;
}

// ---------- NORMAL GAME ----------

function createNormalGrid() {
    const grid = [];

    for (let row = 0; row < GRID_SIZE; row++) {
        grid[row] = [];

        for (let col = 0; col < GRID_SIZE; col++) {
            grid[row][col] = randomSymbol(normalSymbols);
        }
    }

    return grid;
}

function displayNormalGrid(grid) {
    if (!reels) return;

    reels.innerHTML = "";

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = createCell(grid[row][col].name);
            reels.appendChild(cell);
        }
    }
}

function checkNormalWins(grid) {
    let totalWin = 0;
    let extraTriggered = false;
    let winningRows = 0;

    for (let row = 0; row < GRID_SIZE; row++) {
        const firstSymbol = grid[row][0].name;

        const isFullRow = grid[row].every(
            symbol => symbol.name === firstSymbol
        );

        if (!isFullRow) continue;

        if (firstSymbol === "extra") {
            extraTriggered = true;
            continue;
        }

        const winningSymbol = normalSymbols.find(
            symbol => symbol.name === firstSymbol
        );

        if (winningSymbol) {
            totalWin += winningSymbol.payout;
            winningRows++;
        }
    }

    return {
        totalWin,
        extraTriggered,
        winningRows
    };
}

function spin() {
    if (isSpinning || bonusActive) return;

    if (balance < bet) {
        if (message) {
            message.textContent = "Not enough VampCoins!";
        }
        return;
    }

    isSpinning = true;
    spinButton.disabled = true;

    balance -= bet;
    saveBalance();
    updateDisplays();

    if (message) {
        message.textContent = "Spinning...";
    }

    // Short delay before showing the result.
    setTimeout(() => {
        const grid = createNormalGrid();

        displayNormalGrid(grid);

        const result = checkNormalWins(grid);

        if (result.totalWin > 0) {
            balance += result.totalWin;

            if (message) {
                message.textContent =
                    `You won ${result.totalWin} VampCoins!`;
            }
        } else if (result.extraTriggered) {
            if (message) {
                message.textContent = "BONUS! Four Extras!";
            }
        } else {
            if (message) {
                message.textContent = "No win. Try again!";
            }
        }

        saveBalance();
        updateDisplays();

        isSpinning = false;
        spinButton.disabled = false;

        // Bonus starts after the normal spin.
        if (result.extraTriggered) {
            setTimeout(startBonusGame, 700);
        }

    }, 800);
}

// ---------- BET CONTROLS ----------

if (betUpButton) {
    betUpButton.addEventListener("click", () => {
        if (isSpinning || bonusActive) return;

        bet = Math.min(MAX_BET, bet + 1);
        updateDisplays();
    });
}

if (betDownButton) {
    betDownButton.addEventListener("click", () => {
        if (isSpinning || bonusActive) return;

        bet = Math.max(MIN_BET, bet - 1);
        updateDisplays();
    });
}

// ---------- RESET BUTTON ----------

if (resetButton) {
    resetButton.addEventListener("click", () => {
        if (isSpinning || bonusActive) return;

        balance = 1000;
        bet = 10;

        saveBalance();
        updateDisplays();

        if (message) {
            message.textContent = "Game reset. Good luck!";
        }
    });
}

// ---------- BONUS GAME ----------

function startBonusGame() {
    bonusActive = true;

    bonusSpinsLeft = BONUS_MAX_SPINS;
    bonusTotal = 0;

    collectedJackpots = [];

    // All 16 bonus positions start unlocked.
    bonusCells = Array(GRID_SIZE * GRID_SIZE).fill(null);

    if (bonusOverlay) {
        bonusOverlay.classList.add("active");
    }

    if (bonusMessage) {
        bonusMessage.textContent =
            "Lock in prizes! Fangs disappear without a prize.";
    }

    if (bonusSpinButton) {
        bonusSpinButton.disabled = false;
    }

    if (collectButton) {
        collectButton.disabled = true;
    }

    displayBonusGrid();
    updateDisplays();
}

function displayBonusGrid() {
    if (!bonusGrid) return;

    bonusGrid.innerHTML = "";

    bonusCells.forEach((symbolName, index) => {
        const cell = document.createElement("div");

        if (symbolName) {
            cell.className = "bonus-cell locked";
            cell.appendChild(createSymbolImage(symbolName));
        } else {
            cell.className = "bonus-cell unlocked";
            cell.textContent = "?";
        }

        bonusGrid.appendChild(cell);
    });
}

function getAvailableBonusSymbols() {
    return bonusSymbols.filter(symbol => {
        if (
            ["mini", "major", "grand"].includes(symbol.name) &&
            collectedJackpots.includes(symbol.name)
        ) {
            return false;
        }

        return true;
    });
}

function bonusSpin() {
    if (!bonusActive || bonusSpinsLeft <= 0) return;

    const unlockedPositions = [];

    bonusCells.forEach((cell, index) => {
        if (cell === null) {
            unlockedPositions.push(index);
        }
    });

    if (unlockedPositions.length === 0) {
        endBonusGame("All positions are locked!");
        return;
    }

    if (bonusSpinButton) {
        bonusSpinButton.disabled = true;
    }

    bonusSpinsLeft--;

    let newPrizes = 0;
    let newLocks = 0;

    unlockedPositions.forEach(index => {
        const symbol = randomSymbol(getAvailableBonusSymbols());

        // Fangs are a blank result.
        // They do not lock the position.
        if (symbol.name === "fangs") {
            return;
        }

        // Lock the prize into this position.
        bonusCells[index] = symbol.name;
        newLocks++;

        bonusTotal += symbol.payout;
        newPrizes += symbol.payout;

        // Each jackpot can only be collected once.
        if (
            ["mini", "major", "grand"].includes(symbol.name)
        ) {
            collectedJackpots.push(symbol.name);
        }
    });

    displayBonusGrid();
    updateDisplays();

    if (bonusMessage) {
        if (newLocks === 0) {
            bonusMessage.textContent =
                "No prizes locked! Spin again.";
        } else {
            bonusMessage.textContent =
                `You locked ${newLocks} prize(s)! Added ${newPrizes} VampCoins.`;
        }
    }

    // End if all 16 positions are locked.
    const allLocked = bonusCells.every(cell => cell !== null);

    if (allLocked) {
        endBonusGame("Amazing! All 16 positions are locked!");
        return;
    }

    // End when the 20 spins have been used.
    if (bonusSpinsLeft <= 0) {
        endBonusGame("Bonus spins finished!");
        return;
    }

    if (bonusSpinButton) {
        bonusSpinButton.disabled = false;
    }
}

// ---------- END BONUS GAME ----------

function endBonusGame(reason) {
    if (bonusSpinButton) {
        bonusSpinButton.disabled = true;
    }

    if (bonusMessage) {
        bonusMessage.textContent =
            `${reason} Collect your ${bonusTotal} VampCoins!`;
    }

    if (collectButton) {
        collectButton.disabled = false;
    }
}

function collectBonus() {
    if (!bonusActive) return;

    balance += bonusTotal;

    saveBalance();
    updateDisplays();

    bonusActive = false;

    if (bonusOverlay) {
        bonusOverlay.classList.remove("active");
    }

    if (message) {
        message.textContent =
            `You collected ${bonusTotal} VampCoins!`;
    }

    if (spinButton) {
        spinButton.disabled = false;
    }
}

// ---------- BUTTON EVENTS ----------

if (spinButton) {
    spinButton.addEventListener("click", spin);
}

if (bonusSpinButton) {
    bonusSpinButton.addEventListener("click", bonusSpin);
}

if (collectButton) {
    collectButton.addEventListener("click", collectBonus);
}

// ---------- START GAME ----------

updateDisplays();

if (reels) {
    displayNormalGrid(createNormalGrid());
}

if (bonusOverlay) {
    bonusOverlay.classList.remove("active");
}

if (collectButton) {
    collectButton.disabled = true;
}
