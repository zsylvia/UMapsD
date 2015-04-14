/* 
This contains all the objects and methods to create the raphael page, loads in the dictionary, add event handlers, 
and exposes methods to control which buildings and floors and room names are displayed
*/

var raphaelDiv = "raphael";
var raphaelDivJQuery = "#" + raphaelDiv;

var paper;
var totalCenterX;
var totalCenterY;

var loadedBuildingsAndFloors = new buckets.Dictionary();
var loadedMarkerIds = new buckets.LinkedList();

var roomMap = new buckets.Dictionary();
var doorMap = new buckets.Dictionary();
var hallwayMap = new buckets.Dictionary();
var pathwayMap = new buckets.Dictionary();
var stairMap = new buckets.Dictionary();
var elevatorMap = new buckets.Dictionary();
var bathroomMensMap = new buckets.Dictionary();
var bathroomWomensMap = new buckets.Dictionary();
var parkingLotMap = new buckets.Dictionary();

var markerSize = 5;
var pathStrokeWidth = 4;

var mouseOnMarker = false;

//These counts are just used when naming, the number does not matter it only removes duplicates
var doorIdCount = 0;
var hallwayIdCount = 0;
var pathwayIdCount = 0;
var stairIdCount = 0;
var elevatorIdCount = 0;
var bathroomMensIdCount = 0;
var bathroomWomensIdCount = 0;

var allMarkers = new buckets.LinkedList();
allMarkers.add(roomMap);
allMarkers.add(doorMap);
allMarkers.add(hallwayMap);
allMarkers.add(pathwayMap);
allMarkers.add(stairMap);
allMarkers.add(elevatorMap);
allMarkers.add(bathroomMensMap);
allMarkers.add(bathroomWomensMap);
allMarkers.add(parkingLotMap);

var roomConnectionMap = newConnectionMap();
var doorConnectionMap = newConnectionMap();
var hallwayConnectionMap = newConnectionMap();
var pathwayConnectionMap = newConnectionMap();
var stairConnectionMap = newConnectionMap();
var elevatorConnectionMap = newConnectionMap();
var bathroomMensConnectionMap = newConnectionMap();
var bathroomWomensConnectionMap = newConnectionMap();
var parkingLotConnectionMap = newConnectionMap();

var typeToConnectionMap = new buckets.Dictionary();
typeToConnectionMap.set(GlobalStrings.ROOM, roomConnectionMap);
typeToConnectionMap.set(GlobalStrings.DOOR, doorConnectionMap);
typeToConnectionMap.set(GlobalStrings.HALLWAY, hallwayConnectionMap);
typeToConnectionMap.set(GlobalStrings.PATHWAY, pathwayConnectionMap);
typeToConnectionMap.set(GlobalStrings.STAIR, stairConnectionMap);
typeToConnectionMap.set(GlobalStrings.ELEVATOR, elevatorConnectionMap);
typeToConnectionMap.set(GlobalStrings.BATHROOM_MENS, bathroomMensConnectionMap);
typeToConnectionMap.set(GlobalStrings.BATHROOM_WOMENS, bathroomWomensConnectionMap);
typeToConnectionMap.set(GlobalStrings.PARKING_LOT, parkingLotConnectionMap);

var typeToMarkerMap = new buckets.Dictionary();
typeToMarkerMap.set(GlobalStrings.ROOM, roomMap);
typeToMarkerMap.set(GlobalStrings.DOOR, doorMap);
typeToMarkerMap.set(GlobalStrings.HALLWAY, hallwayMap);
typeToMarkerMap.set(GlobalStrings.PATHWAY, pathwayMap);
typeToMarkerMap.set(GlobalStrings.STAIR, stairMap);
typeToMarkerMap.set(GlobalStrings.ELEVATOR, elevatorMap);
typeToMarkerMap.set(GlobalStrings.BATHROOM_MENS, bathroomMensMap);
typeToMarkerMap.set(GlobalStrings.BATHROOM_WOMENS, bathroomWomensMap);
typeToMarkerMap.set(GlobalStrings.PARKING_LOT, parkingLotMap);

var markerTypeToColorMap = new buckets.Dictionary();
markerTypeToColorMap.set(GlobalStrings.ROOM, GlobalStrings.COLOR.RED);
markerTypeToColorMap.set(GlobalStrings.DOOR, GlobalStrings.COLOR.BLUE);
markerTypeToColorMap.set(GlobalStrings.HALLWAY, GlobalStrings.COLOR.ORANGE);
markerTypeToColorMap.set(GlobalStrings.PATHWAY, GlobalStrings.COLOR.GREEN);
markerTypeToColorMap.set(GlobalStrings.STAIR, GlobalStrings.COLOR.PURPLE);
markerTypeToColorMap.set(GlobalStrings.ELEVATOR, GlobalStrings.COLOR.YELLOW);
markerTypeToColorMap.set(GlobalStrings.BATHROOM_MENS, GlobalStrings.COLOR.CYAN);
markerTypeToColorMap.set(GlobalStrings.BATHROOM_WOMENS, GlobalStrings.COLOR.PINK);
markerTypeToColorMap.set(GlobalStrings.PARKING_LOT, GlobalStrings.COLOR.LIME);

