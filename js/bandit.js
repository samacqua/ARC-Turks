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
                const b = num_attempts[i] - a + priors[1];

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
                        console.log("done bc no tasks left that they have not already interacted with");
                        finish();
                        return;
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
                    const b = descriptions[i]['bandit_attempts'] - a + priors[1];
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
                    const b = descriptions[i]['bandit_attempts'] - a + priors[1];

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