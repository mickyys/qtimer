# Go Agent

This agent is a cross-platform (Windows and macOS) application designed to run as a resilient, continuous background service. It monitors a directory for new or modified files and uploads them to a backend endpoint.

## Core Responsibilities

- **Directory Monitoring**: The agent periodically scans a configured directory for file changes, using SHA256 hashes to detect modifications.
- **File Upload**: For each new or modified file, the agent initiates a concurrent upload process. It sends the file content along with its SHA256 hash in a single `multipart/form-data` request to a configurable API endpoint.
- **Fault Tolerance**: If the upload fails, the agent will retry up to a configurable number of times with a delay between attempts.
- **File Management**:
    -   Successfully uploaded files are moved to a `completed` directory.
    -   Files that fail after all retry attempts are moved to an `error` directory.
- **State Persistence**: The agent maintains a `state.json` file to track the status of each file. This ensures that it can resume operations safely after a restart, automatically re-queuing any jobs that were interrupted.
- **Resilience**: It is built using the `kardianos/service` library, allowing it to be installed as a system service that starts automatically on boot.

## Workflow Sequence Diagram

The following diagram illustrates the simplified workflow for a single file:

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
            FileHandler->>API: Upload file and hash
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

## Usage and Configuration

Before running the agent, you must configure it properly. The agent loads its configuration from a `config/config.json` file located relative to the executable.

### Directory Structure

The agent expects the following directory structure:

```
/apps/agent/
├── agent(.exe)         <-- The compiled executable
├── config/
│   └── config.json     <-- Configuration file
├── logs/
│   └── app.log         <-- Log file (created automatically)
└── state.json          <-- State file (created automatically)
```

### Configuration Parameters

Edit the `config/config.json` file to match your environment.

**Note:** The backend service uses the filename to associate the uploaded data with an event. Ensure that the files in the `directory_to_watch` have names that correspond to events previously created in the system by an administrator.

```json
{
  "directory_to_watch": "/path/to/your/files",
  "completed_directory": "/path/to/completed/files",
  "error_directory": "/path/to/error/files",
  "upload_endpoint": "http://localhost:8080/events/upload",
  "check_interval_seconds": 60,
  "http_timeout_seconds": 15,
  "max_retries": 5,
  "retry_delay_seconds": 30
}
```

- `directory_to_watch`: The absolute path to the folder the agent should monitor for new files.
- `completed_directory`: The absolute path where successfully processed files will be moved.
- `error_directory`: The absolute path where files that failed processing will be moved.
- `upload_endpoint`: The API endpoint for the file upload.
- `check_interval_seconds`: How often (in seconds) the agent scans the directory for changes.
- `http_timeout_seconds`: The timeout (in seconds) for each HTTP request to the API.
- `max_retries`: The maximum number of times the agent will retry a failed processing step.
- `retry_delay_seconds`: The delay (in seconds) between each retry attempt.

### Monitoring the Agent

The agent's activity, including file detections, processing steps, errors, and retries, is logged in the `logs/app.log` file. You can monitor this file to check the agent's status and troubleshoot issues.

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
