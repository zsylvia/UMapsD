"""
Currently doesn't parse paths for non path/polygon types (rectangles)
Outputs as blank string 
	(e.g.)
	id: "classroom101",
	path: ''
Raphael seems to throw an error when it gets to these values, so I removed them for 'campus2.js'

Documentation:
expected svg structure:
	<campus>
		<academic buildings>
			<building 1>
				<floor1>
					<group 1>
						<element 1>
							<path>
						<element 2>
							<path>
						...
						<element n>
						<path>
					<group 2>
					...
					<group n>
				<floor 2>
					...
				...
				<floor n>

			<building 2>
			...
			<building n>
		<dorms>
			<dorm 1>
			<dorm 2>
			...
			<dorm n>
		<parkinglots>
			<lot 1>
			...
			<lot n>


"""
import xml.etree.ElementTree as etree
import os

def getChildren(parent):
	'Retrive elements one level down'
	children = []
	for child in parent:
		children.append(child)
	return children

def getGrandChildren(grandParent):
	'Retrieve elements two levels down'
	grandChildren = []
	for parent in grandParent:
		for grandchild in parent:
			grandChildren.append(grandchild)
	return grandChildren

def getBuildings(root):
	'pass in root, return list of buildings'
	'Buildings are two levels down from svg root'
	buildings = list(getGrandChildren(root))
	return buildings

def getFloors(building):
	floors = list(getChildren(building))
	return floors

def getRooms(floorBucket):
	'Rooms are two levels down'
	rooms = list(getGrandChildren(floorBucket))
	return floors

def findBucket(floor, bucketName):
	'Returns the parent element of the desired bucket ("SP-PLAREA", "SP-PLHALL", "SP-GROSS", "SP-PLMISC")'
	desiredBucket = 0
	for bucket in floor:
		if bucket.get('id').startswith(bucketName):
			desiredBucket = bucket
	if desiredBucket == 0:
		print 'Can\'t find ' + bucketName
	return desiredBucket

def parseRoom(room):
	"""
	writes string for given room (e.g.)
						{
							id: "classroom107b",
							path: "M     403.408,121.231 409.847,127.673 409.847,114.791    z"
						},
	"""
	headString = """\n						{
							id: '"""
	pathString = """
							path: '"""
	vector = ''
	tail = """
						}"""

	id = room.get('id')

	polygon = room[0].get('points')
	# print polygon
	if polygon is not None:
		polygon = 'M' + polygon + 'z'
	path = room[0].get('d')
	if polygon is not None:
		vector = polygon
	elif path is not None: #add in shapes for elevators
		vector = path
	return headString + id + "'," + pathString + vector + "'" + tail + ","

def parseAllRoomsOnFloor(floor):
		fullString = ''
		for bucketgroup in [stringConstants['roomtypes']['floorOutline'], stringConstants['roomtypes']['classrooms'], stringConstants['roomtypes']['hallways'], stringConstants['roomtypes']['misc']]:
			bucket = findBucket(floor, bucketgroup)
			roomsString = ''
			for room in bucket:
				 roomsString += parseRoom(room)
			fullString += roomsString
		return(fullString[:-1] + ']\n')



"""
String constants used for writing dictionary file
May or may not use these
"""
stringConstants = {'buckets': {'academic': "Academic"}, 'buildings': {'dion': "DION", 'seng': "SENG"}, 'roomtypes': {'floorOutline': "SP-GROSS", 'classrooms': "SP-PLAREA", 'hallways': "SP-PLHALL", 'misc': "SP-PLMISC"}}

fileHead = """var dictionary = 
{
	buildings: [
"""

fileTail = """\n	]
}
"""

#building strings for dict
buildTail = """\n			]
		}"""
buildingTail = """	]
		}"""
bh1 = 	"""		{
			full_id: '""" 
bh2 = 	"""
			short_id: '"""
bh3 = 	"""
			floors: ["""
#floor strings for dict

floorInfo1 = """
				{
					id: '"""
floorInfo2 = """\n					shapes: [
"""


"""
End string constants
"""

"""
Open necessary files
"""

dataFile = 'campus_only_dion_seng.svg'
dictionary = open('campus.js', 'w')

if os.path.exists(dataFile) != True:
	tmp = open(dataFile, 's')
	tmp.write("<list/n</list")
	tmp.close()

"""
"""

dictionary.write(fileHead)

print fileHead

x = etree.parse(dataFile)
root = x.getroot()

buildings = getBuildings(root)

buildingString = ''

for building in buildings:
	buildingHead = '\n' + bh1 + building.get('id') + "'," + bh2 + building.get('id') + "'," + bh3 
	buildingString += buildingHead
	floors = list(getFloors(building))
	for floor in floors:
		floorString = floorInfo1 + floor.get('id') + "'," + floorInfo2
		buildingString += floorString + parseAllRoomsOnFloor(floor) + '				},'

	buildingString = buildingString[:-1] + buildTail + ','

buildingString = buildingString[:-1] + fileTail

dictionary.write(buildingString)


print 'Running...'
