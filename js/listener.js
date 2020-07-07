var USER_ID;

$(window).on('load',function(){
    $('#error_display').hide();
    $('#info_display').hide();

    USER_ID = Math.floor(Math.random()*1e10);

    random_listen_retrieve();
    $('#instructionsModal').modal('show');
});

$(document).ready(function(){
    $("#age_result").html($("#age_form").val());
    $("#age_form").change(function(){
        $("#age_result").html($(this).val());
    });
});  

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

    const desc = $("#description_p").text();

    store_listener(desc, TASK_ID, USER_ID, ATTEMPTS, AGE, GENDER);

    if (PATTERNS_COMPLETED < 3) {
        ATTEMPTS = 0;

        resetOutputGrid();
        infoMsg("You have solved " + PATTERNS_COMPLETED.toString() + " of 3 patterns");
    
        TEST_PAIRS = new Array();
        random_listen_retrieve();
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const first = urlParams.get('first');

        if (first == 'true') {
            // 'file:///Users/samacquaviva/Documents/Summer%20UROP/Turk/Website%20Complete/speaker.html?first=false'
            window.location.href = '/speaker.html?first=false';
        } else {
            exit_message();
        }
    }
}

var AGE;
var GENDER;

function exit_demographic() {
    GENDER = $('#gender_form').find("option:selected").text();
    AGE = $('#age_form').val().trim();
}