// app.js (Modificado)

// --- Configuración ---
const firebaseConfig = {
    apiKey: "AIzaSyCcWUjZu5hervImonJaN0z7paVbSlTvEeg",
    authDomain: "recuerdos-255d7.firebaseapp.com",
    projectId: "recuerdos-255d7",
    storageBucket: "recuerdos-255d7.firebasestorage.app",
    messagingSenderId: "211228732415",
    appId: "1:211228732415:web:9ee28892bcdca35f3ed5ca"
};

const CLOUDINARY_CLOUD_NAME = "dnbodjnkn";
const CLOUDINARY_UPLOAD_PRESET = "recuerdo";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const ADMIN_EMAIL = "huguitito@gmail.com";
const MEMORIAL_SEGMENT = 'm/'; // Prefijo en el hash para IDs: #m/ID123
const PLACEHOLDER_IMAGE = 'placeholder.png';

// --- Inicialización Firebase ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- Referencias al DOM ---
const loadingView = document.getElementById('loading-view');
const registerView = document.getElementById('register-view');
const memorialView = document.getElementById('memorial-view');
const adminLoginView = document.getElementById('admin-login-view');
const adminPanelView = document.getElementById('admin-panel-view');
const errorView = document.getElementById('error-view');
const views = document.querySelectorAll('.view'); // Colección de todas las vistas

// Formularios y Errores
const registerForm = document.getElementById('register-form');
const registerNameInput = document.getElementById('memorial-name');
const registerDobInput = document.getElementById('memorial-dob');
const registerDodInput = document.getElementById('memorial-dod');
const registerBioInput = document.getElementById('memorial-bio');
const registerPhotoInput = document.getElementById('memorial-photo');
const photoPreview = document.getElementById('photo-preview');
const registerError = document.getElementById('register-error');
const registerSubmitBtn = document.getElementById('register-submit-btn');

const adminLoginForm = document.getElementById('admin-login-form');
const adminEmailInput = document.getElementById('admin-email');
const adminPasswordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

// Vista Memorial
const publicMemorialPhoto = document.getElementById('public-memorial-photo');
const publicMemorialName = document.getElementById('public-memorial-name');
const publicMemorialDates = document.getElementById('public-memorial-dates');
const publicMemorialBio = document.getElementById('public-memorial-bio');
// const editRequestBtn = document.getElementById('edit-request-btn'); // Botón eliminado visualmente con CSS

// Panel Admin
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const generateQrBtn = document.getElementById('generate-qr-btn');
const qrResultDiv = document.getElementById('qr-result');
const newMemorialIdCode = document.getElementById('new-memorial-id');
const newMemorialUrlSpan = document.getElementById('new-memorial-url');
const adminQrCodeDisplay = document.getElementById('admin-qr-code-display');
const adminMemorialsListDiv = document.getElementById('admin-memorials-list');
const adminLoginLinkContainer = document.getElementById('admin-login-link-container');
const adminLoginLink = document.getElementById('admin-login-link');

// Modal Edición Admin
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editMemorialIdInput = document.getElementById('edit-memorial-id');
const editNameInput = document.getElementById('edit-memorial-name');
const editDobInput = document.getElementById('edit-memorial-dob');
const editDodInput = document.getElementById('edit-memorial-dod');
const editBioInput = document.getElementById('edit-memorial-bio');
const currentMemorialPhoto = document.getElementById('current-memorial-photo');
const editPhotoInput = document.getElementById('edit-memorial-photo');
const editError = document.getElementById('edit-error');
const editSuccess = document.getElementById('edit-success');
const editSubmitBtn = document.getElementById('edit-submit-btn');
const closeModalBtn = document.querySelector('.close-modal-btn');
// Referencias para QR en Modal Edición
const modalMemorialIdDisplay = document.getElementById('edit-modal-memorial-id-display');
const modalMemorialUrlSpan = document.getElementById('edit-modal-memorial-url');
const modalQrCodeDiv = document.getElementById('edit-modal-qr-code');


