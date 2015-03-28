/*
Naming conventions: (replace ???'s with fields)
Room: bldg_???_flr_???_rm_???
Hallway: bldg_???_flr_???_hw_???
Door: bldg_???_flr???_dr_???
Pathway: pathway_??? (numbered in order of creation)
Stair: bldg_???_flr_???_st_???
Elevator: bldg_???_flr_???_el_???
*/

/*	
buildingToFloorMap (key,value) = (building, floorToShapeListAndNameMap)
floorToShapeListAndNameMap (key, value) = (floor, shapeListAndNameMap)
shapeListAndNameMap (key, value) = ('shapes', shapeList) AND ('names', nameList)
shapeList values are paper.path elements
nameList values are paper.text elements
*/

var paper;
var totalCenterX;
var totalCenterY;
var roomNameObjects = [];

// These counts are just used when naming, the number does not matter it only removes duplicates
var bathroomMensIdCount = 0;
var bathroomWomensIdCount = 0;

//TODO: Implement building and floor selector
var buildingToFloorMap = new buckets.Dictionary();
var currentBuilding = "dion";
var currentFloor = "1";

var draggingEverythingIgnoreClick = false;

var paperResizeRatio = 1;
var paperX = 0;
var paperY = 0;
var paperWidth;
var paperHeight;
var allElementsSet;

var graph;

var paperShiftX = 0;
var paperShiftY = 0;

var changeBuildingFloorShowing = false;

var statsOn = true;
var debugOn = true;
var infoOn = true;
var warnOn = true;
var errorOn = true;

function stats(text) {
	if (statsOn) {
		if (stats.caller.name != "") {
			console.log(consoleTag() + "STATS [" + stats.caller.name + "] - " + text);
		} else {
			console.log(consoleTag() + "STATS - " + text);
		}
	}
}

function debug(text) {
	if (debugOn) {
		if (debug.caller.name != "") {
			console.log(consoleTag() + "DEBUG [" + debug.caller.name + "] - " + text);
		} else {
			console.log(consoleTag() + "DEBUG - " + text);
		}
	}
}

function info(text) {
	if (infoOn) {
		if (info.caller.name != "") {
			console.log(consoleTag() + "INFO  [" + info.caller.name + "] - " + text);
		} else {
			console.log(consoleTag() + "INFO - " + text);
		}
	}
}

function warn(text) {
	if (warnOn) {
		if (warn.caller.name != "") {
			console.log(consoleTag() + "WARN  [" + warn.caller.name + "] - " + text);
		} else {
			console.log(consoleTag() + "WARN - " + text);
		}
	}
}

