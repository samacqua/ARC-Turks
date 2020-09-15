$(window).on('load',function(){

    // uncomment to initialize database
    // init_tasks_collection();

    // start timer to gather data on total time per user
    const start_time = new Date();
    sessionStorage.setItem('start_time', start_time.getTime());

    // load first practice task
    const task = PRAC_TASKS.shift();
    loadTask(task.task);
    $("#grid_size_p").text(task.grid_desc);
    $("#see_p").text(task.see_desc);
    $("#do_p").text(task.do_desc);
    SELECTED_EXAMPLE = task.selected_example;

    // initialize the number of items complete, and the number of practice items complete
    // items_complete is number of actual tasks (for determining when complete with study)
    // prac_complete is for finishing instructions and practice tasks (for updating progress bar)
    sessionStorage.setItem("items_complete", "0");
    sessionStorage.setItem("prac_complete", "0");

    // get consent, then demographic, then present study, then begin solving patterns
    $('#consentModal').modal('show');

    // assign a random id to the user
    const user_id = Math.floor(Math.random()*1e10);
    sessionStorage.setItem("uid", user_id);

    // set up quiz
    var quizContainer = document.getElementById('quiz');
    showQuestions(QUIZ_QUESTIONS, quizContainer);
});

// tell them to give up after 30 seconds
window.setInterval(function(){
    const cur_time = (new Date()).getTime()/1000;
    if (Math.abs(cur_time - TUT_START_TIME / 1000 - 30) < 0.6) {
        infoMsg("If you can't get the right answer, press give-up to see how to solve it.");
    }
}, 1000);

function showAnswer(grid) {
    /**
     * set output grid to right answer
     */
    CURRENT_OUTPUT_GRID = grid;
    syncFromDataGridToEditionGrid();
    $('#output_grid_size').val(CURRENT_OUTPUT_GRID.height + 'x' + CURRENT_OUTPUT_GRID.width);
}

