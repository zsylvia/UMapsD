package edu.umassd.umapsd.json;

import java.util.ArrayList;
import java.util.List;

/**
 * @author zsylvia
 */
public class Dictionary {

	private List<Building> buildings;
	private List<ParkingLot> parkinglots;
	private List<Dorm> dorms;
	private List<Misc> misc;
	
	public Dictionary() {
		buildings = new ArrayList<Building>();
		parkinglots = new ArrayList<ParkingLot>();
		dorms = new ArrayList<Dorm>();
		misc = new ArrayList<Misc>();
	}
	
	public Dictionary(List<Building> buildings) {
		this.buildings = buildings;
	}
	
	public List<Building> getBuildings() {
		return buildings;
	}
	
	public void setBuildings(List<Building> buildings) {
		this.buildings = buildings;
	}
	
	public List<ParkingLot> getParkingLots() {
		return parkinglots;
	}
	
	public void setParkingLots(List<ParkingLot> parkinglots) {
		this.parkinglots = parkinglots;
	}
	
	public List<Dorm> getDorms() {
		return dorms;
	}
	
	public void setDorms(List<Dorm> dorms) {
		this.dorms = dorms;
	}
	
	public List<Misc> getMisc() {
		return misc;
	}
	
	public void setMisc(List<Misc> misc) {
		this.misc = misc;
	}
	
	@Override
	public String toString() {
		StringBuilder str = new StringBuilder();
		str.append("{buildings:[");
		boolean firstBuilding = true;
		for(Building building : buildings) {
			if(!firstBuilding) {
				str.append(",");
			} else {
				firstBuilding = false;
			}
			str.append(building.toString());
		}
		str.append("],");
		
		str.append("parkinglots:[");
		boolean firstParkingLot = true;
		for(ParkingLot parkingLot : parkinglots) {
			if(!firstParkingLot) {
				str.append(",");
			} else {
				firstParkingLot = false;
			}
			str.append(parkingLot.toString());
		}
		str.append("],");
		
		str.append("dorms:[");
		boolean firstDorm = true;
		for(Dorm dorm : dorms) {
			if(!firstDorm) {
				str.append(",");
			} else {
				firstDorm = false;
			}
			str.append(dorm.toString());
		}
		str.append("],");
		
		str.append("misc:[");
		boolean firstMisc = true;
		for(Misc m : misc) {
			if(!firstMisc) {
				str.append(",");
			} else {
				firstMisc = false;
			}
			str.append(m.toString());
		}
		str.append("]}");
		return str.toString();
	}
	
	public class Building {

		private String fullId;
		private String shortId;
		private List<Floor> floors;

		public Building() {
			fullId = "";
			shortId = "";
			floors = new ArrayList<Floor>();
		}

		public Building(String fullId, String shortId, List<Floor> floors) {
			super();
			this.fullId = fullId;
			this.shortId = shortId;
			this.floors = floors;
		}

		public String getFullId() {
			return fullId;
		}

		public void setFullId(String fullId) {
			this.fullId = fullId;
		}

		public String getShortId() {
			return shortId;
		}

		public void setShortId(String shortId) {
			this.shortId = shortId;
		}

		public List<Floor> getFloors() {
			return floors;
		}

		public void setFloors(List<Floor> floors) {
			this.floors = floors;
		}

		@Override
		public String toString() {
			StringBuilder str = new StringBuilder();
			str.append("{full_id:\"" + fullId + "\",short_id:\"" + shortId + "\",floors:[");
			boolean firstFloor = true;
			for(Floor floor : floors) {
				if(!firstFloor) {
					str.append(",");
				} else {
					firstFloor = false;
				}
				str.append(floor.toString());
			}
			str.append("]}");
			return str.toString();
		}
		
		public class Floor {

			private String id;
			private List<Shape> shapes;

			public Floor() {
				id = "";
				shapes = new ArrayList<Shape>();
			}

			public Floor(String id, List<Shape> shapes) {
				this.id = id;
				this.shapes = shapes;
			}

