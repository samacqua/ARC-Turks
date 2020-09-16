/**
 * Returns the casino (task) with least # interactions (descriptions + attempts)
 */
function select_casino() {
    return new Promise(function (resolve, reject) {
        get_all_interactions_count().then(num_interactions => {
            num_interactions = num_interactions.map(add_noise);
            const min = Math.min.apply(Math, num_interactions);
            return resolve(num_interactions.indexOf(min));
        })
        .catch(function (err) {
            return reject(err);
        });
    });
}

function add_noise(val) {
    return val + (Math.random() / 10)
}

/**
 * Returns the arm (description_id) that should be pulled. If the description_id is -1, that means pull a new arm (create a new description)
 */
function select_arm(task) {
    return new Promise(function (resolve, reject) {
        get_task_descs_interactions_count(task).then(interactions_descriptions => {

            const num_arms = interactions_descriptions[0];
            const num_interactions = interactions_descriptions[1];

            if (num_arms <= Math.sqrt(num_interactions)) {
                return resolve(-1);
            } else {
                // UCB
                get_task_descriptions(task, DESCRIPTIONS_TYPE).then(descriptions => {

                    console.log(descriptions);

                    var ucbs = [];
                    for (i=0;i<descriptions.length;i++) {
        
                        const priors = [1,1];
        
                        const a = descriptions[i]['num_success'] + prior[0];
                        const b = descriptions[i]['num_attempts'] - a + prior[1];
        
                        const mean = a / (a + b);
                        const variance = a*b / ((a+b)**2 * (a+b+1));
        
                        ucbs.push(mean + Math.sqrt(variance))
                    }
                    const argmin = ucbs.indexOf(Math.min.apply(Math, ucbs));

                    return resolve(descriptions[argmin]['id']);

                }).catch(error => {
                    return reject(error);
                });
            }
        }).catch(error => {
            return reject(error);
        })
    });
}


// TODO
/**
 * Queue of descriptions with no attempts
 * Rank all descriptions, not just one casino
 * Ensure not listening to own description or describing a task they have listened to
 */