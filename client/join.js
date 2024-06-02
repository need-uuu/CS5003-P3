// CS5003 Masters Programming Projects - Client Side - Join Run
// Coursework P3: Social Runner


// Global variable to store all upcoming runs sorted in ascending order by start time
let runsArray = []

// Define function "loadUpcomingRuns to get all upcoming runs from database
const loadUpcomingRuns = () => {
  fetch("http://localhost:24980/getUpcomingRuns")
    .then(response => response.json())
    .then(data => {
      console.log("run data", data);
      getRunInfos(data);
      runsArray = data.map(element => element.run);
    })
    .catch(error => console.error("Fetch error:", error));
}

// Call "loadUpcomingRuns" function if page is loaded
window.onload = () => {
  loadUpcomingRuns()
}

// Add click event listener to the sortButton
let sortButton = document.getElementById("sortRuns");

sortButton.addEventListener('click', () => {
  sortButton.disabled = true; // Disable button if clicked once
  let userLocation = [-3.1934017, 55.9525694]; // Default location (Edinburgh)

  // Get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      userLocation = [position.coords.longitude, position.coords.latitude];
      calculateDistance(runsArray, userLocation)
        .then(distance => {
          displayUserLocation(userLocation);
          sendDistancesToServer(distance);
        })
        .catch(error => { console.error('Error calculating distance:', error); });
    },
      error => {
        console.error('Error getting user location:', error);
        console.log("Using default user location (Edinburgh):", userLocation);
        calculateDistance(runsArray, userLocation)
          .then(distance => {
            displayUserLocation(userLocation);
            sendDistancesToServer(distance);
          })
          .catch(error => { console.error('Error calculating distance:', error); });
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
    calculateDistance(runsArray, userLocation)
      .then(distance => {
        displayUserLocation(userLocation);
        sendDistancesToServer(distance);
      })
      .catch(error => {
        console.error('Error calculating distance:', error);
      });
  }
});


// Define function to calculate the distance between two points using Mapbox API
const calculateDistance = (runsArray, userLocation) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoibHNrNSIsImEiOiJjbHU5cDBzZm8wOGN1MmpzOHVydXJrMHJnIn0.9ghHMN7H4ZVRWlAvL1Z1Fg';

  return Promise.all(runsArray.map(async (run) => {
    let startLocation = run.routePoints[0];
    let points = [startLocation, userLocation];
    const waypoints = points.map(point => point.join(',')).join(';');
    const distanceRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${waypoints}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

    return fetch(distanceRequest)
      .then(response => response.json())
      .then(data => {
        const distanceInMeters = data.routes[0].distance;
        return distanceInMeters / 1000;
      });
  }));
}


// Define function "sendDistancesToServer" to send an array of distances between userLocation and startingPoint
const sendDistancesToServer = (data) => {
  fetch("http://localhost:24980/submitDistances", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      distanceArray: data,
    }),
  })
    .then(response => {
      if (response.ok) {
        return response.json()
          .then(data => {
            console.log(data)
            getRunInfos(data)
          })
      } else {
        return response.json().then(error => {
          alert(error.message);
        });
      }
    })
    .catch(error => {
      console.error("Fetch error:", error);
    });
}


// Define function to obtain name of user location based on latitude and longitude via OpenWeather API
const displayUserLocation = (userLocation) => {
  let latitude = userLocation[1];
  let longitude = userLocation[0];
  let apiKey = "765e7458998df3ad30d93f49e9c7f7bc";
  let defaultLocation = [-3.1934017, 55.9525694];

  // Check if user location is equal to default location
  if (latitude === defaultLocation[1] && longitude === defaultLocation[0]) {
    document.getElementById("userLocation").innerHTML = "The prioritization algorithm uses the default user location (City of Edinburgh)";
    return; // Exit function 
  }

  fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Response with error");
      }
    })
    .then(data => {
      let locationName = data[0].name;
      document.getElementById("userLocation").innerHTML = `Runs close to your current location in ${locationName} are prioritized`;
    })
    .catch(error => {
      console.error("Fetch error:", error);
    });
}

