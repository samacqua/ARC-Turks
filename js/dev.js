var STUDY_BATCH = "pilot"; // the current study batch we are looking at
var DESC_USES = {};        // stores the attempts for each description

var STUDY_BATCHES = {
    pilot: {
        config: {
            apiKey: "AIzaSyDDDTu85WtFnqwJlwZdon1accivFQzOKFw",
            authDomain: "arc-pilot.firebaseapp.com",
            databaseURL: "https://arc-pilot.firebaseio.com",
            projectId: "arc-pilot",
            storageBucket: "arc-pilot.appspot.com",
            messagingSenderId: "16504691809",
            appId: "1:16504691809:web:e847b8e2fd07580e6e1e20"
        },
        tasks: [149, 286, 140, 354, 219, 277, 28, 135, 162, 384, 297, 26, 299, 388, 246, 74, 305, 94, 308, 77]
    }
}

$(window).on('load', function () {

    if(!localStorage.getItem("visited")){
        $("#welcome-modal").modal("show");
        localStorage.setItem("visited",true);
    }

    // get speaker task
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const task = urlParams.get('task') || TASKS[Math.floor(Math.random()*NUM_TASKS)];  // if none provided, give random task

    DESCRIPTIONS_TYPE = sessionStorage.getItem('type') || "nl";

    load_new_task(task);

    $("#evaluation_input").addClass("no-display");

    if (DESCRIPTIONS_TYPE == "nl") {
        $("#select_ex_io").remove();
    }

    // correctly change active buttons as user navigates page
    $(document).on("click", ".desc_build_row_btn", function(event) {
        $(".desc_build_row_btn").removeClass("active");
        $(this).addClass("active");
    });
    $(document).on("click", ".attempt_row", function(event) {
        $(".attempt_row").removeClass("active");
        $(this).addClass("active");
    });
});

// ==============
// Past Descriptions
// ==============

var CURRENT_DESC_I = 0;

/**
 * create the pager to go through past descriptions
 * @param {number} cur_ex the current example to show
 */
function createExampleDescsPager(cur_ex=0) {

    $("#paginator").empty();

    if (PAST_DESCS.length >= 1) {
        $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${Math.max(CURRENT_DESC_I - 1, 0)}); createExampleDescsPager(${Math.max(CURRENT_DESC_I-1, 0)});">Previous</a></li>`);

        // show all descs in pager
        if (PAST_DESCS.length <= 4) {
            for (i = 0; i < PAST_DESCS.length; i++) {
                if (i == cur_ex) {
                    $("#paginator").append(`<li class="page-item active"><a class="page-link" href="#" onclick="showDescEx(${i});createExampleDescsPager(${i});">${i + 1}</a></li>`);
                } else {
                    $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${i});createExampleDescsPager(${i});">${i + 1}</a></li>`);
                }
            }
        // too many to show at once, so only show some, and ellipses
        } else {
            if (cur_ex > 1  && cur_ex < PAST_DESCS.length - 2) {
                $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(0);createExampleDescsPager(0);">1</a></li>`);
                $("#paginator").append(`<li class="page-item disabled"><a class="page-link">...</a></li>`);
                $("#paginator").append(`<li class="page-item active"><a class="page-link" href="#" onclick="showDescEx(${cur_ex});createExampleDescsPager(${cur_ex});">${cur_ex + 1}</a></li>`);
                $("#paginator").append(`<li class="page-item disabled"><a class="page-link">...</a></li>`);
                $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${PAST_DESCS.length-1});createExampleDescsPager(${PAST_DESCS.length-1});">${PAST_DESCS.length}</a></li>`);
            } else {
                function isActive(i) {
                    if (cur_ex == i) {
                        return 'active'
                    }
                }
                $("#paginator").append(`<li class="page-item ${isActive(0)}"><a class="page-link" href="#" onclick="showDescEx(0);createExampleDescsPager(0);">1</a></li>`);
                $("#paginator").append(`<li class="page-item ${isActive(1)}"><a class="page-link" href="#" onclick="showDescEx(1);createExampleDescsPager(1);">2</a></li>`);
                $("#paginator").append(`<li class="page-item disabled"><a class="page-link">...</a></li>`);
                $("#paginator").append(`<li class="page-item ${isActive(PAST_DESCS.length-2)}"><a class="page-link" href="#" onclick="showDescEx(${PAST_DESCS.length-2});createExampleDescsPager(${PAST_DESCS.length-2});">${PAST_DESCS.length-1}</a></li>`);
                $("#paginator").append(`<li class="page-item ${isActive(PAST_DESCS.length-1)}"><a class="page-link" href="#" onclick="showDescEx(${PAST_DESCS.length-1});createExampleDescsPager(${PAST_DESCS.length-1});">${PAST_DESCS.length}</a></li>`);
            }
        }
        $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${Math.min(CURRENT_DESC_I + 1, PAST_DESCS.length - 1)}); createExampleDescsPager(${Math.min(CURRENT_DESC_I+1, PAST_DESCS.length - 1)}); ">Next</a></li>`);
    }
}

