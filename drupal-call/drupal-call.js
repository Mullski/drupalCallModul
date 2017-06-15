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
        this.Store = new Store();
        // this.shadowRoot.querySelector("drupal-video-area").setStore(this.Store);
        requestIdleCallback(() => {
            this.shadowRoot.querySelector("drupal-control").setStore(this.Store);
            this.shadowRoot.querySelector("drupal-video").setStore(this.Store);
        });
    }
}
window.customElements.define('drupal-call', DrupalCall);



