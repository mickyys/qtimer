# Go Agent

This agent is a cross-platform (Windows and macOS) application that monitors a directory for file changes, calculates SHA256 hashes of files, and sends modified files to an HTTP endpoint.

## Workflow

1.  **Initialization**: The agent starts by loading its configuration from `config/config.json`, initializing the logger to write to `logs/app.log`, and loading the last known state from `state.json`.

2.  **Periodic Checks**: Every `check_interval_seconds` (as defined in the configuration), the agent scans the `directory_to_watch`.

3.  **Hashing and Comparison**: For each file in the directory, the agent calculates its SHA256 hash. This hash is compared with the hash stored in the agent's state.

4.  **File Sending**: If a file's hash is new or has changed, the agent sends the file to the configured `endpoint`.

5.  **State Persistence**: The agent's state, which includes the hashes of all files, is saved to `state.json` after each check. This ensures that the agent can resume its work without losing track of file states even after a system restart.

6.  **Graceful Shutdown**: The agent listens for `SIGINT` and `SIGTERM` signals to perform a graceful shutdown, ensuring that the current state is saved before exiting.

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
