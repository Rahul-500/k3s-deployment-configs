# On-Prime k3s Cluster on Bare Metal Raspberry Pi with Grafana Prometheus Monitoring

Leveraging Raspberry Pi devices, we established a budget-friendly Kubernetes cluster using k3s, a lightweight version designed for edge computing and IoT. This approach allowed us to maximize our existing hardware without the need for additional infrastructure costs.
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
   - Utilize a __NETGEAR GS310TP 8 Port POE Switch__ for efficient power and data distribution through the Ethernet cabling. This simplifies the setup and allows for simultaneous powering of multiple devices.

## Bake the PI

### Steps:
- [Add your steps here]

## Automating k3s setup: Incoming.... Ansible

- **Description:** Introduction to automating k3s setup using Ansible.

### Set Up
- **On Local Machine:**
  - Commands and description of each command.
  
- **On k3s Setup:**
  - Commands and description of each command.

### Check for Working
- [Add your steps for checking the setup here]

## Setting up our k3s Cluster

- **Description:** Details about setting up the k3s cluster manually.

### Set Up
- Commands and description of each command.

### Check for Working
- [Add your steps for checking the setup here]

## Application

- **About Docker:** Explanation of Docker and its relevance.

- **Why Use Docker as an Application:**
  - [Add your reasons here]

- **Setting up Docker on k3s (New Version for Debian):**
  - Commands and description of each command.

- **Application Structure:**
  - [Describe the structure of your application]

## Prometheus and Grafana (Monitoring)

- **Description:** Overview of Prometheus and Grafana for monitoring.

### Set Up
- Commands and description of each command.

### Check for Working
- [Add your steps for checking the monitoring setup here]

## Check for Overall Working of the System

- [Add your steps for checking the overall system functionality]
