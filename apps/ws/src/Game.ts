import { User, AuthProvider, GAME_STATUS, GAME_RESULT } from './types';
import { Chess, Move, Square } from 'chess.js';
import {
    GAME_ENDED,
    INIT_GAME,
    MOVE,
} from './messages';
import { db } from './db';
import { randomUUID } from 'crypto';
import { socketManager } from './SocketManager';
import { GameService } from './services/gameService';

const GAME_TIME_MS = 10 * 60 * 60 * 1000;
const gameService = new GameService();

export function isPromoting(chess: Chess, from: Square, to: Square) {
    if (!from) {
        return false;
    }

    const piece = chess.get(from);
    if (piece?.type !== 'p') {
        return false;
    }

    if (piece.color !== chess.turn()) {
        return false;
    }

    if (!['1', '8'].some((it) => to.endsWith(it))) {
        return false;
    }

    return chess
        .moves({ square: from, verbose: true })
        .map((it) => it.to)
        .includes(to);
}

export class Game {
    public gameId: string;
    public player1UserId: string;
    public player2UserId: string | null;
    public board: Chess;
    private moveCount = 0;
    private timer: NodeJS.Timeout | null = null;
    private moveTimer: NodeJS.Timeout | null = null;
    public result: GAME_RESULT | null = null;
    private player1TimeConsumed = 0;
    private player2TimeConsumed = 0;
    private startTime = new Date(Date.now());
    private lastMoveTime = new Date(Date.now());

    constructor(player1UserId: string, player2UserId: string | null, gameId?: string, startTime?: Date) {
        this.player1UserId = player1UserId;
        this.player2UserId = player2UserId;
        this.board = new Chess();
        this.gameId = gameId ?? randomUUID();
        if (startTime) {
            this.startTime = startTime;
            this.lastMoveTime = startTime;
        }
    }

    seedMoves(moves: {
        id: string;
        gameId: string;
        moveNumber: number;
        from: string;
        to: string;
        comments: string | null;
        timeTaken: number | null;
        createdAt: Date;
    }[]) {
        console.log(moves);
        moves.forEach((move) => {
            if (isPromoting(this.board, move.from as Square, move.to as Square)) {
                this.board.move({
                    from: move.from,
                    to: move.to,
                    promotion: 'q',
                });
            } else {
                this.board.move({
                    from: move.from,
                    to: move.to,
                });
            }
        });

        this.moveCount = moves.length;
        if (moves[moves.length - 1]) {
            this.lastMoveTime = moves[moves.length - 1].createdAt;
        }

        moves.map((move, index) => {
            if (move.timeTaken) {
                if (index % 2 === 0) {
                    this.player1TimeConsumed += move.timeTaken;
                } else {
                    this.player2TimeConsumed += move.timeTaken;
                }
            }
        });
        this.resetAbandonTimer();
        this.resetMoveTimer();
    }

    async updateSecondPlayer(player2UserId: string) {
        this.player2UserId = player2UserId;
        const users = await db.user.findMany({
            where: {
                id: {
                    in: [this.player1UserId, this.player2UserId ?? ''],
                },
            },
        });

        try {
            await this.createGameInDb();
        } catch (e) {
            console.error(e);
            return;
        }

        const WhitePlayer = users.find((user) => user.id === this.player1UserId);
        const BlackPlayer = users.find((user) => user.id === this.player2UserId);

        socketManager.broadcast(
            this.gameId,
            JSON.stringify({
                type: INIT_GAME,
                payload: {
                    gameId: this.gameId,
                    whitePlayer: {
                        name: WhitePlayer?.name,
                        id: this.player1UserId,
                        isGuest: WhitePlayer?.provider === AuthProvider.GUEST,
                    },
                    blackPlayer: {
                        name: BlackPlayer?.name,
                        id: this.player2UserId,
                        isGuest: BlackPlayer?.provider === AuthProvider.GUEST,
                    },
                    fen: this.board.fen(),
                    moves: [],
                },
            }),
        );
    }