// Vista Error
const errorMessage = document.getElementById('error-message');
const backToStartBtn = document.getElementById('back-to-start-btn');

// --- Estado Global ---
let currentUser = null;
let isAdmin = false;
let currentMemorialId = null; // ID extraído del hash #m/ID
let currentEditingMemorialData = null; // Para guardar datos mientras se edita

// ===========================================
// FUNCIONES AUXILIARES
// ===========================================

function showView(viewId) {
    views.forEach(view => {
        view.classList.remove('active-view');
    });
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.add('active-view');
        // Limpiar mensajes al cambiar de vista
        [registerError, loginError, editError, editSuccess, errorMessage].forEach(el => {
            if (el) {
                 el.textContent = '';
                 el.style.display = 'none'; // Asegurar que estén ocultos si no tienen texto
             }
        });
        if (qrResultDiv) qrResultDiv.style.display = 'none'; // Ocultar resultado QR
        if (editModal && viewId !== 'admin-panel-view') {
            editModal.style.display = 'none'; // Ocultar modal si no estamos en admin
            currentEditingMemorialData = null; // Limpiar datos si se cierra el modal
        }
    } else {
        console.error("Vista no encontrada:", viewId);
        showError("Error interno: No se pudo mostrar la pantalla solicitada.");
    }
}

// Muestra el mensaje en el elemento de error especificado
function showInlineError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block'; // Mostrar el contenedor del mensaje
    } else {
        console.warn("Elemento de error no encontrado para mensaje:", message);
    }
}

// Muestra el mensaje en el elemento de éxito especificado
function showInlineSuccess(element, message) {
     if (element) {
        element.textContent = message;
        element.style.display = 'block'; // Mostrar el contenedor del mensaje
    } else {
        console.warn("Elemento de éxito no encontrado para mensaje:", message);
    }
}


function showError(message = "Ocurrió un error inesperado.") {
    console.error("Error mostrado:", message);
    if (errorMessage) {
        errorMessage.textContent = message;
         errorMessage.style.display = 'block'; // Asegurar visibilidad
        showView('error-view');
    } else {
        alert("Error crítico: " + message); // Fallback
    }
}

function generateShortId(length = 8) {
    // Caracteres amigables, evitando O, 0, I, l
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Función para subir imagen a Cloudinary (reutilizada)
async function uploadImageToCloudinary(file) {
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
         throw new Error(`La imagen es muy grande (máx ${maxSizeMB} MB)`);
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
     if (!allowedTypes.includes(file.type)) {
         throw new Error('Formato de imagen no válido (solo JPG, PNG, GIF, WEBP)');
     }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    console.log(`Subiendo ${file.name} a Cloudinary...`);
    try {
        const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok || data.error) {
            const errorMsg = data?.error?.message || `Error HTTP ${response.status}`;
            console.error('Error Cloudinary:', data);
            throw new Error(`Cloudinary: ${errorMsg}`);
        }
        console.log('Respuesta Cloudinary:', data);
        if (!data.secure_url) {
            throw new Error('Cloudinary no devolvió una URL segura.');
        }
        return data.secure_url;
    } catch (error) {
        console.error("Error en fetch a Cloudinary:", error);
        throw new Error(error.message || 'Error de red al subir imagen.');
    }
}

function formatDates(dob, dod) {
    let dateString = "";
    // Formatear fechas si existen
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            // Intentar crear un objeto Date para asegurar validez mínima
            // y formatear a DD/MM/AAAA
            const [year, month, day] = dateStr.split('-');
            if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) return dateStr; // Devolver como está si no es AAAA-MM-DD
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateStr; // Devolver como está si hay error
        }
    };

    const formattedDob = formatDate(dob);
    const formattedDod = formatDate(dod);

    if (formattedDob) dateString += `Nacimiento: ${formattedDob}`;
    if (formattedDob && formattedDod) dateString += " | ";
    if (formattedDod) dateString += `Fallecimiento: ${formattedDod}`;
    return dateString || "Fechas no especificadas";
}


// ===========================================
// LÓGICA DE RUTEO Y ESTADO
// ===========================================

