package edu.umassd.umapsd.servlet;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;

import edu.umassd.umapsd.json.Graph;

/**
 * @author zsylvia
 */
public class GraphUploadServlet extends HttpServlet {
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}
	
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("text/plain");
		response.setStatus(HttpServletResponse.SC_OK);
		String json = request.getParameter("graph");
		String nonHandicapGraphVertices = request.getParameter("nonHandicapGraphVertices");
		String handicapGraphVertices = request.getParameter("handicapGraphVertices");
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");
		long sessionTime = Long.valueOf(request.getParameter("sessionTime"));
		String graphJson = convertParamToJson(json) + ";";
		graphJson += "\nvar nonHandicapGraphVertices=" + nonHandicapGraphVertices + ";";
		graphJson += "\nvar handicapGraphVertices=" + handicapGraphVertices + ";";
		File graphDir = new File(getServletContext().getRealPath("/graph"));
		if(graphDir.exists()) {
			boolean saveFile = false;
			File oldGraph = new File(graphDir, "graph.js");
			if(oldGraph.exists()) {
				if(!FileUtils.readFileToString(oldGraph).equals(graphJson)) {
					saveFile = true;
					FileUtils.moveFile(oldGraph, new File(graphDir, "graph.js."+format.format(new Date(sessionTime))));
				} else {
					// No changes were made
				}
			}
			if(saveFile) {
				File newGraph = new File(graphDir, "graph.js");
				if(!newGraph.exists()) {
					newGraph.createNewFile();
				}
				FileUtils.writeStringToFile(newGraph, graphJson);
			}
		}
	}
	
	private String convertParamToJson(String parameter) throws UnsupportedEncodingException {
		String decode = URLDecoder.decode(parameter, "UTF-8");
		Graph graph = new Graph();
		List<Graph.Path> paths = new ArrayList<Graph.Path>();
		List<Graph.Marker> markers = new ArrayList<Graph.Marker>();
		Pattern pathsPattern = Pattern.compile("paths\\[(\\d+)\\]\\[(\\w+)\\]\\[*(\\w+)*\\]*=(.+)");
		Pattern markersPattern = Pattern.compile("markers\\[(\\d+)\\]\\[(\\w+)\\]=(.+)");
		String[] split = decode.split("&");
		for(String s : split) {
			Matcher pathMatcher = pathsPattern.matcher(s);
			Matcher markerMatcher = markersPattern.matcher(s);
			if(pathMatcher.find()) {
				int num = Integer.valueOf(pathMatcher.group(1));
				Graph.Path path;
				if(paths.isEmpty() || num >= paths.size()) {
					path = graph.new Path();
					paths.add(num, path);
				} else {
					path = paths.get(num);
				}
				
				if(pathMatcher.group(2).equals("m1")) {
					Graph.Marker m1 = path.getM1();
					if(m1 == null) {
						m1 = graph.new Marker();
					}
					if(pathMatcher.group(3).equals("id")) {
						m1.setId(pathMatcher.group(4));
					} else if(pathMatcher.group(3).equals("x")) {
						m1.setX(Integer.valueOf(pathMatcher.group(4)));
					} else if(pathMatcher.group(3).equals("y")) {
						m1.setY(Integer.valueOf(pathMatcher.group(4)));
					}
					path.setM1(m1);
				} else if(pathMatcher.group(2).equals("m2")) {
					Graph.Marker m2 = path.getM2();
					if(m2 == null) {
						m2 = graph.new Marker();
					}
					if(pathMatcher.group(3).equals("id")) {
						m2.setId(pathMatcher.group(4));
					} else if(pathMatcher.group(3).equals("x")) {
						m2.setX(Integer.valueOf(pathMatcher.group(4)));
					} else if(pathMatcher.group(3).equals("y")) {
						m2.setY(Integer.valueOf(pathMatcher.group(4)));
					}
					path.setM2(m2);
				} else if(pathMatcher.group(2).equals("d")) {
					path.setD(Integer.valueOf(pathMatcher.group(4)));
				}
				
				paths.set(num, path);
			} else if(markerMatcher.find()) {
				int num = Integer.valueOf(markerMatcher.group(1));
				Graph.Marker marker;
				if(markers.isEmpty() || num >= markers.size()) {
					marker = graph.new Marker();
					markers.add(num, marker);
				} else {
					marker = markers.get(num);
				}
				
				if(markerMatcher.group(2).equals("id")) {
					marker.setId(markerMatcher.group(3));
				} else if(markerMatcher.group(2).equals("x")) {
					marker.setX(Integer.valueOf(markerMatcher.group(3)));
				} else if(markerMatcher.group(2).equals("y")) {
					marker.setY(Integer.valueOf(markerMatcher.group(3)));
				}
			}
		}
		
		graph.setPaths(paths);
		graph.setMarkers(markers);
		return "var graphJS=" + graph.toString();
	}
	
}
