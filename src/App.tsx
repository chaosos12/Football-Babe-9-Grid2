import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Play, RotateCcw, Trophy, Heart, Info, ChevronRight, Key, ExternalLink, DollarSign, History, X, PlayCircle } from 'lucide-react';
import { GameState, RewardTier, GridItem, GameResult, GameRecord } from './types';
import { GRID_CONFIG, BET_OPTIONS, REWARD_MULTIPLIERS, CUSTOM_IMAGES } from './constants';
import { generateBabeImage, STADIUM_FALLBACK } from './services/imageService';
import { apiService } from './services/api';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const CoinRain = () => {
  const coins = Array.from({ length: 20 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {coins.map((_, i) => (
        <motion.div
          key={`coin-${i}`}
          initial={{ 
            top: -50, 
            left: `${Math.random() * 100}%`,
            rotate: 0,
            opacity: 1
          }}
          animate={{ 
            top: '120%',
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 2 + Math.random() * 2,
            ease: "linear",
            delay: Math.random() * 2,
            repeat: Infinity
          }}
          className="absolute"
        >
          <div className="bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.5)] border border-yellow-200">
            <div className="w-5 h-5 rounded-full border border-yellow-500/50 bg-yellow-300"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const CoinExplosion = ({ betAmount }: { betAmount: number }) => {
  // Determine number of coins and explosion radius based on bet amount
  let numCoins = 15;
  let maxRadius = 150;
  let duration = 1.5;
  let colorClass = "bg-yellow-400 border-yellow-200 text-yellow-700 shadow-[0_0_10px_rgba(250,204,21,0.5)]";

  if (betAmount >= 500) {
    numCoins = 60;
    maxRadius = 350;
    duration = 2.5;
    colorClass = "bg-amber-300 border-amber-100 text-amber-800 shadow-[0_0_20px_rgba(251,191,36,0.8)]";
  } else if (betAmount >= 100) {
    numCoins = 40;
    maxRadius = 250;
    duration = 2;
    colorClass = "bg-yellow-300 border-yellow-100 text-yellow-700 shadow-[0_0_15px_rgba(253,224,71,0.6)]";
  } else if (betAmount >= 50) {
    numCoins = 25;
    maxRadius = 200;
    duration = 1.8;
  }

  const coins = Array.from({ length: numCoins });

  return (
    <div className="fixed inset-0 pointer-events-none z-[40] overflow-hidden flex items-end justify-center pb-32">
      <div className="relative w-0 h-0">
        {coins.map((_, i) => {
          // Calculate random angle and distance for explosion
          // Restrict angle to upper half (PI to 2*PI, or 180 to 360 degrees)
          const angle = Math.PI + Math.random() * Math.PI;
          const distance = Math.random() * maxRadius + 100;
          const tx = Math.cos(angle) * distance * 0.8; // slightly narrower spread
          const ty = Math.sin(angle) * distance * 1.5; // shoot higher up
          
          return (
            <motion.div
              key={`explode-coin-${i}`}
              initial={{ 
                x: 0,
                y: 0,
                scale: 0,
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                x: tx,
                y: ty, // Remove the gravity effect that pulls it down
                scale: [0, 1.2, 0.8, 0],
                rotate: 360 * (Math.random() > 0.5 ? 2 : -2),
                opacity: [1, 1, 0]
              }}
              transition={{ 
                duration: duration * (0.8 + Math.random() * 0.4),
                ease: "easeOut",
                delay: Math.random() * 0.1,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="absolute -ml-4 -mt-4"
            >
              <div className={`rounded-full w-7 h-7 flex items-center justify-center border ${colorClass}`}>
                <div className="w-4 h-4 rounded-full border border-current opacity-50"></div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const VideoLayer: React.FC<{ src: string, isActive: boolean, onEnded?: () => void }> = ({ src, isActive, onEnded }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.warn("Video autoplay failed, waiting for user interaction:", err);
      });
    } else if (!isActive && videoRef.current) {
      // Pause after fade out to save CPU
      const timer = setTimeout(() => {
        if (videoRef.current) videoRef.current.pause();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      src={src}
      loop={!onEnded}
      muted
      playsInline
      preload="auto"
      onEnded={onEnded}
      className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${
        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
      }`}
    />
  );
};

const TransitionOverlay = ({ isActive, onTransitionEnd, videoRef }: { isActive: boolean, onTransitionEnd: () => void, videoRef: React.RefObject<HTMLVideoElement> }) => {
  const flyTriggeredRef = React.useRef(false);

  useEffect(() => {
    let fallbackTimer: NodeJS.Timeout;
    if (isActive && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      flyTriggeredRef.current = false;
      
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Transition video play failed:", err);
          // Fallback if video fails to play
          fallbackTimer = setTimeout(() => {
            if (!flyTriggeredRef.current) {
              flyTriggeredRef.current = true;
              onTransitionEnd();
            }
          }, 2200); // 2.2 seconds fallback
        });
      }
    } else if (!isActive && videoRef.current) {
      videoRef.current.pause();
    }
    return () => clearTimeout(fallbackTimer);
  }, [isActive, videoRef, onTransitionEnd]);

  return (
    <div className={`fixed inset-0 z-[60] bg-black flex items-center justify-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <video
        ref={videoRef}
        src={CUSTOM_IMAGES.TRANSITION_VIDEO}
        muted
        playsInline
        preload="auto"
        onTimeUpdate={(e) => {
          if (!isActive) return;
          const video = e.currentTarget;
          if (video.currentTime >= 2.2 && !flyTriggeredRef.current) {
            flyTriggeredRef.current = true;
            onTransitionEnd();
          }
        }}
        onEnded={() => {
          if (isActive && !flyTriggeredRef.current) {
            flyTriggeredRef.current = true;
            onTransitionEnd();
          }
        }}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-10 left-0 w-full text-center">
        <motion.div 
          animate={{ opacity: isActive ? [0.4, 1, 0.4] : 0 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-emerald-400 font-black italic tracking-[0.3em] text-xl uppercase"
        >
          Preparing Arena...
        </motion.div>
      </div>
    </div>
  );
};

export default function App() {
  const [balance, setBalance] = useState(1000);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [selectedBet, setSelectedBet] = useState(10);
  const [bets, setBets] = useState<Record<number, number>>({});
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<9 | 16 | 32>(9);

  const currentTotalBet = React.useMemo(() => (Object.values(bets) as number[]).reduce((sum: number, bet: number) => sum + bet, 0), [bets]);
  const [babeImage, setBabeImage] = useState<string>(STADIUM_FALLBACK);
  const [spinningIndex, setSpinningIndex] = useState<number | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [pendingResult, setPendingResult] = useState<{item: GridItem, multiplier: number, winAmount: number, resultTier: RewardTier} | null>(null);
  const [pendingBabeImage, setPendingBabeImage] = useState<string | null>(null);
  const [isResultVideoReady, setIsResultVideoReady] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<GameRecord[]>([]);
  const [currentView, setCurrentView] = useState<'GAME' | 'HISTORY'>('GAME');
  const [replayRecord, setReplayRecord] = useState<GameRecord | null>(null);
  const [isReplayTransitioning, setIsReplayTransitioning] = useState(false);
  const flyTriggeredRef = React.useRef(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const transitionVideoRef = React.useRef<HTMLVideoElement>(null);

  const allVideos = React.useMemo(() => [
    CUSTOM_IMAGES.BABES.IDLE,
    ...CUSTOM_IMAGES.BABES.WIN_BIG,
    ...CUSTOM_IMAGES.BABES.LOSE,
    ...Object.values(CUSTOM_IMAGES.ENCOURAGE_VIDEOS)
  ], []);

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      setIsImageLoading(true);
      try {
        // Load balance and history from API
        const [initialBalance, history] = await Promise.all([
          apiService.getBalance(),
          apiService.getHistory()
        ]);
        setBalance(initialBalance);
        setHistoryRecords(history);

        // Pass a non-existent tier to trigger the default (IDLE) case in imageService
        const img = await generateBabeImage('IDLE' as any);
        setBabeImage(img);
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        setIsImageLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Force video play on source change (removed as we now use VideoLayer)

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleBetSelect = (amount: number) => {
    if (gameState !== GameState.IDLE) return;
    setSelectedBet(amount);
    if (activeNumber !== null) {
      setBets(prev => ({ ...prev, [activeNumber]: amount }));
    }
  };

  const clearBets = () => {
    if (gameState !== GameState.IDLE) return;
    setBets({});
    setActiveNumber(null);
  };

  const startSpin = useCallback(async () => {
    const totalBet = (Object.values(bets) as number[]).reduce((sum: number, bet: number) => sum + bet, 0);
    if (totalBet === 0) {
      showToast("Please select at least one number!");
      return;
    }
    if (balance < totalBet) {
      showToast("Insufficient balance!");
      return;
    }

    setActiveNumber(null);
    setShowConfirm(false);

    try {
      // Call API to play game
      const response = await apiService.playGame(bets, gridSize);
      
      if (!response.success) {
        showToast(response.error || "Failed to play game");
        return;
      }

      const { winningNumber, isWin, winAmount, newBalance } = response.result;
      const resultTier = isWin ? RewardTier.BIG : RewardTier.NONE;
      const selectedItem = { id: winningNumber, number: winningNumber, weight: 0, tier: resultTier };
      const multiplier = winAmount > 0 ? gridSize : 0;

      setPendingResult({ item: selectedItem, multiplier, winAmount, resultTier });
      
      // Pre-fetch the result video/image immediately
      setIsResultVideoReady(false);
      generateBabeImage(resultTier).then(img => {
        setPendingBabeImage(img);
        
        // Update the record with the video URL
        const updatedRecord = { ...response.record, videoUrl: img };
        setHistoryRecords(prev => [updatedRecord, ...prev].slice(0, 50));
      });

      // Update balance immediately for UI responsiveness
      setBalance(newBalance - winAmount); // We'll add the winAmount back during finishGame

      setGameState(GameState.PRE_SPIN);
      setBabeImage(CUSTOM_IMAGES.BABES.IDLE);
      flyTriggeredRef.current = false;
      setResult(null);

      // Try to play synchronously
      if (transitionVideoRef.current) {
        transitionVideoRef.current.currentTime = 0;
        transitionVideoRef.current.play().catch(console.error);
      }
    } catch (error: any) {
      showToast(error.message || "An error occurred");
    }
  }, [balance, selectedBet, bets, gridSize]);

  const handleTransitionEnd = useCallback(() => {
    if (gameState !== GameState.PRE_SPIN || flyTriggeredRef.current) return;
    
    if (!pendingResult) return;

    flyTriggeredRef.current = true;
    setGameState(GameState.FOOTBALL_FLY);
    
    // Football fly duration
    setTimeout(() => {
      setGameState(GameState.SPINNING);
      
      let currentStep = 0;
      const targetIdx = pendingResult.item.id - 1;
      const rounds = 3; // Spin around 3 times
      const totalSteps = rounds * gridSize + targetIdx;

      const animate = () => {
        if (currentStep <= totalSteps) {
          setSpinningIndex(currentStep % gridSize);
          
          // Easing logic: slow down as it approaches the end
          const progress = currentStep / totalSteps;
          const delay = 30 + Math.pow(progress, 3) * 300;
          
          currentStep++;
          setTimeout(animate, delay);
        } else {
          // Pause for 1 second on the winning number before showing result
          setTimeout(() => {
            if (pendingResult) {
              finishGame(pendingResult.item, pendingResult.multiplier, pendingResult.winAmount, pendingResult.resultTier);
              setPendingResult(null);
            }
          }, 1000);
        }
      };

      animate();
    }, 800); // Football fly duration
  }, [gameState, pendingResult, gridSize]);

  // Fallback for transition video
  useEffect(() => {
    if (gameState === GameState.PRE_SPIN) {
      const timer = setTimeout(() => {
        if (!flyTriggeredRef.current) {
          handleTransitionEnd();
        }
      }, 5000); // 5s fallback
      return () => clearTimeout(timer);
    }
  }, [gameState, handleTransitionEnd]);

  const finishGame = async (item: GridItem, multiplier: number, winAmount: number, resultTier: RewardTier) => {
    const gameResult: GameResult = { item, multiplier, winAmount };
    
    // Use pre-fetched image if available
    const newImg = pendingBabeImage || await generateBabeImage(resultTier);
    
    // Update everything in one go
    setBabeImage(newImg);
    setResult(gameResult);
    setBalance(prev => prev + winAmount);
    setGameState(GameState.RESULT);

    setPendingBabeImage(null);
    setIsResultVideoReady(false);
  };

  const resetGame = async () => {
    const previousBets = Object.keys(bets).map(Number);
    setGameState(GameState.IDLE);
    setResult(null);
    setSpinningIndex(null);
    if (previousBets.length > 0) {
      setActiveNumber(previousBets[0]);
    } else {
      setActiveNumber(null);
    }
    // Return to the default IDLE video
    const img = await generateBabeImage('IDLE' as any);
    setBabeImage(img);
  };

  const toggleGridItem = (id: number) => {
    if (gameState !== GameState.IDLE) return;
    
    const maxAllowed = Math.round(gridSize * 0.6);
    
    if (activeNumber === id) {
      // Toggle off
      setActiveNumber(null);
      setBets(prev => {
        const newBets = { ...prev };
        delete newBets[id];
        return newBets;
      });
    } else {
      // Select new number
      if (!bets[id] && Object.keys(bets).length >= maxAllowed) {
        showToast(`You can only bet on up to ${maxAllowed} numbers!`);
        return;
      }
      
      setActiveNumber(id);
      setBets(prev => {
        const currentBet = prev[id];
        if (currentBet) {
          setSelectedBet(currentBet);
          return prev;
        } else {
          return { ...prev, [id]: selectedBet };
        }
      });
    }
  };

  // Helper to check if a URL is a video
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|mov|ogg)($|\?)/i) || url.includes('video') || url.includes('dustonss.xyz');
  };

  const exitReplay = () => {
    setIsReplayTransitioning(true);
    setTimeout(() => {
      setReplayRecord(null);
      resetGame();
      setCurrentView('HISTORY');
      setIsReplayTransitioning(false);
    }, 500);
  };

  const startReplay = (record: GameRecord) => {
    setIsReplayTransitioning(true);
    
    setTimeout(() => {
      setCurrentView('GAME');
      setReplayRecord(record);
      setGridSize(record.gridSize as any);
      setBets(record.bets);
      setGameState(GameState.IDLE);
      setBabeImage(CUSTOM_IMAGES.BABES.IDLE);
      setIsGridVisible(true);
      
      // Start the replay sequence after a short delay
      setTimeout(() => {
        setIsReplayTransitioning(false);
        setGameState(GameState.FOOTBALL_FLY);
        
        setTimeout(() => {
          setGameState(GameState.SPINNING);
          
          let currentStep = 0;
          const targetIdx = record.winningNumber - 1;
          const rounds = 3; // Spin around 3 times
          const totalSteps = rounds * record.gridSize + targetIdx;

          const animate = () => {
            if (currentStep <= totalSteps) {
              setSpinningIndex(currentStep % record.gridSize);
              
              // Easing logic: slow down as it approaches the end
              const progress = currentStep / totalSteps;
              const delay = 30 + Math.pow(progress, 3) * 300;
              
              currentStep++;
              setTimeout(animate, delay);
            } else {
              // Pause for 1 second on the winning number before showing result
              setTimeout(() => {
                setBabeImage(record.videoUrl);
                setResult({
                  item: { id: record.winningNumber, number: record.winningNumber, weight: 1, tier: RewardTier.NONE },
                  multiplier: 0,
                  winAmount: record.winAmount
                });
                setGameState(GameState.RESULT);
              }, 1000);
            }
          };

          animate();
        }, 800); // Football fly duration
      }, 100);
    }, 500);
  };

  const historyContent = (
    <div className="h-[100dvh] w-full bg-zinc-950 text-white font-sans overflow-hidden flex flex-col relative">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 bg-zinc-900 border-b border-white/10 shrink-0">
        <button onClick={() => setCurrentView('GAME')} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" />
          GAME HISTORY
        </h2>
      </div>
      
      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {historyRecords.length === 0 ? (
          <div className="text-center text-zinc-500 py-20 font-bold">
            No records yet. Play a game!
          </div>
        ) : (
          historyRecords.map(record => (
            <div key={record.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-500 font-mono">{new Date(record.timestamp).toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-400">Bet: {record.totalBet}</span>
                  <span className={`text-sm font-black ${record.isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                    {record.isWin ? `Win: +${record.winAmount}` : `Loss: -${record.totalBet}`}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">Result: #{record.winningNumber} ({record.gridSize} Grid)</span>
              </div>
              
              <button 
                onClick={() => startReplay(record)}
                className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors shrink-0"
              >
                <PlayCircle className="w-6 h-6" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const gameContent = (
    <div className="h-[100dvh] w-full bg-zinc-950 text-white font-sans overflow-hidden flex flex-col relative">
      {/* Fixed Background Visual */}
      <div className="absolute inset-0 z-0 bg-black">
        {allVideos.map((src) => (
          <VideoLayer 
            key={src} 
            src={src} 
            isActive={src === babeImage} 
            onEnded={(replayRecord && src === replayRecord.videoUrl) ? exitReplay : undefined}
          />
        ))}
        {!isVideo(babeImage) && (
          <img
            src={babeImage}
            className="absolute inset-0 w-full h-full object-cover object-center z-10"
            alt="Football Babe Stadium"
            referrerPolicy="no-referrer"
          />
        )}
        {/* Conditional overlays: Lighter in IDLE, darker during gameplay, NONE in RESULT */}
        <motion.div 
          animate={{ 
            opacity: gameState === GameState.IDLE ? 0.2 : 
                     gameState === GameState.RESULT ? 0 : 0.8 
          }}
          className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-zinc-950 z-20 pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            opacity: gameState === GameState.IDLE || gameState === GameState.RESULT ? 0 : 0.4 
          }}
          className="absolute inset-0 bg-zinc-950 z-20 pointer-events-none" 
        />
      </div>

      {/* UI Layer - Hidden during RESULT or Confirm to show babe clearly */}
      <motion.div 
        animate={{ 
          opacity: (gameState === GameState.RESULT || showConfirm) ? 0 : 1, 
          pointerEvents: (gameState === GameState.RESULT || showConfirm || replayRecord) ? 'none' : 'auto' 
        }}
        className="relative z-10 flex-1 flex flex-col h-full overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 h-10 rounded-full border border-white/10 shadow-2xl">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="font-mono font-black text-xl tracking-tight">{replayRecord ? "REPLAY" : balance.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/60 backdrop-blur-xl rounded-full border border-white/10 p-1 h-10">
              {[9, 16, 32].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    if (gameState === GameState.IDLE && !replayRecord) {
                      setGridSize(size as 9 | 16 | 32);
                      setBets({});
                      setActiveNumber(null);
                    }
                  }}
                  className={`px-3 h-full rounded-full text-xs font-bold transition-colors ${
                    gridSize === size ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div 
              onClick={() => { if (!replayRecord) setShowRules(true); }}
              className={`w-10 h-10 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center transition-colors ${replayRecord ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}`}
            >
              <Info className="w-5 h-5 text-zinc-400" />
            </div>
            <div 
              onClick={() => { if (!replayRecord) setCurrentView('HISTORY'); }}
              className={`w-10 h-10 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center transition-colors ${replayRecord ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}`}
            >
              <History className="w-5 h-5 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Hero Title */}
        <div className="px-6 pt-2">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] font-black text-emerald-400 mb-1">Live Stadium</span>
            <h1 className="text-4xl font-black italic tracking-tighter leading-none drop-shadow-2xl">
              FOOTBALL<br/>
              <span className="text-emerald-400">BABES</span>
            </h1>
          </motion.div>
        </div>

        {/* 9-Grid - Centered in available space */}
        <div className="flex-1 flex items-center justify-center pointer-events-none z-0 py-2">
          <AnimatePresence>
            {gameState === GameState.FOOTBALL_FLY && (
              <motion.div
                initial={{ scale: 0, x: -200, y: 300, rotate: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1], 
                  x: 0, 
                  y: 0, 
                  rotate: 720, 
                  opacity: 1 
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  initial={{ scale: 0, x: -200, y: 300, rotate: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 1], 
                    x: 0, 
                    y: 0, 
                    rotate: 720, 
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-32 h-32 flex items-center justify-center drop-shadow-[0_0_35px_rgba(255,255,255,0.8)]"
                >
                  <img 
                    src="https://aivideo.dustonss.xyz/upload/2026/02/27/1772171542691_ztrfy4.png" 
                    className="w-full h-full object-contain"
                    alt="Football"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </motion.div>
            )}

            {gameState !== GameState.PRE_SPIN && isGridVisible && (
              <div key="grid-container" className="relative flex flex-col items-center pointer-events-auto">
                <AnimatePresence>
                  {gameState === GameState.IDLE && Object.keys(bets).length === 0 && (
                    <motion.div
                      key="idle-tooltip"
                      initial={{ opacity: 0, y: "-50%", x: "-50%" }}
                      animate={{ opacity: 1, y: ["-50%", "-60%", "-50%"], x: "-50%" }}
                      exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
                      transition={{ 
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 },
                        y: { repeat: Infinity, duration: 1.5 }
                      }}
                      className="absolute top-1/2 left-1/2 w-[240px] text-center text-emerald-400 font-black italic tracking-wider text-sm bg-black/80 px-4 py-3 rounded-full border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.4)] z-20 pointer-events-none flex items-center justify-center gap-2"
                    >
                      <span className="text-lg shrink-0">👇</span> 
                      <span className="leading-tight">Select your lucky numbers!</span> 
                      <span className="text-lg shrink-0">👇</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className={`w-[320px] max-w-[90vw] grid p-2 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-2xl relative z-10 bg-black/40 ${
                    gridSize === 9 ? 'grid-cols-3 gap-2' : gridSize === 16 ? 'grid-cols-4 gap-2' : 'grid-cols-8 gap-1'
                  }`}
                >
                  {Array.from({ length: gridSize }, (_, i) => ({ id: i + 1, number: i + 1 })).map((item, idx) => {
                    const betAmount = bets[item.id] || 0;
                    const isActive = activeNumber === item.id;
                    const hasBet = betAmount > 0;
                    const isSpinning = spinningIndex === idx;
                    const isResult = gameState === GameState.RESULT && result?.item.id === item.id;
                    
                    let bgColor = 'rgba(255, 255, 255, 0.05)';
                    let borderColor = 'rgba(255, 255, 255, 0.05)';
                    let shadow = 'none';
                    let scale = 1;

                    if (isSpinning || isResult) {
                      bgColor = 'rgba(16, 185, 129, 0.9)'; // Emerald
                      borderColor = '#10b981';
                      shadow = '0 0 25px rgba(16, 185, 129, 0.6)';
                      scale = 1.1;
                    } else if (isActive) {
                      bgColor = 'rgba(59, 130, 246, 0.8)'; // Blue
                      borderColor = '#3b82f6';
                      shadow = '0 0 15px rgba(59, 130, 246, 0.5)';
                      scale = 1.05;
                    } else if (hasBet) {
                      bgColor = 'rgba(234, 179, 8, 0.2)'; // Yellow
                      borderColor = 'rgba(234, 179, 8, 0.4)';
                    }

                    return (
                      <motion.div
                        key={item.id}
                        onClick={() => toggleGridItem(item.id)}
                        animate={{
                          scale,
                          backgroundColor: bgColor,
                          borderColor,
                          boxShadow: shadow,
                        }}
                        className={`flex flex-col items-center justify-center relative overflow-hidden ${gameState === GameState.IDLE ? 'cursor-pointer hover:bg-white/10' : ''} ${gridSize === 32 ? 'rounded-md aspect-square' : 'rounded-xl aspect-[4/3]'}`}
                      >
                        <span className={`font-black font-mono ${(isSpinning || isResult || isActive || hasBet) ? 'text-white' : 'text-white/40'} ${gridSize === 32 ? 'text-xs' : 'text-xl'}`}>
                          {item.number}
                        </span>
                        {betAmount > 0 && (
                          <span className={`text-yellow-400 font-bold ${gridSize === 32 ? 'text-[8px] leading-none' : 'text-xs'}`}>
                            {gridSize === 32 ? betAmount : `${betAmount}`}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls - Sticky at bottom */}
        {!replayRecord && (
          <div className="mt-auto shrink-0 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 px-4 pt-4 pb-6">
            <div className="max-w-md mx-auto flex flex-col gap-3">
              {/* Bet Info & Selectors - Hidden before Play Now is clicked */}
              {isGridVisible && (
                <>
                  {/* Bet Info */}
                  <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-0.5">Your Stake</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-black italic tracking-tighter">{selectedBet}</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase">Coins</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-black mb-0.5">Max Payout</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-black italic tracking-tighter text-emerald-400">
                          {Object.values(bets).length > 0 ? Math.max(...(Object.values(bets) as number[])) * gridSize : 0}
                        </span>
                        <ChevronRight className="w-3 h-3 text-emerald-500/50" />
                      </div>
                    </div>
                  </div>

                  {/* Bet Selectors */}
                  <div className="grid grid-cols-4 gap-2 px-2">
                    {BET_OPTIONS.map(amount => (
                      <button
                        key={amount}
                        onClick={() => handleBetSelect(amount)}
                        className={`py-2 rounded-xl font-black text-xs sm:text-sm transition-all border-2 ${
                          selectedBet === amount 
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105' 
                            : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
                        }`}
                      >
                        {amount}
                      </button>
                    ))}
                    <button
                      onClick={clearBets}
                      className="col-span-2 py-2 rounded-xl font-black text-xs sm:text-sm transition-all border-2 bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40"
                    >
                      CLEAR
                    </button>
                  </div>
                </>
              )}

              {/* Main Action Button */}
              <button
                onClick={() => {
                  if (!isGridVisible) {
                    setIsGridVisible(true);
                  } else {
                    if (balance < currentTotalBet) {
                      showToast("Insufficient balance!");
                      return;
                    }
                    if (Object.keys(bets).length === 0) {
                      showToast("Please select at least one number!");
                      return;
                    }
                    const maxBet = Math.max(...(Object.values(bets) as number[]));
                    setBabeImage(CUSTOM_IMAGES.ENCOURAGE_VIDEOS[maxBet] || CUSTOM_IMAGES.BABES.IDLE);
                    setShowConfirm(true);
                  }
                }}
                disabled={isGridVisible && (gameState !== GameState.IDLE || Object.keys(bets).length === 0)}
                className={`w-full py-3.5 rounded-2xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3 uppercase italic tracking-tighter ${
                  isGridVisible && (gameState !== GameState.IDLE || Object.keys(bets).length === 0)
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_15px_35px_rgba(16,185,129,0.4)] text-white'
                }`}
              >
                <Play className="w-6 h-6 fill-current" />
                {!isGridVisible ? 'Play Now' : (Object.keys(bets).length > 0 ? `Spin & Win (${currentTotalBet} Coins)` : 'Select Numbers')}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Overlays */}
      <TransitionOverlay 
        isActive={gameState === GameState.PRE_SPIN} 
        onTransitionEnd={handleTransitionEnd} 
        videoRef={transitionVideoRef}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            className="fixed top-1/2 left-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 font-bold text-sm whitespace-nowrap"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRules && (
          <motion.div
            key="rules-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 w-full max-w-sm rounded-3xl border border-white/10 p-6 shadow-2xl relative"
            >
              <div className="absolute top-4 right-4 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/10" onClick={() => setShowRules(false)}>
                <span className="text-zinc-400 font-bold text-sm">✕</span>
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter mb-4 text-white">GAME RULES</h2>
              <div className="space-y-4 text-sm text-zinc-400 font-medium">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">1</div>
                  <p>Choose your grid size (<span className="text-white font-bold">9, 16, or 32</span>) and select one or more lucky numbers.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">2</div>
                  <p>Choose your <span className="text-white font-bold">bet amount per number</span> (10, 50, 100, or 500 Coins).</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">3</div>
                  <p>Click <span className="text-emerald-400 font-bold italic">YES, SPIN!</span> to start the game.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">4</div>
                  <p>Every round, exactly <span className="text-white font-bold">one winning number</span> is randomly chosen.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">5</div>
                  <p>If your selected number hits, you win a multiplier equal to the grid size: <span className="text-emerald-400 font-bold">9x, 16x, or 32x</span>!</p>
                </div>
              </div>
              <button
                onClick={() => setShowRules(false)}
                className="w-full mt-6 py-3 rounded-xl bg-white/5 font-bold text-white hover:bg-white/10 transition-colors"
              >
                GOT IT
              </button>
            </motion.div>
          </motion.div>
        )}

        {showConfirm && (
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-zinc-950/95 w-full rounded-t-[2rem] border-t border-white/10 p-6 text-center shadow-2xl backdrop-blur-2xl pointer-events-auto"
            >
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <Coins className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black mb-3 italic tracking-tighter">CONFIRM BETS?</h3>
              
              <div className="mb-4 flex flex-wrap gap-1.5 justify-center p-2 bg-black/40 rounded-xl border border-white/5">
                {Object.entries(bets).map(([id, amount]) => (
                  <div key={id} className="bg-white/5 px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 border border-white/10">
                    <span className="text-emerald-400">#{id}</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-yellow-400">{amount}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-zinc-300 mb-4 text-sm font-black">
                Total Stake: <span className="text-white text-xl">{currentTotalBet}</span>
              </p>
              
              <div className="flex gap-2 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setBabeImage(CUSTOM_IMAGES.BABES.IDLE);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={startSpin}
                  className="flex-1 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-transform"
                >
                  Confirm Spin
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showConfirm && (
          <motion.div key="coin-explosion" className="fixed inset-0 pointer-events-none z-[40]">
            <CoinExplosion betAmount={selectedBet} />
          </motion.div>
        )}

        {gameState === GameState.RESULT && result && result.winAmount > 0 && (
          <motion.div key="coin-rain" className="fixed inset-0 pointer-events-none z-[60]">
            <CoinRain />
          </motion.div>
        )}

        {gameState === GameState.RESULT && result && (
          <motion.div
            key="result-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-end p-6 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="bg-white/10 backdrop-blur-xl w-full max-w-[280px] rounded-[2.5rem] border border-white/20 p-6 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-8 pointer-events-auto"
            >
              {/* Subtle glow effect based on win/loss */}
              <div className={`absolute inset-0 opacity-10 ${result.winAmount > 0 ? 'bg-yellow-400' : 'bg-white'}`} />
              
              <div className="relative z-10">
                {result.winAmount > 0 ? (
                  <>
                    <h2 className="text-2xl font-black text-white mb-0.5 italic tracking-tighter leading-none">
                      {result.item.tier === RewardTier.BIG ? "JACKPOT!" : "WINNER!"}
                    </h2>
                    <div className="text-4xl font-black text-yellow-400 mb-4 tracking-tighter drop-shadow-md">
                      +{result.winAmount}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-black text-white mb-4 italic tracking-tighter">
                      TRY AGAIN!
                    </h2>
                  </>
                )}

                {!replayRecord && (
                  <button
                    onClick={resetGame}
                    className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-base hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 uppercase italic tracking-tighter"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Continue
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Replay Button - Sibling to UI Layer to remain clickable and not obscure */}
      {replayRecord && (
        <div className="relative z-50 shrink-0 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 px-4 pt-4 pb-6 pointer-events-auto">
          <div className="max-w-md mx-auto">
            <button 
              onClick={exitReplay}
              className="w-full py-3.5 rounded-2xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3 uppercase italic tracking-tighter bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <X className="w-6 h-6" /> Exit Replay
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {currentView === 'HISTORY' ? historyContent : gameContent}
      
      <AnimatePresence>
        {isReplayTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200] bg-black pointer-events-none"
          />
        )}
      </AnimatePresence>
    </>
  );
}
