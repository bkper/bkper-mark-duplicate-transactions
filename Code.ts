// Compiled using bkper-mark-duplicate-transactions 1.0.0 (TypeScript 4.9.5)
// Compiled using bkper-mark-duplicate-transactions 1.0.0 (TypeScript 4.9.5)
// 
function doGet(e) {
    if (!e || !e.parameter || !e.parameter.bookId) {
        // Handle the case when the bookId parameter is missing
        return ContentService.createTextOutput("Missing bookId parameter");
    }
    else {
        var bookId = e.parameter.bookId;
        setUserProperty("bookId", bookId);
        var book = BkperApp.getBook(bookId);
        var bookName = book.getName();
        setUserProperty("bookName", bookName);
        var bookDatePattern = book.getDatePattern();
        setUserProperty("bookDatePattern", bookDatePattern);
        var bookTimeZone = book.getTimeZone();
        setUserProperty("bookTimeZone", bookTimeZone);
        //const bookTimeZoneOffset = book.getTimeZoneOffset();
        Logger.log(bookDatePattern + " " + bookTimeZone);
        //Logger.log("this book name  "+ bookName);
        var appSettings = getAppSettingsGS();
        var htmlTemplate = HtmlService.createTemplateFromFile('Addon');
        htmlTemplate.dataFromServerTemplate = { bookid: bookId, bookName: bookName, appSettings: appSettings };
        var htmlOutput = htmlTemplate.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .setTitle('Bkper Duplicates');
        return htmlOutput;
    }
}
 

function markPossibleDuplicateTransactionsGS(startDate, endDate, searchDate, searchAmount, searchFrom, searchTo, searchDescription) {
    var afterDate = getFormatedDate(startDate);
    var beforeDate = getFormatedDate(endDate);
    //Logger.log("in " + afterDate + " " + beforeDate);
    var bookId = getUserProperty("bookId");
    var book = BkperApp.getBook(bookId);
    var permission = book.getPermission()
   
    if (!(permission === "OWNER" || permission === "EDITOR")) {
        // Exit the code if it's not OWNER or EDITOR
        return "You do not have enough permission to mark Duplicates";
      }
    

    setUserProperty("startDate", startDate);
    setUserProperty("endDate", endDate);
    setUserProperty("searchDate", searchDate);
    setUserProperty("searchAmount", searchAmount);
    setUserProperty("searchFrom", searchFrom);
    setUserProperty("searchTo", searchTo);
    setUserProperty("searchDescription", searchDescription);
    Logger.log("book get transactions a");

    var transactions = book.getTransactions("after: " + afterDate + " before: " + beforeDate);
    Logger.log("book get transactions b");
    var uniqueIdentifiers = {};
    var duplicates = {};
    while (transactions.hasNext()) {
        var transaction = transactions.next();
        var identifier = "";
        var criteria = [];
        // Set the criteria for identifying duplicates
        if (searchDate && transaction.getDateObject()) {
            criteria.push(transaction.getDateObject().toISOString().substring(0, 10));
        }
        if (searchAmount && transaction.getAmount()) {
            criteria.push(transaction.getAmount());
        }
        if (searchFrom && transaction.getCreditAccountName()) {
            criteria.push(transaction.getCreditAccountName());
        }
        if (searchTo && transaction.getDebitAccountName()) {
            criteria.push(transaction.getDebitAccountName());
        }
        if (searchDescription && transaction.getDescription()) {
            criteria.push(transaction.getDescription());
        }
        identifier = criteria.join("-");
        // Check if this transaction is a possible duplicate and has not already been marked
        if (uniqueIdentifiers[identifier] && transaction.getDescription().indexOf("#possibleduplicate") === -1) {
            if (duplicates[identifier]) {
                duplicates[identifier].push(transaction.getId());
            }
            else {
                duplicates[identifier] = [uniqueIdentifiers[identifier], transaction.getId()];
            }
        }
        else {
            uniqueIdentifiers[identifier] = transaction.getId();
        }
    }
    for (var identifier in duplicates) {
        var duplicateIds = duplicates[identifier];
        var random = Math.floor(Math.random() * 10000000000);
        for (var i = 0; i < duplicateIds.length; i++) {
            var tx = book.getTransaction(duplicateIds[i]);
            var description = tx.getDescription();

            Logger.log( "testing record only " + description)
            if (description.indexOf("#possibleduplicate") === -1) {
                description += " #possibleduplicate #dup_".concat(random);
                tx.setDescription(description);
                Logger.log("Im here")

                tx.update();
                
            }
        }
        var tx1 = book.getTransaction(duplicateIds[0]);
        var amount = tx1.getAmount();
        var date = tx1.getDate();
        Logger.log("Duplicate transactions found:");
        Logger.log("IDs: ".concat(duplicateIds.join(", ")));
        Logger.log("Amount: ".concat(amount));
        Logger.log("Date: ".concat(date));
        Logger.log(" test Random number: ".concat(random));
    }
    return "Duplicates Marked";
}
function removeDuplicateHashtagsGS() {
    var bookId = getUserProperty("bookId");
    var book = BkperApp.getBook(bookId);
    var permission = book.getPermission()
   
    if (!(permission === "OWNER" || permission === "EDITOR")) {
        // Exit the code if it's not OWNER or EDITOR
        return "You do not have enough permission to remove Duplicate hashtags ";
      }

    var transactions = book.getTransactions("#possibleduplicate");
    while (transactions.hasNext()) {
        var transaction = transactions.next();
        var description = transaction.getDescription();
        // Remove all hashtags from the description starting with #possibleduplicate and #dup_
        description = description.replace(/#(possibleduplicate|dup_[^\s]+)/g, '');
        transaction.setDescription(description.trim());
        transaction.update();
    }
    return "hashtags removed";
}
function getAppSettingsGS() {
    var startDate = getUserProperty("startDate");
    var endDate = getUserProperty("endDate");
    var searchDate = getUserProperty("searchDate");
    var searchAmount = getUserProperty("searchAmount");
    var searchFrom = getUserProperty("searchFrom");
    var searchTo = getUserProperty("searchTo");
    var searchDescription = getUserProperty("searchDescription");
    Logger.log("getappsettingsgs searchfrom " + searchFrom);
    if (startDate === null && endDate === null && searchDate === null && searchAmount === null && searchFrom === null && searchTo === null && searchDescription === null) {
        var appSettings = false;
    }
    else {
        var appSettings = true;
    }
    var returnObject = { appSettings: appSettings, startDate: startDate, endDate: endDate, searchDate: searchDate, searchAmount: searchAmount, searchFrom: searchFrom, searchTo: searchTo, searchDescription: searchDescription };
    return returnObject;
}
function setUserProperty(propertyKey, propertyValue) {
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(propertyKey, propertyValue);
    return;
}
function getUserProperty(propertyKey) {
    var userProperties = PropertiesService.getUserProperties();
    var propertyValue = userProperties.getProperty(propertyKey);
    return propertyValue;
}
function getFormatedDate(inputDate) {
    var bookDatePattern = getUserProperty("bookDatePattern");
    return Utilities.formatDate(new Date(inputDate), Session.getScriptTimeZone(), bookDatePattern);
}
