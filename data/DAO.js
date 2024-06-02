// ------------------------------------------------------------------------- Admin and database settings 
//source: https://stackoverflow.com/questions/24621940/how-to-properly-reuse-connection-to-mongodb-across-nodejs-application-and-module

//define admin information
const MongoClient = require('mongodb').MongoClient;
const config = require('../config-db.js');
const { stat } = require('fs');
const url = `mongodb://${config.username}:${config.password}@${config.url}:${config.port}/${config.database}?authSource=admin`;
const client = new MongoClient(url);
let runs = null;
let users = null;


// ------------------------------------------------------------------------- Dummy data

//define function to genereate future run dates when the databank is initialized
//note that the function uses Winter Time, so 0.05 needs to be the minimum input for future runs)
const generateFutureRunDate = (daysToAdd) => {
    const futureDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    return futureDate.toISOString().slice(0, 16);
}

//define dummy runs data to populate the database 
const dummy_runs = [
    {
        _id: 1,
        participants: ['ethan2000', 'luk3'],
        startDateTime: '2024-04-01T09:00',
        averagePace: '05:30',
        comments: [{ user: 'luk3', comment: 'Lets gooooo!', date: '2024-04-01T07:30' }],
        status: 1,
        routePoints: [[-3.202659301757791, 55.96721109893005], [-3.17244689941424, 55.939916674752425], [-3.2335583496100355, 55.94299306484879], [-3.25621765136682, 55.96721109893005]],
        meetingPoints: [[-3.17244689941424, 55.939916674752425], [-3.2335583496100355, 55.94299306484879]],
        distancesToEnd: [12.8, 10.0, 5.7],
        description: 'Fast morning run',
        totalElevation: 50,
        totalDistance: 12.8,
        participantDistance: [12.8, 12.8],
        runDifficulty: 75
    },
    {
        _id: 2,
        participants: ['luk3', 'jooe', 'emz', 'soph', 'johnDoe'],
        startDateTime: '2024-03-28T10:00',
        averagePace: '06:00',
        comments: [{ user: 'ethan2000', comment: 'Have fun, I will join next time!', date: '2024-03-28T07:00' }],
        status: 1,
        routePoints: [[41.8781, -87.6298], [41.8781, -87.6298], [34.0522, -118.2437]],
        meetingPoints: [[41.8781, -87.6298]],
        distancesToEnd: [12.2, 10.0],
        description: 'Riverside run',
        totalElevation: 80,
        totalDistance: 12.2,
        participantDistance: [12.2, 12.2, 12.2, 12.2, 12.2],
        runDifficulty: 25
    },
    {
        _id: 3,
        participants: ['emz', 'soph', 'ethan2000'],
        startDateTime: '2024-04-01T11:00',
        averagePace: '07:30',
        comments: [{ user: 'soph', comment: 'Feeling great!', date: '2024-04-01T08:30' }],
        status: 1,
        routePoints: [[45.4215, -75.6972], [45.4215, -75.6972], [51.5074, -0.1278]],
        meetingPoints: [[45.4215, -75.6972]],
        distancesToEnd: [15.2, 8.0],
        description: 'City run',
        totalElevation: 150,
        totalDistance: 15.2,
        participantDistance: [15.2, 15.2, 15.2],
        runDifficulty: 60
    },
    {
        _id: 4,
        participants: ['joe', 'alice88'],
        startDateTime: '2024-04-01T08:30',
        averagePace: '04:45',
        comments: [{ user: 'joe', comment: 'Anyone wants to join?', date: '2024-04-01T07:00' }],
        status: 1,
        routePoints: [[48.8566, 2.3522], [48.8566, 2.3522], [40.7128, -74.0060]],
        meetingPoints: [[48.8566, 2.3522]],
        distancesToEnd: [8.4, 6.0],
        description: 'Sprint training',
        totalElevation: 400,
        totalDistance: 8.4,
        participantDistance: [8.4, 8.4],
        runDifficulty: 43
    },
    {
        _id: 5,
        participants: ['emz', 'jooe'],
        startDateTime: '2024-04-02T07:00',
        averagePace: '05:15',
        comments: [{ user: 'ethan2000', comment: 'Lovely day for a run!', date: '2024-04-02T05:30' }],
        status: 1,
        routePoints: [[52.5200, 13.4050], [52.5200, 13.4050], [48.8566, 2.3522]],
        meetingPoints: [[52.5200, 13.4050]],
        distancesToEnd: [11.2, 6.0],
        description: 'Out in the nature',
        totalElevation: 320,
        totalDistance: 11.2,
        participantDistance: [11, 2, 11, 2],
        runDifficulty: 54
    },
    {
        _id: 6,
        participants: ['luk3'],
        startDateTime: generateFutureRunDate(0.1),
        averagePace: '06:15',
        comments: [{ user: 'luk3', comment: 'Feel free to join, its my favorite route', date: generateFutureRunDate(0.05) }],
        status: 0,
        routePoints: [[-3.11476867675745, 55.93414778469375], [-3.1985394287112, 55.96144627451534], [-3.274070434570575, 55.936070843502876]],
        meetingPoints: [[-3.1985394287112, 55.96144627451534]],
        distancesToEnd: [13.8, 9.0],
        description: 'Favorite run Edinburgh',
        totalElevation: 40,
        totalDistance: 13.8,
        participantDistance: [13.8],
        runDifficulty: 65
    },
    {
        _id: 7,
        participants: ['ethan2000', 'max05'],
        startDateTime: generateFutureRunDate(1),
        averagePace: '07:30',
        comments: [{ user: 'max05', comment: 'Looks great, I will join!', date: generateFutureRunDate(0.7) }],
        status: 0,
        routePoints: [[-3.291585219011779, 55.97372102074533], [-3.222025910832258, 55.963476633862115], [-3.2062835410863784, 55.94707997255517], [-3.2458225162628764, 55.95035986042609]],
        meetingPoints: [[-3.222025910832258, 55.963476633862115], [-3.2062835410863784, 55.94707997255517]],
        distancesToEnd: [13.8, 9.0, 4.0],
        description: 'Beginner friendly run for everyone',
        totalElevation: 60,
        totalDistance: 10.5,
        participantDistance: [10.5, 10.5],
        runDifficulty: 32
    },
    {
        _id: 8,
        participants: ['emz92'],
        startDateTime: generateFutureRunDate(2),
        averagePace: '07:30',
        comments: [],
        status: 0,
        routePoints: [[-3.1936138320172347, 55.94925426737558], [-3.0976328064715233, 55.93720107418909], [-3.1366069198751347, 55.96390850143234]],
        meetingPoints: [[-3.0976328064715233, 55.93720107418909]],
        distancesToEnd: [9.5, 8.0],
        description: 'City center run',
        totalElevation: 40,
        totalDistance: 9.5,
        participantDistance: [9.5],
        runDifficulty: 12
    },
    {
        _id: 9,
        participants: ['sammyS'],
        startDateTime: generateFutureRunDate(0.8),
        averagePace: '04:15',
        comments: [],
        status: 0,
        routePoints: [[-2.7860516559688904, 56.336920852980086], [-2.8161359104351504, 56.361772959115456], [-2.838575579641912, 56.35077525839583], [-2.823903488237363, 56.33534922672254], [-2.791322814679603, 56.333555097267265]],
        meetingPoints: [[-2.8161359104351504, 56.361772959115456], [-2.838575579641912, 56.35077525839583], [-2.823903488237363, 56.33534922672254]],
        distancesToEnd: [11.8, 10.1, 8.5, 6.6],
        description: 'Run for professionals',
        totalElevation: 10,
        totalDistance: 11.8,
        participantDistance: [11.8],
        runDifficulty: 86
    },
    {
        _id: 10,
        participants: ['alice88', 'soph'],
        startDateTime: generateFutureRunDate(6),
        averagePace: '06:30',
        comments: [],
        status: 0,
        routePoints: [[-3.2921229102946654, 55.97810608110791], [-3.1935264636246075, 55.98084902790248], [-3.1221666044329766, 55.958290133346054]],
        meetingPoints: [[-3.1935264636246075, 55.98084902790248]],
        distancesToEnd: [12, 8.5],
        description: 'Sea side run',
        totalElevation: 10,
        totalDistance: 12,
        participantDistance: [12, 12],
        runDifficulty: 43
    },
    {
        _id: 11,
        participants: ['ethan2000', 'luk3', 'jooe', 'emz92', 'soph', 'alice88'],
        startDateTime: '2024-03-20T09:00',
        averagePace: '05:30',
        comments: [{ user: 'luk3', comment: 'Lets gooooo!', date: '2024-03-20T07:30' }],
        status: 1,
        routePoints: [[-2.7939559822196998, 56.33871118654724], [-2.7921416395270455, 56.3334433783607], [-2.781914258067957, 56.33629548452893], [-2.625374415488494, 56.26079134397338]],
        meetingPoints: [[-2.7921416395270455, 56.3334433783607], [-2.781914258067957, 56.33629548452893]],
        distancesToEnd: [5.8, 5.4, 4.4],
        description: 'fast power run',
        totalElevation: 40,
        totalDistance: 5.8,
        participantDistance: [5.8, 5.8, 5.4, 5.4, 5.4, 4.4],
        runDifficulty: 65
    },
    {
        _id: 12,
        participants: ['ethan2000', 'luk3', 'jooe', 'emz92', 'soph', 'alice88'],
        startDateTime: '2024-03-22T15:00',
        averagePace: '07:30',
        comments: [{ user: 'luk3', comment: 'get ready for the season, buddies!', date: '2024-03-22T07:30' }],
        status: 1,
        routePoints: [[-2.9732262816523303, 56.46442496608216], [-3.015836976323783, 56.476075850366755], [-3.047499123374763, 56.553106209215514], [-2.9833055492765084, 56.47099756061098]],
        meetingPoints: [[-3.015836976323783, 56.476075850366755], [-3.047499123374763, 56.553106209215514]],
        distancesToEnd: [11.8, 11.4, 6.4],
        description: 'High Elevation Run from Dundee',
        totalElevation: 90,
        totalDistance: 11.8,
        participantDistance: [11.8, 11.8, 11.8, 11.8, 11.8, 11.0],
        runDifficulty: 80
    },
    {
        _id: 13,
        participants: ['sammyS', 'luk3', 'jooe', 'emz92', 'soph', 'alice88', 'max05'],
        startDateTime: '2024-03-23T09:00',
        averagePace: '08:30',
        comments: [{ user: 'jooe', comment: 'looking forward to a nice run', date: '2024-03-20T09:30' }],
        status: 1,
        routePoints: [[-3.0094200405199274, 56.31979079567887], [-2.795260617693799, 56.33788770297397], [-2.7088725362330024, 56.22602880161293], [-2.8286420620335093, 56.19523112756636]],
        meetingPoints: [[-2.795260617693799, 56.33788770297397], [-2.7088725362330024, 56.22602880161293]],
        distancesToEnd: [38.5, 22.8, 7.0],
        description: 'Cupar - St Andrews - Anstruther - Elie',
        totalElevation: 90,
        totalDistance: 38.5,
        participantDistance: [38.5, 22.8, 22.8, 22.8, 22.8, 7.0, 7.0],
        runDifficulty: 89
    },
    {
        _id: 14,
        participants: ['soph', 'emz92', 'alice88', 'lisaSmith'],
        startDateTime: '2024-03-23T17:00',
        averagePace: '08:30',
        comments: [{ user: 'alice88', comment: 'best girls run in town :-)', date: '2024-03-20T12:30' }],
        status: 1,
        routePoints: [[-2.7949985490633082, 56.339489145559014], [-2.7892020654971077, 56.34072646714526], [-2.8165323055685576, 56.3655752323254], [-2.795954100035516, 56.33948223277267]],
        meetingPoints: [[-2.7892020654971077, 56.34072646714526], [-2.8165323055685576, 56.3655752323254]],
        distancesToEnd: [7.9, 7.2, 3.4],
        description: 'St Andrews Girls Run',
        totalElevation: 20,
        totalDistance: 7.9,
        participantDistance: [7.9, 7.9, 7.2, 7.9],
        runDifficulty: 30
    },
    {
        _id: 15,
        participants: ['soph', 'emz92', 'alice88', 'lisaSmith'],
        startDateTime: '2024-03-25T17:00',
        averagePace: '05:30',
        comments: [{ user: 'alice88', comment: 'girls power yeah!', date: '2024-03-21T12:30' }],
        status: 1,
        routePoints: [[-2.7949985490633082, 56.339489145559014], [-2.7892020654971077, 56.34072646714526], [-2.8165323055685576, 56.3655752323254], [-2.795954100035516, 56.33948223277267]],
        meetingPoints: [[-2.7892020654971077, 56.34072646714526], [-2.8165323055685576, 56.3655752323254]],
        distancesToEnd: [14.9, 11.9, 7.4],
        description: 'Girls Power Run',
        totalElevation: 20,
        totalDistance: 14.9,
        participantDistance: [14.9, 14.9, 14.9, 14.9],
        runDifficulty: 30
    },
    {
        _id: 16,
        participants: ['soph', 'emz92', 'alice88', 'lisaSmith', 'luk3', 'max05', 'sammyS'],
        startDateTime: '2024-03-27T17:00',
        averagePace: '05:30',
        comments: [{ user: 'emz92', comment: 'looking forward to meeting you all', date: '2024-03-26T17:30' }],
        status: 1,
        routePoints: [[-2.706480523841293, 56.22525423927624], [-2.696206186657662, 56.22209146469527], [-2.682593280345287, 56.2269132499292]],
        meetingPoints: [[-2.696206186657662, 56.22209146469527]],
        distancesToEnd: [1.9, 0.8],
        description: 'fun run - only good mood allowed',
        totalElevation: 0,
        totalDistance: 1.9,
        participantDistance: [1.9, 1.9, 1.9, 1.9, 1.9, 1.9, 1.9],
        runDifficulty: 10
    },
    {
        _id: 17,
        participants: ['soph', 'emz92', 'ethan2000', 'lisaSmith', 'luk3', 'max05', 'sammyS'],
        startDateTime: '2024-03-28T19:00',
        averagePace: '05:00',
        comments: [{ user: 'luk3', comment: 'excited!', date: '2024-03-28T11:30' }],
        status: 1,
        routePoints: [[-2.884320831548905, 56.38008946019977], [-2.867305636334436, 56.35466191282967], [-2.79660719568696, 56.340468765658215]],
        meetingPoints: [[-2.867305636334436, 56.35466191282967]],
        distancesToEnd: [9.8, 5.8],
        description: 'Leuchars to St Andrews Run ',
        totalElevation: 10,
        totalDistance: 9.8,
        participantDistance: [9.8, 9.8, 5.8, 9.8, 9.8, 9.8, 9.8],
        runDifficulty: 40
    },
    {
        _id: 18,
        participants: ['luk3', 'max05', 'sammyS'],
        startDateTime: '2024-03-29T13:00',
        averagePace: '05:00',
        comments: [{ user: 'luk3', comment: 'lets goooooo!', date: '2024-03-29T11:30' }],
        status: 1,
        routePoints: [[-3.1692188382901065, 56.205451300074], [-3.2454364812944334, 56.22568790735866], [-3.21391529709274, 56.25694309980631]],
        meetingPoints: [[-3.2454364812944334, 56.22568790735866]],
        distancesToEnd: [13.6, 6.8],
        description: 'From Glenrothes to Lomond Hills to Falkland',
        totalElevation: 180,
        totalDistance: 13.6,
        participantDistance: [13.6, 13.6, 13.6],
        runDifficulty: 75
    },
    {
        _id: 19,
        participants: ['luk3', 'max05', 'sammyS'],
        startDateTime: '2024-03-31T13:00',
        averagePace: '06:00',
        comments: [{ user: 'luk3', comment: 'Falkland we are comming!', date: '2024-03-30T11:30' }],
        status: 1,
        routePoints: [[-3.1980762826220825, 56.25535988736033], [-3.3443316986854086, 56.19886716030331], [-3.188167435339693, 56.251696769944544]],
        meetingPoints: [[-3.3443316986854086, 56.19886716030331]],
        distancesToEnd: [35.7, 17.8],
        description: 'Falkland to Loch Leven National Nature Reserve - beautiful run',
        totalElevation: 50,
        totalDistance: 35.7,
        participantDistance: [35.7, 17.8, 17.8],
        runDifficulty: 95
    },
    {
        _id: 20,
        participants: ['jooe', 'emz92', 'lisaSmith', 'johnDoe'],
        startDateTime: '2024-03-31T13:00',
        averagePace: '06:00',
        comments: [{ user: 'lisaSmith', comment: 'lets go girls and boys!', date: '2024-03-30T11:30' }],
        status: 1,
        routePoints: [[-3.2177626293645005, 55.947963971043805], [-3.1635949803268772, 55.94719609160754], [-3.142894151083027, 55.92453265911777]],
        meetingPoints: [[-3.1635949803268772, 55.94719609160754]],
        distancesToEnd: [8.5, 4.2],
        description: 'Edinburgh Relaxed Run',
        totalElevation: 20,
        totalDistance: 8.5,
        participantDistance: [8.5, 8.5, 4.2],
        runDifficulty: 35
    },
    {
        _id: 21,
        participants: ['luk3'],
        startDateTime: generateFutureRunDate(0.5),
        averagePace: '05:30',
        comments: [{ user: 'luk3', comment: 'Lets gooooo!', date: generateFutureRunDate(0.4) }],
        status: 0,
        routePoints: [[-2.7939559822196998, 56.33871118654724], [-2.7921416395270455, 56.3334433783607], [-2.781914258067957, 56.33629548452893], [-2.625374415488494, 56.26079134397338]],
        meetingPoints: [[-2.7921416395270455, 56.3334433783607], [-2.781914258067957, 56.33629548452893]],
        distancesToEnd: [5.8, 5.4, 4.4],
        description: 'fast power run',
        totalElevation: 40,
        totalDistance: 5.8,
        participantDistance: [5.8],
        runDifficulty: 65
    },
    {
        _id: 22,
        participants: ['ethan2000', 'luk3'],
        startDateTime: generateFutureRunDate(5.5),
        averagePace: '07:30',
        comments: [{ user: 'luk3', comment: 'get ready for the season, buddies!', date: generateFutureRunDate(4) }],
        status: 0,
        routePoints: [[-2.9732262816523303, 56.46442496608216], [-3.015836976323783, 56.476075850366755], [-3.047499123374763, 56.553106209215514], [-2.9833055492765084, 56.47099756061098]],
        meetingPoints: [[-3.015836976323783, 56.476075850366755], [-3.047499123374763, 56.553106209215514]],
        distancesToEnd: [11.8, 11.4, 6.4],
        description: 'High Elevation Run from Dundee',
        totalElevation: 90,
        totalDistance: 11.8,
        participantDistance: [11.8, 11.8],
        runDifficulty: 80
    },
    {
        _id: 23,
        participants: ['sammyS'],
        startDateTime: generateFutureRunDate(2),
        averagePace: '08:30',
        comments: [{ user: 'jooe', comment: 'looking forward to a nice run', date: generateFutureRunDate(1.9) }],
        status: 0,
        routePoints: [[-3.0094200405199274, 56.31979079567887], [-2.795260617693799, 56.33788770297397], [-2.7088725362330024, 56.22602880161293], [-2.8286420620335093, 56.19523112756636]],
        meetingPoints: [[-2.795260617693799, 56.33788770297397], [-2.7088725362330024, 56.22602880161293]],
        distancesToEnd: [38.5, 22.8, 7.0],
        description: 'Cupar - St Andrews - Anstruther - Elie',
        totalElevation: 90,
        totalDistance: 38.5,
        participantDistance: [38.5],
        runDifficulty: 89
    },
    {
        _id: 24,
        participants: ['lisaSmith'],
        startDateTime: generateFutureRunDate(2.4),
        averagePace: '08:30',
        comments: [{ user: 'alice88', comment: 'best girls run in town :-)', date: generateFutureRunDate(2.2) }],
        status: 0,
        routePoints: [[-2.7949985490633082, 56.339489145559014], [-2.7892020654971077, 56.34072646714526], [-2.8165323055685576, 56.3655752323254], [-2.795954100035516, 56.33948223277267]],
        meetingPoints: [[-2.7892020654971077, 56.34072646714526], [-2.8165323055685576, 56.3655752323254]],
        distancesToEnd: [7.9, 7.2, 3.4],
        description: 'St Andrews Girls Run',
        totalElevation: 20,
        totalDistance: 7.9,
        participantDistance: [7.9],
        runDifficulty: 30
    },
    {
        _id: 25,
        participants: ['emz92', 'alice88'],
        startDateTime: generateFutureRunDate(3.1),
        averagePace: '05:30',
        comments: [{ user: 'alice88', comment: 'girls power yeah!', date: generateFutureRunDate(2.9) }],
        status: 0,
        routePoints: [[-2.7949985490633082, 56.339489145559014], [-2.7892020654971077, 56.34072646714526], [-2.8165323055685576, 56.3655752323254], [-2.795954100035516, 56.33948223277267]],
        meetingPoints: [[-2.7892020654971077, 56.34072646714526], [-2.8165323055685576, 56.3655752323254]],
        distancesToEnd: [14.9, 11.9, 7.4],
        description: 'Girls Power Run',
        totalElevation: 20,
        totalDistance: 14.9,
        participantDistance: [14.9, 14.9],
        runDifficulty: 30
    },
    {
        _id: 26,
        participants: ['soph'],
        startDateTime: generateFutureRunDate(1.1),
        averagePace: '05:30',
        comments: [{ user: 'emz92', comment: 'looking forward to meeting you all', date: generateFutureRunDate(0.6) }],
        status: 0,
        routePoints: [[-2.706480523841293, 56.22525423927624], [-2.696206186657662, 56.22209146469527], [-2.682593280345287, 56.2269132499292]],
        meetingPoints: [[-2.696206186657662, 56.22209146469527]],
        distancesToEnd: [1.9, 0.8],
        description: 'fun run - only good mood allowed',
        totalElevation: 0,
        totalDistance: 1.9,
        participantDistance: [1.9],
        runDifficulty: 10
    },
    {
        _id: 27,
        participants: ['soph', 'emz92', 'luk3'],
        startDateTime: generateFutureRunDate(3.4),
        averagePace: '05:00',
        comments: [{ user: 'luk3', comment: 'excited!', date: generateFutureRunDate(3.2) }],
        status: 0,
        routePoints: [[-2.884320831548905, 56.38008946019977], [-2.867305636334436, 56.35466191282967], [-2.79660719568696, 56.340468765658215]],
        meetingPoints: [[-2.867305636334436, 56.35466191282967]],
        distancesToEnd: [9.8, 5.8],
        description: 'Leuchars to St Andrews Run ',
        totalElevation: 10,
        totalDistance: 9.8,
        participantDistance: [9.8, 9.8, 5.8],
        runDifficulty: 40
    },
    {
        _id: 28,
        participants: ['max05'],
        startDateTime: generateFutureRunDate(6.1),
        averagePace: '05:00',
        comments: [{ user: 'luk3', comment: 'lets goooooo!', date: generateFutureRunDate(5) }],
        status: 0,
        routePoints: [[-3.1692188382901065, 56.205451300074], [-3.2454364812944334, 56.22568790735866], [-3.21391529709274, 56.25694309980631]],
        meetingPoints: [[-3.2454364812944334, 56.22568790735866]],
        distancesToEnd: [13.6, 6.8],
        description: 'From Glenrothes to Lomond Hills to Falkland',
        totalElevation: 180,
        totalDistance: 13.6,
        participantDistance: [13.6],
        runDifficulty: 75
    },
    {
        _id: 29,
        participants: ['luk3'],
        startDateTime: generateFutureRunDate(4.7),
        averagePace: '06:00',
        comments: [{ user: 'luk3', comment: 'Falkland we are comming!', date: generateFutureRunDate(3) }],
        status: 0,
        routePoints: [[-3.1980762826220825, 56.25535988736033], [-3.3443316986854086, 56.19886716030331], [-3.188167435339693, 56.251696769944544]],
        meetingPoints: [[-3.3443316986854086, 56.19886716030331]],
        distancesToEnd: [35.7, 17.8],
        description: 'Falkland to Loch Leven National Nature Reserve - beautiful run',
        totalElevation: 50,
        totalDistance: 35.7,
        participantDistance: [35.7],
        runDifficulty: 95
    },
    {
        _id: 30,
        participants: ['jooe'],
        startDateTime: generateFutureRunDate(2.8),
        averagePace: '06:00',
        comments: [{ user: 'lisaSmith', comment: 'lets go girls and boys!', date: generateFutureRunDate(2.7) }],
        status: 0,
        routePoints: [[-3.2177626293645005, 55.947963971043805], [-3.1635949803268772, 55.94719609160754], [-3.142894151083027, 55.92453265911777]],
        meetingPoints: [[-3.1635949803268772, 55.94719609160754]],
        distancesToEnd: [8.5, 4.2],
        description: 'Edinburgh Relaxed Run',
        totalElevation: 20,
        totalDistance: 8.5,
        participantDistance: [8.5],
        runDifficulty: 35
    }
];


