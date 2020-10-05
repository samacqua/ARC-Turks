var QUIZ_QUESTIONS;

$(window).on('load', function () {

    // init_firestore(); // uncomment to initialize database

    // correctly size the progress bar
    size_progress_bar();

    // start timer to gather data on total time per user
    sessionStorage.setItem('start_time', new Date().getTime());

    // load first practice task
    const task = PRAC_TASKS.shift();
    loadTask(task.task);
    $("#grid_size_p").text(task.grid_desc);
    $("#see_p").text(task.see_desc);
    $("#do_p").text(task.do_desc);
    SELECTED_EXAMPLE = task.selected_example;

    // initialize the number of items complete, and the number of practice items complete
    sessionStorage.setItem("items_complete", "0"); // number of actual tasks (for determining when complete with study)
    sessionStorage.setItem("prac_complete", "0"); //for finishing instructions and practice tasks (for updating progress bar)

    // consent --> demographic --> overview --> walkthrough --> practice --> real tasks
    $('#consentModal').modal('show');

    // assign a random id to the user
    sessionStorage.setItem("uid", uuidv4());

    // get the type of descriptions (nl, nl_ex, ex)
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    DESCRIPTIONS_TYPE = urlParams.get('type') || "nl";
    sessionStorage.setItem('type', DESCRIPTIONS_TYPE);

    // format walkthrough/tutorial based on description type
    format_walkthrough(DESCRIPTIONS_TYPE);
    format_desc_area(DESCRIPTIONS_TYPE);
    set_objective(DESCRIPTIONS_TYPE);

    // set up quiz
    QUIZ_QUESTIONS = GEN_QUIZ_QUESTIONS;
    QUIZ_QUESTIONS.unshift(TASK_SPECIFIC_QUESTION[DESCRIPTIONS_TYPE]);
    var quizContainer = document.getElementById('quiz');
    showQuestions(QUIZ_QUESTIONS, quizContainer);
});


// =======================
// Format 
// =======================


function show_intro() {
    const introModalID = DESCRIPTIONS_TYPE + 'IntroModal';
    $('#consentModal').one('hidden.bs.modal', function () { $('#' + introModalID).modal('show'); }).modal('hide');
}

/**
 * set the objective based on the description type
 */
function set_objective(desc_type) {
    switch (desc_type) {
        case "nl":
            $("#objective-text").html('Create the correct output based on the description and input grid.');
            break;
        case "nl_ex":
            $("#objective-text").html('Create the correct output based on the description, example transformation, and input grid.');
            break;
        case "ex":
            $("#objective-text").html('Create the correct output based on the example transformation.');
            break;
        default:
            console.error("Unknown description type");
            break;
    }
}

/**
 * format the description area based on the description type
 */
function format_desc_area(desc_type) {
    if (desc_type == "nl") {
        // remove examples area
        $("#examples_area").remove();
    } else if (desc_type == "ex") {
        // remove description
        $("#description-text").remove();
    }
}


/**
 * Adds the correct walkthrough steps depending on the description type
 */
function format_walkthrough(desc_type) {
    for (i = 0; i < TUT_LIST.length; i++) {
        if (arraysEqual(TUT_LIST[i][1], ["objective-col"])) {
            switch (desc_type) {
                case "nl":
                    TUT_LIST.splice(i + 1, 0,
                        ["This is the description area. This is where the pattern is described.", ["description-col"], 30, 35, 10],
                        ["This is the description, which is written by another person.", ["description-text"], 30, 35, 10]);
                    break;
                case "nl_ex":
                    TUT_LIST.splice(i + 1, 0,
                        ["This is the description area. This is where the pattern is described.", ["description-col"], 30, 35, 10],
                        ["This is the description, which is written by another person.", ["description-text"], 30, 35, 10],
                        ["This is the examples area, which is where there will be an example of the transformation.", ["examples_area"], 30, 35, 10]);
                    break;
                case "ex":
                    TUT_LIST.splice(i + 1, 0,
                        ["This is the examples area. This is where an example of the pattern is shown.", ["description-col"], 30, 35, 10]);
                    break;
                default:
                    console.error("Unknown description type");
                    break;
            }
        }
    }
}

// =======================
// Tutorial
// =======================

