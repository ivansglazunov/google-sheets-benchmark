var Benchmark = require('benchmark');
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var platform = require('platform');
var _ = require('lodash');

exports.defaultConfig = {
  allowUpdate: true,
};

exports.BenchmarksSheet = function(config) {
  this.config = _.defaults(config, exports.defaultConfig);
  this.sheet = this.config.sheet;
};

exports.BenchmarksSheet.prototype.parse = function(event) {
  var hz = event.target.hz;
  var speed = hz.toFixed(hz < 100 ? 2 : 0);
  try {
    var info = JSON.parse(event.target.name);
  } catch(error) {
    var info = { name: event.target.name };
  }
  return _.extend(
    {
      suite: event.currentTarget.name,
      speed: speed,
      distortion: event.target.stats.rme.toFixed(2),
      platform: platform.name,
      version: platform.version,
      os: platform.os.family,
      unixtime: new Date().valueOf(),
    },
    info
  );
};

exports.BenchmarksSheet.prototype.generateQuery = function(result) {
  var query = [];

  for (var p in result) {
    if (p !== 'speed' && p !== 'distortion' && p !== 'unixtime')
    query.push(p + ' = ' + (_.isString(result[p]) ? '"' + result[p] + '"' : result[p]));
  }

  return query.join(' and ');
};

exports.BenchmarksSheet.prototype.handleRows = function(rows, result, callback) {
  if (this.config.allowUpdate && rows.length) {
    _.extend(rows[0], result);
    rows[0].save();
    this.sheet.bulkUpdateCells(rows, function(error) {
      if (callback) callback(error);
    });
  } else {
    this.sheet.addRow(result, function(error) {
      if (callback) callback(error);
    });
  }
};

exports.BenchmarksSheet.prototype.cycle = function(result, callback) {
  var bs = this;
  this.sheet.getRows(
    {
      limit: 1,
      query: this.generateQuery(result),
    },
    function (error, rows) {
      if (error) callback(error);
      else bs.handleRows(rows, result, callback);
    }
  );
};

exports.getSheet = function(spreadsheetId, credentials, sheetName, callback) {
  var spreadsheet = new GoogleSpreadsheet(spreadsheetId);
  spreadsheet.useServiceAccountAuth(
    credentials,
    function (error) {
      if (error) {
        callback(error);
      } else {
        spreadsheet.getInfo(function(error, info) {
          if (error) callback(error);
          else {
            callback(null, _.find(info.worksheets, { title: sheetName }));
          }
        });
      }
    }
  );
};

exports.stringify = function(config) {
  return JSON.stringify(_.isString(config) ? { name: config } : config);
}