// Decide qué vista mostrar basado en el estado de login y el hash de la URL
function handleRouting() {
    console.log(`Handle Routing: isAdmin=${isAdmin}, currentMemorialId=${currentMemorialId}`);

    // Limpiar mensajes de error/éxito residuales antes de mostrar nueva vista
    [registerError, loginError, editError, editSuccess, errorMessage].forEach(el => {
            if (el) {
                 el.textContent = '';
                 el.style.display = 'none';
             }
        });

    if (isAdmin) {
        showView('admin-panel-view');
        // Cargar contenido del panel de admin
        loadAdminMemorials();
        // Ocultar enlace de login admin
        if(adminLoginLinkContainer) adminLoginLinkContainer.style.display = 'none';
    } else if (currentMemorialId) {
        // Hay un ID en la URL, verificar si existe el memorial
        checkMemorialExists(currentMemorialId);
         if(adminLoginLinkContainer) adminLoginLinkContainer.style.display = 'inline'; // Mostrar link por si quiere loguear
    } else {
        // No hay ID y no es admin -> mostrar login de admin
        showView('admin-login-view');
         // Mostrar enlace de login admin
        if(adminLoginLinkContainer) adminLoginLinkContainer.style.display = 'inline';
    }
}

// Listener para cambios en el estado de autenticación
auth.onAuthStateChanged(user => {
    currentUser = user;
    isAdmin = !!(user && user.email === ADMIN_EMAIL); // Es admin si está logueado Y es el email correcto
    console.log("Auth state changed. User:", user, "Is Admin:", isAdmin);
    parseUrlHash(); // Revisar el hash actual al cambiar auth
    handleRouting(); // Decidir qué mostrar
});

// Listener para cambios en el hash de la URL (cuando se escanea QR o se navega)
window.addEventListener('hashchange', () => {
    console.log("Hash changed:", window.location.hash);
    parseUrlHash();
    handleRouting();
});

// Función para extraer el ID del hash
function parseUrlHash() {
    const hash = window.location.hash; // Ejemplo: #m/XYZ123
    if (hash && hash.startsWith('#' + MEMORIAL_SEGMENT)) {
        currentMemorialId = hash.substring(MEMORIAL_SEGMENT.length + 1); // Extrae XYZ123
        console.log("Memorial ID parsed from hash:", currentMemorialId);
    } else {
        currentMemorialId = null;
        console.log("No valid memorial ID in hash.");
    }
}

// ===========================================
// LÓGICA PÚBLICA (Registro y Visualización)
// ===========================================

async function checkMemorialExists(memorialId) {
    if (!memorialId) {
        handleRouting(); // Volver a decidir ruta si no hay ID
        return;
    }
    showView('loading-view');
    try {
        const docRef = db.collection('memorials').doc(memorialId);
        const docSnap = await docRef.get();

        // CORREGIDO: Usar .exists como propiedad booleana en v8
        if (docSnap.exists) {
            console.log("Memorial encontrado:", memorialId);
            populateMemorialView(docSnap.data());
            showView('memorial-view');
        } else {
            console.log("Memorial NO encontrado, mostrando registro para:", memorialId);
            // Limpiar formulario por si acaso
            if (registerForm) registerForm.reset();
            if (photoPreview) photoPreview.innerHTML = '';
            // No es necesario limpiar registerError aquí, showView lo hace.
            showView('register-view');
        }
    } catch (error) {
        console.error("Error al verificar memorial:", error);
        showError(`No se pudo cargar el recuerdo (ID: ${memorialId}). Error: ${error.message}`);
    }
}

function populateMemorialView(data) {
    if (!data) return;
    publicMemorialPhoto.src = data.photoUrl || PLACEHOLDER_IMAGE;
    publicMemorialPhoto.onerror = () => { publicMemorialPhoto.src = PLACEHOLDER_IMAGE; };
    publicMemorialName.textContent = data.name || 'Nombre no disponible';
    publicMemorialDates.textContent = formatDates(data.dob, data.dod);
    // Usar textContent para seguridad y pre-wrap en CSS para formato
    publicMemorialBio.textContent = data.bio || 'Sin biografía.';
}

