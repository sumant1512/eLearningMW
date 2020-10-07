const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const authToken = req.header("Authorization").replace("Bearer ", "");
    if (authToken) {
      jwt.verify(authToken, process.env.SECRET_JWT_KEY, (err, decode) => {
        if (err) {
          res.status(403).send({
            status: false,
            message: "Wrong authToken",
          });
        } else {
          req.user_id = decode.user_id;
          next();
        }
      });
    } else {
      res.status(401).send({
        status: false,
        message: "authToken not found",
      });
    }
  } catch (e) {
    res.status(401).send({
      status: false,
      message: "Please Authenticate",
    });
  }
};
module.exports = auth;
