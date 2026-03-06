import React, { useState } from 'react';

export default function EditSetModal({
  editingSet,
  setEditingSet,
  onCancel,
  onSave,
}) {
  const [newWord, setNewWord] = useState('');
  const [newDef, setNewDef] = useState('');

  if (!editingSet) return null;

  function addCard() {
    if (!newWord.trim()) return;
    const card = { 
      id: Date.now().toString() + Math.random().toString(16).slice(2), 
      word: newWord.trim(), 
      def: newDef.trim() 
    };
    setEditingSet(prev => ({ ...prev, cards: [...(prev.cards || []), card] }));
    setNewWord('');
    setNewDef('');
    // Focus z powrotem na słówko dla szybkiego dodawania
    document.getElementById('new-word-input').focus();
  }

  function removeCard(id) {
    setEditingSet(prev => ({ 
      ...prev, 
      cards: prev.cards.filter(x => x.id !== id) 
    }));
  }

  return (
    <div className="custom-modal-wrapper edit-modal-size">
      <div className="modal-header">
        <h2 className="modal-title">Edytuj zestaw</h2>
      </div>

      <div className="modal-body">
        {/* Sekcja Nazwy */}
        <div className="input-group">
          <label>Nazwa zestawu</label>
          <input
            className="main-input"
            value={editingSet.title}
            onChange={e => setEditingSet(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <hr className="divider" />

        {/* Sekcja Dodawania */}
        <div className="add-card-section">
          <h3>Dodaj nową fiszkę</h3>
          <div className="add-card-row">
            <input 
              id="new-word-input"
              placeholder="Pojęcie (np. Dog)" 
              value={newWord} 
              onChange={e => setNewWord(e.target.value)} 
            />
            <input 
              placeholder="Definicja (np. Pies)" 
              value={newDef} 
              onChange={e => setNewDef(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && addCard()}
            />
            <button className="btn-add" onClick={addCard}>+</button>
          </div>
        </div>

        {/* Lista Fiszek */}
        <div className="cards-list-container">
          <h3>Lista fiszek ({editingSet.cards ? editingSet.cards.length : 0})</h3>
          
          {(!editingSet.cards || editingSet.cards.length === 0) ? (
            <p className="empty-text">Brak fiszek. Dodaj coś powyżej!</p>
          ) : (
            <div className="styled-card-list">
              {editingSet.cards.map((c, idx) => (
                <div key={c.id || idx} className="edit-card-row">
                  <div className="card-content">
                    <span className="card-word">{c.word}</span>
                    <span className="card-arrow">→</span>
                    <span className="card-def">{c.def}</span>
                  </div>
                  <button className="btn-remove" onClick={() => removeCard(c.id)}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn-secondary" onClick={onCancel}>Anuluj</button>
        <button className="btn-primary" onClick={onSave}>Zapisz zmiany</button>
      </div>
    </div>
  );
}