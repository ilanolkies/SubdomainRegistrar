const SubdomainRegistrar = artifacts.require('SubdomainRegistrar');
const config = require('../config');
const namehash = require('eth-ens-namehash').hash

module.exports = function(deployer) {
  const hash = namehash(config.root);
  deployer.deploy(SubdomainRegistrar, config.rns, hash);
};
