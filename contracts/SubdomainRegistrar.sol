pragma solidity >=0.4.21 <0.6.0;


contract SubdomainRegistrar {
    address public owner;
    address public rns;
    bytes32 public rootNode;

    /**
     * @dev Constructs a new Subdomain Registrar, with the provided address as the owner of the
     * Registrar and root node from which subnodes inherit.
     *
     * @param _rns The address of the RNS.
     * @param _rootNode The hash of the root node.
     */
    constructor(address _rns, bytes32 _rootNode) public {
        owner = msg.sender;
        rns = _rns;
        rootNode = _rootNode;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Sender not owner."
        );
        _;
    }

    /**
     * @dev Transfers the root node ownership in RNS Registry to a given account.
     *
     * @param _owner The new root node owner
     */
    function transferRegistrar (address _owner) public onlyOwner() {
        rns.call(abi.encodeWithSignature(
            "setOwner(bytes32,address)",
            rootNode,
            _owner
        ));
    }
}