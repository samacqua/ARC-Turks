var START_DATE;
var ATTEMPT_JSONS = [];
var GAVE_UP = false;
var GOOD_WORDS = [];

const uid = sessionStorage.getItem('uid');

$(window).on('load',function(){
    // get date to check they are trying before giving up
    START_DATE = new Date();

    // get progress bar completion
    update_progress_bar();

    // hide validation form
    $("#grid_size_form").css("visibility", "hidden")

    // fill textbox forms with actual text
    $("#grid_size_desc").val(GRID_SIZE_PREFIX);
    $("#what_you_see").val(SHOULD_SEE_PREFIX);
    $("#what_you_do").val(HAVE_TO_PREFIX);

    // show initial instructions
    $('#instructionsModal').modal('show');

    // get words that have already been used
    get_words().then(words => {
        GOOD_WORDS = words.map(function(value) {
            return value.toLowerCase();
        });
        console.log(GOOD_WORDS);
    }).catch(error => {
        infoMsg("Could not load words that can been used. Please check your internet connection and reload the page.");
    });

    // get speaker task
    const id = 0;
    TASK_ID = id;
    loadTask(id);
    get_task_descriptions(id, "language_and_example").then(function(descriptions) {
        PAST_DESCS = descriptions;
        createExampleDescsPager(descriptions);
        showDescEx(0);
    }).catch(error => {
        errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry.");
    });
});

var TUT_LIST = [
    ["You will now be walked through the layout. Click any of the un-highlighted area to continue.", [], 200, 20, 20],
    ["This is the examples area. As you can see, there are multiple input-output examples. There is a common pattern that changes each input grid to its respective output grid.", ["io_ex_col"], 30, 30, 10],
    ["This is the old descriptions area. Any past attempts to describe the pattern will be shown here.", ["description_ex_col"], 40, 20, 20],
    ["At the bottom of each description, you will see how well people did using the description. So, if the description did pretty well, you may want to slightly change it. But, if it did badly, you should rewrite the entire description.", ["description_ex_col"], 40, 20, 20],
    ["This is the description area. This is where you will describe the pattern you recognized in the examples area. You will break your description into 3 sections:", ["description_col"], 40, 20, 20],
    ["First, if the grid size changes, check this box.", ["grid_size_change_box"], 180, 10, 30],
    ["If the grid size does change, then describe how it changed.", ["grid_size_form"], 180, 10, 30],
    ["Then describe what you should expect to see in the input.", ["see_desc_form"], 400, 5, 35],
    ["Then, describe what you need to do to create the correct output. Keep in mind that the person using your description will see a different input grid than you are seeing.", ["do_desc_form"], 400, 5, 35],
    ["You can pass on one input-out example with your description. Choose the example that will best enable someone else to correctly understand the pattern.", ['select_ex_io'], 400, 5, 35],
    ["If you use a word in your description that has not been used, it will be highlighted red. To submit your description, you must replace every red word, or manually add it.", ["description_col"], 400, 5, 35],
    ["Once you are happy with your description, press the Submit button. If you cannot describe the pattern, or realize you do not know the pattern, you can give up (but you will not be eligible for a bonus).", ["desc_col_buttons"], 500, 5, 35],
];

var CUR_HIGHLIGHT = null;

$(function(){
    $( "#dark-layer" ).click(function() {
        continue_tutorial();
    });
    $("#tut-message").click(function() {
        continue_tutorial();
    });
    $("#tut-continue-message").click(function() {
        continue_tutorial();
    });
});

function continue_tutorial() {

    // if last one, then get rid of dark layer
    if (TUT_LIST.length == 0) {
        $("#dark-layer").css('z-index', -1);
        $("#dark-layer").css('background-color', 'white');
        $("#tut-message").css('z-index', -2);
        $("#tut-continue-message").css('z-index', -2);

        $("#grid_size_form").css("visibility", "hidden");

        return;
    }

    const next_item = TUT_LIST.shift();

    if (arraysEqual(next_item[1], ["grid_size_form"])) {
        $("#grid_size_form").css("visibility", "visible");
    }


    // set last item to be behind dark layer
    if (CUR_HIGHLIGHT != null) {
        for(i=0;i<CUR_HIGHLIGHT.length;i++) {
            $(`#${CUR_HIGHLIGHT[i]}`).css('position', 'static');
            $(`#${CUR_HIGHLIGHT[i]}`).css('z-index', 'auto');
        }
    }

    // set dark layer and message
    $("#dark-layer").css('z-index', 500);
    $("#dark-layer").css('background-color', 'rgba(0,0,0,0.7)');
    $("#tut-message").css('z-index', 502);
    $("#tut-message").css('top', `${next_item[2]}px`);
    $("#tut-message").css('left', `${next_item[3]}%`);
    $("#tut-message").css('right', `${next_item[4]}%`);
    $("#tut-message").html(next_item[0]);
    $("#tut-continue-message").css('z-index', 502);

    if (next_item[1].length > 1) {
        $("#objective-text").html(next_item[0]);
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

var PAST_DESCS = [];

var CURRENT_DESC = 0;


function createExampleDescsPager() {

    if (PAST_DESCS.length > 1) {
        $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${Math.max(CURRENT_DESC-1, 0)})">Previous</a></li>`);
        for (i=0;i<PAST_DESCS.length;i++) {
            $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${i});">${i+1}</a></li>`);
        }
        $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${Math.min(CURRENT_DESC+1, PAST_DESCS.length-1)})">Next</a></li>`);
    }
}

