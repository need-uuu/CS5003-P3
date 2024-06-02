// CS5003 Masters Programming Projects - Server Side
// Coursework P3: Social Runner

// ------------------------------------------------------------------------ Admin server side 

const express = require('express');
const path = require('path')
const app = express();
const session = require("express-session");

// Import initialize mongodb functions from data folder 
const { initializeDatabase, insertRun, insertUser, findUser, findAllRuns, findUpcomingRuns, findRunningPartners, findAllRunsUser,
    insertComment, joinRun, findRun, updateRunStatus} = require('../data/DAO.js');

// Import algorithm.js
const { calculateRunScores } = require('./algorithm.js');

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const API_PORT = 24980;


// -----------------------------------------------------------------------Session middleware

app.use(session({
    secret: 'excellent runner',
    resave: false,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    const sessionData = req.session;
});


// ------------------------------------------------------------------------ Classes
/**
 * Generates a random integer to assign as a unique run ID.
 * @param {number} max - The maximum value of the random integer.
 * @returns {number} - A random integer between 0 and maximum.
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}


/** Class representing a run */
class Run {
    /** 
    Create a new run.
    @constructor
    * @param {Array} participants - Array of all participants in the run (first user = organizer).
    * @param {string} startDateTime - Start date and time of the run (format: YYYY-MM-DDTHH:MM').
    * @param {string} averagePace - Average pace of the run in minutes/ km (format: 'MM:SS').
    * @param {Array} comments - Array of objects containing user, message, and date. 
    * @param {number} status - Status of the run (0 for upcoming, 1 for finished).
    * @param {Array} routePoints - Route points of the run (first element = start point, last element = end point).
    * @param {Array} meetingPoints - Meeting points for the run.
    * @param {Array} distancesToEnd - Distances from start point and all meeting points to the end point of the run.
    * @param {string} description - Description of the run.
    * @param {number} totalElevation - Total elevation gain of the run in meters.
    * @param {number} totalDistance - Total distance of the run in kilometers.
    * @param {Array} participantDistance - Distance covered by each participant in kilometers.
    * @param {number} runDifficulty - Difficulty score of the run (calculated based on pace, distance, and elevation). 
    */
    constructor(participants, startDateTime, averagePace, comments, status, routePoints, meetingPoints, distancesToEnd, description, totalElevation, totalDistance, participantDistance, runDifficulty) {
        this._id = getRandomInt(99999999); // High value chosen to ensure uniqueness
        this.participants = participants;
        this.startDateTime = startDateTime;
        this.averagePace = averagePace;
        this.comments = comments;
        this.status = status;
        this.routePoints = routePoints;
        this.meetingPoints = meetingPoints;
        this.distancesToEnd = distancesToEnd
        this.description = description;
        this.totalElevation = totalElevation;
        this.totalDistance = totalDistance;
        this.participantDistance = participantDistance;
        this.runDifficulty = runDifficulty;
    }
}


/** Class representing a user */
class User {
    /**
    * Create a new user.
    * @constructor
    * @param {string} username - Username of the user (unique).
    * @param {string} password - Password of the user.
    * @param {string} gender - Gender of the user.
    * @param {string} birthdate - Birthdate of the user.
    * @param {string} experience - Experience level of the user ("Beginner", "Intermediate", or "Advanced").
    */
    constructor(username, password, gender, birthdate, experience) {
        this._id = username;
        this.password = password;
        this.gender = gender;
        this.birthdate = birthdate;
        this.experience = experience;
    }
}


// ------------------------------------------------------------------------ Server endpoints 
// ------------------------------------------------------------------------ Login and register

/**
 * Handles POST request to register a new user.
 * @param {object} req - Request object containing user data in the body.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response indicating success or failure of user registration.
 */
app.post("/registerUser", (req, res) => {
    let { userName, userPassword, userGender, userBirthdate, userExperience } = req.body;

    findUser(userName)
        .then(dbResponse => {

            // Check if username already exists in database, otherwise push object to database 
            if (dbResponse === null) {
                let newUser = new User(userName, userPassword, userGender, userBirthdate, userExperience)
                insertUser(newUser)
                checkRunStatus()
                res.status(200).json({ message: "User succesfully registered" });
            } else {
                res.status(400).json({ message: "User already exists in database" });
            }
        })
        .catch(err => {
            console.error("Error registering user:", err);
            res.status(500).json({ error: 'Internal server error' });
        });
});


/**
 * Handles POST request to authenticate user login.
 * @param {object} req - Request object containing user credentials in the body.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response indicating success or failure of login.
 */
app.post("/loginUser", (req, res) => {
    let { userName, userPassword } = req.body;

    findUser(userName)
        .then(dbResponse => {
            if (dbResponse === null) {
                res.status(400).json({ message: "User not found" });
            } else if (userName === dbResponse._id && userPassword != dbResponse.password) {
                res.status(400).json({ message: "Incorrect password" });
            } else if (userName === dbResponse._id && userPassword === dbResponse.password) {
                req.session.sessionUsername = userName;
                checkRunStatus()
                // Redirect the user to the "Join Run" page
                res.json(200);
            }
        })
})


/**
 * Runs through all the runs in the database and checks whether the status needs to be updated
 * @param {object} req - Request object containing the session data.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response containing upcoming runs sorted by startTime.
 */
function checkRunStatus() {
    findAllRuns()
        .then(allRuns => {
            // console.log("getting all the runs...")

            let currentDate = new Date()

            allRuns.forEach(run => {
                if (new Date(run.startDateTime) < currentDate && run.status === 0) {
                    // console.log("run is in the past", run._id)
                    updateRunStatus(run._id)
                }
            })
        })
}

// ----------------------------------------------------------- Join and commenting on runs 

/**
 * Handles GET request to retrieve upcoming runs sorted by startTime.
 * @param {object} req - Request object containing the session data.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response containing upcoming runs sorted by startTime.
 */
app.get("/getUpcomingRuns", (req, res) => {
    let userName = req.session.sessionUsername;
    findUpcomingRuns(userName)
        .then(data => {
            let runArray = data.map(run => {
                return {
                    score: 0,
                    run: run
                };
            });
            res.json(runArray);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        });
});


/**
 * Handles POST request where the client sends distance input based on user location to calulate prioritization score.
 * @param {object} req - Request object containing distanceArray in the body and session data.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response containing upcoming runs sorted based on individual prioritization score.
 */
app.post("/submitDistances", (req, res) => {
    let { distanceArray } = req.body;
    let userName = req.session.sessionUsername;
    let runArray = []

    Promise.all([
        findUpcomingRuns(userName),
        findRunningPartners(userName),
        findUser(userName)
    ])
        .then(([upcomingRunsArray, runningPartnersArray, userObject]) => {
            let userExperience = userObject.experience;
            return calculateRunScores(upcomingRunsArray, runningPartnersArray, distanceArray, userExperience)
                .then(data => {
                    for (let i = 0; i < upcomingRunsArray.length; i++) {
                        let runScoreObject = {};
                        for (let j = 0; j < data.length; j++) {
                            if (upcomingRunsArray[i]._id === data[j].id) {
                                runScoreObject["score"] = data[j].totalScore;
                                runScoreObject["run"] = upcomingRunsArray[i];
                                // console.log(runScoreObject)
                                runArray.push(runScoreObject);
                            }
                        }
                    }
                    let sortedRunArray = runArray.sort((a, b) => b.score - a.score);
                    // console.log(sortedRunArray);
                    res.status(200).json(sortedRunArray);
                })
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        });
})


/**
 * Handles POST request for a user to join a new run and adds them as a participant in the database.
 * @param {object} req - Request object containing username, run id, and participant distance in the body and session data.
 * @param {object} res - Response object used to send responses back to the client.
 */
app.post("/joinRun", (req, res) => {
    let { joinRunObject } = req.body
    let userName = req.session.sessionUsername;
    let runID = joinRunObject.runID;
    let participantDistance = parseFloat(joinRunObject.participantDistance);

    joinRun(joinRunObject.runID, userName, participantDistance)
        .catch(err => {
            console.error("Error adding user to the run", runID, err);
        })
})


/**
 * Handles POST request to add a new comment to the run in the database.
 * @param {object} req - Request object containing comment details in the body.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response with the username.
 */
app.post("/addNewComment", (req, res) => {
    let { commentObject } = req.body;
    let userName = req.session.sessionUsername;
    let runID = commentObject.runID;
    let commentObj = { user: userName, comment: commentObject.commentText, date: commentObject.commentDateTime };

    // Insert the comment into the database
    insertComment(runID, commentObj)
        .then(() => {
            res.status(200).json({ user: userName });
        })
        .catch(err => {
            console.error("Error inserting new comment in database", err);
        });
});


/**
 * Handles POST request to retrieve the latest version of the run object and the most up-to-date comments.
 * @param {object} req - Request object containing the runID in the body.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response containing the comments linked to the run.
 */
app.post("/getComments", (req, res) => {
    let { runID } = req.body;

    findRun(runID)
        .then(data => {
            let runComments = data.comments;
            res.status(200).json(runComments);
        })
})

// Assuming 'app' is your Express application
app.post("/getParticipants", (req, res) => {
    let { runID } = req.body;
  
    findRun(runID)
      .then(data => {
        let participants = data.participants;
        res.status(200).json(participants);
      })
      .catch(error => {
        console.error("Error finding participants:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  });
  



// -------------------------------------------------------------------- Create new run

/**
 * Converts pace into a number for calculation purposes.
 * @param {string} pace - Pace string in the format "MM:SS".
 * @returns {number} - Converted pace as a number representing minutes per kilometer.
 */
const convertPace = (pace) => {
    let timeComponents = pace.split(":");
    let minutes = parseInt(timeComponents[0]);
    let seconds = parseInt(timeComponents[1]);
    let convertedTime = minutes + (seconds / 60);
    return convertedTime;
}


/**
 * Calculates "Difficulty" score for a run based on pace, distance, and elevation.
 * @param {number} pace - Pace of the run in minutes per kilometer.
 * @param {number} distance - Distance of the run in kilometers.
 * @param {number} elevation - Total elevation gain of the run in meters.
 * @returns {number} - Calculated "Difficulty" score for the run.
 */
const findRunDifficulty = (pace, distance, elevation) => {
    // Define thresholds and scores
    const difficultyWeights = { Pace: 0.4, Distance: 0.4, Elevation: 0.2 }
    const paceThresholds = [
        { threshold: 4, score: 100 },         // fast
        { threshold: 6, score: 55 },          // moderate
        { threshold: Infinity, score: 10 },   // slow
    ];
    const distanceThresholds = [
        { threshold: 7.5, score: 10 },        // short
        { threshold: 15, score: 55 },         // medium
        { threshold: Infinity, score: 100 },  // long
    ];
    const elevationThresholds = [
        { threshold: 50, score: 10 },         // flat
        { threshold: 200, score: 55 },        // hilly
        { threshold: Infinity, score: 100 },  // mountanious
    ];

    // Define support function to calculate scores per criterion
    const calculateScore = (value, thresholds) => {
        for (let i = 0; i < thresholds.length; i++) {
            if (value <= thresholds[i].threshold) {
                return thresholds[i].score;
            }
        }
    };

    // Calculate individual scores and weighted "Difficulty" score
    let paceScore = calculateScore(pace, paceThresholds);
    let distanceScore = calculateScore(distance, distanceThresholds);
    let elevationScore = calculateScore(elevation, elevationThresholds);
    let runDifficulty = (difficultyWeights.Pace * paceScore + difficultyWeights.Distance * distanceScore + difficultyWeights.Elevation * elevationScore);

    return runDifficulty;
}


/**
 * Convert start time to end time.
 * @param {string} startDateTime - Start date and time of the event.
 * @param {number} duration - Duration of the event in minutes.
 * @returns {Array} - Array containing the hours and minutes of the end time.
 */
function convertStart2EndTime(startDateTime, duration) {
    //extract time from date format
    let startTime = startDateTime.substring(startDateTime.indexOf('T') + 1);

    let minutes = duration % 60;
    let hours = Math.floor(duration / 60);

    let startTimeHr = startTime.slice(0, 2);
    let startTimeMins = startTime.slice(3, 5);

    let endTimeHr = parseInt(startTimeHr) + hours;
    let endTimeMins = Math.floor(parseInt(startTimeMins) + minutes);

    let endTime = [];
    endTime.push(endTimeHr);
    endTime.push(endTimeMins);

    return endTime
}


/**
 * Handles POST request to add a new run to the database.
 * @param {object} req - Request object containing all run details sent from the client.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response indicating the success of adding a new run.
 */
app.post("/submit-new-run", (req, res) => {
    // Define data that is received from client
    let { startDateTime, averagePace, routePoints, elevationValues, distancesFromStart, description } = req.body;
    // console.log(req.body)
    // console.log("current session user", req.session.sessionUsername)

    // Push session username to list of participants
    let participants = []
    participants.push(req.session.sessionUsername)

    // Extract distance
    const totalDistance = distancesFromStart[distancesFromStart.length - 1];
    // console.log("total distance", totalDistance);
    // console.log("distances from start", distancesFromStart);
    // Convert distances to be from each point to the end
    let distancesToEnd = [totalDistance];
    for (let i = 0; i < distancesFromStart.length - 1; i++) {
        distancesToEnd.push(totalDistance - distancesFromStart[i])
    }
    // console.log("distances to end:", distancesToEnd);

    // Calculate duration
    let totalDistanceM = Math.round(totalDistance)
    let totalDistanceKM = totalDistanceM / 1000
    let averagePaceDecimal = convertPace(averagePace)
    let duration = totalDistanceKM * averagePaceDecimal

    // Add participantDistance
    let participantDistance = [];
    participantDistance.push(totalDistance);

    // Initialize comments as empty
    let comments = [];

    // Convert start time to end time
    // console.log("duration", duration)
    // console.log("date time", startDateTime)

    // Access the first and last elements in array and calculate elevation difference
    let totalElevation = elevationValues.slice(-1) - elevationValues[0]

    // Store all locations as geolocations, store all locations excluding the first and last as meeting points
    let meetingPoints = routePoints.slice(1, -1)

    // Initialize status as 0 since the run will be upcoming 
    let status = 0;

    // Calculate difficulty level of run based on distance, pace, and elevation
    let runDifficulty = findRunDifficulty(averagePaceDecimal, totalDistance, totalElevation);
    // console.log("Run difficulty", runDifficulty)

    // Create class object from the client information
    let newRun = new Run(participants, startDateTime, averagePace, comments, status, routePoints, meetingPoints, distancesToEnd, description, totalElevation, totalDistance, participantDistance, runDifficulty)
    // console.log(newRun);
    insertRun(newRun);

    // Send response back to the client 
    res.status(200).json({ message: "Successfully added new run" });
})



// ---------------------------------------------------------------------- Profile page

/**
 * Handles GET request to retrieve information for the user's personal page.
 * @param {object} req - Request object containing session data.
 * @param {object} res - Response object used to send responses back to the client.
 * @returns {object} - Sends a JSON response containing user's personal details, running partners, and all runs.
 */
app.get("/getPersonalDetails", (req, res) => {
    let userName = req.session.sessionUsername;

    Promise.all([
        findUser(userName),
        findRunningPartners(userName),
        findAllRunsUser(userName)
    ])
        .then(([userObject, runningPartnersObject, allRunsObject]) => {
            let data2Share = [userObject, runningPartnersObject, allRunsObject];
            // console.log(data2Share);
            res.json(data2Share);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        });
});



// ------------------------------------------------------------------------ Start server and database

app.use(express.static(path.join(__dirname, '../client')));

const runApp = function () {

    return initializeDatabase()
        .then(() => {
            return app.listen(API_PORT, () => {
                console.log(`Listening on localhost: ${API_PORT}`)
            })

        })

}

module.exports = { runApp }

