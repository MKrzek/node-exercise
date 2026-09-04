# 1. Remove old container

docker rm -f redis

# 2. Start fresh Redis container

docker run -d -p 6379:6379 --name redis redis:latest

# 3. Test connection (choose one)

redis-cli ping # if you installed redis-cli
docker exec -it redis redis-cli ping # if testing inside container

docker stop redis
docker start redis

Your Mac (localhost:6379)
↓
Docker Desktop (port forwarding)
↓
Redis container (port 6379)

**Verify it's running**

# Check container status

docker ps

# Test connection

docker exec -it redis redis-cli ping

# Returns: PONG

**USEFUL COMMANDS**

# Stop the container

docker stop redis

# Start it again

docker start redis

# Remove it completely

docker rm -f redis

# View logs

docker logs redis

**TO START PRISMA CONTAINER**
docker run -d \
 --name postgres \
 -e POSTGRES_USER=postgres \
 -e POSTGRES_PASSWORD=postgres \
 -e POSTGRES_DB=learning_tracker \
 -p 5432:5432 \
 postgres:15

then run migrations:

npx prisma migrate dev
npx prisma generate

**TO STOP AND REMOVE ALL DOCKER CONTAINERS**

# Stop all running containers

docker stop $(docker ps -q)

# Remove all containers (running and stopped)

docker rm $(docker ps -a -q)

# Verify it worked

docker ps -a

**If you want to start fresh After removing all containers, you can restart just what you need:**

# Redis

docker run -d -p 6379:6379 --name redis redis:latest

# PostgreSQL

docker run -d \
 --name postgres \
 -e POSTGRES_USER=postgres \
 -e POSTGRES_PASSWORD=postgres \
 -e POSTGRES_DB=learning_tracker \
 -p 5432:5432 \
 postgres:15

**TO USE DOCKER COMPOSE**

# From project root run the following to START the app

**docker compose up --build**

explicitly delete it

docker compose down -v.

Volumes = Shared folders between your Mac and the container.

**You have SEPARATE containers for each service:**
services:
postgres-monolith: # ← Container 1: Database
postgres-notifications: # ← Container 2: Database
redis: # ← Container 3: Redis
monolith: # ← Container 4: Your Express app
notification-service: # ← Container 5: Notification app

Each service = One container.
What happens if you delete containers?
Without volumes:

App container deleted → Code is safe (it's on your Mac, mounted via volumes)

Database container deleted → Data is LOST ❌

Redis container deleted → Data is LOST ❌

With volumes (your setup):
volumes:
postgres-monolith-data:
postgres-notifications-data:
redis-data:
Database container deleted → Data is SAFE ✅ (stored in Docker volume on your Mac)

Redis container deleted → Data is SAFE ✅ (stored in Docker volume on your Mac)

App container deleted → Code is SAFE ✅ (it's on your Mac, mounted via volumes)

**The container is NOT the storage!**
Think of it like this:

**Container = A temporary worker**
**Volume = A filing cabinet on your Mac**

Without volumes:
Container (DB) ──writes data──> Container's internal storage
(inside container)

You delete container → Container + its storage = GONE ❌

With volumes (your setup):
postgres-monolith:
volumes: - postgres-monolith-data:/var/lib/postgresql/data

Container (DB) ──writes data──> Volume (on your Mac)
(stored OUTSIDE container)

You delete container → Container = GONE, but Volume = STILL THERE ✅

Start new container, attach same volume → All data is back!

**Visual analogy:**
**Without volumes:**
Container = A tent
Data = Written on the tent walls

Delete tent → Tent + data = GONE

**With volumes:**
Container = A tent
Volume = A filing cabinet next to the tent
Data = Written on files in the cabinet

Delete tent → Tent = GONE, Cabinet = STILL THERE
New tent uses same cabinet → All data is back

volumes:
postgres-monolith-data: # ← This is on your Mac (managed by Docker)

The database thinks it's writing to /var/lib/postgresql/data inside the container, but Docker redirects that to the postgres-monolith-data volume on your Mac.

When you delete the container, the volume stays on your Mac until you explicitly delete it with docker compose down -v.

Volumes are separate storage on your Mac, not inside the container. Deleting the container doesn't delete the volume

**VOLUMES**

1.  List all volumes:
    docker volume ls

This shows all volumes on your system.

2. List only "dangling" (unused) volumes:
   docker volume ls --filter dangling=true
   Dangling = volumes not attached to any container (truly "hanging around").

3. See which volumes your Compose project is using:
   docker volume ls --filter "label=com.docker.compose.project=express-learning-tracker"
   This shows only volumes created by your docker-compose.yml.

4. Inspect a specific volume (to see what it contains):
   docker volume inspect express-learning-tracker_postgres-monolith-data

5. Remove all dangling volumes (safe - only unused ones):
   docker volume prune
   Docker will ask for confirmation. This only removes volumes not attached to any container.

6. Remove ALL volumes (⚠️ WARNING - deletes everything including your DB data):
   docker volume prune -a
   ⚠️ Don't run this unless you want to lose all your database data!

# Stop all containers

docker compose down

# Stop and remove ALL volumes (including DB data) ⚠️

docker compose down -v

# Stop all running containers

docker stop $(docker ps -q)

# Remove ALL containers (including stopped ones)

docker rm $(docker ps -aq)

# Remove ALL volumes (⚠️ WARNING - deletes all DB data!)

docker volume prune -a

# Remove ALL images (⚠️ WARNING - will need to rebuild everything)

docker rmi $(docker images -q)

**One-liner to clean everything (⚠️ DANGER ZONE):**

docker compose down -v && docker stop $(docker ps -q) && docker rm $(docker ps -aq) && docker volume prune -a -f && docker rmi $(docker images -q) -f

# See all running containers

docker ps

# See all containers (including stopped)

docker ps -a

# See all volumes

docker volume ls
