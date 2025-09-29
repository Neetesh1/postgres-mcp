#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import pg from 'pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: any;
  connectionTimeoutMillis?: number;
}

interface DatabaseConnection {
  client: pg.Client;
  config: DatabaseConfig;
  name: string;
}

class PostgreSQLMCPServer {
  private server: Server;
  private connections: Map<string, DatabaseConnection> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'postgres-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.initializeDatabaseConnections();
  }

  private initializeDatabaseConnections() {
    // Local database configuration
    const localConfig: DatabaseConfig = {
      host: process.env.LOCAL_DB_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DB_PORT || '5432'),
      database: process.env.LOCAL_DB_NAME || '',
      user: process.env.LOCAL_DB_USER || '',
      password: process.env.LOCAL_DB_PASSWORD || '',
    };

    // QA database configuration
    const qaConfig: DatabaseConfig = {
      host: process.env.QA_DB_HOST || '',
      port: parseInt(process.env.QA_DB_PORT || '5432'),
      database: process.env.QA_DB_NAME || '',
      user: process.env.QA_DB_USER || '',
      password: process.env.QA_DB_PASSWORD || '',
      ssl: process.env.QA_DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: parseInt(process.env.QA_DB_TIMEOUT || '10000'),
    };

    // Initialize connections
    if (localConfig.database && localConfig.user) {
      this.connections.set('local', {
        client: new pg.Client(localConfig),
        config: localConfig,
        name: 'Local PostgreSQL',
      });
    }

    if (qaConfig.database && qaConfig.user && qaConfig.host) {
      this.connections.set('qa', {
        client: new pg.Client(qaConfig),
        config: qaConfig,
        name: 'QA Environment PostgreSQL',
      });
    }
  }

  private async connectToDatabase(dbName: string): Promise<pg.Client> {
    const connection = this.connections.get(dbName);
    if (!connection) {
      throw new Error(`Database connection '${dbName}' not configured`);
    }

    // Create a new client for each request to avoid connection issues
    const client = new pg.Client(connection.config);
    
    try {
      await client.connect();
      // Connection successful - no need to log this as it's not an error
      return client;
    } catch (error) {
      console.error(`Failed to connect to ${connection.name}:`, error);
      throw error;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'query_database',
          description: 'Execute a SELECT query on the specified database (local or qa)',
          inputSchema: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                enum: ['local', 'qa'],
                description: 'Database to query (local or qa)',
                default: process.env.DEFAULT_DB || 'local',
              },
              query: {
                type: 'string',
                description: 'SQL SELECT query to execute',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return (default: 100)',
                default: 100,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_tables',
          description: 'List all tables in the specified database',
          inputSchema: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                enum: ['local', 'qa'],
                description: 'Database to query (local or qa)',
                default: process.env.DEFAULT_DB || 'local',
              },
              schema: {
                type: 'string',
                description: 'Schema name (default: public)',
                default: 'public',
              },
            },
            required: [],
          },
        },
        {
          name: 'describe_table',
          description: 'Get detailed information about a table structure',
          inputSchema: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                enum: ['local', 'qa'],
                description: 'Database to query (local or qa)',
                default: process.env.DEFAULT_DB || 'local',
              },
              table_name: {
                type: 'string',
                description: 'Name of the table to describe',
              },
              schema: {
                type: 'string',
                description: 'Schema name (default: public)',
                default: 'public',
              },
            },
            required: ['table_name'],
          },
        },
        {
          name: 'get_table_sample',
          description: 'Get a sample of rows from a table',
          inputSchema: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                enum: ['local', 'qa'],
                description: 'Database to query (local or qa)',
                default: process.env.DEFAULT_DB || 'local',
              },
              table_name: {
                type: 'string',
                description: 'Name of the table to sample',
              },
              schema: {
                type: 'string',
                description: 'Schema name (default: public)',
                default: 'public',
              },
              limit: {
                type: 'number',
                description: 'Number of sample rows to return (default: 10)',
                default: 10,
              },
            },
            required: ['table_name'],
          },
        },
        {
          name: 'list_schemas',
          description: 'List all schemas in the specified database',
          inputSchema: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                enum: ['local', 'qa'],
                description: 'Database to query (local or qa)',
                default: process.env.DEFAULT_DB || 'local',
              },
            },
            required: [],
          },
        },
        {
          name: 'query_with_where',
          description: 'Execute a SELECT query with WHERE clause on the specified database - makes it easy to filter data',
          inputSchema: {
            type: 'object',
            properties: {
              database: {
                type: 'string',
                enum: ['local', 'qa'],
                description: 'Database to query (local or qa)',
                default: process.env.DEFAULT_DB || 'local',
              },
              table_name: {
                type: 'string',
                description: 'Name of the table to query',
              },
              schema: {
                type: 'string',
                description: 'Schema name (default: public)',
                default: 'public',
              },
              columns: {
                type: 'string',
                description: 'Columns to select (default: * for all columns)',
                default: '*',
              },
              where_clause: {
                type: 'string',
                description: 'WHERE clause conditions (e.g., "age > 25 AND status = \'active\'")',
              },
              order_by: {
                type: 'string',
                description: 'ORDER BY clause (e.g., "created_at DESC")',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return (default: 100)',
                default: 100,
              },
            },
            required: ['table_name', 'where_clause'],
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'query_database':
            return await this.handleQueryDatabase(args);
          case 'query_with_where':
            return await this.handleQueryWithWhere(args);
          case 'list_tables':
            return await this.handleListTables(args);
          case 'describe_table':
            return await this.handleDescribeTable(args);
          case 'get_table_sample':
            return await this.handleGetTableSample(args);
          case 'list_schemas':
            return await this.handleListSchemas(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private async handleQueryDatabase(args: any) {
    const database = args.database || process.env.DEFAULT_DB || 'local';
    const query = args.query;
    const limit = args.limit || 100;

    // Validate that it's a read-only query
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select') && !trimmedQuery.startsWith('with')) {
      throw new Error('Only SELECT queries are allowed');
    }

    const client = await this.connectToDatabase(database);
    
    try {
      // Add LIMIT if not already present
      let finalQuery = query;
      if (!trimmedQuery.includes(' limit ')) {
        finalQuery += ` LIMIT ${limit}`;
      }

      const result = await client.query(finalQuery);

      return {
        content: [
          {
            type: 'text',
            text: `Query executed on ${database} database:\n\`\`\`sql\n${finalQuery}\n\`\`\`\n\nResults (${result.rows.length} rows):\n\`\`\`json\n${JSON.stringify(result.rows, null, 2)}\n\`\`\``,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async handleQueryWithWhere(args: any) {
    const database = args.database || process.env.DEFAULT_DB || 'local';
    const tableName = args.table_name;
    const schema = args.schema || 'public';
    const columns = args.columns || '*';
    const whereClause = args.where_clause;
    const orderBy = args.order_by;
    const limit = args.limit || 100;

    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new Error('Invalid table name. Only alphanumeric characters and underscores are allowed.');
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
      throw new Error('Invalid schema name. Only alphanumeric characters and underscores are allowed.');
    }

    const client = await this.connectToDatabase(database);
    
    try {
      // Build the query
      let query = `SELECT ${columns} FROM ${schema}.${tableName} WHERE ${whereClause}`;
      
      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }
      
      query += ` LIMIT ${limit}`;

      const result = await client.query(query);

      return {
        content: [
          {
            type: 'text',
            text: `Query executed on ${database} database:\n\`\`\`sql\n${query}\n\`\`\`\n\nResults (${result.rows.length} rows):\n\`\`\`json\n${JSON.stringify(result.rows, null, 2)}\n\`\`\``,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async handleListTables(args: any) {
    const database = args.database || process.env.DEFAULT_DB || 'local';
    const schema = args.schema || 'public';

    const client = await this.connectToDatabase(database);
    try {
      const result = await client.query(
        `SELECT table_name, table_type 
         FROM information_schema.tables 
         WHERE table_schema = $1 
         ORDER BY table_name`,
        [schema]
      );

      return {
        content: [
          {
            type: 'text',
            text: `Tables in ${database} database (schema: ${schema}):\n\`\`\`json\n${JSON.stringify(result.rows, null, 2)}\n\`\`\``,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async handleDescribeTable(args: any) {
    const database = args.database || process.env.DEFAULT_DB || 'local';
    const tableName = args.table_name;
    const schema = args.schema || 'public';

    const client = await this.connectToDatabase(database);
    try {
      const result = await client.query(
        `SELECT 
           column_name,
           data_type,
           is_nullable,
           column_default,
           character_maximum_length,
           numeric_precision,
           numeric_scale
         FROM information_schema.columns 
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [schema, tableName]
      );

      return {
        content: [
          {
            type: 'text',
            text: `Table structure for ${schema}.${tableName} in ${database} database:\n\`\`\`json\n${JSON.stringify(result.rows, null, 2)}\n\`\`\``,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async handleGetTableSample(args: any) {
    const database = args.database || process.env.DEFAULT_DB || 'local';
    const tableName = args.table_name;
    const schema = args.schema || 'public';
    const limit = args.limit || 10;

    const client = await this.connectToDatabase(database);
    try {
      const result = await client.query(
        `SELECT * FROM ${schema}.${tableName} LIMIT $1`,
        [limit]
      );

      return {
        content: [
          {
            type: 'text',
            text: `Sample data from ${schema}.${tableName} in ${database} database (${result.rows.length} rows):\n\`\`\`json\n${JSON.stringify(result.rows, null, 2)}\n\`\`\``,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  private async handleListSchemas(args: any) {
    const database = args.database || process.env.DEFAULT_DB || 'local';

    const client = await this.connectToDatabase(database);
    try {
      const result = await client.query(
        `SELECT schema_name 
         FROM information_schema.schemata 
         WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
         ORDER BY schema_name`
      );

      return {
        content: [
          {
            type: 'text',
            text: `Schemas in ${database} database:\n\`\`\`json\n${JSON.stringify(result.rows, null, 2)}\n\`\`\``,
          },
        ],
      };
    } finally {
      await client.end();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Server is running - no need to log this as it's not an error
  }

  async cleanup() {
    for (const [name, connection] of this.connections) {
      try {
        await connection.client.end();
        // Disconnected successfully - no need to log this as it's not an error
      } catch (error) {
        console.error(`Error disconnecting from ${connection.name}:`, error);
      }
    }
  }
}

async function main() {
  const server = new PostgreSQLMCPServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    await server.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    await server.cleanup();
    process.exit(0);
  });

  await server.run();
}

main().catch(console.error);