/**
 * show the selected description with a list of its attempts
 * @param {number} i the index of the description to show
 */
function showDescEx(i) {

    if (PAST_DESCS.length == 0) {
        $("#ex_size_desc").text("There are no descriptions for this task yet.");
        $("#ex_see_desc").empty();
        $("#ex_do_desc").empty();
        $("#desc_success").empty();
        return;
    }

    CURRENT_DESC_I = i;
    let cur_desc = PAST_DESCS[i];

    // set the description's text
    $("#ex_size_desc").text(cur_desc['grid_desc']);
    $("#ex_see_desc").text(cur_desc['see_desc']);
    $("#ex_do_desc").text(cur_desc['do_desc']);
    if (cur_desc.succeeded_verification == false) {
        $("#desc_success").html(`The describer failed the verification.`);
    } else if (cur_desc.confidence <= 3) {
        $("#desc_success").html(`The describer completed the verification, but their confidence was too low (${cur_desc.confidence}/10).`);
    } else {
        $("#desc_success").html(`<b>${cur_desc['display_num_success']}</b> out of <b>${cur_desc['display_num_attempts']}</b> people successfully solved the task using this description.`);
    }

    // show the description attempts
    show_desc(CURRENT_DESC_I);
    create_desc_and_attempts_buttons(cur_desc, CURRENT_DESC_I);
}

/**
 * Create the html for the buttons of a given description (and its uses)
 * @param {Object} desc the description to represent
 * @param {number} i the index of the description in PAST_DESCS
 */
function create_desc_and_attempts_buttons(desc, i) {
    let emoji_rep = "❌ ❌ ❌";
    if (desc.succeeded_verification != false) {
        emoji_rep = "❌ ".repeat(desc.num_verification_attempts - 1) + "✅";
    }
    let desc_use_html = `
    <div class="desc_build_row">
        <button type="button" class="btn btn-secondary desc_build_row_btn active" onclick="show_desc(${i});">
            <span class="build_name">describer verification</span><span class="attempt_preview">${emoji_rep}</span>
        </button>
        <button type="button" class="btn btn-secondary desc_build_row_info" onclick="show_desc_info(${i});">ⓘ</button>
    </div>`;

    // list all uses of the description
    get_desc_builds(desc.type, desc.task, desc.id).then(builds => {
        for (let i=0;i<builds.length; i++) {
            let build = builds[i];

            let emoji_rep = "❌ ".repeat(build.num_attempts - 1) + "✅";
            if (build.success == false) {
                emoji_rep = "❌ ❌ ❌"
            }

            let row = `
            <div class="desc_build_row">
                <button type="button" class="btn btn-secondary desc_build_row_btn" onclick="show_attempt('${desc.id}', '${build.id}', ${i+1});">
                    <span class="build_name">builder ${i+1}</span><span class="attempt_preview">${emoji_rep}</span>
                </button>
                <button type="button" class="btn btn-secondary desc_build_row_info" onclick="show_use_info('${desc.id}', '${build.id}');">ⓘ</button>
            </div>`

            desc_use_html += row;
        }
        $("#desc_uses").html(desc_use_html);
    });
}

