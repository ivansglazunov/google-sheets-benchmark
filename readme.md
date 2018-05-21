# google-sheets-benchmark

Save benchmark.js's output into google spreadsheet with tags, variables and platform info.

[![NPM](https://img.shields.io/npm/v/google-sheets-benchmark.svg)](https://www.npmjs.com/package/google-sheets-benchmark)

## Usage

Adds new statistical results to the table after the testing is completed.

Looks for the old row with the result of each test for all fields except speed and distortion. If it finds - rewrites row, if not - adds a new row. You can ovverride it condition in method `bs.handleRows` or set `new gsb.BenchmarksSheet({ sheet: sheet, allowUpdate: false });`.

1. Generate json google key with [instruction from google-spreadsheet package](https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method)
2. Prepare google spreasheet with (for example) sheet name `mySheetName`, required columns: `suite,name,speed,distortion,platform,version,os,unixtime`. and any custom columns.
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

  suite.add('a', function() {});
  suite.add(gsb.stringify('b'), function() {});
// equal to
  suite.add(gsb.stringify({
    name: 'c',
    // custom data, must exists columns with specified names
    tags: 'x,y,z',
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
  ```
6. Enjoy filling your google sheet.

## Test

```sh
GOOGLE_CREDENTIALS=$(<../my-google-key.json) GOOGLE_SPREADSHEET_ID='1qSYo1KCHePJ7cOX4r9ouKJGyXTDX9srTCsYWXX-K2Jg' GOOGLE_SHEET_NAME='results' npm test
```

## Plans

Perhaps the project will soon move to a more controlled channel and form (typescript, trevis, documentation...), or not. Now this is an experiment.
