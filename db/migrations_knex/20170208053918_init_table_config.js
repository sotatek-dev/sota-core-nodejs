
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('config', function(t) {
      t.bigIncrements('id').primary().unsigned();
      t.string('key', 100).notNullable().unique();
      t.string('value', 60).notNullable();
      t.string('type', 10).notNullable();
      t.bigint('created_at');
      t.bigint('updated_at');
      t.integer('created_by');
      t.integer('updated_by');
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTableIfExists('config');
};