//dummy user data
const dummy_users = [
    { _id: "ethan2000", password: "123", gender: "Male", birthdate: "23-02-2000", experience: "Beginner" },
    { _id: "luk3", password: "456", gender: "Male", birthdate: "15-05-1993", experience: "Advanced" },
    { _id: "jooe", password: "789", gender: "Male", birthdate: "10-10-1980", experience: "Professional" },
    { _id: "emz92", password: "abc", gender: "Female", birthdate: "02-03-1992", experience: "Beginner" },
    { _id: "soph", password: "def", gender: "Female", birthdate: "20-08-1988", experience: "Advanced" },
    { _id: "johnDoe", password: "ghi", gender: "Male", birthdate: "14-09-1993", experience: "Beginner" },
    { _id: "alice88", password: "xyz", gender: "Female", birthdate: "05-12-1985", experience: "Advanced" },
    { _id: "max05", password: "qwe", gender: "Male", birthdate: "30-07-2005", experience: "Beginner" },
    { _id: "lisaSmith", password: "rty", gender: "Female", birthdate: "18-04-1977", experience: "Professional" },
    { _id: "sammyS", password: "zxc", gender: "Male", birthdate: "08-11-1990", experience: "Professional" }
]


// ------------------------------------------------------------------------- Initialize database


