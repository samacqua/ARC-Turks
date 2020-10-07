var START_DATE;
var ATTEMPT_JSONS = [];
var GOOD_WORDS = [];
var PAST_DESCS = [];

$(window).on('load', function () {
    // get date to check they are trying before giving up
    START_DATE = new Date();

    // get progress bar completion
    size_progress_bar();
    update_progress_bar();

    // fill textbox forms with actual text
    $("#grid_size_desc").val(GRID_SIZE_PREFIX);
    $("#what_you_see").val(SHOULD_SEE_PREFIX);
    $("#what_you_do").val(HAVE_TO_PREFIX);

    // show initial instructions
    if (sessionStorage.getItem('done_speaker_task') == 'true') {
        $('#minimalInstructionsModal').modal('show');
    } else {
        $('#instructionsModal').modal('show');
    }

    // get words that have already been used and their word vecs
    get_words().then(words => {
        GOOD_WORDS = words.map(function (value) { return value.toLowerCase() });
        console.log("Length of previously used words:", GOOD_WORDS.length);

        // get word vecs from db and cache them
        for (i=0;i<GOOD_WORDS.length;i++) {
            get_word_vec_cache(GOOD_WORDS[i]);
        }

        // only show message about highlighting words if we will be highlighting words
        if (GOOD_WORDS.length < MIN_WORDS) {
            for (i=0;i<TUT_LIST.length;i++) {
                if (TUT_LIST[i][0].includes("If you use a word in your description that has not been used")) {
                    TUT_LIST.splice(i, 1);
                }
            }
        }
    }).catch(error => {
        errorMsg("Could not load words that can been used. Please check your internet connection and reload the page.");
    });

    // get speaker task
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const task = urlParams.get('task') || Math.floor(Math.random()*NUM_TASKS);  // if none provided, give random task (just for when messing around w it, won't actually happen)

    DESCRIPTIONS_TYPE = sessionStorage.getItem('type') || "nl";
    loadTask(task);
    get_task_descriptions(task, DESCRIPTIONS_TYPE).then(function (descriptions) {
        PAST_DESCS = descriptions;
        createExampleDescsPager(descriptions);
        showDescEx(0);

        // if no descriptions, do not tell them about the anatomy of descriptions
        if (descriptions.length == 0) {
            for (i=0;i<TUT_LIST.length;i++) {
                if (TUT_LIST[i][0].includes("At the bottom of each description")) {
                    TUT_LIST.splice(i, 1);
                }
            }
        }
    }).catch(error => {
        errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry.");
    });

    if (DESCRIPTIONS_TYPE == "nl") {
        $("#select_ex_io").remove();
    } else if (DESCRIPTIONS_TYPE == "nl_ex") {
        for (i=0;i<TUT_LIST.length;i++) {
            if (TUT_LIST[i][0].includes("describe what you need to do to create the correct output")) {
                TUT_LIST.splice(i+1, 0, ["Then, select one input output example to go along with your description.", ["select_ex_io"], 40, 5, 35]);
            }
        }
    } else if (DESCRIPTIONS_TYPE == "ex") {
        console.error("Description type for speaker task should be natural language or natural language+example, not just example.");
    }
});


// ==============
// Tutorial
// ==============

