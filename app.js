
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');
  
// socket io
var io = require('socket.io');
 
var app = module.exports = express.createServer();

// socket io setup
io = io.listen(app);

// Configuration
// configure socket.io
io.configure(function () {
  
  // recommended production testing
  //io.enable('browser client minification');  // send minified client
  //io.enable('browser client etag');          // apply etag caching logic based on version number
  //io.enable('browser client gzip');          // gzip the file
  
  io.set('log level', 1); // reduce level of logging to warning only
  
  io.set('transports', [
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
  
  
});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
	
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: '55BA53B475CCAE0992D6BF9FE463A5E97F00' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

/* app.get('/tut', routes.tut); */

// real time dicussion board project
routes.setupBoard(app, io);


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
