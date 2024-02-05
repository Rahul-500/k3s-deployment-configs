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
   - Utilize a __NETGEAR POE Switch__ for efficient power and data distribution through the Ethernet cabling. This simplifies the setup and allows for simultaneous powering of multiple devices.

## Bake the Pi

To use Raspberry Pis as cluster nodes, set them up headless—without a monitor, keyboard, or mouse. We'll configure them remotely using SSH, eliminating the need for a GUI.

### Steps:
   1. Download and install the Raspberry Pi Imager on your computer.
      ```bash
      sudp apt install rpi-imager
      ```
   2. Open the Raspberry Pi Imager and select the “**CHOOSE OS**” option.
      ![Screenshot from 2024-02-04 10-48-25](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/2b10f6b5-6a69-43a7-a12f-67648e98f1a0)

   3. From the list of available operating systems, select “**Raspberry Pi OS (other)**”, and then choose “_Raspberry Pi OS Lite (64-bit)_”
      ![Screenshot from 2024-02-04 10-49-02](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/ba01e5fd-ee51-4803-afa6-bf604f41ea56)
      ![Screenshot from 2024-02-04 10-49-17](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/49ccdf35-42d0-46b0-b313-e74bacefed46)

   4. Click “**CHOOSE STORAGE**” and select the SD card you want to use for your Raspberry Pi.
      ![Screenshot from 2024-02-04 10-56-32](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/8c02207b-9575-49f5-9278-5b6779affad7)
      ![Screenshot from 2024-02-04 10-57-52](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/ff78f73b-22eb-445d-9ce5-65eed3a00976)

   5. Click on the gear icon to configure Raspberry Pi. Set up a unique hostname for every Raspberry Pi, activate ssh with password authentication and pass in your ssh credentials. 
      ![Screenshot from 2024-02-05 08-26-38](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/2c0da435-c295-41b7-8105-301e5fdf0848)

   6. Click “**WRITE**” and note that this will clear all the existing data on the SD card. Wait for the image to be written to the SD card.
      ![Screenshot from 2024-02-05 08-31-38](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/32838573-9415-425a-8a12-bb2fcaae690b)

   7. Once the image has been written, eject the SD card and insert it into your Raspberry Pi.

   8. Connect your Raspberry Pi to your router using Ethernet cables, and make sure to attach a power source. Utilize a **NETGEAR POE Switch** for streamlined connectivity. This switch conveniently delivers both electric power and data through the same Ethernet cables, simplifying the setup and enabling simultaneous power delivery to multiple devices. 
      ![image](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162308/3cf2726f-1e81-4d2f-9c9a-8597d4cab368)



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

### Description

We have used the lightweight Kubernetes distribution k3s for our little Raspberry Pi cluster. k3s is a free small size Kubernetes Version optimized for Edge devices and ARM architectures maintained from Rancher.

### Architecture

A server node is defined as a Raspberry Pi which runs the k3s server. The worker nodes are defined as Raspberry Pi running the k3s agent. The agents are registered on the server node, and the cluster can be accessed via kubectl and via ssh to the master node.

![k3sArchitecture](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162324/16706066-a672-493c-8d58-95b4fbe62c9e)

### Set Up

1) **Install k3s server on master node:**

   - First, ssh into the first Raspberry Pi where you want to install the k3s server using the IP. Authenticated via password. For this project, we have set up the username for the Raspberry Pi with IP 192.168.88.11 as source-node.
     ```bash
     ssh source-node@192.168.88.11
     ```

   - Second install k3s server with
     ```bash
     curl -sfL https://get.k3s.io | sh -
     ```

   - Typically, the installation now throws a failure message that the cgroup is not correctly set up.
     ```
     [INFO] Failed to find memory cgroup, you may need to add “cgroup_memory=1 cgroup_enable=memory” (/boot/cmdline.txt on a Raspberry Pi)
     ```

   - Just do exactly what the message says. Open the file /boot/cmdline.txt and append the mentioned string at the end of the line. It is important that there is no line break added.
     ```bash
     sudo nano /boot/cmdline.txt
     ```
     and add cgroup_memory=1 cgroup_enable=memory on the end of the first line.
     
     - `cgroup_memory=1` : This allows the system to allocate resources (like CPU, memory) to different processes or containers. Enabling memory accounting is crucial for Kubernetes, as it needs to efficiently manage memory resources for applications running in containers.
     
     - `cgroup_enable=memory` :  This ensures that memory usage is properly tracked and allocated among different processes or containers, preventing one from using all available memory and affecting the overall system stability.
     
   - Exit nano by hitting ctrl+x and y+enter to save the changes and then reboot the system to make the change effective
     ```bash
     sudo reboot
     ```

   - Finally, you can ssh back into your master node and check if Kubernetes works and the master node is available.
     ```bash
     sudo kubectl get nodes
     ```
     ![getMasterNodeCommand](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162324/08ebff7f-9644-4b1b-88c5-458e0719d89a)

2) **Install k3s agents on worker nodes:**

   - In order to install the k3s agents on the other Raspberries, we need first to get the IP address and the access token from the master node. Ssh into the master node and run the following commands.
     ```bash
     hostname -I | awk '{print $1}'
     sudo cat /var/lib/rancher/k3s/server/node-token
     ```

   - Copy both and ssh into each worker node and install the k3s agent with the following commands.
     ```bash
     curl -sfL https://get.k3s.io | K3S_URL=https://<kmaster_IP_from_above>:6443 K3S_TOKEN=<token_from_above> sh -
     ```

   - If these two environment variables are set, the script directly starts the k3s agent and registers the node on the master. You will get again the cgroup error, and you have to add the two entries 																						again in /boot/cmdline.txt as mentioned in the master node above. After a reboot, you can ssh into your master node and check if the node is registered correctly (can take a couple of minutes). Repeat this step for all nodes you want to add.

   - Finally, for in total 3 nodes, it looks like this
     ```bash
     sudo kubectl get nodes
     ```
     ![getNodesCommand](https://github.com/infraspecdev/k3s-deployment-configs/assets/156162324/426056cb-20c7-40ad-8efe-f533baa131d5)

### Command Descriptions and Usage

1) **`sudo kubectl get nodes`**

   - **Description:** This command is used to check the availability and status of the nodes in the Kubernetes cluster.
   - **Usage:** Execute this command on your master node to ensure that the cluster is set up correctly and all nodes are registered.
   		Execute this on the master node after installing k3s agents on worker nodes to verify their successful integration into the cluster.

3) **`curl -sfL https://get.k3s.io | sh -`**

   - **Description:** Install k3s server on the master node by fetching the installation script from the provided URL and running it.
   - **Usage:** Execute this command on the master node to set up the k3s server.

4) **`hostname -I | awk '{print $1}'`**

   - **Description:** Retrieve the IP address of the master node.
   - **Usage:** Execute this command on the master node to get its IP address, which is needed for configuring k3s agents on worker nodes.

5) **`sudo cat /var/lib/rancher/k3s/server/node-token`**

   - **Description:** Display the access token used to register k3s agents on worker nodes.
   - **Usage:** Execute this command on the master node to get the access token, which is needed for configuring k3s agents on worker nodes.

6) **`curl -sfL https://get.k3s.io | K3S_URL=https://<kmaster_IP_from_above>:6443 K3S_TOKEN=<token_from_above> sh -`**

   - **Description:** Install k3s agent on a worker node by providing the master node's IP address and access token.
   - **Usage:** Execute this command on each worker node to register them with the master node.

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