/**
 * Create and show the modal displaying all retrieved information about a listener attempt
 * @param {string} desc_id the ID of the description the listener attempted
 * @param {string} attempt_id the ID of the attempt to show
 */
function show_use_info(desc_id, attempt_id) {
    let desc_uses = DESC_USES[desc_id];
    let use = desc_uses.find(i => i.id == attempt_id);

    // loop through use object and get all properties
    let properties = [];
    Object.keys(use).forEach(function(key) {
        if (['attempt_jsons', 'grid_desc', 'see_desc', 'do_desc'].includes(key)) {

        } else if (key == 'timestamp') {
            properties.push(`<li class="list-group-item"><b>${key}</b>: ${timeConverter(use[key].seconds)}</li>`);
        } else {
            properties.push(`<li class="list-group-item"><b>${key}</b>: ${use[key]}</li>`);
        }
    });

    // set html and show modal
    $("#build_or_desc_info").html(properties.join(''));
    $("#info_modal_title").text("Description build data");
    $("#info-modal").modal("show");
}

/**
 * Create and show the modal displaying all retrieved information about a description
 * @param {number} desc_index the index of the description in PAST_DESCS
 */
function show_desc_info(desc_index) {
    let cur_desc = PAST_DESCS[desc_index];

    // loop through use object and get all properties
    let properties = [];
    Object.keys(cur_desc).forEach(function(key) {

        if (['attempt_jsons', 'grid_desc', 'see_desc', 'do_desc'].includes(key)) {
            // pass
        } else if (key == 'timestamp') {
            properties.push(`<li class="list-group-item"><b>${key}</b>: ${timeConverter(cur_desc[key].seconds)}</li>`);
        } else {
            properties.push(`<li class="list-group-item"><b>${key}</b>: ${cur_desc[key]}</li>`);
        }
    });

    // set html and show modal
    $("#build_or_desc_info").html(properties.join(''));
    $("#info_modal_title").text("Description data");
    $("#info-modal").modal("show");
}

/**
 * Turn a timestamp into a readable string
 * @param {number} UNIX_timestamp the timestamp to convert
 * @returns {string} the string displaying the date
 */
function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }

/**
 * show the attempts of a description
 * @param {number} cur_desc_i the index of the description to show
 */
function show_desc(cur_desc_i) {

    CUR_ACTION_I = -1;
    if (REPLAY_TIMEOUT) {
        clearTimeout(REPLAY_TIMEOUT);
    }
    let cur_desc = PAST_DESCS[cur_desc_i];

    // add a button for each attempt
    attempts_html = "";
    for (let i=0;i<cur_desc.attempt_jsons.length; i++) {

        let emoji_rep = "❌";
        if (cur_desc.succeeded_verification != false && i == cur_desc.attempt_jsons.length-1) {
            emoji_rep = "✅"
        }

        let row;
        if (i != cur_desc.attempt_jsons.length - 1) {
            row = `
            <button type="button" class="btn btn-secondary attempt_row" onclick='show_attempt_json(${cur_desc.attempt_jsons[i]})'>
                <span class="build_name">verification attempt ${i+1}</span><span class="attempt_preview">${emoji_rep}</span>
            </button>`
        } else {
            row = `
            <button type="button" class="btn btn-secondary attempt_row active" onclick='show_attempt_json(${cur_desc.attempt_jsons[i]})'>
                <span class="build_name">verification attempt ${i+1}</span><span class="attempt_preview">${emoji_rep}</span>
            </button>`
        }
        
        attempts_html += row;
    }

    // add button for playing through the currently selected attempt
    attempts_html += `
    <div class="replay_create btn-group attempt_row">
        <button type="button" class="btn btn-secondary" onclick='replay_create(${cur_desc.attempts_sequence})'>▶</button>
        <button type="button" class="btn btn-secondary" onclick='reset_replay();'>⟲</button>
        <button type="button" class="btn btn-secondary" onclick='play_action(${cur_desc.attempts_sequence})'>></button>
    </div>`

    // set html
    $("#attempts_row").html(attempts_html);
    $("#output-title").text("Description verification attempts");

    show_attempt_json(cur_desc.attempt_jsons[cur_desc.attempt_jsons.length-1]);
}

