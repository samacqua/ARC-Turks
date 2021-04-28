import csv
import numpy as np
import random

# the set of words
Words = set()
# a mapping from task_id to words used in that task
task_to_words = {}
with open('gridWords.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        if row['used'] == 'TRUE':
            if row['task_id'] not in task_to_words:
                task_to_words[row['task_id']] = set()
            task_to_words[row['task_id']].add(row['word'])
            Words.add(row['word'])

# print (words)
# print (task_to_words)

# the set of concepts
Concepts = set()
# a mapping from task_id to concepts used in that task
task_to_primitives = {}
fname = 'gridIC.csv'    # 'gridTheo.csv'
with open(fname, newline='') as csvfile:
    reader = csv.DictReader(csvfile)

    for row in reader:
        if row['used'] == 'TRUE':
            if row['task_id'] not in task_to_primitives:
                task_to_primitives[row['task_id']] = set()
            task_to_primitives[row['task_id']].add(row['concept'])
            Concepts.add(row['concept'])

# print (Concepts)
# print (task_to_primitives)

# making the join of words and concepts using task_id
# the dictionary has this form:
# task_id -> (words_in_task, concepts_in_task)
words_primitives_join = dict()
for task_id in task_to_words:
    if task_id in task_to_primitives:
        words_primitives_join[task_id] = (task_to_words[task_id],
                                          task_to_primitives[task_id])

# print (words_primitives_join)

N = len(words_primitives_join)

# breaking the dataset into two halves, train and test
# each entry is of the form (words, concepts)
D_train, D_test = [], []

for i, task_id in enumerate(words_primitives_join):
    if i < N // 2:
        D_train.append(words_primitives_join[task_id])
    else:
        D_test.append(words_primitives_join[task_id])

# the concepts in the train set to keep in mind in case
# train/test might have not overlapping concepts
Concepts_train = set()
Words_train = set()
for words, concepts in D_train:
    Concepts_train = Concepts_train.union(concepts)
    Words_train = Words_train.union(words)

# @ sam you should use these following objects for your modeling

# print (Concepts_train)
# print (D_train)
# print (D_test)

# a baseline algorithm that rank the concepts randomly
def random_ranker(words):
    proposal = list(Concepts_train)
    random.shuffle(proposal)
    return proposal

# for a given ranker of concepts given words, 
# we can test the ranker's performance as follows
def evaluation(concept_ranker, repetition = 100):
    fractions = []
    for i in range(repetition):
        for words, concepts in D_test:
            # no need to bother with concepts that are unseen during training
            shared_concepts = Concepts_train.intersection(concepts)
            if len(shared_concepts) == 0:
                continue
            # use the concept ranker to predict the top-k concepts given words
            # here k is the number of unique concepts used in the ground-truth program
            predicted_concepts = concept_ranker(words)[:len(shared_concepts)]
            intersect = set(predicted_concepts).intersection(shared_concepts)
            # measure the fraction of concepts in the ground-truth correctly predicted by the ranker
            fraction = len(intersect) / len(shared_concepts)
            fractions.append(fraction)
    # return the average fraction predicted as the performance of the ranker
    print ('average fraction predicted ', np.mean(fractions))

print ('performance of the random ranker')
evaluation(random_ranker)


# ======= END OF DATA PROCESSING / EVAL / BASELINE =======



# ======= BEGIN OF NAIVE BAYES MODELING =======
    
# creating a map of the form:
# concept -> [list of words that co-occured with it, with duplicate]
c_to_words = dict()

for words, concepts in D_train:
    for c in concepts:
        if c not in c_to_words:
            c_to_words[c] = []
        c_to_words[c] += words

# the naive bayes probability of P(word | concept)
# it is built from the dictionary c_to_words
# i.e. if word occured 3 times in the list of words of length 100
# then P(word | concept) = 3 / 100
prob_table = dict()
for c in c_to_words:
    c_denum = len(c_to_words[c])
    for word in Words_train:
        word_freq = c_to_words[c].count(word)
        prob_table[(c, word)] = word_freq / c_denum

# print (prob_table)

# wrap the probability table around a function to give a smoothing for unseen words
# so basically the same as prob_table, except has a small default value for unseen words
def get_w_given_t(w, c):
    if (c,w) not in prob_table:
        return 0.0001
    else:
        return 0.0001 + prob_table[(c,w)]

# given a set of words, what is the probability that 
# concept c will generate this set, i.e. P(words | c) ?
# it is naive bayes, so it is P(wrd1 | c) * ... * P(wrdn | c)
# we model it as logP(wrd1 | c) + ... + logP(wrdn | c)
def get_logpr_words_given_c(words, c):
    logpr = 0
    for wrd in words:
        logpr += np.log(get_w_given_t(wrd, c))
    return logpr

# given a set of words, we rank ALL the concepts in Concept_train
# in descending logPr according to logP(words | c)
def nb_ranker(words):
    score_c_list = []
    for c in Concepts_train:
        score_c_list.append((get_logpr_words_given_c(words, c), c))
    return [x[1] for x in reversed(sorted(score_c_list))]

print ('performance of the naive bayes ranker')
evaluation(nb_ranker, repetition = 1)

# ======= BEGIN OF NAIVE BAYES MODELING w/ TD-IDF =======

# creating a map of the form:
# word -> set of concepts it co-occurred with, no duplicates
word_to_concepts = dict()

for words, concepts in D_train:
    for w in words:
        if w not in word_to_concepts:
            word_to_concepts[w] = set()
        word_to_concepts[w] |= concepts

# create term-frequency-list
tf = prob_table

# create inverse-document frequency
idf = dict()
D = len(Concepts_train) # num concepts
for word in word_to_concepts:
    num_concepts = len(word_to_concepts[word])    # number of concepts that the word maps to
    for concept in Concepts_train:
        idf[(concept, word)] = np.log(D / num_concepts)     # log(total num concepts / num concepts w/ word)

# calculate TD-IDF
tfidf = dict()
for key in prob_table:
    tfidf[key] = tf[key] * idf[key]

def get_tfidf(w, c):
    return 0.0001 + tfidf.get((c,w), 0)

def get_logpr_words_given_c_tfidf(words, c):
    logpr = 0
    for wrd in words:
        logpr += np.log(get_tfidf(wrd, c))
    return logpr

def nb_ranker(words):
    score_c_list = []
    for c in Concepts_train:
        score_c_list.append((get_logpr_words_given_c_tfidf(words, c), c))
    return [x[1] for x in reversed(sorted(score_c_list))]

print ('performance of the TF-IDF ranker')
evaluation(nb_ranker, repetition = 1)

# ======= BEGIN OF NAIVE BAYES MODELING w/ Word-embedding =======