// each tutorial item has format: [step text, list of elements to highlight, top offset of message (pxs), left offset (%), right offset (%)]
var TUT_LIST = [
    ["You will now be walked through the layout. Click any of the un-highlighted area to continue.", [], 30, 20, 20],
    ["This is the Objective bar. This is where your task will be written.", ["objective-col"], 30, 20, 20],
    ["This is the input area. You will apply the transformation to this grid.", ["input-col"], 30, 5, 70],
    ["This is the output area. This is where you will create the correct output grid. Let's break it down a little more...", ["output-col"], 30, 10, 35],
    ["This is where you can change the grid size.", ["resize_control_btns"], 50, 5, 35],
    ["Try changing the grid size to 2x2.", ["resize_control_btns", "output_grid", "objective-col"], 50, 100, 100],
    ["With these buttons, you can copy the entire input grid, reset the grid, check your answer, and give up.", ["edit_control_btns"], 60, 5, 35],
    ["Try copying the input grid, then resetting the output grid.", ["input-col", "edit_control_btns", "output_grid", "objective-col"], 30, 100, 100],
    ["These modes are how you change the output grid.", ["toolbar_and_symbol_picker"], 60, 5, 35],
    ["With the draw mode, you can edit individual pixels.", ["draw"], 60, 5, 35],
    ["Try drawing 3 green pixels in the output grid.", ["toolbar_and_symbol_picker", "output_grid", "objective-col"], 30, 100, 100],
    ["With flood fill, you can fill in entire areas.", ["floodfill"], 60, 5, 35],
    ["Try making the entire output grid yellow using flood fill.", ["toolbar_and_symbol_picker", "output_grid", "objective-col"], 30, 100, 100],
    ["With copy-paste, you can copy a part of the grid with C and paste with V.", ["copypaste"], 60, 5, 35],
    ["Try to copy the entire light-blue square from the input into the top left corner of the input. <br>(Make sure you are in copy-paste mode, then select an area and press 'C' to copy, and select an area and press 'V' to paste)", ["input-col", "output_grid", "toolbar_and_symbol_picker", "objective-col"], 500, 100, 100]
];

// different feedback based on how they reached a state, these flags give that information
var flags = { "copied_input": false, 'copy-paste': false };

// after some tasks, slight delay to ease transitions for user
// this variable ensures they do not skip tutorial steps
var WAITING_TO_CONTINUE = false;

/**
 * Before continuing the tutorial, checks if there is a task to complete
 * If so, check if completed task/give user incremental feedback
 * flag -- tells what called function, so we know if user reset grid or just colored it black, for example
 */
