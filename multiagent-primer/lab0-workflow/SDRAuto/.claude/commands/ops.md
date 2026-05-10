---
name: ops
description: Azure ops playbook — check VM status, resource groups, costs, run diagnostics, and manage infrastructure via az CLI
---

## Instructions

When the user runs `/ops [command]`, execute the appropriate Azure operations playbook.

### Available Commands

#### `/ops status` — Infrastructure overview
1. Run `az vm list --show-details -o table` to show all VMs and their power states
2. Highlight any VMs that are **running** (potential cost) vs **deallocated**
3. Flag any VMs missing backups or with stale snapshots

#### `/ops rg [name]` — Resource group deep dive
1. If `[name]` is provided, list all resources in that group: `az resource list -g <name> -o table`
2. If no name, list all resource groups with resource counts
3. Show key resources: VMs, databases, app services, cognitive services, search, container apps

#### `/ops vm [name]` — VM details and diagnostics
1. Show VM size, OS, power state, public IP, NSG rules
2. Run: `az vm show -g <rg> -n <name> -o table` and `az vm get-instance-view -g <rg> -n <name> --query "instanceView.statuses[*].{Code:code,Status:displayStatus}" -o table`
3. Show recent boot diagnostics if available
4. List attached disks and their sizes

#### `/ops cost` — Cost analysis
1. Run `az consumption usage list --top 20 -o table` or fallback to `az costmanagement query` for recent spend
2. Identify the top cost drivers (running VMs, storage, cognitive services, search services)
3. Flag deallocated VMs that still have attached premium disks (still incur cost)
4. Flag orphaned resources (NICs, IPs, disks not attached to any VM)

#### `/ops ssh [vm-name]` — SSH connection helper
1. Look up the VM's public IP and resource group
2. Print the SSH command: `ssh -i <key> <user>@<ip>`
3. If multiple keys exist in the resource group, list them

#### `/ops nsg [vm-name]` — Network security rules
1. Find the NSG associated with the VM's NIC
2. Run `az network nsg rule list -g <rg> --nsg-name <nsg> -o table`
3. Flag any overly permissive rules (0.0.0.0/0 on sensitive ports)

#### `/ops backup [vm-name]` — Backup status
1. Check Recovery Services vaults in the VM's resource group
2. Show latest backup status and recovery points
3. Flag VMs with no backup policy

#### `/ops start [vm-name]` / `/ops stop [vm-name]` — VM power management
1. Confirm the action with the user before proceeding
2. For stop: use `az vm deallocate` (not just `az vm stop`) to avoid continued billing
3. Show the result and new power state

#### `/ops cleanup` — Find wasteful resources
1. Find orphaned disks: `az disk list --query "[?managedBy==null]" -o table`
2. Find orphaned NICs: `az network nic list --query "[?virtualMachine==null]" -o table`
3. Find orphaned public IPs: `az network public-ip list --query "[?ipConfiguration==null]" -o table`
4. Summarize potential savings

#### `/ops dns` — DNS and networking overview
1. List private DNS zones: `az network private-dns zone list -o table`
2. List public IPs and their assignments
3. Show VNet peerings if any

### Default Behavior

If the user runs just `/ops` with no command, run `/ops status` as the default.

### Key Context

This subscription has these primary resource groups:
- **mitra-robot** — Core Mitra Robot platform (North Central US)
- **brahmasumm** — Brahmasumm project with PostgreSQL (North Central US)
- **Kapi / KapiIDE** — Kapi + ModernAI platform (East US / East US 2) — Container Apps, Search, ML
- **PERSONAL** — Personal projects (North Central US)
- **vedas-portal_group** — Vedas portal (North Central US)
- **Arvind-AILab** — AI Lab (Central India)
- **modernai-teaching** — Teaching environment (East US)

### Important Rules

1. **Always confirm** before starting, stopping, or deleting any resource
2. **Never delete** resources without explicit user approval — list what would be deleted first
3. **Use `--output table`** for readability unless user requests JSON
4. **Flag costs** — always mention when a running resource is costing money
5. **Security** — warn about open NSG rules, exposed ports, or missing backups
6. **Be concise** — summarize findings, don't dump raw CLI output without commentary
