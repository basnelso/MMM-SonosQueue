var NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({

    start: function() {
        console.log('Starting node_helper for module [' + this.name + ']');
    },

    getStatus(url) {
        var self = this;
        request(url, {method: 'GET'}, function(err, res, body) {
            if ((err) || (res.statusCode !== 200)) {
                console.log("MMM-SonosQueue: GET request failed for sonos status.")
                self.sendSocketNotification('SONOS_DATA_ERR', data);
            } else {
                var data = JSON.parse(body);
                self.sendSocketNotification('SONOS_ZONE_DATA', data);
            }
        });    
    },

    getQueue(url) {
        var self = this;
        request(url, {method: 'GET'}, function(err, res, body) {
            if ((err) || (res.statusCode !== 200)) {
                console.log("MMM-SonosQueue: GET request failed for sonos queue.")
                self.sendSocketNotification('SONOS_DATA_ERR', data);
            } else {
                var data = JSON.parse(body);
                self.sendSocketNotification('SONOS_QUEUE', data);
            }

        });   
    },

    trackSeek(url) {
        request.get(url);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "UPDATE_STATUS") {
            this.getStatus(payload);
        } else if (notification == "UPDATE_QUEUE") {
            this.getQueue(payload);
        } else if (notification == "TRACK_SEEK") {
            this.trackSeek(payload);
        }
    }
});