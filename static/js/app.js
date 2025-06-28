// Initialize Socket.IO connection
const socket = io();

// Global variables
let isAdmin = false;
let allPlayers = [];

// Socket.IO event handlers
socket.on('connect', function() {
    console.log('متصل بالخادم');
});

socket.on('player_added', function(player) {
    addPlayerToGrid(player);
    updatePlayersCount();
    showNotification('تم إضافة لاعب جديد: ' + player.name, 'success');
});

socket.on('player_deleted', function(data) {
    removePlayerFromGrid(data.player_id);
    updatePlayersCount();
    showNotification('تم حذف اللاعب بنجاح', 'success');
});

// DOM elements
const searchBox = document.getElementById('searchBox');
const playersGrid = document.getElementById('playersGrid');
const noPlayers = document.getElementById('noPlayers');
const playersCount = document.getElementById('playersCount');

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadPlayers();
    setupSearchFunction();
    setupDragAndDrop();
});

// Load all players
function loadPlayers() {
    fetch('/api/players')
        .then(response => response.json())
        .then(players => {
            allPlayers = players;
            renderPlayers(players);
            updatePlayersCount();
        })
        .catch(error => {
            console.error('خطأ في تحميل اللاعبين:', error);
            showNotification('خطأ في تحميل اللاعبين', 'error');
        });
}

// Render players grid
function renderPlayers(players) {
    playersGrid.innerHTML = '';
    
    if (players.length === 0) {
        noPlayers.style.display = 'block';
        return;
    }
    
    noPlayers.style.display = 'none';
    
    players.forEach(player => {
        addPlayerToGrid(player);
    });
}

// Add single player to grid
function addPlayerToGrid(player) {
    const playerCard = document.createElement('div');
    playerCard.className = 'player-card glass-effect rounded-2xl p-6 cursor-pointer';
    playerCard.setAttribute('data-player-id', player.id);
    playerCard.onclick = () => showPlayerDetails(player.id);
    
    const imageSrc = player.image_path ? `/static/${player.image_path}` : '';
    const imageHTML = imageSrc ? 
        `<img src="${imageSrc}" alt="${player.name}" class="player-image">` :
        `<div class="player-image bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <i class="fas fa-user text-white text-2xl"></i>
        </div>`;
    
    playerCard.innerHTML = `
        <div class="flex items-center mb-4">
            ${imageHTML}
            <div class="mr-4">
                <h3 class="text-xl font-bold text-blue-400">${player.name}</h3>
                <p class="text-gray-300">${player.team}</p>
            </div>
        </div>
        
        <div class="flex justify-between items-center mb-3">
            <span class="px-3 py-1 bg-gradient-to-r from-green-500 to-green-700 rounded-full text-sm font-bold">
                ${player.rating}
            </span>
            <span class="px-3 py-1 glass-effect rounded-full text-sm">
                ${player.position}
            </span>
        </div>
        
        <div class="text-sm text-gray-300">
            <p><i class="fas fa-flag"></i> ${player.nationality}</p>
            <p><i class="fas fa-birthday-cake"></i> ${player.age} سنة</p>
        </div>
    `;
    
    playersGrid.appendChild(playerCard);
    noPlayers.style.display = 'none';
}

// Remove player from grid
function removePlayerFromGrid(playerId) {
    const playerCard = document.querySelector(`[data-player-id="${playerId}"]`);
    if (playerCard) {
        playerCard.remove();
    }
    
    // Update allPlayers array
    allPlayers = allPlayers.filter(player => player.id != playerId);
    
    // Update delete dropdown
    updateDeletePlayerDropdown();
    
    // Show no players message if grid is empty
    if (playersGrid.children.length === 0) {
        noPlayers.style.display = 'block';
    }
}

// Update players count
function updatePlayersCount() {
    const count = playersGrid.children.length;
    playersCount.textContent = count;
}

// Setup search functionality
function setupSearchFunction() {
    searchBox.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            renderPlayers(allPlayers);
        } else {
            const filteredPlayers = allPlayers.filter(player => 
                player.name.toLowerCase().includes(searchTerm) ||
                player.team.toLowerCase().includes(searchTerm) ||
                player.position.toLowerCase().includes(searchTerm) ||
                player.nationality.toLowerCase().includes(searchTerm)
            );
            renderPlayers(filteredPlayers);
        }
    });
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
}

// Admin functions
function showAdminLogin() {
    showModal('adminLoginModal');
}

async function checkAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch('/api/check_admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            isAdmin = true;
            closeModal('adminLoginModal');
            showModal('adminPanelModal');
            document.getElementById('adminPassword').value = '';
            showNotification('تم تسجيل الدخول بنجاح', 'success');
        } else {
            showNotification('كلمة مرور خاطئة', 'error');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showNotification('حدث خطأ أثناء تسجيل الدخول', 'error');
    }
}

function showAddPlayerForm() {
    closeModal('adminPanelModal');
    showModal('addPlayerModal');
}

function showDeletePlayerForm() {
    updateDeletePlayerDropdown();
    closeModal('adminPanelModal');
    showModal('deletePlayerModal');
}

function updateDeletePlayerDropdown() {
    const select = document.getElementById('deletePlayerSelect');
    select.innerHTML = '<option value="">اختر لاعب...</option>';
    
    allPlayers.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `${player.name} - ${player.team}`;
        select.appendChild(option);
    });
}

