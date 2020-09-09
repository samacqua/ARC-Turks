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


// ===================================
// Retrieve
// ===================================

/**
 * Get all the descriptions for a task
 */
function get_task_descriptions(task_id, description_type) {

    return new Promise(function (resolve, reject) {
        const task_descs_ref = db.collection("tasks").doc(`${task_id}`).collection("descriptions");
        // const task_descs_ref = db.collection("tasks").doc(`${task_id}`).collection("descriptions").where('description_type', '==', description_type);

        task_descs_ref.get().then(function (querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            var descriptions = [];
            querySnapshot.forEach(function (doc) {
                // doc.data() is never undefined for query doc snapshots
                // loop will only run once, just indexing querySnapshot giving issues
                console.log(doc.id, " => ", doc.data());

                const data = doc.data();
                const num_success = data.num_attempts - data.listener_gave_up_count;
                var description = [data.grid_description, data.see_description, data.do_description, num_success, data.num_attempts];

                if (description_type == 'language_and_example') {
                    description.push(data.selected_example)  
                }

                descriptions.push(description);
            });
            return resolve(descriptions);
        }).catch(error => {
            return reject(error);
        });
    });
}

/**
 * get a description by it's id and by its task id
 */
function get_description_by_id(task_id, desc_id) {
    return new Promise(function (resolve, reject) {
        const desc_ref = db.collection("tasks").doc(`${task_id}`).collection("descriptions").doc(desc_id);

        desc_ref.get().then(function (snapshot) {
            console.log(`read ${snapshot.size} documents`);

            const data = doc.data();
            var description = [data.grid_description, data.see_description, data.do_description];

            if (data.description_type == "language_and_example") {
                description.push(data.selected_example);
            } else if (data.description_type == "example") {
                desciption = data.selected_example;
            }

            return resolve(description);
        }).catch(error => {
            return reject(error);
        });
    });
}

/**
 * gets the task with the least number of descriptions
 */
function random_speaker_retrieve() {

    return new Promise(function (resolve, reject) {

        const tasks_ref = db.collection("tasks");
        const tasks_query = tasks_ref.orderBy("num_descriptions").limit(1);

        tasks_query.get().then(function (querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            querySnapshot.forEach(function (doc) {
                // doc.data() is never undefined for query doc snapshots
                // loop will only run once, just indexing querySnapshot giving issues
                console.log(doc.id, " => ", doc.data());
                return resolve(doc.id);
            });
        }).catch(function (error) {
            console.log("Error retrieving task: " + error);
            return reject(error);
        });
    });
}

/**
 * retrieve from the tasks that have already been described
 * gets multiple from database, then stores locally
 */