var CUR_ACTION_I = -1;

/**
 * show the attempt on a description
 * @param {string} desc_id the description id
 * @param {string} attempt_id the attempt id
 * @param {number} builder_num a simple number to differentiate different builders
 */
function show_attempt(desc_id, attempt_id, builder_num) {

    CUR_ACTION_I = -1;
    if (REPLAY_TIMEOUT) {
        clearTimeout(REPLAY_TIMEOUT);
    }

    let desc_uses = DESC_USES[desc_id];
    let use = desc_uses.find(i => i.id == attempt_id);

    // create a button for each builder's attempt
    attempts_html = "";
    for (let i=0;i<use.num_attempts; i++) {

        let emoji_rep = "❌";
        if (use.success == true && i == use.num_attempts-1) {
            emoji_rep = "✅"
        }

        function isActive(i) {
            if (use.num_attempts - 1 == i) {
                return 'active'
            }
        }
        let row = `
            <button type="button" class="btn btn-secondary attempt_row ${isActive(i)}" onclick='show_attempt_json(${use.attempt_jsons[i]})'>
                <span class="build_name">attempt ${i+1}</span><span class="attempt_preview">${emoji_rep}</span>
            </button>`;

        attempts_html += row;
    }

     // add button for playing through the currently selected attempt
    attempts_html += `
    <div class="replay_create btn-group attempt_row">
        <button type="button" class="btn btn-secondary" onclick='replay_create(${use.attempts_sequence})'>▶</button>
        <button type="button" class="btn btn-secondary" onclick='reset_replay();'>⟲</button>
        <button type="button" class="btn btn-secondary" onclick='play_action(${use.attempts_sequence})'>></button>
    </div>`
    $("#attempts_row").html(attempts_html);

    $("#output-title").text("Builder " + builder_num.toString() + " attempts")

    show_attempt_json(use.attempt_jsons[use.attempt_jsons.length-1]);
}

/**
 * show a user's attempt on the output grid
 * @param {Object} json the stringified json of the attempt
 */
function show_attempt_json(json) {
    let grid = eval(json);

    CURRENT_OUTPUT_GRID.grid = grid;
    CURRENT_OUTPUT_GRID.height = grid.length;
    CURRENT_OUTPUT_GRID.width = grid[0].length;
    $("#output_grid_size").val(CURRENT_OUTPUT_GRID.width + 'x' + CURRENT_OUTPUT_GRID.height);
    update_div_from_grid_state($(`#output_grid .editable_grid`), CURRENT_OUTPUT_GRID);
}

/**
 * listen for change to show either train IO grids or test input
 */
$(document).on('change', 'input:radio[id^="show_grids_radio"]', function (event) {

    if (this.id == 'show_grids_radio_train') {
        $("#evaluation_input").addClass('no-display');
        $("#task_preview").removeClass('no-display');
    } else if (this.id == 'show_grids_radio_test') {
        $("#task_preview").addClass('no-display');
        $("#evaluation_input").removeClass('no-display');
    }
});

/**
 * load tasks into table so user can browse and choose a task
 */
