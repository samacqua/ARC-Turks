var STUDY_BATCH = "pilot"; // the current study batch we are looking at

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

var CUR_I;

$(window).on('load', function () {
    PAGE = Pages.ExploreDescs;
    const url_obj = parseUrl(window.location.search);
    load_new_desc(url_obj.task, url_obj.desc_id);
});

/**
 * Handle back and forth navigation
 * from https://stackoverflow.com/a/3354511/5416200 (but url stored in query params)
 * @param {Object} e the event that carries the 
 */
window.onpopstate = function(e){
    if(e.state){
        load_new_task(e.state.task);
        document.title = e.state.pageTitle;
    }
};

/**
 * Parses the url to get the task number
 * @param {string} url 
 */
function parseUrl(url) {
    const urlParams = new URLSearchParams(url);
    let task = urlParams.get('task');
    if (!task) {
        task = TASKS[Math.floor(Math.random()*NUM_TASKS)];
        document.location.href = `../explore?task=${task}`;
    }

    let desc_id = urlParams.get('id');
    if (!desc_id) {
        document.location.href = `../explore?task=${task}`;
    }
    return {"task": task, "desc_id": desc_id};
}

/**
 * update the url so that the url can be shared to show same information
 * https://stackoverflow.com/a/41542008/5416200
 * @param {Object} response the data that updates the url {task: *task*}
 */
function updateUrl(response) {
    if ('URLSearchParams' in window) {
        var searchParams = new URLSearchParams(window.location.search);
        searchParams.set("task", response.task);
        searchParams.set("id", response.desc_id);
        var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
        load_new_desc(response.task, response.desc_id);
        document.title = "ARC Data: " + response.task.toString();
        window.history.pushState({"task": response.task, "desc_id": response.desc_id, "pageTitle": document.title}, "", newRelativePathQuery);
    }
}

// cache server requests
function cache_object(key, object) {
    sessionStorage.setItem(key, JSON.stringify(object));
}
function get_cache(key) {
    return JSON.parse(sessionStorage.getItem(key));
}
function find_obj(arr, prop, val) {
    return arr.find(o =>  o[prop] == val);
}
function get_task_descs_cache(task, desc_type) {
    return new Promise(function (resolve, reject) {
        let cached = get_cache(task);
        console.log(cached);
        if (cached) {
            return resolve(cached);
        } else {
            get_task_descriptions(task, desc_type).then(function (descriptions) {
                cache_object(task, descriptions);
                return resolve(descriptions);
            }).catch(error => {
                errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry.");
                console.error(error);
            });
        }
    });
}

var ACTION_SEQUENCE_INTERVALS = [];

/**
 * load a new task after user selects it
 * @param {number} task the task to load
 * @param {string} desc_id the id of the description to load
 */
function load_new_desc(task, desc_id) {

    $.each(ACTION_SEQUENCE_INTERVALS, (i, interval) => {
        clearInterval(interval);
    });

    loadTask(task).then(() => {

        $(".test-io").empty();
        fill_div_with_IO($("#test-io-preview"), TEST_PAIR.input, TEST_PAIR.output);

        $("#task-title").html(`Task ${task}`);
        get_task_descs_cache(task, DESCRIPTIONS_TYPE).then(function (descriptions) {
    
            $("#verification-attempts").empty();
            $("#description-builds").empty();
    
            descriptions.sort(sort_descs_bandit_score());
            PAST_DESCS = descriptions;        
            createDescsPager(task, descriptions, desc_id);
    
            let cur_desc = find_obj(descriptions, "id", desc_id);
    
            $("#ex_size_desc").text(cur_desc['grid_desc']);
            $("#ex_see_desc").text(cur_desc['see_desc']);
            $("#ex_do_desc").text(cur_desc['do_desc']);
    
            show_attempts(cur_desc.attempt_jsons, $("#verification-attempts"));

            let last_attempt = JSON.parse(cur_desc.attempt_jsons[cur_desc.attempt_jsons.length-1]);
            console.log(last_attempt);
            update_div_from_grid_state($("#verification-grid .editable_grid"), array_to_grid(last_attempt));

            if (cur_desc.action_sequence != null) {
                let sequence_interval = repeat_action_sequence_in_div(JSON.parse(cur_desc.action_sequence), $("#verification-grid"));
                ACTION_SEQUENCE_INTERVALS.push(sequence_interval);
            } else {
                console.error("Description collected before action sequences.");
                $("#verification-grid .action-type-badge:first").text("No action sequence for this description.");
            }
    
            load_desc_builds(task, desc_id, DESCRIPTIONS_TYPE).then(builds => {
                console.log(builds);
                $("#builds-header").text("Builds (" + builds.length.toString() + ")");
                $.each(builds, (i, build) => {
                    $(`<h4>Builder ${i}</br></h4>`).appendTo($("#description-builds"));

                    let row = $("<div class='row' style='justify-content: left'></div>");
                    row.appendTo($("#description-builds"));
                    $("</br>").appendTo($("#description-builds"));
                    show_attempts(build.attempt_jsons, row);

                    // let action_sequence_grid = $("<div class='woop'></div>");
                    // fill_div_with_grid(action_sequence_grid, new Grid(1, 1, [[0]]));
                    // action_sequence_grid.appendTo($("#description-builds"));

                    // if (build.action_sequence) {
                    //     repeat_action_sequence_in_div(JSON.parse(build.action_sequence), action_sequence_grid);
                    // }
                });
            });
    
        }).catch(error => {
            errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry.");
            console.error(error);
        });
    });
}

