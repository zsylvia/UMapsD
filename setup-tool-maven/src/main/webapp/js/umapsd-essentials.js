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

var roomMap = new buckets.Dictionary();
var doorMap = new buckets.Dictionary();
var hallwayMap = new buckets.Dictionary();
var pathwayMap = new buckets.Dictionary();
var stairMap = new buckets.Dictionary();
var elevatorMap = new buckets.Dictionary();
var bathroomMensMap = new buckets.Dictionary();
var bathroomWomensMap = new buckets.Dictionary();
var parkingLotMap = new buckets.Dictionary();
var dormMap = new buckets.Dictionary();

var parkingLotNameAndShapeMap = new buckets.Dictionary();
var dormNameAndShapeMap = new buckets.Dictionary();
var miscNameAndShapeMap = new buckets.Dictionary();
var pathShapesList = new buckets.LinkedList();

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
allMarkers.add(dormMap);

var roomConnectionMap = newConnectionMap();
var doorConnectionMap = newConnectionMap();
var hallwayConnectionMap = newConnectionMap();
var pathwayConnectionMap = newConnectionMap();
var stairConnectionMap = newConnectionMap();
var elevatorConnectionMap = newConnectionMap();
var bathroomMensConnectionMap = newConnectionMap();
var bathroomWomensConnectionMap = newConnectionMap();
var parkingLotConnectionMap = newConnectionMap();
var dormConnectionMap = newConnectionMap();

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
typeToConnectionMap.set(GlobalStrings.DORM, parkingLotConnectionMap);

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
typeToMarkerMap.set(GlobalStrings.DORM, parkingLotMap);

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
markerTypeToColorMap.set(GlobalStrings.DORM, GlobalStrings.COLOR.VIOLET);

var pathMap = new buckets.Dictionary();

var buildingShortToLongNameMap = new buckets.Dictionary();
var buildingToFloorMap = new buckets.Dictionary();
var buildingToFloorIdsMap = new buckets.Dictionary();
var currentBuilding = GlobalStrings.ALL_BUILDINGS;
var currentFloor = "1";
var showingFloor = "-1";

var paperResizeRatio = 1;
var paperWidth;
var paperHeight;

var paperShiftX = 0;
var paperShiftY = 0;

var draggingEverythingIgnoreClick = false;

var markersInvisible = true;

var dictionaryLoaded = false;

var mouseDown = false;
var currX;
var currY;
var currX2;
var currY2;

var hasGraph = false;

var paperViewBoxMap;

var showingShapesAndNamesSet;

var mouseMoveCount = 0;

var touchDistance = 0;

var defaultFontSize = 10;
var maxFontSize = 15;
var minFontSize = 5;

function Connection(marker, distance) {
	this.marker = marker;
	this.distance = distance;

	this.toString = function() {
		return marker1.data(GlobalStrings.ID) + "-" + distance;
	}
}

