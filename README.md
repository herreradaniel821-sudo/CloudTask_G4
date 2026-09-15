# CloudTasks (https://www.cloudtask.website)

## Equipo — Grupo 4

- Daniel Herrera
- Victoria Mejía Melo
- Gloribeth Rentería Ramírez
- Daniel Montenegro Gil
- Bryan Diaz Moreno


## Descripción

CloudTasks permite crear, visualizar, completar, eliminar, editar y filtrar tareas, con
persistencia real en la nube y autenticación de usuarios. Cada persona gestiona únicamente
sus propias tareas, mientras que un rol de administrador puede supervisar y gestionar
las tareas de todos los usuarios registrados.

El proyecto fue construido siguiendo una evolución progresiva: desde una aplicación
puramente local (HTML/CSS/JS) hasta una solución completa desplegada en la nube, integrando
servicios open source y administrados (Git, GitHub, Supabase, Vercel y Cloudflare).

## Funcionalidades

Para cualquier usuario:
- Registro e inicio de sesión (correo y contraseña), con opción de mostrar/ocultar contraseña
- Crear, editar, completar y eliminar tareas (título, descripción, fecha límite, prioridad)
- Filtrar por estado (todas / pendientes / completadas)
- Búsqueda de tareas por título, con resaltado del texto coincidente
- Indicador visual de tareas vencidas (fecha límite pasada y aún pendientes)
- Vista de calendario con las tareas organizadas por fecha límite
- Pestaña de estadísticas personales (total, pendientes, completadas, vencidas, distribución por prioridad)
- Ajustes: tema oscuro, modo compacto, confirmación antes de eliminar, orden de la lista
- Modal de confirmación propio (sin usar los diálogos por defecto del navegador)
- Diseño responsivo (funciona en computador y celular)

Exclusivo para administradores:
- Visualización de todas las tareas de todos los usuarios, identificando quién creó cada una
- Filtro por usuario específico
- Edición y eliminación de tareas de cualquier usuario
- Pestaña de estadísticas generales: usuarios activos y ranking de tareas por usuario

## Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
|---|---|
| HTML5 | Estructura de la interfaz |
| CSS3 | Diseño visual, tema propio y diseño responsivo |
| JavaScript (vanilla) | Lógica de la aplicación e interacción con Supabase |
| Git | Control de versiones |
| GitHub | Repositorio remoto y colaboración en equipo |
| Supabase | Backend administrado: base de datos PostgreSQL y autenticación de usuarios |
| PostgreSQL | Motor de base de datos relacional, con Row Level Security (RLS) |
| Vercel | Hosting, despliegue automático y registro del dominio |
| Cloudflare | DNS, certificado HTTPS/TLS, proxy inverso y CDN |

No se utilizan frameworks de frontend (React, Angular, Vue) — el proyecto usa HTML, CSS y
JavaScript puro de forma intencional, siguiendo el alcance del laboratorio.

## Arquitectura

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

## Estructura del proyecto

```
CloudTask_G4/
├── index.html # Estructura de la app (login, tareas, calendario, estadísticas, ajustes)
├── css/
│ └── styles.css # Estilos base + tema visual del proyecto
├── js/
│ └── app.js # Autenticación, roles, CRUD de tareas, calendario, estadísticas
├── favicon.svg # Ícono del sitio
├── favicon.ico
├── apple-touch-icon.png
├── README.md
└── .gitignore
```

## Modelo de datos

### Tabla `tasks`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | text | Identificador único de la tarea |
| `title` | text | Título de la tarea (obligatorio) |
| `description` | text | Descripción opcional |
| `due_date` | date | Fecha límite |
| `priority` | text | `baja` \| `media` \| `alta` |
| `status` | text | `pendiente` \| `completada` |
| `created_at` | timestamptz | Fecha de creación (automática) |
| `user_id` | uuid | Referencia al usuario propietario |

### Tabla `profiles`

Se crea automáticamente al registrarse un usuario (mediante un trigger de PostgreSQL).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Igual al `id` del usuario en Supabase Auth |
| `email` | text | Correo del usuario |
| `full_name` | text | Nombre ingresado al registrarse |
| `is_admin` | boolean | Determina si el usuario tiene rol de administrador |

## Seguridad y roles

Ambas tablas tienen Row Level Security (RLS) activado:

- Un usuario normal solo puede leer, crear, actualizar o eliminar sus propias tareas.
- Un administrador (`is_admin = true` en `profiles`) puede leer, actualizar y eliminar las
  tareas de cualquier usuario.
- El rol de administrador no puede ser modificado desde la aplicación: solo se asigna
  manualmente desde el panel de Supabase, evitando que un usuario se autoasigne el rol.

## Cómo ejecutar el proyecto localmente

1. Clona el repositorio:

git clone https://github.com/ZweiteGlooo/CloudTask_G4.git
cd CloudTask_G4

2. Abre `index.html` en tu navegador (recomendado: extensión Live Server de VS Code).
3. La aplicación ya está conectada a un proyecto de Supabase en la nube — no requiere
   configuración adicional para probarla localmente.

## Despliegue

- **Frontend:** desplegado automáticamente en [Vercel](https://vercel.com) en cada `push` a la
  rama `main`.
- **Dominio propio:** `cloudtask.website`, con DNS y HTTPS gestionados por
  [Cloudflare](https://cloudflare.com).
- **Backend:** [Supabase](https://supabase.com), plan gratuito.

## Uso de Inteligencia Artificial

Durante el desarrollo se utilizó Claude (Anthropic) como asistente de desarrollo, para
planeación, generación y depuración de código, y documentación. El detalle completo de
prompts, código obtenido, cambios realizados por el equipo y proceso de validación se
documenta en el informe técnico del laboratorio.

## Licencia

Proyecto académico desarrollado para el Seminario de Ingeniería de Software,
Universidad Icesi — 2026.



