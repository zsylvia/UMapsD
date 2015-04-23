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
var PARKING_LOT_TOOL_TIP_TEXT = "<b>Currently Plotting Parking Lots</b><br>" +
	"Click a location where a parking lot is located to plot a marker for it.";
var MANUALLY_CONNECTING_MARKER_FROM = "Click on a marker to start a connection from. Or select \"Cancel Manual Connect\" to exit manual connecting mode";
var MANUALLY_CONNECTING_MARKER_TO = "Click on another marker to make a connection. Or select \"Cancel Manual Connect\" to exit manual connecting mode";
var REMOVE_MODE_TIP_TEXT = "You are in \"remove mode\". Click any marker or path to remove it.";

var currrentlyPlotting = -1;
var plottingRoom = 0;
var plottingDoor = 1;
var plottingHallway = 2;
var plottingPathway = 3;
var plottingStair = 4;
var plottingElevator = 5;
var plottingBathroomMens = 6;
var plottingBathroomWomens = 7;
var plottingParkingLot = 8;

var markerSize = 5;
var pathStrokeWidth = 4;

var manuallyConnectingMode = false;
var manuallyConnectingMarker = false;
var manuallyConnectingMarkerFrom;
var manuallyConnectingMarkerTo;

var removingMode = false;

var undoStack = new buckets.Stack();
var addToUndoStack = true;
var redoStack = new buckets.Stack();

var showingPath = false;

var testingForBadPaths = false;

var draggingMarkerIgnoreClick = false;

var graph;

var markerFormShowing = false;
var selectedMarkerType = GlobalStrings.ROOM;
var changeBuildingFloorShowing = false;

var sessionTime = now();

var movingAllMarkers = false;

var connectingFloors = false;

var disposableMarkerText = new buckets.Dictionary();

var LOG = new Logger(LoggingLevel.ALL);

function Path(element, marker1Data, marker2Data, distance) {
	this.element = element;
	this.marker1Data = marker1Data;
	this.marker2Data = marker2Data;
	this.distance = distance;

	this.toString = function() {
		return marker1Data.id + "<->" + marker2Data.id;
	}
}

