// CS5003 Masters Programming Projects - Client Side - Login
// Coursework P3: Social Runner


// LoginPage ----------------------------------------------------------------------------------------------------------------------------------------------------
// Define function "loadLoginPage" to create login page
const loadLoginPage = () => {
  // Create HTML structure
  let loginPage = getElement("loginPage");
  let loginDiv = createElement("div");
  loginDiv.id = "loginDiv";
  let loginButtonDiv = createElement("div");
  loginButtonDiv.id = "loginButtonDiv";
  let form = createElement("form");

  // Create name input and label
  createInputFields(form, "text", "nameInput", "Username: ");

  // Create password input and label
  createInputFields(form, "password", "passwordInput", "Password: ");

  // Create login button and add event listener
  let loginButton = createElement("button");
  loginButton.innerHTML = "Log in";
  loginButton.id = "logInButton";
  loginButton.addEventListener("click", () => {
    console.log("Log in button clicked");
    loginUser();
  });

  // Create register new user button and add event listener
  let registerUserButton = createElement("button");
  registerUserButton.innerHTML = "Register";
  registerUserButton.addEventListener("click", () => {
    console.log("Register new user button clicked");
    loadRegisterForm();
  })

  // Append form and buttons to login section
  loginButtonDiv.appendChild(loginButton);
  loginButtonDiv.appendChild(registerUserButton);
  loginDiv.appendChild(form);
  loginDiv.appendChild(loginButtonDiv);
  loginPage.appendChild(loginDiv);
}



// Call "loadLoginPage" function if page is loaded
window.onload = function () {
  loadLoginPage();
};



// Define function "loadRegisterForm" to create login page
const loadRegisterForm = () => {
  let loginPage = getElement("loginPage");
  let registerDiv = createElement("div");
  registerDiv.id = "registerDiv";
  let form = createElement("form");
  form.id = "registerform"

  // Use inputs that user tried to input before
  let nameInput = getElement("nameInput").value;
  let passwordInput = getElement("passwordInput").value;

  // Clear loginPage before loading the register form
  loginPage.innerHTML = "";

  // Create register name input and label
  createInputFields(form, "text", "registerNameInput", "Username: ");

  // Create register password input and label
  createInputFields(form, "password", "registerPasswordInput", "Password: ");

  // Create password input and label
  createInputFields(form, "date", "registerBirthdate", "Birth Date: ");

  // Create options to select in registration process
  let gender = ["Female", "Male"];
  let experience = ["Beginner", "Advanced", "Professional"];

  // Create dropdown menus for registration
  createDropdown(form, gender, "registerGender", "Gender: ");
  createDropdown(form, experience, "registerExperience", "Experience: ");

  // Create register button and add event listener
  let registerButton = createElement("button");
  registerButton.id = "registerButton"
  registerButton.innerHTML = "Register";
  registerButton.addEventListener("click", () => {
    console.log("New user will be registered")
    registerNewUser()
  })

  // Append form and buttons to login section
  registerDiv.appendChild(form);
  registerDiv.appendChild(registerButton);
  loginPage.appendChild(registerDiv);

  // Populate input fields with previous inputs
  getElement("registerNameInput").value = nameInput;
  getElement("registerPasswordInput").value = passwordInput;
}



// Define function "registerNewUser" to send user information to the server
const registerNewUser = () => {
  let registrationName = getElement("registerNameInput").value;
  let registrationPassword = getElement("registerPasswordInput").value;
  let registrationBirthdate = getElement("registerBirthdate").value;
  let registrationGender = getElement("registerGender").value;
  let registrationExperience = getElement("registerExperience").value;
  let nextPage = "join.html";

  console.log(registrationBirthdate)

  let selectedDate = new Date(registrationBirthdate)
  let currentDate = new Date();

  // Ensure that input fields are not empty
  if (selectedDate > currentDate) {
    alert("Please select a valid birthdate")
  } else if (!(registrationName === "" || registrationPassword === "" || registrationBirthdate === "")) {
    fetch("http://localhost:24980/registerUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: registrationName,
        userPassword: registrationPassword,
        userGender: registrationGender,
        userBirthdate: registrationBirthdate,
        userExperience: registrationExperience,
      }),
    })
      .then(response => {
        if (response.ok) {
          console.log("Successfully registered")
          window.location.href = nextPage;
          return response.json()
        } else {
          return response.json().then(error => { alert(error.message) })
        }
      })
      .catch(error => {
        console.error("Fetch error:", error);
      });
  } else {
    alert("Please enter all required inputs to register!");
  }
}


// Define function "loginUser" to send login information to the user
const loginUser = () => {
  let loginName = getElement("nameInput").value;
  let loginPassword = getElement("passwordInput").value;
  let nextPage = "join.html";

  // Ensure that input fields are not empty
  if (!(loginName === "" || loginPassword === "")) {
    fetch("http://localhost:24980/loginUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userName: loginName,
        userPassword: loginPassword,
      }),
    })
      .then(response => {
        if (response.ok) {
          console.log("Successfully logged in");
          window.location.href = nextPage
          return response.json();
        } else {
          return response.json().then(error => { alert(error.message) })
        }
      })
      .catch(error => {
        console.error("Fetch error:", error);
      });
  } else {
    alert("Please enter a valid username or password!");
  }
};



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
