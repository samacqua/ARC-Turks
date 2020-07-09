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
    $("#grid_size_form").css("visibility", "hidden")

    $("#what_you_see").val("You should see...");
    $("#what_you_do").val("You have to...");
    $("#grid_size_desc").val("The grid size...");

    // only give full instructions if first time through
    if (s == 1) {
        $('#instructionsModal').modal('show');
    } else {
        $('#quickInstructionsModal').modal('show');
    }

    random_speaker_retrieve(5);
});

$(document).ready(function(){
    /**
     * Make it so modal with sliders has labels of slider values
     */
    $("#dif_patt_result").html($("#dif_patt_form").val());
    $("#dif_patt_form").change(function(){
        $("#dif_patt_result").html($(this).val());
    });

    $("#desc_result").html($("#desc_form").val());
    $("#desc_form").change(function(){
        $("#desc_result").html($(this).val());
    });

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
}


function check() {
    /**
     * check if output grid same as correct answer. if so, ask more questions about task
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

    $("#task_qs_modal").modal({backdrop: 'static', keyboard: false});
}

function exit_task_qs() {
    /**
     * store submitted values and go to next task
     */

    // get entered values
    var pattern_dif = $('#dif_patt_form').val().trim();
    var desc_diff = $('#desc_form').val().trim();
    var conf = $('#conf_form').val().trim();
    const see_desc = $.trim($("#what_you_see").val());
    const do_desc = $.trim($("#what_you_do").val());
    var grid_size_desc = $.trim($("#grid_size_desc").val());

    if (grid_size_desc == "The grid size...") {
        grid_size_desc = "The grid size... does not change."
    }
    
    store_response_speaker(see_desc, do_desc, grid_size_desc, TASK_ID, uid, ATTEMPTS, age, gender, pattern_dif, desc_diff, conf)
        .then(function() { next_task(s, l, age, gender, uid); })
        .catch(function(error) { console.log('Error storing response ' + error); });
}

function give_up() {
    /**
     * if after 1 minute, cannot figure out pattern or get correct output, give them the answer
     */

    const newTime = new Date();
    console.log((newTime - START_DATE)/1000);
    if ((newTime - START_DATE)/1000 < 60) {
        errorMsg("Please try to figure out the pattern for a bit before you give up.");
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
    
        randomTask();
        $('textarea').val("");
    } else {
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
 * listen for change in check box if grid size changes
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