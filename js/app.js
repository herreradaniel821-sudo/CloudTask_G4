

// Configuración de Supabase 
const SUPABASE_URL = "https://kegxjelnuopcyjkfnxya.supabase.co";
const SUPABASE_KEY = "sb_publishable_jpSlcXHQWrVudkRhjbHRPg_ncS1pWow";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MAX_LONGITUD_TITULO = 80;
const MAX_LONGITUD_DESCRIPCION = 300;

let tareas = [];
let filtroActual = "todas";

//Referencias al DOM 
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

//Utilidades 
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

// Capa de datos (Fase 2: Supabase / CRUD real) 

// READ: trae todas las tareas desde Supabase
async function cargarTareas() {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al cargar tareas:", error.message);
    alert("No se pudieron cargar las tareas. Revisa la consola para más detalles.");
    return [];
  }

  // Traducimos los nombres de columna 
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

// inserta una nueva tarea en Supabase
async function crearTarea({ title, description, dueDate, priority }) {
  const nuevaTarea = {
    id: generarId(),
    title: title.trim(),
    description: description.trim() || null,
    due_date: dueDate || null,
    priority,
    status: "pendiente",
  };

  const { error } = await supabaseClient.from("tasks").insert(nuevaTarea);

  if (error) {
    console.error("Error al crear tarea:", error.message);
    alert("No se pudo crear la tarea. Revisa la consola para más detalles.");
    return;
  }

  await recargarYRenderizar();
}

// cambia el estado (pendiente <-> completada)
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
    alert("No se pudo actualizar la tarea. Revisa la consola para más detalles.");
    return;
  }

  await recargarYRenderizar();
}


async function eliminarTarea(id) {
  const { error } = await supabaseClient.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar tarea:", error.message);
    alert("No se pudo eliminar la tarea. Revisa la consola para más detalles.");
    return;
  }

  await recargarYRenderizar();
}

async function recargarYRenderizar() {
  tareas = await cargarTareas();
  renderizar();
}


function validarFormulario(titulo, descripcion) {
  let esValido = true;

  errorTitulo.textContent = "";
  errorDescripcion.textContent = "";
  tituloInput.classList.remove("is-invalid");
  descripcionInput.classList.remove("is-invalid");

  if (titulo.trim().length === 0) {
    errorTitulo.textContent = "El título es obligatorio.";
    tituloInput.classList.add("is-invalid");
    esValido = false;
  } else if (titulo.trim().length > MAX_LONGITUD_TITULO) {
    errorTitulo.textContent = `El título no puede superar ${MAX_LONGITUD_TITULO} caracteres.`;
    tituloInput.classList.add("is-invalid");
    esValido = false;
  }

  if (descripcion.trim().length > MAX_LONGITUD_DESCRIPCION) {
    errorDescripcion.textContent = `La descripción no puede superar ${MAX_LONGITUD_DESCRIPCION} caracteres.`;
    descripcionInput.classList.add("is-invalid");
    esValido = false;
  }

  return esValido;
}

function obtenerTareasFiltradas() {
  if (filtroActual === "pendiente") {
    return tareas.filter((t) => t.status === "pendiente");
  }
  if (filtroActual === "completada") {
    return tareas.filter((t) => t.status === "completada");
  }
  return tareas;
}

function construirElementoTarea(task) {
  const li = document.createElement("li");
  li.className = `task-item task-item--${task.priority}`;
  if (task.status === "completada") {
    li.classList.add("task-item--done");
  }
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

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();

  const titulo = tituloInput.value;
  const descripcion = descripcionInput.value;

  if (!validarFormulario(titulo, descripcion)) return;

  await crearTarea({
    title: titulo,
    description: descripcion,
    dueDate: fechaLimiteInput.value,
    priority: prioridadInput.value,
  });

  formulario.reset();
  prioridadInput.value = "media";
  tituloInput.focus();
});

botonesFiltro.forEach((button) => {
  button.addEventListener("click", () => {
    botonesFiltro.forEach((b) => b.classList.remove("is-active"));
    button.classList.add("is-active");
    filtroActual = button.dataset.filter;
    renderizar();
  });
});


recargarYRenderizar();