# twitter-titanium

twitter-titanium is a client-side Twitter library for Titanium Mobile. It simplifies the task of authenticating a user via Twitter. A backend is not required.
It's designed to emulate the API of the Facebook module included in Titanium Mobile.

It presents a very simple and straightforward API. You provide your OAuth configuration and simply call `authorize()`.
The user is prompted with a modal WebView to login to Twitter. After the user has logged in, the WebView disappears and a `login` event is fired.
Requests to Twitter's API endpoints are done with the `request()` function. We intentionally are not wrapping Twitter's API calls, this can
become a maintainence issue if Twitter updates it's API.

## How to use

- There is an example app included in this repository. See `app.js`

```
var client = Twitter({
  consumerKey: "INSERT YOUR KEY HERE",
  consumerSecret: "INSERT YOUR SECRET HERE"
});

client.authorize(); // Pops up a modal WebView

client.addEventListener('login', function(e) {
  // Your app code goes here... you'll likely want to save the access tokens passed in the event.
  
  // Here's an example API call:
  client.request("1/statuses/home_timeline.json", {count: 100}, 'GET', function(data) {
    // `data` is the response text
  });
});
```


## Nice features

- Android compatible and tested!
- On iOS, a back button is displayed if the user does any navigation within the WebView. For example, if the user clicks the forgot password link.

## Thanks

twitter-titanium uses the jsOAuth library by @bytespider

## Contact

twitter-titanium was written by Erik Bryn. You can find him on Twitter at @ebryn.