/**
 * Returns the casino (task) with least # interactions (descriptions + attempts)
 * @param {boolean} force_listener if true, returns casino that needs pull of existing arm, if any exist
 * @param {string} type the type of descriptions ("nl", "ex", or "nl_ex")
 */
function select_casino(type) {
    return new Promise(function (resolve, reject) {
        get_all_tasks_best_desc(type).then(counts => {

            var num_success = counts[0];
            var num_attempts = counts[1];
            var variances = [];

            // calculate variances for each task
            const priors = [1, 1];
            for (i = 0; i < num_success.length; i++) {
                const a = num_success[i] + priors[0];
                const b = num_attempts[i] - num_success[i] + priors[1];

                const variance = (a * b) / ((a + b)**2 * (a + b + 1));
                variances.push(variance);
            }
            
            // get the max variance and list of tasks done
            const raw_max = Math.max.apply(Math, variances);
            const tasks_done = (sessionStorage.getItem('tasks_completed') || "").split(',');

            // if already done task, make sure it is not chosen again
            var task_collisions = 0;
            for (i = 0; i < NUM_TASKS; i++) {
                const ii = TASKS[i];
                if (tasks_done.includes(ii.toString())) {
                    task_collisions += 1;
                    variances[i] -= raw_max+1;
                    if (task_collisions == NUM_TASKS) {
                        console.log("Done (interacted with all available tasks)");
                        return resolve(-1);
                    }
                }
            }

            // add slight randomness so many people aren't pulling the same arm in case of a tie
            variances = variances.map(val => {
                return val + (Math.random() / 100)
            });

            // return task with max variance
            const max = Math.max.apply(Math, variances);
            return resolve(TASKS[variances.indexOf(max)]);
        })
        .catch(function (err) {
            return reject(err);
        });
    });
}

/**
 * Returns the casino (task) with least # interactions (descriptions + attempts)
 * @param {boolean} force_listener if true, returns casino that needs pull of existing arm, if any exist
 * @param {string} type the type of descriptions ("nl", "ex", or "nl_ex")
 */
function new_select_casino(type) {
    return new Promise(function (resolve, reject) {
        get_bandit_doc(type).then(bandit_doc => {
            get_timing_doc(type).then(timing => {

                // calculate effort ratios
                let all_efforts = parse_timing_doc(timing);
                
                let avg_efforts = sum_array(Object.values(all_efforts));
                let efforts_ratio = {};
                $.each(all_efforts, function(task_id, task_effort_sum) {
                    efforts_ratio[task_id] = (task_effort_sum/avg_efforts);
                });

                let cas_scores = {};
                let casinos = parse_bandit_doc(bandit_doc);

                const tasks_done = (sessionStorage.getItem('tasks_completed') || "").split(',');

                $.each(casinos, function(task_id, desc_obj) {
                    let task_best_arms = [];

                    $.each(desc_obj, function(desc_id, bandit_vals) {
                        task_best_arms.push(bandit_vals);
                    });

                    let priors = [1, 1];
                    if (task_best_arms.length == 0) {
                        task_best_arms = [{a: priors[0], b: priors[1]}];
                    }

                    task_best_arms.sort((c,d) => c.mean < d.mean);

                    let half_i = Math.ceil(task_best_arms.length / 2);
                    let best_half = task_best_arms.splice(0, half_i);

                    let super_a = priors[0];
                    let super_b = priors[1];

                    for (i=0;i<best_half.length;i++) {
                        let arm = best_half[i];
                        super_a += arm.a;
                        super_b += arm.b;
                    }

                    let variance = super_a*super_b / ((super_a+super_b)**2 * (super_a+super_b+1));
                    if (tasks_done.includes(task_id)) {
                        variance = -1;
                    }
                    if (efforts_ratio.hasOwnProperty(task_id)) {
                        variance /= efforts_ratio[task_id];
                    } else {
                        variance = Infinity;
                    }
                    cas_scores[task_id] = variance;
                });

                let max = -Infinity;
                let argmax = [];
                // calculate argmax, return random choice if tie to prevent a bunch of users pulling same arm
                $.each(cas_scores, function(key, value) {
                    if (value > max) {
                        max = value;
                        argmax = [key];
                    } else if (value == max) {
                        argmax.push(key);
                    }
                });

                // all tasks have been done by user
                if (max < 0) {
                    console.log("Done (interacted with all available tasks)");
                    return resolve(-1);
                }

                const chosen_arg_max = argmax[Math.floor(Math.random() * argmax.length)];
                return resolve(chosen_arg_max);
            });
        })
        .catch(function (err) {
            return reject(err);
        });
    });
}

