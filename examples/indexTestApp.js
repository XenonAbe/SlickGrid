databaseOpen(function() {
	databaseRevsCount();
});


function createnew() {
	dataObj = {
		str: document.getElementById("textinput").value
	};
	var afterAdd = function(revdata) {
		console.log("Revision " + count + " created...");
		console.log(revdata); //logically revData = dataObj
	};
	addNewRevision(afterAdd, dataObj);
}

function loadrev() {
	val = +document.getElementById("textinput").value;
	var afterLoad = function(record) {
		console.log("Loading revision " + val + "...");
		console.log(record.revData);
	};
	loadRevision(val, afterLoad, +document.getElementById("textinput").value);
}

function updaterev() {
	var modifyFunction = function(oldRec) {
		oldRec.revData = Date.now();
		return oldRec;
	};
	val = +document.getElementById("textinput").value;
	var afterUpdate = function(updatedRec) {
		console.log("Updated revision " + val + "...");
		console.log(updatedRec);
	};
	updateRev(val, modifyFunction, afterUpdate);
}

function deleterev() {
	var val = +document.getElementById("textinput").value;
	var afterDelete = function() {
		console.log("Deleted the revision " + val + "...");
	}
	deleteRev(val, afterDelete);
}
