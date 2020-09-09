var START_DATE;
var ATTEMPT_JSONS = [];
var GAVE_UP = false;

const uid = sessionStorage.getItem('uid');

$(window).on('load',function(){
    // get date to check they are trying before giving up
    START_DATE = new Date();

    // get progress bar completion
    update_progress_bar();

    // show initial instructions
    $('#instructionsModal').modal('show');

    // hide description column and validation column
    $("#description_col").css("visibility", "hidden");
    $("#validation-col").css("visibility", "hidden");

    // get speaker task
    random_speaker_retrieve().then(function(task_id) {
        loadTask(task_id);
    }).catch(error => {
        errorMsg("Failed to load task. Please ensure your internet connection and try again.");
    });
});

$(document).ready(function(){
    /**
     * Make it so modal with sliders has labels of slider values
     */
    $("#conf_result").html($("#conf_form").val());
    $("#conf_form").change(function(){
        $("#conf_result").html($(this).val());
    });
});  

function continue_to_verify() {
    /**
     * If starting with right phrase and actually entered text, then unhide validation
     */

    $("#description_col").css("opacity", "0.6");

    $("#validation-col").css("visibility", "visible");
    $(".desc-buttons").css("visibility", "hidden");

    $("#objective-text").text("Apply the same pattern that you recognized to the new input grid.");

    $("#selectExampleIO").attr('disabled', true);
}

function continue_to_description() {

    $(".io-buttons").css("visibility", "hidden");
    $("#io_ex_col").css("opacity", "0.6");

    $("#objective-text").text("Choose the best input-output example to pass on so that someone, given a new input grid, could create the correct output. If you realize you do not know the pattern, you can still press 'Give up.'");
    $("#description_col").css("visibility", "visible");
}

function check() {
    /**
     * check if output grid same as correct answer. if so, ask more questions about task
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

    $("#task_qs_modal").modal('show');
}

function exit_task_qs() {
    /**
     * store submitted values and go to next task
     */

    infoMsg("All done! Loading next task...")

    const newTime = new Date();
    const totalTime = (newTime - START_DATE) / 1000;

    store_description("", "", "", TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, conf, totalTime, selected_example, gave_up_verification=GAVE_UP)
        .then(function() { next_task(); })
        .catch(function(error) { console.log('Error storing response ' + error); });
}

function give_up() {
    /**
     * if after 1 minute, cannot figure out pattern or get correct output, give them the answer
     */

    const newTime = new Date();
    console.log((newTime - START_DATE)/1000);
    if ((newTime - START_DATE)/1000 < 30) {
        errorMsg("Please try to figure out the pattern for at least thirty seconds before you give up.");
        return;
    }

    // different if gives up writing description vs solving task
    if ( $('#validation-col').css('display') == 'none' || $('#validation-col').css("visibility") == "hidden"){
        for (var i = 0; i < 8; i++) {
            var pairSlot = $('#pair_preview_' + i);
            var jqInputGrid = pairSlot.find('.input_preview');
            var jqArrow = pairSlot.find('.arrow');
            var jqOutputGrid = pairSlot.find('.output_preview');
            jqInputGrid.empty();
            // TODO: fix arrows and put when submitting
            // jqArrow.empty();
            jqOutputGrid.empty();
        }

        infoMsg("You have given up. You will now be given a new task.");

        // make sure they are next given a listening task, and store that they gave up.
        give_up_description(TASK_ID)
        .then(function () {
            next_task();
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        GAVE_UP = true;
        infoMsg("You have given up. The output grid now has the correct answer. Press 'check' to submit this correct answer.");
        const answer = convertSerializedGridToGridObject(TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output']);    
        showAnswer(answer);
    }
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