			public String getId() {
				return id;
			}

			public void setId(String id) {
				this.id = id;
			}

			public List<Shape> getShapes() {
				return shapes;
			}

			public void setShapes(List<Shape> shapes) {
				this.shapes = shapes;
			}

			@Override
			public String toString() {
				StringBuilder str = new StringBuilder();
				str.append("{id:\"" + id + "\",shapes:[");
				boolean firstShape = true;
				for(Shape shape : shapes) {
					if(!firstShape) {
						str.append(",");
					} else {
						firstShape = false;
					}
					str.append(shape.toString());
				}
				str.append("]}");
				return str.toString();
			}
			
			public class Shape {

				private String id;
				private String path;
				
				public Shape() {
					id = "";
					path = "";
				}

				public Shape(String id, String path) {
					this.id = id;
					this.path = path;
				}

				public String getId() {
					return id;
				}

				public void setId(String id) {
					this.id = id;
				}

				public String getPath() {
					return path;
				}

				public void setPath(String path) {
					this.path = path;
				}

				@Override
				public String toString() {
					StringBuilder str = new StringBuilder();
					str.append("{id:\"" + id + "\",path:\"" + path + "\"}");
					return str.toString();
				}

			}
		}
	}
	
	public class ParkingLot {
		private String fullId;
		private String shortId;
		private String path;
		
		public ParkingLot() {
			fullId = "";
			shortId = "";
			path = "";
		}

		public ParkingLot(String fullId, String shortId, String path) {
			this.fullId = fullId;
			this.shortId = shortId;
			this.path = path;
		}

		public String getFullId() {
			return fullId;
		}

		public void setFullId(String fullId) {
			this.fullId = fullId;
		}

		public String getShortId() {
			return shortId;
		}

		public void setShortId(String shortId) {
			this.shortId = shortId;
		}
		
		public String getPath() {
			return path;
		}
		
		public void setPath(String path) {
			this.path = path;
		}
		
		@Override
		public String toString() {
			StringBuilder str = new StringBuilder();
			str.append("{full_id:\"" + fullId + "\",short_id:\"" + shortId + "\",path:\"" + path + "\"}");
			return str.toString();
		}
	}
	
	public class Dorm {
		private String fullId;
		private String shortId;
		private String path;
		
		public Dorm() {
			fullId = "";
			shortId = "";
			path = "";
		}

		public Dorm(String fullId, String shortId, String path) {
			this.fullId = fullId;
			this.shortId = shortId;
			this.path = path;
		}

		public String getFullId() {
			return fullId;
		}

		public void setFullId(String fullId) {
			this.fullId = fullId;
		}

		public String getShortId() {
			return shortId;
		}

		public void setShortId(String shortId) {
			this.shortId = shortId;
		}
		
		public String getPath() {
			return path;
		}
		
		public void setPath(String path) {
			this.path = path;
		}
		
		@Override
		public String toString() {
			StringBuilder str = new StringBuilder();
			str.append("{full_id:\"" + fullId + "\",short_id:\"" + shortId + "\",path:\"" + path + "\"}");
			return str.toString();
		}
	}
	
	public class Misc {
		private String fullId;
		private String shortId;
		private String path;
		
		public Misc() {
			fullId = "";
			shortId = "";
			path = "";
		}

		public Misc(String fullId, String shortId, String path) {
			this.fullId = fullId;
			this.shortId = shortId;
			this.path = path;
		}

		public String getFullId() {
			return fullId;
		}

		public void setFullId(String fullId) {
			this.fullId = fullId;
		}

		public String getShortId() {
			return shortId;
		}

		public void setShortId(String shortId) {
			this.shortId = shortId;
		}
		
		public String getPath() {
			return path;
		}
		
		public void setPath(String path) {
			this.path = path;
		}
		
		@Override
		public String toString() {
			StringBuilder str = new StringBuilder();
			str.append("{full_id:\"" + fullId + "\",short_id:\"" + shortId + "\",path:\"" + path + "\"}");
			return str.toString();
		}
	}
}
