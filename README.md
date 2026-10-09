# RestaurantOS

RestaurantOS is a full-stack restaurant management platform designed to bring restaurant operations into one application. It combines a React frontend, an Express API, PostgreSQL persistence, and a FastAPI-based AI service for invoice processing and operational insights.

## Features

- **Dashboard and analytics** — operational summaries, sales and expense insights, and charts.
- **Authentication and permissions** — JWT-based authentication and role/permission middleware on protected API routes.
- **Table management** — manage restaurant tables and their statuses.
- **Order management** — manage orders and order items.
- **Menu management** — manage menu categories and menu items.
- **Inventory management** — track ingredients, stock levels, and stock movements.
- **Supplier management** — maintain supplier records.
- **Purchase orders** — manage purchasing workflows and purchase-order items.
- **Expense management** — track expenses and expense categories.
- **AI invoice processing** — upload invoice documents for OCR/AI extraction, review extracted information, and export expense-register data.
- **AI-powered insights** — provide operational predictions and recommendations through the AI service.
- **Real-time updates** — Socket.IO integration for supported real-time notifications.
- **Audit logging** — record supported API operations through audit middleware.

Feature availability depends on the current implementation and environment configuration. Verify workflows in the running application before treating them as production-ready.

## Technology Stack

| Layer                      | Technologies                                                   |
| -------------------------- | -------------------------------------------------------------- |
| Frontend                   | React 18, Vite, React Router, Axios, Tailwind CSS, Lucide      |
| Backend API                | Node.js, Express                                               |
| Database and ORM           | PostgreSQL, Prisma                                             |
| Authentication             | JSON Web Tokens, bcryptjs                                      |
| AI service                 | Python, FastAPI, configured AI-provider integration            |
| Invoice processing         | OCR utilities, Tesseract-related tooling                       |
| Real-time communication    | Socket.IO                                                      |
| Export                     | XLSX                                                           |
| Testing                    | Jest, Supertest, Vitest and React Testing Library dependencies |
| Development and deployment | npm workspaces, Docker Compose                                 |

## Architecture

```text
                  ┌────────────────────┐
                  │ React + Vite       │
                  │ Frontend           │
                  └─────────┬──────────┘
                            │ HTTP / API
                  ┌─────────▼──────────┐
                  │ Express Backend    │
                  │ Authentication     │
                  │ Business Logic     │
                  └──────┬───────┬─────┘
                         │       │
                ┌────────▼──┐  ┌─▼────────────────┐
                │ PostgreSQL│  │ FastAPI AI Service│
                │ + Prisma  │  │ OCR / AI Insights │
                └───────────┘  └──────────────────┘
```

The backend also supports Socket.IO for real-time functionality. Redis is included in the documented infrastructure configuration; confirm whether it is required by the currently enabled application workflows.

## Project Structure

```text
RestaurantOS/
├── frontend/                  # React + Vite application
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── pages/             # Application pages
│       └── ...
├── backend/                   # Express API
│   ├── src/
│   │   ├── routes/            # API route modules
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Authentication, validation, auditing
│   │   └── utils/             # Shared utilities
│   └── prisma/
│       └── schema.prisma      # Database schema
├── ai-service/                # Python FastAPI service
│   ├── main.py                # Service entry point
│   └── requirements.txt       # Python dependencies
├── docker/                    # Docker-related files
├── scripts/                   # Project scripts
├── docker-compose.yml         # Docker Compose configuration
├── package.json               # Root workspace scripts
└── README.md
```

## Prerequisites

Install the following tools:

- Node.js 20 or later
- npm
- PostgreSQL
- Python compatible with the AI service dependencies
- Tesseract OCR and the required language data, if needed by the configured OCR workflow
- Docker Desktop and Docker Compose, if using containers

## Installation and Setup

### 1. Install dependencies

From the repository root:

```powershell
npm install
```

The root `package.json` defines npm workspaces for `frontend` and `backend`.

### 2. Configure environment variables

Create the necessary local environment files using the examples provided in the repository, if available.

Configure the backend with the appropriate PostgreSQL connection string, JWT secret, and AI service URL. For example:

```env
AI_SERVICE_URL=http://127.0.0.1:8001
```

Use the actual URL and port configured for your local AI service. Configure AI-provider credentials in the AI service's environment as required.

Do not commit secrets or credentials to Git. Never expose backend API keys through frontend environment variables.

### 3. Prepare the database

Create a PostgreSQL database and configure the backend connection string before running Prisma commands.

Validate the Prisma schema and generate the client:

```powershell
npm --workspace=backend run db:generate
```

