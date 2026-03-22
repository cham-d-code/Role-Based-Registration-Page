# Database Normalization in Temporary Staff Coordination System

This document explains how **First Normal Form (1NF)**, **Second Normal Form (2NF)**, and **Third Normal Form (3NF)** have been applied in the implementation plan for your database schema.

---

## Overview of Normalization

**Database normalization** is the process of organizing data to:
- Eliminate redundancy
- Ensure data dependencies make sense
- Improve data integrity
- Make the database easier to maintain

---

## 1️⃣ First Normal Form (1NF)

### Definition
A table is in **1NF** if:
1. All columns contain **atomic (indivisible) values**
2. Each column contains values of a **single type**
3. Each column has a **unique name**
4. The order of rows doesn't matter

### How 1NF is Applied in Your Schema

#### ✅ Example 1: `users` Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    role user_role NOT NULL,
    department VARCHAR(255),
    status user_status DEFAULT 'pending',
    ...
);
```

**1NF Compliance:**
- ✅ Each field contains **atomic values** (email is a single email, not a list)
- ✅ No repeating groups (no `email1`, `email2`, `email3`)
- ✅ Each column has a unique name
- ✅ Primary key (`id`) uniquely identifies each row

#### ✅ Example 2: `candidates` Table

```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    marks_part1 INT,
    marks_part2 INT,
    marks_part3 INT,
    total_marks INT,
    is_shortlisted BOOLEAN DEFAULT FALSE
);
```

**1NF Compliance:**
- ✅ Each mark is stored in a **separate column** (atomic)
- ✅ No multi-valued attributes (marks aren't stored as "80,90,85")
- ✅ Each row represents one candidate

#### ❌ What Would Violate 1NF?

**Bad Example (NOT in 1NF):**
```sql
-- WRONG: Multi-valued attribute
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    subjects VARCHAR(500)  -- "Math, Physics, Chemistry" ❌
);
```

**Your Solution (1NF Compliant):**
```sql
-- Separate table for many-to-many relationship
CREATE TABLE user_subjects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    module_id UUID REFERENCES modules(id),
    is_preferred BOOLEAN DEFAULT FALSE
);
```

---

## 2️⃣ Second Normal Form (2NF)

### Definition
A table is in **2NF** if:
1. It is in **1NF**
2. All non-key attributes are **fully dependent** on the **entire primary key** (no partial dependencies)

> **Note:** This mainly applies to tables with **composite primary keys**

### How 2NF is Applied in Your Schema

#### ✅ Example 1: `user_subjects` Table

```sql
CREATE TABLE user_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    module_id UUID NOT NULL REFERENCES modules(id),
    is_preferred BOOLEAN DEFAULT FALSE,
    assigned_date DATE,
    UNIQUE(user_id, module_id)
);
```

**2NF Analysis:**
- **Primary Key:** `id` (surrogate key)
- **Unique Constraint:** `(user_id, module_id)` ensures no duplicate assignments
- **Non-key attributes:** `is_preferred`, `assigned_date`
- ✅ All attributes depend on the **full primary key** (`id`)
- ✅ No partial dependencies

#### ✅ Example 2: `leave_requests` Table

```sql
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    leave_type VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    ...
);
```

**2NF Compliance:**
- ✅ Single-column primary key (`id`)
- ✅ All attributes (`leave_type`, `start_date`, `reason`, etc.) depend on the **entire key**

#### ❌ What Would Violate 2NF?

**Bad Example (NOT in 2NF):**
```sql
-- Composite key with partial dependency
CREATE TABLE enrollment (
    student_id INT,
    course_id INT,
    student_name VARCHAR(255),  -- ❌ Depends only on student_id
    course_name VARCHAR(255),   -- ❌ Depends only on course_id
    grade CHAR(1),
    PRIMARY KEY (student_id, course_id)
);
```

**Problem:** `student_name` depends only on `student_id`, not the full key.

**Your Solution (2NF Compliant):**
```sql
-- Separate tables
CREATE TABLE users (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255)  -- ✅ Depends on user id
);

CREATE TABLE modules (
    id UUID PRIMARY KEY,
    name VARCHAR(255)  -- ✅ Depends on module id
);

