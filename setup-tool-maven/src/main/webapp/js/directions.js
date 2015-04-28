var Directions = {
		STRAIGHT: "Continue straight",
		SLIGHT_LEFT: "Turn slightly left",
		LEFT: "Turn left",
		SHARP_LEFT: "Take a sharp left",
		SLIGHT_RIGHT: "Turn slightly right",
		RIGHT: "Turn right",
		SHARP_RIGHT: "Take a sharp right",
		UTURN: "Make a U-turn (This should never happen)"
}

function findAngle2(p1,p2,p3){
	var a1 = p2.cx - p1.cx;
	var a2 = p2.cy - p1.cy;
	var b1 = p3.cx - p2.cx;
	var b2 = p3.cy - p2.cy;
	var dot = (a1*b1)+(a2*b2);
	var cross = (a1*b2) - (a2*b1);
	result = Math.atan2(cross,dot) * 180 / Math.PI;
	return result;
}

/*
displayPath(path){} takes in an array of strings, that follow the naming convention above.
anything after rm_ is basically ignored, its not important for displaying the path.
as long as the strings can be found in the different xxxMaps that exist, it is valid input.

If path contains an invalid string, unhappyness will occur.
*/

function extractDirections(path){
	var directionsToPathElementsMap = [];
	var addDirection = function( txt ) {
		directionsToPathElementsMap.push({direction: txt, pathIds: []});
	};
	if(path.length > 3){
		var i = 2;
		var names = [];
		var advanced = true;
		var first = 3;
		var last = path.length-1;

		//add in required initial nodes
		names.push(path[0]);
		names.push(path[1]);
		names.push(path[2]);
		
		switch(getTypeFromId(names[0])) {
			case GlobalStrings.ROOM:
				addDirection("Exit " + getDisplayNameFromId(names[0]));
				break;
			case GlobalStrings.BATHROOM_MENS:
				addDirection("Exit the bathroom");
				break;
			case GlobalStrings.BATHROOM_WOMENS:
				addDirection("Exit the bathroom");
				break;
		}
		if(directionsToPathElementsMap.length == 1) {
			var pathIds = directionsToPathElementsMap[0].pathIds;
			if(pathMap.get(names[0] + "<->" + names[1]) == null) {
				pathIds.push(names[1] + "<->" + names[0]);
			} else {
				pathIds.push(names[0] + "<->" + names[1]);
			}
			directionsToPathElementsMap[0].pathIds = pathIds;
			i++;
			first++;
			names.push(path[3]);
			names.shift();
		}
		
		while (++i < path.length){
			var obs = [];
			for(var j = 0; j < 3; j++){
				//console.log(names[j]);
				switch(getTypeFromId(names[j])){
					case (GlobalStrings.ROOM) : obs[j] = roomMap.table[names[j]].value.attrs; break;
					case (GlobalStrings.DOOR) : obs[j] = doorMap.table[names[j]].value.attrs; break;
					case (GlobalStrings.HALLWAY) : obs[j] = hallwayMap.table[names[j]].value.attrs; break;
					case (GlobalStrings.PATHWAY) : obs[j] = pathwayMap.table[names[j]].value.attrs; break;
					case (GlobalStrings.STAIR) : obs[j] = stairMap.table[names[j]].value.attrs; break;
					case (GlobalStrings.ELEVATOR) : obs[j] = elevatorMap.table[names[j]].value.attrs; break;
					case (GlobalStrings.BATHROOM_MENS) : obs[j] = bathroomMensMap[table.names[j]].value.attrs; break;
					case (GlobalStrings.BATHROOM_WOMENS) : obs[j] = bathroomWomensMap.table[names[j]].value.attrs; break;
					case ("error") :
					default : LOG.error("Error! Direction type for " + names[j] + " not implemented! Aborting advnced directions for this step!"); advanced=false; break;
				}
			}
			advanced = true;
			degree=findAngle2(obs[0], obs[1], obs[2]);
			LOG.debug("Angle of " + names[0] + " " + names[1] + " " + names[2] + " : " + findAngle2(obs[0], obs[1], obs[2]));

			if (advanced){
				var dir = (degree < 45 && degree >= -45)?Directions.STRAIGHT:
				(degree < 60 && degree >= 30)?Directions.SLIGHT_RIGHT:
				(degree < 120 && degree >= 60)?Directions.RIGHT:
				(degree < 150 && degree >= 120)?Directions.SHARP_RIGHT:
				(degree < -30 && degree >= -60)?Directions.SLIGHT_LEFT:
				(degree < -60 && degree >= -120)?Directions.LEFT:
				(degree < -120 && degree >= -150)?Directions.SHARP_LEFT:
				(degree < -150 || degree >= 150)?Directions.UTURN:
				"error";
				//should sharp left and sharp right be adjusted so they're basically uturns?
			}
			
			switch(getTypeFromId(names[2])){
				case GlobalStrings.ROOM:
					addDirection((advanced?dir:"") + " through the room");
					break;
				case GlobalStrings.DOOR:
					if(i == last) {
						addDirection((advanced?dir:"") + " through the door to " + getDisplayNameFromId(path[i]));
					} else {
						addDirection((advanced?dir:"") + " through the door");
					}
					break;
				case GlobalStrings.HALLWAY:
					addDirection((advanced?dir:"") + " down the hallway");
					break;
				case GlobalStrings.PATHWAY:
					addDirection((advanced?dir:"") + " down the pathway");
					break;
				case GlobalStrings.STAIR:
					addDirection((advanced?dir:"") + " up/down the stairwell");
					break;
				case GlobalStrings.ELEVATOR:
					addDirection((advanced?dir:"") + " up/down the elevator");
					break;
				case GlobalStrings.BATHROOM_MENS:
					addDirection((advanced?dir:"") + " down the [boysroom]");
					break;
				case GlobalStrings.BATHROOM_WOMENS:
					addDirection((advanced?dir:"") + " down the [girlsroom]");
					break;
				default:
					addDirection("Error computing this step of pathway.");
					//put in aditional error logging.
					break;
			}

			// shift set of 3 nodes in prep for next loop.
			names.push(path[i]);
			
			var pathIds = directionsToPathElementsMap[directionsToPathElementsMap.length-1].pathIds;
			if(i == first) {
				if(pathMap.get(names[0] + "<->" + names[1]) == null) {
					pathIds.push(names[1] + "<->" + names[0]);
				} else {
					pathIds.push(names[0] + "<->" + names[1]);
				}
			}
			if(pathMap.get(names[1] + "<->" + names[2]) == null) {
				pathIds.push(names[2] + "<->" + names[1]);
			} else {
				pathIds.push(names[1] + "<->" + names[2]);
			}
			
			if(i == last) {
				if(pathMap.get(names[2] + "<->" + names[3]) == null) {
					pathIds.push(names[3] + "<->" + names[2]);
				} else {
					pathIds.push(names[2] + "<->" + names[3]);
				}
			}
			
			directionsToPathElementsMap[directionsToPathElementsMap.length-1].pathIds = pathIds;
			
			names.shift();
		}
	} else {
		addDirection("You're so close! It should be through a nearby door.");
	}
	
	// Combine same directions
	var directionsToPathElementsMapConsolidated = [];
	var currentDirection;
	var currPathIds = [];
	for(var i = 0, len = directionsToPathElementsMap.length; i < len; i++) {
		var obj = directionsToPathElementsMap[i];
		if(currentDirection != null) {
			if(currentDirection != obj.direction) {
				if(currentDirection.indexOf(Directions.SLIGHT_LEFT) != -1 && currPathIds.length > 1) {
					currentDirection = currentDirection.replace(Directions.SLIGHT_LEFT, Directions.LEFT);
				} else if(currentDirection.indexOf(Directions.SLIGHT_LEFT) != -1 && currPathIds.length > 1) {
					currentDirection = currentDirection.replace(Directions.SLIGHT_RIGHT, Directions.RIGHT);
				}
				directionsToPathElementsMapConsolidated.push({direction: currentDirection, pathIds: currPathIds});
				currPathIds = [];
			}
		}
		for(var j = 0, idsLen = obj.pathIds.length; j < idsLen; j++) {
			currPathIds.push(obj.pathIds[j]);
		}
		currentDirection = obj.direction;
	}
	
	directionsToPathElementsMapConsolidated.push({direction: currentDirection, pathIds: currPathIds});
	
	LOG.trace(directionsToPathElementsMapConsolidated, true);
	
	return directionsToPathElementsMapConsolidated;
}
