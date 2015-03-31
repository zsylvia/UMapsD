var nameChangeMap = new buckets.Dictionary();

// These counts are just used when naming, the number does not matter it only removes duplicates
var bathroomMensIdCount = 0;
var bathroomWomensIdCount = 0;

var graph;

var changeBuildingFloorShowing = false;

var LOG = new Logger(LoggingLevel.ALL);

$(document).ready(function() {
	$("#change_building_floor_popover").popover({
		placement: "bottom",
		html: true
	});
});

$(document).bind("click", function(ev) {
	ev.target.setAttribute("customNodeName", ev.target.nodeName);

	if (!draggingEverythingIgnoreClick) {
		handleClick(ev, false);
	}

	if (draggingEverythingIgnoreClick) {
		draggingEverythingIgnoreClick = false;
	}
});

function handleClick(ev, secondTry) {
	var clickX = ev.offsetX*paperResizeRatio;
	var clickY = ev.offsetY*paperResizeRatio;

	if (ev.target.getAttribute("customNodeName") == "tspan") {
		clickX = ev.pageX;
		clickY = ev.pageY - ($(document).height() - $("#raphael").height());
	}

	clickX += paperShiftX;
	clickY += paperShiftY;
	
	// Ignore clicks on non-raphael objects
	if (ev.target.getAttribute("customNodeName") == "svg" || ev.target.getAttribute("customNodeName") == "tspan" || secondTry) {
		var clickedElement = null;

		paper.forEach(function(element) {
			if (element.isPointInside(clickX, clickY)) {
				// TODO: Find better solution then explicitly writing outline
				if (element.type != "text" && element.data(GlobalStrings.ID) != "outline") {
					clickedElement = element;
					renameDialog(element);
					return false;
				}
			}
		});
	}
}

function getRoomFromRoomId(roomId) {
	return roomId.substr(roomId.lastIndexOf("rm_") + 3);
}

function formatRoomId(building, floor, room) {
	return GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.ROOM_ID + "_" + room;
}

function formatBathroomMensId(building, floor) {
	bathroomMensIdCount++;
	return GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.BATHROOM_MENS_ID + "_" + bathroomMensIdCount;
}