var TUT_LIST = [
    ["You will now be walked through the layout. Click any of the un-highlighted area to continue.", [], 30, 20, 20],
    ["This is the examples area. As you can see, there are multiple input-output examples. There is a single pattern that changes each input grid to its respective output grid.", ["io_ex_col"], 30, 35, 10],
    ["This is the old descriptions area. Any past attempts to describe the pattern will be shown here.", ["description_ex_col"], 30, 5, 65],
    ["At the bottom of each description, you will see how well people did using the description. So, if the description did pretty well, you may want to slightly change it. But, if it did badly, you should rewrite the entire description.", ["description_ex_col"], 30, 5, 65],
    ["This is the description area. This is where you will describe the pattern you recognized in the examples area. You will break your description into 3 sections:", ["description_col"], 30, 10, 35],
    ["First, describe how the grid size changes. If it does not change, then make a note of that.", ["grid_size_form"], 40, 10, 35],
    ["Then describe what you should expect to see in the input.", ["see_desc_form"], 40, 10, 35],
    ["Then, describe what you need to do to create the correct output. Keep in mind that the person using your description will see a different input grid than you are seeing.", ["do_desc_form"], 40, 5, 35],
    ["If you use a word in your description that has not been used, it will be highlighted red. To submit your description, you must replace every red word, or manually add it.", ["description_col"], 40, 5, 35],
    ["If you realize you do not know the pattern, or you cannot describe the pattern, you can give up. If you give up, you will be given a new task to solve instead.", ["give_up_btn"], 40, 5, 35],
    ["Once you are happy with your description, press the Submit button.", ["submit_btn"], 40, 5, 35],
];

var CUR_HIGHLIGHT = null;

$(function () {
    $("#tut-layer").click(function () {
        continue_tutorial();
    });
});

function continue_tutorial() {

    // if last one, then get rid of dark layer
    if (TUT_LIST.length == 0) {
        $("#trans-layer").css('z-index', -1);
        $("#dark-layer").css('z-index', -1);
        $("#dark-layer").css('background-color', 'white');
        $("#tut-message").css('z-index', -2);
        $("#tut-continue-message").css('z-index', -2);
        $("#tut-continue-message").css('background', 'rgba(0,0,0,0.0)');

        scroll_highlight_objective();
        
        return;
    }

    const next_item = TUT_LIST.shift();

    if (arraysEqual(next_item[1], ["grid_size_form"])) {
        $("#grid_size_form").css("visibility", "visible");
    }


    // set last item to be behind dark layer
    if (CUR_HIGHLIGHT != null) {
        for (i = 0; i < CUR_HIGHLIGHT.length; i++) {
            $(`#${CUR_HIGHLIGHT[i]}`).css('position', 'static');
            $(`#${CUR_HIGHLIGHT[i]}`).css('z-index', 'auto');
        }
    }

    // set dark layer and message
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
    for (i = 0; i < next_item[1].length; i++) {
        const id = next_item[1][i];
        $(`#${id}`).css('position', 'relative');
        $(`#${id}`).css('z-index', '501');
        if (id != "objective-col") {
            $(`#${id}`).css('background-color', 'gainsboro');
        }
    }

    // scroll to highlighted element
    if (next_item[1].length > 0) {
        $([document.documentElement, document.body]).animate({
            scrollTop: $('#' + next_item[1][0]).offset().top-10
        }, 1000);
    }

    CUR_HIGHLIGHT = next_item[1];
}

// ==============
// Past Descriptions
// ==============

var CURRENT_DESC = 0;

function createExampleDescsPager() {

    if (PAST_DESCS.length > 1) {
        $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${Math.max(CURRENT_DESC - 1, 0)})">Previous</a></li>`);
        for (i = 0; i < PAST_DESCS.length; i++) {
            $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${i});">${i + 1}</a></li>`);
        }
        $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${Math.min(CURRENT_DESC + 1, PAST_DESCS.length - 1)})">Next</a></li>`);
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
    $("#desc_success").text(`${PAST_DESCS[i]['num_success']} of ${PAST_DESCS[i]['num_attempts']} people succeeded using this description.`);
}

// ==============
// Highlight unused words
// ==============

// returns the regex for words that have not been used yet
function get_bad_words(input) {
    if (GOOD_WORDS.length > MIN_WORDS) {
        return new RegExp('\\b(?!(' + GOOD_WORDS.join("|") + ')\\b)[a-zA-Z]+', 'gmi')
    } else {
        return new RegExp('^\b$')
    }
}

