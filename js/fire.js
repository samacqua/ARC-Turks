var DESC_ID;
var SELECTED_EXAMPLE = null;

// Your web app's Firebase configuration
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

/**
 * if ratio of builder attempts to number of descriptions is higher than the goal ratio (in the database), then should create another description
 * returns a promise of (if should give description task (0) or speaker (1) or speaker with example io (2), total number of descriptions in db)
 */
function shouldGiveDescription() {

    return new Promise(function(resolve, reject) {

        const summary_ref = db.collection("tasks").doc("summary");
        summary_ref.get().then(function(snapshot) {
            const tot_attempts = snapshot.data().total_attempts;
            const no_ex_descs = snapshot.data().total_descriptions_no_ex_io;
            const ex_descs = snapshot.data().total_descriptions_with_ex_io;
            const goal_ratio = snapshot.data().goal_ratio;

            const tot_descs = no_ex_descs + ex_descs;

            // to avoid division by 0
            if (tot_descs == 0) {
                return resolve([0, tot_descs]);
            }

            // trying to maintain ratio of attempts to descriptions
            const ratio = tot_attempts/tot_descs;
            if (ratio > goal_ratio) {
                return resolve([0, tot_descs]);
            } else {
                console.log("Need description.");
                console.log(ex_descs);
                console.log(no_ex_descs);
                if (ex_descs > no_ex_descs) {
                    return resolve([1, tot_descs]);
                } else if (ex_descs < no_ex_descs) {
                    return resolve([2, tot_descs]);
                } else {
                    // if equal, randomly choose 1
                    return resolve([Math.round(Math.random())+1, tot_descs]);
                }
            }
        })
        .catch(function (err) {
            return reject(err);
        });
    });
}

/**
 * gets the task with the least number of descriptions
 */
function random_speaker_retrieve() {
    const tasks_ref = db.collection("tasks");
    const tasks_query = tasks_ref.orderBy("num_descriptions").limit(1);

        tasks_query.get().then(function(querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            var TASK_ID;
            querySnapshot.forEach(function(doc) {
                // doc.data() is never undefined for query doc snapshots
                TASK_ID = doc.id;
                console.log(doc.id, " => ", doc.data());
            });
            loadTask(TASK_ID);
        }).catch(function (error) {
            console.log("Error retrieving task: " + error);
    });
}

function random_listen_retrieve(limit_size) {
    /**
     * retrieve from the tasks that have already been described
     */

    if (sessionStorage.getItem('lis_tasks') == null || sessionStorage.getItem('lis_tasks').length < 1) {    // haven't retrieved any yet

        const tasks_ref = db.collection("tasks");
        const tasks_query = tasks_ref.orderBy("num_descriptions").startAt(1);           // start at 1 to make sure getting task with at least 1 description

        tasks_query.get().then(function(querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            var retrieved_tasks = [];

            querySnapshot.forEach(function(doc) {
                retrieved_tasks.push(doc.id);
            });

            // get a random selection of the tasks that have at least 1 description
            shuffle(retrieved_tasks);
            var num_tasks_complete = parseInt(sessionStorage.getItem('items_complete'));
            retrieved_tasks = retrieved_tasks.slice(0, TOTAL_TASKS_TO_COMPLETE - num_tasks_complete);
            
            // have to be super broken up like this for ease of use with sessionStorage
            var see_descs = [];
            var do_descs = [];
            var grid_descs = [];
            var desc_ids = [];
            var selected_examples = [];

            (async function loop() {
                for (let i = 0; i <= retrieved_tasks.length; i++) {
                    await new Promise(function(resolve, reject) {

                        // after looping through all tasks, load the final one
                        // no for, finally in javascript
                        if (i == retrieved_tasks.length) {
                            DESC_ID = desc_ids.pop();
                            TASK_ID = retrieved_tasks.pop();
                            loadTask(TASK_ID);

                            SELECTED_EXAMPLE = selected_examples.pop();
                                
                            $("#grid_size_p").text(grid_descs.pop());
                            $("#see_p").text(see_descs.pop());
                            $("#do_p").text(do_descs.pop());
                
                            // bc descriptions might have commas, cannot split by comma so can't store as list, must first join with a unique character ('#')
                            sessionStorage.setItem('lis_tasks', retrieved_tasks);
                            sessionStorage.setItem('lis_see_desc', see_descs.join('#'));
                            sessionStorage.setItem('lis_do_desc', do_descs.join('#'));
                            sessionStorage.setItem('lis_grid_desc', grid_descs.join('#'));
                            sessionStorage.setItem('lis_desc_ids', desc_ids);
                            sessionStorage.setItem('lis_selected_examples', selected_examples);

                            return resolve();
                        }

                        const task = retrieved_tasks[i];
                        const descs_ref = tasks_ref.doc(task.toString()).collection("descriptions");
                        // get the description with the least number of attempts
                        const descs_query = descs_ref.orderBy("num_attempts").limit(1)

                        descs_query.get().then(function(descSnapshot) {

                            descSnapshot.forEach(function(doc) {
                                const data = doc.data();

                                console.log(data);

                                grid_descs.push(data.grid_description);
                                see_descs.push(data.see_description);
                                do_descs.push(data.do_description);
                                desc_ids.push(doc.id);
                                selected_examples.push(data.selectedExample);
                            });
                            resolve()
                        });
                    });
                }
            })();
        }).catch(function (error) {
            console.log("Error retrieving task: " + error);
        });
    } else {    // stored locally
        var tasks = sessionStorage.getItem('lis_tasks').split(',');
        var see_descs = sessionStorage.getItem('lis_see_desc').split('#');
        var do_descs = sessionStorage.getItem('lis_do_desc').split('#');
        var grid_descs = sessionStorage.getItem('lis_grid_desc').split('#');
        var desc_ids = sessionStorage.getItem('lis_desc_ids').split(',');
        var selected_examples = sessionStorage.getItem('lis_selected_examples').split(',');

        // if no example, will just set as NaN
        SELECTED_EXAMPLE = parseInt(selected_examples.pop());

        DESC_ID = desc_ids.pop();
        TASK_ID = tasks.pop();
        loadTask(TASK_ID);

        $("#see_p").text(see_descs.pop());
        $("#do_p").text(do_descs.pop());
        $("#grid_size_p").text(grid_descs.pop());

        sessionStorage.setItem('lis_tasks', tasks);
        sessionStorage.setItem('lis_see_desc', see_descs.join('#'));
        sessionStorage.setItem('lis_do_desc', do_descs.join('#'));
        sessionStorage.setItem('lis_grid_desc', grid_descs.join('#'));
        sessionStorage.setItem('lis_desc_ids', desc_ids);
        sessionStorage.setItem('lis_selected_examples', selected_examples);
    }
}

