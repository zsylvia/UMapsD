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

function Logger(level) {
	var Level = LoggingLevel.OFF;
	
	this.setLoggingLevel = function(level) {
		if (level == LoggingLevel.OFF || level == LoggingLevel.ERROR || level == LoggingLevel.WARN || level == LoggingLevel.INFO || level == LoggingLevel.DEBUG || level == LoggingLevel.TRACE || level == LoggingLevel.ALL) {
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

	this.trace = function(text) {
		if (isLevelEnabled(LoggingLevel.TRACE)) {
			log(LoggingLevel.TRACE, text, this.trace.caller);
		}
	}

	this.debug = function(text) {
		if (isLevelEnabled(LoggingLevel.DEBUG)) {
			log(LoggingLevel.DEBUG, text, this.debug.caller);
		}
	}

	this.info = function(text) {
		if (isLevelEnabled(LoggingLevel.INFO)) {
			log(LoggingLevel.INFO, text, this.info.caller);
		}
	}

	this.warn = function(text) {
		if (isLevelEnabled(LoggingLevel.WARN)) {
			log(LoggingLevel.WARN, text, this.warn.caller);
		}
	}

	this.error = function(text) {
		if (isLevelEnabled(LoggingLevel.ERROR)) {
			log(LoggingLevel.ERROR, text, this.error.caller, "color:red");
		}
	}
	
	function log(level, text, caller, color) {
		if(color == null) {
			color = "color:black";
		}
		if(caller.name != "") {
			console.log("%c" + consoleTag() + level.levelStr + " [" + caller.name + "] - " + text, color);
		} else {
			console.log("%c" + consoleTag() + level.levelStr + " - " + text, color);
		}
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
	
	if(level != null) {
		this.setLoggingLevel(level);
	}
}

var LOG = new Logger(LoggingLevel.OFF);