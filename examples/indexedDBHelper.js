// Some global variables (database, references to key UI elements)
var db, count;

function databaseOpen(callback) {
	// Open a database, specify the name and version
	var version = 1;
	var request = indexedDB.open('revisionsDB', version);

	// Run migrations if necessary
	request.onupgradeneeded = function(e) {
		db = e.target.result;
		e.target.transaction.onerror = databaseErrorOutput;
		var store = db.createObjectStore('revisions', {
			keyPath: 'id',
			autoIncrement: true
		});
		store.createIndex('revNo', 'revNo', {
			unique: false
		});

	};
	request.onsuccess = function(e) {
		db = e.target.result;
		callback();
	};
	request.onerror = databaseErrorOutput;
}

function databaseErrorOutput(e) {
	console.error('An IndexedDB Error has occurred', e);
}

function databaseRevsAdd(revVal, revDataObj, callback) { //can do something with the revision object after adding**not the whole record**
	var transaction = db.transaction(['revisions'], 'readwrite');
	var store = transaction.objectStore('revisions');
	var revItem = {
		revNo: revVal,
		revData: revDataObj
	};
	var request = store.put(revItem);

	transaction.oncomplete = function(e) {
		count = count + 1;
		callback(revDataObj);
	};
	request.onerror = databaseErrorOutput;
}

function databaseModifyRevsAbove(revVal, callback) { //do something with each record with revision number above the revVal
	var transaction = db.transaction(['revisions'], 'readonly');
	var store = transaction.objectStore('revisions');
	var index = store.index("revNo");
	// Get everything in the store
	var keyRange = IDBKeyRange.lowerBound(revVal);
	var cursorRequest = index.openCursor(keyRange);
	// This fires once per row in the store
	cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		// If there's data, add it to array
		if (result) {
			callback(result.value);
			result.continue();
			// Reach the end of the data
		}
	};
}

function databaseRevsGetOne(revID, callback) { //do something with the record item found after getting
	var transaction = db.transaction(['revisions'], 'readonly');
	var store = transaction.objectStore('revisions');
	var index = store.index("revNo");
	index.get(revID).onsuccess = function(event) {
		if (event.target.result)
			callback(event.target.result);
	};
}

function databaseRevsUpdate(id, callback, onCompleteFunction) { //do something with the old record data item, do something with the updated record data item 
	var transaction = db.transaction(['revisions'], 'readwrite');
	var store = transaction.objectStore('revisions');
	var request = store.get(id);
	request.onerror = function(event) {
		// Handle errors!
	};
	request.onsuccess = function(event) {
		// Get the old value that we want to update
		var data = request.result;

		// update the value(s) in the object that you want to change
		data = callback(data);
		// Put this updated object back into the database.
		var requestUpdate = store.put(data);
		requestUpdate.onerror = function(event) {
			// Do something with the error
		};
		requestUpdate.onsuccess = function(event) {
			// Success - the data is updated!
			onCompleteFunction(data); //do  somethinng with the updated data record
		};
	};
}

function databaseRevsCount(callback) {
	var transaction = db.transaction(['revisions'], 'readonly');
	var store = transaction.objectStore('revisions');
	var req = store.count();
	req.onsuccess = function(evt) {
		count = req.result;
		callback();
	};
	req.onerror = function(evt) {

	};
}

function databaseRevsDelete(id, callback) { //do something like echoing, no arguments in the function
	var transaction = db.transaction(['revisions'], 'readwrite');
	var store = transaction.objectStore('revisions');
	var request = store.delete(id);
	transaction.oncomplete = function(e) {
		count = count - 1;
		callback();
	};
	request.onerror = databaseErrorOutput;
}

function loadRevision(val, callback, dataObj) { //do something with read record or inserted recordObject
	var numrevs = count; //todo if add a new revision in empty database
	if (val == numrevs) {
		if (confirm("Create revision number " + val + "...")) {
			databaseRevsAdd(val, dataObj, callback);
		}
	} else if (val > numrevs) {
		alert("Invalid Revision Number...");
	} else {
		databaseRevsGetOne(val, callback);
	}
}

function addNewRevision(callback, dataObj) {
	return loadRevision(count, callback, dataObj);
}

function updateRev(revNum, modifyFunction, onCompleteFunction) {
	databaseRevsGetOne(revNum, function(record) {
		databaseRevsUpdate(record.id, modifyFunction, onCompleteFunction);
	});
}

function deleteRev(val, callback) {
	var numrevs = count;
	if (val <= numrevs) {
		databaseRevsGetOne(val, function(record) {
			var id = record.id;
			var modifyFunction = function(oldRecord) {
				oldRecord.revNo = oldRecord.revNo - 1;
				return oldRecord;
			}
			databaseRevsDelete(id, function() {
				callback();
				databaseModifyRevsAbove(val, function(oldrecord) {
					databaseRevsUpdate(oldrecord.id, modifyFunction, function(data) {});
				});
			});
		});
	}
}
