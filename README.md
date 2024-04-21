# On-Prime k3s Cluster on Bare Metal Raspberry Pi with Grafana Prometheus Monitoring

Leveraging Raspberry Pi devices, we established a budget-friendly Kubernetes cluster using k3s, a lightweight version designed for edge computing and IoT. This approach allowed us to maximize our existing hardware without the need for additional infrastructure costs.

------------------

## Hardware Setup:

### 1. Raspberry Pi Devices:
   - 4 Raspberry Pi 4s
     - Source Node: 8GB configuration
     - 2 Data Nodes: 4GB configuration each
     - Plain Node for Prometheus and Grafana Monitoring: 2GB configuration

### 2. Storage:
   - 4 Samsung 32GB MicroSD cards for Raspberry Pi storage

### 3. Power and Connectivity:
   - 4 Raspberry Pi Power over Ethernet (PoE) HAT
   - Connect Raspberry Pi devices to the router using Ethernet cables.

### 4. Networking Equipment:
   - Utilize a __NETGEAR POE Switch__ for efficient power and data distribution through the Ethernet cabling. This simplifies the setup and allows for simultaneous powering of multiple devices.

## Bake the Pi

To use Raspberry Pis as cluster nodes, set them up headless—without a monitor, keyboard, or mouse. We'll configure them remotely using SSH, eliminating the need for a GUI.

### Steps:
   1. Download and install the Raspberry Pi Imager on your computer.
      ```bash
      sudo apt install rpi-imager
      ```

   2. Open the Raspberry Pi Imager and select the “**CHOOSE OS**” option.

      ![Screenshot](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/2b10f6b5-6a69-43a7-a12f-67648e98f1a0)

   3. From the list of available operating systems, select “**Raspberry Pi OS (other)**” and choose “_Raspberry Pi OS Lite (64-bit)_”.

      ![Screenshot](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/ba01e5fd-ee51-4803-afa6-bf604f41ea56)
      ![Screenshot](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/49ccdf35-42d0-46b0-b313-e74bacefed46)

   5. Click “**CHOOSE STORAGE**” and select the SD card you want to use for your Raspberry Pi.

      ![Screenshot](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/8c02207b-9575-49f5-9278-5b6779affad7)
      ![Screenshot](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/ff78f73b-22eb-445d-9ce5-65eed3a00976)

   7. Click on the gear icon to configure Raspberry Pi. Set up a unique hostname for every Raspberry Pi, activate SSH with password authentication, and provide your SSH credentials.

      ![Screenshot](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/2c0da435-c295-41b7-8105-301e5fdf0848)

   9. Click “**WRITE**” and note that this will clear all existing data on the SD card. Wait for the image to be written to the SD card.

      ![Screenshot](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/32838573-9415-425a-8a12-bb2fcaae690b)

   11. Once the image has been written, eject the SD card and insert it into your Raspberry Pi.

   12. Connect your Raspberry Pi to your router using Ethernet cables, and make sure to attach a power source. Utilize a **NETGEAR POE Switch** for streamlined connectivity. This switch conveniently delivers both electric power and data through the same Ethernet cables, simplifying the setup and enabling simultaneous power delivery to multiple devices.

![Image](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/3cf2726f-1e81-4d2f-9c9a-8597d4cab368)

------------------------------

## Setting up our k3s Cluster

### Description

We have used the lightweight Kubernetes distribution k3s for our Raspberry Pi cluster. k3s is a free, small-size Kubernetes version optimized for edge devices and ARM architectures and is maintained by Rancher.

### Architecture

A server node is defined as a Raspberry Pi that runs the k3s server. The worker nodes are defined as Raspberry Pis running the k3s agent. The agents register on the server node, and the cluster can be accessed via `kubectl` and via SSH to the master node.

![k3sArchitecture](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162324/16706066-a672-493c-8d58-95b4fbe62c9e)

### Set Up

1. **Install k3s server on master node:**

   - SSH into the first Raspberry Pi where you want to install the k3s server using the IP. For this project, we have set up the username for the Raspberry Pi with IP 192.168.88.11 as source-node.
     ```bash
     ssh source-node@192.168.88.11
     ```

   - Install the k3s server:
     ```bash
     curl -sfL https://get.k3s.io | sh -
     ```

   - Typically, the installation may throw a failure message that the cgroup is not correctly set up.
     ```
     [INFO] Failed to find memory cgroup, you may need to add "cgroup_memory=1 cgroup_enable=memory" to (/boot/cmdline.txt on a Raspberry Pi).
     ```

   - Follow the message instructions and edit the `/boot/cmdline.txt` file to add the mentioned string at the end of the line without any line breaks.
     ```bash
     sudo nano /boot/cmdline.txt
     ```

   - Append `cgroup_memory=1 cgroup_enable=memory` to the end of the line.
     
     - `cgroup_memory=1`: This allows the system to allocate resources (like CPU, memory) to different processes or containers. Enabling memory accounting is crucial for Kubernetes, as it needs to efficiently manage memory resources for applications running in containers.
     
     - `cgroup_enable=memory`: This ensures that memory usage is properly tracked and allocated among different processes or containers, preventing one from using all available memory and affecting the overall system stability.

   - Exit nano using `ctrl+x` and save changes by selecting `y` and hitting enter. Reboot the system to apply the changes:
     ```bash
     sudo reboot
     ```

   - SSH back into your master node and check if Kubernetes works and the master node is available:
     ```bash
     sudo kubectl get nodes
     ```

