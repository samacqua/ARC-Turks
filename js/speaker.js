var START_DATE;
var ATTEMPT_JSONS = [];
var GAVE_UP = false;

const uid = sessionStorage.getItem('uid');
const age = sessionStorage.getItem('age');
const gender = sessionStorage.getItem('gender');
const speaker_tasks_done = parseInt(sessionStorage.getItem('s'));
const listener_tasks_done = parseInt(sessionStorage.getItem('l'));

$(window).on('load',function(){
    START_DATE = new Date();

    update_progress_bar(increment=false);

    $("#grid_size_form").css("visibility", "hidden")

    $("#what_you_see").val("You should see...");
    $("#what_you_do").val("You have to...");
    $("#grid_size_desc").val("The grid size...");

    // only give full instructions if first time through
    if (speaker_tasks_done == 1) {
        $('#instructionsModal').modal('show');
    }

    random_speaker_retrieve(TOTAL_TASKS_TO_COMPLETE);
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

    if ($("#what_you_see").val().trim().length < 20) {
        errorMsg("Please enter a description of what you see.");
        return
    }
    if ($("#what_you_do").val().trim().length < 20) {
        errorMsg("Please enter a description of what you change.");
        return
    }
    if ($("#grid_size_desc").val().trim().length < 10) {
        errorMsg("Please enter a description of the grid size.");
        return
    }

    if (!$("#what_you_see").val().trim().startsWith("You should see")) {
        errorMsg("What you see has to start with \"You should see\"");
        return
    }
    if (!$("#what_you_do").val().trim().startsWith("You have to")) {
        errorMsg("What you do has to start with \"You have to\"");
        return
    }
    if (!$("#grid_size_desc").val().trim().startsWith("The grid size")) {
        errorMsg("The grid size field has to start with \"The grid size\"");
        return
    }

    document.getElementById("validation-col").style.visibility = "visible";
    $("#what_you_see").attr("readonly", true);
    $("#what_you_do").attr("readonly", true);
    $("#grid_size_changes").click(function () { return false; });
    $("#grid_size_desc").attr("readonly", true);
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

    // get entered values
    var conf = $('#conf_form').val().trim();
    const see_desc = $.trim($("#what_you_see").val());
    const do_desc = $.trim($("#what_you_do").val());
    var grid_size_desc = $.trim($("#grid_size_desc").val());

    if (grid_size_desc == "The grid size...") {
        grid_size_desc = "The grid size... does not change."
    }

    update_progress_bar();

    if (listener_tasks_done + speaker_tasks_done == TOTAL_TASKS_TO_COMPLETE) {
        $("#finish_modal_uid").text(uid.toString());
        $("#finished_modal").modal('show');
        return;
    }
    
    store_response_speaker(see_desc, do_desc, grid_size_desc, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, age, gender, conf, gave_up_verification=GAVE_UP)
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
    
        give_up_description(TASK_ID);
        random_speaker_retrieve(5);
        $('textarea').val("");
    } else {
        GAVE_UP = true;
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

$(function()
/**
 * listen for change in check box about if grid size changes
 */
{
    $('#grid_size_changes').on('change', function()
    {
        if (this.checked)
        {
            $("#grid_size_form").css("visibility", "visible");
        } else {
            $("#grid_size_form").css("visibility", "hidden");
        }
    });
});