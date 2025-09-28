# 🤖 Copilot Commands for PostgreSQL MCP

## 🏠 Local Database Commands
Use these phrases to query your **local test database**:

```
List all tables in my LOCAL database
Show me sample users from the LOCAL database  
Query products in LOCAL where price > 100
Get table structure for users in LOCAL
Show me test data from orders table in LOCAL
Describe the LOCAL database schema
```

## 🏢 QA Database Commands  
Use these phrases to query your **QA environment**:

```
List all tables in the QA database
Show me production users from QA
Query the QA database for recent transactions
Get table structure for users in QA
Show me real data from orders table in QA
Describe the QA database schemas
List tables in analytics_datalake schema in QA
```

## 🔄 Comparison Commands
Compare data between environments:

```
Compare user tables between LOCAL and QA
Show me schema differences between LOCAL and QA databases
Query both LOCAL and QA for user count comparison
```

## 🎯 Specific Database Selection
Always specify the database explicitly:

```
database: "local" → your test environment
database: "qa" → your production QA environment
```

## 💡 Pro Tips

1. **Be Explicit**: Always mention "LOCAL" or "QA" in your questions
2. **Use Context**: "development", "test" → LOCAL | "production", "real data" → QA  
3. **Multiple Servers**: You can run both `postgres-mcp-local` and `postgres-mcp-qa` simultaneously
4. **Default Behavior**: If you don't specify, it uses the server's default setting

## 🚀 Example Conversations

**Development Work:**
```
User: "Show me all test users in LOCAL"
Copilot: [Queries local database with sample users]

User: "Create a query to find products under $50 in LOCAL" 
Copilot: [Creates query for local test data]
```

**Production Analysis:**
```
User: "Analyze user patterns in QA database"
Copilot: [Queries production QA data]

User: "Show me table sizes in QA analytics_datalake schema"
Copilot: [Queries QA production analytics]
```
