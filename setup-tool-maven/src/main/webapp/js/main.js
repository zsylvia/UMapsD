var changeBuildingFloorShowing = false;

var graph;

var directionsFromType;
var directionsFromBuilding;
var directionsFromFloor;
var directionsFromRoom;
var directionsFromParkingLot;
var directionsFromDorm;
var directionsFromMisc;

var directionsToType;
var directionsToBuilding;
var directionsToFloor;
var directionsToRoom;
var directionsToParkingLot;
var directionsToDorm;
var directionsToMisc;

var LOG = new Logger(LoggingLevel.ALL);

$(document).ready(function() {
	while(!isDictionaryLoaded()) {
		// wait...
	}
	
	setMarkersInvisible(false);
	buildingToFloorIdsMap.forEach(function(building, floorList){
		floorList.forEach(function(floor){
			loadMarkersForBuildingAndFloor(building, floor);
		});
	});
	graph = new Graph();
	allMarkers.forEach(function(markerMap) {
		markerMap.forEach(function(markerId, marker) {
			var connectionsString = "";
			var firstConnection = true;

			var markerConnectionSet = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
			markerConnectionSet.forEach(function(connection) {
				if (firstConnection) {
					firstConnection = false;
				} else {
					connectionsString += ", ";
				}

				if (marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM || connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM) {
					connectionsString += connection.marker.data(GlobalStrings.ID) + ": " + (connection.distance * 5);
				} else {
					connectionsString += connection.marker.data(GlobalStrings.ID) + ": " + connection.distance;
				}
			});

			if (connectionsString != "") {
				graph.addVertex("" + marker.data(GlobalStrings.ID) + "", eval("({" + connectionsString + "})"));
			}
		});
	});
	currentBuilding = GlobalStrings.ALL_BUILDINGS;
	currentFloor = "1";
	showShapesForCurrentBuildingAndFloor();
});

$(document).bind("click", function(ev) {
//	var clickX = ev.offsetX*paperResizeRatio;
//	var clickY = ev.offsetY*paperResizeRatio;
//
//	if (ev.target.nodeName == "tspan") {
//		clickX = ev.pageX*paperResizeRatio;
//		clickY = (ev.pageY - ($(document).height() - $("#raphael").height()))*paperResizeRatio;
//	}
//
//	clickX += paperShiftX;
//	clickY += paperShiftY;
//	
//	var closestMarker = getClosestMarkerToPoint(clickX, clickY);
//	allMarkers.forEach(function(markerMap){
//		markerMap.forEach(function(markerId, marker){
//			marker.hide();
//		});
//	});
//	closestMarker.show();
});

function changeBuildingFloor() {
	var buildingFloorContent = "<form id='change_building_floor_form' onchange='changeBuildingFloorChanged()'>" +
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
		"</form>";
	
	var footerButtonsHTML = "<button type='button' class='btn btn-default btn-block' onclick='changeBuildingFloorSubmit()' data-dismiss='modal'>OK</button>";

	$("#dialog_modal .modal-title").toggleClass("text-danger", false);
	$("#dialog_modal .modal-title").text("Change Building/Floor");
	$("#dialog_modal .modal-body").html(buildingFloorContent);
	$("#dialog_modal .modal-footer").html(footerButtonsHTML);
	$('#dialog_modal').modal('toggle');
}

function changeBuildingFloorChanged() {
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

	setFloorSelectorForBuilding(currentBuilding, currentFloor);
}