// Listener para preview de foto en registro
if (registerPhotoInput) {
    registerPhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && photoPreview) {
            const reader = new FileReader();
            reader.onload = function(event) {
                photoPreview.innerHTML = `<img src="${event.target.result}" alt="Vista previa"/>`;
            }
            reader.readAsDataURL(file);
        } else if (photoPreview) {
            photoPreview.innerHTML = '';
        }
    });
}

// Listener para el formulario de registro
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentMemorialId) {
            showError("Error: No hay un ID de placa asociado para registrar.");
            return;
        }

        const name = registerNameInput.value.trim();
        const dob = registerDobInput.value;
        const dod = registerDodInput.value;
        const bio = registerBioInput.value.trim();
        const photoFile = registerPhotoInput.files[0];

        // Limpiar error previo
        if (registerError) {
            registerError.textContent = '';
            registerError.style.display = 'none';
        }

        if (!name || !photoFile) {
            showInlineError(registerError, "El nombre y la foto son obligatorios.");
            return;
        }

        registerSubmitBtn.disabled = true;
        registerSubmitBtn.innerHTML = '<div class="spinner-btn"></div> Guardando...';

        try {
            console.log("Subiendo foto para nuevo memorial...");
            const photoUrl = await uploadImageToCloudinary(photoFile);
            console.log("Foto subida OK:", photoUrl);

            const memorialData = {
                name: name,
                dob: dob || null, // Guardar null si está vacío
                dod: dod || null,
                bio: bio,
                photoUrl: photoUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                id: currentMemorialId // Guardar el ID también por si acaso
            };

            console.log("Guardando memorial en Firestore con ID:", currentMemorialId);
            await db.collection('memorials').doc(currentMemorialId).set(memorialData);
            console.log("Memorial guardado OK.");

            populateMemorialView(memorialData); // Mostrar inmediatamente
            showView('memorial-view');

        } catch (error) {
            console.error("Error durante el registro:", error);
            showInlineError(registerError, `Error al guardar: ${error.message}`);
            // No cambiar de vista, permitir al usuario corregir
        } finally {
            registerSubmitBtn.disabled = false;
            registerSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Recuerdo';
        }
    });
}

// Botón "Solicitar Edición" (Eliminado)
// El botón #edit-request-btn ahora se oculta con CSS. No necesitamos el listener.
// if (editRequestBtn) {
//     editRequestBtn.addEventListener('click', () => {
//         alert("Para editar la información de este recuerdo, por favor contacta con Memoria Viva.");
//     });
// }

// ===========================================
// LÓGICA DE ADMINISTRACIÓN
// ===========================================

// --- Login / Logout ---
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;

        if (loginError) {
            loginError.textContent = '';
            loginError.style.display = 'none';
        }

        const loginButton = adminLoginForm.querySelector('button[type="submit"]');
        loginButton.disabled = true;
        loginButton.innerHTML = '<div class="spinner-btn"></div> Ingresando...';

        try {
            console.log("Intentando login admin...");
            await auth.signInWithEmailAndPassword(email, password);
            console.log("Login admin OK");
            // onAuthStateChanged se encargará de llamar a handleRouting
            // Limpiar campos después del intento (incluso si falla, onAuthStateChanged limpiará si tiene éxito)
            if (adminEmailInput) adminEmailInput.value = '';
            if (adminPasswordInput) adminPasswordInput.value = '';
        } catch (error) {
            console.error("Error de login admin:", error);
            showInlineError(loginError, "Email o contraseña incorrectos.");
            // No cambiar de vista, el usuario sigue en login
        } finally {
             loginButton.disabled = false;
             loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
        }
    });
}

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
        adminLogoutBtn.disabled = true; // Deshabilitar mientras se cierra sesión
        try {
            await auth.signOut();
            console.log("Admin logout OK");
            // onAuthStateChanged se encargará de llamar a handleRouting
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            showError("No se pudo cerrar sesión."); // Mostrar error general
        } finally {
            // No es necesario rehabilitar aquí, onAuthStateChanged mostrará la vista correcta (login)
        }
    });
}

