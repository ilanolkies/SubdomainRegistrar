const assert = require('assert');
const namehash = require('eth-ens-namehash').hash;

const RNS = artifacts.require('RNS');
const SubdomainRegistrar = artifacts.require('SubdomainRegistrar');

contract('SubdomainRegistrar', function (accounts) {
  var subdomainRegistrar, rns;

  const rnsOwner = accounts[1];

  const rootNode = {
    label: 'rsk',
    sha3: web3.sha3('rsk'),
    namehash: namehash('rsk'),
    owner: accounts[0]
  }

  beforeEach(async function () {
    rns = await RNS.new({ from: rnsOwner });
    subdomainRegistrar = await SubdomainRegistrar.new(rns.address, rootNode.namehash);
    await rns.setSubnodeOwner(0, rootNode.sha3, rootNode.owner, { from: rnsOwner });
  });

  it('should transfer root node ownership to SubdomainRegistrar', async function () {
    await rns.setOwner(rootNode.namehash, subdomainRegistrar.address);

    const actualOwner = await rns.owner(rootNode.namehash);

    assert.equal(actualOwner, subdomainRegistrar.address);
  });

  it('should transfer back root node ownership to deployer', async function () {
    const newOwner = accounts[2];

    await rns.setOwner(rootNode.namehash, subdomainRegistrar.address);
    await subdomainRegistrar.transferRegistrar(newOwner);

    const actualOwner = await rns.owner(rootNode.namehash);

    assert.equal(actualOwner, newOwner);
  });

  it('should register a subdomain under root node', async function () {
    const newSubnode = web3.sha3('iov');
    const newSubnodeOwner = accounts[3];

    await rns.setOwner(rootNode.namehash, subdomainRegistrar.address);
    await subdomainRegistrar.registerSubdomain(newSubnode, { from: newSubnodeOwner });

    const actualOwner = await rns.owner(namehash('iov.rsk'));

    assert.equal(actualOwner, newSubnodeOwner);
  });

  it('should register a subdomain under root node and transfer back root node to previous owner', async function () {
    const newSubnode = web3.sha3('iov');
    const newSubnodeOwner = accounts[3];

    await rns.setOwner(rootNode.namehash, subdomainRegistrar.address);
    await subdomainRegistrar.registerSubdomain(newSubnode, { from: newSubnodeOwner });
    await subdomainRegistrar.transferRegistrar(rootNode.owner);

    const actualSubnodeOwner = await rns.owner(namehash('iov.rsk'));
    const actualRootNodeOwner = await rns.owner(rootNode.namehash);

    assert.equal(actualSubnodeOwner, newSubnodeOwner);
    assert.equal(actualRootNodeOwner, rootNode.owner);
  });
});
