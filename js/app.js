/* =========================================================
   CloudTasks - app.js
   FASE 2+: Supabase (PostgreSQL) + autenticación con nombre
   ========================================================= */

// ---------- Configuración de Supabase ----------
const SUPABASE_URL = "https://kegxjelnuopcyjkfnxya.supabase.co";
const SUPABASE_KEY = "sb_publishable_jpSlcXHQWrVudkRhjbHRPg_ncS1pWow";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MAX_LONGITUD_TITULO = 80;
const MAX_LONGITUD_DESCRIPCION = 300;

let tareas = [];
let filtroActual = "todas";
let modoAuth = "login"; // "login" | "registro"
let esAdmin = false;
let filtroUsuarioActual = "";
let filtroEstadisticasUsuario = "";
let terminoBusqueda = "";
let perfilesUsuarios = []; // Lista de TODOS los usuarios (solo se llena para el admin)
let nombresUsuariosTareas = [];
let nombresUsuariosEstadisticas = [];

// ---------- Referencias al DOM: Autenticación ----------
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authForm = document.getElementById("auth-form");
const authNameField = document.getElementById("auth-name-field");
const authNameInput = document.getElementById("auth-name");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const togglePasswordBtn = document.getElementById("toggle-password-btn");
const authError = document.getElementById("auth-error");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authToggleBtn = document.getElementById("auth-toggle-btn");
const modeLabel = document.querySelector("[data-mode-label]");
const modeQuestion = document.querySelector("[data-mode-question]");
const userEmailDisplay = document.getElementById("user-email-display");
const adminBadge = document.getElementById("admin-badge");
const logoutBtn = document.getElementById("logout-btn");

// ---------- Referencias al DOM: App de tareas ----------
const formulario = document.getElementById("formulario-tarea");
const tituloInput = document.getElementById("titulo");
const descripcionInput = document.getElementById("descripcion");
const fechaLimiteInput = document.getElementById("fechaLimite");
const prioridadInput = document.getElementById("prioridad");
const taskAssigneeField = document.getElementById("task-assignee-field");
const taskAssigneeInput = document.getElementById("task-assignee");
const assignmentError = document.getElementById("assignment-error");
const errorTitulo = document.getElementById("title-error");
const errorDescripcion = document.getElementById("description-error");
const listaTareas = document.getElementById("lista-tareas");
const contadorTareas = document.getElementById("contador-tareas");
const estadoVacio = document.getElementById("estado-vacio");
const botonesFiltro = document.querySelectorAll(".filter-btn");
const listTitle = document.getElementById("list-title");
const adminUserFilterContainer = document.getElementById("admin-user-filter-container");
const adminUserFilterSearch = document.getElementById("admin-user-filter-search");
const adminUserSuggestions = document.getElementById("admin-user-suggestions");
const buscadorTareas = document.getElementById("buscador-tareas");

// ---------- Referencias al DOM: Sidebar / navegación entre vistas ----------
const menuToggleBtn = document.getElementById("menu-toggle-btn");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const botonesNav = document.querySelectorAll(".nav-btn");
const vistas = document.querySelectorAll(".view");
const statsTitleEl = document.getElementById("stats-title");
const statsGridEl = document.getElementById("stats-grid");
const statsPriorityBarsEl = document.getElementById("stats-priority-bars");
const statsUsersSectionEl = document.getElementById("stats-users-section");
const statsUserListEl = document.getElementById("stats-user-list");
const statsUserFilterContainer = document.getElementById("stats-user-filter-container");
const statsUserFilterSearch = document.getElementById("stats-user-filter-search");
const statsUserSuggestions = document.getElementById("stats-user-suggestions");

// ---------- Referencias al DOM: Modal "Nueva tarea" ----------
const fabNuevaTarea = document.getElementById("fab-nueva-tarea");
const taskModalOverlay = document.getElementById("task-modal-overlay");
const closeTaskModalBtn = document.getElementById("close-task-modal-btn");
const confirmDeleteOverlay = document.getElementById("confirm-delete-overlay");
const confirmDeleteCloseBtn = document.getElementById("confirm-delete-close-btn");
const confirmDeleteCancelBtn = document.getElementById("confirm-delete-cancel-btn");
const confirmDeleteAcceptBtn = document.getElementById("confirm-delete-accept-btn");
const formTitleEl = document.getElementById("form-title");
const taskFormSubmitBtn = document.getElementById("task-form-submit-btn");

// ---------- Referencias al DOM: Ajustes ----------
const settingDarkMode = document.getElementById("setting-dark-mode");
const settingCompactMode = document.getElementById("setting-compact-mode");
const settingConfirmDelete = document.getElementById("setting-confirm-delete");
const settingSortOrder = document.getElementById("setting-sort-order");

// ---------- Referencias al DOM: Calendario ----------
const calendarPrevBtn = document.getElementById("calendar-prev-btn");
const calendarNextBtn = document.getElementById("calendar-next-btn");
const calendarMonthLabel = document.getElementById("calendar-month-label");
const calendarGrid = document.getElementById("calendar-grid");
const calendarDayTasksTitle = document.getElementById("calendar-day-tasks-title");
const calendarDayTasksList = document.getElementById("calendar-day-tasks");
const calendarDayEmpty = document.getElementById("calendar-day-empty");

