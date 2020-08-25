var START_DATE;
var ATTEMPT_JSONS = [];
var GAVE_UP = false;

const uid = sessionStorage.getItem('uid');
const listener_tasks_done = parseInt(sessionStorage.getItem('l'));
const speaker_tasks_done = parseInt(sessionStorage.getItem('s'));

$(window).on('load',function(){
    // get date for making sure they try before giving up
    START_DATE = new Date();

    // show progress bar completion
    update_progress_bar();

    // get listening task
    random_listen_retrieve(TOTAL_TASKS_TO_COMPLETE);

    // show initial instructions
    $('#instructionsModal').modal('show');
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
    store_listener(DESC_ID, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, totalTime, gave_up=GAVE_UP)
        .then(function() {next_task();})
        .catch(function(error) {console.log("Error storing response: " + error);});
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

    infoMsg("You have given up. The output grid now has the correct answer. Press 'check' to submit this correct answer.");

    GAVE_UP = true;
    const answer = convertSerializedGridToGridObject(TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output']);

    showAnswer(answer);
    START_DATE = new Date();
}

function showAnswer(grid) {
    /**
     * set output grid to right answer
     */
    CURRENT_OUTPUT_GRID = grid;
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}