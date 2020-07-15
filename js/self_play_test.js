const urlParams = new URLSearchParams(window.location.search);
var tasks = urlParams.get('tasks').split('.');
console.log(tasks);
var see_descs = urlParams.get('see').split('~');
console.log(see_descs);
var do_descs = urlParams.get('do').split('~');
var grid_descs = urlParams.get('grid').split('~');

var START_TIME;

$(window).on('load',function(){
    $('#instructionsModal').modal('show');

    update_progress_bar(increment=false);

    // load task and descriptions
    const f_task = tasks.shift();
    console.log(f_task);
    loadTask(f_task);
    $("#see_p").text(see_descs.shift());
    $("#do_p").text(do_descs.shift());
    $("#grid_size_p").text(grid_descs.shift());
});

$(function(){
    /**
     * auto play and auto pause modal videos
     */
    $('#examples_modal').on('hidden.bs.modal', function(){
        $(this).find('video')[0].pause();
    });
    $('#examples_modal').on('shown.bs.modal', function () {
         $(this).find('video')[0].play();
      });
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

    update_progress_bar();

    if (tasks.length != 0) {
        infoMsg("Correct! Solve " + (tasks.length).toString() + " more problem.");

        // reset values
        resetOutputGrid();
        TEST_PAIRS = new Array();
        
        // load next task and descriptions
        loadTask(tasks.shift());
        $("#see_p").text(see_descs.shift());
        $("#do_p").text(do_descs.shift());
        $("#grid_size_p").text(grid_descs.shift());

        return;
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

    next_task();
}