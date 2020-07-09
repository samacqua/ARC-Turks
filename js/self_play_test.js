const urlParams = new URLSearchParams(window.location.search);
const task = urlParams.get('task');
const see_desc = urlParams.get('see');
const do_desc = urlParams.get('do');
const grid_desc = urlParams.get('grid');

$(window).on('load',function(){
    $('#error_display').hide();
    $('#info_display').hide();

    $('#instructionsModal').modal('show');

    // load task and descriptions
    loadTask(task);
    $("#see_p").text(see_desc);
    $("#do_p").text(do_desc);
    $("#grid_size_p").text(grid_desc);
});

function check_grid() {
    /**
     * checks if output is correct. If so and completed enough tasks, move on to actual task
     */
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
    $("#exitModal").modal("show");
}

function finish_self_play() {
    /**
     * pass info to next
     */
    // s is speaker tasks done, l is listener tasks done
    sessionStorage.setItem('s', 0);
    sessionStorage.setItem('l', 0);

    // so when calling includes() is not null (no task '400')
    sessionStorage.setItem('speaker_tasks_complete', '');

    next_task();
}