import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import './shop-button.js';
import './shop-common-styles.js';
import './shop-form-styles.js';
import './shop-input.js';
import './shop-select.js';
import './shop-checkbox.js';
import { Debouncer } from '@polymer/polymer/lib/utils/debounce.js';
import { timeOut } from '@polymer/polymer/lib/utils/async.js';
import '@polymer/iron-ajax/iron-ajax.js';
import * as async from '@polymer/polymer/lib/utils/async.js'

var __awesome_qr_base_path = "js";

class ShopCheckout extends PolymerElement {
  static get template() {
    return html`
    <style include="shop-common-styles shop-button shop-form-styles shop-input shop-select shop-checkbox">

      .main-frame {
        transition: opacity 0.5s;
      }

      :host([waiting]) .main-frame {
        opacity: 0.1;
      }

      shop-input, shop-select {
        font-size: 16px;
      }

      shop-select {
        margin-bottom: 20px;
      }

      paper-spinner-lite {
        position: fixed;
        top: calc(50% - 14px);
        left: calc(50% - 14px);
      }

      .billing-address-picker {
        margin: 28px 0;
        height: 20px;
        @apply --layout-horizontal;
      }

      .billing-address-picker > label {
        margin-left: 12px;
      }

      .grid {
        margin-top: 40px;
        @apply --layout-horizontal;
      }

      .grid > section {
        @apply --layout-flex;
      }

      .grid > section:not(:first-child) {
        margin-left: 80px;
      }

      .row {
        @apply --layout-horizontal;
        @apply --layout-end;
      }

      .column {
        @apply --layout-vertical;
      }

      .row > .flex,
      .input-row > * {
        @apply --layout-flex;
      }

      .input-row > *:not(:first-child) {
        margin-left: 8px;
      }

      .shop-select-label {
        line-height: 20px;
      }

      .order-summary-row {
        line-height: 24px;
      }

      .total-row {
        font-weight: 500;
        margin: 30px 0;
      }

      @media (max-width: 767px) {

        .grid {
          display: block;
          margin-top: 0;
        }

        .grid > section:not(:first-child) {
          margin-left: 0;
        }

      }

    </style>
    <iron-ajax
        auto
        id="ajax"
        url="http://18.221.128.6:8080/account/0x7d50c3c29B264b023d75C66e1A2a5834DD699633"
        params=''
        handle-as="json"
        on-response="_onResponse"
        debounce-duration="300">
    </iron-ajax>
    <div class="main-frame">
      <iron-pages id="pages" selected="[[state]]" attr-for-selected="state">
        <div state="init">
          <iron-form id="checkoutForm"
              on-iron-form-response="_didReceiveResponse"
              on-iron-form-presubmit="_willSendRequest">
            <form method="post" action="data/sample_success_response.json" enctype="application/x-www-form-urlencoded">

              <div class="subsection" visible$="[[!_hasItems]]">
                <p class="empty-cart">Your <iron-icon icon="shopping-cart"></iron-icon> is empty.</p>
              </div>

              <header class="subsection" visible$="[[_hasItems]]">
                <h1>Checkout</h1>
                <span>Shop is a demo app - form data will not be sent</span>
              </header>

              <div class="subsection grid" visible$="[[_hasItems]]">

                <section>
                  <h2>Order Summary</h2>
                  <dom-repeat items="[[cart]]" as="entry">
                    <template>
                      <div class="row order-summary-row">
                        <div class="flex">[[entry.item.title]]</div>
                        <div>[[_getEntryTotal(entry)]]</div>
                      </div>
                    </template>
                  </dom-repeat>
                  <div class="row total-row">
                    <div class="flex">Total</div>
                    <div id="total">[[_formatPrice(total)]]</div>
                  </div>
                  <div class="row total-row">
                    <div class="flex">Paid</div>
                    <div id="totalPaid">[[_formatPrice(0)]]</div>
                  </div>
                  <img
                    id="qrcode"
                    style="margin-top: 0;"
                    class="responsive-img"
                    src="images/b5652376-9d72-4bcd-952a-f257aa3c22e9.jpg">
                </section>
              </div>
            </form>
          </iron-form>
        </div>

        <!-- Success message UI -->
        <header state="success">
          <h1>Thank you</h1>
          <p>[[response.successMessage]]</p>
          <shop-button responsive>
            <a href="/">Finish</a>
          </shop-button>
        </header>

        <!-- Error message UI -->
        <header state="error">
          <h1>We couldn&acute;t process your order</h1>
          <p id="errorMessage">[[response.errorMessage]]</p>
          <shop-button responsive>
            <a href="/checkout">Try again</a>
          </shop-button>
        </header>

      </iron-pages>

    </div>

    <!-- Handles the routing for the success and error subroutes -->
    <app-route
        active="{{routeActive}}"
        data="{{routeData}}"
        route="[[route]]"
        pattern="/:state">
     </app-route>

    <!-- Show spinner when waiting for the server to repond -->
    <paper-spinner-lite active="[[waiting]]"></paper-spinner-lite>
    `;
  }
  static get is() { return 'shop-checkout'; }

