
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('master', function(t) {
      t.bigIncrements('id').primary().unsigned();
      t.string('key').notNullable();
      t.string('value').notNullable();
      t.bigint('created_at');
      t.bigint('updated_at');
      t.integer('created_by');
      t.integer('updated_by');
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTableIfExists('master');
};
