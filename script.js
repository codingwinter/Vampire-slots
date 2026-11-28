// VAMPIRE SLOTS
// 4 columns x 3 rows
// Virtual VampCoins only

// ---------- SETTINGS ----------

const COLUMNS = 4;
const ROWS = 3;
const TOTAL_CELLS = COLUMNS * ROWS;
const BONUS_MAX_SPINS = 20;

let savedBalance = localStorage.getItem("vampireBalance");
let balance = savedBalance === null ? 100 : Number(savedBalance);
let bet = 20;

const BET_LEVELS = [20, 40, 60, 80, 100, 150, 200];
const MIN_BET = 20;
const MAX_BET = 200;

// Normal game weights add up to 100.

const normalSymbols = [
    { name: "fangs", weight: 55 },
    { name: "blooddrop", weight: 18 },
    { name: "bat", weight: 10 },
    { name: "extra", weight: 8 },
    { name: "skull", weight: 6 },
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
    img.src = `assets/${symbolName}.PNG`;
    img.alt = symbolName;
    img.className = "symbol-image";

    img.onload = function () {
        label.style.display = "none";
    };

    img.onerror = function () {
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

// Change the symbol shown inside one existing cell.

// Update an existing symbol without rebuilding its HTML.
// This avoids repeatedly destroying and reloading the images.
function setNormalCellSymbol(cell, symbolName) {
    const content = cell.querySelector(".symbol-content");

    if (!content) return;

    const label = content.querySelector(".symbol-label");
    const img = content.querySelector(".symbol-image");

    if (label) {
        label.textContent = symbolName.toUpperCase();
        label.style.display = "block";
    }

    if (img) {
        img.onerror = function () {
            img.style.display = "none";
            if (label) label.style.display = "block";
        };

        img.onload = function () {
            img.style.display = "block";
            if (label) label.style.display = "none";
        };

        img.src = `assets/${symbolName}.PNG`;
        img.alt = symbolName;
    }
}

// Spin the four vertical reels and stop them one at a time.
function animateNormalSpin(finalGrid) {
    return new Promise(resolve => {
        const cells = Array.from(reels.children);
        const intervals = [];

        const symbolChangeSpeed = 140;
        const firstStop = 1100;
        const delayBetweenReels = 450;

        // Preload the symbol images so they are ready during the spin.
        normalSymbols.forEach(symbol => {
            const image = new Image();
            image.src = `assets/${symbol.name}.PNG`;
        });

        // Clear any previous win highlights.
        cells.forEach(cell => {
            cell.classList.remove(
                "winning",
                "reel-stop",
                "reel-spinning"
            );
        });

        // Start all four vertical reels.
        for (let col = 0; col < COLUMNS; col++) {
            for (let row = 0; row < ROWS; row++) {
                const cell = cells[row * COLUMNS + col];

                cell.classList.add("reel-spinning");
            }

            // Change the symbols while the reel is moving.
            intervals[col] = setInterval(() => {
                for (let row = 0; row < ROWS; row++) {
                    const cell = cells[row * COLUMNS + col];
                    const symbol = randomSymbol(normalSymbols);

                    setNormalCellSymbol(cell, symbol.name);
                }
            }, symbolChangeSpeed);
        }

        // Stop each vertical reel from left to right.
        for (let col = 0; col < COLUMNS; col++) {
            const stopTime = firstStop + col * delayBetweenReels;

            setTimeout(() => {
                clearInterval(intervals[col]);

                for (let row = 0; row < ROWS; row++) {
                    const cell = cells[row * COLUMNS + col];

                    setNormalCellSymbol(
                        cell,
                        finalGrid[row][col].name
                    );

                    cell.classList.remove("reel-spinning");
                    cell.classList.add("reel-stop");
                }
            }, stopTime);
        }

        // Wait until all four reels have stopped.
        const totalTime =
            firstStop +
            (COLUMNS - 1) * delayBetweenReels +
            300;

        setTimeout(() => {
            cells.forEach(cell => {
                cell.classList.remove("reel-stop");
            });

            resolve();
        }, totalTime);
    });
}


// Spin all four vertical reels, then stop them one at a time.
// Reel 1 is positions 1, 5, 9.
// Reel 2 is positions 2, 6, 10.
// Reel 3 is positions 3, 7, 11.
// Reel 4 is positions 4, 8, 12.

function animateNormalSpin(finalGrid) {
    return new Promise(resolve => {
        const cells = Array.from(reels.children);
        const spinIntervals = [];

        const stopDelay = 900;
        const delayBetweenReels = 350;
        const symbolChangeSpeed = 75;

        // Start all four vertical reels spinning together.

        for (let col = 0; col < COLUMNS; col++) {
            for (let row = 0; row < ROWS; row++) {
                cells[row * COLUMNS + col].classList.remove(
                    "winning", "reel-stop"
                );

                cells[row * COLUMNS + col].classList.add(
                    "reel-spinning"
                );
            }

            const interval = setInterval(() => {
                for (let row = 0; row < ROWS; row++) {
                    const cell = cells[row * COLUMNS + col];
                    const symbol = randomSymbol(normalSymbols);

                    setNormalCellSymbol(cell, symbol.name);
                }
            }, symbolChangeSpeed);

            spinIntervals[col] = interval;
        }

        // Stop the vertical reels from left to right.

        for (let col = 0; col < COLUMNS; col++) {
            const thisReelDelay =
                stopDelay + col * delayBetweenReels;

            setTimeout(() => {
                clearInterval(spinIntervals[col]);

                for (let row = 0; row < ROWS; row++) {
                    const cell = cells[row * COLUMNS + col];

                    setNormalCellSymbol(
                        cell,
                        finalGrid[row][col].name
                    );

                    cell.classList.remove("reel-spinning");
                    cell.classList.add("reel-stop");
                }
            }, thisReelDelay);
        }

        // Wait until the fourth reel has stopped and settled.

        const totalAnimationTime =
            stopDelay + (COLUMNS - 1) * delayBetweenReels + 220;

        setTimeout(() => {
            cells.forEach(cell => {
                cell.classList.remove("reel-stop");
            });

            resolve();
        }, totalAnimationTime);
    });
}

// ---------- CHECK NORMAL WINS ----------

function checkNormalWins(grid) {
    let totalWin = 0;

    const winningMessages = [];
    const winningRows = [];
    const symbolCounts = {};

    // Count all 12 symbols.

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            const name = grid[row][col].name;

            symbolCounts[name] = (symbolCounts[name] || 0) + 1;
        }
    }

    // Bats and Skulls currently pay nothing.

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
            const prize = rowPayouts[firstSymbol] * (bet / 20);

            totalWin += prize;
            winningMessages.push(`${firstSymbol}: ${prize}`);
            winningRows.push(row);
        }
    }

    // Three Extras anywhere trigger the bonus game.

    const extraCount = symbolCounts.extra || 0;
    const extraTriggered = extraCount >= 3;

    return {
        totalWin,
        extraCount,
        extraTriggered,
        winningMessages,
        winningRows
    };
}

