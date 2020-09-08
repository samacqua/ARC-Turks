var START_DATE;
var ATTEMPT_JSONS = [];
var GAVE_UP = false;

const uid = sessionStorage.getItem('uid');

$(window).on('load',function(){
    // get date to check they are trying before giving up
    START_DATE = new Date();

    // get progress bar completion
    update_progress_bar();

    // hide grid size form
    $("#grid_size_form").css("visibility", "hidden");

    // fill textbox forms with actual text
    $("#grid_size_desc").val(GRID_SIZE_PREFIX);
    $("#what_you_see").val(SHOULD_SEE_PREFIX);
    $("#what_you_do").val(HAVE_TO_PREFIX);

    // show initial instructions
    $('#instructionsModal').modal('show');

    // for example video
    // const exampleTaskId = 78;
    // loadTask(exampleTaskId);

    // get speaker task
    random_speaker_retrieve();
});

// list of used words
// TODO: retrieve from db
var GOOD_WORDS = ['size', 'up', 'colors', 'entire', 'example', 'blue', 'which', 'except', 'and', 'make', 'input', '9', 'a', 'In', 'you', 'not', 'would', 'if', 'So', 'into', 'like', 'necessary', 'To', 'is', '5', 'black', 'corresponds', 'there', 'once', 'only', '1', 'color', 'should', 'fill', 'copy-paste', 'where', 'each', 'holes', 'have', 'are', 'Paste', '3x3', 'green', 'as', 'red', 'grid', 'shapes', 'some', 'broken', 'at', 'shape', 'paste', 'pixels', 'all', 'copy', 'pattern', 'squares', 'perfect', 'times', 'scaling', 'treat', 'output', 'it', 'fit', 'that', 'onto', 'filling', 'Where', 'colored', 'symmetrical', 'with', 'the', 'rectangular', 'hole', 'Determine', 'so', 'in', 'for', '4', 'patterns', 'square', 'see', 'sections', 'corresponding', 'has', 'pixel', 'gray', 'to', 'of', 'also', 'Looking', 'orange', 'yellow', 'duplicating', 'section'].map(function(value) {
    return value.toLowerCase();
});

// returns the regex for words that have not been used yet
function get_bad_words(input) {
    return new RegExp('\\b(?!(' + GOOD_WORDS.join("|") + ')\\b)[a-zA-Z]+', 'gmi')
}

