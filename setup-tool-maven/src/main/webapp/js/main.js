var changeBuildingFloorShowing = false;

var nonHandicapGraph;
var handicapGraph;

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

var changedBuilding;
var changedFloor;

var ignoreClick = false;

var selectingFromOnMap = false;
var selectedFromMarkerOnMap;
var selectingToOnMap = false;
var selectedToMarkerOnMap;

var directionsPathArray;
var directionsPathArrayPosition;

var gettingDirections = false;
var directionsHTML;

var mobileView;

var touchEvent;

var buildingToRoomNamesMap = new buckets.Dictionary();

var LOG = new Logger(LoggingLevel.ALL);

$(document).ready(function() {
	showLoading();
	
	setTimeout(function(){
		setMarkersInvisible(true);
		var start = now();
		nonHandicapGraph = new Graph();
		handicapGraph = new Graph();
		
		nonHandicapGraph.vertices = nonHandicapGraphVertices;
		handicapGraph.vertices = handicapGraphVertices;
		
		var bldgs = nameDictionary.buildings;
		for(var i = 0, blen = bldgs.length; i < blen; i++) {
			var bldg = bldgs[i];
			var flrs = bldg.floors;
			var floorToRoomNameListMap = new buckets.Dictionary();
			for(var j = 0, flen = flrs.length; j < flen; j++) {
				var flr = flrs[j];
				var names = flr.names;
				var nameList = new buckets.LinkedList();
				for(var k = 0, nlen = names.length; k < nlen; k++) {
					var nameId = names[k].id;
					if(nameId != "" && nameId != "outline") {
						nameList.add(nameId);
					}
				}
				floorToRoomNameListMap.set(flr.id, nameList);
			}
			buildingToRoomNamesMap.set(bldg.id, floorToRoomNameListMap);
		}
		
		showRaphael();
		
		$(".nav a").on("click", function(){
			if($(window).width() <= 768) {
				$(".navbar-collapse").collapse("hide");			
			}
		});
		
		document.getElementById("raphael").addEventListener("touchstart", function(event) {
			var ev = event;
			if (ev.preventDefault) ev.preventDefault();
			touchEvent = ev;
		}, false);
		
		document.getElementById("raphael").addEventListener("touchend", function(event) {
			var ev = touchEvent;
			if(draggingEverythingIgnoreClick) {
				ignoreClick = true;
				draggingEverythingIgnoreClick = false;
			}
			if(!ignoreClick) {
				var rr = paperResizeRatio;
				var clickX = (ev.touches[0].pageX * rr) + paperShiftX;
				var clickY = ((ev.touches[0].pageY - ($(document).height() - $("#raphael").height()))* rr) + paperShiftY;
				
				if(selectingFromOnMap) {
					selectedFromMarkerOnMap = getClosestMarkerToPoint(clickX, clickY);
					selectedFromMarkerOnMap.show();
					selectingFromOnMap = false;
					directionsFromTypeChange();
					$('#dialog_modal').modal('toggle');
				} else if(selectingToOnMap) {
					selectedToMarkerOnMap = getClosestMarkerToPoint(clickX, clickY);
					selectedToMarkerOnMap.show();
					selectingToOnMap = false;
					directionsToTypeChange();
					$('#dialog_modal').modal('toggle');
				}
			} else {
				// ignored 1 click
				ignoreClick = false;
			}
		}, false);
		
		$("#raphael").mouseup(function(event) {
			if(draggingEverythingIgnoreClick) {
				ignoreClick = true;
				draggingEverythingIgnoreClick = false;
			}
			if(!ignoreClick) {
				var ev = event;
				var clickX;
				var clickY;
				var rr = paperResizeRatio;
				if(ev.target.nodeName == "tspan" || ev.offsetX === undefined) {
					clickX = ev.pageX * rr;
					clickY = (ev.pageY - ($(document).height() - $("#raphael").height())) * rr;
				} else {
					clickX = ev.offsetX * rr;
					clickY = ev.offsetY * rr;
				}
				clickX += paperShiftX;
				clickY += paperShiftY;
				
				if(selectingFromOnMap) {
					selectedFromMarkerOnMap = getClosestMarkerToPoint(clickX, clickY);
					selectedFromMarkerOnMap.show();
					selectingFromOnMap = false;
					getDirections();
					directionsFromTypeChange();
				} else if(selectingToOnMap) {
					selectedToMarkerOnMap = getClosestMarkerToPoint(clickX, clickY);
					selectedToMarkerOnMap.show();
					selectingToOnMap = false;
					getDirections();
					directionsToTypeChange();
				}
			} else {
				// ignored 1 click
				ignoreClick = false;
			}

		});
		
		LOG.trace("Took " + (new Date().getTime()-start) + " ms to setup main");
		
//		LOG.printLogHistory("view");
	}, 50);
	
});

