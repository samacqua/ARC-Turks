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

function load_tasks_test_pairs(tasks) {

    return new Promise((resolve, reject) => {
        get_task_paths().then(paths => {

            let promises = [];

            $.each(tasks, (_, task) => {
                let path = paths[task];
                let promise = new Promise((res, rej) => {
                    $.getJSON('../' + path, json => {
                        res({"task": task, "json": json.test[0]});
                    });
                });
                promises.push(promise);
            });

            Promise.all(promises).then(data => {
                let data_obj = {};
                $.each(data, (_, val) => {
                    const task = val.task;
                    const json = val.json;
                    data_obj[task] = json;
                });

                return resolve(data_obj);
            });
        });
    });
} 

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
            update_div_from_grid_state($("#verification-grid .editable_grid"), array_to_grid(last_attempt));

            if (cur_desc.action_sequence != null) {
                let sequence_interval = repeat_action_sequence_in_div(JSON.parse(cur_desc.action_sequence), $("#verification-grid"));
                ACTION_SEQUENCE_INTERVALS.push(sequence_interval);
            } else {
                console.error("Description collected before action sequences.");
                $("#verification-grid .action-type-badge:first").text("No action sequence for this description.");
            }
    
            load_desc_builds(task, desc_id, DESCRIPTIONS_TYPE).then(builds => {
                $("#builds-header").text("Builds (" + builds.length.toString() + ")");
                $.each(builds, (i, build) => {
                    $(`<h4>Builder ${i}</br></h4>`).appendTo($("#description-builds"));
                    create_build_row(build);
                });

                let g = create_action_sequence_graph_from_builds(cur_desc, builds);

                $('#graph-container').empty();

                let s = new sigma({
                    graph: g,
                    container: 'graph-container',
                    // https://github.com/jacomyal/sigma.js/wiki/Settings
                    settings: {
                        enableCamera: true,
                        enableHovering: false,
                        nodeHoverPrecision: 10,
                        drawLabels: true,
                        labelThreshold: 100, // so doesn't draw labels, turning off drawLabels turns off hover events
                        minNodeSize: 1,
                        maxNodeSize: 10,
                        minEdgeSize: 1,
                        maxEdgeSize: 3,
                        edgesPowRatio: 0.5,
                    }
                });

                s.bind('overNode outNode clickNode doubleClickNode rightClickNode', function(e) {
                    let node_grid = JSON.parse(e.data.node.id);
                    node_grid = array_to_grid(node_grid);
                    update_uneditable_div_from_grid_state($("#action-sequence-cur-grid .grid_inner_container"), node_grid);
                });
                
                s.startForceAtlas2({worker: true, barnesHutOptimize: false, slowDown: 0.25, gravity: 0.25, strongGravityMode: true, scalingRatio: 100000000});
                setTimeout(function() { s.stopForceAtlas2(); }, 5000)
            });
    
        }).catch(error => {
            errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry.");
            console.error(error);
        });
    });
}

function create_build_row(build) {
    let row = $("<div class='row' style='justify-content: left'></div>");
    row.appendTo($("#description-builds"));

    const attempts_col = $("<div class='col-md-9'></div>");
    const attempts_row = $("<div class='row' style='justify-content: left'></div>");
    attempts_row.appendTo(attempts_col);
    attempts_col.appendTo(row);
    show_attempts(build.attempt_jsons, attempts_row);

    const action_sequence_col = $("<div class='col-md-3'></div>");
    const action_sequence_row = $("<div class='row' style='justify-content: left'></div>");
    const action_sequence_container = $("<div class='single_grid'></div>");
    const grid_cont = $('<div class="editable_grid selectable_grid">');
    const action_sequence_label = $('<h5><span class="badge badge-secondary action-type-badge">action sequence</span></h5>')
    grid_cont.appendTo(action_sequence_container);
    action_sequence_label.appendTo(action_sequence_container);
    action_sequence_container.appendTo(action_sequence_row);
    action_sequence_row.appendTo(action_sequence_col);
    action_sequence_col.appendTo(row);

    let last_attempt = array_to_grid(JSON.parse(build.attempt_jsons[build.attempt_jsons.length-1]));
    update_uneditable_div_from_grid_state(grid_cont, last_attempt);

    if (build.action_sequence) {
        const sequence_interval = repeat_action_sequence_in_div(JSON.parse(build.action_sequence), action_sequence_container);
        ACTION_SEQUENCE_INTERVALS.push(sequence_interval);
    } else {
        action_sequence_container.find(".action-type-badge:first").text("No action sequence for this build.");
    }

    $("</br>").appendTo($("#description-builds"));
}

