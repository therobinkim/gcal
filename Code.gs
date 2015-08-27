/**
 * @NotOnlyCurrentDoc  Allows the script to access more docs than this docs
 */

var SIDEBAR_TITLE = 'Calendar Events';

/**
 * Adds a custom menu with items to show the sidebar and dialog.
 *
 * @param {Object} e The event parameter for a simple onOpen trigger.
 */
function onOpen(e) {
  SpreadsheetApp.getUi()
      .createAddonMenu()
      .addItem('Show sidebar', 'showSidebar')
      .addToUi();
}

/**
 * Runs when the add-on is installed; calls onOpen() to ensure menu creation and
 * any other initializion work is done immediately.
 *
 * @param {Object} e The event parameter for a simple onInstall trigger.
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar. The sidebar structure is described in the Sidebar.html
 * project file.
 */
function showSidebar() {
  var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(SIDEBAR_TITLE);
  SpreadsheetApp.getUi().showSidebar(ui);
}
// SpreadsheetApp.getActiveSpreadsheet().getRange(4, CAL.eventID1 + 1, numRows, 2);
function getEventsFromSheet(){
  return SpreadsheetApp.getActiveSpreadsheet().getActiveRange().getValues();
}

function getCalendar(rangeName){
  var calendarID = SpreadsheetApp.getActiveSpreadsheet().getRangeByName(rangeName);
  if (calendarID) {
    return CalendarApp.getCalendarById(calendarID.getValue())
  }
  return null;
}

// CALENDAR_PARAMETER_INDICES
var CAL = {
  studentFacing: alphaToNumber('A'),
  allDay: alphaToNumber('C'),
  startTime: alphaToNumber('E'),
  endTime: alphaToNumber('H'),
  title: alphaToNumber('I'),
  description: alphaToNumber('J'),
  location: alphaToNumber('K'),
  guests: alphaToNumber('L'),
  prependToTitle: alphaToNumber('M'),
  appendToTitle: alphaToNumber('N'),
  eventID1: alphaToNumber('O'),
  eventID2: alphaToNumber('P'),
};

function alphaToNumber(letter) {
  return letter.charCodeAt(0) - "A".charCodeAt(0);
}

function updateCalendar(options) {
  Logger.log('trying to udpate Calendar');
  var staffCal = getCalendar("StaffCalendarID");
  var studentCal = getCalendar("StudentCalendarID");
  var calendars = [];
  staffCal && calendars.push(staffCal);
  if(options.onlyTest === false) {
    studentCal && calendars.push(studentCal);
  }
  var events = getEventsFromSheet();

  clearEventsInRange(events, calendars);

  if(options.onlyDelete === false) {
    events.forEach(function(event){
      try {
        // prepend
        if (event[CAL.prependToTitle]) {
          event[CAL.prependToTitle] = "[" + event[CAL.prependToTitle] + "] ";
        }
        // append
        if (event[CAL.appendToTitle]) {
          event[CAL.appendToTitle] = " (" + event[CAL.appendToTitle] + ")";
        }
        if (options.onlyTest === false && event[CAL.studentFacing] === "yes") {
          studentCal && studentCal.createEvent(event[CAL.title], new Date(event[CAL.startTime]), new Date(event[CAL.endTime]));
        }
        staffCal && staffCal.createEvent(event[CAL.prependToTitle] + event[CAL.title] + event[CAL.appendToTitle], new Date(event[CAL.startTime]), new Date(event[CAL.endTime]), { description: event[CAL.description], location: event[CAL.location], guests: options.onlyTest ? '' : event[CAL.guests] });
      }
      catch (e) {
        Logger.log('ERROR');
        Logger.log(e);
      }
    });
  }
}

function clearEventsInRange(events, calendars){
  var firstEventStartTime = new Date(events[0][CAL.startTime]);
  var lastEventStartTime = new Date(events[events.length - 1][CAL.endTime]);

  calendars.forEach(function(calendar){
    calendar.getEvents(firstEventStartTime, lastEventStartTime).forEach(function(event){
      event.deleteEvent();
    });
  });
}

/**
 * Executes the specified action (create a new sheet, copy the active sheet, or
 * clear the current sheet).
 *
 * @param {String} action An identifier for the action to take.
 */
function modifySheets(action) {
  // Use data collected from dialog to manipulate the spreadsheet.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheet = ss.getActiveSheet();
  if (action == "create") {
    ss.insertSheet();
  } else if (action == "copy") {
    currentSheet.copyTo(ss);
  } else if (action == "clear") {
    currentSheet.clear();
  }
}