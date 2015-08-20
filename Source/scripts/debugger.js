// AJAX Debugger Copyright (C) 2013 Jeff Hatz. All rights reserved.


// Set default prefs
if (!localStorage["prefGroupExpanded"]) {
	localStorage["prefGroupExpanded"] = "false";
}
if (!localStorage["prefTimerEnabled"]) {
	localStorage["prefTimerEnabled"] = "true";
}
if (!localStorage["prefTimerTime"]) {
	localStorage["prefTimerTime"] = 1000;
}
if (!localStorage["prefShowResponseObject"]) {
	localStorage["prefShowResponseObject"] = "true";
}
if (!localStorage["prefResponseContent"]) {
	localStorage["prefResponseContent"] = "false";
}
if (!localStorage["prefResponseContentStandalone"]) {
	localStorage["prefResponseContentStandalone"] = "false";
}
if (!localStorage["prefRequestContentStandalone"]) {
	localStorage["prefRequestContentStandalone"] = "false";
}


chrome.devtools.network.onRequestFinished.addListener(function(request) {
	var isXHR = AJAXDebugger.isXHR(request);

	if (isXHR) {
		AJAXDebugger.load(request);
	}
});


function AJAXDebugger() {}

AJAXDebugger.isXHR = function(request) {
	for (var i=0, len=request.request.headers.length; i<len; i++) {
		if (
			(request.request.headers[i].name == "X-Requested-With" &&
				request.request.headers[i].value == "XMLHttpRequest") ||
			(request.request.headers[i].name == "Content-Type" &&
				request.request.headers[i].value == "application/x-www-form-urlencoded") ||
			(request.request.url.match(/\.json$/) || request.request.url.match(/\.json?/))
		) {
			return true;
		}
	};

	return false;
}

AJAXDebugger.getRequestLocation = function(request, url) {
	// In some rare cases, there may be a '?' in the Query String
	urlObj = url.split('?');
	url = urlObj[0];

	// If the URL ends with a '/', "step down" one
	if (url.lastIndexOf("/") == url.length - 1) {
		url = url.replace(/\/$/, '');
	}

	// Get filename and beyond
	var location = url.substring(url.lastIndexOf("/") + 1);

	// Remove QueryString
	if (location.indexOf("?") > -1) {
		location = location.substring(0, location.indexOf("?"));
	}

	return location;
}

/* Set display to "s" or "ms", and format time accordingly */
AJAXDebugger.formatTime = function(responseTime) {
	if (responseTime >= 1000) {
		return (responseTime / 1000) + "s";
	}

	return responseTime + "ms";
}

/* Set display to "B" or "KB", and format size accordingly */
AJAXDebugger.formatSize = function(responseSize) {
	if (responseSize >= 1000) {
		return (responseSize / 1000) + "KB";
	}

	return responseSize + "B";
}

/* Dev -> End-User messaging system via console.log */
AJAXDebugger.pager = function() {
	var message = "";
	Console.warn(message);
};