function create_action_sequence_graph_from_builds(desc, builds) {

    // https://coolors.co/31393c-2176ff-33a1fd-fdca40-f79824-95964a-32936f-26a96c
    const ACTION_COLOR_MAP = {
        'edit': '#CCC',
        'floodfill': '#FDCA40',
        'copy': '#2176FF',
        'paste': '#33A1FD',
        'copyFromInput': '#F79824',
        'resetOutputGrid': '#31393C',
        'resizeOutputGrid': '#95964A',
        'check': {
            'correct': '#26A96C',
            'incorrect': '#FF595E',
        }
    };

    let init_state_id = JSON.stringify([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    let final_state_id = JSON.stringify(TEST_PAIR.output.grid);

    // initialize with start and end states
    var g = {
        nodes: [
            {
                id: init_state_id,
                label: 'Start state',
                x: 0,
                y: 0,
                size: 5,
                color: '#0000ff'
            },
            {
                id: final_state_id,
                label: 'Final state',
                x: Math.sqrt(2)/2,
                y: Math.sqrt(2)/2,
                size: 5,
                color: ACTION_COLOR_MAP.check.correct
            }
        ],
        edges: []
    };

    // draw graph for description verification attempts
    let desc_as = desc.action_sequence;
    if (desc_as) {
        desc_as = JSON.parse(desc_as);
        var direction = Math.PI/4;

        let dx = Math.cos(direction);
        let dy = Math.sin(direction);

        let magnitude = 1 / desc_as.length;

        let last_node_id = init_state_id;
        $.each(desc_as, (i, action) => {
                
            // add resulting grid node if does not exist
            let node_id = JSON.stringify(action.grid);
            let existing_node = g.nodes.find(node => node.id == node_id);
            const node_color = node_id == JSON.stringify(TEST_PAIR.output.grid) ? "#32CD32" : "#666";

            if (existing_node == null) {
                g.nodes.push({
                    id: node_id,
                    label: i.toString(),
                    x: dx*magnitude*(i+1)+Math.random()/100,
                    y: dy*magnitude*(i+1)+Math.random()/100,
                    size: 1,
                    color: node_color
                });
            }

            // add edge from previous state to current
            let edge_id = last_node_id + "_" + node_id;
            let exisiting_edge = g.edges.find(edge => edge.id == edge_id);
            let edge_color = ACTION_COLOR_MAP[action.action.tool];
            if (action.action.tool == 'check') {
                edge_color = action.action.correct ? ACTION_COLOR_MAP[action.action.tool.correct] : ACTION_COLOR_MAP[action.action.tool.incorrect];
            }
            if (exisiting_edge == null) {
                g.edges.push({
                    id: edge_id,
                    source: last_node_id,
                    target: node_id,
                    size: 1,
                    color: edge_color
                });
            } else {
                exisiting_edge.size += 1;
            }

            last_node_id = node_id;
        });
    }

    // draw graph for builder attempts
    $.each(builds, (_, build) => {
        let action_sequence = build.action_sequence;

        if (action_sequence) {
            action_sequence = JSON.parse(action_sequence);

            let direction = Math.random() * Math.PI / 6 + Math.PI / 6;
            let dx = Math.cos(direction);
            let dy = Math.sin(direction);
            let magnitude = 1 / action_sequence.length;

            let last_node_id = init_state_id;
            $.each(action_sequence, (i, action) => {
                
                // add resulting grid node if does not exist
                let node_id = JSON.stringify(action.grid);
                let existing_node = g.nodes.find(node => node.id == node_id);
                const node_color = node_id == JSON.stringify(TEST_PAIR.output.grid) ? "#32CD32" : "#666";
                if (existing_node == null) {
                    g.nodes.push({
                        id: node_id,
                        label: 'Grid state',
                        x: dx*magnitude*(i+1),
                        y: dy*magnitude*(i+1),
                        size: 1,
                        color: node_color
                    });
                }

                // add edge from previous state to current
                let edge_id = last_node_id + "_" + node_id;
                let exisiting_edge = g.edges.find(edge => edge.id == edge_id);
                let edge_color = ACTION_COLOR_MAP[action.action.tool];
                if (action.action.tool == 'check') {
                    edge_color = action.action.correct ? ACTION_COLOR_MAP[action.action.tool.correct] : ACTION_COLOR_MAP[action.action.tool.incorrect];
                }
                if (exisiting_edge == null) {
                    g.edges.push({
                        id: edge_id,
                        source: last_node_id,
                        target: node_id,
                        size: 1,
                        color: edge_color
                    });
                } else {
                    exisiting_edge.size += 1;
                }

                last_node_id = node_id;
            });
        }
    });

    return g;
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
        let task = getParam(url, "task", TASK_ID)[1];
        let desc = getParam(url, "id", desc_id)[1];
        
        let resp = {"task": task, "desc_id": desc};
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

        load_tasks_test_pairs(STUDY_BATCHES[STUDY_BATCH].tasks).then(pairs => {

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
                    formatter : function(value,row,index) {
                        let test_pair = pairs[row.number];
                        let div = $("<div></div>");
                        fill_div_with_IO(div, array_to_grid(test_pair.input), array_to_grid(test_pair.output));

                        return div.wrap('<p/>').parent().html();;
                    }
                }, { sortable: true },{ sortable: true },{ sortable: true },  
                {
                field: 'operate',
                title: 'Select',
                align: 'center',
                valign: 'middle',
                clickToSelect: true,
                formatter : function(value,row,index) {
                    return '<button class="btn btn-secondary load-task-btn" onclick="send_to_new_task(' + row.number + ')" task="'+row.number+'" data-dismiss="modal">Select</button> ';
                }
                }
            ]      
            });
        });
    });
}

function send_to_new_task(task) {
    document.location.href = `../explore?task=${task}`;
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