function changeBuildingFloor() {
	if(gettingDirections) {
		// Need to save the html for the directions state
		directionsHTML = $("#dialog_modal").html();
	}
	var buildingFloorContent = [];
	buildingFloorContent.push("<form id='change_building_floor_form' onchange='changeBuildingFloorChanged()' change='changeBuildingFloorChanged()'>");
	buildingFloorContent.push("<div class='form-group'>");
	buildingFloorContent.push("<label for='building_selector'>Building</label>");
	buildingFloorContent.push("<select class='form-control' id='building_selector' name='building' class='form-control'>");
	buildingFloorContent.push("<option id='" + GlobalStrings.ALL_BUILDINGS + "' " + (currentBuilding == GlobalStrings.ALL_BUILDINGS ? "selected='true'" : "") + ">" + GlobalStrings.ALL_BUILDINGS_DISPLAY + "</option>");
	buildingShortToLongNameMap.forEach(function(shortName, longName) {
		buildingFloorContent.push("<option id='" + shortName + "' " + (currentBuilding == shortName ? "selected='true'" : "") + ">" + longName + "</option>");
	});

	buildingFloorContent.push("</select></div><div class='form-group'><label for='floor_selector'>Floor</label><select class='form-control' id='floor_selector' class='form-control'>");

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
			for (var floor = lowFloor; floor <= topFloor; floor++) {
				buildingFloorContent.push("<option id='" + floor + "' " + (currentFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>");
			}
		}
	} else {
		buildingToFloorIdsMap.get(currentBuilding).forEach(function(floor) {
			buildingFloorContent.push("<option id='" + floor + "' " + (currentFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>");
		});
	}

	buildingFloorContent.push("</select></div></form>");
	
	var footerButtonsHTML = [];
	footerButtonsHTML.push("<button type='button' class='btn btn-default btn-block' onclick='changeBuildingFloorSubmit()'>OK</button>");
	footerButtonsHTML.push("<button type='button' class='btn btn-default btn-block' onclick='hideChangeBuildingFloorModal()'>Cancel</button>");

	$("#dialog_modal .modal-header .close").attr("onclick", "hideChangeBuildingFloorModal()");
	$("#dialog_modal .modal-title").toggleClass("text-danger", false);
	$("#dialog_modal .modal-title").text("Change Building/Floor");
	$("#dialog_modal .modal-body").html(buildingFloorContent.join(""));
	$("#dialog_modal .modal-footer").html(footerButtonsHTML.join(""));
	$('#dialog_modal').modal('toggle');
	
	$("#change_building_floor_form").on("change", function(){
		changeBuildingFloorChanged();
	});
	changeBuildingFloorShowing = true;
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

			changedFloor = newFloor;
		}

		changedBuilding = selectedBuilding;
	} else {
		// Floor changed
		changedFloor = selectedFloor;
	}
	
	setFloorSelectorForBuilding(changedBuilding == null ? currentBuilding : changedBuilding, changedFloor == null ? currentFloor : changedFloor);
}

function changeBuildingFloorSubmit() {
	var reload = false;
	if(changedBuilding != null) {
		reload = true;
		currentBuilding = changedBuilding;
	}
	if(changedFloor != null) {
		reload = true;
		currentFloor = changedFloor;
	}
	if(reload) {
		showLoading();
		
		setTimeout(function() {
			showShapesForCurrentBuildingAndFloor();
			showRaphael();
		}, 50);
	}
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
					optionsHtml += "<option id='" + floor + "' " + (selectedFloor == floor ? "selected='true'" : "") + ">" + floor + "</option>";
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
		changedBuilding = null;
		changedFloor = null;
	}
}

function getDirections() {
	if(!gettingDirections) {
		gettingDirections = true;
		var menuHTML = [];
		menuHTML.push("<div id='directions_from'>");
		menuHTML.push("<label for='directions_from_type'>From (<span><a href='#' onclick='selectFromOnMap()'>Select On Map</a></span>)</label>");
		menuHTML.push("<select class='form-control' id='directions_from_type' name='directions_from_type' onchange='directionsFromTypeChange()'>");
		menuHTML.push("<option value='select_type'>Select Type</option>");
		menuHTML.push(defaultDirectionsTypeHTML()); 
		menuHTML.push("</select>");
		menuHTML.push("</div>");
		menuHTML.push("<div id='directions_to'>");
		menuHTML.push("<label for='directions_to_type'>To (<span><a href='#' onclick='selectToOnMap()'>Select On Map</a></span>)</label>");
		menuHTML.push("<select class='form-control' id='directions_to_type' name='directions_to_type' onchange='directionsToTypeChange()'>");
		menuHTML.push("<option value='select_type'>Select Type</option>");
		menuHTML.push(defaultDirectionsTypeHTML()); 
		menuHTML.push("</select>");
		menuHTML.push("</div>");
		menuHTML.push("<div class='form-group'>");
		menuHTML.push("<label>Handicap Accessible</label>");
		menuHTML.push("<div class='form-control'>");
		menuHTML.push("<label class='radio-inline'><input id='handicap_yes' type='radio' name='handicap' value='yes' onclick='handicapYes()'>Yes</label>");
		menuHTML.push("<label class='radio-inline'><input id='handicap_no' type='radio' name='handicap' value='no' checked='checked' onclick='handicapNo()'>No</label>");
		menuHTML.push("</div>");
		menuHTML.push("</div>");

		var footerButtonsHTML = [];
		footerButtonsHTML.push("<button type='button' class='btn btn-default btn-block' onclick='findPathSelected()'>Get Directions</button>");
		footerButtonsHTML.push("<button type='button' class='btn btn-default btn-block' onclick='cancelPathfind()'>Cancel</button>");

		$("#dialog_modal .modal-header .close").attr("onclick", "cancelPathfind()");
		$("#dialog_modal .modal-title").toggleClass("text-danger", false);
		$("#dialog_modal .modal-title").text("Get Directions");
		$("#dialog_modal .modal-body").html(menuHTML.join(""));
		$("#dialog_modal .modal-footer").html(footerButtonsHTML.join(""));
	} else if(directionsHTML != null) {
		$("#dialog_modal").html(directionsHTML);
	}

	$('#dialog_modal').modal('toggle');
}

