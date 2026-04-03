const ADMIN_EMAIL = 'support.gauntlettiers@gmail.com';

// Tier definitions
const TIERS = {
    ht1: { name: 'HT1', label: 'High Tier 1', class: 'tier-ht1', rank: 1 },
    lt1: { name: 'LT1', label: 'Low Tier 1', class: 'tier-lt1', rank: 2 },
    ht2: { name: 'HT2', label: 'High Tier 2', class: 'tier-ht2', rank: 3 },
    lt2: { name: 'LT2', label: 'Low Tier 2', class: 'tier-lt2', rank: 4 },
    ht3: { name: 'HT3', label: 'High Tier 3', class: 'tier-ht3', rank: 5 },
    lt3: { name: 'LT3', label: 'Low Tier 3', class: 'tier-lt3', rank: 6 },
    ht4: { name: 'HT4', label: 'High Tier 4', class: 'tier-ht4', rank: 7 },
    lt4: { name: 'LT4', label: 'Low Tier 4', class: 'tier-lt4', rank: 8 },
    ht5: { name: 'HT5', label: 'High Tier 5', class: 'tier-ht5', rank: 9 },
    lt5: { name: 'LT5', label: 'Low Tier 5', class: 'tier-lt5', rank: 10 }
};

// Region definitions
const REGIONS = {
    na: { name: 'NA', label: 'North America', class: 'region-na' },
    sa: { name: 'SA', label: 'South America', class: 'region-sa' },
    eu: { name: 'EU', label: 'Europe', class: 'region-eu' },
    as: { name: 'AS', label: 'Asia', class: 'region-as' },
    au: { name: 'AU', label: 'Oceania', class: 'region-au' }
};

// ==================== STORAGE FUNCTIONS (COM FALLBACK) ====================

function safeStorage() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('localStorage não disponível:', e);
        return false;
    }
}

function storageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Erro ao salvar:', e);
        return false;
    }
}

function storageGet(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Erro ao ler:', e);
        return defaultValue;
    }
}

// Initialize storage com verificação
function initStorage() {
    if (!safeStorage()) {
        alert('Seu navegador está bloqueando armazenamento local. O site pode não funcionar corretamente.');
        return;
    }
    
    // Inicializa apenas se não existir
    if (storageGet('users') === null) {
        storageSet('users', []);
    }
    if (storageGet('players') === null) {
        storageSet('players', []);
    }
    if (storageGet('currentUser') === null) {
        storageSet('currentUser', null);
    }
    
    console.log('Storage inicializado. Usuários:', storageGet('users')?.length || 0);
}

// Run initialization imediatamente
initStorage();

// ==================== AUTH FUNCTIONS ====================

function signup(username, email, password) {
    const users = storageGet('users', []);
    
    // Normaliza email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === normalizedEmail)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Check if username already taken
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, message: 'Username already taken' };
    }
    
    const newUser = {
        username: username.trim(),
        email: normalizedEmail,
        password: password, // Em produção, hash!
        createdAt: new Date().toISOString(),
        isAdmin: normalizedEmail === ADMIN_EMAIL.toLowerCase()
    };
    
    users.push(newUser);
    storageSet('users', users);
    
    // Auto login after signup
    storageSet('currentUser', {
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin
    });
    
    updateNav();
    return { success: true, message: 'Account created successfully' };
}

function login(email, password) {
    const users = storageGet('users', []);
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail && u.password === password);
    
    if (!user) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    storageSet('currentUser', {
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
    });
    
    updateNav();
    return { success: true, message: 'Login successful' };
}

function logout() {
    storageSet('currentUser', null);
    updateNav();
    
    // Redireciona para home considerando o path atual
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? '../index.html' : 'index.html';
}

function getCurrentUser() {
    return storageGet('currentUser');
}

function isAdmin(email) {
    if (!email) return false;
    return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
}

// ==================== PLAYER MANAGEMENT ====================

function getPlayers() {
    return storageGet('players', []);
}

function getPlayerByEmail(email) {
    const players = getPlayers();
    return players.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());
}

