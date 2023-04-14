// Compiled using bkper-mark-duplicate-transactions 1.0.0 (TypeScript 4.9.5)
// 
function doGet(e) {
    if (!e || !e.parameter || !e.parameter.bookId) {
        // Handle the case when the bookId parameter is missing
        return ContentService.createTextOutput("Missing bookId parameter");
      
    } else {
        
        var bookId = e.parameter.bookId;
        setScriptProperty("bookId", bookId) 
        
        const book = BkperApp.getBook(bookId);
        
        const bookName = book.getName();
        //Logger.log("this book name  "+ bookName);

        var htmlTemplate = HtmlService.createTemplateFromFile('Addon');
        htmlTemplate.dataFromServerTemplate = { bookid: bookId, bookName: bookName };
        var htmlOutput = htmlTemplate.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .setTitle('Bkper Duplicates');

        return htmlOutput;    

        
    }
}

function findDuplicatesGS(startDate, endDate, searchDate, searchAmount, searchFrom, searchTo, searchDescription ){
    const bookId = getScriptProperty("bookId");
    //const afterDate =  getFormatedDate(startDate);
    //const beforeDate = getFormatedDate(endDate);

    const book = BkperApp.getBook(bookId);
    //const transactions = book.getTransactions("after:".concat(afterDate, " before:").concat(beforeDate))
    //Logger.log(transactions)


    if (showDuplicates == true) {
        Logger.log("show duplicates");
      } else {
        Logger.log("mark the duplicates on the book");
        markPossibleDuplicateTransactions(startDate, endDate, searchDate, searchAmount, searchFrom, searchTo, searchDescription);
         book.getTransactions("#possibleduplicate").;    
    }

    
    
//    Logger.log("the period is from: " + startDate + " " + afterDate+  " till: "+ endDate +  " " + beforeDate+  " booo " + bookId);

    return  "made the turn"
}








function markPossibleDuplicateTransactions(startDate, endDate, searchDate, searchAmount, searchFrom, searchTo, searchDescription) {
   
    const afterDate = getFormatedDate(startDate);
    const beforeDate = getFormatedDate(endDate);
  
    Logger.log( "in " + afterDate + " " + beforeDate)
    const bookId = getScriptProperty("bookId");
    const book = BkperApp.getBook(bookId);
    const transactions = book.getTransactions("after: "+ afterDate + " before: " + beforeDate)
  
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
        } else {
          duplicates[identifier] = [uniqueIdentifiers[identifier], transaction.getId()];
        }
      } else {
        uniqueIdentifiers[identifier] = transaction.getId();
      }
    }
  
   
      for (var identifier in duplicates) {
        var duplicateIds = duplicates[identifier];
        var random = Math.floor(Math.random() * 10000000000);
        for (var i = 0; i < duplicateIds.length; i++) {
          var tx = book.getTransaction(duplicateIds[i]);
          var description = tx.getDescription();
          if (description.indexOf("#possibleduplicate") === -1) {
            description += " #possibleduplicate #dup_".concat(random);
            tx.setDescription(description);
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
    
  
    
    
    return
  }
  

  
function removeDuplicateHashtagsGS() {
  const bookId = getScriptProperty("bookId");
  
  const book = BkperApp.getBook(bookId);
  const transactions = book.getTransactions("after:2000");
  
  while (transactions.hasNext()) {
    const transaction = transactions.next();
    let description = transaction.getDescription();
    
    // Remove all hashtags from the description starting with #possibleduplicate and #dup_
    description = description.replace(/#(possibleduplicate|dup_[^\s]+)/g, '');
    
    transaction.setDescription(description.trim());
    transaction.update();
  }
  return "hashtags removed"
}
  




function setScriptProperty(propertyKey, propertyValue) {
    var scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(propertyKey, propertyValue);
    return 
}

function getScriptProperty(propertyKey) {
    var scriptProperties = PropertiesService.getScriptProperties();
    var propertyValue = scriptProperties.getProperty(propertyKey);
    return propertyValue
}  

function getFormatedDate(inputDate){    
  return  Utilities.formatDate(new Date(inputDate), Session.getScriptTimeZone(), 'dd/MM/yyyy');  
}



/*----------- 
//
//testing area 
//
*/

function test(){
    const startDate = "2023-01-14"; 
    const endDate ="2024-04-13";
    const searchDate= true ;
    const searchAmount= false ;
    const searchFrom= false ;
    const searchTo=  false ;
    const searchDescription= true ;
    const showDuplicates= true ;
    const markDuplicates= false;
    
    markPossibleDuplicateTransactions(startDate, endDate, searchDate, searchAmount, searchFrom, searchTo, searchDescription, showDuplicates, markDuplicates );

}



/*
function findMarkPossibleDuplicateTransactions() {
    var bookId = "agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAoKmn77EJDA"; // Replace with the ID of your Bkper book
    var book = BkperApp.getBook(bookId);
    var afterDate = "01/01/2023"; // Replace with your desired start date
    var beforeDate = "01/01/2024"; // Replace with your desired end date
    var transactions = book.getTransactions("after:".concat(afterDate, " before:").concat(beforeDate));
    var uniqueIdentifiers = {};
    var duplicates = {};
    while (transactions.hasNext()) {
        var transaction = transactions.next();
        var identifier = "".concat(transaction.getAmount(), "-").concat(transaction.getDate()); // Use amount and date to identify duplicates
        var description = transaction.getDescription();
        // Check if this transaction is a possible duplicate and has not already been marked
        if (uniqueIdentifiers[identifier] && description.indexOf("#possibleduplicate") === -1) {
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
            if (description.indexOf("#possibleduplicate") === -1) {
                description += " #possibleduplicate #".concat(random);
                tx.setDescription(description);
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
}
*/