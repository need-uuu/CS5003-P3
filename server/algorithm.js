// CS5003 Masters Programming Projects - Algorithm JS Code
// Coursework P3: Social Runner

/** JavaScript Documentation for implementation of prioritization algorithm */

/**
 * Finds the frequency of joint runs with other members for a given member.
 * @param {array} data - Array of objects representing members and their joint run frequencies.
 * @param {string} name - Name of the member to find the joint run frequency for.
 * @returns {number} - Frequency of joint runs for the specified member. Returns 0 if the member is not found.
 */
const findFrequencyJointRuns = (data, name) => {
    for (let i = 0; i < data.length; i++) {
        if (data[i]._id === name) {
            return data[i].frequency;
        }
    }
    return 0;
}


/**
 * Calculates a score depending on how close in the future the run takes place.
 * @param {number} timeDifference - Time difference between the current time and the time of the run, in milliseconds.
 * @returns {number} - "Time" score calculated based on the time difference and pre-specified thresholds.
 */
const calculateTimeScore = (timeDifference) => {
    // Define thresholds and scores
    const timeThresholds = [
        { threshold: 60 * 60 * 1000, score: 100 },          // Within 1 hour
        { threshold: 2 * 60 * 60 * 1000, score: 90 },       // Within 2 hours
        { threshold: 4 * 60 * 60 * 1000, score: 80 },       // Within 4 hours
        { threshold: 8 * 60 * 60 * 1000, score: 70 },       // Within 8 hours
        { threshold: 12 * 60 * 60 * 1000, score: 60 },      // Within 12 hours
        { threshold: 24 * 60 * 60 * 1000, score: 50 },      // Within 24 hours
        { threshold: 48 * 60 * 60 * 1000, score: 40 },      // Within 48 hours
        { threshold: 72 * 60 * 60 * 1000, score: 30 },      // Within 72 hours
        { threshold: 7 * 24 * 60 * 60 * 1000, score: 20 },  // Within 1 week
        { threshold: Infinity, score: 10 }                  // Over 1 week
    ];

    // Find the appropriate score based on the time difference
    for (let i = 0; i < timeThresholds.length; i++) {
        if (timeDifference <= timeThresholds[i].threshold) {
            return timeThresholds[i].score;
        }
    }
}


/**
 * Calculates a score based on the match of difficulty score with the user's experience level (stated in registration process).
 * @param {string} userExperience - User's experience level ("Beginner", "Advanced", or "Professional").
 * @param {number} runDifficulty - Difficulty score of the run (created when new run is started on client side and stored in database).
 * @returns {number} - "Difficulty" score calculated based on the match of run difficulty with experience level.
 */
const calculateDifficultyScore = (userExperience, runDifficulty) => {
    // Define thresholds and scores based on experience level of user
    let difficultyThresholds;

    if (userExperience === "Beginner") {
        difficultyThresholds = [
            { threshold: 20, score: 100 },       // Highest score for run difficulty <= 20
            { threshold: 60, score: 55 },        // Medium score for run difficulty <= 60
            { threshold: Infinity, score: 10 }   // Lowest score for run difficulty > 60
        ];
    } else if (userExperience === "Advanced") {
        difficultyThresholds = [
            { threshold: 20, score: 55 },        // Medium score for difficulty <= 20
            { threshold: 60, score: 100 },       // Highest score for run difficulty <= 60
            { threshold: Infinity, score: 55 }   // Medium score for run difficulty > 60
       ];
    } else if (userExperience === "Professional") {
        difficultyThresholds = [
            { threshold: 20, score: 10 },        // Low score for run difficulty <= 20
            { threshold: 60, score: 55 },        // Medium score for Run difficulty <= 60
            { threshold: Infinity, score: 100 }  // High score for run difficulty > 60
        ];
    }

    // Find the appropriate score based on the distance
    for (let i = 0; i < difficultyThresholds.length; i++) {
        if (runDifficulty <= difficultyThresholds[i].threshold) {
            return difficultyThresholds[i].score;
        }
    }
}


/**
 * Calculates a score based on the proximity of the start point of the run to the user's location.
 * @param {number} distance - Distance between the start point of the run and the user's location (in kilometers).
 * @returns {number} - "Proximity" score calculated based on the proximity of the run's start point to the user's location.
 */
