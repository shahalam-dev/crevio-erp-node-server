# Agent Instructions

## Codebase exploration

When answering questions about this codebase, architecture, data flow, or how features work:

1. **Query the graph first.** Use the existing knowledge graph at `graphify-out/graph.json`:
   - `graphify query "<question>"` for BFS/broad context
   - `graphify query "<question>" --dfs` to trace a specific path
   - `graphify path "SourceNode" "TargetNode"` for shortest paths
   - `graphify explain "NodeName"` for a plain-language explanation of a node
2. **If the graph answer is insufficient**, read the relevant source files directly.
3. **After significant code changes**, the graph can be refreshed with `graphify . --update`.

## Project overview

- `crevio-erp-node-server` — Node.js/TypeScript ERP backend
- Stack: Express, Prisma, PostgreSQL, Redis, BullMQ, Vitest
- Key domains: authentication, user management, Telegram bot integration, email jobs

## Outputs

- `graphify-out/graph.html` — interactive graph
- `graphify-out/GRAPH_REPORT.md` — audit report with god nodes, surprising connections, and suggested questions
- `graphify-out/graph.json` — GraphRAG-ready raw graph data
