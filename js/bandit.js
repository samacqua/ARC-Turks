/**
 * Returns the casino (task) with least # interactions (descriptions + attempts)
 * If force listener is true, it ensures casino that needs pull of existing arm, if any exist
 */
function select_casino(force_listener, type) {
    return new Promise(function (resolve, reject) {
        get_all_descriptions_interactions_count(type).then(counts => {
            var num_descriptions = counts[0];
            var num_interactions = counts[1];

            const max = Math.max.apply(Math, num_interactions);
            const tasks_done = (sessionStorage.getItem('tasks_completed') || "").split(',');

            var task_collisions = 0;
            for (i = 0; i < NUM_TASKS; i++) {
                // make all tasks with no descs or # arms <= sqrt(# interactions) (so needs new arm) have the max score so
                //      that they aren't picked once study is actually going, and so at the start
                //      when there are no descriptions, not constantly pulling from single casino
                if (force_listener) {
                    if (num_descriptions[i] <= Math.sqrt(num_interactions[i]) || num_descriptions[i] == 0) {
                        num_interactions[i] += max;
                    }
                }

                // if already done task, make sure it is not chosen again
                if (tasks_done.includes(i.toString())) {
                    task_collisions += 1;
                    num_interactions[i] += 2 * max;
                    if (task_collisions == NUM_TASKS) {
                        console.log("done bc no tasks they have not already interacted with");
                        finish();
                        return;
                    }
                }
            }

            // add randomness so many people aren't pulling the same arm
            num_interactions = num_interactions.map(val => {
                return val + (Math.random() / 10)
            });
            console.log(num_interactions);
            const min = Math.min.apply(Math, num_interactions);
            return resolve(num_interactions.indexOf(min));    // return resolve(num_interactions.indexOf(min));
        })
            .catch(function (err) {
                return reject(err);
            });
    });
}

/**
 * Returns the arm (description_id) that should be pulled. If the description_id is -1, that means pull a new arm (create a new description)
 */
function select_arm(task, type) {
    return new Promise(function (resolve, reject) {
        get_task_descs_interactions_count(task, type).then(interactions_descriptions => {

            const num_arms = interactions_descriptions[0];
            const num_interactions = interactions_descriptions[1];

            if (num_arms <= Math.sqrt(num_interactions)) {
                return resolve(-1);
            } else {
                // UCB
                get_task_descriptions(task, type).then(descriptions => {

                    var ucbs = [];
                    for (i = 0; i < descriptions.length; i++) {

                        const priors = [1, 1];

                        const a = descriptions[i]['bandit_success_score'] + priors[0];
                        const b = descriptions[i]['bandit_attempts'] - a + priors[1];

                        const mean = a / (a + b);
                        const variance = (a * b) / ((a + b)**2 * (a + b + 1));

                        ucbs.push(mean + Math.sqrt(variance))
                    }
                    const argmax = ucbs.indexOf(Math.max.apply(Math, ucbs));
                    return resolve(descriptions[argmax]['id']);

                }).catch(error => {
                    return reject(error);
                });
            }
        }).catch(error => {
            return reject(error);
        })
    });
}