![Screenshot from 2024-04-20 23-22-00](https://github.com/Rahul-500/k3s-deployment-configs/assets/156162324/e1caddc8-0210-45e3-bca7-7cd292b677ee)

2. **Install k3s agents on worker nodes:**

   - To install k3s agents on other Raspberries, get the IP address and access token from the master node. SSH into the master node and run the following commands:
     ```bash
     hostname -I | awk '{print $1}'
     sudo cat /var/lib/rancher/k3s/server/node-token
     ```

   - Copy both the IP address and the access token, and SSH into each worker node to install the k3s agent:
     ```bash
     curl -sfL https://get.k3s.io | K3S_URL=https://<kmaster_IP_from_above>:6443 K3S_TOKEN=<token_from_above> sh -
     ```

   - If these two environment variables are set, the script directly starts the k3s agent and registers the node on the master. You may encounter the cgroup error again, so add the two entries (`cgroup_memory=1` and `cgroup_enable=memory`) to `/boot/cmdline.txt` as you did for the master node above. After a reboot, SSH into your master node and check if the node is registered correctly (this may take a few minutes). Repeat this step for all nodes you want to add.

   - Finally, you should see the list of nodes with the following command:
     ```bash
     sudo kubectl get nodes
     ```

![Screenshot from 2024-04-20 23-22-25](https://github.com/Rahul-500/k3s-deployment-configs/assets/156162324/037a7271-2b06-4a31-9a32-08273d980022)

### Command Descriptions and Usage

1. **`sudo kubectl get nodes`**
   - **Description:** This command checks the availability and status of the nodes in the Kubernetes cluster.
   - **Usage:** Execute this command on your master node to ensure that the cluster is set up correctly and all nodes are registered.

3. **`curl -sfL https://get.k3s.io | sh -`**
   - **Description:** Installs the k3s server on the master node by fetching the installation script from the provided URL and running it.
   - **Usage:** Execute this command on the master node to set up the k3s server.

4. **`hostname -I | awk '{print $1}'`**
   - **Description:** Retrieves the IP address of the master node.
   - **Usage:** Execute this command on the master node to get its IP address, which is needed for configuring k3s agents on worker nodes.

5. **`sudo cat /var/lib/rancher/k3s/server/node-token`**
   - **Description:** Displays the access token used to register k3s agents on worker nodes.
   - **Usage:** Execute this command on the master node to get the access token, which is needed for configuring k3s agents on worker nodes.

6. **`curl -sfL https://get.k3s.io | K3S_URL=https://<kmaster_IP_from_above>:6443 K3S_TOKEN=<token_from_above> sh -`**
   - **Description:** Installs the k3s agent on a worker node by providing the master node's IP address and access token.
   - **Usage:** Execute this command on each worker node to register them with the master node.

--------------------

## Application

- **About Docker:**
  Docker is a containerization platform that enables applications to run in isolated environments called containers. Docker containers bundle the application code and dependencies, making them portable and consistent across different environments.

- **Why Use Docker as an Application:**
  - Portability: Docker containers can run consistently across different environments, including development, testing, and production.
  - Isolation: Containers provide process and resource isolation, ensuring applications run independently.
  - Scalability: Containers can be easily scaled and orchestrated using Kubernetes or k3s.
  - Ease of Deployment: Docker makes deploying and managing applications straightforward.

- **Setting up Docker on k3s (New Version for Debian):**
  - Install Docker on the Raspberry Pi devices using the provided commands, such as `sudo apt-get install docker-ce` and related packages.

- **Application Structure:**
  - **REST API Endpoints:**
    - `/user-detail`: Returns user details and increments counters for HTTP requests and 200 responses.
    - `/bad-request`: Simulates a bad request, returning a 500 error and incrementing the respective counters.
    - `/random-delay`: Introduces a random delay in the request and returns a success response.
    - `/metrics`: Exposes Prometheus metrics for monitoring.

- **Prometheus Metrics:**
    - `total_http_requests`: Counter for total HTTP requests.
    - `total_200_requests`: Counter for total 200 responses.
    - `total_500_requests`: Counter for total 500 responses.
    - `http_request_duration_seconds`: Histogram for HTTP request duration in seconds.

-------------------------------------------

## Prometheus and Grafana (Monitoring)

- **Description:**
  Prometheus is an open-source monitoring and alerting toolkit designed for reliability and scalability of applications. It is part of the Cloud Native Computing Foundation (CNCF) and widely used in DevOps and systems monitoring.
  Grafana is an open-source analytics and monitoring platform focused on data visualization and interactive dashboards. It supports various data sources, plugins, alerting, and customizable dashboards.

### Architecture
![Architecture](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162703/36f9511b-bf7b-45db-8a02-a58991d40e83)

### Set Up

- Deploy Prometheus and Grafana using the YAML configuration files you provided in your repository. By default, Prometheus is exposed on port 9090 and Grafana on port 3000.

- **Deploying Prometheus:**
  - Use your YAML configuration file to deploy Prometheus in your k3s cluster.

- **Deploying Grafana:**
  - Similarly, use the provided YAML configuration file to deploy Grafana in your k3s cluster.

### Configure Prometheus for Grafana:

- **Add Prometheus as a data source in Grafana**: In Grafana, add Prometheus as a data source. You will need the URL where Prometheus is running (`http://localhost:9090` or your IP address).
- **Create dashboards**: In Grafana, create dashboards using queries to monitor and visualize your application metrics.

### Building Dashboards:

- Use the Grafana interface to build custom dashboards based on your application's metrics.
- Utilize the data visualizations available in Grafana to create informative dashboards that provide insights into your application's performance.

### Check Prometheus Metrics in Grafana:

- Go to Grafana's Explore view and build queries to experiment with the metrics you want to monitor.
- Debug any issues related to collecting metrics from Prometheus.

- The image below shows a screenshot of the Grafana UI with a dashboard displaying various metrics and counters from the application:

![Screenshot from 2024-04-20 23-41-54](https://github.com/Rahul-500/k3s-deployment-configs/assets/156162324/b29a00c6-746f-4802-b095-325c943a7192)

- You can create custom dashboards and panels to visualize the data being collected by Prometheus:

![Screenshot from 2024-04-20 23-25-23](https://github.com/Rahul-500/k3s-deployment-configs/assets/156162324/029dc38b-eabc-4e1c-8027-adadccaa8291)

### Check for Working:

- Verify the monitoring setup by checking Prometheus metrics in Grafana dashboards.

### Install Docker on the Plain Node

1. **Install required packages:**
    ```bash
    sudo apt-get install ca-certificates curl
    ```
    - **Description:** This command installs the necessary packages for secure communication (`ca-certificates`) and making HTTP requests (`curl`).

2. **Create keyrings directory:**
    ```bash
    sudo install -m 0755 -d /etc/apt/keyrings
    ```
    - **Description:** This command creates the `/etc/apt/keyrings` directory with specific permissions (`0755`) for storing keyrings used for package verification.

3. **Download Docker GPG key:**
    ```bash
    sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
    ```
    - **Description:** This command uses `curl` to download the GPG key from the specified Docker repository. The key is saved in the `/etc/apt/keyrings/docker.asc` file.

4. **Set read permissions on GPG key file:**
    ```bash
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    ```
    - **Description:** This command sets read permissions for all users on the downloaded GPG key file. This ensures that the system can access and verify the integrity of Docker packages using the added key.

5. **Add Docker repository to sources list:**
    ```bash
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    ```
    - **Description:** This command adds a new Docker repository to the sources list. The configuration specifies the Debian architecture, the GPG key location, the Docker repository URL, and the Debian version codename. The command uses `echo` to create a new line with the Docker repository configuration and pipes it to `sudo tee` to write the configuration to the sources list file.

6. **Update package information:**
    ```bash
    sudo apt-get update
    ```
    - **Description:** This command refreshes the package information from all configured repositories, including the newly added Docker repository.

7. **Install Docker and related packages:**
    ```bash
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ```
    - **Description:** This command installs Docker Community Edition (CE), which includes the Docker daemon and client, as well as other Docker-related packages. `docker-ce-cli` installs the Docker command-line interface (CLI), allowing users to interact with Docker. `containerd.io` installs Containerd, an industry-standard core container runtime. `docker-buildx-plugin` installs the Buildx plugin for Docker, providing additional features for building multi-platform images. `docker-compose-plugin` installs the Docker Compose CLI plugin, which extends Docker Compose functionality.

------------------------------------------------

## Automating k3s setup: Incoming.... Ansible

- **Description:** Introduction to automating k3s setup using Ansible.

### Set Up

- **On Local Machine:**
  - Commands and description of each command.

- **On k3s Setup:**
  - Commands and description of each command.

### Check for Working:

- [Add your steps for checking the Ansible setup here]

----------------------------------------------

## Check for Overall Working of the System

- [Add your steps for checking the overall system functionality here]

### Prometheus Scraping Targets

Here is a screenshot of the Prometheus UI showing the targets that Prometheus is scraping data from:

![Screenshot from 2024-04-20 23-22-53](https://github.com/Rahul-500/k3s-deployment-configs/assets/156162324/fbbe156b-2887-4385-8277-bd8bd9f6b9ad)

### Services

Here is a screenshot of the output of `kubectl get svc -o wide`:

![Screenshot from 2024-04-20 23-22-53](https://github.com/Rahul-500/k3s-deployment-configs/assets/156162324/037a7271-2b06-4a31-9a32-08273d980022)