function changeBuildingFloorSubmit() {
	showShapesForCurrentBuildingAndFloor();
	hideChangeBuildingFloorModal();
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

function hideChangeBuildingFloorModal() {
	if(changeBuildingFloorShowing) {
		$('#dialog_modal').modal('toggle');
		changeBuildingFloorShowing = !changeBuildingFloorShowing;
	}
}

function getDirections() {
	var markerOptionsHTML = "";
	
	typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
		markerOptionsHTML += "<option value='" + markerId + "'>" + markerId + "</option>";
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
	
	menuHTML = "<div id='directions_from'>" +
			"<label for='directions_from_type'>From</label>" +
			"<select id='directions_from_type' name='directions_from_type' onchange='directionsFromTypeChange()'>" +
			"<option value='select_type'>Select Type</option>" +
			"<option value='building'>Building</option>" +
			"<option value='parking_lot'>Parking Lot</option>" +
			"</select>" +
			"</div>" +
			"<div id='directions_to'>" +
			"<label for='directions_to_type'>To</label>" +
			"<select id='directions_to_type' name='directions_to_type' onchange='directionsToTypeChange()'>" +
			"<option value='select_type'>Select Type</option>" +
			"<option value='building'>Building</option>" +
			"<option value='parking_lot'>Parking Lot</option>" +
			"</select>" +
			"</div>";

	var footerButtonsHTML = "<button type='button' class='btn btn-default' onclick='findPathSelected()'>Get Directions</button>" +
		"<button type='button' class='btn btn-default' data-dismiss='modal'>Cancel</button>";

	$("#dialog_modal .modal-title").toggleClass("text-danger", false);
	$("#dialog_modal .modal-title").text("Test Pathfinding");
	$("#dialog_modal .modal-body").html(menuHTML);
	$("#dialog_modal .modal-footer").html(footerButtonsHTML);
	$('#dialog_modal').modal('toggle');
}

function directionsFromTypeChange() {
	var html = "<label for='directions_to_type'>From</label><select id='directions_from_type' name='directions_from_type' onchange='directionsFromTypeChange()'>";
	if($("#directions_from_type option:selected").val() == GlobalStrings.BUILDING) {
		directionsFromType = GlobalStrings.BUILDING;
		
		var buildingSelected = $("#directions_from_building option:selected").val();
		var floorSelected = $("#directions_from_floor option:selected").val();
		var roomSelected = $("#directions_from_room option:selected").val();
		
		html += "<option value='building' selected='true'>Building</option>" +
			"<option value='parking_lot'>Parking Lot</option>" +
			"</select>";
		html += "<select id='directions_from_building' name='directions_from_building' onchange='directionsFromTypeChange()'>";
		if(buildingSelected === undefined) {
			html += "<option value='select_building' selected='true'>Select Building</option>";
			buildingShortToLongNameMap.forEach(function(short, long){
				html += "<option value='"+short+"'>"+long+"</option>";
			});
			html += "</select>";
		} else {
			buildingShortToLongNameMap.forEach(function(short, long){
				html += "<option value='"+short+"'"+(buildingSelected==short ? " selected='true'" : "")+">"+long+"</option>";
			});
			html += "</select>";
			html += "<select id='directions_from_floor' name='directions_from_floor' onchange='directionsFromTypeChange()'>";
			
			if(directionsFromBuilding != null && buildingSelected != directionsFromBuilding) {
				directionsFromBuilding = buildingSelected;
				directionsFromFloor = null;
				directionsFromRoom = null;
				html += "<option value='select_floor' selected='true'>Select Floor</option>";
				buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
					html += "<option id='" + floor + "'>" + floor + "</option>";
				});
			} else {
				directionsFromBuilding = buildingSelected;
				if(floorSelected === undefined) {
					html += "<option value='select_floor' selected='true'>Select Floor</option>";
					buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
						html += "<option id='" + floor + "'>" + floor + "</option>";
					});
					html += "</select>";
				} else {
					buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
						html += "<option id='" + floor + "'"+(floorSelected == floor ? " selected='true'" : "")+">" + floor + "</option>";
					});
					html += "</select>";
					
					html += "<select id='directions_from_room' name='directions_from_room' onchange='directionsFromTypeChange()'>";
					
					if(directionsFromFloor != null && floorSelected != directionsFromFloor) {
						directionsFromFloor = floorSelected;
						directionsFromRoom = null;
						html += "<option value='select_room' selected='true'>Select Room</option>";
						typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
							if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
								html += "<option value='" + markerId + "'>" + getRoomFromRoomId(markerId) + "</option>";
							}
						});
						html += "</select>";
					} else {
						directionsFromFloor = floorSelected;
						
						if(roomSelected === undefined) {
							html += "<option value='select_room' selected='true'>Select Room</option>";
							typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
								if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
									html += "<option value='" + markerId + "'>" + getRoomFromRoomId(markerId) + "</option>";
								}
							});
							html += "</select>";
						} else {
							directionsFromRoom = getRoomFromRoomId(roomSelected);
							typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
								if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
									html += "<option value='" + markerId + "'"+(directionsFromRoom == getRoomFromRoomId(markerId) ? " selected='true'" : "")+">" + getRoomFromRoomId(markerId) + "</option>";
								}
							});
							html += "</select>";
						}
					}
				}
			}
		}
	} else if($("#directions_from_type option:selected").val() == GlobalStrings.PARKING_LOT) {
		html += "<option value='select_type'>Select Type</option>" +
		"<option value='building'>Building</option>" +
		"<option value='parking_lot' selected='true'>Parking Lot</option>" +
		"</select>";
		directionsFromType = GlobalStrings.PARKING_LOT;
		directionsFromBuilding = null;
		directionsFromFloor = null;
		directionsFromRoom = null;
	} else if($("#directions_from_type option:selected").val() == "select_type") {
		html += "<option value='select_type' selected='true'>Select Type</option>" +
		"<option value='building'>Building</option>" +
		"<option value='parking_lot'>Parking Lot</option>" +
		"</select>";
	}
	$("#directions_from").html(html);
}

