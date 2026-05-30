# RoadWatch Backend Installation Guide

This guide provides step-by-step instructions for installing, configuring, and running the complete RoadWatch backend ecosystem.

The backend is built as a NestJS monorepo consisting of 8 independent microservices and utilizes Docker for essential infrastructure services.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- **Docker** and **Docker Compose**
- **Git**

## 1. Clone the Repository
If you haven't already, clone the workspace to your local machine and navigate to the backend directory:
```bash
cd e:\roadwatch\road_backend
```

## 2. Install Dependencies
Install all the required Node.js dependencies for the NestJS monorepo:
```bash
npm install
```   
Chnagee

## 3. Set Up Infrastructure (Docker)
The backend relies on several databases and message brokers. These are configured in the `docker-compose.yml` file.

The infrastructure includes:
- **PostgreSQL 15** (Primary Database)
- **Redis 7** (Caching & Session Management)
- **Apache Kafka & Zookeeper** (Event streaming and inter-service communication)
- **Elasticsearch 8.13** (Search Engine)

To start the infrastructure, run:
```bash
docker-compose up -d
```
*Wait a few minutes for all containers (especially Kafka and Elasticsearch) to fully initialize.*

## 4. Environment Variables
Ensure that your `.env` file is properly configured. A sample configuration might look like this (adjust based on your specific `.env` file contents):

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=roadwatch
DATABASE_PASSWORD=password123
DATABASE_NAME=roadwatch_db

REDIS_HOST=localhost
REDIS_PORT=6379

KAFKA_BROKER=localhost:9092

ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_PASSWORD=Admin@12345
```

## 5. Running the Microservices

The RoadWatch backend consists of the following 8 microservices:
1. `road-service` (Port: 3001)
2. `budget-service` (Port: 3002)
3. `complaint-service` (Port: 3003)
4. `document-service` (Port: 3004)
5. `search-service` (Port: 3005)
6. `ai-gateway-service` (Port: 3006)
7. `auth-service` (Port: 3007)
8. `notification-service` (Port: 3008)

### Option A: Run All Services Simultaneously (Windows)
A batch script is provided to start all services in separate terminal windows.
Double-click the `run_all_services.bat` file, or run it from the command line:
```cmd
.\run_all_services.bat
```

### Option B: Run Services Individually
If you need to run or debug a specific service, you can use the Nest CLI:
```bash
npx nest start road-service --watch
npx nest start auth-service --watch
# ... (replace with the name of the service)
```

## 6. Testing the API
Once the services are running, you can interact with them. A Postman collection is included in the root of the backend directory (`RoadWatch.postman_collection.json`). 

1. Open Postman.
2. Click **Import** and select the `RoadWatch.postman_collection.json` file.
3. You can now execute API calls against `http://localhost:<port>/api/v1/...` as defined in the collection.

## Troubleshooting

- **Database Connection Issues:** Ensure Docker Desktop is running and the `roadwatch_postgres` container is healthy.
- **Elasticsearch Errors:** Elasticsearch requires sufficient memory allocation. Ensure Docker has at least 4GB of RAM allocated.
- **Port Conflicts:** If a service fails to start, ensure no other local applications are occupying ports `3001` through `3008`, or ports `5432`, `6379`, `9092`, `2181`, `9200`.
