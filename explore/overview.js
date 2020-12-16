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
        tasks: [149, 286, 140, 354, 219, 277, 28, 135, 162, 384, 297, 26, 299, 388, 246, 74, 305, 94, 308, 77],
        name: "Pilot 1"
    },
    pilot2: {
        config: {
            apiKey: "AIzaSyBg9yynastMoRA1fGore-sgjygpVhcoLA8",
            authDomain: "arc-pilot-2.firebaseapp.com",
            databaseURL: "https://arc-pilot-2-default-rtdb.firebaseio.com",
            projectId: "arc-pilot-2",
            storageBucket: "arc-pilot-2.appspot.com",
            messagingSenderId: "99669730043",
            appId: "1:99669730043:web:5e61d0f59dbd8e46f0865e"
        },
        tasks: [211, 124, 89, 141, 91, 20, 7, 201, 285, 111, 294, 249, 69, 81, 239, 16, 363, 92, 303, 269],
        name: "Pilot 2"
    }
}

$(window).on('load', function () {
    PAGE = Pages.ExploreTasks;

    const { task, study } = parseUrl(window.location.search);

    load_study(study);
    load_new_task(task);
});

/**
 * Handle back and forth navigation
 * from https://stackoverflow.com/a/3354511/5416200 (but url stored in query params)
 * @param {Object} e the event that carries the 
 */
window.onpopstate = function(e){
    if(e.state){
        load_study(e.state.study);
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

    // if url does not contain both arguments, update url to contain them
    let url_info = {};
    let task = urlParams.get('task');
    let study = urlParams.get('study');

    if (!task) {
        study = study || 'pilot';
        const study_tasks = STUDY_BATCHES[study].tasks;
        task = study_tasks[Math.floor(Math.random()*study_tasks.length)];
        url_info['task'] = task;
        url_info['study'] = urlParams.get('study') || 'pilot';
    }

    if (!study) {
        study = 'pilot';
        url_info['study'] = 'pilot';
        url_info['task'] = task;
    }

    if (!$.isEmptyObject(url_info)) {
        updateUrl(url_info);
    }
    return { "task": task, "study": study };
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
        searchParams.set("study", response.study);

        console.log(response);

        var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
        document.title = "ARC Data: " + response.task.toString();

        load_study(response.study);
        load_new_task(response.task);

        window.history.pushState({"task": response.task, "study": response.study, "pageTitle": document.title}, "", newRelativePathQuery);
    }
}

// cache server requests
function cache_object(key, object) {
    sessionStorage.setItem(key, JSON.stringify(object));
}
function get_cache(key) {
    return JSON.parse(sessionStorage.getItem(key));
}
function get_task_descs_cache(task, desc_type) {
    return new Promise(function (resolve, reject) {
        let cached = get_cache(task);
        if (cached) {
            return resolve(cached);
        } else {
            get_task_descriptions(task, desc_type).then(function (descriptions) {
                cache_object(task+"_"+STUDY_BATCH, descriptions);
                return resolve(descriptions);
            }).catch(error => {
                errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry.");
                console.error(error);
            });
        }
    });
}

function zoom_on_div(div) {
    let copy = div.clone();
    $("body").append(copy);
    copy.css("opacity", "0");

    copy.addClass('grid-focus');
    copy.removeClass('neumorphic');
    
    copy.animate({opacity: 1}, 100);

    let new_div = $("<div></div>");
    new_div.addClass("blurred-layer");
    new_div.appendTo($("body"));
    new_div.css('opacity', '0');
    new_div.animate({opacity: 1}, 100);

    copy.on('click', function(){
        $('.grid-focus').fadeOut(100, () => {
            $('.grid-focus').remove();
            $('.blurred-layer').remove()
        });
        $(".blurred-layer").fadeOut(100);
    });

    new_div.on('click', function(){
        $('.grid-focus').fadeOut(100, () => {
            $('.grid-focus').remove();
            $('.blurred-layer').remove()
        });
        $(".blurred-layer").fadeOut(100);
    });
}

/**
 * load a new task after user selects it
 * @param {number} task the task to load
 */
function load_new_task(task) {

    loadTask(task).then(() => {
        $(".test-io").empty();
        fill_div_with_IO($("#test-io"), TEST_PAIR.input, TEST_PAIR.output);
        fill_div_with_IO($("#test-io-preview"), TEST_PAIR.input, TEST_PAIR.output);
        $('.pair_preview').addClass('neumorphic');

        $(".neumorphic").on('click', function(){
            zoom_on_div($(this));
          });
    });

    TASK_ID = task;
    $("#task-title").text(`Task ${task}`);
    get_task_descs_cache(task, DESCRIPTIONS_TYPE).then(function (descriptions) {
        descriptions.sort(sort_descs_bandit_score());
        PAST_DESCS = descriptions;
        createDescsPager(descriptions);

        summarize_descriptions(descriptions);

    }).catch(error => {
        errorMsg("Failed to load past task descriptions. Please ensure your internet connection, and retry.");
        console.error(error);
    });
}

function merge_word_counts(word_count_1, word_count_2) {
    let wc = object_copy(word_count_1);
    $.each(word_count_2, (key, count) => {
        if (key in wc) {
            wc[key] += count;
        } else {
            wc[key] = count;
        }
    });
    return wc;
}