var pathMap = new buckets.Dictionary();

var buildingShortToLongNameMap = new buckets.Dictionary();
var buildingToFloorMap = new buckets.Dictionary();
var buildingToFloorIdsMap = new buckets.Dictionary();
var currentBuilding = "dion";
var currentFloor = "1";

var paperResizeRatio = 1;
var paperWidth;
var paperHeight;

var paperShiftX = 0;
var paperShiftY = 0;

var draggingEverythingIgnoreClick = false;

var markersInvisible = false;

var dictionaryLoaded = false;

var mouseDown = false;
var currX;
var currY;

var hasGraph = false;

function Connection(marker, distance) {
	this.marker = marker;
	this.distance = distance;

	this.toString = function() {
		return marker1.data(GlobalStrings.ID) + "-" + distance;
	}
}

$(document).ready(function() {
	var start = new Date().getTime();

	$(raphaelDivJQuery).css("width", $(window).width());
	$(raphaelDivJQuery).css("height", $(window).height() - $("#body").height());

	paper = new ScaleRaphael(raphaelDiv, $(raphaelDivJQuery).width(), $(raphaelDivJQuery).height());

	paper.setStart();

	var shapesCount = 0;

	loadShapesForBuildingAndFloor(currentBuilding, currentFloor);

	paper.setFinish();

	paperWidth = paper.width;
	paperHeight = paper.height;

	raphaelSetup();

	LOG.trace("Took " + (new Date().getTime() - start) + " ms to setup raphael");

	$(window).resize(function() {
		$(raphaelDivJQuery).css("width", $(window).width());
		$(raphaelDivJQuery).css("height", $(window).height() - $("#body").height());
		paper.changeSize($(raphaelDivJQuery).width(), $(raphaelDivJQuery).height(), false, false);
	});

	document.getElementById(raphaelDiv).addEventListener("touchstart", function(event) {
		if (event.preventDefault) event.preventDefault();
		currX = event.touches[0].pageX;
		currY = event.touches[0].pageY;
		mouseDown = true;
	}, false);
	document.getElementById(raphaelDiv).addEventListener("touchmove", function(event) {
		if (event.preventDefault) event.preventDefault();
		if (mouseDown && !mouseOnMarker) {
			if (event.preventDefault) {
				event.preventDefault();
			}
			paperShiftX = Math.floor(paperShiftX + (currX - event.touches[0].pageX) * paperResizeRatio);
			paperShiftY = Math.floor(paperShiftY + (currY - event.touches[0].pageY) * paperResizeRatio);
			currX = event.touches[0].pageX;
			currY = event.touches[0].pageY;

			paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, false);

			draggingEverythingIgnoreClick = true;
		}
	}, false);
	document.getElementById(raphaelDiv).addEventListener("touchend", function(event) {
		if (event.preventDefault) event.preventDefault();
		if (mouseDown) {
			mouseDown = false;
		}
	}, false);
	$(raphaelDivJQuery).mousedown(function(event) {
		if(event.target.nodeName == "tspan") {
			currX = event.pageX;
			currY = event.pageY - ($(document).height() - $("#raphael").height());
		} else {
			currX = event.offsetX;
			currY = event.offsetY;
		}
		mouseDown = true;
	});
	$(raphaelDivJQuery).mousemove(function(event) {
		var ignoreEvent = false;
		try {
			ignoreEvent = mouseOnMarker;
		} catch (err) {
			if (err.name == "ReferenceError") {
				// Ignore...
			} else {
				console.error(err.stack);
			}
		}
		if (mouseDown && !ignoreEvent) {
			if (event.preventDefault) {
				event.preventDefault();
			}
			if(event.target.nodeName == "tspan") {
				paperShiftX = Math.floor(paperShiftX + (currX - event.pageX) * paperResizeRatio);
				paperShiftY = Math.floor(paperShiftY + (currY - (event.pageY - ($(document).height() - $("#raphael").height()))) * paperResizeRatio);
				currX = event.pageX;
				currY = event.pageY - ($(document).height() - $("#raphael").height());
			} else {
				paperShiftX = Math.floor(paperShiftX + (currX - event.offsetX) * paperResizeRatio);
				paperShiftY = Math.floor(paperShiftY + (currY - event.offsetY) * paperResizeRatio);
				currX = event.offsetX;
				currY = event.offsetY;	
			}

			paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, false);

			draggingEverythingIgnoreClick = true;
		}
	});
	$(raphaelDivJQuery).mouseup(function(event) {
		mouseDown = false;
	});

	//Firefox
	$(raphaelDivJQuery).bind('DOMMouseScroll', function(e) {
		var resizeRatio;
		if (e.originalEvent.detail > 0) {
			//scroll down / zoom out 10%
			resizeRatio = .90;
			paperResizeRatio = (paperResizeRatio * resizeRatio);
		} else {
			//scroll up / zoom in 10%
			resizeRatio = 1.1;
			paperResizeRatio = (paperResizeRatio * resizeRatio);
		}

		paperWidth = paperWidth * resizeRatio;
		paperHeight = paperHeight * resizeRatio;

		paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);

		//prevent page from scrolling
		return false;
	});

	//IE, Opera, Safari
	$(raphaelDivJQuery).bind('mousewheel', function(e) {
		var resizeRatio;
		if (e.originalEvent.wheelDelta > 0) {
			zoomIn();
		} else {
			zoomOut();
		}
		
		//prevent page from scrolling
		return false;
	});
});

