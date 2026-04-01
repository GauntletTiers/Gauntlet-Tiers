// Admin email constant
const ADMIN_EMAIL = 'support.gauntlettiers@gmail.com';

// Default players data
const DEFAULT_PLAYERS = [
    { id: 1, name: 'Notch', tier: 'HT1', style: 'sword' },
    { id: 2, name: 'Dream', tier: 'LT1', style: 'sword' },
    { id: 3, name: 'Techno', tier: 'HT2', style: 'axe' },
    { id: 4, name: 'Sapnap', tier: 'LT2', style: 'uhc' },
    { id: 5, name: 'TapL', tier: 'HT3', style: 'pot' },
];

// Tier order for sorting
const TIER_ORDER = ['HT1', 'LT1', 'HT2', 'LT2', 'HT3', 'LT3', 'HT4', 'LT4', 'HT5', 'LT5'];

// App State
let currentUser = null;
let players = [];
let currentStyle = 'sword';

// ========================================
// Initialization
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initData();
    initAuth();
    initUI();
    initEventListeners();
    renderTierList();
    animateCounters();
});

function initData() {
    // Load players from localStorage or use defaults
    const saved = localStorage.getItem('gauntlet_players');
    players = saved ? JSON.parse(saved) : [...DEFAULT_PLAYERS];
    
    // Load user session
    const session = localStorage.getItem('gauntlet_user');
    if (session) {
        currentUser = JSON.parse(session);
        updateUIForUser();
    }
}

function savePlayers() {
    localStorage.setItem('gauntlet_players', JSON.stringify(players));
}

// ========================================
// Authentication System
// ========================================
function initAuth() {
    // Modal controls
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeBtn = modal.querySelector('.close-btn');
    
    loginBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        clearForms();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            clearForms();
        }
    });
    
    // Auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const formId = tab.dataset.tab + 'Form';
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(formId).classList.add('active');
        });
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });
    
    // Signup form
    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleSignup();
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Admin panel
    document.getElementById('adminBtn').addEventListener('click', openAdminPanel);
    document.querySelector('#adminModal .close-btn').addEventListener('click', () => {
        document.getElementById('adminModal').classList.remove('active');
    });
    document.getElementById('adminModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('adminModal')) {
            document.getElementById('adminModal').classList.remove('active');
        }
    });
    
    // Add player form
    document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddPlayer();
    });
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('gauntlet_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        errorEl.textContent = 'Invalid email or password';
        return;
    }
    
    currentUser = user;
    localStorage.setItem('gauntlet_user', JSON.stringify(user));
    
    document.getElementById('authModal').classList.remove('active');
    clearForms();
    updateUIForUser();
}

function handleSignup() {
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errorEl = document.getElementById('signupError');
    
    // Validation
    if (username.length < 3) {
        errorEl.textContent = 'Username must be at least 3 characters';
        return;
    }
    
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('gauntlet_users') || '[]');
    
    // Check if email exists
    if (users.find(u => u.email === email)) {
        errorEl.textContent = 'Email already registered';
        return;
    }
    
    // Check if username exists
    if (users.find(u => u.username === username)) {
        errorEl.textContent = 'Username already taken';
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        username,
        email,
        password,
        isAdmin: email === ADMIN_EMAIL,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('gauntlet_users', JSON.stringify(users));
    
    // Auto login
    currentUser = newUser;
    localStorage.setItem('gauntlet_user', JSON.stringify(newUser));
    
    document.getElementById('authModal').classList.remove('active');
    clearForms();
    updateUIForUser();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('gauntlet_user');
    updateUIForUser();
}

function clearForms() {
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
}

function updateUIForUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userSection = document.getElementById('userSection');
    const userDisplay = document.getElementById('userDisplay');
    const adminBtn = document.getElementById('adminBtn');
    
    if (currentUser) {
        loginBtn.classList.add('hidden');
        userSection.classList.remove('hidden');
        userDisplay.textContent = currentUser.username;
        
        // Show admin button only for admin
        if (currentUser.isAdmin || currentUser.email === ADMIN_EMAIL) {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    } else {
        loginBtn.classList.remove('hidden');
        userSection.classList.add('hidden');
        adminBtn.classList.add('hidden');
    }
}

// ========================================
// Admin Panel
// ========================================
function openAdminPanel() {
    if (!currentUser || (!currentUser.isAdmin && currentUser.email !== ADMIN_EMAIL)) {
        alert('Access denied');
        return;
    }
    
    renderAdminPlayerList();
    document.getElementById('adminModal').classList.add('active');
}

