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

Collections:      tasks                                  all_descriptions                       0, 1, 2 ... 399 (collection for each task)
                    
Documents:   0  1   2   ...   399                           all desc_ids                        desc_ids (for that task)

Fields:     num_descriptions    gave_up_count             num_uses        task_num               age, gender, num_uses, confidence, 
                                                            gave_up_count               do_description, see_description, grid_description, verification_attempts,
                                                                                            attempt_jsons, task_num, uid, gave_up_verification

Sub-collection:                                                                                     description_uses

Documents:                                                                                          desc_use_ids

Fields:                                                                                         attempts, attempt_jsons, age, gender, uid, gave_up,
                                                                                                description_critique

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

                const sub_str = '.' + doc.id + '.';
                if (finished_speaker_tasks.includes(sub_str)) {
                    // if already described task, give it another task (not most efficient but it'll work)
                    random_speaker_retrieve(limit_size+5);
                    return;
                }
                // sessionsStorage stores as string, so using substring with '.' as a sort of list ex: 55 250 43
                sessionStorage.setItem('speaker_tasks_complete', finished_speaker_tasks.concat('.', doc.id, '.'));

                TASK_ID = doc.id;
                loadTask(TASK_ID);
                return;
            }
        });
    }).catch(function (error) {
        console.log("Error retrieving task: " + error);
    });
}

function store_response_speaker(see_desc, do_desc, grid_desc, task_id, user_id, attempts, attemp_jsons, age, gender, conf, gave_up_verification=false) {
    /**
     * store descriptions, task info and user info and user answers in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {

        var batch = db.batch();

        // set actual info for description in the specific task's collection
        var task_doc_ref = db.collection(task_id.toString()).doc();
        batch.set(task_doc_ref, {
            'see_description' : see_desc,
            'do_description' : do_desc,
            'grid_description' : grid_desc,
            'verification_attempts' : parseInt(attempts),
            'gave_up_verification' : gave_up_verification,
            'attempt_jsons' : attemp_jsons,
            'age' : parseInt(age),
            'gender' : gender,
            'confidence' : parseInt(conf),
            'uid' : parseInt(user_id),
            'num_uses' : 0,
            'task_num' : task_id
        });


        // increment num_descriptions for task in tasks collection
        const increment = firebase.firestore.FieldValue.increment(1);
        var gave_up_increment = firebase.firestore.FieldValue.increment(0);

        if (gave_up_verification) {
            // only increment if gave up
            gave_up_increment = increment; 
        }

        const task_doc_ref = db.collection("tasks").doc(task_id.toString());
        batch.update(task_doc_ref, 
            {num_descriptions : increment, 
            gave_up_count : gave_up_increment
        });


        // put in all_descriptions, so that easy to query all descriptions to sort based on number of uses
        const desc_id = task_doc_ref.key;
        const description_ref = db.collection("all_descriptions").doc(desc_id);
        batch.set(description_ref, {
            'num_uses' : 0,
            'task_num' : task_id,
            'gave_up_count' : 0
        });

        batch.commit().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
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

            if (i++ == rand_selection) {
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

function store_listener(desc_id, task_id, user_id, attempts, attempt_jsons, age, gender, description_critique="None", gave_up=false) {
    /**
     * store info for listener task in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {

        var batch = db.batch();

        // store description use in description doc
        var desc_ref = db.collection(task_id.toString()).doc(desc_id).collection("description_uses").doc();
        batch.set(desc_ref, {
            'attempts' : attempts,
            'attemp_jsons' : attempt_jsons,
            'age' : age,
            'gender' : gender,
            'uid' : user_id,
            'description_critique' : description_critique,
            'gave_up' : gave_up
        });


        // increment num_uses in all_descriptions
        const increment = firebase.firestore.FieldValue.increment(1);
        var gave_up_increment = firebase.firestore.FieldValue.increment(0);
        if (gave_up) {
            gave_up_increment = increment;
        }
        const task_doc_ref = db.collection("all_descriptions").doc(desc_id);

        batch.update(task_doc_ref, {
            num_uses : increment, 
            gave_up_count : gave_up_increment
        });

        batch.set().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
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
            'num_descriptions' : 0,
            'gave_up_count' : 0
        }).then(function (doc) {
            console.log(doc.id + ' complete');
        }).catch(function (err) {
            console.log(err);
        });
    }
}