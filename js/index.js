$(window).on('load', function () {

    // init_tasks_collection();     // uncomment to initialize database

    // correctly size the progress bar
    size_progress_bar();

    // start timer to gather data on total time per user
    const start_time = new Date();
    sessionStorage.setItem('start_time', start_time.getTime());

    // load first practice task
    const task = PRAC_TASKS.shift();
    loadTask(task.task);
    $("#grid_size_p").text(task.grid_desc);
    $("#see_p").text(task.see_desc);
    $("#do_p").text(task.do_desc);

    // initialize the number of items complete, and the number of practice items complete
    // items_complete is number of actual tasks (for determining when complete with study)
    // prac_complete is for finishing instructions and practice tasks (for updating progress bar)
    sessionStorage.setItem("items_complete", "0");
    sessionStorage.setItem("prac_complete", "0");
    sessionStorage.setItem('tasks_completed', "-1");

    // get consent, then demographic, then present study, then begin solving patterns
    $('#consentModal').modal('show');

    // assign a random id to the user
    const user_id = Math.floor(Math.random() * 1e10);
    sessionStorage.setItem("uid", user_id);

    // set up quiz
    var quizContainer = document.getElementById('quiz');
    showQuestions(QUIZ_QUESTIONS, quizContainer);
});

// =======================
// Tutorial
// =======================

// each tutorial item has format: [step text, list of elements to highlight, top offset of message (pxs), left offset (%), right offset (%)]
var TUT_LIST = [
    ["You will now be walked through the layout. Click any of the un-highlighted area to continue.", [], 30, 20, 20],
    ["This is the Objective bar. This is where your task will be written.", ["objective-col"], 30, 20, 20],
    ["This is the description area. This is where the pattern is described.", ["description-col"], 30, 35, 10],
    ["This is the description, which is written by another person.", ["description-text"], 30, 35, 10],
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
    ["Try to copy the light-blue square into the top left corner of the input.", ["input-col", "output_grid", "toolbar_and_symbol_picker", "objective-col"], 500, 100, 100]
];

// different feedback based on how they reached a state, these flags give that information
var flags = { "copied_input": false, "copy_paste": false };

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
    if (FINISHED_TUT) {
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
                if (!WAITING_TO_CONTINUE) {
                    WAITING_TO_CONTINUE = true;
                    setTimeout(function () { continue_tutorial(); }, 2000);
                }
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
                console.log("same size");
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
                
                if (!WAITING_TO_CONTINUE) {
                    WAITING_TO_CONTINUE = true;
                    setTimeout(function () { continue_tutorial(); }, 2000);
                }
                return;
            }
        } else if (arraysEqual(CUR_HIGHLIGHT, ["toolbar_and_symbol_picker", "output_grid", "objective-col"])) {
            // challenge to draw 3 green cells or flood fill yellow (same highlighted elements)

            if ($("#objective-text").text().includes("green")) {
                // draw 3 green cells
                console.log("green");
                console.log(CURRENT_OUTPUT_GRID);
                var green = 0;
                for (var i = 0; i < CURRENT_OUTPUT_GRID.grid.length; i++) {
                    ref_row = CURRENT_OUTPUT_GRID.grid[i];
                    for (var j = 0; j < ref_row.length; j++) {
                        console.log(ref_row[j]);
                        if (ref_row[j] == 3) {
                            green++;
                        }
                    }
                }

                if (green == 3) {
                    infoMsg("Great job! You drew 3 green cells.");
                    if (!WAITING_TO_CONTINUE) {
                        WAITING_TO_CONTINUE = true;
                        setTimeout(function () { continue_tutorial(); }, 1000);
                    }
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
                if (!WAITING_TO_CONTINUE) {
                    WAITING_TO_CONTINUE = true;
                    setTimeout(function () { continue_tutorial(); }, 1000);
                }
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
                        errorMsg("To continue, follow the Objective.");
                        return;
                    }
                }
            }

            if (flags['copy_paste'] != true) {
                resetOutputGrid();
                errorMsg("You have correctly drawn the shape, but use the 'Copy-Paste' tool to copy from the input grid.");
                return;
            }

            infoMsg("Great job! You used copy-paste.");
            if (!WAITING_TO_CONTINUE) {
                WAITING_TO_CONTINUE = true;
                setTimeout(function () { continue_tutorial(); }, 1000);
            }
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
        $("#objective-text").html('Create the correct output based on the description, example transformations, and input grid.');

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

        console.log(id, $('#' + id).offset().top);

        if ($('#' + id).offset().top < max_top) {
            max_top = $('#' + id).offset().top;
            max_id = id;
        }
    }

    // scroll to top highlighted element
    if (max_id != "") {
        $([document.documentElement, document.body]).animate({
            scrollTop: $('#' + max_id).offset().top-10
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
    console.log(TEST_PAIRS);
    console.log(CURRENT_TEST_PAIR_INDEX);
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

    update_progress_bar(tasks_inc = false, prac_inc = true);

    const uid = sessionStorage.getItem('uid');
    const tut_end_time = (new Date()).getTime();
    const tut_time = (tut_end_time - parseInt(TUT_START_TIME)) / 1000;
    TUT_START_TIME = (new Date()).getTime();

    const title = `tutorial_ex_${TOTAL_PRAC_TASKS - PRAC_TASKS.length}`;
    set_user_complete_time(uid, tut_time, title);

    // if not last practice task
    if (PRAC_TASKS.length != 0) {


        $("#give_up_gif").attr('src', `img/give_up_${TOTAL_PRAC_TASKS - PRAC_TASKS.length + 1}.gif`);

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

    $('#demographic_modal').one('hidden.bs.modal', function () { $('#introModal').modal('show'); }).modal('hide');
}

// =======================
// Quiz
// =======================

const QUIZ_QUESTIONS = [
    {
        question: "Your goal is to...",
        answers: {
            a: 'create grids that look like other grids',
            b: 'write a description of the transformation based on grid examples so that another person can create the correct output grid',
            c: 'use a description of the pattern to create the correct output grid'
        },
        correctAnswer: 'c'
    },
    {
        question: "It is important to...",
        answers: {
            a: 'Use as few attempts as possible.',
            b: 'Complete the tasks as fast as possible.',
            c: 'Use as many colors as possible.'
        },
        correctAnswer: 'a'
    },
    {
        question: "To edit the output grid, what are the 3 modes you can use and their correct description?",
        answers: {
            a: '1). Draw -- to edit individual pixels. 2). Flood fill -- to fill in entire areas. 3). Copy-paste -- to copy a section of the grid.',
            b: '1). Draw -- to edit individual pixels. 2). Stamper -- to place down a stamp of a shape. 3). Line -- to make a line between two pixels.',
            c: 'There is only one mode.'
        },
        correctAnswer: 'a'
    },
    {
        question: "If you give up, will you be given a bonus for completing that task?",
        answers: {
            a: 'Yes.',
            b: 'No.',
        },
        correctAnswer: 'b'
    }
];

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