//initialize the database and create the collections
function initializeDatabase() {
    return new Promise((res, reject) => {

        client.connect()
            .then(() => {
                // Initialize database collection (only if it does not exist)
                runs = client.db().collection(config.runs)
                users = client.db().collection(config.users)


                //     // This is how to insert dummy runs and users -------------------------------------------------------------------------------------------
                // dummy_runs.forEach(run => {
                //     insertRun(run);
                // })

                // dummy_users.forEach(user => {
                //     insertUser(user);
                // })

                // console.log("Dummy data successfully inserted into database")
                //     // --------------------------------------------------------------------------------------------------------------------------------------


                console.log('Database collections initialized');
                res({ runs, users });
            })


            // Code to delete collections from database --------------------------------------------------------------------------------------------------
            // .then(conn => {
            //     // If the collection does not exist it will automatically be created
            //     collection = client.db().collection(config.collection);
            // })
            // .then( () => {
            //     // List all collections in database
            //     return client.db().listCollections().toArray()
            //     .then( collections => 
            //         Promise.all(collections.map( coll => client.db().collection(coll.name).drop().then(() => console.log("dropped ", coll.name)))))
            // })
            // -------------------------------------------------------------------------------------------------------------------------------------------

            .catch(error => {
                console.error('Error connecting to the database:', error);
                reject(error);
            })
    })
}