function pre_continue(flag = null) {

    // check if done with tutorial, because copy, reset, and resize all call pre-continue (so user does not have to click to continue)
    if (FINISHED_TUT || WAITING_TO_CONTINUE) {
        return;
    }

    // log that the flag has been called
    if (flag) {
        flags[flag] = true;
    }

    // if length > 1, then the tutorial is giving them a problem, so don't check if they have completed it before continuing
    if (CUR_HIGHLIGHT.length > 1) {

        syncFromEditionGridToDataGrid();

        // the challenge can be identified by which elements are currently highlighted
        if (arraysEqual(CUR_HIGHLIGHT, ["resize_control_btns", "output_grid", "objective-col"])) {
            // challenge to resize output grid to 2x2
            if (CURRENT_OUTPUT_GRID.width == CURRENT_OUTPUT_GRID.height && CURRENT_OUTPUT_GRID.width == 2) {
                infoMsg("Great job! You correctly resized the grid.");
                WAITING_TO_CONTINUE = true;
                setTimeout(function () { continue_tutorial(); }, 1000);
                return;
            } else {
                errorMsg("You resized the output grid, but to the wrong size.");
            }
        } else if (arraysEqual(CUR_HIGHLIGHT, ["input-col", "edit_control_btns", "output_grid", "objective-col"])) {
            // challenge to copy from input and reset output grid

            if (arraysEqual(CURRENT_OUTPUT_GRID.grid, CURRENT_INPUT_GRID.grid)) {
                if (flags['copy_input'] == true) {
                    infoMsg("Great! You have copied from the input grid. Now, reset the output grid.");
                } else {
                    infoMsg("You have copied the input grid, but you could have done it easier by clicking the \"Copy from input\" button.");
                }
                return;
            } else if (CURRENT_OUTPUT_GRID.grid.width == CURRENT_INPUT_GRID.grid.width && CURRENT_OUTPUT_GRID.height == CURRENT_INPUT_GRID.height) {
                for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++) {
                    ref_row = CURRENT_OUTPUT_GRID.grid[i];
                    for (var j = 0; j < ref_row.length; j++) {
                        if (ref_row[j] != 0) {
                            errorMsg("Your grid is the correct size, but you have to reset it.");
                            return;
                        }
                    }
                }
                infoMsg("Great job! You have copied from the input grid, and reset the output.");

                WAITING_TO_CONTINUE = true;
                setTimeout(function () { continue_tutorial(); }, 1000);
                return;
            }
        } else if (arraysEqual(CUR_HIGHLIGHT, ["toolbar_and_symbol_picker", "output_grid", "objective-col"])) {
            // challenge to draw 3 green cells or flood fill yellow (same highlighted elements)

            if ($("#objective-text").text().includes("green")) {
                // draw 3 green cells
                var green = 0;
                for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++) {
                    ref_row = CURRENT_OUTPUT_GRID.grid[i];
                    for (var j = 0; j < ref_row.length; j++) {
                        if (ref_row[j] == 3) {
                            green++;
                        }
                    }
                }

                if (green == 3) {
                    infoMsg("Great job! You drew 3 green cells.");
                    WAITING_TO_CONTINUE = true;
                    setTimeout(function () { continue_tutorial(); }, 1000);
                    return;
                } else if (green != 0) {
                    infoMsg("You have painted " + green + " cells green. Paint " + (3 - green).toString() + " more.")
                    return;
                }
            }

            if ($("#objective-text").text().includes("yellow")) {
                // flood fill yellow
                for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++) {
                    ref_row = CURRENT_OUTPUT_GRID.grid[i];
                    for (var j = 0; j < ref_row.length; j++) {
                        if (ref_row[j] != 4) {
                            errorMsg("You need to paint all squares yellow using flood fill.")
                            return;
                        }
                    }
                }
                infoMsg("Great job! You used flood fill.");
                WAITING_TO_CONTINUE = true;
                setTimeout(function () { continue_tutorial(); }, 1000);
                return;
            }
        } else if (arraysEqual(CUR_HIGHLIGHT, ["input-col", "output_grid", "toolbar_and_symbol_picker", "objective-col"])) {
            const ref_grid = [
                [8, 8, 0],
                [8, 8, 0],
                [0, 0, 0]
            ]

            if (CURRENT_OUTPUT_GRID.width != 3 || CURRENT_OUTPUT_GRID.height != 3) {
                errorMsg("Make sure that your output grid is 3x3.");
                return;
            }

            for (var i = 0; i < ref_grid.length; i++) {
                ref_row = ref_grid[i];
                for (var j = 0; j < ref_row.length; j++) {
                    if (ref_row[j] != CURRENT_OUTPUT_GRID.grid[i][j]) {
                        if (flags['copy-paste'] == false) {
                            errorMsg("Don't draw the shape, use the 'Copy-Paste' tool.");
                        } else {
                            errorMsg("You correctly used copy-paste, but make sure you are copying the correct pattern into the correct location.");
                        }
                        setTimeout(function() { resetOutputGrid() }, 500);
                        return;
                    }
                }
            }

            infoMsg("Great job! You used copy-paste.");
            WAITING_TO_CONTINUE = true;
            setTimeout(function () { continue_tutorial(); }, 1000);
            return;
        }
        errorMsg("To continue, follow the Objective.");
    } else {
        // not a challenge, so continue the tutorial
        continue_tutorial();
    }
}

var CUR_HIGHLIGHT = null;
var FINISHED_TUT = false;

