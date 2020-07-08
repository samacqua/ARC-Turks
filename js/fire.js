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
var fbase = firebase.database();


function store_response_speaker(see_desc, do_desc, grid_desc, task_id, user_id, attempts, age, gender, pattern_dif, desc_diff, conf) {
    /**
     * store descriptions, task info and user info and user answers in firebase
     */
    let ref_loc = `speaker/${task_id}/${user_id}`;
    var ref = fbase.ref(ref_loc);

    let to_put = {
        'see_description' : see_desc,
        'do_description' : do_desc,
        'grid_description' : grid_desc,
        'attempts' : attempts,
        'age' : age,
        'gender' : gender,
        'pattern_difficulty' : pattern_dif,
        'description_difficulty' : desc_diff,
        'confidence' : conf
    }
    ref.once("value", function(snapshot) {
        ref.set(to_put);
    });

    // also store easily retrievable descriptions
    let rand_id = Math.floor(Math.random()*1e10);
    let new_ref_loc = `descriptions/${rand_id}`;

    var new_ref = fbase.ref(new_ref_loc);
    let new_to_put = {
        'see_description' : see_desc,
        'do_description' : do_desc,
        'grid_description' : grid_desc,
        'task' : task_id,
        'uid' : user_id
    }
    new_ref.once("value", function(snapshot) {
        new_ref.set(new_to_put);
    });
}

function random_listen_retrieve() {
    /**
     * retrieve the task and description that has already been described
     */
    let ref_loc = fbase.ref(`descriptions`);

    ref_loc.once('value').then(function(snapshot) {
      data = snapshot.val();

        a = 0;
        snapshot.forEach(function(childSnapshot) {
            // just choosing first for now, NEED TO MAKE RANDOM ?
            if (a<1) {
                var key = childSnapshot.key;
                var childData = childSnapshot.val();

                const see_desc = childData.see_description;
                const do_desc = childData.do_description;
                const grid_desc = childData.grid_description;
                var task_index = childData.task;
                TASK_ID = task_index;

                $("#see_p").text(see_desc);
                $("#do_p").text(do_desc);
                $("#grid_size_p").text(grid_desc);
                loadTask(task_index);
                a++;
            }
        });
    });
}

function store_listener(see_desc, do_desc, grid_desc, task_id, user_id, attempts, age, gender) {
    /**
     * store info for listener task in firebase
     */
    let ref_loc = `listener/${task_id}/${user_id}`;

    var ref = fbase.ref(ref_loc);
    let to_put = {
        'see_description' : see_desc,
        'do_description' : do_desc,
        'grid_description' : grid_desc,
        'attempts' : attempts,
        'age' : age,
        'gender' : gender
    }
    ref.once("value", function(snapshot) {
        ref.set(to_put);
    });
}