function load_tasks_to_browse() {
    let study = STUDY_BATCHES[STUDY_BATCH];

    get_all_descriptions_interactions_count(DESCRIPTIONS_TYPE).then(counts => {
        var num_descriptions_list = counts[0];
        var num_interactions_list = counts[1];

        task_list = [];
        for (i=0;i<study.tasks.length;i++) {
            let task_num = study.tasks[i];
            let num_descs = num_descriptions_list[i];
            let num_interactions = num_interactions_list[i];

            task_list.push({'number': task_num, 'descriptions': num_descs, 'interactions': num_interactions});
        }

        $('#table').bootstrapTable({
            data: task_list,
            columns: [ { sortable: true },{ sortable: true },{ sortable: true },  
            {
            field: 'operate',
            title: 'Select',
            align: 'center',
            valign: 'middle',
            clickToSelect: false,
            formatter : function(value,row,index) {
                return '<button class="btn btn-secondary load-task-btn" task="'+row.number+'" data-dismiss="modal">Select</button> ';
            }
            }
        ]      
        });

        $(".load-task-btn").click(function() {
            load_new_task($(this).attr('task'));
        });
    });
}

/**
 * load a new task after user selects it
 * @param {number} task the task to load
 */
function load_new_task(task) {

    CUR_ACTION_I = -1;
    if (REPLAY_TIMEOUT) {
        clearTimeout(REPLAY_TIMEOUT);
    }

    // reset output grid
    CURRENT_OUTPUT_GRID.width = 3;
    CURRENT_OUTPUT_GRID.height = 3;
    CURRENT_OUTPUT_GRID.grid = [[0,0,0], [0,0,0], [0,0,0]];
    update_div_from_grid_state($(`#output_grid .editable_grid`), CURRENT_OUTPUT_GRID);

    // empty rows of uses and attempts
    $("#attempts_row").empty();
    $("#desc_uses").empty();

    loadTask(task).then(() => {
        add_grid_hover_listeners();
    });

    TASK_ID = task;
    $("#objective-title").html(`<b>Task ${task}</b>`);
    get_task_descriptions(task, DESCRIPTIONS_TYPE).then(function (descriptions) {
        descriptions.sort(sort_descs_bandit_score());
        PAST_DESCS = descriptions;

        createExampleDescsPager();
        showDescEx(0);

    }).catch(error => {
        errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry.");
        console.error(error);
    });
}

/**
 * stop the replay and set it back to first frame
 */
function reset_replay() {
    $("#output_grid_size").val('3x3');
    resizeOutputGrid(replay=true);
    resetOutputGrid(replay=true);
    if (REPLAY_TIMEOUT) {
        clearTimeout(REPLAY_TIMEOUT);
    }
    CUR_ACTION_I = 0;
}

/**
 * play a single action from a sequence
 * @param {Array} sequence the sequence of actions you are playing an action from
 */
