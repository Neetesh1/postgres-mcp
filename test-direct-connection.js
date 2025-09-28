#!/usr/bin/env node

/**
 * Direct database connection test
 */

import pg from 'pg';
import { config } from 'dotenv';

// Load your .env configuration
config();

async function testConnection() {
  console.log('🔍 Testing direct PostgreSQL connection...');
  console.log(`Host: ${process.env.LOCAL_DB_HOST}`);
  console.log(`Port: ${process.env.LOCAL_DB_PORT}`);
  console.log(`Database: ${process.env.LOCAL_DB_NAME}`);
  console.log(`User: ${process.env.LOCAL_DB_USER}`);
  console.log('');

  const client = new pg.Client({
    host: process.env.LOCAL_DB_HOST,
    port: parseInt(process.env.LOCAL_DB_PORT || '5432'),
    database: process.env.LOCAL_DB_NAME,
    user: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PASSWORD,
  });

  try {
    console.log('📡 Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('📋 Testing basic query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query successful!');
    console.log('PostgreSQL Version:', result.rows[0].version);
    console.log('');

    console.log('📊 Listing schemas...');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    console.log('Available schemas:', schemas.rows.map(r => r.schema_name));
    console.log('');

    console.log('📋 Listing tables in public schema...');
    const tables = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables found:', tables.rows.length);
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });

    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found. You may need to run the init-db.sql script.');
      console.log('💡 To load sample data, run:');
      console.log(`   psql -h ${process.env.LOCAL_DB_HOST} -p ${process.env.LOCAL_DB_PORT} -U ${process.env.LOCAL_DB_USER} -d ${process.env.LOCAL_DB_NAME} -f init-db.sql`);
    }

  } catch (error) {
    console.log('❌ Connection failed!');
    console.log('Error:', error.message);
    console.log('');
    console.log('🔧 Common solutions:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check if the database exists');
    console.log('3. Verify username and password');
    console.log('4. Check if the user has access to the database');
    console.log('');
    console.log('💡 Try creating the database:');
    console.log(`   createdb -h ${process.env.LOCAL_DB_HOST} -p ${process.env.LOCAL_DB_PORT} -U ${process.env.LOCAL_DB_USER} ${process.env.LOCAL_DB_NAME}`);
  } finally {
    await client.end();
  }
}

testConnection().catch(console.error);
