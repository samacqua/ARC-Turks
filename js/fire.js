// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyDe9mlqTQbwPvn-ZqS7pjAEnTv-ys9wGAY",
    authDomain: "arc-pilot-pilot.firebaseapp.com",
    databaseURL: "https://arc-pilot-pilot.firebaseio.com",
    projectId: "arc-pilot-pilot",
    storageBucket: "arc-pilot-pilot.appspot.com",
    messagingSenderId: "637909145149",
    appId: "1:637909145149:web:63e02da1ff6bcd3e767c54"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var database = firebase.database();


// ===================================
// Retrieve
// ===================================

/**
 * Returns the task and desc_id of an unused description that the user has not already done the task of, if any (otherwise return -1)
 */
function get_unused_desc(type) {
    return new Promise(function (resolve, reject) {
        const unused_ref = db.collection(type + "_unused_descs");

        unused_ref.get().then(querySnapshot => {
            console.log(`read ${querySnapshot.size} documents`);

            shuffle(querySnapshot);

            (async function loop() {
                for (i = 0; i <= querySnapshot.size; i++) {
                    await new Promise(function (res, reject) {

                        if (i == querySnapshot.size) {
                            return resolve(-1);
                        }
                        const desc = querySnapshot.docs[i].id;
                        const task = querySnapshot.docs[i].data().task;

                        const tasks_done = (sessionStorage.getItem('tasks_completed') || "").split(',');
                        if (tasks_done.includes(task)) {
                            console.log("Already interacted with task:", task, ", so will find another task.");
                            res();
                        } else {
                            claim_unused_desc(desc, type).then(function () {
                                return resolve([task, desc]);
                            }).catch(error => {
                                // throws an error if already claimed, so continue to next
                                console.error(error);
                                res();
                            });
                        }
                    });
                }
            })();
        }).catch(error => {
            return reject(error);
        })
    });
}

/**
 * Get count of interactions and descriptions for all tasks.
 */
function get_all_descriptions_interactions_count(type) {
    return new Promise(function (resolve, reject) {
        const summary_ref = db.collection(type + "_tasks").doc("summary");

        summary_ref.get().then(function (snapshot) {

            const data = snapshot.data()
            var interactions_count = [];
            var descriptions_count = [];

            for (i = 0; i < NUM_TASKS; i++) {
                const ii = TASKS_TO_USE[i]; // TODO: get rid of ii and references -- temp hack to use old descriptions for pilot-pilot
                interactions_count.push(data[`${ii}_interactions_count`]);
                descriptions_count.push(data[`${ii}_descriptions_count`]);
            }

            return resolve([descriptions_count, interactions_count]);
        })
            .catch(function (err) {
                return reject(err);
            });
    });
}

/**
 * Get the number of descriptions and total number of interactions for a task
 */
function get_task_descs_interactions_count(task, type) {
    return new Promise(function (resolve, reject) {
        const task_ref = db.collection(type + "_tasks").doc(`${task}`);

        task_ref.get().then(function (snapshot) {
            const data = snapshot.data()
            return resolve([data.num_descriptions, data.num_interactions]);
        })
            .catch(function (err) {
                return reject(err);
            });
    });
}


/**
 * Get all the descriptions for a task
 */
