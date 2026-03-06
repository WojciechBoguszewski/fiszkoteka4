const DEFAULT_DATA = {
  users: [
    { id: 2, name: 'wojciech_boguszewski', password: 'qazwsx' },
    { id: 3, name: 'demo', password: 'demo' }
  ],
  sets: [
    { id: 1, name: 'Angielski - podstawy', userId: 2 },
    { id: 2, name: 'Biologia', userId: 2 }
  ],
  cards: [
    { id: 1, sideA: 'dog', sideB: 'pies', setId: 1 },
    { id: 2, sideA: 'cat', sideB: 'kot', setId: 1 },
    { id: 3, sideA: 'apple', sideB: 'jablko', setId: 1 },
    { id: 4, sideA: 'cell', sideB: 'komorka', setId: 2 },
    { id: 5, sideA: 'tissue', sideB: 'tkanka', setId: 2 }
  ]
};

let state = null;

function cloneDefault() {
  const data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  data.nextUserId = Math.max(...data.users.map(u => u.id)) + 1;
  data.nextSetId = Math.max(...data.sets.map(s => s.id)) + 1;
  data.nextCardId = Math.max(...data.cards.map(c => c.id)) + 1;
  return data;
}

function getState() {
  if (!state) state = cloneDefault();
  return state;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(body)
  };
}

function normalizePath(path) {
  if (!path) return '/';
  let out = path;
  out = out.replace(/^\/\.netlify\/functions\/api/, '');
  out = out.replace(/^\/api/, '');
  return out || '/';
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch (err) {
    return null;
  }
}

function buildUserSets(userId) {
  const data = getState();
  const userSets = data.sets.filter(s => s.userId === userId);
  return userSets
    .sort((a, b) => b.id - a.id)
    .map(set => ({
      id: set.id,
      title: set.name,
      cards: data.cards
        .filter(c => c.setId === set.id)
        .sort((a, b) => a.id - b.id)
        .map(c => ({
          id: c.id,
          word: c.sideA || '',
          def: c.sideB || ''
        }))
    }));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  const method = event.httpMethod || 'GET';
  const path = normalizePath(event.path);
  const data = getState();

  // POST /login
  if (method === 'POST' && path === '/login') {
    const body = parseBody(event);
    if (!body) return json(400, { error: 'Nieprawidlowe JSON' });
    const { username, password } = body;
    if (!username || !password) return json(400, { error: 'Brak loginu lub hasla' });

    const user = data.users.find(u => u.name === username && u.password === password);
    if (!user) return json(401, { error: 'Nieprawidlowy login lub haslo' });

    return json(200, { user: { id: user.id, name: user.name } });
  }

  // POST /register
  if (method === 'POST' && path === '/register') {
    const body = parseBody(event);
    if (!body) return json(400, { error: 'Nieprawidlowe JSON' });
    const { username, password } = body;
    if (!username || !password) return json(400, { error: 'Brak loginu lub hasla' });

    const exists = data.users.some(u => u.name === username);
    if (exists) return json(409, { error: 'Uzytkownik juz istnieje' });

    const newUser = { id: data.nextUserId++, name: username, password };
    data.users.push(newUser);
    return json(201, { message: 'Uzytkownik zarejestrowany', user: { id: newUser.id, name: newUser.name } });
  }

  // GET /data/:userId
  if (method === 'GET' && path.startsWith('/data/')) {
    const userId = Number(path.replace('/data/', ''));
    if (!Number.isInteger(userId)) return json(400, { error: 'Nieprawidlowe userId' });
    return json(200, buildUserSets(userId));
  }

  // POST /sets
  if (method === 'POST' && path === '/sets') {
    const body = parseBody(event);
    if (!body) return json(400, { error: 'Nieprawidlowe JSON' });
    const userId = Number(body.userId);
    const title = body.title ? String(body.title).trim() : '';
    if (!Number.isInteger(userId) || !title) return json(400, { error: 'Nieprawidlowe dane' });

    const newSet = { id: data.nextSetId++, name: title, userId };
    data.sets.push(newSet);
    return json(201, { id: newSet.id, title: newSet.name, cards: [] });
  }

  // PUT /sets/:id
  if (method === 'PUT' && path.startsWith('/sets/')) {
    const setId = Number(path.replace('/sets/', ''));
    if (!Number.isInteger(setId)) return json(400, { error: 'Nieprawidlowe id zestawu' });

    const body = parseBody(event);
    if (!body) return json(400, { error: 'Nieprawidlowe JSON' });

    const title = body.title ? String(body.title).trim() : '';
    const cards = Array.isArray(body.cards) ? body.cards : [];
    if (!title) return json(400, { error: 'Nieprawidlowe dane' });

    const set = data.sets.find(s => s.id === setId);
    if (!set) return json(404, { error: 'Nie znaleziono zestawu' });

    set.name = title;
    data.cards = data.cards.filter(c => c.setId !== setId);

    for (const card of cards) {
      const word = card.word ? String(card.word) : '';
      const def = card.def ? String(card.def) : '';
      data.cards.push({ id: data.nextCardId++, sideA: word, sideB: def, setId });
    }

    return json(200, { message: 'Zestaw zapisany' });
  }

  // DELETE /sets/:id
  if (method === 'DELETE' && path.startsWith('/sets/')) {
    const setId = Number(path.replace('/sets/', ''));
    if (!Number.isInteger(setId)) return json(400, { error: 'Nieprawidlowe id zestawu' });

    const setIndex = data.sets.findIndex(s => s.id === setId);
    if (setIndex === -1) return json(404, { error: 'Nie znaleziono zestawu' });

    data.sets.splice(setIndex, 1);
    data.cards = data.cards.filter(c => c.setId !== setId);
    return json(200, { message: 'Zestaw usuniety' });
  }

  return json(404, { error: 'Nie znaleziono endpointu' });
};
