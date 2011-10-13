(function() {
  Ti.include('/tests/lib/jasmine-1.0.2.js');
  Ti.include('/tests/lib/jasmine-titanium.js');
  
  Ti.include('/tests/twitter.js');
    
  jasmine.getEnv().addReporter(new jasmine.TitaniumReporter());
  jasmine.getEnv().execute();
})();
