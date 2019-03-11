pragma solidity >=0.4.21 <0.6.0;

import "./rns/RNS.sol";
import "./tokens/ERC677TokenContract.sol";

contract SubdomainRegistrar {
    address public owner;
    RNS public rns;
    bytes32 public rootNode;
    ERC677TokenContract public tokenContract;
    uint public subdomainValue;

    bytes4 constant SIGN_REGISTER_SUBDOMAIN = 0x5fa0aca4; // sha3('registerSubdomainWithToken(address,uint256,bytes32)')

    /**
     * @dev Constructs a new Subdomain Registrar, with the provided address as the owner of the
     * Registrar and root node from which subnodes inherit.
     *
     * @param _rns The address of the RNS.
     * @param _rootNode The hash of the root node.
     */
    constructor(RNS _rns, bytes32 _rootNode, ERC677TokenContract _tokenContract, uint _subdomainValue) public {
        owner = msg.sender;
        rns = _rns;
        rootNode = _rootNode;
        tokenContract = _tokenContract;
        subdomainValue = _subdomainValue;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Sender not owner."
        );
        _;
    }

    /**
     * @dev Buy a subdomain
     *
     * @param _hash The hash of the label specifying the subnode
     */
    function registerSubdomain(bytes32 _hash) public {
        require(
            tokenContract.transferFrom(msg.sender, address(this), subdomainValue),
            "Token contract approval required"
        );

        registerSubdomainAfterTransfer(_hash, msg.sender);
    }

    /**
     * @dev Method to be called through a dynamic invocation from an ERC677 token contract
     *
     * @param _from Address sending the tokens as well as the new subdomain owner
     * @param _tokenQuantity Amount in tokens received throuh the transference
     * @param _hash The hash of the label specifying the subnode
    **/
    function registerSubdomainWithToken(address _from, uint256 _tokenQuantity, bytes32 _hash) public {
        require(
            _tokenQuantity == subdomainValue,
            "Subdomain value is not the specified"
        );

        registerSubdomainAfterTransfer(_hash, _from);
    }

    /**
     * @dev Registers a subnode under root node in RNS Registry.
     *
     * @param _hash The hash of the label specifying the subnode
     */
    function registerSubdomainAfterTransfer(bytes32 _hash, address _owner) private {
        address hashOwner = rns.owner(_hash);
        if (hashOwner != address(0)) {
            revert("Subdomain already has owner");
        }

        rns.setSubnodeOwner(rootNode, _hash, _owner);
    }

    /**
     * @dev Transfer collected funds to owner.
     */
    function retriveTokens() public {
        uint amount = tokenContract.balanceOf(address(this));
        require(
            tokenContract.transfer(owner, amount),
            "Token contract approval required"
        );
    }

    /**
     * @dev Fallback function to be called when the contract receives a transference through an ERC677 contract
     *
     * Functions supported:
     * - registerSubdomainWithToken (signature 0x5fa0aca4) with a 32 byte parameter (hash to register)
     *
     * @param _from Address which sent the tokens
     * @param _value Amount of tokens sent
     * @param _data Byte array with information of which function to call and the parameters used for the invocation
    **/
    function tokenFallback(address _from, uint256 _value, bytes _data) public returns (bool) {
        if (_data.length < 4) return true;

        require(
            msg.sender == address(tokenContract),
            "Token fallback sender must be specified token"
        );

        bytes4 signature = bytes4(uint32(_data[3]) + (uint32(_data[2]) << 8) + (uint32(_data[1]) << 16) + (uint32(_data[0]) << 24));

        if (signature == SIGN_REGISTER_SUBDOMAIN) {
            bytes32 hash = bytesToBytes32(_data, 4);

            registerSubdomainWithToken(_from, _value, hash);
        } else {
            revert("No method with given signature");
        }

        return true;
    }

    /**
     * @dev Given a byte array and a given offset, extract the following 32 bytes into an array
     *
     * from https://ethereum.stackexchange.com/questions/7702/how-to-convert-byte-array-to-bytes32-in-solidity
    **/
    function bytesToBytes32(bytes _b, uint _offset) private pure returns (bytes32) {
        bytes32 out;

        for (uint i = 0; i < 32; i++) {
            out |= bytes32(_b[_offset + i] & 0xFF) >> (i * 8);
        }

        return out;
    }
}
