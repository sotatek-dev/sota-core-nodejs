var assert        = require('assert');
var request       = require('superagent');

describe('Check login APIs', function() {

  it('Local login', function(done) {
    request
      .post(getUrl('/login'))
      .send({
        email: 'user1@sotatek.com',
        password: '1',
      })
      .end(function(err, res) {
        if (err) throw err;

        // Request has no error
        assert.equal(res.body.meta.code, 0);

        // Correct logged user
        assert.equal(res.body.data.id, 1);

        // Correct logged user
        assert(!res.body.data.password);

        // Got access token
        assert(!_.isEmpty(res.body.data.token));

        done();
      });
  });

});
