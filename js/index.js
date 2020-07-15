// easy tasks for demonstration purposes
// const TASKS = [78]; // for video demonstration
const TASKS = [370, 258];
const URL_TASKS = TASKS.join('.');

var DESC_SEES = [];
var DESC_DOS = [];
var DESC_GRIDS = [];

var START_TIME;

sessionStorage.setItem("items_complete", "0");

const quiz_questions = [
	{
		question: "The goal of the describer is to...",
		answers: {
			a: 'create the correct output grid based on grid examples of the pattern',
			b: 'describe the pattern based on grid examples so that another person can create the correct output grid',
			c: 'use a description of the pattern to create the correct output grid'
		},
		correctAnswer: 'b'
	},
	{
		question: "The goal of the builder is to...",
		answers: {
			a: 'create the correct output grid based on grid examples of the pattern',
			b: 'describe the pattern based on grid examples so that another person can create the correct output grid',
			c: 'use a description of the pattern to create the correct output grid'
		},
		correctAnswer: 'c'
    },
    {
		question: "You should break up your description into...",
		answers: {
			a: '3 sections: what you should see in the input grid, what you should do to make the output grid, and how the grid size changes (if at all).',
			b: '1 section: what is the pattern.',
			c: 'as many sections as there are examples so that you can describe each example.'
		},
		correctAnswer: 'a'
    },
    {
		question: "Which choice best describes the functions of Draw, Flood fill, and Copy-Paste?",
		answers: {
			a: 'Draw lets you color individual boxes in the grid, flood fill lets you fill in entire areas, and copy paste lets you copy and paste parts of the grids',
			b: 'Draw lets you color the output grid, flood fill lets you change the input grid, and copy-paste copies the entire input grid.',
			c: 'Draw lets you draw lines, flood-fill lets you color individual boxes, and copy-paste lets you copy from the output box to other websites.'
		},
		correctAnswer: 'a'
    },
];

$(window).on('load',function(){
    $("#grid_size_form").css("visibility", "hidden");

    // fill forms with actual text
    $("#what_you_see").val("You should see...");
    $("#what_you_do").val("You have to...");
    $("#grid_size_desc").val("The grid size...");

    // get consent, then demographic, then present study, then begin solving patterns
    $('#quiz_modal').modal('show');

    // assign a random id
    const user_id = Math.floor(Math.random()*1e10);
    sessionStorage.setItem("uid", user_id);
    loadTask(TASKS.shift());

    var quizContainer = document.getElementById('quiz');
    showQuestions(quiz_questions, quizContainer);
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
    $('#examples_modal').on('hidden.bs.modal', function(){
        $(this).find('video')[0].pause();
    });
    $('#examples_modal').on('shown.bs.modal', function () {
         $(this).find('video')[0].play();
      });
});

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

function submit() {
    /**
     * If starting with right phrase and actually entered text, then bring to listening task and pass all info
     */

     DESC_SEES.push($("#what_you_see").val().trim());
     DESC_DOS.push($("#what_you_do").val().trim());
     if ( $('#grid_size_desc').css('display') == 'none' || $('#grid_size_desc').css("visibility") == "hidden"){
        DESC_GRIDS.push("The grid size... does not change");
    } else {
        DESC_GRIDS.push($("#grid_size_desc").val().trim());
    }

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

    update_progress_bar();

    if (TASKS.length != 0) {
        infoMsg("Correct! Describe " + TASKS.length.toString() + " more pattern.")
        $("#what_you_see").val("You should see...");
        $("#what_you_do").val("You have to...");
        $("#grid_size_desc").val("The grid size...");

        loadTask(TASKS.shift());
        return;
     }

    DESC_SEES = DESC_SEES.join('~');
    DESC_DOS = DESC_DOS.join('~');
    DESC_GRIDS = DESC_GRIDS.join('~');

    window.location.href = `self_play_test.html?tasks=${URL_TASKS}&see=${DESC_SEES}&do=${DESC_DOS}&grid=${DESC_GRIDS}`;
}

function showQuestions(questions, quizContainer){
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
    // gather answer containers from our quiz
    var quizContainer = document.getElementById('quiz');
    var answerContainers = quizContainer.querySelectorAll('.answers');
    
    for(var i=0; i<quiz_questions.length; i++){
        userAnswer = (answerContainers[i].querySelector('input[name=question'+i+']:checked')||{}).value;
        if(userAnswer != quiz_questions[i].correctAnswer){
            $('#quiz_modal').one('hidden.bs.modal', function() { $('#introModal').modal('show'); }).modal('hide');
            errorMsg("You did not correctly complete the quiz. Please reread the instructions and retry the quiz.");
            return;
        }
    }

    $('#quiz_modal').one('hidden.bs.modal', function() { $('#instructionsModal').modal('show'); }).modal('hide');

}