
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../../../lib/errors/invalid-argument-error');
var InvalidGrantError = require('../../../lib/errors/invalid-grant-error');
var InvalidRequestError = require('../../../lib/errors/invalid-request-error');
var Promise = require('bluebird');
var RefreshTokenGrantType = require('../../../lib/grant-types/refresh-token-grant-type');
var Request = require('../../../lib/request');
var ServerError = require('../../../lib/errors/server-error');
var should = require('should');

/**
 * Test `RefreshTokenGrantType` integration.
 */

describe('RefreshTokenGrantType integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456 });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should throw an error if the model does not implement `getRefreshToken()`', function() {
      try {
        new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: {} });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `getRefreshToken()`');
      }
    });

    it('should throw an error if the model does not implement `revokeToken()`', function() {
      try {
        var model = {
          getRefreshToken: function() {}
        };

        new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `revokeToken()`');
      }
    });

    it('should throw an error if the model does not implement `saveToken()`', function() {
      try {
        var model = {
          getRefreshToken: function() {},
          revokeToken: function() {}
        };

        new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Invalid argument: model does not implement `saveToken()`');
      }
    });
  });

  describe('handle()', function() {
    it('should throw an error if `request` is missing', function() {
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });

      try {
        grantType.handle();

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `request`');
      }
    });

    it('should throw an error if `client` is missing', function() {
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.handle(request);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `client`');
      }
    });

    it('should return a token', function() {
      var client = { id: 123 };
      var token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      var model = {
        getRefreshToken: function() { return token; },
        revokeToken: function() { return { accessToken: 'foo', client: { id: 123 }, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: function() { return token; }
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      return grantType.handle(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var client = { id: 123 };
      var model = {
        getRefreshToken: function() { return Promise.resolve({ accessToken: 'foo', client: { id: 123 }, user: {} }); },
        revokeToken: function() { return Promise.resolve({ accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }) },
        saveToken: function() { return Promise.resolve({ accessToken: 'foo', client: {}, user: {} }); }
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var client = { id: 123 };
      var model = {
        getRefreshToken: function() { return { accessToken: 'foo', client: { id: 123 }, user: {} }; },
        revokeToken: function() { return { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} }; },
        saveToken: function() { return { accessToken: 'foo', client: {}, user: {} }; }
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.handle(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('getRefreshToken()', function() {
    it('should throw an error if the requested `refreshToken` is missing', function() {
      var client = {};
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `refresh_token`');
      }
    });

    it('should throw an error if the requested `refreshToken` is invalid', function() {
      var client = {};
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: [] }, headers: {}, method: {}, query: {} });

      try {
        grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refreshToken` is missing', function() {
      var client = {};
      var model = {
        getRefreshToken: function() { return { accessToken: 'foo', client: { id: 123 }, user: {} }; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refreshToken.client` is missing', function() {
      var client = {};
      var model = {
        getRefreshToken: function() { return {}; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getRefreshToken()` did not return a `client` object');
        });
    });

    it('should throw an error if `refreshToken.user` is missing', function() {
      var client = {};
      var model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `getRefreshToken()` did not return a `user` object');
        });
    });

    it('should throw an error if the client id does not match', function() {
      var client = { id: 123 };
      var model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if the request body does not contain `refresh_token`', function() {
      var client = {};
      var model = {
        getRefreshToken: function() {
          return { client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: {}, headers: {}, method: {}, query: {} });

      try {
        grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Missing parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refresh_token` is invalid', function() {
      var client = {};
      var model = {
        getRefreshToken: function() {
          return { client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 'øå€£‰' }, headers: {}, method: {}, query: {} });

      try {
        grantType.getRefreshToken(request, client);

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidRequestError);
        e.message.should.equal('Invalid parameter: `refresh_token`');
      }
    });

    it('should throw an error if `refresh_token` is missing', function() {
      var client = {};
      var model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 456 }, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if `refresh_token` is expired', function() {
      var client = { id: 123 };
      var date = new Date(new Date() / 2);
      var model = {
        getRefreshToken: function() {
          return { accessToken: 'foo', client: { id: 123 }, refreshTokenExpiresAt: date, user: {} };
        },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 12345 }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(should.fail)
        .catch(function(e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token has expired');
        });
    });

    it('should return a token', function() {
      var client = { id: 123 };
      var token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      var model = {
        getRefreshToken: function() { return token; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      return grantType.getRefreshToken(request, client)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var client = { id: 123 };
      var token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      var model = {
        getRefreshToken: function() { return Promise.resolve(token); },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.getRefreshToken(request, client).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var client = { id: 123 };
      var token = { accessToken: 'foo', client: { id: 123 }, user: {} };
      var model = {
        getRefreshToken: function() { return token; },
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });
      var request = new Request({ body: { refresh_token: 'foobar' }, headers: {}, method: {}, query: {} });

      grantType.getRefreshToken(request, client).should.be.an.instanceOf(Promise);
    });
  });

  describe('revokeToken()', function() {
    it('should throw an error if the `token` is invalid', function() {
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });

      grantType.revokeToken({})
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(InvalidGrantError);
          e.message.should.equal('Invalid grant: refresh token is invalid');
        });
    });

    it('should throw an error if the `token.refreshTokenExpiresAt` is invalid', function() {
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() { return { refreshTokenExpiresAt: [] }; },
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 120, refreshTokenLifetime: 456, model: model });

      grantType.revokeToken({})
        .then(should.fail)
        .catch(function (e) {
          e.should.be.an.instanceOf(ServerError);
          e.message.should.equal('Server error: `refreshTokenExpiresAt` must be a Date instance');
        });
    });

    it('should revoke the token', function() {
      var token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() { return token; },
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });

      return grantType.revokeToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() { return Promise.resolve(token); },
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = { accessToken: 'foo', client: {}, refreshTokenExpiresAt: new Date(new Date() / 2), user: {} };
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() { return token; },
        saveToken: function() {}
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });

      grantType.revokeToken(token).should.be.an.instanceOf(Promise);
    });
  });

  describe('saveToken()', function() {
    it('should save the token', function() {
      var token = {};
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() { return token; }
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });

      return grantType.saveToken(token)
        .then(function(data) {
          data.should.equal(token);
        })
        .catch(should.fail);
    });

    it('should support promises', function() {
      var token = {};
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() { return Promise.resolve(token); }
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });

    it('should support non-promises', function() {
      var token = {};
      var model = {
        getRefreshToken: function() {},
        revokeToken: function() {},
        saveToken: function() { return token; }
      };
      var grantType = new RefreshTokenGrantType({ accessTokenLifetime: 123, refreshTokenLifetime: 456, model: model });

      grantType.saveToken(token).should.be.an.instanceOf(Promise);
    });
  });
});
