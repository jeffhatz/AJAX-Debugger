// AJAX Debugger Copyright (C) 2013 Jeff Hatz. All rights reserved.


/* Defaults */
var defGroupExpanded = "false",
	defTimerEnabled = "true",
	defTimerTime = 1000,
	defShowResponseObject = "true";
	defResponseContent = "false",
	defResponseContentStandalone = "false";

loadOptions();
bindEvents();


function bindEvents() {
	$("#prefShowResponseObject").on("change", function(e) {
		displayLoadResponseContent(e.currentTarget);
	});

	$("#prefResponseContent").on("change", function(e) {
		displayLoadResponseContent(e.currentTarget, $('#moduleLoadResponseContentStandalone'));
	});

	$(".saveOptions").on("click", function(e) {
		localStorage["prefGroupExpanded"] = getSelectValue("prefGroupExpanded");
		localStorage["prefTimerEnabled"] = getSelectValue("prefTimerEnabled");
		localStorage["prefTimerTime"] = parseInt(getSelectValue("prefTimerTime"));
		localStorage["prefResponseContent"] = getSelectValue("prefResponseContent");
		localStorage["prefResponseContentStandalone"] = getSelectValue("prefResponseContentStandalone");
		localStorage["prefShowResponseObject"] = getSelectValue("prefShowResponseObject");

		renderNoticePref("Preferences Saved");
	});

	$(".resetOptions").on("click", function(e) {
		var confirmReset = confirm("Are you sure you want to reset all preferences to their default?");

		if (confirmReset) {
			localStorage["prefGroupExpanded"] = defGroupExpanded;
			localStorage["prefTimerEnabled"] = defTimerEnabled;
			localStorage["prefTimerTime"] = defTimerTime;
			localStorage["prefResponseContent"] = defResponseContent;
			localStorage["prefResponseContentStandalone"] = defResponseContentStandalone;
			localStorage["prefShowResponseObject"] = defShowResponseObject;
			renderNoticePref("Default preferences loaded");

			loadOptions();  // Load to refresh view
		}
	});
}


function displayLoadResponseContent(self, elementToToggle) {
	elementToToggle = elementToToggle || $("#moduleLoadResponseContent");

	if ($(self).val() == "true") {
		elementToToggle.removeClass("hidden");
	} else {
		elementToToggle.addClass("hidden");
	}
}

function loadOptions() {
	var groupExpanded = localStorage["prefGroupExpanded"] || defGroupExpanded;
		timerEnabled = localStorage["prefTimerEnabled"] || defTimerEnabled;
		timerTime = localStorage["prefTimerTime"] || defTimerTime;
		responseContent = localStorage["prefResponseContent"] || defResponseContent;
		responseObjectStandalone = localStorage["prefResponseContentStandalone"] || defResponseContentStandalone;
		responseObject = localStorage["prefShowResponseObject"] || defShowResponseObject;

	setSelectValue("prefGroupExpanded", groupExpanded);
	setSelectValue("prefTimerEnabled", timerEnabled);
	document.getElementById("prefTimerTime").value = timerTime;
	setSelectValue("prefResponseContent", responseContent);
	setSelectValue("prefResponseContentStandalone", responseObjectStandalone);
	setSelectValue("prefShowResponseObject", responseObject);

	displayLoadResponseContent($("#prefShowResponseObject"));  //Show #moduleLoadResponseContent
	displayLoadResponseContent($("#prefResponseContent"), $("#moduleLoadResponseContentStandalone"));  //Show #moduleLoadResponseContentStandalone
}

function getSelectValue(element) {
	return $("#"+element).val();
}

function setSelectValue(element, savedValue) {
	element = document.getElementById(element);

	for (var i=0, len=element.children.length; i<len; i++) {
		var child = element.children[i];

		if (child.value == savedValue) {
			child.selected = "true";
			break;
		}
	}
}

function renderNoticePref(message) {
	$(".noticePref").html(message);
	$(".noticePref").addClass("noticePref--show");

	setTimeout(function() {
		$(".noticePref").removeClass("noticePref--show");
	}, 4000);
}