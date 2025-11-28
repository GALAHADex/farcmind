import React, { useState, useEffect, useCallback, useRef } from 'react';

const TILE_FEEDBACK_DURATION = 800;
const LEVEL_UP_FEEDBACK_DURATION = 1800;
const GAME_URL = 'https://farcmind.vercel.app';

const THEME_COLORS = {
  default: { id: 'default', name: 'Farcaster', bg: '#020617', primary: '#7c3aed', secondary: '#a855f7', tileLit: '#a855f7', text: '#e5e7eb' },
  theme_neon: { id: 'theme_neon', name: 'Neon', bg: '#000000', primary: '#00ff00', secondary: '#39ff14', tileLit: '#39ff14', text: '#bbf7d0' },
  theme_ocean: { id: 'theme_ocean', name: 'Ocean', bg: '#0f172a', primary: '#0ea5e9', secondary: '#38bdf8', tileLit: '#38bdf8', text: '#e0f2fe' },
  theme_fire: { id: 'theme_fire', name: 'Fire', bg: '#1c1917', primary: '#ea580c', secondary: '#f97316', tileLit: '#ef4444', text: '#ffedd5' },
  theme_nature: { id: 'theme_nature', name: 'Nature', bg: '#022c22', primary: '#16a34a', secondary: '#4ade80', tileLit: '#22c55e', text: '#dcfce7' },
  theme_space: { id: 'theme_space', name: 'Space', bg: '#020617', primary: '#6366f1', secondary: '#818cf8', tileLit: '#818cf8', text: '#e0e7ff' }
};

const SHOP_ITEMS = [
  { id: 'shield', name: 'Mistake Shield', price: 150, icon: '🛡️', desc: 'Protects you from 1 mistake.', category: 'consumable' },
  { id: 'double_points', name: 'Double Points', price: 300, icon: '⚡', desc: '2x Points for the next round.', category: 'consumable' },
  { id: 'theme_neon', name: 'Neon Theme', price: 1000, icon: '🌈', desc: 'Cyberpunk neon vibes.', category: 'theme' },
  { id: 'theme_ocean', name: 'Ocean Theme', price: 1000, icon: '🌊', desc: 'Deep blue tones.', category: 'theme' },
  { id: 'theme_fire', name: 'Fire Theme', price: 1000, icon: '🔥', desc: 'Hot and energetic.', category: 'theme' },
  { id: 'theme_nature', name: 'Nature Theme', price: 1000, icon: '🌿', desc: 'Green and peaceful.', category: 'theme' },
  { id: 'theme_space', name: 'Space Theme', price: 1000, icon: '🌌', desc: 'Dark and starry.', category: 'theme' }
];

const INITIAL_DIAMONDS = 2500;

