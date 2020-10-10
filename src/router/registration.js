const express = require("express");
const router = new express.Router();
const connection = require("../db/connection");
const {
  sendOtpOnEmailForVerifyAccount,
  decrypt,
} = require("../emails/account");

router.post("/schoolRegistration", (req, res) => {
  if (req) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    let credentialData = {
      email: req.body.email,
      pass_word: decrypt(req.body.password),
      user_type: "Admin",
      otp,
    };
    try {
      connection.query(
        "insert into credentials set ?",
        credentialData,
        (err, result) => {
          if (err) {
            res.status(500).send({
              status: false,
              message: err.sqlMessage,
            });
          } else {
            let insertedId = result.insertId;
            const profileData = {
              user_id: insertedId,
              school_name: req.body.schoolName,
              admin_name: req.body.adminName,
              aadhar_number: req.body.adminAdhar,
              school_registration_no: req.body.schoolRegistrationNo,
              school_type: req.body.schoolType,
              admin_contact_no: req.body.adminContactNo,
              school_contact_no: req.body.schoolContactNo,
              created_on: new Date(),
            };
            connection.query(
              "insert into user_profile set ?",
              profileData,
              (err) => {
                if (err) {
                  const profileError = err;
                  connection.query(
                    "DELETE FROM credentials WHERE user_id = ?",
                    insertedId,
                    (err) => {
                      if (err) {
                        res.status(500).send({
                          status: false,
                          message: err.sqlMessage,
                        });
                      } else {
                        res.status(500).send({
                          status: false,
                          message: profileError.sqlMessage,
                        });
                      }
                    }
                  );
                } else {
                  sendOtpOnEmailForVerifyAccount(
                    req.body.schoolName,
                    req.body.email,
                    credentialData.otp,
                    res
                  );
                }
              }
            );
          }
        }
      );
    } catch (error) {
      res.status(400).send({
        status: false,
        message: error,
      });
    }
  } else {
    res.status(404).send({
      status: false,
      message: "Form data not found",
    });
  }
});

router.post("/verifyOTP", async (req, res) => {
  try {
    var otp = req.body.otp;
    var email = req.body.email;
    await connection.query(
      "SELECT otp FROM credentials WHERE email = ? and otp =?",
      [email, otp],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length) {
            await connection.query(
              "UPDATE credentials SET is_verified = ? WHERE email = ?",
              [1, email],
              async (err, results, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  res.status(200).send({
                    status: true,
                    message: "Verification successfull",
                  });
                }
              }
            );
          } else {
            res.status(403).send({
              status: false,
              message: "Invalid OTP",
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

module.exports = router;
