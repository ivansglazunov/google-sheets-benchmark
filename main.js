var Benchmark = require('benchmark');
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var platform = require('platform');
var _ = require('lodash');

exports.BenchmarksSheet = function(sheet) {
  this.sheet = sheet;
};

exports.BenchmarksSheet.prototype.parse = function(event) {
  var hz = event.target.hz;
  var speed = hz.toFixed(hz < 100 ? 2 : 0);
  var info = JSON.parse(event.target.name);
  return _.extend(
    {
      suite: event.currentTarget.name,
      speed: speed,
      distortion: event.target.stats.rme.toFixed(2),
      platform: platform.name,
      version: platform.version,
      os: platform.os.family,
    },
    info
  );
};

exports.BenchmarksSheet.prototype.generateQuery = function(packed) {
  var query = [];

  for (var p in packed) {
    if (p !== 'speed' && p !== 'distortion')
    query.push(p + ' = ' + (_.isString(packed[p]) ? '"' + packed[p] + '"' : packed[p]));
  }

  return query.join(' and ');
};

exports.BenchmarksSheet.prototype.cycle = function(sheet, packed, callback) {
  sheet.getRows(
    {
      limit: 1,
      query: this.generateQuery(packed),
    },
    function (error, rows) {
      if (error) throw error;
      if (rows.length) {
        _.extend(rows[0], packed);
        rows[0].save();
        sheet.bulkUpdateCells(rows, function(error) { if (callback) callback(error); });
      } else {
        sheet.addRow(packed, function(error) { if (callback) callback(error); });
      }
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

exports.pack = function(config) {
  return JSON.stringify(config);
}
