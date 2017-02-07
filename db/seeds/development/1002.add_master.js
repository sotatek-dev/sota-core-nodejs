G_SEED_MASTER = [
  {key: 'dataVersion', value: 7}
];

exports.seed = function(knex, Promise) {
  return generateTasks(knex, Promise, 'master', G_SEED_MASTER);
};