function renderAdminPlayerList() {
    const container = document.getElementById('adminPlayerList');
    
    if (players.length === 0) {
        container.innerHTML = '<p class="no-players">No players added yet</p>';
        return;
    }
    
    container.innerHTML = players.map(player => `
        <div class="admin-player-item">
            <div class="admin-player-info">
                <img src="https://mc-heads.net/avatar/${player.name}/32" alt="${player.name}">
                <span>${player.name}</span>
                <span class="admin-player-tier tier-badge ${player.tier.toLowerCase()}">${player.tier}</span>
                <span style="color: var(--text-dim); font-size: 0.85rem;">${player.style}</span>
            </div>
            <div class="admin-player-actions">
                <button class="btn btn-small btn-danger" onclick="deletePlayer(${player.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

function handleAddPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const tier = document.getElementById('playerTier').value;
    const style = document.getElementById('playerStyle').value;
    
    if (!name) {
        alert('Please enter a username');
        return;
    }
    
    // Check if player already exists in this style
    const exists = players.find(p => p.name.toLowerCase() === name.toLowerCase() && p.style === style);
    if (exists) {
        alert('Player already exists in this PvP style');
        return;
    }
    
    const newPlayer = {
        id: Date.now(),
        name,
        tier,
        style
    };
    
    players.push(newPlayer);
    savePlayers();
    
    // Reset form
    document.getElementById('addPlayerForm').reset();
    
    // Refresh displays
    renderAdminPlayerList();
    if (currentStyle === style) {
        renderTierList();
    }
    
    // Show success
    const btn = document.querySelector('#addPlayerForm button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Added!';
    btn.style.background = 'var(--success)';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 1500);
}

function deletePlayer(id) {
    if (!confirm('Are you sure you want to remove this player?')) return;
    
    const player = players.find(p => p.id === id);
    players = players.filter(p => p.id !== id);
    savePlayers();
    
    renderAdminPlayerList();
    if (player && player.style === currentStyle) {
        renderTierList();
    }
}

// Make deletePlayer global
window.deletePlayer = deletePlayer;

// ========================================
// Tier List
// ========================================
function initUI() {
    // Tier tabs
    document.querySelectorAll('.tier-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tier-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStyle = tab.dataset.style;
            renderTierList();
        });
    });
}

function renderTierList() {
    const container = document.getElementById('tierListContent');
    
    // Filter players by current style
    const stylePlayers = players.filter(p => p.style === currentStyle);
    
    if (stylePlayers.length === 0) {
        container.innerHTML = `
            <div class="no-players">
                <p>No players ranked in ${currentStyle.toUpperCase()} yet.</p>
                <p style="margin-top: 10px; font-size: 0.9rem;">Check back later or join our Discord to get ranked!</p>
            </div>
        `;
        return;
    }
    
    // Group by tier
    const grouped = {};
    TIER_ORDER.forEach(tier => {
        grouped[tier] = stylePlayers.filter(p => p.tier === tier);
    });
    
    // Render
    container.innerHTML = TIER_ORDER.map(tier => {
        const tierPlayers = grouped[tier];
        if (tierPlayers.length === 0) return '';
        
        return `
            <div class="tier-section">
                <div class="tier-header ${tier.toLowerCase()}">
                    ${tier} Tier
                </div>
                <div class="tier-players">
                    ${tierPlayers.map(player => `
                        <div class="tier-player">
                            <img src="https://mc-heads.net/avatar/${player.name}/40" alt="${player.name}">
                            <span>${player.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// Event Listeners
// ========================================
function initEventListeners() {
    // Mobile menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                navMenu.classList.remove('active');
            }
        });
    });
    
    // FAQ accordion
    document.querySelectorAll('.faq-q').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            
            // Open clicked if wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(13, 13, 13, 0.98)';
        } else {
            navbar.style.background = 'rgba(13, 13, 13, 0.95)';
        }
        
        // Update active nav link
        updateActiveNav();
    });
}

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

// ========================================
// Animations
// ========================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-num');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(c => observer.observe(c));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 30);
}

if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

// ========================================
// Console easter egg
// ========================================
console.log('%c⚔️ GAUNTLET TIERS', 'font-size: 24px; font-weight: bold; color: #ff3333;');
console.log('%cCompetitive PvP Rankings', 'font-size: 14px; color: #888;');
console.log('%cJoin the fight: https://discord.gg/GcqFCAnBjm', 'font-size: 12px; color: #5865F2;');
console.log('%c Gauntlet Tiers ', 'background: #ff3333; color: #000; font-size: 24px; font-weight: bold;');
console.log('%c Competitive PvP Rankings System ', 'color: #ff3333; font-size: 14px;');