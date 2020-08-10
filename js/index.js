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

    // if not last practice task
    if (PRAC_TASKS.length != 0) {
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

        return;
    }
    $("#done_modal").modal("show");
}

function exit_demographic() {
    /**
     * Get info from demographic modal
     */
    gender = $('#gender_form').find("option:selected").text();
    sessionStorage.setItem("gender", gender);

    age = $('#age_form').val().trim();
    sessionStorage.setItem("age", age);

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
            $('#quiz_modal').one('hidden.bs.modal', function() { $('#introModal').modal('show'); }).modal('hide');
            errorMsg("You did not correctly complete the quiz. Please reread the instructions and retry the quiz.");
            return;
        }
    }

    $('#quiz_modal').one('hidden.bs.modal', function() { $('#instructionsModal').modal('show'); }).modal('hide');
}