// ---------- NORMAL SPIN ----------

async function spin() {
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

    try {
        // Decide the final result before the animation begins.

        const grid = createNormalGrid();

        // Animate the four vertical reels and stop them left to right.

        await animateNormalSpin(grid);

        const result = checkNormalWins(grid);

        // Highlight all four symbols in each winning horizontal line.

        
// Highlight all four symbols in every winning horizontal line.
result.winningRows.forEach(row => {
    for (let col = 0; col < COLUMNS; col++) {
        const cell = reels.children[row * COLUMNS + col];

        if (cell) {
            cell.classList.remove("winning");

            // Restart the glow animation.
            void cell.offsetWidth;

            cell.classList.add("winning");
        }
    }
});


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

    } catch (error) {
        console.error("Vampire Slots spin error:", error);

        isSpinning = false;
        spinButton.disabled = false;

        message.textContent =
            "SOMETHING WENT WRONG. PLEASE TRY AGAIN.";
    }
}

// ---------- BET BUTTONS ----------

increaseBetButton.addEventListener("click", () => {
    if (isSpinning || bonusActive) return;

    const currentIndex = BET_LEVELS.indexOf(bet);

    if (currentIndex < BET_LEVELS.length - 1) {
        bet = BET_LEVELS[currentIndex + 1];
    }

    updateDisplays();
});

decreaseBetButton.addEventListener("click", () => {
    if (isSpinning || bonusActive) return;

    const currentIndex = BET_LEVELS.indexOf(bet);

    if (currentIndex > 0) {
        bet = BET_LEVELS[currentIndex - 1];
    }

    updateDisplays();
});

// ---------- RESET BUTTON ----------

resetButton.addEventListener("click", () => {
    if (isSpinning || bonusActive) return;

    balance = 100;
    bet = 20;

    saveBalance();
    updateDisplays();

    message.textContent =
        "GAME RESET. ENTER THE DARKNESS...";
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
