// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0;

/** 
 * @title Ballot
 * @dev Implements voting process along with vote delegation
 */
contract Ballot {
   
    struct Voter {
        bool voted;  // if true, that person already voted
        uint vote;   // index of the voted proposal
    }

    struct Proposal {
        // If you can limit the length to a certain number of bytes, 
        // always use one of bytes1 to bytes32 because they are much cheaper
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }
    
    string public name;
    
    bool public closed;

    address public chairperson;

    mapping(address => Voter) public voters;

    Proposal[] public proposals;
    
    bytes32[] public rawProposals;

    /** 
     * @dev Create a new ballot to choose one of 'proposalNames'.
     * @param proposalNames names of proposals
     */
    constructor(string memory _name, bytes32[] memory proposalNames) public {
        chairperson = msg.sender;
        closed = false;
        name = _name;
        rawProposals = proposalNames;

        for (uint i = 0; i < proposalNames.length; i++) {
            // 'Proposal({...})' creates a temporary
            // Proposal object and 'proposals.push(...)'
            // appends it to the end of 'proposals'.
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    /**
     * @dev Give your vote (including votes delegated to you) to proposal 'proposals[proposal].name'.
     * @param proposal index of proposal in the proposals array
     */
    function vote(uint proposal) public {
        Voter storage sender = voters[msg.sender];
        require(!closed, "the ballot is already closed.");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposal;

        // If 'proposal' is out of the range of the array,
        // this will throw automatically and revert all
        // changes.
        proposals[proposal].voteCount += 1;
    }

    /** 
     * @dev Computes the winning proposal taking all previous votes into account.
     * @return winningProposal_ index of winning proposal in the proposals array
     */
    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    /** 
     * @dev Calls winningProposal() function to get the index of the winner contained in the proposals array and then
     * @return winnerName_ the name of the winner
     */
    function winnerName() public view
            returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }
    
    /**
    *@dev Call this function to list all proposals at once
    */
    function allProposalsCount() public view returns(uint count){
        count = proposals.length;
    }
    
    /**
    *@dev Call this function to set this ballot's Chairman
    */
    function setChairman(address _chairman) external {
        chairperson = _chairman;
    }
    
    /**
    *@dev Call this function to close this ballot
    */
    function closeBallot() public {
        require(chairperson == msg.sender, "only the chairman can close the ballot.");
        closed = true;
    }
    
    function info() public view returns (string memory name_, address chairman_, bool closed_, bytes32 winner_, bytes32[] memory proposals_) {
        name_ = name;
        chairman_ = chairperson;
        closed_ = closed;
        winner_ = winnerName();
        proposals_ = rawProposals;
    }
}