function formatBathroomWomensId(building, floor) {
	bathroomWomensIdCount++;
	return GlobalStrings.BUILDING_ID + "_" + building + "_" + GlobalStrings.FLOOR_ID + "_" + floor + "_" + GlobalStrings.BATHROOM_WOMENS_ID + "_" + bathroomWomensIdCount;
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

function setToolTipText(text) {
	$("#tool_tip").html(text);
}

function alertDialog(alertText) {
	$("#dialog_modal .modal-title").toggleClass("text-danger", true);
	$("#dialog_modal .modal-title").text("Alert");
	$("#dialog_modal .modal-body").html("<b>" + alertText + "</b>");
	$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal'>Ok</button>");
	$('#dialog_modal').modal('toggle');
}

function renameDialog(element) {
	var buildingFloorContent = "<form id='change_building_floor_form' onchange='renameDialogChanged()'>" +
		"<div class='form-group'><label for='formatted_id'>Formatted ID</label><div id='formatted_id'>" + element.data(GlobalStrings.ID) + "</div></div>" +
		"<div class='form-group'>" +
		"<label for='building_selector'>Building</label>" +
		"<select id='building_selector' name='building' class='form-control'>";

	buildingToFloorMap.forEach(function(building, floorToShapeListMap) {
		buildingFloorContent += "<option id='" + building + "' " + (currentBuilding == building ? "selected='true'" : "") + ">" + building + "</option>";
	});

	buildingFloorContent += "</select>" +
		"</div>" +
		"<div class='form-group'>" +
		"<label for='floor_selector'>Floor</label>" +
		"<select id='floor_selector' class='form-control'>";

	buildingToFloorMap.get(currentBuilding).forEach(function(floor, shapeList) {
		buildingFloorContent += "<option id='" + floor + "' " + (currentFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>";
	});

	var defaultRoomNumber = element.data(GlobalStrings.TYPE) == GlobalStrings.ROOM ? getRoomFromRoomId(element.data(GlobalStrings.ID)) : "";

	buildingFloorContent += "</select>" +
		"</div>" +
		"<div class='form-group'>" +
		"<label for='type_selector'>Type</label>" +
		"<select id='type_selector' class='form-control'>" +
		"<option id='" + GlobalStrings.ROOM + "' " + (element.data(GlobalStrings.TYPE) == GlobalStrings.ROOM ? "selected='true'" : "") + ">" + GlobalStrings.ROOM_DISPLAY + "</option>" +
		"<option id='" + GlobalStrings.BATHROOM_MENS + "' " + (element.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS ? "selected='true'" : "") + ">" + GlobalStrings.BATHROOM_MENS_DISPLAY + "</option>" +
		"<option id='" + GlobalStrings.BATHROOM_WOMENS + "' " + (element.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS ? "selected='true'" : "") + ">" + GlobalStrings.BATHROOM_WOMENS_DISPLAY + "</option>" +
		"<option id='not_important'>not_important</option>" +
		"</select>" +
		"<div id='room_number_container' class='form-group'>" +
		"<label for='room_number_input'>Room Number</label>" +
		"<input id='room_number_input' type='search' class='form-control' oninput='renameDialogChanged()' autocomplete='off' value='" + defaultRoomNumber + "'>" +
		"</div>" +
		"</form>";

	if (GlobalStrings.getNormalFromDisplay($("#type_selector").val()) != GlobalStrings.ROOM) {
		$("#room_number_container").hide();
	}

	$("#dialog_modal .modal-title").toggleClass("text-danger", false);
	$("#dialog_modal .modal-title").text("Renaming Area");
	$("#dialog_modal .modal-body").html(buildingFloorContent);
	$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal' onclick=\"saveRename('" + element.data(GlobalStrings.ID) + "')\">Save</button>" +
		"<button type='button' class='btn btn-default' data-dismiss='modal'>Cancel</button>");
	$('#dialog_modal').modal('toggle');
}

function renameDialogChanged() {
	var selectedBuilding = $("#building_selector").val();
	var selectedFloor = $("#floor_selector").val();
	var selectedType = GlobalStrings.getNormalFromDisplay($("#type_selector").val());

	if (GlobalStrings.getNormalFromDisplay($("#type_selector").val()) == GlobalStrings.ROOM) {
		if ($("#room_number_container").is(":hidden")) {
			$("#room_number_container").show();
		}
	} else {
		$("#room_number_input")[0].value = "";
		$("#room_number_container").hide();
	}

	var formattedId = "";

	if (selectedType == GlobalStrings.ROOM) {
		formattedId = formatRoomId(selectedBuilding, selectedFloor, $("#room_number_input").val());
	} else if (selectedType == GlobalStrings.BATHROOM_MENS) {
		formattedId = formatBathroomMensId(selectedBuilding, selectedFloor);
	} else if (selectedType == GlobalStrings.BATHROOM_WOMENS) {
		formattedId = formatBathroomWomensId(selectedBuilding, selectedFloor);
	} else if (selectedType == "not_important") {
		formattedId = "not_important";
	}

	$("#formatted_id").html(formattedId);
}

function saveRename(oldId) {
	var selectedBuilding = $("#building_selector").val();
	var selectedFloor = $("#floor_selector").val();
	var selectedType = GlobalStrings.getNormalFromDisplay($("#type_selector").val());
	var newId = $("#formatted_id").text();

	for (var i = 0; i < dictionary.buildings.length; i++) {
		var building = dictionary.buildings[i].short_id;
		if (building == selectedBuilding) {
			for (var j = 0; j < dictionary.buildings[i].floors.length; j++) {
				var floor = dictionary.buildings[i].floors[j].id;
				if (floor == selectedFloor) {
					for (var k = 0; k < dictionary.buildings[i].floors[j].shapes.length; k++) {
						var shapeId = dictionary.buildings[i].floors[j].shapes[k].id;
						if (shapeId == oldId) {
							dictionary.buildings[i].floors[j].shapes[k].id = newId;
							nameChangeMap.forEach(function(origId, changedId){
								if(changedId == oldId) {
									// Already changed this name. Don't want to lose what the original was.
									oldId = origId;
									return false;
								}
							});
							nameChangeMap.set(oldId, newId);
							break;
						}
					}
					break;
				}
			}
			break;
		}
	}

	var shapeListAndNameMap = buildingToFloorMap.get(selectedBuilding).get(selectedFloor);
	shapeListAndNameMap.get("names").forEach(function(element) {
		if (element.attr("text") == oldId) {
			if(newId == "not_important") {
				element.remove();
			} else {
				element.attr("text", newId);
			}
			return false;
		}
	});
	shapeListAndNameMap.get("shapes").forEach(function(element) {

		if (element.data(GlobalStrings.ID) == oldId) {
			element.data(GlobalStrings.ID, newId);
			element.data(GlobalStrings.TYPE, selectedType);
			return false;
		}
	});
	
	
	console.log(JSON.stringify(nameChangeMap));
}

function saveDictionaryFile() {
	LOG.info(JSON.stringify(dictionary));
}

function changeBuildingFloor() {
	var buildingFloorContent = "<form id='change_building_floor_form' onchange='changeBuildingFloorChanged()' style='width: 244px'>" +
		"<div class='form-group'>" +
		"<label for='building_selector'>Building</label>" +
		"<select id='building_selector' name='building' class='form-control'>";
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
}

function changeBuildingFloorChanged() {
	var selectedBuilding;
	if ($("#building_selector").val() == GlobalStrings.ALL_BUILDINGS) {
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
	setFloorSelectorForBuilding(currentBuilding, currentFloor);
}

function setFloorSelectorForBuilding(building, selectedFloor) {
	var optionsHtml = "";
	var floorList = buildingToFloorIdsMap.get(building);
	floorList.forEach(function(floor) {
		optionsHtml += "<option id='" + floor + "' " + (selectedFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>"
	});
	$("#floor_selector").html(optionsHtml);
}
