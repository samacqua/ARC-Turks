var USER_ID;
var START_DATE;

$(window).on('load',function(){
    START_DATE = new Date();

    $('#error_display').hide();
    $('#info_display').hide();

    $('#instructionsModal').modal('show');
    USER_ID = Math.floor(Math.random()*1e10);

    // TODO: make not random, but sorted in some way
    randomTask();
});

$(document).ready(function(){
    $("#age_result").html($("#age_form").val());
    $("#age_form").change(function(){
        $("#age_result").html($(this).val());
    });

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
    if ($.trim($("#desciption-text").val()).length > 3) {
        $("#desciption-text").prop("readonly", true);
        document.getElementById("validation-col").style.visibility = "visible";
    } else {
        errorMsg("Enter a description.");
    }
}

var PATTERNS_COMPLETED = 0;
var ATTEMPTS = 0;

function check() {
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

    PATTERNS_COMPLETED++;
    $("#task_qs_modal").modal({backdrop: 'static', keyboard: false});
}

var AGE;
var GENDER;

function exit_demographic() {
    GENDER = $('#gender_form').find("option:selected").text();
    AGE = $('#age_form').val().trim();
}

function exit_task_qs() {

    var pattern_dif = $('#dif_patt_form').val().trim();
    var desc_diff = $('#desc_form').val().trim();
    var conf = $('#conf_form').val().trim();
    var description_text = $.trim($("#desciption-text").val());

    store_response_speaker(description_text, TASK_ID, USER_ID, ATTEMPTS, AGE, GENDER, pattern_dif, desc_diff, conf);

    if (PATTERNS_COMPLETED < 3) {
        ATTEMPTS = 0;
        $("#desciption-text").val("");
        $("#desciption-text").prop("readonly", false);
        document.getElementById("validation-col").style.visibility = "hidden";
        resetOutputGrid();
        infoMsg("You have solved " + PATTERNS_COMPLETED.toString() + " of 3 patterns");

        TEST_PAIRS = new Array();
        randomTask();
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const first = urlParams.get('first');

        if (first == 'true') {
            // 'file:///Users/samacquaviva/Documents/Summer%20UROP/Turk/Website%20Complete/listener.html?first=false'
            window.location.href = '/listener.html?first=false';
        } else {
            exit_message();
        }
    }
}

function give_up() {

    const newTime = new Date();
    console.log((newTime - START_DATE)/1000);
    if ((newTime - START_DATE)/1000 < 30) {
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
        // TEST_PAIRS = new Array();
    
        console.log(answer);
        showAnswer(answer);
    }
    START_DATE = new Date();
}

function showAnswer(grid) {
    // jqInputGrid = $('#evaluation_answer');
    // console.log(grid);
    // console.log(jqInputGrid);
    // fillJqGridWithData(jqInputGrid, grid);
    // fitCellsToContainer(jqInputGrid, grid.height, grid.width, 400, 400);

    CURRENT_OUTPUT_GRID = grid;
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}