$(document).ready(function() {
	$("#view").css("height", $(window).height() - $("#navbar").outerHeight(true) - 5);
	$("#view").css("width", $("#navbar").width());
	setTimeout(function(){
		
		var start = new Date().getTime();

		$(raphaelDivJQuery).css("width", $("#view").width());
		$(raphaelDivJQuery).css("height", $("#view").height());

		paper = new Raphael(raphaelDiv, $(raphaelDivJQuery).width(), $(raphaelDivJQuery).height());

		showingShapesAndNamesSet = paper.set();

		paperWidth = paper.width;
		paperHeight = paper.height;
		
		raphaelSetup();
		
		$(window).resize(function() {
			$("#view").css("height", $(window).height() - $("#navbar").outerHeight(true) - 5);
			$("#view").css("width", $("#navbar").width());
			$(raphaelDivJQuery).css("height", $("#view").height());
			$(raphaelDivJQuery).css("width", $("#view").width());
			if($(window).width() <= 768) {
				$("#mobile_controls").css("display", "block");			
			} else {
				$("#mobile_controls").css("display", "none");
			}
			paper.setSize($(raphaelDivJQuery).width(), $(raphaelDivJQuery).height());
		});
		
		document.getElementById(raphaelDiv).addEventListener("touchstart", function(event) {
			if (event.preventDefault) event.preventDefault();
			currX = event.touches[0].pageX;
			currY = event.touches[0].pageY;
			if(event.touches[1] != null) {
				currX2 = event.touches[1].pageX;
				currY2 = event.touches[1].pageY;
				touchDistance = dist(currX, currY, currX2, currY2);
			}
			mouseDown = true;
		}, false);
		document.getElementById(raphaelDiv).addEventListener("touchmove", function(event) {
			if (event.preventDefault) event.preventDefault();
			if (mouseDown && !mouseOnMarker && (mouseMoveCount % 10 == 0)) {
				if (event.preventDefault) {
					event.preventDefault();
				}
				if(event.touches.length == 2) {
					currX = event.touches[0].pageX;
					currY = event.touches[0].pageY;
					currX2 = event.touches[1].pageX;
					currY2 = event.touches[1].pageY;
					var newTouchDistance = dist(currX, currY, currX2, currY2);
					if(newTouchDistance > touchDistance) {
						zoomIn();
					} else {
						zoomOut();
					}
					touchDistance = newTouchDistance;
				} else {
					paperShiftX = Math.floor(paperShiftX + (currX - event.touches[0].pageX) * paperResizeRatio);
					paperShiftY = Math.floor(paperShiftY + (currY - event.touches[0].pageY) * paperResizeRatio);
					currX = event.touches[0].pageX;
					currY = event.touches[0].pageY;
				}

				paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, false);

				draggingEverythingIgnoreClick = true;
			}
			mouseMoveCount++;
		}, false);
		document.getElementById(raphaelDiv).addEventListener("touchend", function(event) {
			if (event.preventDefault) event.preventDefault();
			if (mouseDown) {
				mouseDown = false;
			}
		}, false);
		$(raphaelDivJQuery).mousedown(function(event) {
			var ev = event;
			if(ev.button == 0) {
				if(event.target.nodeName == "tspan" || ev.offsetX === undefined) {
					currX = ev.pageX;
					currY = ev.pageY - ($(document).height() - $("#raphael").height());
				} else {
					currX = ev.offsetX;
					currY = ev.offsetY;
				}
				mouseDown = true;
			}
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
			if (mouseDown && !ignoreEvent && (mouseMoveCount % 2 == 0)) {
				var ev = event;
				if (ev.preventDefault) {
					ev.preventDefault();
				}
				var shiftX = paperShiftX;
				var shiftY = paperShiftY;
				var cX = currX;
				var cY = currY;
				var rr = paperResizeRatio;
				if(event.target.nodeName == "tspan" || ev.offsetX === undefined) {
					var pX = ev.pageX;
					var pY = ev.pageY;
					var docHeight = $(document).height();
					var raphaelHeight = $("#raphael").height();
					shiftX = Math.floor(shiftX + (cX - pX) * rr);
					shiftY = Math.floor(shiftY + (cY - (pY - (docHeight - raphaelHeight))) * rr);
					paperShiftX = shiftX;
					paperShiftY = shiftY;
					currX = pX;
					currY = pY - (docHeight - raphaelHeight);
				} else {
					var offX = ev.offsetX;
					var offY = ev.offsetY;
					shiftX = Math.floor(shiftX + (cX - offX) * rr);
					shiftY = Math.floor(shiftY + (cY - offY) * rr);
					paperShiftX = shiftX;
					paperShiftY = shiftY;
					currX = offX;
					currY = offY;	
				}
				
				paper.setViewBox(shiftX, shiftY, paperWidth, paperHeight, false);

				draggingEverythingIgnoreClick = true;
			}
			
			mouseMoveCount++;
		});
		$(raphaelDivJQuery).mouseup(function(event) {
			mouseDown = false;
		});

		//Firefox
		$(raphaelDivJQuery).bind('DOMMouseScroll', function(e) {
			var resizeRatio;
			if (e.originalEvent.detail < 0) {
				zoomIn();
			} else {
				zoomOut();
			}

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
		
		LOG.trace("Took " + (now() - start) + " ms to setup raphael");
	}, 50);
});

function raphaelSetup() {
	var buildings = dictionary.buildings;
	
	for (var i = 0, bldgLength = buildings.length; i < bldgLength; i++) {
		var building = buildings[i];
		var floors = building.floors;
		floorIdList = new buckets.LinkedList();
		tmpList = new buckets.LinkedList();
		for (var j = 0, flrLength = floors.length; j < flrLength; j++) {
			tmpList.add(floors[j].id);
		}
		//Sort the list
		for (var j = 0, flrLength = floors.length; j < flrLength; j++) {
			flr = tmpList.first();
			tmpList.forEach(function(floor) {
				if (floor < flr) {
					flr = floor;
				}
			});
			tmpList.remove(flr);
			floorIdList.add(flr);
		}
		buildingToFloorIdsMap.set(building.short_id, floorIdList);
	}
	
	var parkingLots = dictionary.parkinglots;
	for(var i = 0; i < parkingLots.length; i++) {
		var shape = parkingLots[i];
		var path = paper.path(shape.path).data(GlobalStrings.ID, shape.short_id);
		var bbox = Raphael.pathBBox(shape.path);
		var centerX = bbox.x + (bbox.width / 2);
		var centerY = bbox.y + (bbox.height / 2);

		var name = paper.text(centerX, centerY, shape.full_id).attr({"font-size": defaultFontSize}).toFront();
//		path.attr({fill: "#fddcac", "fill-opacity": .75, stroke: "white", "stroke-opacity": 1});
		path.attr({fill: "#D35400", "fill-opacity": .75, stroke: "white", "stroke-opacity": 1});
		
		parkingLotNameAndShapeMap.set(shape.full_id, {name: name, shape: path});
	}
	
	var dorms = dictionary.dorms;
	for(var i = 0; i < dorms.length; i++) {
		var shape = dorms[i];
		var path = paper.path(shape.path).data(GlobalStrings.ID, shape.short_id);
		var bbox = Raphael.pathBBox(shape.path);
		var centerX = bbox.x + (bbox.width / 2);
		var centerY = bbox.y + (bbox.height / 2);

		var name = paper.text(centerX, centerY, shape.full_id).attr({"font-size": defaultFontSize}).toFront();
//		path.attr({fill: "#fddcac", "fill-opacity": .75, stroke: "white", "stroke-opacity": 1});
		path.attr({fill: "#F7CA18", "fill-opacity": .75, stroke: "white", "stroke-opacity": 1});
		
		dormNameAndShapeMap.set(shape.full_id, {name: name, shape: path});
	}
	
	var misc = dictionary.misc;
	for(var i = 0, miscLength = misc.length; i < miscLength; i++) {
		var shape = misc[i];
		var path = paper.path(shape.path).data(GlobalStrings.ID, shape.id);
		var bbox = Raphael.pathBBox(shape.path);
		var centerX = bbox.x + (bbox.width / 2);
		var centerY = bbox.y + (bbox.height / 2);

		var name = paper.text(centerX, centerY, shape.id).attr({"font-size": defaultFontSize}).toFront();
		path.attr({fill: "#fddcac", "fill-opacity": .75, stroke: "white", "stroke-opacity": 1});
		
		miscNameAndShapeMap.set(shape.id, {name: name, shape: path});
	}
	
	var pathways = dictionary.paths;
//	var newPaths = [];
	for(var i = 0, pathLength = pathways.length; i < pathLength; i++) {
		var shape = pathways[i];
//		var pathString = "M"+shape.x1+" "+shape.y1+"L"+shape.x2+" "+shape.y2;
//		var p = {id:"",path:""};
//		p.id = shape.id;
//		p.path = pathString;
//		newPaths.push(p);
		var path = paper.path(shape.path);
		path.attr({fill: "black", stroke: "black"});
		pathShapesList.add(path);
	}
//	dictionary.paths = newPaths;

	hasGraph = loadGraphData();
	showShapesForCurrentBuildingAndFloor();
	
	dictionaryLoaded = true;
}

function loadGraphData() {
	var start = new Date().getTime();
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
		
		LOG.trace("Took " + (now()-start) + " ms to load graph data");
		return true;
	}
	
	LOG.trace("Took " + (now()-start) + " ms to load graph data");
	return false;
}

