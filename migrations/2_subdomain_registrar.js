const SubdomainRegistrar = artifacts.require('SubdomainRegistrar');

module.exports = function(deployer) {
  deployer.deploy(SubdomainRegistrar);
};
