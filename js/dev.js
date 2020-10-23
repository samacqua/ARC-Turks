var STUDY_BATCH = "pilot";
var DESC_USES = {};

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

    // get speaker task
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const task = urlParams.get('task') || TASKS[Math.floor(Math.random()*NUM_TASKS)];  // if none provided, give random task (just for when messing around w it, won't actually happen)

    DESCRIPTIONS_TYPE = sessionStorage.getItem('type') || "nl";

    load_new_task(task);

    if (DESCRIPTIONS_TYPE == "nl") {
        $("#select_ex_io").remove();
    }

    $(document).on("click", ".desc_build_row", function(event) {
        $(".desc_build_row").removeClass("active");
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

// create the pager to go through past descriptions
function createExampleDescsPager(cur_ex=0) {

    $("#paginator").empty();

    if (PAST_DESCS.length >= 1) {
        $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${Math.max(CURRENT_DESC_I - 1, 0)}); createExampleDescsPager(${Math.max(CURRENT_DESC_I-1, 0)});">Previous</a></li>`);

        if (PAST_DESCS.length <= 4) {
            for (i = 0; i < PAST_DESCS.length; i++) {
                if (i == cur_ex) {
                    $("#paginator").append(`<li class="page-item active"><a class="page-link" href="#" onclick="showDescEx(${i});createExampleDescsPager(${i});">${i + 1}</a></li>`);
                } else {
                    $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${i});createExampleDescsPager(${i});">${i + 1}</a></li>`);
                }
            }
        } else {
            if (cur_ex != 0) {
                $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(0);createExampleDescsPager(0);">1</a></li>`);
                $("#paginator").append(`<li class="page-item disabled"><a class="page-link">...</a></li>`);
            }
            $("#paginator").append(`<li class="page-item active"><a class="page-link" href="#" onclick="showDescEx(${cur_ex});createExampleDescsPager(${cur_ex});">${cur_ex + 1}</a></li>`);
            if (cur_ex != PAST_DESCS.length - 1) {
                $("#paginator").append(`<li class="page-item disabled"><a class="page-link">...</a></li>`);
                $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${PAST_DESCS.length-1});createExampleDescsPager(${PAST_DESCS.length-1});">${PAST_DESCS.length}</a></li>`);
            }
        }
        $("#paginator").append(`<li class="page-item"><a class="page-link" href="#" onclick="showDescEx(${Math.min(CURRENT_DESC_I + 1, PAST_DESCS.length - 1)}); createExampleDescsPager(${Math.min(CURRENT_DESC_I+1, PAST_DESCS.length - 1)}); ">Next</a></li>`);
    }
}

// show a the selected description with a list of its attempts
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

    $("#ex_size_desc").text(cur_desc['grid_desc']);
    $("#ex_see_desc").text(cur_desc['see_desc']);
    $("#ex_do_desc").text(cur_desc['do_desc']);
    $("#desc_success").html(`<b>${cur_desc['display_num_success']}</b> out of <b>${cur_desc['display_num_attempts']}</b> people succeeded using this description.`);

    show_desc(CURRENT_DESC_I);

    get_desc_builds(DESCRIPTIONS_TYPE, TASK_ID, cur_desc.id).then(builds => {

        let emoji_rep = "❌";
        if (cur_desc.succeeded_verification != false) {
            emoji_rep = "❌ ".repeat(cur_desc.num_verification_attempts - 1) + "✅";
        }

        let desc_use_html = `
        <button type="button" class="btn btn-secondary desc_build_row active" onclick="show_desc(${CURRENT_DESC_I});">
            <span class="build_name">verification</span><span class="attempt_preview">${emoji_rep}</span>
        </button>`;

        for (let i=0;i<builds.length; i++) {
            let build = builds[i];

            console.log(build);

            let emoji_rep = "";
            if (build.success == false) {
                emoji_rep = "❌ ❌ ❌"
            } else {
                emoji_rep = "❌ ".repeat(build.num_attempts - 1) + "✅";
            }

            let row = `
                <button type="button" class="btn btn-secondary desc_build_row" onclick="show_attempt('${DESCRIPTIONS_TYPE}', '${TASK_ID}', '${cur_desc.id}', '${build.id}', ${i+1});">
                    <span class="build_name">builder ${i+1}</span><span class="attempt_preview">${emoji_rep}</span>
                </button>`

            desc_use_html += row;
        }

        $("#desc_uses").html(desc_use_html);

        let properties = [];
        console.log(cur_desc);
        Object.keys(cur_desc).forEach(function(key) {
            console.log(key);
            if (['attempt_jsons', 'grid_desc', 'see_desc', 'do_desc'].includes(key)) {

            } else if (key == 'timestamp') {
                properties.push(`<li><b>${key}</b>: ${timeConverter(cur_desc[key].seconds)}</li>`);
            } else {
                properties.push(`<li><b>${key}</b>: ${cur_desc[key]}</li>`);
            }
        });
        $("#desc_info").html(properties.join(''));
    });
}


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

function show_desc(cur_desc_i) {
    let cur_desc = PAST_DESCS[cur_desc_i];

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

    attempts_html += `<button type="button" class="btn btn-secondary attempt_row" onclick='replay_create(${cur_desc.attempts_sequence})'>Play action sequence</button>`
    $("#attempts_row").html(attempts_html);

    $("#output-title").text("Description verification attempts");

    show_attempt_json(cur_desc.attempt_jsons[cur_desc.attempt_jsons.length-1]);
}

