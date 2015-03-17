/*
Naming conventions: (replace ???'s with fields)
Room: bldg_???_flr_???_rm_???
Hallway: bldg_???_flr_???_hw_???
Door: bldg_???_flr???_dr_???
Pathway: pathway_??? (numbered in order of creation)
Stair: bldg_???_flr_???_st_???
Elevator: bldg_???_flr_???_el_???
*/

var ROOM_TOOL_TIP_TEXT = "<b>Currently Plotting Rooms</b><br>" +
    "Click inside an area to plot a marker for a room (e.g. Classroom, Office, etc.). Only one marker is needed for a room." +
	"<br><b>Tip:</b> Click as close to the center of the room as possible";
var DOOR_TOOL_TIP_TEXT = "<b>Currently Plotting Doors</b><br>" +
   "Click a location where a door is located to plot a marker for it.";
var HALLWAY_TOOL_TIP_TEXT = "<b>Currently Plotting Hallways</b><br>" +
   "Click inside an area to plot a marker for a hallway inside of a building." +
	"<br><b>Tip:</b> Plot markers in general areas around in front of doors and major sections of larger hallways.";
var PATHWAY_TOOL_TIP_TEXT = "<b>Currently Plotting Pathways</b><br>" +
   "Click a point outside of buildings to plot a marker for a pathway.";
var STAIR_TOOL_TIP_TEXT = "<b>Currently Plotting Stairs</b><br>" +
   "Click inside an area to plot a marker for a staircase.";
var ELEVATOR_TOOL_TIP_TEXT = "<b>Currently Plotting Elevators</b><br>" +
   "Click inside an area to plot a marker for an elevator.";
var BATHROOM_MENS_TOOL_TIP_TEXT = "<b>Currently Plotting Bathrooms (Men's)</b><br>" +
   "Click inside an area to plot a marker for a men's bathroom.";
var BATHROOM_WOMENS_TOOL_TIP_TEXT = "<b>Currently Plotting Bathrooms (Women's)</b><br>" +
   "Click inside an area to plot a marker for a women's bathroom.";
var MANUALLY_CONNECTING_MARKER_FROM = "Click on a marker to start a connection from. Or select \"Cancel Manual Connect\" to exit manual connecting mode";
var MANUALLY_CONNECTING_MARKER_TO = "Click on another marker to make a connection. Or select \"Cancel Manual Connect\" to exit manual connecting mode";
var REMOVE_MODE_TIP_TEXT = "You are in \"remove mode\". Click any marker or path to remove it.";

var GlobalStrings = {
	ID: "id",
	TYPE: "type",
	ALL_BUILDINGS: "all_buildings",
	
	FLOOR: "floor",
	BUILDING: "building",
	ROOM: "room",
	DOOR: "door",
	HALLWAY: "hallway",
	PATHWAY: "pathway",
	STAIR: "stair",
	ELEVATOR: "elevator",
	BATHROOM_MENS: "bathroom_mens",
	BATHROOM_WOMENS: "bathroom_womens",
	
	FLOOR_DISPLAY: "Floor",
	BUILDING_DISPLAY: "Building",
	ROOM_DISPLAY: "Room",
	DOOR_DISPLAY: "Door",
	HALLWAY_DISPLAY: "Hallway",
	PATHWAY_DISPLAY: "Pathway",
	STAIR_DISPLAY: "Stair",
	ELEVATOR_DISPLAY: "Elevator",
	BATHROOM_MENS_DISPLAY: "Bathroom (Men's)",
	BATHROOM_WOMENS_DISPLAY: "Bathroom (Women's)",
	
	COLOR: {
		RED: "red",
		BLUE: "blue",
		ORANGE: "orange",
		GREEN: "green",
		PURPLE: "purple",
		YELLOW: "yellow",
		CYAN: "cyan",
		PINK: "pink",
		
		RED_DISPLAY: "Red",
		BLUE_DISPLAY: "Blue",
		ORANGE_DISPLAY: "Orange",
		GREEN_DISPLAY: "Green",
		PURPLE_DISPLAY: "Purple",
		YELLOW_DISPLAY: "Yellow",
		CYAN_DISPLAY: "Cyan",
		PINK_DISPLAY: "Pink",
		
		forEachStringPair: function(func) {
			func(this.RED, this.RED_DISPLAY);
			func(this.BLUE, this.BLUE_DISPLAY);
			func(this.ORANGE, this.ORANGE_DISPLAY);
			func(this.GREEN, this.GREEN_DISPLAY);
			func(this.PURPLE, this.PURPLE_DISPLAY);
			func(this.YELLOW, this.YELLOW_DISPLAY);
			func(this.CYAN, this.CYAN_DISPLAY);
			func(this.PINK, this.PINK_DISPLAY);
		}
	},
	
	
	forEachStringPair: function(func) {
		func(this.FLOOR, this.FLOOR_DISPLAY);
		func(this.BUILDING, this.BUILDING_DISPLAY);
		func(this.ROOM, this.ROOM_DISPLAY);
		func(this.DOOR, this.DOOR_DISPLAY);
		func(this.HALLWAY, this.HALLWAY_DISPLAY);
		func(this.PATHWAY, this.PATHWAY_DISPLAY);
		func(this.STAIR, this.STAIR_DISPLAY);
		func(this.ELEVATOR, this.ELEVATOR_DISPLAY);
		func(this.BATHROOM_MENS, this.BATHROOM_MENS_DISPLAY);
		func(this.BATHROOM_WOMENS, this.BATHROOM_WOMENS_DISPLAY);
		this.COLOR.forEachStringPair(func);
	},
	
	forEachMarkerStringPair: function(func) {
		this.forEachStringPair(function(normal, display){
			if(normal != GlobalStrings.FLOOR && normal != GlobalStrings.BUILDING && !GlobalStrings.COLOR.hasOwnProperty(normal.toUpperCase())) {
				func(normal, display);
			}
		});
	},
	
	getNormalFromDisplay: function(displayString) {
		var normalString = "";
		this.forEachStringPair(function(normal, display){
			if(displayString == display) {
				normalString = normal;
			}
		});
		return normalString;
	},
	
	getDisplayFromNormal: function(normalString) {
		var displayString = "";
		this.forEachStringPair(function(normal, display){
			if(normalString == normal) {
				displayString = display;
			}
		});
		return displayString;
	}
}

var paper;
var totalCenterX;
var totalCenterY;
var roomNameObjects = [];

var currrentlyPlotting = -1;
var plottingRoom = 0;
var plottingDoor = 1;
var plottingHallway = 2;
var plottingPathway = 3;
var plottingStair = 4;
var plottingElevator = 5;
var plottingBathroomMens = 6;
var plottingBathroomWomens = 7;

var markerTypeToColorMap = new buckets.Dictionary();
markerTypeToColorMap.set(GlobalStrings.ROOM, GlobalStrings.COLOR.RED);
markerTypeToColorMap.set(GlobalStrings.DOOR, GlobalStrings.COLOR.BLUE);
markerTypeToColorMap.set(GlobalStrings.HALLWAY, GlobalStrings.COLOR.ORANGE);
markerTypeToColorMap.set(GlobalStrings.PATHWAY, GlobalStrings.COLOR.GREEN);
markerTypeToColorMap.set(GlobalStrings.STAIR, GlobalStrings.COLOR.PURPLE);
markerTypeToColorMap.set(GlobalStrings.ELEVATOR, GlobalStrings.COLOR.YELLOW);
markerTypeToColorMap.set(GlobalStrings.BATHROOM_MENS, GlobalStrings.COLOR.CYAN);
markerTypeToColorMap.set(GlobalStrings.BATHROOM_WOMENS, GlobalStrings.COLOR.PINK);

var markerSize = 7;
var pathStrokeWidth = 4;

var roomMap = new buckets.Dictionary();
var doorMap = new buckets.Dictionary();
var hallwayMap = new buckets.Dictionary();
var pathwayMap = new buckets.Dictionary();
var stairMap = new buckets.Dictionary();
var elevatorMap = new buckets.Dictionary();
var bathroomMensMap = new buckets.Dictionary();
var bathroomWomensMap = new buckets.Dictionary();

var typeToMarkerMap = new buckets.Dictionary();
typeToMarkerMap.set(GlobalStrings.ROOM, roomMap);
typeToMarkerMap.set(GlobalStrings.DOOR, doorMap);
typeToMarkerMap.set(GlobalStrings.HALLWAY, hallwayMap);
typeToMarkerMap.set(GlobalStrings.PATHWAY, pathwayMap);
typeToMarkerMap.set(GlobalStrings.STAIR, stairMap);
typeToMarkerMap.set(GlobalStrings.ELEVATOR, elevatorMap);
typeToMarkerMap.set(GlobalStrings.BATHROOM_MENS, bathroomMensMap);
typeToMarkerMap.set(GlobalStrings.BATHROOM_WOMENS, bathroomWomensMap);

var allMarkers = new buckets.LinkedList();
allMarkers.add(roomMap);
allMarkers.add(doorMap);
allMarkers.add(hallwayMap);
allMarkers.add(pathwayMap);
allMarkers.add(stairMap);
allMarkers.add(elevatorMap);
allMarkers.add(bathroomMensMap);
allMarkers.add(bathroomWomensMap);

var roomConnectionMap = newConnectionMap();
var doorConnectionMap = newConnectionMap();
var hallwayConnectionMap = newConnectionMap();
var pathwayConnectionMap = newConnectionMap();
var stairConnectionMap = newConnectionMap();
var elevatorConnectionMap = newConnectionMap();
var bathroomMensConnectionMap = newConnectionMap();
var bathroomWomensConnectionMap = newConnectionMap();

var typeToConnectionMap = new buckets.Dictionary();
typeToConnectionMap.set(GlobalStrings.ROOM, roomConnectionMap);
typeToConnectionMap.set(GlobalStrings.DOOR, doorConnectionMap);
typeToConnectionMap.set(GlobalStrings.HALLWAY, hallwayConnectionMap);
typeToConnectionMap.set(GlobalStrings.PATHWAY, pathwayConnectionMap);
typeToConnectionMap.set(GlobalStrings.STAIR, stairConnectionMap);
typeToConnectionMap.set(GlobalStrings.ELEVATOR, elevatorConnectionMap);
typeToConnectionMap.set(GlobalStrings.BATHROOM_MENS, bathroomMensConnectionMap);
typeToConnectionMap.set(GlobalStrings.BATHROOM_WOMENS, bathroomWomensConnectionMap);

// These counts are just used when naming, the number does not matter it only removes duplicates
var doorIdCount = 0;
var hallwayIdCount = 0;
var pathwayIdCount = 0;
var stairIdCount = 0;
var elevatorIdCount = 0;
var bathroomMensIdCount = 0;
var bathroomWomensIdCount = 0;

//TODO: Implement building and floor selector
var buildingToFloorMap = new buckets.Dictionary();
var currentBuilding = "dion";
var currentFloor = "1";

var manuallyConnectingMode = false;
var manuallyConnectingMarker = false;
var manuallyConnectingMarkerFrom;
var manuallyConnectingMarkerTo;

var removingMode = false;

var pathMap = new buckets.Dictionary();

var undoStack = new buckets.Stack();
var addToUndoStack = true;
var redoStack = new buckets.Stack();

var showingPath = false;

var testingForBadPaths = false;

var draggingMarkerIgnoreClick = false;
var draggingEverythingIgnoreClick = false;
var mouseOnMarker = false;

var paperResizeRatio = 1;
var paperX = 0;
var paperY = 0;
var paperWidth;
var paperHeight;
var allElementsSet;

var graph;

var paperShiftX = 0;
var paperShiftY = 0;

var statsOn = true;
var debugOn = true;
var infoOn = true;
var warnOn = true;
var errorOn = true;

function stats(text) {
	if(statsOn) {
		if(stats.caller.name != "") {
			console.log(consoleTag() + "STATS [" + stats.caller.name + "] - " + text);
		} else {
			console.log(consoleTag() + "STATS - " + text);
		}
	}
}

function debug(text) {
	if (debugOn) {
		if(debug.caller.name != "") {
			console.log(consoleTag() + "DEBUG [" + debug.caller.name + "] - " + text);
		} else {
			console.log(consoleTag() + "DEBUG - " + text);
		}
	}
}

function info(text) {
	if (infoOn) {
		if(info.caller.name != "") {
			console.log(consoleTag() + "INFO  [" + info.caller.name + "] - " + text);
		} else {
			console.log(consoleTag() + "INFO - " + text);
		}
	}
}

function warn(text){
	if(warnOn) {
		if(warn.caller.name != ""){
			console.log(consoleTag() + "WARN  [" + warn.caller.name + "] - " + text);
		}else{
			console.log(consoleTag() +  "WARN - " + text);
		}
	}
}

