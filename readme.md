# google-sheets-benchmark

Save benchmark.js's output into google spreadsheet with tags, variables and platform info.

[![NPM](https://img.shields.io/npm/v/google-sheets-benchmark.svg)](https://www.npmjs.com/package/google-sheets-benchmark)

## Usage

Adds new statistical results to the table after the testing is completed.

Looks for the old row with the result of each test for all fields except speed and distortion. If it finds - rewrites row, if not - adds a new row.

1. Generate json google key with [instruction from google-spreadsheet package](https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method)
2. Prepare google spreasheet with (for example) sheet name `mySheetName`, required columns: `suite,name,speed,distortion,platform,version,os`. and any custom columns.
    > Do not forget to add an email from json to the shared list.
3. Prepare variables like this:
  ```js
  var gsb = require('google-sheets-benchmark');
  var async = require('async');
  var Benchmark = require('benchmark');

  var spreadsheetId = '1qSYo1KCHePJ7cOX4r9ouKJGyXTDX9srTCsYWXX-K2Jg'; // <- your sheet id
  var credentials = require('./your-google-key.json'); // <- your json
  ```
4. Write benchmarks like this:
  ```js
  var suite = new Benchmark.Suite('abcd');

  suite.add(gsb.pack({
    name: 'lyrical description',
    // and any custom data
    tags: 'for,array',
    count: 1,
  }), function() {});
  ```
5. Get sheet and run tests like this:
  ```js
  gsb.getSheet(
    spreadsheetId, credentials,
    'mySheetName', // <- your sheet name
    function (error, sheet) {
      if (error) throw error;
      var bs = new gsb.BenchmarksSheet(sheet);
      
      var packeds = [];
      suite.on('cycle', function(event) {
        packeds.push(bs.parse(event));
      });

      suite.on('complete', function() {
        async.each(
          packeds,
          function(packed, next) {
            bs.cycle(sheet, packed);
          },
        );
      });

      suite.run({ async: true });
    }
  );
  ```
6. Enjoy filling your google sheet.
