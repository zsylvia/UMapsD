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

import edu.umassd.umapsd.json.Dictionary;
import edu.umassd.umapsd.json.NameChangeMap;

/**
 * @author zsylvia
 */
public class DictionaryUploadServlet extends HttpServlet {

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}
	
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("text/plain");
		response.setStatus(HttpServletResponse.SC_OK);
		String dictionary = request.getParameter("dictionary");
		String nameChangeMap = request.getParameter("nameChangeMap");
		SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");
		long sessionTime = Long.valueOf(request.getParameter("sessionTime"));
		String dictionaryJson = convertDictionaryToJson(dictionary);
		String nameChangeMapJson = convertNameChangeMapToJson(nameChangeMap);
		
		try {
			File dictionaryDir = new File(getServletContext().getRealPath("/dictionary"));
			if(dictionaryDir.exists()) {
				boolean saveDictionaryFile = false;
				boolean saveNameChangeMapFile = false;
				File oldDictionary = new File(dictionaryDir, "dictionary.js");
				if(oldDictionary.exists()) {
					System.out.println("Old dictionary exists");
					if(!FileUtils.readFileToString(oldDictionary).equals(dictionaryJson)) {
						saveDictionaryFile = true;
						FileUtils.moveFile(oldDictionary, new File(dictionaryDir, "dictionary.js."+format.format(new Date(sessionTime))));
						System.out.println("Moved old dictionary to dictionary.js." + format.format(new Date(sessionTime)));
					} else {
						// No changes were made
						System.out.println("No changes have been made to dictionary");
					}
				} else {
					System.out.println("Old dictionary file does not exist");
				}
				if(saveDictionaryFile) {
					File newDictionary = new File(dictionaryDir, "dictionary.js");
					if(!newDictionary.exists()) {
						newDictionary.createNewFile();
						
						System.out.println("Created new dictionary file");
					}
					FileUtils.writeStringToFile(newDictionary, dictionaryJson, false);
					
					System.out.println("Saved dictionary file");
				}
				
				File oldNameChangeMapFile = new File(dictionaryDir, "nameChangeMap.js");
				if(oldNameChangeMapFile.exists()) {
					System.out.println("Old name change map exists");
					if(!FileUtils.readFileToString(oldNameChangeMapFile).equals(nameChangeMapJson)) {
						saveNameChangeMapFile = true;
						FileUtils.moveFile(oldDictionary, new File(dictionaryDir, "nameChangeMap.js."+format.format(new Date(sessionTime))));
						System.out.println("Moved old dictionary to nameChangeMap.js." + format.format(new Date(sessionTime)));
					} else {
						// No changes were made
						System.out.println("No changes have been made to name change map");
					}
					if(saveNameChangeMapFile) {
						File newNameChangeMapFile = new File(dictionaryDir, "nameChangeMap.js");
						if(!newNameChangeMapFile.exists()) {
							newNameChangeMapFile.createNewFile();
							
							System.out.println("Created new name change map");
						}
						FileUtils.writeStringToFile(newNameChangeMapFile, nameChangeMapJson, false);
						
						System.out.println("Saved name change map");
					}
				} else {
					System.out.println("Old name change map does not exist");
				}
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	private String convertDictionaryToJson(String parameter) throws UnsupportedEncodingException {
		String decode = URLDecoder.decode(parameter, "UTF-8");
		Pattern buildingsPattern = Pattern.compile("buildings\\[(\\d+)\\]\\[(.+?)\\]\\[*(\\d*)\\]*\\[*([id\\|shapes]*)\\]*\\[*(\\d*)\\]*\\[*([id\\|path]*)\\]*=(.+)");
		Pattern parkingLotsPattern = Pattern.compile("parkinglots\\[(\\d+)\\]\\[([id\\|path]*)\\]=(.+)");
		Pattern dormsPattern = Pattern.compile("dorms\\[(\\d+)\\]\\[([id\\|path]*)\\]=(.+)");
		Pattern pathsPattern = Pattern.compile("dorms\\[(\\d+)\\]\\[([id\\|x1\\|x2\\|y1\\|y2]*)\\]=(.+)");
		Dictionary dictionary = new Dictionary();
		List<Dictionary.Building> buildings = new ArrayList<Dictionary.Building>();
		List<Dictionary.ParkingLot> parkingLots = new ArrayList<Dictionary.ParkingLot>();
		List<Dictionary.Dorm> dorms = new ArrayList<Dictionary.Dorm>();
		String[] split = decode.split("&");
		for(String s : split) {
			Matcher buildingMatcher = buildingsPattern.matcher(s);
			Matcher parkingLotMatcher = parkingLotsPattern.matcher(s);
			Matcher dormMatcher = dormsPattern.matcher(s);
			if(buildingMatcher.find()) {
				int buildingNum = Integer.valueOf(buildingMatcher.group(1));
				Dictionary.Building building;
				if(buildings.isEmpty() || buildingNum >= buildings.size()) {
					building = dictionary.new Building();
					buildings.add(buildingNum, building);
				} else {
					building = buildings.get(buildingNum);
				}
				
				if(buildingMatcher.group(2).equals("full_id")) {
					building.setFullId(buildingMatcher.group(7));
				} else if(buildingMatcher.group(2).equals("short_id")) {
					building.setShortId(buildingMatcher.group(7));
				} else if(buildingMatcher.group(2).equals("floors")) {
					List<Dictionary.Building.Floor> floors = building.getFloors();
					int floorNum = Integer.valueOf(buildingMatcher.group(3));
					Dictionary.Building.Floor floor;
					if(floors.isEmpty() || floorNum >= floors.size()) {
						floor = building.new Floor();
						floors.add(floorNum, floor);
					} else {
						floor = floors.get(floorNum);
					}
					if(buildingMatcher.group(4).equals("id")) {
						floor.setId(buildingMatcher.group(7));
					} else if(buildingMatcher.group(4).equals("shapes")) {
						List<Dictionary.Building.Floor.Shape> shapes = floor.getShapes();
						int shapeNum = Integer.valueOf(buildingMatcher.group(5));
						Dictionary.Building.Floor.Shape shape;
						if(shapes.isEmpty() || shapeNum >= shapes.size()) {
							shape = floor.new Shape();
							shapes.add(shapeNum, shape);
						} else {
							shape = shapes.get(shapeNum);
						}
						if(buildingMatcher.group(6).equals("id")) {
							shape.setId(buildingMatcher.group(7));
						} else if(buildingMatcher.group(6).equals("path")) {
							shape.setPath(buildingMatcher.group(7));
						}
						
						floor.setShapes(shapes);
					}
					
					building.setFloors(floors);
				}
				
				buildings.set(buildingNum, building);
			} else if(parkingLotMatcher.find()) {
				int parkingLotNum = Integer.valueOf(parkingLotMatcher.group(1));
				Dictionary.ParkingLot parkingLot;
				if(parkingLots.isEmpty() || parkingLotNum >= parkingLots.size()) {
					parkingLot = dictionary.new ParkingLot();
					parkingLots.add(parkingLotNum, parkingLot);
				} else {
					parkingLot = parkingLots.get(parkingLotNum);
				}
				
				if(parkingLotMatcher.group(2).equals("id")) {
					parkingLot.setFullId(parkingLotMatcher.group(3));
					parkingLot.setShortId(parkingLotMatcher.group(3));
				} else if(parkingLotMatcher.group(2).equals("path")) {
					parkingLot.setPath(parkingLotMatcher.group(3));
				} else {
					System.out.println("Error. " + parkingLotMatcher.group(2) + " does not equal id or path");
				}
			} else if(dormMatcher.find()) {
				int dormNum = Integer.valueOf(dormMatcher.group(1));
				Dictionary.Dorm dorm;
				if(dorms.isEmpty() || dormNum >= dorms.size()) {
					dorm = dictionary.new Dorm();
					dorms.add(dormNum, dorm);
				} else {
					dorm = dorms.get(dormNum);
				}
				
				if(dormMatcher.group(2).equals("id")) {
					dorm.setFullId(dormMatcher.group(3));
					dorm.setShortId(dormMatcher.group(3));
				} else if(dormMatcher.group(2).equals("path")) {
					dorm.setPath(dormMatcher.group(3));
				} else {
					System.out.println("Error. " + dormMatcher.group(2) + " does not equal id or path");
				}
			}
		}
		
		dictionary.setBuildings(buildings);
		dictionary.setParkingLots(parkingLots);
		dictionary.setDorms(dorms);
		
		return "var dictionary=" + dictionary.toString();
	}
	
	public String convertNameChangeMapToJson(String parameter) throws UnsupportedEncodingException {
		String decode = URLDecoder.decode(parameter, "UTF-8");
		Pattern buildingsPattern = Pattern.compile("buildings\\[(\\d+)\\]\\[([id\\|floors]+)\\]\\[*(\\d*)\\]*\\[*([id\\|changes]*)\\]*\\[*(\\d*)\\]*\\[*([oldId\\|changedId]*)\\]*=(.+)");
		NameChangeMap nameChangeMap = new NameChangeMap();
		List<NameChangeMap.Building> buildings = new ArrayList<NameChangeMap.Building>();
		
		String[] split = decode.split("&");
		for(String s : split) {
			Matcher buildingMatcher = buildingsPattern.matcher(s);
			if(buildingMatcher.find()) {
				int buildingNum = Integer.valueOf(buildingMatcher.group(1));
				NameChangeMap.Building building;
				if(buildings.isEmpty() || buildingNum >= buildings.size()) {
					building = nameChangeMap.new Building();
					buildings.add(buildingNum, building);
				} else {
					building = buildings.get(buildingNum);
				}
				if(buildingMatcher.group(2).equals("id")) {
					building.setId(buildingMatcher.group(7));
				} else if(buildingMatcher.group(2).equals("floors")) {
					List<NameChangeMap.Building.Floor> floors = building.getFloors();
					int floorNum = Integer.valueOf(buildingMatcher.group(3));
					NameChangeMap.Building.Floor floor;
					if(floors.isEmpty() || floorNum >= floors.size()) {
						floor = building.new Floor();
						floors.add(floorNum, floor);
					} else {
						floor = floors.get(floorNum);
					}
					if(buildingMatcher.group(4).equals("id")) {
						floor.setId(buildingMatcher.group(7));
					} else if(buildingMatcher.group(4).equals("changes")) {
						int changeNum = Integer.valueOf(buildingMatcher.group(5));
						List<NameChangeMap.Building.Floor.Change> changes = floor.getChanges();
						NameChangeMap.Building.Floor.Change change;
						if(changes.isEmpty() || changeNum >= changes.size()) {
							change = floor.new Change();
							changes.add(changeNum, change);
						} else {
							change = changes.get(changeNum);
						}
						if(buildingMatcher.group(6).equals("oldId")) {
							change.setOldId(buildingMatcher.group(7));
						} else if(buildingMatcher.group(6).equals("changedId")) {
							change.setChangedId(buildingMatcher.group(7));
						}
						
						floor.setChanges(changes);
					}
					
					building.setFloors(floors);
				}
				
				buildings.set(buildingNum, building);
			}
		}
		
		nameChangeMap.setBuildings(buildings);
		return "var importedNameChangeMap=" + nameChangeMap.toString();
	}

}
