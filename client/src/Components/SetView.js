import React, { useState, useEffect } from 'react';
import '../App.css';

export default function SetView({ set, onBack }) {
  const [activeMode, setActiveMode] = useState('flashcards'); // flashcards, learn, test, match
  const cards = set.cards || [];

  // ------------------------------------------
  // TRYB 1: FISZKI (Flashcards)
  // ------------------------------------------
  const [fcIndex, setFcIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState([]);

  function handleFcNext(known = null) {
    if (known === true) {
      if (!knownCards.includes(cards[fcIndex].id)) setKnownCards([...knownCards, cards[fcIndex].id]);
    } else if (known === false) {
      setKnownCards(knownCards.filter(id => id !== cards[fcIndex].id));
    }
    setIsFlipped(false);
    setTimeout(() => setFcIndex(prev => prev + 1), 150);
  }

  function resetFlashcards() {
    setFcIndex(0);
    setKnownCards([]);
    setIsFlipped(false);
  }

  // ------------------------------------------
  // TRYB 2: UCZ SIĘ (Quiz ABC)
  // ------------------------------------------
  const [learnIndex, setLearnIndex] = useState(0);
  const [learnScore, setLearnScore] = useState(0);
  const [learnOptions, setLearnOptions] = useState([]);
  const [learnAnswered, setLearnAnswered] = useState(null);

  useEffect(() => {
    if (activeMode === 'learn' && learnIndex < cards.length) {
      const correct = cards[learnIndex];
      let distractors = cards.filter(c => c.id !== correct.id);
      distractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [correct, ...distractors].sort(() => 0.5 - Math.random());
      setLearnOptions(options);
      setLearnAnswered(null);
    }
  }, [activeMode, learnIndex, cards]);

  function handleLearnClick(card) {
    if (learnAnswered) return;
    const isCorrect = card.id === cards[learnIndex].id;
    setLearnAnswered(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setLearnScore(s => s + 1);
    
    setTimeout(() => {
      setLearnIndex(prev => prev + 1);
    }, 1200);
  }

  // ------------------------------------------
  // TRYB 3: TEST (Pisanie)
  // ------------------------------------------
  const [testIndex, setTestIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [testInput, setTestInput] = useState('');
  const [testStatus, setTestStatus] = useState(null);

  function handleTestSubmit(e) {
    e.preventDefault();
    if (testStatus) return;

    const correctWord = cards[testIndex].word.trim().toLowerCase();
    const userWord = testInput.trim().toLowerCase();

    if (userWord === correctWord) {
      setTestStatus('correct');
      setTestScore(s => s + 1);
    } else {
      setTestStatus('wrong');
    }

    setTimeout(() => {
      setTestIndex(prev => prev + 1);
      setTestInput('');
      setTestStatus(null);
    }, 1500);
  }

  // ------------------------------------------
  // TRYB 4: DOPASOWANIA (Drag & Drop)
  // ------------------------------------------
  const [dragItems, setDragItems] = useState([]);   // Lewa kolumna (słowa)
  const [dropTargets, setDropTargets] = useState([]); // Prawa kolumna (definicje)
  const [matches, setMatches] = useState({}); // id słowa -> id definicji (tylko poprawne)
  
  // Inicjalizacja gry Drag & Drop
  useEffect(() => {
    if (activeMode === 'match') {
      // Bierzemy max 6 par
      const gameSubset = cards.slice(0, 6);
      
      // Słowa do przeciągania (z tasowaniem)
      const words = gameSubset.map(c => ({ id: c.id, text: c.word }))
                              .sort(() => 0.5 - Math.random());
                              
      // Definicje jako cele (z tasowaniem)
      const defs = gameSubset.map(c => ({ id: c.id, text: c.def }))
                             .sort(() => 0.5 - Math.random());
                             
      setDragItems(words);
      setDropTargets(defs);
      setMatches({});
    }
  }, [activeMode, cards]);

  function handleDragStart(e, wordId) {
    e.dataTransfer.setData("text/plain", wordId);
    e.target.classList.add('dragging');
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  function handleDragOver(e) {
    e.preventDefault(); // Pozwala na upuszczenie
    e.currentTarget.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function handleDrop(e, targetId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  
  // Pobieramy ID jako string
  const draggedId = e.dataTransfer.getData("text/plain");

  // Konwertujemy oba ID na String przed porównaniem, aby mieć pewność
  if (String(draggedId) === String(targetId)) {
    console.log("Dopasowano!"); // Pomocne do sprawdzenia w konsoli
    setMatches(prev => ({ ...prev, [draggedId]: true }));
  } else {
    console.log("Błędne dopasowanie: ", draggedId, " vs ", targetId);
  }
}

  // Sprawdzamy czy wszystkie dopasowane
  const allMatched = dropTargets.length > 0 && Object.keys(matches).length === dropTargets.length;

  // ------------------------------------------
  // RENDEROWANIE
  // ------------------------------------------
  if (cards.length === 0) {
    return (
      <div className="app-root set-view-root">
        <div className="container set-view-container">
           <header className="set-header">
             <button onClick={onBack} className="back-link">← Wróć</button>
             <h1 className="set-title-large">{set.title}</h1>
          </header>
          <div className="game-area">
             <div className="summary-icon">📭</div>
             <h2 className="summary-title">Pusty zestaw</h2>
             <p>Dodaj najpierw kilka fiszek w edytorze.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root set-view-root">
      <div className="container set-view-container">
        
        <header className="set-header">
          <button onClick={onBack} className="back-link">← Wróć do listy</button>
          <h1 className="set-title-large">{set.title}</h1>
        </header>

        {/* NAWIGACJA PO TRYBACH */}
        <div className="modes-grid">
          <button className={`mode-btn ${activeMode === 'flashcards' ? 'active' : ''}`} onClick={() => setActiveMode('flashcards')}>
            <span className="icon">🎴</span> Fiszki
          </button>
          <button className={`mode-btn ${activeMode === 'learn' ? 'active' : ''}`} onClick={() => { setLearnIndex(0); setLearnScore(0); setActiveMode('learn'); }}>
            <span className="icon">🧠</span> Ucz się
          </button>
          <button className={`mode-btn ${activeMode === 'test' ? 'active' : ''}`} onClick={() => { setTestIndex(0); setTestScore(0); setActiveMode('test'); }}>
            <span className="icon">📝</span> Test
          </button>
          <button className={`mode-btn ${activeMode === 'match' ? 'active' : ''}`} onClick={() => setActiveMode('match')}>
            <span className="icon">🧩</span> Dopasowania
          </button>
        </div>

        <div className="game-area">
          
          {/* --- 1. FISZKI --- */}
          {activeMode === 'flashcards' && (
            <>
              {fcIndex < cards.length ? (
                <>
                  <div className="flashcard-scene" onClick={() => setIsFlipped(!isFlipped)}>
                    <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
                      <div className="flashcard-face flashcard-front">
                        <span>{cards[fcIndex].word}</span>
                        <span className="hint">Kliknij, aby obrócić</span>
                      </div>
                      <div className="flashcard-face flashcard-back">
                        <span>{cards[fcIndex].def}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flashcard-controls">
                    <button className="learn-btn unknown" onClick={(e) => { e.stopPropagation(); handleFcNext(false); }}>Nie umiem 😓</button>
                    <button className="learn-btn known" onClick={(e) => { e.stopPropagation(); handleFcNext(true); }}>Umiem 🤓</button>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-label">Fiszka {fcIndex + 1} z {cards.length}</div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${((fcIndex) / cards.length) * 100}%` }}></div></div>
                  </div>
                </>
              ) : (
                <div className="summary-container">
                  <span className="summary-icon">🎉</span>
                  <h2 className="summary-title">Koniec zestawu!</h2>
                  <p className="summary-score">Przejrzałeś wszystkie fiszki.</p>
                  <button className="btn-reset" onClick={resetFlashcards}>Zresetuj postęp ↺</button>
                </div>
              )}
            </>
          )}

          {/* --- 2. UCZ SIĘ (QUIZ) --- */}
          {activeMode === 'learn' && (
            <>
              {learnIndex < cards.length ? (
                <>
                  <p style={{ color: '#64748b', marginBottom: 10, textTransform: 'uppercase', fontSize: 12, fontWeight: 700 }}>Jak to przetłumaczysz?</p>
                  <h2 className="question-text">{cards[learnIndex].def}</h2>
                  <div className="options-grid">
                    {learnOptions.map((opt) => (
                      <button
                        key={opt.id}
                        className={`option-btn 
                          ${learnAnswered === 'correct' && opt.id === cards[learnIndex].id ? 'correct' : ''}
                          ${learnAnswered === 'wrong' && opt.id !== cards[learnIndex].id ? 'disabled' : ''}
                          ${learnAnswered === 'wrong' && opt.id === cards[learnIndex].id ? 'correct' : ''} 
                        `}
                        onClick={() => handleLearnClick(opt)}
                        disabled={!!learnAnswered}
                      >
                        {opt.word}
                      </button>
                    ))}
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${(learnIndex / cards.length) * 100}%` }}></div></div>
                  </div>
                </>
              ) : (
                <div className="summary-container">
                  <span className="summary-icon">🏆</span>
                  <h2 className="summary-title">Trening zakończony!</h2>
                  <p className="summary-score">Twój wynik: {learnScore} / {cards.length}</p>
                  <button className="btn-reset" onClick={() => { setLearnIndex(0); setLearnScore(0); }}>Zagraj jeszcze raz ↺</button>
                </div>
              )}
            </>
          )}

          {/* --- 3. TEST (PISANIE) --- */}
          {activeMode === 'test' && (
            <>
              {testIndex < cards.length ? (
                <form onSubmit={handleTestSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ color: '#64748b', marginBottom: 10, textTransform: 'uppercase', fontSize: 12, fontWeight: 700 }}>Wpisz tłumaczenie</p>
                  <h2 className="question-text">{cards[testIndex].def}</h2>
                  
                  <input 
                    className="test-input"
                    autoFocus
                    placeholder="Wpisz słówko..."
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    disabled={!!testStatus}
                    style={{ borderColor: testStatus === 'correct' ? '#22c55e' : testStatus === 'wrong' ? '#ef4444' : '' }}
                  />
                  
                  {testStatus === 'correct' && <p style={{ color: '#15803d', fontWeight: 'bold', marginTop: 10 }}>Dobrze! 👏</p>}
                  {testStatus === 'wrong' && <p style={{ color: '#b91c1c', fontWeight: 'bold', marginTop: 10 }}>Źle! Poprawnie: {cards[testIndex].word}</p>}
                  
                  {!testStatus && <button type="submit" className="check-btn">Sprawdź</button>}
                  
                  <div className="progress-bar-container">
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${(testIndex / cards.length) * 100}%` }}></div></div>
                  </div>
                </form>
              ) : (
                <div className="summary-container">
                  <span className="summary-icon">📝</span>
                  <h2 className="summary-title">Test zaliczony!</h2>
                  <p className="summary-score">Wynik: {testScore} / {cards.length} punktów.</p>
                  <button className="btn-reset" onClick={() => { setTestIndex(0); setTestScore(0); }}>Powtórz test ↺</button>
                </div>
              )}
            </>
          )}

          {/* --- 4. DOPASOWANIA (DRAG & DROP) --- */}
          {activeMode === 'match' && (
            <>
              {!allMatched ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 20, marginBottom: 20, color: '#334155' }}>Przeciągnij słowa do definicji</h2>
                  <div className="match-game-container">
                    
                    {/* LEWA KOLUMNA: SŁOWA (DRAGGABLE) */}
                    <div className="match-column">
                      <div className="match-col-title">Pojęcia</div>
                      {dragItems.map((item) => {
                        // Jeśli już dopasowane, ukrywamy element z listy do przeciągania
                        if (matches[item.id]) return null;
                        return (
                          <div
                            key={item.id}
                            draggable
                            className="draggable-card"
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragEnd={handleDragEnd}
                          >
                            {item.text}
                          </div>
                        );
                      })}
                    </div>

                    {/* PRAWA KOLUMNA: DEFINICJE (DROPPABLE) */}
                    <div className="match-column">
                      <div className="match-col-title">Definicje</div>
                      {dropTargets.map((target) => {
                        const isMatched = matches[target.id];
                        return (
                          <div
                            key={target.id}
                            className={`droppable-target ${isMatched ? 'matched' : ''}`}
                            onDragOver={!isMatched ? handleDragOver : undefined}
                            onDragLeave={!isMatched ? handleDragLeave : undefined}
                            onDrop={!isMatched ? (e) => handleDrop(e, target.id) : undefined}
                          >
                            {isMatched ? `✅ ${target.text}` : target.text}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              ) : (
                <div className="summary-container">
                  <span className="summary-icon">🧩</span>
                  <h2 className="summary-title">Wszystkie pary połączone!</h2>
                  <p className="summary-score">Świetna robota, wszystko pasuje.</p>
                  <button className="btn-reset" onClick={() => setActiveMode('flashcards')}>Wróć do fiszek</button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}