// Show some user's attempts
function show_attempt(desc_type, task, desc_id, attempt_id, builder_num) {
    let desc_uses = DESC_USES[desc_id];
    let use = null;
    for (let i=0;i<desc_uses.length;i++) {
        if (desc_uses[i].id == attempt_id) {
            use = desc_uses[i];
            break;
        }
    }

    attempts_html = "";
    for (let i=0;i<use.num_attempts; i++) {

        let emoji_rep = "❌";
        if (use.success == true && i == use.num_attempts-1) {
            emoji_rep = "✅"
        }

        let row;
        if (i != use.num_attempts - 1) {
            row = `
            <button type="button" class="btn btn-secondary attempt_row" onclick='show_attempt_json(${use.attempt_jsons[i]})'>
                <span class="build_name">attempt ${i+1}</span><span class="attempt_preview">${emoji_rep}</span>
            </button>`;
        } else {
            row = `
            <button type="button" class="btn btn-secondary attempt_row active" onclick='show_attempt_json(${use.attempt_jsons[i]})'>
                <span class="build_name">attempt ${i+1}</span><span class="attempt_preview">${emoji_rep}</span>
            </button>`;
        }

        attempts_html += row;
    }

    attempts_html += `<button type="button" class="btn btn-secondary attempt_row" onclick='replay_create(${use.attempts_sequence})'>Play action sequence</button>`
    $("#attempts_row").html(attempts_html);

    $("#output-title").text("Builder " + builder_num.toString() + " attempts")

    show_attempt_json(use.attempt_jsons[use.attempt_jsons.length-1]);

    let properties = [];
    Object.keys(use).forEach(function(key) {
        console.log(key);
        if (['attempt_jsons', 'grid_desc', 'see_desc', 'do_desc'].includes(key)) {

        } else if (key == 'timestamp') {
            properties.push(`<li><b>${key}</b>: ${timeConverter(use[key].seconds)}</li>`);
        } else {
            properties.push(`<li><b>${key}</b>: ${use[key]}</li>`);
        }
    });
    $("#attempt_info").html(properties.join(''));
}

// show a user's attempt on the output grid
function show_attempt_json(json) {
    let grid = eval(json);

    CURRENT_OUTPUT_GRID.grid = grid;
    CURRENT_OUTPUT_GRID.height = grid.length;
    CURRENT_OUTPUT_GRID.width = grid[0].length;
    $("#output_grid_size").val(CURRENT_OUTPUT_GRID.width + 'x' + CURRENT_OUTPUT_GRID.height);
    syncFromDataGridToEditionGrid();
}

// listen for change to show either train IO grids or test input
$(document).on('change', 'input:radio[id^="show_grids_radio"]', function (event) {

    if (this.id == 'show_grids_radio_train') {
        $("#evaluation_input").addClass('no-display');
        $("#task_preview").removeClass('no-display');
    } else if (this.id == 'show_grids_radio_test') {
        $("#task_preview").addClass('no-display');
        $("#evaluation_input").removeClass('no-display');
    }
});

// load tasks into table so user can browse and choose a task
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

// load a new task after user selects it
function load_new_task(task) {

    // reset output grid
    CURRENT_OUTPUT_GRID.width = 3;
    CURRENT_OUTPUT_GRID.height = 3;
    CURRENT_OUTPUT_GRID.grid = [[0,0,0], [0,0,0], [0,0,0]];
    syncFromDataGridToEditionGrid();

    // empty rows of uses and attempts
    $("#attempts_row").empty();
    $("#desc_uses").empty();

    loadTask(task);
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

// replay the steps a user took in creating the output
function replay_create(sequence, iter=-1, delay=1000) {

    if (sequence == undefined ) {
        errorMsg("This description was collected before we started monitoring action sequences.");
        return;
    }

    if (sequence.length == 0 || iter >= sequence.length) {
        return;
    } else if (iter == -1) {
        $("#output_grid_size").val('3x3');
        resizeOutputGrid(replay=true);
        resetOutputGrid(replay=true);
        replay_create(eval(sequence), iter=iter+1, delay=delay);
        console.log("set to 3x3");
        return;
    }

    setTimeout(function() {

        const action = sequence[iter];
        let tool = action[0];

        console.log(action);

        switch (tool) {
            case "edit":
                [tool, x, y, symbol] = action;
                let cell = $(`div[x="${x}"][y="${y}"]`);
                cell.each(function() {  // make sure just output grid, not also input grid
                    if ($(this).parent().parent().parent().attr('id') == 'output_grid') {
                        cell = $(this);
                    }
                });
                setCellSymbol(cell, symbol);
                break;
            case "floodfill":
                [tool, x, y, symbol] = action;
                syncFromEditionGridToDataGrid();
                grid = CURRENT_OUTPUT_GRID.grid;
                floodfillFromLocation(grid, x, y, symbol);
                syncFromDataGridToEditionGrid();
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
                        setCellSymbol(cell, symbol);
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

        replay_create(sequence, iter=iter+1, delay=delay);
        return;

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

function sort_descs_bandit_score() {
    return function(a, b) {
        if (a.display_num_attempts == 0) {
            return 1
        } else if (b.display_num_attempts == 0) {
            return -1
        }
    
        function upperConfBound(x) {
            const i = x.bandit_success_score + 1;
            const j = x.bandit_attempts - i + 1;
    
            const mean = i / (i + j);
            const variance = i * j / ((i + j) ** 2 * (i + j + 1));
    
            return mean + Math.sqrt(variance);
        }
    
        if (upperConfBound(a) > upperConfBound(b)) {
            return -1
        } else { 
            return 1
        }
    }
}