/**
 * Takes the firestore timing doc, which has form
 * {task_desc_id_desc: desc_time, task_desc_id_build: [build_time]} for all tasks' descriptions and builds
 * Parses the doc into an object with the sum of all the times for a task (weighted to take into account pilot avg), with outliers for each task removed
 * @param {Object} doc the firestore document for timing
 * @returns {Object} an object of the sum of all the times for a task with no outliers
 */
function parse_timing_doc(doc, ABS_MAX_TIME=60*15) {
// noone should spend 15  minutes on a task. TODO: discuss this val
    let all_desc_times = {};
    let all_build_times = {};

    // organize all times by task and type (speak or build)
    $.each(doc, function(key, value) {
        let split_key = key.split('_');
        let task = split_key[0];

        if (split_key[2] == 'desc') {
            if (all_desc_times.hasOwnProperty(task)) {
                all_desc_times[task].push(value);
            } else {
                all_desc_times[task] = [value];
            }
        } else {
            for (i=0;i<value.length;i++) {
                if (all_build_times.hasOwnProperty(task)) {
                    all_build_times[task].push(value[i]);
                } else {
                    all_build_times[task] = [value[i]];
                }
            }
        }
    });

    let task_times = {};

    // Filter outliers and sum
    $.each(all_desc_times, function(task, times) {

        let filtered_times = filterOutliers(times, ABS_MAX_TIME, SPEAKER_TIME*60);

        if (task_times.hasOwnProperty(task)) {
            task_times[task] += weight_timing(filtered_times, SPEAKER_TIME*60);
        } else {
            task_times[task] = weight_timing(filtered_times, SPEAKER_TIME*60);
        }
    });

    $.each(all_build_times, function(task, times) {

        let filtered_times = filterOutliers(times, ABS_MAX_TIME, BUILDER_TIME*60);

        if (task_times.hasOwnProperty(task)) {
            task_times[task] += weight_timing(filtered_times, BUILDER_TIME*60);
        } else {
            task_times[task] = weight_timing(filtered_times, BUILDER_TIME*60);
        }
    });

    return task_times;
}

/**
 * parses the firestore bandit doc and returns a casinos object which has a and b values for all descs by task
 * @param {Object} doc the firestore bandit doc
 * @returns {Object} casinos object which has a and b values for all descs by task
 */
function parse_bandit_doc(doc) {
    let casinos = {};

    // loop thru all tasks so that each task has an a and b value
    for (i=0;i<TASKS.length;i++) {
        casinos[TASKS[i]] = {};
    }

    $.each(doc, function(key, value) {
        let task = key.split('_')[0];
        let desc_id = key.split('_')[1];
        let a = value[0];
        let b = value[1];

        if (casinos.hasOwnProperty(task)) {
            casinos[task][desc_id] = {'a': a, 'b': b};
        } else {
            casinos[task] = {};
            casinos[task][desc_id] = {'a': a, 'b': b};
        }
    });
    return casinos;
}

/**
 * Returns the arm (description_id) that should be pulled. If the description_id is -1, that means pull a new arm (create a new description)
 * @param {number} task the task number, as chosen by select_casino()
 * @param {string} type the type of descriptions ("nl", "ex", or "nl_ex")
 */
function select_arm(task, type) {
    return new Promise(function (resolve, reject) {
        get_task_descs_interactions_count(task, type).then(interactions_descriptions => {

            const num_arms = interactions_descriptions[0];
            const num_interactions = interactions_descriptions[1];

            // UCB
            get_task_descriptions(task, type).then(descriptions => {

                var best_mean = 0;
                const priors = [1, 1];
                // calculate successfulness mean of best description
                for (i = 0; i < descriptions.length; i++) {
                    const a = descriptions[i]['bandit_success_score'] + priors[0];
                    const b = descriptions[i]['bandit_attempts'] - descriptions[i]['bandit_success_score'] + priors[1];
                    const mean = a / (a + b);
                    if (mean > best_mean) {
                        best_mean = mean;
                    }
                }

                // check if should sample new arm
                const task_difficulty = (1 - best_mean);
                if (num_arms <= Math.sqrt(num_interactions) ** task_difficulty) {
                    return resolve(-1);
                }

                // calculate UCB, using the best_mean as a proxy for description difficulty
                var ucbs = [];
                for (i = 0; i < descriptions.length; i++) {

                    const a = descriptions[i]['bandit_success_score'] + priors[0];
                    const b = descriptions[i]['bandit_attempts'] - descriptions[i]['bandit_success_score'] + priors[1];

                    const mean = a / (a + b);
                    const variance = (a * b) / ((a + b)**2 * (a + b + 1));

                    ucbs.push(mean + Math.sqrt(variance));
                }
                const argmax = ucbs.indexOf(Math.max.apply(Math, ucbs));
                return resolve(descriptions[argmax]['id']);

            }).catch(error => {
                return reject(error);
            });
        }).catch(error => {
            return reject(error);
        })
    });
}