function random_listen_retrieve() {

    return new Promise(function (resolve, reject) {


        if (sessionStorage.getItem('lis_tasks') == null || sessionStorage.getItem('lis_tasks').length < 1) { // haven't retrieved any yet

            const tasks_ref = db.collection("tasks");
            const tasks_query = tasks_ref.orderBy("num_descriptions").startAt(1); // start at 1 to make sure getting task with at least 1 description

            tasks_query.get().then(function (querySnapshot) {
                console.log(`read ${querySnapshot.size} documents`);

                var retrieved_tasks = [];

                querySnapshot.forEach(function (doc) {
                    retrieved_tasks.push(doc.id);
                });

                // get a random selection of the tasks that have at least 1 description
                shuffle(retrieved_tasks);
                var num_tasks_complete = parseInt(sessionStorage.getItem('items_complete'));

                // so if testing, don't need to have sessionStorage value
                if (isNaN(num_tasks_complete)) {
                    num_tasks_complete = 0;
                }

                retrieved_tasks = retrieved_tasks.slice(0, TOTAL_TASKS_TO_COMPLETE - num_tasks_complete);

                // have to be super broken up like this for ease of use with sessionStorage
                var see_descs = [];
                var do_descs = [];
                var grid_descs = [];
                var desc_ids = [];
                var selected_examples = [];

                (async function loop() {
                    for (let i = 0; i <= retrieved_tasks.length; i++) {
                        await new Promise(function (resolve_loop, reject_loop) {

                            // after looping through all tasks, load the final one
                            // no for, finally in javascript
                            if (i == retrieved_tasks.length) {

                                const desc_id = desc_ids.pop();
                                const task_id = retrieved_tasks.pop();
                                const selected_example = parseInt(selected_examples.pop());

                                const grid_description = grid_descs.pop();
                                const see_description = see_descs.pop();
                                const do_description = do_descs.pop();

                                sessionStorage.setItem('lis_desc_ids', desc_ids);
                                sessionStorage.setItem('lis_tasks', retrieved_tasks);
                                sessionStorage.setItem('lis_selected_examples', selected_examples);

                                // bc descriptions might have commas, cannot split by comma so can't store as list, must first join with a unique character ('#')
                                sessionStorage.setItem('lis_see_desc', see_descs.join('#'));
                                sessionStorage.setItem('lis_do_desc', do_descs.join('#'));
                                sessionStorage.setItem('lis_grid_desc', grid_descs.join('#'));

                                return resolve([desc_id, task_id, selected_example, grid_description, see_description, do_description]);
                            }

                            const task = retrieved_tasks[i];
                            const descs_ref = tasks_ref.doc(task.toString()).collection("descriptions");
                            // get the description with the least number of attempts
                            const descs_query = descs_ref.orderBy("num_attempts").limit(1)

                            descs_query.get().then(function (descSnapshot) {

                                descSnapshot.forEach(function (doc) {
                                    const data = doc.data();

                                    console.log(data);

                                    grid_descs.push(data.grid_description);
                                    see_descs.push(data.see_description);
                                    do_descs.push(data.do_description);
                                    desc_ids.push(doc.id);
                                    selected_examples.push(data.selectedExample); // will be updated to selected_example
                                }).catch(error => {
                                    return reject(error);
                                });
                                resolve_loop()
                            });
                        });
                    }
                })();
            }).catch(function (error) {
                console.log("Error retrieving task: " + error);
                return reject(error);
            });
        } else { // stored locally

            // get from sessionStorage
            var desc_ids = sessionStorage.getItem('lis_desc_ids').split(',');
            var retrieved_tasks = sessionStorage.getItem('lis_tasks').split(',');
            var selected_examples = sessionStorage.getItem('lis_selected_examples').split(',');
            var see_descs = sessionStorage.getItem('lis_see_desc').split('#');
            var do_descs = sessionStorage.getItem('lis_do_desc').split('#');
            var grid_descs = sessionStorage.getItem('lis_grid_desc').split('#');

            // pop last item from each
            const desc_id = desc_ids.pop();
            const task_id = retrieved_tasks.pop();
            const selected_example = parseInt(selected_examples.pop());

            const grid_description = grid_descs.pop();
            const see_description = see_descs.pop();
            const do_description = do_descs.pop();

            // store popped list in sessionStorage
            sessionStorage.setItem('lis_desc_ids', desc_ids);
            sessionStorage.setItem('lis_tasks', retrieved_tasks);
            sessionStorage.setItem('lis_selected_examples', selected_examples);

            // bc descriptions might have commas, cannot split by comma so can't store as list, must first join with a unique character ('#')
            sessionStorage.setItem('lis_see_desc', see_descs.join('#'));
            sessionStorage.setItem('lis_do_desc', do_descs.join('#'));
            sessionStorage.setItem('lis_grid_desc', grid_descs.join('#'));

            return resolve([desc_id, task_id, selected_example, grid_description, see_description, do_description]);
        }
    });
}

function get_words() {
    return new Promise(function (resolve, reject) {
        const summary_ref = db.collection("tasks").doc("summary");
        summary_ref.get().then(function (snapshot) {
            return resolve(snapshot.data().words)
        })
        .catch(function (err) {
            return reject(err);
        });
    });
}

// ===================================
// Store
// ===================================