//Overarching function to create card, get weather, display map for every run -------------------------------------------------------------------------------------
//get run infos for every run from the database response object:
function getRunInfos(data) {
  // Ensure that cards feed is cleared
  document.getElementById("cards_feed").innerHTML = "";

  for (let i = 0; i < data.length; i++) {

    //extract one run at a time
    let run = data[i].run
    let score = data[i].score

    //call add card function to create a single card for that run
    createCard(run, score);

    //call display weather function to display the weather in the weather div
    getWeather(run);

    //call display map function to display map in map div
    displayRouteOnMap(run);
  }
}

//Get weather and display it in the card ---------------------------------------------------------------------------------------------------------------------------
function getWeather(run) {

  const runID = run._id;
  const location = run.routePoints[0];
  const startDateTime = run.startDateTime;

  // weather forecast 
  async function weatherforecast(runID, location, startDateTime) {

    // for debugging:
    // console.log("weatherforecast runID", runID);
    // console.log("weatherforecast lcoation", location);
    // console.log("weatherforecast startTimeDate", startDateTime);

    const lat = location[1];
    const lon = location[0];

    //check if requested date is more than 5 days in the future
    const currentDate = new Date();
    const requestedDate = new Date(startDateTime);
    const differenceInDays = (requestedDate - currentDate) / (1000 * 3600 * 24);

    if (differenceInDays > 5) {
      //display that there is no forecast data available by setting the elements to n/a
      document.getElementById(`weathercond_${runID}`).innerHTML = "Weather forecast is not yet available for this run!";
      document.getElementById(`temperature_${runID}`).style.display = "none";
      document.getElementById(`wind_${runID}`).style.display = "none";
      return;
    }


    const apiKey = "765e7458998df3ad30d93f49e9c7f7bc";
    const units = 'metric';
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${apiKey}&units=${units}`;

    try {
      const response = await fetch(weatherApiUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      const timestamp = new Date(startDateTime).getTime() / 1000;

      for (let i = 0; i < data.list.length - 1; i++) {
        const currentTimestamp = data.list[i].dt;

        if (timestamp >= currentTimestamp) {
          const fordate = new Date(data.list[i + 1].dt * 1000).toISOString().split('T')[0];

          const foreWeatherInfo = {
            runID: runID,
            date: fordate,
            weatherDay: data.list[i + 1].weather[0].main,
            temperature: roundToOneDecimal(data.list[i + 1].main.temp),
            windSpeed: roundToOneDecimal(data.list[i + 1].wind.speed)
          };

          function roundToOneDecimal(num) {
            return Math.round(num * 10) / 10;
          }

          document.getElementById(`weathercond_${runID}`).innerHTML = `Weather: ${foreWeatherInfo.weatherDay}`;
          document.getElementById(`temperature_${runID}`).innerHTML = `Temperature: ${foreWeatherInfo.temperature} °C`;
          document.getElementById(`wind_${runID}`).innerHTML = `Wind Speed: ${foreWeatherInfo.windSpeed} m/s`;
          console.log("weatherforcast fetched and put into HTML for ", runID)

          console.log("foreweatherinfo", foreWeatherInfo);
          return foreWeatherInfo;
        }
      }

    }
    catch (error) {
      console.error('There was a problem with the weather API operation:', error);
    }
  }

  weatherforecast(runID, location, startDateTime);
}


//Create a card ------------------------------------------------------------------------------------------------------------------------------------------------------
function createCard(run, score) {

  const runID = run._id;
  const date = new Date(run.startDateTime.slice(0, 10));
  const time = run.startDateTime.slice(11, 16);
  const totalDistance = run.totalDistance;
  const averagePace = run.averagePace;
  const dateFormatted = formatDate(date);
  const startDateTime = dateFormatted + " at " + time;
  const feed = document.getElementById("cards_feed"); //feed div in which all cards will be in
  const numberOfComments = run.comments.length

  //transform difficulty score into categories because that's easier to understand for the user
  let runDifficulty;
  if (run.runDifficulty < 40) {
    runDifficulty = "Easy";
  } else if (run.runDifficulty < 70) {
    runDifficulty = "Medium";
  } else if (run.runDifficulty >= 70) {
    runDifficulty = "Hard"
  }

  //card div (card for one run)
  const cardDiv = document.createElement("div");
  cardDiv.className = "card";
  cardDiv.id = `run_${runID}`;
  feed.appendChild(cardDiv);

  //weather div (where the weather is displayed inside a card)
  const weatherDiv = document.createElement("div");
  weatherDiv.className = "card_weather";
  weatherDiv.id = `weather_${runID}`;
  cardDiv.appendChild(weatherDiv);

  //weather conditions
  const weatherConditionsP = document.createElement("p");
  weatherConditionsP.className = "card_weather";
  weatherConditionsP.id = `weathercond_${runID}`;
  weatherDiv.appendChild(weatherConditionsP);

  //weather temperature
  const weatherTempP = document.createElement("p");
  weatherTempP.className = "card_weather";
  weatherTempP.id = `temperature_${runID}`;
  weatherDiv.appendChild(weatherTempP);

  //weather wind
  const weatherWindP = document.createElement("p");
  weatherWindP.className = "card_weather";
  weatherWindP.id = `wind_${runID}`;
  weatherDiv.appendChild(weatherWindP);
  console.log("weather paragraphs created for ", runID);

  // score div
  const scoreDiv = document.createElement("div")
  scoreDiv.className = "card_score";
  scoreDiv.id = `score_${runID}`;
  cardDiv.appendChild(scoreDiv);
  if (score == 0) {
    scoreDiv.innerHTML = "Time Sorted";
  } else {
    scoreDiv.innerHTML = "Match: " + Math.round(score) + "%";
  }

  //map div (where the map is displayed inside a card)
  const mapDiv = document.createElement("div");
  mapDiv.className = "card_map";
  mapDiv.id = `map_${runID}`;
  cardDiv.appendChild(mapDiv);

  //content div (where time, description, distance etc. goes into)
  const contentDiv = document.createElement("div");
  contentDiv.className = "card_content";
  contentDiv.id = `content_${runID}`;
  cardDiv.appendChild(contentDiv);

  //append more elements into content div, e.g. one paragraph for time, one for distance etc.
  //start time
  const timeP = document.createElement("p");
  timeP.className = "card_content_p";
  timeP.id = `content_time_${runID}`;
  contentDiv.appendChild(timeP);
  timeP.innerHTML = startDateTime;

  //description
  const descriptionP = document.createElement("p");
  descriptionP.className = "card_content_p";
  descriptionP.id = `content_description_${runID}`;
  contentDiv.appendChild(descriptionP);
  descriptionP.innerHTML = run.description;

  //total distance
  const distanceP = document.createElement("p");
  distanceP.className = "card_content_p";
  distanceP.id = `content_distance_${runID}`;
  contentDiv.appendChild(distanceP);
  distanceP.innerHTML = "Total Distance: " + run.totalDistance + " km";

  //total elevation
  const elevationP = document.createElement("p");
  elevationP.className = "card_content_p";
  elevationP.id = `content_elevation_${runID}`;
  contentDiv.appendChild(elevationP);
  elevationP.innerHTML = "Total Elevation: " + run.totalElevation + " m";

  //pace
  const paceP = document.createElement("p");
  paceP.className = "card_content_p";
  paceP.id = `content_pace_${runID}`;
  contentDiv.appendChild(paceP);
  paceP.innerHTML = "Pace: " + run.averagePace + " min/km";

  //organiser
  const organiserP = document.createElement("p");
  organiserP.className = "card_content_p";
  organiserP.id = `content_organiser_${runID}`;
  contentDiv.appendChild(organiserP);
  organiserP.innerHTML = "Organised by " + run.participants[0];

  //difficulty score
  const difficultyP = document.createElement("p");
  difficultyP.className = "card_content_p";
  difficultyP.id = `content_difficulty_${runID}`;
  contentDiv.appendChild(difficultyP);
  difficultyP.innerHTML = "Difficulty Level: " + runDifficulty;

  //dropdown menu meeting point
  const meetingpointDropdown = document.createElement('select');
  meetingpointDropdown.id = 'meetingPoints_dropdown';
  const options = generateOptions(run.routePoints);
  //console.log("distances to end", run.distancesToEnd);
  const optionValues = getOptionValues(run.distancesToEnd);
  const labelName = "Choose Starting Point: ";
  createDropdownRunCards(runID, contentDiv, options, optionValues, `meetingPoints_dropdown_${runID}`, labelName, totalDistance, time, averagePace);

  //div to show changed parameters if meeting point is selected
  const changedParametersDiv = document.createElement("div");
  changedParametersDiv.className = "card_content";
  changedParametersDiv.id = `newParameters_${runID}`;
  cardDiv.appendChild(changedParametersDiv);

  //overlay div (where comments and join button go into)
  const overlayDiv = document.createElement("div");
  overlayDiv.className = "card_overlay";
  overlayDiv.id = `overlay_${runID}`;
  cardDiv.appendChild(overlayDiv);

  //comment field
  const commentsField = document.createElement("input");
  commentsField.className = "comment_field";
  commentsField.id = `overlay_commentField_${runID}`;
  commentsField.type = "text";
  overlayDiv.appendChild(commentsField);

  //comment button
  const commentsBtn = document.createElement("button");
  commentsBtn.className = "button";
  commentsBtn.id = `overlay_commentBtn_${runID}`;
  overlayDiv.appendChild(commentsBtn);
  commentsBtn.innerHTML = "Add comment";
  commentsBtn.addEventListener("click", () => { sendComment(runID) })

  //signup button div
  const signupDiv = document.createElement("div");
  signupDiv.className = "card_signup";
  signupDiv.id = `signup_${runID}`;
  cardDiv.appendChild(signupDiv);

  //sign up button
  const signUpBtn = document.createElement("button");
  signUpBtn.className = "signupButton";
  signUpBtn.id = `signup_Btn_${runID}`;
  signupDiv.appendChild(signUpBtn);
  signUpBtn.innerHTML = "Join Run";
  signUpBtn.addEventListener("click", () => joinRun(run));

  //text to expand comments section
  const commentExpand = document.createElement("div");
  commentExpand.className = "previous_comments_div";
  const commentExpandText = document.createElement("p");
  commentExpandText.id = `comment-expand-${runID}`;
  commentExpandText.innerHTML = `Show all comments (${numberOfComments})`;
  commentExpandText.style.fontSize = "12px"
  commentExpandText.style.cursor = "pointer"
  commentExpandText.addEventListener("click", () => { showAllComments(runID, numberOfComments) });

  //comments section 
  const previousCommentsDiv = document.createElement("div");
  previousCommentsDiv.id = `previous-comments-div-${runID}`;
  previousCommentsDiv.style.display = "none"

  commentExpand.appendChild(commentExpandText);
  commentExpand.appendChild(previousCommentsDiv);
  cardDiv.appendChild(commentExpand);
  cardDiv.appendChild(previousCommentsDiv)

  //show all participants button
  const participantsBtn = document.createElement("button")
  participantsBtn.className = "participantButton"
  participantsBtn.id = `participant_btn_${runID}`
  overlayDiv.appendChild(participantsBtn)
  participantsBtn.innerHTML = "Show all participants";
  participantsBtn.addEventListener("click", () => showAllParticipants(runID))
}

//support functions -------------------------------------------------------------------------------------------------------------------------------------------------
//bring date into right format
function formatDate(date) {
  // Convert the Date object into the desired format
  const formattedDate = date.toLocaleDateString('en-GB', {
    day: 'numeric', // numeric day of the month
    month: 'long',  // full name of the month
    year: 'numeric' // numeric year
  });
  return formattedDate
}

//generate options in drop down
function generateOptions(routePoints) {
  let options = ["Start"];
  for (let i = 1; i < routePoints.length - 1; i++) {
    options.push("Meeting point " + i);
  }
  return options
}

//generate option values in drop down
function getOptionValues(distancesToEnd) {
  // console.log("distances to end", distancesToEnd)
  let optionValues = [];
  for (let i = 0; i < distancesToEnd.length; i++) {
    optionValues.push(distancesToEnd[i]);
  }
  return optionValues
}

//create the drop down menu
const createDropdownRunCards = (runID, container, options, optionValues, id, labelName, totalDistance, time, averagePace) => {
  let div = document.createElement("div");
  let input = document.createElement("select");
  input.id = id;
  let label = document.createElement("label");
  label.innerHTML = labelName;
  label.htmlFor = id;

  for (let i = 0; i < options.length; i++) {
    let optionText = options[i];
    let optionValue = optionValues[i];
    let dropDownElement = document.createElement("option");
    dropDownElement.text = optionText;
    dropDownElement.value = optionValue;
    input.add(dropDownElement);
    // console.log("options in dropdown: text, value: ", dropDownElement.text, dropDownElement.value);
  }

  div.appendChild(label);
  div.appendChild(input);


  //add eventlistener to dropdown menu
  input.addEventListener("change", () => {
    //clear parameter div
    let parameterDiv = document.getElementById(`newParameters_${runID}`);
    parameterDiv.innerHTML = "";

    // Get dropdown value and text
    let selectedIndex = input.selectedIndex;
    let dropdownValue = input.value;
    let dropdownText = input.options[selectedIndex].text;

    if (dropdownText !== "Start") {
      let interceptDistance = document.createElement("p");
      interceptDistance.innerHTML = `Updated Distance: ${dropdownValue} km`;

      let distanceDifference = totalDistance - dropdownValue;
      let elapsedTime = Math.ceil(convertPace(averagePace) * distanceDifference);

      let newTime = addMinutesToTime(time, elapsedTime);

      let updatedStartTimeP = document.createElement("p");
      updatedStartTimeP.innerHTML = `Updated Start Time: ${newTime}`;

      parameterDiv.appendChild(interceptDistance);
      parameterDiv.appendChild(updatedStartTimeP);
    }
  });
  container.append(div);
}

//convert pace into a number
const convertPace = (pace) => {
  let timeComponents = pace.split(":");
  let minutes = parseInt(timeComponents[0]);
  let seconds = parseInt(timeComponents[1]);
  let convertedTime = minutes + (seconds / 60);
  return convertedTime
}

//calculate new time
function addMinutesToTime(timeStr, minutesToAdd) {
  // Split the time string into hours and minutes
  var parts = timeStr.split(':');
  var hours = parseInt(parts[0], 10);
  var minutes = parseInt(parts[1], 10);

  // Add the minutes
  var newMinutes = minutes + minutesToAdd;

  // Handle minutes overflow and adjust hours accordingly
  hours += Math.floor(newMinutes / 60);
  minutes = newMinutes % 60;

  // Adjust for hours overflow (e.g., beyond 24 hours)
  hours = hours % 24;

  // Ensure hours and minutes are formatted to two digits
  var formattedHours = hours < 10 ? '0' + hours : hours.toString();
  var formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();

  // Format the result as a string
  var newTime = formattedHours + ':' + formattedMinutes;
  return newTime;
}

//function to redirect the user to the specified webpage
function redirectPersonalPage() {

  nextPage = 'profile2.html'

  console.log("redirecting...")

  fetch("/getPersonalDetails")
    .then(data => {
      console.log(data)
    })

  window.location.href = nextPage
}

// display comment function
function displayComment(commentData, runID) {
  const commentContainer = document.querySelector(`[data-card-id="${runID}"] .card__comments-container`);
  console.log(commentContainer);
  if (commentContainer) {
    const newComment = document.createElement('div');
    newComment.className = 'comment';
    newComment.textContent = `${commentData.comment} - ${new Date(commentData.createdAt).toLocaleString()}`;
    commentContainer.appendChild(newComment);
  } else {
    console.log('Comment container not found for cardId:', runID);
  }
}

// Functions to bring the map on each card -----------------------------------------------------------------------------------------------------------------------

// Fetch the Route and display it
async function fetchAndDisplayRoute(map, routePoints) {
  // Convert route points into a format accepted by the Directions API
  const waypoints = routePoints.map(point => point.join(',')).join(';');
  const directionsRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${waypoints}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

  try {
    // Fetch the directions
    const response = await fetch(directionsRequest);
    const data = await response.json();
    if (data.routes.length > 0) {
      displayRoute(map, data.routes[0].geometry);
    }
  } catch (error) {
    console.error("Failed to fetch route", error);
  }
}

// Display the Route on the map
function displayRouteOnMap(run) {
  // general mapBox setup:
  mapboxgl.accessToken = 'pk.eyJ1IjoibHNrNSIsImEiOiJjbHU5cDBzZm8wOGN1MmpzOHVydXJrMHJnIn0.9ghHMN7H4ZVRWlAvL1Z1Fg'; // TOKEN from mapBox website, maybe take our own token?

  const runID = run._id;
  console.log("runID", runID);

  const routePoints = run.routePoints;
  //console.log("routepoints", routePoints);

  // create a map
  const map = new mapboxgl.Map({
    container: `map_${runID}`, // container ID
    style: 'mapbox://styles/mapbox/outdoors-v12', // street style
    center: [routePoints[0][0], routePoints[0][1]],
    zoom: 10,
  });


  map.on("style.load", function () {

    const hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "map-popup"
    })

    for (let i = 0; i < routePoints.length; i++) {
      //create a marker
      let marker = new mapboxgl.Marker()
        .setLngLat([routePoints[i][0], routePoints[i][1]])
        .addTo(map);

      //prepare content for popup based on marker
      let popupContent;
      if (i === 0) {
        popupContent = "Start";
      } else if (i === routePoints.length - 1) {
        popupContent = "End";
      } else {
        popupContent = `<p>Meeting point: ${i}</p>`;
      }

      //add mouseenter event for hovering over marker to show popup
      marker.getElement().addEventListener('mouseenter', () => {
        hoverPopup
          .setLngLat(marker.getLngLat())
          .setHTML(popupContent)
          .addTo(map);
      });

      //add mouseleave event to remove popup
      marker.getElement().addEventListener('mouseleave', () => {
        hoverPopup.remove();
      });

    }

    //make sure map is zoomed and centered correctly
    map.on('load', function () {
      //calculate bounds
      const bounds = routePoints.reduce(function (bounds, coord) {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(routePoints[0], routePoints[0]));

      //fit the map to bounds
      map.fitBounds(bounds, {
        padding: 20,
        animate: true
      });
      map.resize();
    });
  });

  map.on('load', async () => {
    //display route when loaded
    await fetchAndDisplayRoute(map, routePoints);
    map.resize();
  });
}

//display the route
function displayRoute(map, geometry) {
  // remove if a route is already loaded, remove it
  if (map.getSource('route')) {
    map.removeLayer('route');
    map.removeSource('route');
  }
  map.resize();

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


// --------------------------------------------------------- functions to add comments and join runs 


//add event listener to "Join Run" button that gets the username and sends it to the server
function joinRun(run) {
  console.log("Join Run button clicked", run);

  //disable join button after being clicked
  const joinButton = document.getElementById(`signup_Btn_${run._id}`);
  joinButton.innerHTML = "Signed Up";
  joinButton.disabled = true;


  let optionSelected = document.getElementById(`meetingPoints_dropdown_${run._id}`).value;
  // console.log("selected value: ", optionSelected)

  const joinRunObject = {
    runID: run._id,
    participantDistance: optionSelected
  }

  fetch("http://localhost:24980/joinRun", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ joinRunObject }),
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      }
    })
}


//adding event listerner to the "submit comment" button that constructs the comment and posts it to the server
function showAllComments(runID, numberOfComments) {

  let commentExpandText = document.getElementById(`comment-expand-${runID}`)
  let previousCommentsContainer = document.getElementById(`previous-comments-div-${runID}`);

  //change the look and text of the comments section depending on the current state and the user's click
  if (commentExpandText.innerHTML === `Show all comments (${numberOfComments})`) {

    // console.log("getting comments from server...")

    //fetch all comments for the specified run 
    fetch("/getComments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ runID: runID })
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        //loop through all objects and create the comments
        previousCommentsContainer.innerHTML = ""
        data.forEach(commentObject => {
          displayCardComment(runID, commentObject)
        })
        //create comments from database
        previousCommentsContainer.style.display = "display"

      })
      .catch(error => {
        console.error("Error fetching comments:", error);
      });

    commentExpandText.innerHTML = "Hide all comments"
  } else if (commentExpandText.innerHTML === "Hide all comments") {
    commentExpandText.innerHTML = `Show all comments (${numberOfComments})`
    previousCommentsContainer.style.display = "none"
  }
}

//function to send the comment to the server
function sendComment(commentRunID) {

  let commentText = document.getElementById(`overlay_commentField_${commentRunID}`).value

  //get the current date and time ie when the comment was made (note this gets the ISO current date and time not UK)
  let currentDate = new Date()
  let isoDateTime = currentDate.toISOString();
  let commentDateTime = isoDateTime.slice(0, 16)

  let commentObject = { runID: commentRunID, commentText: commentText, commentDateTime: commentDateTime }

  fetch("http://localhost:24980/addNewComment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commentObject }),
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      }
    })
    .then(data => {
      let commentObject2 = { user: data.user, comment: commentText, date: commentDateTime }
      displayCardComment(commentRunID, commentObject2)
    })

}

//run function to temporarily display the comment on the card
function displayCardComment(runID, commentObject) {
  // Destructure the comment object
  const { user, comment, date } = commentObject;

  let commentField = document.getElementById(`overlay_commentField_${runID}`);
  commentField.value = "";

  let formattedDateTime = formatDateTime(date);

  let commentDiv = document.getElementById(`previous-comments-div-${runID}`);
  commentDiv.style.display = "block";
  commentDiv.className = "individual_comments_div"

  let commentExpandText = document.getElementById(`comment-expand-${runID}`);
  commentExpandText.innerHTML = "Hide all comments";

  let commentContainer = document.createElement("div");
  commentContainer.classList.add("comment-container");

  let commentHeader = document.createElement("p");
  commentHeader.classList.add("comment-header");
  commentHeader.innerHTML = `${user} wrote at ${formattedDateTime}:`;

  let commentParagraph = document.createElement("p");
  commentParagraph.classList.add("comment-paragraph");
  commentParagraph.innerHTML = `${comment}`;

  let lineBreak = document.createElement("hr");
  lineBreak.classList.add("comment-linebreak");

  commentContainer.appendChild(commentHeader);
  commentContainer.appendChild(commentParagraph);
  commentContainer.appendChild(lineBreak);
  commentDiv.appendChild(commentContainer);
}

//function to format the date time in the required format 
function formatDateTime(dateTimeString) {
  let dateTime = new Date(dateTimeString);

  let hours = dateTime.getHours().toString().padStart(2, '0'); // Ensure two digits for hours
  let minutes = dateTime.getMinutes().toString().padStart(2, '0'); // Ensure two digits for minutes
  let day = dateTime.getDate().toString().padStart(2, '0'); // Ensure two digits for day
  let month = (dateTime.getMonth() + 1).toString().padStart(2, '0'); // Ensure two digits for month
  let year = dateTime.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

//function to show all participants on a given run that is executed when the user presses the button
function showAllParticipants(runID) {

  fetch("/getParticipants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ runID: runID })
  })
    .then(response => {
      if (response.ok) {
        return response.json()
      }
    })
    .then(data => {
      displayParticipantPopup(runID, data)
    })
    .catch(err => {
      console.error("Error fetching participants for the specified run", runID, err)
    });
}

//function to display the popup of all the participants that are currently signed up for the run 
function displayParticipantPopup(runID, data) {

  let participantButton = document.getElementById(`participant_btn_${runID}`);
  let participantPopup = document.createElement("div");
  let participantList = document.createElement("ul");

  let participantButtonRect = participantButton.getBoundingClientRect();
  let btnTop = participantButtonRect.top + window.scrollY;
  let btnLeft = participantButtonRect.left + window.scrollX;

  participantPopup.style.position = "absolute";
  participantPopup.style.top = btnTop + participantButton.offsetHeight + "px";
  participantPopup.style.left = btnLeft + "px";

  participantPopup.className = "participantPopup";
  participantButton.parentNode.appendChild(participantPopup);

  data.forEach((participant) => {
    let participantUser = document.createElement("li");
    participantUser.textContent = participant;
    participantList.appendChild(participantUser);
  });

  participantPopup.appendChild(participantList);
  participantPopup.style.display = "block";

  setTimeout(() => {
    participantPopup.style.display = "none";
  }, 3000);
}

