var HDWalletProvider = require("truffle-hdwallet-provider");
const result = require('dotenv').config(); // 默认读取项目根目录下的.env文件,用process.env.调用
if (result.error) {
    throw result.error;
}
console.log(result.parsed);

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // for more about customizing your Truffle configuration!
    networks: {
        rinkeby: {
            provider: function() {
                // 定义以太坊节点 https://ropsten.infura.io/your-api-key
                return new HDWalletProvider(process.env.mnemonic,
                    "https://rinkeby.infura.io/v3/319440ca36ca47bbacfb060a989ed44e");
            },
            network_id: 4
        }
        // development: {
        //   host: "127.0.0.1",
        //   port: 7545,
        //   network_id: "*" // Match any network id
        // },
        // develop: {
        //   port: 8545
        // }
    }
};