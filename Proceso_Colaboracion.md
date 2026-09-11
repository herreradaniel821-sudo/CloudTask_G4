# CloudTasks — Proceso de Colaboración y Contribuciones

**Grupo 4 — CloudTask_G4**
Seminario de Ingeniería de Software · Universidad Icesi
Departamento de Computación y Sistemas Inteligentes

Sitio en producción: **[cloudtask.website](https://www.cloudtask.website)**

---

## Equipo

| Integrante |
|---|
| Daniel Herrera |
| Victoria Mejía Melo |
| Gloribeth Rentería Ramírez |
| *(agregar demás integrantes)* |

---

## 1. Contexto

CloudTasks se construyó de forma progresiva: primero como una aplicación puramente local en
**HTML, CSS y JavaScript**, y luego evolucionó hacia una solución desplegada en la nube con
Supabase, Vercel y Cloudflare. Este documento se enfoca específicamente en **cómo se organizó
el trabajo colaborativo sobre el código frontend** (`index.html`, `css/styles.css`,
`js/app.js`), qué convenciones se adoptaron y qué conflictos surgieron al integrar el trabajo
de distintos integrantes del equipo.

---

## 2. División de responsabilidades por tecnología

| Capa | Archivo | Responsabilidad principal |
|---|---|---|
| **HTML** | `index.html` | Estructura de la interfaz: formulario de creación de tareas, listado de tareas, pantalla de login/registro |
| **CSS** | `css/styles.css` | Diseño visual: tema pixel/neon personalizado, estilos de la pantalla de autenticación, responsividad |
| **JavaScript** | `js/app.js` | Lógica de la aplicación: validaciones, renderizado dinámico, autenticación y comunicación con Supabase |

Aunque cada integrante podía tocar cualquiera de los tres archivos, se estableció que **quien
definía la estructura HTML de un componente tenía la última palabra sobre su nomenclatura**
(ids, clases y atributos), ya que de eso dependía directamente que el JavaScript pudiera
encontrar y manipular esos elementos.

---

## 3. Flujo de trabajo colaborativo

```
1. Actualizar la copia local (git pull) antes de empezar a trabajar
2. Desarrollar el cambio en HTML / CSS / JS
3. Verificar que los identificadores usados en JS coincidan con los del HTML vigente
4. Probar el cambio localmente en el navegador
5. Subir el cambio al repositorio del equipo (git push)
6. Verificar que Vercel generara el despliegue automático correspondiente
```

Este flujo se reforzó después de detectar que, al inicio del proyecto, algunos cambios se
estaban subiendo a un **fork personal** en lugar del repositorio oficial del equipo
(`ZweiteGlooo/CloudTask_G4`), lo que impedía que Vercel detectara las actualizaciones. Una vez
corregida la conexión de cada copia local, todo el equipo trabajó de forma consistente contra
el mismo repositorio.

---

## 4. Conflictos encontrados y su resolución

### 4.1 Desajuste de nomenclatura entre HTML y JavaScript

**Situación:** distintos integrantes desarrollaron el HTML (con nombres en español para el
formulario y sus campos) y el JavaScript por separado. Al integrarlos, los identificadores no
coincidían, por lo que JavaScript no lograba encontrar los elementos de la página. El problema
era especialmente difícil de detectar porque **la aplicación no mostraba ningún error visible**
al usuario; simplemente dejaba de funcionar.

**Resolución:** se adoptó como regla de equipo que el JavaScript siempre debía adaptarse a la
nomenclatura ya definida en el HTML vigente, revisando cuidadosamente cada nueva versión del
código contra la estructura actual antes de integrarla.

### 4.2 Conflictos al sincronizar el repositorio

**Situación:** al trabajar varios integrantes en paralelo sobre los mismos archivos
(`index.html`, `styles.css`, `app.js`), surgieron rechazos al subir cambios porque el
repositorio remoto ya contenía trabajo que no existía en la copia local.

**Resolución:** se adoptó la práctica de actualizar siempre la copia local antes de subir
nuevo trabajo, y de revisar manualmente los casos en los que dos personas habían modificado el
mismo archivo, decidiendo en conjunto qué cambios conservar.

### 4.3 Prioridad entre reglas de CSS

**Situación:** al ocultar ciertas secciones de la interfaz mediante JavaScript (por ejemplo, el
formulario de login una vez el usuario ya había entrado), estas seguían apareciendo
visualmente aunque el código indicara correctamente que debían ocultarse. La causa fue un
conflicto de prioridad entre las reglas de CSS: la regla encargada de ocultar el elemento tenía,
por defecto, menor peso que otras reglas de diseño ya aplicadas al mismo elemento.

**Resolución:** se agregaron reglas de CSS más específicas y con mayor prioridad, dedicadas
puntualmente a garantizar que esos elementos se oculten correctamente sin importar qué otras
reglas de diseño existan en el proyecto.

### 4.4 Pie de página fuera de posición

**Situación:** un primer intento de centrar la pantalla de login usó una altura calculada
manualmente en CSS, asumiendo un tamaño fijo para el encabezado y el pie de página. Como ese
cálculo no coincidía con el tamaño real de esos elementos, el pie de página quedaba fuera del
área visible.

**Resolución:** se reemplazó el cálculo manual por un patrón de diseño más robusto (flexbox),
en el que el encabezado y el pie de página ocupan solo el espacio que necesitan, y el contenido
central crece automáticamente para llenar el espacio restante.

### 4.5 El formulario no se limpiaba

**Situación:** tras crear una tarea, el formulario a veces no se vaciaba, y en ocasiones la
aplicación indicaba que no había tareas aunque sí se hubieran creado. La causa era que la
limpieza del formulario en JavaScript solo se ejecutaba si la creación de la tarea terminaba
completamente sin errores.

**Resolución:** se aseguró que el formulario se limpiara siempre, hubiera funcionado la
operación o no, y se mejoraron los mensajes de error para que cualquier falla real se mostrara
de forma explícita al usuario.

---

## 5. Resumen de contribuciones por tecnología

| Tecnología | Tipo de contribución colaborativa | Convención adoptada |
|---|---|---|
| **HTML** | Definición de estructura y nomenclatura de elementos | La nomenclatura del HTML vigente es la referencia; no se renombra sin avisar al equipo |
| **CSS** | Estilos visuales, tema pixel/neon, layout responsivo | Uso de reglas específicas y de mayor prioridad para estados críticos (mostrar/ocultar); preferencia por patrones flexibles (flexbox) sobre cálculos fijos |
| **JavaScript** | Validaciones, renderizado dinámico, integración con Supabase | El JS se adapta siempre a los identificadores definidos en el HTML; limpieza de formularios y manejo de errores garantizados en todos los flujos, exitosos o no |

---

## 6. Aprendizajes del proceso colaborativo

- Verificar siempre a qué repositorio apunta la copia local antes de trabajar en equipo.
- Adaptar el código nuevo a las convenciones ya definidas por el equipo, en lugar de imponer
  nomenclaturas propias.
- Actualizar la copia local antes de subir cambios, y resolver en conjunto los conflictos de
  archivos modificados por más de una persona.
- Los elementos críticos de mostrar/ocultar en la interfaz necesitan reglas de CSS explícitas
  y robustas para evitar conflictos de prioridad.
- Preferir patrones de diseño flexibles (como flexbox) sobre cálculos de tamaño fijos y
  estimados a mano.

---

## 7. Información complementaria del repositorio (README)

Esta sección recoge, de forma separada, la información oficial del `README.md` del repositorio,
como referencia adicional a lo documentado en las secciones anteriores.

### 7.1 Datos generales del proyecto

- **Sitio en producción:** [cloudtask.website](https://www.cloudtask.website)
- **Descripción:** CloudTasks permite crear, visualizar, completar, eliminar y filtrar tareas
  personales, con persistencia real en la nube y autenticación de usuarios; cada persona
  gestiona únicamente sus propias tareas.
- **Evolución del proyecto:** desde una aplicación puramente local (HTML/CSS/JS) hasta una
  solución completa desplegada en la nube, integrando servicios open source y administrados
  (Git, GitHub, Supabase, Vercel y Cloudflare).

### 7.2 Estructura del repositorio

```
CloudTask_G4/
├── index.html          # Estructura de la app (login + gestor de tareas)
├── css/
│   └── styles.css      # Estilos (tema pixel/neon + pantalla de autenticación)
├── js/
│   └── app.js          # Lógica: autenticación, CRUD de tareas, validaciones
├── README.md
└── .gitignore
```

### 7.3 Arquitectura general

```
Usuario
  │
  ▼
Cloudflare  →  DNS · HTTPS/TLS · Proxy inverso · CDN
  │
  ▼
Vercel  →  Hosting y despliegue del frontend (HTML/CSS/JS)
  │
  ▼
Supabase  →  Backend as a Service
  ├── PostgreSQL (tabla `tasks`)
  └── Supabase Auth (usuarios, sesiones)
```

### 7.4 Modelo de datos — tabla `tasks` (Supabase / PostgreSQL)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | text | Identificador único de la tarea |
| `title` | text | Título de la tarea (obligatorio) |
| `description` | text | Descripción opcional |
| `due_date` | date | Fecha límite |
| `priority` | text | `baja` \| `media` \| `alta` |
| `status` | text | `pendiente` \| `completada` |
| `created_at` | timestamptz | Fecha de creación (automática) |
| `user_id` | uuid | Referencia al usuario propietario (Supabase Auth) |

La tabla tiene **Row Level Security (RLS)** activado: cada usuario solo puede leer, crear,
actualizar o eliminar sus propias tareas.

### 7.5 Despliegue

- **Frontend:** desplegado automáticamente en [Vercel](https://vercel.com) en cada `push` a la
  rama `main`.
- **Dominio propio:** `cloudtask.website`, con DNS y HTTPS gestionados por
  [Cloudflare](https://cloudflare.com).
- **Backend:** [Supabase](https://supabase.com), plan gratuito.

---

*Documento de apoyo para el informe técnico y la sustentación del laboratorio desafío
"CloudTasks", Seminario de Ingeniería de Software, Universidad Icesi.*
