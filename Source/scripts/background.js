// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


const tab_log = function(json_args) {
	var argslist = JSON.parse(unescape(json_args));
	for (var i=0; i<argslist.length; i++)
		console[argslist[i][0]].apply(console, argslist[i].slice(1)); //Array.prototype.slice not needed, as JSON.parse returns proper arrays
}

chrome.extension.onRequest.addListener(function(request) {
	if (request.command !== 'sendToConsole')
		return;

	chrome.tabs.executeScript(request.tabId, {
		code: "("+ tab_log + ")('" + request.args + "');",
	});
});