function store_response_speaker(see_desc, do_desc, grid_desc, task_id, user_id, attempts, attemp_jsons, conf, total_time, selectedExample, gave_up_verification=false) {
    /**
     * store descriptions, task info and user info and user answers in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {

        var batch = db.batch();
        var didSelectExample = (selectedExample != null);

        // set actual info for description in the specific task's collection
        const desc_doc_ref = db.collection("tasks").doc(task_id.toString()).collection("descriptions").doc();
        batch.set(desc_doc_ref, {
            'see_description' : see_desc,
            'do_description' : do_desc,
            'grid_description' : grid_desc,
            'verification_attempts' : parseInt(attempts),
            'gave_up_verification' : gave_up_verification,
            'attempt_jsons' : attemp_jsons,
            'confidence' : parseInt(conf),
            'uid' : parseInt(user_id),
            'num_attempts' : 0,
            'listener_gave_up_count' : 0,
            'time': total_time,
            'didSelectExample': didSelectExample,
            'selectedExample': selectedExample
        });

        // increment num_descriptions and ver_gave_up_count for task in tasks collection (not desc_gave_up_count bc they would not be submitting description, handled seperately)
        const increment = firebase.firestore.FieldValue.increment(1);
        var gave_up_increment = firebase.firestore.FieldValue.increment(0);

        // only increment if gave up
        if (gave_up_verification) {
            gave_up_increment = increment; 
        }

        const task_doc_ref = db.collection("tasks").doc(task_id.toString());
        batch.update(task_doc_ref, 
            {num_descriptions : increment, 
            ver_gave_up_count : gave_up_increment
        });

        //increment total num descriptions
        const summary_ref = db.collection("tasks").doc("summary");
        if (didSelectExample) {
            batch.update(summary_ref, {
                total_descriptions_with_ex_io: increment
            });
        } else {
            batch.update(summary_ref, {
                total_descriptions_no_ex_io: increment
            });
        }


        batch.commit().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

function store_listener(desc_id, task_id, user_id, attempts, attempt_jsons, total_time, gave_up=false) {
    /**
     * store info for listener task in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {

        var batch = db.batch();

        // store attempt use in description doc's attempts collection
        const desc_use_ref = db.collection("tasks").doc(task_id.toString()).collection("descriptions").doc(desc_id).collection("uses").doc();
        console.log(task_id.toString());
        batch.set(desc_use_ref, {
            'attempts' : attempts,
            'attemp_jsons' : attempt_jsons,
            'uid' : user_id,
            'gave_up' : gave_up,
            'time' : total_time
        });

        const increment = firebase.firestore.FieldValue.increment(1);
        var gave_up_increment = firebase.firestore.FieldValue.increment(0);
        if (gave_up) {
            gave_up_increment = increment;
        }

        // increment the description's number of attempts and number of times the listener gave up (if they gave up)
        const desc_doc = db.collection("tasks").doc(task_id.toString()).collection("descriptions").doc(desc_id);
        batch.update(desc_doc, {
            num_attempts : increment,
            listener_gave_up_count : gave_up_increment
        });

        // increment the total number of attempts
        const summary_doc = db.collection("tasks").doc("summary");
        batch.update(summary_doc, {
            total_attempts: increment
        });

        batch.commit().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

function give_up_description(task_id) {
    /**
     * increment the number of times the user gave up while trying to describe the task
     */

    return new Promise(function(resolve, reject) {
        const increment = firebase.firestore.FieldValue.increment(1);

        const task_doc_ref = db.collection("tasks").doc(task_id.toString());
        task_doc_ref.update({
            desc_gave_up_count : increment
        }).then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

function send_user_info(user_id, time_to_complete, age, gender) {
    db.collection("users").doc(user_id.toString()).set({
        'user_id': user_id,
        'time_to_complete': time_to_complete,
        'age' : age,
        'gender' : gender
    });
}

function init_tasks_collection() {
    /**
     * Just sets 0 value to all tasks in db. 
     * Be careful! It will overwrite everything.
     */

    db.collection("tasks").doc("summary").set({
        'total_attempts': 0,
        'total_descriptions_no_ex_io': 0,
        'total_descriptions_with_ex_io': 0,
        'goal_ratio': 20
    });

    (async function loop() {
        for (task_num=0; task_num<400; task_num++) {
            await new Promise(function(resolve, reject) {
                console.log(task_num);
    
                db.collection("tasks").doc(task_num.toString()).set({
                    'num_descriptions' : 0,
                    'ver_gave_up_count' : 0,
                    'desc_gave_up_count' : 0
                }).then(function () {
                    console.log("stored " + task_num.toString());
                    resolve();
                }).catch(function (err) {
                    console.log(err);
                    reject();
                });
            });
        }
    })();
}