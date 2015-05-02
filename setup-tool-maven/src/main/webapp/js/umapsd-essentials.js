/* 
This contains all the objects and methods to create the raphael page, loads in the dictionary, add event handlers, 
and exposes methods to control which buildings and floors and room names are displayed
*/

// The div name of where to draw the paper
var raphaelDiv = "raphael";
var raphaelDivJQuery = "#" + raphaelDiv;

// Raphael paper object
var paper;

// Map of already loaded buildings and floors to avoid loading twice
var loadedBuildingsAndFloors = new buckets.Dictionary();

// Map for every marker type
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
var miscMap = new buckets.Dictionary();

// List of all the marker maps. Allows for running functions
// on all markers without having to specify every marker map
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
allMarkers.add(miscMap);

// Map of marker type to the corresponding marker map
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
typeToMarkerMap.set(GlobalStrings.DORM, dormMap);
typeToMarkerMap.set(GlobalStrings.MISC, miscMap);

// Map of marker type to the corresponding default marker color
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
markerTypeToColorMap.set(GlobalStrings.MISC, GlobalStrings.COLOR.NAVY);

// A list of the types of markers that should be shown no matter what floor or building you are on
var markerTypesToAlwaysShow = new buckets.LinkedList();
markerTypesToAlwaysShow.add(GlobalStrings.PATHWAY);
markerTypesToAlwaysShow.add(GlobalStrings.PARKING_LOT);
markerTypesToAlwaysShow.add(GlobalStrings.DORM);
markerTypesToAlwaysShow.add(GlobalStrings.MISC);


// Map of all parking lot names and shapes
// parkingLotNameAndShapeMap.get("parkingLot") will return an object in the form {name: raphaelTextObject, shape: raphaelPathObject}
var parkingLotNameAndShapeMap = new buckets.Dictionary();
// Map of all dorm names and shapes
// dormNameAndShapeMap("dormName") will return an object in the form {name: raphaelTextObject, shape: raphaelPathObject}
var dormNameAndShapeMap = new buckets.Dictionary();
// Map of all misc area names and shapes
// miscNameAndShapeMap("miscName") will return an object in the form {name: raphaelTextObject, shape: raphaelPathObject}
var miscNameAndShapeMap = new buckets.Dictionary();
// List of all the drawn pathways
var pathShapesList = new buckets.LinkedList();

// Default marker size
var markerSize = 5;
// Default path width (the path that shows when you are getting directions)
var pathStrokeWidth = 4;

// Global flag if the mouse is on a marker (used for specifying type of dragging events)
var mouseOnMarker = false;

//These counts are just used when naming, the number does not matter it only removes duplicates
var doorIdCount = 0;
var hallwayIdCount = 0;
var pathwayIdCount = 0;
var stairIdCount = 0;
var elevatorIdCount = 0;
var bathroomMensIdCount = 0;
var bathroomWomensIdCount = 0;

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

// Map of path objects (the ones that connect 2 markers)
var pathMap = new buckets.Dictionary();

// Map of building short_id to full_id determined from the dictionary
var buildingShortToLongNameMap = new buckets.Dictionary();

// Map of building id, to floor id, to map of name list and shape list
// i.e. to get shape list for building dion floor 1 : buildingToFloorMap.get("dion").get("1").get("shapes")
var buildingToFloorMap = new buckets.Dictionary();

// Map of building short_id to floor ids. So we know how many floors each building has
var buildingToFloorIdsMap = new buckets.Dictionary();

// The current building focused on. This is the default building that loads at first.
// Define this variable in another js file to set the default building if you want other
// than ALL_BUILDINGS
var currentBuilding = GlobalStrings.ALL_BUILDINGS;

// The current floor focused on. This is the default floor that loads at first.
// Define this variable in another js file to set the default floor if you want other
// than 1
var currentFloor = "1";

// The current floor actually showing. Starts at -1 (meaning not showing), keep that
var showingFloor = "-1";

// The 'paper resize ratio', aka the zoom level of the paper
var paperResizeRatio = 1;

// The width/height of the paper. After zooming, paper.width and paper.height
// doesn't reflect the actual displayed width. These track that
var paperWidth;
var paperHeight;

