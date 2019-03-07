pragma solidity >=0.4.21 <0.6.0;

contract SubdomainRegistrar {
    address public owner;

    constructor() public {
        owner = msg.sender;
    }
}