function showDescEx(i) {
    if (PAST_DESCS.length == 0) {
        $("#ex_size_desc").text("There are no descriptions for this task yet.");
        return;
    }
    $("#ex_size_desc").text(PAST_DESCS[i]['grid_desc']);
    $("#ex_see_desc").text(PAST_DESCS[i]['see_desc']);
    $("#ex_do_desc").text(PAST_DESCS[i]['do_desc']);
    $("#ex_ex_io").text(`Chosen example: ${PAST_DESCS[i]['selected_ex']+1}`);  // TODO: Load task
    $("#desc_success").text(`${PAST_DESCS[i]['num_success']} of ${PAST_DESCS[i]['num_attempts']} people succeeded using this description.`);
}

function get_bad_words(input) {
    return new RegExp('\\b(?!(' + GOOD_WORDS.join("|") + ')\\b)[a-zA-Z]+', 'gmi')
}

function get_replacement_words(words) {

    if (words == null) {
        return []
    }
    
    const replace_words = [];
    for (i=0; i<words.length;i++) {
        const word = words[i].toLowerCase();
        const dists = GOOD_WORDS.map(function(x){return get_dist(word, x)});

        var closest = dists.sort().slice(0,2);

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

function replace_word(word, replacement, text_area_id) {
    console.log("replacing " + word + " with " + replacement);

    const cur_text = $(text_area_id).val();
    const replaced_text = cur_text.replace(word, replacement);
    $(text_area_id).val(replaced_text);

    $(text_area_id).trigger('keyup');
    $(text_area_id).highlightWithinTextarea('update');
}

var CUR_WORD_CANDIDATE;

// makes the word okay to use
function confirm_add_word(word) {

    CUR_WORD_CANDIDATE = word;

    $("#word_modal_text").text(word);
    $("#addWordModal").modal('show');
}

// makes the word okay to use
function add_current_candidate_word() {

    GOOD_WORDS.push(CUR_WORD_CANDIDATE);

    // so that functions called on textarea changes are called, and so highlights resize
    $("textarea").trigger('keyup');
    $("textarea").highlightWithinTextarea('update');
}


$(document).ready(function() {

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
                + `<button type="button" onclick="confirm_add_word(\'${item[0]}\')" id="add_word_${item[0]}" class="btn btn-danger add-word">add word</button></li>`);
    
            });
    
            $('#word-warning-size').append(items.join(''));
        }
    });

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
                + `<button type="button" onclick="confirm_add_word(\'${item[0]}\')" id="add_word_${item[0]}" class="btn btn-danger add-word">add word</button></li>`);
    
            });
    
            $('#word-warning-see').append(items.join(''));
        }
    });

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
                + `<button type="button" onclick="confirm_add_word(\'${item[0]}\')" id="add_word_${item[0]}" class="btn btn-danger add-word">add word</button></li>`);
    
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


    /**
     * Make it so modal with sliders has labels of slider values
     */
    $("#conf_result").html($("#conf_form").val());
    $("#conf_form").change(function(){
        $("#conf_result").html($(this).val());
    });
});

function submit() {
    /**
     * If starting with right phrase and actually entered text, then unhide validation
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

    $("#task_qs_modal").modal("show");

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
    // -1 bc presenting from 1 instead of starting from 0
    const selected_example = parseInt($.trim($("#selectExampleIO").val()) - 1);

    if (grid_size_desc == GRID_SIZE_PREFIX) {
        grid_size_desc = `${GRID_SIZE_PREFIX} does not change.`
    }

    infoMsg("All done! Loading next task...")

    const newTime = new Date();
    const totalTime = (newTime - START_DATE) / 1000;
    
    store_description(see_desc, do_desc, grid_size_desc, TASK_ID, uid, ATTEMPT_JSONS.length, ATTEMPT_JSONS, conf, totalTime, selected_example, gave_up_verification=GAVE_UP)
        .then(function() { finish(); })
        .catch(function(error) { console.log('Error storing response ' + error); });
}

function finish() {
    $("#finish_modal_uid").text(uid.toString());
    $("#finished_modal").modal('show');

    const end_time = new Date();
    const delta_time = (parseInt(end_time.getTime()) - parseInt(sessionStorage.getItem('start_time'))) / 1000;

    set_user_complete_time(uid, delta_time, 'time_to_complete');
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

    give_up_description(TASK_ID).then(function() {
        finish();
    });
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