// if the word has already been fetched, then returns its vec
// otherwise, fetches from database
CACHED_W2V = {};
CACHED_WORDS = [];
function get_word_vec_cache(word) {
    return new Promise(function (resolve, reject) {
        if (CACHED_WORDS.includes(word)) {
            return resolve(CACHED_W2V[word]);
        } else {
            get_word_vec(word).then(vec => {
                CACHED_WORDS.push(word);
                CACHED_W2V[word] = vec;
                return resolve(vec);
            });
        }
    });
}

function compare(a, b) {
    if (a[0] > b[0]) return 1;
    if (b[0] > a[0]) return -1;
  
    return 0;
}

// get the closest n words (n=limit) that are in GOOD_WORDS
function get_closest_words(word, limit=10) {
    var dists = [];

    return new Promise(function (resolve, reject) {
        // get word vec of first word
        get_word_vec_cache(word).then(vec1 => {

            (async function loop() {
                // get word vec for every word in GOOD_WORDS
                for (i=0;i<=GOOD_WORDS.length;i++) {
                    await new Promise(function (res, rej) {

                        if (i == GOOD_WORDS.length) {
                            var closest = dists.sort(compare).slice(0,limit);
                            return resolve(closest);
                        }

                        const comp_word = GOOD_WORDS[i];
                        get_word_vec_cache(comp_word).then(vec2 => {

                            if (vec1 == null || vec2 == null) {
                                dists.push([100, comp_word]);
                                res();
                            } else {
                                const dist = get_dist(vec1, vec2);
                                dists.push([dist, comp_word]);
                                res();
                            }
                        });
                    });
                }
            })();
        });
    });
}

