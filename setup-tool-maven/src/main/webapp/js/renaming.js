var nameChangeMap = new buckets.Dictionary();

// These counts are just used when naming, the number does not matter it only removes duplicates
var bathroomMensIdCount = 0;
var bathroomWomensIdCount = 0;

var graph;

var changeBuildingFloorShowing = false;

var sessionTime = new Date().getTime();

var currentHoveredShape = null;

var renameDialogOpen = false;

var removeNamesMode = false;

var LOG = new Logger(LoggingLevel.ALL);

$(document).ready(function() {
	$("#change_building_floor_popover").popover({
		placement: "bottom",
		html: true
	});
	importNameChangeMap();
	
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
		if(!mouseDown && !renameDialogOpen) {
			var mousePosX;
			var mousePosY;
			if(event.target.nodeName == "tspan") {
				mousePosX = event.pageX * paperResizeRatio + paperShiftX;
				mousePosY = (event.pageY - ($(document).height() - $("#raphael").height()))*paperResizeRatio + paperShiftY;
			} else {
				mousePosX = event.offsetX * paperResizeRatio + paperShiftX;
				mousePosY = event.offsetY * paperResizeRatio + paperShiftY;
			}
			var currentHoveredShapeColored = false;
			var previousHoveredShapeUnColored = false;
			var sameShape = false;
			if(buildingToFloorMap.get(currentBuilding) != null && buildingToFloorMap.get(currentBuilding).get(currentFloor) != null
					&& buildingToFloorMap.get(currentBuilding).get(currentFloor).get("shapes") != null) {
				buildingToFloorMap.get(currentBuilding).get(currentFloor).get("shapes").forEach(function(shape){
					if(shape.data(GlobalStrings.ID) != "outline" && shape.isPointInside(mousePosX, mousePosY)){
						if(currentHoveredShape == shape) {
							sameShape = true;
						} else {
							shape.attr({fill:"red"});
							currentHoveredShapeColored = true;
							currentHoveredShape = shape;
						}
					} else {
						if(shape.attr("fill") == "red") {
							shape.attr({fill:"white"});
							previousHoveredShapeUnColored = true;
							if(currentHoveredShape == shape) {
								// Reset the currentHoveredShape because it isn't this one
								currentHoveredShape = null;
							}
						}
					}
					if((currentHoveredShapeColored && previousHoveredShapeUnColored) || sameShape) {
						return false;
					}
				});
			}
		}
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

function importNameChangeMap() {
	var start = new Date().getTime();
	var map = importedNameChangeMap;
	for(var i = 0; i < map.buildings.length; i++) {
		var building = map.buildings[i];
		for(var j = 0; j < building.floors.length; j++) {
			var floor = building.floors[j];
			for(var k = 0; k < floor.changes.length; k++) {
				var change = floor.changes[k];
				saveRename(building.id, floor.id, change.oldId, change.changedId);
				var buildingChangeMap = nameChangeMap.get(building.id);
				if(buildingChangeMap == null) {
					buildingChangeMap = new buckets.Dictionary();
				}
				var floorChangeMap = buildingChangeMap.get(floor.id);
				if(floorChangeMap == null) {
					floorChangeMap = new buckets.Dictionary();
				}
				floorChangeMap.set(change.oldId, change.changedId);
				buildingChangeMap.set(floor.id, floorChangeMap);
				nameChangeMap.set(building.id, buildingChangeMap);
			}
		}
	}
	renameShapesForBuildingAndFloor(currentBuilding, currentFloor);
	LOG.trace("Took " + (new Date().getTime() - start) + " ms to import changed names");
}

function handleClick(ev, secondTry) {
	if(!renameDialogOpen) {
		var clickX = ev.offsetX*paperResizeRatio;
		var clickY = ev.offsetY*paperResizeRatio;

		if (ev.target.getAttribute("customNodeName") == "tspan") {
			clickX = ev.pageX*paperResizeRatio;
			clickY = (ev.pageY - ($(document).height() - $("#raphael").height()))*paperResizeRatio;
		}

		clickX += paperShiftX;
		clickY += paperShiftY;
		
		if(removeNamesMode) {
			if(buildingToFloorMap.get(currentBuilding) != null && buildingToFloorMap.get(currentBuilding).get(currentFloor) != null
					&& buildingToFloorMap.get(currentBuilding).get(currentFloor).get("shapes") != null) {
				buildingToFloorMap.get(currentBuilding).get(currentFloor).get("shapes").forEach(function(shape){
					if(shape.isVisible() && shape.data(GlobalStrings.ID) != "outline" & shape.isPointInside(clickX, clickY)) {
						saveRename(currentBuilding, currentFloor, shape.data(GlobalStrings.ID), "");
						renameShapesForBuildingAndFloor(currentBuilding, currentFloor);
						return false;
					}
				});
			}
		} else {
			// Ignore clicks on non-raphael objects
			if (ev.target.getAttribute("customNodeName") == "svg" || (currentHoveredShape != null && currentHoveredShape.attr("fill") == "red") || 
					ev.target.getAttribute("customNodeName") == "tspan" || secondTry) {
				var clickedElement = null;
				
				if(buildingToFloorMap.get(currentBuilding) != null && buildingToFloorMap.get(currentBuilding).get(currentFloor) != null
						&& buildingToFloorMap.get(currentBuilding).get(currentFloor).get("shapes") != null) {
					buildingToFloorMap.get(currentBuilding).get(currentFloor).get("shapes").forEach(function(shape){
						if(shape.isVisible() && shape.data(GlobalStrings.ID) != "outline" & shape.isPointInside(clickX, clickY)) {
							clickedElement = shape;
							renameDialog(shape);
							return false;
						}
					});
				}
			}
		}
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
	renameDialogOpen = true;
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
	$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal' onclick=\"rename('" + element.data(GlobalStrings.ID) + "')\">Save</button>" +
		"<button type='button' class='btn btn-default' data-dismiss='modal' onclick=\"renameDialogClosed()\">Cancel</button>");
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
	}

	$("#formatted_id").html(formattedId);
}

function renameDialogClosed() {
	renameDialogOpen = false;
}

function rename(oldId) {
	renameDialogOpen = false;
	var selectedBuilding = $("#building_selector").val();
	var selectedFloor = $("#floor_selector").val();
	var changedId = $("#formatted_id").text();
	saveRename(selectedBuilding, selectedFloor, oldId, changedId);
	renameShapesForBuildingAndFloor(selectedBuilding, selectedFloor);
}

function saveRename(building, floor, oldId, newId) {
	if(oldId != newId && oldId != "") {
		LOG.debug("Renaming building " + building + " floor " + floor + " " + oldId + " to " + newId);
		for (var i = 0; i < dictionary.buildings.length; i++) {
			var buildingId = dictionary.buildings[i].short_id;
			if (buildingId == building) {
				for (var j = 0; j < dictionary.buildings[i].floors.length; j++) {
					var floorId = dictionary.buildings[i].floors[j].id;
					if (floorId == floor) {
						for (var k = 0; k < dictionary.buildings[i].floors[j].shapes.length; k++) {
							var shapeId = dictionary.buildings[i].floors[j].shapes[k].id;
							if (shapeId == oldId) {
								dictionary.buildings[i].floors[j].shapes[k].id = newId;
								var buildingChangeMap = nameChangeMap.get(building);
								if(buildingChangeMap == null) {
									buildingChangeMap = new buckets.Dictionary();
								}
								var floorChangeMap = buildingChangeMap.get(floor);
								if(floorChangeMap == null) {
									floorChangeMap = new buckets.Dictionary();
								}
								
								floorChangeMap.forEach(function(origId, changedId){
									if(changedId == oldId) {
										// If original id was ID1 and already in the map as (ID1, ID2)
										// and the new id is ID3, this will make (ID2, ID3) and setting 
										// oldId = origId below will set (ID1, ID3) to make 
										// any version of the dictionary still have this rename
										// ONLY if oldId is not "not_important" or "" else all the "not_important"
										// and "" shapes will get renamed
										if(oldId != "not_important" && oldId != ""){
											LOG.debug("Setting name change mapping " + oldId + " -> " + newId);
											floorChangeMap.set(oldId, newId);
										}
										
										// Already changed this name. Don't want to lose what the original was.
										oldId = origId;
										return false;
									}
								});
								LOG.debug("Setting name change mapping " + oldId + " -> " + newId);
								floorChangeMap.set(oldId, newId);
								buildingChangeMap.set(floor, floorChangeMap);
								nameChangeMap.set(building, buildingChangeMap);
								break;
							}
						}
						break;
					}
				}
				break;
			}
		}
	} else if(oldId = "") {
		
	}
}

// Building and floor shapes must be loaded first
function renameShapesForBuildingAndFloor(building, floor) {
	var start = new Date().getTime();
	var shapeListAndNameMap = buildingToFloorMap.get(building).get(floor);
	var floorChangeMap = null;
	if(nameChangeMap.get(building) != null) {
		floorChangeMap = nameChangeMap.get(building).get(floor);
	}
	if(floorChangeMap != null) {
		shapeListAndNameMap.get("names").forEach(function(element) {
			var changedId = floorChangeMap.get(element.attr("text"));
			if(changedId != null) {
				if(changedId == "not_important") {
					element.remove();
				} else {
					element.attr("text", changedId);
				}
			}
		});
		shapeListAndNameMap.get("shapes").forEach(function(element) {
			var changedId = floorChangeMap.get(element.data(GlobalStrings.ID));
			if(changedId != null) {
				element.data(GlobalStrings.ID, changedId);
			}
		});
	}
	LOG.trace("Took " + (new Date().getTime() - start) + " ms to rename shapes for " + building + " floor " + floor);
}

function saveDictionaryFile() {
	var changeMap = {buildings:[]};
	var changeMapString = "{buildings:[";
	var firstName = true;
	var buildingCount = -1;
	nameChangeMap.forEach(function(building, buildingChangeMap){
		buildingCount++;
		changeMap.buildings[buildingCount] = {id:"",floors:[]};
		if(!firstName) {
			changeMapString += ",";
		} else {
			firstName = false;
		}
		changeMapString += "{id:\"" + building + "\",floors:[";
		var firstBuilding = true;
		var floorCount = -1;
		buildingChangeMap.forEach(function(floor, floorChangeMap){
			floorCount++;
			changeMap.buildings[buildingCount].floors[floorCount] = {id:"",changes:[]};
			if(!firstBuilding) {
				changeMapString += ",";
			} else {
				firstBuilding = false;
			}
			changeMapString += "{id:\"" + floor + "\",changes:[";
			var firstFloor = true;
			var changeCount = -1;
			floorChangeMap.forEach(function(oldId, changedId){
				changeCount++;
				changeMap.buildings[buildingCount].floors[floorCount].changes[changeCount] = {oldId:"",changedId:""};
				changeMap.buildings[buildingCount].floors[floorCount].changes[changeCount].oldId = oldId;
				changeMap.buildings[buildingCount].floors[floorCount].changes[changeCount].changedId = changedId;
				if(!firstFloor) {
					changeMapString += ",";
				} else {
					firstFloor = false;
				}
				changeMapString += "{oldId:\"" + oldId + "\",changedId:\"" + changedId + "\"}";
			});
			changeMapString += "]}";
		});
		changeMapString += "]}";
	});
	changeMapString += "]}";
	
	console.log(JSON.stringify(changeMap));

	var request = $.ajax({
	 	url: "dictionaryUpload",
	 	type: "POST",
	 	data: {
	 		dictionary: $.param(dictionary),
	 		nameChangeMap: $.param(changeMap),
	 		sessionTime: sessionTime
	 	},
	 	dataType: "html"
	 });
	
	 request.fail(function(jqXHR, textStatus) {
	 	alert("Request failed: " + textStatus);
	 });
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
	renameShapesForBuildingAndFloor(currentBuilding, currentFloor);
}

function setFloorSelectorForBuilding(building, selectedFloor) {
	var optionsHtml = "";
	var floorList = buildingToFloorIdsMap.get(building);
	floorList.forEach(function(floor) {
		optionsHtml += "<option id='" + floor + "' " + (selectedFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>"
	});
	$("#floor_selector").html(optionsHtml);
}

function disableAllButtons() {
	$("#change_building_floor_popover").attr("disabled", true);
	$("#remove_names_mode_button").attr("disabled", true);
	$("#save_dictionary_button").attr("disabled", true);
	$("#rdp_tool_button").attr("disabled", true);
}

function disableAllButtonsExcept(buttonId) {
	disableAllButtons();
	
	$("#"+buttonId).attr("disabled", false);
}

function enableAllButtons() {
	$("#change_building_floor_popover").attr("disabled", false);
	$("#remove_names_mode_button").attr("disabled", false);
	$("#save_dictionary_button").attr("disabled", false);
	$("#rdp_tool_button").attr("disabled", false);
}

function removeNames() {
	if(removeNamesMode) {
		$("#remove_names_mode_button").text("Remove Names Mode");
		enableAllButtons();
		removeNamesMode = false;
	} else {
		$("#remove_names_mode_button").text("Exit Remove Names Mode");
		disableAllButtonsExcept("remove_names_mode_button");
		removeNamesMode = true;
	}
}