function handicapYes() {
	$("#handicap_yes").attr("checked", true);
	$("#handicap_no").attr("checked", false);
}

function handicapNo() {
	$("#handicap_yes").attr("checked", false);
	$("#handicap_no").attr("checked", true);
}

function directionsFromTypeChange() {
	var html = [];
	if(selectedFromMarkerOnMap != null) {
		html.push("<label for='directions_from_type'>From</label>");
		html.push("<div class='text-primary'>Point selected on map (<span><a href='#' onclick='unselectFromOnMap()'>Unselect point</a></span>)</div>");
	} else {
		html.push("<label for='directions_from_type'>From (<span><a href='#' onclick='selectFromOnMap()'>Select On Map</a></span>)</label>");
		html.push("<select class='form-control' id='directions_from_type' name='directions_from_type' onchange='directionsFromTypeChange()'>");
		var fromType = $("#directions_from_type option:selected").val();
		if(fromType == GlobalStrings.BUILDING) {
			directionsFromType = GlobalStrings.BUILDING;
			
			var buildingSelected = $("#directions_from_building option:selected").val();
			var floorSelected = $("#directions_from_floor option:selected").val();
			var roomSelected = $("#directions_from_room option:selected").val();
			
			html.push(defaultDirectionsTypeHTML(GlobalStrings.BUILDING) + "</select>");
			html.push("<select class='form-control' id='directions_from_building' name='directions_from_building' onchange='directionsFromTypeChange()'>");
			if(buildingSelected === undefined) {
				html.push("<option value='select_building' selected='true'>Select Building</option>");
				buildingShortToLongNameMap.forEach(function(short, long){
					html.push("<option value='"+short+"'>"+long+"</option>");
				});
				html.push("</select>");
			} else {
				buildingShortToLongNameMap.forEach(function(short, long){
					html.push("<option value='"+short+"'"+(buildingSelected==short ? " selected='true'" : "")+">"+long+"</option>");
				});
				html.push("</select>");
				html.push("<select class='form-control' id='directions_from_floor' name='directions_from_floor' onchange='directionsFromTypeChange()'>");
				
				if(directionsFromBuilding != null && buildingSelected != directionsFromBuilding) {
					directionsFromBuilding = buildingSelected;
					directionsFromFloor = null;
					directionsFromRoom = null;
					html.push("<option value='select_floor' selected='true'>Select Floor</option>");
					buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
						html.push("<option id='" + floor + "'>" + floor + "</option>");
					});
				} else {
					directionsFromBuilding = buildingSelected;
					if(floorSelected === undefined) {
						html.push("<option value='select_floor' selected='true'>Select Floor</option>");
						buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
							html.push("<option id='" + floor + "'>" + floor + "</option>");
						});
						html.push("</select>");
					} else {
						buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
							html.push("<option id='" + floor + "'"+(floorSelected == floor ? " selected='true'" : "")+">" + floor + "</option>");
						});
						html.push("</select>");
						
						html.push("<select class='form-control' id='directions_from_room' name='directions_from_room' onchange='directionsFromTypeChange()'>");
						
						if(directionsFromFloor != null && floorSelected != directionsFromFloor) {
							directionsFromFloor = floorSelected;
							directionsFromRoom = null;
							html.push("<option value='select_room' selected='true'>Select Room</option>");
							buildingToRoomNamesMap.get(buildingSelected).get(floorSelected).forEach(function(name) {
								html.push("<option value='" + formatRoomId(buildingSelected, floorSelected, name) + "'>" + name + "</option>");
							});
//							typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
//								if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
//									html.push("<option value='" + markerId + "'>" + getRoomFromRoomId(markerId) + "</option>");
//								}
//							});
							html.push("</select>");
						} else {
							directionsFromFloor = floorSelected;
							
							if(roomSelected === undefined) {
								html.push("<option value='select_room' selected='true'>Select Room</option>");
								buildingToRoomNamesMap.get(buildingSelected).get(floorSelected).forEach(function(name) {
									html.push("<option value='" + formatRoomId(buildingSelected, floorSelected, name) + "'>" + name + "</option>");
								});
//								typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
//									if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
//										html.push("<option value='" + markerId + "'>" + getRoomFromRoomId(markerId) + "</option>");
//									}
//								});
								html.push("</select>");
							} else {
								directionsFromRoom = getRoomFromRoomId(roomSelected);
								buildingToRoomNamesMap.get(buildingSelected).get(floorSelected).forEach(function(name) {
									html.push("<option value='" + formatRoomId(buildingSelected, floorSelected, name) + "'"+(directionsFromRoom == name ? " selected='true'" : "")+">" + name + "</option>");
								});
//								typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
//									if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
//										html.push("<option value='" + markerId + "'"+(directionsFromRoom == getRoomFromRoomId(markerId) ? " selected='true'" : "")+">" + getRoomFromRoomId(markerId) + "</option>");
//									}
//								});
								html.push("</select>");
							}
						}
					}
				}
			}
		} else if(fromType == GlobalStrings.PARKING_LOT) {
			directionsFromType = GlobalStrings.PARKING_LOT;
			directionsFromBuilding = null;
			directionsFromFloor = null;
			directionsFromRoom = null;
			directionsFromParkingLot = null;
			directionsFromDorm = null;
			directionsFromMisc = null;
			html.push(defaultDirectionsTypeHTML(GlobalStrings.PARKING_LOT) + "</select>");
			var parkingLotSelected = $("#directions_from_parking_lot option:selected").val();
			html.push("<select class='form-control' id='directions_from_parking_lot' name='directions_from_parking_lot' onchange='directionsFromTypeChange()'>");
			if(parkingLotSelected === undefined) {
				html.push("<option value='select_parking_lot' selected='true'>Select Parking Lot</option>");
				getMarkerMapForType(GlobalStrings.PARKING_LOT).forEach(function(markerId, marker){
					html.push("<option value='"+markerId+"'>"+getParkingLotFromId(markerId)+"</option>");
				});
				html.push("</select>");
			} else {
				getMarkerMapForType(GlobalStrings.PARKING_LOT).forEach(function(markerId, marker){
					html.push("<option value='"+markerId+"'"+(parkingLotSelected==markerId ? " selected='true'" : "")+">"+getParkingLotFromId(markerId)+"</option>");
				});
				html.push("</select>");
			}
		} else if(fromType == GlobalStrings.DORM) {
			directionsFromType = GlobalStrings.DORM;
			directionsFromBuilding = null;
			directionsFromFloor = null;
			directionsFromRoom = null;
			directionsFromParkingLot = null;
			directionsFromDorm = null;
			directionsFromMisc = null;
			html.push(defaultDirectionsTypeHTML(GlobalStrings.DORM) + "</select>");
		} else if(fromType == GlobalStrings.MISC) {
			directionsFromType = GlobalStrings.MISC;
			directionsFromBuilding = null;
			directionsFromFloor = null;
			directionsFromRoom = null;
			directionsFromParkingLot = null;
			directionsFromDorm = null;
			directionsFromMisc = null;
			html.push(defaultDirectionsTypeHTML(GlobalStrings.MISC) + "</select>");
		} else {
			html.push("<option value='select_type'>Select Type</option>");
			html.push(defaultDirectionsTypeHTML()); 
			html.push("</select>");
		}
	}
	
	$("#directions_from").html(html.join(""));
}

