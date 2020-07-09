// easy tasks for demonstration purposes
const TASKS = [54, 4, 345];

$(window).on('load',function(){

    $('#error_display').hide();
    $('#info_display').hide();

    // get consent, then demographic, then present study, then begin solving patterns
    $('#consentModal').modal('show');

    // assign a random id
    const user_id = Math.floor(Math.random()*1e10);
    sessionStorage.setItem("uid", user_id);
    loadTask(TASKS.shift());
});

$(document).ready(function(){
    /**
     * makes it so slider has a label reflecting its value
     */
    $("#age_result").html($("#age_form").val());
    $("#age_form").change(function(){
        $("#age_result").html($(this).val());
    });

    $("#dif_patt_result").html($("#dif_patt_form").val());
    $("#dif_patt_form").change(function(){
        $("#dif_patt_result").html($(this).val());
    });
});  

$(function(){
    /**
     * auto play and auto pause modal videos
     */
    $('#introModal3').on('hidden.bs.modal', function(){
        $(this).find('video')[0].pause();
    });
    $('#introModal3').on('shown.bs.modal', function () {
         $(this).find('video')[0].play();
      });
});

function exit_demographic() {
    /**
     * Get info from demographic modal
     */
    gender = $('#gender_form').find("option:selected").text();
    sessionStorage.setItem("gender", gender);

    age = $('#age_form').val().trim();
    sessionStorage.setItem("age", age);

    $("#introModal").modal('show');
}

function check_grid() {
    /**
     * checks if output is correct. If so and completed enough tasks, move on to self play
     */
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

    // allow popover for last hint, make it fade out after 5 seconds
    if (TASKS.length == 1) {
        $('[data-toggle="popover"]').popover({
            delay: {
                "show": 500,
                "hide": 100
            }
        });
        $('[data-toggle="popover"]').click(function () {

            setTimeout(function () {
                $('.popover').fadeOut('slow');
            }, 5000);
    
        });
    }

    if (TASKS.length == 0) {    // bc popping front each time
        $("#done_modal").modal("show");
        return;
    }

    infoMsg("Correct! Solve " + (TASKS.length).toString() + " more problems.");

    $("#pattern_title").text(`Pattern ${3-TASKS.length}`);

    resetOutputGrid();
    // breaks if you don't reset array
    TEST_PAIRS = new Array();

    // load the next task
    loadTask(TASKS.shift());
}

function give_hint() {
    /**
     * get a hint if can't figure out problem
     */
    if (TASKS.length != 0) {
        $("#hint_modal").modal('show');

        var video = document.getElementById("hint_video");
        video.setAttribute("src", `img/hint_${3-TASKS.length}.mp4`);
        video.load();
        video.onloadeddata = function () {
            video.play();
        };
    }
    // const answer = convertSerializedGridToGridObject(TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output']);
    // showAnswer(answer);
}

function showAnswer(grid) {
    /**
     * changes output grid to right answer
     */
    CURRENT_OUTPUT_GRID = grid;
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}