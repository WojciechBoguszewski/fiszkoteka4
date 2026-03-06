import React, { useState } from 'react';
import '../App.css';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd');
      }

      if (isRegistering) {
        // Po udanej rejestracji automatycznie przełącz na logowanie
        alert('Konto utworzone! Możesz się teraz zalogować.');
        setIsRegistering(false);
      } else {
        // Logowanie udane
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-root" style={{ alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '400px' }}>
        <div className="game-area" style={{ minHeight: 'auto', padding: '40px' }}>
          <h1 className="logo" style={{ marginBottom: 20, textAlign: 'center' }}>fiszkoteka</h1>
          
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', textAlign: 'center' }}>
            {isRegistering ? 'Załóż konto' : 'Zaloguj się'}
          </h2>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div className="input-group">
              <label>Nazwa użytkownika</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Hasło</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 'bold' }}>{error}</p>}

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 10 }}>
              {isRegistering ? 'Zarejestruj się' : 'Zaloguj'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 14, textAlign: 'center', color: '#64748b' }}>
            {isRegistering ? 'Masz już konto?' : 'Nie masz konta?'}
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 'bold', cursor: 'pointer', marginLeft: 5 }}
            >
              {isRegistering ? 'Zaloguj się' : 'Zarejestruj się'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
