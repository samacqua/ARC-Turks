var DESC_ID;

var firebaseConfig = {
    apiKey: "AIzaSyBdfMmpKXXHuWU3769Y8Uem89ti78YQf-M",
    authDomain: "arc-language-pilot.firebaseapp.com",
    databaseURL: "https://arc-language-pilot.firebaseio.com",
    projectId: "arc-language-pilot",
    storageBucket: "arc-language-pilot.appspot.com",
    messagingSenderId: "429799263295",
    appId: "1:429799263295:web:993ba49e3d3b2761e47c8a",
    measurementId: "G-7VPWXQHJ14"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

/*
DATABASE STRUCTURE:

Collections:            tasks                                         all_descriptions                              0, 1, 2 ... 399 (collection for each task)
                    
Documents:       0  1   2   ...   399                                   all desc_ids                                        desc_ids (for that task)

Fields:     num_descriptions, ver_gave_up_count                      num_uses, task_num                        age, gender, confidence, num_uses, listener_gave_up_count
                desc_gave_up_count                            see_description, do_description              do_description, see_description, grid_description, verification_attempts,
                                                                       grid_description                             attempt_jsons, task_num, uid, gave_up_verification

Sub-collection:                                                                                                                 description_uses

Documents:                                                                                                                        desc_use_ids

Fields:                                                                                                         attempts, attempt_jsons, age, gender, uid, gave_up,
                                                                                                                                description_critique

Purpose of each Collection:
    tasks - Used to get the speaking task (through num_descriptions), and also gives general idea of difficulty 
        of understanding that task (through ver_gave_up_count and desc_gave_up_count). Can easily sort based on num_descriptions
        to make sure that we choose a task that needs descriptions. Can also use this to remove some tasks that we do not want to bother with.
    all_descriptions - Used to get the listening task. Can easily sort based on num_uses to find the description that needs use. 
        The task_num and  descriptions are all there so that can achieve it in 1 query.
    0,1,2...399 - where bulk of info is stored. The info for all the task descriptions, and the uses of those descriptions, is stored in these collections. 
        Bc of Firestore Collection-Document Structure, the ver_gave_up_count and desc_gave_up_count for each task collection is not stored here.
        They are stored in the 'tasks' collection, but could also quickly compute it from the data in each task's collection.
*/

function random_speaker_retrieve(limit_size) {
    /**
     * gets the limit_size number of task ids with the least number of descriptions and shuffles em
     */

    if (sessionStorage.getItem('retrieved_speaker_tasks') == null) {    // haven't retrieved any yet
        const tasks_ref = db.collection("tasks");
        const tasks_query = tasks_ref.orderBy("num_descriptions").limit(limit_size);

        tasks_query.get().then(function(querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            var retrieved_tasks = [];

            querySnapshot.forEach(function(doc) {
                retrieved_tasks.push(doc.id);
            });

            // randomly shuffle then get first task
            shuffle(retrieved_tasks);
            TASK_ID = retrieved_tasks.pop();
            loadTask(TASK_ID);

            sessionStorage.setItem('retrieved_speaker_tasks', retrieved_tasks);
            console.log(sessionStorage.getItem('retrieved_speaker_tasks'));
        }).catch(function (error) {
            console.log("Error retrieving task: " + error);
        });
    } else {    // get from local storage
        var retrieved_tasks = sessionStorage.getItem('retrieved_speaker_tasks').split(',');

        TASK_ID = retrieved_tasks.pop();
        loadTask(TASK_ID);

        sessionStorage.setItem('retrieved_speaker_tasks', retrieved_tasks);
        console.log(sessionStorage.getItem('retrieved_speaker_tasks'));
    }
}

function random_listen_retrieve(limit_size) {
    /**
     * retrieve from the tasks that have already been described
     */

    if (sessionStorage.getItem('lis_tasks') == null) {    // haven't retrieved any yet

        const tasks_ref = db.collection("all_descriptions");
        const tasks_query = tasks_ref.orderBy("num_uses").limit(limit_size);

        tasks_query.get().then(function(querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            var retrieved_tasks_descs = [];

            querySnapshot.forEach(function(doc) {

                const data = doc.data();

                const task_desc = [data.task_num, data.see_description, data.do_description, data.grid_description, doc.id];
                retrieved_tasks_descs.push(task_desc);
            });
            shuffle(retrieved_tasks_descs);
            
            // have to be super broken up like this for ease of use with sessionStorage
            var retrieved_tasks = [];
            var see_descs = [];
            var do_descs = [];
            var grid_descs = [];
            var desc_ids = [];

            for (i=0; i < retrieved_tasks_descs.length; i++) {
                const task_desc = retrieved_tasks_descs[i];
                retrieved_tasks.push(task_desc[0]);
                see_descs.push(task_desc[1]);
                do_descs.push(task_desc[2]);
                grid_descs.push(task_desc[3]);
                desc_ids.push(task_desc[4]);
            }

            DESC_ID = desc_ids.pop();
            TASK_ID = retrieved_tasks.pop();
            loadTask(TASK_ID);

            $("#see_p").text(see_descs.pop());
            $("#do_p").text(do_descs.pop());
            $("#grid_size_p").text(grid_descs.pop());

            // bc descriptions might have commas, cannot split by comma so can't store as list, must first join with a unique character ('#')

            sessionStorage.setItem('lis_tasks', retrieved_tasks);
            sessionStorage.setItem('lis_see_desc', see_descs.join('#'));
            sessionStorage.setItem('lis_do_desc', do_descs.join('#'));
            sessionStorage.setItem('lis_grid_desc', grid_descs.join('#'));
            sessionStorage.setItem('lis_desc_ids', desc_ids);
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
        const desc_doc_ref = db.collection(task_id.toString()).doc();
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
            'task_num' : task_id,
            'num_uses' : 0,
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


        // put in all_descriptions, so that easy to query all descriptions to sort based on number of uses
        const desc_id = desc_doc_ref.id;
        const description_ref = db.collection("all_descriptions").doc(desc_id);
        batch.set(description_ref, {
            'num_uses' : 0,
            'task_num' : task_id,
            'see_description' : see_desc,
            'do_description' : do_desc,
            'grid_description' : grid_desc            
        });

        batch.commit().then(function () {
            return resolve();
        }).catch(function (err) {
            return reject(err);
        });
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
        var desc_use_ref = db.collection(task_id.toString()).doc(desc_id).collection("description_uses").doc();
        batch.set(desc_use_ref, {
            'attempts' : attempts,
            'attemp_jsons' : attempt_jsons,
            'age' : age,
            'gender' : gender,
            'uid' : user_id,
            'description_critique' : description_critique,
            'gave_up' : gave_up
        });


        // increment num_uses in all_descriptions and in description document (also gave_up_count in desc doc)
        const increment = firebase.firestore.FieldValue.increment(1);

        const task_doc_ref = db.collection("all_descriptions").doc(desc_id);
        batch.update(task_doc_ref, {
            num_uses : increment, 
        });

        var gave_up_increment = firebase.firestore.FieldValue.increment(0);
        if (gave_up) {
            gave_up_increment = increment;
        }

        const desc_doc = db.collection(task_id.toString()).doc(desc_id);
        batch.update(desc_doc, {
            num_uses : increment,
            listener_gave_up_count : gave_up_increment
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
    for (i=0; i<400; i++) {

        const exclude = [109];
        if (exclude.includes(i)) {
            console.log("excluding");
            continue;
        }

        db.collection("tasks").doc(i.toString()).set({
            'num_descriptions' : 0,
            'ver_gave_up_count' : 0,
            'desc_gave_up_count' : 0
        }).then(function () {
            console.log('another complete');
        }).catch(function (err) {
            console.log(err);
        });
    }
}