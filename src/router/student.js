const express = require("express");
const router = new express.Router();
const connection = require("../db/connection");
const auth = require("../auth/authentication");

router.post("/getTransformedDataForStudent", auth, async (req, res) => {
    try {
        await connection.query("SELECT subject_with_class_and_school.subject_id, subject_name  FROM subject_with_class_and_school,subjects WHERE user_id=? and class_id=? and subject_with_class_and_school.subject_id=subjects.subject_id", [req.body.schoolId,req.body.classId],
                        (err, subjectresult, fields) => {
                            if (err) {
                                res.status(200).send({
                                    status: false,
                                    message: err.sqlMessage
                                });
                            } else {
                                   connection.query("SELECT subject_id,topic_with_subject_class_and_school.topic_id ,topic_name FROM topic_with_subject_class_and_school,topic WHERE user_id=? and class_id=? and topic_with_subject_class_and_school.topic_id=topic.topic_id", [req.body.schoolId,req.body.classId],
                                    (err, subjectTopicresult, fields) => {
                                        if (err) {
                                            res.status(200).send({
                                                status: false,
                                                message: err.sqlMessage
                                            });
                                        } else {
                                             connection.query("SELECT subject_id,sample_paper_with_subject_class_and_school.sample_paper_id ,sample_paper_name,sample_paper_url  FROM sample_paper_with_subject_class_and_school,sample_paper WHERE user_id=? and class_id=? and sample_paper_with_subject_class_and_school.sample_paper_id=sample_paper.sample_paper_id",[req.body.schoolId,req.body.classId],
                                                    (err, subjectSamplePaperresult, fields) => {
                                                        if (err) {
                                                            res.status(200).send({
                                                                status: false,
                                                                message: err.sqlMessage
                                                            });
                                                        } else {
                                                            connection.query("SELECT topic_id,notes_with_topic_subject_class_and_school.note_id,note_heading,note_desc  FROM notes_with_topic_subject_class_and_school,notes WHERE user_id=? and class_id=? and notes_with_topic_subject_class_and_school.note_id=notes.note_id", [req.body.schoolId, req.body.classId],
                                                                (err, subjectTopicNotesresult, fields) => {
                                                                    if (err) {
                                                                        res.status(200).send({
                                                                            status: false,
                                                                            message: err.sqlMessage
                                                                        });
                                                                    } else {
                                                                        let final = subjectresult.map(({ subject_id, subject_name }) =>
                                                                    ({
                                                                            subject_id,
                                                                            subject_name,
                                                                            topics: subjectTopicresult
                                                                            .filter(
                                                                                (q) => q.subject_id === subject_id
                                                                            )
                                                                            .map(({topic_id, topic_name }) => ({
                                                                                topic_id, topic_name,
                                                                                notes: subjectTopicNotesresult
                                                                                .filter(
                                                                                (q) => q.topic_id === topic_id
                                                                                ).map(({ note_id, note_heading, note_desc }) => ({
                                                                                note_id,
                                                                                note_heading,
                                                                                note_desc,
                                                                            })),
                                                                            })),
                                                                            samplePapers: subjectSamplePaperresult
                                                                            .filter(
                                                                                (q) => q.subject_id === subject_id
                                                                            )
                                                                            .map(({ sample_paper_name, sample_paper_url }) => ({
                                                                                sample_paper_name,
                                                                                sample_paper_url,
                                                                            })),
                                                                        }))
                                                        
                                                                        res.status(200).send(final);
                                                                            
                                                                    }
                                                                })

                                                        }  
                                            })                     
                                        }
                                    })   
                            }
                        })
                   
               
    } catch (error) {
        res.status(400).send({
            status: false,
            message: error.message
        });
    }
})

router.post("/getVideosForStudent", auth, async (req, res) => {
    try {
        await connection.query("SELECT video_id,topic_id,video_url FROM videos WHERE class_id=? AND school_id=?", [req.body.classId,req.body.schoolId],
            (err, results, fields) => {
              if (err) {
                    res.status(500).send({
                        status: false,
                        message: err.sqlMessage
                    });
                } else {
                     if (results.length === 0) {
                        res.status(404).send({
                        status: false,
                        message: "Videos not found"
                    });
                  }
                  else
                       res.status(200).send(results);
                }
            })
    } catch (error) {
        res.status(400).send({
            status: false,
            message: error.message
        });
    }
})


module.exports = router;



