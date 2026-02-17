// Constantes
const STORAGE_KEY = 'temporizador_data';
const STORAGE_EXPIRY_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// Estado de la aplicación
let state = {
    persons: [],
    currentPersonIndex: -1,
    isRunning: false,
    isAscending: true, // true = ascendente, false = descendente
    isPresentationMode: false,
    startTime: null,
    elapsedTime: 0,
    intervalId: null,
    savedCurrentPerson: false // true si ya se guardó el tiempo de la persona actual con G
};

// Elementos del DOM
const elements = {
    // Vista configuración
    setupView: document.getElementById('setupView'),
    timerDisplay: document.getElementById('timerDisplay'),
    modeDisplay: document.getElementById('modeDisplay'),
    personNameInput: document.getElementById('personNameInput'),
    hoursInput: document.getElementById('hoursInput'),
    minutesInput: document.getElementById('minutesInput'),
    secondsInput: document.getElementById('secondsInput'),
    addPersonBtn: document.getElementById('addPersonBtn'),
    personList: document.getElementById('personList'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    startPresentationBtn: document.getElementById('startPresentationBtn'),
    timeRecordsList: document.getElementById('timeRecordsList'),
    clearRecordsBtn: document.getElementById('clearRecordsBtn'),
    // Vista presentación
    presentationView: document.getElementById('presentationView'),
    presentationName: document.getElementById('presentationName'),
    presentationTimer: document.getElementById('presentationTimer'),
    presentationProgress: document.getElementById('presentationProgress'),
    presentationModeDisplay: document.getElementById('presentationModeDisplay'),
    exitPresentationBtn: document.getElementById('exitPresentationBtn')
};

// Inicialización
function init() {
    loadFromStorage();
    renderPersonList();
    updateTimerDisplay();
    updateModeDisplay();
    setupEventListeners();
    renderTimeRecords();
}

// Configurar event listeners
function setupEventListeners() {
    // Botón agregar persona
    elements.addPersonBtn.addEventListener('click', addPerson);
    
    // Enter en el input
    elements.personNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPerson();
    });
    
    // Botón limpiar datos
    elements.clearDataBtn.addEventListener('click', clearAllData);
    
    // Botón iniciar presentación
    elements.startPresentationBtn.addEventListener('click', enterPresentationMode);
    
    // Botón salir de presentación
    elements.exitPresentationBtn.addEventListener('click', exitPresentationMode);
    
    // Botón limpiar registros
    if (elements.clearRecordsBtn) {
        elements.clearRecordsBtn.addEventListener('click', clearTimeRecords);
    }
    
    // Teclas del teclado
    document.addEventListener('keydown', handleKeyPress);
    
    // Event delegation para la lista de personas
    elements.personList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            e.stopPropagation();
            const personId = parseInt(e.target.dataset.personId);
            deletePerson(personId);
            return;
        }
        const personItem = e.target.closest('.person-item');
        if (personItem) {
            const index = parseInt(personItem.dataset.index);
            selectPerson(index);
        }
    });
}

// Manejar teclas
function handleKeyPress(e) {
    // Escape = salir de presentación
    if (e.code === 'Escape' && state.isPresentationMode) {
        e.preventDefault();
        exitPresentationMode();
        return;
    }
    
    // No procesar teclas si se está escribiendo en un input (solo en vista config)
    const tag = document.activeElement.tagName;
    if (!state.isPresentationMode && (tag === 'INPUT' || tag === 'TEXTAREA')) {
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
        case 'KeyG':
            e.preventDefault();
            saveTimeRecord();
            break;
    }
}

// ========== MODO PRESENTACIÓN ==========

function enterPresentationMode() {
    if (state.persons.length === 0) {
        alert('Agregue al menos una persona antes de iniciar la presentación');
        return;
    }
    
    // Detener timer si está corriendo
    if (state.isRunning) {
        stopTimer();
    }
    
    state.isPresentationMode = true;
    state.currentPersonIndex = 0;
    state.elapsedTime = 0;
    
    elements.setupView.style.display = 'none';
    elements.presentationView.classList.add('active');
    
    updatePresentationView();
    updateModeDisplay();
}

function exitPresentationMode() {
    if (state.isRunning) {
        stopTimer();
    }
    
    state.isPresentationMode = false;
    
    elements.presentationView.classList.remove('active');
    elements.setupView.style.display = '';
    
    renderPersonList();
    updateTimerDisplay();
}

function updatePresentationView() {
    const person = state.persons[state.currentPersonIndex];
    if (!person) return;
    
    elements.presentationName.textContent = person.name;
    elements.presentationProgress.textContent = 
        `${state.currentPersonIndex + 1} / ${state.persons.length}`;
    
    updatePresentationTimer();
}

