// CS5003 Masters Programming Projects - Client Side - Start Run
// Coursework P3: Social Runner

// Define value holders
let startDateTime
let averagePace 
let description 

// Define function "loadStartRunForm" to display options to start new run
const loadStartRunForm = () => {
  // Create HTML structure
  let startRunPage = getElement("startRunPage");
  let startRunDiv = createElement("div");
  startRunDiv.id = "startRunDiv";
  let startRunButtonDiv = createElement("div");
  startRunButtonDiv.id = "startRunButtonDiv";
  let form = createElement("form");

  // Create start time input and label
  createInputFields(form, "datetime-local", "startRunTime", "Start Time: ");

  // Create start time input and label
  createInputFields(form, "time", "runPace", "Pace (min/ km): ");

  // Create run description input and label 
  createInputFields(form, "text", "runDescription", "Description: ");

  // Create start run button and add event listener
  let startRunButton = createElement("button");
  startRunButton.innerHTML = "Start New Run";
  startRunButton.id = "startRunButton";
  startRunButton.addEventListener("click", () => {
    startDateTime = document.getElementById("startRunTime").value;
    averagePace = document.getElementById("runPace").value;
    description = document.getElementById("runDescription").value;
    
    // Check if all form variables are filled with values
    if (
      !startDateTime || startDateTime.length === 0 || // check for empty string or falsy value
      !averagePace || averagePace.length === 0 || 
      !description || description.length === 0 || 
      !routePoints || (Array.isArray(routePoints) && routePoints.length === 0) || // check for empty array or falsy value
      !elevationPoints || (Array.isArray(elevationPoints) && elevationPoints.length === 0) ||
      new Date(startDateTime) <= new Date() // ensure that start date is in the future
    ) {
      alert("Fill out all fields before submitting and select a start date in the future!");
    } else {
      sendDataToServer(startDateTime, averagePace, description);
    }
  });

  // Append form and buttons to login section
  startRunButtonDiv.appendChild(startRunButton);
  startRunDiv.appendChild(form);
  startRunDiv.appendChild(startRunButtonDiv);
  startRunPage.appendChild(startRunDiv);
}


// Call "loadLoginPage" function if page is loaded
window.onload = function () {
  loadStartRunForm();
};


// Create new Route ------------------------------------------------------------------------------------------------------------------------------


// Store route information while form is filled out
let routePoints = [];
let elevationPoints = [];
let distancesFromStart = [];


// Initialise mapBox map ------------------------------------

// general mapBox setup:
mapboxgl.accessToken = 'pk.eyJ1IjoibHNrNSIsImEiOiJjbHU5cDBzZm8wOGN1MmpzOHVydXJrMHJnIn0.9ghHMN7H4ZVRWlAvL1Z1Fg';

// create a map
const map = new mapboxgl.Map({
	container: 'map', // container ID
	style: 'mapbox://styles/mapbox/outdoors-v12', // street style
	center: [-3.18, 55.94], // starting position [lng, lat] => Edinburgh
	zoom: 10,
});


// ask user to access current location to update center of card
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(position => {
    let userLocation = [position.coords.longitude, position.coords.latitude];
    console.log("user location: ", userLocation);
    map.setCenter(userLocation); 
  },
    error => {
      console.error('Error getting user location:', error);
    }
  );
} else {
  console.log("Geolocation is not supported by this browser.");
}


// add navigation controls
const nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-right');


map.on('click', function(e) {
    let lngLat = e.lngLat;

    // add the clicked point to route points array
    routePoints.push([lngLat.lng, lngLat.lat]);
    // console.log("routePoints array:", routePoints); //debugging

    //add marker at the clicked location on the map
    addMarker(lngLat);
    const elevation = getElevation(lngLat);
    elevationPoints.push(elevation);
    // console.log("elevation points", elevationPoints); //debugging

    // create directions when there are 2 or more points
    if (routePoints.length >= 2) {
        getDirections(routePoints);
        // console.log('Route:', routePoints); //debugging
    }

    // console.log('Longitude: ' + lngLat.lng + ', Latitude: ' + lngLat.lat); //debugging
});

function addMarker(lngLat) {
  new mapboxgl.Marker()
  .setLngLat([lngLat.lng, lngLat.lat])
  .addTo(map);
}

function getDirections(points) {
    // request URL for mapBox Directions API
    const waypoints = points.map(point => point.join(',')).join(';'); // join longitude and latitude
    // console.log("Waypoints", waypoints) //debugging
    const directionsRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${waypoints}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

    // request to the Directions API
    fetch(directionsRequest)
        .then(response => response.json())
        .then(data => {
            if (data.routes.length > 0) {
                displayRoute(data.routes[0].geometry);
            }
            //console.log("directions response object:", data)
            const distance = data.routes[0].distance;
            // console.log("total route distance", distance) //debugging
            distancesFromStart.push(distance);

            //show distance
            const formattedDistance = (distance/1000).toFixed(1);
            document.getElementById('distance').innerHTML = `Total Distance: ${formattedDistance} km`;

        });
}