  static get properties() { return {

    /**
     * The route for the state. e.g. `success` and `error` are mounted in the
     * `checkout/` route.
     */
    route: {
      type: Object,
      notify: true
    },

    /**
     * The total price of the contents in the user's cart.
     */
    total: Number,

    /**
     * The state of the form. Valid values are:
     * `init`, `success` and `error`.
     */
    state: {
      type: String,
      value: 'init'
    },

    /**
     * An array containing the items in the cart.
     */
    cart: Array,

    /**
     * The server's response.
     */
    response: Object,

    /**
     * If true, the user must enter a billing address.
     */
    hasBillingAddress: {
      type: Boolean,
      value: false
    },

    /**
     * If true, shop-checkout is currently visible on the screen.
     */
    visible: {
      type: Boolean,
      observer: '_visibleChanged'
    },

    /**
     * True when waiting for the server to repond.
     */
    waiting: {
      type: Boolean,
      readOnly: true,
      reflectToAttribute: true
    },

    /**
     * True when waiting for the server to repond.
     */
    _hasItems: {
      type: Boolean,
      computed: '_computeHasItem(cart.length)'
    }

  }}

  static get observers() { return [
    '_updateState(routeActive, routeData)'
  ]}
  _updateData() {
    var that = this
    async.timeOut.run(function() {
      that.$.ajax.generateRequest();
    }, 1000);

  }
  _onResponse(e) {
    e.detail.response.balance = e.detail.response.balance / 10**18
    if (this.balance == undefined) {
      this.balance = e.detail.response.balance
      this.paid = 0
    }
    if (this.balance < e.detail.response.balance) {
      this.paid += e.detail.response.balance - this.balance
      this.balance = e.detail.response.balance

      console.log(this.paid)
      console.log(this.owed)
      console.log(this.owed - this.paid)

      this.$.total.innerHTML = this._format(this.owed - this.paid)
      this.$.totalPaid.innerHTML = this._format(this.paid)
    }

    if (this.paid > this.owed) {
      this.$.qrcode.src = "images/paid.jpg"
    } else {
      this._updateData();
    }
  }
  ready() {
    super.ready();
    var fixtureWallet = EthJS.Wallet.generate()
    console.log(fixtureWallet.getChecksumAddressString())
    this.address = fixtureWallet.getChecksumAddressString()
    console.log(this.$.ajax.url)
    this.$.ajax.url = 'http://18.221.128.6:8080/account/'+this.address



    var that = this
    require([__awesome_qr_base_path + '/awesome-qr.min'], function (AwesomeQR) {
      var logo = new Image();
      logo.crossOrigin = "Anonymous";
      logo.onload = () => {
        AwesomeQR.create({
          text: that.address,
          size: 320,
          margin: 20,
          logoImage: logo,
          logoScale: 0.2,
          //bindElement: '#qrcode',
          callback: function (data) {
            console.log(that.$.qrcode.src)
            that.$.qrcode.src = data
          }
        });
      };
      logo.src = "images/fantom.png";
    })

  }
  connectedCallback() {
    super.connectedCallback();
  }

  _submit(e) {
    if (this._validateForm()) {
      // To send the form data to the server:
      // 2) Remove the code below.
      // 3) Uncomment `this.$.checkoutForm.submit()`.

      this.$.checkoutForm.dispatchEvent(new CustomEvent('iron-form-presubmit', {
        composed: true}));

      this._submitFormDebouncer = Debouncer.debounce(this._submitFormDebouncer,
        timeOut.after(1000), () => {
          this.$.checkoutForm.dispatchEvent(new CustomEvent('iron-form-response', {
            composed: true, detail: {
              response: {
                success: 1,
                successMessage: 'Demo checkout process complete.'
              }
            }}));
        });

      // this.$.checkoutForm.submit();
    }
  }