function raphaelSetup() {
	var leftmostTopLeftX = 99999;
	var leftmostTopLeftY = 99999;
	var leftmostEl;
	var rightmostBottomRightX = 0;
	var rightmostBottomRightY = 0;
	var rightmostEl;

	for (var i = 0; i < dictionary.buildings.length; i++) {
		floorIdList = new buckets.LinkedList();
		tmpList = new buckets.LinkedList();
		for (var j = 0; j < dictionary.buildings[i].floors.length; j++) {
			tmpList.add(dictionary.buildings[i].floors[j].id);
		}
		//Sort the list
		for (var j = 0; j < dictionary.buildings[i].floors.length; j++) {
			flr = tmpList.first();
			tmpList.forEach(function(floor) {
				if (floor < flr) {
					flr = floor;
				}
			});
			tmpList.remove(flr);
			floorIdList.add(flr);
		}
		buildingToFloorIdsMap.set(dictionary.buildings[i].short_id, floorIdList);
	}

	buildingToFloorMap.forEach(function(building, floorToShapeListAndNameMap) {
		floorToShapeListAndNameMap.forEach(function(floor, shapeListAndNameMap) {
			shapeListAndNameMap.get("shapes").forEach(function(shape) {
				var id = shape.data(GlobalStrings.ID);
				var bbox = shape.getBBox();
				var centerX = bbox.x + (bbox.width / 2);
				var centerY = bbox.y + (bbox.height / 2);

				if (id == "outline" && building == currentBuilding && floor == currentFloor) {
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
		});
	});

	hasGraph = loadGraphData();
	showShapesForCurrentBuildingAndFloor();
	
	dictionaryLoaded = true;
}

function loadGraphData() {
	var json = null;
	try {
		json = graphJS
	} catch (err) {
		if (err.name == "ReferenceError") {
			// Ignore...
		} else {
			console.error(err.stack);
		}
	}
	
	if(json != null) {
		createAllMarkersFromJson(json, paper).forEach(function(markerId, marker){
			typeToMarkerMap.get(marker.data(GlobalStrings.TYPE)).set(markerId, marker);
		});
	
		createAllPathsFromJson(json, paper).forEach(function(pathString, path) {
			pathMap.set(pathString, path);
		});
		
		return true;
	}
	
	return false;
}

function loadShapesForBuildingAndFloor(building, floor) {
	if (buildingToFloorMap.containsKey(building) && buildingToFloorMap.get(building).containsKey(floor)) {
		return;
	}
	LOG.debug("Loading shapes for building " + building + " and floor " + floor);
	for (var i = 0; i < dictionary.buildings.length; i++) {
		buildingShortToLongNameMap.set(dictionary.buildings[i].short_id, dictionary.buildings[i].full_id);
		if (building == GlobalStrings.ALL_BUILDINGS || dictionary.buildings[i].short_id == building) {
			if (buildingToFloorMap.containsKey(dictionary.buildings[i].short_id) && buildingToFloorMap.get(dictionary.buildings[i].short_id).containsKey(floor)) {
				continue;
			}
			var floorToShapeListAndNameMap = buildingToFloorMap.get(dictionary.buildings[i].short_id);
			if (floorToShapeListAndNameMap == null) {
				floorToShapeListAndNameMap = new buckets.Dictionary();
			}
			for (var j = 0; j < dictionary.buildings[i].floors.length; j++) {
				if (dictionary.buildings[i].floors[j].id == floor) {
					var shapeListAndNameMap = floorToShapeListAndNameMap.get(dictionary.buildings[i].floors[j].id);
					if (shapeListAndNameMap == null) {
						shapeListAndNameMap = new buckets.Dictionary();
					}
					var shapeList = shapeListAndNameMap.get("shapes");
					if (shapeList == null) {
						shapeList = new buckets.LinkedList(function(shape) {
							return shape.data(GlobalStrings.ID);
						});
					}
					var nameList = shapeListAndNameMap.get("names");
					if (nameList == null) {
						nameList = new buckets.LinkedList();
					}
					for (var k = 0; k < dictionary.buildings[i].floors[j].shapes.length; k++) {
						var shape = dictionary.buildings[i].floors[j].shapes[k];
						if (shape.path != "") {
							var path = paper.path(shape.path).data(GlobalStrings.ID, shape.id);
							var bbox = path.getBBox();
							var centerX = bbox.x + (bbox.width / 2);
							var centerY = bbox.y + (bbox.height / 2);

							nameList.add(paper.text(centerX, centerY, shape.id).attr({"font-size": 6}).toFront().hide());

							if (idIsType(shape.id, GlobalStrings.ROOM) || idIsType(shape.id, GlobalStrings.BATHROOM_MENS) || idIsType(shape.id, GlobalStrings.BATHROOM_WOMENS)) {
								// path.attr({fill: "#0a2871", "fill-opacity": .75});
							} else if (shape.id == "outline") {
								// path.attr({fill: "#fddcac", "fill-opacity": .5});
							}
							shapeList.add(path);
						}
					}
					shapeListAndNameMap.set("shapes", shapeList);
					shapeListAndNameMap.set("names", nameList);
					floorToShapeListAndNameMap.set(dictionary.buildings[i].floors[j].id, shapeListAndNameMap);
				}
			}
			buildingToFloorMap.set(dictionary.buildings[i].short_id, floorToShapeListAndNameMap);
		}
	}
}

function showShapesForBuildingAndFloor(building, floor) {
	loadShapesForBuildingAndFloor(building, floor);
	LOG.debug("Showing shapes for building " + building + " and floor " + floor);
	var paperX = 999999;
	var paperY = 999999;
	var lowerRightX = -999999;
	var lowerRightY = -999999;
	var showAllBuildings = (building == GlobalStrings.ALL_BUILDINGS);
	buildingToFloorMap.forEach(function(bldg, floorToShapeListMap) {
		floorToShapeListMap.forEach(function(flr, shapeListAndNameMap) {
			var shapeList = shapeListAndNameMap.get("shapes");
			var nameList = shapeListAndNameMap.get("names");
			shapeList.forEach(function(shape) {
				if ((showAllBuildings || building == bldg) && floor == flr) {
					shape.show();
				} else {
					shape.hide();
				}

				if ((showAllBuildings || building == bldg) && floor == flr) {
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
			nameList.forEach(function(name) {
				if (name.attr("text") != "outline" && (showAllBuildings || building == bldg) && floor == flr) {
					name.show();
					name.toFront();
				} else {
					name.hide();
				}
			});
		});
	});

	paperShiftX = Math.floor(paperX);
	paperShiftY = Math.floor(paperY);
	paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, false);
	
	if(hasGraph) {
		showMarkersForCurrentBuildingAndFloor();
	}
	
	resizeToFitShapesForBuildingAndFloor(building, floor);
}

function showShapesForCurrentBuildingAndFloor() {
	LOG.debug("Showing shapes for current building and floor");
	showShapesForBuildingAndFloor(currentBuilding, currentFloor);
}

function idIsType(id, type) {
	switch (type) {
		case GlobalStrings.ROOM:
			if (id.lastIndexOf(GlobalStrings.ROOM_ID + "_") > -1) {
				return true;
			}
			break;
		case GlobalStrings.DOOR:
			if (id.lastIndexOf(GlobalStrings.DOOR_ID + "_") > -1) {
				return true;
			}
			break;
		case GlobalStrings.HALLWAY:
			if (id.lastIndexOf(GlobalStrings.HALLWAY_ID) + "_" > -1) {
				return true;
			}
			break;
		case GlobalStrings.PATHWAY:
			if (id.lastIndexOf(GlobalStrings.PATHWAY_ID + "_") > -1) {
				return true;
			}
			break;
		case GlobalStrings.STAIR:
			if (id.lastIndexOf(GlobalStrings.STAIR_ID + "_") > -1) {
				return true;
			}
			break;
		case GlobalStrings.ELEVATOR:
			if (id.lastIndexOf(GlobalStrings.ELEVATOR_ID + "_") > -1) {
				return true;
			}
			break;
		case GlobalStrings.BATHROOM_MENS:
			if (id.lastIndexOf(GlobalStrings.BATHROOM_MENS_ID + "_") > -1) {
				return true;
			}
			break;
		case GlobalStrings.BATHROOM_WOMENS:
			if (id.lastIndexOf(GlobalStrings.BATHROOM_WOMENS_ID + "_") > -1) {
				return true;
			}
			break;
	}
	return false;
}

function idIsValid(id) {
	if (idIsType(id, GlobalStrings.ROOM)) {
		return true;
	}
	if (idIsType(id, GlobalStrings.DOOR)) {
		return true;
	}
	if (idIsType(id, GlobalStrings.HALLWAY)) {
		return true;
	}
	if (idIsType(id, GlobalStrings.PATHWAY)) {
		return true;
	}
	if (idIsType(id, GlobalStrings.STAIR)) {
		return true;
	}
	if (idIsType(id, GlobalStrings.ELEVATOR)) {
		return true;
	}
	if (idIsType(id, GlobalStrings.BATHROOM_MENS)) {
		return true;
	}
	if (idIsType(id, GlobalStrings.BATHROOM_WOMENS)) {
		return true;
	}
	return false;
}

function showPathsForMarker(marker, building, floor) {
	LOG.trace("Showing paths for marker " + marker.data(GlobalStrings.ID) + " building " + building + " floor " + floor);
	var connectionMap = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if(connectionMap != null) {
		connectionMap.forEach(function(connection){
			if(connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY || 
			((building == GlobalStrings.ALL_BUILDINGS || connection.marker.data(GlobalStrings.BUILDING)) && connection.marker.data(GlobalStrings.FLOOR) == floor)) {
				var path = pathMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
				if(path == null) {
					path = pathMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
				}
				if(path != null) {
					path.element.show();
				} else {
					LOG.error("Could not find path between " + marker.data(GlobalStrings.ID) + " and " + connection.marker.data(GlobalStrings.ID));
				}
			}
		});
	}
}

function hidePathsForMarker(marker, building, floor) {
	LOG.trace("Hiding paths for marker " + marker.data(GlobalStrings.ID) + " building " + building + " floor " + floor);
	var connectionMap = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if(connectionMap != null) {
		connectionMap.forEach(function(connection){
			if(connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY || 
			((building == GlobalStrings.ALL_BUILDINGS || connection.marker.data(GlobalStrings.BUILDING)) && connection.marker.data(GlobalStrings.FLOOR) == floor)) {
				var path = pathMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
				if(path == null) {
					path = pathMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
				}
				if(path != null) {
					path.element.hide();
				} else {
					LOG.error("Could not find path between " + marker.data(GlobalStrings.ID) + " and " + connection.marker.data(GlobalStrings.ID));
				}
			}
		});
	}
}

// Must run showShapesForCurrentBuildingAndFloor() before this
function showMarkersForCurrentBuildingAndFloor() {
	LOG.debug("Showing markers for current building and floor");
	showMarkersForBuildingAndFloor(currentBuilding, currentFloor);
}

// Must run showShapesForBuildingAndFloor(building, floor) before this
function showMarkersForBuildingAndFloor(building, floor) {
	loadMarkersForBuildingAndFloor(building, floor);
	if(!markersInvisible) {
		LOG.debug("Showing markers for building " + building + " floor " + floor);
		LOG.debug("Only displaying pathways if floor is 1");
		LOG.warn("Change this to show all pathways that are NOT connected to ANY door/parking lot at all OR if it is connected to door/parking lot on this floor");
		allMarkers.forEach(function(markerMap) {
			markerMap.forEach(function(markerId, marker) {
				if((marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY || marker.data(GlobalStrings.TYPE) == GlobalStrings.PARKING_LOT) && floor == "1") {
					marker.show();
					showPathsForMarker(marker, building, floor);
				} else if((building == GlobalStrings.ALL_BUILDINGS || marker.data(GlobalStrings.BUILDING) == building) && marker.data(GlobalStrings.FLOOR) == floor) {
					marker.show();
					showPathsForMarker(marker, building, floor);
				} else {
					marker.hide();
					hidePathsForMarker(marker, building, floor);
				}
			});
		});
		showPathsForBuildingAndFloor(building, floor);
		hidePathsForBuildingAndFloor(building, floor);
	}
}

// Shows paths that HAVE have both endpoints in the building and floor
function showPathsForBuildingAndFloor(building, floor) {
	LOG.trace("Showing paths for " + building + " floor " + floor);
	pathMap.forEach(function(pathString, path){
		if(building != GlobalStrings.ALL_BUILDINGS) {
			if(path.marker1Data.type != GlobalStrings.PATHWAY && path.marker2Data.type != GlobalStrings.PATHWAY) {
				if((path.marker1Data.building == building && path.marker1Data.floor == floor) && (path.marker2Data.building == building && path.marker2Data.floor == floor)) {
					path.element.show();
				}
			}
		} else {
			path.element.show();
		}
	});
}

// Hides paths that do NOT have both endpoints in the building and floor
function hidePathsForBuildingAndFloor(building, floor) {
	LOG.trace("Hiding paths for everything NOT " + building + " floor " + floor);
	pathMap.forEach(function(pathString, path){
		if(building != GlobalStrings.ALL_BUILDINGS) {
			if(path.marker1Data.type != GlobalStrings.PATHWAY && path.marker2Data.type != GlobalStrings.PATHWAY) {
				if((path.marker1Data.building != building || path.marker1Data.floor != floor) || (path.marker2Data.building != building || path.marker2Data.floor != floor)) {
					path.element.hide();
				}
			}
		}
	});
}

// Must run loadShapesForBuildingAndFloor(building, floor) before this
function loadMarkersForBuildingAndFloor(building, floor) {
	if(!loadedBuildingsAndFloors.containsKey(building) || !loadedBuildingsAndFloors.get(building).contains(floor) || building == GlobalStrings.ALL_BUILDINGS) {
		LOG.debug("Loading markers for building " + building + " floor " + floor);
		allMarkers.forEach(function(markerMap){
			markerMap.forEach(function(markerId, marker) {
				if(!getMarkerMapForType(marker.data(GlobalStrings.TYPE)).containsKey(marker.data(GlobalStrings.ID))) {
					if (marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM || marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS || marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
//						buildingToFloorMap.get(marker.data(GlobalStrings.BUILDING)).get(marker.data(GlobalStrings.FLOOR)).get("shapes").forEach(function(element) {
//							var show = element.isVisible();
//							element.show();
//
//							if (!idIsValid(marker.data(GlobalStrings.ID)) && element.data(GlobalStrings.ID) != "outline" && element.isPointInside(marker.attr("cx"), marker.attr("cy")) 
//								&& idIsValid(element.data(GlobalStrings.ID))) {
//									LOG.debug("Resetting marker id from " + marker.data(GlobalStrings.ID) + " to " + element.data(GlobalStrings.ID));
//								marker.data(GlobalStrings.ID, element.data(GlobalStrings.ID));
//								return false;
//							}
//
//							if (!show) {
//								element.hide();
//							}
//						});
					}

					setMarkerDragEventHandlers(marker);
				
					if(!getMarkerMapForType(marker.data(GlobalStrings.TYPE)).containsKey(marker.data(GlobalStrings.ID))){
						getMarkerMapForType(marker.data(GlobalStrings.TYPE)).set(marker.data(GlobalStrings.ID), marker);
					}
				
					if(!typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).containsKey(marker)){
						typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).set(marker, newConnectionSet());
					}
					
					if (marker.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
						doorIdCount++;
					} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY) {
						hallwayIdCount++;
					} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
						pathwayIdCount++;
					} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
						stairIdCount++;
					} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
						elevatorIdCount++;
					} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS) {
						bathroomMensIdCount++;
					} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
						bathroomWomensIdCount++;
					}
				}
			});
		});
	
		pathMap.forEach(function(pathString, path) {
			var marker1 = null;
			var marker2 = null;
			if(!getMarkerMapForType(path.marker1Data.type).containsKey(path.marker1Data.id)){
				if(path.marker1Data.type != GlobalStrings.PATHWAY) {
					if((building == GlobalStrings.ALL_BUILDINGS || path.marker1Data.building == building) && path.marker1Data.floor == floor) {
						marker1 = getMarkerFromId(path.marker1Data.id);
						if (marker1 == null) {
							marker1 = addMarker(path.marker1Data.cx, path.marker1Data.cy, markerTypeToColorMap.get(path.marker1Data.type));
							marker1.data(GlobalStrings.ID, path.marker1Data.id);
							if (path.marker1Data.type == GlobalStrings.ROOM || path.marker1Data.type == GlobalStrings.BATHROOM_MENS || path.marker1Data.type == GlobalStrings.BATHROOM_WOMENS) {
//								buildingToFloorMap.get(path.marker1Data.building).get(path.marker1Data.floor).get("shapes").forEach(function(element) {
//									var show = element.isVisible();
//									element.show();
//
//									if (!idIsValid(path.marker1Data.id) && element.data(GlobalStrings.ID) != "outline" && element.isPointInside(marker1.attr("cx"), marker1.attr("cy")) 
//										&& idIsValid(element.data(GlobalStrings.ID))) {
//										LOG.debug("Resetting marker id from " + path.marker1Data.id + " to " + element.data(GlobalStrings.ID));
//										marker1.data(GlobalStrings.ID, element.data(GlobalStrings.ID));
//										path.marker1Data.id = marker1.data(GlobalStrings.ID);
//										return false;
//									}
//
//									if (!show) {
//										element.hide();
//									}
//								});
							}
							marker1.data(GlobalStrings.TYPE, path.marker1Data.type);
							marker1.data(GlobalStrings.BUILDING, path.marker1Data.building);
							marker1.data(GlobalStrings.FLOOR, path.marker1Data.floor);
					
							if(!getMarkerMapForType(marker1.data(GlobalStrings.TYPE)).containsKey(marker1.data(GlobalStrings.ID))) {
								getMarkerMapForType(marker1.data(GlobalStrings.TYPE)).set(marker1.data(GlobalStrings.ID), marker1);
							}
							
							if(!typeToConnectionMap.containsKey(marker1.data(GlobalStrings.TYPE))){
								typeToConnectionMap.get(marker1.data(GlobalStrings.TYPE)).set(marker1, newConnectionSet());
							}

							if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
								doorIdCount++;
							} else if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY) {
								hallwayIdCount++;
							} else if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
								pathwayIdCount++;
							} else if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
								stairIdCount++;
							} else if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
								elevatorIdCount++;
							} else if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS) {
								bathroomMensIdCount++;
							} else if (marker1.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
								bathroomWomensIdCount++;
							}
						}
					}
				}
			} else {
				marker1 = getMarkerMapForType(path.marker1Data.type).get(path.marker1Data.id);
			}
		
			if(!getMarkerMapForType(path.marker2Data.type).containsKey(path.marker2Data.id)){
				if(path.marker2Data.type != GlobalStrings.PATHWAY) {
					if((building == GlobalStrings.ALL_BUILDINGS || path.marker2Data.building == building) && path.marker2Data.floor == floor) {
						marker2 = getMarkerFromId(path.marker2Data.id);
						if (marker2 == null) {
							marker2 = addMarker(path.marker2Data.cx, path.marker2Data.cy, markerTypeToColorMap.get(path.marker2Data.type));
							marker2.data(GlobalStrings.ID, path.marker2Data.id);
							if (path.marker2Data.type == GlobalStrings.ROOM || path.marker2Data.type == GlobalStrings.BATHROOM_MENS || path.marker2Data.type == GlobalStrings.BATHROOM_WOMENS) {
//								buildingToFloorMap.get(path.marker2Data.building).get(path.marker2Data.floor).get("shapes").forEach(function(element) {
//									var show = element.isVisible();
//									element.show();
//
//									if (!idIsValid(path.marker2Data.id) && element.data(GlobalStrings.ID) != "outline" && element.isPointInside(marker2.attr("cx"), marker2.attr("cy")) 
//										&& idIsValid(element.data(GlobalStrings.ID))) {
//										LOG.debug("Resetting marker id from " + path.marker2Data.id + " to " + element.data(GlobalStrings.ID));
//										marker2.data(GlobalStrings.ID, element.data(GlobalStrings.ID));
//										path.marker2Data.id = marker2.data(GlobalStrings.ID);
//										return false;
//									}
//
//									if (!show) {
//										element.hide();
//									} 
//								});
							}
							marker2.data(GlobalStrings.TYPE, path.marker2Data.type);
							if (path.marker2Data.type != GlobalStrings.PATHWAY) {
								marker2.data(GlobalStrings.BUILDING, path.marker2Data.building);
								marker2.data(GlobalStrings.FLOOR, path.marker2Data.floor);
							}
							
							if(!getMarkerMapForType(marker2.data(GlobalStrings.TYPE)).containsKey(marker2.data(GlobalStrings.ID))) {
								getMarkerMapForType(marker2.data(GlobalStrings.TYPE)).set(marker2.data(GlobalStrings.ID), marker2);
							}
							
							if(!typeToConnectionMap.containsKey(marker2.data(GlobalStrings.TYPE))){
								typeToConnectionMap.get(marker2.data(GlobalStrings.TYPE)).set(marker2, newConnectionSet());
							}

							if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
								doorIdCount++;
							} else if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY) {
								hallwayIdCount++;
							} else if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
								pathwayIdCount++;
							} else if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
								stairIdCount++;
							} else if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
								elevatorIdCount++;
							} else if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS) {
								bathroomMensIdCount++;
							} else if (marker2.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
								bathroomWomensIdCount++;
							}
						}
					}
				}
			} else {
				marker2 = getMarkerMapForType(path.marker2Data.type).get(path.marker2Data.id);
			}

			if(marker1 != null && marker2 != null) {
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

				marker1.toFront();
				marker2.toFront();
			}
		});
	}
}

