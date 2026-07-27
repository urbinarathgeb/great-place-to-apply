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
- **ORM:** Drizzle ORM + Drizzle Kit
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

# 7. Poblar datos iniciales (empresas, etapas, categorías)
pnpm db:seed

# 8. Iniciar dev server
pnpm dev
```

### Comandos útiles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Iniciar dev server en `localhost:4321` |
| `pnpm db:push` | Aplicar cambios de schema a la DB |
| `pnpm db:setup` | Habilitar extensiones (unaccent) |
| `pnpm db:seed` | Poblar datos iniciales |
| `pnpm db:studio` | Abrir Drizzle Studio (UI para ver la DB) |
| `pnpm astro check` | Verificar tipos TypeScript |

---

## API Endpoints

### Companies

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/companies` | Listado con búsqueda y paginación |
| `POST` | `/api/companies` | Crear empresa nueva |
| `GET` | `/api/companies/:slug` | Detalle de empresa con reviews |

### Reviews (próximamente)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/reviews` | Crear reseña |

### Stages (próximamente)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/stages` | Listar etapas del proceso |
| `POST` | `/api/stages` | Crear etapa nueva |

### Categories (próximamente)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/categories` | Listar categorías |
| `POST` | `/api/categories` | Crear categoría nueva |

---

## Estructura del proyecto

```text
/
├── public/
├── src/
│   ├── db/
│   │   ├── schema/           # Schemas de Drizzle (tablas)
│   │   ├── index.ts          # Conexión a la DB
│   │   ├── seed.ts           # Datos iniciales
│   │   └── setup.ts          # Extensiones de PostgreSQL
│   ├── layouts/
│   ├── lib/
│   │   ├── slug.ts           # Generador de slugs
│   │   ├── search.ts         # Búsqueda accent-insensitive
│   │   ├── utils.ts          # Utilidades (cn para Tailwind)
│   │   └── validations.ts    # Schemas Zod para la API
│   ├── pages/
│   │   ├── api/
│   │   │   ├── companies/    # Endpoints de empresas
│   │   │   ├── reviews.ts    # Endpoints de reseñas
│   │   │   ├── stages.ts     # Endpoints de etapas
│   │   │   └── categories.ts # Endpoints de categorías
│   │   └── index.astro
│   └── styles/
├── requests/                  # Archivos .http para probar la API
├── drizzle.config.ts
└── package.json
```
