const express = require("express");
const router = new express.Router();
const connection = require("../db/connection");
const jwt = require("jsonwebtoken");
const {
  sendOtpOnEmailForForgetPassword,
  decrypt,
} = require("../emails/account");

router.post("/login", async (req, res) => {
  try {
    var email = req.body.email;
    var password = decrypt(req.body.password);
    await connection.query(
      "SELECT user_id FROM credentials WHERE email = ?",
      [email],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length) {
            await connection.query(
              "SELECT user_id FROM credentials WHERE email = ? and pass_word = ?",
              [email, password],
              async (err, results, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  if (results.length) {
                    await connection.query(
                      "SELECT user_id,user_type FROM credentials WHERE email = ? and pass_word = ? and is_verified = ?",
                      [email, password, 1],
                      async (err, results, fields) => {
                        if (err) {
                          res.status(500).send({
                            status: false,
                            message: err.sqlMessage,
                          });
                        } else {
                          if (results.length) {
                            let user_id = results[0].user_id;
                            const authToken = await jwt.sign(
                              { user_id: user_id },
                              process.env.SECRET_JWT_KEY,
                              { expiresIn: "3d" }
                            );
                            res.status(200).set({ authToken: authToken }).send({
                              status: true,
                              message: "login sucessfull",
                              user_type: results[0].user_type,
                              authToken: authToken,
                            });
                          } else {
                            res.status(401).send({
                              status: false,
                              message: "User not verified",
                            });
                          }
                        }
                      }
                    );
                  } else {
                    res.status(401).send({
                      status: false,
                      message: "Incorrect Password",
                    });
                  }
                }
              }
            );
          } else {
            res.status(404).send({
              status: false,
              message: "User not Registered",
            });
          }
        }
      }
    );
  } catch (error) {
    res.status(400).send({
      status: false,
      message: error.message,
    });
  }
});

router.post("/sendOTP", async (req, res) => {
  try {
    await connection.query(
      "SELECT otp FROM credentials WHERE email=? ",
      req.body.email,
      (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length === 0) {
            res.status(404).send({
              status: false,
              message: "Invalid email address",
            });
          } else {
            const otp = Math.floor(100000 + Math.random() * 900000);
            connection.query(
              "update credentials set ? where email = ?",
              [{ otp: otp, last_updated_on: new Date() }, req.body.email],
              async (err, results, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  sendOtpOnEmailForForgetPassword(req.body.email, otp, res);
                }
              }
            );
          }
        }
      }
    );
  } catch (error) {
    res.status(400).send({
      status: false,
      message: error.message,
    });
  }
});

router.post("/updatePassword", async (req, res) => {
  try {
    await connection.query(
      "update credentials set ? where email = ?",
      [
        { pass_word: decrypt(req.body.password), last_updated_on: new Date() },
        req.body.email,
      ],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Password update successfully",
          });
        }
      }
    );
  } catch (error) {
    res.status(400).send({
      status: false,
      message: error.message,
    });
  }
});

module.exports = router;
