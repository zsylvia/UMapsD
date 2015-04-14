function RDPGraph() {
	this.paths = [];
	this.markers = [];
}

function Path(m1, m2, d) {
	this.m1 = m1;
	this.m2 = m2;
	this.d = d;
}

function Marker(id, x, y) {
	this.id = id;
	this.x = x;
	this.y = y;
}

function convertMarkersAndPathsToJson(allMarkers, pathMap) {
	var idsOfAddedMarkers = new buckets.Dictionary();
	
	var rdpGraph = new RDPGraph();

	var graphJSON = "{";

	// Make array of all paths
	graphJSON += "\"paths\":[";

	var firstPath = true;
	pathMap.values().forEach(function(path) {
		var m1 = new Marker();
		var m2 = new Marker();
		if (firstPath) {
			firstPath = false;
		} else {
			graphJSON += ",";
		}

		graphJSON += "{";

		graphJSON += "\"m1\":";
		graphJSON += "{";
		graphJSON += "\"id\":\"" + path.marker1Data.id + "\"";
		m1.id = path.marker1Data.id;
		if (idsOfAddedMarkers.set(path.marker1Data.id, "") == null) {
			m1.x = path.marker1Data.cx;
			m1.y = path.marker1Data.cy;
			graphJSON += ",\"x\":" + Math.floor(path.marker1Data.cx) + ",";
			graphJSON += "\"y\":" + Math.floor(path.marker1Data.cy);
		}
		graphJSON += "},";

		graphJSON += "\"m2\":";
		graphJSON += "{";
		graphJSON += "\"id\":\"" + path.marker2Data.id + "\"";
		m2.id = path.marker2Data.id;
		if (idsOfAddedMarkers.set(path.marker2Data.id, "") == null) {
			m2.x = path.marker2Data.cx;
			m2.y = path.marker2Data.cy;
			graphJSON += ",\"x\":" + Math.floor(path.marker2Data.cx) + ",";
			graphJSON += "\"y\":" + Math.floor(path.marker2Data.cy);
		}
		graphJSON += "},";
		
		rdpGraph.paths[rdpGraph.paths.length] = new Path(m1,m2,path.distance);
		graphJSON += "\"d\":" + path.distance;
		graphJSON += "}";
	});

	graphJSON += "],";

	// Make array of all markers that weren't added from the path set
	graphJSON += "\"markers\":[";

	var allMarkersQueue = new buckets.Queue();
	allMarkers.forEach(function(markerMap){
		markerMap.values().forEach(function(marker){
			allMarkersQueue.enqueue(marker);
		});
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
			graphJSON += "\"x\":" + Math.floor(marker.attr("cx")) + ",";
			graphJSON += "\"y\":" + Math.floor(marker.attr("cy"));
			graphJSON += "}";
			
			rdpGraph.markers[rdpGraph.markers.length] = new Marker(marker.data(GlobalStrings.ID), Math.floor(marker.attr("cx")), Math.floor(marker.attr("cy")));
		}
	}
	
	graphJSON += "]}";

	return rdpGraph;
}

function createAllMarkersFromJson(json, paper) {
	var markerMap = new buckets.Dictionary();

	if (json != null && paper != null) {
		var obj = json;
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
				var defaultParkingLotColor = "lime";

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
				} else if (type == GlobalStrings.PARKING_LOT) {
					return isMarkerColorDefinedForType(type) ? markerTypeToColorMap.get(type) : defaultParkingLotColor;
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
				if(id.search(GlobalStrings.PATHWAY_ID) == -1) {
					if(id.search(GlobalStrings.PARKING_LOT_ID) == -1) {
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
						return GlobalStrings.PARKING_LOT;
					}
				} else {
					return GlobalStrings.PATHWAY;
				}
			}
			
			var getBuildingFromId = function(id) {
				if(id.search(GlobalStrings.PATHWAY_ID) == -1) {
					var parts = id.split("_");
					if(parts[0] == GlobalStrings.BUILDING_ID) {
						return parts[1];
					}
				} else {
					return "";
				}
			}
			
			var getFloorFromId = function(id) {
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
	if (json != null && paper != null) {
		var obj = json;
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
				if(id.search(GlobalStrings.PATHWAY_ID) == -1) {
					if(id.search(GlobalStrings.PARKING_LOT_ID) == -1) {
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
						return GlobalStrings.PARKING_LOT;
					}
				} else {
					return GlobalStrings.PATHWAY;
				}
			}
			
			var getBuildingFromId = function(id) {
				if(id.search(GlobalStrings.PATHWAY_ID) == -1) {
					var parts = id.split("_");
					if(parts[0] == GlobalStrings.BUILDING_ID) {
						return parts[1];
					}
				} else {
					return "";
				}
			}
			
			var getFloorFromId = function(id) {
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

			var makePath = function(marker1Data, marker2Data, distance, paper) {
				var path = paper.path("M" + marker1Data.cx + " " + marker1Data.cy + "L" + marker2Data.cx + " " + marker2Data.cy);
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
