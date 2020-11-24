var START_DATE;
var ATTEMPT_JSONS = [];

var DESC_ID;

var IS_VERIFICATION;
var uid;
var maxIdleTime = 0;

var TIMING_CREDIT;

$(window).on('load', function () {
    uid = sessionStorage.getItem('uid') || uuidv4() + "dev";
    // get date for making sure they try before giving up
    START_DATE = new Date();

    const isMTurk = sessionStorage.getItem('mturk');
    if (isMTurk == 'false') {
        console.log('Using DEV Database');
        use_dev_config();
    } else {
        console.log("Using MTURK Database");
    }

    // show progress bar completion
    size_progress_bar();
    update_progress_bar();

    // get listening task
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const task = urlParams.get('task') || TASKS[Math.floor(Math.random() * NUM_TASKS)].toString();
    const desc_id = urlParams.get('id');
    IS_VERIFICATION = (urlParams.get('ver') == 'true');
    if (desc_id == null && !IS_VERIFICATION) {
        errorMsg("You must provide a description id in the URL");
        throw  "You must provide a description id in the URL";
    }

    DESC_ID = desc_id;
    TASK_ID = task;
    loadTask(task);

    DESCRIPTIONS_TYPE = sessionStorage.getItem('type') || "nl";

    switch (DESCRIPTIONS_TYPE) {
        case "nl":
            $("#examples_area").remove();
            break;
        case "nl_ex":
            break;
        case "ex":
            break;
        default:
            break;
    }

    // if using their own description as a verification for that description, load it from urlparams
    // if not, load from DB and give instructions
    if (IS_VERIFICATION) {
        maxIdleTime = parseInt(urlParams.get('maxIdle')) || 0;

        const grid_desc = urlParams.get('grid') || "";
        const see_desc = urlParams.get('see') || "";
        const do_desc = urlParams.get('do') || "";
        const selected_example = urlParams.get('se') || "0";
        SELECTED_EXAMPLE = selected_example;

        sessionStorage.setItem('done_speaker_task', true);

        $("#grid_size_p").text(grid_desc);
        $("#see_p").text(see_desc);
        $("#do_p").text(do_desc);

        $("#objective-text").text("Use the description you just wrote to create the correct output for the new input.");
        $('#verInstructionsModal').modal('show');
    } else {
        get_description_by_id(task, desc_id, DESCRIPTIONS_TYPE).then(description => {
            SELECTED_EXAMPLE = description.selected_example;
            loadTask(task);

            if (description.see_description == "") {
                $("#grid_size_p").text("This description has no language. Use just the shown example to guess the output.");
                $("#see_p").text("");
                $("#do_p").text("");
            } else {
                $("#grid_size_p").text(description.grid_desc);
                $("#see_p").text(description.see_desc);
                $("#do_p").text(description.do_desc);
            }
        }).catch(error => {
            console.error(error);
            errorMsg("Failed to load the task. Please ensure your internet connection and try again.");
        });
        set_instructions_modal(DESCRIPTIONS_TYPE);
        $('#instructionsModal').modal('show');
    }

    // add to list of tasks completed , so we don't give same task
    var tasks_done = (sessionStorage.getItem('tasks_completed') || "").split(',');
    tasks_done.push(TASK_ID);
    sessionStorage.setItem('tasks_completed', tasks_done);

    // get timing data for the task to determine amount towards completion
    TIMING_CREDIT = IS_VERIFICATION ? SPEAKER_TIME : BUILDER_TIME;
    let all_past_times = [];
    get_timing_doc(DESCRIPTIONS_TYPE).then(timing_doc => {
        $.timing_doc(timing_doc, function(key, value) {
            if (IS_VERIFICATION) {
                if (key.includes(TASK_ID.toString() && key.includes("desc"))) {
                    all_past_times.push(value);
                }
            } else {
                if (key.includes(TASK_ID.toString() && key.includes("attempts"))) {
                    all_past_times.push(...value);
                }
            }
        });

        TIMING_CREDIT = weight_timing(all_past_times, TIMING_CREDIT, summed=false);
    }).catch(error => {
        console.error("Error getting past description timing: ", error);
    });

});

$(document).ready(function () {
    //  Make it so modal with sliders has labels of slider values
    $("#conf_result").html($("#conf_form").val());
    $("#conf_form").change(function(){
        $("#conf_result").html($(this).val());
    });
});

