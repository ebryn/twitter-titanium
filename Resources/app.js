(function() {
  var RUN_TESTS = false;
  
  if (RUN_TESTS) {
    Ti.include('tests/tests.js');
  } else {
    var accessTokenKey = Ti.App.Properties.getString('twitterAccessTokenKey'),
        accessTokenSecret = Ti.App.Properties.getString('twitterAccessTokenSecret');

    var Twitter = require('twitter').Twitter;
    
    var client = Twitter({
      consumerKey: "INSERT KEY HERE",
      consumerSecret: "INSERT SECRET HERE",
      accessTokenKey: accessTokenKey, 
      accessTokenSecret: accessTokenSecret
    });
    
    var win = Ti.UI.createWindow({backgroundColor: 'white'}),
        tableView = Ti.UI.createTableView();
  
    win.add(tableView);
    win.open();
    
    client.addEventListener('login', function(e) {
      Ti.App.Properties.setString('twitterAccessTokenKey', e.accessTokenKey);
      Ti.App.Properties.setString('twitterAccessTokenSecret', e.accessTokenSecret);
      
      client.request("1/statuses/home_timeline.json", {count: 100}, 'GET', function(data) {
        var json = JSON.parse(data.text), 
            tweets = json.map(function(tweet) {
              return {title: tweet.text};
            });
        
        tableView.setData(tweets);
      });
    });
  
    client.authorize();
  }
})(this);
