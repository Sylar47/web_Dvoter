// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0;

import "contracts/Ballot.sol";

contract BallotCollection {
    address[] public ballots;

    function addBallot(string memory name, bytes32[] memory _proposals) public returns(address address_) {
        Ballot ballot = new Ballot(name, _proposals);
        ballot.setChairman(msg.sender);
        address_ = address(ballot);
        ballots.push(address_);
    }

    function getAllBallots() public view returns (address[] memory ballots_) {
        ballots_ = ballots;
    }
}