function store_description(see_desc, do_desc, grid_desc, task_id, user_id, attempts, attemp_jsons, conf, total_time, selected_example, gave_up_verification = false) {
    /**
     * 
     * store descriptions, task info and user info and user answers in firebase
     * returns promise so that can transition to next task after storing
     */

    console.log(task_id);

    return new Promise(function (resolve, reject) {

        // determine the type of description  
        var didSelectExample = (selected_example != null);
        var desc_type = "language";
        if (didSelectExample) {
            if (do_desc == see_desc == grid_desc == "") {
                desc_type = "example";
            } else {
                desc_type = "language_and_example"
            }
        }

        var batch = db.batch();

        // set actual info for description in the specific task's collection
        const desc_doc_ref = db.collection("tasks").doc(task_id.toString()).collection("descriptions").doc();
        batch.set(desc_doc_ref, {
            'see_description': see_desc,
            'do_description': do_desc,
            'grid_description': grid_desc,
            'verification_attempts': parseInt(attempts),
            'gave_up_verification': gave_up_verification,
            'attempt_jsons': attemp_jsons,
            'confidence': parseInt(conf),
            'uid': parseInt(user_id),
            'num_attempts': 0,
            'listener_gave_up_count': 0,
            'time': total_time,
            'selected_example': selected_example,
            'description_type': desc_type
        });

        // increment num_descriptions and ver_gave_up_count for task in tasks collection (not desc_gave_up_count bc they would not be submitting description, handled seperately)
        const increment = firebase.firestore.FieldValue.increment(1);
        var gave_up_increment = firebase.firestore.FieldValue.increment(0);

        // only increment if gave up
        if (gave_up_verification) {
            gave_up_increment = increment;
        }

        const task_doc_ref = db.collection("tasks").doc(task_id.toString());
        batch.update(task_doc_ref, {
            num_descriptions: increment,
            ver_gave_up_count: gave_up_increment,
        });

        //increment total num descriptions
        const summary_ref = db.collection("tasks").doc("summary");
        const words = see_desc.match(/\b(\w+)\b/g).concat(do_desc.match(/\b(\w+)\b/g)).concat(grid_desc.match(/\b(\w+)\b/g));
        console.log(words);
        if (didSelectExample) {
            batch.update(summary_ref, {
                total_descriptions_with_ex_io: increment,
                'words': firebase.firestore.FieldValue.arrayUnion(...words)
            });
        } else {
            batch.update(summary_ref, {
                total_descriptions_no_ex_io: increment,
                'words': firebase.firestore.FieldValue.arrayUnion(...words)
            });
        }


        batch.commit().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

function store_listener(desc_id, task_id, user_id, attempts, attempt_jsons, total_time, gave_up = false) {
    /**
     * store info for listener task in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function (resolve, reject) {

        var batch = db.batch();

        // store attempt use in description doc's attempts collection
        const desc_use_ref = db.collection("tasks").doc(task_id.toString()).collection("descriptions").doc(desc_id).collection("uses").doc();
        console.log(task_id.toString());
        batch.set(desc_use_ref, {
            'attempts': attempts,
            'attemp_jsons': attempt_jsons,
            'uid': user_id,
            'gave_up': gave_up,
            'time': total_time
        });

        const increment = firebase.firestore.FieldValue.increment(1);
        var gave_up_increment = firebase.firestore.FieldValue.increment(0);
        if (gave_up) {
            gave_up_increment = increment;
        }

        // increment the description's number of attempts and number of times the listener gave up (if they gave up)
        const desc_doc = db.collection("tasks").doc(task_id.toString()).collection("descriptions").doc(desc_id);
        batch.update(desc_doc, {
            num_attempts: increment,
            listener_gave_up_count: gave_up_increment
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

/**
 * Store user demographic information
 */
function set_user_info(user_id, age, gender) {
    db.collection("users").doc(user_id.toString()).set({
        'user_id': user_id,
        'age': age,
        'gender': gender
    }).then(function () {
        console.log("set user info successfully");
    }).catch(function (err) {
        console.log(err);
    });
}

/**
 * Store the amount of time it took a user to complete a task
 */
function set_user_complete_time(user_id, time, task_name) {
    var data = {};
    data[task_name] = time;

    db.collection("users").doc(user_id.toString()).update(data)
        .then(function () {
            console.log(`set user time: ${task_name} successfully`);
        }).catch(function (err) {
            console.log(err);
    });
}

/**
 * increment the number of times the user gave up while trying to describe the task
 */
function give_up_description(task_id) {

    return new Promise(function (resolve, reject) {
        const increment = firebase.firestore.FieldValue.increment(1);

        const task_doc_ref = db.collection("tasks").doc(task_id.toString());
        task_doc_ref.update({
            desc_gave_up_count: increment
        }).then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

function store_words(words) {
    //increment total num descriptions
    const summary_ref = db.collection("tasks").doc("summary");
    summary_ref.update({
        'words': firebase.firestore.FieldValue.arrayUnion(...words)
    }).then(function() {
        console.log("stored words");
    }).catch(error => {
        console.log(error);
    });
}


/**
 * if ratio of builder attempts to number of descriptions is higher than the goal ratio (in the database), then should create another description
 * returns a promise of (if should give builder task (0) or speaker (1) or speaker with example io (2), or speaker just choosing example io (3), total number of descriptions in db)
 */
function shouldGiveDescription() {

    return new Promise(function (resolve, reject) {

        const summary_ref = db.collection("tasks").doc("summary");
        summary_ref.get().then(function (snapshot) {
            const tot_attempts = snapshot.data().total_attempts;

            const nl_descs = snapshot.data().total_descriptions_no_ex_io;
            const nl_ex_descs = snapshot.data().total_descriptions_with_ex_io;
            const ex_descs = snapshot.data().just_example_description_count;

            const goal_ratio = snapshot.data().goal_ratio;

            const tot_descs = nl_descs + nl_ex_descs + ex_descs;

            // to avoid division by 0
            if (tot_descs == 0) {
                return resolve([0, tot_descs]);
            }

            // trying to maintain ratio of attempts to descriptions
            const cur_ratio = tot_attempts / tot_descs;
            if (cur_ratio < goal_ratio) {
                return resolve([0, tot_descs]);
            } else {
                console.log("Need description.");
                console.log(nl_ex_descs);
                console.log(nl_descs);

                const desc_screens = [nl_descs, nl_ex_descs, ex_descs];
                const min = Math.min(desc_screens);

                for (var i = 0; i < desc_screens.length; i++) {
                    if (desc_screens[i] == min) {
                        return resolve([i + 1, tot_descs]);
                    }
                }
            }
        })
        .catch(function (err) {
            return reject(err);
        });
    });
}

// ===================================
// Initialize
// ===================================

function init_tasks_collection() {
    /**
     * Just sets 0 value to all tasks in db. 
     * Be careful! It will overwrite everything.
     */

    db.collection("tasks").doc("summary").set({
        'words': []
    });

    (async function loop() {
        for (task_num = 0; task_num < 400; task_num++) {
            await new Promise(function (resolve, reject) {
                console.log(task_num);

                db.collection("tasks").doc(task_num.toString()).set({
                    'num_descriptions': 0,
                    'ver_gave_up_count': 0,
                    'desc_gave_up_count': 0
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


// ===================================
// Download Database as JSON
// ===================================

function download_file(blob, name) {
    var url = URL.createObjectURL(blob),
        div = document.createElement("div"),
        anch = document.createElement("a");
    document.body.appendChild(div);
    div.appendChild(anch);
    anch.innerHTML = "&nbsp;";
    div.style.width = "0";
    div.style.height = "0";
    anch.href = url;
    anch.download = name;

    var ev = new MouseEvent("click", {});
    anch.dispatchEvent(ev);
    document.body.removeChild(div);
}

function download_stamps_JSON() {
    let ref_loc = '/arc-stamp'
    fbase.ref(ref_loc).once('value').then(function (snapshot) {
        console.log(snapshot.val());
        json_stringed = JSON.stringify(snapshot.val());
        // create the text file as a Blob:
        var blob = new Blob([json_stringed], {
            type: "application/json"
        });
        // download the file:
        download_file(blob, "ARC-Stamps.json");
    }).catch(error => {
        console.log("failed getting data.");
        return reject(error);
    });
}