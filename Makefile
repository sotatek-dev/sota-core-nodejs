init-db:
	`npm bin`/knex migrate:rollback
	`npm bin`/knex migrate:latest
	`npm bin`/knex seed:run
	node core/tools/db/redis/RedisFlusher.js