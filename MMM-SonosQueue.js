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
		serverIP: "http://localhost:5005",
        queueUpdateInterval: 5, // 5 seconds
        statusUpdateInterval: 2,
		room: "Bathroom",
        updateExternally: false,
        broadcastStatus: false,
    },

    // Define required styles.
	getStyles: function(){
		return ["font-awesome.css", "MMM-SonosQueue.css"];
	},

    start: function() {
        Log.info('Starting module: ' + this.name + ', version ' + this.config.version);
        this.queue = {}
        this.currentSong = null
        this.timeout = 0;

        this.queueFetch();
        this.dataFetch();
        this.initialized = true;


        this.scheduleQueueFetch();
        if (!this.config.updateExternally) {
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
        let maxTimeout = (1000 * 60 * 10) / this.config.queueUpdateInterval;
        if (this.timeout > maxTimeout) {
            return document.createElement("div");
        }

        var queueList = document.createElement("span");
        queueList.className = "queue-list"
        queueList.id = this.identifier + "_queue";
        queueList.style.flexDirection = "column";

        // Find currently playing song in queue
        var currentSongPos = 0;
        if (this.currentSong != null) {
            for (var i = 0; i < Object.keys(this.queue).length; i++) {
                var song = this.queue[i]
                if (song.title == this.currentSong) {
                    currentSongPos = i;
                    break;
                }
            }
        }

        let numSongsRemaining = Object.keys(this.queue).length - currentSongPos - 1;
        var length = Math.min(this.config.maxLength, numSongsRemaining);
        for (var i = currentSongPos + length; i > currentSongPos; i--) {
            var song = this.queue[i];
            queueList.appendChild(this.createQueueItem(song, i))
        }

        return queueList;
    },

    createQueueItem: function(song, num) {
        var item = document.createElement("span");
        item.className = "queue-item";
        item.id = this.identifier + "_song_" + num;

        var albumArt = document.createElement("span");
        albumArt.className = "play-symbol fa fa-pause";

        var textContainer = document.createElement("span");
        textContainer.className = "song-text-container";

        var textSong = document.createElement("span");
        textSong.className = "song-text-name";
        textSong.innerHTML = song.title;
        
        var textArtist = document.createElement("span");
        textArtist.className = "song-text-artist";
        textArtist.innerHTML = song.artist;

        textContainer.style.flexDirection = "column"
        textContainer.appendChild(textSong);
        textContainer.appendChild(textArtist);



        item.style.flexDirection = "row";
        item.appendChild(this.getCoverArt(song.albumArtUri));
        item.appendChild(textContainer);

        return item;
    },

    getCoverArt: function(url) {
        let coverArea = document.createElement('div');
        coverArea.className = "album-art";
        let cover = document.createElement('img');
        cover.src = "http://10.0.0.15:1400" + url;
        cover.className = "album-art";
        coverArea.appendChild(cover);

        return coverArea;
    },

    processStatus: function(data) {
        for (var i in data) {
            var group = data[i];
            var members = group.members;
            for (var j in members) {
                var member = members[j]
                if (this.config.room == member.roomName) { // Find the button that matches this member
                    this.currentSong = member.state.currentTrack.title
                    if (member.state.playbackState == "PLAYING") {
                        this.timeout = 0; // Reset timeout if queue is actively playing music
                    }
                }
            }
        }
        this.updateDom();
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "SONOS_DATA" && !this.config.updateExternally) {
            this.processStatus(payload);
        } else if (notification == "SONOS_QUEUE") {
            this.queue = payload;
            this.updateDom();
        }
    },

    notificationReceived: function(notification, payload) {
        if (this.config.updateExternally) {
            if (notification == "SONOS_ZONE_DATA") {
                this.processStatus(payload);
            }
        }
    },

    queueFetch: function() {
        var url = this.config.serverIP + "/" + this.config.room + "/queue";
        this.sendSocketNotification('UPDATE_QUEUE', url);
    },

    dataFetch: function() {
        var url = this.config.serverIP + "/zones";
        this.sendSocketNotification('UPDATE_STATUS', url);
    },

    scheduleQueueFetch: function() {
        // Update current song every x se ds
        var self = this;
        setInterval(() => {
            self.queueFetch();
            this.timeout += 1;
        }, this.config.queueUpdateInterval * 1000);
    },

    scheduleDataFetch: function() {
        // Update current song every x seconds
        var self = this;
        setInterval(() => {
            self.dataFetch();
        }, this.config.statusUpdateInterval * 1000);
    }

});	