const calculateProximityScore = (distance) => {
    // Define thresholds and scores
    const proximityThresholds = [
        { threshold: 2, score: 100 },       // Within 2km radius
        { threshold: 5, score: 70 },        // Within 5km radius
        { threshold: 10, score: 40 },       // Within 10km radius
        { threshold: Infinity, score: 10 }  // Over 10km radius
    ];

    // Find the appropriate score based on the distance
    for (let i = 0; i < proximityThresholds.length; i++) {
        if (distance <= proximityThresholds[i].threshold) {
            return proximityThresholds[i].score;
        }
    }
}

    
/**
 * Calculates a score based on how often the user has run with the run organizer.
 * @param {number} frequency - Frequency of joint runs with the organizer.
 * @returns {number} - "Social" score calculated based on the frequency of joint runs with the organizer.
 */
const calculateSocialScore = (frequency) => {
    // Define thresholds and scores
    const socialThresholds = [
        { threshold: 2, score: 10 },        // 2 or less joint runs
        { threshold: 5, score: 40 },        // 5 or less joint runs
        { threshold: 10, score: 70 },       // 10 or less joint runs
        { threshold: Infinity, score: 100 } // Over 10 joint runs
    ];

    // Find the appropriate score based on the time difference
    for (let i = 0; i < socialThresholds.length; i++) {
        if (frequency <= socialThresholds[i].threshold) {
            return socialThresholds[i].score;
        }
    }
}


/**
 * Calculates user-specific "Time", "Proximity", "Difficulty", and "Social" scores for upcoming runs (core of prioritization algorithm).
 * @param {array} array - Array of upcoming runs, only including runs organized by other members (filters out own upcoming runs)
 * @param {array} jointRuns - Array containing information about the number joint runs with organizers.
 * @param {array} distanceArray - Array containing distances from user's location to the start points of each upcoming run.
 * @param {string} userExperience - User's experience level ("Beginner", "Advanced", or "Professional"). 
 * @returns {array} - Array of objects containing run IDs and their corresponding total scores.
 */
const calculateRunScores = async (array, jointRuns, distanceArray, userExperience) => {
    // Create array of objects to store all runScores and populate with ids
    let runScores = [];
    array.forEach(run => {
        runScores.push({ _id: run._id });
    });

    // Iterate through all upcoming runs and calculate "Social" score 
    array.forEach(run => {
        // Calculate score for "Social" criterion
        let organizer = run.participants[0];
        let frequency = findFrequencyJointRuns(jointRuns, organizer)
        let score = calculateSocialScore(frequency);

        // Find the index of run and add respective "Social" score
        let index = runScores.findIndex(item => item._id === run._id);
        runScores[index].socialScore = score;
    });

    // Iterate through all upcoming runs and calculate "Time" score
    array.forEach(run => {
        // Calculate score for "Time" criterion
        let currentTime = new Date()
        let runTime = new Date(run.startDateTime);
        let timeDifference = runTime - currentTime;
        let score = calculateTimeScore(timeDifference);

        // Find the index of run and add respective "Time" score
        let index = runScores.findIndex(item => item._id === run._id);
        runScores[index].timeScore = score;
    });

    // Iterate through all upcoming runs and calculate "Difficulty" score 
    array.forEach(run => {
        let runDifficulty = run.runDifficulty
        let score = calculateDifficultyScore(userExperience, runDifficulty)
        
        // Find the index of run and add respective "Time" score
        let index = runScores.findIndex(item => item._id === run._id);
        runScores[index].difficultyScore = score;
    });

    // Iterate through all upcoming runs and calculate "Proximity" score,
    distanceArray.forEach((distance, index) => {
        let score = calculateProximityScore(distance);
        runScores[index].proximityScore = score;
    });

    // Define prioritization weights
    const prioWeights = { Social: 0.4, Proximity: 0.25, Time: 0.20, Difficulty: 0.15 }
    let finalScores = [];

    // Calculate final score for prioritization
    runScores.forEach(run => {
        let totalScore = run.socialScore * prioWeights.Social + 
            run.proximityScore * prioWeights.Proximity +
            run.timeScore * prioWeights.Time +
            run.difficultyScore * prioWeights.Difficulty;
        finalScores.push({ id: run._id, totalScore: totalScore });
    });

    // Sort finalScores array based on totalScore
    finalScores.sort((a, b) => b.totalScore - a.totalScore);

    return finalScores;
}


// Export calculateRunScores function to main.js
module.exports = { calculateRunScores };