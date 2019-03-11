const assert = require('assert');
const namehash = require('eth-ens-namehash').hash;

const RNS = artifacts.require('RNS');

contract('RNS', function (accounts) {
  var rns;

  const rnsOwner = accounts[0];
  const rskOwner = accounts[1];

  const label = 'rsk';

  beforeEach(async function () {
    rns = await RNS.new({ form: rnsOwner });
  });

  it('should set root node owner to deployer account', async function () {
    const rootNodeOwner = await rns.owner(0, { from: rnsOwner });

    assert.equal(rootNodeOwner, rnsOwner);
  });

  it('should transfer subnode ownership', async function () {
    await rns.setSubnodeOwner(0, web3.sha3(label), rskOwner, { from: rnsOwner });

    const actualRskOwner = await rns.owner(namehash(label));

    assert.equal(actualRskOwner, rskOwner);
  });

  it('should transfer node ownership', async function () {
    const newRskOwner = accounts[2];

    await rns.setSubnodeOwner(0, web3.sha3(label), rskOwner, { from: rnsOwner });
    await rns.setOwner(namehash(label), newRskOwner, {from: rskOwner });

    const actualRskOwner = await rns.owner(namehash(label));

    assert.equal(actualRskOwner, newRskOwner);
  });
});