// ------------------------------------------------------------------------- Functions to insert data into database

//insert runObject created from class into database collection 
const insertRun = async function (runObject) {

    //create runID for run 
    return runs.insertOne(
        {
            _id: runObject._id,
            participants: runObject.participants,
            startDateTime: runObject.startDateTime,
            averagePace: runObject.averagePace,
            comments: runObject.comments,
            status: runObject.status,
            routePoints: runObject.routePoints,
            meetingPoints: runObject.meetingPoints,
            distancesToEnd: runObject.distancesToEnd,
            description: runObject.description,
            totalElevation: runObject.totalElevation,
            totalDistance: runObject.totalDistance,
            participantDistance: runObject.participantDistance,
            runDifficulty: runObject.runDifficulty
        }
    ).catch(err => {
        console.log("Error inserting run into database: ", err)
    })
}

//insert userObject into database collection 
const insertUser = async function (userObject) {

    return users.insertOne(
        { _id: userObject._id, password: userObject.password, gender: userObject.gender, birthdate: userObject.birthdate, experience: userObject.experience }
    ).catch(err => {
        console.log("Could not add data", err.message);
        if (err.name != 'MongoError' || err.code != 11000) throw err;
    })
}

//function to insert a comment on a run (pass an object to the database in the following format { user: "", comment: "", date: ""})
const insertComment = async function (runID, commentObject) {

    let query = { _id: runID }
    let update = { $push: { comments: commentObject } }

    runs.updateOne(query, update)
        .then(console.log("Comment successfully inserted"))
        .catch(err => {
            console.log("Error inserting comment on run", runID, err)
        })
}

