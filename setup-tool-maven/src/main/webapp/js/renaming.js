var nameChangeMap = new buckets.Dictionary();

// These counts are just used when naming, the number does not matter it only removes duplicates
var bathroomMensIdCount = 0;
var bathroomWomensIdCount = 0;

var graph;

var changeBuildingFloorShowing = false;

var sessionTime = new Date().getTime();

var currentHoveredShape = null;

var removeNamesMode = false;

var currentBuilding = "dion";

var shapeToNameMap = new buckets.Dictionary(function shapeToString(shape) {
	return shape.data(GlobalStrings.ID);
});

var LOG = new Logger(LoggingLevel.ALL);

$(document).ready(function() {
	
	setTimeout(function(){
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
			if(!mouseDown) {
				if(!$("#dialog_modal").is(":visible")) {
					var mousePosX;
					var mousePosY;
					if(event.target.nodeName == "tspan" || event.offsetX === undefined) {
						mousePosX = event.pageX * paperResizeRatio + paperShiftX;
						mousePosY = (event.pageY - ($(document).height() - $("#raphael").height()))*paperResizeRatio + paperShiftY;
					} else {
						mousePosX = event.offsetX * paperResizeRatio + paperShiftX;
						mousePosY = event.offsetY * paperResizeRatio + paperShiftY;
					}
					var currentHoveredShapeColored = false;
					var previousHoveredShapeUnColored = false;
					var sameShape = false;
					var currBldg = buildingToFloorMap.get(currentBuilding);
					if(currBldg != null) {
						var currFlr = currBldg.get(currentFloor);
						if(currFlr != null) {
							var shapes = currFlr.get("shapes");
							if(shapes != null) {
								shapes.forEach(function(shape){
									if(shape.data(GlobalStrings.ID) != "outline" && shape.isPointInside(mousePosX, mousePosY)){
										if(currentHoveredShape == shape) {
											sameShape = true;
										} else {
											shape.attr({fill:"red"});
											currentHoveredShapeColored = true;
											currentHoveredShape = shape;
											var name = shapeToNameMap.get(shape);
											if(name != null) {
												name.attr({"font-size": 14});
											}
										}
									} else {
										if(shape.attr("fill") == "red") {
											shape.attr({fill:"#fddcac"});
											var name = shapeToNameMap.get(shape);
											if(name != null) {
												name.attr({"font-size": 10});
											}
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
					}
				}
			}
		});
	}, 50);
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
	if(!$("#dialog_modal").is(":visible")) {
		var clickX = ev.offsetX * paperResizeRatio;
		var clickY = ev.offsetY * paperResizeRatio;

		if (ev.target.getAttribute("customNodeName") == "tspan" || ev.offsetX === undefined) {
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
	}

	$("#formatted_id").html(formattedId);
}

function rename(oldId) {
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
	LOG.trace("Renaming shapes for " + building + " floor " + floor);
	var start = now();
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
					element.attr("text", findTypeSpecificId(changedId));
				}
			}
		});
		shapeListAndNameMap.get("shapes").forEach(function(element) {
			var changedId = floorChangeMap.get(element.data(GlobalStrings.ID));
			if(changedId != null) {
				var name = shapeToNameMap.remove(element);
				element.data(GlobalStrings.ID, changedId);
				if(changedId != "" && name != null) {
					shapeToNameMap.set(element, name);
				}
			}
		});
	}
	LOG.trace("Took " + (new Date().getTime() - start) + " ms to rename shapes for " + building + " floor " + floor);
}

function saveDictionaryFile() {
	var start = now();
	var changeMap = {buildings:[]};
	var buildingCount = -1;
	nameChangeMap.forEach(function(building, buildingChangeMap){
		buildingCount++;
		changeMap.buildings[buildingCount] = {id:"",floors:[]};
		var changeMapBuilding = changeMap.buildings[buildingCount];
		changeMapBuilding.id = building;
		var floorCount = -1;
		buildingChangeMap.forEach(function(floor, floorChangeMap){
			floorCount++;
			changeMapBuilding.floors[floorCount] = {id:"",changes:[]};
			var changeMapFloor = changeMapBuilding.floors[floorCount];
			changeMapFloor.id = floor;
			var changeCount = -1;
			floorChangeMap.forEach(function(oldId, changedId){
				changeCount++;
				changeMap.buildings[buildingCount].floors[floorCount].changes[changeCount] = {oldId:"",changedId:""};
				var changeMapChange = changeMap.buildings[buildingCount].floors[floorCount].changes[changeCount];
				changeMapChange.oldId = oldId;
				changeMapChange.changedId = changedId;
			});
		});
	});
	
	buildingToFloorIdsMap.forEach(function(building, floorList){
		floorList.forEach(function(floor){
			loadShapesForBuildingAndFloor(building, floor);
		});
	});
	
	var paperShiftMap = {buildings: []};
	var nameDictionary = {buildings: [], parkingLots: [], dorms: []};
	var resizeMap = {buildings: []};
	buildingToFloorMap.forEach(function(bldg, floorToShapeListMap) {
		var buildings_psm = paperShiftMap.buildings;
		var buildings_nd = nameDictionary.buildings;
		var buildings_rm = resizeMap.buildings;
		buildings_psm[buildings_psm.length] = {id: bldg, floors: []};
		buildings_nd[buildings_nd.length] = {id: bldg, floors: []};
		buildings_rm[buildings_rm.length] = {id: bldg, floors: []};
		floorToShapeListMap.forEach(function(flr, shapeListAndNameMap) {
			var floors_psm = buildings_psm[buildings_psm.length-1].floors;
			var floors_nd = buildings_nd[buildings_nd.length-1].floors;
			var floors_rm = buildings_rm[buildings_rm.length-1].floors;
			floors_psm[floors_psm.length] = {id: flr, x: 999999, y: 999999};
			floors_nd[floors_nd.length] = {id: flr, names: []};
			floors_rm[floors_rm.length] = {id: flr, y: -999999};
			var shapeList = shapeListAndNameMap.get("shapes");
			shapeList.forEach(function(shape) {
				var bbox = Raphael.pathBBox(shape.attrs.path);
				if (bbox.x < floors_psm[floors_psm.length-1].x) {
					floors_psm[floors_psm.length-1].x = Math.floor(bbox.x);
				}
				if (bbox.y < floors_psm[floors_psm.length-1].y) {
					floors_psm[floors_psm.length-1].y = Math.floor(bbox.y);
				}
				if(bbox.y2 > floors_rm[floors_rm.length-1].y) {
					floors_rm[floors_rm.length-1].y = bbox.y2;
				}
			});
			buildings_psm[buildings_psm.length-1].floors = floors_psm;
			buildings_rm[buildings_rm.length-1].floors = floors_rm;
			
			var names_nd = floors_nd[floors_nd.length-1].names;
			var nameList = shapeListAndNameMap.get("names");
			nameList.forEach(function(name){
				var attrs = name.attrs;
				var text = attrs.text;
				if(text != "" && text.substring(0, 3) !== "ARC") {
					names_nd[names_nd.length] = {id:text, x: Math.floor(attrs.x), y: Math.floor(attrs.y)};
				}
			});
			floors_nd.names = names_nd;
			buildings_nd[buildings_nd.length-1].floors = floors_nd;
		});
		paperShiftMap.buildings = buildings_psm;
		nameDictionary.buildings = buildings_nd;
		resizeMap.buildings = buildings_rm;
	});

	var parkingLots = nameDictionary.parkingLots;
	parkingLotNameAndShapeMap.forEach(function(id, nameAndShapeObj){
		var attrs = nameAndShapeObj.name.attrs;
		parkingLots[parkingLots.length] = {id: attrs.text, x: Math.floor(attrs.x), y: Math.floor(attrs.y)};
	});
	nameDictionary.parkingLots = parkingLots;
	
	var dorms = nameDictionary.dorms;
	dormNameAndShapeMap.forEach(function(id, nameAndShapeObj){
		var attrs = nameAndShapeObj.name.attrs;
		dorms[dorms.length] = {id: attrs.text, x: Math.floor(attrs.x), y: Math.floor(attrs.y)};
	});
	nameDictionary.dorms = dorms;
	
	paperShiftMap.buildings[paperShiftMap.buildings.length] = {id: GlobalStrings.ALL_BUILDINGS, floors: []};
	resizeMap.buildings[resizeMap.buildings.length] = {id: GlobalStrings.ALL_BUILDINGS, floors: []};
	var building_psm = paperShiftMap.buildings[paperShiftMap.buildings.length-1];
	var building_rm = resizeMap.buildings[resizeMap.buildings.length-1];
	buildingToFloorMap.forEach(function(bldg, floorToShapeListMap) {
		var floors_psm = building_psm.floors;
		var floors_rm = building_rm.floors;
		floorToShapeListMap.forEach(function(flr, shapeListAndNameMap) {
			var floorArrayPosPsm = null;
			var floorArrayPosRm = null;
			var floor_psm = null;
			var floor_rm = null
			for(var i = 0, floorLength = floors_psm.length; i < floorLength; i++) {
				if(floors_psm[i].id == flr) {
					floorArrayPosPsm = i;
					break;
				}
			}
			for(var i = 0, floorLength = floors_rm.length; i < floorLength; i++) {
				if(floors_rm[i].id == flr) {
					floorArrayPosRm = i;
					break;
				}
			}
			if(floorArrayPosPsm == null) {
				floorArrayPosPsm = floors_psm.length;
				floors_psm[floorArrayPosPsm] = {id: flr, x: 999999, y: 999999};
			}
			if(floorArrayPosRm == null) {
				floorArrayPosRm = floors_rm.length;
				floors_rm[floorArrayPosRm] = {id: flr, y: -999999};
			}
			
			floor_psm = floors_psm[floorArrayPosPsm];
			floor_rm = floors_rm[floorArrayPosRm];
			
			var shapeList = shapeListAndNameMap.get("shapes");
			shapeList.forEach(function(shape) {
				var bbox = Raphael.pathBBox(shape.attrs.path);
				if (bbox.x < floor_psm.x) {
					floor_psm.x = Math.floor(bbox.x);
				}
				if (bbox.y < floor_psm.y) {
					floor_psm.y = Math.floor(bbox.y);
				}
				if(bbox.y2 > floor_rm.y) {
					floor_rm.y = Math.floor(bbox.y2);
				}
			});
			
			floors_psm[floorArrayPosPsm] = floor_psm;
			floors_rm[floorArrayPosRm] = floor_rm;
		});
		building_psm.floors = floors_psm;
		building_rm.floors = floors_rm;
	});
	paperShiftMap.buildings[paperShiftMap.buildings.length-1] = building_psm;
	resizeMap.buildings[resizeMap.buildings.length-1] = building_rm;
	
	var buildings = dictionary.buildings;
	var productionDictionary = {buildings: [], parkinglots: [], dorms: [], paths: []};
	var bldgs = productionDictionary.buildings;
	for(var i = 0, blen = buildings.length; i < blen; i++) {
		var building = buildings[i];
		bldgs[bldgs.length] = {full_id: building.full_id, short_id: building.short_id, floors: []};
		var bldg = bldgs[bldgs.length-1];
		var floors = building.floors;
		var flrs = bldg.floors;
		for(var j = 0, flen = floors.length; j < flen; j++) {
			var floor = floors[j];
			flrs[flrs.length] = {id: floor.id, shapes: []};
			var flr = flrs[flrs.length-1];
			var shapes = floor.shapes;
			var oneLongPath = [];
			var outlinePath;
			for(var k = 0, slen = shapes.length; k < slen; k++) {
				var shp = shapes[k];
				if(shp.id == "outline") {
					outlinePath = shp.path;
				} else {
					oneLongPath.push(shp.path);
				}
			}
			flr.shapes[0] = {id: "outline", path: outlinePath};
			flr.shapes[1] = {id: "all", path: oneLongPath.join(" ")};
			flrs[flrs.length-1] = flr;
		}
		bldg.floors = flrs;
		bldgs[bldgs.length-1] = bldg;
	}
	productionDictionary.buildings = bldgs;
	productionDictionary.parkinglots = dictionary.parkinglots;
	productionDictionary.dorms = dictionary.dorms;
	productionDictionary.paths = dictionary.paths;
	
	var request = $.ajax({
	 	url: "dictionaryUpload",
	 	type: "POST",
	 	data: {
	 		dictionary: JSON.stringify(dictionary),
	 		productionDictionary: JSON.stringify(productionDictionary),
	 		nameChangeMap: $.param(changeMap),
	 		sessionTime: sessionTime,
	 		paperShiftMap: JSON.stringify(paperShiftMap),
	 		nameDictionary: JSON.stringify(nameDictionary),
	 		resizeMap: JSON.stringify(resizeMap)
	 	},
	 	dataType: "html"
	 });
	
	 request.fail(function(jqXHR, textStatus) {
	 	alert("Request failed: " + textStatus);
	 	console.log(JSON.stringify(dictionary));
	 	console.log(JSON.stringify(productionDictionary));
	 	console.log(JSON.stringify(changeMap));
		console.log(JSON.stringify(paperShiftMap));
		console.log(JSON.stringify(nameDictionary));
		console.log(JSON.stringify(resizeMap));
	 });
	 
	 LOG.trace("Took " + (now()-start) + " ms to save dictionary");
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
