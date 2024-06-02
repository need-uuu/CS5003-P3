
//test personal detail -----/getPersonalDetails----------main.js line 132
describe('GET /getPersonalDetails', function() {
    beforeEach(function() {

        sinon.stub(global, 'findUser').resolves({
            userName: 'testUser',
        });
        sinon.stub(global, 'findRunningPartners').resolves([
        ]);
        sinon.stub(global, 'findAllRunsUser').resolves([
        ]);
    });

    afterEach(function() {
        sinon.restore();
    });

    it('should return personal details, running partners, and all runs for the session user', function(done) {
        request(app)
            .get('/getPersonalDetails')
            // .set('Authorization', 'Bearer test-session-token') 
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.body).to.be.an('array');

                expect(res.body[0]).to.have.property('userName', 'testUser');
                expect(res.body[1]).to.be.an('array'); 
                expect(res.body[2]).to.be.an('array'); 
                done();
            });
    });

});
//test personal detail -----/getPersonalDetails----------main.js line 132

//test /submit-new-run----------main.js line 227
describe('POST /submit-new-run', function() {
    it('should add a new run and return a success message', function(done) {
        const newRunData = {
            startDateTime: "2023-04-05T08:00",
            averagePace: "5:00",
            routePoints: [{ lat: 40.7128, lng: -74.0060 }, { lat: 40.7158, lng: -74.0080 }],
            elevationValues: [5, 10],
            distancesFromStart: [0, 1000],
            description: "Morning run in the city"
        };

        request(app)
            .post('/submit-new-run')
            .send(newRunData)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                expect(res.body).to.have.property('message', 'Successfully added new run');
                done();
            });
    });
});

//test ----------/getUpcomingRuns---------line 293
const { findUpcomingRuns } = require('./path/to/databaseFunctions');
describe('GET /getUpcomingRuns', function() {

    beforeEach(() => {

        sinon.stub(findUpcomingRuns, 'call').resolves([

            { id: 1, title: "Morning Run", date: "2023-05-01", participants: ["testUser"] },
            { id: 2, title: "Evening Run", date: "2023-05-02", participants: ["testUser"] }
        ]);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return an array of upcoming runs for the session user', function(done) {
        request(app)
            .get('/getUpcomingRuns')
            // .set('Cookie', 'session=your_session_cookie') 
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.be.an('array').that.is.not.empty;
                expect(res.body[0]).to.have.property('run');
                expect(res.body[0].run).to.include({ title: "Morning Run" });

                done();
            });
    });

});
//test ----------/getUpcomingRuns---------line 293-end




//test ----------/submitDistances---------line 

const { findUpcomingRuns, findRunningPartners, findUser, calculateRunScores } = require('./path/to/yourService');

describe('POST /submitDistances', function() {
    beforeEach(() => {
        sinon.stub(findUpcomingRuns, 'call').resolves([
            { _id: 'run1', title: "Morning Run" },
            { _id: 'run2', title: "Evening Run" }
        ]);
        sinon.stub(findRunningPartners, 'call').resolves([
        ]);
        sinon.stub(findUser, 'call').resolves({
            userName: 'testUser',
            experience: 5
        });
        sinon.stub(calculateRunScores, 'call').resolves([
            { id: 'run1', totalScore: 90 },
            { id: 'run2', totalScore: 80 }
        ]);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return sorted upcoming runs based on score', function(done) {
        request(app)
            .post('/submitDistances')
            .send({ distanceArray: [1, 2, 3] }) 
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.be.an('array');
                expect(res.body).to.have.lengthOf(2);
                expect(res.body[0]._id).to.equal('run1'); 
                expect(res.body[0].score).to.equal(90);

                done();
            });
    });
});

//test ----------/submitDistances---------line -end



//test ----------/addNewComment---------line 
const { insertComment } = require('./path/to/databaseFunctions');

describe('POST /addNewComment', function() {
    beforeEach(() => {

        sinon.stub(insertComment, 'call').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should accept a comment object and insert it into the database', function(done) {
        const commentObject = {
            runID: '123',
            commentText: 'Great run!',
            commentDateTime: new Date().toISOString()
        };

        request(app)
            .post('/addNewComment')
            .send({ commentObject }) 
            .expect(200) 
            .end((err, res) => {
                if (err) return done(err);

                sinon.assert.calledOnce(insertComment.call);
                done();
            });
    });
});

//test ----------/addNewComment---------line -end



//test ----------/joinRun---------line 
const { insertComment } = require('./path/to/databaseFunctions');

describe('POST /addNewComment', function() {
    beforeEach(() => {

        sinon.stub(insertComment, 'call').resolves();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should accept a comment object and insert it into the database', function(done) {
        const commentObject = {
            runID: '123',
            commentText: 'Great run!',
            commentDateTime: new Date().toISOString()
        };

        request(app)
            .post('/addNewComment')
            .send({ commentObject }) 
            .expect(200) 
            .end((err, res) => {
                if (err) return done(err);

                sinon.assert.calledOnce(insertComment.call);
                done();
            });
    });
});
//test ----------/joinRun--------line -end


//test ----------/createCard---------line 
describe('POST /createCard', function() {
    it('should create a new card and return a success message with the new card ID', function(done) {
        const cardData = {
            title: "New Card",
            description: "This is a test card."
        };

        request(app)
            .post('/createCard')
            .send(cardData) 
            .expect(200) 
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('message', 'Card created successfully');
                expect(res.body).to.have.property('id').that.is.a('number'); 

                done();
            });
    });
});
//test ----------/getUpcomingRuns---------line -end


//test ----------POST /comments---------line 
const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('./main'); // 

describe('POST /comments', function() {
    it('should accept a comment and return the saved comment object', function(done) {
        const commentData = {
            cardId: '1',
            comment: 'This is a test comment.'
        };

        request(app)
            .post('/comments')
            .send(commentData) 
            .expect(200) 
            .end((err, res) => {
                if (err) return done(err);

                expect(res.body).to.include.keys('cardId', 'comment', 'createdAt');
                expect(res.body.cardId).to.equal(commentData.cardId);
                expect(res.body.comment).to.equal(commentData.comment);
                expect(new Date(res.body.createdAt)).to.be.a('date');
                done();
            });
    });
});
//test ----------/getUpcomingRuns---------line -end


//test ------------------line 


//test -------------------line -end