// =========================================================
//                     AUTENTICACIÓN
// =========================================================

function actualizarTextosAuth() {
  if (modoAuth === "login") {
    modeLabel.textContent = "Iniciar sesión";
    authSubmitBtn.textContent = "Iniciar sesión";
    modeQuestion.textContent = "¿No tienes cuenta?";
    authToggleBtn.textContent = "Regístrate";
    authNameField.hidden = true;
    authNameInput.required = false;
  } else {
    modeLabel.textContent = "Crear cuenta";
    authSubmitBtn.textContent = "Registrarme";
    modeQuestion.textContent = "¿Ya tienes cuenta?";
    authToggleBtn.textContent = "Inicia sesión";
    authNameField.hidden = false;
    authNameInput.required = true;
  }
  authError.textContent = "";
}

authToggleBtn.addEventListener("click", () => {
  modoAuth = modoAuth === "login" ? "registro" : "login";
  actualizarTextosAuth();
});

// Mostrar / ocultar contraseña
const ICONO_OJO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

const ICONO_OJO_TACHADO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

togglePasswordBtn.addEventListener("click", () => {
  const esPassword = authPasswordInput.type === "password";
  authPasswordInput.type = esPassword ? "text" : "password";
  togglePasswordBtn.innerHTML = esPassword ? ICONO_OJO_TACHADO : ICONO_OJO;
  togglePasswordBtn.setAttribute("aria-label", esPassword ? "Ocultar contraseña" : "Mostrar contraseña");
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authError.textContent = "";

  const nombre = authNameInput.value.trim();
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;

  if (!email || !password) {
    authError.textContent = "Completa correo y contraseña.";
    return;
  }
  if (password.length < 6) {
    authError.textContent = "La contraseña debe tener al menos 6 caracteres.";
    return;
  }
  if (modoAuth === "registro" && !nombre) {
    authError.textContent = "El nombre es obligatorio para registrarte.";
    return;
  }

  authSubmitBtn.disabled = true;

  try {
    if (modoAuth === "login") {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: nombre },
        },
      });
      if (error) throw error;
    }
  } catch (error) {
    authError.textContent = traducirErrorAuth(error.message);
  } finally {
    authSubmitBtn.disabled = false;
  }
});

function traducirErrorAuth(mensaje) {
  if (mensaje.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (mensaje.includes("already registered") || mensaje.includes("already been registered")) {
    return "Ese correo ya está registrado. Intenta iniciar sesión.";
  }
  if (mensaje.includes("Password should be")) {
    return "La contraseña no cumple los requisitos mínimos.";
  }
  return mensaje;
}

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) {
    mostrarApp(session.user);
  } else {
    mostrarAuth();
  }
});

// Consulta la tabla "profiles" para saber si el usuario es administrador.
// Este dato NO se puede falsificar desde el navegador: solo se modifica
// directamente desde el panel de Supabase.
async function obtenerPerfil(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("is_admin, full_name, email")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error al obtener el perfil:", error.message);
    return { is_admin: false };
  }
  return data;
}

async function mostrarApp(user) {
  authSection.hidden = true;
  appSection.hidden = false;

  const perfil = await obtenerPerfil(user.id);
  esAdmin = !!perfil.is_admin;

  const nombre = perfil.full_name || (user.user_metadata && user.user_metadata.full_name);
  userEmailDisplay.textContent = nombre ? `${nombre} (${user.email})` : user.email;

  if (esAdmin) {
    adminBadge.hidden = false;
    fabNuevaTarea.hidden = false;
    fabNuevaTarea.setAttribute("aria-label", "Delegar tarea");
    listTitle.textContent = "Todas las tareas";
    adminUserFilterContainer.hidden = false;
    statsUserFilterContainer.hidden = false;
  } else {
    adminBadge.hidden = true;
    fabNuevaTarea.hidden = false;
    fabNuevaTarea.setAttribute("aria-label", "Nueva tarea");
    listTitle.textContent = "Mis tareas";
    adminUserFilterContainer.hidden = true;
    statsUserFilterContainer.hidden = true;
  }

  recargarYRenderizar();
}

function mostrarAuth() {
  appSection.hidden = true;
  authSection.hidden = false;
  authForm.reset();
  modoAuth = "login";
  esAdmin = false;
  filtroUsuarioActual = "";
  filtroEstadisticasUsuario = "";
  adminUserFilterSearch.value = "";
  statsUserFilterSearch.value = "";
  perfilesUsuarios = [];
  actualizarTextosAuth();
}

// =========================================================
//        NAVEGACIÓN: SIDEBAR (móvil) Y CAMBIO DE VISTAS
// =========================================================

function abrirSidebar() {
  appSection.classList.add("sidebar-open");
}

function cerrarSidebar() {
  appSection.classList.remove("sidebar-open");
}

