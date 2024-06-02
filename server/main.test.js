
// For main.test.js--------------------------------
// test registeration----------/registerUser
const request = require('supertest');
const { expect } = require('chai');
const app = require('./main'); 
const { response } = require('express');
const sinon = require('sinon');


// console.log("loging",app.runApp());

describe('POST /registerUser', function() {
    this.timeout(10000); // Timeout of 10 seconds
    before(async()=>run= await app.runApp())
    after(()=>run.close())

    it('should get run 8', function(done) {
        request(run)
            .post('/getOneRun')
            .send({
                runID:8
            })
            .expect(200) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('description', 'City center run');
                done();
            })
            .catch(err => done(err));
    });

    it('should not get run -1', function(done) {
        request(run)
            .post('/getOneRun')
            .send({
                runID:-1
            })
            .expect(400) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('error', 'No such run');
                done();
            })
            .catch(err => done(err));
    });

    it('should not register a user when the username already exists', function(done) {
        request(run)
            .post('/registerUser')
            .send({
                // { _id: "ethan2000", password: "123", gender: "Male", birthdate: "23-02-2000", experience: "Beginner" },
                userName: "ethan2000",
                userPassword: "password123",
                userGender: "Female",
                userBirthdate: "1990-01-01",
                userExperience: "Beginner"
            })
            .expect(400) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('message', 'User already exists in database');
                done();
            })
            .catch(err => done(err));
    });
});

describe('POST /loginUser', function() {
    before(async()=>run= await app.runApp())
    after(()=>run.close())
    
    it('should log in unsuccessfully', function(done) {
        request(run)
            .post('/loginUser')
            .send({
                userName: 'luk3',
                userPassword:'433'
            })
            .expect(400) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('message', 'Incorrect password');
                done();
            })
            .catch(err => done(err));
    });

    it('should not found user', function(done) {
        request(run)
            .post('/loginUser')
            .send({
                userName: 'Emma',
                userPassword:'433'
            })
            .expect(400) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('message', 'User not found');
                done();
            })
            .catch(err => done(err));
    });

    it('should log in successfully', async function(done) {
        const response = await request(run)
        .post('/loginUser')///////////////////////////////
        .send({
            userName: 'luk3',
            userPassword:'456'
        })
        .expect(200);
        // .then(response => {
        //     expect(response.body).to.be.an('json');
        //     expect(response.body).to.have.property('number', '200');
        //     done();
        // })
    });
});




describe('POST /getOneRun', function() {
    before(async()=>run= await app.runApp())
    after(()=>run.close())
    
    it('should not get run 99', function(done) {
        request(run)
            .post('/getOneRun')
            .send({
                runID:99
            })
            .expect(400) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('error', 'No such run');
                done();
            })
            .catch(err => done(err));
    });

    it('should get run 4', function(done) {
        request(run)
            .post('/getOneRun')
            .send({
                runID:4
            })
            .expect(200) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('description', 'Sprint training');
                done();
            })
            .catch(err => done(err));
    });

})

describe('POST /getUpcomingRuns', function() {
    before(async()=>run= await app.runApp())
    after(()=>run.close())
    
    it('should get runIDs which userName participants', function(done) {
        request(run)
            .post('/getUpcomingRuns')
            .send({
                userName: 'luk3'
            })
            .expect(200)
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.propority('score');
                // expect(response.body).to.have.property('run');
                done();
            })
            .catch(err => done(err));
    });

    it('should not find the upcoming runs', function(done) {
        request(run)
            .post('/getUpcomingRuns')
            .send({
                userName: 'Emma'
            })
            .expect(404) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('Not Found');
                done();
            })
            .catch(err => done(err));
    });
    
    it('should give error', function(done) {
        request(run)
            .post('/getUpcomingRuns')
            .send({
                userName: 'null'
            })
            .expect(500) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('error', 'Internal server error');
                done();
            })
            .catch(err => done(err));
    });


})


describe('POST /submitDistances', function() {
    before(async()=>run= await app.runApp())

    after(()=>run.close())
    
    it('should ', function(done) {
        request(run)
            .post('/submitDistances')
            .send({
                userName:'luk3'
            })
            .expect(500) 
            .then(response => {
                expect(response.body).to.be.an('object');
                expect(response.body).to.have.property('error', 'Internal server error');
                done();
            })
            .catch(err => done(err));
    });
})



// describe('POST /addNewComment', function() {
//     before(async()=>run= await app.runApp())
//     after(()=>run.close())
  
//     it('should accept a comment object and insert it into the database', function(done) {
//         // const runID = 8;
//         const commentObject = {
//             runID:'8',
//             // commentRunID:'8',
//             commentText: 'Great run!',
//             commentDateTime: '2024-04-06T14:30'
//         };

//         request(run)
//             .post('/addNewComment')
//             .send({
//                 // runID:8,
//                 commentObject
//             }) 
//             .expect(200) 
//             .then(response => {
//                 expect(response.body).to.have.property({user});
//                 // expect(response.body.user).to.equal('emma');
//                 done();          
//             })
//             .catch(err => done(err));
//     });
// });

describe('POST /getComments', function() {
    before(async()=>run= await app.runApp())
    after(()=>run.close())
  
    it('should get comment', function(done) {
        request(run)
            .post('/getComments')
            .send({ runID:4}) 
            .expect(200) 
            .then(response => {
                response.body.forEach(item => {
                    expect(item).to.be.an('object').that.includes.all.keys('user', 'comment', 'date');
                    expect(item.user).to.be.equal('joe');
                    expect(item.comment).to.equal('Anyone wants to join?');
                    expect(item.date).to.equal('2024-04-01T07:00');
               
                });
                done();
            })
            .catch(err => done(err));
    });
});

