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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  
  const templateVars = { 
    user,
    urls: urlDatabase 
  };

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => { // Render account creation page
  res.render("create_account");
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
    const error = new Error("Email already used");
    error.statusCode = 400;
    throw error;
   } else {
    
  users[id] = user
  
  console.log(users);


  res.cookie("user_id", user.id)

  res.redirect(`/urls`); 
  }
})

// Post command - Create new entry with generated short URL ID - redirects to /urls
app.post("/urls", (req, res) => { 
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  console.log(req.body, shortURL);
  res.redirect(`/urls/${shortURL}`);

  urlDatabase[shortURL] = longURL;
});

app.post("/urls/:id/delete", (req, res) => {  // Delete command - redirect back to /urls
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`); 
});

app.post("/urls/:id/update", (req, res) => { // Update command - swap longURL for the input and redirects to /urls
  const id = req.params.id;
  const newLongURL = req.body.longURL;

  urlDatabase[id] = newLongURL;
  
  res.redirect(`/urls`); 
})

app.get("/login", (req, res) => { // Render login page
  res.render("log_in");
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
    const error = new Error("User not found");
    error.statusCode = 403;
    throw error;
  } else {
    res.cookie("user_id", foundUser.id)
  };

  res.redirect(`/urls`);
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
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {  // URL details page - render a page with each URLs information and allows for editing of the longURL - redirects to /urls
  const user = users[req.cookies["user_id"]]
  
  const templateVars = { 
    user,
    id: req.params.id, 
    longURL: urlDatabase[req.params.id] 
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => { // Retrieve the longURL associated with the shortURL clicked and redirects to the longURL site
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

