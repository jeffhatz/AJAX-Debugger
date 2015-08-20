// Console() Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


function Console() {}

Console.Type = {
	LOG: "log",
	DEBUG: "debug",
	INFO: "info",
	WARN: "warn",
	ERROR: "error",
	GROUP: "group",
	GROUP_COLLAPSED: "groupCollapsed",
	GROUP_END: "groupEnd"
};

Console.addMessage = function(type, format, args) {
	if (isBuffering)
		return buffer.push(JSON.stringify(Array.prototype.slice.call(arguments, 0)));

	chrome.extension.sendRequest({
			command: "sendToConsole",
			tabId: chrome.devtools.tabId,
			args: escape(JSON.stringify([Array.prototype.slice.call(arguments, 0)]))
	});
};

// Generate Console output methods, i.e. Console.log(), Console.debug() etc.
(function() {
	var console_types = Object.getOwnPropertyNames(Console.Type);
	for (var type = 0; type < console_types.length; ++type) {
		var method_name = Console.Type[console_types[type]];
		Console[method_name] = Console.addMessage.bind(Console, method_name);
	}
})();

//Handle buffering
var buffer = [], isBuffering = false;
Console.buffer = function() {
	isBuffering = true;
};
Console.flush = function() {
	isBuffering = false;
	chrome.extension.sendRequest({
		command: "sendToConsole",
		tabId: chrome.devtools.tabId,
		args: escape('['+buffer.join(',')+']')
	});
	buffer.length=0;
};