    async createGameInDb() {
        this.startTime = new Date(Date.now());
        this.lastMoveTime = this.startTime;

        const game = await db.game.create({
            data: {
                id: this.gameId,
                timeControl: 'CLASSICAL',
                status: 'IN_PROGRESS',
                startAt: this.startTime,
                currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',

                whitePlayer: {
                    connectOrCreate: {
                        where: { id: this.player1UserId },
                        create: {
                            id: this.player1UserId,
                            provider: AuthProvider.GUEST,
                            name: `Guest_${this.player1UserId.slice(0, 6)}`,
                            email: `guest_${this.player1UserId}@guest.local`,
                        },
                    },
                },
                blackPlayer: {
                    connectOrCreate: {
                        where: { id: this.player2UserId! },
                        create: {
                            id: this.player2UserId!,
                            provider: AuthProvider.GUEST,
                            name: `Guest_${this.player2UserId!.slice(0, 6)}`,
                            email: `guest_${this.player2UserId}@guest.local`,
                        },
                    },
                },
            },
            include: {
                whitePlayer: true,
                blackPlayer: true,
            },
        });

        this.gameId = game.id;
    }


    async addMoveToDb(move: Move, moveTimestamp: Date) {
        await db.$transaction([
            db.move.create({
                data: {
                    gameId: this.gameId,
                    moveNumber: this.moveCount + 1,
                    from: move.from,
                    to: move.to,
                    before: move.before,
                    after: move.after,
                    createdAt: moveTimestamp,
                    timeTaken: moveTimestamp.getTime() - this.lastMoveTime.getTime(),
                    san: move.san
                },
            }),
            db.game.update({
                data: {
                    currentFen: move.after,
                },
                where: {
                    id: this.gameId,
                },
            }),
        ]);
    }

    async makeMove(user: User, move: Move) {
        if (this.board.turn() === 'w' && user.userId !== this.player1UserId) {
            return;
        }

        if (this.board.turn() === 'b' && user.userId !== this.player2UserId) {
            return;
        }

        if (this.result) {
            console.error(`User ${user.userId} is making a move post game completion`);
            return;
        }

        const moveTimestamp = new Date(Date.now());
        try {
            if (isPromoting(this.board, move.from, move.to)) {
                this.board.move({
                    from: move.from,
                    to: move.to,
                    promotion: 'q',
                });
            } else {
                this.board.move({
                    from: move.from,
                    to: move.to,
                });
            }
        } catch (e) {
            console.error("Error while making move");
            return;
        }

        if (this.board.turn() === 'b') {
            this.player1TimeConsumed = this.player1TimeConsumed + (moveTimestamp.getTime() - this.lastMoveTime.getTime());
        }

        if (this.board.turn() === 'w') {
            this.player2TimeConsumed = this.player2TimeConsumed + (moveTimestamp.getTime() - this.lastMoveTime.getTime());
        }

        await this.addMoveToDb(move, moveTimestamp);
        this.resetAbandonTimer()
        this.resetMoveTimer();
        this.lastMoveTime = moveTimestamp;

        socketManager.broadcast(
            this.gameId,
            JSON.stringify({
                type: MOVE,
                payload: { move, player1TimeConsumed: this.player1TimeConsumed, player2TimeConsumed: this.player2TimeConsumed },
            }),
        );

        if (this.board.isGameOver()) {
            const result = this.board.isDraw()
                ? 'DRAW'
                : this.board.turn() === 'b'
                    ? 'WHITE_WINS'
                    : 'BLACK_WINS';
            this.endGame("COMPLETED", result);
        }

        this.moveCount++;
    }

    getPlayer1TimeConsumed() {
        if (this.board.turn() === 'w') {
            return this.player1TimeConsumed + (new Date(Date.now()).getTime() - this.lastMoveTime.getTime());
        }
        return this.player1TimeConsumed;
    }

