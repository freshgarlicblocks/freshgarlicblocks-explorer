(function (ns) {

    var streams = {};
    var subscribers = [];

    var receive = function (endpoint, rawdata) {
        $.each(subscribers, function (_, subscriber) {
            var message = JSON.parse(rawdata);
            if (subscriber.endpoint == endpoint && $.inArray(message.channel, subscriber.channels) > -1) {
                subscriber.handler(message.event, message.data, message.channel);
            }
        });
    };

    var streamListen = function (endpoint, channels, cb) {
        if (streams[endpoint] == null) {
            streams[endpoint] = new EventSource(endpoint);
            streams[endpoint].onmessage = function (event) {
                receive(endpoint, event.data);
            };
        }

        subscribers.push({ 'endpoint': endpoint, 'channels': channels, 'handler': cb });
    };

    ns.grlc.service('stream', function () {
        this.listen = streamListen;
    });
    ns.tux.service('stream', function () {
        this.listen = streamListen;
    });
})(explorer);
