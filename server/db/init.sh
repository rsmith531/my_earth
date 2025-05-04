# server\db\init.sh

# a script that checks if docker is installed, installs it if not (only on
# ubuntu), then spins up a postgres instance and starts a database inside it

# Function to check if a command exists in the PATH
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "Checking for Docker installation..."

# Check if docker command is available for the current user
if ! command_exists docker; then
  echo "Docker command not found."

  # Detect the operating system
  OS=$(uname -s)

  if [[ "$OS" == "Linux" ]]; then
    echo "Detected Linux environment ($OS). Attempting to install Docker Engine..."

    # Check if running as root, which is required for apt commands
    if [[ $EUID -ne 0 ]]; then
        echo "Docker not found and detected Linux."
        echo "This script needs root privileges (sudo) to install Docker Engine on Linux."
        echo "Please run with sudo: sudo ./init.sh"
        exit 1
    fi

    echo "Running Docker installation steps..."

    # Add Docker's official GPG key:
    sudo apt-get update
    sudo apt-get install ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    
    # Add the repository to Apt sources:
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    
    # install docker engine
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  else
    # Assume non-Linux is your Windows/MINGW64 case for this script's purpose
    echo "Detected non-Linux OS ($OS)."
    echo "Docker command not found. On this OS, please ensure Docker Desktop is installed and running."
    echo "This script will now attempt to run the docker command, which may fail if not available."
    # We don't exit here, allowing the script to attempt the docker run command below,
    # which will likely fail with "command not found" on Windows if Docker Desktop isn't configured in PATH.
  fi
else
  echo "Docker command found. Skipping installation."
fi

# --- Attempt to run the postgres database container ---
echo ""
echo "Attempting to run the PostgreSQL container 'my_earth_db'..."

if command_exists docker; then
  # Try running the container. Use `docker start` if it exists, otherwise `docker run`.
  
  if docker inspect my_earth_db > /dev/null 2>&1; then
    echo "Container 'my_earth_db' already exists. Attempting to start it."
    docker start my_earth_db
    if [ $? -ne 0 ]; then
      echo "Error: Failed to start existing container 'my_earth_db'."
      echo "Check container status with 'docker ps -a'."
      exit 1
    else
      echo "Container 'my_earth_db' started successfully."
    fi
  else
    echo "Container 'my_earth_db' not found. Running a new container."

    docker run --name my_earth_db -e POSTGRES_PASSWORD=YoullNeverGuessThisOne -p 5431:5432 -d postgres

    # Check the exit status of the docker run command
    if [ $? -ne 0 ]; then
      echo "Error: Failed to run the new PostgreSQL container."
      echo "This might be due to permissions (if on Linux and not in 'docker' group, try 'sudo docker run...')"
      echo "or other Docker related issues."
      exit 1
    else
      echo "New PostgreSQL container 'my_earth_db' started successfully."
    fi
  fi

  # --- Wait for the database server to be ready ---
  echo ""
  echo "Waiting for the PostgreSQL server to be ready..."

  until docker exec my_earth_db pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "." # Print a dot while waiting
    sleep 1
  done

  echo ""
  echo "PostgreSQL server is ready."

  # --- Create the 'my_earth_db' database inside the container ---
  echo ""
  echo "Attempting to create the 'my_earth_db' database inside the container..."

  # Execute psql inside the container to create the database
  # -U postgres: Connect as the postgres user
  # -c "CREATE DATABASE my_earth_db;": Execute the SQL command
  # || true: This prevents the script from exiting if the database already exists (psql returns non-zero)
  docker exec my_earth_db psql -U postgres -c "CREATE DATABASE my_earth_db;" || true

  # Check if the database creation command had a critical failure (excluding "already exists")
  # A simple check is difficult here without more complex psql output parsing,
  # but the '|| true' handles the most common "already exists" case.
  # For more robust checking, you might inspect container logs or query the database.
  echo "Database creation command executed. Check container logs for details if needed."


else
  echo "Skipping PostgreSQL container run because the docker command is not available."
  exit 1
fi

echo "Script finished."
exit 0
