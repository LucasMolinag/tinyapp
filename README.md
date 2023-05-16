# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["Sceenshot of main website page"](https://github.com/LucasMolinag/tinyapp/blob/main/images/urls-page.PNG?raw=true)
!["Screenshot of URL edit page"](https://github.com/LucasMolinag/tinyapp/assets/126036022/7126a7a6-e50e-4c79-a414-6b5cba1d89f2)
!["Screenshot of login page"](https://github.com/LucasMolinag/tinyapp/blob/main/images/login-page.PNG?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcryptjs
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node start` command.

**routes created in the project**

GET ROUTES:
- GET/urls: Render the urls_index view
- GET/register: Render account creation page
- GET/login: Render login page
- GET/urls/new: Render URL creation page - Create A randomly generated code to be used as the shortened URL on submission
- GET/u/:id: Retrieve the longURL associated with the shortURL entered and redirects to the longURL site

POST ROUTES
- POST/register: Register new user - evoke doubleCatcher() to catch existing emails
- POST/urls: Create new entry with generated short URL ID - redirect to /urls
- POST/urls/:id/delete: Delete related enty from the database - redirect back to /urls
- POST/urls/:id/update: Swap longURL for the input - redirect back to /urls
- POST/login: Evoke doorman() to check credentials and capture username in a cookie if user exists
- POST/logout: Clear the user ID and session cookies