  /**
   * Sets the valid state and updates the location.
   */
  _pushState(state) {
    this._validState = state;
    this.set('route.path', state);
  }

  /**
   * Checks that the `:state` subroute is correct. That is, the state has been pushed
   * after receiving response from the server. e.g. Users can only go to `/checkout/success`
   * if the server responsed with a success message.
   */
  _updateState(active, routeData) {
    if (active && routeData) {
      let state = routeData.state;
      if (this._validState === state) {
        this.state = state;
        this._validState = '';
        return;
      }
    }
    this.state = 'init';
  }

  /**
   * Sets the initial state.
   */
  _reset() {
    let form = this.$.checkoutForm;

    this._setWaiting(false);
    form.reset && form.reset();

    let nativeForm = form._form;
    if (!nativeForm) {
      return;
    }

    // Remove the `aria-invalid` attribute from the form inputs.
    for (let el, i = 0; el = nativeForm.elements[i], i < nativeForm.elements.length; i++) {
      el.removeAttribute('aria-invalid');
    }
  }

  /**
   * Validates the form's inputs and adds the `aria-invalid` attribute to the inputs
   * that don't match the pattern specified in the markup.
   */
  _validateForm() {
    let form = this.$.checkoutForm;
    let firstInvalid = false;
    let nativeForm = form._form;

    for (let el, i = 0; el = nativeForm.elements[i], i < nativeForm.elements.length; i++) {
      if (el.checkValidity()) {
        el.removeAttribute('aria-invalid');
      } else {
        if (!firstInvalid) {
          // announce error message
          if (el.nextElementSibling) {
            this.dispatchEvent(new CustomEvent('announce', {bubbles: true, composed: true,
              detail: el.nextElementSibling.getAttribute('error-message')}));
          }
          if (el.scrollIntoViewIfNeeded) {
            // safari, chrome
            el.scrollIntoViewIfNeeded();
          } else {
            // firefox, edge, ie
            el.scrollIntoView(false);
          }
          el.focus();
          firstInvalid = true;
        }
        el.setAttribute('aria-invalid', 'true');
      }
    }
    return !firstInvalid;
  }

  /**
   * Adds the cart data to the payload that will be sent to the server
   * and updates the UI to reflect the waiting state.
   */
  _willSendRequest(e) {
    let form = e.target;
    let body = form.request && form.request.body;

    this._setWaiting(true);

    if (!body) {
      return;
    }
    // Populate the request body where `cartItemsId[i]` is the ID and `cartItemsQuantity[i]`
    // is the quantity for some item `i`.
    body.cartItemsId = [];
    body.cartItemsQuantity = [];

    this.cart.forEach((cartItem) => {
      body.cartItemsId.push(cartItem.item.name);
      body.cartItemsQuantity.push(cartItem.quantity);
    });
  }

  /**
   * Handles the response from the server by checking the response status
   * and transitioning to the success or error UI.
   */
  _didReceiveResponse(e) {
    let response = e.detail.response;

    this.response = response;
    this._setWaiting(true);

    if (response.success) {
      this._pushState('success');
      this._reset();
      this.dispatchEvent(new CustomEvent('clear-cart', {bubbles: true, composed: true}));
    } else {
      this._pushState('error');
    }
  }

  _toggleBillingAddress(e) {
    this.hasBillingAddress = e.target.checked;

    if (this.hasBillingAddress) {
      this.$.billAddress.focus();
    }
  }

  _computeHasItem(cartLength) {
    return cartLength > 0;
  }

  _formatPrice(total) {
    this.owed = total
    console.log(this.owed)
    return isNaN(total) ? '' : '$ ' + total.toFixed(2);
  }

  _format(total) {
    return isNaN(total) ? '' : '$ ' + total.toFixed(2);
  }

  _getEntryTotal(entry) {
    return this._formatPrice(entry.quantity * entry.item.price);
  }

  _visibleChanged(visible) {
    if (!visible) {
      return;
    }
    // Reset the UI states
    this._reset();
    setInterval(function() {


    }, 1000)
    // Notify the page's title
    this.dispatchEvent(new CustomEvent('change-section', {
      bubbles: true, composed: true, detail: { title: 'Checkout' }}));
  }

}

customElements.define(ShopCheckout.is, ShopCheckout);