function continue_tutorial() {

    WAITING_TO_CONTINUE = false;

    // set last item to be behind dark layer
    if (CUR_HIGHLIGHT != null) {
        for (i = 0; i < CUR_HIGHLIGHT.length; i++) {
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

        switch (DESCRIPTIONS_TYPE) {
            case "nl":
                $("#objective-text").html('Create the correct output based on the description and input grid.');
                break;
            case "nl_ex":
                $("#objective-text").html('Create the correct output based on the description, example transformation, and input grid.');
                break;
            case "ex":
                $("#objective-text").html('Create the correct output based on the example transformation.');
                break;
            default:
                break;
        }

        FINISHED_TUT = true;

        return;
    }

    // set dark layer and message
    const next_item = TUT_LIST.shift();
    $("#dark-layer").css('z-index', 500);
    $("#dark-layer").css('background-color', 'rgba(0,0,0,0.7)');
    $("#trans-layer").css('z-index', 503);
    $("#tut-message").css('z-index', 502);
    $("#tut-message").css('top', `${next_item[2]}%`);
    $("#tut-message").css('left', `${next_item[3]}%`);
    $("#tut-message").css('right', `${next_item[4]}%`);
    $("#tut-message").html(next_item[0]);
    $("#tut-continue-message").css('z-index', 502);
    $("#tut-continue-message").css('top', `calc(${next_item[2]}% + ${$("#tut-message").outerHeight() + 10}px)`);
    $("#tut-continue-message").css('background', 'rgba(0,0,0,0.7)');
    $("#tut-continue-message").html('Click anywhere to continue');
    $("#tut-continue-message").css('left', `${next_item[3]}%`);


    if (next_item[1].length > 1) {
        $("#objective-text").html(next_item[0]);
        $("#trans-layer").css('z-index', -1);
        $("#tut-continue-message").html('Follow the Objective to continue');
    }

    // set highlight div to be above layer
    var max_top = 100000;
    var max_id = "";
    for (i = 0; i < next_item[1].length; i++) {
        const id = next_item[1][i];
        $(`#${id}`).css('position', 'relative');
        $(`#${id}`).css('z-index', '501');
        if (id != "objective-col") {
            $(`#${id}`).css('background-color', 'gainsboro');
        }

        if ($('#' + id).offset().top < max_top) {
            max_top = $('#' + id).offset().top;
            max_id = id;
        }
    }

    // scroll to top highlighted element
    if (max_id != "") {
        $([document.documentElement, document.body]).animate({
            scrollTop: $('#' + max_id).offset().top - 10
        }, 1000);
    }

    CUR_HIGHLIGHT = next_item[1];
}

$(function () {
    $("#tut-layer").click(function () {
        pre_continue();
    });
});

// =======================
// ARC Completion
// =======================

function check_grid() {
    /**
     * checks if output is correct. If so and completed enough tasks, move on to actual task
     */
    syncFromEditionGridToDataGrid();
    reference_output = TEST_PAIRS[CURRENT_TEST_PAIR_INDEX]['output'];
    submitted_output = CURRENT_OUTPUT_GRID.grid;

    if (reference_output.length != submitted_output.length) {
        errorMsg("Wrong answer. Try again.");
        return
    }

    for (var i = 0; i < reference_output.length; i++) {
        ref_row = reference_output[i];
        for (var j = 0; j < ref_row.length; j++) {
            if (ref_row[j] != submitted_output[i][j]) {
                errorMsg("Wrong answer. Try again.");
                return
            }
        }
    }

    update_progress_bar(prac_inc = true);
    scroll_highlight_objective();

    const uid = sessionStorage.getItem('uid') || uuidv4() + "dev";
    const tut_end_time = (new Date()).getTime();
    const tut_time = (tut_end_time - parseInt(TUT_START_TIME)) / 1000;
    TUT_START_TIME = (new Date()).getTime();

    window.clearTimeout(GIVE_UP_HINT);
    GIVE_UP_HINT = setTimeout(function() {infoMsg("If you cannot figure out the pattern, press 'give up.'")}, 60000);

    const title = `tutorial_ex_${TOTAL_PRAC_TASKS - PRAC_TASKS.length}`;
    set_user_complete_time(uid, tut_time, title);

    // if not last practice task
    if (PRAC_TASKS.length != 0) {

        $("#give_up_vid").attr('src', `img/give_up_${TOTAL_PRAC_TASKS - PRAC_TASKS.length + 1}.mp4`);

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

// =======================
// Store user information
// =======================

var TUT_START_TIME = 0;
var GIVE_UP_HINT;

function send_user_complete_instructions_time() {
    const uid = sessionStorage.getItem('uid') || uuidv4() + "dev";

    const instructions_start_time = sessionStorage.getItem('start_time') || 0;
    const end_instructions_time = (new Date()).getTime();
    const delta = (end_instructions_time - parseInt(instructions_start_time)) / 1000;

    TUT_START_TIME = end_instructions_time;
    GIVE_UP_HINT = setTimeout(function() {infoMsg("If you cannot figure out the pattern, press 'give up' to see the solution.")}, 60000);

    set_user_complete_time(uid, delta, 'instructions_time');
}

// =======================
// Quiz
// =======================

function showQuestions(questions, quizContainer) {
    /*
    For quiz
    */
    // we'll need a place to store the output and the answer choices
    var output = [];
    var answers;

    // for each question...
    for (var i = 0; i < questions.length; i++) {

        // first reset the list of answers
        answers = [];

        // for each available answer to this question...
        for (letter in questions[i].answers) {

            // ...add an html radio button
            answers.push(
                '<label>'
                + '<input type="radio" name="question' + i + '" value="' + letter + '">'
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

    for (var i = 0; i < QUIZ_QUESTIONS.length; i++) {
        userAnswer = (answerContainers[i].querySelector('input[name=question' + i + ']:checked') || {}).value;
        if (userAnswer != QUIZ_QUESTIONS[i].correctAnswer) {
            errorMsg("You incorrectly answered question " + (i + 1).toString() + ". Please retry the quiz.");
            return;
        }
    }

    $('#quiz_modal').one('hidden.bs.modal', function () { $('#instructionsModal').modal('show'); }).modal('hide');
}