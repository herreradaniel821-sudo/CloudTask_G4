# CloudTasks (https://www.cloudtask.website)

## Equipo — Grupo 4

- Daniel Herrera
- Victoria Mejía Melo
- Gloribeth Rentería Ramírez
- (agregar demás integrantes)


## Descripción

CloudTasks permite crear, visualizar, completar, eliminar y filtrar tareas personales, con
persistencia real en la nube y autenticación de usuarios: cada persona gestiona únicamente sus
propias tareas.

El proyecto fue construido siguiendo una evolución progresiva: desde una aplicación puramente
local (HTML/CSS/JS) hasta una solución completa desplegada en la nube, integrando servicios
open source y administrados (Git, GitHub, Supabase, Vercel y Cloudflare).


## Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
|---|---|
| **HTML5** | Estructura de la interfaz |
| **CSS3** | Diseño visual (tema pixel/neon personalizado) |
| **JavaScript** | Lógica de la aplicación e interacción con Supabase |
| **Git** | Control de versiones |
| **GitHub** | Repositorio remoto y colaboración en equipo |
| **Supabase** | Backend administrado: base de datos PostgreSQL y autenticación de usuarios |
| **PostgreSQL** | Motor de base de datos relacional |
| **Vercel** | Hosting, despliegue automático y registro del dominio |
| **Cloudflare** | DNS, certificado HTTPS/TLS, proxy inverso y CDN |


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
├── index.html          # Estructura de la app (login + gestor de tareas)
├── css/
│   └── styles.css      # Estilos (tema pixel/neon + pantalla de autenticación)
├── js/
│   └── app.js          # Lógica: autenticación, CRUD de tareas, validaciones
├── README.md
└── .gitignore
```

## Modelo de datos

Tabla `tasks` en Supabase (PostgreSQL):

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

## Despliegue

- **Frontend:** desplegado automáticamente en [Vercel](https://vercel.com) en cada `push` a la
  rama `main`.
- **Dominio propio:** `cloudtask.website`, con DNS y HTTPS gestionados por
  [Cloudflare](https://cloudflare.com).
- **Backend:** [Supabase](https://supabase.com), plan gratuito.

