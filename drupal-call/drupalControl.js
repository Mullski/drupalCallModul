
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
