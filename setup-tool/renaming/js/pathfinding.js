function getPathToBuilding(allMarkers, pathMap, graph, markerIdFrom, buildingIdTo) {
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