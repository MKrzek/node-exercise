_Docker's Client-Server Architecture_
Docker isn't a single monolithic program. It's split into a client and a daemon (server), and understanding this split explains a lot of Docker's behavior.

The Docker daemon (dockerd) is the background service that does all the actual work — building images, creating and running containers, managing networks and volumes, pulling images from registries. It runs continuously in the background (on macOS, inside the Docker Desktop VM, since containers need a Linux kernel).

The Docker client (docker CLI) is just a thin command-line tool you interact with. When you type docker compose up or docker build, the client doesn't do the work itself — it translates your command into an API request and sends it to the daemon over a socket (usually /var/run/docker.sock on Linux, or a similar mechanism through Docker Desktop's VM on macOS).

Where docker compose Fits In
docker compose (the modern compose subcommand, not the old standalone docker-compose binary) is technically a plugin to the Docker client. When you run:

_docker compose up_
Here's the sequence:

The Compose plugin (part of the client) reads and parses your docker-compose.yml

It translates that YAML into a series of individual Docker API calls — create network, create volumes, build image, create container, start container — one for each service

Each of those calls goes through the Docker client to the daemon

The daemon does the actual work: pulling postgres:15, building your Dockerfile, creating the app-network bridge network, starting each container, and running the healthchecks you defined

So in your case, the client's role is essentially orchestration translation and communication — it turns your one declarative YAML file into the many imperative API calls the daemon needs, and relays daemon output (build logs, container status) back to your terminal. The daemon holds the actual state of what's running.

_Why this matters practically_
This is why docker compose up and docker compose down work reliably even if you close your terminal — the daemon keeps containers running independently of the client process. It's also why Docker Desktop on macOS needs to be running at all: the daemon lives inside its Linux VM, and if Docker Desktop isn't started, the client has nothing to talk to and every command fails with a "cannot connect to the Docker daemon" error.

Yes, exactly right. Running docker compose up (without specifying individual services) starts all the services defined in your docker-compose.yml — postgres-monolith, postgres-notifications, redis, monolith, and notification-service — all networked together.

_The Two Workflows_
Option A: Everything in Docker

bash
docker compose up
This runs your whole stack in containers, including the app itself. Your monolith service already has:

text
volumes:

- .:/app
- /app/node_modules
  command: npm run dev
  That bind-mounts your local source code into the container and runs tsx watch, so code changes on your host still hot-reload inside the container. You get containerized consistency without losing the dev loop.

Option B: Infra in Docker, app on host (what we discussed)

bash
docker compose up postgres-monolith redis -d
npm run dev
This runs the app natively on your machine, only containerizing the dependencies.

Which one should you use?
Both are valid — it's mostly a matter of preference and what you're debugging:

Use Option A (everything in Docker) when you want your environment to closely mirror production, or when working on the notification-service too, since it's networked with the monolith.

Use Option B (app on host) when you want faster restarts, easier native debugging (e.g., attaching a Node debugger directly), or you're troubleshooting something Docker-networking-specific and want to isolate variables — like we did earlier tonight with the JWT import bug.

Given you were running curl against localhost:3000 throughout our debugging session and rebuilding with docker compose build monolith, it looks like you've been using Option A already — so you're all set either way.

When you run docker build or docker compose build, the daemon does the building, and the resulting image is stored in the daemon's local storage — not anywhere your client CLI can directly see as files. On macOS, that storage lives inside the Docker Desktop Linux VM (which is really just an isolated filesystem the daemon manages, using a storage driver like overlayfs).

Same story for containers: when you docker compose up, the daemon creates the container's filesystem layers, allocates its network namespace, and runs the actual process (in your case, tsx watch src/server.ts) — all inside that VM. Your Mac's own Unix processes never directly run your Node app; the daemon's Linux kernel does.

Confirming this yourself
You can see this separation directly:

_docker images_
This asks the daemon "what images do you have stored?" — the client just displays the daemon's answer. Similarly:

_docker ps_

Asks the daemon "what containers are currently running?"

Neither command reads anything from your Mac's filesystem directly (aside from your docker-compose.yml and Dockerfile, which get sent to the daemon as build context).

Why your bind mount trick still works
This is actually why your dev setup is clever. Even though the daemon runs everything inside its VM, your docker-compose.yml has:

volumes:

- .:/app

This tells the daemon to mount your Mac's actual project folder into the container's filesystem at /app, bridging the gap. Docker Desktop handles the file-sharing between macOS and the Linux VM transparently, so when tsx watch (running inside the daemon's container) detects a file change, it's actually watching your real Mac files — just made visible inside the container's isolated filesystem via that mount.

Without that bind mount, your code would need to be baked into the image at build time (like your Dockerfile.prod does with COPY . .), and you'd have to rebuild the image every time you changed a line of code — which is exactly why dev setups use bind mounts and prod setups don't.
