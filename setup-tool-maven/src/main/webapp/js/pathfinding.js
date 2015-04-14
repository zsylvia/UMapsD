function getPathToBuilding(graph, markerIdFrom, buildingIdTo) {
	var markerFrom;
	allMarkers.forEach(function(markerMap){
		if(markerFrom == null) {
			markerFrom = markerMap.get(markerIdFrom);
		}
	});
	
	var doorMarkerSet = new buckets.Set(function(doorMarker) {
		return doorMarker.data(GlobalStrings.ID);
	});
	pathMap.values().forEach(function(path){
		var doorMarkerId;
		if(path.marker1Data.type == GlobalStrings.DOOR && path.marker1Data.building == buildingIdTo && 
			(path.marker2Data.building == null || path.marker1Data.building != path.marker2Data.building)) {
				doorMarkerId = path.marker1Data.id;
		} else if(path.marker2Data.type == GlobalStrings.DOOR && path.marker2Data.building == buildingIdTo && 
			(path.marker1Data.building == null || path.marker2Data.building != path.marker1Data.building)) {
				doorMarkerId = path.marker2Data.id;
		}
		
		if(doorMarkerId != null) {
			var doorMarker;
			allMarkers.forEach(function(markerMap){
				if(doorMarker == null) {
					doorMarker = markerMap.get(doorMarkerId);
				}
			});
			doorMarkerSet.add(doorMarker);
		}
	});
	
	var shortestDistance = 999999;
	var shortestPath;
	doorMarkerSet.forEach(function(doorMarker){
		var path = graph.shortestPath("" + markerIdFrom + "", "" + doorMarker.data(GlobalStrings.ID) + "").concat(["" + markerIdFrom + ""]).reverse();
		
		var totalDistance = 0;
		for (var i = 0; i < path.length; i++) {
			if (i < path.length - 1) {
				var pathObject = pathMap.get(path[i] + "<->" + path[i+1]);
				if(pathObject == null) {
					pathObject = pathMap.get(path[i+1] + "<->" + path[i]);
				}
				
				totalDistance += pathObject.distance;
			}
		}
		
		if(totalDistance < shortestDistance) {
			shortestDistance = totalDistance;
			shortestPath = path;
		}
	});

	return shortestPath;
}

function getClosestRoom(marker) {
	var closestRoom = null;
	var closestDistance = 9999999;

	roomMap.forEach(function(roomId, room) {
		if (room.isVisible() && marker != room && inSameBuilding(marker, room) && onSameFloor(marker, room)) {
			var distance = getDistance(marker, room);
			if (distance < closestDistance) {
				closestRoom = room;
				closestDistance = distance;
			}
		}
	});

	if (closestRoom != null) {
		LOG.debug("Closest room marker to " + marker.data(GlobalStrings.ID) + " is " + closestRoom.data(GlobalStrings.ID));
	} else {
		LOG.error("Closest room marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestRoom;
}

function getClosestBathroomMens(marker) {
	var closestBathroom = null;
	var closestDistance = 9999999;
	bathroomMensMap.forEach(function(bathroomId, bathroom) {
		if (bathroom.isVisible() && marker != bathroom && inSameBuilding(marker, bathroom) && onSameFloor(marker, bathroom)) {
			var distance = getDistance(marker, bathroom);
			if (distance < closestDistance) {
				closestBathroom = bathroom;
				closestDistance = distance;
			}
		}
	});

	if (closestBathroom != null) {
		LOG.debug("Closest men's bathroom marker to " + marker.data(GlobalStrings.ID) + " is " + closestBathroom.data(GlobalStrings.ID));
	} else {
		LOG.error("Closest men's bathroom marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestBathroom;
}

function getClosestBathroomWomens(marker) {
	var closestBathroom = null;
	var closestDistance = 9999999;
	bathroomWomensMap.forEach(function(bathroomId, bathroom) {
		if (bathroom.isVisible() && marker != bathroom && inSameBuilding(marker, bathroom) && onSameFloor(marker, bathroom)) {
			var distance = getDistance(marker, bathroom);
			if (distance < closestDistance) {
				closestBathroom = bathroom;
				closestDistance = distance;
			}
		}
	});

	if (closestBathroom != null) {
		LOG.debug("Closest women's bathroom marker to " + marker.data(GlobalStrings.ID) + " is " + closestBathroom.data(GlobalStrings.ID));
	} else {
		LOG.error("Closest women's bathroom marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestBathroom;
}

function getClosestHallway(marker) {
	var closestHallway = null;
	var closestDistance = 9999999;
	hallwayMap.forEach(function(hallwayId, hallway) {
		if (hallway.isVisible() && marker != hallway && inSameBuilding(marker, hallway) && onSameFloor(marker, hallway)) {
			var distance = getDistance(marker, hallway);
			if (distance < closestDistance) {
				closestHallway = hallway;
				closestDistance = distance;
			}
		}
	});

	if (closestHallway != null) {
		LOG.debug("Closest hallway marker to " + marker.data(GlobalStrings.ID) + " is " + closestHallway.data(GlobalStrings.ID));
	} else {
		LOG.error("Closest hallway marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestHallway;
}

function getClosestDoor(marker, sameBuilding, sameFloor) {
	var closestDoor = null;
	var closestDistance = 9999999;
	doorMap.forEach(function(doorId, door) {
		var valid = true;
		if (sameBuilding && !inSameBuilding(marker, door)) {
			valid = false;
		}
		if (sameFloor && !onSameFloor(marker, door)) {
			valid = false;
		}
		if (door.isVisible() && marker != door && valid) {
			var distance = getDistance(marker, door);
			if (distance < closestDistance) {
				closestDoor = door;
				closestDistance = distance;
			}
		}
	});

	if (closestDoor != null) {
		LOG.debug("Closest door marker to " + marker.data(GlobalStrings.ID) + " is " + closestDoor.data(GlobalStrings.ID));
	} else {
		LOG.error("Closest door marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestDoor;
}

function getClosestPathway(marker) {
	var closestPathway = null;
	var closestDistance = 9999999;
	pathwayMap.forEach(function(pathwayId, pathway) {
		if (marker != pathway) {
			var distance = getDistance(marker, pathway);
			if (distance < closestDistance) {
				closestPathway = pathway;
				closestDistance = distance;
			}
		}
	});

	if (closestPathway != null) {
		LOG.debug("Closest door marker to " + marker.data(GlobalStrings.ID) + " is " + closestPathway.data(GlobalStrings.ID));
	} else {
		LOG.error("Closest door marker to " + marker.data(GlobalStrings.ID) + " is null");
	}

	return closestPathway;
}

function getShortestPath(graph, marker1ID, marker2ID) {
	LOG.debug("Getting shortest path from " + marker1ID + " to " + marker2ID);
	return graph.shortestPath("" + marker1ID + "", "" + marker2ID + "").concat(["" + marker1ID + ""]).reverse();
}