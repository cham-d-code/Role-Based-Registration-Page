# Temporary Staff Coordination System - Spring Boot Backend

Java Spring Boot backend for the Temporary Staff Coordination System.

## Prerequisites

- **Java 17** (OpenJDK)
- **Maven 3.9+** (Included via wrapper)
- **PostgreSQL 12+**

## Database Setup

1. **Create the database:**
```sql
CREATE DATABASE temp_staff_db;
```

2. **Apply the schema:**
```bash
psql -U postgres -d temp_staff_db -f ../backend/database/schema.sql
```

3. **Update database password:**

Edit `src/main/resources/application.properties`:
```properties
spring.datasource.password=YOUR_PASSWORD_HERE
```

## Running the Application

### Option 1: Using Bundled Maven (Recommended)
```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot"
.\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

### Option 2: Using Maven Wrapper
```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot"
.\mvnw.cmd spring-boot:run
```

The server will start on **http://localhost:8080**

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Health Check
- `GET /api/health` - Server health status

## Testing

### Health Check
```powershell
curl http://localhost:8080/api/health -UseBasicParsing
```

### Register User
```powershell
$body = @{
    email = "test@kln.ac.lk"
    password = "Test123!@#"
    fullName = "Test User"
    mobile = "1234567890"
    role = "staff"
} | ConvertTo-Json

curl -X POST http://localhost:8080/api/auth/register `
  -H "Content-Type: application/json" `
  -Body $body `
  -UseBasicParsing
```

## Tech Stack

- **Spring Boot 3.2.0**
- **Spring Security** with JWT authentication
- **Spring Data JPA** with Hibernate
- **PostgreSQL** database
- **BCrypt** password hashing
- **Maven** build tool

## Project Structure

```
src/main/java/com/tempstaff/
├── TempStaffApplication.java   # Main application
├── config/
│   ├── SecurityConfig.java     # Security & JWT configuration
│   └── CorsConfig.java          # CORS settings
├── controller/
│   ├── AuthController.java     # Authentication endpoints
│   └── HealthController.java   # Health check
├── dto/
│   ├── request/                # Request DTOs
│   └── response/               # Response DTOs
├── entity/
│   ├── User.java               # User entity
│   ├── PasswordResetToken.java
│   ├── Module.java
│   └── UserSubject.java
├── repository/
│   ├── UserRepository.java     # Spring Data JPA repositories
│   └── ...
├── security/
│   ├── JwtTokenProvider.java   # JWT token generation/validation
│   ├── JwtAuthenticationFilter.java
│   └── UserDetailsServiceImpl.java
├── service/
│   └── AuthService.java        # Business logic
└── exception/
    └── GlobalExceptionHandler.java
```

## Troubleshooting

### Port 8080 Already in Use
```powershell
# Find and kill process using port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Database Connection Error
- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check database exists: `psql -U postgres -l`
- Verify credentials in `application.properties`

### Compilation Errors
```powershell
# Clean and recompile
.\apache-maven-3.9.6\bin\mvn.cmd clean compile
```

## Environment Configuration

Default configuration in `src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/temp_staff_db
spring.datasource.username=postgres
spring.datasource.password=your_password_here

# JWT
jwt.secret=your_secret_key_min_256_bits
jwt.expiration=604800000  # 7 days
```
