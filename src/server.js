const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const profileRouter = require("./router/profile");
const loginRouter = require("./router/login");
const adminRouter = require("./router/admin");
const registrationRouter = require("./router/registration");
const studentRouter = require("./router/student");

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(function (req, res, next) {
  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});
app.use(bodyParser.json());
app.use(cors());
app.use(
  cors({
    exposedHeaders: ["Content-Length", "authToken"],
  })
);

app.use(adminRouter);
app.use(profileRouter);
app.use(loginRouter);
app.use(registrationRouter);
app.use(studentRouter);


module.exports = app;
