var GlobalStrings = {
	ID: "id",
	TYPE: "type",
	ALL_BUILDINGS: "all_buildings",
	
	FLOOR: "floor",
	BUILDING: "building",
	ROOM: "room",
	DOOR: "door",
	HALLWAY: "hallway",
	PATHWAY: "pathway",
	STAIR: "stair",
	ELEVATOR: "elevator",
	BATHROOM_MENS: "bathroom_mens",
	BATHROOM_WOMENS: "bathroom_womens",
	
	FLOOR_DISPLAY: "Floor",
	BUILDING_DISPLAY: "Building",
	ROOM_DISPLAY: "Room",
	DOOR_DISPLAY: "Door",
	HALLWAY_DISPLAY: "Hallway",
	PATHWAY_DISPLAY: "Pathway",
	STAIR_DISPLAY: "Stair",
	ELEVATOR_DISPLAY: "Elevator",
	BATHROOM_MENS_DISPLAY: "Bathroom (Men's)",
	BATHROOM_WOMENS_DISPLAY: "Bathroom (Women's)",
	
	FLOOR_ID: "flr",
	BUILDING_ID: "bldg",
	ROOM_ID: "rm",
	DOOR_ID: "dr",
	HALLWAY_ID: "hw",
	PATHWAY_ID: "pw",
	STAIR_ID: "st",
	ELEVATOR_ID: "el",
	BATHROOM_MENS_ID: "br_m",
	BATHROOM_WOMENS_ID: "br_w",
	
	COLOR: {
		RED: "red",
		BLUE: "blue",
		ORANGE: "orange",
		GREEN: "green",
		PURPLE: "purple",
		YELLOW: "yellow",
		CYAN: "cyan",
		PINK: "pink",
		
		RED_DISPLAY: "Red",
		BLUE_DISPLAY: "Blue",
		ORANGE_DISPLAY: "Orange",
		GREEN_DISPLAY: "Green",
		PURPLE_DISPLAY: "Purple",
		YELLOW_DISPLAY: "Yellow",
		CYAN_DISPLAY: "Cyan",
		PINK_DISPLAY: "Pink",
		
		forEachStringPair: function(func) {
			func(this.RED, this.RED_DISPLAY);
			func(this.BLUE, this.BLUE_DISPLAY);
			func(this.ORANGE, this.ORANGE_DISPLAY);
			func(this.GREEN, this.GREEN_DISPLAY);
			func(this.PURPLE, this.PURPLE_DISPLAY);
			func(this.YELLOW, this.YELLOW_DISPLAY);
			func(this.CYAN, this.CYAN_DISPLAY);
			func(this.PINK, this.PINK_DISPLAY);
		}
	},
	
	
	forEachStringPair: function(func) {
		func(this.FLOOR, this.FLOOR_DISPLAY);
		func(this.BUILDING, this.BUILDING_DISPLAY);
		func(this.ROOM, this.ROOM_DISPLAY);
		func(this.DOOR, this.DOOR_DISPLAY);
		func(this.HALLWAY, this.HALLWAY_DISPLAY);
		func(this.PATHWAY, this.PATHWAY_DISPLAY);
		func(this.STAIR, this.STAIR_DISPLAY);
		func(this.ELEVATOR, this.ELEVATOR_DISPLAY);
		func(this.BATHROOM_MENS, this.BATHROOM_MENS_DISPLAY);
		func(this.BATHROOM_WOMENS, this.BATHROOM_WOMENS_DISPLAY);
		this.COLOR.forEachStringPair(func);
	},
	
	forEachMarkerStringPair: function(func) {
		this.forEachStringPair(function(normal, display){
			if(normal != GlobalStrings.FLOOR && normal != GlobalStrings.BUILDING && !GlobalStrings.COLOR.hasOwnProperty(normal.toUpperCase())) {
				func(normal, display);
			}
		});
	},
	
	getNormalFromDisplay: function(displayString) {
		var normalString = "";
		this.forEachStringPair(function(normal, display){
			if(displayString == display) {
				normalString = normal;
			}
		});
		return normalString;
	},
	
	getDisplayFromNormal: function(normalString) {
		var displayString = "";
		this.forEachStringPair(function(normal, display){
			if(normalString == normal) {
				displayString = display;
			}
		});
		return displayString;
	}
}