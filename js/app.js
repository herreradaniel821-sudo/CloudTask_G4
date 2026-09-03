const CLAVE_ALMACENAMIENTO = "cloudtasks:tareas";
const MAX_LONGITUD_TITULO = 80;
const MAX_LONGITUD_DESCRIPCION = 300;

let tareas = cargarTareas();
let filtroActual = "todas";



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


function cargarTareas() {
  try {
    const raw = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("No se pudieron cargar las tareas guardadas:", error);
    return [];
  }
}

function guardarTareas() {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(tareas));
  } catch (error) {
    console.error("No se pudieron guardar las tareas:", error);
  }
}


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


function crearTarea({ title, description, dueDate, priority }) {
  const nuevaTarea = {
    id: generarId(),
    title: title.trim(),
    description: description.trim(),
    dueDate: dueDate || null,
    priority,
    status: "pendiente",
    created_at: new Date().toISOString(),
  };

  tareas.unshift(nuevaTarea);
  guardarTareas();
  renderizar();
}

function alternarEstadoTarea(id) {
  const tarea = tareas.find((t) => t.id === id);
  if (!tarea) return;

  tarea.status = tarea.status === "pendiente" ? "completada" : "pendiente";
  guardarTareas();
  renderizar();
}

function eliminarTarea(id) {
  tareas = tareas.filter((t) => t.id !== id);
  guardarTareas();
  renderizar();
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


formulario.addEventListener("submit", (event) => {
  event.preventDefault();

  const titulo = tituloInput.value;
  const descripcion = descripcionInput.value;

  if (!validarFormulario(titulo, descripcion)) return;

  crearTarea({
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


renderizar();