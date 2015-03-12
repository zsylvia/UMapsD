function convertMarkersAndPathsToJson(roomMap, doorMap, hallwayMap, pathwayMap, stairMap, elevatorMap, bathroomMensMap, bathroomWomensMap, pathMap) {
	var idsOfAddedMarkers = new buckets.Dictionary();

	var graphJSON = "{";

	// Make array of all paths
	graphJSON += "\"paths\":[";

	var firstPath = true;
	pathMap.values().forEach(function(path) {
		if (firstPath) {
			firstPath = false;
		} else {
			graphJSON += ",";
		}

		graphJSON += "{";

		graphJSON += "\"m1\":";
		graphJSON += "{";
		graphJSON += "\"id\":\"" + path.marker1Data.id + "\"";
		if (idsOfAddedMarkers.set(path.marker1Data.id, "") == null) {
			graphJSON += ",\"x\":" + path.marker1Data.cx + ",";
			graphJSON += "\"y\":" + path.marker1Data.cy;
		}
		graphJSON += "},";

		graphJSON += "\"m2\":";
		graphJSON += "{";
		graphJSON += "\"id\":\"" + path.marker2Data.id + "\"";
		if (idsOfAddedMarkers.set(path.marker2Data.id, "") == null) {
			graphJSON += ",\"x\":" + path.marker2Data.cx + ",";
			graphJSON += "\"y\":" + path.marker2Data.cy;
		}
		graphJSON += "},";

		graphJSON += "\"d\":" + path.distance;
		graphJSON += "}";
	});

	graphJSON += "],";

	// Make array of all markers that weren't added from the path set
	graphJSON += "\"markers\":[";

	var allMarkersQueue = new buckets.Queue();
	var firstMarker = true;
	roomMap.values().forEach(function(marker) {
		allMarkersQueue.enqueue(marker);
	});

	doorMap.values().forEach(function(marker) {
		allMarkersQueue.enqueue(marker);
	});

	hallwayMap.values().forEach(function(marker) {
		allMarkersQueue.enqueue(marker);
	});

	pathwayMap.values().forEach(function(marker) {
		allMarkersQueue.enqueue(marker);
	});

	stairMap.values().forEach(function(marker) {
		allMarkersQueue.enqueue(marker);
	});

	elevatorMap.values().forEach(function(marker) {
		allMarkersQueue.enqueue(marker);
	});

	bathroomMensMap.values().forEach(function(marker) {
		allMarkersQueue.enqueue(marker);
	});

	bathroomWomensMap.values().forEach(function(marker) {
		allMarkersQueue.enqueue(marker);
	});

	var firstMarker = true;
	while (!allMarkersQueue.isEmpty()) {
		var marker = allMarkersQueue.dequeue();
		if (idsOfAddedMarkers.set(marker.data(GlobalStrings.ID), "") == null) {
			if (firstMarker) {
				firstMarker = false;
			} else {
				graphJSON += ",";
			}

			graphJSON += "{";
			graphJSON += "\"id\":\"" + marker.data(GlobalStrings.ID) + "\",";
			graphJSON += "\"x\":" + marker.attr("cx") + ",";
			graphJSON += "\"y\":" + marker.attr("cy");
			graphJSON += "}";
		}
	}
	
	graphJSON += "]}";

	return graphJSON;
}

function createAllMarkersFromJson(json, paper) {
	var markerMap = new buckets.Dictionary();

	if (json != null && json != "" && paper != null) {
		var obj = $.parseJSON(json);
		if (obj.markers != null) {
			var markerSizeToUse = 8;
			try {
				// If a markerSize is defined by another js file, use that instead
				markerSizeToUse = markerSize;
			} catch (err) {
				if (err.name == "ReferenceError") {
					// Ignore...
				} else {
					console.error(err.stack);
				}
			}

			var getMarkerColorFromType = function(type) {
				var defaultRoomColor = "red";
				var defaultDoorColor = "blue";
				var defaultHallwayColor = "orange";
				var defaultPathwayColor = "green";
				var defaultStairColor = "purple";
				var defaultElevatorColor = "yellow";
				var defaultBathroomMensColor = "cyan";
				var defaultBathroomWomensColor = "pink";

				if (type == GlobalStrings.ROOM) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultRoomColor;
				} else if (type == GlobalStrings.DOOR) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultDoorColor;
				} else if (type == GlobalStrings.HALLWAY) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultHallwayColor;
				} else if (type == GlobalStrings.PATHWAY) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultPathwayColor;
				} else if (type == GlobalStrings.STAIR) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultStairColor;
				} else if (type == GlobalStrings.ELEVATOR) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultElevatorColor;
				} else if (type == GlobalStrings.BATHROOM_MENS) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultBathroomMensColor;
				} else if (type == GlobalStrings.BATHROOM_WOMENS) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultBathroomWomensColor;
				} else {
					return "black";
				}
			}

			var isMarkerColorDefinedForType = function(type) {
				var dummy;
				try {
					dummy = markerTypeToColorMap.get(type);
					if (dummy == null) {
						return false;
					}
				} catch (err) {
					return false;
				}

				return true;
			}
			
			var getTypeFromId = function(id) {
				if(id.search("pathway") == -1) {
					var parts = id.split("_");
					if(parts[0] == "bldg") {
						if(parts[2] == "flr") {
							var type;
							switch(parts[4]) {
							case "rm":
								type = GlobalStrings.ROOM;
								break;
							case "dr":
								type = GlobalStrings.DOOR;
								break;
							case "hw":
								type = GlobalStrings.HALLWAY;
								break;
							case "st":
								type = GlobalStrings.STAIR;
								break;
							case "el":
								type = GlobalStrings.ELEVATOR;
								break;
							case "bathroom":
								if(parts[5] == "mens") {
									type = GlobalStrings.BATHROOM_MENS;
								} else {
									type = GlobalStrings.BATHROOM_WOMENS;
								}
								break;
							}
						}
					}
				} else {
					return GlobalStrings.PATHWAY;
				}
			}
			
			var getBuildingFromId = function(id) {
				if(id.search("pathway") == -1) {
					var parts = id.split("_");
					if(parts[0] == "bldg") {
						return parts[1];
					}
				} else {
					return "";
				}
			}
			
			var getFloorFromId = function(id) {
				if(id.search("pathway") == -1) {
					var parts = id.split("_");
					if(parts[0] == "bldg") {
						if(parts[2] == "flr") {
							return parts[3];
						}
					}
				} else {
 					return "";
				}
			}
			
			

			obj.markers.forEach(function(markerData) {
				var type = getTypeFromId(markerData.id);
				var marker = paper.circle(markerData.x, markerData.y, markerSizeToUse).attr({
					fill: getMarkerColorFromType(type),
				});

				marker.data(GlobalStrings.ID, markerData.id);
				marker.data(GlobalStrings.TYPE, type);
				if (type != GlobalStrings.PATHWAY) {
					marker.data(GlobalStrings.BUILDING, getBuildingFromId(markerData.id));
					marker.data(GlobalStrings.FLOOR, getFloorFromId(markerData.id));
				}
				markerMap.set(marker.data(GlobalStrings.ID), marker);
			});
		}
	}

	return markerMap;
}

