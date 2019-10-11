// 2019 by Gonçalo Silva
// Based on https://blog.squix.org
// To deploy this code create or open an existing Sheet in Google Sheets and click Tools > Script editor and enter the code below
// 1. Enter sheet name where data is to be written below
var SHEET_NAME = "Data recovered";
// 2. Run > setup
// 3. Publish > Deploy as web app
//    - enter Project Version name and click 'Save New Version'
//    - set security level and enable service (most likely execute as 'me' and access 'anyone, even anonymously)
// 4. Copy the 'Current web app URL' and post this in your form/script action
var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

// If you don't want to expose either GET or POST methods you can comment out the appropriate function
//function doGet(e){
//  return handleResponse(e);
//}
function doPost(e){
  return handleResponse(e);
}

function handleResponse(e) {
  var lock = LockService.getPublicLock();
  lock.waitLock(30000); // wait 30 seconds before conceding defeat.
  try {
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(SHEET_NAME); 
    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    //var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow()+1; // get next row
    var row = [];
    var headerRow = [];
    // loop through the header columns
    var jsonData = JSON.parse(e.postData.contents);
    headerRow.push("jsonData.app_id");
    headerRow.push("jsonData.dev_id");
    headerRow.push("jsonData.hardware_serial");
    headerRow.push("jsonData.port");
    headerRow.push("jsonData.counter");
    headerRow.push("jsonData.payload_raw");
    headerRow.push("jsonData.payload_decoded");
    headerRow.push("jsonData.metadata.time");
    headerRow.push("jsonData.metadata.frequency");
    headerRow.push("jsonData.metadata.modulation");
    headerRow.push("jsonData.metadata.data_rate");
    headerRow.push("jsonData.metadata.coding_rate");
    headerRow.push("jsonData.metadata.downlink_url");
    for (var i = 0; i < jsonData.metadata.gateways.length; i++) {
      var gateway = jsonData.metadata.gateways[i];
      headerRow.push("gateway.gtw_id");
      headerRow.push("gateway.timestamp");
      headerRow.push("gateway.channel");
      headerRow.push("gateway.rssi");
      headerRow.push("gateway.snr");
      headerRow.push("gateway.latitude");
      headerRow.push("gateway.longitude");
      headerRow.push("gateway.altitude");
    }
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    row.push(jsonData.app_id);
    row.push(jsonData.dev_id);
    row.push(jsonData.hardware_serial);
    row.push(jsonData.port);
    row.push(jsonData.counter);
    row.push(jsonData.payload_raw);
    var raw = Utilities.base64Decode(jsonData.payload_raw);
    //var raw = jsonData.payload_raw;
    var decoded = Utilities.newBlob(raw).getDataAsString();
    row.push(decoded);
    row.push(jsonData.metadata.time);
    row.push(jsonData.metadata.frequency);
    row.push(jsonData.metadata.modulation);
    row.push(jsonData.metadata.data_rate);
    row.push(jsonData.metadata.coding_rate);
    row.push(jsonData.metadata.downlink_url);
    for (var i = 0; i < jsonData.metadata.gateways.length; i++) {
      var gateway = jsonData.metadata.gateways[i];
      row.push(gateway.gtw_id);
      row.push(gateway.timestamp);
      row.push(gateway.channel);
      row.push(gateway.rssi);
      row.push(gateway.snr);
      row.push(gateway.latitude);
      row.push(gateway.longitude);
      row.push(gateway.altitude);
    }
    // more efficient to set values as [][] array than individually
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    // return json success results
    return ContentService
      .createTextOutput(JSON.stringify({"result":"success", "row": nextRow}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    // if error return this
    return ContentService
      .createTextOutput(JSON.stringify({"result":"error", "error": e}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally { //release lock
    lock.releaseLock();
  }
}

function setup() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  SCRIPT_PROP.setProperty("key", doc.getId());
}