function directionsToTypeChange() {
	var html = [];
	if(selectedToMarkerOnMap != null) {
		html.push("<label for='directions_to_type'>To</label>");
		html.push("<div class='text-primary'>Point selected on map (<span><a href='#' onclick='unselectToOnMap()'>Unselect point</a></span>)</div>");
	} else {
		html.push("<label for='directions_to_type'>To (<span><a href='#' onclick='selectToOnMap()'>Select On Map</a></span>)</label>");
		html.push("<select class='form-control' id='directions_to_type' name='directions_to_type' onchange='directionsToTypeChange()'>");
		var toType = $("#directions_to_type option:selected").val();
		if(toType == GlobalStrings.BUILDING) {
			directionsToType = GlobalStrings.BUILDING;
			var buildingSelected = $("#directions_to_building option:selected").val();
			var floorSelected = $("#directions_to_floor option:selected").val();
			var roomSelected = $("#directions_to_room option:selected").val();
			
			html.push(defaultDirectionsTypeHTML(GlobalStrings.BUILDING) + "</select>");
			html.push("<select class='form-control' id='directions_to_building' name='directions_to_building' onchange='directionsToTypeChange()'>");
			if(buildingSelected === undefined) {
				html.push("<option value='select_building' selected='true'>Select Building</option>");
				buildingShortToLongNameMap.forEach(function(short, long){
					html.push("<option value='"+short+"'>"+long+"</option>");
				});
				html.push("</select>");
			} else {
				buildingShortToLongNameMap.forEach(function(short, long){
					html.push("<option value='"+short+"'"+(buildingSelected==short ? " selected='true'" : "")+">"+long+"</option>");
				});
				html.push("</select>");
				html.push("<select class='form-control' id='directions_to_floor' name='directions_to_floor' onchange='directionsToTypeChange()'>");
				
				if(directionsToBuilding != null && buildingSelected != directionsToBuilding) {
					directionsToBuilding = buildingSelected;
					directionsToFloor = null;
					directionsToRoom = null;
					html.push("<option value='select_floor' selected='true'>Select Floor (optional)</option>");
					buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
						html.push("<option id='" + floor + "'>" + floor + "</option>");
					});
				} else {
					directionsToBuilding = buildingSelected;
					if(floorSelected === undefined) {
						html.push("<option value='select_floor' selected='true'>Select Floor (optional)</option>");
						buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
							html.push("<option id='" + floor + "'>" + floor + "</option>");
						});
						html.push("</select>");
					} else {
						buildingToFloorIdsMap.get(buildingSelected).forEach(function(floor) {
							html.push("<option id='" + floor + "'"+(floorSelected == floor ? " selected='true'" : "")+">" + floor + "</option>");
						});
						html.push("</select>");
						
						html.push("<select class='form-control' id='directions_to_room' name='directions_to_room' onchange='directionsToTypeChange()'>");
						
						if(directionsToFloor != null && floorSelected != directionsToFloor) {
							directionsToFloor = floorSelected;
							directionsToRoom = null;
							
							html.push("<option value='select_room' selected='true'>Select Room</option>");
							buildingToRoomNamesMap.get(buildingSelected).get(floorSelected).forEach(function(name) {
								html.push("<option value='" + formatRoomId(buildingSelected, floorSelected, name) + "'>" + name + "</option>");
							});
//							typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
//								if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
//									html.push("<option value='" + markerId + "'>" + getRoomFromRoomId(markerId) + "</option>");
//								}
//							});
							html.push("</select>");
						} else {
							directionsToFloor = floorSelected;
							
							if(roomSelected === undefined) {
								html.push("<option value='select_room' selected='true'>Select Room</option>");
								buildingToRoomNamesMap.get(buildingSelected).get(floorSelected).forEach(function(name) {
									html.push("<option value='" + formatRoomId(buildingSelected, floorSelected, name) + "'>" + name + "</option>");
								});
//								typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
//									if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
//										html.push("<option value='" + markerId + "'>" + getRoomFromRoomId(markerId) + "</option>");
//									}
//								});
								html.push("</select>");
							} else {
								directionsToRoom = getRoomFromRoomId(roomSelected);
								buildingToRoomNamesMap.get(buildingSelected).get(floorSelected).forEach(function(name) {
									html.push("<option value='" + formatRoomId(buildingSelected, floorSelected, name) + "'"+(directionsFromRoom == name ? " selected='true'" : "")+">" + name + "</option>");
								});
//								typeToMarkerMap.get(GlobalStrings.ROOM).forEach(function(markerId, marker){
//									if(marker.data(GlobalStrings.BUILDING) == buildingSelected && marker.data(GlobalStrings.FLOOR) == floorSelected){
//										html.push("<option value='" + markerId + "'"+(directionsToRoom == getRoomFromRoomId(markerId) ? " selected='true'" : "")+">" + getRoomFromRoomId(markerId) + "</option>");
//									}
//								});
								html.push("</select>");
							}
						}
					}
				}
			}
		} else if(toType == GlobalStrings.PARKING_LOT) {
			directionsToType = GlobalStrings.PARKING_LOT;
			directionsToBuilding = null;
			directionsToFloor = null;
			directionsToRoom = null;
			directionsToParkingLot = null;
			directionsToDorm = null;
			directionsToMisc = null;
			html.push(defaultDirectionsTypeHTML(GlobalStrings.PARKING_LOT) + "</select>");
			var parkingLotSelected = $("#directions_to_parking_lot option:selected").val();
			html.push("<select class='form-control' id='directions_to_parking_lot' name='directions_to_parking_lot' onchange='directionsToTypeChange()'>");
			if(parkingLotSelected === undefined) {
				html.push("<option value='select_parking_lot' selected='true'>Select Parking Lot</option>");
				getMarkerMapForType(GlobalStrings.PARKING_LOT).forEach(function(markerId, marker){
					html.push("<option value='"+markerId+"'>"+getParkingLotFromId(markerId)+"</option>");
				});
				html.push("</select>");
			} else {
				getMarkerMapForType(GlobalStrings.PARKING_LOT).forEach(function(markerId, marker){
					html.push("<option value='"+markerId+"'"+(parkingLotSelected==markerId ? " selected='true'" : "")+">"+getParkingLotFromId(markerId)+"</option>");
				});
				html.push("</select>");
			}
		} else if(toType == GlobalStrings.DORM) {
			directionsToType = GlobalStrings.DORM;
			directionsToBuilding = null;
			directionsToFloor = null;
			directionsToRoom = null;
			directionsToParkingLot = null;
			directionsToDorm = null;
			directionsToMisc = null;
			html.push(defaultDirectionsTypeHTML(GlobalStrings.DORM) + "</select>");
		} else if(toType == GlobalStrings.MISC) {
			directionsToType = GlobalStrings.MISC;
			directionsToBuilding = null;
			directionsToFloor = null;
			directionsToRoom = null;
			directionsToParkingLot = null;
			directionsToDorm = null;
			directionsToMisc = null;
			html.push(defaultDirectionsTypeHTML(GlobalStrings.MISC) + "</select>");
		} else {
			html.push("<option value='select_type'>Select Type</option>");
			html.push(defaultDirectionsTypeHTML()); 
			html.push("</select>");
		}
	}
	$("#directions_to").html(html.join(""));
}