if (menuToggleBtn) {
  menuToggleBtn.addEventListener("click", () => {
    if (appSection.classList.contains("sidebar-open")) {
      cerrarSidebar();
    } else {
      abrirSidebar();
    }
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", cerrarSidebar);
}

botonesNav.forEach((boton) => {
  boton.addEventListener("click", () => {
    const vistaSeleccionada = boton.dataset.view;

    botonesNav.forEach((b) => b.classList.remove("is-active"));
    boton.classList.add("is-active");

    vistas.forEach((vista) => {
      vista.hidden = vista.id !== `view-${vistaSeleccionada}`;
    });

    cerrarSidebar();

    if (vistaSeleccionada === "calendario") {
      renderizarCalendario();
    }
    if (vistaSeleccionada === "estadisticas") {
      renderizarEstadisticas();
    }
  });
});

// =========================================================
//        MODAL "NUEVA TAREA" (activado desde el botón +)
// =========================================================

// Guarda el id de la tarea que se está editando; null = se está creando una nueva
let tareaEditandoId = null;

function poblarUsuariosParaDelegar() {
  if (!taskAssigneeInput) return;

  const valorActual = taskAssigneeInput.value;
  const perfilesOrdenados = [...perfilesUsuarios].sort((a, b) =>
    (a.full_name || a.email).localeCompare(b.full_name || b.email)
  );

  taskAssigneeInput.innerHTML = '<option value="">Selecciona un usuario</option>';
  perfilesOrdenados.forEach((perfil) => {
    const option = document.createElement("option");
    option.value = perfil.id;
    option.textContent = perfil.full_name
      ? `${perfil.full_name} (${perfil.email})`
      : perfil.email;
    taskAssigneeInput.appendChild(option);
  });

  if (perfilesOrdenados.some((p) => p.id === valorActual)) {
    taskAssigneeInput.value = valorActual;
  }
}

function abrirModalTarea(tarea = null) {
  if (assignmentError) assignmentError.textContent = "";

  if (tarea) {
    tareaEditandoId = tarea.id;
    formTitleEl.textContent = "Editar tarea";
    taskFormSubmitBtn.textContent = "Guardar cambios";
    tituloInput.value = tarea.title;
    descripcionInput.value = tarea.description || "";
    fechaLimiteInput.value = tarea.dueDate || "";
    prioridadInput.value = tarea.priority;
    taskAssigneeField.hidden = true;
  } else {
    tareaEditandoId = null;
    formulario.reset();
    prioridadInput.value = "media";

    if (esAdmin) {
      formTitleEl.textContent = "Delegar tarea";
      taskFormSubmitBtn.textContent = "Delegar tarea";
      taskAssigneeField.hidden = false;
      poblarUsuariosParaDelegar();
    } else {
      formTitleEl.textContent = "Nueva tarea";
      taskFormSubmitBtn.textContent = "Agregar tarea";
      taskAssigneeField.hidden = true;
    }
  }
  taskModalOverlay.hidden = false;
}

function cerrarModalTarea() {
  taskModalOverlay.hidden = true;
  tareaEditandoId = null;
}

fabNuevaTarea.addEventListener("click", () => abrirModalTarea());
closeTaskModalBtn.addEventListener("click", cerrarModalTarea);

taskModalOverlay.addEventListener("click", (event) => {
  if (event.target === taskModalOverlay) cerrarModalTarea();
});

// =========================================================
//                  GESTIÓN DE TAREAS (CRUD)
// =========================================================

function generarId() {
  return `tarea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatearFecha(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

const ETIQUETAS_PRIORIDAD = {
  baja: "Prioridad baja",
  media: "Prioridad media",
  alta: "Prioridad alta",
};

// Etiquetas cortas para espacios reducidos, como las barras de prioridad
// en la vista de Estadísticas (ahí "Prioridad baja/media/alta" no cabía).
const ETIQUETAS_PRIORIDAD_CORTA = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

// Íconos para cada tarjeta de la vista de Estadísticas.
const ICONOS_STATS = {
  total: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  pending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>`,
  done: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  overdue: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
};

// READ
// Para un usuario normal: solo trae sus propias tareas (las políticas RLS
// de Supabase ya se encargan de esto). Para un administrador: trae TODAS
// las tareas, y además consulta la tabla "profiles" por separado para
// identificar de quién es cada una (más simple y confiable que pedirle
// a Supabase que las una automáticamente).
async function cargarTareas() {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar tareas:", error.message);
    alert("No se pudieron cargar las tareas: " + error.message);
    return [];
  }

  let mapaPerfiles = {};
  if (esAdmin) {
    const { data: perfiles, error: errorPerfiles } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email, is_admin");

    if (errorPerfiles) {
      console.error("Error al cargar perfiles:", errorPerfiles.message);
    } else {
      perfiles.forEach((p) => {
        mapaPerfiles[p.id] = p;
      });
      // Se guarda la lista completa de usuarios (no solo los que tienen
      // tareas) para que las estadísticas por usuario y el filtro puedan
      // mostrar también a quienes todavía no tienen ninguna tarea.
      perfilesUsuarios = perfiles.filter((p) => !p.is_admin);
    }
  }

  return data.map((row) => {
    const perfil = mapaPerfiles[row.user_id];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      priority: row.priority,
      status: row.status,
      created_at: row.created_at,
      ownerEmail: perfil ? perfil.email : null,
      ownerName: perfil ? (perfil.full_name || perfil.email) : null,
      ownerIsAdmin: perfil ? !!perfil.is_admin : false,
    };
  });
}