// Image upload handling
function setupDragAndDrop() {
    const dropArea = document.querySelector('.drag-drop-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight(e) {
        dropArea.classList.remove('dragover');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const fileInput = document.getElementById('playerImageInput');
            fileInput.files = files;
            handleImageUpload({ target: fileInput });
        }
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Player Image" 
                     class="w-20 h-20 rounded-full object-cover mx-auto border-2 border-blue-400">
                <p class="mt-2 text-sm">تم تحديد الصورة</p>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Add player form submission
document.getElementById('addPlayerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    try {
        const response = await fetch('/api/add_player', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModal('addPlayerModal');
            this.reset();
            document.getElementById('imagePreview').innerHTML = `
                <i class="fas fa-camera text-4xl text-blue-400 mb-2"></i>
                <p>اضغط لرفع صورة أو اسحب الصورة هنا</p>
            `;
            showNotification(result.message, 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('خطأ في إضافة اللاعب:', error);
        showNotification('حدث خطأ أثناء إضافة اللاعب', 'error');
    }
});

// Delete player
async function deletePlayer() {
    const playerId = document.getElementById('deletePlayerSelect').value;
    
    if (!playerId) {
        showNotification('يرجى اختيار لاعب للحذف', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/delete_player', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player_id: playerId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModal('deletePlayerModal');
            showNotification(result.message, 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('خطأ في حذف اللاعب:', error);
        showNotification('حدث خطأ أثناء حذف اللاعب', 'error');
    }
}

// Export data
async function exportData() {
    try {
        const response = await fetch('/api/export_data');
        const result = await response.json();
        
        if (result.success) {
            const dataStr = JSON.stringify(result.data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `efootball_players_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            showNotification('تم تصدير البيانات بنجاح', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('خطأ في تصدير البيانات:', error);
        showNotification('حدث خطأ أثناء تصدير البيانات', 'error');
    }
}

// Show player details
function showPlayerDetails(playerId) {
    const player = allPlayers.find(p => p.id == playerId);
    if (!player) return;
    
    const stats = player.stats || {};
    const playingStyles = player.playing_styles || [];
    
    const imageSrc = player.image_path ? `/static/${player.image_path}` : '';
    const imageHTML = imageSrc ? 
        `<img src="${imageSrc}" alt="${player.name}" class="w-32 h-32 rounded-full object-cover mx-auto border-4 border-blue-400 mb-4">` :
        `<div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto border-4 border-blue-400 mb-4">
            <i class="fas fa-user text-white text-4xl"></i>
        </div>`;
    
    const detailsHTML = `
        <div class="text-center mb-6">
            ${imageHTML}
            <h2 class="text-3xl font-bold text-blue-400 mb-2">${player.name}</h2>
            <p class="text-xl text-gray-300">${player.team}</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-6">
            <div>
                <h3 class="text-lg font-bold text-blue-400 mb-4">
                    <i class="fas fa-info-circle"></i> المعلومات الأساسية
                </h3>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span>التقييم العام:</span>
                        <span class="font-bold text-green-400">${player.rating}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>المركز:</span>
                        <span class="font-bold">${player.position}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>الجنسية:</span>
                        <span class="font-bold">${player.nationality}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>العمر:</span>
                        <span class="font-bold">${player.age} سنة</span>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-bold text-blue-400 mb-4">
                    <i class="fas fa-chart-bar"></i> الإحصائيات
                </h3>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span><i class="fas fa-bullseye text-blue-400"></i> التسديد:</span>
                        <span class="font-bold">${stats.shooting || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-futbol text-blue-400"></i> التمرير:</span>
                        <span class="font-bold">${stats.passing || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-magic text-blue-400"></i> المراوغة:</span>
                        <span class="font-bold">${stats.dribbling || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-hand-paper text-blue-400"></i> البراعة:</span>
                        <span class="font-bold">${stats.dexterity || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-dumbbell text-blue-400"></i> قوة الجسم السفلي:</span>
                        <span class="font-bold">${stats.lower_body_strength || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-arrow-up text-blue-400"></i> القوة الهوائية:</span>
                        <span class="font-bold">${stats.aerial_strength || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-shield-alt text-blue-400"></i> الدفاع:</span>
                        <span class="font-bold">${stats.defending || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-hand-rock text-blue-400"></i> حراسة المرمى 1:</span>
                        <span class="font-bold">${stats.gk_1 || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-hand-rock text-blue-400"></i> حراسة المرمى 2:</span>
                        <span class="font-bold">${stats.gk_2 || 50}</span>
                    </div>
                    <div class="flex justify-between">
                        <span><i class="fas fa-hand-rock text-blue-400"></i> حراسة المرمى 3:</span>
                        <span class="font-bold">${stats.gk_3 || 50}</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${playingStyles.length > 0 ? `
        <div class="mt-6">
            <h3 class="text-lg font-bold text-blue-400 mb-4">
                <i class="fas fa-running"></i> أساليب اللعب
            </h3>
            <div class="flex flex-wrap gap-2">
                ${playingStyles.map(style => `
                    <span class="px-3 py-1 glass-effect rounded-full text-sm">${style}</span>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
    
    document.getElementById('playerDetailsContent').innerHTML = detailsHTML;
    showModal('playerDetailsModal');
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Handle Enter key for admin login
document.getElementById('adminPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAdminPassword();
    }
});
