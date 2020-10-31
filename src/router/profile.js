const express = require("express");
const router = new express.Router();
const connection = require("../db/connection");
const {
  sendWelcomeEmail,
  sendSessionNotification,
  sendlectureVideoNotification,
} = require("../emails/account");
const auth = require("../auth/authentication");
const fs = require("fs");
const base64ToImage = require("base64-to-image");

const admin = require("firebase-admin");
const uuid = require("uuid-v4");
const config = require("../serviceAccountInfo/serviceAccount.js").config;
const serviceAccountJsonConfig = JSON.parse(JSON.stringify(config));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJsonConfig),
  storageBucket: process.env.STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();
const imageToBase64 = require("image-to-base64");

router.get("/getProfile", auth, async (req, res) => {
  try {
    await connection.query(
      "select user_type,email from credentials where user_id =?",
      [req.user_id],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length) {
            let emailAndUserType = { ...results[0] };
            if (results[0].user_type === "Admin") {
              await connection.query(
                "select * from user_profile where user_id =?",
                [req.user_id],
                async (err, results, fields) => {
                  if (err) {
                    res
                      .status(500)
                      .send({ status: false, message: err.sqlMessage });
                  } else {
                    if (results[0].admin_profile_picture !== null) {
                      await imageToBase64(results[0].admin_profile_picture)
                        .then((response) => {
                          results[0].admin_profile_picture = response;
                        })
                        .catch((error) => {
                          res.status(400).send({
                            status: false,
                            message: error.message,
                          });
                        });
                    }

                    if (results[0].school_cover_image !== null) {
                      await imageToBase64(results[0].school_cover_image)
                        .then((response) => {
                          results[0].school_cover_image = response;
                        })
                        .catch((error) => {
                          res.status(400).send({
                            status: false,
                            message: error.message,
                          });
                        });
                    }
                    res.status(200).send({
                      status: true,
                      profile: { ...results[0], ...emailAndUserType },
                    });
                  }
                }
              );
            } else if (results[0].user_type === "Student") {
              await connection.query(
                "select *,(SELECT class_name from class where class_id=student_profile.class_id) as class_name from student_profile where student_id =?",
                [req.user_id],
                async (err, results, fields) => {
                  if (err) {
                    res.status(500).send({
                      status: false,
                      message: err.sqlMessage,
                    });
                  } else {
                    await connection.query(
                      "SELECT user_id,school_name,admin_name,school_contact_no,admin_contact_no,address,school_cover_image from user_profile WHERE user_id=(SELECT user_id from student_with_school WHERE student_id =?)",
                      [req.user_id],
                      async (err, result, fields) => {
                        if (err) {
                          res.status(500).send({
                            status: false,
                            message: err.sqlMessage,
                          });
                        } else {
                          if (results[0].student_profile_picture !== null) {
                            await imageToBase64(
                              results[0].student_profile_picture
                            )
                              .then((response) => {
                                results[0].student_profile_picture = response;
                              })
                              .catch((error) => {
                                res.status(400).send({
                                  status: false,
                                  message: error.message,
                                });
                              });
                          }
                          if (result[0].school_cover_image !== null) {
                            await imageToBase64(result[0].school_cover_image)
                              .then((response) => {
                                result[0].school_cover_image = response;
                              })
                              .catch((error) => {
                                res.status(400).send({
                                  status: false,
                                  message: error.message,
                                });
                              });
                          }
                          res.status(200).send({
                            status: true,
                            profile: {
                              ...results[0],
                              ...result[0],
                              ...emailAndUserType,
                            },
                          });
                        }
                      }
                    );
                  }
                }
              );
            } else {
              res.status(404).send({
                status: false,
                message: "User not found",
              });
            }
          } else {
            res.status(404).send({
              status: false,
              message: "User not found",
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

router.post("/studentRegistration", auth, async (req, res) => {
  try {
    var password = Math.floor(100000 + Math.random() * 900000);
    let credentialData = {
      email: req.body.email,
      pass_word: password,
      is_verified: 1,
      is_approved: 1,
      user_type: "Student",
      otp: 000,
    };
    await connection.query(
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
          var studentDetails = {
            student_id: insertedId,
            email: req.body.email,
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            father_name: req.body.fatherName,
            class_id: req.body.class,
            scholar_number: req.body.scholarNumber,
            dob: req.body.dob,
            student_address:
              req.body.addressLineOne +
              ", " +
              req.body.addressLineTwo +
              ", " +
              req.body.city +
              ", " +
              req.body.state +
              "-" +
              req.body.postalCode,
            state: req.body.state,
            city: req.body.city,
            pin_code: req.body.postalCode,
            gender: req.body.gender,
            mobile_number: req.body.mobile,
            registered_on: new Date(),
          };
          connection.query(
            "insert into student_profile set ?",
            studentDetails,
            async (err, results, fields) => {
              if (err) {
                res
                  .status(500)
                  .send({ status: false, message: err.sqlMessage });
              } else {
                let studentSchoolConnection = {
                  user_id: req.user_id,
                  student_id: insertedId,
                  assinged_on: new Date(),
                };
                connection.query(
                  "insert into student_with_school set ?",
                  studentSchoolConnection,
                  async (err, results, fields) => {
                    if (err) {
                      studentRegistrationError = err.sqlMessage;
                      connection.query(
                        "DELETE FROM student_profile WHERE student_id = ?",
                        insertedId,
                        (err) => {
                          if (err) {
                            res.status(500).send({
                              status: false,
                              message: err.sqlMessage,
                            });
                          } else {
                            connection.query(
                              "DELETE FROM credentials WHERE  user_id = ?",
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
                                    message: studentRegistrationError,
                                  });
                                }
                              }
                            );
                          }
                        }
                      );
                    } else {
                      var full_name =
                        req.body.firstName + " " + req.body.lastName;
                      sendWelcomeEmail(
                        full_name,
                        req.body.email,
                        password,
                        res
                      );
                    }
                  }
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
      message: error.message,
    });
  }
});

router.post("/teacherRegistration", auth, async (req, res) => {
  try {
    var password = Math.floor(100000 + Math.random() * 900000);
    let credentialData = {
      email: req.body.email,
      pass_word: password,
      is_verified: 1,
      is_approved: 1,
      user_type: "Teacher",
      otp: 000,
    };
    await connection.query(
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
          var teacherDetails = {
            teacher_id: insertedId,
            email: req.body.email,
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            relatior_name: req.body.relatorName,
            dob: req.body.dob,
            teacher_address:
              req.body.addressLineOne + ", " + req.body.addressLineTwo,
            state: req.body.state,
            city: req.body.city,
            pin_code: req.body.postalCode,
            gender: req.body.gender,
            mobile_number: req.body.mobile,
            registered_on: new Date(),
          };
          connection.query(
            "insert into teacher_profile set ?",
            teacherDetails,
            async (err, results, fields) => {
              if (err) {
                res
                  .status(500)
                  .send({ status: false, message: err.sqlMessage });
              } else {
                let teacherSchoolConnection = {
                  user_id: req.user_id,
                  teacher_id: insertedId,
                  assinged_on: new Date(),
                };
                connection.query(
                  "insert into teacher_with_school set ?",
                  teacherSchoolConnection,
                  async (err, results, fields) => {
                    if (err) {
                      teacherRegistrationError = err.sqlMessage;
                      connection.query(
                        "DELETE FROM teacher_profile WHERE teacher_id = ?",
                        insertedId,
                        (err) => {
                          if (err) {
                            res.status(500).send({
                              status: false,
                              message: err.sqlMessage,
                            });
                          } else {
                            connection.query(
                              "DELETE FROM credentials WHERE  user_id = ?",
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
                                    message: teacherRegistrationError,
                                  });
                                }
                              }
                            );
                          }
                        }
                      );
                    } else {
                      var full_name =
                        req.body.firstName + " " + req.body.lastName;
                      sendWelcomeEmail(
                        full_name,
                        req.body.email,
                        password,
                        res
                      );
                    }
                  }
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
      message: error.message,
    });
  }
});

router.post("/updateClassofStudent", auth, async (req, res) => {
  try {
    await connection.query(
      "update student_profile set ? where student_id = ?",
      [
        { class_id: req.body.classId, last_updated_on: new Date() },
        req.body.studentId,
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
            message: "Class update successfully",
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

//Delete Student
router.delete("/removeStudent/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    connection.query(
      "DELETE FROM student_with_school WHERE student_id = ?",
      _id,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          connection.query(
            "DELETE FROM student_profile WHERE student_id = ?",
            _id,
            async (err, results, fields) => {
              if (err) {
                res.status(500).send({
                  status: false,
                  message: err.sqlMessage,
                });
              } else {
                connection.query(
                  "DELETE FROM credentials WHERE user_id = ?",
                  _id,
                  async (err, results, fields) => {
                    if (err) {
                      res.status(500).send({
                        status: false,
                        message: err.sqlMessage,
                      });
                    } else {
                      res.status(200).send({
                        status: true,
                        message: "Student deleted",
                      });
                    }
                  }
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
      message: error.message,
    });
  }
});

//Remove Teacher from school
router.delete("/removeTeacher/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    connection.query(
      "DELETE FROM teacher_with_school WHERE teacher_id = ?",
      _id,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          connection.query(
            "DELETE FROM teacher_with_class_subject WHERE teacher_id = ?",
            _id,
            async (err, results, fields) => {
              if (err) {
                res.status(500).send({
                  status: false,
                  message: err.sqlMessage,
                });
              } else {
                connection.query(
                  "DELETE FROM teacher_profile WHERE teacher_id = ?",
                  _id,
                  async (err, results, fields) => {
                    if (err) {
                      res.status(500).send({
                        status: false,
                        message: err.sqlMessage,
                      });
                    } else {
                      connection.query(
                        "DELETE FROM credentials WHERE user_id = ?",
                        _id,
                        async (err, results, fields) => {
                          if (err) {
                            res.status(500).send({
                              status: false,
                              message: err.sqlMessage,
                            });
                          } else {
                            res.status(200).send({
                              status: true,
                              message: "Teacher Removed",
                            });
                          }
                        }
                      );
                    }
                  }
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
      message: error.message,
    });
  }
});

router.get("/studentFromSchool", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT * FROM student_profile WHERE student_id in (SELECT student_id From student_with_school WHERE user_id = ?)",
      req.user_id,
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
              message: "Students not found",
            });
          } else res.status(200).send(results);
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

router.get("/teacherFromSchool", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT * FROM teacher_profile WHERE teacher_id in (SELECT teacher_id From teacher_with_school WHERE user_id = ?)",
      req.user_id,
      (err, teacherResult, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (teacherResult.length === 0) {
            res.status(404).send({
              status: false,
              message: "Teachers not found",
            });
          } else {
            connection.query(
              "SELECT class.class_name, subjects.subject_name, teacher_with_class_subject.* From class, subjects, teacher_with_class_subject WHERE class.class_id = teacher_with_class_subject.class_id AND subjects.subject_id = teacher_with_class_subject.subject_id AND user_id = ?",
              req.user_id,
              (err, results, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  if (results.length === 0) {
                    teacherData = {
                      teacher_list: teacherResult,
                    };
                    res.status(200).send(teacherData);
                  } else {
                    teacherData = {
                      teacher_list: teacherResult,
                      assinged_class_subject: results,
                    };
                    res.status(200).send(teacherData);
                  }
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

router.post("/updateSchoolDetails", auth, async (req, res) => {
  var data = {
    school_name: req.body.schoolName,
    admin_name: req.body.adminName,
    aadhar_number: req.body.adminAdhar,
    school_registration_no: req.body.schoolRegistrationNo,
    admin_contact_no: req.body.adminContactNo,
    school_contact_no: req.body.schoolContactNo,
    last_updated_on: new Date(),
    address: req.body.address,
  };
  try {
    await connection.query(
      "update user_profile set ? where user_id = ?",
      [data, req.user_id],
      (err, results) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Update Successfully",
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

router.get("/startSession", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT email,first_name FROM student_profile WHERE student_id in (SELECT student_id From student_with_school WHERE user_id = ?)",
      [req.user_id],
      (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          var length = results.length;
          for (var i = 0; i < length; i++) {
            sendSessionNotification(
              results[i].first_name,
              results[i].email,
              res
            );
          }
          res.status(200).send({
            status: true,
            message: "message sent sucessfully",
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

const DIR = "src/assets/";
// API for admin and school image
router.post("/saveImage", auth, async (req, res) => {
  let dir = DIR + "images";
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    let path = dir + "/";
    let imageObj = {
      fileName: req.body.imageType + "_" + req.user_id,
      type: "png",
    };
    let imageInfo = base64ToImage(req.body.image, path, imageObj);
    let imagePath = path + imageInfo.fileName;
    await bucket.upload(imagePath, {
      gzip: true,
      metadata: {
        metadata: {
          // This line is very important. It's to create a download token.
          firebaseStorageDownloadTokens: uuid(),
        },
        contentType: "image/png",
        cacheControl: "public, max-age=31536000",
      },
    });
    let imageUrl;
    await bucket
      .file(imageInfo.fileName)
      .getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      })
      .then((signedUrls) => {
        // this will contain the picture's url
        imageUrl = signedUrls[0];
      });

    if (req.body.imageType === "admin") {
      await connection.query(
        "update user_profile set ? where user_id = ?",
        [
          { admin_profile_picture: imageUrl, last_updated_on: new Date() },
          req.user_id,
        ],
        (err, result, fields) => {
          if (err) {
            res.status(500).send({
              status: false,
              message: err.sqlMessage,
            });
          } else {
            res.status(200).send({
              status: true,
              path: imagePath,
              message: "Admin image successfully updated",
            });
          }
        }
      );
    } else if (req.body.imageType === "student") {
      await connection.query(
        "update student_profile set ? where student_id = ?",
        [
          { student_profile_picture: imageUrl, last_updated_on: new Date() },
          req.user_id,
        ],
        (err, result, fields) => {
          if (err) {
            res.status(500).send({
              status: false,
              message: err.sqlMessage,
            });
          } else {
            res.status(200).send({
              status: true,
              path: imagePath,
              message: "Student image successfully updated",
            });
          }
        }
      );
    } else {
      await connection.query(
        "update user_profile set ? where user_id = ?",
        [
          { school_cover_image: imageUrl, last_updated_on: new Date() },
          req.user_id,
        ],
        (err, result, fields) => {
          if (err) {
            res.status(500).send({
              status: false,
              message: err.sqlMessage,
            });
          } else {
            res.status(200).send({
              status: true,
              path: imagePath,
              message: "School image successfully updated",
            });
          }
        }
      );
    }
  } catch (error) {
    res.status(400).send({
      status: false,
      message: error.message,
    });
  }
});

router.post("/saveVideo", auth, async (req, res) => {
  let dir = DIR + "images";
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    let path = dir + "/";
    let videoObj = {
      fileName:
        "video" +
        "_" +
        req.user_id +
        "_" +
        req.body.classId +
        "_" +
        req.body.topicId +
        "_" +
        uuid(),
      type: "mp4",
    };
    req.body.media = req.body.media.replace(/^data:(.*?);base64,/, ""); // <--- make it any type
    req.body.media = req.body.media.replace(/ /g, "+"); // <--- this is important
    fs.writeFile(
      `${path}${videoObj.fileName}` + "." + `${videoObj.type}`,
      req.body.media,
      "base64",
      function (err) {
        if (err) {
          res.status(400).send({
            status: false,
            message: err.message,
          });
        }
      }
    );
    let imagePath = path + videoObj.fileName + ".mp4";

    await bucket.upload(imagePath, {
      gzip: true,
      metadata: {
        metadata: {
          // This line is very important. It's to create a download token.
          firebaseStorageDownloadTokens: uuid(),
        },
        contentType: "video/mp4",
        cacheControl: "public, max-age=31536000",
      },
    });
    let videoUrl;
    await bucket
      .file(videoObj.fileName + ".mp4")
      .getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      })
      .then((signedUrls) => {
        // this will contain the picture's url
        videoUrl = signedUrls[0];
      });
    let videoDetails = {
      school_id: req.user_id,
      class_id: req.body.classId,
      topic_id: req.body.topicId,
      video_url: videoUrl,
      assigned_on: new Date(),
    };

    await connection.query(
      "insert into videos set ?",
      videoDetails,
      (err, result, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          connection.query(
            "SELECT email,first_name,last_name FROM student_profile WHERE student_id in (SELECT student_id From student_with_school WHERE user_id = ?) AND class_id=?",
            [req.user_id, req.body.classId],
            (err, results, fields) => {
              if (err) {
                res.status(500).send({
                  status: false,
                  message: err.sqlMessage,
                });
              } else {
                let length = results.length;
                for (let i = 0; i < length; i++) {
                  sendlectureVideoNotification(
                    results[i].first_name + " " + results[i].last_name,
                    results[i].email,
                    res
                  );
                }
                res.status(200).send({
                  status: true,
                  message: "Video successfully uploaded",
                });
              }
            }
          );
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

router.get("/getVideos", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT video_id,class_id,topic_id,video_url FROM videos WHERE school_id=?",
      req.user_id,
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
              message: "Videos not found",
            });
          } else res.status(200).send(results);
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

router.delete("/removeVideo/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    await connection.query(
      "SELECT video_url FROM videos WHERE video_id = ?",
      _id,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          const url = results[0].video_url;
          const fileName = url.split("/").pop().split("?")[0]; //split filename from URL
          const fileRef = bucket.file(fileName);
          // Delete the file
          fileRef
            .delete()
            .then(() => {
              connection.query(
                "DELETE FROM videos WHERE video_id = ?",
                _id,
                async (err, results, fields) => {
                  if (err) {
                    res.status(500).send({
                      status: false,
                      message: err.sqlMessage,
                    });
                  } else {
                    res.status(200).send({
                      status: true,
                      message: "Video deleted",
                    });
                  }
                }
              );
            })
            .catch(function (error) {
              res.status(400).send({
                status: false,
                message: error.message,
              });
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