// for each word that has not been used, returns that word and its closest meaning words that have been used in past descriptions
function get_replacement_words(words, limit=10) {

    return new Promise(function (resolve, reject) {
        if (words == null) {
            return resolve([])
        }

        const replace_words = [];

        (async function loop2() {
            for (ii = 0; ii <= words.length; ii++) {
                await new Promise(function (res2, rej) {

                    if (ii == words.length) {
                        return resolve(replace_words);
                    }

                    const word = words[ii].toLowerCase();
                    get_closest_words(word, limit).then(closest => {

                        // if written word, make them replace with num
                        // better way than writing out mappings? must be.
                        const str_num_mapping = { 'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 };
                        if (str_num_mapping[word] !== undefined) {
                            closest = [([0, str_num_mapping[word]])];
                        }

                        replace_words.push([words[ii], closest]);

                        res2();
                    });
                });
            }
        })();
    });
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

$(document).ready(function () {

    // when textarea changes
    $('textarea').on("keyup", function () {

        // so they can't delete prefix
        var value = $(this).val();
        const prefix_mapping = { 'grid_size_desc': GRID_SIZE_PREFIX, 'what_you_see': SHOULD_SEE_PREFIX, 'what_you_do': HAVE_TO_PREFIX }
        const id = $(this).attr("id");
        var prefix = prefix_mapping[id];
        $(this).val(prefix + value.substring(prefix.length));

        // for each novel word, add a row with buttons to replace word with similar words in database, or add the word
        $('#word-warning-' + id).empty();

        const words_to_replace = value.match(get_bad_words());
        if (words_to_replace != null && words_to_replace.length != 0 && GOOD_WORDS.length > MIN_WORDS) {

            var items = [];
            $.each(words_to_replace, function (i, word) {

                // create the html for the list items
                items.push(
                    `<li><b>${word}</b>
                    <span class="dropdown">
                    <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Replace with...
                    </button>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenuButton" id=${word}_${i}_dropdown>
                    </div>
                    <button type="button" onclick="confirm_add_word(\'${word}\')" id="add_word_${word}" class="btn btn-danger add-word">add word</button></li>
                    </span>`);
            });

            $('#word-warning-' + id).append(items.join(''));

        }

        get_replacement_words(words_to_replace).then(replacements => {

            if (words_to_replace != null && words_to_replace.length != 0 && GOOD_WORDS.length > MIN_WORDS) {

                replacements.forEach(function(replacement_i, i) {

                    const word = replacement_i[0];
                    const replacement_words = replacement_i[1].map(function(item) { return item[1] });

                    if($(`#${word}_${i}_dropdown`).length != 0) {
                        $(`#${word}_${i}_dropdown`).empty();
                        $(`#${word}_${i}_dropdown`).append(
                            `${(function () {
                                var html_text = "";
                                for (i = 0; i < replacement_words.length; i++) {
                                    const replacement = replacement_words[i];
                                    const dropdown_item = `<a onclick="replace_word(\'${word}\',\'${replacement}\', '#${id}')" id="replace_${word}_0>${replacement}" class="dropdown-item" href="#">${replacement}</a>`;
                                    html_text += dropdown_item;
                                }
                                return html_text
                            })()}`
                        );
                    }
                });
                // for (i=0;i<replacements.length;i++) {


                // }
            }

        });
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
    $("#conf_form").change(function () {
        $("#conf_result").html($(this).val());
    });
});

// ==============
// Other Page Logic
// ==============

function submit() {
    /**
     * If starting with right phrase, actually entered text, and has used all known words or added the unknown words, then unhide validation
     */

    if ($("#grid_size_desc").val().trim().length - GRID_SIZE_PREFIX.length < 5) {
        errorMsg("Please enter a description of how the grid size changes.");
        return
    }
    if ($("#what_you_see").val().trim().length - SHOULD_SEE_PREFIX.length < 5) {
        errorMsg("Please enter a description of what you see.");
        return
    }
    if ($("#what_you_do").val().trim().length - HAVE_TO_PREFIX.length < 5) {
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

    if ($('#word-warning-grid_size_desc').children().length + $('#word-warning-what_you_see').children().length + $('#word-warning-what_you_do').children().length != 0) {
        errorMsg("You must get rid of all red-highlighted words. If they are absolutely necessary for your description, add that word.");
        return
    }

    verify();

}

function verify() {
    /**
     * store submitted values and go to next task
     */

    // get entered values
    const see_desc = $.trim($("#what_you_see").val());
    const do_desc = $.trim($("#what_you_do").val());
    var grid_size_desc = $.trim($("#grid_size_desc").val());
    var selected_example = -1;
    if (DESCRIPTIONS_TYPE.includes("ex")) {
        selected_example = parseInt($.trim($("#selectExampleIO").val()) - 1);
    }

    infoMsg("Bringing you to verfication...")

    const newTime = new Date();
    const totalTime = (newTime - START_DATE) / 1000;

    // Bring the user to the listener page, but show them their own description to ensure they wrote something decent
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    window.location.href = `listener.html?task=${urlParams.get('task') || "0"}&time=${totalTime}&see=${see_desc}&do=${do_desc}&grid=${grid_size_desc}&se=${selected_example}&ver=true`;
}

function give_up() {
    /**
     * if after 1 minute, cannot figure out pattern or get correct output, give them the answer
     */

    const newTime = new Date();
    if ((newTime - START_DATE) / 1000 < 30) {
        errorMsg("Please try to figure out the pattern for at least thirty seconds before you give up.");
        return;
    }

    // don't give them credit for completing the task if they have not completed it
    give_up_description(TASK_ID, DESCRIPTIONS_TYPE).then(function () {

        set_user_complete_time(sessionStorage.getItem("uid"), (newTime - START_DATE) / 1000, `${TASK_ID}_${DESCRIPTIONS_TYPE}_speaker_(veto)`).then(function() {
            var tasks_done = (sessionStorage.getItem('tasks_completed') || "").split(',');
            tasks_done.push(TASK_ID);
            sessionStorage.setItem('tasks_completed', tasks_done);
    
            next_task(first_task = true);
        });
    });
}