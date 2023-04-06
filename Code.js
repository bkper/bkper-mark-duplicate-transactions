
function findMarkPossibleDuplicateTransactions() {
  const bookId = "agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAoKmn77EJDA"; // Replace with the ID of your Bkper book
  const book = BkperApp.getBook(bookId);
  const afterDate = "01/01/2023"; // Replace with your desired start date
  const beforeDate = "01/01/2024"; // Replace with your desired end date
  const transactions = book.getTransactions(`after:${afterDate} before:${beforeDate}`);

  const uniqueIdentifiers = {};
  const duplicates = {};

  while (transactions.hasNext()) {
    const transaction = transactions.next();
    const identifier = `${transaction.getAmount()}-${transaction.getDate()}`; // Use amount and date to identify duplicates
    const description = transaction.getDescription();
    // Check if this transaction is a possible duplicate and has not already been marked
    if (uniqueIdentifiers[identifier] && description.indexOf("#possibleduplicate") === -1) {
      if (duplicates[identifier]) {
        duplicates[identifier].push(transaction.getId());
      } else {
        duplicates[identifier] = [uniqueIdentifiers[identifier], transaction.getId()];
      }
    } else {
      uniqueIdentifiers[identifier] = transaction.getId();
    }
  }

  for (const identifier in duplicates) {
    const duplicateIds = duplicates[identifier];
    const random = Math.floor(Math.random() * 10000000000);
    for (let i = 0; i < duplicateIds.length; i++) {
      const tx = book.getTransaction(duplicateIds[i]);
      let description = tx.getDescription();
      if (description.indexOf("#possibleduplicate") === -1) {
        description += ` #possibleduplicate #${random}`;
        tx.setDescription(description);
        tx.update();
      }
    }
    const tx1 = book.getTransaction(duplicateIds[0]);
    const amount = tx1.getAmount();
    const date = tx1.getDate();
    Logger.log("Duplicate transactions found:");
    Logger.log(`IDs: ${duplicateIds.join(", ")}`);
    Logger.log(`Amount: ${amount}`);
    Logger.log(`Date: ${date}`);
    Logger.log(`Random number: ${random}`);
  }
}

