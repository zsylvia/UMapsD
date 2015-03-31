/* 
This contains all the objects and methods to create the raphael page, loads in the dictionary, add event handlers, 
and exposes methods to control which buildings and floors and room names are displayed
*/

var raphaelDiv = "raphael";
var raphaelDivJQuery = "#" + raphaelDiv;

var paper;
var totalCenterX;
var totalCenterY;

var buildingShortToLongNameMap = new buckets.Dictionary();
var buildingToFloorMap = new buckets.Dictionary();
var buildingToFloorIdsMap = new buckets.Dictionary();
var currentBuilding = "Dion";
var currentFloor = "1";

var paperResizeRatio = 1;
var paperX = 0;
var paperY = 0;
var paperWidth;
var paperHeight;

var paperShiftX = 0;
var paperShiftY = 0;

var draggingEverythingIgnoreClick = false;

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

	var mouseDown = false;
	var currX;
	var currY;
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
		currX = event.offsetX;
		currY = event.offsetY;
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
			paperShiftX = Math.floor(paperShiftX + (currX - event.offsetX) * paperResizeRatio);
			paperShiftY = Math.floor(paperShiftY + (currY - event.offsetY) * paperResizeRatio);
			currX = event.offsetX;
			currY = event.offsetY;

			paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, false);

			draggingEverythingIgnoreClick = true;
		}
	});
	$(raphaelDivJQuery).mouseup(function(event) {
		if (mouseDown) {
			mouseDown = false;
		}
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
		// paperShiftX = paperShiftX * paperResizeRatio;
		// paperShiftY = paperShiftY * paperResizeRatio;

		paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);

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

	showShapesForCurrentBuildingAndFloor();
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

							nameList.add(paper.text(centerX, centerY, shape.id).attr("font-size", 4).toBack().hide());

							if (idIsType(shape.id, GlobalStrings.ROOM) || idIsType(shape.id, GlobalStrings.BATHROOM_MENS) || idIsType(shape.id, GlobalStrings.BATHROOM_WOMENS)) {
								// path.attr({fill: "#0a2871", "fill-opacity": .5});
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
				} else {
					name.hide();
				}
			});
		});
	});

	paperShiftX = Math.floor(paperX);
	paperShiftY = Math.floor(paperY);
	paper.setViewBox(paperShiftX, paperShiftY, paper.width, paper.height, false);
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