function directionsToTypeChange() {
	var html = "<label for='directions_to_type'>To</label><select id='directions_to_type' name='directions_to_type' onchange='directionsToTypeChange()'>";
	if($("#directions_to_type option:selected").val() == GlobalStrings.BUILDING) {
		directionsToType = GlobalStrings.BUILDING;
		var buildingSelected = $("#directions_to_building option:selected").val();
		var floorSelected = $("#directions_to_floor option:selected").val();
		var roomSelected = $("#directions_to_room option:selected").val();
		
		html += "<option value='building' selected='true'>Building</option>" +
			"<option value='parking_lot'>Parking Lot</option>" +
			"</select>";
		html += "<select id='directions_to_building' name='directions_to_building' onchange='directionsToTypeChange()'>";
		if(buildingSelected === undefined) {
			html += "<option value='select_building' selected='true'>Select Building</option>";
			buildingShortToLongNameMap.forEach(function(short, long){
				html += "<option value='"+short+"'>"+long+"</option>";
			});
			html += "</select>";
		} else {
			buildingShortToLongNameMap.forEach(function(short, long){
				html += "<option value='"+short+"'"+(buildingSelected==short ? " selected='true'" : "")+">"+long+"</option>";
			});
			html += "</select>";
			html += "<select id='directions_to_floor' name='directions_to_floor' onchange='directionsToTypeChange()'>";
			
			if(directionsToBuilding != null && buildingSelected != directionsToBuilding) {
				directionsToBuilding = buildingSelected;
				directionsToFloor = null;
				directionsToRoom = null;
				html += "<option value='select_floor' selected='true'>Select Floor (optional)</option>";
				buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
					html += "<option id='" + floor + "'>" + floor + "</option>";
				});
			} else {
				directionsToBuilding = buildingSelected;
				if(floorSelected === undefined) {
					html += "<option value='select_floor' selected='true'>Select Floor (optional)</option>";
					buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
						html += "<option id='" + floor + "'>" + floor + "</option>";
					});
					html += "</select>";
				} else {
					buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
						html += "<option id='" + floor + "'"+(floorSelected == floor ? " selected='true'" : "")+">" + floor + "</option>";
					});
					html += "</select>";
					
					html += "<select id='directions_to_room' name='directions_to_room' onchange='directionsToTypeChange()'>";
					
					if(directionsToFloor != null && floorSelected != directionsToFloor) {
						directionsToFloor = floorSelected;
						directionsToRoom = null;
						
						html += "<option value='select_room' selected='true'>Select Room</option>";
						typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
							if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
								html += "<option value='" + markerId + "'>" + getRoomFromRoomId(markerId) + "</option>";
							}
						});
						html += "</select>";
					} else {
						directionsToFloor = floorSelected;
						
						if(roomSelected === undefined) {
							html += "<option value='select_room' selected='true'>Select Room</option>";
							typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
								if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
									html += "<option value='" + markerId + "'>" + getRoomFromRoomId(markerId) + "</option>";
								}
							});
							html += "</select>";
						} else {
							directionsToRoom = getRoomFromRoomId(roomSelected);
							typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
								if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
									html += "<option value='" + markerId + "'"+(directionsToRoom == getRoomFromRoomId(markerId) ? " selected='true'" : "")+">" + getRoomFromRoomId(markerId) + "</option>";
								}
							});
							html += "</select>";
						}
					}
				}
			}
		}
	} else if($("#directions_to_type option:selected").val() == GlobalStrings.PARKING_LOT) {
		html += "<option value='select_type'>Select Type</option>" +
		"<option value='building' selected='true'>Building</option>" +
		"<option value='parking_lot' selected='true'>Parking Lot</option>" +
		"</select>";
		directionsToType = GlobalStrings.PARKING_LOT;
		directionsToBuilding = null;
		directionsToFloor = null;
		directionsToRoom = null;
	} else if($("#directions_to_type option:selected").val() == "select_type") {
		html += "<option value='select_type' selected='true'>Select Type</option>" +
		"<option value='building'>Building</option>" +
		"<option value='parking_lot'>Parking Lot</option>" +
		"</select>";
	}
	$("#directions_to").html(html);
}