// get the max amount of time doing nothing (to nearest 5 seconds)
var idleTime = 0;
$(document).ready(function () {
    //Increment the idle time counter every 5 seconds.
    var resolution = 5;
    var idleInterval = setInterval(function() { idleTime += resolution; }, resolution*1000);

    //Zero the idle timer on mouse movement.
    $(this).mousemove(function (e) {
        if (idleTime > maxIdleTime) {
            maxIdleTime = idleTime;
        }
        idleTime = 0;
    });
    $(this).keypress(function (e) {
        if (idleTime > maxIdleTime) {
            maxIdleTime = idleTime;
        }
        idleTime = 0;
    });
    $(this).click(function (e) {
        if (idleTime > maxIdleTime) {
            maxIdleTime = idleTime;
        }
        idleTime = 0;
    });
});

function set_instructions_modal(desc_type) {
    switch (desc_type) {
        case "nl":
            $("#instruction_reminder").text("For this task, you will do exactly what you did in the practice tasks: use a description to create a grid.");
            break;
        case "nl_ex":
            $("#instruction_reminder").text("For this task, you will do exactly what you did in the practice tasks: use a description and an example translation to create a grid.");
            break;
        case "ex":
            $("#instruction_reminder").text("For this task, you will do exactly what you did in the practice tasks: use an example of a pattern to create a grid.");
            break;
        default:
            break;
    }
}

var SENDING_TO_NEXT = false;    // while waiting for async calls, don't let user submit multiple times
function check() {
    /**
     * check if output grid same as correct answer. if so, store info and move to next task
     */
    if (SENDING_TO_NEXT == true) {
        return;
    }
    syncFromEditionGridToDataGrid();
    reference_output = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output'];
    submitted_output = CURRENT_OUTPUT_GRID.grid;

    for (i=0;i<ATTEMPT_JSONS.length;i++) {
        if (ATTEMPT_JSONS[i] == JSON.stringify(submitted_output)) {
            errorMsg("You have already tried this grid. Try a different output before checking your answer.");
            return;
        }
    }

    // have to store as json string bc firebase cannot store nested arrays
    ATTEMPT_JSONS.push(JSON.stringify(submitted_output));

    if (reference_output.length != submitted_output.length || reference_output[0].length != submitted_output[0].length) {
        errorMsg(`Wrong answer. Try again. You have ${MAX_ATTEMPTS_BUILDER - ATTEMPT_JSONS.length} attempts left.`);
        ATTEMPTS_SEQUENCE.push(["check", false]);
            // used all attempts
        if (ATTEMPT_JSONS.length == MAX_ATTEMPTS_BUILDER) {
            SENDING_TO_NEXT = true;
            used_all_attempts();
        }
        return
    }

    for (var i = 0; i < reference_output.length; i++) {
        ref_row = reference_output[i];
        for (var j = 0; j < ref_row.length; j++) {
            if (ref_row[j] != submitted_output[i][j]) {
                errorMsg(`Wrong answer. Try again. You have ${MAX_ATTEMPTS_BUILDER - ATTEMPT_JSONS.length} attempts left.`);
                ATTEMPTS_SEQUENCE.push(["check", false]);
                    // used all attempts
                if (ATTEMPT_JSONS.length == MAX_ATTEMPTS_BUILDER) {
                    SENDING_TO_NEXT = true;
                    used_all_attempts();
                }
                return;
            }
        }
    }

    ATTEMPTS_SEQUENCE.push(["check", true]);

    SENDING_TO_NEXT = true;
    infoMsg("Correct!");

    const newDate = new Date();
    const build_time = (newDate - START_DATE) / 1000;

    if (IS_VERIFICATION) {
        $("#speaker_certainty_modal").modal('show');
    } else {

        show_loader();

        get_description_by_id(TASK_ID, DESC_ID, DESCRIPTIONS_TYPE).then(desc_to_update => {
            get_task_best_desc(TASK_ID, DESCRIPTIONS_TYPE).then(task_best => {

                const priors = [1, 1];
                let a = task_best.success_score + priors[0];
                let b = (task_best.attempts - task_best.success_score) + priors[1];
    
                let mean = a / (a + b);
                task_best.mean = mean;

                console.log(a, b);
                console.log(mean, task_best);
    
                store_listener(DESC_ID, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, JSON.stringify(ATTEMPTS_SEQUENCE), build_time, success = true, DESCRIPTIONS_TYPE, maxIdleTime, task_best, desc_to_update)
                .then(function () { 
                    set_user_complete_time(uid, build_time, `${TASK_ID}_${DESCRIPTIONS_TYPE}_listener`).then(function() {
                        next_task(TIMING_CREDIT); 
                    }).catch(function (error) { console.error('Error storing response ' + error); });
                })
                .catch(function (error) { console.error("Error storing response: " + error); });
    
            }).catch(err => {
                console.error(err);
            });

        });
    }
}

