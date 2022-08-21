
/**
 * Module dependencies.
 */

var _ = require('lodash');
var AuthenticateHandler = require('./handlers/authenticate-handler');
var AuthorizeHandler = require('./handlers/authorize-handler');
var InvalidArgumentError = require('./errors/invalid-argument-error');
var TokenHandler = require('./handlers/token-handler');

/**
 * Constructor.
 */

function OAuth2Server(options) {
  options = options || {};

  if (!options.model) {
    throw new InvalidArgumentError('Missing parameter: `model`');
  }

  this.options = options;
}

/**
 * Authenticate a token.
 */

OAuth2Server.prototype.authenticate = function(request, response, options, callback) {
  options = _.assign({
    addAcceptedScopesHeader: true,
    addAuthorizedScopesHeader: true
  }, this.options, options);

  return new AuthenticateHandler(options)
    .handle(request, response)
    .asCallback(callback);
};

/**
 * Authorize a request.
 */

OAuth2Server.prototype.authorize = function(request, response, options, callback) {
  options = _.assign({
    authorizationCodeLifetime: 5 * 60   // 5 minutes.
  }, this.options, options);

  return new AuthorizeHandler(options)
    .handle(request, response)
    .asCallback(callback);
};

/**
 * Create a token.
 */

OAuth2Server.prototype.token = function(request, response, options, callback) {
  options = _.assign({
    accessTokenLifetime: 60 * 60,             // 1 hour.
    refreshTokenLifetime: 60 * 60 * 24 * 14   // 2 weeks.
  }, this.options, options);

  return new TokenHandler(options)
    .handle(request, response)
    .asCallback(callback);
};

/**
 * Export constructor.
 */

module.exports = OAuth2Server;
