import { Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";

 const socketAsync = (handler: Function) => {
    return async (...args: any[]) => {
        try {
            await handler(...args);
        } catch (err) {
            logger.error("Socket Error:", err);
            // If the last argument is a callback (ack), send an error response
            const lastArg = args[args.length - 1];
            if (typeof lastArg === 'function') {
                lastArg({ ok: false, error: "Internal Server Error" });
            }
        }
    };
};

export default function registerGestureHandlers(socket: Socket) {

    // 1. Drawing Events (High Frequency)
    socket.on("strokes_batch", socketAsync(({ roomId, strokes }: any) => {
        if (!Array.isArray(strokes) || strokes.length === 0) return;
        
        // Forward to everyone EXCEPT sender (using service)
        socketService.broadcastToChamberExcept(roomId, socket.id, "strokes_batch", { 
            strokes, 
            from: socket.id 
        });
    }));

    socket.on("clear_canvas", socketAsync(({ roomId }: any) => {
        socketService.emitToChamber(roomId, "clear_canvas", { 
            roomId, 
            by: socket.id, 
            ts: Date.now() 
        });
    }));

    // 2. Chat / Guessing Events
    socket.on("chat_message", socketAsync(({ roomId, userId, name, text }: any) => {
        if (!text || text.length > 500) return;

        // TODO: Add logic here to check if 'text' matches the secret word (Game Logic)
        const isCorrectGuess = false; // Replace with actual game service check

        if (isCorrectGuess) {
            // Emit a special "winner" event instead of a standard chat
            socketService.emitToChamber(roomId, "correct_guess", { userId, name });
        } else {
            // Standard chat
            socketService.emitToChamber(roomId, "chat_message", { 
                userId, 
                name, 
                text, 
                ts: Date.now() 
            });
        }
    }));

    // 3. Game Flow Events (Missing Requirements)
    
    // A. Start Game
    socket.on("game_start", socketAsync(({ roomId }: any) => {
        // Logic: Pick a drawer, generate words
        const drawerId = socket.id; // Or pick randomly
        const wordsToChoose = ["Apple", "Robot", "Guitar"]; // Logic from GameService
        
        // Notify Room: Game Starting
        socketService.emitToChamber(roomId, "game_started", { drawerId });
        
        // Notify Drawer: Pick a word
        socketService.emitToSocket(drawerId, "system_word_offer", { words: wordsToChoose });
    }));

    // B. Drawer Selects Word
    socket.on("word_select", socketAsync(({ roomId, word }: any) => {
        // Logic: Store current secret word in GameService
        logger.info("Gesture: Word selected for room %s", roomId);
        
        // Tell everyone (except drawer) that drawing is beginning
        // We mask the word for guessers
        socketService.emitToChamber(roomId, "round_start", { 
            drawerId: socket.id,
            wordLength: word.length,
            hint: "_ _ _ _" 
        });
    }));
}