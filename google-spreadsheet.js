/*
Updated versions can be found at https://github.com/mikeymckay/google-spreadsheet-javascript
*/var GoogleSpreadsheet, GoogleUrl;
GoogleUrl = (function() {
  function GoogleUrl(sourceIdentifier) {
    this.sourceIdentifier = sourceIdentifier;
    if (this.sourceIdentifier.match(/http(s)*:/)) {
      this.url = this.sourceIdentifier;
//       try {
//         this.key = "168xHj4F6vkIU5Bvrot6Hq4goQlYiV8qylLkN1H9-G-I";//this.url.match(/d/(.*?)&/)[1];
//       } catch (error) {
//         this.key = "168xHj4F6vkIU5Bvrot6Hq4goQlYiV8qylLkN1H9-G-I";//this.url.match(/usp=(cells|list)\/(.*?)\//)[2];
//      }
//     } else {
//       this.key = "168xHj4F6vkIU5Bvrot6Hq4goQlYiV8qylLkN1H9-G-I";//this.sourceIdentifier;
//     }
    this.jsonCellsUrl = "http://spreadsheets.google.com/feeds/cells/168xHj4F6vkIU5Bvrot6Hq4goQlYiV8qylLkN1H9-G-I/od6/public/basic?alt=json-in-script";
    this.jsonListUrl = "http://spreadsheets.google.com/feeds/list/168xHj4F6vkIU5Bvrot6Hq4goQlYiV8qylLkN1H9-G-I/od6/public/basic?alt=json-in-script";
    this.jsonUrl = this.jsonCellsUrl;
  }
  return GoogleUrl;
})();
GoogleSpreadsheet = (function() {
  function GoogleSpreadsheet() {}
  GoogleSpreadsheet.prototype.load = function(callback) {
    var intervalId, jsonUrl, safetyCounter, url, waitUntilLoaded;
    url = this.googleUrl.jsonCellsUrl + "&callback=GoogleSpreadsheet.callbackCells";
    $('body').append("<script src='" + url + "'/>");
    jsonUrl = this.jsonUrl;
    safetyCounter = 0;
    waitUntilLoaded = function() {
      var result;
      result = GoogleSpreadsheet.find({
        jsonUrl: jsonUrl
      });
      if (safetyCounter++ > 20 || ((result != null) && (result.data != null))) {
        clearInterval(intervalId);
        return callback(result);
      }
    };
    intervalId = setInterval(waitUntilLoaded, 200);
    if (typeof result != "undefined" && result !== null) {
      return result;
    }
  };
  GoogleSpreadsheet.prototype.url = function(url) {
    return this.googleUrl(new GoogleUrl(url));
  };
  GoogleSpreadsheet.prototype.googleUrl = function(googleUrl) {
    if (typeof googleUrl === "string") {
      throw "Invalid url, expecting object not string";
    }
    this.url = googleUrl.url;
    this.key = googleUrl.key;
    this.jsonUrl = googleUrl.jsonUrl;
    return this.googleUrl = googleUrl;
  };
  GoogleSpreadsheet.prototype.save = function() {
    return localStorage["GoogleSpreadsheet." + this.type] = JSON.stringify(this);
  };
  return GoogleSpreadsheet;
})();
GoogleSpreadsheet.bless = function(object) {
  var key, result, value;
  result = new GoogleSpreadsheet();
  for (key in object) {
    value = object[key];
    result[key] = value;
  }
  return result;
};
GoogleSpreadsheet.find = function(params) {
  var item, itemObject, key, value, _i, _len;
  try {
    for (item in localStorage) {
      if (item.match(/^GoogleSpreadsheet\./)) {
        itemObject = JSON.parse(localStorage[item]);
        for (key in params) {
          value = params[key];
          if (itemObject[key] === value) {
            return GoogleSpreadsheet.bless(itemObject);
          }
        }
      }
    }
  } catch (error) {
    for (_i = 0, _len = localStorage.length; _i < _len; _i++) {
      item = localStorage[_i];
      if (item.match(/^GoogleSpreadsheet\./)) {
        itemObject = JSON.parse(localStorage[item]);
        for (key in params) {
          value = params[key];
          if (itemObject[key] === value) {
            return GoogleSpreadsheet.bless(itemObject);
          }
        }
      }
    }
  }
  return null;
};
/* Newly forked version of GoogleSpreadsheet.callbackCells(), which takes into account empty cells, 
   and writes the data as json in this format:
      { 
        headers: [],
        rows: [] 
      }
  @Ryan Weiss - 10/11/12 (hah)
*/
GoogleSpreadsheet.callbackCells = function(data) {
  var cell, googleSpreadsheet, googleUrl;
  googleUrl = new GoogleUrl(data.feed.id.$t);
  googleSpreadsheet = GoogleSpreadsheet.find({
    jsonUrl: googleUrl.jsonUrl
  });
  if (googleSpreadsheet === null) {
    googleSpreadsheet = new GoogleSpreadsheet();
    googleSpreadsheet.googleUrl(googleUrl);
  }
  googleSpreadsheet.data = (function() {
    var _i, _len, _ref;
    _ref = data.feed.entry;
    var _results = [];
   // console.log("DATA", data, _ref.length, _len);
    _results = [];

    var headers = [];
    var rows = [];

    var cols = "ABCDEFGHIJKLMNOPQRSTUVQXY";
    var expectedCol = 'A', currCol = 0;
    var currRow = 2; //first row of data
    var currRowData = []; //current row data;
    var doHeaderCheck = true; //the data row numbers are not correct, and "1" is returned many times, so we only want the first

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cell = _ref[_i];
      var i = cell.title.$t;
      var d = cell.content.$t;

      //parse the headers:
      var col = i[0]; var row = i.substring(1,i.length);
      //console.log("Row", col, row);

      if(row == "1" && doHeaderCheck) {
        headers.push(d);
      } else {
          doHeaderCheck = false;
          if(row != currRow) {
            //push current row data and start a new row
            rows.push(currRowData);
            currRowData = [];
            currRow = row;
            //reset columns for next row
            currCol = 0;
            expectedCol = cols[currCol];
          }

          if(col != expectedCol) {
            //fill in blank columns
            var keepGoing = true;
            while(keepGoing) {
              if(expectedCol == col)
                break;
              currCol++;
              expectedCol = cols[currCol];
              currRowData.push('');
            }
          }

          currRowData.push(d); 
          currCol++;
          expectedCol = cols[currCol];
      }

      _results.push({ cell:  cell.title.$t, content: cell.content.$t });
    }

    return { headers: headers, rows: rows };
  })();
  googleSpreadsheet.save();
  return googleSpreadsheet;
};
/* TODO (Handle row based data)
GoogleSpreadsheet.callbackList = (data) ->*/
