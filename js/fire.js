// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyB8bM1G_TiLEdRzB5DLU5GIB2Y6iDc1c4Y",
    authDomain: "arc-turk-v4.firebaseapp.com",
    databaseURL: "https://arc-turk-v4.firebaseio.com",
    projectId: "arc-turk-v4",
    storageBucket: "arc-turk-v4.appspot.com",
    messagingSenderId: "792255109158",
    appId: "1:792255109158:web:97a345c5aba9b06fd32ee7",
    measurementId: "G-9LHZQKGDNH"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();


// ===================================
// Retrieve
// ===================================

/**
 * Get count of interactions for all tasks.
 */
function get_all_interactions_count() {
    return new Promise(function (resolve, reject) {
        const summary_ref = db.collection("tasks").doc("summary");
        summary_ref.get().then(function (snapshot) {

            const data = snapshot.data()
            var interactions_count = [];

            for (i=0;i<400;i++) {
                interactions_count.push(data[`${i}_interactions_count`]);
            }

            return resolve(interactions_count);
        })
        .catch(function (err) {
            return reject(err);
        });
    });
}

/**
 * Get the number of descriptions and total number of interactions for a task
 */
function get_task_descs_interactions_count(task) {
    return new Promise(function (resolve, reject) {
        const task_ref = db.collection("tasks").doc(`${task}`);
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
function get_task_descriptions(task_id, description_type="") {

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
function get_description_by_id(task_id, desc_id) {
    return new Promise(function (resolve, reject) {
        const desc_ref = db.collection("tasks").doc(`${task_id}`).collection("descriptions").doc(desc_id);

        console.log(desc_ref);

        desc_ref.get().then(function (snapshot) {
            console.log(`read ${snapshot.size} documents`);

            const data = snapshot.data();
            var description = {
                'grid_desc': data.grid_description, 
                'see_desc': data.see_description, 
                'do_desc': data.do_description,
                'selected_example': data.selected_example,
                'num_success': num_success,
                'num_attempts': data.num_attempts,
                'id': doc.id
            };

            return resolve(description);
        }).catch(error => {
            return reject(error);
        });
    });
}

/**
 * Get all words that have been used in previous descriptions.
 */
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

/**
 * store descriptions, task info and user info and user answers in firebase
 * returns promise so that can transition to next task after storing
 */
function store_description(see_desc, do_desc, grid_desc, task_id, user_id, attempts, attemp_jsons, conf, total_time, selected_example, gave_up_verification = false) {

    return new Promise(function (resolve, reject) {

        // determine the type of description  
        var didSelectExample = (selected_example != -1);
        var desc_type = "language";
        if (didSelectExample) {
            if (do_desc == see_desc == grid_desc == "") {
                desc_type = "example";
            } else {
                desc_type = "language_and_example"
            }
        }

        var batch = db.batch();
        const task_doc_ref = db.collection("tasks").doc(task_id.toString());

        // set actual info for description in the specific task's collection
        const desc_doc_ref = task_doc_ref.collection("descriptions").doc();
        batch.set(desc_doc_ref, {
            'see_description': see_desc,
            'do_description': do_desc,
            'grid_description': grid_desc,
            'selected_example': selected_example,
            'description_type': desc_type,

            'verification_attempts': parseInt(attempts),
            'gave_up_verification': gave_up_verification,
            'attempt_jsons': attemp_jsons,

            'confidence': parseInt(conf),
            'uid': parseInt(user_id),
            'time': total_time,

            'num_attempts': 0,  // # listeners who used description
            'num_success': 0,   // # listeners who used description successfully
            'listener_gave_up_count': 0
        });

        // increment num_descriptions and ver_gave_up_count for task in tasks collection (not desc_gave_up_count bc they would not be submitting description, handled seperately)
        const increment = firebase.firestore.FieldValue.increment(1);

        var task_update_data = {
            num_descriptions: increment,
            num_interactions: increment
        };
        if (gave_up_verification) {
            task_update_data[ver_gave_up_count] = increment
        }
        batch.update(task_doc_ref, task_update_data);

        //increment total num descriptions
        const summary_ref = db.collection("tasks").doc("summary");
        const words = see_desc.match(/\b(\w+)\b/g).concat(do_desc.match(/\b(\w+)\b/g)).concat(grid_desc.match(/\b(\w+)\b/g));

        var summary_update_data = {
            'words': firebase.firestore.FieldValue.arrayUnion(...words)
        };
        summary_update_data[`${task_id}_interactions_count`] = increment;

        if (didSelectExample) {
            summary_update_data['total_descriptions_with_ex_io'] = increment
        } else {
            summary_update_data['total_descriptions_no_ex_io'] = increment
        }

        batch.update(summary_ref, summary_update_data);

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
        const task_doc = db.collection("tasks").doc(task_id.toString());

        // store attempt use in description doc's attempts collection
        const desc_use_ref = task_doc.collection("descriptions").doc(desc_id).collection("uses").doc();
        console.log(task_id.toString());
        batch.set(desc_use_ref, {
            'attempts': attempts,
            'attemp_jsons': attempt_jsons,
            'gave_up': gave_up,

            'uid': user_id,
            'time': total_time
        });

        // increment number interactions for task
        const increment = firebase.firestore.FieldValue.increment(1);
        batch.update(task_doc, {
            num_interactions: increment
        });
        
        // increment the description's number of attempts and number of times the listener gave up (if they gave up)
        // TODO: What counts as a success? Currently just if they do not give up.
        const desc_doc = task_doc.collection("descriptions").doc(desc_id);
        var desc_update_data = {num_attempts: increment};
        if (gave_up) {
            desc_update_data['listener_gave_up_count'] = increment;
        } else {
            desc_update_data['num_success'] = increment;
        }
        batch.update(desc_doc, desc_update_data);

        // increment the total number of attempts
        const summary_doc = db.collection("tasks").doc("summary");
        var summary_data = {total_attempts: increment};
        summary_data[`${task_id}_interactions_count`] = increment;
        batch.update(summary_doc, summary_data);

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


    var summary_data = {
        'words': []
    }
    for (i=0;i<400;i++) { 
        summary_data[`${i}_interactions_count`] = 0
    }

    db.collection("tasks").doc("summary").set(summary_data);

    (async function loop() {
        for (task_num = 0; task_num < 400; task_num++) {
            await new Promise(function (resolve, reject) {
                console.log(task_num);

                const task_data = {
                    'num_descriptions': 0,
                    'num_interactions': 0,
                    'ver_gave_up_count': 0,
                    'desc_gave_up_count': 0
                }

                db.collection("tasks").doc(task_num.toString()).set(task_data)
                .then(function () {
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