function load_desc_builds(task, desc_id, desc_type) {
    return new Promise(function (resolve, reject) {
        let cached = get_cache(desc_id + "_builds");
        if (cached) {
            return resolve(cached);
        } else {
            const desc_uses_ref = db.collection(desc_type + "_tasks").doc(`${task}`).collection("descriptions").doc(desc_id).collection("uses");

            desc_uses_ref.get().then(function (querySnapshot) {
                console.log(`read ${querySnapshot.size} documents`);
    
                var uses = [];
                querySnapshot.forEach(function (doc) {
                    const data = doc.data();
                    const build = {
                        'num_attempts': data.num_attempts,
                        'attempt_jsons': data.attempt_jsons,
                        'action_sequence': data.action_sequence,
                        'success': data.success,
                        'time': data.time,
                        'timestamp': data.timestamp,
                        'id': doc.id,
                        'uid': data.uid,
                        'desc_id': desc_id,
                        'task': task,
                        'desc_type': desc_type
                    };
                    uses.push(build);
                });
                
                cache_object(desc_id + "_builds", uses);
                return resolve(uses);
            }).catch(error => {
                return reject(error);
            });
        }
    });
}

function show_attempts(attempts_json, container) {

    $.each(attempts_json, (i, attempt) => {
        attempt = JSON.parse(attempt);
        let grid = array_to_grid(attempt);
        let grid_div = $(`<div class="col-sm-4 ver-attempts"></div>`);
        grid_div.appendTo(container);
        fill_div_with_grid(grid_div, grid);
        fit_cells_to_container(grid_div, grid.height, grid.width);

        let badge_type = 'badge-danger';
        if ( arraysEqual(attempt, TEST_PAIR.output.grid) ) {
            badge_type = 'badge-success';
        }
        let label = $(`<h4><span class="badge ${badge_type} action-type-badge">attempt ${i+1}</span></h4>`);
        label.appendTo(grid_div);
    });
}

/**
 * Create an href on the left for each task description
 * @param {[Objects]} descriptions an array of all description objects
 */
function createDescsPager(task, descriptions, desc_id) {

    // all descriptions
    $("#descriptions-pager").empty();
    $.each(descriptions, (i, desc) => {
        let row = $(`<a class="list-group-item list-group-item-action" data-toggle="list" role="tab" 
            href="description.html?task=${desc.task}&id=${desc.id}">Description ${i}</a>`);
        if (desc.id == desc_id) {
            row.addClass("active");
        }
        $("#descriptions-pager").append(row);
    });

    $('#descriptions-pager a').click(function() {

        function getParam(url, name, defaultValue) {
            // https://stackoverflow.com/a/48933102/5416200
            var a = document.createElement('a');
            a.href = '?' + unescape(String(name));
            var un = a.search.slice(1);
            var esc = un.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
            var re = new RegExp('^\\?&*(?:[^=]*=[^&]*&+)*?(' + esc + ')=([^&]*)');
            a.href = url;
            var query = a.search;
            return re.test(query) ? query.match(re).slice(1).map(decodeURIComponent) : [un, defaultValue];
        }

        let url = $(this).attr('href');
        console.log(url);
        let task = getParam(url, "task", TASK_ID)[1];
        let desc = getParam(url, "id", desc_id)[1];
        
        let resp = {"task": task, "desc_id": desc};
        console.log(resp);
        updateUrl(resp);
    });

    // task overview
    $("#task-overview").attr("href", `../explore?task=${task}`);
    $('#overview-group a').click(function(){
        document.location.href = $(this).attr('href');
    });
}

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
            columns: [ { 
                // formatter : function(value,row,index) {
                //     get_task(tas)
                //     return '<button class="btn btn-secondary load-task-btn" task="'+row.number+'" data-dismiss="modal">Select</button> ';
                // }
            }, { sortable: true },{ sortable: true },{ sortable: true },  
            {
            field: 'operate',
            title: 'Select',
            align: 'center',
            valign: 'middle',
            clickToSelect: true,
            formatter : function(value,row,index) {
                return '<button class="btn btn-secondary load-task-btn" task="'+row.number+'" data-dismiss="modal">Select</button> ';
            }
            }
        ]      
        });

        $(".load-task-btn").click(function() {
            let task = $(this).attr('task');
            document.location.href = `../explore?task=${task}`;
        });
    });
}

function repeat_action_sequence_in_div(sequence, container_div) {

    function play_action_sequence_item(action_sequence, container, i=0) {

        let tool_display = container.find('.action-type-badge:first');

        if (!tool_display.hasClass('badge-secondary')) {
            tool_display.removeClass('badge-warning');
            tool_display.removeClass('badge-success');
            tool_display.addClass('badge-secondary');
        }

        let tool = action_sequence[i].action.tool;
        if (tool == "check") {
            tool = action_sequence[i].action.correct ? "check: correct" : "check: incorrect";
            let new_class = action_sequence[i].action.correct ? "badge-success" : "badge-warning";
            tool_display.removeClass('badge-secondary');
            tool_display.addClass(new_class);
        }
        tool_display.text(tool);

        let grid = array_to_grid(action_sequence[i].grid);
        let grid_div = container.find('.editable_grid');
        update_div_from_grid_state(grid_div, grid);
    }

    let i = 0;
    const interval_length = 5000 / sequence.length;
    return setInterval(() => {
        play_action_sequence_item(sequence, container_div, i++%sequence.length);
    }, interval_length);
}
