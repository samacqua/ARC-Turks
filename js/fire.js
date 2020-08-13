var DESC_ID;

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDkx-mZ05NkpseYk7BN2kj8BmeWPoXOEwU",
    authDomain: "arc-v3.firebaseapp.com",
    databaseURL: "https://arc-v3.firebaseio.com",
    projectId: "arc-v3",
    storageBucket: "arc-v3.appspot.com",
    messagingSenderId: "400560292229",
    appId: "1:400560292229:web:c9b42b032c4da3aa4844ec"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

/**
 * if ratio of builder attempts to number of descriptions is higher than the goal ratio (in the database), then should create another description
 * returns a promise of (if should give description task, total number of descriptions in db)
 */
function shouldGiveDescription() {

    return new Promise(function(resolve, reject) {
        const summary_ref = db.collection("tasks").doc("summary");
        summary_ref.get().then(function(snapshot) {
            const tot_attempts = snapshot.data().total_attempts;
            const tot_descs = snapshot.data().total_descriptions;
            const goal_ratio = snapshot.data().goal_ratio;

            console.log(tot_attempts, tot_descs);

            // to avoid division by 0
            if (tot_descs == 0) {
                return resolve([true, tot_descs]);
            }

            const ratio = tot_attempts/tot_descs;
            if (ratio > goal_ratio) {
                return resolve([true, tot_descs]);
            } else {
                return resolve([false, tot_descs]);
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
        // make sure at least 1 description
        const tasks_query = tasks_ref.orderBy("num_descriptions").startAt(1);

        tasks_query.get().then(function(querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            var retrieved_tasks = [];

            querySnapshot.forEach(function(doc) {
                retrieved_tasks.push(doc.id);
            });

            // get a random selection of the tasks that have at least 1 description
            shuffle(retrieved_tasks);
            retrieved_tasks = retrieved_tasks.slice(0, TOTAL_TASKS_TO_COMPLETE);
            
            // have to be super broken up like this for ease of use with sessionStorage
            var see_descs = [];
            var do_descs = [];
            var grid_descs = [];
            var desc_ids = [];

            (async function loop() {
                for (let i = 0; i <= retrieved_tasks.length; i++) {
                    await new Promise(function(resolve, reject) {

                        // after looping through all tasks, load the final one
                        if (i == retrieved_tasks.length) {
                            DESC_ID = desc_ids.pop();
                            TASK_ID = retrieved_tasks.pop();
                            loadTask(TASK_ID);
                
                            console.log(grid_descs);
                
                            $("#grid_size_p").text(grid_descs.pop());
                            $("#see_p").text(see_descs.pop());
                            $("#do_p").text(do_descs.pop());
                
                            // bc descriptions might have commas, cannot split by comma so can't store as list, must first join with a unique character ('#')
                
                            sessionStorage.setItem('lis_tasks', retrieved_tasks);
                            sessionStorage.setItem('lis_see_desc', see_descs.join('#'));
                            sessionStorage.setItem('lis_do_desc', do_descs.join('#'));
                            sessionStorage.setItem('lis_grid_desc', grid_descs.join('#'));
                            sessionStorage.setItem('lis_desc_ids', desc_ids);

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
                            });
                            resolve()
                        });
                    });
                }
            })();
        }).catch(function (error) {
            console.log("Error retrieving task: " + error);
        });
    } else {
        var tasks = sessionStorage.getItem('lis_tasks').split(',');
        var see_descs = sessionStorage.getItem('lis_see_desc').split('#');
        var do_descs = sessionStorage.getItem('lis_do_desc').split('#');
        var grid_descs = sessionStorage.getItem('lis_grid_desc').split('#');
        var desc_ids = sessionStorage.getItem('lis_desc_ids').split(',');

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
    }
}

function store_response_speaker(see_desc, do_desc, grid_desc, task_id, user_id, attempts, attemp_jsons, age, gender, conf, gave_up_verification=false) {
    /**
     * store descriptions, task info and user info and user answers in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {

        var batch = db.batch();

        // set actual info for description in the specific task's collection
        const desc_doc_ref = db.collection("tasks").doc(task_id.toString()).collection("descriptions").doc();
        batch.set(desc_doc_ref, {
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
            'num_attempts' : 0,
            'listener_gave_up_count' : 0
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
        batch.update(summary_ref, {
            total_descriptions: increment
        });

        batch.commit().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

function store_listener(desc_id, task_id, user_id, attempts, attempt_jsons, age, gender, gave_up=false) {
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
            'age' : age,
            'gender' : gender,
            'uid' : user_id,
            'gave_up' : gave_up
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
    const increment = firebase.firestore.FieldValue.increment(1);

    const task_doc_ref = db.collection("tasks").doc(task_id.toString());
    task_doc_ref.update({
        desc_gave_up_count : increment
    });
}

function send_user_info(user_id, time_to_complete) {
    db.collection("users").doc(user_id.toString()).set({
        'user_id': user_id,
        'time_to_complete': time_to_complete
    });
}

function init_tasks_collection() {
    /**
     * Just sets 0 value to all tasks in db. 
     * Be careful! It will overwrite everything.
     */

    db.collection("tasks").doc("summary").set({
        'total_attempts': 0,
        'total_descriptions': 0,
        'goal_ratio': 20
    });

    // 10 tasks that belong to 3 main categories: 
    // 1. a recoloring task, where the pattern is where something is colored in (1, 39, 181, 293)
    // 2. a zoom task, where the pattern is to zoom in on a specific object (28, 270, 318)
    // 3. a beam task, where the pattern involves 'shooting a beam' (12, 33, 46)
    const tasks_to_include = [1, 39, 181, 293, 28, 270, 318, 12, 33, 46];
    console.log(tasks_to_include.length);

    (async function loop() {
        for (i=0; i<tasks_to_include.length; i++) {
            await new Promise(function(resolve, reject) {
                console.log(i);
                const task = tasks_to_include[i]
                console.log(task);
    
                db.collection("tasks").doc(task.toString()).set({
                    'num_descriptions' : 0,
                    'ver_gave_up_count' : 0,
                    'desc_gave_up_count' : 0
                }).then(function () {
                    console.log("stored " + task.toString());
                    resolve();
                }).catch(function (err) {
                    console.log(err);
                    reject();
                });
            });
        }
    })();
}