To apply migrations in a development environment with the database configured:

```powershell
npm --workspace=backend run db:migrate
```

The project also defines a production migration command:

```powershell
npm --workspace=backend run db:migrate:prod
```

Use production migrations only after confirming that the migration files and target database are correct. Do not reset a database containing data you need to keep.

For a database that has already been initialized, inspect its current state before applying additional SQL or migrations.

### 4. Start the application

Start the backend and frontend together from the repository root:

```powershell
npm run dev
```

Alternatively, run them separately in different terminals:

**Backend**

```powershell
npm --workspace=backend run dev
```

**Frontend**

```powershell
npm --workspace=frontend run dev
```

Start the AI service separately using the dependencies and entry point in `ai-service/requirements.txt` and `ai-service/main.py`. A typical command is:

```powershell
cd ai-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Confirm that the AI service starts successfully and that `AI_SERVICE_URL` matches its actual address.

Open the frontend using the local URL printed by Vite, commonly `http://localhost:5173`.

## Docker Setup

The root package defines Docker Compose scripts:

```powershell
npm run docker:up
```

View service logs:

```powershell
npm run docker:logs
```

Stop the services:

```powershell
npm run docker:down
```

The repository also defines database migration and seeding commands. Check the Docker Compose file, environment variables, and database configuration before using them in a fresh environment.

## API Modules

The backend currently contains route modules for the following areas:

| Route module              | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `auth.routes.js`          | Authentication endpoints                  |
| `analytics.routes.js`     | Dashboard and analytics                   |
| `table.routes.js`         | Table management                          |
| `order.routes.js`         | Order management                          |
| `menu.routes.js`          | Menu categories and items                 |
| `inventory.routes.js`     | Ingredient inventory and stock operations |
| `supplier.routes.js`      | Supplier management                       |
| `purchaseOrder.routes.js` | Purchase orders                           |
| `expense.routes.js`       | Expense management                        |
| `ai.routes.js`            | AI-related API operations                 |

The backend also contains an `authRoutes.js` file. Refer to the route registrations in `backend/src/app.js` to determine which routes are mounted and their exact URL prefixes.

Protected endpoints use authentication and, where configured, permission checks. Consult the route definitions for required HTTP methods, request bodies, and permissions.

## Database

The Prisma schema defines models for core restaurant operations, including:

- Users and roles
- Tables
- Menu categories and menu items
- Ingredients and menu-item ingredient relationships
- Suppliers and supplier invoices
- Orders and order items
- Expenses and expense categories
- Stock movements
- Purchase orders and purchase-order items
- Stores
- Audit logs

The database uses PostgreSQL, with Prisma managing application data access.

## Testing and Build

Build the frontend for production:

```powershell
npm --workspace=frontend run build
```

Run the backend syntax check:

```powershell
npm --workspace=backend run build
```

Run tests defined by the workspaces:

```powershell
npm test
```

Run lint scripts where configured:

```powershell
npm run lint
```

A successful build verifies compilation or syntax checks, not every application workflow. Test authentication, database connectivity, invoice processing, and other critical features before deployment.

## Security Considerations

- Keep JWT secrets, database credentials, and AI-provider API keys in environment variables.
- Use HTTPS and production-grade secrets in deployed environments.
- Verify authorization rules for each user role.
- Validate and limit uploaded invoice files.
- Avoid exposing internal errors or sensitive configuration to clients.
- Review audit logging and database permissions before production deployment.

## Known Limitations and Verification

Some requirements may need additional implementation or end-to-end verification before the platform is considered production-ready:

- Full role-by-role authorization and UI access.
- Complete recipe creation and editing workflows.
- Comprehensive automated test coverage across all modules.
- Fresh-environment Docker deployment and database initialization.
- Production deployment configuration and monitoring.

These items should be verified against the running application rather than assumed to be complete.

## Troubleshooting

**Database connection errors**

Check that PostgreSQL is running, the database exists, and the backend connection string is correct.

**Prisma errors**

Validate the schema and regenerate the Prisma Client. Inspect migration state before making database changes.

**AI or invoice-processing errors**

Confirm that the FastAPI service is running, `AI_SERVICE_URL` is correct, required AI credentials are configured, and OCR dependencies and language data are available.

**Frontend API errors**

Check the backend URL, CORS configuration, authentication token, and browser network console.

**Port conflicts**

Check the ports configured by the frontend, backend, AI service, PostgreSQL, and Redis. Update dependent environment variables consistently if a port changes.

## License

Add or confirm the project's intended license before distributing the application.