function findPathSelected() {
	if(directionsParamsValid()) {
		$("#change_building_floor_popover").attr("disabled", true);
		$("#get_directions_button").css("display", "none");
		$("#exit_directions_button").css("display", "block");
		
		var handicap = $("#handicap_yes").is(":checked");
		showingPath = true;
		var fromMarker;
		var dirFromType = directionsFromType;
		var dirToType = directionsToType;
		if(selectedFromMarkerOnMap != null) {
			fromMarker = selectedFromMarkerOnMap;
		} else if(dirFromType == GlobalStrings.BUILDING){
			fromMarker = getMarkerFromId(formatRoomId(directionsFromBuilding, directionsFromFloor, directionsFromRoom));
		} else if(dirFromType == GlobalStrings.DORM) {
			fromMarker = getMarkerFromId(formatDormId(directionsFromDorm));
		} else if(dirFromType == GlobalStrings.PARKING_LOT) {
			fromMarker = getMarkerFromId(formatParkingLotId(directionsFromParkingLot));
		} else if(dirFromType == GlobalStrings.MISC) {
			fromMarker = getMarkerFromId(formatMiscId(directionsFromMisc));
		}
		
		if(fromMarker != null) {
			if(selectedToMarkerOnMap != null) {
				findPath(fromMarker.data(GlobalStrings.ID), selectedToMarkerOnMap.data(GlobalStrings.ID), handicap);
			} else if (dirToType == GlobalStrings.CLOSEST_BATHROOM_MENS || dirToType == GlobalStrings.CLOSEST_BATHROOM_WOMENS) {
				var closestBathroom;
				if(dirToType == GlobalStrings.CLOSEST_BATHROOM_MENS) {
					closestBathroom = getClosestBathroomMens(fromMarker);
				} else if(dirToType == GlobalStrings.CLOSEST_BATHROOM_WOMENS){
					closestBathroom = getClosestBathroomWomens(fromMarker);
				}
				
				if (closestBathroom != null) {
					findPath(fromMarker.data(GlobalStrings.ID), closestBathroom.data(GlobalStrings.ID));
				} else {
					LOG.error("Cannot find closest bathroom. The result was null!");
				}
			} else if (dirToType == GlobalStrings.BUILDING) {
				if(directionsToFloor == null) {
					// Find directions to the building
					var path;
					if(handicap) {
						path = getPathToBuilding(handicapGraph, fromMarker.data(GlobalStrings.ID), directionsToBuilding);
					} else {
						path = getPathToBuilding(nonHandicapGraph, fromMarker.data(GlobalStrings.ID), directionsToBuilding);
					}
					findPath(path[0], path[path.length - 1], handicap);
				} else {
					// Find directions to the specific room
					findPath(fromMarker.data(GlobalStrings.ID), formatRoomId(directionsToBuilding, directionsToFloor, directionsToRoom), handicap);
				}
			} else if(dirToType == GlobalStrings.DORM) {
				findPath(fromMarker.data(GlobalStrings.ID), formatDormId(directionsToDorm), handicap);
			} else if(dirToType == GlobalStrings.PARKING_LOT) {
				findPath(fromMarker.data(GlobalStrings.ID), formatParkingLotId(directionsToParkingLot), handicap);
			} else if(dirToType == GlobalStrings.MISC) {
				findPath(fromMarker.data(GlobalStrings.ID), formatMiscId(directionsToMisc), handicap);
			} else {
				LOG.error("Invalid directionsToType: " + dirToType);
			}
		} else {
			LOG.error("Cannot find directions. The 'from' marker is null!");
		}
		
		cancelPathfind();
	}
}

