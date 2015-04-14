var changeBuildingFloorShowing = false;

var graph;

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
	
	menuHTML = "<div id='directions_to'>" +
			"<select id='directions_to_type' name='directions_to_type' onchange='directionsToTypeChange()'>" +
			"<option value='select_type'>Select Type</option>" +
			"<option value='building'>Building</option>" +
			"<option value='parking_lot'>Parking Lot</option>" +
			"</select>" +
			"</div>";

	var footerButtonsHTML = "<button type='button' class='btn btn-default' data-dismiss='modal' onclick='findPathSelected()'>Pathfind</button>" +
		"<button type='button' class='btn btn-default' data-dismiss='modal'>Cancel</button>";

	$("#dialog_modal .modal-title").toggleClass("text-danger", false);
	$("#dialog_modal .modal-title").text("Test Pathfinding");
	$("#dialog_modal .modal-body").html(menuHTML);
	$("#dialog_modal .modal-footer").html(footerButtonsHTML);
	$('#dialog_modal').modal('toggle');
}

function directionsToTypeChange() {
	var html = "<select id='directions_to_type' name='directions_to_type' onchange='directionsToTypeChange()'>";
	if($("#directions_to_type option:selected").val() == GlobalStrings.BUILDING) {
		html += "<option value='select_type'>Select Type</option>" +
			"<option value='building' selected='true'>Building</option>" +
			"<option value='parking_lot'>Parking Lot</option>" +
			"</select>";
		html += "<select id='directions_to_building' name='directions_to_building' onchange='directionsToTypeChange()'>";
		if($("#directions_to_building option:selected").val() === undefined) {
			html += "<option value='select_building' selected='true'>Select Building</option>";
			buildingShortToLongNameMap.forEach(function(short, long){
				html += "<option value='"+short+"'>"+long+"</option>";
			});
			html += "</select>";
		} else {
			buildingShortToLongNameMap.forEach(function(short, long){
				html += "<option value='"+short+"'"+($("#directions_to_building option:selected").val()==short ? "selected='true'" : "")+">"+long+"</option>";
			});
			html += "</select>";
			
		}
	} else if($("#directions_to_type option:selected").val() == GlobalStrings.PARKING_LOT) {
		html += "<option value='select_type'>Select Type</option>" +
		"<option value='building' selected='true'>Building</option>" +
		"<option value='parking_lot' selected='true'>Parking Lot</option>" +
		"</select>";
	} else if($("#directions_to_type option:selected").val() == "select_type") {
		html += "<option value='select_type' selected='true'>Select Type</option>" +
		"<option value='building'>Building</option>" +
		"<option value='parking_lot'>Parking Lot</option>" +
		"</select>";
	}
	$("#directions_to").html(html);
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
		var path = getPathToBuilding(allMarkers, pathMap, graph, $("#findPathFrom option:selected").text(), "dion");
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

function setMarkerDragEventHandlers(marker) {
	// noop
}