function createAllPathsFromJson(json, paper) {
	var pathMap = new buckets.Dictionary();
	if (json != null && json != "" && paper != null) {
		var obj = $.parseJSON(json);
		if (obj.paths != null) {
			var pathStrokeWidthToUse = 4;
			try {
				// If a pathStrokeWidth is defined by another js file, use that instead
				pathStrokeWidthToUse = pathStrokeWidth;
			} catch (err) {
				if (err.name == "ReferenceError") {
					// Ignore...
				} else {
					console.error(err.stack);
				}
			}

			var Path = function(element, marker1Data, marker2Data, distance) {
				this.element = element;
				this.marker1Data = marker1Data;
				this.marker2Data = marker2Data;
				this.distance = distance;

				this.toString = function() {
					return marker1Data.id + "<->" + marker2Data.id;
				}
			}

			var MarkerData = function(cx, cy, id, type, building, floor) {
				this.cx = cx;
				this.cy = cy;
				this.id = id;
				this.type = type;
				this.building = building;
				this.floor = floor;
			}
			
			var getTypeFromId = function(id) {
				if(id.search("pathway") == -1) {
					var parts = id.split("_");
					if(parts[0] == "bldg") {
						if(parts[2] == "flr") {
							var type;
							switch(parts[4]) {
							case "rm":
								type = GlobalStrings.ROOM;
								break;
							case "dr":
								type = GlobalStrings.DOOR;
								break;
							case "hw":
								type = GlobalStrings.HALLWAY;
								break;
							case "st":
								type = GlobalStrings.STAIR;
								break;
							case "el":
								type = GlobalStrings.ELEVATOR;
								break;
							case "bathroom":
								if(parts[5] == "mens") {
									type = GlobalStrings.BATHROOM_MENS;
								} else {
									type = GlobalStrings.BATHROOM_WOMENS;
								}
								break;
							}
							return type;
						}
					}
				} else {
					return GlobalStrings.PATHWAY;
				}
			}
			
			var getBuildingFromId = function(id) {
				if(id.search("pathway") == -1) {
					var parts = id.split("_");
					if(parts[0] == "bldg") {
						return parts[1];
					}
				} else {
					return "";
				}
			}
			
			var getFloorFromId = function(id) {
				if(id.search("pathway") == -1) {
					var parts = id.split("_");
					if(parts[0] == "bldg") {
						if(parts[2] == "flr") {
							return parts[3];
						}
					}
				} else {
 					return "";
				}
			}

			var makePath = function(marker1Data, marker2Data, distance, paper) {
				var path = paper.path("M" + marker1Data.cx + " " + marker1Data.cy + "L" + marker2Data.cx + " " + marker2Data.cy);
				path.toBack();
				path.attr("stroke-width", pathStrokeWidthToUse);
				var pathObject = new Path(path, marker1Data, marker2Data, distance);

				return pathObject;
			}

			var getMarkerData = function(jsonObj, markerId) {
				var markerData;
				var markerDataSet = false;
				jsonObj.paths.forEach(function(path) {
					if (!markerDataSet) {
						if(path.m1.id == markerId){
							var type = getTypeFromId(path.m1.id);
							if (type == GlobalStrings.PATHWAY) {
								markerData = new MarkerData(path.m1.x, path.m1.y, path.m1.id, type);
							} else {
								markerData = new MarkerData(path.m1.x, path.m1.y, path.m1.id, type, getBuildingFromId(path.m1.id), getFloorFromId(path.m1.id));
							}
							markerDataSet = true;
						} else if(path.m2.id == markerId) {
							var type = getTypeFromId(path.m2.id);
							if (type == GlobalStrings.PATHWAY) {
								markerData = new MarkerData(path.m2.x, path.m2.y, path.m2.id, type);
							} else {
								markerData = new MarkerData(path.m2.x, path.m2.y, path.m2.id, type, getBuildingFromId(path.m2.id), getFloorFromId(path.m2.id));
							}
							markerDataSet = true;
						}

					}
				});

				return markerData;
			}

			obj.paths.forEach(function(pathData) {
				var path = makePath(getMarkerData(obj, pathData.m1.id), getMarkerData(obj, pathData.m2.id), pathData.d, paper);
				pathMap.set(path.toString(), path);
			});
		}
	}

	return pathMap;
}