function findPath(marker1ID, marker2ID, handicap) {
	LOG.debug("Finding path from " + marker1ID + " to " + marker2ID + ". handicap: " + handicap);
	var start = now();
	var path;
	if(handicap == null || !handicap) {
		path = getShortestPath(nonHandicapGraph, marker1ID, marker2ID);
	} else {
		path = getShortestPath(handicapGraph, marker1ID, marker2ID);
	}
	directionsPathArray = path;
	directionsPathArrayPosition = -1;
	
	var buildingAndFloorsToLoad = new buckets.Dictionary();
	for(var i = 0, len = path.length; i < len; i++) {
		var pathId = path[i];
		var bldg = getBuildingFromId(pathId);
		if(bldg != "") {
			var flrSet = buildingAndFloorsToLoad.get(bldg);
			if(flrSet == null) {
				flrSet = new buckets.Set();
			}
			flrSet.add(getFloorFromId(pathId));
			buildingAndFloorsToLoad.set(bldg, flrSet);
		}
	}
	
	buildingAndFloorsToLoad.forEach(function(building, floorSet){
		floorSet.forEach(function(floor){
			loadMarkersForBuildingAndFloor(building, floor);
		});
	});
	
	directionsPathArray = extractDirections(path);
	
	if($(window).width() <= 768) {
		var height = $("#navbar").height() * 2;
		$("#directions_display_mobile").css({width: $(window).width(), height: height, display: "table-cell"});
		$("#directions_text").css({height: height, "line-height": height + "px"});
		$("#directions_left").css({height: height});
		$("#directions_right").css({height: height});
		$("#navbar").css("display", "none");
		$("#mobile_control_buttons").css("display", "none");
		$("#mobile_directions_buttons").css("display", "block");
	} else {
		$("#directions_display_desktop").css({width: "25%", height: $("#raphael").height() - 10, display: "block"});
		$("#directions_display_desktop").html("");
		$("#directions_display_desktop").append('<ul id="directions_display_list" class="list-group"></ul>');
		$("#directions_display_list").append('<li class="list-group-item">Directions</li>');
		
		for(var i = 0, len = directionsPathArray.length; i < len; i++) {
			$("#directions_display_list").append('<li id="directions_step_'+i+'" class="list-group-item hover-color" onclick="showDirectionsForStep('+i+')">' + directionsPathArray[i].direction + '</li>');
		}
		$("#directions_step_0").addClass("selected_direction");	
	}
	
	var allPathIds = [];
	for(var i = 0, len = directionsPathArray.length; i < len; i++) {
		var pathIds = directionsPathArray[i].pathIds;
		for(var j = 0, l = pathIds.length; j < l; j++) {
			allPathIds.push(pathIds[j]);
		}
	}
	
	if(directionsPathArray.length > 1 || directionsPathArray[0].pathIds.length > 0) {
		pathMap.forEach(function(pathString, path) {
			path.element.stop();
			path.element.attr({
				fill: "black",
				stroke: "black"
			});
			path.element.hide();
		});
		
		var displayablePath = new buckets.Dictionary();
		for (var i = 0, pathLength = path.length; i < pathLength; i++) {
			if (i < path.length - 1) {
				var pathObject = pathMap.get(path[i] + "<->" + path[i + 1]);
				if (pathObject == null) {
					pathObject = pathMap.get(path[i + 1] + "<->" + path[i]);
				}
				var pathElement = pathObject.element;

				if (pathElement != null) {
					pathElement.show().toFront();
				}
			}
		}
		zoomInOnPaths(allPathIds);
		showNextDirections();
	}
	
	LOG.trace("Took " + (now() - start) + " ms to find and show path from " + marker1ID + " to " + marker2ID);
}

