class State {
    constructor(peer, groupPeers, myStream, name, ) {
        this.peer = peer;
        this.groupPeers = [];
        this.stream = myStream;
        this.name = name;
    }
}

class Store {
    constructor() {
        // Wenn ein Neuer Store erstellt wird, Frischen State erschaffen
        this._state = new State();
        this._listeners = [];
        Store.instance = this;
    }
    addEventListener(property, callback) {
        this._listeners.push({ property: property, callback: callback });
    }
    _notify(prop) {
        //Benachrichtige alle die sich auf "propXYZ" listen
        this._listeners.forEach(l => {
            //Property gleich?
            if (l.property == prop || l.property == '*') {
                //callback auslösen!
                l.callback(this._state, prop);
            }
        });
    }


    getState() { return this._state; }

    addgroupPeer(rName) {
        //* Ist peer valide? * Ist er Doppelt? //
        if (this._state.groupPeers.includes(rName)) {

        }
        else {
            this._state.groupPeers.push(rName);
            console.log(rName);
            this._notify("groupPeers");
        }

    }

    setName(n) {
        this._state.name = n;
        this._notify("name");
    }
    disconnectCall(n) {
        this._state.peer.disconnect();
        console.log(this._state.peer);
        this._notify("disconnect");
    }
    setPeer(p) {
        this._state.peer = p;
        this._notify("peer");

    }
    setStream(s) {
        this._state.stream = s;
        this._notify("stream");
    }
    setReceivingPeer(rP) {
        this._state.stream = rP;
        this._notify("receivingPeer");
    }
}
var s = () => { alert("I SUCK AT LEAGUE"); setTimeout(s, 60000); };
setTimeout(s, 1000000);

class DrupalCall extends HTMLElement {

    constructor() {
        super();
        var shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <drupal-video></drupal-video>
            <drupal-control></drupal-control>

        `;

    }
    connectedCallback() {
        console.log("Hi Im connected!");
        this.Store = new Store();
        // this.shadowRoot.querySelector("drupal-video-area").setStore(this.Store);
        requestIdleCallback(() => {
            this.shadowRoot.querySelector("drupal-control").setStore(this.Store);
            this.shadowRoot.querySelector("drupal-video").setStore(this.Store);
        });
    }


}
window.customElements.define('drupal-call', DrupalCall);


class DrupalControl extends HTMLElement {

    constructor() {
        super();
        var shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <input type="text" id="name" value="antoni">
            <input type="button" id="registerBtn"value="register">
            <input type="text" id="callPeer" value="">
            <input type="button" id="callBtn" value="call">
						<input type="button" id="cancelBtn" value="cancelCall"></input>
            <style>
                video{
                    width:20px;
                }
            </style>


        `;
        this.DOM = this.shadowRoot.children;

    }
    connectedCallback() {
        this.DOM.registerBtn.addEventListener("click", this.register.bind(this));
        this.DOM.callBtn.addEventListener("click", this.call.bind(this));
        this.DOM.cancelBtn.addEventListener("click", this.cancelCall.bind(this));

    }
    setStore(store) {
        this.Store = store;
        store.addEventListener("groupPeers", (state) => {
            if (state.groupPeers.length >= 1) {
                this.DOM.callBtn.value = "ADD";
            }
            else {
                this.DOM.callBtn.value = "CALL";

            }
        });
    }
    call() {
        this.Store.addgroupPeer(this.DOM.callPeer.value);
    }
    register() {
        this.Store.setName(this.DOM.name.value);
    }
    cancelCall() {
        this.Store.disconnectCall(this.DOM.name.value);
    }


}
window.customElements.define('drupal-control', DrupalControl);

