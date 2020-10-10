const express = require("express");
const router = new express.Router();
const connection = require("../db/connection");
const auth = require("../auth/authentication");

//               Class Related Api          //

//Add new class
router.post("/addClass", auth, async (req, res) => {
  try {
    var classDetails = {
      class_name: req.body.className,
      created_on: new Date(),
      last_updated_on: new Date(),
    };
    await connection.query(
      "INSERT INTO class SET ?",
      classDetails,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          let insertedId = results.insertId;
          let schoolClassConnection = {
            user_id: req.user_id,
            class_id: insertedId,
            assinged_on: new Date(),
          };
          connection.query(
            "INSERT INTO class_with_school set ?",
            schoolClassConnection,
            async (err, results, fields) => {
              if (err) {
                studentRegistrationError = err.sqlMessage;
                connection.query(
                  "DELETE FROM class WHERE class_id = ?",
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
              } else {
                res.status(200).send({
                  status: true,
                  message: "Class added",
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

//Fectch all classes of that school
router.get("/getClasses", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT * FROM class WHERE class_id in (SELECT class_id from class_with_school where user_id=?)",
      req.user_id,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length === 0) {
            res.status(404).send({
              status: false,
              message: "Classes not found",
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

//update the name of the class
router.post("/editClassName", auth, async (req, res) => {
  try {
    await connection.query(
      "update class set ? where class_id = ?",
      [{ class_name: req.body.className }, req.body.classId],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Class name update successfully",
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

router.delete("/removeClass/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    connection.query(
      "SELECT subject_id from subject_with_class_and_school WHERE class_id=?",
      _id,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length === 0) {
            connection.query(
              "DELETE FROM class_with_school WHERE class_id = ?",
              _id,
              async (err, results, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  connection.query(
                    "DELETE FROM class WHERE class_id = ?",
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
                          message: "Class deleted",
                        });
                      }
                    }
                  );
                }
              }
            );
          } else {
            res.status(400).send({
              status: false,
              message: "Class already assigned to any subject",
            });
          }
        }
      }
    );
  } catch (error) {
    res.statuserr(400).send({
      status: false,
      message: error.message,
    });
  }
});

//               Subject Related  Api          //

//Add new subject
router.post("/addSubject", auth, async (req, res) => {
  try {
    var subjectDetails = {
      subject_name: req.body.subjectName,
      created_on: new Date(),
      last_updated_on: new Date(),
    };
    await connection.query(
      "INSERT INTO subjects SET ?",
      subjectDetails,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          let insertedId = results.insertId;
          let classSubjectConnection = {
            user_id: req.user_id,
            subject_id: insertedId,
            assinged_on: new Date(),
          };
          connection.query(
            "INSERT INTO subject_with_school set ?",
            classSubjectConnection,
            async (err, results, fields) => {
              if (err) {
                studentRegistrationError = err.sqlMessage;
                connection.query(
                  "DELETE FROM subjects WHERE subject_id = ?",
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
                        message: subjectAddError,
                      });
                    }
                  }
                );
              } else {
                res.status(200).send({
                  status: true,
                  message: "Subject added",
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

//update the name of the subject
router.post("/editSubjectName", auth, async (req, res) => {
  try {
    await connection.query(
      "update subjects set ? where subject_id = ?",
      [{ subject_name: req.body.subjectName }, req.body.subjectId],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Subject name update successfully",
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

//Fetch all subjects of that school
router.get("/getSubjects", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT * FROM subjects WHERE subject_id in (select subject_id from subject_with_school where user_id=?)",
      [req.user_id],
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
              message: "Subjects not found",
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

//Assign already added subject to the class
router.post("/assignSubjectToClass", auth, async (req, res) => {
  try {
    let subjectDetails = [];
    Array.from(req.body.classId.split(","), Number).forEach((id) => {
      subjectDetails.push([req.user_id, id, req.body.subjectId, new Date()]);
    });
    connection.query(
      "INSERT INTO subject_with_class_and_school VALUES ?",
      [subjectDetails],
      (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Classes Assigned",
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

//Fetch all remaining classes,which not assigned that particular subject
router.post("/getClassesOfUnassignedSubjects", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT class_name,class_id FROM class WHERE class_id in (SELECT class_id from class_with_school WHERE class_id not in (SELECT class_id from subject_with_class_and_school WHERE subject_id=?) AND user_id=?)",
      [req.body.subjectId, req.user_id],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length === 0) {
            res.status(404).send({
              status: false,
              message: "Classes not found",
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

router.post("/unassignSubjectToClass", auth, async (req, res) => {
  try {
    connection.query(
      "SELECT topic_id from topic_with_subject_class_and_school WHERE class_id=? AND subject_id=?",
      [req.body.classId, req.body.subjectId],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length === 0) {
            connection.query(
              "SELECT sample_paper_id from sample_paper_with_subject_class_and_school WHERE class_id=? AND subject_id=?",
              [req.body.classId, req.body.subjectId],
              async (err, results, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  if (results.length === 0) {
                    connection.query(
                      "DELETE FROM subject_with_class_and_school WHERE class_id=? AND subject_id=?",
                      [req.body.classId, req.body.subjectId],
                      (err, results, fields) => {
                        if (err) {
                          res.status(500).send({
                            status: false,
                            message: err.sqlMessage,
                          });
                        } else {
                          res.status(200).send({
                            status: true,
                            message: "Subject unassigned successfully",
                          });
                        }
                      }
                    );
                  } else {
                    res.status(400).send({
                      status: false,
                      message: "Please remove sample paper",
                    });
                  }
                }
              }
            );
          } else {
            res.status(400).send({
              status: false,
              message: "Please remove topic",
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

router.delete("/removeSubject/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    connection.query(
      "select class_id from subject_with_class_and_school where subject_id=?",
      _id,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length === 0) {
            connection.query(
              "DELETE FROM subject_with_school WHERE subject_id = ?",
              _id,
              async (err, results, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  connection.query(
                    "DELETE FROM subjects WHERE subject_id = ?",
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
                          message: "Subject deleted",
                        });
                      }
                    }
                  );
                }
              }
            );
          } else {
            res.status(400).send({
              status: false,
              message:
                "First unassign the class from subject and also delete topic(if present)",
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

//               Topic Related  Api          //

//Add new topic
router.post("/addTopic", auth, async (req, res) => {
  try {
    var topicDetails = {
      topic_name: req.body.topicName,
      created_on: new Date(),
      last_updated_on: new Date(),
    };
    await connection.query(
      "INSERT INTO topic SET ?",
      topicDetails,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          let insertedId = results.insertId;
          let classSubjectTopicConnection = {
            user_id: req.user_id,
            class_id: req.body.classId,
            subject_id: req.body.subjectId,
            topic_id: insertedId,
            assinged_on: new Date(),
          };
          connection.query(
            "INSERT INTO topic_with_subject_class_and_school set ?",
            classSubjectTopicConnection,
            async (err, results, fields) => {
              if (err) {
                topicAddError = err.sqlMessage;
                connection.query(
                  "DELETE FROM topic WHERE topic_id = ?",
                  insertedId,
                  (err) => {
                    if (err) {
                      res.status(500).send({
                        status: false,
                        message: err.sqlMessage,
                      });
                    } else {
                      res.status(200).send({
                        status: false,
                        message: topicAddError,
                      });
                    }
                  }
                );
              } else {
                res.status(200).send({
                  status: true,
                  message: "Topic added",
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

//Fecth all topics of that User(School)
router.get("/getTopics", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT * FROM topic WHERE topic_id in (select topic_id from topic_with_subject_class_and_school where user_id=?)",
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
              message: "Topics not found",
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

//update the name of the topic
router.post("/editTopicName", auth, async (req, res) => {
  try {
    await connection.query(
      "update topic set ? where topic_id = ?",
      [{ topic_name: req.body.topicName }, req.body.topicId],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Topic name update successfully",
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

//Delete topic
router.delete("/removeTopic/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    connection.query(
      "SELECT * FROM notes_with_topic_subject_class_and_school WHERE topic_id=? UNION ALL SELECT * FROM videos WHERE topic_id=?",
      [_id, _id],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (results.length === 0) {
            connection.query(
              "DELETE FROM topic_with_subject_class_and_school WHERE topic_id = ?",
              _id,
              async (err, results, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  connection.query(
                    "DELETE FROM topic WHERE topic_id = ?",
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
                          message: "Topic deleted",
                        });
                      }
                    }
                  );
                }
              }
            );
          } else {
            res.status(400).send({
              status: false,
              message: "First remove notes and videos",
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

// Sample Paper related routes //

router.post("/addSamplePaper", auth, async (req, res) => {
  try {
    var samplePaperDetails = {
      sample_paper_name: req.body.samplePaperName,
      sample_paper_url: req.body.samplePaperUrl,
      created_on: new Date(),
      last_updated_on: new Date(),
    };
    await connection.query(
      "INSERT INTO sample_paper SET ?",
      samplePaperDetails,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          let insertedId = results.insertId;
          let classSubjectPaperConnection = {
            user_id: req.user_id,
            class_id: req.body.classId,
            subject_id: req.body.subjectId,
            sample_paper_id: insertedId,
            assinged_on: new Date(),
          };
          connection.query(
            "INSERT INTO sample_paper_with_subject_class_and_school set ?",
            classSubjectPaperConnection,
            async (err, results, fields) => {
              if (err) {
                AddError = err.sqlMessage;
                connection.query(
                  "DELETE FROM sample_paper WHERE sample_paper_id = ?",
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
                        message: AddError,
                      });
                    }
                  }
                );
              } else {
                res.status(200).send({
                  status: true,
                  message: "Sample Paper added",
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

router.get("/getSamplePapers", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT sample_paper_with_subject_class_and_school.sample_paper_id ,sample_paper_name,sample_paper_url ,created_on  FROM sample_paper_with_subject_class_and_school,sample_paper WHERE user_id=? and sample_paper_with_subject_class_and_school.sample_paper_id=sample_paper.sample_paper_id",
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
              message: "Sample paper not found",
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

//Delete Sample paper
router.delete("/removeSamplePaper/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    connection.query(
      "DELETE FROM sample_paper_with_subject_class_and_school WHERE sample_paper_id = ?",
      _id,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          connection.query(
            "DELETE FROM sample_paper WHERE sample_paper_id = ?",
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
                  message: "Sample Paper deleted",
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

//update the name of the sample paper
router.post("/editSamplePaperName", auth, async (req, res) => {
  try {
    await connection.query(
      "update sample_paper set ? where sample_paper_id = ?",
      [{ sample_paper_name: req.body.samplePaperName }, req.body.samplePaperId],
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          res.status(200).send({
            status: true,
            message: "Sample paper name update successfully",
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

//Transformed data for Syllabus
router.get("/getTransformedSyllabus", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT * FROM class WHERE class_id in (SELECT class_id from class_with_school where user_id=?)",
      req.user_id,
      (err, classresult, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (classresult.length === 0) {
            res.status(404).send({
              status: false,
              message: "Classes not found",
            });
          } else {
            connection.query(
              "SELECT class_id, subject_with_class_and_school.subject_id, subject_name, assinged_on  FROM subject_with_class_and_school,subjects WHERE user_id=? and subject_with_class_and_school.subject_id=subjects.subject_id",
              req.user_id,
              (err, classwithsubjectresult, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  if (classwithsubjectresult.length === 0) {
                    res.status(404).send({
                      status: false,
                      message: "Subjects not found",
                    });
                  } else {
                    connection.query(
                      "SELECT class_id,subject_id,topic_with_subject_class_and_school.topic_id ,topic_name ,assinged_on  FROM topic_with_subject_class_and_school,topic WHERE user_id=? and topic_with_subject_class_and_school.topic_id=topic.topic_id",
                      req.user_id,
                      (err, classwithsubjectTopicresult, fields) => {
                        if (err) {
                          res.status(500).send({
                            status: false,
                            message: err.sqlMessage,
                          });
                        } else {
                          let final = classresult.map(
                            ({ class_id, class_name }) => ({
                              class_id,
                              class_name,
                              subjects: classwithsubjectresult
                                .filter((q) => q.class_id === class_id)
                                .map(({ subject_id, subject_name }) => ({
                                  subject_id,
                                  subject_name,
                                  topics: classwithsubjectTopicresult
                                    .filter(
                                      (q) =>
                                        q.class_id === class_id &&
                                        q.subject_id === subject_id
                                    )
                                    .map(({ topic_id, topic_name }) => ({
                                      topic_id,
                                      topic_name,
                                    })),
                                })),
                            })
                          );
                          res.status(200).send(final);
                        }
                      }
                    );
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

//Transformed data for Sample Paper
router.get("/getTransformedSamplePaper", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT * FROM class WHERE class_id in (SELECT class_id from class_with_school where user_id=?)",
      req.user_id,
      (err, classresult, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          if (classresult.length === 0) {
            res.status(404).send({
              status: false,
              message: "Classes not found",
            });
          } else {
            connection.query(
              "SELECT class_id, subject_with_class_and_school.subject_id, subject_name, assinged_on  FROM subject_with_class_and_school,subjects WHERE user_id=? and subject_with_class_and_school.subject_id=subjects.subject_id",
              req.user_id,
              (err, classwithsubjectresult, fields) => {
                if (err) {
                  res.status(500).send({
                    status: false,
                    message: err.sqlMessage,
                  });
                } else {
                  if (classwithsubjectresult.length === 0) {
                    res.status(404).send({
                      status: false,
                      message: "Subjects not found",
                    });
                  } else {
                    connection.query(
                      "SELECT class_id,subject_id,sample_paper_with_subject_class_and_school.sample_paper_id ,sample_paper_name,sample_paper_url , assinged_on  FROM sample_paper_with_subject_class_and_school,sample_paper WHERE user_id=? and sample_paper_with_subject_class_and_school.sample_paper_id=sample_paper.sample_paper_id",
                      req.user_id,
                      (err, classwithsubjectSamplePaperresult, fields) => {
                        if (err) {
                          res.status(500).send({
                            status: false,
                            message: err.sqlMessage,
                          });
                        } else {
                          let final = classresult.map(
                            ({
                              class_id: class_id,
                              class_name: class_name,
                            }) => ({
                              class_id,
                              class_name,
                              subjects: classwithsubjectresult
                                .filter((q) => q.class_id === class_id)
                                .map(
                                  ({
                                    subject_id: subject_id,
                                    subject_name: subject_name,
                                  }) => ({
                                    subject_id,
                                    subject_name,
                                    samplePapers: classwithsubjectSamplePaperresult
                                      .filter(
                                        (q) =>
                                          q.class_id === class_id &&
                                          q.subject_id === subject_id
                                      )
                                      .map(
                                        ({
                                          sample_paper_name,
                                          sample_paper_url,
                                        }) => ({
                                          sample_paper_name,
                                          sample_paper_url,
                                        })
                                      ),
                                  })
                                ),
                            })
                          );
                          res.status(200).send(final);
                        }
                      }
                    );
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

//               Notes Related  Api          //

//Add new notes
router.post("/addNote", auth, async (req, res) => {
  try {
    var noteDetails = {
      note_heading: req.body.noteHeading,
      note_desc: req.body.noteDesc,
      created_on: new Date(),
      last_updated_on: new Date(),
    };
    2;
    await connection.query(
      "INSERT INTO notes SET ?",
      noteDetails,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          let insertedId = results.insertId;
          let noteClassSubjectTopicConnection = {
            user_id: req.user_id,
            class_id: req.body.classId,
            subject_id: req.body.subjectId,
            topic_id: req.body.topicId,
            note_id: insertedId,
            assinged_on: new Date(),
          };
          connection.query(
            "INSERT INTO notes_with_topic_subject_class_and_school set ?",
            noteClassSubjectTopicConnection,
            async (err, results, fields) => {
              if (err) {
                topicAddError = err.sqlMessage;
                connection.query(
                  "DELETE FROM notes WHERE note_id = ?",
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
                        message: noteAddError,
                      });
                    }
                  }
                );
              } else {
                res.status(200).send({
                  status: true,
                  message: "Note added",
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

router.get("/getNotes", auth, async (req, res) => {
  try {
    await connection.query(
      "SELECT class_id,subject_id,topic_id,notes_with_topic_subject_class_and_school.note_id,note_heading,note_desc,assinged_on  FROM notes_with_topic_subject_class_and_school,notes WHERE user_id=? and notes_with_topic_subject_class_and_school.note_id=notes.note_id",
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
              message: "Notes not found",
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

router.post("/editNotes", auth, async (req, res) => {
  try {
    await connection.query(
      "update notes set ? where note_id = ?",
      [
        { note_heading: req.body.noteHeading, note_desc: req.body.noteDesc },
        req.body.noteId,
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
            message: "Notes update successfully",
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

router.delete("/removeNotes/:id", auth, async (req, res) => {
  try {
    const _id = req.params.id;
    connection.query(
      "DELETE FROM notes_with_topic_subject_class_and_school WHERE note_id = ?",
      _id,
      async (err, results, fields) => {
        if (err) {
          res.status(500).send({
            status: false,
            message: err.sqlMessage,
          });
        } else {
          connection.query(
            "DELETE FROM notes WHERE note_id = ?",
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
                  message: "Notes deleted",
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

module.exports = router;
