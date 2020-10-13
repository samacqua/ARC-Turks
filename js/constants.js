const TOTAL_TASKS_TO_COMPLETE = 3;
const MIN_TASKS_BEFORE_SPEAKER = 2;
const TOTAL_PRAC_TASKS = 2;
const MIN_WORDS = 100;
const NUM_TASKS = 3;   // TODO: Change back to 400
const MAX_ATTEMPTS_BUILDER = 3;

// easy tasks for demonstration purposes
const PRAC_TASKS = [
    {
        "task": 341,
        "grid_desc": "The output grid size... is the same as the input grid size.",
        "see_desc": "In the input, you should see... a light blue 2x2 square with 4 colored cells around it.",
        "do_desc": "To make the output, you have to... move each colored cell to cover the corner of the light blue square that it is closest to.",
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


const GRID_SIZE_PREFIX = "The output grid size...";
const SHOULD_SEE_PREFIX = "In the input, you should see...";
const HAVE_TO_PREFIX = "To make the output, you have to...";