// The x/y shift of the paper
var paperShiftX = 0;
var paperShiftY = 0;

var draggingEverythingIgnoreClick = false;

// Set markersInvisible = false in another js file if you want
// markers to be visible. For example, the RDP tool has markersInvisible
// set to false
var markersInvisible = true;

// Flag that says if the dictionary has been loaded in yet
var dictionaryLoaded = false;

var mouseDown = false;

// Global variables for keeping track of mouse click locations as well
// as touch locations for multitouch
var currX;
var currY;
var currX2;
var currY2;

// Set hasGraph = true in another js file if the graph.js file is loaded in.
// For example, renaming tool keeps this false because there is no pathfinding.
// MUST SET TO TRUE IN ANOTHER JS FILE IF PATHFINDING IS USED
var hasGraph = false;

// A set of raphael objects that are currently being displayed.
// This is a quick way to run show(), hide() or other ops on
// just the displayed objects
var showingShapesAndNamesSet;

// Count of mouse move events. This is used to limit the number of events
// processed especially in mobile. i.e. mouseMoveCount%5 == 0 in the mouse event
// handler would allow you to only do an operation every 5 mouse moves to not be
// too heavy on processing
var mouseMoveCount = 0;

// Variable to keep track of the previous distance between touches. This is used to calculate
// if we are pinch-to-zoom in or out
var touchDistance = 0;

// The default/max/min font size for text
var defaultFontSize = 10;
var maxFontSize = 15;
var minFontSize = 5;

// Map of type to the color of the shape to be drawn
var typeToShapeColor = new buckets.Dictionary();
typeToShapeColor.set(GlobalStrings.ROOM, "#E74C3C");
typeToShapeColor.set(GlobalStrings.BATHROOM_MENS, "#2980b9");
typeToShapeColor.set(GlobalStrings.BATHROOM_WOMENS, "#FF69B4");
typeToShapeColor.set(GlobalStrings.PARKING_LOT, "#D35400");
typeToShapeColor.set(GlobalStrings.DORM, "#F7CA18");
typeToShapeColor.set(GlobalStrings.MISC, "#FDDCAC");
defaultShapeColor = "#D2D7D3";
buildingOutlineColor = "gray";


