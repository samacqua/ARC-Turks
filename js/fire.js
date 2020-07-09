var DESC_ID;

var firebaseConfig = {
    apiKey: "AIzaSyBv4KeycMnYznBxZ0D6IfLifZuivGG0PjQ",
    authDomain: "arc-turk.firebaseapp.com",
    databaseURL: "https://arc-turk.firebaseio.com",
    projectId: "arc-turk",
    storageBucket: "arc-turk.appspot.com",
    messagingSenderId: "60760627786",
    appId: "1:60760627786:web:00bc4b63e339bf0600e4b3",
    measurementId: "G-YN4FSWEZPE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

/*
DATABASE STRUCTURE:

Collections:      tasks                     all_descriptions                       0, 1, 2 ... 399 (collection for each task)
                    
Documents:   0  1   2   ...   399             all desc_ids                        desc_ids (for that task)

Fields:     num_descriptions             num_uses        task_num               age, gender, num_uses, confidence, 
                                                                                do_description, see_description, grid_description, verification_attempts,
                                                                                attempt_jsons, task_num, uid

Sub-collection:                                                                         description_uses

Documents:                                                                              desc_use_ids

Fields:                                                                             attempts, attempt_jsons, age, gender, uid

Purpose:
    tasks - Used to get the speaking task. Can easily sort based on num_descriptions to make sure that we choose a task that needs descriptions. Can also use this to remove some tasks that we do not want to bother with.
    all_descriptions - Used to get the listening task. Can easily sort based on num_uses to find the description that needs use.
    0,1,2...399 - where bulk of info is stored. The info for all the task descriptions, and the uses of those descriptions, is stored in these collections.
*/

function random_speaker_retrieve(limit_size) {
    /**
     * stochastically retrieve the task for speaker, sorted by number of descriptions
     */
    const finished_speaker_tasks = sessionStorage.getItem('speaker_tasks_complete');
    var tasks_ref = db.collection("tasks");
    tasks_ref.orderBy("num_descriptions").limit(limit_size);

     tasks_ref.get().then(function(querySnapshot) {
        // select randomly, making sure not to not index document that is not there at very beginning of database
        // not the most efficient way to do this, but max 400 documents so not a big deal
        const scale = Math.min(limit_size, querySnapshot.size);
        console.log(querySnapshot.size);
        const rand_selection = Math.floor(Math.random() * scale);
        console.log(rand_selection);
        var i = 0;

        querySnapshot.forEach(function(doc) {
            if (i++ == rand_selection) {
                if (finished_speaker_tasks.includes(doc.id)) {
                    // if already described task, give it another task (not most efficient but it'll work)
                    random_speaker_retrieve(limit_size+5);
                    return;
                }

                finished_speaker_tasks.push(doc.id);
                sessionStorage.setItem('speaker_tasks_complete', finished_speaker_tasks);

                TASK_ID = doc.id;
                loadTask(TASK_ID);
                return;
            }
        });
    }).catch(function (error) {
        console.log("Error retrieving task: " + error);
    });
}

function store_response_speaker(see_desc, do_desc, grid_desc, task_id, user_id, attempts, attemp_jsons, age, gender, conf) {
    /**
     * store descriptions, task info and user info and user answers in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {

        // set actual info for description in the specific task's collection
        db.collection(task_id.toString()).add({
            'see_description' : see_desc,
            'do_description' : do_desc,
            'grid_description' : grid_desc,
            'verification_attempts' : parseInt(attempts),
            'attempt_jsons' : attemp_jsons,
            'age' : parseInt(age),
            'gender' : gender,
            'confidence' : parseInt(conf),
            'uid' : parseInt(user_id),
            'num_uses' : 0,
            'task_num' : task_id
        }).then(function(docRef) {

            // increment num_descriptions for task in tasks collection
            const increment = firebase.firestore.FieldValue.increment(1);

            const task_doc_ref = db.collection("tasks").doc(task_id.toString());
            task_doc_ref.update({num_descriptions : increment})
            .then(function () {

                // put in all_descriptions, so that easy to query all descriptions to sort based on number of uses
                const descriptions_ref = db.collection("all_descriptions");
                descriptions_ref.doc(docRef.id).set({
                    'num_uses' : 0,
                    'task_num' : task_id
                }).then(function () {
                    return resolve();
                }).catch(function (err) {
                    return reject(err);
                });
            })
            .catch(function (err) {
                return reject(err);
            });
        })
        .catch(function(error) {
            return reject(error);
        });
    });
}

function random_listen_retrieve(limit_size) {
    /**
     * retrieve the task and description that has already been described
     */
    var tasks_ref = db.collection("all_descriptions");
    tasks_ref.orderBy("num_uses").limit(limit_size);

    tasks_ref.get().then(function(querySnapshot) {
        // select randomly, making sure not to not index document that is not there at very beginning of database
        const scale = Math.min(limit_size, querySnapshot.size);
        const rand_selection = Math.floor(Math.random() * scale);
        var i = 0;

        querySnapshot.forEach(function(doc) {

            if (i == rand_selection) {
                TASK_ID = doc.data().task_num;
                const desc_id = doc.id;

                // get reference to description doc
                const desc_ref = db.collection(TASK_ID.toString()).doc(desc_id);

                desc_ref.get().then(function(doc2) {
                    DESC_ID = doc2.id;
                    const descData = doc2.data();

                    $("#see_p").text(descData.see_description);
                    $("#do_p").text(descData.do_description);
                    $("#grid_size_p").text(descData.grid_description);

                    loadTask(TASK_ID);
                    return;
                }).catch(function(error) {
                    console.log("Error retrieving task: " + error);
                });
            }
        });
    }).catch(function (error) {
        console.log("Error retrieving task: " + error);
    });
}

function store_listener(desc_id, task_id, user_id, attempts, attempt_jsons, age, gender) {
    /**
     * store info for listener task in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {
        // store description use in description doc
        db.collection(task_id.toString()).doc(desc_id).collection("description_uses").add({
            'attempts' : attempts,
            'attemp_jsons' : attempt_jsons,
            'age' : age,
            'gender' : gender,
            'uid' : user_id
        }).then(function(docRef) {
            // increment num_uses in all_descriptions
            const increment = firebase.firestore.FieldValue.increment(1);
            const task_doc_ref = db.collection("all_descriptions").doc(desc_id);

            task_doc_ref.update({num_uses : increment})
            .then(function () {
                return resolve();
            })
            .catch(function (err) {
                return reject(err);
            });
        })
        .catch(function(error) {
            return reject(error);
        });
    });
}

function init_tasks_collection() {
    /**
     * Just sets 0 value to all tasks in db. 
     * Be careful! It will overwrite everything.
     */
    for (i=0; i<400; i++) {
        db.collection("tasks").doc(i.toString()).set({
            'num_descriptions' : 0
        }).then(function () {
            console.log(i + ' complete');
        }).catch(function (err) {
            console.log(err);
        });
    }
}