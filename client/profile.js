//make sure the html is finished loading before the js is executed
document.addEventListener("DOMContentLoaded", function (event) {

  //load the data as soon as the window opens 
  window.onload = () => {
    loadPersonalDetails()
  }

  //get runs and personal information for user from the database
  function loadPersonalDetails() {

    fetch("/getPersonalDetails")
      .then(response => response.json())
      .then(data => {
        console.log(data)

        //gets the data from server/database and splits into personal, running partner and running data which are passed in the functions below
        let userData = data[0]
        let runningPartnerData = data[1]
        let runData = data[2]

        createUserInformationBox(userData)
        createCalendarElements()

        let monthDropdown = document.getElementById("month-dropdown")
        monthDropdown.addEventListener("change", () => onUpdateCalendar(runData));
        let yearDropdown = document.getElementById("year-dropdown")
        yearDropdown.addEventListener("change", () => onUpdateCalendar(runData));

        //run functions to create elements on the webpage
        createRunningPartnerRanking(runningPartnerData) //creates running partner section and barchart
        createActivityCalendar(runData) //create calendar
        let histogramData = getHistogramData(runData, userData)
        createRunHistogram(histogramData)
      })
  }




  //--------------------------------------------- Helper functions 

  const createElement = (name) => {
    return document.createElement(name);
  }

  //create support function "getElement" to simplify access to specific HTML elements via ID
  const getElement = (name) => {
    return document.getElementById(name);
  }

  //--------------------------------------------- Create user information section with calendar


  //create header for the personal page to greet the usere
  function createUserInformationBox(userObject) {

    let userInformationDiv = createElement("div")
    let yourInformationSection = getElement("your-information")

    let nameHeader = createElement("h2")
    nameHeader.innerHTML = `Welcome ${userObject._id}!`
    nameHeader.id = "nameHeader"

    let userBirthdate = createElement("p")
    userBirthdate.innerHTML = `<strong>Birthdate:</strong> ${userObject.birthdate}`;

    let userExperience = createElement("p")
    userExperience.innerHTML = `<strong>Experience level:</strong> ${userObject.experience}`

    userInformationDiv.appendChild(nameHeader)
    userInformationDiv.appendChild(userBirthdate)
    userInformationDiv.appendChild(userExperience)
    yourInformationSection.appendChild(userInformationDiv)
  }

  //--------------------------------------------- Calendar 

  //function to create activity calendar 
  function createActivityCalendar(data) {

    let calendarDiv = document.getElementById("your-information");
    let calendar_table = document.createElement("div")
    calendar_table.setAttribute("id", "calendar-table")
    calendarDiv.appendChild(calendar_table)

    let toolTipDiv = document.createElement("div")
    toolTipDiv.id = "calendar-tooltip-container"
    calendarDiv.appendChild(toolTipDiv)


    //retrieve values from dropdowns to show representative calendar 
    let selected_month = document.getElementById("month-dropdown").value
    let selected_year = document.getElementById("year-dropdown").value
    console.log(selected_month, selected_year)

    //call function to create calendar
    createCalendar(selected_year, selected_month, data);
  }

  //return information on the event on a given date (i.e., whether event is finished or upcoming)
  function checkEventOnDate(runsObject, selected_year, selected_month, current_date) {
    for (const run of runsObject) {
      let year = run.startDateTime.substring(0, 4);
      let month = run.startDateTime.substring(5, 7);
      let date = run.startDateTime.substring(8, 10);

      if (year === selected_year && month === selected_month && date === current_date && run.status === 0) {
        return {
          status: run.status,
          description: run.description,
          participants: run.participants,
          distance: run.totalDistance
        };
      } else if (year === selected_year && month === selected_month && date === current_date && run.status === 1) {
        return {
          status: run.status,
          description: run.description,
          participants: run.participants,
          distance: run.totalDistance
        };
      }
    }
    return "none"
  }

  //create the calendar layout (source: https://plnkr.co/edit/8TutdHGPz06kKUQS?p=preview&preview)
  function createCalendar(year, month, runsObject) {

    //clean the current calendar
    let calendar_table = document.getElementById("calendar-table")

    let mon = month - 1;
    let d = new Date(year, mon);
    let table = '<table><tr><th>MO</th><th>TU</th><th>WE</th><th>TH</th><th>FR</th><th>SA</th><th>SU</th></tr><tr>';

    //add empty cells up until the first day
    for (let i = 0; i < getDay(d); i++) {
      table += '<td></td>';
    }

    //generate the number of days in the month
    while (d.getMonth() == mon) {
      let cellClass = "";

      //set the class of the cell if there is an event on the day 
      //padstart adds 0s to the month or date to ensure the format is correct (source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart)
      const eventStatus = checkEventOnDate(runsObject, year.toString(), month.toString().padStart(2, '0'), d.getDate().toString().padStart(2, '0'));
      if (eventStatus.status === 0) {
        cellClass = 'upcoming-event tooltip';
        tooltipText = `${eventStatus.description} of ${eventStatus.distance}km with ${eventStatus.participants}`;
        table += '<td class="' + cellClass + ' tooltip">' + d.getDate() + '<span class="tooltiptext">' + tooltipText + '</span></td>';
      } else if (eventStatus.status === 1) {
        cellClass = "finished-event tooltip";
        tooltipText = `${eventStatus.description} of ${eventStatus.distance}km with ${eventStatus.participants}`;
        table += '<td class="' + cellClass + ' tooltip">' + d.getDate() + '<span class="tooltiptext">' + tooltipText + '</span></td>';
      } else {
        table += '<td>' + d.getDate() + '</td>';
      }
      if (getDay(d) % 7 == 6) {
        table += '</tr><tr>';
      }

      d.setDate(d.getDate() + 1);
    }

    //if the last day is not a Sunday, fill the current row with empty cells
    if (getDay(d) != 0) {
      for (let i = getDay(d); i < 7; i++) {
        table += '<td></td>';
      }
    }

    //append the calendar to the div element on the page
    table += '</tr></table>';
    document.getElementById("calendar-table").innerHTML = table;
  }

  //get the weekday of a week
  function getDay(date) {
    let day = date.getDay()
    if (day == 0) day = 7
    return day - 1;
  }

  //function to create divs and elements for the calendar section
  function createCalendarElements() {

    let calendarSection = document.getElementById("your-information")
    let dropdownDiv = document.createElement("div")

    //define variables 
    let years = ["2024"]
    let months = ["January", "February", "March", "April", "May"];
    let monthValues = [1, 2, 3, 4, 5]


    let yearDropdown = document.createElement("select")
    yearDropdown.setAttribute("id", "year-dropdown")
    for (let year of years) {
      let option = document.createElement("option")
      option.text = year;
      option.value = 2024;
      yearDropdown.appendChild(option)
    }

    let monthDropdown = document.createElement("select");
    monthDropdown.setAttribute("id", "month-dropdown");
    for (let i = 0; i < months.length; i++) {
      let option = document.createElement("option");
      option.text = months[i];
      option.value = monthValues[i];
      monthDropdown.appendChild(option);
    }

    dropdownDiv.appendChild(yearDropdown)
    dropdownDiv.appendChild(monthDropdown)

    calendarSection.appendChild(dropdownDiv)

  }

  //update the calendar when user specifies a new month or year via the dropdowns
  function onUpdateCalendar(runData) {
    document.getElementById("calendar-table").innerHTML = "";
    let selected_month = document.getElementById("month-dropdown").value;
    let selected_year = document.getElementById("year-dropdown").value;
    createCalendar(selected_year, selected_month, runData)
  }


  //--------------------------------------------- Top running friends plot
  //source: https://d3-graph-gallery.com/graph/barplot_basic.html

  //function to create the ranking of the user's running partners 
  function createRunningPartnerRanking(runningPartnerData) {
    
    //create ranking
    let runningPartnerDataSorted = runningPartnerData.sort((a, b) => b.frequency - a.frequency);

    let runningPartnerDiv = document.createElement("div");
    runningPartnerDiv.setAttribute("id", "running-partner-div");

    let runningPartnerHeader = document.createElement("h3");
    runningPartnerHeader.innerHTML = "Your top running partners";

    let runningPartnerDescription = document.createElement("p");
    runningPartnerDescription.innerHTML = "Discover the runners with whom you have run the most!";

    runningPartnerDiv.appendChild(runningPartnerHeader);
    runningPartnerDiv.appendChild(runningPartnerDescription);

    let running_partners = document.getElementById("running-partners");
    running_partners.appendChild(runningPartnerDiv);

    //create the plot
    createRunningPartnersPlot(runningPartnerDataSorted);
  }

  //function to create bar plot showing the users that you have run with most frequently 
  function createRunningPartnersPlot(dataObject) {

    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = 460 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#running-partner-div")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(dataObject.map(d => d._id))
      .padding(0.2);

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", `translate(-10,0)rotate(-45)`)
      .style("text-anchor", "end");

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataObject, d => d.frequency)])
      .range([height, 0]);

    svg.append("g")
      .call(d3.axisLeft(y).ticks(2));

    svg.selectAll(".mybar")
      .data(dataObject)
      .join("rect")
      .attr("class", "mybar")
      .attr("x", d => x(d._id))
      .attr("y", d => y(d.frequency))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.frequency))
      .attr("fill", "#69b3a2");
  }

  //--------------------------------------------- Histogram of running mileage (ie how much has the user run every week in the last X months) 
  //source: https://d3-graph-gallery.com/graph/histogram_basic.html
  //source: https://stackoverflow.com/questions/48083728/group-dates-by-week-javascript

  function createRunHistogram(data) {
    console.log(data);

    //create introductory paragraphs and elements
    let sectionDiv = document.getElementById("histogram-section");
    let histogramDiv = document.createElement("div");
    histogramDiv.id = "histogram-div";
    let histogramHeader = document.createElement("h3")
    histogramHeader.innerHTML = "Your weekly mileage"
    let histogramText = document.createElement("p")
    histogramText.innerHTML = "Hover over each week to see your total mileage"


    histogramDiv.appendChild(histogramHeader)
    histogramDiv.appendChild(histogramText)
    sectionDiv.appendChild(histogramDiv);

    const margin = { top: 30, right: 30, bottom: 70, left: 60 },
      width = 460 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    //define the first and last day of the period to consider, ensure that the first day is a Monday, otherwise the week function will not work since it adds 7 days
    const startDate = new Date(2024, 2, 4)
    const endDate = new Date(2024, 6, 1);

    //generate a list of all weeks betwen the first and last dates
    const weeks = []
    let currentWeek = new Date(startDate)
    while (currentWeek < endDate) {
      weeks.push(new Date(currentWeek));
      currentWeek.setDate(currentWeek.getDate() + 7)
    }

    //add together all the kilometers the runner has done in a single week 
    const aggregatedData = weeks.map(week => ({
      week: week, totalKilometers: data
        .filter(d => d.runDate >= week && d.runDate < new Date(week).setDate(week.getDate() + 7))
        .reduce((total, d) => total + d.kilometers, 0)
    }));

    //buildhistogram using the aggregated data from above
    const svg = d3.select("#histogram-div").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform",
        `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(aggregatedData.map(d => d.week))
      .range([0, width])

    const xAxis = d3.axisBottom(x)
      .tickFormat(() => '');

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('.tick')
      .remove();

    const y = d3.scaleLinear()
      .domain([0, d3.max(aggregatedData, d => d.totalKilometers) + 2])
      .range([height, 0]);

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis);

    svg.append("g")
      .call(d3.axisLeft(y))

    var div = d3.select("#histogram-div").append("div")
      .attr("class", "tooltip2")
      .style("opacity", 0)
      .style("color", "black");

    svg.selectAll(".bar")
      .data(aggregatedData)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.week))
      .attr("y", d => y(d.totalKilometers))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.totalKilometers))
      .attr("fill", "#69b3a2")
      .attr("stroke", "black")
      .on("mouseover", function (e, d) {
        d3.select(this).style("fill", "orange")
        div.transition()
          .style("opacity", 0.9)
        div.html(`Week: ${d.week.toISOString().substring(0, 10)} <br/> Total kilometers: ${Math.round(d.totalKilometers)}km`)
      })
      .on("mouseout", function () {
        d3.select(this).style("fill", "#69b3a2")
        div.transition()
          .style("opacity", 0)
      })
  }

  //function to extract the relevant data from the runObjects and process
  function getHistogramData(runData, userData) {
    let userName = userData._id;
    let histogramData = [];

    for (let i = 0; i < runData.length; i++) {

      let object = {}
      let date2 = new Date(runData[i].startDateTime);
      object["runDate"] = date2

      if (runData[i].participants.includes(userName)) {
        let participantIndex = runData[i].participants.indexOf(userName);
        let kilometers = runData[i].participantDistance[participantIndex];
        object["kilometers"] = kilometers
      }

      histogramData.push(object)
    }

    // console.log(histogramData)
    return histogramData;
  }
});