// Enlace para ir a la vista de login admin (si no está logueado)
if (adminLoginLink) {
    adminLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isAdmin) {
            // Limpiar campos al hacer clic en el enlace
             if(adminEmailInput) adminEmailInput.value = '';
             if(adminPasswordInput) adminPasswordInput.value = '';
             if(loginError) {
                 loginError.textContent = '';
                 loginError.style.display = 'none';
             }
            showView('admin-login-view');
        }
    });
}


// --- Generador de QR (Admin) ---
if (generateQrBtn) {
    generateQrBtn.addEventListener('click', () => {
        const shortId = generateShortId();
        // Usar el hash #m/ID
        const fullUrl = `${window.location.origin}${window.location.pathname}#${MEMORIAL_SEGMENT}${shortId}`;

        newMemorialIdCode.textContent = shortId;
        newMemorialUrlSpan.textContent = fullUrl;

        // Limpiar QR anterior y generar nuevo
        adminQrCodeDisplay.innerHTML = '';
        try {
             new QRCode(adminQrCodeDisplay, {
                text: fullUrl,
                width: 150,
                height: 150,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H // Alta corrección, mejor para grabar
            });
             qrResultDiv.style.display = 'block';
        } catch (e) {
            console.error("Error al generar QR:", e);
            qrResultDiv.innerHTML = '<p class="error-message" style="display:block;">No se pudo generar QR.</p>'; // Mostrar error inline
            qrResultDiv.style.display = 'block';
        }
    });
}