CREATE TABLE user_subjects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    module_id UUID REFERENCES modules(id),
    is_preferred BOOLEAN  -- ✅ Depends on the relationship
);
```

---

## 3️⃣ Third Normal Form (3NF)

### Definition
A table is in **3NF** if:
1. It is in **2NF**
2. No **transitive dependencies** exist (non-key attributes don't depend on other non-key attributes)

### How 3NF is Applied in Your Schema

#### ✅ Example 1: `users` and `modules` Separation

**Original Design (Violates 3NF):**
```sql
-- BAD: Module info repeated for each user
CREATE TABLE user_assignments (
    id UUID PRIMARY KEY,
    user_id UUID,
    module_code VARCHAR(20),
    module_name VARCHAR(255),  -- ❌ Depends on module_code, not id
    module_credits INT         -- ❌ Depends on module_code, not id
);
```

**Problem:** `module_name` and `module_credits` depend on `module_code`, creating a transitive dependency.

**Your Solution (3NF Compliant):**
```sql
-- Separate modules into their own table
CREATE TABLE modules (
    id UUID PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    credits INT DEFAULT 3,
    department VARCHAR(255)
);

CREATE TABLE user_subjects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    module_id UUID REFERENCES modules(id),  -- ✅ Reference only
    is_preferred BOOLEAN
);
```

✅ **Benefits:**
- Module details stored **once** in `modules` table
- No redundancy
- Easy to update module information

#### ✅ Example 2: `interviews` and `candidates` Separation

```sql
-- Interviews table
CREATE TABLE interviews (
    id UUID PRIMARY KEY,
    interview_number VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status interview_status DEFAULT 'upcoming'
);

-- Candidates table references interview
CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    marks_part1 INT,
    marks_part2 INT,
    marks_part3 INT
);
```

**3NF Compliance:**
- ✅ Interview details are **not repeated** for each candidate
- ✅ Candidate attributes depend only on `candidate.id`
- ✅ Interview attributes depend only on `interview.id`

#### ✅ Example 3: `password_reset_tokens` Table

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**3NF Analysis:**
- ✅ All attributes (`token`, `expires_at`, `used_at`) depend **directly** on the token `id`
- ✅ No transitive dependencies
- ✅ User details are stored in `users` table, not repeated here

#### ❌ What Would Violate 3NF?

**Bad Example (NOT in 3NF):**
```sql
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY,
    user_id UUID,
    user_name VARCHAR(255),        -- ❌ Depends on user_id
    user_department VARCHAR(255),  -- ❌ Depends on user_id
    leave_type VARCHAR(255),
    start_date DATE
);
```

**Problem:** `user_name` and `user_department` depend on `user_id`, not directly on `leave_request.id`.

**Your Solution (3NF Compliant):**
```sql
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),  -- ✅ Foreign key only
    leave_type VARCHAR(255),
    start_date DATE,
    ...
);

-- User details stored separately
CREATE TABLE users (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255),
    department VARCHAR(255)
);
```

---

## Summary: Normalization in Your Schema

| Normal Form | Key Principle | How It's Applied |
|-------------|---------------|------------------|
| **1NF** | Atomic values, no repeating groups | ✅ Each field contains single values; subjects stored in separate `user_subjects` table |
| **2NF** | No partial dependencies | ✅ All attributes depend on entire primary key; surrogate keys (`UUID`) used throughout |
| **3NF** | No transitive dependencies | ✅ Module details in `modules` table; user details in `users` table; interview details in `interviews` table |

---

## Key Design Decisions

### 1. **Surrogate Keys (UUID)**
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```
- ✅ Simplifies 2NF compliance (single-column primary keys)
- ✅ Globally unique identifiers
- ✅ Better for distributed systems

### 2. **Junction Tables for Many-to-Many**
```sql
CREATE TABLE user_subjects (
    user_id UUID REFERENCES users(id),
    module_id UUID REFERENCES modules(id)
);
```
- ✅ Maintains 1NF (no multi-valued attributes)
- ✅ Allows flexible relationships

### 3. **Foreign Keys for Referential Integrity**
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```
- ✅ Enforces 3NF (no data duplication)
- ✅ Maintains data consistency

### 4. **Separate Tables for Entities**
- `users` - User information
- `modules` - Module catalog
- `interviews` - Interview sessions
- `candidates` - Interview participants
- `leave_requests` - Leave applications

✅ Each entity has its own table, eliminating redundancy and transitive dependencies.

---

## Conclusion

Your database schema is **fully normalized to 3NF**, which means:
- ✅ **No redundant data** - Each fact is stored once
- ✅ **Data integrity** - Updates happen in one place
- ✅ **Flexible queries** - Easy to join related data
- ✅ **Maintainable** - Changes to one entity don't affect others

This design follows best practices for relational database design and will scale well as your application grows.
