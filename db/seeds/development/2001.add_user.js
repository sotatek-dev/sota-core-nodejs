var id = 0;

G_SEED_USERS = [
  {
    id: ++id, username: 'user1',
    email: 'user1@sotatek.com',
    avatar_url: 'http://sotatek/user/1.png',
    password: '$2a$08$BklLWw92yUFru3x04O6YMe2MgY0tK89eaLPGeFFCIr92SLJphc2k2', // Password: 1
    full_name: 'User 1',
  },
  {
    id: ++id, username: 'user2',
    email: 'user2@sotatek.com',
    avatar_url: 'http://sotatek/user/2.png',
    password: '$2a$08$BklLWw92yUFru3x04O6YMe2MgY0tK89eaLPGeFFCIr92SLJphc2k2', // Password: 1
    full_name: 'User 2',
  },
  {
    id: ++id, username: 'user3',
    email: 'user3@sotatek.com',
    avatar_url: 'http://sotatek/user/3.png',
    password: '$2a$08$BklLWw92yUFru3x04O6YMe2MgY0tK89eaLPGeFFCIr92SLJphc2k2', // Password: 1
    full_name: 'User 3',
  }
];

G_SEED_USERS = _.shuffle(G_SEED_USERS);

exports.seed = function(knex, Promise) {
  return _.concat(
    generateTasks(knex, Promise, 'user', G_SEED_USERS)
  );
};
