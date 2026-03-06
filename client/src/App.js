import React, { useState, useEffect } from 'react';
import './App.css';
import Modal from './Components/Modal';
import EditSetModal from './Components/EditSetModal';
import SetView from './Components/SetView';
import Login from './Components/Login'; // Import nowego komponentu

const API_BASE = process.env.REACT_APP_API_BASE || '';

function App() {
  // --- Stan Użytkownika ---
  const [user, setUser] = useState(null);
  // --- Stany aplikacji ---
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);

  // Modale
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState('');

  // --- Efekty ---

  // Pobieranie danych po zalogowaniu
  useEffect(() => {
    if (user) {
      fetch(`${API_BASE}/api/data/${user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Błąd serwera');
          return res.json();
        })
        .then(data => setSets(data))
        .catch(err => console.error("Błąd pobierania danych:", err));
    }
  }, [user]);

  // --- Funkcje Logiczne (API) ---

  function handleCreateSet() {
    if (!newSetTitle.trim()) return;

    fetch(`${API_BASE}/api/sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, title: newSetTitle.trim() })
    })
      .then(res => {
        if (!res.ok) throw new Error('Błąd serwera');
        return res.json();
      })
      .then(newSet => {
        setSets(prev => [newSet, ...prev]);
        setIsAddOpen(false);
        setNewSetTitle('');
      })
      .catch(err => alert("Błąd tworzenia: " + err.message));
  }

  // 2. Usuwanie zestawu
  function onDeleteSet(e, setItem) {
    e.stopPropagation();
    if (!window.confirm(`Usunąć zestaw "${setItem.title}"?`)) return;

    fetch(`${API_BASE}/api/sets/${setItem.id}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error('Błąd serwera');
        return res.json();
      })
      .then(() => {
        setSets(prev => prev.filter(s => s.id !== setItem.id));
        if (activeSet && activeSet.id === setItem.id) setActiveSet(null);
      })
      .catch(err => alert("Błąd usuwania: " + err.message));
  }

  // 3. Zapisywanie edycji (Pełna aktualizacja zestawu)
  function handleSaveEdit() {
    // editingSet zawiera: id, title, cards
    fetch(`${API_BASE}/api/sets/${editingSet.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingSet.title,
        cards: editingSet.cards // wysyłamy całą nową listę fiszek
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Błąd serwera');
        return res.json();
      })
      .then(() => {
        // Aktualizujemy stan lokalnie żeby nie pobierać wszystkiego znowu
        setSets(prev => prev.map(s => (s.id === editingSet.id ? editingSet : s)));

        setIsEditOpen(false);
        setEditingSet(null);

        // Jeśli edytowaliśmy aktualnie otwarty zestaw w trybie nauki, odświeżamy go
        if (activeSet && activeSet.id === editingSet.id) {
          setActiveSet(editingSet);
        }
      })
      .catch(err => alert("Błąd zapisu: " + err.message));
  }

  // Funkcje pomocnicze UI
  function openAddModal() {
    setNewSetTitle('');
    setIsAddOpen(true);
  }

  function onEditSet(e, setItem) {
    e.stopPropagation();
    // Głęboka kopia, aby nie edytować stanu bezpośrednio
    const copy = JSON.parse(JSON.stringify(setItem || {}));
    if (!copy.cards) copy.cards = [];
    setEditingSet(copy);
    setIsEditOpen(true);
  }

  // --- RENDEROWANIE ---

  // Jeśli nie ma użytkownika, pokaż ekran logowania
  if (!user) {
    return <Login onLogin={(loggedUser) => setUser(loggedUser)} />;
  }

  // Jeśli aktywny zestaw -> widok nauki
  if (activeSet) {
    // Pobieramy najświeższą wersję zestawu ze stanu 'sets'
    const currentSetData = sets.find(s => s.id === activeSet.id) || activeSet;
    return <SetView set={currentSetData} onBack={() => setActiveSet(null)} />;
  }

  // Główny widok (Dashboard)
  return (
    <div className="app-root">
      <div className="container">
        <header className="site-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <h1 className="logo">fiszkoteka</h1>
            <span style={{ color: '#64748b', fontSize: 14 }}>Witaj, {user.name}</span>
          </div>

          <div className="actions" style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setUser(null)} style={{ padding: '0 15px' }}>Wyloguj</button>
            <button className="add-btn" onClick={openAddModal} aria-label="Dodaj nowy zestaw">+</button>
          </div>
        </header>

        <main>
          <section className="sets-list">
            {sets.length === 0 && (
              <div className="empty-state-list">
                <p>Nie masz jeszcze żadnych zestawów.</p>
                <p>Kliknij "+" w rogu, aby stworzyć pierwszy!</p>
              </div>
            )}

            {sets.map(setItem => (
              <article
                key={setItem.id}
                className="set-card"
                onClick={() => setActiveSet(setItem)}
                role="button"
                tabIndex={0}
              >
                <div className="edit-actions">
                  <button className="edit-btn" onClick={e => onEditSet(e, setItem)} title="Edytuj">✎</button>
                  <button className="delete-btn" onClick={e => onDeleteSet(e, setItem)} title="Usuń">🗑</button>
                </div>
                <h3 className="set-title">{setItem.title}</h3>
                <p className="set-meta">
                  {setItem.cards ? setItem.cards.length : 0} fiszek
                </p>
              </article>
            ))}
          </section>

          {/* MODAL EDYCJI */}
          {isEditOpen && editingSet && (
            <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingSet(null); }}>
              <EditSetModal
                editingSet={editingSet}
                setEditingSet={setEditingSet}
                onCancel={() => { setIsEditOpen(false); setEditingSet(null); }}
                onSave={handleSaveEdit}
              />
            </Modal>
          )}

          {/* MODAL DODAWANIA */}
          {isAddOpen && (
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
              <div className="custom-modal-wrapper">
                <h2 className="modal-title">Nowy zestaw</h2>
                <div className="input-group">
                  <label>Nazwa</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Np. Angielski C1, Biologia..."
                    value={newSetTitle}
                    onChange={e => setNewSetTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateSet()}
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setIsAddOpen(false)}>Anuluj</button>
                  <button className="btn-primary" onClick={handleCreateSet}>Utwórz</button>
                </div>
              </div>
            </Modal>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;