function setMarkersInvisible(bool) {
	markersInvisible = bool;
	
	if(bool) {
		allMarkers.forEach(function(markerMap) {
			markerMap.forEach(function(markerId, marker) {
				marker.hide();
			});
		});
		pathMap.forEach(function(pathString, path){
			path.element.hide();
		});
	}
}

function isDictionaryLoaded() {
	return dictionaryLoaded;
}

function getMarkerMapForType(type) {
	return typeToMarkerMap.get(type);
}

function getMarkerFromId(id) {
	var returnMarker = null;

	allMarkers.forEach(function(markerMap) {
		returnMarker = markerMap.get(id);
		if (returnMarker != null) {
			return false;
		}
	});

	return returnMarker;
}

function addMarker(x, y, color) {
	var marker = paper.circle(x, y, markerSize/paperResizeRatio).attr({
		fill: color
	});

	setMarkerDragEventHandlers(marker);

	return marker;
}

function newConnectionMap() {
	return new buckets.Dictionary(function markerToString(marker) {
		return marker.data(GlobalStrings.ID);
	});
}

function getConnectionMapForType(type) {
	return typeToConnectionMap.get(type);
}

function newConnectionSet() {
	return new buckets.Set(function connectionToString(connection) {
		return connection.marker.data(GlobalStrings.ID);
	});
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

var paperRect = null;
function resizeToFitShapesForBuildingAndFloor(building, floor) {
	var lowerLeftX = 999999;
	var lowerLeftY = -999999;		
	if(building == GlobalStrings.ALL_BUILDINGS) {
		buildingToFloorMap.forEach(function(building, floorToShapeListAndNameMap) {
			floorToShapeListAndNameMap.forEach(function(floor, shapeListAndNameMap) {
				shapeListAndNameMap.get("shapes").forEach(function(shape) {
					var bbox = shape.getBBox();
					if (bbox.x < lowerLeftX) {
						lowerLeftX = bbox.x;
					}
					if (bbox.y2 > lowerLeftY) {
						lowerLeftY = bbox.y2;
					}
				});
			});
		});
	} else {
		buildingToFloorMap.get(building).get(floor).get("shapes").forEach(function(shape){
			var bbox = shape.getBBox();
			if (bbox.x < lowerLeftX) {
				lowerLeftX = bbox.x;
			}
			if (bbox.y2 > lowerLeftY) {
				lowerLeftY = bbox.y2;
			}
		});
	}
	
	if(paperRect != null) {
		paperRect.remove();
	}
	paperRect = paper.rect(paperShiftX, paperShiftY, paperWidth, paperHeight).attr("stroke-width",5);
	
	if(paperRect.isPointInside(lowerLeftX, lowerLeftY)) {
		// Already zoomed out, keep zooming in until it doesn't fit anymore
		while(paperRect.isPointInside(lowerLeftX, lowerLeftY)) {
			zoomIn();
			if(paperRect != null) {
				paperRect.remove();
			}
			paperRect = paper.rect(paperShiftX, paperShiftY, paperWidth, paperHeight).attr("stroke-width",5);
		}
		// We have zoomed in too much, zoom out once to get the right amount
		zoomOut();
	} else {
		// Already zoomed in, keep zooming out until it fits
		while(!paperRect.isPointInside(lowerLeftX, lowerLeftY)) {
			zoomOut();
			if(paperRect != null) {
				paperRect.remove();
			}
			paperRect = paper.rect(paperShiftX, paperShiftY, paperWidth, paperHeight).attr("stroke-width",5);
		}
	}
	
	if(paperRect != null) {
		paperRect.remove();
	}
}

function zoomIn() {
	//scroll down / zoom in 10%
	resizeRatio = .90;
	paperResizeRatio = (paperResizeRatio * resizeRatio);
	
	paperWidth = paperWidth * resizeRatio;
	paperHeight = paperHeight * resizeRatio;

	paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);
}

