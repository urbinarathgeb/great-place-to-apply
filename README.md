# Great Place To Apply (GPTA)

### ¿Qué es?

**Great Place To Apply** es una plataforma de transparencia laboral orientada a mejorar la experiencia de los candidatos durante los procesos de selección. Es un directorio donde los profesionales pueden compartir de forma anónima sus experiencias reales, permitiendo a la comunidad identificar empresas con procesos de contratación éticos y eficientes.

### ¿De qué trata?

El proyecto surge como respuesta al creciente problema del _ghosting_ laboral y la falta de feedback en los procesos de selección. La plataforma centraliza datos sobre la **velocidad de respuesta**, la **calidad del feedback** y la **transparencia** de los procesos, convirtiendo anécdotas aisladas en datos cuantificables para ayudar a otros candidatos a tomar mejores decisiones.

### ¿Para qué sirve?

**Para los candidatos:** Sirve como un radar de confianza. Antes de aplicar a una empresa, el usuario puede consultar su "Índice de Calidad de Postulación" basado en la experiencia de otros.

**Para el ecosistema:** Obliga a las empresas a ser conscientes de su "marca empleadora" (employer branding), fomentando procesos más humanos y comunicativos.

---

## Stack

- **Frontend:** Astro 7 + Vue 3 + Tailwind CSS 4
- **Backend:** Astro API Routes (SSR)
- **DB:** PostgreSQL (Supabase como host)
- **ORM:** Drizzle ORM + Drizzle Kit (postgres.js driver)
- **Validación:** Zod v4
- **Componentes:** shadcn-vue
- **Deploy:** Vercel

---

## Desarrollo

### Requisitos

- Node.js >= 22.12.0
- PostgreSQL local corriendo en `localhost:5432`
- Base de datos `gpta` creada

### Setup inicial

```bash
# 1. Clonar el repo
git clone <url-del-repo>
cd great-place-to-apply

# 2. Instalar dependencias
pnpm install

# 3. Crear la DB (si no existe)
psql -U postgres -c "CREATE DATABASE gpta;"

# 4. Configurar variables de entorno
cp .env.example .env.development
# Editar .env.development con tu URL de DB

# 5. Aplicar esquema de tablas
pnpm db:push

# 6. Habilitar extensiones de PostgreSQL
pnpm db:setup

# 7. Poblar datos iniciales (empresas, etapas, categorías, reviews demo)
pnpm db:seed

# 8. Iniciar dev server
pnpm dev
```

### Comandos útiles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Iniciar dev server en `localhost:4321` |
| `pnpm db:push` | Aplicar cambios de schema a la DB directo |
| `pnpm db:setup` | Habilitar extensiones (unaccent) |
| `pnpm db:seed` | Poblar datos iniciales |
| `pnpm db:studio` | Abrir Drizzle Studio (UI para explorar la DB) |
| `pnpm astro check` | Verificar tipos TypeScript |

---

## API REST

> Las rutas `/api/*` fueron creadas como herramienta de desarrollo y testing.
> Permiten probar la lógica de negocio con `curl` o los archivos `requests/*.http`
> sin renderizar HTML. **No están diseñadas para consumo externo** (no hay
> autenticación, rate limiting, ni documentación OpenAPI).
>
> Las páginas SSR (`/`, `/companies`, `/reviews`, etc.) consumen la base de
> datos directamente a través de Drizzle, no llaman a la API.

### Companies

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/companies` | Listado con búsqueda (`?q=`), filtro por categoría (`?category=`) y paginación |
| `POST` | `/api/companies` | Crear empresa nueva |
| `GET` | `/api/companies/:slug` | Detalle de empresa con reviews, promedios por aspecto y distribución de etapas |

### Reviews

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/reviews` | Listado con búsqueda por empresa (`?q=`) y paginación |
| `GET` | `/api/reviews/:id` | Detalle de review con todos sus stages, comentarios y ratings |
| `POST` | `/api/reviews` | Crear review con stage_reviews anidados (transacción atómica) |

### Stages

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/stages` | Listar etapas del proceso (búsqueda con `?q=`) |
| `POST` | `/api/stages` | Crear etapa nueva |

### Categories

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/categories` | Listar categorías de empresas (búsqueda con `?q=`) |
| `POST` | `/api/categories` | Crear categoría nueva |

---

## Base de datos

El esquema actual tiene 6 tablas:

| Tabla | Descripción |
|---|---|
| `categories` | Categorías de empresas (Minería, Banca, Retail, etc.) |
| `companies` | Empresas con slug, logoUrl y FK a categories |
| `process_stages` | Etapas del proceso de selección (Postulación, Entrevista, etc.) |
| `reviews` | Contenedor de una reseña anónima (companyId, ipHash, comment, createdAt) |
| `stage_reviews` | Comentario + FK a review y process_stage (una review tiene N stage_reviews) |
| `aspect_rating` | Ratings por aspecto (rapidez, feedback, trato, transparencia) vinculados a un stage_review |

### Estructura

```text
/
├── public/
├── src/
│   ├── db/
│   │   ├── schema/
│   │   │   ├── categories.schema.ts
│   │   │   ├── companies.schema.ts
│   │   │   ├── process-stages.schema.ts
│   │   │   ├── reviews.schema.ts
│   │   │   ├── stage-reviews.schema.ts
│   │   │   └── aspect-rating.schema.ts
│   │   ├── index.ts          # Conexión a la DB (postgres.js + Drizzle)
│   │   ├── seed.ts           # Datos iniciales
│   │   └── setup.ts          # Extensiones de PostgreSQL
│   ├── lib/
│   │   ├── slug.ts           # Generación de slugs URL-safe
│   │   ├── search.ts         # Búsqueda accent-insensitive (unaccent)
│   │   ├── utils.ts          # Utilidades (cn para Tailwind)
│   │   └── validations.ts    # Schemas Zod para la API
│   ├── pages/
│   │   ├── api/
│   │   │   ├── companies/
│   │   │   │   ├── index.ts
│   │   │   │   └── [slug].ts
│   │   │   ├── reviews/
│   │   │   │   ├── index.ts
│   │   │   │   └── [id].ts
│   │   │   ├── stages/
│   │   │   │   └── index.ts
│   │   │   └── categories/
│   │   │       └── index.ts
│   │   ├── companies/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── reviews/
│   │   │   └── [id].astro
│   │   └── index.astro
│   └── styles/
├── requests/                  # Archivos .http para probar la API
├── drizzle.config.ts
├── astro.config.mjs
├── tsconfig.json
└── package.json
```
