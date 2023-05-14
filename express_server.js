const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  user3RandomID: {
    id: "user3RandomID",
    email: "puts@puts.com",
    password: "a",
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "user3RandomID"
  },
  "9sm5xK": { 
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
}

function sniffer(user) {  // Sniff existing user email addresses to check if they match email being entered for registration
  for (const eUser in users) {
    if (user.email === users[eUser].email) {
      return true;
    }
  }
  return false;
}

function doorman(user) {  // Match entered credentials agains existing user credentials
  for (const eUser in users) {
    if (user.email === users[eUser].email) {
      if (user.password === users[eUser].password){
        return users[eUser];
      }
    }
  }
  return false;
}

function urlsForUser(user) {
  let result = {};
  for (const URL in urlDatabase) {
    if (user.id === urlDatabase[URL].userID) {
      result[URL] = {userID: urlDatabase[URL].userID, longURL: urlDatabase[URL].longURL};
      console.log("test2", result)
    }
  }
  return result;
};

function generateRandomString() { // Generate random string of characters to be used as shortURL
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {  // Render the urls_index view
  const user = users[req.cookies["user_id"]]
  //if the user is logged IN
  if(user){
    //get all the urls for the user
    let result = urlsForUser(user);
    let templateVars = {urls: result, user: user,};
    res.render("urls_index", templateVars);
  } else {
    //If the user is not LOGGED in
    res.send("<h3>You need to log in to see your tiny URLs!</h3>");
  }
});

app.get("/register", (req, res) => { // Render account creation page
  const user = users[req.cookies["user_id"]]
  const templateVars = { user }
  if (typeof user === "object") {
    res.redirect(`/urls`);
  } else {
    res.render("create_account", templateVars);
  }
});

app.post("/register", (req,res) => {  // Register new user - evoke sniffer() to catch existing emails
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

  let user = {
    id: id,
    email: email,
    password: password
  }

  if(sniffer(user) === true) {
    res.status(400).send("<h3>Email already used</h3>");
   } else {

  users[id] = user
  
  console.log(users);

  res.cookie("user_id", user.id)

  res.redirect(`/urls`); 
  }
});

// Post command - Create new entry with generated short URL ID - redirects to /urls
app.post("/urls", (req, res) => { 
  const user = users[req.cookies["user_id"]]
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  if (typeof user !== "object") {
  res.send("<h3>You need to be logged in to create tiny URLs</h3>");
  } else {
  console.log("test", req.body, shortURL);
  res.redirect(`/urls/${shortURL}`,);
  }
  
  urlDatabase[shortURL] = { longURL: longURL, userID: user.id } ;
  console.log(urlDatabase)
});

app.post("/urls/:id/delete", (req, res) => {  // Delete command - redirect back to /urls
  if (!user) {
    res.send("<h3>You're not logged in!</h3>")
  } else if (!urlDatabase[id]) {
    res.send("<h3>This URL does not exist!</h3>")
  } else {
    urlDatabase[id] = newLongURL;
    res.redirect(`/urls`); ;
  };
  
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`); 
});

app.post("/urls/:id/update", (req, res) => { // Update command - swap longURL for the input and redirects to /urls
  const user = users[req.cookies["user_id"]]
  const id = req.params.id;
  const newLongURL = req.body.longURL;

  if (!user) {
    res.send("<h3>You're not logged in!</h3>")
  } else if (!urlDatabase[id]) {
    res.send("<h3>This URL does not exist!</h3>")
  } else {
    urlDatabase[id] = newLongURL;
    res.redirect(`/urls`); ;
  };
});

app.get("/login", (req, res) => { // Render login page
  const user = users[req.cookies["user_id"]]
  const templateVars = { user }
  if (typeof user === "object") {
    res.redirect(`/urls`);
  } else {
  res.render("log_in", templateVars);
  }
});

app.post("/login", (req, res) => {  // Login command - evoke doorman to check credentiuals and capture username in a cookie if user exists
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  console.log(user)

  const foundUser = doorman(user)

  console.log(foundUser)
  
  if(foundUser === false) {
    res.status(403).send("<h3>User not found</h3>")
  } else if (urlsForUser(foundUser)) { // Check if the user has associated URLs
    res.cookie("user_id", foundUser.id);
    res.redirect("/urls"); // Redirect to the "/urls" route
  } else {
    res.send("<h3>You don't have any URLs yet.</h3>");
  }
})

app.post("/logout", (req, res) => { // Logout command - clear the username cookie
  res.clearCookie("user_id")

  res.redirect(`/login`);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {  // URL creation page - render a page to generate the randomly generated shortened URL on submission
  const user = users[req.cookies["user_id"]]
  const templateVars = { user }

  if (typeof user !== "object") {
    res.redirect(`/urls`);
  } else {
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {  // URL details page - render a page with each URLs information and allows for editing of the longURL - redirects to /urls
  const user = users[req.cookies["user_id"]]
  const id = req.params.id;
  console.log(id)
  if(user && user.id === urlDatabase[id].userID){
    const templateVars = { 
      user: user,
      id, 
      longURL: urlDatabase[id].longURL
    };
    res.render("urls_show", templateVars);
  //If the user is not LOGGED in
  } else if (!user) {
    res.send("<h3>You're not logged in!</h3>")
  } else if (!urlDatabase[id]) {
    res.send("<h3>This URL does not exist!</h3>")
  } else {
    res.send("<h3>You cannot access another user's URL!</h3>");
  }
});

app.get("/u/:id", (req, res) => { // Retrieve the longURL associated with the shortURL entered and redirects to the longURL site
  const longURL = urlDatabase[req.params.id].longURL;

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("<h3>Shortened URL does not exist</h3>");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