function zoomOut() {
	//scroll up / zoom out 10%
	resizeRatio = 1.1;
	paperResizeRatio = (paperResizeRatio * resizeRatio);
	
	paperWidth = paperWidth * resizeRatio;
	paperHeight = paperHeight * resizeRatio;

	paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);
}

function executeOnAllMarkers(func) {
	allMarkers.forEach(function(markerMap) {
		markerMap.forEach(function(markerId, marker) {
			func(marker);
		});
	});
}

function getMarkerColorFromType(type) {
	var color = markerTypeToColorMap.get(type);

	if (color == null) {
		color = "black";
	}
	return color;
}

function getBuildingFromId(id) {
	if(id.search(GlobalStrings.PATHWAY_ID) == -1) {
		var parts = id.split("_");
		if(parts[0] == GlobalStrings.BUILDING_ID) {
			return parts[1];
		}
	} else {
		return "";
	}
}

function getFloorFromId(id) {
	if(id.search(GlobalStrings.PATHWAY_ID) == -1) {
		var parts = id.split("_");
		if(parts[0] == GlobalStrings.BUILDING_ID) {
			if(parts[2] == GlobalStrings.FLOOR_ID) {
				return parts[3];
			}
		}
	} else {
			return "";
	}
}

function getRoomFromRoomId(roomId) {
	return roomId.substr(roomId.lastIndexOf(GlobalStrings.ROOM_ID + "_") + 3);
}

