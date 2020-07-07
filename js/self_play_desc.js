var START_DATE;

$(window).on('load',function(){
    $('#error_display').hide();
    $('#info_display').hide();

    START_DATE = new Date();

    $('#instructionsModal').modal('show');
    randomTask();
});

TASK_DESCRIPTIONS = []; 

function submit() {

    if ($("#desciption-text").val().trim().length < 5) {
        errorMsg("Please enter a description.");
        return
    }

    console.log(TASK_DESCRIPTIONS);
    console.log(TASK_DESCRIPTIONS.length);

    let pattern_num = TASK_DESCRIPTIONS.length+2;

    $("#pattern-header").text("Pattern " + pattern_num);
    for (var i = 0; i < 8; i++) {
        var pairSlot = $('#pair_preview_' + i);
        var jqInputGrid = pairSlot.find('.input_preview');
        var jqOutputGrid = pairSlot.find('.output_preview');
        jqInputGrid.empty();
        jqOutputGrid.empty();
    }
    
    randomTask();
    
    let desc = $("#desciption-text").val().trim();
    let last_task = TASKS_DESCRIBED.pop();

    TASK_DESCRIPTIONS.push([last_task, desc]);

    
    if (TASK_DESCRIPTIONS.length >= 3) {
        const t1 = TASK_DESCRIPTIONS[0][0];
        const d1 = TASK_DESCRIPTIONS[0][1];
        const t2 = TASK_DESCRIPTIONS[1][0];
        const d2 = TASK_DESCRIPTIONS[1][1];
        const t3 = TASK_DESCRIPTIONS[2][0];
        const d3 = TASK_DESCRIPTIONS[2][1];

        // `file:///Users/samacquaviva/Documents/Summer%20UROP/Turk/Website%20Complete/self_play_test.html?t1=${t1}&d1=${d1}&t2=${t2}&d2=${d2}&t3=${t3}&d3=${d3}`
        window.location.href = `/self_play_test.html?t1=${t1}&d1=${d1}&t2=${t2}&d2=${d2}&t3=${t3}&d3=${d3}`;
    }
    $('textarea').val("");
}

function give_up() {
    const newTime = new Date();
    console.log((newTime - START_DATE)/1000);
    if ((newTime - START_DATE)/1000 < 30) {
        errorMsg("Please try to figure out the pattern for a bit before you give up.");
        return;
    }

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

    START_DATE = new Date();
}