function loadShapesForBuildingAndFloor(building, floor) {
	var start = now();
	var bldgToFlrMap = buildingToFloorMap;
	if (bldgToFlrMap.containsKey(building) && bldgToFlrMap.get(building).containsKey(floor)) {
		return;
	}
	LOG.debug("Loading shapes for building " + building + " and floor " + floor);
	var buildings = dictionary.buildings;
	var nd = nameDictionary;
	var buildings_nd = nd.buildings;
	var parkingLots_nd = nd.parkingLots;
	var dorms_nd = nd.dorms;
	var pathCreateTime = 0;
	var textCreateTime = 0;
	var findCenterTime = 0;
	var loopStart = now();
	var p = paper;
	for (var i = 0, bldgLength = buildings.length; i < bldgLength; i++) {
		var bldg = buildings[i];
		buildingShortToLongNameMap.set(bldg.short_id, bldg.full_id);
		if (building == GlobalStrings.ALL_BUILDINGS || bldg.short_id == building) {
			if (bldgToFlrMap.containsKey(bldg.short_id) && bldgToFlrMap.get(bldg.short_id).containsKey(floor)) {
				continue;
			}
			var floorToShapeListAndNameMap = bldgToFlrMap.get(bldg.short_id);
			if (floorToShapeListAndNameMap == null) {
				floorToShapeListAndNameMap = new buckets.Dictionary();
			}
			var floors = bldg.floors;
			for (var j = 0, flrLength = floors.length; j < flrLength; j++) {
				var flr = floors[j];
				if (flr.id == floor) {
					var shapeListAndNameMap = floorToShapeListAndNameMap.get(flr.id);
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

					var shapes = flr.shapes;
					var path;
					var id = GlobalStrings.ID;
					for (var k = 0, shapesLength = shapes.length; k < shapesLength; k++) {
						var shape = shapes[k];
						var shapeId = shape.id;
						var shapePath = shape.path;
						if (shapePath != "") {
							var s = now();
							if(shapeId== "outline") {
								path = p.path(shapePath).data(id, shapeId)
								.attr({fill: "gray", "fill-opacity": .1, stroke: "white", "stroke-width": 2}).toBack();
							} else {
								path = p.path(shapePath).data(id, shapeId);
								var type = getTypeFromId(shapeId);
								if(type == null) {
									type = shape.id;
								}
								switch(type) {
									case GlobalStrings.ROOM:
										path.attr({fill: "#E74C3C", "fill-opacity": .75, stroke: "white"});
										break;
									case GlobalStrings.BATHROOM_MENS:
										path.attr({fill: "#2980b9", "fill-opacity": .75, stroke: "white"});
										break;
									case GlobalStrings.BATHROOM_WOMENS:
										path.attr({fill: "#FF69B4", "fill-opacity": .75, stroke: "white"});
										break;
									default:
										path.attr({fill: "#D2D7D3", "fill-opacity": .75, stroke: "white"});
										break;
								}
								
							}
							pathCreateTime += now()-s;

							shapeList.add(path);
						}
					}
					
					var s = now();
					var bldg_id = bldg.short_id;
					var flr_id = flr.id;
					var floors_nd = null;
					var names_nd = null;
					for(var x = 0, len = buildings_nd.length; x < len; x++) {
						var bldg_nd = buildings_nd[x];
						if(bldg_nd.id == bldg_id) {
							floors_nd = bldg_nd.floors;
							break;
						}
					}
					if(floors_nd != null) {
						for(var x = 0, len = floors_nd.length; x < len; x++) {
							var flr_nd = floors_nd[x];
							if(flr_nd.id == flr_id) {
								names_nd = flr_nd.names;
								break;
							}
						}
						if(names_nd != null) {
							for(var x = 0, len = names_nd.length; x < len; x++) {
								var name = names_nd[x];
								if(name.id != "outline") {
									nameList.add(p.text(name.x, name.y, name.id));
								}
							}
						} else {
							for (var k = 0, shapesLength = shapes.length; k < shapesLength; k++) {
								var shape = shapes[k];
								if(shape.id != "outline") {
									var bbox = Raphael.pathBBox(shape.path);
									var centerX = bbox.x + (bbox.width / 2);
									var centerY = bbox.y + (bbox.height / 2);
									nameList.add(p.text(centerX, centerY, shape.id));
								}
							}
						}
					} else {
						for (var k = 0, shapesLength = shapes.length; k < shapesLength; k++) {
							var shape = shapes[k];
							if(shape.id != "outline") {
								var bbox = Raphael.pathBBox(shape.path);
								var centerX = bbox.x + (bbox.width / 2);
								var centerY = bbox.y + (bbox.height / 2);
								nameList.add(p.text(centerX, centerY, shape.id));
							}
						}
					}
					
					textCreateTime += now() - s;
					
					shapeListAndNameMap.set("shapes", shapeList);
					shapeListAndNameMap.set("names", nameList);
					floorToShapeListAndNameMap.set(flr.id, shapeListAndNameMap);
				}
			}
			buildingToFloorMap.set(bldg.short_id, floorToShapeListAndNameMap);
		}
	}
	
	LOG.trace("Took " + pathCreateTime + " ms to create all shapes");
	LOG.trace("Took " + textCreateTime + " ms to create all text");
	LOG.trace("Took " + (now()-loopStart) + " ms to finish the loop");
	
	LOG.trace("Took " + (now()-start) + " ms to load shapes for " + building + " floor " + floor);
}

