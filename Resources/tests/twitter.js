var Twitter = require('twitter').Twitter;

describe("Twitter", function() {
  it("should be defined", function() {
    expect(Twitter).toBeDefined();
  });

  it("should be instantiateable", function() {
    var c = Twitter();
    expect(c).toBeDefined();
    c = new Twitter();
    expect(c).toBeDefined();
  });
  
  it("should be configurable", function() {
    var c = Twitter({
      consumerKey: "ABC",
      consumerSecret: "DEF"
    });
    
    expect(c.consumerKey).toEqual("ABC");
    expect(c.consumerSecret).toEqual("DEF");
  });
  
  it("should create a jsOAuth object", function() {
    var c = Twitter();
    expect(c.oauthClient).toBeDefined();
  });
  
  it("should show an authorization window", function() {
    var c = Twitter();
    expect(c.authorized).toBeDefined();
    
  });
  
  it("should handle API requests", function() {
    var c = Twitter();
    expect(c.request).toBeDefined();
  });
});