function updatePresentationTimer() {
    let timeToDisplay;
    let isOvertime = false;
    
    if (state.isAscending) {
        timeToDisplay = state.elapsedTime;
    } else {
        const currentPerson = state.persons[state.currentPersonIndex];
        if (currentPerson) {
            const remaining = currentPerson.time - state.elapsedTime;
            if (remaining <= 0) {
                timeToDisplay = Math.abs(remaining);
                isOvertime = true;
            } else {
                timeToDisplay = remaining;
            }
        } else {
            timeToDisplay = 0;
        }
    }
    
    const prefix = isOvertime ? '+' : '';
    elements.presentationTimer.textContent = prefix + formatTime(timeToDisplay);
    
    // Clase para cuando pasa de 0 en modo descendente
    if (isOvertime) {
        elements.presentationTimer.classList.add('time-up');
    } else {
        elements.presentationTimer.classList.remove('time-up');
    }
    
    // Clase para parpadeo cuando está en pausa
    if (!state.isRunning) {
        elements.presentationTimer.classList.add('paused');
    } else {
        elements.presentationTimer.classList.remove('paused');
    }
}

// ========== PERSONAS ==========

function addPerson() {
    const name = elements.personNameInput.value.trim();
    if (!name) {
        alert('Por favor ingresa un nombre');
        return;
    }
    
    const hours = parseInt(elements.hoursInput.value) || 0;
    const minutes = parseInt(elements.minutesInput.value) || 0;
    const seconds = parseInt(elements.secondsInput.value) || 0;
    const timeMs = ((hours * 3600) + (minutes * 60) + seconds) * 1000;
    
    const person = {
        id: Date.now(),
        name: name,
        time: timeMs
    };
    
    state.persons.push(person);
    elements.personNameInput.value = '';
    
    // Si es la primera persona, seleccionarla
    if (state.persons.length === 1) {
        state.currentPersonIndex = 0;
    }
    
    saveToStorage();
    renderPersonList();
    updateTimerDisplay();
    
    // Enfocar de nuevo el input
    elements.personNameInput.focus();
}

function deletePerson(id) {
    const index = state.persons.findIndex(p => p.id === id);
    if (index === -1) return;
    
    if (state.isRunning) stopTimer();
    
    state.persons.splice(index, 1);
    
    if (state.currentPersonIndex >= state.persons.length) {
        state.currentPersonIndex = state.persons.length - 1;
    }
    
    saveToStorage();
    renderPersonList();
    updateTimerDisplay();
}

function navigatePerson(direction) {
    if (state.persons.length === 0) return;
    
    // Guardar tiempo de la persona actual antes de navegar
    if (state.isRunning) {
        stopTimer();
    }
    
    // Auto-guardar registro si no se guardó antes con G
    if (!state.savedCurrentPerson && state.currentPersonIndex >= 0 && state.elapsedTime > 0) {
        saveTimeRecord();
    }
    
    state.savedCurrentPerson = false;
    state.currentPersonIndex += direction;
    
    // Wrap around
    if (state.currentPersonIndex < 0) {
        state.currentPersonIndex = state.persons.length - 1;
    } else if (state.currentPersonIndex >= state.persons.length) {
        state.currentPersonIndex = 0;
    }
    
    state.elapsedTime = 0;
    
    if (state.isPresentationMode) {
        updatePresentationView();
    } else {
        updateTimerDisplay();
        renderPersonList();
    }
}

function selectPerson(index) {
    if (state.isRunning) stopTimer();
    
    // Auto-guardar si no se guardó antes
    if (!state.savedCurrentPerson && state.currentPersonIndex >= 0 && state.elapsedTime > 0) {
        saveTimeRecord();
    }
    
    state.savedCurrentPerson = false;
    state.currentPersonIndex = index;
    state.elapsedTime = 0;
    updateTimerDisplay();
    renderPersonList();
}

// ========== MODO ==========

function switchMode(ascending) {
    state.isAscending = ascending;
    
    // Reiniciar el elapsed time al cambiar de modo
    if (state.isRunning) stopTimer();
    state.elapsedTime = 0;
    
    updateModeDisplay();
    
    if (state.isPresentationMode) {
        updatePresentationTimer();
    } else {
        updateTimerDisplay();
    }
}

// ========== TIMER ==========

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

function startTimer() {
    state.isRunning = true;
    state.startTime = Date.now() - state.elapsedTime;
    
    if (state.isPresentationMode) {
        elements.presentationTimer.classList.remove('paused');
    }
    
    state.intervalId = setInterval(() => {
        state.elapsedTime = Date.now() - state.startTime;
        
        if (state.isPresentationMode) {
            updatePresentationTimer();
        } else {
            updateTimerDisplay();
        }
    }, 10);
}

