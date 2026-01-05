# Go Agent

This agent is a cross-platform (Windows and macOS) application designed to run as a resilient, continuous background service. It monitors a directory for new or modified files and processes them through a multi-step, fault-tolerant workflow.

## Core Responsibilities

- **Directory Monitoring**: The agent periodically scans a configured directory for file changes, using SHA256 hashes to detect modifications.
- **Multi-Step Processing**: For each new or modified file, the agent initiates a concurrent, multi-step process:
    1.  **Initial Upload**: The file is sent to a preliminary API endpoint.
    2.  **Event Query**: The agent queries a second endpoint to determine which event the file is associated with.
    3.  **Final Upload**: The file is sent to a final endpoint, correctly associated with its event.
- **Fault Tolerance**: If any step in the process fails, the agent will retry up to a configurable number of times with a delay between attempts.
- **File Management**:
    -   Successfully processed files are moved to a `completed` directory.
    -   Files that fail after all retry attempts are moved to an `error` directory.
- **State Persistence**: The agent maintains a `state.json` file to track the status (`Pending`, `Processing`, `Completed`, `Failed`), retry count, and last error for each file, ensuring it can resume operations safely after a restart.
- **Resilience**: It is built using the `kardianos/service` library, allowing it to be installed as a system service that starts automatically on boot.

## Workflow Sequence Diagram

The following diagram illustrates the complete workflow for a single file:

```mermaid
sequenceDiagram
    participant Agent as Agent Service (Ticker)
    participant Processor as Directory Processor
    participant State as State (state.json)
    participant FileHandler as File Handler (Goroutine)
    participant API as Backend API
    participant FileSystem as File System

    loop Periodic Scan
        Agent->>Processor: Scan Directory
        Processor->>FileSystem: Read directory and calculate file hashes
        Processor->>State: Get current file states
        alt File is new or hash has changed
            Processor->>State: Update file status to 'Pending'
        end
    end

    loop Concurrent Processing
        Agent->>FileHandler: Start goroutine for each 'Pending' file
        FileHandler->>State: Set file status to 'Processing'
        loop Retry Logic (up to max_retries)
            FileHandler->>API: 1. Initial Upload
            API-->>FileHandler: Returns Upload ID
            FileHandler->>API: 2. Query Event (with Upload ID)
            API-->>FileHandler: Returns Event ID
            FileHandler->>API: 3. Final Upload (with Event ID)
            API-->>FileHandler: Success confirmation

            opt on API failure
                FileHandler->>State: Increment retry count, log error
                Note over FileHandler: Wait for retry_delay
            end
        end

        alt Process successful
            FileHandler->>FileSystem: Move file to 'completed' directory
            FileHandler->>State: Set file status to 'Completed'
        else Process failed after all retries
            FileHandler->>FileSystem: Move file to 'error' directory
            FileHandler->>State: Set file status to 'Failed'
        end
    end
```

## Compilation Instructions

To compile the agent, you need to have Go installed on your system.

### macOS

Open your terminal and run the following command from the `apps/agent` directory:

```sh
go build -o agent cmd/agent/main.go
```

This will create an executable file named `agent` in the `apps/agent` directory.

### Windows

Open your command prompt or PowerShell and run the following command from the `apps/agent` directory:

```sh
go build -o agent.exe cmd/agent/main.go
```

This will create an executable file named `agent.exe` in the `apps/agent` directory.

## Installation as a System Service

Once the agent is compiled, it can be installed as a system service to ensure it runs automatically on boot. These commands typically require administrative privileges (e.g., run as Administrator on Windows or with `sudo` on macOS).

From the `apps/agent` directory where the executable is located:

- **Install the service:**
  ```sh
  # On macOS
  sudo ./agent install

  # On Windows
  .\agent.exe install
  ```

- **Start the service:**
  ```sh
  # On macOS
  sudo ./agent start

  # On Windows
  .\agent.exe start
  ```

- **Stop the service:**
  ```sh
  # On macOS
  sudo ./agent stop

  # On Windows
  .\agent.exe stop
  ```

- **Uninstall the service:**
  ```sh
  # On macOS
  sudo ./agent uninstall

  # On Windows
  .\agent.exe uninstall
  ```