    getPlayer2TimeConsumed() {
        if (this.board.turn() === 'b') {
            return this.player2TimeConsumed + (new Date(Date.now()).getTime() - this.lastMoveTime.getTime());
        }
        return this.player2TimeConsumed;
    }

    async resetAbandonTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.endGame("ABANDONED", this.board.turn() === 'b' ? 'WHITE_WINS' : 'BLACK_WINS');
        }, 60 * 1000);
    }

    async resetMoveTimer() {
        if (this.moveTimer) {
            clearTimeout(this.moveTimer)
        }
        const turn = this.board.turn();
        const timeLeft = GAME_TIME_MS - (turn === 'w' ? this.player1TimeConsumed : this.player2TimeConsumed);
        this.moveTimer = setTimeout(() => {
            this.endGame("TIME_UP", turn === 'b' ? 'WHITE_WINS' : 'BLACK_WINS');
        }, timeLeft);
    }

    async exitGame(user: User) {
        this.endGame('PLAYER_EXIT', user.userId === this.player2UserId ? 'WHITE_WINS' : 'BLACK_WINS');
    }

    async endGame(status: GAME_STATUS, result: GAME_RESULT) {
        const updatedGame = await db.game.update({
            data: {
                status,
                result: result,
            },
            where: {
                id: this.gameId,
            },
            include: {
                moves: {
                    orderBy: {
                        moveNumber: 'asc',
                    },
                },
                blackPlayer: true,
                whitePlayer: true,
            }
        });

        // Handle rating updates for completed games
        let ratingResult = null;
        if (status === 'COMPLETED' || status === 'TIME_UP' || status === 'PLAYER_EXIT' || status === 'ABANDONED') {
            try {
                ratingResult = await gameService.completeGameWithRatings(this.gameId, result);
            } catch (error) {
                console.error('Failed to update ratings:', error);
            }
        }

        socketManager.broadcast(
            this.gameId,
            JSON.stringify({
                type: GAME_ENDED,
                payload: {
                    result,
                    status,
                    moves: updatedGame.moves,
                    blackPlayer: {
                        id: updatedGame.blackPlayer.id,
                        name: updatedGame.blackPlayer.name,
                    },
                    whitePlayer: {
                        id: updatedGame.whitePlayer.id,
                        name: updatedGame.whitePlayer.name,
                    },
                    ratingChanges: ratingResult ? {
                        whiteRatingChange: ratingResult.whiteRatingChange,
                        blackRatingChange: ratingResult.blackRatingChange,
                        whiteNewRating: ratingResult.whiteNewRating,
                        blackNewRating: ratingResult.blackNewRating,
                    } : null
                },
            }),
        );

        // Broadcast rating updates
        if (ratingResult) {
            socketManager.sendToUser(ratingResult.whitePlayerId, JSON.stringify({
                type: 'RATING_UPDATE',
                payload: {
                    newRating: ratingResult.whiteNewRating,
                    ratingChange: ratingResult.whiteRatingChange,
                    gameId: this.gameId
                }
            }));

            socketManager.sendToUser(ratingResult.blackPlayerId, JSON.stringify({
                type: 'RATING_UPDATE',
                payload: {
                    newRating: ratingResult.blackNewRating,
                    ratingChange: ratingResult.blackRatingChange,
                    gameId: this.gameId
                }
            }));

            socketManager.broadcastToAll(JSON.stringify({
                type: 'LEADERBOARD_UPDATE',
                payload: {
                    gameCompleted: true,
                    gameId: this.gameId
                }
            }));
        }

        this.clearTimer();
        this.clearMoveTimer();
    }

    clearMoveTimer() {
        if (this.moveTimer) clearTimeout(this.moveTimer);
    }

    clearTimer() {
        if (this.timer) clearTimeout(this.timer);
    }

    setTimer(timer: NodeJS.Timeout) {
        this.timer = timer;
    }
}
