# COREWATCH — Real-Time Transaction Risk Engine & Monitoring Dashboard

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2D8?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

**COREWATCH** es una plataforma integral de detección de fraude financiero y auditoría en tiempo real pensada para entornos de operaciones de seguridad (SOC) y pasarelas de pago. El sistema procesa transacciones financieras, evalúa reglas de riesgo heurísticas y temporales en memoria y emite eventos en tiempo real hacia una interfaz reactiva mediante **Server-Sent Events (SSE)**.

---

## Indice

- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Reglas del Motor de Fraude](#-reglas-del-motor-de-fraude-risk-engine)
- [Stack Tecnologico](#-stack-tecnologico)
- [Estructura del Repositorio](#-estructura-del-repositorio)
- [Puesta en Marcha (Quickstart)](#-puesta-en-marcha-quickstart)
- [Verificacion y Pruebas en Vivo (curl)](#-verificacion-y-pruebas-en-vivo-curl)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Licencia](#-licencia)

---

## 🏛️ Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada basada en streaming reactivo unidireccional:

```text
[ Cliente / Pasarela Externa ]
             │
             │ HTTP POST /api/v1/transactions
             ▼
┌────────────────────────────────────────────────────────┐
│               Spring Boot 4.1.1 Backend                │
│                                                        │
│  1. Ingestion DTO & Validacion de Payload              │
│  2. TransactionService (Reglas de Fraude & Velocidad)  │
│  3. Persistencia Transaccional (Spring Data JPA)       │
│  4. TransactionNotificationService (SseEmitter pool)   │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
             │ SQL Write                   │ Server-Sent Events (SSE)
             ▼                             ▼
┌───────────────────────────┐    ┌───────────────────────────────────┐
│       PostgreSQL 16       │    │       React 18 Dashboard          │
│   (Contenedor Docker)     │    │   (Vite + Tailwind CSS + Lucide)  │
│                           │    │                                   │
│ Tablas transaccionales    │    │ - Cuadro de mando de KPIs         │
│ e indices temporales      │    │ - Feed en directo con auto-scroll │
│                           │    │ - Filtros de estado reactivos     │
│                           │    │ - Modal de auditoria tecnica      │
└───────────────────────────┘    └───────────────────────────────────┘
```

---

## ⚡ Reglas del Motor de Fraude (*Risk Engine*)

Cada transferencia que ingresa por el endpoint transaccional es evaluada de manera determinista antes de su almacenamiento y difusion:

| Regla | Condicion | Accion | Risk Score | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Control de Velocidad (Velocity Burst)** | $\ge 2$ transferencias previas de la misma cuenta en los ultimos 60s | Bloqueo por ráfaga anómala de actividad repetida | **95** | `FLAGGED` |
| **Umbral Económico Nominal** | Importe de la transacción $> 10.000,00$ EUR | Detección de volumen fuera de límites comerciales estándar | **85** | `FLAGGED` |
| **Flujo Nominal** | Frecuencia estándar e importe $\le 10.000,00$ EUR | Operación validada y aprobada | **10** | `APPROVED` |

---

## 🛠️ Stack Tecnologico

### Backend
* **Lenguaje:** Java 21 (LTS).
* **Framework:** Spring Boot 4.1.1 (Spring Web, Spring Data JPA, Validation).
* **Streaming Reactivo:** `SseEmitter` gestionado mediante colecciones seguras para subprocesos (`CopyOnWriteArrayList`).
* **ORM & Persistencia:** Hibernate 7 / Spring Data JPA sobre PostgreSQL dialect.
* **Productividad:** Lombok (Patron Builder, Inyección de Dependencias `@RequiredArgsConstructor`).

### Frontend
* **Entorno:** React 18 sobre Vite 5.
* **Estilos:** Tailwind CSS (tema dark adaptado a consolas analíticas).
* **Iconografía:** Lucide React (`ShieldCheck`, `ShieldAlert`, `Activity`, `TrendingUp`, `DollarSign`).
* **Conectividad:** Consumo de eventos a través de la API nativa del navegador `EventSource` con soporte de reconexión automática y sincronización inicial vía REST.

### Infraestructura
* **Bases de Datos:** PostgreSQL 16 alojado en un contenedor Docker aislado mediante Docker Compose.

---

## 📂 Estructura del Repositorio

```text
COREWATCH-monitor/
├── docker-compose.yml              # Definicion de servicio PostgreSQL
├── README.md                       # Documentacion central del proyecto
├── backend/
│   ├── pom.xml                     # Dependencias Maven (Java 21, Spring Boot 4)
│   └── src/main/java/com/corewatch/backend/
│       ├── controller/             # Controladores REST y emisores SSE
│       ├── dto/                    # DTOs de transferencia y validacion
│       ├── model/                  # Entidades JPA (Transaction, TransactionStatus)
│       ├── repository/             # Metodos derivados de Spring Data JPA
│       └── service/                # Logica del motor de fraude y broadcast SSE
└── frontend/
    ├── package.json                # Dependencias NPM (React, Vite, Lucide, Tailwind)
    ├── vite.config.js              # Configuracion de Vite
    ├── tailwind.config.js          # Tokens de diseño y colores
    └── src/
        ├── App.jsx                 # Dashboard, KPIs en tiempo real y modal
        ├── main.jsx                # Bootstrap de la aplicacion React
        └── index.css               # Directivas globales de Tailwind CSS
```

---

## 🚀 Puesta en Marcha (Quickstart)

### Requisitos del Sistema
* **Java Development Kit (JDK):** Versión 21 o superior.
* **Node.js:** Versión 18 o superior y gestor de paquetes `npm`.
* **Docker Engine & Docker Compose:** Instalados y en ejecución.

---

### Paso 1: Iniciar PostgreSQL con Docker
Desde la raíz del repositorio:
```bash
docker compose up -d
```
Verifica que el contenedor `postgres:16` esté levantado y escuchando en el puerto estándar `5432`.

### Paso 2: Ejecutar el Servidor Spring Boot
Accede al directorio del backend y ejecuta el wrapper de Maven:
```bash
cd backend
./mvnw spring-boot:run
```
El servidor arrancará en `http://localhost:8080`.

### Paso 3: Ejecutar la Interfaz Web
Abre una nueva terminal, entra en la carpeta del frontend e inicia el servidor de desarrollo Vite:
```bash
cd frontend
npm run dev
```
Abre en tu navegador la dirección provista por Vite:
```text
http://localhost:5173
```
Comprueba que el indicador superior derecho muestre el badge **STREAM CONNECTED** en verde.

---

## 🧪 Verificacion y Pruebas en Vivo (curl)

Abre el dashboard en el navegador y ejecuta los siguientes comandos desde una consola auxiliar para observar la actualización reactiva del panel de KPIs y la tabla sin recargar la página.

### Caso A: Operacion Nominal Aprobada
Importe por debajo de 10.000 €:
```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccount": "ES11223344",
    "destinationAccount": "ES99887766",
    "amount": 2800.00,
    "currency": "EUR"
  }'
```
*Comportamiento:* Inserta una fila con Risk Score **10**, estado verde `APPROVED`, suma 2.800 € al volumen total monitorizado y ajusta la tasa global de fraude.

### Caso B: Deteccion por Umbral Financiero
Importe superior a 10.000 €:
```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccount": "ES44556677",
    "destinationAccount": "ES88776655",
    "amount": 18500.00,
    "currency": "EUR"
  }'
```
*Comportamiento:* Inserta una fila con Risk Score **85**, badge de advertencia `FLAGGED`, incrementa el contador de **Alertas Activas** y actualiza los indicadores visuales.

### Caso C: Deteccion por Regla de Velocidad (Burst Check)
Ejecuta la misma petición 3 veces sucesivas en menos de 60 segundos desde una misma cuenta emisora:
```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccount": "ES99990000",
    "destinationAccount": "ES11112222",
    "amount": 120.00,
    "currency": "EUR"
  }'
```
*Comportamiento:* Las primeras dos solicitudes se registrarán con estado `APPROVED` (Score 10). La tercera solicitud disparará automáticamente la regla de velocidad, asignando un Risk Score **95** con estado `FLAGGED` a pesar del importe reducido.

---

## 📡 Endpoints de la API

| Metodo | Ruta | Descripcion | Tipo de Retorno |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/transactions` | Ingiere una nueva transacción, evalúa riesgo y emite el evento | `Transaction` (JSON) |
| `GET` | `/api/v1/transactions` | Obtiene el historial persistido completo | `List<Transaction>` (JSON) |
| `GET` | `/api/v1/transactions/stream` | Suscribe a los clientes al flujo reactivo unidireccional | `text/event-stream` (SSE) |

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para obtener más información.