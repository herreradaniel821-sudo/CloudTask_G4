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
const logoutBtn = document.getElementById("logout-btn");

// ---------- Referencias al DOM: App de tareas ----------
const formulario = document.getElementById("formulario-tarea");
const tituloInput = document.getElementById("titulo");
const descripcionInput = document.getElementById("descripcion");
const fechaLimiteInput = document.getElementById("fechaLimite");
const prioridadInput = document.getElementById("prioridad");
const errorTitulo = document.getElementById("title-error");
const errorDescripcion = document.getElementById("description-error");
const listaTareas = document.getElementById("lista-tareas");
const contadorTareas = document.getElementById("contador-tareas");
const estadoVacio = document.getElementById("estado-vacio");
const botonesFiltro = document.querySelectorAll(".filter-btn");

// ---------- Referencias al DOM: Sidebar / navegación entre vistas ----------
const menuToggleBtn = document.getElementById("menu-toggle-btn");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const botonesNav = document.querySelectorAll(".nav-btn");
const vistas = document.querySelectorAll(".view");

// ---------- Referencias al DOM: Modal "Nueva tarea" ----------
const fabNuevaTarea = document.getElementById("fab-nueva-tarea");
const taskModalOverlay = document.getElementById("task-modal-overlay");
const closeTaskModalBtn = document.getElementById("close-task-modal-btn");

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

function mostrarApp(user) {
  authSection.hidden = true;
  appSection.hidden = false;
  const nombre = user.user_metadata && user.user_metadata.full_name;
  userEmailDisplay.textContent = nombre ? `${nombre} (${user.email})` : user.email;
  recargarYRenderizar();
}

function mostrarAuth() {
  appSection.hidden = true;
  authSection.hidden = false;
  authForm.reset();
  modoAuth = "login";
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
  });
});

// =========================================================
//        MODAL "NUEVA TAREA" (activado desde el botón +)
// =========================================================

function abrirModalTarea() {
  taskModalOverlay.hidden = false;
}

function cerrarModalTarea() {
  taskModalOverlay.hidden = true;
}

fabNuevaTarea.addEventListener("click", abrirModalTarea);
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

// READ
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

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    created_at: row.created_at,
  }));
}

// CREATE
async function crearTarea({ title, description, dueDate, priority }) {
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
    user_id: userData.user.id,
  };

  const { error } = await supabaseClient.from("tasks").insert(nuevaTarea);

  if (error) {
    console.error("Error al crear tarea:", error.message);
    alert("No se pudo crear la tarea: " + error.message);
    return;
  }

  await recargarYRenderizar();
}

// UPDATE
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

// DELETE
async function eliminarTarea(id) {
  if (ajustes.confirmDelete && !confirm("¿Seguro que quieres eliminar esta tarea?")) {
    return;
  }

  const { error } = await supabaseClient.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar tarea:", error.message);
    alert("No se pudo eliminar la tarea: " + error.message);
    return;
  }

  await recargarYRenderizar();
}

async function recargarYRenderizar() {
  tareas = await cargarTareas();
  renderizar();
  renderizarCalendario();
  if (diaCalendarioSeleccionado) {
    renderizarTareasDelDia(diaCalendarioSeleccionado);
  }
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
  if (filtroActual === "pendiente") resultado = tareas.filter((t) => t.status === "pendiente");
  if (filtroActual === "completada") resultado = tareas.filter((t) => t.status === "completada");
  return ordenarTareas(resultado);
}

function construirElementoTarea(task) {
  const li = document.createElement("li");
  li.className = `task-item task-item--${task.priority}`;
  if (task.status === "completada") li.classList.add("task-item--done");
  li.dataset.id = task.id;

  const metaParts = [
    `<span class="badge badge--${task.priority}">${ETIQUETAS_PRIORIDAD[task.priority]}</span>`,
  ];
  if (task.dueDate) {
    metaParts.push(`<span class="badge badge--date">Vence: ${formatearFecha(task.dueDate)}</span>`);
  }

  li.innerHTML = `
    <input
      type="checkbox"
      class="task-item__check"
      ${task.status === "completada" ? "checked" : ""}
      aria-label="Marcar tarea como ${task.status === "completada" ? "pendiente" : "completada"}"
    />
    <div class="task-item__body">
      <p class="task-item__title">${escapeHtml(task.title)}</p>
      ${task.description ? `<p class="task-item__description">${escapeHtml(task.description)}</p>` : ""}
      <div class="task-item__meta">${metaParts.join("")}</div>
    </div>
    <button type="button" class="task-item__delete" aria-label="Eliminar tarea">✕</button>
  `;

  li.querySelector(".task-item__check").addEventListener("change", () => alternarEstadoTarea(task.id));
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

// ---------- Eventos de la app de tareas ----------
formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const titulo = tituloInput.value;
  const descripcion = descripcionInput.value;

  if (!validarFormulario(titulo, descripcion)) return;

  // El "finally" garantiza que el formulario SIEMPRE se limpie,
  // haya funcionado la creación de la tarea o no.
  try {
    await crearTarea({
      title: titulo,
      description: descripcion,
      dueDate: fechaLimiteInput.value,
      priority: prioridadInput.value,
    });
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