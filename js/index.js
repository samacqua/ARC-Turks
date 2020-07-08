const TASKS = [54, 4, 345];

$(window).on('load',function(){
    $('#error_display').hide();
    $('#info_display').hide();

    $('#consentModal').modal('show');

    loadTask(TASKS.shift());
});

var TASKS_COMPLETED = 0;

function check_grid() {
    syncFromEditionGridToDataGrid();
    console.log(TEST_PAIRS);
    console.log(CURRENT_TEST_PAIR_INDEX);
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
    TASKS_COMPLETED++;

    if (TASKS_COMPLETED >= 3) {
        $("#done_modal").modal("show");
    }

    infoMsg("Correct! Solve " + (3 - TASKS_COMPLETED).toString() + " more problems.");

    resetOutputGrid();
    // breaks if you don't reset array
    TEST_PAIRS = new Array();

    loadTask(TASKS.shift());
}

function give_up() {
    const answer = convertSerializedGridToGridObject(TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output']);
    showAnswer(answer);
}

function showAnswer(grid) {
    CURRENT_OUTPUT_GRID = grid;
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}