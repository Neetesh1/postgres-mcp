# PostgreSQL MCP Server

A Model Context Protocol (MCP) server that enables VS Code Copilot to perform read-only operations on PostgreSQL databases. Supports connections to both local and QA environment databases.

## Features

- **Multi-database support**: Connect to both local and QA PostgreSQL databases
- **Read-only operations**: Execute SELECT queries safely
- **Schema exploration**: List tables, describe table structures, and explore schemas
- **Sample data**: Get sample rows from tables for analysis
- **VS Code integration**: Seamless integration with GitHub Copilot in VS Code

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd postgres-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Edit `.env` with your database connection details:
```env
# Local PostgreSQL Database
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432
LOCAL_DB_NAME=your_local_db
LOCAL_DB_USER=your_username
LOCAL_DB_PASSWORD=your_password

# QA Environment Database
QA_DB_HOST=your_qa_host
QA_DB_PORT=5432
QA_DB_NAME=your_qa_db
QA_DB_USER=your_qa_username
QA_DB_PASSWORD=your_qa_password

# Default database to use (local or qa)
DEFAULT_DB=local
```

3. Update the VS Code MCP configuration in `.vscode/mcp.json` with your actual database credentials.

## VS Code Setup

1. Ensure you have the MCP extension installed in VS Code
2. The `.vscode/mcp.json` file is already configured for this project
3. Start the MCP server from VS Code's MCP panel
4. Open GitHub Copilot Chat and switch to Agent Mode

## Available Tools

### 1. query_database
Execute SELECT queries on your databases.
- **Parameters**: 
  - `database` (local|qa): Target database
  - `query`: SQL SELECT query
  - `limit`: Maximum rows to return (default: 100)

### 2. list_tables
List all tables in a database schema.
- **Parameters**:
  - `database` (local|qa): Target database
  - `schema`: Schema name (default: public)

### 3. describe_table
Get detailed table structure information.
- **Parameters**:
  - `database` (local|qa): Target database
  - `table_name`: Name of the table
  - `schema`: Schema name (default: public)

### 4. get_table_sample
Get sample rows from a table.
- **Parameters**:
  - `database` (local|qa): Target database
  - `table_name`: Name of the table
  - `schema`: Schema name (default: public)
  - `limit`: Number of rows (default: 10)

### 5. list_schemas
List all schemas in the database.
- **Parameters**:
  - `database` (local|qa): Target database

## Usage Examples

Once configured in VS Code, you can ask Copilot questions like:

- "Show me all tables in the local database"
- "What's the structure of the users table in the QA database?"
- "Get a sample of data from the orders table"
- "Query the products table for items with price > 100"
- "List all schemas in the QA database"

## Development

### Building
```bash
npm run build
```

### Starting the Server
```bash
npm start
```

### Testing Database Connection
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

## Security Considerations

- **Read-only access**: The server only allows SELECT queries and schema inspection
- **Database permissions**: Ensure your database users have only SELECT permissions
- **Environment variables**: Keep your `.env` file secure and never commit it to version control
- **Network security**: Use secure connections (SSL/TLS) for remote database connections

## Troubleshooting

### Connection Issues
1. Verify database credentials in `.env`
2. Ensure PostgreSQL server is running
3. Check network connectivity for remote databases
4. Verify user permissions

### VS Code Integration
1. Ensure MCP extension is installed
2. Check that the MCP server is running in VS Code
3. Verify the `.vscode/mcp.json` configuration
4. Restart VS Code if needed

## License

MIT License - see LICENSE file for details.
