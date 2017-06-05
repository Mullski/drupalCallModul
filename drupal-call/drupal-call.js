class State{
	constructor(peer,groupPeers,myStream, name,){
  	this.peer = peer;
    this.groupPeers = [];
  	this.stream = myStream;
    this.name = name;
    
  }
}

class Store {
		constructor(){
      // Wenn ein Neuer Store erstellt wird, Frischen State erschaffen
      this._state = new State();
      this._listeners = [];
    	Store.instance = this;
    }
  	addEventListener(property,callback){
    	this._listeners.push({property:property,callback:callback});
    }
  	_notify(prop){
      //Benachrichtige alle die sich auf "propXYZ" listen
    	this._listeners.forEach( l=>{
        //Property gleich?
      	if(l.property == prop || l.property == '*' ){
          //callback auslösen!
        	l.callback(this._state,prop);
        }
      });
    }
  	
  
  	getState(){return this._state;}
		
  	addgroupPeer(rName){
      //* Ist peer valide? * Ist er Doppelt? //
        this._state.groupPeers.push(rName);
      this._notify("groupPeers");

    }
    setName(n){
        this._state.name = n;
        this._notify("name");
    }
  	setPeer(p){
      this._state.peer= p;
      this._notify("peer");
      
    }
    setStream(s){
      this._state.stream= s;
      this._notify("stream");
    }
    setReceivingPeer(rP){
        this._state.stream= rP;
        this._notify("receivingPeer");
    }
}

class DrupalCall extends HTMLElement {
    
    constructor(){
        super();
         var shadowRoot =this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = `
            <drupal-video></drupal-video>
            <drupal-control></drupal-control>
        `;

    }
    connectedCallback(){
        console.log("Hi Im connected!");
        this.Store = new Store();
       // this.shadowRoot.querySelector("drupal-video-area").setStore(this.Store);
       requestIdleCallback(()=>{        
           this.shadowRoot.querySelector("drupal-control").setStore(this.Store);
           this.shadowRoot.querySelector("drupal-video").setStore(this.Store);
        });
    }


}
window.customElements.define('drupal-call', DrupalCall);


class DrupalControl extends HTMLElement {
    
    constructor(){
        super();
         var shadowRoot =this.attachShadow({mode: 'open'});
            shadowRoot.innerHTML = `
            <input type="text" id="name" value="antoni">
            <input type="button" id="registerBtn"value="register">
            <input type="text" id="callPeer" value="">
            <input type="button" id="callBtn" value="call" >
            

        `;
        this.DOM = this.shadowRoot.children;

    }
    connectedCallback(){
        this.DOM.registerBtn.addEventListener("click",this.register.bind(this));
        this.DOM.callBtn.addEventListener("click",this.call.bind(this));
     
    }
    setStore(store){
        this.Store = store;
        store.addEventListener("groupPeers",(state)=>{
            if(state.groupPeers.length >= 1){
                this.DOM.callBtn.value="ADD";
            }
            else{
                this.DOM.callBtn.value="CALL";
            }
        });
    }
    call(){
        this.Store.addgroupPeer(this.DOM.callPeer.value);
    }
    register(){
        this.Store.setName(this.DOM.name.value);
    }
   


}
window.customElements.define('drupal-control', DrupalControl);

class DrupalVideo extends HTMLElement {
    constructor(){
        super();
        var shadowRoot =this.attachShadow({mode: 'open'});
        shadowRoot.innerHTML = `
            <div class="videoCont">
                <video id="selfVideo" autoplay></video>
            </div>
        
        `;
        this.DOM = this.shadowRoot.children;
    }

    setStore(store){
        this.Store= store;
        
        this.Store.addEventListener("name", this.nameChanged);
        this.Store.addEventListener("peer", this.peerChanged);
        this.Store.addEventListener("groupPeers", this.groupPeerChanged);
    }

    nameChanged(){
        let peer = new Peer(name, {key: 'cksskorc4w50o1or'});
        this.Store.setPeer(peer);
    }
    peerChanged(state){
        let myPeer = state.peer;
        
        //myPeer.on("call"){  }

    }
    groupPeerChanged(){
        
    }
}
window.customElements.define('drupal-video', DrupalVideo);






window.addEventListener("load",()=>{
    document.querySelector("drupal-call").Store.addEventListener("*",(state,prop)=>{
        console.log(prop + " changed From Store " + state);
    });
})



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