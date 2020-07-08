var START_DATE;
var ATTEMPTS = 0;

const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');
const age = urlParams.get('age');
const gender = urlParams.get('gender');
const s = urlParams.get('s');
const l = urlParams.get('l');

$(window).on('load',function(){
    START_DATE = new Date();

    $('#error_display').hide();
    $('#info_display').hide();
    $('#instructionsModal').modal('show');

    random_listen_retrieve(TASK_ID);
});


function check() {
    /**
     * check if output grid same as correct answer. if so, store info and move to next task
     */

    ATTEMPTS++;

    syncFromEditionGridToDataGrid();
    reference_output = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output'];
    submitted_output = CURRENT_OUTPUT_GRID.grid;

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

    const see_desc = $.trim($("#see_p").text());
    const do_desc = $.trim($("#do_p").text());
    const grid_desc = $.trim($("#grid_size_p").text());

    store_listener(DESC_ID, see_desc, do_desc, grid_desc, TASK_ID, uid, ATTEMPTS, age, gender)
        .then(function() {next_task(s, l, age, gender, uid);})
        .catch(function() {console.log("error");});
}

function give_up() {
    /**
     * if after 1 minute, cannot figure out pattern or get correct output, give them the answer
     */
    // const newTime = new Date();
    // console.log((newTime - START_DATE)/1000);
    // if ((newTime - START_DATE)/1000 < 30) {
    //     errorMsg("Please try to figure out the pattern for a bit before you give up.");
    //     return;
    // }

    const answer = convertSerializedGridToGridObject(TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output']);

    console.log(answer);
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