function getClosestMarkerToPoint(x, y) {
	var closestMarker;
	var closestDistance;
	allMarkers.forEach(function(markerMap){
		markerMap.forEach(function(markerId, marker){
			var distance = dist(x, y, marker.attr("cx"), marker.attr("cy"));
			if(closestMarker == null || distance < closestDistance) {
				closestMarker = marker;
				closestDistance = distance;
			}
		});
	});
	return closestMarker;
}

function formatRoomId(building, floor, room) {
	return GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.ROOM_ID + "_" + room;
}

function formatDoorId(building, floor) {
	var id = null;
	while (id == null) {
		doorIdCount++;
		var tmpId = GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.DOOR_ID + "_" + doorIdCount;
		if (!doorMap.containsKey(tmpId)) {
			id = tmpId;
		}
	}
	return id;
}

function formatHallwayId(building, floor) {
	var id = null;
	while (id == null) {
		hallwayIdCount++;
		var tmpId = GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.HALLWAY_ID + "_" + hallwayIdCount;
		if (!hallwayMap.containsKey(tmpId)) {
			id = tmpId;
		}
	}
	return id;
}

function formatPathwayId() {
	var id = null;
	while (id == null) {
		pathwayIdCount++;
		var tmpId = GlobalStrings.PATHWAY_ID + "_" + pathwayIdCount;
		if (!pathwayMap.containsKey(tmpId)) {
			id = tmpId;
		}
	}
	return id;
}