function showDirectionsForStep(step) {
	var pathArray = directionsPathArray;
	var pathArrayPosition = directionsPathArrayPosition;
	LOG.trace("Showing directions for step " + step + " of " + (pathArray.length-1));
	if(step >= 0 && step < pathArray.length) {
		if(pathArrayPosition >= 0) {
			// Hide all showing paths
			var pathObj = pathArray[pathArrayPosition];
			var pathIds = pathObj.pathIds;
			for(var i = 0, len = pathIds.length; i < len; i++) {
				var currentDisplayedPath = pathMap.get(pathIds[i]);
				var currentDisplayedPathElement = currentDisplayedPath.element;
				currentDisplayedPathElement.attr({
					fill: "black",
					stroke: "black"
				});
			}
		}
		$("#directions_step_"+pathArrayPosition).removeClass("selected_direction");
		
		pathArrayPosition = step;
		
		var animation = Raphael.animation({
			fill: "red",
			stroke: "red"
		}, 1000, "<>").repeat(Infinity);
		
		var pathObj = pathArray[pathArrayPosition];
		var pathIds = pathObj.pathIds;
		for(var i = 0, len = pathIds.length; i < len; i++) {
			var newDisplayedPath = pathMap.get(pathIds[i]);
			var newDisplayedPathElement = newDisplayedPath.element;
			newDisplayedPathElement.attr({fill: "red", stroke: "red"});
		}
		
		var floor = getFloorFromId(pathMap.get(pathIds[pathIds.length-1]).marker2Data.id);
		console.log("Current floor: " + currentFloor + " vs " + floor);
		if(floor != "" && floor != currentFloor) {
			currentFloor = floor;
			showShapesForCurrentBuildingAndFloor();
			
			var allPathIds = [];
			for(var i = 0, len = directionsPathArray.length; i < len; i++) {
				var pathIds = directionsPathArray[i].pathIds;
				for(var j = 0, l = pathIds.length; j < l; j++) {
					allPathIds.push(pathIds[j]);
				}
			}
			
			zoomInOnPaths(allPathIds);
		}
		
		resizeToShowPaths(pathIds);
		
		directionsPathArrayPosition = pathArrayPosition;
		
		$("#directions_step_"+pathArrayPosition).addClass("selected_direction");
		
		$("#directions_text").html(pathObj.direction);
	}
}

function showNextDirections() {
	var temp = directionsPathArrayPosition;
	if(temp == null) {
		temp = 0;
	} else {
		temp++;
	}
	showDirectionsForStep(temp);
}

function showPreviousDirections() {
	var temp = directionsPathArrayPosition;
	if(temp == null) {
		temp = 0;
	} else {
		temp--;
	}
	showDirectionsForStep(temp);
}

