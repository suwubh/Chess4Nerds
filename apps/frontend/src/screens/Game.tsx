/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import MoveSound from '/move.wav';
import { Button } from '../components/Button';
import { ChessBoard, isPromoting } from '../components/ChessBoard';
import { useSocket } from '../hooks/useSocket';
import { Chess, Move } from 'chess.js';
import { useNavigate, useParams } from 'react-router-dom';
import MovesTable from '../components/MovesTable';
import { useUser } from '@repo/store/useUser';
import { UserAvatar } from '../components/UserAvatar';

export const INIT_GAME = 'init_game';
export const MOVE = 'move';
export const OPPONENT_DISCONNECTED = 'opponent_disconnected';
export const GAME_OVER = 'game_over';
export const JOIN_ROOM = 'join_room';
export const GAME_JOINED = 'game_joined';
export const GAME_ALERT = 'game_alert';
export const GAME_ADDED = 'game_added';
export const USER_TIMEOUT = 'user_timeout';
export const GAME_TIME = 'game_time';
export const GAME_ENDED = 'game_ended';
export const EXIT_GAME = 'exit_game';

// Chat events: must match server
export const CHAT_MESSAGE = 'chat:message';
export const CHAT_SEND = 'chat:send';

export enum Result {
  WHITE_WINS = 'WHITE_WINS',
  BLACK_WINS = 'BLACK_WINS',
  DRAW = 'DRAW',
}

export interface GameResult {
  result: Result;
  by: string;
}

const GAME_TIME_MS = 10 * 60 * 1000;

export interface Player {
  id: string;
  name: string;
  isGuest: boolean;
}

import { useRecoilValue, useSetRecoilState } from 'recoil';
import { movesAtom, userSelectedMoveIndexAtom } from '@repo/store/chessBoard';
import GameEndModal from '@/components/GameEndModal';
import { Waitopponent } from '@/components/ui/waitopponent';
import { ShareGame } from '../components/ShareGame';
import ExitGameModel from '@/components/ExitGameModel';

const moveAudio = new Audio(MoveSound);

export interface Metadata {
  blackPlayer: Player;
  whitePlayer: Player;
}

type ChatMsg = { fromUserId: string; text: string; ts: number; gameId?: string };