function formatStairId(building, floor) {
	var id = null;
	while (id == null) {
		stairIdCount++;
		var tmpId = GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.STAIR_ID + "_" + stairIdCount;
		if (!stairMap.containsKey(tmpId)) {
			id = tmpId;
		}
	}
	return id;
}

function formatElevatorId(building, floor) {
	var id = null;
	while (id == null) {
		elevatorIdCount++;
		var tmpId = GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.ELEVATOR_ID + "_" + elevatorIdCount;
		if (!elevatorMap.containsKey(tmpId)) {
			id = tmpId;
		}
	}
	return id;
}

function formatBathroomMensId(building, floor) {
	var id = null;
	while (id == null) {
		bathroomMensIdCount++;
		var tmpId = GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.BATHROOM_MENS_ID + "_" + bathroomMensIdCount;
		if (!bathroomMensMap.containsKey(tmpId)) {
			id = tmpId;
		}
	}
	return id;
}

function formatBathroomWomensId(building, floor) {
	var id = null;
	while (id == null) {
		bathroomWomensIdCount++;
		var tmpId = GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.BATHROOM_WOMENS_ID + "_" + bathroomWomensIdCount;
		if (!bathroomWomensMap.containsKey(tmpId)) {
			id = tmpId;
		}
	}
	return id;
}

function formatParkingLotId(parkingLot) {
	return GlobalStrings.PARKING_LOT_ID + "_" + parkingLot;
}

function formatDormId(dorm) {
	return GlobalStrings.DORM_ID + "_" + dorm;
}

function formatMiscId(misc) {
	return GlobalStrings.MISC_ID + "_" + misc;
}