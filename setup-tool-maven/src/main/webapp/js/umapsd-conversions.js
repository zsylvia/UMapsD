function RDPGraph() {
	this.paths = [];
	this.markers = [];
}

function DictionaryPath(m1, m2, d) {
	this.m1 = m1;
	this.m2 = m2;
	this.d = d;
}

function DictionaryMarker(id, x, y) {
	this.id = id;
	this.x = x;
	this.y = y;
}

function convertMarkersAndPathsToJson(allMarkers, pathMap) {
	var idsOfAddedMarkers = new buckets.Dictionary();
	
	var rdpGraph = new RDPGraph();

	pathMap.values().forEach(function(path) {
		var m1 = new DictionaryMarker();
		var m2 = new DictionaryMarker();

		m1.id = path.marker1Data.id;
		if (idsOfAddedMarkers.set(path.marker1Data.id, "") == null) {
			m1.x = Math.floor(path.marker1Data.cx);
			m1.y = Math.floor(path.marker1Data.cy);
		}

		m2.id = path.marker2Data.id;
		if (idsOfAddedMarkers.set(path.marker2Data.id, "") == null) {
			m2.x = Math.floor(path.marker2Data.cx);
			m2.y = Math.floor(path.marker2Data.cy);
		}
		
		rdpGraph.paths[rdpGraph.paths.length] = new DictionaryPath(m1,m2,Math.floor(path.distance));
	});

	var allMarkersQueue = new buckets.Queue();
	allMarkers.forEach(function(markerMap){
		markerMap.values().forEach(function(marker){
			allMarkersQueue.enqueue(marker);
		});
	});

	while (!allMarkersQueue.isEmpty()) {
		var marker = allMarkersQueue.dequeue();
		if (idsOfAddedMarkers.set(marker.data(GlobalStrings.ID), "") == null) {					
			rdpGraph.markers[rdpGraph.markers.length] = new DictionaryMarker(marker.data(GlobalStrings.ID), Math.floor(marker.attr("cx")), Math.floor(marker.attr("cy")));
		}
	}
	
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
			
			obj.markers.forEach(function(markerData) {
				var type = getTypeFromId(markerData.id);
				var marker = paper.circle(markerData.x, markerData.y, markerSizeToUse).attr({
					fill: markerTypeToColorMap.get(type),
				});

				marker.data(GlobalStrings.ID, markerData.id);
				marker.data(GlobalStrings.TYPE, type);
				if (type != GlobalStrings.PATHWAY && type != GlobalStrings.PARKING_LOT && type != GlobalStrings.DORM && type != GlobalStrings.MISC) {
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