function error(text){
	if(errorOn) {
		if(error.caller.name != ""){
			console.log("%c" + consoleTag() + "ERROR [" + error.caller.name + "] - " + text, "color:red");
		}else{
			console.log("%c" + consoleTag() + "ERROR - " + text, "color:red");
		}
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

function Connection(marker, distance) {
	this.marker = marker;
	this.distance = distance;

	this.toString = function() {
		return marker1.data(GlobalStrings.ID) + "-" + distance;
	}
}

function Path(element, marker1Data, marker2Data, distance) {
	this.element = element;
	this.marker1Data = marker1Data;
	this.marker2Data = marker2Data;
	this.distance = distance;

	this.toString = function() {
		return marker1Data.id + "<->" + marker2Data.id;
	}
}

function MarkerData(x, y, id, type, building, floor) {
	this.x = x;
	this.y = y;
	this.id = id;
	this.type = type;
	this.building = building;
	this.floor = floor;
}

function Command() {
	this.ActionType = {
		ADD_MARKER: 0,
		REMOVE_MARKER: 1,
		ADD_CONNECTION: 2,
		REMOVE_CONNECTION: 3,
		AUTO_CONNECT: 4
	}

	this.actionType = null;
	this.marker = null;
	this.markerData = null;
	this.paths = null;

	this.addMarker = function(marker) {
		this.actionType = this.ActionType.ADD_MARKER;
		this.marker = marker;

		this.markerData = getMarkerData(marker);

		return this;
	}

	this.removeMarker = function(marker, paths) {
		this.actionType = this.ActionType.REMOVE_MARKER;
		this.markerData = getMarkerData(marker);
		this.paths = paths;

		return this;
	}

	this.addConnection = function(path) {
		this.actionType = this.ActionType.ADD_CONNECTION;
		var pathSet = new buckets.Set();
		pathSet.add(path);
		this.paths = pathSet;

		return this;
	}

	this.removeConnection = function(path) {
		this.actionType = this.ActionType.REMOVE_CONNECTION;
		var pathSet = new buckets.Set();
		pathSet.add(path);
		this.paths = paths;

		return this;
	}

	this.autoConnect = function(paths) {
		this.actionType = this.ActionType.AUTO_CONNECT;
		this.paths = paths;

		return this;
	}

	this.undoAction = function() {
		addToUndoStack = false;
		if (this.actionType != null) {
			switch (this.actionType) {
				case this.ActionType.ADD_MARKER:
					removeMarker(this.marker);
					redoStack.push(this);
					break;
				case this.ActionType.REMOVE_MARKER:
					var clickedElement = null;

					var newMarker = null;
					switch (this.markerData.type) {
						case GlobalStrings.ROOM:
							newMarker = plotRoom(this.markerData.x, this.markerData.y, this.markerData.building,
								this.markerData.floor, getRoomFromRoomId(this.markerData.id));
							break;
						case GlobalStrings.DOOR:
							newMarker = plotDoor(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.HALLWAY:
							newMarker = plotHallway(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.PATHWAY:
							newMarker = plotPathway(this.markerData.x, this.markerData.y);
							break;
						case GlobalStrings.STAIR:
							newMarker = plotStair(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.ELEVATOR:
							newMarker = plotElevator(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.BATHROOM_MENS:
							newMarker = plotBathroomMens(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.BATHROOM_WOMENS:
							newMarker = plotBathroomWomens(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
					}

					this.marker = newMarker;

					this.paths.forEach(function(path) {
						var marker1 = getMarkerFromId(path.marker1Data.id);
						var marker2 = getMarkerFromId(path.marker2Data.id);

						if (marker1 == null) {
							// marker1 must be the new marker we just made but it doesn't have the same id as it did when it was first created
							marker1 = newMarker;
						} else if (marker2 == null) {
							// marker2 must be the new marker we just made but it doesn't have the same id as it did when it was first created
							marker2 = newMarker;
						}

						makeConnection(marker1, marker2);
					});

					redoStack.push(this);
					break;
				case this.ActionType.ADD_CONNECTION:
					this.paths.forEach(function(path) {
						removeConnection(path);
					});
					redoStack.push(this);
					break;
				case this.ActionType.REMOVE_CONNECTION:

					break;
				case this.ActionType.AUTO_CONNECT:
					this.paths.forEach(function(path) {
						removeConnection(path);
					});
					redoStack.push(this);
					break;
			}
		} else {
			error("Cannot undo action. The ActionType is null!");
		}
		addToUndoStack = true;
	}

	this.redoAction = function() {
		addToUndoStack = false;
		if (this.actionType != null) {
			switch (this.actionType) {
				case this.ActionType.ADD_MARKER:
					addToUndoStack = true;
					switch (this.markerData.type) {
						case GlobalStrings.ROOM:
							plotRoom(this.markerData.x, this.markerData.y, this.markerData.building,
								this.markerData.floor, getRoomFromRoomId(this.markerData.id));
							break;
						case GlobalStrings.DOOR:
							plotDoor(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.HALLWAY:
							plotHallway(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.PATHWAY:
							plotPathway(this.markerData.x, this.markerData.y);
							break;
						case GlobalStrings.STAIR:
							plotStair(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.ELEVATOR:
							plotElevator(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.BATHROOM_MENS:
							plotBathroomMens(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.BATHROOM_WOMENS:
							plotBathroomWomens(this.markerData.x, this.markerData.y, this.markerData.building, this.markerData.floor);
							break;
					}

					addToUndoStack = false;
					break;
				case this.ActionType.REMOVE_MARKER:
					addToUndoStack = true;
					removeMarker(this.marker);
					redoStack.push(this);
					addToUndoStack = false;
					break;
				case this.ActionType.ADD_CONNECTION:
					addToUndoStack = true;
					this.paths.forEach(function(path) {
						var marker1 = getMarkerFromId(path.marker1Data.id);
						var marker2 = getMarkerFromId(path.marker2Data.id);
						makeConnection(marker1, marker2);
					});
					addToUndoStack = false;
					break;
				case this.ActionType.REMOVE_CONNECTION:

					break;
				case this.ActionType.AUTO_CONNECT:
					addToUndoStack = true;
					autoConnect();
					addToUndoStack = false;
					break;
			}
		} else {
			error("Cannot redo action. The ActionType is null!");
		}
		addToUndoStack = true;
	}
}

$(document).ready(function() {
	var start = new Date().getTime();

	$("#raphael").css("height", $(window).height()-$("#body").height());
	
	Raphael("raphael", $("#raphael").width(), $("#raphael").height(),
		function() {
			paper = this;

			paper.setStart();
			allElementsSet = paper.set();

			var shapesCount = 0;

			for(var i = 0; i < dictionary.buildings.length; i++) {
				var floorToShapeListAndNameMap = buildingToFloorMap.get(dictionary.buildings[i].short_id);
				if(floorToShapeListAndNameMap == null) {
					floorToShapeListAndNameMap = new buckets.Dictionary();
				}
				for(var j = 0; j < dictionary.buildings[i].floors.length; j++) {
					var shapeListAndNameMap = floorToShapeListAndNameMap.get(dictionary.buildings[i].floors[j].id);
					if(shapeListAndNameMap == null) {
						shapeListAndNameMap = new buckets.Dictionary();
					}
					var shapeList = shapeListAndNameMap.get("shapes");
					if(shapeList == null) {
						shapeList = new buckets.LinkedList(function(shape){
							return shape.data(GlobalStrings.ID);
						});
					}
					for(var k = 0; k < dictionary.buildings[i].floors[j].shapes.length; k++) {
						var shape = dictionary.buildings[i].floors[j].shapes[k];
						var path = paper.path(shape.path).data(GlobalStrings.ID, shape.id);
						allElementsSet.push(path);
						shapeList.add(path);
					}
					shapeListAndNameMap.set("shapes", shapeList);
					floorToShapeListAndNameMap.set(dictionary.buildings[i].floors[j].id, shapeListAndNameMap);
				}
				buildingToFloorMap.set(dictionary.buildings[i].short_id, floorToShapeListAndNameMap);
			}

			paper.setFinish();
			
			paperWidth = paper.width;
			paperHeight = paper.height;
			
			raphaelSetup();
			
			paper.forEach(function(el) {
				el.scale(paperResizeRatio, paperResizeRatio, (paper.width/2), (paper.height/2));
			});
			

			
			stats("Took " + (new Date().getTime() - start) + " ms to setup raphael");
		});

	//Initally have room button clicked and show tool tip
	$("#room_button").attr("checked", true);
	roomSelected();

	$("#plot_markers_popover").popover({
		placement: "bottom",
		html: true
	});
	$("#change_building_floor_popover").popover({
		placement: "bottom",
		html: true
	});
	
	$("#graph_input").change(function(event){
		var file = event.target.files[0];
		
		var reader = new FileReader();
		
		reader.onload = function(readFile) {
			loadGraphData(readFile.target.result);
		}
		
		reader.readAsText(file);
	});
	
	
	var mouseDown = false;
	var currX;
	var currY;
	$("#raphael").mousedown(function(event){
		currX = event.offsetX;
		currY = event.offsetY;
		mouseDown = true;
	});
	$("#raphael").mousemove(function(event){
		if(mouseDown && !mouseOnMarker) {
			paperX = paperX + (currX - event.offsetX);
			paperY = paperY + (currY - event.offsetY);
			paperShiftX = paperX;
			paperShiftY = paperY;
			currX = event.offsetX;
			currY = event.offsetY;
			paperWidth = paper.width;
			paperHeight = paper.height;
			paper.setViewBox(paperX, paperY, paperWidth, paperHeight, false);

			draggingEverythingIgnoreClick = true;
		}
	});
	$("#raphael").mouseup(function(event){
		if(mouseDown) {
			mouseDown = false;
		}
	});
	
	//Firefox
	$('#raphael').bind('DOMMouseScroll', function(e) {
		var resizeRatio;
        if(e.originalEvent.detail < 0) {
            //scroll down / zoom out 10%
            resizeRatio = .90;
			paperResizeRatio = paperResizeRatio - .1;
        }else {
            //scroll up / zoom in 10%
            resizeRatio = 1.1;
			paperResizeRatio = paperResizeRatio + .1;
        }
		
		paper.forEach(function(el){
			el.scale(resizeRatio, resizeRatio, (paper.width/2), (paper.height/2));
		});

		paperWidth = paperWidth*resizeRatio;
		paperHeight = paperHeight*resizeRatio;

		// paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);
		
        //prevent page fom scrolling
        return false;
    });

    //IE, Opera, Safari
    $('#raphael').bind('mousewheel', function(e){
		var resizeRatio;
        if(e.originalEvent.wheelDelta < 0) {
            //scroll down / zoom out 10%
            resizeRatio = .90;
			paperResizeRatio = paperResizeRatio - .1;
        }else {
            //scroll up / zoom in 10%
            resizeRatio = 1.1;
			paperResizeRatio = paperResizeRatio + .1;
        }
		
		paper.forEach(function(el){
			el.scale(resizeRatio, resizeRatio, (paper.width/2), (paper.height/2));
		});

		paperWidth = paperWidth*resizeRatio;
		paperHeight = paperHeight*resizeRatio;

		// paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);
		
        //prevent page fom scrolling
        return false;
    });
});

function raphaelSetup() {
	// var resizeRatio = 1.75;
	var resizeRatio = .5;
	var leftmostTopLeftX = 99999;
	var leftmostTopLeftY = 99999;
	var leftmostEl;
	var rightmostBottomRightX = 0;
	var rightmostBottomRightY = 0;
	var rightmostEl;
	
	buildingToFloorMap.forEach(function(building, floorToShapeListAndNameMap){
		floorToShapeListAndNameMap.forEach(function(floor, shapeListAndNameMap){
			var nameList = shapeListAndNameMap.get("names");
			if(nameList == null) {
				nameList = new buckets.LinkedList();
			}
			shapeListAndNameMap.get("shapes").forEach(function(shape){
				var id = shape.data(GlobalStrings.ID);
				var bbox = shape.getBBox();
				var centerX = bbox.x + (bbox.width / 2);
				var centerY = bbox.y + (bbox.height / 2);
				
				nameList.add(paper.text(centerX, centerY, id).attr("font-size", 4));

				if (id == "outline" && building == "dion" && floor == "1") {
					totalCenterX = centerX;
					totalCenterY = centerY;
				}

				if (bbox.x < leftmostTopLeftX && bbox.y < leftmostTopLeftY) {
					leftmostTopLeftX = bbox.x;
					leftmostTopLeftY = bbox.y;
					leftmostEl = shape;
				}

				if (bbox.x2 > rightmostBottomRightX && bbox.y2 > rightmostBottomRightY) {
					rightmostBottomRightX = bbox.x2;
					rightmostBottomRightY = bbox.y2;
					rightmostEl = shape;
				}
			});
			shapeListAndNameMap.set("names", nameList);
		});
	});
	
	var resizeRatioX = Math.abs((paper.width-rightmostBottomRightX)/rightmostBottomRightX);
	var resizeRatioY = Math.abs((paper.height-rightmostBottomRightY)/rightmostBottomRightY);

	// paper.forEach(function(el) {
	// 	var bbox = el.getBBox();
	// 	var centerX = bbox.x + (bbox.width / 2);
	// 	var centerY = bbox.y + (bbox.height / 2);
	//
	// 	// /** THIS IS HOW TO RESIZE EVERYTHING
	// 	var x = totalCenterX - ((centerX + totalCenterX) * resizeRatio);
	// 	var y = totalCenterY - ((centerY + totalCenterY) * resizeRatio);
	// 	var moveX = (leftmostEl.getBBox(false).cx-leftmostEl.getBBox(true).cx);
	// 	var moveY = (leftmostEl.getBBox(false).cy-leftmostEl.getBBox(true).cy);
	//
	// 	el.scale(resizeRatio, resizeRatio, 0, 0);
	// 	// el.translate(moveX, moveY);
	// 	// el.translate(-1800, -600);
	// 	// el.translate(-1200, -100);
	// 	// el.translate(165, 50);
	// });
	
	// var json = "{\"paths\":[{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_0\",\"x\":23,\"y\":276},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_0\",\"x\":75,\"y\":279},\"d\":51},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_1\",\"x\":75,\"y\":319},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_0\"},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_2\",\"x\":168,\"y\":243},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_1\",\"x\":168,\"y\":280},\"d\":39},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_3\",\"x\":416,\"y\":222},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_4\",\"x\":442,\"y\":270},\"d\":55},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_4\",\"x\":475,\"y\":220},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_4\"},\"d\":60},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_5\",\"x\":309,\"y\":297},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_2\",\"x\":298,\"y\":270},\"d\":29},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_6\",\"x\":283,\"y\":297},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_2\"},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_11\",\"x\":696,\"y\":222},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_7\",\"x\":666,\"y\":271},\"d\":57},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_12\",\"x\":659,\"y\":340},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_7\"},\"d\":69},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_13\",\"x\":600,\"y\":340},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_6\",\"x\":629,\"y\":273},\"d\":70},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_14\",\"x\":882,\"y\":339},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_9\",\"x\":853,\"y\":289},\"d\":58},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_15\",\"x\":822,\"y\":340},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_9\"},\"d\":55},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_16\",\"x\":407,\"y\":361},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_3\",\"x\":407,\"y\":340},\"d\":18},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_17\",\"x\":408,\"y\":319},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_3\"},\"d\":24},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_18\",\"x\":866,\"y\":249},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_9\"},\"d\":45},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_19\",\"x\":916,\"y\":249},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_10\",\"x\":932,\"y\":284},\"d\":38},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_28\",\"x\":629,\"y\":395},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_6\"},\"d\":114},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_29\",\"x\":853,\"y\":395},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_9\"},\"d\":99},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_30\",\"x\":1071,\"y\":356},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_13\",\"x\":1084,\"y\":290},\"d\":68},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_31\",\"x\":912,\"y\":65},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_16\",\"x\":924,\"y\":78},\"d\":17},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_32\",\"x\":937,\"y\":89},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_16\"},\"d\":18},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_33\",\"x\":1066,\"y\":87},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_17\",\"x\":998,\"y\":114},\"d\":73},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_34\",\"x\":494,\"y\":272},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_4\"},\"d\":52},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_35\",\"x\":802,\"y\":289},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_9\"},\"d\":46},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_36\",\"x\":1039,\"y\":280},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_13\"},\"d\":46},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_37\",\"x\":1116,\"y\":343},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_13\"},\"d\":61},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_38\",\"x\":1181,\"y\":275},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_14\",\"x\":1215,\"y\":258},\"d\":41},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_39\",\"x\":1379,\"y\":220},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_15\",\"x\":1379,\"y\":254},\"d\":29},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_40\",\"x\":1348,\"y\":233},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_15\"},\"d\":32},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_41\",\"x\":1377,\"y\":284},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_15\"},\"d\":35},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_42\",\"x\":1089,\"y\":216},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_13\"},\"d\":74},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_45\",\"x\":560,\"y\":297},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_5\",\"x\":563,\"y\":269},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_46\",\"x\":479,\"y\":297},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_4\"},\"d\":45},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_47\",\"x\":738,\"y\":264},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_8\",\"x\":718,\"y\":289},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_48\",\"x\":819,\"y\":264},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_9\"},\"d\":39},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_0\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_1\"},\"d\":91},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_5\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_6\"},\"d\":63},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_6\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_7\"},\"d\":40},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_8\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_7\"},\"d\":56},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_9\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_10\"},\"d\":84},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_10\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_11\",\"x\":988,\"y\":274},\"d\":56},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_15\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_14\"},\"d\":161},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_17\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_18\",\"x\":996,\"y\":185},\"d\":71},{\"m1\":{\"id\":\"bldg_dion_flr_1_el_0\",\"x\":1129,\"y\":229},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_13\"},\"d\":75},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_1\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_2\"},\"d\":133},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom102a_1_\",\"x\":269,\"y\":350},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_6\"},\"d\":47},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_5\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom102b_1_\",\"x\":321,\"y\":349},\"d\":47},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_17\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_4\"},\"d\":57},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_4\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_2\"},\"d\":144},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_3\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom101\",\"x\":336,\"y\":165},\"d\":96},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom101\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_27\",\"x\":399,\"y\":113},\"d\":87},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_27\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom103\",\"x\":446,\"y\":127},\"d\":46},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom103\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_26\",\"x\":490,\"y\":116},\"d\":45},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_26\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom105_1_\",\"x\":553,\"y\":163},\"d\":79},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom105_1_\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_25\",\"x\":620,\"y\":113},\"d\":70},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_25\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom107\",\"x\":668,\"y\":127},\"d\":46},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom107\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_24\",\"x\":718,\"y\":112},\"d\":52},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_24\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom109\",\"x\":760,\"y\":163},\"d\":59},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom109\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_23\",\"x\":816,\"y\":110},\"d\":77},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom109a\",\"x\":830,\"y\":128},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_22\",\"x\":843,\"y\":111},\"d\":21},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_23\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom109a\"},\"d\":22},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_22\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom117_1_\",\"x\":871,\"y\":125},\"d\":33},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_21\",\"x\":897,\"y\":107},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom117_1_\"},\"d\":34},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_21\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom117a_1_\",\"x\":911,\"y\":129},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom117a_1_\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_20\",\"x\":929,\"y\":114},\"d\":20},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_20\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_17\"},\"d\":70},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_17\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_32\"},\"d\":64},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_33\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom115_1_\",\"x\":1227,\"y\":136},\"d\":148},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom115_1_\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_43\",\"x\":1293,\"y\":75},\"d\":112},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_43\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom115a_1_\",\"x\":1305,\"y\":50},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_40\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom115_1_\"},\"d\":170},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_41\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom116_1_\",\"x\":1260,\"y\":380},\"d\":166},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom116_1_\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_44\",\"x\":1328,\"y\":454},\"d\":110},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_44\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_misc\",\"x\":1345,\"y\":469},\"d\":14},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom116_1_\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_37\"},\"d\":133},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_13\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_38\"},\"d\":95},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_36\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_11\"},\"d\":51},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_11\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_18\"},\"d\":89},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom109\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_11\"},\"d\":87},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_7\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_9\",\"x\":668,\"y\":169},\"d\":97},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_9\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom107\"},\"d\":54},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_10\",\"x\":638,\"y\":223},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_7\"},\"d\":55},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_34\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_5\"},\"d\":69},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_45\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom164_1_\",\"x\":544,\"y\":303},\"d\":15},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom165_1_\",\"x\":501,\"y\":302},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_46\"},\"d\":25},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_8\",\"x\":445,\"y\":169},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom103\"},\"d\":55},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_8\"},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_4\"},\"d\":97},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_13\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom106\",\"x\":520,\"y\":398},\"d\":92},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_28\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom108\",\"x\":629,\"y\":434},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_12\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom110\",\"x\":742,\"y\":397},\"d\":95},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom112\",\"x\":853,\"y\":437},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_29\"},\"d\":54},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_15\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom110\"},\"d\":94},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_14\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom114\",\"x\":959,\"y\":391},\"d\":92},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_47\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom111_1_\",\"x\":754,\"y\":257},\"d\":17},{\"m1\":{\"id\":\"bldg_dion_flr_1_hw_8\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_35\"},\"d\":81},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom113_1_\",\"x\":795,\"y\":257},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_48\"},\"d\":25},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_10\"},\"m2\":{\"id\":\"bldg_dion_flr_1_rm_classroom105_1_\"},\"d\":104},{\"m1\":{\"id\":\"bldg_dion_flr_1_rm_classroom105_1_\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_4\"},\"d\":109},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_42\"},\"m2\":{\"id\":\"bldg_dion_flr_1_st_0\",\"x\":1087,\"y\":167},\"d\":49},{\"m1\":{\"id\":\"bldg_dion_flr_1_bathroom_womens_0\",\"x\":866,\"y\":208},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_18\"},\"d\":50},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_19\"},\"m2\":{\"id\":\"bldg_dion_flr_1_bathroom_mens_0\",\"x\":916,\"y\":208},\"d\":50},{\"m1\":{\"id\":\"bldg_dion_flr_1_dr_49\",\"x\":1072,\"y\":194},\"m2\":{\"id\":\"bldg_dion_flr_1_hw_18\"},\"d\":76},{\"m1\":{\"id\":\"bldg_dion_flr_1_st_0\"},\"m2\":{\"id\":\"bldg_dion_flr_1_dr_49\"},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object0\",\"x\":302,\"y\":65},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_50\",\"x\":274,\"y\":90},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_room_5_\",\"x\":240,\"y\":69},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_51\",\"x\":254,\"y\":93},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object1\",\"x\":275,\"y\":129},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_50\"},\"d\":39},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object2\",\"x\":250,\"y\":169},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_55\",\"x\":279,\"y\":168},\"d\":29},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object4\",\"x\":242,\"y\":210},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_54\",\"x\":277,\"y\":186},\"d\":42},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object3\",\"x\":325,\"y\":179},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_52\",\"x\":308,\"y\":185},\"d\":18},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object10\",\"x\":205,\"y\":346},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_56\",\"x\":235,\"y\":354},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object11\",\"x\":202,\"y\":390},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_57\",\"x\":232,\"y\":370},\"d\":36},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object12\",\"x\":222,\"y\":433},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_67\",\"x\":221,\"y\":462},\"d\":29},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object9\",\"x\":220,\"y\":486},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_67\"},\"d\":24},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_room_1_\",\"x\":364,\"y\":445},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_68\",\"x\":419,\"y\":376},\"d\":88},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_room_4_\",\"x\":536,\"y\":491},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_71\",\"x\":542,\"y\":452},\"d\":39},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_room_2_\",\"x\":475,\"y\":421},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_69\",\"x\":450,\"y\":393},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object14\",\"x\":667,\"y\":430},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_75\",\"x\":597,\"y\":416},\"d\":71},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object38\",\"x\":541,\"y\":377},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_73\",\"x\":588,\"y\":338},\"d\":61},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object13\",\"x\":808,\"y\":424},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_77\",\"x\":878,\"y\":422},\"d\":70},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object15\",\"x\":927,\"y\":389},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_77\"},\"d\":58},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object23\",\"x\":892,\"y\":491},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_78\",\"x\":904,\"y\":462},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object22\",\"x\":940,\"y\":494},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_80\",\"x\":957,\"y\":473},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object21\",\"x\":986,\"y\":494},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_81\",\"x\":970,\"y\":473},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object20\",\"x\":1029,\"y\":480},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_82\",\"x\":996,\"y\":446},\"d\":47},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object19\",\"x\":1028,\"y\":417},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_83\",\"x\":1007,\"y\":399},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object18\",\"x\":1028,\"y\":362},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_85\",\"x\":1009,\"y\":346},\"d\":24},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object35\",\"x\":922,\"y\":128},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_107\",\"x\":935,\"y\":94},\"d\":36},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object43\",\"x\":890,\"y\":86},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_113\",\"x\":858,\"y\":67},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object36\",\"x\":850,\"y\":130},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_98\",\"x\":835,\"y\":73},\"d\":58},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object31\",\"x\":801,\"y\":140},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_95\",\"x\":774,\"y\":158},\"d\":32},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object32\",\"x\":797,\"y\":88},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_97\",\"x\":775,\"y\":70},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object41\",\"x\":708,\"y\":81},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_96\",\"x\":737,\"y\":69},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object42\",\"x\":707,\"y\":121},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_93\",\"x\":738,\"y\":135},\"d\":34},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object33\",\"x\":709,\"y\":167},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_92\",\"x\":737,\"y\":150},\"d\":32},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object34\",\"x\":712,\"y\":210},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_91\",\"x\":745,\"y\":209},\"d\":33},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object48\",\"x\":792,\"y\":246},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_90\",\"x\":768,\"y\":226},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object47\",\"x\":798,\"y\":194},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_94\",\"x\":774,\"y\":172},\"d\":32},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object39\",\"x\":606,\"y\":192},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_66\",\"x\":581,\"y\":175},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object44\",\"x\":605,\"y\":252},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_62\",\"x\":605,\"y\":271},\"d\":19},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object46\",\"x\":574,\"y\":261},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_63\",\"x\":579,\"y\":245},\"d\":13},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object45\",\"x\":639,\"y\":259},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_64\",\"x\":634,\"y\":246},\"d\":13},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object6\",\"x\":441,\"y\":218},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_60\",\"x\":435,\"y\":199},\"d\":19},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object7\",\"x\":364,\"y\":179},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_59\",\"x\":379,\"y\":198},\"d\":24},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object8\",\"x\":513,\"y\":180},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_61\",\"x\":507,\"y\":196},\"d\":17},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object5\",\"x\":433,\"y\":120},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_60\"},\"d\":79},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object30\",\"x\":714,\"y\":11},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_99\",\"x\":725,\"y\":35},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object29\",\"x\":763,\"y\":11},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_100\",\"x\":782,\"y\":30},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object28\",\"x\":816,\"y\":12},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_101\",\"x\":795,\"y\":30},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object27\",\"x\":865,\"y\":11},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_102\",\"x\":884,\"y\":29},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object26\",\"x\":922,\"y\":9},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_103\",\"x\":897,\"y\":30},\"d\":32},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object25\",\"x\":986,\"y\":8},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_104\",\"x\":989,\"y\":28},\"d\":20},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object24\",\"x\":1057,\"y\":7},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_105\",\"x\":1033,\"y\":32},\"d\":34},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_53\",\"x\":295,\"y\":195},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_19\",\"x\":301,\"y\":227},\"d\":32},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_56\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_22\",\"x\":271,\"y\":347},\"d\":36},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_57\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_22\"},\"d\":45},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_58\",\"x\":253,\"y\":380},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_22\"},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_62\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_31\",\"x\":602,\"y\":289},\"d\":18},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_68\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_25\",\"x\":416,\"y\":349},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_69\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_26\",\"x\":448,\"y\":360},\"d\":33},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_70\",\"x\":513,\"y\":436},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_78\",\"x\":547,\"y\":435},\"d\":34},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_71\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_78\"},\"d\":17},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_72\",\"x\":586,\"y\":436},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_78\"},\"d\":39},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_73\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_32\",\"x\":604,\"y\":317},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_74\",\"x\":703,\"y\":338},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_37\",\"x\":737,\"y\":317},\"d\":39},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_76\",\"x\":768,\"y\":338},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_37\"},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_78\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_61\",\"x\":902,\"y\":448},\"d\":14},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_79\",\"x\":879,\"y\":437},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_61\"},\"d\":25},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_80\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_60\",\"x\":962,\"y\":453},\"d\":20},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_81\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_60\"},\"d\":21},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_82\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_59\",\"x\":983,\"y\":435},\"d\":17},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_83\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_58\",\"x\":989,\"y\":390},\"d\":20},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_84\",\"x\":1008,\"y\":384},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_58\"},\"d\":19},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_86\",\"x\":989,\"y\":352},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_58\"},\"d\":38},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_87\",\"x\":883,\"y\":337},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_44\",\"x\":855,\"y\":313},\"d\":36},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_88\",\"x\":801,\"y\":286},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_39\",\"x\":833,\"y\":287},\"d\":32},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_89\",\"x\":574,\"y\":284},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_30\",\"x\":548,\"y\":284},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_90\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_77\",\"x\":754,\"y\":223},\"d\":14},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_91\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_77\"},\"d\":16},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_92\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_74\",\"x\":755,\"y\":145},\"d\":18},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_93\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_74\"},\"d\":19},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_94\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_75\",\"x\":757,\"y\":173},\"d\":17},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_95\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_75\"},\"d\":22},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_96\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_71\",\"x\":728,\"y\":50},\"d\":21},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_97\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_72\",\"x\":757,\"y\":84},\"d\":22},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_98\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_68\",\"x\":837,\"y\":50},\"d\":23},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_99\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_71\"},\"d\":15},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_100\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_69\",\"x\":786,\"y\":48},\"d\":18},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_101\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_69\"},\"d\":20},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_102\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_67\",\"x\":892,\"y\":47},\"d\":19},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_103\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_67\"},\"d\":18},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_104\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_62\",\"x\":993,\"y\":53},\"d\":25},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_105\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_57\",\"x\":1033,\"y\":52},\"d\":20},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_106\",\"x\":1081,\"y\":33},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_56\",\"x\":1080,\"y\":54},\"d\":21},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_107\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_64\",\"x\":961,\"y\":83},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_108\",\"x\":913,\"y\":245},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_42\",\"x\":920,\"y\":285},\"d\":40},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_109\",\"x\":864,\"y\":245},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_40\",\"x\":861,\"y\":284},\"d\":39},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_110\",\"x\":356,\"y\":220},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_19\"},\"d\":55},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_111\",\"x\":522,\"y\":242},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_29\",\"x\":522,\"y\":285},\"d\":43},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_112\",\"x\":741,\"y\":252},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_77\"},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_113\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_68\"},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_19\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_20\",\"x\":296,\"y\":267},\"d\":40},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_21\",\"x\":272,\"y\":303},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_20\"},\"d\":43},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_22\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_21\"},\"d\":44},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_23\",\"x\":321,\"y\":349},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_24\",\"x\":367,\"y\":349},\"d\":46},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_25\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_26\"},\"d\":33},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_26\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_27\",\"x\":475,\"y\":341},\"d\":33},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_28\",\"x\":500,\"y\":314},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_29\"},\"d\":36},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_29\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_30\"},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_31\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_33\",\"x\":630,\"y\":290},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_32\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_31\"},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_34\",\"x\":660,\"y\":289},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_33\"},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_35\",\"x\":693,\"y\":288},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_36\",\"x\":722,\"y\":289},\"d\":29},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_37\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_36\"},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_38\",\"x\":756,\"y\":289},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_37\"},\"d\":33},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_39\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_40\"},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_40\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_41\",\"x\":889,\"y\":285},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_42\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_41\"},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_43\",\"x\":952,\"y\":285},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_42\"},\"d\":32},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_44\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_40\"},\"d\":29},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_45\",\"x\":987,\"y\":284},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_46\",\"x\":987,\"y\":249},\"d\":35},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_46\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_50\",\"x\":1015,\"y\":236},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_47\",\"x\":969,\"y\":220},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_46\"},\"d\":34},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_48\",\"x\":964,\"y\":185},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_49\",\"x\":964,\"y\":151},\"d\":34},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_51\",\"x\":1043,\"y\":207},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_52\",\"x\":1059,\"y\":174},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_52\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_53\",\"x\":1056,\"y\":137},\"d\":35},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_54\",\"x\":1057,\"y\":100},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_55\",\"x\":1055,\"y\":69},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_55\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_57\"},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_56\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_55\"},\"d\":29},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_58\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_59\"},\"d\":45},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_59\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_60\"},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_61\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_60\"},\"d\":60},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_62\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_65\",\"x\":956,\"y\":58},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_63\",\"x\":964,\"y\":113},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_64\"},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_64\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_65\"},\"d\":25},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_66\",\"x\":925,\"y\":54},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_65\"},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_67\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_66\"},\"d\":34},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_68\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_69\"},\"d\":51},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_69\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_70\",\"x\":756,\"y\":49},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_70\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_71\"},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_72\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_73\",\"x\":756,\"y\":115},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_73\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_74\"},\"d\":30},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_74\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_75\"},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_75\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_76\",\"x\":757,\"y\":197},\"d\":24},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_77\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_76\"},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_115\",\"x\":544,\"y\":251},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_82\",\"x\":557,\"y\":233},\"d\":23},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_29\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_115\"},\"d\":40},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_82\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_79\",\"x\":553,\"y\":175},\"d\":58},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_79\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_66\"},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object39\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_65\",\"x\":633,\"y\":172},\"d\":33},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_65\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_80\",\"x\":659,\"y\":173},\"d\":26},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_80\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_81\",\"x\":652,\"y\":231},\"d\":58},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_81\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_114\",\"x\":669,\"y\":253},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_81\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_64\"},\"d\":24},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_114\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_35\"},\"d\":42},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_35\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_34\"},\"d\":33},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_80\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object40\",\"x\":605,\"y\":107},\"d\":85},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object40\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_79\"},\"d\":85},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_110\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object6\"},\"d\":85},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object6\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_59\"},\"d\":65},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object6\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_61\"},\"d\":69},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_111\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object6\"},\"d\":84},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object1\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_53\"},\"d\":68},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_52\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_53\"},\"d\":16},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_54\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_53\"},\"d\":20},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_55\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_53\"},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_51\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object1\"},\"d\":41},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_58\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object12\"},\"d\":61},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_23\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_22\"},\"d\":50},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_24\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_25\"},\"d\":49},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_27\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_28\"},\"d\":36},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_89\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_31\"},\"d\":28},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_36\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_38\"},\"d\":34},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_36\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_112\"},\"d\":41},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_38\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_112\"},\"d\":39},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_38\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_88\"},\"d\":45},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object14\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_74\"},\"d\":98},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_room_2_\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_70\"},\"d\":40},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_72\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object14\"},\"d\":81},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_75\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object38\"},\"d\":68},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_32\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_33\"},\"d\":37},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_76\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object13\"},\"d\":94},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_87\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object15\"},\"d\":68},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_83\",\"x\":989,\"y\":327},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_86\"},\"d\":25},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_85\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_83\"},\"d\":27},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_83\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_45\"},\"d\":43},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_45\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_43\"},\"d\":35},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_79\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object13\"},\"d\":72},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_84\"},\"m2\":{\"id\":\"bldg_dion_flr_2_rm_object18\"},\"d\":29},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_47\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_48\"},\"d\":35},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_49\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_63\"},\"d\":38},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_50\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_51\"},\"d\":40},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_54\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_53\"},\"d\":38},{\"m1\":{\"id\":\"bldg_dion_flr_2_rm_object24\"},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_106\"},\"d\":35},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_68\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_67\"},\"d\":55},{\"m1\":{\"id\":\"bldg_dion_flr_2_hw_70\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_72\"},\"d\":35},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_109\"},\"m2\":{\"id\":\"bldg_dion_flr_2_bathroom_womens_2\",\"x\":855,\"y\":197},\"d\":48},{\"m1\":{\"id\":\"bldg_dion_flr_2_bathroom_mens_2\",\"x\":920,\"y\":199},\"m2\":{\"id\":\"bldg_dion_flr_2_dr_108\"},\"d\":46},{\"m1\":{\"id\":\"bldg_dion_flr_2_st_2\",\"x\":1086,\"y\":144},\"m2\":{\"id\":\"bldg_dion_flr_1_st_0\"},\"d\":19},{\"m1\":{\"id\":\"bldg_dion_flr_2_st_2\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_53\"},\"d\":31},{\"m1\":{\"id\":\"bldg_dion_flr_2_dr_63\"},\"m2\":{\"id\":\"bldg_dion_flr_2_hw_82\"},\"d\":25}],\"markers\":[]}";
	
	// loadGraphData(json);
	
	showShapesForCurrentBuildingAndFloor();
}

function setMarkerDragEventHandlers(marker) {
	marker.drag(function(dx, dy, x, y, event){
		if(marker.isVisible()) {
			markerDragEventMove(marker, dx, dy, x, y, event);
			draggingMarkerIgnoreClick = true;
		}
	}, function(x, y, event){
		if(marker.isVisible()) {
			// Drag start
			mouseOnMarker = true;
			markerDragEventStart(marker, x, y, event);
		}
	}, function(event){
		if(marker.isVisible()) {
			// Drag end
			mouseOnMarker = false;
			markerDragEventEnd(marker, event);
		}
	});
}

function loadGraphData(json) {
	var markerMap = createAllMarkersFromJson(json, paper);
	
	markerMap.forEach(function(markerId, marker) {
		setMarkerDragEventHandlers(marker);
		
		getMarkerMapForType(marker.data(GlobalStrings.TYPE)).set(marker.data(GlobalStrings.ID), marker);
		
		typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).set(marker, newConnectionSet());
		
		if(marker.data(GlobalStrings.TYPE) == GlobalStrings.DOOR){
			doorIdCount++;
		} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY) {
			hallwayIdCount++;
		} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
			pathwayIdCount++;
		} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
			stairIdCount++;
		} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
			elevatorIdCount++;
		} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS) {
			bathroomMensIdCount++;
		} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
			bathroomWomensIdCount++;
		}
	});
	
	createAllPathsFromJson(json, paper).forEach(function(pathString, path){
		pathMap.set(pathString, path);
	});

	pathMap.forEach(function(pathString, path) {
		var marker1 = getMarkerFromId(path.marker1Data.id);
		if(marker1 == null) {
			marker1 = addMarker(path.marker1Data.cx, path.marker1Data.cy, markerTypeToColorMap.get(path.marker1Data.type));
			marker1.data(GlobalStrings.ID, path.marker1Data.id);
			marker1.data(GlobalStrings.TYPE, path.marker1Data.type);
			if(path.marker1Data.type != GlobalStrings.PATHWAY) {
				marker1.data(GlobalStrings.BUILDING, path.marker1Data.building);
				marker1.data(GlobalStrings.FLOOR, path.marker1Data.floor);
			}
			getMarkerMapForType(marker1.data(GlobalStrings.TYPE)).set(marker1.data(GlobalStrings.ID), marker1);
		
			typeToConnectionMap.get(marker1.data(GlobalStrings.TYPE)).set(marker1, newConnectionSet());
		
			if(marker1.data(GlobalStrings.TYPE) == GlobalStrings.DOOR){
				doorIdCount++;
			} else if(marker1.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY) {
				hallwayIdCount++;
			} else if(marker1.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
				pathwayIdCount++;
			} else if(marker1.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
				stairIdCount++;
			} else if(marker1.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
				elevatorIdCount++;
			} else if(marker1.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS) {
				bathroomMensIdCount++;
			} else if(marker1.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
				bathroomWomensIdCount++;
			}
		}
		var marker2 = getMarkerFromId(path.marker2Data.id);
		if(marker2 == null) {
			marker2 = addMarker(path.marker2Data.cx, path.marker2Data.cy, markerTypeToColorMap.get(path.marker2Data.type));
			marker2.data(GlobalStrings.ID, path.marker2Data.id);
			marker2.data(GlobalStrings.TYPE, path.marker2Data.type);
			if(path.marker2Data.type != GlobalStrings.PATHWAY) {
				marker2.data(GlobalStrings.BUILDING, path.marker2Data.building);
				marker2.data(GlobalStrings.FLOOR, path.marker2Data.floor);
			}
			getMarkerMapForType(marker2.data(GlobalStrings.TYPE)).set(marker2.data(GlobalStrings.ID), marker2);
		
			typeToConnectionMap.get(marker2.data(GlobalStrings.TYPE)).set(marker2, newConnectionSet());
		
			if(marker2.data(GlobalStrings.TYPE) == GlobalStrings.DOOR){
				doorIdCount++;
			} else if(marker2.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY) {
				hallwayIdCount++;
			} else if(marker2.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
				pathwayIdCount++;
			} else if(marker2.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
				stairIdCount++;
			} else if(marker2.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
				elevatorIdCount++;
			} else if(marker2.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS) {
				bathroomMensIdCount++;
			} else if(marker2.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
				bathroomWomensIdCount++;
			}
		}
		var marker1ConnectionMap = getConnectionMapForType(marker1.data(GlobalStrings.TYPE));
		var marker2ConnectionMap = getConnectionMapForType(marker2.data(GlobalStrings.TYPE));

		var connectionSet = marker1ConnectionMap.get(marker1);
		if (connectionSet == null) {
			connectionSet = newConnectionSet();
		}
		var distance = getDistance(marker1, marker2);
		var success = connectionSet.add(new Connection(marker2, distance));

		var addedPath = null;

		if (success) {
			marker1ConnectionMap.set(marker1, connectionSet);
		}

		var connectionSet = marker2ConnectionMap.get(marker2);
		if (connectionSet == null) {
			connectionSet = newConnectionSet();
		}

		var success = connectionSet.add(new Connection(marker1, distance));
		if (success) {
			marker2ConnectionMap.set(marker2, connectionSet);
		}
	});

	generateGraph();
	showShapesForCurrentBuildingAndFloor();
}

function markerDragEventStart(marker, x, y, event) {
	marker.data("drag_start_cx", marker.attr("cx"));
	marker.data("drag_start_cy", marker.attr("cy"));
}

function markerDragEventMove(marker, dx, dy, x, y, event) {
	marker.attr({cx: (marker.data("drag_start_cx")+dx), cy: (marker.data("drag_start_cy")+dy)});
	
	var markerConnectionSet = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if(markerConnectionSet != null) {
		markerConnectionSet.forEach(function(connection){
			var path = pathMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
			if(path != null) {
				path.marker1Data.x = marker.attr("cx");
				path.marker1Data.x = marker.attr("cy");
				path.marker2Data.x = connection.marker.attr("cx");
				path.marker2Data.x = connection.marker.attr("cy");
			} else {
				path =  pathMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
				path.marker2Data.x = marker.attr("cx");
				path.marker2Data.x = marker.attr("cy");
				path.marker1Data.x = connection.marker.attr("cx");
				path.marker1Data.x = connection.marker.attr("cy");
			}
		
			path.element.attr("path", "M" + marker.attr("cx") + " " + marker.attr("cy") + "L" + connection.marker.attr("cx") + " " + connection.marker.attr("cy"));
		});
	}
}

function markerDragEventEnd(marker, event) {
	// noop
}

$(document).bind("click", function(ev) {
	ev.target.setAttribute("customNodeName", ev.target.nodeName);
	
	if(!showingPath && !draggingMarkerIgnoreClick && !draggingEverythingIgnoreClick) {
		handleClick(ev, false);
	}
	
	if(draggingMarkerIgnoreClick) {
		draggingMarkerIgnoreClick = false;
	}
	
	if(draggingEverythingIgnoreClick) {
		draggingEverythingIgnoreClick = false;
	}
});

function handleClick(ev, secondTry) {
	var clickX = ev.offsetX ;
	var clickY = ev.offsetY;

	if (ev.target.getAttribute("customNodeName") == "tspan") {
		clickX = ev.pageX;
		clickY = ev.pageY - ($(document).height() - $("#raphael").height());
	}
	
	clickX += paperShiftX;
	clickY += paperShiftY;

	// Ignore clicks on non-raphael objects
	if (ev.target.getAttribute("customNodeName") == "svg" || ev.target.getAttribute("customNodeName") == "tspan" || secondTry) {
		// Only clicking another marker is accepted when manuallyConnectingMarker is true
		if (!manuallyConnectingMarker && !removingMode) {
			
			var pathClicked = false;
			pathMap.forEach(function(pathString, path) {
				if(path.isVisible) {
					for (var i = 0; i < 5; i++) {
						for (var j = 0; j < 5; j++) {
							var pointInside = path.element.isPointInside(clickX + i, clickY + j);
							if (pointInside) {
								ev.target.setAttribute("customNodeName", "path");
								ev.offsetX = clickX + i;
								ev.offsetY = clickY + j;
								handleClick(ev, false);
								pathClicked = true;
								break;
							}

							if (!pointInside) {
								pointInside = path.element.isPointInside(clickX - i, clickY - j);
								if (pointInside) {
									ev.target.setAttribute("customNodeName", "path");
									ev.offsetX = clickX - i;
									ev.offsetY = clickY - j;
									handleClick(ev, false);
									pathClicked = true;
									break;
								}
							}
						}
						if(pathClicked) {
							break;
						}
					}
					if(pathClicked) {
						return false;
					}
				}
			});
			
			if(!pathClicked) {
				var clickedElement = null;
				
				if(currentlyPlotting == plottingRoom) {
					paper.forEach(function(element) {
						if (element.isPointInside(clickX, clickY)) {
							// TODO: Find better solution then explicitly writing outline
							if (element.type != "text" && element.data(GlobalStrings.ID) != "outline") {
								clickedElement = element;
								return false;
							}
						}
					});
				}

				var marker = plotMarker(clickX-paperShiftX, clickY-paperShiftY, clickedElement);
				if(marker != null) {
					marker.attr("cx", clickX);
					marker.attr("cy", clickY);
					// marker.scale(paperResizeRatio, paperResizeRatio, clickX, clickY);
				}
			}
		}
	} else if (ev.target.getAttribute("customNodeName") == "circle") {

		var marker = null;
		allMarkers.forEach(function(markerMap) {
			markerMap.forEach(function(markerId, markerObj) {
				if (markerObj.isPointInside(clickX, clickY)) {
					if (manuallyConnectingMarkerFrom != markerObj) {
						marker = markerObj;
						return false;
					} else {
						alertDialog("You cannot connect a marker to itself. Please select a marker to connect to or select \"Cancel Manual Connect\" button");
					}
				}
			});
			if(marker != null) {
				return false;
			}
		});
		handleMarkerClick(marker);
	} else if (ev.target.getAttribute("customNodeName") == "path") {
		var pathElement;
		var pathObject;
		paper.forEach(function(element) {
			if (element.isPointInside(clickX, clickY) && element.type == "path") {
				pathElement = element;
				return false;
			}
		});
		pathMap.forEach(function(pathString, path) {
			if (path.element == pathElement) {
				pathObject = path;
				return false;
			}
		});

		if (pathObject != null) {
			if (removingMode) {
				removeConnection(pathObject);
			} else {
				$("#dialog_modal .modal-title").toggleClass("text-danger", false);
				$("#dialog_modal .modal-title").text("Connection Information");
				$("#dialog_modal .modal-body").html("This connects:<br> " +
					pathObject.marker1Data.id + "<br>" +
					"    and    " + "<br>" +
					pathObject.marker2Data.id + "<br>" +
					"Distance: " + pathObject.distance);
				$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal' onclick='removeConnectionFromString(\""+pathObject+"\")'>Delete connection</button>" +
				"<button type='button' class='btn btn-default' data-dismiss='modal'>Cancel</button>");
				$('#dialog_modal').modal('toggle');
			}
		} else {
			// Not a path we created, send event through function again if this is the first try
			if (!secondTry) {
				handleClick(ev, true);
			} else {
				// Failed twice.. ignore the click
			}
		}

	}
}

function handleMarkerClick(marker) {
	if (marker != null) {
		if (manuallyConnectingMarker) {
			if (manuallyConnectingMarkerFrom == null) {
				manuallyConnectingMarkerFrom = marker;
				setToolTipText(MANUALLY_CONNECTING_MARKER_TO);
				marker.attr({
					"stroke-opacity": .5,
					"stroke-width": 5
				});
			} else {
				manuallyConnectingMarkerTo = marker;
				makeConnection(manuallyConnectingMarkerFrom, manuallyConnectingMarkerTo);
				cancelManualConnect(false);
			}
		} else if (removingMode) {
			removeMarker(marker);
		} else {
			$("#dialog_modal .modal-title").toggleClass("text-danger", false);
			$("#dialog_modal .modal-title").text("Marker Information");
			$("#dialog_modal .modal-body").html("ID: " + marker.data(GlobalStrings.ID) + "<br>Type: " + marker.data(GlobalStrings.TYPE));
			$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal' onclick='connectMarkerFrom(\""+marker.data(GlobalStrings.ID)+"\")'>Connect to marker</button>" +
			"<button type='button' class='btn btn-default' data-dismiss='modal' onclick='removeMarkerWithId(\""+marker.data(GlobalStrings.ID)+"\")'>Remove</button>" +
			"<button type='button' class='btn btn-default' data-dismiss='modal'>Cancel</button>");
			$('#dialog_modal').modal('toggle');
		}
	}
}

function removeConnectionFromString(pathString) {
	var pathObject = pathMap.get(pathString);
	removeConnection(pathObject);
}

function connectMarkerFrom(id) {
	var marker = getMarkerFromId(id);
	var totalMarkers = getTotalNumberOfMarkers();
	if (totalMarkers > 1) {
		manualConnect();
		manuallyConnectingMode = false;
		manuallyConnectingMarkerFrom = marker;
		marker.attr({
			"stroke-opacity": .5,
			"stroke-width": 5
		});
	} else {
		alertDialog("There are no other markers to connect to");
	}
}

function removeMarkerWithId(id){
	var marker = getMarkerFromId(id);
	removeMarker(marker);
}

function getMarkerColorFromType(type) {
	var color = markerTypeToColorMap.get(type);
	
	if(color == null) {
		color = "black";
	}
	return color;
}

function getMarkerData(marker) {
	var markerData;
	if (marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
		markerData = new MarkerData(marker.attr("cx"), marker.attr("cy"), marker.data(GlobalStrings.ID), marker.data(GlobalStrings.TYPE));
	} else {
		markerData = new MarkerData(marker.attr("cx"), marker.attr("cy"), marker.data(GlobalStrings.ID), marker.data(GlobalStrings.TYPE),
			marker.data(GlobalStrings.BUILDING), marker.data(GlobalStrings.FLOOR));
	}
	return markerData;
}

function getTotalNumberOfMarkers() {
	var totalMarkers = 0;
	allMarkers.forEach(function(markerMap) {
		totalMarkers += markerMap.size();
	});
	return totalMarkers;
}

function getConnectionMapForType(type) {
	return typeToConnectionMap.get(type);
}

function getMarkerMapForType(type) {
	return typeToMarkerMap.get(type);
}

function cancelManualConnect(cancelManuallyConnectingMode) {
	if (manuallyConnectingMarkerFrom != null) {
		manuallyConnectingMarkerFrom.attr({
			"stroke-opacity": 1,
			"stroke-width": 1
		});
	}
	if (manuallyConnectingMarkerTo != null) {
		manuallyConnectingMarkerFrom.attr({
			"stroke-opacity": 1,
			"stroke-width": 1
		});
	}

	if (manuallyConnectingMode) {
		if (cancelManuallyConnectingMode) {
			manuallyConnectingMode = false;
			manuallyConnectingMarker = false;
			manuallyConnectingMarkerFrom = null;
			manuallyConnectingMarkerTo = null;
			setToolTipTextForCurrentlyPlotting();
			$("#manual_connect_button").text("Manual Connect");
		} else {
			manuallyConnectingMarker = true;
			manuallyConnectingMarkerFrom = null;
			manuallyConnectingMarkerTo = null;
			setToolTipText(MANUALLY_CONNECTING_MARKER_FROM);
		}
	} else {
		manuallyConnectingMarker = false;
		manuallyConnectingMarkerFrom = null;
		manuallyConnectingMarkerTo = null;
		setToolTipTextForCurrentlyPlotting();
		$("#manual_connect_button").text("Manual Connect");
	}
}

// x is x coordinate
// y is y coordinate
//element is the element this new marker is connected to

function plotMarker(x, y, element) {
	if(currentBuilding == GlobalStrings.ALL_BUILDINGS && currentlyPlotting != plottingPathway) {
		alertDialog("Unless you are plotting pathway markers, you must select a specific building and floor to plot markers.");
	} else {
		var marker;
		switch (currentlyPlotting) {
			case -1:
				// Not plotting
				break;
			case plottingRoom:
				if (element != null) {
					marker = plotRoom(x, y, currentBuilding, currentFloor, element.data(GlobalStrings.ID));
				} else {
					alertDialog("Cannot plot marker for room. The selected area is outside of a building");
				}
				break;
			case plottingDoor:
				marker = plotDoor(x, y, currentBuilding, currentFloor);
				break;
			case plottingHallway:
				marker = plotHallway(x, y, currentBuilding, currentFloor);
				break;
			case plottingPathway:
				if (element == null) {
					marker = plotPathway(x, y);
				} else {
					alertDialog("Cannot plot marker for pathway. The selected area is inside of a building");
				}
				break;
			case plottingStair:
				marker = plotStair(x, y, currentBuilding, currentFloor);
				break;
			case plottingElevator:
				marker = plotElevator(x, y, currentBuilding, currentFloor);
				break;
			case plottingBathroomMens:
				marker = plotBathroomMens(x, y, currentBuilding, currentFloor);
				break;
			case plottingBathroomWomens:
				marker = plotBathroomWomens(x, y, currentBuilding, currentFloor);
				break;
		}
	
		if(marker != null) {
			typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).set(marker, newConnectionSet());
		}
		
		return marker;
	}
	return null;
}

function plotRoom(x, y, building, floor, elementId) {
	var roomId = formatRoomId(building, floor, elementId);

	info("Plotting new room " + roomId + " at (" + x + "," + y + ")");

	var addToUndoStackHolder = addToUndoStack;
	addToUndoStack = false;

	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.ROOM));

	addToUndoStack = addToUndoStackHolder;

	marker.data(GlobalStrings.ID, formatRoomId(building, floor, elementId));
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.ROOM);
	if (roomMap.containsKey(marker.data(GlobalStrings.ID))) {
		addToUndoStackHolder = addToUndoStack;
		addToUndoStack = false;

		marker.remove();

		addToUndoStack = addToUndoStackHolder;

		alertDialog("There is already a marker for this room");
	} else {
		roomMap.set(marker.data(GlobalStrings.ID), marker);
	}

	// Need to explicitly add to undo stack here because we said not to above
	if (addToUndoStack) {
		undoStack.push(new Command().addMarker(marker));
	}

	return marker;
}

function plotDoor(x, y, building, floor) {
	var id = formatDoorId(building, floor);
	info("Plotting new door " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.DOOR));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.DOOR);
	doorMap.set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotHallway(x, y, building, floor) {
	var id = formatHallwayId(building, floor);
	info("Plotting new hallway " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.HALLWAY));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.HALLWAY);
	hallwayMap.set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotPathway(x, y) {
	var id = formatPathwayId();
	info("Plotting new pathway " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.PATHWAY));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.TYPE, GlobalStrings.PATHWAY);
	pathwayMap.set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotStair(x, y, building, floor) {
	var id = formatStairId(building, floor);
	info("Plotting new stair " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.STAIR));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.STAIR);
	stairMap.set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotElevator(x, y, building, floor) {
	var id = formatElevatorId(building, floor);
	info("Plotting new elevator " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.ELEVATOR));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.ELEVATOR);
	elevatorMap.set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotBathroomMens(x, y, building, floor) {
	var id = formatBathroomMensId(building, floor);
	info("Plotting new men's bathroom " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.BATHROOM_MENS));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.BATHROOM_MENS);
	bathroomMensMap.set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotBathroomWomens(x, y, building, floor) {
	var id = formatBathroomWomensId(building, floor);
	info("Plotting new women's bathroom " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.BATHROOM_WOMENS));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.BATHROOM_WOMENS);
	bathroomWomensMap.set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function addMarker(x, y, color) {
	var marker = paper.circle(x, y, markerSize).attr({
		fill: color
	});
	
	setMarkerDragEventHandlers(marker);

	if (addToUndoStack) {
		undoStack.push(new Command().addMarker(marker));
	}
	
	allElementsSet.push(marker);
	
	return marker;
}

