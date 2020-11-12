var ATTEMPT_JSONS = [];

$(window).on('load', function () {

    const task = '286';

    TASK_ID = task;
    loadTask(task);

    $("#examples_area").remove();

    description = eval(
        {"grid_desc":"The output grid size...is the same as the input","see_desc":"In the input, you should see...a complex pattern of colored squares that contains at least 2 distinct yellow rectangles","do_desc":"To make the output, you have to...remove the yellow rectangles and replace the all of the yellow squares with the appropriate color in order to create a pattern that is both horizontally and vertically symmetrical","bandit_attempts":1,"bandit_success_score":0.5,"display_num_attempts":1,"display_num_success":1,"timestamp":{"seconds":1603829133,"nanoseconds":303000000},"description_time":531,"verification_time":173,"num_verification_attempts":1,"type":"nl","task":"286","uid":"6cbabb8b-a17d-4328-a4ff-4efe690b31ae","id":"e7a0d5a0-bbff-475d-97af-be52b8f7c742"}
    );

    SELECTED_EXAMPLE = description.selected_example;
    loadTask(task);

    $("#grid_size_p").text(description.grid_desc);
    $("#see_p").text(description.see_desc);
    $("#do_p").text(description.do_desc);

    $('#instructionsModal').modal('show');
});


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
            errorMsg(`Wrong answer. You have used all of your attempts (but since this is just AAAI, you can try as many times as you wish).`);
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
                    errorMsg(`Wrong answer. You have used all of your attempts (but since this is just AAAI, you can try as many times as you wish).`);
                }
                return;
            }
        }
    }

    ATTEMPTS_SEQUENCE.push(["check", true]);

    SENDING_TO_NEXT = true;
    infoMsg("Correct!");

    $("#speaker_certainty_modal").modal('show');
}

