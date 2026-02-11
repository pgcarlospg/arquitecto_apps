# GIRA Raw Data → Control Dashboard Architecture

**Architecture Style:** layered
**Version:** 1.0.0

## Components

### Presentation Layer

#### UserController
- **Type:** controller
- **ID:** COMP-001
- **Responsibilities:**
  - Handle HTTP requests for User
- **Handles Entities:** User

#### AccountController
- **Type:** controller
- **ID:** COMP-004
- **Responsibilities:**
  - Handle HTTP requests for Account
- **Handles Entities:** Account

#### ProfileController
- **Type:** controller
- **ID:** COMP-007
- **Responsibilities:**
  - Handle HTTP requests for Profile
- **Handles Entities:** Profile

#### SettingsController
- **Type:** controller
- **ID:** COMP-010
- **Responsibilities:**
  - Handle HTTP requests for Settings
- **Handles Entities:** Settings

#### TaskController
- **Type:** controller
- **ID:** COMP-013
- **Responsibilities:**
  - Handle HTTP requests for Task
- **Handles Entities:** Task

#### ItemController
- **Type:** controller
- **ID:** COMP-016
- **Responsibilities:**
  - Handle HTTP requests for Item
- **Handles Entities:** Item

#### ProjectController
- **Type:** controller
- **ID:** COMP-019
- **Responsibilities:**
  - Handle HTTP requests for Project
- **Handles Entities:** Project

#### AuthMiddleware
- **Type:** middleware
- **ID:** COMP-023
- **Responsibilities:**
  - Authentication
  - Authorization

### Application Layer

#### UserService
- **Type:** service
- **ID:** COMP-002
- **Responsibilities:**
  - Business logic for User
  - Orchestrate User operations
- **Handles Entities:** User

#### AccountService
- **Type:** service
- **ID:** COMP-005
- **Responsibilities:**
  - Business logic for Account
  - Orchestrate Account operations
- **Handles Entities:** Account

#### ProfileService
- **Type:** service
- **ID:** COMP-008
- **Responsibilities:**
  - Business logic for Profile
  - Orchestrate Profile operations
- **Handles Entities:** Profile

#### SettingsService
- **Type:** service
- **ID:** COMP-011
- **Responsibilities:**
  - Business logic for Settings
  - Orchestrate Settings operations
- **Handles Entities:** Settings

#### TaskService
- **Type:** service
- **ID:** COMP-014
- **Responsibilities:**
  - Business logic for Task
  - Orchestrate Task operations
- **Handles Entities:** Task

#### ItemService
- **Type:** service
- **ID:** COMP-017
- **Responsibilities:**
  - Business logic for Item
  - Orchestrate Item operations
- **Handles Entities:** Item

#### ProjectService
- **Type:** service
- **ID:** COMP-020
- **Responsibilities:**
  - Business logic for Project
  - Orchestrate Project operations
- **Handles Entities:** Project

### Infrastructure Layer

#### UserRepository
- **Type:** repository
- **ID:** COMP-003
- **Responsibilities:**
  - Data persistence for User
  - Database queries for User
- **Handles Entities:** User

#### AccountRepository
- **Type:** repository
- **ID:** COMP-006
- **Responsibilities:**
  - Data persistence for Account
  - Database queries for Account
- **Handles Entities:** Account

#### ProfileRepository
- **Type:** repository
- **ID:** COMP-009
- **Responsibilities:**
  - Data persistence for Profile
  - Database queries for Profile
- **Handles Entities:** Profile

#### SettingsRepository
- **Type:** repository
- **ID:** COMP-012
- **Responsibilities:**
  - Data persistence for Settings
  - Database queries for Settings
- **Handles Entities:** Settings

#### TaskRepository
- **Type:** repository
- **ID:** COMP-015
- **Responsibilities:**
  - Data persistence for Task
  - Database queries for Task
- **Handles Entities:** Task

#### ItemRepository
- **Type:** repository
- **ID:** COMP-018
- **Responsibilities:**
  - Data persistence for Item
  - Database queries for Item
- **Handles Entities:** Item

#### ProjectRepository
- **Type:** repository
- **ID:** COMP-021
- **Responsibilities:**
  - Data persistence for Project
  - Database queries for Project
- **Handles Entities:** Project

#### DatabaseClient
- **Type:** gateway
- **ID:** COMP-022
- **Responsibilities:**
  - Database connection management
  - Query execution

## Architecture Decision Records

### ADR-001: Use Layered Architecture

**Status:** accepted
**Date:** 2026-02-11T14:35:34.713Z

#### Context
Need to organize code in a maintainable, testable structure with clear separation of concerns

#### Decision
Adopt a layered architecture with presentation, application, domain, and infrastructure layers

#### Consequences

**Positive:**
- Clear separation of concerns
- Easier to test each layer independently
- Familiar pattern for most developers
- Good for modular monolith starting point

**Negative:**
- Can lead to unnecessary complexity for simple CRUD
- May have performance overhead due to layer traversal

#### Alternatives Considered

**Hexagonal Architecture**
Ports and adapters pattern with domain at the center
*Rejected because: More complex for MVP, better for systems with multiple adapters*

**Microservices**
Split system into independent deployable services
*Rejected because: Too complex for initial version, adds operational overhead*

---

### ADR-002: Use TypeScript with Node.js

**Status:** accepted
**Date:** 2026-02-11T14:35:34.713Z

#### Context
Need type safety and modern language features while maintaining ecosystem compatibility

#### Decision
Use TypeScript with Node.js and Fastify framework

#### Consequences

**Positive:**
- Type safety catches errors at compile time
- Better IDE support and autocomplete
- Large ecosystem of libraries
- Fastify provides excellent performance

**Negative:**
- Build step required
- Learning curve for developers new to TypeScript

#### Alternatives Considered

**Python with FastAPI**
Modern Python async framework with automatic OpenAPI
*Rejected because: Team more familiar with JavaScript ecosystem*

**Go**
Compiled language with excellent performance
*Rejected because: Steeper learning curve, smaller web framework ecosystem*

---

### ADR-003: Use PostgreSQL for Persistence

**Status:** accepted
**Date:** 2026-02-11T14:35:34.713Z

#### Context
Need reliable, ACID-compliant database with good JSON support

#### Decision
Use PostgreSQL as primary database

#### Consequences

**Positive:**
- ACID compliance ensures data integrity
- Excellent JSON/JSONB support for flexible schemas
- Strong community and tooling
- Good performance for most workloads

**Negative:**
- Requires more setup than simpler databases
- Vertical scaling limits for very high scale

#### Alternatives Considered

**MongoDB**
Document database with flexible schemas
*Rejected because: Less appropriate for relational data, eventual consistency model*

**MySQL**
Popular relational database
*Rejected because: PostgreSQL has better JSON support and modern features*

---