function play_action(sequence) {
    if (sequence == undefined ) {
        errorMsg("This description was collected before we started monitoring action sequences.");
        return;
    } else if (sequence.length == 0 || CUR_ACTION_I >= sequence.length) {
        return;
    } else if (CUR_ACTION_I == -1) {
        $("#output_grid_size").val('3x3');
        resizeOutputGrid(replay=true);
        resetOutputGrid(replay=true);
        CUR_ACTION_I += 1;
        return;
    }

    const action = sequence[CUR_ACTION_I];
    let tool = action[0];

    // let grid = array_to_grid(action.grid);
    // console.log(grid);
    // console.log(action.action);
    // update_div_from_grid_state($(`#output_grid .editable_grid`), grid);

    CUR_ACTION_I += 1;

    switch (tool) {
        case "edit":
            [tool, x, y, symbol] = action;
            let cell = $(`div[x="${x}"][y="${y}"]`);
            cell.each(function() {  // make sure just output grid, not also input grid
                if ($(this).parent().parent().parent().attr('id') == 'output_grid') {
                    cell = $(this);
                }
            });
            set_cell_color(cell, symbol);
            break;
        case "floodfill":
            [tool, x, y, symbol] = action;
            update_grid_from_div($(`#output_grid .editable_grid`), CURRENT_OUTPUT_GRID);
            grid = CURRENT_OUTPUT_GRID.grid;
            flood_fill(grid, x, y, symbol);
            update_div_from_grid_state($(`#output_grid .editable_grid`), CURRENT_OUTPUT_GRID);
            break;
        case "copy":
            [tool, copy_paste_data] = action;
            infoMsg("copied cells.");
            break;
        case "paste":
            [tool, copy_paste_data, targetx, targety] = action;

            let selected = $(`div[x="${targetx}"][y="${targety}"]`);
            selected.each(function() {  // make sure just output grid, not also input grid
                if ($(this).parent().parent().parent().attr('id') == 'output_grid') {
                    selected = $(this);
                }
            });

            jqGrid = $(selected.parent().parent()[0]);

            xs = new Array();
            ys = new Array();
            symbols = new Array();

            for (var i = 0; i < copy_paste_data.length; i++) {
                xs.push(copy_paste_data[i][0]);
                ys.push(copy_paste_data[i][1]);
                symbols.push(copy_paste_data[i][2]);
            }

            minx = Math.min(...xs);
            miny = Math.min(...ys);
            for (var i = 0; i < xs.length; i++) {
                x = xs[i];
                y = ys[i];
                symbol = symbols[i];
                newx = x - minx + targetx;
                newy = y - miny + targety;
                res = jqGrid.find('[x="' + newx + '"][y="' + newy + '"] ');
                if (res.length == 1) {
                    let cell = $(res[0]);
                    set_cell_color(cell, symbol);
                }
            }
            break;
        case "copyFromInput":
            copyFromInput(replay=true);
            break;
        case "resetOutputGrid":
            resetOutputGrid(replay=true);
            break;
        case "resizeOutputGrid":
            [tool, x, y] = action;
            $("#output_grid_size").val(x + 'x' + y);
            resizeOutputGrid(replay=true);
            break;
        case "check":
            if (action[1] == true) {
                infoMsg("Checked: correct!");
            } else {
                errorMsg("Checked: false.");
            }
        default:
            break;
    }
}

var REPLAY_TIMEOUT;

/**
 * replay the steps a user took in creating the output
 * @param {Array} sequence the sequence of actions you are playing an action from 
 * @param {number} iter for recursion
 * @param {number} delay the amount of time (ms) between each frame
 */
function replay_create(sequence, iter=-1, delay=-1) {

    if (sequence == undefined ) {
        errorMsg("This description was collected before we started monitoring action sequences.");
        return;
    } else if (sequence.length == 0 || iter >= sequence.length) {
        return;
    } else if (iter == -1) {
        $("#output_grid_size").val('3x3');
        resizeOutputGrid(replay=true);
        resetOutputGrid(replay=true);
        CUR_ACTION_I = 0;
        replay_create(sequence, iter=CUR_ACTION_I, delay=delay);
        return;
    }

    if (delay == -1) {
        delay = 5000 / sequence.length;
    }

    REPLAY_TIMEOUT = setTimeout(function() {
        play_action(sequence);
        replay_create(sequence, iter=CUR_ACTION_I, delay=delay);
    }, delay);
}

// get all the attempted builds for a description
function get_desc_builds(description_type, task, desc_id) {
    return new Promise(function (resolve, reject) {

        if (DESC_USES[desc_id]) {
            return resolve(DESC_USES[desc_id]);
        }

        const desc_uses_ref = db.collection(description_type + "_tasks").doc(`${task}`).collection("descriptions").doc(desc_id).collection("uses");

        desc_uses_ref.get().then(function (querySnapshot) {
            console.log(`read ${querySnapshot.size} documents`);

            var uses = [];
            querySnapshot.forEach(function (doc) {
                const data = doc.data();
                const description = {
                    'num_attempts': data.num_attempts,
                    'attempt_jsons': data.attempt_jsons,
                    'attempts_sequence': data.attempts_sequence,
                    'action_sequence': data.action_sequence,
                    'success': data.success,
                    'time': data.time,
                    'timestamp': data.timestamp,
                    'id': doc.id,
                    'uid': data.uid,
                    'desc_id': desc_id,
                    'task': task,
                    'desc_type': description_type
                };
                uses.push(description);
            });


            DESC_USES[desc_id] = uses;

            return resolve(uses);
        }).catch(error => {
            return reject(error);
        });
    });
}