const DiamondIcon = () => <span className="diamond-icon">💎</span>;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export default function FarcMindApp() {
  const [phase, setPhase] = useState('enterName');
  const [activeTab, setActiveTab] = useState('play');

  const [playerName, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');

  const [diamonds, setDiamonds] = useState(INITIAL_DIAMONDS);
  const [inventory, setInventory] = useState([]);
  const [activeBuffs, setActiveBuffs] = useState({ shield: false, double_points: false });

  const [currentThemeId, setCurrentThemeId] = useState('default');
  const [isGameActive, setIsGameActive] = useState(false);

  const [grid, setGrid] = useState(3);
  const [seq, setSeq] = useState([]);
  const [lit, setLit] = useState([]);
  const [allowPress, setAllowPress] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [userClicks, setUserClicks] = useState([]);
  const [feedbackTile, setFeedbackTile] = useState(null);
  const [isGridScaled, setIsGridScaled] = useState(false);

  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const [initialLitCount, setInitialLitCount] = useState(3);

  const theme = THEME_COLORS[currentThemeId] || THEME_COLORS.default;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--bg', theme.bg);
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--secondary', theme.secondary);
      root.style.setProperty('--tileLit', theme.tileLit);
      root.style.setProperty('--text', theme.text);
    }
  }, [currentThemeId, theme]);

  useEffect(() => {
    if (isGameActive && gameStarted && !gameOver && !isPaused && phase === 'main') {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setTime((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isGameActive, gameStarted, gameOver, isPaused, phase]);

  const getLitCount = useCallback(
    (currentGrid) => {
      if (currentGrid === 3) return initialLitCount;
      return Math.min(currentGrid, 6);
    },
    [initialLitCount]
  );

  const generatePattern = useCallback(
    (currentGrid) => {
      const count = getLitCount(currentGrid);
      const total = currentGrid * currentGrid;
      const arr = [];
      while (arr.length < count) {
        const r = Math.floor(Math.random() * total);
        if (!arr.includes(r)) arr.push(r);
      }
      return arr;
    },
    [getLitCount]
  );

  const startRound = useCallback(
    (currentGrid, initialStart) => {
      setAllowPress(false);
      setGameOver(false);
      setCountdown(null);
      setUserClicks([]);
      setFeedbackTile(null);
      setIsPaused(false);

      const runPattern = () => {
        const newSeq = generatePattern(currentGrid);
        setSeq(newSeq);
        setLit(newSeq);

        setIsGridScaled(true);
        setTimeout(() => setIsGridScaled(false), 240);

        const displayDuration = currentGrid >= 6 ? 600 : 1000;

        setTimeout(() => {
          setLit([]);
          setTimeout(() => {
            setAllowPress(true);
          }, 400);
        }, displayDuration);
      };

      if (initialStart) {
        setGameStarted(true);
        setTime(0);
        setCountdown(3);
        setTimeout(() => setCountdown(2), 1000);
        setTimeout(() => setCountdown(1), 2000);
        setTimeout(() => setCountdown('START!'), 3000);

        setTimeout(() => {
          setCountdown(null);
          runPattern();
        }, 4000);
      } else {
        runPattern();
      }
    },
    [generatePattern]
  );

  const restartGame = useCallback(() => {
    const initialGrid = 3;
    setGrid(initialGrid);
    setScore(0);
    setGameOver(false);
    setSeq([]);
    setLit([]);
    setCountdown(null);
    setGameStarted(false);
    setUserClicks([]);
    setFeedbackTile(null);
    setTime(0);
    setIsPaused(false);

    startRound(initialGrid, true);
  }, [startRound]);

  const initializeGame = () => {
    setIsGameActive(true);
    restartGame();
  };

  const exitToMenu = () => {
    setIsGameActive(false);
    setGameStarted(false);
    setGameOver(false);
    setIsPaused(false);
    setCountdown(null);
    setUserClicks([]);
    setSeq([]);
    setLit([]);
  };

  const togglePause = () => {
    if (!gameStarted || gameOver || countdown) return;
    setIsPaused((prev) => !prev);
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setPlayerName(trimmed);
    setPhase('main');
  };

  const handleShare = () => {
    const text = `🧠 I scored ${score} points in ${formatTime(time)} in Farc !!! Mind! Can you do better?`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(
      text
    )}&embeds[]=${encodeURIComponent(GAME_URL)}`;

    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  const handlePurchase = (item) => {
    if (item.category === 'theme' && inventory.includes(item.id)) {
      if (typeof window !== 'undefined') window.alert('You already own this theme.');
      return;
    }
    if (item.category === 'consumable' && activeBuffs[item.id]) {
      if (typeof window !== 'undefined') window.alert('This buff is already active for the next game.');
      return;
    }
    if (diamonds < item.price) {
      if (typeof window !== 'undefined') window.alert('You need more diamonds.');
      return;
    }

    setDiamonds((prev) => prev - item.price);

    if (item.category === 'theme') {
      setInventory((prev) => [...prev, item.id]);
      setCurrentThemeId(item.id);
    } else if (item.category === 'consumable') {
      setActiveBuffs((prev) => ({ ...prev, [item.id]: true }));
    }
  };

  const changeTheme = (themeId) => {
    if (themeId === 'default' || inventory.includes(themeId)) {
      setCurrentThemeId(themeId);
    } else {
      if (typeof window !== 'undefined') window.alert('You need to buy this theme in the Shop first.');
    }
  };

  const pressTile = (i) => {
    if (!allowPress || gameOver || isPaused) return;
    if (userClicks.includes(i)) return;

    if (!seq.includes(i)) {
      if (activeBuffs.shield) {
        setActiveBuffs((prev) => ({ ...prev, shield: false }));
        setFeedbackTile({ index: i, message: 'SHIELDED!', isStar: false });
        setTimeout(() => setFeedbackTile(null), 800);
        return;
      }
      setGameOver(true);
      setAllowPress(false);
      return;
    }

    const newClicks = [...userClicks, i];
    setUserClicks(newClicks);

    const remaining = seq.filter((x) => !newClicks.includes(x));

    if (remaining.length === 0) {
      let pointsEarned = 10;
      let diamondsEarned = 2;

      if (activeBuffs.double_points) {
        pointsEarned = 20;
        diamondsEarned = 4;
        setActiveBuffs((prev) => ({ ...prev, double_points: false }));
      }

      const newScore = score + pointsEarned;
      setDiamonds((prev) => prev + diamondsEarned);

      let nextGrid = grid;
      let isNextLevel = false;

      if (newScore >= 50 && grid < 4) {
        nextGrid = 4;
        isNextLevel = true;
      } else if (newScore >= 120 && grid < 5) {
        nextGrid = 5;
        isNextLevel = true;
      } else if (newScore >= 200 && grid < 6) {
        nextGrid = 6;
        isNextLevel = true;
      } else if (newScore > 200 && newScore % 50 === 0) {
        nextGrid = Math.min(grid + 1, 7);
        isNextLevel = true;
      }

      setScore(newScore);
      setGrid(nextGrid);

      if (isNextLevel) {
        setCountdown('levelUp');
        setTimeout(() => {
          setCountdown(null);
          startRound(nextGrid, false);
        }, LEVEL_UP_FEEDBACK_DURATION);
      } else {
        setFeedbackTile({
          index: i,
          message: activeBuffs.double_points ? '2X POINTS!' : 'GREAT!',
          isStar: true
        });

        setTimeout(() => {
          setFeedbackTile(null);
          startRound(nextGrid, false);
        }, TILE_FEEDBACK_DURATION);
      }
    }
  };

  const renderOverlay = () => {
    if (countdown === 3 || countdown === 2 || countdown === 1) {
      return (
        <div className="overlay">
          <div className="countdown-text">{countdown}</div>
        </div>
      );
    }
    if (countdown === 'START!') {
      return (
        <div className="overlay">
          <div className="countdown-text start">START!</div>
        </div>
      );
    }
    if (countdown === 'levelUp') {
      return (
        <div className="overlay">
          <div className="levelup-box">
            <div className="levelup-star">⭐</div>
            <div className="levelup-title">NEXT LEVEL</div>
            <div className="levelup-sub">
              {grid}×{grid} grid coming up!
            </div>
          </div>
        </div>
      );
    }
    if (isPaused && !countdown && !gameOver) {
      return (
        <div className="overlay">
          <div className="pause-box">
            <div className="pause-icon">⏸</div>
            <div className="pause-title">PAUSED</div>
            <div className="pause-actions">
              <button className="btn secondary" onClick={exitToMenu}>
                Exit
              </button>
              <button className="btn primary" onClick={togglePause}>
                Resume
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderGrid = () => {
    const total = grid * grid;
    const cells = [];

    for (let i = 0; i < total; i++) {
      const isLit = lit.includes(i);
      const isUserClicked = userClicks.includes(i);
      const isCorrect = seq.includes(i);

      let className = 'tile';

      if (isLit) className += ' tile-lit';
      else if (gameOver && isCorrect && !isUserClicked) className += ' tile-missed';
      else if (isUserClicked && !gameOver) className += ' tile-success';
      else if (gameOver && !isCorrect && isUserClicked) className += ' tile-error';

      if (feedbackTile && feedbackTile.index === i) className += ' tile-feedback';

      cells.push(
        <button
          key={i}
          className={className}
          onClick={() => pressTile(i)}
          disabled={!allowPress || gameOver || !!feedbackTile || isPaused}
        >
          {feedbackTile && feedbackTile.index === i && (
            feedbackTile.message === 'SHIELDED!' ? (
              <span className="feedback-icon">🛡️</span>
            ) : (
              <span className="feedback-icon">⭐</span>
            )
          )}
        </button>
      );
    }

    return (
      <div className="grid-wrapper">
        {renderOverlay()}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${grid}, 1fr)`,
            transform: isGridScaled ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {cells}
        </div>
      </div>
    );
  };

  const renderMainMenu = () => (
    <div className="menu-section">
      <div className="logo-circle">
        <span className="logo-brain">🧠</span>
      </div>
      <div className="menu-title">FARC !!! MIND</div>
      <div className="menu-subtitle">Welcome, {playerName}</div>

      {(activeBuffs.shield || activeBuffs.double_points) && (
        <div className="buff-row">
          {activeBuffs.shield && (
            <div className="buff-pill shield">
              <span>🛡️</span>
              <span>Shield Ready</span>
            </div>
          )}
          {activeBuffs.double_points && (
            <div className="buff-pill double">
              <span>⚡</span>
              <span>2x Points Ready</span>
            </div>
          )}
        </div>
      )}

      <div className="menu-buttons">
        <button className="btn primary full" onClick={initializeGame}>
          START GAME
        </button>
      </div>

      <div className="theme-quick">
        <div className="theme-quick-label">Theme</div>
        <div className="theme-chip-row">
          {Object.values(THEME_COLORS).map((t) => {
            const owned = t.id === 'default' || inventory.includes(t.id);
            const active = currentThemeId === t.id;
            return (
              <button
                key={t.id}
                className={
                  'theme-chip' +
                  (active ? ' active' : '') +
                  (!owned ? ' locked' : '')
                }
                onClick={() => changeTheme(t.id)}
              >
                <span
                  className="theme-dot"
                  style={{ backgroundColor: t.primary }}
                />
                <span className="theme-name">
                  {t.name}
                  {!owned && ' 🔒'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="balance-row">
        <DiamondIcon />
        <span className="balance-text">{diamonds}</span>
      </div>
    </div>
  );

  const renderShop = () => (
    <div className="shop-section">
      <div className="shop-header">
        <div className="shop-title">Shop</div>
        <div className="balance-pill">
          <DiamondIcon />
          <span>{diamonds}</span>
        </div>
      </div>

      <div className="shop-grid">
        {SHOP_ITEMS.map((item) => {
          const isOwned =
            (item.category === 'theme' && inventory.includes(item.id));
          const isActive =
            item.category === 'consumable' && activeBuffs[item.id];

          return (
            <div
              key={item.id}
              className={
                'shop-card' +
                (isOwned ? ' owned' : '') +
                (isActive ? ' active' : '')
              }
            >
              <div className="shop-icon">{item.icon}</div>
              <div className="shop-name">{item.name}</div>
              <div className="shop-desc">{item.desc}</div>
              <button
                className="btn buy-btn full"
                onClick={() => handlePurchase(item)}
                disabled={isOwned || isActive}
              >
                {isOwned
                  ? 'Owned'
                  : isActive
                  ? 'Active'
                  : (
                    <>
                      <DiamondIcon />
                      <span>{item.price}</span>
                    </>
                    )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section">
      <div className="settings-title">Settings</div>
      <div className="settings-label">
        Starting difficulty (3×3 pattern length)
      </div>
      <div className="settings-options">
        {[2, 3, 4, 5, 6].map((opt) => (
          <button
            key={opt}
            className={
              'settings-chip' + (initialLitCount === opt ? ' selected' : '')
            }
            onClick={() => setInitialLitCount(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="settings-hint">
        Higher numbers = harder patterns from the start.
      </div>
    </div>
  );

  if (phase === 'enterName') {
    return (
      <div className="page-root">
        <div className="intro-card">
          <div className="intro-title">FARC !!! MIND</div>
          <div className="intro-sub">Ready to flex your memory on Farcaster?</div>
          <input
            className="intro-input"
            placeholder="Enter Farcaster Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button className="btn primary full" onClick={handleSaveName}>
            CONTINUE
          </button>
          <div className="gift-row">
            <span className="gift-icon">💎</span>
            <span className="gift-text">Starting Gift: {INITIAL_DIAMONDS} Diamonds</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-root">
      <div className="game-card">
        <div className="game-header">
          <div className="header-block">
            <div className="header-label">TIME</div>
            <div className="header-value">{formatTime(time)}</div>
          </div>
          <div className="header-title">FARC !!! MIND</div>
          <div className="header-block right">
            <div className="header-label">SCORE</div>
            <div className="header-value">{score}</div>
          </div>
        </div>

        <div className="tab-bar">
          <button
            className={'tab-btn' + (activeTab === 'play' ? ' active' : '')}
            onClick={() => setActiveTab('play')}
          >
            Play
          </button>
          <button
            className={'tab-btn' + (activeTab === 'shop' ? ' active' : '')}
            onClick={() => setActiveTab('shop')}
          >
            Shop
          </button>
          <button
            className={'tab-btn' + (activeTab === 'settings' ? ' active' : '')}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {activeTab === 'play' && (
          <div className="game-body">
            {!isGameActive ? (
              renderMainMenu()
            ) : !gameOver ? (
              <>
                <div className="instruction">
                  {allowPress && !isPaused && !countdown
                    ? `Remember sequence and tap! (${seq.length})`
                    : 'Watch the pattern...'}
                </div>
                {renderGrid()}
                <div className="bottom-info">
                  <div className="badge">
                    <span>
                      {grid}×{grid} GRID
                    </span>
                  </div>
                  <button className="pause-btn" onClick={togglePause}>
                    {isPaused ? '▶ Resume' : '⏸ Pause'}
                  </button>
                </div>
              </>
            ) : (
              <div className="game-over-body">
                <div className="go-icon">❌</div>
                <div className="go-title">Nice Try</div>
                <div className="go-sub">{playerName}</div>

                <div className="stats-box">
                  <div className="stat-row">
                    <span>Total Score</span>
                    <span className="stat-value">{score}</span>
                  </div>
                  <div className="stat-row">
                    <span>Time</span>
                    <span className="stat-value blue">{formatTime(time)}</span>
                  </div>
                </div>

                <button className="btn primary full" onClick={restartGame}>
                  PLAY AGAIN
                </button>
                <button className="btn share full" onClick={handleShare}>
                  Share on Farcaster
                </button>
                <button className="btn secondary full" onClick={exitToMenu}>
                  Return to Menu
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shop' && renderShop()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}