//function to add participant and the participant's distance to the database if they join a run
const joinRun = async function (runID, userName, participantDistance) {

    let query = { _id: runID }
    let update = {
        $push: {
            participants: userName,
            participantDistance: participantDistance
        }
    }

    runs.updateOne(query, update)
        // .then(console.log("User successfully added to run"))
        .catch(err => {
            console.error("Error joining the run", err)
        })
}

//function which updates the status of the specified run 
const updateRunStatus = async function (runID) {

    let query = { _id: runID }
    let modification = { $set: { status: 1 } }

    return runs.updateOne(query, modification)
        .then(console.log("Status successully updated to finished for run", runID))
        .catch(err => {
            console.error("Error updating the status of run", runID, err)
        })

}


// ------------------------------------------------------------------------- Functions to retrieve data from database

//function that returns an array of all the user objects in the database
const findAllUsers = async function () {

    let query = {};

    return users.find(query).toArray()
        .then(userObjects => {
            return userObjects;
        })
        .catch(err => {
            console.error("Error retrieving all users", err)
            throw err
        });
}


//function that returns the object of the username that is requested 
const findUser = async function (username) {

    let query = { _id: username }

    // console.log("query from database side", query)

    return users.findOne(query)
        .then(userObject => {
            return userObject;
        })
        .catch(err => {
            console.error("Error finding specific user", err)
            throw err
        });
}