function getMarkerFromId(id) {
	var returnMarker = null;
	
	allMarkers.forEach(function(markerMap){
		returnMarker = markerMap.get(id);
		if(returnMarker != null) {
			return false;
		}
	});

	return returnMarker;
}

function autoConnect() {
	info("Automatically connecting markers");
	var addedPathsSet = new buckets.Set();
	
	allMarkers.forEach(function(markerMap){
		markerMap.forEach(function(markerId, marker){
			if(marker.isVisible()){
				if(marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM) {
					// For each room, connect to corresponding doors
					var room = marker;
					var closestDoor = getClosestDoor(room, true, true);
					if(closestDoor != null) {
						var connection = makeConnection(room, closestDoor);
						if(connection != null) {
							addedPathsSet.add(connection);
						}
					}
					doorMap.forEach(function(doorId, door) {
						if (room.data(GlobalStrings.ID) == door.data(GlobalStrings.ID)) {
							addedPathsSet.add(makeConnection(room, door));
						}
					});
				} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
					// For each door, connect to closest hallway
					var door = marker;
					var closestHallway = getClosestHallway(door);
					if (closestHallway != null && getDistance(door, closestHallway) < 80) {
						var connection = makeConnection(door, closestHallway);
						if (connection != null) {
							addedPathsSet.add(connection);
						}
						door.data(GlobalStrings.HALLWAY, closestHallway.data(GlobalStrings.ID));
					} else {
						if (doorConnectionMap.get(door).size() == 0) {
							var closestRoom = getClosestRoom(door);
							if(closestRoom != null && getDistance(door, closestRoom) <= 50 && roomConnectionMap.get(closestRoom).size() < 2) {
								var connection = makeConnection(door, closestRoom);
								if (connection != null) {
									addedPathsSet.add(connection);
								}
							}
						}
					}
				} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY) {
					// For each hallway, connect to closest hallway if hallway in the same building and floor (otherwise it would go through a door)
					var hallway = marker;
					var connectTo = null;
					var closestHallway = getClosestHallway(hallway);
					if (closestHallway != null) {
						// Check if closestHallway connected to a door closer to hallway than closestHallway is (should go through that door instead
						// only if hallway not already connected to a door)
						var closestHallwayDistance = getDistance(hallway, closestHallway);
						var connectedToADoor = false;
						hallwayConnectionMap.get(hallway).forEach(function(connection){
							if(connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
								connectedToADoor = true;
								return false;
							}
						});
						var connectionSet = hallwayConnectionMap.get(closestHallway);

						var closestDoor = null;
						if(connectionSet != null && !connectedToADoor) {
							connectionSet.forEach(function(connection){
								if(connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
									if(getDistance(hallway, connection.marker) < closestHallwayDistance) {
										var doorConnectedToARoom = false;
										doorConnectionMap.get(connection.marker).forEach(function(connection2){
											if(connection2.marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM ||
												connection2.marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS || 
												connection2.marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
												doorConnectedToARoom = true;
											}
										});
										if(!doorConnectedToARoom) {
											if(closestDoor == null) {
												closestDoor = connection.marker;
											} else {
												if(getDistance(hallway, connection.marker) < getDistance(hallway, closestDoor)) {
													closestDoor = connection.marker;
												}
											}
										}
									}
								}
							});
						}
						
						var connection;
						if(closestDoor != null) {
							connectTo = closestDoor;
							connection = makeConnection(hallway, connectTo);
						} else {
							connectTo = closestHallway;
							if(getDistance(hallway, connectTo) < 80) {
								connection = makeConnection(hallway, connectTo);
							} 
						}
						
						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
					// For each pathway, connect to closest pathway or door (whichever is closer)
					var pathway = marker;
					var closestPathway = getClosestPathway(pathway);
					var closestDoor = getClosestDoor(pathway, false, false);
					var connectTo = null;
					var connectToConnectionMap;
					if (closestPathway != null) {
						var distanceToPathway = getDistance(pathway, closestPathway);
						var distanceToDoor = 9999999;
						if (closestDoor != null) {
							distanceToDoor = getDistance(pathway, closestDoor);
						}
						if (distanceToDoor < distanceToPathway) {
							connectTo = closestDoor;
							connectToConnectionMap = doorConnectionMap;
						} else {
							connectTo = closestPathway;
							connectToConnectionMap = pathwayConnectionMap;
						}
					} else if (closestDoor != null) {
						connectTo = closestDoor;
						connectToConnectionMap = doorConnectionMap;
					}
					if (connectTo != null) {
						var connection = makeConnection(pathway, connectTo);
						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
					// For each stair, connect to closest hallway
					var stair = marker;
					var closestHallway = getClosestHallway(stair);
					if (closestHallway != null) {
						var connection = makeConnection(stair, closestHallway);
						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
					// For each elevator, connect to closest hallway
					var elevator = marker;
					var closestHallway = getClosestHallway(elevator);
					if (closestHallway != null) {
						var connection = makeConnection(elevator, closestHallway);
						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS) {
					// For each bathroom, connect to closest door
					var bathroom = marker;
					var closestDoor = getClosestDoor(bathroom);
					if(closestDoor != null) {
						var connection = makeConnection(bathroom, closestDoor);
						if(connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
					// For each bathroom, connect to closest door
					var bathroom = marker;
					var closestDoor = getClosestDoor(bathroom);
					if(closestDoor != null) {
						var connection = makeConnection(bathroom, closestDoor);
						if(connection != null) {
							addedPathsSet.add(connection);
						}
					}
				}
			}
		});
	});

	if (addToUndoStack) {
		undoStack.add(new Command().autoConnect(addedPathsSet));
	}
}

function getClosestRoom(marker) {
	var closestRoom = null;
	var closestDistance = 9999999;
	
	roomMap.forEach(function(roomId, room) {
		if (room.isVisible() && marker != room && inSameBuilding(marker, room) && onSameFloor(marker, room)) {
			var distance = getDistance(marker, room);
			if (distance < closestDistance) {
				closestRoom = room;
				closestDistance = distance;
			}
		}
	});
	
	if (closestRoom != null) {
		debug("Closest room marker to " + marker.data(GlobalStrings.ID) + " is " + closestRoom.data(GlobalStrings.ID));
	} else {
		debug("Closest room marker to " + marker.data(GlobalStrings.ID) + " is null");
	}
	
	return closestRoom;
}

function getClosestBathroomMens(marker) {
	var closestBathroom = null;
	var closestDistance = 9999999;
	bathroomMensMap.forEach(function(bathroomId, bathroom) {
		if (bathroom.isVisible() && marker != bathroom && inSameBuilding(marker, bathroom) && onSameFloor(marker, bathroom)) {
			var distance = getDistance(marker, bathroom);
			if (distance < closestDistance) {
				closestBathroom = bathroom;
				closestDistance = distance;
			}
		}
	});

	if (closestBathroom != null) {
		debug("Closest men's bathroom marker to " + marker.data(GlobalStrings.ID) + " is " + closestBathroom.data(GlobalStrings.ID));
	} else {
		debug("Closest men's bathroom marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestBathroom;
}

function getClosestBathroomWomens(marker) {
	var closestBathroom = null;
	var closestDistance = 9999999;
	bathroomWomensMap.forEach(function(bathroomId, bathroom) {
		if (bathroom.isVisible() && marker != bathroom && inSameBuilding(marker, bathroom) && onSameFloor(marker, bathroom)) {
			var distance = getDistance(marker, bathroom);
			if (distance < closestDistance) {
				closestBathroom = bathroom;
				closestDistance = distance;
			}
		}
	});

	if (closestBathroom != null) {
		debug("Closest women's bathroom marker to " + marker.data(GlobalStrings.ID) + " is " + closestBathroom.data(GlobalStrings.ID));
	} else {
		debug("Closest women's bathroom marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestBathroom;
}

function getClosestHallway(marker) {
	var closestHallway = null;
	var closestDistance = 9999999;
	hallwayMap.forEach(function(hallwayId, hallway) {
		if (hallway.isVisible() && marker != hallway && inSameBuilding(marker, hallway) && onSameFloor(marker, hallway)) {
			var distance = getDistance(marker, hallway);
			if (distance < closestDistance) {
				closestHallway = hallway;
				closestDistance = distance;
			}
		}
	});

	if (closestHallway != null) {
		debug("Closest hallway marker to " + marker.data(GlobalStrings.ID) + " is " + closestHallway.data(GlobalStrings.ID));
	} else {
		debug("Closest hallway marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestHallway;
}

function getClosestDoor(marker, sameBuilding, sameFloor) {
	var closestDoor = null;
	var closestDistance = 9999999;
	doorMap.forEach(function(doorId, door) {
		var valid = true;
		if (sameBuilding && !inSameBuilding(marker, door)) {
			valid = false;
		}
		if (sameFloor && !onSameFloor(marker, door)) {
			valid = false;
		}
		if (door.isVisible() && marker != door && valid) {
			var distance = getDistance(marker, door);
			if (distance < closestDistance) {
				closestDoor = door;
				closestDistance = distance;
			}
		}
	});

	if (closestDoor != null) {
		debug("Closest door marker to " + marker.data(GlobalStrings.ID) + " is " + closestDoor.data(GlobalStrings.ID));
	} else {
		debug("Closest door marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestDoor;
}

function getClosestPathway(marker) {
	var closestPathway = null;
	var closestDistance = 9999999;
	pathwayMap.forEach(function(pathwayId, pathway) {
		if (marker != pathway) {
			var distance = getDistance(marker, pathway);
			if (distance < closestDistance) {
				closestPathway = pathway;
				closestDistance = distance;
			}
		}
	});

	if (closestPathway != null) {
		debug("Closest door marker to " + marker.data(GlobalStrings.ID) + " is " + closestPathway.data(GlobalStrings.ID));
	} else {
		debug("Closest door marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestPathway;
}

function inSameBuilding(marker1, marker2) {
	return marker1.data(GlobalStrings.BUILDING) == marker2.data(GlobalStrings.BUILDING);
}

function onSameFloor(marker1, marker2) {
	return marker1.data(GlobalStrings.FLOOR) == marker2.data(GlobalStrings.FLOOR);
}

function makeConnection(marker1, marker2) {
	// If connecting a door to a room or hallway, set the door's specific data
	if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.ROOM && marker2.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
		if (marker1.data(GlobalStrings.ID) != marker2.data(GlobalStrings.ROOM)) {
			marker2.data(GlobalStrings.ROOM, marker1.data(GlobalStrings.ID));
		}
	} else if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.ROOM && marker1.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
		if (marker2.data(GlobalStrings.ID) != marker1.data(GlobalStrings.ROOM)) {
			marker1.data(GlobalStrings.ROOM, marker2.data(GlobalStrings.ID));
		}
	} else if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY && marker2.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
		if (marker1.data(GlobalStrings.ID) != marker2.data(GlobalStrings.HALLWAY)) {
			marker2.data(GlobalStrings.HALLWAY, marker1.data(GlobalStrings.ID));
		}
	} else if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY && marker1.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
		if (marker2.data(GlobalStrings.ID) != marker1.data(GlobalStrings.HALLWAY)) {
			marker1.data(GlobalStrings.HALLWAY, marker2.data(GlobalStrings.ID));
		}
	}

	// Make connection from marker1 to marker2
	var marker1ConnectionMap = getConnectionMapForType(marker1.data(GlobalStrings.TYPE));
	var marker2ConnectionMap = getConnectionMapForType(marker2.data(GlobalStrings.TYPE));

	var connectionSet = marker1ConnectionMap.get(marker1);
	if (connectionSet == null) {
		connectionSet = newConnectionSet();
	}
	var distance = getDistance(marker1, marker2);
	var success = connectionSet.add(new Connection(marker2, distance));

	var addedPath = null;

	if (success) {
		// If it wasn't successful that means these 2 markers are already connected. Don't connect them again
		addedPath = makePath(marker1, marker2);
		marker1ConnectionMap.set(marker1, connectionSet);
	}

	// Add connection for marker2 to marker1
	var connectionSet = marker2ConnectionMap.get(marker2);
	if (connectionSet == null) {
		connectionSet = newConnectionSet();
	}

	var success = connectionSet.add(new Connection(marker1, distance));
	if (success) {
		// If it wasn't successful that means these 2 markers are already connected. Don't connect them again
		marker2ConnectionMap.set(marker2, connectionSet);
	}

	return addedPath;
}

function makePath(marker1, marker2) {
	debug("Making path between " + marker1.data(GlobalStrings.ID) + " and " + marker2.data(GlobalStrings.ID));

	var path = paper.path("M" + marker1.attr("cx") + " " + marker1.attr("cy") + "L" + marker2.attr("cx") + " " + marker2.attr("cy"));
	path.toBack();
	path.attr("stroke-width", pathStrokeWidth);
	var distance = getDistance(marker1, marker2);
	var pathObject = new Path(path, getMarkerData(marker1), getMarkerData(marker2), distance);
	pathMap.set(pathObject.toString(), pathObject);

	if (addToUndoStack) {
		undoStack.push(new Command().addConnection(pathObject));
	}
	return pathObject;
}

function newMarkerSet() {
	return new buckets.Set(function markerToString(marker) {
		return marker.data(GlobalStrings.ID);
	});
}

function newConnectionSet() {
	return new buckets.Set(function connectionToString(connection) {
		return connection.marker.data(GlobalStrings.ID);
	});
}

function newConnectionMap() {
	return new buckets.Dictionary(function markerToString(marker) {
		return marker.data(GlobalStrings.ID);
	});
}

function markerIdNull(marker) {
	return marker.data(GlobalStrings.ID) == null;
}

function getRoomFromRoomId(roomId) {
	return roomId.substr(roomId.lastIndexOf("rm_") + 3);
}

function formatRoomId(building, floor, room) {
	return "bldg_" + building + "_flr_" + floor + "_rm_" + room;
}

function formatDoorId(building, floor) {
	doorIdCount++;
	var id = "bldg_" + building + "_flr_" + floor + "_dr_" + doorIdCount;
	return id;
}

function formatHallwayId(building, floor) {
	hallwayIdCount++;
	var id = "bldg_" + building + "_flr_" + floor + "_hw_" + hallwayIdCount;
	return id;
}

function formatPathwayId() {
	pathwayIdCount++;
	var id = "pathway_" + pathwayIdCount;
	return id;
}

function formatStairId(building, floor) {
	stairIdCount++;
	var id = "bldg_" + building + "_flr_" + floor + "_st_" + stairIdCount;
	return id;
}

function formatElevatorId(building, floor) {
	elevatorIdCount++;
	var id = "bldg_" + building + "_flr_" + floor + "_el_" + elevatorIdCount;
	return id;
}

function formatBathroomMensId(building, floor) {
	bathroomMensIdCount++;
	var id = "bldg_" + building + "_flr_" + floor + "_bathroom_mens_" + bathroomMensIdCount;
	return id;
}

function formatBathroomWomensId(building, floor) {
	bathroomWomensIdCount++;
	var id = "bldg_" + building + "_flr_" + floor + "_bathroom_womens_" + bathroomWomensIdCount;
	return id;
}

function getDistance(marker1, marker2) {
	return dist(marker1.attr("cx"), marker1.attr("cy"), marker2.attr("cx"), marker2.attr("cy"));
}

function dist(point1X, point1Y, point2X, point2Y) {
	var xs = 0;
	var ys = 0;

	xs = point2X - point1X;
	xs = xs * xs;

	ys = point2Y - point1Y;
	ys = ys * ys;

	return Math.floor(Math.sqrt(xs + ys));
}

// When plotting radio button is clicked

function plotSelect(type) {
	if (type == GlobalStrings.ROOM) {
		roomSelected();
	} else if (type == GlobalStrings.DOOR) {
		doorSelected();
	} else if (type == GlobalStrings.HALLWAY) {
		hallwaySelected();
	} else if (type == GlobalStrings.PATHWAY) {
		pathwaySelected();
	} else if (type == GlobalStrings.STAIR) {
		stairSelected();
	} else if (type == GlobalStrings.ELEVATOR) {
		elevatorSelected();
	} else if (type == GlobalStrings.BATHROOM_MENS) {
		bathroomMensSelected();
	} else if (type == GlobalStrings.BATHROOM_WOMENS) {
		bathroomWomensSelected();
	} else {
		warn("plotSelect called with invalid type " + type);
	}
}

function roomSelected() {
	debug("Room plotting selected");
	currentlyPlotting = plottingRoom;
	setToolTipTextForCurrentlyPlotting();
}

function doorSelected() {
	debug("Door plotting selected");
	currentlyPlotting = plottingDoor;
	setToolTipTextForCurrentlyPlotting();
}

function hallwaySelected() {
	debug("Hallway plotting selected");
	currentlyPlotting = plottingHallway;
	setToolTipTextForCurrentlyPlotting();
}

function pathwaySelected() {
	debug("Pathway plotting selected");
	currentlyPlotting = plottingPathway;
	setToolTipTextForCurrentlyPlotting();
}

function stairSelected() {
	debug("Stair plotting selected");
	currentlyPlotting = plottingStair;
	setToolTipTextForCurrentlyPlotting();
}

function elevatorSelected() {
	debug("Elevator plotting selected");
	currentlyPlotting = plottingElevator;
	setToolTipTextForCurrentlyPlotting();
}

function bathroomMensSelected() {
	debug("Men's bathroom plotting selected");
	currentlyPlotting = plottingBathroomMens;
	setToolTipTextForCurrentlyPlotting();
}

function bathroomWomensSelected() {
	debug("Women's bathroom plotting selected");
	currentlyPlotting = plottingBathroomWomens;
	setToolTipTextForCurrentlyPlotting();
}

function setToolTipTextForCurrentlyPlotting() {
	var toolTipText = "";
	switch (currentlyPlotting) {
		case -1:
			// Not plotting
			break;
		case plottingRoom:
			toolTipText = ROOM_TOOL_TIP_TEXT;
			break;
		case plottingDoor:
			toolTipText = DOOR_TOOL_TIP_TEXT;
			break;
		case plottingHallway:
			toolTipText = HALLWAY_TOOL_TIP_TEXT;
			break;
		case plottingPathway:
			toolTipText = PATHWAY_TOOL_TIP_TEXT;
			break;
		case plottingStair:
			toolTipText = STAIR_TOOL_TIP_TEXT;
			break;
		case plottingElevator:
			toolTipText = ELEVATOR_TOOL_TIP_TEXT;
			break;
		case plottingBathroomMens:
			toolTipText = BATHROOM_MENS_TOOL_TIP_TEXT;
			break;
		case plottingBathroomWomens:
			toolTipText = BATHROOM_WOMENS_TOOL_TIP_TEXT;
			break;
	}
	setToolTipText(toolTipText);
}

function setToolTipText(text) {
	$("#tool_tip").html(text);
}

function manualConnect() {
	if (manuallyConnectingMode) {
		debug("Cancel manual connect selected");
		cancelManualConnect(true);
		enableAllButtons();
	} else {
		debug("Manual connect selected");
		var totalMarkers = getTotalNumberOfMarkers();
		if (totalMarkers > 1) {
			manuallyConnectingMode = true;
			manuallyConnectingMarker = true;
			setToolTipText(MANUALLY_CONNECTING_MARKER_FROM);
			$("#manual_connect_button").text("Cancel Manual Connect");
			disableAllButtonsExcept("manual_connect_button");
		} else {
			alertDialog("There are not enough markers to make a connection");
		}
	}
}

function alertDialog(alertText) {
	$("#dialog_modal .modal-title").toggleClass("text-danger", true);
	$("#dialog_modal .modal-title").text("Alert");
	$("#dialog_modal .modal-body").html("<b>" + alertText + "</b>");
	$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal'>Ok</button>");
	$('#dialog_modal').modal('toggle');
}

function markerDialog(text) {
	$("#dialog_modal .modal-title").toggleClass("text-danger", true);
	$("#dialog_modal .modal-title").text("Alert");
	$("#dialog_modal .modal-body").html("<b>" + text + "</b>");
	$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal'>Ok</button>");
	$('#dialog_modal').modal('toggle');
}

function removeConnection(pathObject, marker1, marker2, marker1ConnectionSet, marker2ConnectionSet) {
	var start = new Date().getTime();
	debug("Removing connection for path " + pathObject);
	if(typeof marker1 !== "undefined" && typeof marker2 !== "undefined") {
		if(typeof marker1ConnectionSet !== "undefined" && typeof marker2ConnectionSet !== "undefined") {
			if(marker1ConnectionSet != null) {
				marker1ConnectionSet.forEach(function(connection) {
					if (connection.marker == marker2) {
						marker1ConnectionSet.remove(connection);
						return false;
					}
				});
			}
			
			if(marker2ConnectionSet != null){
				marker2ConnectionSet.forEach(function(connection) {
					if (connection.marker == marker1) {
						marker2ConnectionSet.remove(connection);
						return false;
					}
				});
			}
		}
	} else {
		var marker1ConnectionSet;
		marker1ConnectionSet = getConnectionMapForType(pathObject.marker1Data.type).get(getMarkerFromId(pathObject.marker1Data.id));
		if(marker1ConnectionSet != null){
			marker1ConnectionSet.forEach(function(connection) {
				if (connection.marker.data(GlobalStrings.ID) == pathObject.marker2Data.id) {
					marker1ConnectionSet.remove(connection);
					return false;
				}
			});
		}

		var marker2ConnectionSet;
		marker2ConnectionSet = getConnectionMapForType(pathObject.marker2Data.type).get(getMarkerFromId(pathObject.marker2Data.id));
		if(marker2ConnectionSet != null){
			marker2ConnectionSet.forEach(function(connection) {
				if (connection.marker.data(GlobalStrings.ID) == pathObject.marker1Data.id) {
					marker2ConnectionSet.remove(connection);
					return false;
				}
			});
		}
	}

	pathMap.remove(pathObject.toString());

	pathObject.element.remove();

	stats("Took " + (new Date().getTime() - start) + " ms to remove connection " + pathObject);
	return pathObject;
}

function removeMarker(marker) {
	debug("Removing marker " + marker.data(GlobalStrings.ID));
	var removedPaths = removeAllConnectionsFrom(marker);
	var markerMap = getMarkerMapForType(marker.data(GlobalStrings.TYPE));
	markerMap.remove(marker.data(GlobalStrings.ID));

	if (addToUndoStack) {
		undoStack.add(new Command().removeMarker(marker, removedPaths));
	}

	marker.remove();
}

function removeAllConnectionsFrom(marker) {
	var start = new Date().getTime();
	debug("Removing all connections from marker " + marker.data(GlobalStrings.ID));
	var removedPaths = new buckets.Set();
	var markerConnectionSet = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if(markerConnectionSet != null) {
		markerConnectionSet.forEach(function(connection){
			var path = pathMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
			if(path == null) {
				path = pathMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
			}
			removedPaths.add(removeConnection(path, marker, connection.marker, markerConnectionSet, 
				typeToConnectionMap.get(connection.marker.data(GlobalStrings.TYPE)).get(connection.marker)));
		});
	}

	stats("Took " + (new Date().getTime() - start) + " ms to remove all connections from marker " + marker.data(GlobalStrings.ID));
	return removedPaths;
}

function removeMode() {
	if (removingMode) {
		debug("Cancel remove mode selected");
		removingMode = false;
		cancelManualConnect(true);
		$("#remove_button").text("Remove mode");
		enableAllButtons();
		$("#remove_button").toggleClass("active", false);
	} else {
		debug("Remove mode selected");
		removingMode = true;
		cancelManualConnect(true);
		setToolTipText(REMOVE_MODE_TIP_TEXT);
		$("#remove_button").text("Cancel remove mode");
		disableAllButtonsExcept("remove_button");
		$("#remove_button").toggleClass("active", true);
	}
}

function undo() {
	debug("Undo selected");
	var command = undoStack.pop();
	if (command != null) {
		command.undoAction();
	}
}

function redo() {
	debug("Redo selected");
	var command = redoStack.pop();
	if (command != null) {
		command.redoAction();
	}
}

function disableAllButtons() {
	$("#change_building_floor_popover").attr("disabled", true);
	$("#plot_markers_popover").attr("disabled", true);
	$("#auto_connect_button").attr("disabled", true);
	$("#manual_connect_button").attr("disabled", true);
	$("#remove_button").attr("disabled", true);
	$("#undo_button").attr("disabled", true);
	$("#redo_button").attr("disabled", true);
	$("#generate_button").attr("disabled", true);
	$("#testing_dropdown").attr("disabled", true);
	$("#stop_pathfinding").attr("disabled", true);
	$("#exit_testing").attr("disabled", true);
}

function disableAllButtonsExcept(buttonId) {
	disableAllButtons();

	$("#" + buttonId).attr("disabled", false);
}

function enableAllButtons() {
	$("#change_building_floor_popover").attr("disabled", false);
	$("#plot_markers_popover").attr("disabled", false);
	$("#auto_connect_button").attr("disabled", false);
	$("#manual_connect_button").attr("disabled", false);
	$("#remove_button").attr("disabled", false);
	$("#undo_button").attr("disabled", false);
	$("#redo_button").attr("disabled", false);
	$("#generate_button").attr("disabled", false);
	$("#testing_dropdown").attr("disabled", false);
	$("#stop_pathfinding").attr("disabled", false);
	$("#exit_testing").attr("disabled", false);
}

function generateGraph() {
	var start = new Date().getTime();
	graph = new Graph();
	
	allMarkers.forEach(function(markerMap){
		markerMap.forEach(function(markerId, marker) {
			var connectionsString = "";
			var firstConnection = true;
			
			var markerConnectionSet = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
			markerConnectionSet.forEach(function(connection){
				if (firstConnection) {
					firstConnection = false;
				} else {
					connectionsString += ", ";
				}
				
				if(marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM || connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM) {
					connectionsString += connection.marker.data(GlobalStrings.ID) + ": " + (connection.distance*5);
				} else {
					connectionsString += connection.marker.data(GlobalStrings.ID) + ": " + connection.distance;
				}
			});

			if (connectionsString != "") {
				graph.addVertex("" + marker.data(GlobalStrings.ID) + "", eval("({" + connectionsString + "})"));
			}
		});
	});

	info(convertMarkersAndPathsToJson(roomMap, doorMap, hallwayMap, pathwayMap, stairMap, elevatorMap, bathroomMensMap, bathroomWomensMap, pathMap));
	
	stats("Took " + (new Date().getTime() - start) + " ms to generate graph");

	// var request = $.ajax({
	// 	url: "upload",
	// 	type: "POST",
	// 	data: {
	// 		graph: $.param(graph.vertices)
	// 	},
	// 	dataType: "html"
	// });
	//
	// request.done(function(msg) {
	// 	debug(msg);
	// });
	//
	// request.fail(function(jqXHR, textStatus) {
	// 	alert("Request failed: " + textStatus);
	// });
}

function testFindPath() {
	if (showingPath) {
		executeOnAllMarkers(function(marker) {
			marker.stop();
			marker.attr({
				fill: getMarkerColorFromType(marker.data(GlobalStrings.TYPE)),
				stroke: "black"
			});
			marker.show();
		});

		pathMap.forEach(function(pathString, path) {
			path.element.stop();
			path.element.attr({
				fill: "black",
				stroke: "black"
			});
			path.element.show();
		});

		showingPath = false;
		$("#testing_dropdown").toggle();
		$("#stop_pathfinding_button").toggle();
		enableAllButtons();
	} else {
		var markerOptionsHTML = "";
		allMarkers.forEach(function(markerMap){
			markerMap.forEach(function(markerId, marker){
				markerOptionsHTML += "<option value='" + markerId + "'>" + markerId + "</option>";
			});
		});
		markerOptionsHTML += "<option value='closest_bathroom_mens'>closest_bathroom_mens</option>";
		markerOptionsHTML += "<option value='closest_bathroom_womens'>closest_bathroom_womens</option>";
		markerOptionsHTML += "<option value='dion_building'>dion_building</option>";

		var menuHTML = "<fieldset>" +
			"<label for='findPathFrom'>From</label>" +
			"<select name='findPathFrom' id='findPathFrom'>" +
			markerOptionsHTML +
			"</select>" +
			"<br>" +
			"<label for='findPathTo'>To</label>" +
			"<select name='findPathTo' id='findPathTo'>" +
			markerOptionsHTML +
			"</select>" +
			"</fieldset>";
			
			var footerButtonsHTML = "<button type='button' class='btn btn-default' data-dismiss='modal' onclick='findPathSelected()'>Pathfind</button>" +
			"<button type='button' class='btn btn-default' data-dismiss='modal'>Cancel</button>";
			
			$("#dialog_modal .modal-title").toggleClass("text-danger", false);
			$("#dialog_modal .modal-title").text("Test Pathfinding");
			$("#dialog_modal .modal-body").html(menuHTML);
			$("#dialog_modal .modal-footer").html(footerButtonsHTML);
			$('#dialog_modal').modal('toggle');
	}
}

function findPathSelected() {
	showingPath = true;
	if($("#findPathTo option:selected").text() == "closest_bathroom_mens") {
		var closestBathroom = getClosestBathroomMens(getMarkerFromId($("#findPathFrom option:selected").text()));
		if(closestBathroom != null) {
			findPath($("#findPathFrom option:selected").text(), closestBathroom.data(GlobalStrings.ID));
		}
	} else if($("#findPathTo option:selected").text() == "closest_bathroom_womens"){
		var closestBathroom = getClosestBathroomWomens(getMarkerFromId($("#findPathFrom option:selected").text()));
		if(closestBathroom != null) {
			findPath($("#findPathFrom option:selected").text(), closestBathroom.data(GlobalStrings.ID));
		}
	} else if($("#findPathTo option:selected").text() == "dion_building") {
		var path = getPathToBuilding(allMarkers, pathMap, graph, $("#findPathFrom option:selected").text(), "dion");
		findPath(path[0], path[path.length-1]);
	} else {
		findPath($("#findPathFrom option:selected").text(), $("#findPathTo option:selected").text());
	}
	$("#testing_dropdown").toggle();
	$("#stop_pathfinding_button").toggle();
	disableAllButtonsExcept("stop_pathfinding_button");
}

function findPath(marker1ID, marker2ID) {
	var start = new Date().getTime();
	debug("Getting shortest path from " + marker1ID + " to " + marker2ID);
	var path = graph.shortestPath("" + marker1ID + "", "" + marker2ID + "").concat(["" + marker1ID + ""]).reverse();
	debug(path);

	executeOnAllMarkers(function(marker) {
		marker.stop();
		marker.attr({
			fill: getMarkerColorFromType(marker.data(GlobalStrings.TYPE)),
			stroke: "black"
		});
		marker.hide();
	});

	pathMap.forEach(function(pathString, path) {
		path.element.stop();
		path.element.attr({
			fill: "black",
			stroke: "black"
		});
		path.element.hide();
	});

	for (var i = 0; i < path.length; i++) {
		var markerID = path[i];
		var marker = getMarkerFromId(markerID);

		var animation = Raphael.animation({
			fill: "gold",
			stroke: "gold"
		}, 1000, "<>").repeat(Infinity);

		// marker.animate(animation);

		if (i < path.length - 1) {
			var pathObject = pathMap.get(path[i] + "<->" + path[i+1]);
			if(pathObject == null) {
				pathObject = pathMap.get(path[i+1] + "<->" + path[i]);
			}
			var pathElement = pathObject.element;

			if (pathElement != null) {
				pathElement.show();
				pathElement.animate(animation);
			}
		}
	}
	
	stats("Took " + (new Date().getTime() - start) + " ms to find and show path from " + marker1ID + " to " + marker2ID);
}

function executeOnAllMarkers(func) {
	allMarkers.forEach(function(markerMap) {
		markerMap.forEach(function(markerId, marker) {
			func(marker);
		});
	});
}

function testForBadPaths() {
	if (testingForBadPaths) {
		$("#testing_dropdown").toggle();
		$("#exit_testing_button").toggle();
		enableAllButtons();
		testingForBadPaths = false;

		executeOnAllMarkers(function(marker) {
			marker.attr("r", markerSize);
			marker.stop();
			marker.attr({
				fill: getMarkerColorFromType(marker.data(GlobalStrings.TYPE)),
				stroke: "black"
			});
		});

		pathMap.forEach(function(pathString, path) {
			path.element.stop();
			path.element.attr({
				fill: "black",
				stroke: "black"
			});
		});
	} else {
		generateGraph();
		if (graph != null) {
			info("Testing for bad paths...");
			testingForBadPaths = true;
			disableAllButtons();

			var start = new Date().getTime();
			var idToTestedIdSetMap = new buckets.Dictionary();
			var badPaths = 0;
			// Room to room: Check if number of rooms gone through is > 1
			roomMap.forEach(function(markerFromID, markerFrom) {
				var testedIdSet = idToTestedIdSetMap.get(markerFromID);
				if (testedIdSet == null) {
					testedIdSet = new buckets.Set();
				}
				roomMap.forEach(function(markerToID, markerTo) {
					if (!testedIdSet.contains(markerToID) && markerFromID != markerToID) {
						var path = graph.shortestPath("" + markerFromID + "", "" + markerToID + "").concat(["" + markerFromID + ""]).reverse();
						if(path.length == 1) {
							error("There is no path from " + markerFromID + " to " + markerToID);
							badPaths++;
						}
						// path[0] and path[path.length-1]
						// var roomCount = 0;
						// for (var i = 1; i < path.length - 1; i++) {
						// 	var marker = getMarkerFromId(path[i]);
						// 	if (marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM) {
						// 		roomCount++;
						// 	}
						// }
						// if (roomCount > 1) {
						// 	error("Path from " + markerFromID + " to " + markerToID + " goes through " + roomCount + " other rooms. " + path);
						// 	badPaths++;
						// 	var pathColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
						// 	for (var i = 0; i < path.length; i++) {
						// 		var markerID = path[i];
						// 		var marker = getMarkerFromId(markerID);
						//
						// 		var animation = Raphael.animation({
						// 			fill: pathColor,
						// 			stroke: pathColor
						// 		}, 1000, "<>").repeat(Infinity);
						//
						// 		marker.animate(animation);
						//
						// 		if (i < path.length - 1) {
						// 			var marker1ID = marker.data(GlobalStrings.ID);
						// 			var marker2ID = path[i + 1];
						//
						// 			var pathObject = pathMap.get(marker1ID + "<->" + marker2ID);
						// 			if(pathObject == null) {
						// 				pathObject = pathMap.get(marker2ID + "<->" + marker1ID);
						// 			}
						//
						// 			pathObject.element.animate(animation);
						// 		}
						// 	}
						// }

						testedIdSet.add(markerToID);
						var markerToTestedIdSet = idToTestedIdSetMap.get(markerToID);
						if (markerToTestedIdSet == null) {
							markerToTestedIdSet = new buckets.Set();
						}
						markerToTestedIdSet.add(markerFromID);
						idToTestedIdSetMap.set(markerToID, markerToTestedIdSet);
					}

				});

				idToTestedIdSetMap.set(markerFromID, testedIdSet);
			});
			stats("Testing for bad paths complete. Found " + badPaths + " bad paths. Took " + (new Date().getTime() - start) + " ms");

			$("#testing_dropdown").toggle();
			$("#exit_testing_button").toggle();
			disableAllButtonsExcept("exit_testing_button");
		} else {
			warn("Graph is null! Cannot test for bad paths");
		}
	}
}

var markerFormShowing = false;
var selectedMarkerType = GlobalStrings.ROOM;
var changeBuildingFloorShowing = false;
function pop() {
	var markerFormContent = "<form id='marker_form' onchange='markerFormChanged()' style='width: 244px'>" +
		"Use this form to select and format the type of marker to plot" +
		"<div class='form-group'>" +
		"<label for='selector'>Type</label>" +
	"<select id='selector' name='marker_type' class='form-control' form='marker_form'>";
	
	GlobalStrings.forEachMarkerStringPair(function(normal, display){
		markerFormContent += "<option id='" + normal + "' " + (selectedMarkerType == normal ? "selected='true'" : "") + ">" + display + "</option>";
	});
	
	markerFormContent += "</select>" +
		"</div>" +
		"<div class='form-group'>" +
		"<label for='color_selector'>Color</label>" +
	"<select id='color_selector' class='form-control' style='background-color: " + getMarkerColorFromType(selectedMarkerType) + "'>";
	
	GlobalStrings.COLOR.forEachStringPair(function(normal, display){
		markerFormContent += "<option id='" + normal + "' " + (getMarkerColorFromType(selectedMarkerType) == normal ? "selected='true'" : "") + ">" + display + "</option>";
	});
	
	markerFormContent += "</select>" +
		"</div>" +
	"<div class='form-group'>" + 
	"<input class='btn btn-default btn-block' type='button' value='OK' onclick='hideMarkerPopover()'>" +
	"</div>" + 
	"</form>";

	if (!markerFormShowing) {
		$("#plot_markers_popover").attr("data-content", markerFormContent);
		
		var popoverCaretUp = "Plot Markers <span class='dropup'><span class='caret'></span></span>";
		$("#plot_markers_popover").html(popoverCaretUp);
	} else {
		var popoverCaretDown = "Plot Markers <span class='caret'></span>";
		$("#plot_markers_popover").html(popoverCaretDown);
	}
	markerFormShowing = !markerFormShowing;
}

function markerFormChanged() {
	var markerType = GlobalStrings.getNormalFromDisplay($("#selector").val());
	var markerColor = getMarkerColorFromType(markerType);
	if(markerType == selectedMarkerType) {
		// Marker's color changed
		markerColor = GlobalStrings.getNormalFromDisplay($("#color_selector").val());
		markerTypeToColorMap.set(selectedMarkerType, markerColor);
		
		var markerMap = getMarkerMapForType(markerType);
		markerMap.forEach(function(markerId, marker){
			marker.attr("fill", markerColor);
		});
	}
	selectedMarkerType = markerType;
	plotSelect(selectedMarkerType);
	$("#color_selector").css("background-color", markerColor);
	$("#color_selector").val(GlobalStrings.getDisplayFromNormal(markerColor));
	
	switch(selectedMarkerType) {
	case GlobalStrings.ROOM:
		currentlyPlotting = plottingRoom;
		break;
	case GlobalStrings.DOOR:
		currentlyPlotting = plottingDoor;
		break;
	case GlobalStrings.HALLWAY:
		currentlyPlotting = plottingHallway;
		break;
	case GlobalStrings.PATHWAY:
		currentlyPlotting = plottingPathway;
		break;
	case GlobalStrings.STAIR:
		currentlyPlotting = plottingStair;
		break;
	case GlobalStrings.ELEVATOR:
		currentlyPlotting = plottingElevator;
		break;
	case GlobalStrings.BATHROOM_MENS:
		currentlyPlotting = plottingBathroomMens;
		break;
	case GlobalStrings.BATHROOM_WOMENS:
		currentlyPlotting = plottingBathroomWomens;
		break;
	}
}

function hideMarkerPopover() {
	var popoverCaretDown = "Plot Markers <span class='caret'></span>";
	$("#plot_markers_popover").html(popoverCaretDown);
	$("#plot_markers_popover").popover('toggle');
	markerFormShowing = !markerFormShowing;
}

function changeBuildingFloor() {
	var buildingFloorContent = "<form id='change_building_floor_form' onchange='changeBuildingFloorChanged()' style='width: 244px'>" +
		"<div class='form-group'>" +
		"<label for='building_selector'>Building</label>" +
	"<select id='building_selector' name='building' class='form-control'>" + 
	"<option id='"+GlobalStrings.ALL_BUILDINGS+"' " + (currentBuilding ==  GlobalStrings.ALL_BUILDINGS ? "selected='true'" : "") + ">"+GlobalStrings.ALL_BUILDINGS+"</option>";
	buildingToFloorMap.forEach(function(building, floorToShapeListMap){
		buildingFloorContent += "<option id='" + building + "' " + (currentBuilding == building ? "selected='true'" : "") + ">" + building + "</option>";
	});
	
	buildingFloorContent += "</select>" +
		"</div>" +
		"<div class='form-group'>" +
		"<label for='floor_selector'>Floor</label>" +
	"<select id='floor_selector' class='form-control'>";
	
	if(currentBuilding == GlobalStrings.ALL_BUILDINGS) {
		var lowFloor;
		var topFloor;
		buildingToFloorMap.forEach(function(building, floorToShapeListMap) {
			floorToShapeListMap.forEach(function(floor, shapeList) {
				if(lowFloor == null || floor < lowFloor) {
					lowFloor = floor;
				}
				if(topFloor == null || floor > topFloor) {
					topFloor = floor;
				}
			});
		});
		if(lowFloor != null && topFloor != null) {
			for(var i = lowFloor; i <= topFloor; i++) {
				var floor = i;
				buildingFloorContent += "<option id='" + floor + "' " + (currentFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>";
			}
		}
	} else {
		buildingToFloorMap.get(currentBuilding).forEach(function(floor, shapeList){
			buildingFloorContent += "<option id='" + floor + "' " + (currentFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>";
		});
	}
	
	buildingFloorContent += "</select>" +
		"</div>" +
	"<div class='form-group'>" + 
	"<input class='btn btn-default btn-block' type='button' value='OK' onclick='hideChangeBuildingFloorPopover()'>" +
	"</div>" + 
	"</form>";
	
	if (!changeBuildingFloorShowing) {
		$("#change_building_floor_popover").attr("data-content", buildingFloorContent);
		
		var popoverCaretUp = "Change Building/Floor <span class='dropup'><span class='caret'></span></span>";
		$("#change_building_floor_popover").html(popoverCaretUp);
	} else {
		var popoverCaretDown = "Change Building/Floor <span class='caret'></span>";
		$("#change_building_floor_popover").html(popoverCaretDown);
	}
	changeBuildingFloorShowing = !changeBuildingFloorShowing;
}

function hideChangeBuildingFloorPopover() {
	var popoverCaretDown = "Change Building/Floor <span class='caret'></span>";
	$("#change_building_floor_popover").html(popoverCaretDown);
	$("#change_building_floor_popover").popover('toggle');
	changeBuildingFloorShowing = !changeBuildingFloorShowing;
}

function changeBuildingFloorChanged() {
	var selectedBuilding = $("#building_selector").val();
	var selectedFloor = $("#floor_selector").val();
	if(selectedBuilding != currentBuilding) {
		if(selectedBuilding != GlobalStrings.ALL_BUILDINGS) {
			// Building changed. Try to stay on same floor but different building. Else try for B of building, then 1st floor etc.
			var newFloor;
			buildingToFloorMap.get(selectedBuilding).forEach(function(floor, shapeList){
				if(newFloor == null) {
					newFloor = floor;
				} else {
					if(floor == selectedFloor) {
						newFloor = selectedFloor;
					} else {
						if(floor == "B" || floor == "1") {
							newFloor = floor;
						}
					}
				}
			});
			
			currentFloor = newFloor;
		}

		currentBuilding = selectedBuilding;
	} else {
		// Floor changed
		currentFloor = selectedFloor;
	}
	
	showShapesForCurrentBuildingAndFloor();
}

function showShapesForBuildingAndFloor(building, floor) {
	debug("Showing shapes for building " + building + " and floor " + floor);
	paperX = 999999;
	paperY = 999999;
	var lowerRightX = -999999;
	var lowerRightY = -999999;
	var showAllBuildings = (building == GlobalStrings.ALL_BUILDINGS);
	buildingToFloorMap.forEach(function(bldg, floorToShapeListMap){
		floorToShapeListMap.forEach(function(flr, shapeListAndNameMap){
			var shapeList = shapeListAndNameMap.get("shapes");
			var nameList = shapeListAndNameMap.get("names");
			shapeList.forEach(function(shape){
				if((showAllBuildings || building == bldg) && floor == flr) {
					shape.show();
				} else {
					shape.hide();
				}
				
				if (showAllBuildings || (building == bldg && floor == flr)) {
					var bbox = shape.getBBox();
					if (bbox.x < paperX) {
						paperX = bbox.x;
					}
					if (bbox.y < paperY) {
						paperY = bbox.y;
					}
					if (bbox.x2 > lowerRightX) {
						lowerRightX = bbox.x2;
					}
					if (bbox.y2 > lowerRightY) {
						lowerRightY = bbox.y2;
					}
				}

			});
			nameList.forEach(function(name){
				if((showAllBuildings || building == bldg) && floor == flr) {
					name.show();
				} else {
					name.hide();
				}
			});
		});
	});
	
	paperShiftX = paperX;
	paperShiftY = paperY;
	paper.setViewBox(paperX, paperY, paper.width, paper.height, false);
	
	executeOnAllMarkers(function(marker){
		if(marker.data(GlobalStrings.TYPE) != GlobalStrings.PATHWAY) {
			if(marker.data(GlobalStrings.TYPE) != GlobalStrings.STAIR && marker.data(GlobalStrings.TYPE) != GlobalStrings.ELEVATOR) {
				if((showAllBuildings || marker.data(GlobalStrings.BUILDING) == currentBuilding) && marker.data(GlobalStrings.FLOOR) == currentFloor) {
					marker.show();
				} else {
					marker.hide();
				}
			} else {
				// Stairs and elevators just show if in the current building
				if((showAllBuildings || marker.data(GlobalStrings.BUILDING) == currentBuilding)) {
					marker.show();
				} else {
					marker.hide();
				}
			}
		}
	});
	
	pathMap.forEach(function(pathString, path){
		if(((showAllBuildings || path.marker1Data.building == currentBuilding) && path.marker1Data.floor == currentFloor) || 
		   ((showAllBuildings || path.marker2Data.building == currentBuilding) && path.marker2Data.floor == currentFloor)) {
				
			   	path.element.show();
			} else {
				path.element.hide();
			}
	});
}

function showShapesForCurrentBuildingAndFloor() {
	debug("Showing shapes for current building and floor");
	showShapesForBuildingAndFloor(currentBuilding, currentFloor);
}