AJAXDebugger.load = function(request) {
	var url = request.request.url || "",
		qs = "",
		seperatorFirst = (url.indexOf("?") > -1) ? "&" : "?",
		params = (request.request.postData && request.request.postData.params) || [],
		requestLocation,
		responseStatus = request.response.status + " " + request.response.statusText,
		responseSize = request.response.bodySize + request.response.headersSize,
		responseTime = request.time,
		responseTimePrint,
		textSeperator = " - ",
		prefGroupExpanded = localStorage["prefGroupExpanded"],
		prefTimerEnabled = localStorage["prefTimerEnabled"],
		prefTimerTimeout = localStorage["prefTimerTime"],
		prefResponseContent = localStorage["prefResponseContent"];
		prefResponseContentStandalone = localStorage["prefResponseContentStandalone"];
		prefRequestContentStandalone = localStorage["prefRequestContentStandalone"];
		prefShowResponseObject = localStorage["prefShowResponseObject"];

	for (var i=0, len=params.length; i<len; i++) {
		var seperator = (i==0) ? seperatorFirst : "&";
		qs += seperator + params[i].name + "=" + params[i].value;
	};

	/* Request Location */
	if (url.indexOf("F2Apps") > -1) {
		// If the request is to an OpenF2 app, show the App ID as the location
		qs.replace(/%22appId%22%3A%22([a-zA-Z0-9_]*)%22/, function(a,b) {
			requestLocation = b;
		});
	}
	else {
		requestLocation = AJAXDebugger.getRequestLocation(request, url);
	}

	/* Truncate Location */
	var maxVisibleChars = 35;
	if (location.length > maxVisibleChars + 3) {  // ... is 3 chars, so take into account for truncate length
		location = location.substring(0, maxVisibleChars) + "...";
	}

	/* Data formatting */
	responseTimePrint = AJAXDebugger.formatTime(responseTime);
	responseSize = AJAXDebugger.formatSize(responseSize);

	var header =
		"XHR Loaded (" +
		requestLocation + textSeperator +
		responseStatus + textSeperator +
		responseTimePrint + textSeperator +
		responseSize +
		")";

	/* If long response, expand */
	if (prefTimerEnabled == "true" && responseTime >= prefTimerTimeout) { prefGroupExpanded = "true"; }

	var render = function(content) {
		Console.buffer();
		if (prefGroupExpanded == "true") { Console.group(header); }
		else { Console.groupCollapsed(header); }

		/* URL */
		Console.log(url + qs);

		/* Long response warning */
		if (prefTimerEnabled == "true" && responseTime >= prefTimerTimeout) {
			Console.warn("Time over " + prefTimerTimeout + "ms");
		}

		/* Response body */
		var contentParsed = null;
		if (content) {
			try {
				/* Handle JSONP */
				var contentToParse=content;
				var checkForJSONP=content.match(/^[ \t]*[\w-]+[ \t*]*\(([\s\S]+)\)[ \t*]*;?\s*$/);
				if(checkForJSONP!==null)
					contentToParse=checkForJSONP[1];

				contentParsed = JSON.parse(contentToParse);
				request.responseContent = contentParsed;
			}
			catch (e) {
				var contentLength = 140;
				var elipsys = (content.length > contentLength) ? "..." : "";
				var response = content.substring(0,contentLength) + elipsys;
				contentParsed = response;
				request.responseContent = content;
			}
		}

		/* Response object */
		if (prefShowResponseObject == "true") {
			if (prefResponseContent == "false" || (prefResponseContent == "true" && prefResponseContentStandalone == "false")) {
				Console.log(request);
			} else {
				Console.log("XHR Data", request);
			}
		}

		/* Request content, outside of object */
		function GetReqestData() {
			/* Compile the request parameters into an object */
			var requestObject={};
			function decodeVal(s) { return decodeURIComponent(s.replace(/\+/g, ' ')); }
			function addToRequestObject(memberLookupArray) { /* memberLookupArray=[object, MEMBERNAME, MEMBERNAME, ...] */
				/* Get the member if it exists, or exit otherwise */
				var lookupObj=memberLookupArray[0];
				for(var i=1;i<memberLookupArray.length;i++)
					if(!(lookupObj=lookupObj[memberLookupArray[i]]))
						return;

				/* Get the items from the parameter array */
				for(var i=0;i<lookupObj.length;i++)
					requestObject[decodeVal(lookupObj[i].name)]=decodeVal(lookupObj[i].value);

			}
			//addToRequestObject([request, 'request', 'cookies']); /* Add cookies to request object */
			addToRequestObject([request, 'request', 'queryString']); /* Add get to request object */
			addToRequestObject([request, 'request', 'postData', 'params']); /* Add post to request object */

			return requestObject;
		}
		if(prefRequestContentStandalone == "true") {
			Console.log("Request", GetReqestData());
		}

		/* Response content, outside of object */
		if (contentParsed && prefResponseContentStandalone == "true") {
			Console.log("Response", contentParsed);
		}

		/* Pager */
		// AJAXDebugger.pager();

		Console.groupEnd();
		Console.flush();
	}

	if (prefShowResponseObject == "true" && prefResponseContent == "true") {
		request.getContent(function(content, encoding) {
			var test = [content];
			render(content);
		});
	} else {
		render();
	}
}