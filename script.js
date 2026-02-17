// Constantes
const STORAGE_KEY = 'temporizador_data';
const STORAGE_EXPIRY_DAYS = 7;

// Estado de la aplicación
let state = {
    persons: [],
    currentPersonIndex: -1,
    isRunning: false,
    isAscending: true, // true = ascendente, false = descendente
    startTime: null,
    elapsedTime: 0,
    intervalId: null
};

// Elementos del DOM
const elements = {
    timerDisplay: document.getElementById('timerDisplay'),
    modeDisplay: document.getElementById('modeDisplay'),
    personNameInput: document.getElementById('personNameInput'),
    addPersonBtn: document.getElementById('addPersonBtn'),
    personList: document.getElementById('personList'),
    clearDataBtn: document.getElementById('clearDataBtn')
};

// Inicialización
function init() {
    loadFromStorage();
    renderPersonList();
    updateTimerDisplay();
    updateModeDisplay();
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    // Botón agregar persona
    elements.addPersonBtn.addEventListener('click', addPerson);
    
    // Enter en el input
    elements.personNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addPerson();
        }
    });
    
    // Botón limpiar datos
    elements.clearDataBtn.addEventListener('click', clearAllData);
    
    // Teclas del teclado
    document.addEventListener('keydown', handleKeyPress);
    
    // Event delegation para la lista de personas
    elements.personList.addEventListener('click', (e) => {
        // Click en botón eliminar
        if (e.target.classList.contains('delete-btn')) {
            e.stopPropagation();
            const personId = parseInt(e.target.dataset.personId);
            deletePerson(personId);
            return;
        }
        
        // Click en item de persona
        const personItem = e.target.closest('.person-item');
        if (personItem) {
            const index = parseInt(personItem.dataset.index);
            selectPerson(index);
        }
    });
}

// Manejar teclas
function handleKeyPress(e) {
    // Evitar que funcionen las teclas si está escribiendo en el input
    if (document.activeElement === elements.personNameInput) {
        return;
    }
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            toggleTimer();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            navigatePerson(-1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            navigatePerson(1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            switchMode(true);
            break;
        case 'ArrowDown':
            e.preventDefault();
            switchMode(false);
            break;
    }
}

// Agregar persona
function addPerson() {
    const name = elements.personNameInput.value.trim();
    if (!name) {
        alert('Por favor ingresa un nombre');
        return;
    }
    
    const person = {
        id: Date.now(),
        name: name,
        time: 0
    };
    
    state.persons.push(person);
    elements.personNameInput.value = '';
    
    // Si es la primera persona, seleccionarla
    if (state.persons.length === 1) {
        state.currentPersonIndex = 0;
    }
    
    saveToStorage();
    renderPersonList();
}

// Eliminar persona
function deletePerson(id) {
    const index = state.persons.findIndex(p => p.id === id);
    if (index === -1) return;
    
    // Pausar el timer si está corriendo
    if (state.isRunning) {
        stopTimer();
    }
    
    state.persons.splice(index, 1);
    
    // Ajustar el índice actual
    if (state.currentPersonIndex >= state.persons.length) {
        state.currentPersonIndex = state.persons.length - 1;
    }
    
    saveToStorage();
    renderPersonList();
}

// Navegar entre personas
function navigatePerson(direction) {
    if (state.persons.length === 0) return;
    
    // Pausar el timer si está corriendo
    if (state.isRunning) {
        stopTimer();
    }
    
    state.currentPersonIndex += direction;
    
    // Wrap around
    if (state.currentPersonIndex < 0) {
        state.currentPersonIndex = state.persons.length - 1;
    } else if (state.currentPersonIndex >= state.persons.length) {
        state.currentPersonIndex = 0;
    }
    
    state.elapsedTime = 0;
    updateTimerDisplay();
    renderPersonList();
}

// Cambiar modo (ascendente/descendente)
function switchMode(ascending) {
    state.isAscending = ascending;
    updateModeDisplay();
}

// Toggle timer (iniciar/pausar)
function toggleTimer() {
    if (state.persons.length === 0 || state.currentPersonIndex === -1) {
        alert('Por favor agregue al menos una persona');
        return;
    }
    
    if (state.isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
}

// Iniciar timer
function startTimer() {
    state.isRunning = true;
    state.startTime = Date.now() - state.elapsedTime;
    
    state.intervalId = setInterval(() => {
        state.elapsedTime = Date.now() - state.startTime;
        updateTimerDisplay();
    }, 10);
}

// Detener timer
function stopTimer() {
    state.isRunning = false;
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
    
    // Guardar el tiempo de la persona actual
    if (state.currentPersonIndex >= 0 && state.currentPersonIndex < state.persons.length) {
        state.persons[state.currentPersonIndex].time = state.elapsedTime;
        saveToStorage();
        renderPersonList();
    }
}

// Actualizar display del timer
function updateTimerDisplay() {
    let timeToDisplay;
    
    if (state.isAscending) {
        // Modo ascendente: mostrar tiempo transcurrido
        timeToDisplay = state.elapsedTime;
    } else {
        // Modo descendente: comenzar desde el tiempo actual y restar
        const currentPerson = state.persons[state.currentPersonIndex];
        if (currentPerson) {
            timeToDisplay = Math.max(0, currentPerson.time - state.elapsedTime);
        } else {
            timeToDisplay = 0;
        }
    }
    
    elements.timerDisplay.textContent = formatTime(timeToDisplay);
}

// Actualizar display del modo
function updateModeDisplay() {
    elements.modeDisplay.textContent = state.isAscending ? 
        'Modo: Ascendente ⬆' : 'Modo: Descendente ⬇';
}

// Formatear tiempo
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Renderizar lista de personas
function renderPersonList() {
    if (state.persons.length === 0) {
        elements.personList.innerHTML = '<div class="empty-message">No hay personas en la lista. Agregue una para comenzar.</div>';
        return;
    }
    
    elements.personList.innerHTML = state.persons.map((person, index) => `
        <div class="person-item ${index === state.currentPersonIndex ? 'active' : ''}" 
             data-index="${index}">
            <div class="person-info">
                <span class="person-name">${escapeHtml(person.name)}</span>
                <span class="person-time">${formatTime(person.time)}</span>
            </div>
            <button class="delete-btn" data-person-id="${person.id}">
                Eliminar
            </button>
        </div>
    `).join('');
}

// Seleccionar persona
function selectPerson(index) {
    if (state.isRunning) {
        stopTimer();
    }
    
    state.currentPersonIndex = index;
    state.elapsedTime = 0;
    updateTimerDisplay();
    renderPersonList();
}

// Limpiar todos los datos
function clearAllData() {
    if (!confirm('¿Está seguro de que desea eliminar todos los datos?')) {
        return;
    }
    
    if (state.isRunning) {
        stopTimer();
    }
    
    state.persons = [];
    state.currentPersonIndex = -1;
    state.elapsedTime = 0;
    
    saveToStorage();
    renderPersonList();
    updateTimerDisplay();
}

// Guardar en localStorage
function saveToStorage() {
    const data = {
        persons: state.persons,
        timestamp: Date.now(),
        expiryDate: Date.now() + (STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Cargar desde localStorage
function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        
        const data = JSON.parse(stored);
        
        // Verificar si los datos han expirado
        if (data.expiryDate && Date.now() > data.expiryDate) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        
        if (data.persons && Array.isArray(data.persons)) {
            state.persons = data.persons;
            if (state.persons.length > 0) {
                state.currentPersonIndex = 0;
            }
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