// --- Cargar y Mostrar Lista de Memoriales (Admin) ---
async function loadAdminMemorials() {
    if (!isAdmin) return; // Seguridad extra
    adminMemorialsListDiv.innerHTML = '<div class="spinner"></div> Cargando lista...';

    try {
        // Ordenar por fecha de creación descendente (los más nuevos primero)
        const querySnapshot = await db.collection('memorials').orderBy('createdAt', 'desc').get();
        if (querySnapshot.empty) {
            adminMemorialsListDiv.innerHTML = '<p>No hay memoriales registrados todavía.</p>';
            return;
        }

        let listHtml = '';
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const memorialId = doc.id;
            const createdAtDate = data.createdAt?.toDate();
            // Formatear fecha de creación para mostrarla
            const createdAtString = createdAtDate
                ? createdAtDate.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
                : 'Fecha desconocida';

            listHtml += `
                <div class="memorial-list-item" data-id="${memorialId}">
                    <div class="memorial-item-info">
                        <strong>${data.name || 'Sin Nombre'}</strong>
                        <span class="memorial-item-id">ID: ${memorialId} | Creado: ${createdAtString}</span>
                    </div>
                    <div class="memorial-item-actions">
                        <button class="btn btn-secondary btn-sm edit-btn" data-id="${memorialId}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${memorialId}" title="Borrar"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        adminMemorialsListDiv.innerHTML = listHtml;

        // Añadir listeners a los botones recién creados
        attachAdminListActionListeners();

    } catch (error) {
        console.error("Error cargando lista de memoriales:", error);
        adminMemorialsListDiv.innerHTML = '<p class="error-message" style="display:block;">Error al cargar la lista.</p>'; // Mostrar error inline
    }
}

function attachAdminListActionListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        // Remover listener anterior para evitar duplicados si se recarga
        button.removeEventListener('click', handleEditClick);
        button.addEventListener('click', handleEditClick);
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.removeEventListener('click', handleDeleteClick);
        button.addEventListener('click', handleDeleteClick);
    });
}

// --- Editar Memorial (Admin) ---
async function handleEditClick(event) {
    const memorialId = event.currentTarget.dataset.id;
    if (!memorialId) return;

    // Opcional: Mostrar un spinner en el botón clickeado?
    showView('loading-view'); // Mostrar carga general mientras se buscan datos

    try {
        const docRef = db.collection('memorials').doc(memorialId);
        const docSnap = await docRef.get();

        // CORREGIDO: Usar .exists como propiedad en v8
        if (docSnap.exists) {
            currentEditingMemorialData = { id: docSnap.id, ...docSnap.data() };
            populateEditModal(currentEditingMemorialData);
            editModal.style.display = 'flex'; // Mostrar modal
            showView('admin-panel-view'); // Asegurarse que la vista de fondo sea la correcta
        } else {
            showError("No se encontró el memorial para editar."); // Error general
            showView('admin-panel-view'); // Volver al panel si no se encuentra
            loadAdminMemorials(); // Recargar lista por si acaso
        }
    } catch (error) {
        console.error("Error al cargar datos para editar:", error);
        showError(`Error al cargar memorial ${memorialId}: ${error.message}`);
         showView('admin-panel-view'); // Volver al panel si hay error
         loadAdminMemorials(); // Recargar lista
    }
}

function populateEditModal(data) {
    editMemorialIdInput.value = data.id;
    editNameInput.value = data.name || '';
    editDobInput.value = data.dob || '';
    editDodInput.value = data.dod || '';
    editBioInput.value = data.bio || '';
    currentMemorialPhoto.src = data.photoUrl || PLACEHOLDER_IMAGE;
    currentMemorialPhoto.onerror = () => { currentMemorialPhoto.src = PLACEHOLDER_IMAGE; };
    editPhotoInput.value = null; // Limpiar input de archivo

    // Limpiar mensajes previos
    if (editError) { editError.textContent = ''; editError.style.display = 'none'; }
    if (editSuccess) { editSuccess.textContent = ''; editSuccess.style.display = 'none'; }


    // --- Código para mostrar ID, URL y QR en Modal ---
    const memorialId = data.id;
    const fullUrl = `${window.location.origin}${window.location.pathname}#${MEMORIAL_SEGMENT}${memorialId}`;

    if (modalMemorialIdDisplay) modalMemorialIdDisplay.textContent = memorialId;
    if (modalMemorialUrlSpan) modalMemorialUrlSpan.textContent = fullUrl;

    if (modalQrCodeDiv) {
        modalQrCodeDiv.innerHTML = ''; // Limpiar QR anterior
        try {
            new QRCode(modalQrCodeDiv, {
                text: fullUrl,
                width: 120, // Un poco más pequeño para el modal
                height: 120,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        } catch (e) {
            console.error("Error generando QR en modal:", e);
            modalQrCodeDiv.innerHTML = '<p class="error-message" style="font-size:0.8em; display:block;">Error QR</p>';
        }
    }
    // --- Fin del código QR/URL ---
}

// Listeners para cerrar el modal
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
        currentEditingMemorialData = null; // Limpiar datos en edición
    });
}
window.addEventListener('click', (event) => {
    // Cerrar si se hace clic directamente en el fondo del modal
    if (event.target === editModal) {
        editModal.style.display = 'none';
        currentEditingMemorialData = null;
    }
});