// CREATE
async function crearTarea({ title, description, dueDate, priority, userId = null }) {
  const { data: userData, error: userError } = await supabaseClient.auth.getUser();

  if (userError || !userData || !userData.user) {
    console.error("Error al obtener el usuario:", userError);
    alert("No se pudo identificar tu sesión. Vuelve a iniciar sesión.");
    return;
  }

  const nuevaTarea = {
    id: generarId(),
    title: title.trim(),
    description: description.trim() || null,
    due_date: dueDate || null,
    priority,
    status: "pendiente",
    user_id: userId || userData.user.id,
  };

  const { error } = await supabaseClient.from("tasks").insert(nuevaTarea);

  if (error) {
    console.error("Error al crear tarea:", error.message);
    alert("No se pudo crear la tarea: " + error.message);
    return;
  }

  await recargarYRenderizar();
}

// UPDATE (estado): funciona igual para dueño o administrador; RLS decide si se permite.
async function alternarEstadoTarea(id) {
  const tarea = tareas.find((t) => t.id === id);
  if (!tarea) return;

  const nuevoEstado = tarea.status === "pendiente" ? "completada" : "pendiente";

  const { error } = await supabaseClient
    .from("tasks")
    .update({ status: nuevoEstado })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar tarea:", error.message);
    alert("No se pudo actualizar la tarea: " + error.message);
    return;
  }

  await recargarYRenderizar();
}

// UPDATE (datos completos): título, descripción, fecha límite y prioridad.
// Funciona igual para el dueño de la tarea o para un administrador editando
// la tarea de otro usuario; las políticas RLS ya lo permiten en ambos casos.
async function actualizarTarea(id, { title, description, dueDate, priority }) {
  const { error } = await supabaseClient
    .from("tasks")
    .update({
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      priority,
    })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar tarea:", error.message);
    alert("No se pudo actualizar la tarea: " + error.message);
    return;
  }

  await recargarYRenderizar();
}

// ---------- Modal de confirmación para eliminar ----------
// Guarda el id de la tarea que se quiere eliminar mientras se espera
// la confirmación del usuario dentro del modal propio de la app.
let tareaAEliminarId = null;

function pedirConfirmacionEliminar(id) {
  if (!ajustes.confirmDelete) {
    ejecutarEliminacion(id);
    return;
  }
  tareaAEliminarId = id;
  confirmDeleteOverlay.hidden = false;
}

function cerrarModalConfirmacion() {
  confirmDeleteOverlay.hidden = true;
  tareaAEliminarId = null;
}

confirmDeleteCloseBtn.addEventListener("click", cerrarModalConfirmacion);
confirmDeleteCancelBtn.addEventListener("click", cerrarModalConfirmacion);
confirmDeleteAcceptBtn.addEventListener("click", () => {
  const id = tareaAEliminarId;
  cerrarModalConfirmacion();
  if (id) ejecutarEliminacion(id);
});

// DELETE
async function eliminarTarea(id) {
  pedirConfirmacionEliminar(id);
}

async function ejecutarEliminacion(id) {
  const { error } = await supabaseClient.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar tarea:", error.message);
    alert("No se pudo eliminar la tarea: " + error.message);
    return;
  }

  await recargarYRenderizar();
}

function mostrarEsqueletoCarga() {
  listaTareas.innerHTML = Array.from({ length: 4 })
    .map(
      () => `
      <li class="task-item task-item--skeleton" aria-hidden="true">
        <div class="skeleton-box skeleton-box--check"></div>
        <div class="task-item__body">
          <div class="skeleton-box skeleton-box--title"></div>
          <div class="skeleton-box skeleton-box--meta"></div>
        </div>
      </li>
    `
    )
    .join("");
  estadoVacio.style.display = "none";
}

async function recargarYRenderizar() {
  mostrarEsqueletoCarga();
  tareas = await cargarTareas();
  actualizarSugerenciasUsuarios();
  renderizar();
  renderizarCalendario();
  renderizarEstadisticas();
  if (diaCalendarioSeleccionado) {
    renderizarTareasDelDia(diaCalendarioSeleccionado);
  }
}

function actualizarSugerenciasUsuarios() {
  nombresUsuariosTareas = [...new Set(
    tareas
      .filter((tarea) => !tarea.ownerIsAdmin && tarea.ownerName)
      .map((tarea) => tarea.ownerName)
  )].sort((a, b) => a.localeCompare(b));

  nombresUsuariosEstadisticas = [...new Set(
    perfilesUsuarios
      .filter((perfil) => perfil.full_name)
      .map((perfil) => perfil.full_name)
  )].sort((a, b) => a.localeCompare(b));
}

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ocultarSugerencias(lista) {
  lista.hidden = true;
  lista.innerHTML = "";
}

