(function (ns) {

    var getCoinFalconPriceInSats = function (marketName, $http) {
        return new Promise(function (resolve) {
            $http.get('https://coinfalcon.com/api/v1/markets/').then(function (response) {
                resolve(Math.round($.grep(response.data.data, function (market) {
                    return market.name == marketName;
                })[0].last_price * 100000000));
            });
        });
    };

    var getCrex24PriceInSats = function (marketName, $http) {
        return new Promise(function (resolve) {
            $http.get('https://api.crex24.com/CryptoExchangeService/BotPublic/ReturnTicker').then(function (response) {
                resolve(Math.round($.grep(response.data.Tickers, function (market) {
                    return market.PairName == marketName;
                })[0].Last * 100000000));
            });
        });
    };

    var getBTCPrice = function ($http) {
        return new Promise(function (resolve) {
            $http.get('https://api.coinmarketcap.com/v2/ticker/?start=1&limit=1').then(function (response) {
                resolve(response.data.data['1'].quotes.USD.price);
            });
        });
    };

    var convertSatsToUSD = function (satsPromiseGenerator, $this) {
        return new Promise(function (resolve) {
            satsPromiseGenerator().then(function (priceInSats) {
                $this.getBTCPrice().then(function (btcPriceInUSD) {
                    resolve(Math.round(priceInSats / 10000 * btcPriceInUSD) / 10000);
                });
            });
        });
    };

    var cachedPrice = function (container, cachename, promiseGenerator) {
        return new Promise(function (resolve) {
            if (container.price[cachename] != null) {
                resolve(container.price[cachename]);
            } else {
                promiseGenerator().then(function (value) {
                    container.price[cachename] = value;
                    resolve(value);
                });
            }
        });
    };

    ns.grlc.service('coinprice', function ($http) {
        var $this = this;

        this.cachedPrice = cachedPrice;

        this.getCoinFalconPriceInSats = function (marketName) {
            return getCoinFalconPriceInSats(marketName, $http);
        };

        this.getCrex24PriceInSats = function (marketName) {
            return getCrex24PriceInSats(marketName, $http);
        };

        this.getBTCPrice = function () {
            return getBTCPrice($http);
        };

        this.convertSatsToUSD = function (satsPromiseGenerator) {
            return convertSatsToUSD(satsPromiseGenerator, $this);
        };
    });

    ns.tux.service('coinprice', function ($http) {
        var $this = this;

        this.cachedPrice = cachedPrice;

        this.getCoinFalconPriceInSats = function (marketName) {
            return getCoinFalconPriceInSats(marketName, $http);
        };

        this.getCrex24PriceInSats = function (marketName) {
            return getCrex24PriceInSats(marketName, $http);
        };

        this.getBTCPrice = function () {
            return getBTCPrice($http);
        };

        this.convertSatsToUSD = function (satsPromiseGenerator) {
            return convertSatsToUSD(satsPromiseGenerator, $this);
        };
    });
})(explorer);
