/*
Naming conventions: (replace ???'s with fields)
Room: bldg_???_flr_???_rm_???
Hallway: bldg_???_flr_???_hw_???
Door: bldg_???_flr???_dr_???
Pathway: pathway_??? (numbered in order of creation)
Stair: bldg_???_flr_???_st_???
Elevator: bldg_???_flr_???_el_???
*/

/*
	graph convention ; 
	marker.data(GlobalStrings.ID/TYPE/BUILDING/FLOOR) 
	marker.attr("cx"/"cy");
		   0    1   2   3   4  5 
	path : bldg_???_flr_???_rm_??? <-> bldg_???_flr_???_rm_??? 
	
*/
var advanced = true;

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

		//add in required
		names.push(path[0]);
		queue.push(names[0].split("_"));
		names.push(path[1]);
		queue.push(names[1].split("_"));
		names.push(path[2]);
		queue.push(names[2].split("_"));

		console.log(names);

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
					default : console.log("Error! Type not Implemented! Aborting advnced directions!"); advanced=false; break;
				}
			}
			//console.log(obs[0], obs[1], obs[2]);
			degree=findAngle2(obs[0], obs[1], obs[2]);
			console.log("Angle of " + names[0] + " " + names[1] + " " + names[2]);
			console.log(findAngle2(obs[0], obs[1], obs[2]));

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
			}

			switch(queue[2][4]){
				case ("rm") : addDirection("temp; Go " + (advanced === true?dir:"") + "through the room"); break;
				case ("dr") : addDirection("temp; Go " + (advanced === true?dir:"") + "through the door"); break;
				case ("hw") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the hallway"); break;
				case ("pw") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the [pw]"); break;
				case ("st") : addDirection("temp; Continue " + (advanced === true?dir:"") + "UPORDOWN? the stairwell"); break;
				case ("ev") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the [ev]"); break;
				case ("brm") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the [boysroom]"); break;
				case ("brw") : addDirection("temp; Continue " + (advanced === true?dir:"") + "down the [girlsroom]"); break;
				default : addDirection("error"); break;
			}

			//at the end...
			queue.push(path[i].split("_"));
			names.push(path[i]);
			console.log(names[3]);
			queue.shift();
			names.shift();
		}
	} else {
		addDirection("You're so close! It should be through a nearby door.");
	}
	$("#displayPath").append( '</ul>' );
}