function stopTimer() {
    state.isRunning = false;
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
    
    // Guardar el tiempo acumulado de la persona actual (solo en modo ascendente)
    if (state.isAscending && state.currentPersonIndex >= 0 && state.currentPersonIndex < state.persons.length) {
        state.persons[state.currentPersonIndex].time = state.elapsedTime;
        saveToStorage();
    }
    
    if (state.isPresentationMode) {
        updatePresentationTimer();
    } else {
        renderPersonList();
    }
}

// ========== DISPLAY ==========

function updateTimerDisplay() {
    let timeToDisplay;
    let isOvertime = false;
    
    if (state.isAscending) {
        timeToDisplay = state.elapsedTime;
    } else {
        const currentPerson = state.persons[state.currentPersonIndex];
        if (currentPerson) {
            const remaining = currentPerson.time - state.elapsedTime;
            if (remaining <= 0) {
                timeToDisplay = Math.abs(remaining);
                isOvertime = true;
            } else {
                timeToDisplay = remaining;
            }
        } else {
            timeToDisplay = 0;
        }
    }
    
    const prefix = isOvertime ? '+' : '';
    elements.timerDisplay.textContent = prefix + formatTime(timeToDisplay);
}

function updateModeDisplay() {
    const text = state.isAscending ? 'Modo: Ascendente ⬆' : 'Modo: Descendente ⬇';
    elements.modeDisplay.textContent = text;
    
    if (state.isPresentationMode) {
        elements.presentationModeDisplay.textContent = state.isAscending ? 
            'Ascendente ⬆' : 'Descendente ⬇';
    }
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// ========== REGISTRO DE TIEMPOS (tecla G) ==========

function saveTimeRecord() {
    if (state.persons.length === 0 || state.currentPersonIndex === -1) return;
    if (state.savedCurrentPerson) return; // Ya se guardó, no duplicar
    
    const person = state.persons[state.currentPersonIndex];
    let usedTime = state.elapsedTime; // Tiempo real usado
    let isOvertime = false;
    
    if (!state.isAscending) {
        const remaining = person.time - state.elapsedTime;
        if (remaining <= 0) {
            isOvertime = true;
        }
    }
    
    const record = {
        id: Date.now(),
        personName: person.name,
        assignedTime: person.time,
        usedTime: usedTime,
        isOvertime: isOvertime,
        mode: state.isAscending ? 'Ascendente' : 'Descendente',
        date: new Date().toLocaleString('es-MX')
    };
    
    // Cargar registros existentes
    let records = loadTimeRecords();
    records.push(record);
    localStorage.setItem('temporizador_records', JSON.stringify(records));
    
    state.savedCurrentPerson = true;
    
    renderTimeRecords();
    
    // Feedback visual en presentación
    if (state.isPresentationMode) {
        showSaveNotification();
    }
}

function loadTimeRecords() {
    try {
        const stored = localStorage.getItem('temporizador_records');
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (e) {
        return [];
    }
}

function renderTimeRecords() {
    const records = loadTimeRecords();
    const container = elements.timeRecordsList;
    if (!container) return;
    
    if (records.length === 0) {
        container.innerHTML = '<div class="empty-message">No hay registros. Presiona "G" para guardar el tiempo actual.</div>';
        return;
    }
    
    container.innerHTML = records.map(record => {
        const assigned = record.assignedTime != null ? formatTime(record.assignedTime) : '--:--:--';
        const used = record.usedTime != null ? formatTime(record.usedTime) : formatTime(record.time || 0);
        const overtimeClass = record.isOvertime ? 'overtime' : '';
        const overtimePrefix = record.isOvertime ? '+' : '';
        return `
        <div class="record-item">
            <div class="record-info">
                <span class="record-name">${escapeHtml(record.personName)}</span>
                <span class="record-date">${record.date}</span>
            </div>
            <div class="record-time-info">
                <span class="record-label">Asignado:</span>
                <span class="record-assigned">${assigned}</span>
                <span class="record-label">Usado:</span>
                <span class="record-time ${overtimeClass}">${overtimePrefix}${used}</span>
            </div>
        </div>
    `;
    }).join('');
}

function clearTimeRecords() {
    if (!confirm('¿Eliminar todos los registros de tiempo guardados?')) return;
    localStorage.removeItem('temporizador_records');
    renderTimeRecords();
}

function showSaveNotification() {
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = '✓ Tiempo guardado';
    elements.presentationView.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 1500);
}

// ========== DATOS ==========

function clearAllData() {
    if (!confirm('¿Está seguro de que desea eliminar todos los datos?')) return;
    
    if (state.isRunning) stopTimer();
    
    state.persons = [];
    state.currentPersonIndex = -1;
    state.elapsedTime = 0;
    
    saveToStorage();
    renderPersonList();
    updateTimerDisplay();
}

function saveToStorage() {
    const data = {
        persons: state.persons,
        timestamp: Date.now(),
        expiryDate: Date.now() + (STORAGE_EXPIRY_DAYS * MILLISECONDS_PER_DAY)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        
        const data = JSON.parse(stored);
        
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
