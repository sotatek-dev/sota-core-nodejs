G_SEED_CONFIG = [
  {key: 'share_interval', value: 10000, type: 'integer'},
  {key: 'wait_for_s3_upload', value: 1, type: 'integer'},
];

exports.seed = function(knex, Promise) {
  return generateTasks(knex, Promise, 'config', G_SEED_CONFIG);
};
