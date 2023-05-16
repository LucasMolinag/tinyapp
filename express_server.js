const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "puts@puts.com",
    password: "$2a$10$IRW/Lfeyqf1Rq9LXvEkGo.uK40wBk39Ic1Z3w4Gn/JrrtofEmd3t2",
  }
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

// Check if a user already exists in the users database
const sniffer = function(user) {
  for (const eUser in users) {
    if (user.email === users[eUser].email) {
      return true;
    }
  }
  return false;
};

// Match entered credentials agains existing user credentials
const doorman = function(user) {
  for (const userId in users) {
    const existingUser = users[userId];
    if (user.email === existingUser.email && bcrypt.compareSync(user.password, existingUser.password)) {
      return existingUser;
    }
  }
  return null;
};

// Searches for URLs owned by certain user
const urlsForUser = function(user) {
  let result = {};
  for (const URL in urlDatabase) {
    if (user.id === urlDatabase[URL].userID) {
      result[URL] = {userID: urlDatabase[URL].userID, longURL: urlDatabase[URL].longURL};
    }
  }
  return result;
};

// Generate random string of characters to be used as shortURL
const generateRandomString = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};

app.use(cookieSession({
  name: "session",
  keys: ["123", "456", "789"]
}));

app.use(express.urlencoded({ extended: true }));

// Render the urls_index view
app.get("/urls", (req, res) => {
  const user = users[req.session["user_id"]];
  if (user) {
    let result = urlsForUser(user);
    let templateVars = {urls: result, user: user,};
    res.render("urls_index", templateVars);
  } else {
    res.send("<h3>You need to log in to see your tiny URLs!</h3>");
  }
});

// Render account creation page
app.get("/register", (req, res) => {
  const user = users[req.session["user_id"]];
  const templateVars = { user };
  if (user) {
    res.redirect(`/urls`);
  } else {
    res.render("create_account", templateVars);
  }
});

// Render login page
app.get("/login", (req, res) => {
  const user = users[req.session["user_id"]];
  const templateVars = { user };
  if (user) {
    res.redirect(`/urls`);
  } else {
    res.render("log_in", templateVars);
  }
});

// URL creation page - render a page to generate the randomly generated shortened URL on submission
app.get("/urls/new", (req, res) => {
  const user = users[req.session["user_id"]];
  const templateVars = { user };

  if (!user) {
    res.send("<h3>You need to be logged in to create now URLs!</h3>");
  } else {
    res.render("urls_new", templateVars);
  }
});

// URL details page - render a page with each URLs information and allows for editing of the longURL - redirects to /urls
app.get("/urls/:id", (req, res) => {
  const user = users[req.session["user_id"]];
  const id = req.params.id;

  if (user && user.id === urlDatabase[id].userID) {
    const templateVars = {
      user: user,
      id,
      longURL: urlDatabase[id].longURL
    };
    res.render("urls_show", templateVars);
  } else if (!user) {
    res.send("<h3>You're not logged in!</h3>");
  } else if (!urlDatabase[id]) {
    res.send("<h3>This URL does not exist!</h3>");
  } else {
    res.send("<h3>You cannot access another user's URL!</h3>");
  }
});

// Retrieve the longURL associated with the shortURL entered and redirects to the longURL site
app.get("/u/:id", (req, res) => {
  const id = req.params.id;

  // Catch instances where the URL in the database does not lead to a valid website
  if (!urlDatabase[id]) {
    res.send("<h3>This is not a valid URL</h3>");
    return;
  }
  const longURL = urlDatabase[id].longURL;

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("<h3>Shortened URL does not exist</h3>");
  }
});

// Register new user - evoke sniffer() to catch existing emails
app.post("/register", (req,res) => {
  let id = generateRandomString();
  let email = req.body.email;
  let hashedPassword = bcrypt.hashSync(req.body.password, 10);

  let user = {
    id: id,
    email: email,
    password: hashedPassword
  };

  if (sniffer(user) === true) {
    res.status(400).send("<h3>Email already used</h3>");
  } else {

    users[id] = user;
    req.session.user_id = user.id;
    res.redirect(`/urls`);
  }
});

// Post command - Create new entry with generated short URL ID - redirects to /urls
app.post("/urls", (req, res) => {
  const user = users[req.session["user_id"]];
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  if (!user) {
    res.send("<h3>You need to be logged in to create tiny URLs</h3>");
  } else {
    res.redirect(`/urls/${shortURL}`,);
  }
  
  urlDatabase[shortURL] = { longURL: longURL, userID: user.id };
});

// Delete command - redirect back to /urls
app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.session["user_id"]];
  const id = req.params.id;
  if (!user) {
    res.send("<h3>You're not logged in!</h3>");
  } else if (!urlDatabase[id]) {
    res.send("<h3>This URL does not exist!</h3>");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  }
});

// Update command - swap longURL for the input and redirect to /urls
app.post("/urls/:id/update", (req, res) => {
  const user = users[req.session["user_id"]];

  if (!user) {
    res.send("<h3>You're not logged in!</h3>");
    return;
  }

  const id = req.params.id;
  const newLongURL = req.body.longURL;
  
  if (!urlDatabase[id]) {
    res.send("<h3>This URL does not exist!</h3>");
  } else {
    urlDatabase[id].longURL = newLongURL;
    res.redirect(`/urls`);
  }
});

// Login command - evoke doorman to check credentiuals and capture username in a cookie if user exists
app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const foundUser = doorman(user);
  if (!foundUser) {
    res.status(403).send("<h3>Incorrect Details</h3>");
  } else {
    req.session.user_id = foundUser.id;
    res.redirect("/urls");
  // } else {
  //   res.send("<h3>Incorrect password.</h3>");
  }
});

// Logout command - clear the username cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.clearCookie("session");

  res.redirect(`/login`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