$(document).ready(function(){
    /**
     * makes it so slider has a label reflecting its value for demographics form
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
    $('#examples_modal').on('hidden.bs.modal', function(){
        $(this).find('video')[0].pause();
    });
    $('#examples_modal').on('shown.bs.modal', function () {
         $(this).find('video')[0].play();
      });
});

var TUT_LIST = [
    ["You will now be walked through the layout. Click any of the un-highlighted area to continue.", [], 200, 20, 20],
    ["This is the Objective bar. This is where your task will be written.", ["objective-col"], 200, 20, 20],
    ["This is the description area. This is where you will learn the pattern. There are two parts:", ["description-col"], 30, 30, 10],
    ["This is the description, which is written by another person.", ["description-text"], 200, 30, 10],
    ["This is the examples area, which is where there will be an example of the transformation.", ["task_preview"], 200, 30, 10],
    ["This is the input area. You will apply the transformation to this grid.", ["input-col"], 40, 20, 20],
    ["This is the output area. This is where you will create the correct output grid. Let's break it down a little more...", ["output-col"], 40, 10, 30],
    ["This is where you can change the grid size.", ["resize_control_btns"], 400, 5, 35],
    ["Try changing the grid size to 2x2.", ["resize_control_btns", "output_grid", "objective-col"], 400, 100, 100],
    ["With these buttons, you can copy the entire input grid, reset the grid, check your answer, and give up.", ["edit_control_btns"], 400, 5, 35],
    ["Try copying the input grid, then resetting the output grid.", ["input-col", "edit_control_btns", "output_grid", "objective-col"], 400, 100, 100],
    ["These modes are how you change the output grid.", ["toolbar_and_symbol_picker"], 500, 5, 35],
    ["With the draw mode, you can edit individual pixels.", ["draw"], 500, 5, 35],
    ["Try drawing 3 green pixels in the output grid.", ["toolbar_and_symbol_picker", "output_grid", "objective-col"], 500, 100, 100],
    ["With flood fill, you can fill in entire areas.", ["floodfill"], 500, 5, 35],
    ["Try making the entire output grid yellow using flood fill.", ["toolbar_and_symbol_picker", "output_grid", "objective-col"], 500, 100, 100],
    ["With copy-paste, you can copy a part of the grid with C and paste with V.", ["copypaste"], 500, 5, 35],
    ["Try to copy the light-blue square into the top left corner of the input.", ["input-col", "output_grid", "toolbar_and_symbol_picker", "objective-col"], 500, 100, 100]
];

function indexResizeOutputGrid() {
    resizeOutputGrid();

    if (arraysEqual(CUR_HIGHLIGHT, ["resize_control_btns", "output_grid", "objective-col"])) {
        if (CURRENT_OUTPUT_GRID.width == CURRENT_OUTPUT_GRID.height && CURRENT_OUTPUT_GRID.width == 2) {
            infoMsg("Great job! You correctly resized the grid.");
            setTimeout(function(){ continue_tutorial(); }, 2000);
            return;
        } else {
            errorMsg("You resized the output grid, but to the wrong size.");
        }
    }
}

var RESIZED_OUTPUT_GRID = false;

function indexCopyFromInput() {
    copyFromInput();

    if (arraysEqual(CUR_HIGHLIGHT, ["input-col", "edit_control_btns", "output_grid", "objective-col"])) {
        infoMsg("Great job! You have copied from the input grid. Now, reset the output grid.");
        RESIZED_OUTPUT_GRID = true;
    }

}

function indexResetOutputGrid() {
    resetOutputGrid();
    if (arraysEqual(CUR_HIGHLIGHT, ["input-col", "edit_control_btns", "output_grid", "objective-col"])) {
        if (RESIZED_OUTPUT_GRID) {
            infoMsg("Great job! You have copied from the input grid, and reset the output.");
            setTimeout(function(){ continue_tutorial(); }, 2000);
        } else {
            errorMsg("First, copy from the input grid.");
        }
    }
}

function pre_continue() {
            // if length > 1, then the tutorial is giving them a problem, so don't continue right away
            if (CUR_HIGHLIGHT.length > 1) {

                syncFromEditionGridToDataGrid();
    
                if (arraysEqual(CUR_HIGHLIGHT, ["input-col", "edit_control_btns", "output_grid", "objective-col"])) {
                    console.log(CURRENT_INPUT_GRID);
                    if (arraysEqual(CURRENT_OUTPUT_GRID.grid, CURRENT_INPUT_GRID.grid)) {
                        errorMsg("You have copied from the input grid. Now, reset the output grid.");
                        return;
                    } else if (CURRENT_OUTPUT_GRID.grid.width == CURRENT_INPUT_GRID.grid.width && CURRENT_OUTPUT_GRID.height == CURRENT_INPUT_GRID.height) {
                        
                        for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++){
                            ref_row = CURRENT_OUTPUT_GRID.grid[i];
                            for (var j = 0; j < ref_row.length; j++){
                                if (ref_row[j] != 0) {
                                    errorMsg("Your grid is the correct size, but you have to reset it.");
                                    return;
                                }
                            }
                        }
                    }
                } else if (arraysEqual(CUR_HIGHLIGHT, ["toolbar_and_symbol_picker", "output_grid", "objective-col"])) {
    
                    if ($("#objective-text").text().includes("green")) {
                        console.log("green");
                        console.log(CURRENT_OUTPUT_GRID);
                        var green = 0;
                        for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++){
                            ref_row = CURRENT_OUTPUT_GRID.grid[i];
                            for (var j = 0; j < ref_row.length; j++){
                                console.log(ref_row[j]);
                                if (ref_row[j] == 3) {
                                    green++;
                                }
                            }
                        }
    
                        if (green == 3) {
                            infoMsg("Great job! You drew 3 green cells.");
                            setTimeout(function(){ continue_tutorial(); }, 1000);
                            return;
                        } else if (green != 0) {
                            infoMsg("You have painted " + green + " cells green. Paint " + (3 - green).toString() + " more.")
                            return;
                        }
                    }
    
                    if ($("#objective-text").text().includes("yellow")) {
                        for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++){
                            ref_row = CURRENT_OUTPUT_GRID.grid[i];
                            for (var j = 0; j < ref_row.length; j++){
                                if (ref_row[j] != 4) {
                                    errorMsg("You need to paint all squares yellow using flood fill.")
                                    return;
                                }
                            }
                        }
                        infoMsg("Great job! You used flood fill.");
                        setTimeout(function(){ continue_tutorial(); }, 1000);
                        return;
                    }
                } else if ($("#objective-text").text().includes("copy")) {
                    console.log("copy");
                    const ref_grid = [
                        [8, 8, 0],
                        [8, 8, 0],
                        [0, 0, 0]
                    ]
    
                    if (CURRENT_OUTPUT_GRID.width != 3 || CURRENT_OUTPUT_GRID.height != 3) {
                        errorMsg("Make sure that your output grid is 3x3.");
                        return;
                    }
    
                    for (var i = 0; i < ref_grid.length; i++){
                        ref_row = ref_grid[i];
                        for (var j = 0; j < ref_row.length; j++){
                            if (ref_row[j] != CURRENT_OUTPUT_GRID.grid[i][j]) {
                                errorMsg("To continue, follow the Objective.");
                                return;
                            }
                        }
                    }
    
                    infoMsg("Great job! You used copy-paste.");
                    setTimeout(function(){ continue_tutorial(); }, 1000);
                    return;
                }
                errorMsg("To continue, follow the Objective.");
            } else {
                continue_tutorial();
            }
}

$(function(){
    $( "#trans-layer" ).click(function() {
        pre_continue();
    });
    $( "#dark-layer" ).click(function() {
        pre_continue();
    });
    $("#tut-message").click(function() {
        pre_continue();
    });
    $("#tut-continue-message").click(function() {
        pre_continue();
    });
});

var CUR_HIGHLIGHT = null;

function continue_tutorial() {

    // set last item to be behind dark layer
    if (CUR_HIGHLIGHT != null) {
        for(i=0;i<CUR_HIGHLIGHT.length;i++) {
            $(`#${CUR_HIGHLIGHT[i]}`).css('position', 'static');
            $(`#${CUR_HIGHLIGHT[i]}`).css('z-index', 'auto');
        }
    }

    // reset grid
    $("#output_grid_size").val("3x3");
    resizeOutputGrid();
    resetOutputGrid();

    // if last one, then get rid of dark layer
    if (TUT_LIST.length == 0) {
        $("#trans-layer").css('z-index', -1);
        $("#dark-layer").css('z-index', -1);
        $("#dark-layer").css('background-color', 'white');
        $("#tut-message").css('z-index', -2);
        $("#tut-continue-message").css('z-index', -2);
        $("#tut-continue-message").css('background', 'rgba(0,0,0,0.0)');

        $("#quiz_modal").modal("show");
        $("#objective-text").html('Create the correct output based on the description, example transformations, and input grid.');

        return;
    }

    // set dark layer and message
    const next_item = TUT_LIST.shift();
    $("#dark-layer").css('z-index', 500);
    $("#dark-layer").css('background-color', 'rgba(0,0,0,0.7)');
    $("#trans-layer").css('z-index', 503);
    $("#tut-message").css('z-index', 502);
    $("#tut-message").css('top', `${next_item[2]}px`);
    $("#tut-message").css('left', `${next_item[3]}%`);
    $("#tut-message").css('right', `${next_item[4]}%`);
    $("#tut-message").html(next_item[0]);
    $("#tut-continue-message").css('z-index', 502);
    $("#tut-continue-message").css('top', `${next_item[2] + $("#tut-message").outerHeight() + 10}px`);
    $("#tut-continue-message").css('background', 'rgba(0,0,0,0.7)');
    $("#tut-continue-message").html('Click anywhere to continue');
    $("#tut-continue-message").css('left', `${next_item[3]}%`);


    if (next_item[1].length > 1) {
        $("#objective-text").html(next_item[0]);
        $("#trans-layer").css('z-index', -1);
        $("#tut-continue-message").html('Follow the Objective to continue');
    }

    // set highlight div to be above layer
    for(i=0;i<next_item[1].length;i++) {
        const id = next_item[1][i];
        $(`#${id}`).css('position', 'relative');
        $(`#${id}`).css('z-index', '501');
        if (id != "objective-col") {
            $(`#${id}`).css('background-color', 'gainsboro');
        }
    }

    CUR_HIGHLIGHT = next_item[1];
}

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

    update_progress_bar(tasks_inc=false, prac_inc=true);
    
    const uid = sessionStorage.getItem('uid');
    const tut_end_time = (new Date()).getTime();
    const tut_time = (tut_end_time - parseInt(TUT_START_TIME)) / 1000;
    TUT_START_TIME = (new Date()).getTime();

    const title = `tutorial_ex_${TOTAL_PRAC_TASKS - PRAC_TASKS.length}`;
    set_user_complete_time(uid, tut_time, title);

    // if not last practice task
    if (PRAC_TASKS.length != 0) {


        $("#give_up_video").attr('src', `img/give_up_${TOTAL_PRAC_TASKS - PRAC_TASKS.length + 1}.mp4`);

        infoMsg("Correct! Solve " + (PRAC_TASKS.length).toString() + " more problem(s).");

        // reset values
        resetOutputGrid();
        TEST_PAIRS = new Array();
        
        // load task
        const task = PRAC_TASKS.shift();
        loadTask(task.task);
        $("#grid_size_p").text(task.grid_desc);
        $("#see_p").text(task.see_desc);
        $("#do_p").text(task.do_desc);
        SELECTED_EXAMPLE = task.selected_example;

        return;
    }

    $("#done_modal").modal("show");
}

var TUT_START_TIME = 0;

function send_user_complete_instructions_time() {
    const uid = sessionStorage.getItem('uid');

    const instructions_start_time = sessionStorage.getItem('start_time');
    const end_instructions_time = (new Date()).getTime();
    const delta = (end_instructions_time - parseInt(instructions_start_time)) / 1000;

    TUT_START_TIME = end_instructions_time;

    set_user_complete_time(uid, delta, 'instructions_time');
}

function exit_demographic() {
    /**
     * Get info from demographic modal
     */
    const gender = $('#gender_form').find("option:selected").text();
    const age = $('#age_form').val().trim();
    const uid = sessionStorage.getItem('uid');
    set_user_info(uid, age, gender);

    $('#demographic_modal').one('hidden.bs.modal', function() { $('#introModal').modal('show'); }).modal('hide');
}

function showQuestions(questions, quizContainer){
    /*
    For quiz
    */
    // we'll need a place to store the output and the answer choices
    var output = [];
    var answers;

    // for each question...
    for(var i=0; i<questions.length; i++){
        
        // first reset the list of answers
        answers = [];

        // for each available answer to this question...
        for(letter in questions[i].answers){

            // ...add an html radio button
            answers.push(
                '<label>'
                    + '<input type="radio" name="question'+i+'" value="'+letter+'">'
                    + letter + ': '
                    + questions[i].answers[letter]
                + '</label>'
            );
        }

        // add this question and its answers to the output
        output.push(
            '<div class="question">' + questions[i].question + '</div>'
            + '<div class="answers">' + answers.join('') + '</div>' 
            + '<hr>'
        );
    }

    // finally combine our output list into one string of html and put it on the page
    quizContainer.innerHTML = output.join('');
}

function check_quiz() {
    // gather answer containers from our quiz and check if correct
    var quizContainer = document.getElementById('quiz');
    var answerContainers = quizContainer.querySelectorAll('.answers');
    
    for(var i=0; i<QUIZ_QUESTIONS.length; i++){
        userAnswer = (answerContainers[i].querySelector('input[name=question'+i+']:checked')||{}).value;
        if(userAnswer != QUIZ_QUESTIONS[i].correctAnswer){
            errorMsg("You incorrectly answered question " + (i + 1).toString() + ". Please retry the quiz.");
            return;
        }
    }

    $('#quiz_modal').one('hidden.bs.modal', function() { $('#instructionsModal').modal('show'); }).modal('hide');
}