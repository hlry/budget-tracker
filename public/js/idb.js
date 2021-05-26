// variable to hold db connection
let db;

// establish connection to IndexedDB db
const request = indexedDB.open('budget', 1);

// emit if the db version changes 
request.onupgradeneeded = function (event) {
    //save a reference to the database
    const db = event.target.result;
    //create an object store called `new_transaction`. set it to have an auto incrementing primary key
    db.createObjectStore('new_transaction', { autoIncrement: true })
};

// upon success
request.onsuccess = function (event) {
    //when db is successfully created with its object store
    db = event.target.result;

    //if app is online, run uploadTransaction() function 
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    //log error here
    console.log(event.target.errorCode);
}

// executes if transaction attempted when no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //add record to your store with add method
    transactionObjectStore.add(record);
};

function uploadTransaction() {
    //open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access your object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //get all record from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    //upon a successful .getAll() exectuion, run this function
    getAll.onsuccess = function () {
        // send any data to api store if present in indexedDB's store
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    console.log(serverResponse);
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open a new transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite')

                    //access new_transaction object store
                    const transactionObjectStore = transaction.objectStore('new_transaction');

                    // clear all stored objects
                    transactionObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

//listen for app coming back online
window.addEventListener('online', uploadTransaction);