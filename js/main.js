// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};


var explorer = (function () {
    var ns = {};

    ns.grlc = angular.module('coin-grlc', []);
    ns.tux = angular.module('coin-tux', []);

    var yesterday = function () {
        return Math.floor(Date.now() / 1000 - 86400);
    }

    var loadPoolStats = function ($scope, $http) {
        $http.get($scope.coin.api + '/poolstats/?since=' + yesterday()).then(function (response) {
            var calcPoolsRequiredForBlocks = function (target, miningstats) {
                var reached = 0;
                var amount = 0;

                for (i in miningstats) {
                    var poolinfo = miningstats[i];

                    amount++;
                    reached += poolinfo.amountmined;

                    if (reached > target)
                        break;
                }

                return amount;
            };

            var totalblocks = 0;
            var responseData = response.data.sort(function (a, b) {
                return b.amountmined - a.amountmined;
            });

            for (i in responseData) {
                if (typeof responseData[i] === 'function')
                    continue;

                totalblocks += responseData[i].amountmined;
            }

            $scope.pools.hashratecontrol.numberrequiredfor50percent = calcPoolsRequiredForBlocks(Math.ceil(totalblocks / 2), responseData);
            $scope.pools.hashratecontrol.numberrequiredfor90percent = calcPoolsRequiredForBlocks(Math.ceil(totalblocks * 9 / 10), responseData);
        });
    };

    var loadBlockTimeStats = function ($scope, $http) {
        $http.get($scope.coin.api + '/blocks/?start=-5000&limit=1').then(function (response) {
            $scope.stats.blocktime.last5000blocks = Math.round(((Date.now() / 1000) - response.data[0].timestamp) / 50) / 100;
        });
        $http.get($scope.coin.api + '/blocks/?start=-50000&limit=1').then(function (response) {
            $scope.stats.blocktime.last50000blocks = Math.round(((Date.now() / 1000) - response.data[0].timestamp) / 500) / 100;
        });
    };

    var loadDetails = function ($scope, $http, preprocessor) {
        loadBlockTimeStats($scope, $http);
        loadPoolStats($scope, $http);

        $http.get($scope.coin.api + '/networkstats/?since=' + yesterday()).then(function (response) {
            $scope.stats.daily = preprocessor.processNetworkStats(response.data);

            $scope.coin.price.getPriceInSats().then(function (valueInSats) {
                $scope.price.sats = valueInSats;

                $scope.coin.price.getPriceInUSD().then(function (valueInUSD) {
                    $scope.price.usd = valueInUSD;
                    $scope.price.usd_cents = Math.round(valueInUSD * 10000) / 100;

                    $scope.stats.daily.miningreward = {
                        'usd': Math.round($scope.stats.daily.blocks.amount * $scope.coin.blockReward * $scope.price.usd * 100) / 100
                    };
                });
            });
        });

        $http.get($scope.coin.api + '/networkstats/?since=0').then(function (response) {
            $scope.stats.all = preprocessor.processNetworkStats(response.data);
        });
    };

    var summaryController = function ($scope, $http, coins, preprocessor, stream) {
        $scope.chain = {};
        $scope.stats = { 'daily': {}, 'all': {}, 'blocktime': {} };
        $scope.price = {};
        $scope.pools = { 'hashratecontrol': {} };

        $scope.moreDetails = function () {
            $scope.showMoreDetails = true;
            loadDetails($scope, $http, preprocessor);
        };

        $http.get($scope.coin.api + '/blocks/?start=-1&limit=1').then(function (response) {
            $scope.chain.lastblock = preprocessor.processBlock(response.data[0], $scope.coin);
        });

        stream.listen($scope.coin.api + '/events/subscribe?channels=blocks,transactions,keepalive', [ 'blocks' ], function (event, message, channel) {
            $scope.$apply(function () {
                if (event == 'newblock') {
                    $scope.chain.lastblock = preprocessor.processBlock(message, $scope.coin);
                }
            });
        });
    };

    var mempoolController = function ($scope, $http, coins, preprocessor, stream) {
        $http.get($scope.coin.api + '/transactions/?confirmed=false').then(function (response) {
            response.data.reverse();
            $scope.transactions = preprocessor.processTransactions(response.data);
        });

        stream.listen($scope.coin.api + '/events/subscribe?channels=blocks,transactions,keepalive', [ 'blocks', 'transactions' ], function (event, message, channel) {
            $scope.$apply(function () {
                if (event == 'newtx') {
                    if (message.confirmed)
                        return;

                    for (var i in $scope.transactions) {
                        if ($scope.transactions[i].txid == message.txid)
                            return;
                    }

                    $scope.transactions.push(preprocessor.processTransaction(message));
                } else if (event == 'newblock') {
                    $.each(message.transactions, function (_, tx) {
                        for (var i in $scope.transactions) {
                            if ($scope.transactions[i].txid == tx.txid) {
                                $scope.transactions.remove(i);
                                break;
                            }
                        }
                    });
                }
            });
        });
    };

    var blocksController = function ($scope, $http, coins, preprocessor, stream) {
        $http.get($scope.coin.api + '/blocks/?expand=miner,transactions').then(function (response) {
            $scope.blocks = preprocessor.processBlocks(response.data);
            $scope.blocks.reverse();
            $.each($scope.blocks, function (_, block) {
                block.transactions.reverse();
            });
        });

        stream.listen($scope.coin.api + '/events/subscribe?channels=blocks,transactions,keepalive', [ 'blocks' ], function (event, message, channel) {
            $scope.$apply(function () {
                if (event == 'newblock') {
                    message.transactions.reverse();
                    $scope.blocks.unshift(preprocessor.processBlock(message));
                }
            });
        });
    };

    ns.grlc.controller('summary', function ($scope, $http, coins, preprocessor, stream) {
        $scope.coin = coins.GRLC;
        summaryController($scope, $http, coins, preprocessor, stream);
    });
    ns.grlc.controller('mempool', function ($scope, $http, coins, preprocessor, stream) {
        $scope.coin = coins.GRLC;
        mempoolController($scope, $http, coins, preprocessor, stream);
    });
    ns.grlc.controller('blocks', function ($scope, $http, coins, preprocessor, stream) {
        $scope.coin = coins.GRLC;
        blocksController($scope, $http, coins, preprocessor, stream);
    });

    ns.tux.controller('summary', function ($scope, $http, coins, preprocessor, stream) {
        $scope.coin = coins.TUX;
        summaryController($scope, $http, coins, preprocessor, stream);
    });
    ns.tux.controller('mempool', function ($scope, $http, coins, preprocessor, stream) {
        $scope.coin = coins.TUX;
        mempoolController($scope, $http, coins, preprocessor, stream);
    });
    ns.tux.controller('blocks', function ($scope, $http, coins, preprocessor, stream) {
        $scope.coin = coins.TUX;
        blocksController($scope, $http, coins, preprocessor, stream);
    });

    ns.init = function () {
        angular.bootstrap($('.tux')[0], ['coin-tux']);
    };

    return ns;
})();
