var exports = exports || this;
exports.Twitter = (function(global) {
  var K = function(){}, isAndroid = Ti.Platform.osname === "android", jsOAuth = require('jsOAuth-1.3.1');
  
  /**
   * Twitter constructor function
   *
   *     var client = Twitter({
   *       consumerKey: "INSERT YOUR KEY HERE",
   *       consumerSecret: "INSERT YOUR SECRET HERE"      
   *     });
   *
   * Can be used with or without `new` keyword.
   *
   * @constructor
   * @requires jsOAuth: http://github.com/bytespider/jsOAuth
   * @param options {Object} Configuration object
   * @param options.consumerKey {String} Application consumer key
   * @param options.consumerSecret {String} Application consumer secret
   * @param options.accessTokenKey {String} (optional) The user's access token key
   * @param options.accessTokenSecret {String} (optional) The user's access token secret
   * @param [options.windowTitle="Twitter Authorization"] {String} (optional) The title to display in the authentication window
   */
  var Twitter = function(options) {
    var self;
    
    if (this instanceof Twitter) {
      self = this;
    } else {
      self = new K();
    }
    
    if (!options) { options = {}; }
    self.windowTitle = options.windowTitle || "Twitter Authorization";
    self.consumerKey = options.consumerKey;
    self.consumerSecret = options.consumerSecret;
    self.authorizeUrl = "https://api.twitter.com/oauth/authorize";
    self.accessTokenKey = options.accessTokenKey;
    self.accessTokenSecret = options.accessTokenSecret;
    self.authorized = false;
    self.listeners = {};
    
    if (self.accessTokenKey && self.accessTokenSecret) {
      self.authorized = true;
    }

    options.requestTokenUrl = options.requestTokenUrl || "https://api.twitter.com/oauth/request_token";
    self.oauthClient = jsOAuth.OAuth(options);
    
    return self;
  };
  
  K.prototype = Twitter.prototype;
  
  function createAuthWindow() {
    var self = this,
        oauth = this.oauthClient,
        webViewWindow = Ti.UI.createWindow({title: this.windowTitle}),
        webView = Ti.UI.createWebView(),
        loadingOverlay = Ti.UI.createView({
          backgroundColor: 'black',
          opacity: 0.7,
          zIndex: 1
        }),
        actInd = Titanium.UI.createActivityIndicator({
          height: 50,
          width: 10,
          message: 'Loading...',
          color: 'white'
        }),
        closeButton = Ti.UI.createButton({
          title: "Close"
        }),
        backButton = Ti.UI.createButton({
          title: "Back"
        });

    this.webView = webView;
    
    webViewWindow.leftNavButton = closeButton;
    
    actInd.show();
    loadingOverlay.add(actInd);
    webViewWindow.add(loadingOverlay);
    webViewWindow.open({modal: true});
    
    webViewWindow.add(webView);
    
    closeButton.addEventListener('click', function(e) {
      webViewWindow.close();
    });

    backButton.addEventListener('click', function(e) {
      webView.goBack();
    });
    
    webView.addEventListener('beforeload', function(e) {
      if (!isAndroid) { webViewWindow.add(loadingOverlay); }
      actInd.show();
    });

    webView.addEventListener('load', function(event) {
      // If we're not on the Twitter authorize page
      if (event.url.indexOf(self.authorizeUrl) === -1) {
        webViewWindow.remove(loadingOverlay);
        actInd.hide(); // Required for Android
        
        // Switch out close button for back button
        if (webViewWindow.leftNavButton !== backButton) {
          webViewWindow.leftNavButton = backButton;
        }
      } else {
        // Switch out back button for close button
        if (webViewWindow.leftNavButton !== closeButton) {
          webViewWindow.leftNavButton = closeButton;
        }

        // Grab the PIN code out of the DOM
        var pin = event.source.evalJS("document.getElementById('oauth_pin').getElementsByTagName('code')[0].innerText");
        
        if (!pin) {
          // We're here when:
          // - "No thanks" button clicked
          // - Bad username/password

          webViewWindow.remove(loadingOverlay);
          actInd.hide();
        } else {
          if (!isAndroid) { // on iOS we can close the modal window right away
            webViewWindow.close();
          }
          
          oauth.accessTokenUrl = "https://api.twitter.com/oauth/access_token?oauth_verifier=" + pin;
          
          oauth.fetchAccessToken(function(data) {
            var returnedParams = oauth.parseTokenRequest(data.text);
            self.fireEvent('login', {
              success: true,
              error: false,
              accessTokenKey: returnedParams.oauth_token,
              accessTokenSecret: returnedParams.oauth_token_secret
            });
            
            if (isAndroid) { // we have to wait until now to close the modal window on Android: http://developer.appcelerator.com/question/91261/android-probelm-with-httpclient
              webViewWindow.close();
            }
          }, function(data) {
            self.fireEvent('login', {
              success: false,
              error: "Failure to fetch access token, please try again.",
              result: data
            });
          });
        }
      }
    });
    
  }
  
  /*
   * Requests the user to authorize via Twitter through a modal WebView.
   */
  Twitter.prototype.authorize = function() {
    var self = this;
    
    if (this.authorized) {
      // TODO: verify access tokens are still valid?
      
      // We're putting this fireEvent call inside setTimeout to allow
      // a user to add an event listener below the call to authorize.
      // Not totally sure if the timeout should be greater than 1. It
      // seems to do the trick on iOS/Android.
      setTimeout(function() {
        self.fireEvent('login', {
          success: true,
          error: false,
          accessTokenKey: self.accessTokenKey,
          accessTokenSecret: self.accessTokenSecret
        });
      }, 1);
    } else {
      createAuthWindow.call(this);

      this.oauthClient.fetchRequestToken(
        function(requestParams) {
          var authorizeUrl = self.authorizeUrl + requestParams;
          self.webView.url = authorizeUrl;
        },
        function(data) {
          self.fireEvent('login', {
            success: false,
            error: "Failure to fetch access token, please try again.",
            result: data
          });
        }
      );
    }
  };
  
  /*
   * Make an authenticated Twitter API request.
   * 
   * @param {String} path the Twitter API path without leading forward slash. For example: `1/statuses/home_timeline.json`
   * @param {Object} params  the parameters to send along with the API call
   * @param {String} [httpVerb="GET"] the HTTP verb to use
   * @param {Function} callback
   */
  Twitter.prototype.request = function(path, params, httpVerb, callback) {
    var self = this, oauth = this.oauthClient, url = "https://api.twitter.com/" + path;
    
    oauth.request({
      method: httpVerb,
      url: url,
      data: params,
      success: function(data) {
        callback.call(self, {
          success: true,
          error: false,
          result: data
        });
      },
      error: function(data) { 
        callback.call(self, {
          success: false,
          error: "Request failed",
          result: data
        });
      }
    });
  };
  
  /*
   * Add an event listener
   */
  Twitter.prototype.addEventListener = function(eventName, callback) {
    this.listeners = this.listeners || {};
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(callback);
  };
  
  /*
   * Fire an event
   */
  Twitter.prototype.fireEvent = function(eventName, data) {
    var eventListeners = this.listeners[eventName] || [];
    for (var i = 0; i < eventListeners.length; i++) {
      eventListeners[i].call(this, data);
    }
  };
  
  return Twitter;
})(this);
