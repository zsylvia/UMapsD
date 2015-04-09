package edu.umassd.umapsd.json;

import java.util.ArrayList;
import java.util.List;

/**
 * @author zsylvia
 */
public class Graph {
	private List<Marker> markers;
	private List<Path> paths;

	public Graph(List<Path> paths, List<Marker> markers) {
		this.paths = paths;
		this.markers = markers;
	}

	public Graph() {
		paths = new ArrayList<Path>();
		markers = new ArrayList<Marker>();
	}

	public List<Marker> getMarkers() {
		return markers;
	}

	public void setMarkers(List<Marker> markers) {
		this.markers = markers;
	}

	public List<Path> getPaths() {
		return paths;
	}

	public void setPaths(List<Path> paths) {
		this.paths = paths;
	}
	
	public String toString() {
		StringBuilder str = new StringBuilder();
		str.append("{\"markers\":[");
		boolean firstMarker = true;
		for(Marker marker : markers) {
			if(!firstMarker) {
				str.append(",");
			} else {
				firstMarker = false;
			}
			str.append(marker.toString());
		}
		boolean firstPath = true;
		str.append("],\"paths\":[");
		for(Path path : paths) {
			if(!firstPath) {
				str.append(",");
			} else {
				firstPath = false;
			}
			str.append(path.toString());
		}
		str.append("]}");
		return str.toString();
	}
	
	public class Marker {
		private String id;
		private int x;
		private int y;
		
		public Marker() {
			id = "";
			x = -1;
			y = -1;
		}

		public Marker(String id) {
			this.id = id;
			this.x = -1;
			this.y = -1;
		}

		public Marker(String id, int x, int y) {
			this.id = id;
			this.x = x;
			this.y = y;
		}

		public String getId() {
			return id;
		}

		public void setId(String id) {
			this.id = id;
		}

		public int getX() {
			return x;
		}

		public void setX(int x) {
			this.x = x;
		}

		public int getY() {
			return y;
		}

		public void setY(int y) {
			this.y = y;
		}
		
		public String toString() {
			StringBuilder str = new StringBuilder();
			str.append("{\"id\":\"" + id + "\"");
			if(x != -1 && y != -1) {
				str.append(",\"x\":" + x + ",\"y\":" + y);
			}
			str.append("}");
			return str.toString();
		}
	}
	
	public class Path {
		private Marker m1;
		private Marker m2;
		private int d;
		
		public Path() {
			m1 = null;
			m2 = null;
			d = -1;
		}

		public Path(Marker m1, Marker m2, int d) {
			this.m1 = m1;
			this.m2 = m2;
			this.d = d;
		}

		public Marker getM1() {
			return m1;
		}

		public void setM1(Marker m1) {
			this.m1 = m1;
		}

		public Marker getM2() {
			return m2;
		}

		public void setM2(Marker m2) {
			this.m2 = m2;
		}

		public int getD() {
			return d;
		}

		public void setD(int d) {
			this.d = d;
		}
		
		public String toString() {
			StringBuilder str = new StringBuilder();
			str.append("{\"m1\":" + m1.toString() + ",\"m2\":" + m2.toString());
			if(d != -1) {
				str.append(",\"d\":" + d);
			}
			str.append("}");
			return str.toString();
		}
	}
}