function submit_description() {

    const newDate = new Date();
    const verification_time = (newDate - START_DATE) / 1000;
            
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const grid_desc = urlParams.get('grid') || "";
    const see_desc = urlParams.get('see') || "";
    const do_desc = urlParams.get('do') || "";
    const desc_time = parseInt(urlParams.get('time') || "0");

    const total_time = verification_time + desc_time;

    var conf = parseInt($('#conf_form').val().trim());

    show_loader();

    if (conf <= MIN_CONFIDENCE) {
        store_failed_ver_description(see_desc, do_desc, grid_desc, TASK_ID, uid, conf, ATTEMPT_JSONS.length, ATTEMPT_JSONS, JSON.stringify(ATTEMPTS_SEQUENCE), desc_time, verification_time, SELECTED_EXAMPLE, DESCRIPTIONS_TYPE, maxIdleTime)
        .then(function () { 
            set_user_complete_time(uid, total_time, `${TASK_ID}_${DESCRIPTIONS_TYPE}_speaker_(low_conf)`).then(function() {
                next_task(TIMING_CREDIT);
            }).catch(function (error) { console.error('Error storing response ' + error); });
        })
        .catch(function (error) { console.error('Error storing response ' + error); });
    } else {
        store_description(see_desc, do_desc, grid_desc, TASK_ID, uid, conf, ATTEMPT_JSONS.length, ATTEMPT_JSONS, JSON.stringify(ATTEMPTS_SEQUENCE), desc_time, verification_time, SELECTED_EXAMPLE, DESCRIPTIONS_TYPE, maxIdleTime)
        .then(function () {
            set_user_complete_time(uid, total_time, `${TASK_ID}_${DESCRIPTIONS_TYPE}_speaker`).then(function() {
                next_task(TIMING_CREDIT);
            }).catch(function (error) { console.error('Error storing response ' + error); });
        })
        .catch(function (error) { console.error('Error storing response ' + error); });
    }
}

function used_all_attempts() {
    const build_time = ((new Date()) - START_DATE) / 1000;
    errorMsg("Wrong answer. You have used all of your attempts. Bringing you to your next task...");

    show_loader();

    if (IS_VERIFICATION) {
                    
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
    
        const grid_desc = urlParams.get('grid') || "";
        const see_desc = urlParams.get('see') || "";
        const do_desc = urlParams.get('do') || "";
        const desc_time = parseInt(urlParams.get('time') || "0");
    
        store_failed_ver_description(see_desc, do_desc, grid_desc, TASK_ID, uid, null, ATTEMPT_JSONS.length, ATTEMPT_JSONS, JSON.stringify(ATTEMPTS_SEQUENCE), desc_time, build_time, SELECTED_EXAMPLE, DESCRIPTIONS_TYPE, maxIdleTime)
        .then(function () {
            set_user_complete_time(uid, desc_time+build_time, `${TASK_ID}_${DESCRIPTIONS_TYPE}_speaker_(fail)`).then(function() {
                next_task(TIMING_CREDIT*SPEAKER_FAIL_PART_CRED);
            }).catch(function (error) { console.error('Error storing response ' + error); });
        })
    .catch(function (error) { console.error('Error storing response ' + error); });
    } else {
        get_description_by_id(TASK_ID, DESC_ID, DESCRIPTIONS_TYPE).then(desc_to_update => {
            get_task_best_desc(TASK_ID, DESCRIPTIONS_TYPE).then(task_best => {
                const priors = [1, 1];
                let a = task_best.success_score + priors[0];
                let b = task_best.attempts - task_best.success_score + priors[1];
    
                let mean = a / (a + b);
                task_best.mean = mean;

                store_listener(DESC_ID, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, JSON.stringify(ATTEMPTS_SEQUENCE), build_time, success = false, DESCRIPTIONS_TYPE, maxIdleTime, task_best, desc_to_update)
                .then(function () { 
                    set_user_complete_time(uid, build_time, `${TASK_ID}_${DESCRIPTIONS_TYPE}_listener_(fail)`).then(function() {
                        next_task(TIMING_CREDIT); 
                    }).catch(function (error) { console.error('Error storing response ' + error); });
                })
                .catch(function (error) { console.error("Error storing response: " + error); });
            }).catch(err => {
                console.error(err);
            });

        });
    }
}