function getPlayerByUsername(username) {
    const players = getPlayers();
    return players.find(p => p.username.toLowerCase() === username.toLowerCase());
}

function getTierData(tierId) {
    return TIERS[tierId] || { name: 'N/A', label: 'Unranked', class: '', rank: 99 };
}

function getRegionData(regionId) {
    return REGIONS[regionId] || { name: '??', label: 'Unknown', class: '' };
}

function addPlayer(playerData) {
    const players = getPlayers();
    
    // Verifica duplicata
    if (players.find(p => p.username.toLowerCase() === playerData.username.toLowerCase())) {
        return { success: false, message: 'Player already exists in rankings' };
    }
    
    const newPlayer = {
        username: playerData.username.trim(),
        tier: playerData.tier,
        region: playerData.region || 'na', // Default to NA
        email: playerData.email || null,
        modes: playerData.modes || [],
        addedAt: new Date().toISOString(),
        addedBy: getCurrentUser()?.email || 'system'
    };
    
    players.push(newPlayer);
    storageSet('players', players);
    
    return { success: true, message: 'Player added successfully' };
}

function removePlayer(username) {
    let players = getPlayers();
    const initialLength = players.length;
    
    players = players.filter(p => p.username.toLowerCase() !== username.toLowerCase());
    
    if (players.length === initialLength) {
        return { success: false, message: 'Player not found' };
    }
    
    storageSet('players', players);
    return { success: true, message: 'Player removed successfully' };
}

function updatePlayer(username, updates) {
    const players = getPlayers();
    const playerIndex = players.findIndex(p => p.username.toLowerCase() === username.toLowerCase());
    
    if (playerIndex === -1) {
        return { success: false, message: 'Player not found' };
    }
    
    players[playerIndex] = { ...players[playerIndex], ...updates };
    storageSet('players', players);
    
    return { success: true, message: 'Player updated successfully' };
}

// ==================== UI FUNCTIONS ====================

function updateNav() {
    const currentUser = getCurrentUser();
    const navUser = document.getElementById('navUser');
    const navGuest = document.getElementById('navGuest');
    const navUsername = document.getElementById('navUsername');
    const navAdmin = document.getElementById('navAdmin');
    
    if (!navUser || !navGuest) {
        console.log('Elementos de navegação não encontrados');
        return;
    }
    
    if (currentUser) {
        navUser.classList.remove('hidden');
        navGuest.classList.add('hidden');
        
        if (navUsername) navUsername.textContent = currentUser.username;
        
        // DEBUG: Mostra status no console
        console.log('Usuário logado:', currentUser.email);
        console.log('É admin?', currentUser.isAdmin);
        console.log('Verificação isAdmin():', isAdmin(currentUser.email));
        
        // Show admin button - VERIFICAÇÃO DUPLA
        if (navAdmin) {
            const shouldShowAdmin = currentUser.isAdmin === true || isAdmin(currentUser.email);
            if (shouldShowAdmin) {
                navAdmin.classList.remove('hidden');
                console.log('Botão admin VISÍVEL');
            } else {
                navAdmin.classList.add('hidden');
                console.log('Botão admin ESCONDIDO');
            }
        }
    } else {
        navUser.classList.add('hidden');
        navGuest.classList.remove('hidden');
        console.log('Nenhum usuário logado');
    }
}

function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== GAUNTLET TIERS DEBUG ===');
    console.log('URL:', window.location.href);
    console.log('Path:', window.location.pathname);
    console.log('localStorage disponível:', safeStorage());
    
    updateNav();
    
    // Update player count
    const playerCountEl = document.getElementById('playerCount');
    if (playerCountEl) {
        const players = getPlayers();
        playerCountEl.textContent = players.length;
    }
    
    // Animate stats
    const statNums = document.querySelectorAll('.stat-num[data-target]');
    statNums.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        if (isNaN(target)) return; // Pula se não for número (ex: "SOON!")
        
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 16);
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    const navMenu = document.getElementById('navMenu');
    const hamburger = document.querySelector('.hamburger');
    
    if (navMenu && hamburger && !hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active');
    }
});