function summarize_descriptions(descriptions) {
    $("#desc-count").text("Descriptions count: " + descriptions.length.toString());

    // most common unigrams
    let see_desc_word_count = {};
    let grid_word_count = {};
    let do_desc_word_count = {};

    $.each(descriptions, (i, desc) => {
        const see_desc_no_prefix = desc.see_desc.replace(SHOULD_SEE_PREFIX, '');
        see_desc_word_count = merge_word_counts(see_desc_word_count, get_word_counts(see_desc_no_prefix));

        const grid_desc_no_prefix = desc.grid_desc.replace(GRID_SIZE_PREFIX, '');
        grid_word_count = merge_word_counts(grid_word_count, get_word_counts(grid_desc_no_prefix));

        const do_desc_no_prefix = desc.do_desc.replace(HAVE_TO_PREFIX, '');
        do_desc_word_count = merge_word_counts(do_desc_word_count, get_word_counts(do_desc_no_prefix));
    });

    const most_common_see = get_n_highest_frequency(see_desc_word_count);
    const most_common_grid = get_n_highest_frequency(grid_word_count);
    const most_common_do = get_n_highest_frequency(do_desc_word_count);

    create_word_count_graph('see-desc-wc-chart', most_common_see, "Most Common Words Describing Input");
    create_word_count_graph('do-desc-wc-chart', most_common_do, "Most Common Words Describing Transformation");
    create_desc_success_bar(descriptions);

}

function create_word_count_graph(canvas_id, word_count, graph_title) {

    // to remove listeners (https://stackoverflow.com/a/45342629/5416200)
    const parent = $("#" + canvas_id).parent();
    $("#" + canvas_id).remove();
    parent.append($('<canvas class="chart" id="' + canvas_id + '"></canvas>'));

    var ctx = document.getElementById(canvas_id).getContext('2d');

    let labels = word_count.map(x => x[0]);
    let data_points = word_count.map(x => x[1]);

    let data = {
        labels: labels,
        datasets: [{
            label: 'frequency',
            backgroundColor: '#83aee9',
            borderColor: '#83aee9',
            data: data_points,
        }]
    };
    let options = {
        title: {
            display: true,
            text: graph_title
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    callback: function(value, index, values) {
                        // remove all decimal tick values
                        if (Math.floor(value) === value) {
                            return value;
                        }
                    }
                }
            }]
        },
        legend: {
            display: false
         },
    };

    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });
}

function create_desc_success_bar(descs) {

    // to remove listeners (https://stackoverflow.com/a/45342629/5416200)
    const parent = $("#desc-success-chart").parent();
    $("#desc-success-chart").remove();
    parent.append($('<canvas class="chart" id="desc-success-chart"></canvas>'));

    var ctx = document.getElementById('desc-success-chart').getContext('2d');

    let labels = [];
    let data_points = [];

    $.each(descs, (i, desc) => {
        labels.push("Description " + i.toString());
        data_points.push(desc.display_num_success / desc.display_num_attempts);
    });

    let data = {
        labels: labels,
        datasets: [{
            label: '3-shot',
            backgroundColor: '#83aee9',
            borderColor: '#83aee9',
            data: data_points,
            suggestedMax: 1,
        }]
    };
    let options = {
        title: {
            display: true,
            text: 'Communication Success Ratio'
        },
        scales: {
            xAxes: [{
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 1
                }
            }]
        },
        legend: {
            display: false
         },
    };

     new Chart(ctx, {
        type: 'horizontalBar',
        data: data,
        options: options
    });
}

function get_n_highest_frequency(word_count, n=5) {
    let word_count_array = [];

    $.each(word_count, (word, count) => {
        word_count_array.push([word, count]);
    });

    word_count_array.sort((a, b) => { return b[1] - a[1] });
    return word_count_array.slice(0, n);
}

function get_word_counts(str) {
    let word_counts = {};
    const stop_words = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"];

    let words = str.replace("'", '').match(/(\w+)/g);

    $.each(words, (_, word) => {
        let stripped_word = word.replace(/[^0-9a-z]/gi, '').toLowerCase();

        if (stripped_word.length > 0) {
            if (stripped_word in word_counts) {
                word_counts[stripped_word] += 1;
            } else {
                word_counts[stripped_word] = 1;
            }
        }
    });

    $.each(stop_words, (_, word) => {
        delete word_counts[word];
    });

    return word_counts;
}

/**
 * Create an href on the left for each task description
 * @param {[Objects]} descriptions an array of all description objects
 */
function createDescsPager(descriptions) {
    $("#descriptions-pager").empty();
    $.each(descriptions, (i, desc) => {
        let row = $(`<a class="list-group-item list-group-item-action" data-toggle="list" role="tab" 
            href="description.html?task=${desc.task}&id=${desc.id}&study=${STUDY_BATCH}">Description ${i}</a>`);
        $("#descriptions-pager").append(row);
    });

    $('#descriptions-pager a').click(function(){
        document.location.href = $(this).attr('href');
    });


}

var LAST_MODAL_LOADED_STUDY;
/**
 * load tasks into table so user can browse and choose a task
 */
function load_tasks_to_browse() {

    let study = STUDY_BATCHES[STUDY_BATCH];
    if (LAST_MODAL_LOADED_STUDY == study) {
        return;
    } else {
        $('#table').bootstrapTable("destroy");
    }
    LAST_MODAL_LOADED_STUDY = study;

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
                    return '<button class="btn btn-secondary load-task-btn" onclick="send_to_new_task(' + row.number + ', \'' + STUDY_BATCH + '\')" task="'+row.number+'" data-dismiss="modal">Select</button> ';
                }
                }
            ]      
            });
        });
    });
}

function send_to_new_task(task, study) {
    document.location.href = `../explore?task=${task}&study=${study}`;
}

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

function load_study(study) {
    STUDY_BATCH = study;
    $("#study-title").text(STUDY_BATCHES[study].name);
    update_fb_config(STUDY_BATCHES[STUDY_BATCH].config, STUDY_BATCH);
}

function toggle_study() {
    let new_study = STUDY_BATCH == 'pilot' ? 'pilot2' : 'pilot';
    updateUrl({"task": TASK_ID, "study": new_study});
}