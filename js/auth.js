// js/auth.js - Authentication and Player Management System

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

// Initialize localStorage data
function initStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('players')) {
        localStorage.setItem('players', JSON.stringify([]));
    }
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', JSON.stringify(null));
    }
}

// Run initialization
initStorage();

// ==================== AUTH FUNCTIONS ====================

function signup(username, email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Check if username already taken
    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Username already taken' };
    }
    
    const newUser = {
        username,
        email,
        password, // In production, hash this!
        createdAt: new Date().toISOString(),
        isAdmin: email === ADMIN_EMAIL
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after signup
    localStorage.setItem('currentUser', JSON.stringify({
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin
    }));
    
    updateNav();
    return { success: true, message: 'Account created successfully' };
}

function login(email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    localStorage.setItem('currentUser', JSON.stringify({
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
    }));
    
    updateNav();
    return { success: true, message: 'Login successful' };
}

function logout() {
    localStorage.setItem('currentUser', JSON.stringify(null));
    updateNav();
    window.location.href = '../index.html';
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function isAdmin(email) {
    return email === ADMIN_EMAIL;
}

// ==================== PLAYER MANAGEMENT FUNCTIONS ====================

function getPlayers() {
    return JSON.parse(localStorage.getItem('players') || '[]');
}

function getPlayerByEmail(email) {
    const players = getPlayers();
    return players.find(p => p.email === email);
}

function getPlayerByUsername(username) {
    const players = getPlayers();
    return players.find(p => p.username.toLowerCase() === username.toLowerCase());
}

function getTierData(tierId) {
    return TIERS[tierId] || { name: 'N/A', label: 'Unranked', class: '', rank: 99 };
}

function addPlayer(playerData) {
    const players = getPlayers();
    
    // Check if player already exists
    if (players.find(p => p.username.toLowerCase() === playerData.username.toLowerCase())) {
        return { success: false, message: 'Player already exists in rankings' };
    }
    
    const newPlayer = {
        username: playerData.username,
        tier: playerData.tier,
        email: playerData.email || null,
        modes: playerData.modes || [],
        wins: playerData.wins || 0,
        losses: playerData.losses || 0,
        addedAt: new Date().toISOString(),
        addedBy: getCurrentUser()?.email || 'system'
    };
    
    players.push(newPlayer);
    localStorage.setItem('players', JSON.stringify(players));
    
    return { success: true, message: 'Player added successfully' };
}

function removePlayer(username) {
    let players = getPlayers();
    const initialLength = players.length;
    
    players = players.filter(p => p.username.toLowerCase() !== username.toLowerCase());
    
    if (players.length === initialLength) {
        return { success: false, message: 'Player not found' };
    }
    
    localStorage.setItem('players', JSON.stringify(players));
    return { success: true, message: 'Player removed successfully' };
}

function updatePlayer(username, updates) {
    const players = getPlayers();
    const playerIndex = players.findIndex(p => p.username.toLowerCase() === username.toLowerCase());
    
    if (playerIndex === -1) {
        return { success: false, message: 'Player not found' };
    }
    
    players[playerIndex] = { ...players[playerIndex], ...updates };
    localStorage.setItem('players', JSON.stringify(players));
    
    return { success: true, message: 'Player updated successfully' };
}

// ==================== UI FUNCTIONS ====================

function updateNav() {
    const currentUser = getCurrentUser();
    const navUser = document.getElementById('navUser');
    const navGuest = document.getElementById('navGuest');
    const navUsername = document.getElementById('navUsername');
    const navAdmin = document.getElementById('navAdmin');
    
    if (!navUser || !navGuest) return;
    
    if (currentUser) {
        navUser.classList.remove('hidden');
        navGuest.classList.add('hidden');
        
        if (navUsername) navUsername.textContent = currentUser.username;
        
        // Show admin button only for admin
        if (navAdmin) {
            if (currentUser.isAdmin) {
                navAdmin.classList.remove('hidden');
            } else {
                navAdmin.classList.add('hidden');
            }
        }
    } else {
        navUser.classList.add('hidden');
        navGuest.classList.remove('hidden');
    }
}

function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// Update navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNav();
    
    // Update player count on home page
    const playerCountEl = document.getElementById('playerCount');
    if (playerCountEl) {
        const players = getPlayers();
        playerCountEl.textContent = players.length;
    }
    
    // Animate stats numbers
    const statNums = document.querySelectorAll('.stat-num[data-target]');
    statNums.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
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