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

  // class constructor'ish
  this.folder = path.join(__dirname, '..', 'logs');
  this.file = path.join(this.folder, 'handle.log');

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
    this.emit('logger', data);
  };

  this.on('logger', function (data) {
    console.log(data);
  });

  // add an external listener so they 
  // can be custom
  this.externalize = function (data) {
    this.emit('externalize', data);
  };

  // pass a write emitter
  this.write = function (data) {
    this.emit('data', data);
  };

  this.on('data', function (data) {
    console.log('Received data: "' + data + '"');
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
