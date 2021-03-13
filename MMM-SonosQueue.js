/* global Module */
/* Magic Mirror 2
 * Module: MMM-SonosSelect
 *
 * By Brady Snelson
 * 
 * Using code from MMM-Modulebar by Erik Pettersson
 *
 * MIT Licensed.
 */

Module.register("MMM-SonosQueue",{
	
	requiresVersion: "2.1.0",
	
    defaults: {
        maxLength: 10,
        minWidth: "400px",
        minHeight: "50px",
		serverIP: "http://localhost:5005",
        queueUpdateInterval: 5, // 5 seconds
        statusUpdateInterval: 1,
		room: "Living Room",
        updateExternally: true,
        broadcastStatus: false,
    },

    // Define required styles.
	getStyles: function(){
		return ["font-awesome.css", "MMM-SonosQueue.css"];
	},

    start: function() {
        Log.info('Starting module: ' + this.name + ', version ' + this.config.version);
        this.initialized = true;
        this.queue = {}
        this.currentSong = null

        this.scheduleQueueFetch();
        this.sendSocketNotification('UPDATE_STATUS', "test");

        if (!this.updateExternally) {
            this.scheduleDataFetch();
        }
    },

    // Override dom generator.
    getDom: function() {
        if (this.initialized) { // Info saved in the queue object
            return this.renderQueue();
        }
    },

    renderQueue: function() { // Assume all data is updated fully
        var queueList = document.createElement("span");
        queueList.className = "queue-list"
        queueList.id = this.identifier + "_queue";
        queueList.style.flexDirection = "column";

        var length = Math.min(this.config.maxLength, Object.keys(this.queue).length);
        //length = 10; //temp
        for (var i = length; length > 0; length--) {
            var song = this.queue[i];
            queueList.appendChild(this.createQueueItem(song, i))
        }

        return queueList;
    },

    createQueueItem: function(song, num) {
        var item = document.createElement("span");
        item.className = "queue-item";
        item.id = this.identifier + "_song_" + num;
        item.style.borderColor = "white";
		item.style.minWidth = self.config.minWidth;
        item.style.minHeight = self.config.minHeight;

        var albumArt = document.createElement("span");
        albumArt.className = "play-symbol fa fa-pause";

        var textContainer = document.createElement("span");
        textContainer.className = "song-text-container";

        var textSong = document.createElement("span");
        textSong.className = "song-text-name"
        textSong.innerHTML = "song name"
        
        var textArtist = document.createElement("span");
        textArtist.className = "song-text-artist"
        textArtist.innerHTML = "artist name"

        textContainer.style.flexDirection = "column"
        textContainer.appendChild(textSong);
        textContainer.appendChild(textArtist);



        item.style.flexDirection = "row";
        item.appendChild(albumArt);
        item.appendChild(textContainer);

        return item;
    },

    processData: function(data) {
        for (var i in data) {
            var group = data[i];
            var members = group.members;
            for (var j in members) {
                var member = members[j]
                for (var num in this.config.buttons) { // Look through each room specified in config
                    var buttonRoomName = this.config.buttons[num].room;
                    if (buttonRoomName == member.roomName) { // Find the button that matches this member
                        if (member.state.playbackState == "PLAYING") {
                            this.rooms[num].playing = true;
                        } else {
                            this.rooms[num].playing = false;
                        }
                    }
                }
            }
        }
        this.updateDom();
    },

    setCoordinator: function() {
        var coordinatorFound = false;
        for (var num in this.rooms) {
            var room = this.rooms[num];
            if (room.playing) {
                this.coordinator = num;
                coordinatorFound = true;
            }
        }

        if (!coordinatorFound) {
            this.coordinator = null;
        }
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "SONOS_STATUS") {
            this.processStatus(payload);
        } else if (notification == "SONOS_QUEUE") {
            this.queue = payload;
        }
    },

    scheduleQueueFetch() {
        // Update current song every x seconds
        var self = this;
        setInterval(() => {
            console.log("schedule triggered")
            var url = self.config.serverIP + "/" + self.config.room + "/queue";
            this.sendSocketNotification('UPDATE_QUEUE', url);
        }, this.config.queueUpdateInterval * 1000);
    },

    scheduleDataFetch() {
        // Update current song every x seconds
        var self = this;
        setInterval(() => {
            var url = self.config.serverIP + "/" + self.config.room + "/status";
            this.sendSocketNotification('UPDATE_STATUS', url);
        }, this.config.statusUpdateInterval * 1000);
    }
});	


