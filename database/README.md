# Database

Database bootstrap and seed data live in [init.sql](/home/jdavidruanob/code/autonomous-fleet-manager/database/init.sql).

Human-readable schema reference:

- [docs/DATABASE.md](/home/jdavidruanob/code/autonomous-fleet-manager/docs/DATABASE.md)

The init script only runs automatically when the Postgres volume is created for the first time. To recreate the database from scratch locally:

```bash
docker compose down -v
docker compose up --build
```