// Object that represents a connection for a marker. 
// If markerA connects to markerB with distance of 30, 
// marker a would have new Connection(markerB, 3) in the
// marker connection map
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
		
		// Like a camera focusing. This is to get the text to resize correctly 
		zoomIn();
		zoomOut();
		
		$(window).resize(function() {
			// This makes the view and raphael div the perfect size on the page to not have any scroll bar
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
		
		// Event for when the user touches the screen
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
		
		// Event for when the user drags a finger (or more)
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
		
		// Event for when the user lifts a finger
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
					currY = ev.pageY - ($(document).height() - $(raphaelDivJQuery).height());
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
					var raphaelHeight = $(raphaelDivJQuery).height();
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

/**
 * raphaelSetup
 * 
 * Populates the buildingToFloorIdsMap and loads all parking lots, dorms, paths, and misc 
 */
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
		path.attr({fill: typeToShapeColor.get(GlobalStrings.PARKING_LOT), "fill-opacity": .75, stroke: "white", "stroke-opacity": 1});
		
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
		path.attr({fill: typeToShapeColor.get(GlobalStrings.DORM), "fill-opacity": .75, stroke: "white", "stroke-opacity": 1});
		
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
		path.attr({fill: typeToShapeColor.get(GlobalStrings.MISC), "fill-opacity": .75, stroke: "white", "stroke-opacity": 1});
		
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


/**
 * loadGraphData
 * 
 * Loads in the graph data. Creates all paths and markers without any connections
 */
function loadGraphData() {
	var start = now();
	var json = null;
	try {
		json = graphJS;
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


/**
 * loadShapesForBuildingAndFloor
 * 
 * Loads shapes and name text for passed in building and floor if
 * they haven't already been loaded and sets the color of the shapes
 * @param building
 * @param floor
 */
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
								.attr({fill: buildingOutlineColor, "fill-opacity": .1, stroke: "white", "stroke-width": 2}).toBack();
							} else {
								path = p.path(shapePath).data(id, shapeId);
								var type = getTypeFromId(shapeId);
								if(type == null) {
									type = shape.id;
								}
								
								switch(type) {
									case GlobalStrings.ROOM:
										path.attr({fill: typeToShapeColor.get(GlobalStrings.ROOM), "fill-opacity": .75, stroke: "white"});
										break;
									case GlobalStrings.BATHROOM_MENS:
										path.attr({fill: typeToShapeColor.get(GlobalStrings.BATHROOM_MENS), "fill-opacity": .75, stroke: "white"});
										break;
									case GlobalStrings.BATHROOM_WOMENS:
										path.attr({fill: typeToShapeColor.get(GlobalStrings.BATHROOM_WOMENS), "fill-opacity": .75, stroke: "white"});
										break;
									default:
										path.attr({fill: defaultShapeColor, "fill-opacity": .75, stroke: "white"});
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
								if(shape.id != "outline" && shape.path != "") {
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
							if(shape.id != "outline" && shape.path != "") {
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


/**
 * showShapesForBuildingAndFloor
 * 
 * Hides all displaying shapes and names and shows
 * all shapes and names for passed in building and floor.
 * Moves the paper shift and resizes to fit the building on screen.
 * Also shows markers for building and floor if a graph is loaded
 * @param building
 * @param floor
 */
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


/**
 * showShapesForCurrentBuildingAndFloor
 * 
 * Shows shapes for the set currentBuilding and currentFloor
 */
function showShapesForCurrentBuildingAndFloor() {
	LOG.debug("Showing shapes for current building and floor");
	showShapesForBuildingAndFloor(currentBuilding, currentFloor);
}


/**
 * idIsType
 * 
 * Tests if an id is of a specified type
 * @param id			The id to test the type of
 * @param type			The type to test if the id is
 * @returns {Boolean}	If the id is of the type passed in
 */
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
		case GlobalStrings.PARKING_LOT:
			if (id.lastIndexOf(GlobalStrings.PARKING_LOT_ID + "_") > -1) {
				return true;
			}
			break;
		case GlobalStrings.DORM:
			if (id.lastIndexOf(GlobalStrings.DORM_ID + "_") > -1) {
				return true;
			}
			break;
		case GlobalStrings.MISC:
			if (id.lastIndexOf(GlobalStrings.MISC_ID + "_") > -1) {
				return true;
			}
			break;
	}
	return false;
}

/**
 * idIsValid
 * 
 * Test if an id is 'valid'. Meaning we can determine the type from the id
 * @param id			The id to test if valid
 * @returns {Boolean}	If the id of any known type
 */
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
	if(idIsType(id, GlobalStrings.PARKING_LOT)) {
		return true;
	}
	if(idIsType(id, GlobalStrings.DORM)) {
		return true;
	}
	if(idIsType(id, GlobalStrings.MISC)) {
		return true;
	}
	return false;
}

/**
 * showPathsForMarker
 * 
 * Show all the paths that are connected to the marker
 * in the passed in building and on the passed in floor
 * @param marker		The marker to display all connected paths
 * @param building		The building to limit shown paths
 * @param floor			The floor to limit shown paths
 */
function showPathsForMarker(marker, building, floor) {
	LOG.trace("Showing paths for marker " + marker.data(GlobalStrings.ID) + " building " + building + " floor " + floor);
	var connectionMap = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if(connectionMap != null) {
		var pMap = pathMap;
		connectionMap.forEach(function(connection){
			if(markerTypesToAlwaysShow.contains(connection.marker.data(GlobalStrings.TYPE)) || 
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

/**
 * hidePathsForMarker
 * 
 * Hide all the paths that are connected to the marker
 * in the passed in building and on the passed in floor
 * @param marker		The marker to hide all connected paths
 * @param building		The building to limit hidden paths
 * @param floor			The floor to limit hidden paths
 */
function hidePathsForMarker(marker, building, floor) {
	LOG.trace("Hiding paths for marker " + marker.data(GlobalStrings.ID) + " building " + building + " floor " + floor);
	var connectionMap = typeToConnectionMap.get(marker.data(GlobalStrings.TYPE)).get(marker);
	if(connectionMap != null) {
		var pMap = pathMap;
		connectionMap.forEach(function(connection){
			if(markerTypesToAlwaysShow.contains(connection.marker.data(GlobalStrings.TYPE)) || 
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

/**
 * showMarkersForCurrentBuildingAndFloor
 * 
 * ** Must run showShapesForCurrentBuildingAndFloor() before this **
 */ 
function showMarkersForCurrentBuildingAndFloor() {
	LOG.debug("Showing markers for current building and floor");
	showMarkersForBuildingAndFloor(currentBuilding, currentFloor);
}

/**
 * showMarkersForBuildingAndFloor
 * 
 * ** Must run showShapesForBuildingAndFloor(building, floor) before this **
 * 
 * Show markers and paths for building and floor
 * @param building
 * @param floor
 */
function showMarkersForBuildingAndFloor(building, floor) {
	loadMarkersForBuildingAndFloor(building, floor);
	
	var start = new Date().getTime();
	if(!markersInvisible) {
		showPathsForBuildingAndFloor(building, floor);
		hidePathsForBuildingAndFloor(building, floor);
		LOG.debug("Showing markers for building " + building + " floor " + floor);
		allMarkers.forEach(function(markerMap) {
			markerMap.forEach(function(markerId, marker) {
				var markerType = marker.data(GlobalStrings.TYPE);
				if(markerTypesToAlwaysShow.contains(markerType)) {
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

/**
 * showPathsForBuildingAndFloor
 * 
 * Shows paths that HAVE have BOTH endpoints in the building and floor
 * @param building
 * @param floor
 */
function showPathsForBuildingAndFloor(building, floor) {
	LOG.trace("Showing paths for " + building + " floor " + floor);
	if(!markersInvisible) {
		pathMap.forEach(function(pathString, path){
			var marker1Data = path.marker1Data;
			var marker2Data = path.marker2Data;
			if(building != GlobalStrings.ALL_BUILDINGS) {
				if(!markerTypesToAlwaysShow.contains(marker1Data.type) && !markerTypesToAlwaysShow.contains(marker2Data.type)) {
					if((marker1Data.building == building && marker1Data.floor == floor) && (marker2Data.building == building && marker2Data.floor == floor)) {
						path.element.show().toFront();
					}
				}
			} else {
				if(!markerTypesToAlwaysShow.contains(marker1Data.type) && !markerTypesToAlwaysShow.contains(marker2Data.type)) {
					if(marker1Data.floor == floor && marker2Data.floor == floor) {
						path.element.show().toFront();
					}
				}
			}
		});
	}
}

/**
 * hidePathsForBuildingAndFloor
 * 
 * Hides paths that DO NOT HAVE BOTH endpoints in the building and floor
 * @param building
 * @param floor
 */
function hidePathsForBuildingAndFloor(building, floor) {
	LOG.trace("Hiding paths for everything NOT " + building + " floor " + floor);
	pathMap.forEach(function(pathString, path){
		var marker1Data = path.marker1Data;
		var marker2Data = path.marker2Data;
		if(building != GlobalStrings.ALL_BUILDINGS) {
			if(!markerTypesToAlwaysShow.contains(marker1Data.type) && !markerTypesToAlwaysShow.contains(marker2Data.type)) {
				if((marker1Data.building != building || marker1Data.floor != floor) || (marker2Data.building != building || marker2Data.floor != floor)) {
					path.element.hide();
				}
			}
		} else {
			if(!markerTypesToAlwaysShow.contains(marker1Data.type) && !markerTypesToAlwaysShow.contains(marker2Data.type)) {
				if(marker1Data.floor != floor && marker2Data.floor != floor) {
					path.element.hide();
				}
			}
		}
	});
}

/**
 * loadMarkersForBuildingAndFloor
 * 
 * ** Must run loadShapesForBuildingAndFloor(building, floor) before this **
 * 
 * @param building
 * @param floor
 */
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
			var marker1Data = path.marker1Data;
			var marker1Type = marker1Data.type;
			var marker1Id = marker1Data.id;
			var marker2Data = path.marker2Data;
			var marker2Type = marker2Data.type;
			var marker2Id = marker2Data.id;
			if(!getMarkerMapForType(marker1Type).containsKey(marker1Id)){
				if(!markerTypesToAlwaysShow.contains(marker1Type)) {
					if((building == GlobalStrings.ALL_BUILDINGS || marker1Data.building == building) && marker1Data.floor == floor) {
						marker1 = getMarkerFromId(marker1Id);
						if (marker1 == null) {
							marker1 = addMarker(marker1Data.cx, marker1Data.cy, markerTypeToColorMap.get(marker1Type));
							marker1.data(GlobalStrings.ID, marker1Id);
//							if (marker1Type == GlobalStrings.ROOM || marker1Type == GlobalStrings.BATHROOM_MENS || marker1Type == GlobalStrings.BATHROOM_WOMENS) {
//								buildingToFloorMap.get(marker1Data.building).get(marker1Data.floor).get("shapes").forEach(function(element) {
//									var show = element.isVisible();
//									element.show();
//
//									if (!idIsValid(marker1Id) && element.data(GlobalStrings.ID) != "outline" && element.isPointInside(marker1.attr("cx"), marker1.attr("cy")) 
//										&& idIsValid(element.data(GlobalStrings.ID))) {
//										LOG.debug("Resetting marker id from " + marker1Id + " to " + element.data(GlobalStrings.ID));
//										marker1.data(GlobalStrings.ID, element.data(GlobalStrings.ID));
//										marker1Id = marker1.data(GlobalStrings.ID);
//										return false;
//									}
//
//									if (!show) {
//										element.hide();
//									}
//								});
//							}
							marker1.data(GlobalStrings.TYPE, marker1Type);
							marker1.data(GlobalStrings.BUILDING, marker1Data.building);
							marker1.data(GlobalStrings.FLOOR, marker1Data.floor);
					
							if(!getMarkerMapForType(marker1Type).containsKey(marker1.data(GlobalStrings.ID))) {
								getMarkerMapForType(marker1Type).set(marker1.data(GlobalStrings.ID), marker1);
							}
							
							if(!typeToConnectionMap.containsKey(marker1Type)){
								typeToConnectionMap.get(marker1Type).set(marker1, newConnectionSet());
							}

							if (marker1Type == GlobalStrings.DOOR) {
								doorIdCount++;
							} else if (marker1Type == GlobalStrings.HALLWAY) {
								hallwayIdCount++;
							} else if (marker1Type == GlobalStrings.PATHWAY) {
								pathwayIdCount++;
							} else if (marker1Type == GlobalStrings.STAIR) {
								stairIdCount++;
							} else if (marker1Type == GlobalStrings.ELEVATOR) {
								elevatorIdCount++;
							} else if (marker1Type == GlobalStrings.BATHROOM_MENS) {
								bathroomMensIdCount++;
							} else if (marker1Type == GlobalStrings.BATHROOM_WOMENS) {
								bathroomWomensIdCount++;
							}
						}
					}
				} else {
					marker1 = addMarker(marker1Data.cx, marker1Data.cy, markerTypeToColorMap.get(marker1Type));
					marker1.data(GlobalStrings.ID, marker1Id);
					marker1.data(GlobalStrings.TYPE, marker1Type);
			
					if(!getMarkerMapForType(marker1Type).containsKey(marker1.data(GlobalStrings.ID))) {
						getMarkerMapForType(marker1Type).set(marker1.data(GlobalStrings.ID), marker1);
					}
					
					if(!typeToConnectionMap.containsKey(marker1Type)){
						typeToConnectionMap.get(marker1Type).set(marker1, newConnectionSet());
					}

					if (marker1Type == GlobalStrings.DOOR) {
						doorIdCount++;
					} else if (marker1Type == GlobalStrings.HALLWAY) {
						hallwayIdCount++;
					} else if (marker1Type == GlobalStrings.PATHWAY) {
						pathwayIdCount++;
					} else if (marker1Type == GlobalStrings.STAIR) {
						stairIdCount++;
					} else if (marker1Type == GlobalStrings.ELEVATOR) {
						elevatorIdCount++;
					} else if (marker1Type == GlobalStrings.BATHROOM_MENS) {
						bathroomMensIdCount++;
					} else if (marker1Type == GlobalStrings.BATHROOM_WOMENS) {
						bathroomWomensIdCount++;
					}
				}
			} else {
				marker1 = getMarkerMapForType(marker1Type).get(marker1Id);
			}
			
			if(!getMarkerMapForType(marker2Type).containsKey(marker2Id)){
				if(!markerTypesToAlwaysShow.contains(marker2Type)) {
					if((building == GlobalStrings.ALL_BUILDINGS || marker2Data.building == building) && marker2Data.floor == floor) {
						marker2 = getMarkerFromId(marker2Id);
						if (marker2 == null) {
							marker2 = addMarker(marker2Data.cx, marker2Data.cy, markerTypeToColorMap.get(marker2Type));
							marker2.data(GlobalStrings.ID, marker2Id);
//							if (marker2Type == GlobalStrings.ROOM || marker2Type == GlobalStrings.BATHROOM_MENS || marker2Type == GlobalStrings.BATHROOM_WOMENS) {
//								buildingToFloorMap.get(marker2Data.building).get(marker2Data.floor).get("shapes").forEach(function(element) {
//									var show = element.isVisible();
//									element.show();
//
//									if (!idIsValid(marker2Id) && element.data(GlobalStrings.ID) != "outline" && element.isPointInside(marker2.attr("cx"), marker2.attr("cy")) 
//										&& idIsValid(element.data(GlobalStrings.ID))) {
//										LOG.debug("Resetting marker id from " + marker2Id + " to " + element.data(GlobalStrings.ID));
//										marker2.data(GlobalStrings.ID, element.data(GlobalStrings.ID));
//										marker2Id = marker2.data(GlobalStrings.ID);
//										return false;
//									}
//
//									if (!show) {
//										element.hide();
//									} 
//								});
//							}
							marker2.data(GlobalStrings.TYPE, marker2Type);
							if (marker2Type != GlobalStrings.PATHWAY) {
								marker2.data(GlobalStrings.BUILDING, marker2Data.building);
								marker2.data(GlobalStrings.FLOOR, marker2Data.floor);
							}
							
							if(!getMarkerMapForType(marker2Type).containsKey(marker2.data(GlobalStrings.ID))) {
								getMarkerMapForType(marker2Type).set(marker2.data(GlobalStrings.ID), marker2);
							}
							
							if(!typeToConnectionMap.containsKey(marker2Type)){
								typeToConnectionMap.get(marker2Type).set(marker2, newConnectionSet());
							}

							if (marker2Type == GlobalStrings.DOOR) {
								doorIdCount++;
							} else if (marker2Type == GlobalStrings.HALLWAY) {
								hallwayIdCount++;
							} else if (marker2Type == GlobalStrings.PATHWAY) {
								pathwayIdCount++;
							} else if (marker2Type == GlobalStrings.STAIR) {
								stairIdCount++;
							} else if (marker2Type == GlobalStrings.ELEVATOR) {
								elevatorIdCount++;
							} else if (marker2Type == GlobalStrings.BATHROOM_MENS) {
								bathroomMensIdCount++;
							} else if (marker2Type == GlobalStrings.BATHROOM_WOMENS) {
								bathroomWomensIdCount++;
							}
						}
					}
				} else {

					marker2 = addMarker(marker2Data.cx, marker2Data.cy, markerTypeToColorMap.get(marker2Type));
					marker2.data(GlobalStrings.ID, marker2Id);
					marker2.data(GlobalStrings.TYPE, marker2Type);
			
					if(!getMarkerMapForType(marker2Type).containsKey(marker2.data(GlobalStrings.ID))) {
						getMarkerMapForType(marker2Type).set(marker2.data(GlobalStrings.ID), marker2);
					}
					
					if(!typeToConnectionMap.containsKey(marker2Type)){
						typeToConnectionMap.get(marker2Type).set(marker2, newConnectionSet());
					}

					if (marker2Type == GlobalStrings.DOOR) {
						doorIdCount++;
					} else if (marker2Type == GlobalStrings.HALLWAY) {
						hallwayIdCount++;
					} else if (marker2Type == GlobalStrings.PATHWAY) {
						pathwayIdCount++;
					} else if (marker2Type == GlobalStrings.STAIR) {
						stairIdCount++;
					} else if (marker2Type == GlobalStrings.ELEVATOR) {
						elevatorIdCount++;
					} else if (marker2Type == GlobalStrings.BATHROOM_MENS) {
						bathroomMensIdCount++;
					} else if (marker2Type == GlobalStrings.BATHROOM_WOMENS) {
						bathroomWomensIdCount++;
					}
				
				}
			} else {
				marker2 = getMarkerMapForType(marker2Type).get(marker2Id);
			}

			if(marker1 != null && marker2 != null) {
				var marker1ConnectionMap = getConnectionMapForType(marker1Type);
				var marker2ConnectionMap = getConnectionMapForType(marker2Type);

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

/**
 * setMarkersInvisible
 * 
 * Show or hide markers and paths.
 * Passing in false will hide all markers and paths
 * and make sure none show up in the future
 * @param bool
 */
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

/**
 * getMarkerMapForType
 * 
 * Get the marker map for the passed in type
 * @param type	The type of the marker map to get
 * @returns	The marker map for the passed in type
 */
function getMarkerMapForType(type) {
	return typeToMarkerMap.get(type);
}

/**
 * getMarkerFromId
 * 
 * Find and return the marker object given the id
 * @param id	Id of the marker to return
 * @returns		The marker
 */
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

/**
 * addMarker
 * 
 * Creates a new marker
 * @param x			X coordinate of the marker
 * @param y			Y coordinate of the marker
 * @param color		Color of the marker
 * @returns			The created marker
 */
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

/**
 * newConnectionMap
 * 
 * Creates a connection map that will take
 * a marker object as the key and use the marker's
 * id to compare
 * @returns {buckets.Dictionary}	The created map
 */
function newConnectionMap() {
	return new buckets.Dictionary(function markerToString(marker) {
		return marker.data(GlobalStrings.ID);
	});
}

/**
 * getConnectionMapForType
 * 
 * Get the connection map for the passed in type
 * @param type	The type of the connection map to get
 * @returns		The connection map
 */
function getConnectionMapForType(type) {
	return typeToConnectionMap.get(type);
}

function newConnectionSet() {
	return new buckets.Set(function connectionToString(connection) {
		return connection.marker.data(GlobalStrings.ID);
	});
}

/**
 * getDistance
 * 
 * Calculate the distance between 2 markers
 * @param marker1	
 * @param marker2	
 * @returns	The distance between the 2 markers
 */
function getDistance(marker1, marker2) {
	return dist(marker1.attr("cx"), marker1.attr("cy"), marker2.attr("cx"), marker2.attr("cy"));
}

/**
 * dist
 * 
 * Calculate the distance between 2 coordinate points
 * @param point1X	X coordinate for point 1
 * @param point1Y	Y coordinate for point 1
 * @param point2X	X coordinate for point 2
 * @param point2Y	Y coordinate for point 2
 * @returns			The distance between the 2 points
 */
function dist(point1X, point1Y, point2X, point2Y) {
	var xs = 0;
	var ys = 0;

	xs = point2X - point1X;
	xs = xs * xs;

	ys = point2Y - point1Y;
	ys = ys * ys;

	return Math.floor(Math.sqrt(xs + ys));
}

/**
 * resizeToFitShapesForBuildingAndFloor
 * 
 * Resize the paper to show the passed in building
 * and floor scaled to fill the view box
 * @param building
 * @param floor
 */
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

/**
 * zoomIn
 * 
 * Zoom the paper in
 * @param zoomFactor	An optional zoomFactor. Must be < 1 if used. Else .90 is used
 */
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

/**
 * zoomOut
 * 
 * Zoom the paper out
 * @param zoomFactor	An option zoomFactor. Must be > 1 if used. Else 1.1 is used
 */
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

/**
 * zoom
 * 
 * Zoom the paper with the passed in resize ratio
 * @param resizeRatio	The ratio to resize. < 1 zooms in, > 1 zooms out
 */
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

/**
 * executeOnAllMarkers
 * 
 * Passes every marker of all types into the given function
 * @param func	The function to be called with each marker as a param
 */
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

/**
 * getBuildingFromId
 * 
 * Given an id, returns the building. i.e. bldg_dion_flr_1_rm_101 will return 'dion'
 * @param id	The id to extract the building from
 * @returns		The building
 */
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

/**
 * getFloorFromId
 * 
 * Given an id, returns the floor. i.e. bldg_dion_flr_1_rm_101 will return 1
 * @param id	The id to extract the floor from
 * @returns		The floor
 */
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

/**
 * getRoomFromRoomId
 * 
 * Given an id, returns the room. i.e. bldg_dion_flr_1_rm_101 will return 101
 * @param id	The id to extract the room from
 * @returns		The room
 */
function getRoomFromRoomId(roomId) {
	return roomId.substr(roomId.lastIndexOf(GlobalStrings.ROOM_ID + "_") + (GlobalStrings.ROOM_ID + "_").length);
}

/**
 * getParkingLotFromId
 * 
 * Given an id, returns the parking lot. i.e. lot_1 will return 1
 * @param id	The id to extract the parking lot from
 * @returns		The parking lot
 */
function getParkingLotFromId(parkingLotId) {
	return parkingLotId.substr(parkingLotId.lastIndexOf(GlobalStrings.PARKING_LOT_ID + "_") + (GlobalStrings.PARKING_LOT_ID + "_").length);
}

/**
 * getDormFromId
 * 
 * Given an id, returns the dorm. i.e. dorm_hickory will return hickory
 * @param id	The id to extract the dorm from
 * @returns		The dorm
 */
function getDormFromId(dormId) {
	return dormId.substr(dormId.lastIndexOf(GlobalStrings.DORM_ID + "_") + (GlobalStrings.DORM_ID + "_").length);
}

/**
 * getMiscFromId
 * 
 * Given an id, returns the misc id. i.e. misc_campanile will return campanile
 * @param id	The id to extract the misc id from
 * @returns		The misc id
 */
function getMiscFromId(miscId) {
	return miscId.substr(miscId.lastIndexOf(GlobalStrings.MISC_ID + "_") + (GlobalStrings.MISC_ID + "_").length);
}

/**
 * getClosestMarkerToPoint
 * 
 * Given the passed in x,y coordinate, find the closest marker
 * to the point
 * @return	The closest marker to the passed in coordinates
 */
function getClosestMarkerToPoint(x, y) {
	var closestMarker;
	var closestDistance;
	allMarkers.forEach(function(markerMap){
		markerMap.forEach(function(markerId, marker){
			if(!markerTypesToAlwaysShow.contains(marker.data(GlobalStrings.TYPE))) {
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

/**
 * getTypeFromId
 * 
 * Given an id, find the type
 * @param id
 * @returns		The type
 */
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
	LOG.trace("Took " + (now()-start) + " ms to get hash of " + str + ": " + hash);
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

function getFloorDifferenceFromId(id1, id2){
	return getFloorFromId(id2) - getFloorFromId(id1);
}

//**** TODO: GPS integration work. INCOMPLETE **** //
function getLocation() {
    if (navigator.geolocation) {  	
        closestMarker=navigator.geolocation.getCurrentPosition(showPosition, error, {enableHighAccuracy:true});
        return closestMarker;
    } else {
    	  
    }
}
function error(zeta){

}
function showPosition(position) {
	console.log(position.coords.accuracy);
    closestMarker=gpsToMapCoordConverter(position.coords.latitude, position.coords.longitude);
   	return closestMarker;
    
}
function  gpsToMapCoordConverter(lat, longi){
	var tempoX;
	var tempoY;
	console.log(lat+", "+longi);
	tempoX=longi*563232+3.99986*10000000+42;
	tempoY=lat*(-747010)+3.11021*10000000+62;
	console.log(tempoX+", "+tempoY);
	paper.circle(tempoX,tempoY,10).attr("fill","red");
	closestMarker=getClosestMarkerToPoint(tempoX, tempoY);
	
	return closestMarker;
}
function testGps(){

	selectedFromMarkerOnMap=getLocation();
	selectedFromMarkerOnMap.show();

}
// ********************************************** //