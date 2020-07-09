var START_DATE;
var ATTEMPT_JSONS = [];
var GAVE_UP = false;

const uid = sessionStorage.getItem('uid');
const age = sessionStorage.getItem('age');
const gender = sessionStorage.getItem('gender');
const listener_tasks_done = sessionStorage.getItem('l');
const speaker_tasks_done = sessionStorage.getItem('s');

$(window).on('load',function(){
    START_DATE = new Date();

    $('#error_display').hide();
    $('#info_display').hide();
    $('#instructionsModal').modal('show');

    if (listener_tasks_done + speaker_tasks_done == 10) {
        retrieve_own_description();
        return;
    }

    random_listen_retrieve(5);
});

function retrieve_own_description() {
    TASK_ID = sessionStorage.getItem('val_task');

    $("#see_p").text(sessionStorage.getItem('val_see'));
    $("#do_p").text(sessionStorage.getItem('val_do'));
    $("#grid_size_p").text(sessionStorage.getItem('val_grid'));

    loadTask(TASK_ID);
}


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

    if (ATTEMPT_JSONS.length > 1 || GAVE_UP) {
        if (GAVE_UP) {
            $("#description_critique_label").text("You gave up/could not create the correct output. What was wrong about the description?")
        }
        $("#task_qs_modal").modal('show');
        return;
    }

    const see_desc = $.trim($("#see_p").text());
    const do_desc = $.trim($("#do_p").text());
    const grid_desc = $.trim($("#grid_size_p").text());

    store_listener(DESC_ID, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, age, gender)
    .then(function() {next_task();})
    .catch(function(error) {console.log("Error storing response: " + error);});
}

function exit_task_qs() {
    /**
     * If they were presented with this modal, they either gave up or took multiple attempts
     * So, store why they got it wrong
     */
    const see_desc = $.trim($("#see_p").text());
    const do_desc = $.trim($("#do_p").text());
    const grid_desc = $.trim($("#grid_size_p").text());

    const desc_critique = $.trim($('#desc_critique').val());
    console.log(desc_critique);

    store_listener(DESC_ID, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, age, gender, description_critique=desc_critique, gave_up=GAVE_UP)
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
        errorMsg("Please try to figure out the pattern for a bit before you give up.");
        return;
    }

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