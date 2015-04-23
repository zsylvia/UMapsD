package edu.umassd.umapsd.json;

import java.util.ArrayList;
import java.util.List;

/**
 * @author zsylvia
 */
public class NameChangeMap {
	private List<Building> buildings;
	
	public NameChangeMap() {
		buildings = new ArrayList<Building>();
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
		private String id;
		private List<Floor> floors;
		
		public Building() {
			id = "";
			floors = new ArrayList<Floor>();
		}

		public String getId() {
			return id;
		}

		public void setId(String id) {
			this.id = id;
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
			str.append("{id:\"" + id + "\",floors:[");
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
			private List<Change> changes;
			
			public Floor() {
				id = "";
				changes = new ArrayList<Change>();
			}

			public String getId() {
				return id;
			}

			public void setId(String id) {
				this.id = id;
			}

			public List<Change> getChanges() {
				return changes;
			}

			public void setChanges(List<Change> changes) {
				this.changes = changes;
			}

			@Override
			public String toString() {
				StringBuilder str = new StringBuilder();
				str.append("{id:\"" + id + "\",changes:[");
				boolean firstChange = true;
				for(Change change : changes) {
					if(!firstChange) {
						str.append(",");
					} else {
						firstChange = false;
					}
					str.append(change.toString());
				}
				str.append("]}");
				return str.toString();
			}

			public class Change {
				private String oldId;
				private String changedId;
				
				public Change() {
					oldId = "";
					changedId = "";
				}

				public String getOldId() {
					return oldId;
				}

				public void setOldId(String oldId) {
					this.oldId = oldId;
				}

				public String getChangedId() {
					return changedId;
				}

				public void setChangedId(String changedId) {
					this.changedId = changedId;
				}

				@Override
				public String toString() {
					StringBuilder str = new StringBuilder();
					str.append("{oldId:\"" + oldId + "\",changedId:\"" + changedId + "\"}");
					return str.toString();
				}
			}
		}
	}
}