// for each word that has not been used, returns that word and its two closest meaning words that have been used
function get_replacement_words(words) {

    if (words == null) {
        return []
    }
    
    const replace_words = [];
    for (i=0; i<words.length;i++) {

        // gets 2 closest words according to word2vec
        const word = words[i].toLowerCase();
        const dists_to_other_words = GOOD_WORDS.map(function(x){return get_dist(word, x)});
        var closest = dists_to_other_words.sort().slice(0,2);

        // if written word, make them replace with num
        // better way than writing out mappings? must be.
        const str_num_mapping = {'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10};
        if (str_num_mapping[word] !== undefined) {
            closest[0][1] = str_num_mapping[word];
        }
        replace_words.push([words[i], closest[0][1], closest[1][1]]);
    }
    return replace_words;
}

// replace a word in the textarea with another word
function replace_word(word, replacement, text_area_id) {

    const cur_text = $(text_area_id).val();
    const replaced_text = cur_text.replace(word, replacement);
    $(text_area_id).val(replaced_text);

    // so that functions called on textarea changes are called, and so highlights resize
    $(text_area_id).trigger('keyup');
    $(text_area_id).highlightWithinTextarea('update');
}

// makes the word okay to use
function add_word(word) {

    GOOD_WORDS.push(word);

    // so that functions called on textarea changes are called, and so highlights resize
    $("textarea").trigger('keyup');
    $("textarea").highlightWithinTextarea('update');
}

$(document).ready(function() {

    // when the grid size textarea changes
    $("#grid_size_desc").on("keyup", function() {

        // so they can't delete prefix
        var value = $(this).val();
        $(this).val(GRID_SIZE_PREFIX + value.substring(GRID_SIZE_PREFIX.length));

        const matches = get_replacement_words(value.match(get_bad_words()));

        // for each novel word, add a row with buttons to replace word with similar words in database, or add the word
        $('#word-warning-size').empty();
        if (matches.length != 0) {
            var items = [];
            $.each(matches, function(i, item) {
    
                items.push('<li><b>' + item[0] + '</b>' 
                + `<button type="button" onclick="replace_word(\'${item[0]}\',\'${item[1]}\', '#grid_size_desc')" class="btn btn-primary word-replace" id=replace_${item[0]}_0>${item[1]}</button>`
                + `<button type="button" onclick="replace_word(\'${item[0]}\',\'${item[2]}\', '#grid_size_desc')" class="btn btn-primary word-replace" id=replace_${item[0]}_1>${item[2]}</button>`
                + `<button type="button" onclick="add_word(\'${item[0]}\')" id="add_word_${item[0]}" class="btn btn-danger add-word">add word</button></li>`);
    
            });
    
            $('#word-warning-size').append(items.join(''));
        }
    });

    // when the see description texarea changes
	$("#what_you_see").on("keyup", function() {

        // so they can't delete prefix
        var value = $(this).val();
        $(this).val(SHOULD_SEE_PREFIX + value.substring(SHOULD_SEE_PREFIX.length));
        
        const matches = get_replacement_words(value.match(get_bad_words()));

        // for each novel word, add a row with buttons to replace word with similar words in database, or add the word
        $('#word-warning-see').empty();
        if (matches.length != 0) {
            var items = [];
            $.each(matches, function(i, item) {
    
                items.push('<li><b>' + item[0] + '</b>' 
                + `<button type="button" onclick="replace_word(\'${item[0]}\',\'${item[1]}\', '#what_you_see')" class="btn btn-primary word-replace" id=replace_${item[0]}_0>${item[1]}</button>`
                + `<button type="button" onclick="replace_word(\'${item[0]}\',\'${item[2]}\', '#what_you_see')" class="btn btn-primary word-replace" id=replace_${item[0]}_1>${item[2]}</button>`
                + `<button type="button" onclick="add_word(\'${item[0]}\')" id="add_word_${item[0]}" class="btn btn-danger add-word">add word</button></li>`);
    
            });
    
            $('#word-warning-see').append(items.join(''));
        }
    });

    // when the do description textarea changes
    $("#what_you_do").on("keyup", function() {

        // so they can't delete prefix
        var value = $(this).val();
        $(this).val(HAVE_TO_PREFIX + value.substring(HAVE_TO_PREFIX.length));

        const matches = get_replacement_words(value.match(get_bad_words()));

        // for each novel word, add a row with buttons to replace word with similar words in database, or add the word
        $('#word-warning-do').empty();
        if (matches.length != 0) {
            var items = [];
            $.each(matches, function(i, item) {
    
                items.push('<li><b>' + item[0] + '</b>' 
                + `<button type="button" onclick="replace_word(\'${item[0]}\',\'${item[1]}\', '#what_you_do')" class="btn btn-primary word-replace" id=replace_${item[0]}_0>${item[1]}</button>`
                + `<button type="button" onclick="replace_word(\'${item[0]}\',\'${item[2]}\', '#what_you_do')" class="btn btn-primary word-replace" id=replace_${item[0]}_1>${item[2]}</button>`
                + `<button type="button" onclick="add_word(\'${item[0]}\')" id="add_word_${item[0]}" class="btn btn-danger add-word">add word</button></li>`);
    
            });
    
            $('#word-warning-do').append(items.join(''));
        }
    });

    // highlight the textareas for words that have not been used yet
    $('textarea').highlightWithinTextarea({
        highlight: [
            {
                highlight: get_bad_words
            }
        ]
    });

    //  Make it so modal with sliders has labels of slider values
    $("#conf_result").html($("#conf_form").val());
    $("#conf_form").change(function(){
        $("#conf_result").html($(this).val());
    });
});


function continue_to_verify() {
    /**
     * If starting with right phrase, actually entered text, and has used all known words or added the unknown words, then unhide validation
     */

    if ($("#what_you_see").val().trim().length < 33) {
        errorMsg("Please enter a description of what you see.");
        return
    }
    if ($("#what_you_do").val().trim().length < 36) {
        errorMsg("Please enter a description of what you change.");
        return
    }
    if (!$("#what_you_see").val().trim().startsWith(SHOULD_SEE_PREFIX)) {
        errorMsg(`What you see has to start with "${SHOULD_SEE_PREFIX}"`);
        return
    }
    if (!$("#what_you_do").val().trim().startsWith(HAVE_TO_PREFIX)) {
        errorMsg(`What you do has to start with "${HAVE_TO_PREFIX}"`);
        return
    }
    if (!$("#grid_size_desc").val().trim().startsWith(GRID_SIZE_PREFIX)) {
        errorMsg(`The grid size field has to start with "${GRID_SIZE_PREFIX}"`);
        return
    }
    
    if ($('#word-warning-size').children().length +  $('#word-warning-see').children().length +  $('#word-warning-do').children().length != 0) {
        errorMsg("You must get rid of all red-highlighted words. If they are absolutely necessary for your description, add that word.");
        return
    }

    // gray out description so they know it is uneditable and so they focus on validation
    $("#description_col").css("opacity", "0.6");
    $(".desc-buttons").css("visibility", "hidden");

    $("#what_you_see").attr("readonly", true);
    $("#what_you_do").attr("readonly", true);
    $("#grid_size_changes").click(function () { return false; });
    $("#grid_size_desc").attr("readonly", true);

    // show validation and update objective
    $("#validation-col").css("visibility", "visible");
    $("#objective-text").text("Apply the same pattern that you described to the new input grid.");
}

function continue_to_description() {

    // gray out so they know to focus on middle column
    $("#io_ex_col").css("opacity", "0.6");

    $("#objective-text").text("Describe the common transformation in the examples so that someone, given a new input grid, could create the correct output. Break up your description into the 3 sections provided by continuing the sentences. If you realize you do not know the pattern, you can still press 'Give up.'");
    $(".io-buttons").css("visibility", "hidden");
    $("#description_col").css("visibility", "visible");
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

    // checking cell by cell
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

    // store the grid size does not change 
    if (grid_size_desc == GRID_SIZE_PREFIX) {
        grid_size_desc = `${GRID_SIZE_PREFIX} does not change.`
    }

    infoMsg("All done! Loading next task...")

    const newTime = new Date();
    const totalTime = (newTime - START_DATE) / 1000;
    
    // store the description in the database
    store_description(see_desc, do_desc, grid_size_desc, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, conf, totalTime, null, gave_up_verification=GAVE_UP)
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

        infoMsg("You have given up. You will now be given a new task.");

        // make sure they are next given a listening task, and store that they gave up.
        give_up_description(TASK_ID)
        .then(function () {
            next_task();
        }).catch(function (err) {
            console.log(err);
        });
    } else {
        GAVE_UP = true;
        infoMsg("You have given up. The output grid now has the correct answer. Press 'check' to submit this correct answer.");
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
            $("#grid_size_desc").val(GRID_SIZE_PREFIX);
            $("textarea").trigger('keyup');
            $("textarea").highlightWithinTextarea('update');
            $("#grid_size_form").css("visibility", "hidden");
        }
    });
});