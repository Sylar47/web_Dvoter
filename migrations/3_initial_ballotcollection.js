var BallotCollection = artifacts.require("../contracts/BallotCollection.sol");

module.exports = function(deployer) {
    deployer.deploy(BallotCollection);
};