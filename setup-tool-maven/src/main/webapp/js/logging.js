function LoggingLevel(level, levelStr) {
	this.level = level;
	this.levelStr = levelStr;
}

var LoggingLevel = {
	OFF: new LoggingLevel(50000, "OFF"),
	ERROR: new LoggingLevel(40000, "ERROR"),
	WARN: new LoggingLevel(30000, "WARN"),
	INFO: new LoggingLevel(20000, "INFO"),
	DEBUG: new LoggingLevel(10000, "DEBUG"),
	TRACE: new LoggingLevel(5000, "TRACE"),
	ALL: new LoggingLevel(0, "ALL")
}

var logHistory = [];

function Logger(level) {
	var Level = LoggingLevel.OFF;
	
	this.setLoggingLevel = function(level) {
		if (level == LoggingLevel.OFF || level == LoggingLevel.ERROR || level == LoggingLevel.WARN || level == LoggingLevel.INFO || 
			level == LoggingLevel.DEBUG || level == LoggingLevel.TRACE || level == LoggingLevel.ALL) {
			Level = level;
		} else {
			error("Cannot set logging level to " + level);
		}
	}
	
	function isLevelEnabled(level) {
		if(level.level >= Level.level) {
			return true;
		}
		return false;
	}

	this.trace = function(text, isObject) {
		if (isLevelEnabled(LoggingLevel.TRACE)) {
			if(!isObject) {
				log(LoggingLevel.TRACE, text, this.trace.caller);
			} else {
				logObject(text);
			}
		}
	}

	this.debug = function(text, isObject) {
		if (isLevelEnabled(LoggingLevel.DEBUG)) {
			if(!isObject) {
				log(LoggingLevel.DEBUG, text, this.debug.caller);
			} else {
				logObject(text);
			}
		}
	}

	this.info = function(text, isObject) {
		if (isLevelEnabled(LoggingLevel.INFO)) {
			if(!isObject) {
				log(LoggingLevel.INFO, text, this.info.caller);
			} else {
				logObject(text);
			}
		}
	}

	this.warn = function(text, isObject) {
		if (isLevelEnabled(LoggingLevel.WARN)) {
			if(!isObject) {
				log(LoggingLevel.WARN, text, this.warn.caller);
			} else {
				logObject(text);
			}
		}
	}

	this.error = function(text, isObject) {
		if (isLevelEnabled(LoggingLevel.ERROR)) {
			if(!isObject) {
				log(LoggingLevel.ERROR, text, this.error.caller, "color:red");
			} else {
				logObject(text);
			}
		}
	}
	
	function log(level, text, caller, color) {
		if(color == null) {
			color = "color:black";
		}
		var logString;
		if(caller.name != "") {
			logString = consoleTag() + level.levelStr + " [" + caller.name + "] - " + text;
		} else {
			logString = consoleTag() + level.levelStr + " - " + text;
			
		}
		console.log("%c" + logString, color);
		logHistory.push(logString);
	}
	
	function logObject(obj) {
		console.log(obj);
	}

	function consoleTag() {
		return formatTime(new Date().getTime()) + " ";
	}

	function formatTime(unixTimestamp) {
		var dt = new Date(unixTimestamp);

		var year = dt.getFullYear();
		var month = dt.getMonth();
		var day = dt.getDate();
		var hours = dt.getHours();
		var minutes = dt.getMinutes();
		var seconds = dt.getSeconds();
		var millis = dt.getMilliseconds();

		// the above dt.get...() functions return a single digit
		// so I prepend the zero here when needed
		if (month < 10)
			month = '0' + month;

		if (day < 10)
			day = '0' + day;

		if (hours < 10)
			hours = '0' + hours;

		if (minutes < 10)
			minutes = '0' + minutes;

		if (seconds < 10)
			seconds = '0' + seconds;

		if (millis < 100) {
			if (millis < 10)
				millis = '0' + millis;
			millis = '0' + millis;
		}

		return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds + "." + millis;
	}
	
	this.printLogHistory = function(htmlElementId) {
		$("#"+htmlElementId).css("overflow", "scroll");
		$("#"+htmlElementId).html(logHistory.join("<br>"));
	}
	
	if(level != null) {
		this.setLoggingLevel(level);
	}
}

var LOG = new Logger(LoggingLevel.OFF);