// Listener para guardar cambios de edición
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentEditingMemorialData) {
            console.error("No hay datos de memorial en edición.");
            showInlineError(editError, "Error interno: No se pueden guardar los cambios.");
            return;
        }

        const memorialId = editMemorialIdInput.value;
        if (!memorialId) {
             showInlineError(editError, "Error interno: Falta ID del memorial.");
             return;
        }

        const newName = editNameInput.value.trim();
        const newDob = editDobInput.value;
        const newDod = editDodInput.value;
        const newBio = editBioInput.value.trim();
        const newPhotoFile = editPhotoInput.files[0];

        // Limpiar mensajes previos
         if (editError) { editError.textContent = ''; editError.style.display = 'none'; }
         if (editSuccess) { editSuccess.textContent = ''; editSuccess.style.display = 'none'; }


        if (!newName) {
             showInlineError(editError, "El nombre es obligatorio.");
            return;
        }

        editSubmitBtn.disabled = true;
        editSubmitBtn.innerHTML = '<div class="spinner-btn"></div> Guardando...';

        try {
            let photoUrl = currentEditingMemorialData.photoUrl; // Mantener foto actual por defecto

            if (newPhotoFile) {
                console.log("Subiendo nueva foto para editar...");
                photoUrl = await uploadImageToCloudinary(newPhotoFile);
                console.log("Nueva foto subida OK:", photoUrl);
            }

            const updatedData = {
                name: newName,
                dob: newDob || null,
                dod: newDod || null,
                bio: newBio,
                photoUrl: photoUrl, // URL nueva o la anterior
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log("Actualizando Firestore para ID:", memorialId);
            await db.collection('memorials').doc(memorialId).update(updatedData);
            console.log("Actualización OK.");

            showInlineSuccess(editSuccess, "¡Memorial actualizado con éxito!");
            currentEditingMemorialData = { ...currentEditingMemorialData, ...updatedData }; // Actualizar datos locales
            populateEditModal(currentEditingMemorialData); // Repoblar modal con datos actualizados (incluye QR)
            loadAdminMemorials(); // Recargar lista en el panel

        } catch (error) {
            console.error("Error al actualizar:", error);
             showInlineError(editError, `Error al guardar: ${error.message}`);
        } finally {
            editSubmitBtn.disabled = false;
            editSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        }
    });
}


// --- Borrar Memorial (Admin) ---
async function handleDeleteClick(event) {
    const button = event.currentTarget;
    const memorialId = button.dataset.id;
    if (!memorialId) return;

    // Intentar obtener el nombre desde el elemento padre
    const listItem = button.closest('.memorial-list-item');
    const nameElement = listItem ? listItem.querySelector('.memorial-item-info strong') : null;
    const memorialName = nameElement ? nameElement.textContent : `ID ${memorialId}`;

    // Usar un confirm más sobrio
    if (confirm(`Confirmar eliminación del memorial "${memorialName}".\n\nEsta acción es permanente.`)) {
        // Deshabilitar botones temporalmente para evitar doble clic
        button.disabled = true;
        const editButton = listItem ? listItem.querySelector('.edit-btn') : null;
        if(editButton) editButton.disabled = true;

        // Opcional: Añadir un efecto visual de borrado
        if (listItem) listItem.style.opacity = '0.5';

        try {
            console.log("Borrando memorial:", memorialId);
            await db.collection('memorials').doc(memorialId).delete();
            console.log("Borrado OK.");

            // Quitar visualmente de la lista (más rápido que recargar todo)
            if (listItem) {
                listItem.remove();
                 // Comprobar si la lista quedó vacía
                 if (adminMemorialsListDiv && !adminMemorialsListDiv.querySelector('.memorial-list-item')) {
                     adminMemorialsListDiv.innerHTML = '<p>No hay memoriales registrados todavía.</p>';
                 }
            } else {
                loadAdminMemorials(); // Recargar si no se pudo quitar directamente
            }
             // Quizás no mostrar alert, el cambio visual es suficiente confirmación

        } catch (error) {
            console.error("Error al borrar memorial:", error);
            showError(`No se pudo borrar el memorial ${memorialId}: ${error.message}`); // Usar error general
            // Restaurar botones y opacidad si falla
            button.disabled = false;
            if(editButton) editButton.disabled = false;
            if (listItem) listItem.style.opacity = '1';
            // Asegurarse de volver al panel admin después del error
             showView('admin-panel-view');
             loadAdminMemorials();

        }
    }
}

// Botón "Volver al Inicio" en la vista de error
if (backToStartBtn) {
    backToStartBtn.addEventListener('click', () => {
        window.location.hash = ''; // Limpiar hash
        // handleRouting se llamará automáticamente por el cambio de hash y estado de auth
    });
}


// ===========================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Cargado. Iniciando aplicación Recuerdo...");
    parseUrlHash(); // Analizar hash inicial
    // onAuthStateChanged se dispara automáticamente después de esto y llamará a handleRouting
    showView('loading-view'); // Empezar siempre mostrando carga
});