function mostrarSugerencias(input, lista, nombres, seleccionarNombre) {
  const termino = input.value.trim();
  if (!termino) {
    ocultarSugerencias(lista);
    return;
  }

  const coincidencias = nombres
    .filter((nombre) => normalizarTexto(nombre).includes(normalizarTexto(termino)))
    .slice(0, 8);

  lista.innerHTML = "";
  coincidencias.forEach((nombre) => {
    const opcion = document.createElement("button");
    opcion.type = "button";
    opcion.className = "user-suggestion";
    opcion.setAttribute("role", "option");
    opcion.textContent = nombre;
    opcion.addEventListener("click", () => {
      input.value = nombre;
      seleccionarNombre(nombre);
      ocultarSugerencias(lista);
    });
    lista.appendChild(opcion);
  });

  lista.hidden = coincidencias.length === 0;
}

// ---------- Validación ----------
function validarFormulario(titulo, descripcion) {
  let esValido = true;

  errorTitulo.textContent = "";
  errorDescripcion.textContent = "";

  if (titulo.trim().length === 0) {
    errorTitulo.textContent = "El título es obligatorio.";
    esValido = false;
  } else if (titulo.trim().length > MAX_LONGITUD_TITULO) {
    errorTitulo.textContent = `El título no puede superar ${MAX_LONGITUD_TITULO} caracteres.`;
    esValido = false;
  }

  if (descripcion.trim().length > MAX_LONGITUD_DESCRIPCION) {
    errorDescripcion.textContent = `La descripción no puede superar ${MAX_LONGITUD_DESCRIPCION} caracteres.`;
    esValido = false;
  }

  return esValido;
}

// ---------- Render ----------
function obtenerTareasFiltradas() {
  let resultado = tareas;
  if (filtroActual === "pendiente") resultado = resultado.filter((t) => t.status === "pendiente");
  if (filtroActual === "completada") resultado = resultado.filter((t) => t.status === "completada");
  if (esAdmin && filtroUsuarioActual.trim() !== "") {
    const termino = filtroUsuarioActual.trim().toLowerCase();
    resultado = resultado.filter((t) => {
      if (t.ownerIsAdmin) return false;
      const usuario = `${t.ownerName || ""} ${t.ownerEmail || ""}`.toLowerCase();
      return usuario.includes(termino);
    });
  }
  if (terminoBusqueda.trim() !== "") {
    const termino = terminoBusqueda.trim().toLowerCase();
    resultado = resultado.filter((t) => t.title.toLowerCase().includes(termino));
  }
  return ordenarTareas(resultado);
}

if (adminUserFilterSearch) {
  adminUserFilterSearch.addEventListener("input", () => {
    filtroUsuarioActual = adminUserFilterSearch.value;
    mostrarSugerencias(
      adminUserFilterSearch,
      adminUserSuggestions,
      nombresUsuariosTareas,
      (nombre) => {
        filtroUsuarioActual = nombre;
        renderizar();
      }
    );
    renderizar();
  });
  adminUserFilterSearch.addEventListener("blur", () => {
    setTimeout(() => ocultarSugerencias(adminUserSuggestions), 150);
  });
}

if (statsUserFilterSearch) {
  statsUserFilterSearch.addEventListener("input", () => {
    filtroEstadisticasUsuario = statsUserFilterSearch.value;
    mostrarSugerencias(
      statsUserFilterSearch,
      statsUserSuggestions,
      nombresUsuariosEstadisticas,
      (nombre) => {
        filtroEstadisticasUsuario = nombre;
        renderizarEstadisticas();
      }
    );
    renderizarEstadisticas();
  });
  statsUserFilterSearch.addEventListener("blur", () => {
    setTimeout(() => ocultarSugerencias(statsUserSuggestions), 150);
  });
}

buscadorTareas.addEventListener("input", () => {
  terminoBusqueda = buscadorTareas.value;
  renderizar();
});

function estaVencida(task) {
  if (!task.dueDate || task.status === "completada") return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [year, month, day] = task.dueDate.split("-").map(Number);
  const fechaLimite = new Date(year, month - 1, day);
  return fechaLimite < hoy;
}