export const Game = () => {
  const socket = useSocket();
  const { gameId } = useParams();
  const user = useUser();

  const navigate = useNavigate();
  const [chess, _setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [added, setAdded] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameMetadata, setGameMetadata] = useState<Metadata | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [player1TimeConsumed, setPlayer1TimeConsumed] = useState(0);
  const [player2TimeConsumed, setPlayer2TimeConsumed] = useState(0);
  const [gameID, setGameID] = useState('');
  const setMoves = useSetRecoilState(movesAtom);
  const userSelectedMoveIndex = useRecoilValue(userSelectedMoveIndexAtom);
  const userSelectedMoveIndexRef = useRef(userSelectedMoveIndex);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Avoid duplicate JOIN_ROOM for the same gameId (helps with StrictMode/dev remounts)
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    userSelectedMoveIndexRef.current = userSelectedMoveIndex;
  }, [userSelectedMoveIndex]);

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
    }
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = function (event) {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case GAME_ADDED:
          setAdded(true);
          setGameID((p) => message.gameId);
          break;

        case INIT_GAME:
          setBoard(chess.board());
          setStarted(true);
          navigate(`/game/${message.payload.gameId}`);
          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          break;

        case MOVE:
          const { move, player1TimeConsumed, player2TimeConsumed } = message.payload;
          setPlayer1TimeConsumed(player1TimeConsumed);
          setPlayer2TimeConsumed(player2TimeConsumed);
          if (userSelectedMoveIndexRef.current !== null) {
            setMoves((moves: any) => [...moves, move]);
            return;
          }
          try {
            if (isPromoting(chess, move.from, move.to)) {
              chess.move({
                from: move.from,
                to: move.to,
                promotion: 'q',
              });
            } else {
              chess.move({ from: move.from, to: move.to });
            }
            setMoves((moves: any) => [...moves, move]);
            moveAudio.play();
          } catch (error) {
            console.log('Error', error);
          }
          break;

        case GAME_OVER:
          setResult(message.payload.result);
          break;

        case GAME_ENDED:
          let wonBy;
          switch (message.payload.status) {
            case 'COMPLETED':
              wonBy = message.payload.result !== 'DRAW' ? 'CheckMate' : 'Draw';
              break;
            case 'PLAYER_EXIT':
              wonBy = 'Player Exit';
              break;
            default:
              wonBy = 'Timeout';
          }
          setResult({
            result: message.payload.result,
            by: wonBy,
          });
          chess.reset();
          setStarted(false);
          setAdded(false);
          break;

        case USER_TIMEOUT:
          setResult(message.payload.win);
          break;

        case GAME_JOINED:
          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          setPlayer1TimeConsumed(message.payload.player1TimeConsumed);
          setPlayer2TimeConsumed(message.payload.player2TimeConsumed);
          setStarted(true);
          message.payload.moves.map((x: Move) => {
            if (isPromoting(chess, x.from, x.to)) {
              chess.move({ ...x, promotion: 'q' });
            } else {
              chess.move(x);
            }
          });
          setMoves(message.payload.moves);
          break;

        case GAME_TIME:
          setPlayer1TimeConsumed(message.payload.player1Time);
          setPlayer2TimeConsumed(message.payload.player2Time);
          break;

        // FIXED: Incoming chat with deduplication
        case CHAT_MESSAGE:
          if (!message.payload) break;
          if (!gameId || message.payload.gameId !== gameId) break;
          
          const newMessage: ChatMsg = {
            fromUserId: message.payload.fromUserId,
            text: String(message.payload.text || ''),
            ts: Number(message.payload.ts || Date.now()),
            gameId: message.payload.gameId,
          };
          
          // Add deduplication logic to prevent duplicate messages
          setChatMessages((prev) => {
            // Check if message already exists (by timestamp + text + fromUserId)
            const exists = prev.some(m => 
              m.ts === newMessage.ts && 
              m.text === newMessage.text && 
              m.fromUserId === newMessage.fromUserId
            );
            
            if (exists) {
              console.log('Duplicate chat message detected, skipping:', newMessage);
              return prev;
            }
            
            return [...prev, newMessage];
          });
          break;

        default:
          if (message?.payload?.message) {
            alert(message.payload.message);
          }
          break;
      }
    };

    // Join the game room exactly once per gameId
    if (gameId !== 'random' && joinedRef.current !== gameId) {
      socket.send(
        JSON.stringify({
          type: JOIN_ROOM,
          payload: { gameId },
        }),
      );
      joinedRef.current = gameId || null;
    }

    // Optional cleanup: clear handler on unmount
    return () => {
      if (socket) {
        // @ts-ignore
        socket.onmessage = null;
      }
    };
  }, [socket, gameId, navigate, setMoves, chess]);

  useEffect(() => {
    if (started) {
      const interval = setInterval(() => {
        if (chess.turn() === 'w') {
          setPlayer1TimeConsumed((p) => p + 100);
        } else {
          setPlayer2TimeConsumed((p) => p + 100);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [started, gameMetadata, user, chess]);

  const getTimer = (timeConsumed: number) => {
    const timeLeftMs = GAME_TIME_MS - timeConsumed;
    const minutes = Math.floor(timeLeftMs / (1000 * 60));
    const remainingSeconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
    return (
      <div className="text-white">
        Time Left: {minutes < 10 ? '0' : ''}
        {minutes}:{remainingSeconds < 10 ? '0' : ''}
        {remainingSeconds}
      </div>
    );
  };

  const handleExit = () => {
    socket?.send(
      JSON.stringify({
        type: EXIT_GAME,
        payload: { gameId },
      }),
    );
    setMoves([]);
    navigate('/');
  };

  // FIXED: Single sendChat function for the main socket
  function sendChat() {
    const text = chatInput.trim();
    if (!text || !socket || !gameId) return;
    socket.send(
      JSON.stringify({
        type: CHAT_SEND,
        payload: { gameId, text },
      }),
    );
    setChatInput('');
  }

  function onChatKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') sendChat();
  }

  if (!socket) return <div>Connecting...</div>;

  return (
    <div className="">
      {result && (
        <GameEndModal
          blackPlayer={gameMetadata?.blackPlayer}
          whitePlayer={gameMetadata?.whitePlayer}
          gameResult={result}
        />
      )}
      {started && (
        <div className="justify-center flex pt-4 text-white">
          {(user.id === gameMetadata?.blackPlayer?.id ? 'b' : 'w') === chess.turn()
            ? 'Your turn'
            : "Opponent's turn"}
        </div>
      )}
      <div className="justify-center flex">
        <div className="pt-2 w-full">
          <div className="flex gap-8 w-full">
            <div className="text-white">
              <div className="flex justify-center">
                <div>
                  {started && (
                    <div className="mb-4">
                      <div className="flex justify-between">
                        <UserAvatar gameMetadata={gameMetadata} />
                        {getTimer(
                          user.id === gameMetadata?.whitePlayer?.id
                            ? player2TimeConsumed
                            : player1TimeConsumed,
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="w-full flex justify-center text-white">
                      <ChessBoard
                        started={started}
                        gameId={gameId ?? ''}
                        myColor={user.id === gameMetadata?.blackPlayer?.id ? 'b' : 'w'}
                        chess={chess}
                        setBoard={setBoard}
                        socket={socket}
                        board={board}
                      />
                    </div>
                  </div>
                  {started && (
                    <div className="mt-4 flex justify-between">
                      <UserAvatar gameMetadata={gameMetadata} self />
                      {getTimer(
                        user.id === gameMetadata?.blackPlayer?.id
                          ? player2TimeConsumed
                          : player1TimeConsumed,
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Moves on top, Chat below */}
            <div className="rounded-md pt-2 bg-bgAuxiliary3 flex-1 h-[95vh] flex flex-col">
              {!started ? (
                <div className="pt-8 flex justify-center w-full flex-1">
                  {added ? (
                    <div className="flex flex-col items-center space-y-4 justify-center">
                      <div className="text-white">
                        <Waitopponent />
                      </div>
                      <ShareGame gameId={gameID} />
                    </div>
                  ) : (
                    gameId === 'random' && (
                      <Button
                        className="h-20 w-32 px-4 py-2 text-2xl rounded-md flex-shrink-0 flex items-center justify-center"
                        onClick={() => {
                          socket.send(JSON.stringify({ type: INIT_GAME }));
                        }}
                      >
                        Play
                      </Button>
                    )
                  )}
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-4 flex-1">
                  {/* Moves panel (top) */}
                  <div className="rounded-md bg-zinc-800/50 border border-zinc-700 p-3 flex-none">
                    <div className="text-white font-semibold mb-2">Moves</div>
                    <div className="max-h-64 overflow-y-auto pr-1">
                      <MovesTable />
                    </div>
                  </div>

                  {/* FIXED: Chat panel using single WebSocket connection */}
                  <div className="rounded-md bg-zinc-800/50 border border-zinc-700 p-3 flex-1 flex flex-col">
                    <div className="text-white font-semibold mb-2">Chat</div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {chatMessages.map((m, idx) => {
                        const mine = m.fromUserId === user.id;
                        return (
                          <div key={`${m.ts}-${m.fromUserId}-${idx}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                                mine ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-white'
                              }`}
                            >
                              <div className="opacity-70 text-xs mb-0.5">{mine ? 'Me' : 'Opponent'}</div>
                              <div className="whitespace-pre-wrap break-words">{m.text}</div>
                              <div className="opacity-50 text-[10px] mt-1">
                                {new Date(m.ts).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={onChatKeyDown}
                        placeholder="Type a message…"
                        className="flex-1 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-white outline-none"
                      />
                      <Button onClick={sendChat}>Send</Button>
                    </div>
                  </div>

                  {/* Exit button row */}
                  <div className="flex-none">
                    <ExitGameModel onClick={() => handleExit()} />
                  </div>
                </div>
              )}
            </div>
            {/* End right column */}
          </div>
        </div>
      </div>
    </div>
  );
};