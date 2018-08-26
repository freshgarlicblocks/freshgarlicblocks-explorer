(function (ns) {

    ns.grlc.service('coins', function (coinprice) {
        var coins = this;

        this.GRLC = {
            'name':         'Garlicoin',
            'ticker':       'GRLC',
            'logo':         'https://garlicoin.io/static/logo.040b5384.png',
            'api':          '/api/grlc',
            'blockTime':    41,
            'blockReward':  50,
            'price':        {
                'getPriceInSats': function () {
                    return coinprice.cachedPrice(coins.GRLC, '_sats', function () {
                        return coinprice.getCoinFalconPriceInSats('GRLC-BTC');
                    });
                },
                'getPriceInUSD': function () {
                    return coinprice.cachedPrice(coins.GRLC, '_usd', function () {
                        return coinprice.convertSatsToUSD(coins.GRLC.price.getPriceInSats);
                    });
                }
            }
        };
    });

    ns.tux.service('coins', function (coinprice) {
        var coins = this;

        this.TUX = {
            'name':         'Tuxcoin',
            'ticker':       'TUX',
            'logo':         'https://tuxcoin.io/wp-content/uploads/2018/08/NEW-logo.png',
            'api':          '/api/tux',
            'blockTime':    61,
            'blockReward':  69,
            'price':        {
                'getPriceInSats': function () {
                    return coinprice.cachedPrice(coins.TUX, '_sats', function () {
                        return coinprice.getCrex24PriceInSats('BTC_TUX');
                    });
                },
                'getPriceInUSD': function () {
                    return coinprice.cachedPrice(coins.TUX, '_usd', function () {
                        return coinprice.convertSatsToUSD(coins.TUX.price.getPriceInSats);
                    });
                }
            }
        };
    });

})(explorer);