// ==============
// Tutorial
// ==============

var TUT_LIST = [
    ["This is the examples area. You can use the buttons to switch between the test input grid and the grid input-outputs that the describer saw.", ["io_ex_col"], 30, 35, 10],
    ["This is the descriptions area. You will see all the descriptions for the selected task.", ["description_ex_col"], 30, 5, 65],
    ["At the bottom of each description, you will see a list of buttons for each builder who tried to use the description. Clicking on a button will show the builder's attempts on the right.", ["desc_uses"], 30, 5, 65],
    ["You can click any of the buttons to show the submitted attempt. 'Play action sequence' will replay every action the user took.", ["output_grid_col"], 30, 10, 35],
    ["You can change tasks by selecting here.", ["choose-task-btn-wrapper"], 40, 10, 35],
];
var TUT_LIST_BACKUP = TUT_LIST;    // hack bc lazy

var CUR_HIGHLIGHT = null;

$(function () {
    $("#tut-layer").click(function () {
        continue_tutorial();
    });
});

function set_tutorial() {
    TUT_LIST = TUT_LIST_BACKUP.slice();
}

function continue_tutorial() {

    // if last one, then get rid of dark layer
    if (TUT_LIST.length == 0) {
        $("#trans-layer").css('z-index', -1);
        $("#dark-layer").css('z-index', -1);
        $("#dark-layer").css('background-color', 'white');
        $("#tut-message").css('z-index', -2);
        $("#tut-continue-message").css('z-index', -2);
        $("#tut-continue-message").css('background', 'rgba(0,0,0,0.0)');
        
        return;
    }

    const next_item = TUT_LIST.shift();

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


// Reformat action sequences
// (used to store as jenk arrays)


function reformat_action_sequence(sequence) {

    let new_seq = JSON.parse(JSON.stringify(sequence));

    // reset everything
    $("#output_grid_size").val('3x3');
    resizeOutputGrid(replay=true);
    resetOutputGrid(replay=true);
    CUR_ACTION_I = 0;

    $.each(new_seq, (i, action) => {

        let tool = action[0];
        switch (tool) {
            case "edit":
                [tool, x, y, symbol] = action;
                new_seq[i] = {"action": {"tool": tool, "x": x, "y": y, "symbol": symbol}};

                break;
            case "floodfill":
                [tool, x, y, symbol] = action;
                new_seq[i] = {"action": {"tool": tool, "x": x, "y": y, "symbol": symbol}};
                
                break;
            case "copy":
                [tool, copy_paste_data] = action;
                new_seq[i] = {"action": {"tool": tool, "copy_paste_data": copy_paste_data}};
                
                break;
            case "paste":
                [tool, copy_paste_data, targetx, targety] = action;
                new_seq[i] = {"action": {"tool": tool, "copy_paste_data": copy_paste_data, "x": targetx, "y": targety}};
                
                break;
            case "copyFromInput":
                new_seq[i] = {"action": {"tool": tool}};
            
                break;
            case "resetOutputGrid":
                new_seq[i] = {"action": {"tool": tool}};

                break;
            case "resizeOutputGrid":
                [tool, x, y] = action;
                new_seq[i] = {"action": {"tool": tool, "width": x, "height": y}};
                
                break;
            case "check":
                let correct = action[1];
                new_seq[i] = {"action": {"tool": tool, "correct": correct}};
                break;
            case "select":
                console.log("SELECT");
                break;
            default:
                console.error("Unknown tool: ", tool);
                break;
        }

        play_action(sequence); // simulate action
        update_grid_from_div($(`#output_grid .editable_grid`), CURRENT_OUTPUT_GRID); // sync ui -> state
        new_seq[i].grid = array_copy(CURRENT_OUTPUT_GRID.grid); // use simulation to get correct grid
        new_seq[i].time = null; // old data has no time data
    });

    return new_seq;
}

function reformat_task_action_sequences(task) {

    return new Promise((resolve, reject) => {
        loadTask(task).then(() => {
            get_task_descriptions(task, DESCRIPTIONS_TYPE).then(descriptions => {
                (async function loop() {
                    for (let i=0;i<=descriptions.length; i++) {
                        await new Promise((loop_res, reject) => {


                            if (i == descriptions.length) {
                                return resolve();
                            }

                            let desc = descriptions[i];
                            console.log("=== " +  i.toString() + " ===");
    
                            if (!desc.attempts_sequence) {
                                console.log("Desc:", desc.id);
                                console.log("No action sequence for this description");
                                console.log(timeConverter(desc.timestamp));
            
                                get_desc_builds(desc.type, desc.task, desc.id).then(builds => {
                                    reformat_builds_action_sequences(builds).then(() => {
                                        loop_res();
                                    });
                                });
                            } else {
                                let action_sequence = JSON.parse(desc.attempts_sequence);
                                let new_seq = reformat_action_sequence(action_sequence);
                                console.log("Desc:", new_seq, desc.id, desc.task, desc.type);
                                reformat_desc_action_sequence(new_seq, desc.id, desc.task, desc.type).then(() => {
            
                                    get_desc_builds(desc.type, desc.task, desc.id).then(builds => {
                                        reformat_builds_action_sequences(builds).then(() => {
                                            loop_res();
                                        });
                                    });
            
                                });
                            }
                        });
                    }
                })();
            });
        });
    });
}

function reformat_builds_action_sequences(builds) { 
    return new Promise((resolve, reject) => {
        (async function loop() {
            for (let i=0;i<=builds.length; i++) {
                await new Promise((resolve_loop, reject_inner) => {

                    if (i == builds.length) {
                        return resolve();
                    }

                    let build = builds[i];

                    if (!build.attempts_sequence) {
                        console.log("Build: " + build.id);
                        console.log("No action sequence for this build");
                        resolve_loop();
                    } else {
                        let build_action_sequence = JSON.parse(build.attempts_sequence);
                        let build_new_seq = reformat_action_sequence(build_action_sequence);
                        console.log("Build:", build_new_seq, build.id, build.desc_id, build.task, build.desc_type);

                        reformat_build_action_sequence(build_new_seq, build.id, build.desc_id, build.task, build.desc_type).then(() => {
                            resolve_loop();
                        });
                    }
                });
            }
        })();
    });
}

// when reformatting, missed "select action" -- so removes those
function remove_nonobject_actions(tasks) {
    $.each(tasks, (_, task) => {
        get_task_descriptions(task, "nl").then(descs => {
            
            $.each(descs, (_, desc) => {
                get_desc_builds("nl", task, desc.id).then(builds => {
                    $.each(builds, (_, build) => {
                        let build_as = build.action_sequence;
                        if (build_as != null) {
                            build_as = JSON.parse(build_as);
                            const new_as = build_as.filter(x => !Array.isArray(x));
                            if (!arraysEqual(new_as, build_as)) {
                                console.log("Build " + build.id + " from desc " + desc.id + " from task " + task.toString() + " has bad action sequence:");
                                console.log(build_as);
                                console.log(new_as);
                                reformat_build_action_sequence(new_as, build.id, desc.id, task, "nl");
                            }
                        } else {
                            console.log("Build " + build.id + " from desc " + desc.id + " from task " + task.toString() + " has no action sequence:");
                        }
                    });
                });

                let desc_as = desc.action_sequence;
                if (desc_as != null) {
                    desc_as = JSON.parse(desc_as);
                    const desc_new_as = desc_as.filter(x => !Array.isArray(x));
                    if (!arraysEqual(desc_as, desc_new_as)) {
                        console.log("Desc " + desc.id + " from task " + task.toString() + " has bad action sequence:");
                        console.log(desc_as);
                        console.log(desc_new_as);
                        reformat_desc_action_sequence(desc_new_as, desc.id, task, "nl");
                    }
                } else {
                    console.log("Desc " + desc.id + " from task " + task.toString() + " has no action sequence:");
                }
            });
        });
    });
}