// calculate the intercept distance
const getInterceptDistance = async (routePoints) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoibHNrNSIsImEiOiJjbHU5cDBzZm8wOGN1MmpzOHVydXJrMHJnIn0.9ghHMN7H4ZVRWlAvL1Z1Fg'; 
  
  // console.log("routepoints", routePoints) //debugging
  const endPoint = routePoints.slice(-1);

  let interceptDistances = [];

  for (let i = 0; i < routePoints.length -1; i++) {
    // console.log("route point", i, routePoints[i]); //debugging
    let interceptPoints = [routePoints[i], endPoint];
    // console.log("intercept", interceptPoints); //debugging
    const waypoints = interceptPoints.map(point => point.join(',')).join(';');
    const distanceRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${waypoints}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
    try {
        const response = await fetch(distanceRequest);
        const data = await response.json();
  
        // Extract the distance between a meeting point and the end point from the response
        const distance = data.routes[0].distance;
        interceptDistances.push(distance);
  
    } catch (error) {
        console.error('Error:', error);
        throw error; 
    }

  }

  // console.log("interceptDistances inside getInterceptDistance", interceptDistances); //debugging
  return interceptDistances

}

function displayRoute(geometry) {
    // remove if a route is already loaded, remove it
    if (map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
    }

    // add route layer
    map.addLayer({
        id: 'route',
        type: 'line',
        source: {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: geometry
            }
        },
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#1db7dd',
            'line-width': 8
        }
    });
}

// Function to get the elevation of a location
// Accessed April 03, 2024, from https://docs.mapbox.com/help/tutorials/find-elevations-with-tilequery-api/#mapbox-terrain-tileset 

async function getElevation(lngLat) {
  // Construct the API request
  const query = await fetch(
    `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${lngLat.lng},${lngLat.lat}.json?layers=contour&limit=50&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );
  if (query.status !== 200) return;
  const data = await query.json();
  // Get all the returned features.
  const allFeatures = data.features;
  // console.log("all features", allFeatures);

  // For each returned feature, add elevation data to the elevations array. (because of how the mapbox elevation layers are built)
  const elevations = allFeatures.map((feature) => feature.properties.ele);
  // console.log("elevation", elevations);

  // In the elevations array, find the largest value.
  const highestElevation = Math.max(...elevations);
  // console.log("highest elevation", highestElevation); //debugging

  // return elevation of the location (= highest elevation)
  return highestElevation
}

// Pressed when clicking on the "Start new Run" button - sends all information to create the new run to the server
function sendDataToServer(startDateTime, averagePace, description) {
  console.log('This new route will be submitted to the server:');
  console.log('distance', distancesFromStart); //debugging
  console.log('startDateTime', startDateTime); //debugging
  console.log('averagePace', averagePace); //debugging
  console.log('description', description); //debugging

  // Wait for all elevation points promises to resolve
  Promise.all(elevationPoints)
    .then((values) => {
      // Extract the resolved elevation values
      // console.log("Resolved elevation values:", values); //debugging
      let elevationValues = values
      
      // Send the fetch request with the resolved elevation values
      return fetch('http://localhost:24980/submit-new-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDateTime, averagePace, routePoints, elevationValues, distancesFromStart, description}), 
      });
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Could not submit new run');
      }
    })
    .then(data => {
      const message = data.message;
      window.location.href = '/join.html'; 
      console.log(message); 
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


// IDENTICAL TO SUPPORT FUNCTIONS IN LOGIN-PAGE
// Added support functions to simplify creation of HTML elements using JS ------------------------------------------------------------------------------------
// Create support function "createElement" to simplify creation of new HTML elements
const createElement = (name) => {
  return document.createElement(name);
}
  
// Create support function "getElement" to simplify access to specific HTML elements via ID
const getElement = (name) => {
  return document.getElementById(name);
}

// Define support function "createInputFields" to simplify process to create new HTML input fields and labels
const createInputFields = (form, type, id, labelName) => {
let div = createElement("div");
let input = createElement("input");
input.type = type;
input.id = id;
let label = createElement("label");
label.innerHTML = labelName;

div.appendChild(label);
div.appendChild(input);
form.append(div);
}

// Define support function "createDropdown" to simplify process to create new HTML dropdown menus
const createDropdown = (form, options, id, labelName) => {
let div = createElement("div");
let input = createElement("select");
input.id = id;
let label = createElement("label");
label.innerHTML = labelName;

for (let option of options) {
    let dropDownElement = document.createElement("option");
    dropDownElement.text = option;
    dropDownElement.value = option;
    input.add(dropDownElement);
}

div.appendChild(label);
div.appendChild(input);
form.append(div)
}

