package edu.umassd.umapsd.json;

import java.util.ArrayList;
import java.util.List;

/**
 * @author zsylvia
 */
public class Dictionary {

	private List<Building> buildings;
	
	public Dictionary() {
		buildings = new ArrayList<Building>();
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
}