function exitDirections() {
	selectingFromOnMap = false;
	if(selectedFromMarkerOnMap != null) {
		selectedFromMarkerOnMap.hide();
		selectedFromMarkerOnMap = null;
	}
	selectingToOnMap = false;
	if(selectedToMarkerOnMap != null) {
		selectedToMarkerOnMap.hide();
		selectedToMarkerOnMap = null;
	}
	ignoreClick = false;
	gettingDirections = false;
	directionsHTML = null;
	
	var pathArray = directionsPathArray;
	for(var i = 0, arrLen = pathArray.length; i < arrLen; i++) {
		var pathIds = pathArray[i].pathIds;
		for(var j = 0, idsLen = pathIds.length; j < idsLen; j++) {
			var currentDisplayedPath = pathMap.get(pathIds[j]);
			var currentDisplayedPathElement = currentDisplayedPath.element;
			currentDisplayedPathElement.attr({
				fill: "black",
				stroke: "black"
			});
			currentDisplayedPathElement.hide();
		}
	}
	
	directionsPathArray = null;
	directionsPathArrayPosition = null;
	
	if($(window).width() <= 768) {
		$("#mobile_directions_buttons").css("display", "none");
		$("#mobile_control_buttons").css("display", "block");
		$("#navbar").css("display", "block");
		$("#directions_display_mobile").css("display", "none");
		$("#directions_text").html("");
	}
	
	resetRaphaelSize();
	
	$("#change_building_floor_popover").attr("disabled", false);
	$("#exit_directions_button").css("display", "none");
	$("#get_directions_button").css("display", "block");
	$("#directions_display_desktop").css("display", "none");
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
	if(selectedFromMarkerOnMap == null) {
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
	if(selectedToMarkerOnMap == null) {
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
	}
	
	if(errorMsg != null) {
		$("#directions_to").prepend("<div id='directions_to_error' class='text-danger'>"+errorMsg+"</div>");
		return false;
	}
	return true;
}

function defaultDirectionsTypeHTML(selectedType) {
	var html = [];
	html.push("<option value='"+GlobalStrings.BUILDING+"' "+(selectedType == GlobalStrings.BUILDING ? "selected='true'" : "")+">"+GlobalStrings.BUILDING_DISPLAY+"</option>");
	html.push("<option value='"+GlobalStrings.DORM+"' "+(selectedType == GlobalStrings.DORM ? "selected='true'" : "")+">"+GlobalStrings.DORM_DISPLAY+"</option>");
	html.push("<option value='"+GlobalStrings.PARKING_LOT+"' "+(selectedType == GlobalStrings.PARKING_LOT ? "selected='true'" : "")+">"+GlobalStrings.PARKING_LOT_DISPLAY+"</option>");
	html.push("<option value='"+GlobalStrings.MISC+"' "+(selectedType == GlobalStrings.MISC ? "selected='true'" : "")+">"+GlobalStrings.MISC_DISPLAY+"</option>");
	return html.join("");
}

function selectFromOnMap() {
	$('#dialog_modal').modal('toggle');
	selectingFromOnMap = true;
}

function selectToOnMap() {
	$('#dialog_modal').modal('toggle');
	selectingToOnMap = true;
}

function cancelPathfind() {
	selectingFromOnMap = false;
	if(selectedFromMarkerOnMap != null) {
		selectedFromMarkerOnMap.hide();
		selectedFromMarkerOnMap = null;
	}
	selectingToOnMap = false;
	if(selectedToMarkerOnMap != null) {
		selectedToMarkerOnMap.hide();
		selectedToMarkerOnMap = null;
	}
	ignoreClick = false;
	gettingDirections = false;
	directionsHTML = null;
	$('#dialog_modal').modal('toggle');
}

function showLoading() {
	$("#shield").css({width: $("#view").width(), "height": $("#view").height(), display: "block"});
	$("#loading").css("display", "block");
}

function showRaphael() {
	$("#loading").css("display", "none");
	$("#shield").css("display", "none");
	$("#raphael").css("display", "block");
	if($(window).width() <= 768) {
		$("#mobile_controls").css("display", "block");			
	}
}

function resizeToShowPaths(pathIds) {
	var upperLeftX = 999999;
	var upperLeftY = 999999;
	for(var i = 0, len = pathIds.length; i < len; i++) {
		var path = pathMap.get(pathIds[i]);
		path.element.toFront();
		var bbox = Raphael.pathBBox(path.element.attrs.path);
		if(bbox.x < upperLeftX) {
			upperLeftX = bbox.x;
		}
		if(bbox.y < upperLeftY) {
			upperLeftY = bbox.y;
		}
	}
	
	paperShiftX = upperLeftX - (paperWidth/2);
	paperShiftY = upperLeftY - (paperHeight/2);

	paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);
}

function zoomInOnPaths(pathIds) {
	var lowerLeftY = -999999;
	for(var i = 0, len = pathIds.length; i < len; i++) {
		var path = pathMap.get(pathIds[i]);
		var bbox = Raphael.pathBBox(path.element.attrs.path);
		if(bbox.y2 > lowerLeftY) {
			lowerLeftY = bbox.y2;
		}
	}
	
	var oldPaperWidth = paperWidth;
	var xyRatio = oldPaperWidth/paperHeight;
	var yDist = (lowerLeftY)-(paperShiftY+paperHeight);
	paperWidth += xyRatio*yDist;
	paperHeight += yDist;
	
	paperResizeRatio *= (paperWidth/oldPaperWidth);

	paper.setViewBox(paperShiftX, paperShiftY, paperWidth, paperHeight, true);
}

function unselectFromOnMap() {
	if(selectedFromMarkerOnMap != null) {
		selectedFromMarkerOnMap.hide();
		selectedFromMarkerOnMap = null;
	}
	
	directionsFromTypeChange();
}

function unselectToOnMap() {
	if(selectedToMarkerOnMap != null) {
		selectedToMarkerOnMap.hide();
		selectedToMarkerOnMap = null;
	}
	
	directionsToTypeChange();
}

function alertDialog(alertText) {
	$("#dialog_modal .modal-title").toggleClass("text-danger", true);
	$("#dialog_modal .modal-title").text("Alert");
	$("#dialog_modal .modal-body").html("<b>" + alertText + "</b>");
	$("#dialog_modal .modal-footer").html("<button type='button' class='btn btn-default' data-dismiss='modal'>Ok</button>");
	$('#dialog_modal').modal('toggle');
}
