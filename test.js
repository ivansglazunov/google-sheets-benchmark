
var gsb = require('./');
var async = require('async');
var Benchmark = require('benchmark');

var spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
var credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

var suite = new Benchmark.Suite('abcd');

suite.add('a', function() {});
suite.add(gsb.stringify('b'), function() {});
// equal to
suite.add(gsb.stringify({
  name: 'c',
  // custom data, must exists columns with specified names
  tags: 'x,y,z',
  count: 1,
}), function() {});

gsb.getSheet(
  spreadsheetId, credentials,
  process.env.GOOGLE_SHEET_NAME, // <- your sheet name
  function (error, sheet) {
    if (error) throw error;
    var bs = new gsb.BenchmarksSheet({ sheet: sheet });
    
    var results = [];
    suite.on('cycle', function(event) {
      results.push(bs.parse(event));
    });

    suite.on('complete', function() {
      async.each(
        results,
        function(result, next) {
          bs.save(result, next);
        },
      );
    });

    suite.run({ async: true });
  }
);