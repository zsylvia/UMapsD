/*
Naming conventions: (replace ???'s with fields)
Room: bldg_???_flr_???_rm_???
Hallway: bldg_???_flr_???_hw_???
Door: bldg_???_flr???_dr_???
Pathway: pathway_??? (numbered in order of creation)
Stair: bldg_???_flr_???_st_???
Elevator: bldg_???_flr_???_el_???
*/

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

function displayPath(path){
	document.getElementById('displayPath').innerHTML = "";
	var addDirection = function( txt ) {
		$("#displayPath").append( '<li class="list-group-item">' + txt + '</li>' );
	};
	$("#displayPath").append( '<ul class="list-group' );
	if(path.length > 3){
		var i = 2;
		var queue = [];
		var names = [];
		var advanced = true;

		//add in required initial nodes
		names.push(path[0]);
		queue.push(names[0].split("_"));
		names.push(path[1]);
		queue.push(names[1].split("_"));
		names.push(path[2]);
		queue.push(names[2].split("_"));

		while (++i < path.length){
			var obs = [];
			for(var j = 0; j < 3; j++){
				//console.log(queue[j]);
				//console.log(names[j]);
				switch(queue[j][4]){
					case ("rm") : obs[j] = roomMap.table[names[j]].value.attrs; break;
					case ("dr") : obs[j] = doorMap.table[names[j]].value.attrs; break;
					case ("hw") : obs[j] = hallwayMap.table[names[j]].value.attrs; break;
					case ("pw") : obs[j] = pathwayMap.table[names[j]].value.attrs; break;
					case ("st") : obs[j] = stairMap.table[names[j]].value.attrs; break;
					case ("ev") : obs[j] = elevatorMap.table[names[j]].value.attrs; break;
					case ("brm") : obs[j] = bathroomMensMap[table.names[j]].value.attrs; break;
					case ("brw") : obs[j] = bathroomWomensMap.table[names[j]].value.attrs; break;
					case ("error") :
					default : console.log("Error! Direction type not Implemented! Aborting advnced directions for this step!"); advanced=false; break;
				}
			}
			advanced = true;
			degree=findAngle2(obs[0], obs[1], obs[2]);
			console.log("Angle of " + names[0] + " " + names[1] + " " + names[2] + " : " + findAngle2(obs[0], obs[1], obs[2]));

			if (advanced){
				var dir = (degree < 30 && degree >= -30)?"continue strait ": 
				(degree < 60 && degree >= 30)?"turn slightly right ": 
				(degree < 120 && degree >= 60)?"turn right ": 
				(degree < 150 && degree >= 120)?"take a sharp right ": 
				(degree < -30 && degree >= -60)?"turn slightly left ": 
				(degree < -60 && degree >= -120)?"turn left ":
				(degree < -120 && degree >= -150)?"take a sharp left ": 
				(degree < -150 || degree >= 150)?"make a uturn (This should never happen) ":
				"error";
				//should sharp left and sharp right be adjusted so they're basically uturns?
			}

			switch(queue[2][4]){
				case ("rm") : addDirection("temp; Go " + (advanced === true?dir:"") + "through the room"); break;
				case ("dr") : addDirection("temp; Go " + (advanced === true?dir:"") + "through the door"); break;
				case ("hw") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the hallway"); break;
				case ("pw") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the pathway"); break;
				case ("st") : addDirection("temp; Continue " + (advanced === true?dir:"") + "up/down the stairwell"); break;
				case ("ev") : addDirection("temp; Continue " + (advanced === true?dir:"") + "up/down the elevator"); break;
				case ("brm") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the [boysroom]"); break;
				case ("brw") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the [girlsroom]"); break;
				default : addDirection("Error computing this step of pathway."); 
					//put in aditional error logging.
					break;
			}

			// shift set of 3 nodes in prep for next loop.
			queue.push(path[i].split("_"));
			names.push(path[i]);
			queue.shift();
			names.shift();
		}
	} else {
		//else : you want directions to something so fucking close I'm not going to give you words to find it.
		addDirection("You're so close! It should be through a nearby door.");
	}
	$("#displayPath").append( '</ul>' );
}