// Define function to return an array of all objects for upcoming runs (status 0) from other participants
const findUpcomingRuns = async function (username) {

    let query = {
        status: 0,
        participants: { $nin: [username] }
    };

    return runs.find(query).toArray()
        .then(runObjects => {
            // Sort converted runObjects by startDateTime in ascending order
            runObjects.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
            return runObjects;
        })
        .catch(err => {
            console.error("Error retrieving upcoming runs", err)
            throw err
        })
}

//function to find the runObject that is associated with a given runID
const findRun = async function (runID) {

    let query = { _id: runID }

    return runs.findOne(query)
        .then(runObject => {
            return runObject;
        })
        .catch(err => {
            console.error("Error finding the specified run", runID)
            throw err
        });
}

//function that returns an array of all the run objects in the database
const findAllRuns = async function () {

    let query = {};

    return runs.find(query).toArray()
        .then(runObjects => {
            return runObjects;
        })
        .catch(err => {
            console.error("Error retrieving all runs", err)
            throw err
        })
}

//function to get all runs for a specified username
const findAllRunsUser = async function (username) {

    let query = { participants: { $in: [username] } }

    return runs.find(query).toArray()
        .then(runObjects => {
            return runObjects;
        })
        .catch(err => {
            console.error("Error retrieving all runs for user", username, err)
            throw err
        })
}

//function that returns all users who the specified user has run with and the number of runs 
const findRunningPartners = async function (username) {

    let runningPartners = {}
    let query = { participants: { $in: [username] } }

    //find all runs where the user has participated
    return runs.find(query).toArray()
        .then(runObjects => {

            runObjects.forEach(run => {

                const participants = run.participants.filter(participant => participant != username);

                participants.forEach(partner => {
                    if (partner in runningPartners) {
                        runningPartners[partner]++;
                    } else {
                        runningPartners[partner] = 1;
                    }

                });
            });

            const result = []
            for (let partner in runningPartners) {
                result.push({ _id: partner, frequency: runningPartners[partner] })
            }
            return result;
        })
        .catch(err => {
            console.error("Error retrieving all runs for user", username, err)
            throw err
        })
}

//export the database initialization such that it becomes available in the server script
module.exports = {
    initializeDatabase, insertRun, insertUser, findAllUsers, findUser, findAllRuns, findUpcomingRuns, findRunningPartners, findAllRunsUser,
    insertComment, joinRun, findRun, updateRunStatus
};