// logalytics is an event based logging aparatus with renderable views, 
// this should be capable of handling all your logging events inside of
// express.js.

var _ = require('underscore');
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var events = require('events');
var emitter = events.EventEmitter;
var util = require('util');

logalytics = function (opts) {

  // settings
  this.folder = path.join(__dirname, '..', 'logs');
  this.file = path.join(this.folder, 'handle.log');

  // output format
  this.format = ':host :port :body'

  // internal commands to give control over output flow
  commands = [':body', ':params', ':query', ':error', ':host', ':port', ':session'];

  // call our emitter on this
  emitter.call(this);

  // if we want to pass some options we can
  if (typeof opts != 'undefined') {
    _.extend(this, opts);
  } else {
    opts = {};
  };

  // contain scope
  self = this;

  // init event, makes folders
  this.init = function () {
    this.emit('init');
  };

  // check folders, but only once
  this.once('init', function () {

    fs.exists(self.folder, function (exists) {
  
      if (exists == false) {
  
        mkdirp.sync(self.folder);

      }
    });
  });


  this.formatOutput = function (err, req, res, next) {

    // format string to place into files
    format = self.format.split(' ');
    sanitized = [];
    logObject = {};
    if (_.isArray(format)) {

      for (var i=0;i<format.length;++i) {

        if (commands.indexOf(format[i]) != -1) {
          sanitized.push(format[i]);
        }

        // switch through our different types and format out our
        // response. 

        switch (format[i]) {

          case ":body" :
            format[i] = {body: req.body};
            _.extend logObject, format[i];
            break;

          case ":params" :
            format[i] = {params: req.params};
            _.extend logObject, format[i];            
            break;

          case ":query" :
            format[i] = {query: req.query};
            _.extend logObject, format[i];
            break;

          case ":error" :
            format[i] = {error: err};
            _.extend logObject, format[i];            
            break;

          case ":host" :
            format[i] = {host: req.app.get('host')}
            _.extend logObject, format[i];
            break;

          case ":port" :
            format[i] = {port: req.app.get('port')}
            _.extend logObject, format[i];
            break;

          case ":session" :
            format[i] = {session: req.session}
            _.extend logObject, format[i];            
            break;

        };
      }

      this.emit('logger', logObject);

      // fire next
      next();
    }
  }

  // listenOnStdOut allows us to hook into
  // process.stdout so we don't have to 
  // manipulate existing code bases to get
  // proper error handling.
  this.listenOnStdOut = function (fn) {

    // set `old` to current process.stdout.write
    var old = process.stdout.write

    // reset process.stdout to handle a fn
    process.stdout.write = (function (write) {
      
      return function(string, encoding, fd) {
      
        write.apply(process.stdout, arguments);
      
        fn(string, encoding, fd);
      
      }
    
    })(process.stdout.write);

    // allow stop listening on stream
    return function () {
      process.stdout.write = old;
    };
  };

  // another event to listen for logging
  // streams
  this.logger = function (data) {
    return this.emit('logger', data);
  };

  this.on('logger', function (data) {
    return console.log(data);
  });

  // add an external listener so they 
  // can be custom
  this.externalize = function (data) {
    return this.emit('externalize', data);
  };

  // pass a write emitter
  this.write = function (data) {
    return this.emit('data', data);
  };

  this.on('data', function (data) {
    return console.log('Received data: "' + data + '"');
  });

  return this;

};

// inherit our superconstructor
util.inherits(logalytics, emitter);

var testLog = new logalytics();

testLog.init();

testLog.logger('sample data streaming');

testLog.on('externalize', function (data) {
  console.log(data);
});

testLog.externalize('here\'s some data to stream');

testLog.write('write stream working!!!');

var st = null;

// test our stopListening of stdout
var stopListening = testLog.listenOnStdOut(function(string, encoding, fd) {
  if (string) {
    st = string;
  }
});

console.log('hi john');

// call stopListening to remove connection to stdout.
stopListening();