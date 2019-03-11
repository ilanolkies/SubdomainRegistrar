const assert = require('assert');
const namehash = require('eth-ens-namehash').hash;

const RNS = artifacts.require('RNS');
const ERC677TokenContract = artifacts.require('ERC677TokenContract.sol');
const SubdomainRegistrar = artifacts.require('SubdomainRegistrar.sol');

contract('SubdomainRegistrar', async function (accounts) {
  var rns, rif, subdomainRegistrar;

  const rnsOwner = accounts[0];
  const rifOwner = accounts[1]
  const subdomainRegistrarOwner = accounts[2];
  const subdomainBuyer = accounts[3];

  const TOTAL_SUPPLY = 1000e18;
  const SUBDOMAIN_VALUE = 1e18;

  const rootNode = {
    label: 'rsk',
    sha3: web3.sha3('rsk'),
    namehash: namehash('rsk')
  };

  const subdomain = {
    label: 'iov',
    sha3: web3.sha3('iov'),
    namehash: namehash('iov.rsk')
  };

  beforeEach(async function () {
    rns = await RNS.new({ from: rnsOwner });

    rif = await ERC677TokenContract.new(rifOwner, TOTAL_SUPPLY, { from: rifOwner });

    subdomainRegistrar = await SubdomainRegistrar.new(
      rns.address,
      rootNode.namehash,
      rif.address,
      SUBDOMAIN_VALUE,
      { from: subdomainRegistrarOwner }
    );

    rns.setSubnodeOwner(0, rootNode.sha3, subdomainRegistrar.address, { from: rnsOwner });
    rif.transfer(subdomainBuyer, 100e18, { from: rifOwner });
  });

  it('should set rns owner', async function () {
    const owner = await rns.owner(rootNode.namehash);

    assert.equal(owner, subdomainRegistrar.address);
  });

  it('should set deployer as contract owner', async function () {
    const acutalSubdomainRegistrarOwner = await subdomainRegistrar.owner();

    assert.equal(acutalSubdomainRegistrarOwner, subdomainRegistrarOwner);
  });

  it('should store the root node', async function () {
    const acutalSubdomainRegistrarRootNode = await subdomainRegistrar.rootNode();

    assert.equal(acutalSubdomainRegistrarRootNode, rootNode.namehash);
  });

  it('should register subdomain with approval', async function () {
    await rif.approve(subdomainRegistrar.address, SUBDOMAIN_VALUE, { from: subdomainBuyer });

    await subdomainRegistrar.registerSubdomain(subdomain.sha3,  { from: subdomainBuyer });

    const owner = await rns.owner(subdomain.namehash);
    const registrarBalance = await rif.balanceOf(subdomainRegistrar.address);

    assert.equal(owner, subdomainBuyer);
    assert.equal(registrarBalance, SUBDOMAIN_VALUE);
  });

  it('should register subdomain with transfer and call', async function () {
    const data = `0x5fa0aca4${subdomain.sha3.slice(2)}`;

    await rif.transferAndCall(
      subdomainRegistrar.address,
      SUBDOMAIN_VALUE,
      data,
      { from: subdomainBuyer }
    );

    const owner = await rns.owner(subdomain.namehash);
    const registrarBalance = await rif.balanceOf(subdomainRegistrar.address);

    assert.equal(owner, subdomainBuyer);
    assert.equal(registrarBalance, SUBDOMAIN_VALUE);
  });

  it('should retrive tokens', async function () {
    const data = `0x5fa0aca4${subdomain.sha3.slice(2)}`;

    await rif.transferAndCall(
      subdomainRegistrar.address,
      SUBDOMAIN_VALUE,
      data,
      { from: subdomainBuyer }
    );

    await subdomainRegistrar.retriveTokens();

    const registrarBalance = await rif.balanceOf(subdomainRegistrar.address);
    const registrarOwnerBalance = await rif.balanceOf(subdomainRegistrarOwner);

    assert.equal(registrarBalance, 0);
    assert.equal(registrarOwnerBalance, SUBDOMAIN_VALUE);
  })
});
