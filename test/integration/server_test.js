
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('../../lib/errors/invalid-argument-error');
var Promise = require('bluebird');
var Request = require('../../lib/request');
var Response = require('../../lib/response');
var Server = require('../../lib/server');
var should = require('should');

/**
 * Test `Server` integration.
 */

describe('Server integration', function() {
  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new Server({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should set the `model`', function() {
      var model = {};
      var server = new Server({ model: model });

      server.options.model.should.equal(model);
    });
  });

  describe('authenticate()', function() {
    it('should set the default `options`', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      var response = new Response({ body: {}, headers: {} });

      return server.authenticate(request, response)
        .then(function() {
          this.addAcceptedScopesHeader.should.be.true;
          this.addAuthorizedScopesHeader.should.be.true;
        })
        .catch(should.fail);
    });

    it('should return a promise', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      var response = new Response({ body: {}, headers: {} });
      var handler = server.authenticate(request, response);

      handler.should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function(next) {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: {}, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: {} });
      var response = new Response({ body: {}, headers: {} });

      server.authenticate(request, response, null, next);
    });
  });

  describe('authorize()', function() {
    it('should set the default `options`', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
        },
        saveAuthorizationCode: function() {
          return { authorizationCode: 123 };
        },
        saveToken: function() {
          return { accessToken: 1234, client: {}, user: {} };
        },
        validateScope: function() { return true; },
        authorizationAllowed: function() { return true; }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', response_type: 'code' }, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: { state: 'foobar' } });
      var response = new Response({ body: {}, headers: {} });

      return server.authorize(request, response)
        .then(function() {
          this.authorizationCodeLifetime.should.equal(300);
        })
        .catch(should.fail);
    });

    it('should return a promise', function() {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
        },
        saveAuthorizationCode: function() {
          return { authorizationCode: 123 };
        },
        saveToken: function() {
          return { accessToken: 1234, client: {}, user: {} };
        },
        validateScope: function() { return true; },
        authorizationAllowed: function() { return true; }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', response_type: 'code' }, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: { state: 'foobar' } });
      var response = new Response({ body: {}, headers: {} });
      var handler = server.authorize(request, response);

      handler.should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function(next) {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUri: 'http://example.com/cb' };
        },
        saveAuthorizationCode: function() {
          return { authorizationCode: 123 };
        },
        saveToken: function() {
          return { accessToken: 1234, client: {}, user: {} };
        },
        validateScope: function() { return true; },
        authorizationAllowed: function() { return true; }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', response_type: 'code' }, headers: { 'Authorization': 'Bearer foo' }, method: {}, query: { state: 'foobar' } });
      var response = new Response({ body: {}, headers: {} });

      server.authorize(request, response, null, next);
    });
  });

  describe('token()', function() {
    it('should set the default `options`', function() {
      var model = {
        getClient: function() {
          return { grants: ['password'], redirectUri: 'http://example.com/cb' };
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 1234, client: {}, user: {} };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', grant_type: 'password', username: 'foo', password: 'pass', redirect_uri: 'http://example.com/cb' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });

      return server.token(request, response)
        .then(function() {
          this.accessTokenLifetime.should.equal(3600);
          this.refreshTokenLifetime.should.equal(1209600);
        })
        .catch(should.fail);
    });

    it('should return a promise', function() {
      var model = {
        getClient: function() {
          return { grants: ['password'], redirectUri: 'http://example.com/cb' };
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 1234, client: {}, user: {} };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', grant_type: 'password', username: 'foo', password: 'pass' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });
      var handler = server.token(request, response);

      handler.should.be.an.instanceOf(Promise);
    });

    it('should support callbacks', function(next) {
      var model = {
        getClient: function() {
          return { grants: ['password'], redirectUri: 'http://example.com/cb' };
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 1234, client: {}, user: {} };
        }
      };
      var server = new Server({ model: model });
      var request = new Request({ body: { client_id: 1234, client_secret: 'secret', grant_type: 'password', username: 'foo', password: 'pass' }, headers: { 'content-type': 'application/x-www-form-urlencoded', 'transfer-encoding': 'chunked' }, method: 'POST', query: {} });
      var response = new Response({ body: {}, headers: {} });

      server.token(request, response, null, next);
    });
  });
});
