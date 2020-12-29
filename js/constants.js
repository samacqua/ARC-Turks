// ========
// Timing
// ========

// expected time for each portion of the interface
const TOTAL_TIME = 45;
const WALKTHROUGH_TIME = 146.1/60;
const CONSENT_INSTRUCT_TIME = 53.9/60;
const QUIZ_TIME = 39.6/60;
const INSTRUCTIONS_TIME = WALKTHROUGH_TIME + CONSENT_INSTRUCT_TIME + QUIZ_TIME;

const PRAC_TASK_TIME = 91.6/60;

const SPEAKER_TIME = 346.4/60;
const BUILDER_TIME = 103.0/60;


// =======
// Bandit
// =======

const PRIORS = [1, 1];
function suc_score_addition(num_attempts) {
    // return 1/num_attempts;
    // 1st attempt = 1, 2nd = 4/5, 3rd = 3/5
    return (6 - num_attempts) / 5;
}

// ========
// Partial Credit
// ========

const SKIP_PART_CRED = 0.10;
const SPEAKER_FAIL_PART_CRED = 0.50;

// ========
// Tasks
// ========

const STUDY_BATCHES = {
    dev: {
        config: {
            apiKey: "AIzaSyA9yXW7Tnx3IYdiXMnmO20qp7IKc6lakS8",
            authDomain: "arc-turk-ex-ios.firebaseapp.com",
            databaseURL: "https://arc-turk-ex-ios.firebaseio.com",
            projectId: "arc-turk-ex-ios",
            storageBucket: "arc-turk-ex-ios.appspot.com",
            messagingSenderId: "687250358397",
            appId: "1:687250358397:web:16ac92ca0995b5d117b114"
        },
        tasks: [208, 95, 76, 154, 49, 71, 310, 40, 2, 361, 321, 252, 330, 200, 275, 349, 379, 67, 97, 85, 279, 29, 120, 240, 126, 47, 376, 5, 134, 131, 25, 65, 235, 389, 326, 247, 338, 334, 58, 295, 168, 87, 70, 383, 193, 364, 311, 264, 232, 57, 253, 216, 207, 215, 175, 108, 309, 337, 212, 32, 340, 399, 117, 210, 318, 35, 63, 391, 381, 115],
        name: "Dev"
    },
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
    },
    batch1: {
        config: {
            apiKey: "AIzaSyDRnL0IDFiFAxBq3HSKUh8ykupp0GuRI0c",
            authDomain: "arc-batch-1.firebaseapp.com",
            databaseURL: "https://arc-batch-1-default-rtdb.firebaseio.com",
            projectId: "arc-batch-1",
            storageBucket: "arc-batch-1.appspot.com",
            messagingSenderId: "327194723391",
            appId: "1:327194723391:web:0a08378e1e0b3c2394a48a"
        },
        tasks: [315, 144, 271, 156, 167, 125, 282, 245, 283, 159, 112, 164, 298, 323, 133, 352, 262,
            325, 314, 260, 128, 109, 178, 34, 119, 10, 324, 320, 82, 302, 233, 278, 129, 24, 228, 182,
            121, 360, 328, 331],
        name: "Batch 1"
    },
    batch2: {
        config: {
            apiKey: "AIzaSyDMp5OKIO4t3xOu41GRE6s2trBKpmB0w7M",
            authDomain: "arc-batch-2.firebaseapp.com",
            databaseURL: "https://arc-batch-2-default-rtdb.firebaseio.com",
            projectId: "arc-batch-2",
            storageBucket: "arc-batch-2.appspot.com",
            messagingSenderId: "120035746376",
            appId: "1:120035746376:web:05663b54d48efbacf3ee7d"
        },
        tasks: [208, 95, 76, 154, 49, 71, 310, 40, 2, 361, 321, 252, 330, 200, 275, 349, 379, 67, 97, 
            85, 279, 29, 120, 240, 126, 47, 376, 5, 134, 131, 25, 65, 235, 389, 326, 247, 338, 334, 58,
            295, 168, 87, 70, 383, 193, 364, 311, 264, 232, 57, 253, 216, 207, 215, 175, 108, 309, 337,
            212, 32, 340, 399, 117, 210, 318, 35, 63, 391, 381, 115],
        name: "Batch 2"
    },
}

var TASKS = STUDY_BATCHES['dev'];

// ========
// Common Values
// ========

const MAX_ATTEMPTS_BUILDER = 3; // maximum number of attempts a builder has before they "failed"
const MIN_CONFIDENCE = 3;   // if confidence is at or below this level, do not add the description to the bandit (but use it for showing to future speakers)
const GRID_SIZE_PREFIX = "The output grid size...";
const SHOULD_SEE_PREFIX = "In the input, you should see...";
const HAVE_TO_PREFIX = "To make the output, you have to...";

const Pages = {
    Intro: "intro",
    Describer: "describer",
    Listener: "listener",
    Dev: "dev",
    ExploreTasks: "explore_tasks",
    ExploreDescs: "explore_descs"
};

// ========
// Tutorial
// ========

const PRAC_TASKS = [
    {
        "task": 1,
        "grid_desc": "The output grid size... is the same as the input grid size.",
        "see_desc": "In the input, you should see... at least 1 green shape with holes.",
        "do_desc": "To make the output, you have to... completely fill each hole with yellow.",
        "selected_example": 0
    },
    {
        "task": 258,
        "grid_desc": "The output grid size... changes to the size of the colored object.",
        "see_desc": "In the input, you should see... a colored object on a blue background.",
        "do_desc": "To make the output, you have to... zoom in on the object, and replace all blue with black.",
        "selected_example": 0
    }
];

// quiz to ensure understanding
const GEN_QUIZ_QUESTIONS = [
    {
        question: "Your goal is to...",
        answers: {
            a: 'create grids that look like other grids',
            b: 'write a description of the transformation based on grid examples so that another person can create the correct output grid',
            c: 'use a description of the pattern to create the correct output grid'
        },
        correctAnswer: 'c'
    },
    {
        question: "It is important to...",
        answers: {
            a: 'Use as few attempts as possible.',
            b: 'Complete the tasks as fast as possible.',
            c: 'Use as many colors as possible.'
        },
        correctAnswer: 'a'
    },
    {
        question: "To edit the output grid, what are the 3 modes you can use and their correct description?",
        answers: {
            a: '1). Draw -- to edit individual pixels. 2). Flood fill -- to fill in entire areas. 3). Copy-paste -- to copy a section of the grid.',
            b: '1). Draw -- to edit individual pixels. 2). Stamper -- to place down a stamp of a shape. 3). Line -- to make a line between two pixels.',
            c: 'There is only one mode.'
        },
        correctAnswer: 'a'
    },
    {
        question: "If you do not try your best and just submit random answers to get through the study, will you be approved?",
        answers: {
            a: 'Yes.',
            b: 'No.',
        },
        correctAnswer: 'b'
    }
];
