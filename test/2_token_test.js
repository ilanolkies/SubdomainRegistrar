const assert = require('assert');

const ERC677TokenContract = artifacts.require('ERC677TokenContract.sol');
const ContractReceiver = artifacts.require('ContractReceiver.sol');

contract('ERC677TokenContract', function (accounts) {
  var rif;

  const rifOwner = accounts[0];
  const TOTAL_SUPPLY = 1000e18;

  beforeEach(async function () {
    rif = await ERC677TokenContract.new(rifOwner, TOTAL_SUPPLY, { form: rifOwner });
  });

  it('should set balance to initial account', async function () {
    const balance = await rif.balanceOf(rifOwner);

    assert.equal(balance, TOTAL_SUPPLY);
  });

  it('should transfer and call', async function () {
    var contractReceiver = await ContractReceiver.new();
    const amount = 1e17;

    await rif.transferAndCall(contractReceiver.address, amount, 0, { from: rifOwner });

    const balance = await rif.balanceOf(contractReceiver.address);

    assert.equal(balance, amount);
  });
});
