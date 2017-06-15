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
}