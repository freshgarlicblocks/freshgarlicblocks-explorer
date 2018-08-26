(function (ns) {
    var formatInt = function (i, digits) {
        if (digits < 1)
            return '';
        return ('0000000000000000' + i).slice(-digits);
    };

    var processSize = function (size) {
        size = { 'raw': size, 'formatted': size };

        var suffix = '';
        if (size.raw >= 1e6) {
            size.formatted = Math.round(size.raw / 10000) / 100;
            size.formatted += ' MB';
        } else if (size.raw >= 1e3) {
            size.formatted = Math.round(size.raw / 10) / 100;
            size.formatted += ' kB';
        } else {
            size.formatted = size.raw;
        }

        return size;
    };

    var processTimestamp = function (secondsSinceEpoch) {
        var date = new Date(0);
        var now = new Date(0);

        date.setUTCSeconds(secondsSinceEpoch);
        now.setUTCSeconds(Date.now() / 1000);

        var formattedSting = '';

        if (date.getFullYear() != now.getFullYear() || date.getMonth() != now.getMonth() || date.getDate() != now.getDate()) {
            formattedSting = formatInt(date.getDate(), 2) + '-' + formatInt(date.getMonth() + 1, 2) + '-' + date.getFullYear() + ' ';
        }

        formattedSting += formatInt(date.getHours(), 2) + ':' + formatInt(date.getMinutes(), 2) + ':' + formatInt(date.getSeconds(), 2);

        return formattedSting;
    };

    var processTimeDifference = function (seconds) {
        var stripS = function (s) {
            if (s.slice(0, 2) == '1 ' && s.slice(-1) == 's')
                return s.slice(0, s.length - 1);
            return s;
        };

        if (seconds >= 604800)
            return stripS(Math.floor(seconds / 604800) + ' weeks');
        if (seconds >= 86400)
            return stripS(Math.floor(seconds / 86400) + ' days');
        if (seconds >= 3600)
            return stripS(Math.floor(seconds / 3600) + ' hours');
        if (seconds >= 60)
            return stripS(Math.floor(seconds / 60) + ' minutes');
        return stripS(seconds + ' seconds');
    };

    var processCoinAmount = function (amount) {
        var amount = { 'raw': Math.round(amount * 100000000) / 100000000 };

        amount.major = Math.floor(amount.raw);
        amount.minor = formatInt(Math.round((amount.raw - amount.major) * 100000000), 8);

        amount.minor_nonzero = amount.minor.replace(/0+$/, '');
        var trailingZeros = 8 - amount.minor_nonzero.length;

        amount.minor_zero = formatInt(0, trailingZeros);

        return amount;
    };

    var processNetworkStats = function (stats) {
        stats.transactions.totalvalue = Math.floor(stats.transactions.totalvalue);

        return stats;
    };

    var processTransaction = function (transaction, block) {
        if (block != null) {
            if (transaction.firstseen == null) {
                transaction.confirmationtime = '-';
            } else {
                transaction.confirmationtime = processTimeDifference((block.firstseen != null ? block.firstseen : block.timestamp) - transaction.firstseen);
            }
        }

        transaction.shortenedtxid = transaction.txid.slice(0, 8) + '...' + transaction.txid.slice(-8);
        transaction.firstseen = processTimestamp(transaction.firstseen);
        transaction.totalvalue = processCoinAmount(transaction.totalvalue);
        transaction.fee = processCoinAmount(transaction.fee);
        transaction.size = processSize(transaction.size);

        return transaction;
    };

    var processTransactions = function (transactions, block, $this) {
        $.each(transactions, function (_, transaction) {
            $this.processTransaction(transaction, block);
        });

        return transactions;
    };

    var processBlock = function (block, coinDetails, $this) {
        if (coinDetails != null) {
            block.adjustedDifficulty = Math.round((block.difficulty * coinDetails.blockTime / 60 / coinDetails.blockReward * 50) * 1000) / 1000;
        }

        if (block.transactions['href'] == null) {
            $this.processTransactions(block.transactions, block);

            block.totalvalue = 0.0;
            block.totalfee = 0.0;

            $.each(block.transactions, function (_, tx) {
                block.totalvalue += tx.totalvalue.raw;
                block.totalfee += tx.fee.raw;
            });

            block.totalvalue = processCoinAmount(block.totalvalue);
            block.totalfee = processCoinAmount(block.totalfee);
        }

        if (block.relayedby == null)
            block.relayedby = '-';

        if (block.firstseen == null)
            block.firstseen = '-';
        else
            block.firstseen = processTimestamp(block.firstseen);

        block.timestamp = processTimestamp(block.timestamp);
        block.size = processSize(block.size);

        if (block.miner.name != null &&
            block.miner.name.split(' ').length == 3 &&
            block.miner.name.split(' ')[1].slice(0, 1) == '(' &&
            block.miner.name.split(' ')[2].slice(-1) == ')')
        {
            block.miner.name = block.miner.name.split(' ');
            block.miner.name = block.miner.name[1] + ' ' + block.miner.name[2];
            block.miner.name = block.miner.name.slice(1, block.miner.name.length - 1);
        }

        return block;
    };

    var processBlocks = function (blocks, coinDetails, $this) {
        $.each(blocks, function (_, block) {
            $this.processBlock(block, coinDetails);
        });

        return blocks;
    };

    ns.grlc.service('preprocessor', function () {
        var $this = this;

        this.processNetworkStats = processNetworkStats;
        this.processTransaction = processTransaction;

        this.processTransactions = function (transactions, block) {
            return processTransactions(transactions, block, $this);
        };
        this.processBlock = function (block, coinDetails) {
            return processBlock(block, coinDetails, $this);
        };
        this.processBlocks = function (blocks, coinDetails) {
            return processBlocks(blocks, coinDetails, $this);
        };
    });

    ns.tux.service('preprocessor', function () {
        var $this = this;

        this.processNetworkStats = processNetworkStats;
        this.processTransaction = processTransaction;

        this.processTransactions = function (transactions, block) {
            return processTransactions(transactions, block, $this);
        };
        this.processBlock = function (block, coinDetails) {
            return processBlock(block, coinDetails, $this);
        };
        this.processBlocks = function (blocks, coinDetails) {
            return processBlocks(blocks, coinDetails, $this);
        };
    });
})(explorer);