function get_task_descriptions(task_id, type) {

    return new Promise(function (resolve, reject) {
        const task_descs_ref = db.collection(type + "_tasks").doc(`${task_id}`).collection("descriptions");

        task_descs_ref.get().then(function (querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            var descriptions = [];
            querySnapshot.forEach(function (doc) {
                // doc.data() is never undefined for query doc snapshots
                // loop will only run once, just indexing querySnapshot giving issues
                const data = doc.data();
                const num_success = data.num_attempts - data.listener_gave_up_count;
                const description = {
                    'grid_desc': data.grid_description,
                    'see_desc': data.see_description,
                    'do_desc': data.do_description,
                    'selected_ex': data.selected_example,
                    'num_success': num_success,
                    'num_attempts': data.num_attempts,
                    'id': doc.id
                };
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
function get_description_by_id(task_id, desc_id, type) {
    return new Promise(function (resolve, reject) {
        const desc_ref = db.collection(type + "_tasks").doc(`${task_id}`).collection("descriptions").doc(desc_id);

        desc_ref.get().then(function (snapshot) {

            const data = snapshot.data();
            // if does not contain field, just returns undefined, so works for all desc kinds
            var description = {
                'grid_desc': data.grid_description,
                'see_desc': data.see_description,
                'do_desc': data.do_description,
                'selected_example': data.selected_example,
                'num_success': data.num_success,
                'num_attempts': data.num_attempts,
                'id': snapshot.id
            };

            return resolve(description);
        }).catch(error => {
            console.error(error);
            return reject(error);
        });
    });
}

/**
 * Get all words that have been used in previous descriptions.
 */
function get_words() {
    return new Promise(function (resolve, reject) {
        const summary_ref = db.collection("total").doc("summary");

        summary_ref.get().then(function (snapshot) {
            return resolve(snapshot.data().words)
        })
            .catch(function (err) {
                return reject(err);
            });
    });
}

/**
 * Get word vec for word
 */
function get_word_vec(word) {
    return new Promise(function (resolve, reject) {
        database.ref('word2vec/' + word).once('value').then(function (snapshot) {
            return resolve(snapshot.val());
        });
    });
}

// ===================================
// Store
// ===================================

/**
 * store descriptions, task info and user info and user answers in firebase
 * returns promise so that can transition to next task after storing
 */
function store_description(see_desc, do_desc, grid_desc, task_id, user_id, attempts, attemp_jsons, desc_time, ver_time, selected_example, type) {

    return new Promise(function (resolve, reject) {

        var batch = db.batch();
        const task_doc_ref = db.collection(type + "_tasks").doc(task_id.toString());

        const desc_id = uuidv4();

        // set actual info for description in the specific task's collection
        var desc_data = {
            'verification_attempts': parseInt(attempts),
            'attempt_jsons': attemp_jsons,

            'uid': user_id,
            'description_time': parseInt(desc_time),
            'verification_time': parseInt(ver_time),

            'num_attempts': 0,  // # listeners who used description
            'num_success': 0,   // # listeners who used description successfully
            'listener_gave_up_count': 0
        }

        if (type == "nl" || type == "nl_ex") {
            desc_data['see_description'] = see_desc;
            desc_data['do_description'] = do_desc;
            desc_data['grid_description'] = grid_desc;
        }
        if (type == "ex" || type == "nl_ex") {
            desc_data['selected_example'] = selected_example;
        }

        const desc_doc_ref = task_doc_ref.collection("descriptions").doc(desc_id);
        batch.set(desc_doc_ref, desc_data);

        // increment num_descriptions and ver_gave_up_count for task in tasks collection (not desc_gave_up_count bc they would not be submitting description, handled seperately)
        const increment = firebase.firestore.FieldValue.increment(1);

        var task_update_data = {
            num_descriptions: increment,
            num_interactions: increment
        };
        batch.update(task_doc_ref, task_update_data);

        // add to words
        const gen_summary_ref = db.collection("total").doc("summary");    // summary for all desc types
        const words = see_desc.match(/\b(\w+)\b/g).concat(do_desc.match(/\b(\w+)\b/g)).concat(grid_desc.match(/\b(\w+)\b/g));
        batch.update(gen_summary_ref, {
            'words': firebase.firestore.FieldValue.arrayUnion(...words)
        });

        //increment total num descriptions in summary ref
        const summary_ref = db.collection(type + "_tasks").doc("summary");    // summary for just this desc type
        var summary_update_data = {};
        summary_update_data[`${task_id}_interactions_count`] = increment;
        summary_update_data[`${task_id}_descriptions_count`] = increment;
        batch.update(summary_ref, summary_update_data);

        // add description to list of unused descriptions
        const unused_ref = db.collection(type + "_unused_descs").doc(desc_id);
        batch.set(unused_ref, {
            time_claimed: 0,
            task: task_id.toString()
        });

        batch.commit().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

function store_listener(desc_id, task_id, user_id, attempts, attempt_jsons, total_time, gave_up = false, type) {
    /**
     * store info for listener task in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function (resolve, reject) {

        var batch = db.batch();
        const task_doc = db.collection(type + "_tasks").doc(task_id.toString());

        // store attempt use in description doc's attempts collection
        const desc_use_ref = task_doc.collection("descriptions").doc(desc_id).collection("uses").doc();
        batch.set(desc_use_ref, {
            'attempts': attempts,
            'attemp_jsons': attempt_jsons,
            'gave_up': gave_up,

            'uid': user_id,
            'time': parseInt(total_time)
        });

        // increment number interactions for task
        const increment = firebase.firestore.FieldValue.increment(1);
        batch.update(task_doc, {
            num_interactions: increment
        });

        // increment the description's number of attempts and number of times the listener gave up (if they gave up)
        // TODO: What counts as a success? Currently just if they do not give up.
        const desc_doc = task_doc.collection("descriptions").doc(desc_id);
        var desc_update_data = { num_attempts: increment };
        if (gave_up) {
            desc_update_data['listener_gave_up_count'] = increment;
        } else {
            desc_update_data['num_success'] = increment;
        }
        batch.update(desc_doc, desc_update_data);

        // increment the total number of attempts
        const summary_doc = db.collection(type + "_tasks").doc("summary");
        var summary_data = {};
        summary_data[`${task_id}_interactions_count`] = increment;
        batch.update(summary_doc, summary_data);

        // remove the description from the list of unused descriptions
        const unused_ref = db.collection(type + "_unused_descs").doc(desc_id);
        batch.delete(unused_ref);

        batch.commit().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

/**
 * Claim an unused description if it has not been claimed (or if that claim has expired)
 * (a claim ensures that an unused description only forces 1 attempt, and the time is to make sure
 *      there is no issue if someone claims it and never finishes)
 */
function claim_unused_desc(desc_id, type) {
    return new Promise(function (resolve, reject) {
        const desc_ref = db.collection(type + "_unused_descs").doc(desc_id);
        return db.runTransaction(function (transaction) {
            // This code may get re-run multiple times if there are conflicts.
            return transaction.get(desc_ref).then(function (doc) {
                if (!doc.exists) {
                    throw "Trying to claim an unused description that does not exist!";
                }

                const cur_date = Math.floor(Date.now() / 1000);
                const time_to_wait = 60 * 10; // 10 minutes

                if (cur_date - time_to_wait < doc.data().time_claimed) {
                    throw `Description for task ${doc.data().task} has already been claimed!`
                }

                transaction.update(desc_ref, { time_claimed: cur_date });
            });
        }).then(function () {
            console.log("Transaction successfully committed!");
            return resolve();
        }).catch(function (error) {
            return reject(error);
        });
    });
}

/**
 * Store user demographic information
 */
function set_user_info(user_id, age, gender, type) {
    db.collection("users").doc(user_id.toString()).set({
        'user_id': user_id,
        'age': age,
        'gender': gender,
        'type_tasks': type
    }).then(function () {
        console.log("set user info successfully");
    }).catch(function (err) {
        console.error(err);
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
            console.error(err);
        });
}

/**
 * increment the number of times the user gave up while trying to describe the task
 */
function give_up_description(task_id, type) {

    return new Promise(function (resolve, reject) {
        const increment = firebase.firestore.FieldValue.increment(1);

        const task_doc_ref = db.collection(type + "_tasks").doc(task_id.toString());
        task_doc_ref.update({
            desc_gave_up_count: increment
        }).then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
    });
}

// ===================================
// Initialize
// ===================================

function init_firestore() {
    /**
     * Just sets 0 value to all tasks in db. 
     * Be careful! It will overwrite everything.
     */
    console.log("Starting initialization...");
    var summary_data = {};

    db.collection('total').doc('summary').set({
        'words': []
    }).then(function () {
        console.log("Initialized words in Firestore.")

        // store counts of interactions and descriptions for each description type for bandit algorithm
        for (i = 0; i < NUM_TASKS; i++) {
            summary_data[`${i}_interactions_count`] = 0;
            summary_data[`${i}_descriptions_count`] = 0;
        }

        return db.collection("nl_tasks").doc("summary").set(summary_data);
    }).then(function () {
        console.log("Initialized nl summary in Firestore.");
        return db.collection("nl_ex_tasks").doc("summary").set(summary_data);
    }).then(function () {
        console.log("Initialized nl_ex summary in Firestore.");
        return db.collection("ex_tasks").doc("summary").set(summary_data);
    }).then(function () {
        console.log("Initialized ex summary in Firestore.");

        var batch = db.batch();
        for (task_num = 0; task_num < NUM_TASKS; task_num++) {
            const task_data = {
                'num_descriptions': 0,
                'num_interactions': 0,
                'desc_gave_up_count': 0
            }
            batch.set(db.collection("nl_tasks").doc(task_num.toString()), task_data);
        }
        return batch.commit();

    }).then(function () {
        console.log("Initialized all nl tasks in Firestore.");

        var batch = db.batch();
        for (task_num = 0; task_num < NUM_TASKS; task_num++) {
            const task_data = {
                'num_descriptions': 0,
                'num_interactions': 0,
                'desc_gave_up_count': 0
            }
            batch.set(db.collection("nl_ex_tasks").doc(task_num.toString()), task_data);
        }
        return batch.commit();

    }).then(function () {
        console.log("Initialized all nl_ex tasks in Firestore.");

        var batch = db.batch();
        for (task_num = 0; task_num < NUM_TASKS; task_num++) {
            const task_data = {
                'num_descriptions': 0,
                'num_interactions': 0,
                'desc_gave_up_count': 0
            }
            batch.set(db.collection("ex_tasks").doc(task_num.toString()), task_data);
        }
        return batch.commit();

    }).then(function () {
        console.log("Initialized all ex tasks in Firestore.");
        console.log("Initialized Firestore!");
    }).catch(error => {
        console.error("Error intializing Firestore: ", error);
    });
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
        console.error("Failed getting data.");
        return reject(error);
    });
}