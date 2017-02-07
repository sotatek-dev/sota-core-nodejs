
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('user', function(t) {
      t.bigIncrements('id').primary().unsigned();
      t.string('username', 40).notNullable().index();
      t.string('avatar_url', 256);
      t.string('email', 40).notNullable().index();
      t.string('password', 128);
      t.string('full_name', 45).index();
      t.bigint('created_at', 14);
      t.bigint('updated_at', 14);
      t.integer('created_by', 10);
      t.integer('updated_by', 10);
    })
  ]);
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTableIfExists('user');
};
