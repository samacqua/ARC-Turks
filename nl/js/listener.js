var START_DATE;
var ATTEMPT_JSONS = [];

var DESC_ID;

var IS_VERIFICATION;

const uid = sessionStorage.getItem('uid');

$(window).on('load',function(){
    // get date for making sure they try before giving up
    START_DATE = new Date();

    // show progress bar completion
    size_progress_bar();
    update_progress_bar();

    // get listening task
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const task = urlParams.get('task');
    const desc_id = urlParams.get('id');
    IS_VERIFICATION = (urlParams.get('ver') == 'true');

    DESC_ID = desc_id;
    TASK_ID = task;
    loadTask(task);

    // if using their own description as a verification for that description, load it from urlparams
    // if not, load from DB and give instructions
    if (IS_VERIFICATION) {
        SELECTED_EXAMPLE = -1;
        const grid_desc = urlParams.get('grid');
        const see_desc = urlParams.get('see');
        const do_desc = urlParams.get('do');

        $("#grid_size_p").text(grid_desc);
        $("#see_p").text(see_desc);
        $("#do_p").text(do_desc);

        $("#objective-text").text("Use the description you just wrote to create the correct output for the new input.");
        $('#verInstructionsModal').modal('show');
    } else {
        get_description_by_id(task, desc_id).then(description => {
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
            console.log(error);
            errorMsg("Failed to load the task. Please ensure your internet connection and try again.");
        });

        if (parseInt(sessionStorage.getItem('items_complete')) == 0) {
            // show initial instructions
            $('#instructionsModal').modal('show');
        }

    }
});


function check() {
    /**
     * check if output grid same as correct answer. if so, store info and move to next task
     */
    syncFromEditionGridToDataGrid();
    reference_output = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output'];
    submitted_output = CURRENT_OUTPUT_GRID.grid;

    // have to store as json string bc firebase cannot store nested arrays
    ATTEMPT_JSONS.push(JSON.stringify(submitted_output));

    if (reference_output.length != submitted_output.length) {
        errorMsg("Wrong answer. Try again.");
        return
    }

    for (var i = 0; i < reference_output.length; i++){
        ref_row = reference_output[i];
        for (var j = 0; j < ref_row.length; j++){
            if (ref_row[j] != submitted_output[i][j]) {
                errorMsg("Wrong answer. Try again.");
                return
            }
        }
    }
    
    infoMsg("Correct!");

    const newDate = new Date();
    const totalTime = (newDate - START_DATE) / 1000;

    // add to list of tasks completed , so we don't give same task
    var tasks_done = sessionStorage.getItem('tasks_completed').split(',');
    tasks_done.push(TASK_ID);
    sessionStorage.setItem('tasks_completed', tasks_done);

    if (IS_VERIFICATION) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        const grid_desc = urlParams.get('grid');
        const see_desc = urlParams.get('see');
        const do_desc = urlParams.get('do');
        const desc_time = urlParams.get('time');

        store_description(see_desc, do_desc, grid_desc, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, desc_time, totalTime, -1)
            .then(function () { next_task(); })
            .catch(function (error) { console.log('Error storing response ' + error); });
    } else {
        store_listener(DESC_ID, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, totalTime, gave_up=false)
            .then(function() {next_task();})
            .catch(function(error) {console.log("Error storing response: " + error);});
    }
}

function give_up() {
    /**
     * if after 1 minute, cannot figure out pattern or get correct output, give them the answer
     */
    const newTime = new Date();
    console.log((newTime - START_DATE)/1000);
    if ((newTime - START_DATE)/1000 < 30) {
        errorMsg("Please try to figure out the pattern for at least 30 seconds before you give up.");
        return;
    }
    if (ATTEMPT_JSONS.length < 1) {
        errorMsg("Please try your best guess at least once before giving up.");
        return;
    }

    const newDate = new Date();
    const totalTime = (newDate - START_DATE) / 1000;

    // add to list of tasks completed , so we don't give same task
    var tasks_done = sessionStorage.getItem('tasks_completed').split(',');
    tasks_done.push(TASK_ID);
    sessionStorage.setItem('tasks_completed', tasks_done);

    // TODO: How should we handle giving up? Just go to next task w/out incrementing?
    if (IS_VERIFICATION) {
        give_up_description(TASK_ID).then(function () { next_task(first_task = true); });
    } else {
        store_listener(DESC_ID, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, totalTime, gave_up=true)
            .then(function() {next_task(first_task = true);})
            .catch(function(error) {console.log("Error storing response: " + error);});
    }
}