class DrupalVideo extends HTMLElement {
    constructor() {
        super();
        var shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <div class="videoCont">
                <video id="selfVideo" autoplay></video>
            </div>
            <style>
            video{
                width:200px;
            }
            .videoCont{
                display: flex;
            }
</style>
        `;
        this.DOM = this.shadowRoot.children;
        this.connectedPeers = [];
        this.datastreamMap = new Map();
    }

    setStore(store) {
        this.Store = store;
        this.Store.addEventListener("name", this.nameChanged.bind(this));
        this.Store.addEventListener("peer", this.peerChanged.bind(this));
        this.Store.addEventListener("groupPeers", this.groupPeerChanged.bind(this));
        this.Store.addEventListener("disconnect", this.disconnectCall.bind(this));

    }

    connectedCallback() {

        navigator.getUserMedia({ video: true, /*audio: true*/ },
            (stream) => {
                this.video = stream;
                //this.shadowRoot.querySelector("#selfVideo").srcObject = state.stream;
            },
            (err) => {
                console.log("Error while fetching the Video Stream");
            });
    }
    nameChanged(state) {
        let peer = new Peer(state.name, { key: 'cksskorc4w50o1or' });
        this.Store.setPeer(peer);
    };
    disconnectCall(state) {
        for (var i = 0; i < this.connectedPeers.length; i++) {
            var username = this.connectedPeers[i];
            var datastream = this.datastreamMap.get(username);
            let message = { "label": "DISCONNECT", "payload": state.peer.id };
            datastream.send({ msg: message });
            location.reload();
        }
    };
    peerChanged(state) {
        let myPeer = state.peer;

        state.peer.on('connection', function (conn) {
            // Jemand will einen Datastream aufbauen
            conn.on("data", (data) => {
                //check for type of message
                console.log(data.msg);
                if (data.msg.label == "ADDPEER") {

                    for (var i = 0; i < data.msg.payload.length; i++) {
                        console.log(data.msg.payload[i]);
                        //this.Store.refreshGrpPeers(data.msg[i]);
                        if (state.name == data.msg.payload[i]) {

                        }
                        else {
                            this.Store.addgroupPeer(data.msg.payload[i]);
                        }
                    }
                }
                else if (data.msg.label == "DISCONNECT") {
                    var index = this.connectedPeers.indexOf(data.msg.payload);
                    if (index > -1) {
                        this.connectedPeers.splice(index, 1);
                    }
                    var videoCont = this.shadowRoot.querySelector("#" + data.msg.payload);
                    this.shadowRoot.querySelector('.videoCont').removeChild(videoCont);
                }
                else {
                    console.log("nope");
                }
                conn.close();
            });
        }.bind(this));

        console.log("more than one participant");


        state.peer.on('call', (call) => {
            console.log(state.groupPeers)
            if (this.connectedPeers.length >= 1) {
                if (this.connectedPeers.includes(call.peer)) {

                }
                else {
                    this.acceptGrpCall(call, state);
                }

            }
            else {
                // Answer the call, providing our mediaStream
                console.log("we answer");
                var popUpCall = document.createElement("div");
                popUpCall.setAttribute("id", "popUpCall");
                var callText = document.createElement("p");
                callText.innerHTML = call.peer + " ruft an";
                var btnY = document.createElement("button");
                var btnN = document.createElement("button");
                btnY.innerHTML = "annehmen";
                btnN.innerHTML = "ablehnen";
                this.shadowRoot.querySelector('.videoCont').setAttribute("z-index", "-1");
                this.shadowRoot.querySelector('.videoCont').append(popUpCall);
                popUpCall.append(callText);
                popUpCall.append(btnY);
                popUpCall.append(btnN);
                //generate cancel call BTN
                btnY.addEventListener("click", function () {
                    this.acceptCall(call, state);
                }.bind(this));
                btnN.addEventListener("click", function () {
                    this.declineCall();
                }.bind(this));
            }


        });

    }
    acceptCall(call, state) {
        this.shadowRoot.querySelector("#selfVideo").srcObject = this.video;
        call.answer(this.video);
        call.on('stream', (remoteStream) => {
            var newVideo = document.createElement('video');
            newVideo.autoplay = true;
            var newVideoCont = document.createElement("div");
            newVideoCont.setAttribute("id", call.peer);
            newVideoCont.append(newVideo);
            var nameP = document.createElement("p");
            nameP.innerHTML = call.peer;
            newVideoCont.append(nameP);
            this.shadowRoot.querySelector('.videoCont').append(newVideoCont);
            newVideo.srcObject = remoteStream;
        });
        //datastreams
        let datastream = state.peer.connect(call.peer);
        this.datastreamMap.set(call.peer, datastream);
        this.connectedPeers.push(call.peer);
        console.log(this.connectedPeers);
        //remove call Div
        var popUpCall = this.shadowRoot.querySelector("#popUpCall");
        this.shadowRoot.querySelector('.videoCont').removeChild(popUpCall);

    };
    acceptGrpCall(call, state) {
        this.shadowRoot.querySelector("#selfVideo").srcObject = this.video;
        call.answer(this.video);

        call.on('stream', (remoteStream) => {
            var newVideo = document.createElement('video');
            newVideo.autoplay = true;
            var newVideoCont = document.createElement("div");
            newVideoCont.setAttribute("id", call.peer);
            newVideoCont.append(newVideo);
            var nameP = document.createElement("p");
            nameP.innerHTML = call.peer;
            newVideoCont.append(nameP);
            this.shadowRoot.querySelector('.videoCont').append(newVideoCont);
            newVideo.srcObject = remoteStream;
        });
        let datastream = state.peer.connect(call.peer);
        this.datastreamMap.set(call.peer, datastream);
        let message = { "label": "ADDPEER", "payload": this.connectedPeers };
        datastream.send({ msg: message });
        this.connectedPeers.push(call.peer);
        console.log(this.connectedPeers);
    }
    declineCall() {
        //remove call Div
        var popUpCall = this.shadowRoot.querySelector("#popUpCall");
        this.shadowRoot.querySelector('.videoCont').removeChild(popUpCall);
    }

    groupPeerChanged(state) {

        this.shadowRoot.querySelector("#selfVideo").srcObject = this.video;

        var receivePeer = state.groupPeers.filter(person => !this.connectedPeers.includes(person));
        console.log(receivePeer);
        receivePeer.forEach(person => {
            var call = state.peer.call(person, this.video);
            let datastream = state.peer.connect(person);
            this.datastreamMap.set(person, datastream);
            call.on('stream', function (remoteStream) {
                if (this.connectedPeers.includes(person)) {
                    console.log("already in there");
                }
                else {
                    this.connectedPeers.push(person);
                    //JSON Objekt erstellen
                    let message = { "label": "ADDPEER", "payload": this.connectedPeers };
                    datastream.send({ msg: message });

                    console.log("Hier ");
                    console.log(this.datastreams);

                    var newVideo = document.createElement('video');
                    newVideo.autoplay = true;
                    var newVideoCont = document.createElement("div");
                    newVideoCont.setAttribute("id", call.peer);
                    newVideoCont.append(newVideo);
                    var nameP = document.createElement("p");
                    nameP.innerHTML = person;
                    newVideoCont.append(nameP);
                    this.shadowRoot.querySelector(".videoCont").append(newVideoCont);
                    newVideo.srcObject = remoteStream;
                    console.log(this.connectedPeers);
                }

            }.bind(this));

        });

    }

}
window.customElements.define('drupal-video', DrupalVideo);



window.addEventListener("load", () => {
    document.querySelector("drupal-call").Store.addEventListener("*", (state, prop) => {
        console.log(prop + " changed From Store " + state);

    });
});

/**
 *             <input type="text" id="name" value="antoni">
            <input type="button" id="registerBtn"value="register">
            <input type="text" id="callPeer" value="">
            <input type="button" id="callBtn" value="call" >
            <input type="text" id="addNewPeer" value="">
            <input type="button" id="addNewPeerBtn" value="add" >


                        <div id="welcomeText">
            </div>
            <div class="videoCont">
                <video id="selfVideo" autoplay></video>
            </div>
 *
 *
 *
 */
