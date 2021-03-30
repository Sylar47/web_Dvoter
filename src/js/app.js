App = {
    web3Provider: null,
    contracts: {},

    initWeb3: async function() {
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider(
                'https://rinkeby.infura.io/v3/319440ca36ca47bbacfb060a989ed44e');
        }
        web3 = new Web3(App.web3Provider);
        web3.eth.defaultAccount = web3.eth.accounts[0];
    },

    initHelloWorld: function() {
        this.initWeb3();
        $.getJSON('HelloWorld.json', function(data) {
            console.log(data);
            console.log(data.abi);
            console.log(data.bytecode);
            // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
            var HelloWorld = data;
            App.contracts.HelloWorld = TruffleContract(HelloWorld);

            // Set the provider for our contract
            App.contracts.HelloWorld.setProvider(App.web3Provider);
            var HelloWorldinstance;
            App.contracts.HelloWorld.deployed().then(function(instance) {
                HelloWorldinstance = instance;
                return HelloWorldinstance.sayHelloWorld.call().then(console.log);
            }).catch(function(err) {
                console.log(err.message);
            });
        });
        console.log('inited HelloWorld Contract');
    },

    initIndex: function() {
        this.initWeb3();

        $.getJSON('BallotCollection.json', function(data) {
            App.contracts.BallotCollection = TruffleContract(data);
            App.contracts.BallotCollection.setProvider(App.web3Provider);
            App.contracts.BallotCollection.at("0x7a826ddaC05A194155C3Bc02F91F6A5aAf2Bc6C6").getAllBallots.call().then(function(result) {
                $.getJSON('Ballot.json', function(data) {
                    App.contracts.Ballot = TruffleContract(data);
                    App.contracts.Ballot.setProvider(App.web3Provider);
                    App.renderBallot(result, 0);
                });
                console.log(result);
            }).catch(function(error) {
                console.log(error);
            });
        });
    },

    renderBallot: function(addresses, i) {
        if (i < addresses.length) {
            var ballotContract = App.contracts.Ballot.at(addresses[i]);
            ballotContract.info().then(function(result) {
                var dom = '<tr>';
                dom += '<td>' + result[0] + '</td>';
                dom += '<td>' + result[1] + '</td>';
                dom += '<td>' + App.byte32ToString(result[3]) + '</td>';
                if (result[2]) {
                    dom += '<td>已关闭投票</td>';
                } else {
                    dom += '<td><a href="vote.html?address=' + addresses[i] + '">参与投票</a> | <a href="javascript: void(0);" onclick="App.closeBallot(\'' + addresses[i] + '\');">关闭投票</a> | <a href="voteInfo.html?address=' + addresses[i] + '">投票详情</a></td>';
                }
                dom += '</tr>';
                $(dom).appendTo("#ballot_tb tbody");

                App.renderBallot(addresses, i + 1);
            }).catch(function(error) {
                console.log(error);
            });
        }
    },

    initAddBallot: function() {
        this.initWeb3();

        $.getJSON('BallotCollection.json', function(data) {
            App.contracts.BallotCollection = TruffleContract(data);
            App.contracts.BallotCollection.setProvider(App.web3Provider);
            console.log("BallotCollection inited");
        });
    },

    initInfo: function() {
        this.initWeb3();
        var labels = [];
        var datas = [];
        var name = "";

        $.getJSON('Ballot.json', function(data) {
            App.contracts.Ballot = TruffleContract(data);
            App.contracts.Ballot.setProvider(App.web3Provider);

            App.contracts.Ballot.at(App.getQueryVariable('address')).then(function(instance) {
                ballot = instance;
                ballot.allProposalsCount.call().then(function(info) {
                    for (let index = 0; index < parseInt(info.c[0]); index++) {
                        ballot.proposals.call(index).then(function(content) {
                            datas[index] = parseInt(content[1].c[0]);
                        });
                    }
                    console.log(datas);
                });

                return ballot.info();
            }).then(function(result) {
                console.log(result);
                name = result[0];
                var dom = '<h2 style="margin-bottom:70px;margin-top:50px;">' + "投票活动名称：" + result[0] + '</h2>';
                dom += '<h3>' + "投票发起人：" + '</h3>';
                dom += '<h4 style="margin-bottom:40px;">' + result[1] + '</h4>';
                if (result[2]) {
                    dom += '<h3 style="margin-bottom:40px;">' + "投票是否关闭：是" + '</h3>';
                } else {
                    dom += '<h3 style="margin-bottom:40px;">' + "投票是否关闭：否" + '</h3>';
                }
                dom += '<h3>' + "投票候选项：" + '</h3>';
                for (var i in result[4]) {
                    dom += '<h4 style="padding-left:20px;">' + App.byte32ToString(result[4][i]) + '</h4>';
                    labels.push(App.byte32ToString(result[4][i]).replaceAll(/[^\a-\z\A-\Z0-9\u4E00-\u9FA5]/g, ''));
                }
                console.log(labels);
                dom += '<h3 style="margin-top:40px;">' + "当前优胜项：" + App.byte32ToString(result[3]) + '</h3>';
                $(dom).prependTo("#vote_info");

            }).catch(function(error) {
                console.log(error);
            });
        });
        setTimeout(() => {
            var ctx = document.getElementById("myChart");
            var myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Votes of ' + name,
                        data: datas,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255,99,132,1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
        }, 3000);
    },

    initVote: function() {
        this.initWeb3();

        $.getJSON('Ballot.json', function(data) {
            App.contracts.Ballot = TruffleContract(data);
            App.contracts.Ballot.setProvider(App.web3Provider);

            App.contracts.Ballot.at(App.getQueryVariable('address')).then(function(instance) {
                ballot = instance;

                return ballot.info();
            }).then(function(result) {
                var dom = '<label>' + "投票活动名称：" + result[0] + '</label>';
                for (var i in result[4]) {
                    dom += '<div class="radio" style="padding-left:20px;"><label><input type="radio" name="proposal" value="' + i + '">' + App.byte32ToString(result[4][i]) + '</label></div>';
                }

                $(dom).prependTo("#vote_form");
            }).catch(function(error) {
                console.log(error);
            });
        });
    },

    vote: function(obj) {
        var selected = $(obj).find("input[name=proposal]:checked").val();

        if (selected === undefined) {
            alert('请选择您要投票的选手！');
            return false;
        }

        ballot.vote.sendTransaction(selected).then(function(result) {
            alert('投票成功，谢谢参与！');
        }).catch(function(error) {
            console.log(error);
            alert('您已经参与过投票了！');
        });

        return false;
    },

    addBallotSubmit: function(name, _proposals) {
        var ballotName = name;
        var proposals = _proposals.map(function(proposal) {
            return App.stringToBytes32(proposal);
        });

        App.contracts.BallotCollection.at("0x7a826ddaC05A194155C3Bc02F91F6A5aAf2Bc6C6").then(function(instance) {
            instance.addBallot.sendTransaction(ballotName, proposals, { from: web3.eth.accounts[0] }).then(function(result) {
                console.log("1:" + result);
                // window.location.href = "newVote_next.html";
                alert("投票创建成功，请前往投票列表页面参与投票！");
            }).catch(function(error) {
                console.log(error);
            });
        })
    },

    byte32ToString: function(raw) {
        var nums = [];
        for (var i = 2; i < 66; i += 2) {
            nums.push(parseInt(raw.substr(i, 2), 16));
        }

        return this.toUTF8(nums).substr(1);
    },

    toUTF8: function(bytes) {
        var utf8 = '';
        for (var i = 0; i < bytes.length; i++) {
            var binary = bytes[i].toString(2),
                v = binary.match(/^1+?(?=0)/);

            if (v && binary.length == 8) {
                var bytesLength = v[0].length;
                var store = bytes[i].toString(2).slice(7 - bytesLength);
                for (var st = 1; st < bytesLength; st++) {
                    store += bytes[st + i].toString(2).slice(2);
                }
                utf8 += String.fromCharCode(parseInt(store, 2));
                i += bytesLength - 1;
            } else {
                utf8 += String.fromCharCode(bytes[i]);
            }
        }

        return utf8;
    },

    stringToBytes32: function(raw) {
        var bytes = this.fromUTF8(raw);

        var bytes32 = '0x';
        for (var i in bytes) {
            bytes32 += bytes[i].toString(16);
        }

        while (bytes32.length < 66) {
            bytes32 += '0';
        }

        return bytes32;
    },

    fromUTF8: function(str, isGetBytes) {
        var back = [];
        var byteSize = 0;
        for (var i = 0; i < str.length; i++) {
            var code = str.charCodeAt(i);
            if (0x00 <= code && code <= 0x7f) {
                byteSize += 1;
                back.push(code);
            } else if (0x80 <= code && code <= 0x7ff) {
                byteSize += 2;
                back.push((192 | (31 & (code >> 6))));
                back.push((128 | (63 & code)))
            } else if ((0x800 <= code && code <= 0xd7ff) ||
                (0xe000 <= code && code <= 0xffff)) {
                byteSize += 3;
                back.push((224 | (15 & (code >> 12))));
                back.push((128 | (63 & (code >> 6))));
                back.push((128 | (63 & code)))
            }
        }
        for (i = 0; i < back.length; i++) {
            back[i] &= 0xff;
        }
        if (isGetBytes) {
            return back
        }
        if (byteSize <= 0xff) {
            return [0, byteSize].concat(back);
        } else {
            return [byteSize >> 8, byteSize & 0xff].concat(back);
        }
    },

    closeBallot: function(address) {
        App.contracts.Ballot.at(address).then(function(instance) {
            return instance.closeBallot.sendTransaction();
        }).then(function(result) {
            console.log(result);
        }).catch(function(error) {
            console.log(error);
            alert('只有投票发起者才能关闭投票！');
        });
    },

    getQueryVariable: function(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) { return pair[1]; }
        }

        return (false);
    }
};

$(function() {
    $(window).load(function() {
        App.initWeb3();
    });
});