function MarkerData(cx, cy, id, type, building, floor) {
	this.cx = cx;
	this.cy = cy;
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
							newMarker = plotRoom(this.markerData.cx, this.markerData.cy, this.markerData.building,
								this.markerData.floor, getRoomFromRoomId(this.markerData.id));
							break;
						case GlobalStrings.DOOR:
							newMarker = plotDoor(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.HALLWAY:
							newMarker = plotHallway(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.PATHWAY:
							newMarker = plotPathway(this.markerData.cx, this.markerData.cy);
							break;
						case GlobalStrings.STAIR:
							newMarker = plotStair(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.ELEVATOR:
							newMarker = plotElevator(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.BATHROOM_MENS:
							newMarker = plotBathroomMens(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.BATHROOM_WOMENS:
							newMarker = plotBathroomWomens(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
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
			LOG.error("Cannot undo action. The ActionType is null!");
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
							plotRoom(this.markerData.cx, this.markerData.cy, this.markerData.building,
								this.markerData.floor, getRoomFromRoomId(this.markerData.id));
							break;
						case GlobalStrings.DOOR:
							plotDoor(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.HALLWAY:
							plotHallway(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.PATHWAY:
							plotPathway(this.markerData.cx, this.markerData.cy);
							break;
						case GlobalStrings.STAIR:
							plotStair(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.ELEVATOR:
							plotElevator(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.BATHROOM_MENS:
							plotBathroomMens(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
							break;
						case GlobalStrings.BATHROOM_WOMENS:
							plotBathroomWomens(this.markerData.cx, this.markerData.cy, this.markerData.building, this.markerData.floor);
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
			LOG.error("Cannot redo action. The ActionType is null!");
		}
		addToUndoStack = true;
	}
}

$(document).ready(function() {
	setTimeout(function(){
		setMarkersInvisible(false);
		setFloorSelectorForBuilding(currentBuilding, currentFloor);
		
		//Initally show room tool tip
		roomSelected();

		$("#plot_markers_popover").popover({
			placement: "bottom",
			html: true
		});
		$("#change_building_floor_popover").popover({
			placement: "bottom",
			html: true
		});
	}, 50);
});

function setMarkerDragEventHandlers(marker) {
	marker.drag(function(dx, dy, x, y, event) {
		if (marker.isVisible()) {
			if(movingAllMarkers) {
				executeOnAllMarkers(function(m){
					markerDragEventMove(m, dx, dy, x, y, event);
				});
			} else {
				markerDragEventMove(marker, dx, dy, x, y, event);
			}
			draggingMarkerIgnoreClick = true;
		}
	}, function(x, y, event) {
		if (marker.isVisible()) {
			// Drag start
			mouseOnMarker = true;
			markerDragEventStart(marker, x, y, event);
		}
	}, function(event) {
		if (marker.isVisible()) {
			// Drag end
			mouseOnMarker = false;
			markerDragEventEnd(marker, event);
		}
	});
}

function markerDragEventStart(marker, x, y, event) {
	if(movingAllMarkers) {
		executeOnAllMarkers(function(m){
			m.data("drag_start_cx", m.attr("cx"));
			m.data("drag_start_cy", m.attr("cy"));
		});
	} else {
		marker.data("drag_start_cx", marker.attr("cx"));
		marker.data("drag_start_cy", marker.attr("cy"));
	}
}

function markerDragEventMove(marker, dx, dy, x, y, event) {
	marker.attr({
		cx: (marker.data("drag_start_cx") + dx),
		cy: (marker.data("drag_start_cy") + dy)
	});
	var markerText = disposableMarkerText.get(marker.data(GlobalStrings.ID));
	if(markerText != null) {
		markerText.attr({
			x: marker.attr("cx"),
			y: marker.attr("cy")
		});
	}

	var markerConnectionSet = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if (markerConnectionSet != null) {
		markerConnectionSet.forEach(function(connection) {
			var path = pathMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
			if (path != null) {
				path.marker1Data.cx = marker.attr("cx");
				path.marker1Data.cy = marker.attr("cy");
				path.marker2Data.cx = connection.marker.attr("cx");
				path.marker2Data.cy = connection.marker.attr("cy");
			} else {
				path = pathMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
				path.marker2Data.cx = marker.attr("cx");
				path.marker2Data.cy = marker.attr("cy");
				path.marker1Data.cx = connection.marker.attr("cx");
				path.marker1Data.cy = connection.marker.attr("cy");
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

	if (!showingPath && !draggingMarkerIgnoreClick && !draggingEverythingIgnoreClick) {
		handleClick(ev, false);
	}

	if (draggingMarkerIgnoreClick) {
		draggingMarkerIgnoreClick = false;
	}

	if (draggingEverythingIgnoreClick) {
		draggingEverythingIgnoreClick = false;
	}
});

function handleClick(ev, secondTry) {
	var clickX = ev.offsetX*paperResizeRatio;
	var clickY = ev.offsetY*paperResizeRatio;

	if (ev.target.getAttribute("customNodeName") == "tspan") {
		clickX = ev.pageX*paperResizeRatio;
		clickY = (ev.pageY - ($(document).height() - $("#raphael").height()))*paperResizeRatio;
	}

	clickX += paperShiftX;
	clickY += paperShiftY;

	// Ignore clicks on non-raphael objects
	if (ev.target.getAttribute("customNodeName") == "svg" || ev.target.getAttribute("customNodeName") == "tspan" || secondTry) {
		// Only clicking another marker is accepted when manuallyConnectingMarker is true
		if (!manuallyConnectingMarker && !removingMode) {

			var pathClicked = false;
			pathMap.forEach(function(pathString, path) {
				if (path.isVisible) {
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
						if (pathClicked) {
							break;
						}
					}
					if (pathClicked) {
						return false;
					}
				}
			});

			if (!pathClicked) {
				var clickedElement = null;

				if (currentlyPlotting == plottingRoom || currentlyPlotting == plottingBathroomMens || currentlyPlotting == plottingBathroomWomens
						|| currentlyPlotting == plottingParkingLot) {
					buildingToFloorMap.forEach(function(building, floorToShapeListAndNameMap) {
						floorToShapeListAndNameMap.forEach(function(floor, shapeListAndNameMap) {
							shapeListAndNameMap.get("shapes").forEach(function(shape) {
								if (shape.isPointInside(clickX, clickY)) {
									if (shape.type != "text" && shape.data(GlobalStrings.ID) != "outline") {
										clickedElement = shape;
										return false;
									}
								}
							});
						});
					});
				}
				
				var marker = plotMarker(clickX - paperShiftX, clickY - paperShiftY, clickedElement);
				if (marker != null) {
					marker.attr("cx", clickX);
					marker.attr("cy", clickY);
					marker.scale(paperResizeRatio, paperResizeRatio, clickX, clickY);
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
			if (marker != null) {
				return false;
			}
		});
		handleMarkerClick(marker);
	} else if (ev.target.getAttribute("customNodeName") == "path") {
		var pathObject;
		
		pathMap.forEach(function(pathString, path) {
			if (path.element.isPointInside(clickX, clickY)) {
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
				$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal' onclick='removeConnectionFromString(\"" + pathObject + "\")'>Delete connection</button>" +
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
			$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal' onclick='connectMarkerFrom(\"" + marker.data(GlobalStrings.ID) + "\")'>Connect to marker</button>" +
				"<button type='button' class='btn btn-default' data-dismiss='modal' onclick='removeMarkerWithId(\"" + marker.data(GlobalStrings.ID) + "\")'>Remove</button>" +
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

function removeMarkerWithId(id) {
	var marker = getMarkerFromId(id);
	removeMarker(marker);
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
	if (currentBuilding == GlobalStrings.ALL_BUILDINGS && currentlyPlotting != plottingPathway) {
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
				marker = plotBathroomMens(x, y, currentBuilding, currentFloor, element.data(GlobalStrings.ID));
				break;
			case plottingBathroomWomens:
				marker = plotBathroomWomens(x, y, currentBuilding, currentFloor, element.data(GlobalStrings.ID));
				break;
			case plottingParkingLot:
				if (element != null) {
					marker = plotParkingLot(x, y, element.data(GlobalStrings.ID));
				} else {
					alertDialog("Cannot plot marker for parking lot. The selected point is not inside an area");
				}
		}

		if (marker != null) {
			typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).set(marker, newConnectionSet());
		}

		return marker;
	}
	return null;
}

function plotRoom(x, y, building, floor, elementId) {
	var roomId;
	if (idIsValid(elementId)) {
		roomId = elementId;
	} else {
		roomId = formatRoomId(building, floor, elementId);
	}

	var marker = null;

	var addToUndoStackHolder = addToUndoStack;
	addToUndoStack = false;

	if (roomMap.containsKey(roomId)) {
		addToUndoStackHolder = addToUndoStack;
		addToUndoStack = false;
		addToUndoStack = addToUndoStackHolder;

		alertDialog("There is already a marker for this room");
	} else {
		LOG.info("Plotting new room " + roomId + " at (" + x + "," + y + ")");

		marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.ROOM));

		addToUndoStack = addToUndoStackHolder;

		marker.data(GlobalStrings.ID, roomId);
		marker.data(GlobalStrings.BUILDING, building);
		marker.data(GlobalStrings.FLOOR, floor);
		marker.data(GlobalStrings.TYPE, GlobalStrings.ROOM);

		typeToMarkerMap.get(GlobalStrings.ROOM).set(marker.data(GlobalStrings.ID), marker);
	}

	// Need to explicitly add to undo stack here because we said not to above
	if (addToUndoStack) {
		undoStack.push(new Command().addMarker(marker));
	}

	return marker;
}

function plotDoor(x, y, building, floor) {
	var id = formatDoorId(building, floor);
	LOG.info("Plotting new door " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.DOOR));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.DOOR);
	typeToMarkerMap.get(GlobalStrings.DOOR).set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotHallway(x, y, building, floor) {
	var id = formatHallwayId(building, floor);
	LOG.info("Plotting new hallway " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.HALLWAY));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.HALLWAY);
	typeToMarkerMap.get(GlobalStrings.HALLWAY).set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotPathway(x, y) {
	var id = formatPathwayId();
	LOG.info("Plotting new pathway " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.PATHWAY));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.TYPE, GlobalStrings.PATHWAY);
	typeToMarkerMap.get(GlobalStrings.PATHWAY).set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotStair(x, y, building, floor) {
	var id = formatStairId(building, floor);
	LOG.info("Plotting new stair " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.STAIR));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.STAIR);
	typeToMarkerMap.get(GlobalStrings.STAIR).set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotElevator(x, y, building, floor) {
	var id = formatElevatorId(building, floor);
	LOG.info("Plotting new elevator " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.ELEVATOR));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.ELEVATOR);
	typeToMarkerMap.get(GlobalStrings.ELEVATOR).set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotBathroomMens(x, y, building, floor, elementId) {
	var id;
	if (idIsValid(elementId)) {
		id = elementId;
	} else {
		id = formatBathroomMensId(building, floor)
	}
	LOG.info("Plotting new men's bathroom " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.BATHROOM_MENS));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.BATHROOM_MENS);
	typeToMarkerMap.get(GlobalStrings.BATHROOM_MENS).set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotBathroomWomens(x, y, building, floor, elementId) {
	var id;
	if (idIsValid(elementId)) {
		id = elementId;
	} else {
		id = formatBathroomWomensId(building, floor)
	}
	LOG.info("Plotting new women's bathroom " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.BATHROOM_WOMENS));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.BUILDING, building);
	marker.data(GlobalStrings.FLOOR, floor);
	marker.data(GlobalStrings.TYPE, GlobalStrings.BATHROOM_WOMENS);
	typeToMarkerMap.get(GlobalStrings.BATHROOM_WOMENS).set(marker.data(GlobalStrings.ID), marker);

	return marker;
}

function plotParkingLot(x, y, elementId) {
	var id;
	if (idIsValid(elementId)) {
		id = elementId;
	} else {
		id = GlobalStrings.PARKING_LOT_ID + "_" + elementId;
	}
	LOG.info("Plotting new parking lot " + id + " at (" + x + "," + y + ")");
	marker = addMarker(x, y, markerTypeToColorMap.get(GlobalStrings.PARKING_LOT));
	marker.data(GlobalStrings.ID, id);
	marker.data(GlobalStrings.TYPE, GlobalStrings.PARKING_LOT);
	typeToMarkerMap.get(GlobalStrings.PARKING_LOT).set(marker.data(GlobalStrings.ID), marker);

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

	return marker;
}

function autoConnect() {
	LOG.info("Automatically connecting markers");
	var addedPathsSet = new buckets.Set();

	allMarkers.forEach(function(markerMap) {
		markerMap.forEach(function(markerId, marker) {
			if (marker.isVisible()) {
				if (marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM) {
					// For each room, connect to corresponding doors
					var room = marker;
					var closestDoor = getClosestDoor(room, true, true);
					if (closestDoor != null) {
						var connection = makeConnection(room, closestDoor);
						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
					doorMap.forEach(function(doorId, door) {
						if (room.data(GlobalStrings.ID) == door.data(GlobalStrings.ID)) {
							addedPathsSet.add(makeConnection(room, door));
						}
					});
				} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
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
							if (closestRoom != null && getDistance(door, closestRoom) <= 50 && roomConnectionMap.get(closestRoom).size() < 2) {
								var connection = makeConnection(door, closestRoom);
								if (connection != null) {
									addedPathsSet.add(connection);
								}
							}
						}
					}
				} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.HALLWAY) {
					// For each hallway, connect to closest hallway if hallway in the same building and floor (otherwise it would go through a door)
					var hallway = marker;
					var connectTo = null;
					var closestHallway = getClosestHallway(hallway);
					if (closestHallway != null) {
						// Check if closestHallway connected to a door closer to hallway than closestHallway is (should go through that door instead
						// only if hallway not already connected to a door)
						var closestHallwayDistance = getDistance(hallway, closestHallway);
						var connectedToADoor = false;
						hallwayConnectionMap.get(hallway).forEach(function(connection) {
							if (connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
								connectedToADoor = true;
								return false;
							}
						});
						var connectionSet = hallwayConnectionMap.get(closestHallway);

						var closestDoor = null;
						if (connectionSet != null && !connectedToADoor) {
							connectionSet.forEach(function(connection) {
								if (connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.DOOR) {
									if (getDistance(hallway, connection.marker) < closestHallwayDistance) {
										var doorConnectedToARoom = false;
										doorConnectionMap.get(connection.marker).forEach(function(connection2) {
											if (connection2.marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM ||
												connection2.marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS ||
												connection2.marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
												doorConnectedToARoom = true;
											}
										});
										if (!doorConnectedToARoom) {
											if (closestDoor == null) {
												closestDoor = connection.marker;
											} else {
												if (getDistance(hallway, connection.marker) < getDistance(hallway, closestDoor)) {
													closestDoor = connection.marker;
												}
											}
										}
									}
								}
							});
						}

						var connection;
						if (closestDoor != null) {
							connectTo = closestDoor;
							connection = makeConnection(hallway, connectTo);
						} else {
							connectTo = closestHallway;
							if (getDistance(hallway, connectTo) < 80) {
								connection = makeConnection(hallway, connectTo);
							}
						}

						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY) {
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
				} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
					// For each stair, connect to closest hallway
					var stair = marker;
					var closestHallway = getClosestHallway(stair);
					if (closestHallway != null) {
						var connection = makeConnection(stair, closestHallway);
						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
					// For each elevator, connect to closest hallway
					var elevator = marker;
					var closestHallway = getClosestHallway(elevator);
					if (closestHallway != null) {
						var connection = makeConnection(elevator, closestHallway);
						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS) {
					// For each bathroom, connect to closest door
					var bathroom = marker;
					var closestDoor = getClosestDoor(bathroom);
					if (closestDoor != null) {
						var connection = makeConnection(bathroom, closestDoor);
						if (connection != null) {
							addedPathsSet.add(connection);
						}
					}
				} else if (marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
					// For each bathroom, connect to closest door
					var bathroom = marker;
					var closestDoor = getClosestDoor(bathroom);
					if (closestDoor != null) {
						var connection = makeConnection(bathroom, closestDoor);
						if (connection != null) {
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
	LOG.debug("Making path between " + marker1.data(GlobalStrings.ID) + " and " + marker2.data(GlobalStrings.ID));

	var path = paper.path("M" + marker1.attr("cx") + " " + marker1.attr("cy") + "L" + marker2.attr("cx") + " " + marker2.attr("cy"));
	marker1.toFront();
	marker2.toFront();
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

function markerIdNull(marker) {
	return marker.data(GlobalStrings.ID) == null;
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
	} else if (type == GlobalStrings.PARKING_LOT) {
		parkingLotSelected();
	} else {
		LOG.warn("plotSelect called with invalid type " + type);
	}
}

function roomSelected() {
	LOG.debug("Room plotting selected");
	currentlyPlotting = plottingRoom;
	setToolTipTextForCurrentlyPlotting();
}

function doorSelected() {
	LOG.debug("Door plotting selected");
	currentlyPlotting = plottingDoor;
	setToolTipTextForCurrentlyPlotting();
}

function hallwaySelected() {
	LOG.debug("Hallway plotting selected");
	currentlyPlotting = plottingHallway;
	setToolTipTextForCurrentlyPlotting();
}

function pathwaySelected() {
	LOG.debug("Pathway plotting selected");
	currentlyPlotting = plottingPathway;
	setToolTipTextForCurrentlyPlotting();
}

function stairSelected() {
	LOG.debug("Stair plotting selected");
	currentlyPlotting = plottingStair;
	setToolTipTextForCurrentlyPlotting();
}

function elevatorSelected() {
	LOG.debug("Elevator plotting selected");
	currentlyPlotting = plottingElevator;
	setToolTipTextForCurrentlyPlotting();
}

function bathroomMensSelected() {
	LOG.debug("Men's bathroom plotting selected");
	currentlyPlotting = plottingBathroomMens;
	setToolTipTextForCurrentlyPlotting();
}

function bathroomWomensSelected() {
	LOG.debug("Women's bathroom plotting selected");
	currentlyPlotting = plottingBathroomWomens;
	setToolTipTextForCurrentlyPlotting();
}

function parkingLotSelected() {
	LOG.debug("Parking lot plotting selected");
	currentlyPlotting = plottingParkingLot;
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
		case plottingParkingLot:
			toolTipText = PARKING_LOT_TOOL_TIP_TEXT;
			break;
	}
	setToolTipText(toolTipText);
}

function setToolTipText(text) {
	$("#tool_tip").html(text);
}

function manualConnect() {
	if (manuallyConnectingMode) {
		LOG.debug("Cancel manual connect selected");
		cancelManualConnect(true);
		enableAllButtons();
		$("#cancel_manual_connect_button").toggle();
		$("#marker_opts_dropdown").toggle();
	} else {
		LOG.debug("Manual connect selected");
		var totalMarkers = getTotalNumberOfMarkers();
		if (totalMarkers > 1) {
			manuallyConnectingMode = true;
			manuallyConnectingMarker = true;
			setToolTipText(MANUALLY_CONNECTING_MARKER_FROM);
			$("#marker_opts_dropdown").toggle();
			$("#cancel_manual_connect_button").toggle();
			disableAllButtonsExcept("cancel_manual_connect_button");
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
	LOG.debug("Removing connection for path " + pathObject);
	if (typeof marker1 !== "undefined" && typeof marker2 !== "undefined") {
		if (typeof marker1ConnectionSet !== "undefined" && typeof marker2ConnectionSet !== "undefined") {
			if (marker1ConnectionSet != null) {
				marker1ConnectionSet.forEach(function(connection) {
					if (connection.marker == marker2) {
						marker1ConnectionSet.remove(connection);
						return false;
					}
				});
			}

			if (marker2ConnectionSet != null) {
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
		if (marker1ConnectionSet != null) {
			marker1ConnectionSet.forEach(function(connection) {
				if (connection.marker.data(GlobalStrings.ID) == pathObject.marker2Data.id) {
					marker1ConnectionSet.remove(connection);
					return false;
				}
			});
		}

		var marker2ConnectionSet;
		marker2ConnectionSet = getConnectionMapForType(pathObject.marker2Data.type).get(getMarkerFromId(pathObject.marker2Data.id));
		if (marker2ConnectionSet != null) {
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

	LOG.trace("Took " + (new Date().getTime() - start) + " ms to remove connection " + pathObject);
	return pathObject;
}

function removeMarker(marker) {
	LOG.debug("Removing marker " + marker.data(GlobalStrings.ID));
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
	LOG.debug("Removing all connections from marker " + marker.data(GlobalStrings.ID));
	var removedPaths = new buckets.Set();
	var markerConnectionSet = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if (markerConnectionSet != null) {
		markerConnectionSet.forEach(function(connection) {
			var path = pathMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
			if (path == null) {
				path = pathMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
			}
			removedPaths.add(removeConnection(path, marker, connection.marker, markerConnectionSet,
				typeToConnectionMap.get(connection.marker.data(GlobalStrings.TYPE)).get(connection.marker)));
		});
	}

	LOG.trace("Took " + (new Date().getTime() - start) + " ms to remove all connections from marker " + marker.data(GlobalStrings.ID));
	return removedPaths;
}

function removeMode() {
	if (removingMode) {
		LOG.debug("Cancel remove mode selected");
		removingMode = false;
		cancelManualConnect(true);
		$("#remove_button").text("Remove mode");
		enableAllButtons();
		$("#remove_button").toggleClass("active", false);
	} else {
		LOG.debug("Remove mode selected");
		removingMode = true;
		cancelManualConnect(true);
		setToolTipText(REMOVE_MODE_TIP_TEXT);
		$("#remove_button").text("Cancel remove mode");
		disableAllButtonsExcept("remove_button");
		$("#remove_button").toggleClass("active", true);
	}
}

function undo() {
	LOG.debug("Undo selected");
	var command = undoStack.pop();
	if (command != null) {
		command.undoAction();
	}
}

function redo() {
	LOG.debug("Redo selected");
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
	$("#move_all_markers_button").attr("disabled", true);
	$("#cancel_manual_connect_button").attr("disabled", true);
	$("#finished_moving_markers_button").attr("disabled", true);
	$("#marker_opts_dropdown").attr("disabled", true);
	$("#connect_floors_button").attr("disabled", true);
	$("#rename_tool_button").attr("disabled", true);
	$("#main_app_button").attr("disabled", true);
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
	$("#move_all_markers_button").attr("disabled", false);
	$("#cancel_manual_connect_button").attr("disabled", false);
	$("#finished_moving_markers_button").attr("disabled", false);
	$("#marker_opts_dropdown").attr("disabled", false);
	$("#connect_floors_button").attr("disabled", false);
	$("#rename_tool_button").attr("disabled", false);
	$("#main_app_button").attr("disabled", false);
}

function generateGraph() {
	var start = new Date().getTime();
	
	// Make sure all markers are loaded before creating the graph
	buildingToFloorIdsMap.forEach(function(building, floorList){
		floorList.forEach(function(floor){
//			loadShapesForBuildingAndFloor(building, floor);
			loadMarkersForBuildingAndFloor(building, floor);
		});
	});
	
	var handicap = false;

	var nonHandicapGraph = new Graph();
	var handicapGraph = new Graph();
	
	allMarkers.forEach(function(markerMap) {
		markerMap.forEach(function(markerId, marker) {
			var nonHandicapConnectionString = [];
			var handicapConnectionString = [];
			var firstConnection = true;

			var markerConnectionSet = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
			if(markerConnectionSet != null) {
				markerConnectionSet.forEach(function(connection) {
					if (firstConnection) {
						firstConnection = false;
					} else {
						nonHandicapConnectionString.push(", ");
						handicapConnectionString.push(", ");
					}

					if (marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM || connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM) {
						nonHandicapConnectionString.push(connection.marker.data(GlobalStrings.ID) + ": " + (connection.distance * 5));
						handicapConnectionString.push(connection.marker.data(GlobalStrings.ID) + ": " + (connection.distance * 5));
					} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.STAIRS) {
						nonHandicapConnectionString.push(connection.marker.data(GlobalStrings.ID) + ": " + connection.distance);
						handicapConnectionString.push(connection.marker.data(GlobalStrings.ID) + ": " + (connection.distance * 5000));
					} else if(marker.data(GlobalStrings.TYPE) == GlobalStrings.ELEVATOR) {
						nonHandicapConnectionString.push(connection.marker.data(GlobalStrings.ID) + ": " + (connection.distance * 5000));
						handicapConnectionString.push(connection.marker.data(GlobalStrings.ID) + ": " + connection.distance);
					} else {
						nonHandicapConnectionString.push(connection.marker.data(GlobalStrings.ID) + ": " + connection.distance);
						handicapConnectionString.push(connection.marker.data(GlobalStrings.ID) + ": " + connection.distance);
					}
				});

				if (nonHandicapConnectionString.length != 0) {
					nonHandicapGraph.addVertex("" + marker.data(GlobalStrings.ID) + "", eval("({" + nonHandicapConnectionString.join("") + "})"));
				}
				if(handicapConnectionString.length != 0) {
					handicapGraph.addVertex("" + marker.data(GlobalStrings.ID) + "", eval("({" + handicapConnectionString.join("") + "})"));
				}
			}
		});
	});

	graph = nonHandicapGraph;
	
	var converted = convertMarkersAndPathsToJson(allMarkers, pathMap);
	
	showShapesForCurrentBuildingAndFloor();
	showMarkersForCurrentBuildingAndFloor();

	LOG.trace("Took " + (new Date().getTime() - start) + " ms to generate graph");
	
	
//	var svg = paper.toSVG()
//	paper = null;
//	$("#raphael").html("");
//	
//	setTimeout(function() {
//		paper = new ScaleRaphael(raphaelDiv, $(raphaelDivJQuery).width(), $(raphaelDivJQuery).height());
//		paper.importSVG(svg);
//		console.log("DONE");
//	}, 100);

	 var request = $.ajax({
	 	url: "graphUpload",
	 	type: "POST",
	 	data: {
	 		graph: $.param(converted),
	 		sessionTime: sessionTime,
	 		nonHandicapGraphVertices: JSON.stringify(nonHandicapGraph.vertices),
	 		handicapGraphVertices: JSON.stringify(handicapGraph.vertices)
	 	},
	 	dataType: "html"
	 });
	
	 request.fail(function(jqXHR, textStatus) {
	 	alert("Request failed: " + textStatus);
	 	LOG.error("Save request failed. Printing graph below so all work is not lost. This can be copy and pasted into the graph.js file");
	 	// Using console.log() so even if logging is shut off, the graph will be printed on an error
	 	console.log(JSON.stringify(converted));
	 });
	
	return true;
}

function testFindPath() {
	if (showingPath) {
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
		
		showMarkersForCurrentBuildingAndFloor();

		showingPath = false;
		$("#testing_dropdown").toggle();
		$("#stop_pathfinding_button").toggle();
		enableAllButtons();
	} else {
		if(generateGraph()) {
			var markerOptionsHTML = "";
			allMarkers.forEach(function(markerMap) {
				markerMap.forEach(function(markerId, marker) {
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
}

function findPathSelected() {
	showingPath = true;
	if ($("#findPathTo option:selected").text() == "closest_bathroom_mens") {
		var closestBathroom = getClosestBathroomMens(getMarkerFromId($("#findPathFrom option:selected").text()));
		if (closestBathroom != null) {
			findPath($("#findPathFrom option:selected").text(), closestBathroom.data(GlobalStrings.ID));
		}
	} else if ($("#findPathTo option:selected").text() == "closest_bathroom_womens") {
		var closestBathroom = getClosestBathroomWomens(getMarkerFromId($("#findPathFrom option:selected").text()));
		if (closestBathroom != null) {
			findPath($("#findPathFrom option:selected").text(), closestBathroom.data(GlobalStrings.ID));
		}
	} else if ($("#findPathTo option:selected").text() == "dion_building") {
		var path = getPathToBuilding(graph, $("#findPathFrom option:selected").text(), "dion");
		findPath(path[0], path[path.length - 1]);
	} else {
		findPath($("#findPathFrom option:selected").text(), $("#findPathTo option:selected").text());
	}
	$("#testing_dropdown").toggle();
	$("#stop_pathfinding_button").toggle();
	disableAllButtonsExcept("stop_pathfinding_button");
}

function findPath(marker1ID, marker2ID) {
	var start = new Date().getTime();
	LOG.debug("Getting shortest path from " + marker1ID + " to " + marker2ID);
	var path = graph.shortestPath("" + marker1ID + "", "" + marker2ID + "").concat(["" + marker1ID + ""]).reverse();
	LOG.debug(path);

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
			var pathObject = pathMap.get(path[i] + "<->" + path[i + 1]);
			if (pathObject == null) {
				pathObject = pathMap.get(path[i + 1] + "<->" + path[i]);
			}
			var pathElement = pathObject.element;

			if (pathElement != null) {
				pathElement.show();
				pathElement.animate(animation);
			}
		}
	}

	LOG.trace("Took " + (new Date().getTime() - start) + " ms to find and show path from " + marker1ID + " to " + marker2ID);
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
			LOG.info("Testing for bad paths...");
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
						if (path.length == 1) {
							LOG.error("There is no path from " + markerFromID + " to " + markerToID);
							badPaths++;
						}

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
			LOG.trace("Testing for bad paths complete. Found " + badPaths + " bad paths. Took " + (new Date().getTime() - start) + " ms");

			$("#testing_dropdown").toggle();
			$("#exit_testing_button").toggle();
			disableAllButtonsExcept("exit_testing_button");
		} else {
			LOG.warn("Graph is null! Cannot test for bad paths");
		}
	}
}

function formatMarker() {
	var markerFormContent = "<form id='marker_form' onchange='markerFormChanged()' style='width: 244px'>" +
		"Use this form to select and format the type of marker to plot" +
		"<div class='form-group'>" +
		"<label for='selector'>Type</label>" +
		"<select id='selector' name='marker_type' class='form-control' form='marker_form'>";

	GlobalStrings.forEachMarkerStringPair(function(normal, display) {
		markerFormContent += "<option id='" + normal + "' " + (selectedMarkerType == normal ? "selected='true'" : "") + ">" + display + "</option>";
	});

	markerFormContent += "</select>" +
		"</div>" +
		"<div class='form-group'>" +
		"<label for='color_selector'>Color</label>" +
		"<select id='color_selector' class='form-control' style='background-color: " + getMarkerColorFromType(selectedMarkerType) + "'>";

	GlobalStrings.COLOR.forEachStringPair(function(normal, display) {
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
	if (markerType == selectedMarkerType) {
		// Marker's color changed
		markerColor = GlobalStrings.getNormalFromDisplay($("#color_selector").val());
		markerTypeToColorMap.set(selectedMarkerType, markerColor);

		var markerMap = getMarkerMapForType(markerType);
		markerMap.forEach(function(markerId, marker) {
			marker.attr("fill", markerColor);
		});
	}
	selectedMarkerType = markerType;
	plotSelect(selectedMarkerType);
	$("#color_selector").css("background-color", markerColor);
	$("#color_selector").val(GlobalStrings.getDisplayFromNormal(markerColor));

	switch (selectedMarkerType) {
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
		case GlobalStrings.PARKING_LOT:
			currentlyPlotting = plottingParkingLot;
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
		"<option id='" + GlobalStrings.ALL_BUILDINGS + "' " + (currentBuilding == GlobalStrings.ALL_BUILDINGS ? "selected='true'" : "") + ">" + GlobalStrings.ALL_BUILDINGS_DISPLAY + "</option>";
	buildingShortToLongNameMap.forEach(function(shortName, longName) {
		buildingFloorContent += "<option id='" + shortName + "' " + (currentBuilding == shortName ? "selected='true'" : "") + ">" + longName + "</option>";
	});

	buildingFloorContent += "</select>" +
		"</div>" +
		"<div class='form-group'>" +
		"<label for='floor_selector'>Floor</label>" +
		"<select id='floor_selector' class='form-control'>";

	if (currentBuilding == GlobalStrings.ALL_BUILDINGS) {
		var lowFloor;
		var topFloor;
		buildingToFloorIdsMap.forEach(function(building, floorList) {
			floorList.forEach(function(floor) {
				if (lowFloor == null || floor < lowFloor) {
					lowFloor = floor;
				}
				if (topFloor == null || floor > topFloor) {
					topFloor = floor;
				}
			});
		});

		if (lowFloor != null && topFloor != null) {
			for (var i = lowFloor; i <= topFloor; i++) {
				var floor = i;
				buildingFloorContent += "<option id='" + floor + "' " + (currentFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>";
			}
		}
	} else {
		buildingToFloorIdsMap.get(currentBuilding).forEach(function(floor) {
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
	if(buildingAndFloorChanged) {
		loadChangedBuildingAndFloor();
		buildingAndFloorChanged = false;
	}
}

function changeBuildingFloorChanged() {
	buildingAndFloorChanged = true;
}

function loadChangedBuildingAndFloor() {
	var selectedBuilding;
	if ($("#building_selector").val() == GlobalStrings.ALL_BUILDINGS_DISPLAY) {
		selectedBuilding = GlobalStrings.ALL_BUILDINGS;
	}
	buildingShortToLongNameMap.forEach(function(short, long) {
		if (long == $("#building_selector").val()) {
			selectedBuilding = short;
			return false;
		}
	});
	var selectedFloor = $("#floor_selector").val();
	if (selectedBuilding != currentBuilding) {
		if (selectedBuilding != GlobalStrings.ALL_BUILDINGS) {
			// Building changed. Try to stay on same floor but different building. Else try for B of building, then 1st floor etc.
			var newFloor;
			var floorList = buildingToFloorIdsMap.get(selectedBuilding);
			if (floorList.contains(selectedFloor)) {
				newFloor = selectedFloor;
			} else if (selectedFloor < floorList.first()) {
				newFloor = floorList.first();
			} else if (selectedFloor > floorList.last()) {
				newFloor = floorList.last();
			} else {
				newFloor = floorList.first();
			}

			currentFloor = newFloor;
		}

		currentBuilding = selectedBuilding;
	} else {
		// Floor changed
		currentFloor = selectedFloor;
	}

	showShapesForCurrentBuildingAndFloor();
	showMarkersForCurrentBuildingAndFloor();
	setFloorSelectorForBuilding(currentBuilding, currentFloor);
}

function setFloorSelectorForBuilding(building, selectedFloor) {
	var optionsHtml = "";
	if (building == GlobalStrings.ALL_BUILDINGS) {
		if (currentBuilding == GlobalStrings.ALL_BUILDINGS) {
			var lowFloor;
			var topFloor;
			buildingToFloorIdsMap.forEach(function(building, floorList) {
				floorList.forEach(function(floor) {
					if (lowFloor == null || floor < lowFloor) {
						lowFloor = floor;
					}
					if (topFloor == null || floor > topFloor) {
						topFloor = floor;
					}
				});
			});

			if (lowFloor != null && topFloor != null) {
				for (var i = lowFloor; i <= topFloor; i++) {
					var floor = i;
					optionsHtml += "<option id='" + floor + "' " + (currentFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>";
				}
			}
		}
	} else {
		var floorList = buildingToFloorIdsMap.get(building);
		floorList.forEach(function(floor) {
			optionsHtml += "<option id='" + floor + "' " + (selectedFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>"
		});
	}
	$("#floor_selector").html(optionsHtml);
}

function moveAllMarkers() {
	if(movingAllMarkers) {
		movingAllMarkers = false;
		enableAllButtons();
		$("#finished_moving_markers_button").toggle();
		$("#marker_opts_dropdown").toggle();
	} else {
		movingAllMarkers = true;
		buildingToFloorIdsMap.forEach(function(building, floorList){
			floorList.forEach(function(floor){
				loadShapesForBuildingAndFloor(building, floor);
				loadMarkersForBuildingAndFloor(building, floor);
			});
		});
		showShapesForCurrentBuildingAndFloor();
		showMarkersForCurrentBuildingAndFloor();
		$("#marker_opts_dropdown").toggle();
		$("#finished_moving_markers_button").toggle();
		disableAllButtonsExcept("finished_moving_markers_button");
	}
}

function connectFloors() {
	if(connectingFloors) {
		connectingFloors = false;
		cancelManualConnect(true);
		showMarkersForCurrentBuildingAndFloor();
		$("#connect_floors_button").html("Connect Floors");
		enableAllButtons();
		disposableMarkerText.forEach(function(markerId, textElement){
			var marker;
			marker = stairMap.get(markerId);
			if(marker == null) {
				marker = elevatorMap.get(markerId);
			}
			if(marker != null) {
				marker.attr("opacity", 1);
			}
			textElement.remove();
		});
	} else {
		LOG.debug("Connect floors selected");
		var totalMarkers = getTotalNumberOfMarkers();
		if (totalMarkers > 1) {
			manuallyConnectingMode = true;
			manuallyConnectingMarker = true;
			
			connectingFloors = true;
			$("#connect_floors_button").html("Exit Connecting Floors");
			disableAllButtonsExcept("connect_floors_button");
			buildingToFloorIdsMap.get(currentBuilding).forEach(function(floor){
				loadMarkersForBuildingAndFloor(currentBuilding, floor);
			});
			hideAllMarkers();
			hideAllPaths();
			stairMap.forEach(function(markerId, marker){
				if(currentBuilding == GlobalStrings.ALL_BUILDINGS || marker.data(GlobalStrings.BUILDING) == currentBuilding) {
					var connectionMap = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
					if(connectionMap != null) {
						var pMap = pathMap;
						connectionMap.forEach(function(connection){
							if(connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
								var path = pMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
								if(path == null) {
									path = pMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
								}
								if(path != null) {
									path.element.show().toFront();
								} else {
									LOG.error("Could not find path between " + marker.data(GlobalStrings.ID) + " and " + connection.marker.data(GlobalStrings.ID));
								}
							}
						});
					}
					
					disposableMarkerText.set(marker.data(GlobalStrings.ID), paper.text(marker.attr("cx"), marker.attr("cy"), marker.data(GlobalStrings.FLOOR)).attr({"font-size": marker.attr("r")}).toFront());
					marker.show().toFront().attr("opacity", .5);
				}
			});
			elevatorMap.forEach(function(markerId, marker){
				if(currentBuilding == GlobalStrings.ALL_BUILDINGS || marker.data(GlobalStrings.BUILDING) == currentBuilding) {
					var connectionMap = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
					if(connectionMap != null) {
						var pMap = pathMap;
						connectionMap.forEach(function(connection){
							if(connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.STAIR) {
								var path = pMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
								if(path == null) {
									path = pMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
								}
								if(path != null) {
									path.element.show().toFront();
								} else {
									LOG.error("Could not find path between " + marker.data(GlobalStrings.ID) + " and " + connection.marker.data(GlobalStrings.ID));
								}
							}
						});
					}
					
					disposableMarkerText.set(marker.data(GlobalStrings.ID), paper.text(marker.attr("cx"), marker.attr("cy"), marker.data(GlobalStrings.FLOOR)).attr({"font-size": marker.attr("r")}).toFront());
					marker.show().toFront().attr("opacity", .5);
				}
			});
		} else {
			alertDialog("There are not enough markers to make a connection");
		}
	}
}

function hideAllMarkers() {
	allMarkers.forEach(function(markerMap) {
		markerMap.forEach(function(markerId, marker){
			marker.hide();
		});
	});
}

function hideAllPaths() {
	pathMap.forEach(function(pathString, pathObject) {
		pathObject.element.hide();
	});
}

