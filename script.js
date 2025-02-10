document.addEventListener('DOMContentLoaded', function() {
    // Elementi della pagina
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const roleSelect = document.getElementById('role-select');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const userRoleDisplay = document.getElementById('user-role-display');
    const eventForm = document.getElementById('event-form');
    const eventItems = document.getElementById('event-items');
    const exportIcsBtn = document.getElementById('export-ics-btn');

    let currentRole = null;
    let currentUser = null; // per memorizzare il nome dell'utente loggato

    // Credenziali di esempio per ogni ruolo
    const credentials = {
        "consiglio-generale": { username: "cg", password: "cg123" },
        "consiglio-presidenza": { username: "cp", password: "cp123" },
        "assemblea-soci": { username: "as", password: "as123" },
        "commissione-rop": { username: "rop", password: "rop123" },
        "commissione-ret": { username: "ret", password: "ret123" },
        "commissione-rias": { username: "rias", password: "rias123" },
        "commissione-ri": { username: "ri", password: "ri123" },
        "commissione-tec": { username: "tec", password: "tec123" },
        "commissione-prz": { username: "prz", password: "prz123" }
    };

    // Funzioni per gestire la visualizzazione
    function showLogin() {
        loginView.style.display = 'block';
        appView.style.display = 'none';
    }

    function showApp() {
        loginView.style.display = 'none';
        appView.style.display = 'block';
    }

    // Funzioni per il localStorage
    function saveEvents(role, events) {
        localStorage.setItem('events_' + role, JSON.stringify(events));
    }

    function loadEvents(role) {
        const eventsData = localStorage.getItem('events_' + role);
        return eventsData ? JSON.parse(eventsData) : [];
    }

    // Funzione per mostrare gli appuntamenti nella lista
    function renderEvents() {
        // Svuota la lista
        eventItems.innerHTML = '';
        // Carica gli eventi relativi al ruolo corrente
        const events = loadEvents(currentRole);
        // Ordinamento degli eventi per data e ora (opzionale)
        events.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
        });
        // Crea un elemento per ogni evento
        events.forEach(event => {
            const li = document.createElement('li');
            li.textContent = `${event.date} ${event.time} - ${event.title}` +
                (event.location ? ' @ ' + event.location : '') +
                ` [${event.participation}]`;

            // Pulsante per eliminare l'evento
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Elimina';
            deleteBtn.addEventListener('click', function() {
                deleteEvent(event.id);
            });
            li.appendChild(deleteBtn);
            eventItems.appendChild(li);
        });
    }

    function deleteEvent(eventId) {
        let events = loadEvents(currentRole);
        events = events.filter(event => event.id !== eventId);
        saveEvents(currentRole, events);
        renderEvents();
    }

    // Gestione del login
    loginBtn.addEventListener('click', function() {
        const selectedRole = roleSelect.value;
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!selectedRole || !username || !password) {
            alert('Per favore, compila tutti i campi.');
            return;
        }

        // Verifica delle credenziali per il ruolo selezionato
        const expected = credentials[selectedRole];
        if (!expected || username !== expected.username || password !== expected.password) {
            alert('Nome o password errati per il ruolo selezionato.');
            return;
        }

        currentRole = selectedRole;
        currentUser = username;
        // Visualizza il ruolo e il nome utente nella header dell'app
        userRoleDisplay.textContent = `${roleSelect.options[roleSelect.selectedIndex].text} - ${currentUser}`;
        showApp();
        renderEvents();
    });

    // Gestione del logout
    logoutBtn.addEventListener('click', function() {
        currentRole = null;
        currentUser = null;
        roleSelect.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
        showLogin();
    });

    // Gestione del form per aggiungere un evento
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const title = document.getElementById('event-title').value;
        const location = document.getElementById('event-location').value;
        const participation = document.getElementById('event-participation').value;

        if (!date || !time || !title) {
            alert('Per favore, compila tutti i campi obbligatori.');
            return;
        }

        const newEvent = {
            id: Date.now(), // ID univoco semplice
            date: date,
            time: time,
            title: title,
            location: location,
            participation: participation
        };

        const events = loadEvents(currentRole);
        events.push(newEvent);
        saveEvents(currentRole, events);
        eventForm.reset();
        renderEvents();
    });

    // --- Funzionalità per esportare in ICS ---

    // Funzione per formattare la data in formato ICS (YYYYMMDDTHHMMSSZ)
    function formatDateICS(date) {
        const pad = num => String(num).padStart(2, '0');
        return date.getUTCFullYear() +
            pad(date.getUTCMonth() + 1) +
            pad(date.getUTCDate()) + 'T' +
            pad(date.getUTCHours()) +
            pad(date.getUTCMinutes()) +
            pad(date.getUTCSeconds()) + 'Z';
    }

    // Funzione per generare il contenuto ICS per gli eventi
    function generateICS(events) {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CalendarioANCE//EN\n";
        events.forEach(event => {
            const startDate = new Date(event.date + 'T' + event.time);
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 1); // durata 1 ora
            icsContent += "BEGIN:VEVENT\n";
            icsContent += "UID:" + event.id + "\n";
            icsContent += "DTSTAMP:" + formatDateICS(new Date()) + "\n";
            icsContent += "DTSTART:" + formatDateICS(startDate) + "\n";
            icsContent += "DTEND:" + formatDateICS(endDate) + "\n";
            icsContent += "SUMMARY:" + event.title + "\n";
            if (event.location) {
                icsContent += "LOCATION:" + event.location + "\n";
            }
            icsContent += "END:VEVENT\n";
        });
        icsContent += "END:VCALENDAR";
        return icsContent;
    }

    // Funzione per scaricare il file ICS
    function downloadICS() {
        const events = loadEvents(currentRole);
        const icsData = generateICS(events);
        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'calendario_' + currentRole + '.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Event listener per il pulsante "Esporta in ICS"
    exportIcsBtn.addEventListener('click', downloadICS);

    // Mostra inizialmente la vista login
    showLogin();
});


    // Mostra inizialmente la vista login
    showLogin();
});

