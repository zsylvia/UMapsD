var x = document.getElementById("demo");
			function getLocation() {
			    if (navigator.geolocation) {
			        navigator.geolocation.getCurrentPosition(showPosition);
			    } else {
			        x.innerHTML = "Geolocation is not supported by this browser.";
			    }
			}
			function showPosition(position) {
			    x.innerHTML = "Latitude: " + position.coords.latitude + 
			    "<br>Longitude: " + position.coords.longitude; 
			    //piller coord = 41.628582, -71.006126
			}

			function tryingStuff(){

				$(".dropdown-menu li a").click(function(){
  					$(this).parents(".input-group-btn").find('.btn').text($(this).text());
 				 	$(this).parents(".input-group-btn").find('.btn').val($(this).text());
 				 });
			}
			function LoadItUp(){
				$("#FromDropdown").hide();
				$("#ToDropdown").hide();
				$("#handicap_toggle").hide();
				$("#generate_path").hide();
			}
			function startupDirections(){
				$("#FromDropdown").show();
				$("#ToDropdown").show();
				$("#direction_btn").hide();
				$("#handicap_toggle").show();
				$("#generate_path").show();

			}

			function clearAll(){
				$("#inputRoom").hide();
				$("#academicBuildingsDropI").hide();
				$("#eateriesDropI").hide();
				$("#residentialDropI").hide();
				$("#athleticFieldDropI").hide();
			}


			function clearAllO(){
				$("#inputORoomShow").hide();
				$("#academicBuildingsDropO").hide();
				$("#eateriesDropO").hide();
				$("#residentialDropO").hide();
				$("#athleticFieldDropO").hide();
			}

			function academicBuildingsDropIShow(){
				$("#academicBuildingsDropI").show();
			}

			function athleticFieldDropIShow(){
				$("#athleticFieldDropI").show();
			}

			function eateriesDropIShow(){
				$("#eateriesDropI").show();
			}

			function residentialDropIShow(){
				$("#residentialDropI").show();
			}

			function inputRoomShow() {
					$("#inputRoom").show();		    
			}

			function academicBuildingsDropOShow(){
				$("#academicBuildingsDropO").show();
			}

			function athleticFieldDropOShow(){
				$("#athleticFieldDropO").show();
			}

			function eateriesDropOShow(){
				$("#eateriesDropO").show();
			}

			function residentialDropOShow(){
				$("#residentialDropO").show();
			}

			function inputORoomShow() {
					$("#inputORoomShow").show();		    
			}