function findPathSelected() {
	if(directionsParamsValid()) {
		showingPath = true;
		var fromMarker;
		if(directionsFromType == GlobalStrings.BUILDING){
			fromMarker = getMarkerFromId(formatRoomId(directionsFromBuilding, directionsFromFloor, directionsFromRoom));
		} else if(directionsFromType == GlobalStrings.DORM) {
			fromMarker = getMarkerFromId(formatDormId(directionsFromDorm));
		} else if(directionsFromType == GlobalStrings.PARKING_LOT) {
			fromMarker = getMarkerFromId(formatParkingLotId(directionsFromParkingLot));
		} else if(directionsFromType == GlobalStrings.MISC) {
			fromMarker = getMarkerFromId(formatMiscId(directionsFromMisc));
		}
		
		if(fromMarker != null) {
			if (directionsToType == GlobalStrings.CLOSEST_BATHROOM_MENS || directionsToType == GlobalStrings.CLOSEST_BATHROOM_WOMENS) {
				var closestBathroom;
				if(directionsToType == GlobalStrings.CLOSEST_BATHROOM_MENS) {
					closestBathroom = getClosestBathroomMens(fromMarker);
				} else if(directionsToType == GlobalStrings.CLOSEST_BATHROOM_WOMENS){
					closestBathroom = getClosestBathroomWomens(fromMarker);
				}
				
				if (closestBathroom != null) {
					findPath(fromMarker.data(GlobalStrings.ID), closestBathroom.data(GlobalStrings.ID));
				} else {
					LOG.error("Cannot find closest bathroom. The result was null!");
				}
			} else if (directionsToType == GlobalStrings.BUILDING) {
				if(directionsToFloor == null) {
					// Find directions to the building
					var path = getPathToBuilding(graph, fromMarker.data(GlobalStrings.ID), directionsToBuilding);
					findPath(path[0], path[path.length - 1]);
				} else {
					// Find directions to the specific room
					findPath(fromMarker.data(GlobalStrings.ID), formatRoomId(directionsToBuilding, directionsToFloor, directionsToRoom));
				}
			} else if(directionsToType == GlobalStrings.DORM) {
				findPath(fromMarker.data(GlobalStrings.ID), formatDormId(directionsToDorm));
			} else if(directionsToType == GlobalStrings.PARKING_LOT) {
				findPath(fromMarker.data(GlobalStrings.ID), formatParkingLotId(directionsToParkingLot));
			} else if(directionsToType == GlobalStrings.MISC) {
				findPath(fromMarker.data(GlobalStrings.ID), formatMiscId(directionsToMisc));
			} else {
				LOG.error("Invalid directionsToType: " + directionsToType);
			}
		} else {
			LOG.error("Cannot find directions. The 'from' marker is null!");
		}
		
		$('#dialog_modal').modal('toggle');
	}
}

function findPath(marker1ID, marker2ID) {
	var start = new Date().getTime();
	var path = getShortestPath(graph, marker1ID, marker2ID);
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

function setMarkerDragEventHandlers(marker) {
	// noop
}

function directionsParamsValid() {
	var fromValid = false;
	var toValid = false;
	if(directionsFromParamsValid()) {
		fromValid = true;
	}
	if(directionsToParamsValid()) {
		toValid = true;
	}
	return fromValid && toValid;
}

function directionsFromParamsValid() {
	$("#directions_from_error").remove();
	var errorMsg;
	if(directionsFromType == null) {
		errorMsg = "You must select a type";
	} else if(directionsFromType == GlobalStrings.BUILDING) {
		if(directionsFromBuilding == null) {
			errorMsg = "You must select a building";
		} else if(directionsFromFloor == null) {
			errorMsg = "You must select a floor";
		} else if(directionsFromRoom == null) {
			errorMsg = "You must select a room";
		}
	} else if(directionsFromType == GlobalStrings.PARKING_LOT) {
		if(directionsFromParkingLot == null) {
			errorMsg = "You must select a parking lot";
		}
	} else {
		LOG.error("Invalid directionsFromType: " + directionsFromType);
	}
	
	if(errorMsg != null) {
		$("#directions_from").prepend("<div id='directions_from_error' class='text-danger'>"+errorMsg+"</div>");
		return false;
	}
	return true;
}

function directionsToParamsValid() {
	$("#directions_to_error").remove();
	var errorMsg;
	if(directionsToType == null) {
		errorMsg = "You must select a type";
	} else if(directionsToType == GlobalStrings.BUILDING) {
		if(directionsToBuilding == null) {
			errorMsg = "You must select a building";
		} else if(directionsToFloor != null && directionsToRoom == null) {
			// You don't need to choose a specific floor. We'll just get directions to the closest
			// door to the selected building. But if a floor is selected, you have to choose a room
			errorMsg = "You must select a room";
		}
	} else if(directionsToType == GlobalStrings.PARKING_LOT) {
		if(directionsToParkingLot == null) {
			errorMsg = "You must select a parking lot";
		}
	} else if(directionsToType == GlobalStrings.CLOSEST_BATHROOM_MENS) {
		// valid
	} else if(directionsToType == GlobalStrings.CLOSEST_BATHROOM_WOMENS) {
		// valid
	} else {
		LOG.error("Invalid directionsToType: " + directionsToType);
	}
	
	if(errorMsg != null) {
		$("#directions_to").prepend("<div id='directions_to_error' class='text-danger'>"+errorMsg+"</div>");
		return false;
	}
	return true;
}
