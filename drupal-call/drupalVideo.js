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
            </style>`;
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
                this.shadowRoot.querySelector("#selfVideo").srcObject = this.video;

                //this.shadowRoot.querySelector("#selfVideo").srcObject = state.stream;
            },
            (err) => {
                console.log("Error while fetching the Video Stream");
            });
        var p= ()=>{
            this.syncGRPPEERS(this.Store.getState());
            setTimeout(p,2000);
        };
        setTimeout(p,3000);
    }
    syncGRPPEERS(state){
         this.datastreamMap.forEach((datastream,k)=>{
              console.log("Tell "+k+" we have new GrpPeers");
              let message = { "label": "ADDPEER", "payload": state.groupPeers };
              datastream.send({ msg: message });
        });

    }

    nameChanged(state) {
        let peer = new Peer(state.name, { key: 'cksskorc4w50o1or' });
        this.Store.setPeer(peer);
    };

    disconnectCall(state) {
        for (var i = 0; i < this.connectedPeers.length; i++) {
            var username = this.connectedPeers[i];
            var datastream = this.getDataStream(username);
            let message = { "label": "DISCONNECT", "payload": state.peer.id };
            datastream.send({ msg: message });
            location.reload();
        }
    };

    peerChanged(state) {
        let myPeer = state.peer;
        myPeer.on('connection', function (conn) {
            // Jemand will einen Datastream aufbauen
            this.datastreamMap.set(conn.peer, conn); // Recyclen des Datastream Objektes
            console.log("Getting a Datastream from: "+ conn.peer);
            conn.on("data", (data) => {
                //check for type of message
                console.log("Message from: "+conn.peer+" "+data);
                if (data.msg.label == "ADDPEER") {
                    data.msg.payload.forEach(p=>{
                        if(!state.groupPeers.includes(p)){
                            this.Store.addgroupPeer(p);
                        }
                    })
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

            });
        }.bind(this));

        console.log("more than one participant");


        myPeer.on('call', (call) => {
            if (this.connectedPeers.length >= 1 &&
                !this.connectedPeers.includes(call.peer)) {
                this.acceptCall(call);
            }

            else {
                // Answer the call, providing our mediaStream
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
                    this.acceptCall(call);
                }.bind(this));
                btnN.addEventListener("click", function () {
                    this.declineCall();
                }.bind(this));
            }


        });

    }
    acceptCall(call) {
        let state = this.state;
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

        this.connectedPeers.push(call.peer);
        console.log(this.connectedPeers);

        this.Store.addgroupPeer(call.peer);

        //remove call Div if given. 
        try {
            var popUpCall = this.shadowRoot.querySelector("#popUpCall");
            this.shadowRoot.querySelector('.videoCont').removeChild(popUpCall);
        } catch (error) {
            // Thats ok.
        }

    };

    declineCall() {
        //remove call Div
        var popUpCall = this.shadowRoot.querySelector("#popUpCall");
        this.shadowRoot.querySelector('.videoCont').removeChild(popUpCall);
    }

    groupPeerChanged(state) {
        this.callNewParticipants(state);
        this.syncGRPPEERS(true);
    }

    callNewParticipants(state){
         var receivePeer = state.groupPeers.filter(person => !this.connectedPeers.includes(person));

        receivePeer.forEach(person => {
            if(person == state.peer.id){return;}
            var call = state.peer.call(person, this.video);
            this.connectedPeers.push(person);
            call.on('stream', function (remoteStream) {
                   

                    //MSG Objekt erstellen
                    let message = { "label": "ADDPEER", "payload": state.groupPeers };
                    let datastream = this.getDataStream(person);
                    datastream.send({ msg: message });

                    var newVideo = document.createElement('video');
                        newVideo.autoplay = true;
                        newVideo.srcObject = remoteStream;
                    var newVideoCont = document.createElement("div");
                        newVideoCont.setAttribute("id", call.peer);
                        newVideoCont.append(newVideo);                   
                    var nameP = document.createElement("p");
                        nameP.innerHTML = person;
                    newVideoCont.append(nameP);
                    this.shadowRoot.querySelector(".videoCont").append(newVideoCont);
            }.bind(this));
            //TODO: entferne peer aus connected calls wenn anruf abgelehnt wird. 
        });
    }


    getDataStream(peer) {
        // Erstellt einen Datastream zu einem Peer, wenn noch nicht vorhanden.
        let state = this.Store.getState();
        if (this.datastreamMap.get(peer) == null) {
            console.log("Opening a Datastream to: "+ peer);
            let datastream = state.peer.connect(peer, { "serialization": "json" });
            this.datastreamMap.set(peer, datastream);
        }
        return this.datastreamMap.get(peer);
    }

}
window.customElements.define('drupal-video', DrupalVideo);
