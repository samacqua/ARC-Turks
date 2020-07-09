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

function store_response_speaker(see_desc, do_desc, grid_desc, task_id, user_id, attempts, age, gender, pattern_dif, desc_diff, conf) {
    /**
     * store descriptions, task info and user info and user answers in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {

        db.collection(task_id.toString()).add({
            'see_description' : see_desc,
            'do_description' : do_desc,
            'grid_description' : grid_desc,
            'attempts' : parseInt(attempts),
            'age' : parseInt(age),
            'gender' : parseInt(gender),
            'pattern_difficulty' : parseInt(pattern_dif),
            'description_difficulty' : parseInt(desc_diff),
            'confidence' : parseInt(conf),
            'uid' : parseInt(user_id),
            'num_descriptions' : 0
        }).then(function(docRef) {
            db.collection("tasks").doc(task_id.toString()).set({
                num_descriptions: 0,
                score: 1
            }).then(function() {
                console.log("Document successfully written!");
                return resolve();
            })
            .catch(function(error) {
                console.error("Error writing document: ", error);
                return reject();
            });
        })
        .catch(function(error) {
            console.error("Error adding document: ", error);
            return reject();
        });
    });
}

function random_listen_retrieve(task_id) {
    /**
     * retrieve the task and description that has already been described
     */
    var tasks_ref = db.collection("tasks");
    tasks_ref.orderBy("num_descriptions").limit(5);

    const rand_selection = Math.floor(Math.random()*5);

     tasks_ref.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            console.log(doc.id, " => ", doc.data());
            TASK_ID = doc.id;

            db.collection(doc.id.toString()).get().then(function(querySnapshot) {
                var i = 0;
                querySnapshot.forEach(function(doc2) {
                    // doing it this way so that if less than the number you limit the query to, does not through an error
                    if (i == rand_selection+1) {
                        return;
                    }
                    DESC_ID = doc2.id;

                    // doc.data() is never undefined for query doc snapshots
                    console.log(doc2.id, " => ", doc2.data());
                    var childData = doc2.data();

                    const see_desc = childData.see_description;
                    const do_desc = childData.do_description;
                    const grid_desc = childData.grid_description;
    
                    $("#see_p").text(see_desc);
                    $("#do_p").text(do_desc);
                    $("#grid_size_p").text(grid_desc);
                    loadTask(TASK_ID);
                });
            });
        });
    });
}

function store_listener(desc_id, see_desc, do_desc, grid_desc, task_id, user_id, attempts, age, gender) {
    /**
     * store info for listener task in firebase
     * returns promise so that can transition to next task after storing
     */
    return new Promise(function(resolve, reject) {
        db.collection(task_id.toString()).doc(desc_id).collection("description_attempts").add({
            'see_description' : see_desc,
            'do_description' : do_desc,
            'grid_description' : grid_desc,
            'attempts' : attempts,
            'age' : age,
            'gender' : gender
        }).then(function(docRef) {
            console.log("Document written with ID: ", docRef.id);
            // db.collection("tasks").doc(task_id.toString())
            return resolve();
        })
        .catch(function(error) {
            console.error("Error adding document: ", error);
            return reject();
        });
    });
}