function showShapesForBuildingAndFloor(building, floor) {
	loadShapesForBuildingAndFloor(GlobalStrings.ALL_BUILDINGS, floor);
	var start = now();
	LOG.debug("Showing shapes for building " + building + " and floor " + floor);
	var paperX = 999999;
	var paperY = 999999;
	
	if(floor != showingFloor) {
		var shapeAndNameSet = paper.set();
		showingShapesAndNamesSet.hide();
		
		buildingToFloorMap.forEach(function(bldg, floorToShapeListMap) {
			var shapeListAndNameMap = floorToShapeListMap.get(floor);
			if(shapeListAndNameMap != null) {
				var shapeList = shapeListAndNameMap.get("shapes");
				var nameList = shapeListAndNameMap.get("names");
				shapeList.forEach(function(shape) {
					shapeAndNameSet.push(shape.show());
					if(shape.data(GlobalStrings.ID) == "outline") {
						shape.toBack();
					}
				});
				
				nameList.forEach(function(name) {
					shapeAndNameSet.push(name.show().toFront());
				});
			}
		});
		
		if(floor == "1") {
			// show parking lots, dorms, and paths
			parkingLotNameAndShapeMap.forEach(function(id, nameShape) {
				shapeAndNameSet.push(nameShape.name.show());
				shapeAndNameSet.push(nameShape.shape.show());
			});
			dormNameAndShapeMap.forEach(function(id, nameShape) {
				shapeAndNameSet.push(nameShape.name.show());
				shapeAndNameSet.push(nameShape.shape.show());
			});
			pathShapesList.forEach(function(path){
				shapeAndNameSet.push(path.show());
			});
		}
		
		showingShapesAndNamesSet = shapeAndNameSet;
	}
	
	var buildings = paperShiftMap.buildings;
	for(var i = 0, bLen = buildings.length; i < bLen; i++) {
		if(buildings[i].id == building) {
			var floors = buildings[i].floors;
			for(var j = 0, fLen = floors.length; j < fLen; j++) {
				var flr = floors[j];
				if(flr.id == floor) {
					paperShiftX = flr.x;
					paperShiftY = flr.y;
					break;
				}
			}
			break;
		}
	}
	
	paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, false);
	
	LOG.trace("Took " + (now()-start) + " ms to show shapes for " + building + " floor " + floor);
	
	if(hasGraph) {
		showMarkersForCurrentBuildingAndFloor();
	}
	
	resizeToFitShapesForBuildingAndFloor(building, floor);
	
	showingFloor = floor;
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
		var pMap = pathMap;
		connectionMap.forEach(function(connection){
			if(connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY || 
			((building == GlobalStrings.ALL_BUILDINGS || connection.marker.data(GlobalStrings.BUILDING)) && connection.marker.data(GlobalStrings.FLOOR) == floor)) {
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
}

function hidePathsForMarker(marker, building, floor) {
	LOG.trace("Hiding paths for marker " + marker.data(GlobalStrings.ID) + " building " + building + " floor " + floor);
	var connectionMap = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if(connectionMap != null) {
		var pMap = pathMap;
		connectionMap.forEach(function(connection){
			if(connection.marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY || 
			((building == GlobalStrings.ALL_BUILDINGS || connection.marker.data(GlobalStrings.BUILDING)) && connection.marker.data(GlobalStrings.FLOOR) == floor)) {
				var path = pMap.get(marker.data(GlobalStrings.ID) + "<->" + connection.marker.data(GlobalStrings.ID));
				if(path == null) {
					path = pMap.get(connection.marker.data(GlobalStrings.ID) + "<->" + marker.data(GlobalStrings.ID));
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
	
	var start = new Date().getTime();
	if(!markersInvisible) {
		showPathsForBuildingAndFloor(building, floor);
		hidePathsForBuildingAndFloor(building, floor);
		LOG.debug("Showing markers for building " + building + " floor " + floor);
		allMarkers.forEach(function(markerMap) {
			markerMap.forEach(function(markerId, marker) {
				if(marker.data(GlobalStrings.TYPE) == GlobalStrings.PATHWAY || marker.data(GlobalStrings.TYPE) == GlobalStrings.PARKING_LOT) {
					marker.show().toFront();
				} else if((building == GlobalStrings.ALL_BUILDINGS || marker.data(GlobalStrings.BUILDING) == building) && marker.data(GlobalStrings.FLOOR) == floor) {
					marker.show().toFront();
				} else {
					marker.hide();
					hidePathsForMarker(marker, building, floor);
				}
			});
		});
	}
	LOG.trace("Took " + (new Date().getTime()-start) + " ms to show markers for " + building + " floor " + floor);
}

// Shows paths that HAVE have both endpoints in the building and floor
function showPathsForBuildingAndFloor(building, floor) {
	LOG.trace("Showing paths for " + building + " floor " + floor);
	if(!markersInvisible) {
		pathMap.forEach(function(pathString, path){
			if(building != GlobalStrings.ALL_BUILDINGS) {
				if(path.marker1Data.type != GlobalStrings.PATHWAY && path.marker2Data.type != GlobalStrings.PATHWAY) {
					if((path.marker1Data.building == building && path.marker1Data.floor == floor) && (path.marker2Data.building == building && path.marker2Data.floor == floor)) {
						path.element.show().toFront();
					}
				}
			} else {
				if(path.marker1Data.type != GlobalStrings.PATHWAY && path.marker2Data.type != GlobalStrings.PATHWAY) {
					if(path.marker1Data.floor == floor && path.marker2Data.floor == floor) {
						path.element.show().toFront();
					}
				}
			}
		});
	}
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
		} else {
			if(path.marker1Data.type != GlobalStrings.PATHWAY && path.marker2Data.type != GlobalStrings.PATHWAY) {
				if(path.marker1Data.floor != floor && path.marker2Data.floor != floor) {
					path.element.hide();
				}
			}
		}
	});
}

// Must run loadShapesForBuildingAndFloor(building, floor) before this
function loadMarkersForBuildingAndFloor(building, floor) {
	var start = new Date().getTime();
	var lbf = loadedBuildingsAndFloors;
	if((!lbf.containsKey(building) || !lbf.get(building).contains(floor))
			&& (!lbf.containsKey(GlobalStrings.ALL_BUILDINGS) || !lbf.get(GlobalStrings.ALL_BUILDINGS).contains(floor))){
		LOG.debug("Loading markers for building " + building + " floor " + floor);
		allMarkers.forEach(function(markerMap){
			markerMap.forEach(function(markerId, marker) {
				if(!getMarkerMapForType(marker.data(GlobalStrings.TYPE)).containsKey(marker.data(GlobalStrings.ID))) {
					LOG.trace("Loading marker " + marker.data(GlobalStrings.ID));
//					if (marker.data(GlobalStrings.TYPE) == GlobalStrings.ROOM || marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_MENS || marker.data(GlobalStrings.TYPE) == GlobalStrings.BATHROOM_WOMENS) {
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
//					}

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
//							if (path.marker1Data.type == GlobalStrings.ROOM || path.marker1Data.type == GlobalStrings.BATHROOM_MENS || path.marker1Data.type == GlobalStrings.BATHROOM_WOMENS) {
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
//							}
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
				} else {
					marker1 = addMarker(path.marker1Data.cx, path.marker1Data.cy, markerTypeToColorMap.get(path.marker1Data.type));
					marker1.data(GlobalStrings.ID, path.marker1Data.id);
					marker1.data(GlobalStrings.TYPE, path.marker1Data.type);
			
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
//							if (path.marker2Data.type == GlobalStrings.ROOM || path.marker2Data.type == GlobalStrings.BATHROOM_MENS || path.marker2Data.type == GlobalStrings.BATHROOM_WOMENS) {
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
//							}
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
				} else {

					marker2 = addMarker(path.marker2Data.cx, path.marker2Data.cy, markerTypeToColorMap.get(path.marker2Data.type));
					marker2.data(GlobalStrings.ID, path.marker2Data.id);
					marker2.data(GlobalStrings.TYPE, path.marker2Data.type);
			
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
		
		var floorList = lbf.get(building);
		if(floorList == null) {
			floorList = new buckets.LinkedList();
		}
		floorList.add(floor);
		loadedBuildingsAndFloors.set(building, floorList);
	}
	
	LOG.trace("Took " + (new Date().getTime()-start) + " ms to load markers for " + building + " floor " + floor);
}

function setMarkersInvisible(bool) {
	LOG.trace("Setting markers invisible");
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
	} else {
		showMarkersForCurrentBuildingAndFloor();
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
	var marker = paper.circle(x, y, markerSize).attr({
		fill: color
	}).toFront();
	
	if(markersInvisible) {
		marker.hide();
	}

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

function resizeToFitShapesForBuildingAndFloor(building, floor) {
	var start = now();
	var lowerLeftY;
	var buildings = resizeMap.buildings;
	for(var i = 0, blen = buildings.length; i < blen; i++) {
		var bldg = buildings[i];
		if(bldg.id == building) {
			var floors = bldg.floors;
			for(var j = 0, flen = floors.length; j < flen; j++) {
				var flr = floors[j];
				if(flr.id == floor) {
					lowerLeftY = flr.y;
					break;
				}
			}
			break;
		}
	}
	var oldPaperWidth = paperWidth;
	var xyRatio = oldPaperWidth/paperHeight;
	var yDist = lowerLeftY-(paperShiftY+paperHeight);
	paperWidth += xyRatio*yDist;
	paperHeight += yDist;
	
	paperResizeRatio *= (paperWidth/oldPaperWidth);

	paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);
	
	LOG.trace("Took " + (now()-start) + " ms to resize to fit shapes for " + building + " floor " + floor);
}

function zoomIn(zoomFactor) {
	var resizeRatio;
	if(zoomFactor != null && zoomFactor < 1) {
		resizeRatio = zoomFactor;
	} else {
		//scroll down / zoom in 10%
		resizeRatio = .90;
	}
	zoom(resizeRatio);
}

function zoomOut(zoomFactor) {
	var resizeRatio;
	if(zoomFactor != null && zoomFactor > 1) {
		resizeRatio = zoomFactor;
	} else {
		//scroll up / zoom out 10%
		resizeRatio = 1.1;
	}
	zoom(resizeRatio);
}

function zoom(resizeRatio) {
	var oldResizeRatio = paperResizeRatio;
	paperResizeRatio *= resizeRatio;
	
	paperWidth *= resizeRatio;
	paperHeight *= resizeRatio;
	
	var change = Math.abs(Math.floor(oldResizeRatio) - Math.floor(paperResizeRatio));
	if(change == 1) {
		var fontSize = Math.ceil(defaultFontSize*paperResizeRatio);
		if(fontSize >= minFontSize && fontSize <= maxFontSize) {
			if(currentBuilding == GlobalStrings.ALL_BUILDINGS) {
				buildingToFloorMap.forEach(function(building, floorMap) {
					var flrMap = floorMap.get(currentFloor);
					if(flrMap != null) {
						flrMap.get("names").forEach(function(name){
							name.attr("font-size", fontSize);
						});
					}
				});
			} else {
				buildingToFloorMap.get(currentBuilding).get(currentFloor).get("names").forEach(function(name){
					name.attr("font-size", fontSize);
				});
			}
		}
		parkingLotNameAndShapeMap.forEach(function(id, nameShape) {
			nameShape.name.attr("font-size", fontSize);
		});
		dormNameAndShapeMap.forEach(function(id, nameShape) {
			nameShape.name.attr("font-size", fontSize);
		});
	}

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
	return "";
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
	return roomId.substr(roomId.lastIndexOf(GlobalStrings.ROOM_ID + "_") + (GlobalStrings.ROOM_ID + "_").length);
}

function getParkingLotFromId(parkingLotId) {
	return parkingLotId.substr(parkingLotId.lastIndexOf(GlobalStrings.PARKING_LOT_ID + "_") + (GlobalStrings.PARKING_LOT_ID + "_").length);
}

function getClosestMarkerToPoint(x, y) {
	var closestMarker;
	var closestDistance;
	allMarkers.forEach(function(markerMap){
		markerMap.forEach(function(markerId, marker){
			if(marker.data(GlobalStrings.TYPE) != GlobalStrings.PATHWAY && marker.data(GlobalStrings.TYPE) != GlobalStrings.PARKING_LOT) {
				if(currentBuilding == GlobalStrings.ALL_BUILDINGS || currentBuilding == marker.data(GlobalStrings.BUILDING)) {
					if(currentFloor == marker.data(GlobalStrings.FLOOR)) {
						var distance = dist(x, y, marker.attr("cx"), marker.attr("cy"));
						if(closestMarker == null || distance < closestDistance) {
							closestMarker = marker;
							closestDistance = distance;
						}
					}
				}
			} else {
				var distance = dist(x, y, marker.attr("cx"), marker.attr("cy"));
				if(closestMarker == null || distance < closestDistance) {
					closestMarker = marker;
					closestDistance = distance;
				}
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

function getTypeFromId(id) {
	if(id.search(GlobalStrings.PATHWAY_ID) == -1) {
		if(id.search(GlobalStrings.PARKING_LOT_ID) == -1) {
			if(id.search(GlobalStrings.DORM_ID) == -1) {
				var parts = id.split("_");
				if(parts[0] == GlobalStrings.BUILDING_ID) {
					if(parts[2] == GlobalStrings.FLOOR_ID) {
						var type;
						var typeId = parts[4];
						if(typeId == GlobalStrings.ROOM_ID) {
							type = GlobalStrings.ROOM;
						} else if(typeId == GlobalStrings.DOOR_ID) {
							type = GlobalStrings.DOOR;
						} else if(typeId == GlobalStrings.HALLWAY_ID) {
							type = GlobalStrings.HALLWAY;
						} else if(typeId == GlobalStrings.STAIR_ID) {
							type = GlobalStrings.STAIR;
						} else if(typeId == GlobalStrings.ELEVATOR_ID) {
							type = GlobalStrings.ELEVATOR;
						} else if(typeId == GlobalStrings.BATHROOM_MENS_ID) {
							type = GlobalStrings.BATHROOM_MENS;
						} else if(typeId == GlobalStrings.BATHROOM_WOMENS_ID) {
							type = GlobalStrings.BATHROOM_WOMENS;
						}
						
						return type;
					}
				}
			} else {
				return GlobalStrings.DORM;
			}
		} else {
			return GlobalStrings.PARKING_LOT;
		}
	} else {
		return GlobalStrings.PATHWAY;
	}
	
	return null;
}

function findTypeSpecificId(id, type) {
	if(type == null) {
		type = getTypeFromId(id);
	}
	if(type == null) {
		return id;
	} else {
		if(type == GlobalStrings.ROOM) {
			return getRoomFromRoomId(id);
		} else if(type == GlobalStrings.BATHROOM_MENS) {
			return GlobalStrings.BATHROOM_MENS_DISPLAY;
		} else if(type == GlobalStrings.BATHROOM_WOMENS) {
			return GlobalStrings.BATHROOM_WOMENS_DISPLAY;
		} else if(type == GlobalStrings.PARKING_LOT) {
			return getParkingLotFromId(id);
		}
	}
}

function now() {
	return new Date().getTime();
}

function loadMarkersForAllBuildingsAndFloors() {
	buildingToFloorIdsMap.forEach(function(building, floorList){
		floorList.forEach(function(floor){
			loadMarkersForBuildingAndFloor(building, floor);
		});
	});
}

function loadShapesForAllBuildingsAndFloors() {
	buildingToFloorIdsMap.forEach(function(building, floorList){
		floorList.forEach(function(floor){
			loadShapesForBuildingAndFloor(building, floor);
		});
	});
}

function waitAndRun(wait, condition, func, params) {
	setTimeout(function() {
		if(condition == true || window[condition]) {
			LOG.debug("Running function");
			if(params != null) {
				func(params);
			} else {
				func();
			}
		} else {
			LOG.debug("Not running function yet");
			waitAndRun(func, wait, condition);
		}
		
	}, wait);
}

function hashCode(str) {
	var start = now();
	var hash = 0;
	if(str.length == 0) return hash;
	for(var i = 0, len = str.length; i < len; i++) {
		var char = str.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash;
	}
	console.log("Took " + (now()-start) + " ms to get hash of " + str + ": " + hash);
	return hash;
}

function getDisplayNameFromId(id) {
	var type = getTypeFromId(id);
	if(type == GlobalStrings.ROOM) {
		return buildingShortToLongNameMap.get(getBuildingFromId(id)) + " " + getRoomFromRoomId(id);
	} else if(type == GlobalStrings.BATHROOM_MENS) {
		return GlobalStrings.BATHROOM_MENS_DISPLAY;
	} else if(type == GlobalStrings.BATHROOM_WOMENS) {
		return GlobalStrings.BATHROOM_WOMENS_DISPLAY;
	} else if(type == GlobalStrings.PARKING_LOT) {
		return GlobalStrings.PARKING_LOT_DISPLAY + " " + getParkingLotFromId(id);
	} else {
		return id;
	}
}

function resetRaphaelSize() {
	$(raphaelDivJQuery).css("width", $("#view").width());
	$(raphaelDivJQuery).css("height", $("#view").height());
	paper.setSize($(raphaelDivJQuery).width(), $(raphaelDivJQuery).height());
}

function getLocation() {
    if (navigator.geolocation) {
        closestMarker=navigator.geolocation.getCurrentPosition(showPosition);
        return closestMarker;
    } else {
    	 //$("#where_button").text("I have failed");      
    }

}

function showPosition(position) {
    
    //$("#where_button").text("I have failed2");
   // $("#where_button").text(position.coords.latitude+", "+position.coords.longitude);

    closestMarker=gpsToMapCoordConverter(position.coords.latitude, position.coords.longitude);
   	return closestMarker;
    
}

function  gpsToMapCoordConverter(lat, longi){
	var tempoX;
	var tempoY;

	tempoX=longi*563232+3.99986*10000000+42;
	tempoY=lat*(-747010)+3.11021*10000000+62;
	closestMarker=getClosestMarkerToPoint(tempoX, tempoY);
	return closestMarker;
}
