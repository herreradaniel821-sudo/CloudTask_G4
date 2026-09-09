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
  if (filtroActual === "pendiente") return tareas.filter((t) => t.status === "pendiente");
  if (filtroActual === "completada") return tareas.filter((t) => t.status === "completada");
  return tareas;
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
    tituloInput.focus();
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
//                     INICIALIZACIÓN
// =========================================================
actualizarTextosAuth();

supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    mostrarApp(session.user);
  } else {
    mostrarAuth();
  }
});