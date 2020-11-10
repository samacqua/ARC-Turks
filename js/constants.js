// expected time for each portion of the interface
const TOTAL_TIME = 45;
const INSTRUCTIONS_TIME = 1;
const PRAC_TIME = 2;
const TOTAL_PRAC_TASKS = 2;
const SPEAKER_TIME = 6;
const BUILDER_TIME = 2;

const TASKS = [149, 286, 140, 354, 219, 277, 28, 135, 162, 384, 297, 26, 299, 388, 246, 74, 305, 94, 308, 77];  // the ARC tasks to be used in the study
const NUM_TASKS = TASKS.length;
const MAX_ATTEMPTS_BUILDER = 3; // maximum number of attempts a builder has before they "failed"

const MIN_CONFIDENCE = 3;   // if confidence is at or below this level, do not add the description to the bandit (but use it for showing to future speakers)

// easy tasks for tutorial
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
        question: "If you give up, will you be given a bonus for completing that task?",
        answers: {
            a: 'Yes.',
            b: 'No.',
        },
        correctAnswer: 'b'
    }
];

// more quiz questions, specified by task type
const TASK_SPECIFIC_QUESTION = {
    "nl": {
        question: "Your goal is to...",
        answers: {
            a: 'create grids that look like other grids',
            b: 'write a description of the transformation based on grid examples so that another person can create the correct output grid',
            c: 'use a description of the pattern to create the correct output grid'
        },
        correctAnswer: 'c'
    },
    "nl_ex": {
        question: "Your goal is to...",
        answers: {
            a: 'create grids that look like other grids',
            b: 'write a description of the transformation based on grid examples so that another person can create the correct output grid',
            c: 'use a description and example of the pattern andto create the correct output grid'
        },
        correctAnswer: 'c'
    },
    "ex": {
        question: "Your goal is to...",
        answers: {
            a: 'create grids that look like other grids',
            b: 'write a description of the transformation based on grid examples so that another person can create the correct output grid',
            c: 'use an example of the pattern to create the correct output grid'
        },
        correctAnswer: 'c'
    }
}

// prefixes for each part of the descriptions
const GRID_SIZE_PREFIX = "The output grid size...";
const SHOULD_SEE_PREFIX = "In the input, you should see...";
const HAVE_TO_PREFIX = "To make the output, you have to...";
