# GIRA Raw Data → Control Dashboard

## Objective
Build a web application where a user uploads a raw GIRA export file and gets an interactive control dashboard with key KPIs and statistics.

## Users & Roles
- Analyst (default): can upload datasets and view dashboards
- Admin: can manage users and delete datasets

## Inputs
- Upload file types: CSV and XLSX
- Max file size: 50MB
- Required columns (example): ticket_id, created_at, resolved_at, status, category, priority, assignee, group, sla_due_at
- Optional columns: region, customer, channel, tags

## Core Use Cases
1) Upload dataset
2) Validate schema (required columns, types)
3) Profile data quality (missing values, duplicates, invalid dates)
4) Compute KPIs:
   - volume total, by status/category/priority
   - backlog trend
   - avg/median resolution time
   - SLA compliance rate
   - top assignees/groups by volume and SLA breaches
5) Provide dashboard queries with filters
6) Export results (JSON + optional CSV summary)

## Dashboard Views
- Executive overview (KPI cards)
- Time series (daily/weekly volumes, backlog, SLA compliance)
- Distribution (resolution time histogram, boxplot data)
- Segmentation (category/priority/group)
- Data quality (missing/duplicates/outliers)

## Non-Functional
- Deterministic pipeline outputs
- Audit trail of runs (hash, timestamp)
- Docker support
- Performance: first dashboard under 10s for 200k rows
- Security: store files securely; sanitize uploads
