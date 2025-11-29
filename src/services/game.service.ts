import chamberService from "./chamber.service";
import { ChamberStatus, type IStroke } from "@src/types/chamber.types";

const WORD_BANK = ["Apple", "Robot", "Guitar", "Sun", "Tree", "Computer"];

function addStroke(chamberId: string, stroke: IStroke) {
    const chamber = chamberService.getChamber(chamberId);

    if (chamber && chamber.status === ChamberStatus.PLAYING) {
        chamber.strokeHistory.push(stroke);
    }
}

function clearCanvas(chamberId: string) {
    const chamber = chamberService.getChamber(chamberId);

    if (chamber) chamber.strokeHistory = [];
}

function startGame(chamberId: string): boolean {
    let chamber = chamberService.getChamber(chamberId);

    if (!chamber || chamber.players.size < 2) return false;

    chamber = {
        ...chamber,
        status: ChamberStatus.SELECTING_WORD,
        currentDrawerId: null,
        currentWord: null,
        currentHint: null,
        wordChoices: [],
        roundEndTime: 0,
        strokeHistory: [],
    };

    chamber.players.forEach((player) => ({
        ...player,
        isDrawer: false,
        hasGuessedCorrectly: false,
        scoreThisRound: 0,
    }));

    return startNextTurn(chamberId);
}

function startNextTurn(chamberId: string): boolean {
    const chamber = chamberService.getChamber(chamberId);
    if (!chamber) return false;

    const playerIds = Array.from(chamber.players.keys());
    const randomDrawerId = playerIds[Math.floor(Math.random() * playerIds.length)];

    chamber.players.forEach((p) => {
        p.isDrawer = p.socketId === randomDrawerId;
        p.hasGuessedCorrectly = false;
        p.scoreThisRound = 0;
    });

    chamber.currentDrawerId = randomDrawerId!;
    chamber.strokeHistory = []; // Clean canvas
    chamber.status = ChamberStatus.SELECTING_WORD;

    // 3. Generate 3 random words for drawer
    chamber.wordChoices = [
        WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)] ?? "Apple",
        WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)] ?? "Robot",
        WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)] ?? "Guitar",
    ];

    return true;
}

function setWordAndStartRound(chamberId: string, word: string) {
    const chamber = chamberService.getChamber(chamberId);
    if (!chamber) return;

    chamber.currentWord = word;
    // Generate Hint: "Robot" -> "_ _ _ _ _"
    chamber.currentHint = word
        .split("")
        .map((c) => (c === " " ? " " : "_"))
        .join(" ");

    chamber.status = ChamberStatus.PLAYING;
    chamber.roundEndTime = Date.now() + chamber.config.roundTimeMS;
}


interface GuessResult {
    type: "CORRECT" | "CLOSE" | "WRONG" | "ALREADY_GUESSED";
    points: number;
    msg: string;
}

function processGuess(chamberId: string, socketId: string, text: string): GuessResult {
    const chamber = chamberService.getChamber(chamberId);
    if (!chamber || !chamber.currentWord || chamber.status !== ChamberStatus.PLAYING) {
        return { type: "WRONG", points: 0, msg: text };
    }

    const player = chamber.players.get(socketId);
    if (!player) return { type: "WRONG", points: 0, msg: text };

    // 1. Check if already guessed
    if (player.hasGuessedCorrectly || player.isDrawer) {
        return { type: "ALREADY_GUESSED", points: 0, msg: text };
    }

    const cleanGuess = text.trim().toLowerCase();
    const secret = chamber.currentWord.toLowerCase();

    // 2. Check Match
    if (cleanGuess === secret) {
        // SCORING ALGORITHM
        // Max 100 points, decreases as time goes on
        const basePoints = 100;
        const timeFactor = 0.5; // logic to be improved based on timeLeft
        const points = Math.floor(basePoints * timeFactor);

        player.score += points;
        player.scoreThisRound = points;
        player.hasGuessedCorrectly = true;

        // Give Drawer points too!
        const drawer = chamber.players.get(chamber.currentDrawerId!);
        if (drawer) drawer.score += 10;

        // Check if Everyone Guessed?
        checkIfRoundShouldEnd(chamberId);

        return { type: "CORRECT", points, msg: "Guessed the word!" };
    }

    // 3. Check "Close" (Levenshtein distance or simple substring)
    if (secret.includes(cleanGuess) && secret.length - cleanGuess.length < 2) {
        return { type: "CLOSE", points: 0, msg: `'${text}' is close!` };
    }

    return { type: "WRONG", points: 0, msg: text };
}

function checkIfRoundShouldEnd(chamberId: string) {
    const chamber = chamberService.getChamber(chamberId);
    if (!chamber) return;

    // If all non-drawers have guessed
    const guessers = Array.from(chamber.players.values()).filter((p) => !p.isDrawer);
    const allGuessed = guessers.every((p) => p.hasGuessedCorrectly);

    if (allGuessed) {
        chamber.status = ChamberStatus.ROUND_OVER;
        // Logic to trigger next round would be called via Socket Controller
    }
}

// =======================
// Public View (Masking Data)
// =======================

function getGameState(chamberId: string) {
    const chamber = chamberService.getChamber(chamberId);
    if (!chamber) return null;

    // RETURN SAFE DATA (Hide secret word)
    return {
        ...chamber,
        players: Array.from(chamber.players.values()),
        currentWord: null, // HIDDEN
        wordChoices: null, // HIDDEN (unless requesting user is drawer)
    };
}

export default {
    addStroke,
    clearCanvas,
    startGame,
    startNextTurn,
    setWordAndStartRound,
    processGuess,
    getGameState,
};