function error(text) {
	if (errorOn) {
		if (error.caller.name != "") {
			console.log("%c" + consoleTag() + "ERROR [" + error.caller.name + "] - " + text, "color:red");
		} else {
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

$(document).ready(function() {
	var start = new Date().getTime();

	$("#raphael").css("height", $(window).height() - $("#body").height());

	Raphael("raphael", $("#raphael").width(), $("#raphael").height(),
		function() {
			paper = this;

			paper.setStart();
			allElementsSet = paper.set();

			var shapesCount = 0;

			for (var i = 0; i < dictionary.buildings.length; i++) {
				var building = dictionary.buildings[i].short_id;
				var floorToShapeListAndNameMap = buildingToFloorMap.get(building);
				if (floorToShapeListAndNameMap == null) {
					floorToShapeListAndNameMap = new buckets.Dictionary();
				}
				for (var j = 0; j < dictionary.buildings[i].floors.length; j++) {
					var floor = dictionary.buildings[i].floors[j].id;
					var shapeListAndNameMap = floorToShapeListAndNameMap.get(floor);
					if (shapeListAndNameMap == null) {
						shapeListAndNameMap = new buckets.Dictionary();
					}
					var shapeList = shapeListAndNameMap.get("shapes");
					if (shapeList == null) {
						shapeList = new buckets.LinkedList(function(shape) {
							return shape.data(GlobalStrings.ID);
						});
					}
					for (var k = 0; k < dictionary.buildings[i].floors[j].shapes.length; k++) {
						var shape = dictionary.buildings[i].floors[j].shapes[k];
						var path = paper.path(shape.path).data(GlobalStrings.ID, shape.id).data(GlobalStrings.BUILDING, building).data(GlobalStrings.FLOOR, floor);
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
				el.scale(paperResizeRatio, paperResizeRatio, (paper.width / 2), (paper.height / 2));
			});



			stats("Took " + (new Date().getTime() - start) + " ms to setup raphael");
		});

	$("#change_building_floor_popover").popover({
		placement: "bottom",
		html: true
	});

	var mouseDown = false;
	var currX;
	var currY;
	$("#raphael").mousedown(function(event) {
		currX = event.offsetX;
		currY = event.offsetY;
		mouseDown = true;
	});
	$("#raphael").mousemove(function(event) {
		if (mouseDown) {
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
	$("#raphael").mouseup(function(event) {
		if (mouseDown) {
			mouseDown = false;
		}
	});

	//Firefox
	$('#raphael').bind('DOMMouseScroll', function(e) {
		var resizeRatio;
		if (e.originalEvent.detail < 0) {
			//scroll down / zoom out 10%
			resizeRatio = .90;
			paperResizeRatio = paperResizeRatio - .1;
		} else {
			//scroll up / zoom in 10%
			resizeRatio = 1.1;
			paperResizeRatio = paperResizeRatio + .1;
		}

		paper.forEach(function(el) {
			el.scale(resizeRatio, resizeRatio, (paper.width / 2), (paper.height / 2));
		});

		paperWidth = paperWidth * resizeRatio;
		paperHeight = paperHeight * resizeRatio;

		// paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);

		//prevent page fom scrolling
		return false;
	});

	//IE, Opera, Safari
	$('#raphael').bind('mousewheel', function(e) {
		var resizeRatio;
		if (e.originalEvent.wheelDelta < 0) {
			//scroll down / zoom out 10%
			resizeRatio = .90;
			paperResizeRatio = paperResizeRatio - .1;
		} else {
			//scroll up / zoom in 10%
			resizeRatio = 1.1;
			paperResizeRatio = paperResizeRatio + .1;
		}

		paper.forEach(function(el) {
			el.scale(resizeRatio, resizeRatio, (paper.width / 2), (paper.height / 2));
		});

		paperWidth = paperWidth * resizeRatio;
		paperHeight = paperHeight * resizeRatio;

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

	buildingToFloorMap.forEach(function(building, floorToShapeListAndNameMap) {
		floorToShapeListAndNameMap.forEach(function(floor, shapeListAndNameMap) {
			var nameList = shapeListAndNameMap.get("names");
			if (nameList == null) {
				nameList = new buckets.LinkedList();
			}
			shapeListAndNameMap.get("shapes").forEach(function(shape) {
				var id = shape.data(GlobalStrings.ID);
				var bbox = shape.getBBox();
				var centerX = bbox.x + (bbox.width / 2);
				var centerY = bbox.y + (bbox.height / 2);

				nameList.add(paper.text(centerX, centerY, id).attr("font-size", 6));

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

	console.log(buildingToFloorMap);

	var resizeRatioX = Math.abs((paper.width - rightmostBottomRightX) / rightmostBottomRightX);
	var resizeRatioY = Math.abs((paper.height - rightmostBottomRightY) / rightmostBottomRightY);

	showShapesForCurrentBuildingAndFloor();
}

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
	var clickX = ev.offsetX;
	var clickY = ev.offsetY;

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
	return "bldg_" + building + "_flr_" + floor + "_rm_" + room;
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
		"</select>" +
		"<div id='room_number_container' class='form-group'>" +
		"<label for='room_number_input'>Room Number</label>" +
		"<input id='room_number_input' type='search' class='form-control' oninput='renameDialogChanged()' autocomplete='off' value='"+ defaultRoomNumber +"'>" +
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
		if($("#room_number_container").is(":hidden")) {
			$("#room_number_container").show();
		}
	} else {
		debug("RESETTING VALUE");
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
	shapeListAndNameMap.get("names").forEach(function(element){
		if(element.attr("text") == oldId) {
			element.attr("text", newId);
			return false;
		}
	});
	shapeListAndNameMap.get("shapes").forEach(function(element){
		if(element.data(GlobalStrings.ID) == oldId) {
			element.data(GlobalStrings.ID, newId);
			element.data(GlobalStrings.TYPE, selectedType);
			return false;
		}
	});
}

function saveDictionaryFile() {
	info(JSON.stringify(dictionary));
}

function changeBuildingFloor() {
	var buildingFloorContent = "<form id='change_building_floor_form' onchange='changeBuildingFloorChanged()' style='width: 244px'>" +
		"<div class='form-group'>" +
		"<label for='building_selector'>Building</label>" +
		"<select id='building_selector' name='building' class='form-control'>" +
		"<option id='" + GlobalStrings.ALL_BUILDINGS + "' " + (currentBuilding == GlobalStrings.ALL_BUILDINGS ? "selected='true'" : "") + ">" + GlobalStrings.ALL_BUILDINGS + "</option>";
	buildingToFloorMap.forEach(function(building, floorToShapeListMap) {
		buildingFloorContent += "<option id='" + building + "' " + (currentBuilding == building ? "selected='true'" : "") + ">" + building + "</option>";
	});

	buildingFloorContent += "</select>" +
		"</div>" +
		"<div class='form-group'>" +
		"<label for='floor_selector'>Floor</label>" +
		"<select id='floor_selector' class='form-control'>";

	if (currentBuilding == GlobalStrings.ALL_BUILDINGS) {
		var lowFloor;
		var topFloor;
		buildingToFloorMap.forEach(function(building, floorToShapeListMap) {
			floorToShapeListMap.forEach(function(floor, shapeList) {
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
		buildingToFloorMap.get(currentBuilding).forEach(function(floor, shapeList) {
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
	if (selectedBuilding != currentBuilding) {
		if (selectedBuilding != GlobalStrings.ALL_BUILDINGS) {
			// Building changed. Try to stay on same floor but different building. Else try for B of building, then 1st floor etc.
			var newFloor;
			buildingToFloorMap.get(selectedBuilding).forEach(function(floor, shapeList) {
				if (newFloor == null) {
					newFloor = floor;
				} else {
					if (floor == selectedFloor) {
						newFloor = selectedFloor;
					} else {
						if (floor == "B" || floor == "1") {
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
			nameList.forEach(function(name) {
				if ((showAllBuildings || building == bldg) && floor == flr) {
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
}

function showShapesForCurrentBuildingAndFloor() {
	debug("Showing shapes for current building and floor");
	showShapesForBuildingAndFloor(currentBuilding, currentFloor);
}