// Envuelve en <mark> la parte del texto que coincide con la búsqueda actual,
// manteniendo el resto del título escapado normalmente (sin riesgo de HTML injection).
function resaltarCoincidencia(texto, termino) {
  const escapado = escapeHtml(texto);
  if (!termino || termino.trim() === "") return escapado;

  const terminoSeguro = termino.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${terminoSeguro})`, "ig");
  return escapado.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function construirElementoTarea(task) {
  const li = document.createElement("li");
  li.className = `task-item task-item--${task.priority}`;
  if (task.status === "completada") li.classList.add("task-item--done");
  const vencida = estaVencida(task);
  if (vencida) li.classList.add("task-item--overdue");
  li.dataset.id = task.id;

  const metaParts = [
    `<span class="badge badge--${task.priority}">${ETIQUETAS_PRIORIDAD[task.priority]}</span>`,
  ];
  if (task.dueDate) {
    metaParts.push(`<span class="badge badge--date">Vence: ${formatearFecha(task.dueDate)}</span>`);
  }
  if (vencida) {
    metaParts.push(`<span class="badge badge--overdue">⚠ Vencida</span>`);
  }
  if (esAdmin && task.ownerName) {
    metaParts.push(`<span class="badge badge--owner">👤 ${escapeHtml(task.ownerName)}</span>`);
  }

  li.innerHTML = `
    <input
      type="checkbox"
      class="task-item__check"
      ${task.status === "completada" ? "checked" : ""}
      aria-label="Marcar tarea como ${task.status === "completada" ? "pendiente" : "completada"}"
    />
    <div class="task-item__body">
      <p class="task-item__title">${resaltarCoincidencia(task.title, terminoBusqueda)}</p>
      ${task.description ? `<p class="task-item__description">${escapeHtml(task.description)}</p>` : ""}
      <div class="task-item__meta">${metaParts.join("")}</div>
    </div>
    <div class="task-item__actions">
      <button type="button" class="task-item__edit" aria-label="Editar tarea">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
      </button>
      <button type="button" class="task-item__delete" aria-label="Eliminar tarea">✕</button>
    </div>
  `;

  li.querySelector(".task-item__check").addEventListener("change", () => alternarEstadoTarea(task.id));
  li.querySelector(".task-item__edit").addEventListener("click", () => abrirModalTarea(task));
  li.querySelector(".task-item__delete").addEventListener("click", () => eliminarTarea(task.id));

  return li;
}

function renderizar() {
  const filtered = obtenerTareasFiltradas();
  listaTareas.innerHTML = "";
  filtered.forEach((task) => listaTareas.appendChild(construirElementoTarea(task)));

  const pendientes = tareas.filter((t) => t.status === "pendiente").length;
  contadorTareas.textContent = tareas.length
    ? `${tareas.length} tarea(s) en total · ${pendientes} pendiente(s)`
    : "";

  estadoVacio.style.display = filtered.length === 0 ? "block" : "none";
  estadoVacio.textContent =
    tareas.length === 0
      ? "Aún no tienes tareas. Crea la primera desde el formulario."
      : "No hay tareas que coincidan con este filtro.";
}

// ---------- Estadísticas ----------
// Se calculan a partir de "tareas" (ya cargadas en memoria), sin hacer
// consultas nuevas a Supabase. Para un usuario normal, "tareas" ya
// contiene solo sus propias tareas (RLS); para un administrador,
// contiene las de todos, así que las estadísticas quedan globales
// automáticamente sin código adicional.
function renderizarEstadisticas() {
  const terminoUsuario = filtroEstadisticasUsuario.trim().toLowerCase();
  const usuariosCoincidentes = perfilesUsuarios.filter((perfil) => {
    const usuario = `${perfil.full_name || ""} ${perfil.email || ""}`.toLowerCase();
    return usuario.includes(terminoUsuario);
  });
  const hayFiltroUsuario = esAdmin && terminoUsuario !== "";

  if (hayFiltroUsuario) {
    statsTitleEl.textContent =
      usuariosCoincidentes.length === 1
        ? `Estadísticas de ${usuariosCoincidentes[0].full_name || usuariosCoincidentes[0].email}`
        : "Estadísticas filtradas";
  } else {
    statsTitleEl.textContent = esAdmin ? "Estadísticas generales" : "Mis estadísticas";
  }

  // Base de tareas sobre la que se calcula todo: si el admin filtró por un
  // usuario en concreto, solo se cuentan las tareas de ese usuario.
  const tareasSinAdministradores = esAdmin
    ? tareas.filter((t) => !t.ownerIsAdmin)
    : tareas;

  const tareasBase = hayFiltroUsuario
    ? tareasSinAdministradores.filter((t) =>
        usuariosCoincidentes.some((perfil) => perfil.email === t.ownerEmail)
      )
    : tareasSinAdministradores;

  const total = tareasBase.length || 0;
  const pendientes = tareasBase.filter((t) => t.status === "pendiente").length || 0;
  const completadas = tareasBase.filter((t) => t.status === "completada").length || 0;
  const vencidas = tareasBase.filter((t) => estaVencida(t)).length || 0;

  const tarjetas = [
    { valor: total, etiqueta: "Tareas en total", clase: "stat-card--total", tipo: "total" },
    { valor: pendientes, etiqueta: "Pendientes", clase: "stat-card--pending", tipo: "pending" },
    { valor: completadas, etiqueta: "Completadas", clase: "stat-card--done", tipo: "done" },
    { valor: vencidas, etiqueta: "Vencidas", clase: "stat-card--overdue", tipo: "overdue" },
  ];

  // Siempre se pintan las 4 tarjetas, incluso en 0, para que la vista
  // nunca se vea vacía cuando todavía no hay tareas.
  statsGridEl.innerHTML = tarjetas
    .map(
      (t) => `
      <div class="stat-card ${t.clase}">
        <span class="stat-card__icon" aria-hidden="true">${ICONOS_STATS[t.tipo] || ""}</span>
        <div class="stat-card__body">
          <p class="stat-card__value">${t.valor ?? 0}</p>
          <p class="stat-card__label">${t.etiqueta}</p>
        </div>
      </div>
    `
    )
    .join("");

  // ---- Distribución por prioridad ----
  const porPrioridad = { baja: 0, media: 0, alta: 0 };
  tareasBase.forEach((t) => {
    if (porPrioridad[t.priority] !== undefined) porPrioridad[t.priority]++;
  });
  const maxPrioridad = Math.max(1, ...Object.values(porPrioridad));

  statsPriorityBarsEl.innerHTML = Object.entries(porPrioridad)
    .map(([prioridad, cantidad]) => {
      const porcentaje = Math.round((cantidad / maxPrioridad) * 100);
      return `
        <div class="stats-bar-row">
          <span class="stats-bar-row__label stats-bar-row__label--${prioridad}">${ETIQUETAS_PRIORIDAD_CORTA[prioridad]}</span>
          <div class="stats-bar-row__track">
            <div class="stats-bar-row__fill stats-bar-row__fill--${prioridad}" style="width: ${porcentaje}%"></div>
          </div>
          <span class="stats-bar-row__count">${cantidad}</span>
        </div>
      `;
    })
    .join("");

  // ---- Ranking por usuario (solo visible para el admin viendo "todos") ----
  // Se listan TODOS los usuarios registrados, no solo los que tienen
  // tareas, para que quien no tenga ninguna aparezca igual con 0.
  if (esAdmin && !hayFiltroUsuario) {
    statsUsersSectionEl.hidden = false;

    const conteoPorUsuario = new Map();
    perfilesUsuarios.forEach((p) => {
      conteoPorUsuario.set(p.full_name || p.email, 0);
    });
    tareasSinAdministradores.forEach((t) => {
      if (!t.ownerEmail) return;
      const nombre = t.ownerName || t.ownerEmail;
      conteoPorUsuario.set(nombre, (conteoPorUsuario.get(nombre) || 0) + 1);
    });

    const listaOrdenada = [...conteoPorUsuario.entries()].sort((a, b) => b[1] - a[1]);
    const maxUsuario = Math.max(1, ...listaOrdenada.map(([, cantidad]) => cantidad));

    statsUserListEl.innerHTML = listaOrdenada
      .map(([nombre, cantidad]) => {
        const porcentaje = Math.round((cantidad / maxUsuario) * 100);
        return `
          <li class="stats-user-row">
            <span class="stats-user-row__name">${escapeHtml(nombre)}</span>
            <div class="stats-user-row__track">
              <div class="stats-user-row__fill" style="width: ${porcentaje}%"></div>
            </div>
            <span class="stats-user-row__count">${cantidad}</span>
          </li>
        `;
      })
      .join("");
  } else {
    statsUsersSectionEl.hidden = true;
  }
}

// ---------- Eventos de la app de tareas ----------
formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const titulo = tituloInput.value;
  const descripcion = descripcionInput.value;

  if (!validarFormulario(titulo, descripcion)) return;

  if (assignmentError) assignmentError.textContent = "";
  if (esAdmin && !tareaEditandoId && !taskAssigneeInput.value) {
    assignmentError.textContent = "Selecciona el usuario al que vas a delegar la tarea.";
    return;
  }

  // El "finally" garantiza que el formulario SIEMPRE se limpie,
  // haya funcionado la operación o no.
  try {
    if (tareaEditandoId) {
      await actualizarTarea(tareaEditandoId, {
        title: titulo,
        description: descripcion,
        dueDate: fechaLimiteInput.value,
        priority: prioridadInput.value,
      });
    } else {
      await crearTarea({
        title: titulo,
        description: descripcion,
        dueDate: fechaLimiteInput.value,
        priority: prioridadInput.value,
        userId: esAdmin ? taskAssigneeInput.value : null,
      });
    }
  } finally {
    formulario.reset();
    prioridadInput.value = "media";
    cerrarModalTarea();
  }
});

botonesFiltro.forEach((button) => {
  button.addEventListener("click", () => {
    botonesFiltro.forEach((b) => b.classList.remove("is-active"));
    button.classList.add("is-active");
    filtroActual = button.dataset.filter;
    renderizar();
  });
});

// =========================================================
//                        AJUSTES
// =========================================================

const CLAVE_AJUSTES = "cloudtasks-ajustes";

const AJUSTES_POR_DEFECTO = {
  darkMode: false,
  compactMode: false,
  confirmDelete: true,
  sortOrder: "created_desc",
};

let ajustes = cargarAjustesGuardados();

function cargarAjustesGuardados() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_AJUSTES));
    return { ...AJUSTES_POR_DEFECTO, ...(guardado || {}) };
  } catch {
    return { ...AJUSTES_POR_DEFECTO };
  }
}

function guardarAjustes() {
  localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
}

function aplicarTemaOscuro() {
  document.documentElement.setAttribute("data-theme", ajustes.darkMode ? "dark" : "light");
}

function aplicarModoCompacto() {
  document.body.classList.toggle("is-compact", ajustes.compactMode);
}

function aplicarControlesAjustes() {
  settingDarkMode.checked = ajustes.darkMode;
  settingCompactMode.checked = ajustes.compactMode;
  settingConfirmDelete.checked = ajustes.confirmDelete;
  settingSortOrder.value = ajustes.sortOrder;
}

function inicializarAjustes() {
  aplicarControlesAjustes();
  aplicarTemaOscuro();
  aplicarModoCompacto();
}

settingDarkMode.addEventListener("change", () => {
  ajustes.darkMode = settingDarkMode.checked;
  guardarAjustes();
  aplicarTemaOscuro();
});

settingCompactMode.addEventListener("change", () => {
  ajustes.compactMode = settingCompactMode.checked;
  guardarAjustes();
  aplicarModoCompacto();
});

settingConfirmDelete.addEventListener("change", () => {
  ajustes.confirmDelete = settingConfirmDelete.checked;
  guardarAjustes();
});

settingSortOrder.addEventListener("change", () => {
  ajustes.sortOrder = settingSortOrder.value;
  guardarAjustes();
  renderizar();
});

function ordenarTareas(lista) {
  const copia = [...lista];

  if (ajustes.sortOrder === "due_date") {
    copia.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  } else if (ajustes.sortOrder === "priority") {
    const orden = { alta: 0, media: 1, baja: 2 };
    copia.sort((a, b) => orden[a.priority] - orden[b.priority]);
  }
  // "created_desc" ya viene ordenado así desde la consulta a Supabase.

  return copia;
}

// =========================================================
//                        CALENDARIO
// =========================================================

let fechaCalendarioVisible = new Date();
let diaCalendarioSeleccionado = null; // "YYYY-MM-DD"

const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatearFechaISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderizarCalendario() {
  if (!calendarGrid) return;

  const year = fechaCalendarioVisible.getFullYear();
  const month = fechaCalendarioVisible.getMonth();

  calendarMonthLabel.textContent = `${NOMBRES_MES[month]} ${year}`;

  const primerDiaSemana = new Date(year, month, 1).getDay(); // 0 = domingo
  const diasEnMes = new Date(year, month + 1, 0).getDate();
  const hoyISO = formatearFechaISO(new Date());
  const fechasConTareas = new Set(tareas.filter((t) => t.dueDate).map((t) => t.dueDate));

  calendarGrid.innerHTML = "";

  for (let i = 0; i < primerDiaSemana; i++) {
    const relleno = document.createElement("span");
    relleno.className = "calendar-day calendar-day--muted";
    calendarGrid.appendChild(relleno);
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fechaISO = formatearFechaISO(new Date(year, month, dia));

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "calendar-day";
    if (fechaISO === hoyISO) boton.classList.add("calendar-day--today");
    if (fechaISO === diaCalendarioSeleccionado) boton.classList.add("calendar-day--selected");

    const numero = document.createElement("span");
    numero.textContent = String(dia);
    boton.appendChild(numero);

    if (fechasConTareas.has(fechaISO)) {
      const punto = document.createElement("span");
      punto.className = "calendar-day__dot";
      boton.appendChild(punto);
    }

    boton.addEventListener("click", () => {
      diaCalendarioSeleccionado = fechaISO;
      renderizarCalendario();
      renderizarTareasDelDia(fechaISO);
    });

    calendarGrid.appendChild(boton);
  }
}

function renderizarTareasDelDia(fechaISO) {
  const tareasDelDia = tareas.filter((t) => t.dueDate === fechaISO);
  calendarDayTasksTitle.textContent = `Tareas para el ${formatearFecha(fechaISO)}`;

  calendarDayTasksList.innerHTML = "";
  tareasDelDia.forEach((task) => calendarDayTasksList.appendChild(construirElementoTarea(task)));

  calendarDayEmpty.hidden = tareasDelDia.length !== 0;
}

if (calendarPrevBtn) {
  calendarPrevBtn.addEventListener("click", () => {
    fechaCalendarioVisible = new Date(
      fechaCalendarioVisible.getFullYear(),
      fechaCalendarioVisible.getMonth() - 1,
      1
    );
    renderizarCalendario();
  });
}

if (calendarNextBtn) {
  calendarNextBtn.addEventListener("click", () => {
    fechaCalendarioVisible = new Date(
      fechaCalendarioVisible.getFullYear(),
      fechaCalendarioVisible.getMonth() + 1,
      1
    );
    renderizarCalendario();
  });
}

// =========================================================
//                     INICIALIZACIÓN
// =========================================================
inicializarAjustes();
actualizarTextosAuth();

supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    mostrarApp(session.user);
  } else {
    mostrarAuth();
  }
});