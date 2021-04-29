import csv
import numpy as np
import random
import pickle

NUM_REPETITIONS = 10

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
fname = 'gridIC.csv'
# fname = 'gridTheo.csv'
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
def evaluation(concept_ranker, repetition = 100, D=D_test, verbose=True):
    fractions = []
    for i in range(repetition):
        for words, concepts in D:
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
    score = np.mean(fractions)
    if verbose: print('average fraction predicted ', score)
    return score

print ('performance of the random ranker')
evaluation(random_ranker, repetition=NUM_REPETITIONS)


# ======= END OF DATA PROCESSING / EVAL / BASELINE =======


# ======= BEGIN OF MODELING HELPERS =======

# wrap the probability table around a function to give a smoothing for unseen words
# so basically the same as prob_table, except has a small default value for unseen words
def get_w_given_t(w, c, prob_table, df=0.0001):
    return prob_table.get((c, w), 0) + df

# given a set of words, what is the probability that 
# concept c will generate this set, i.e. P(words | c) ?
# it is naive bayes, so it is P(wrd1 | c) * ... * P(wrdn | c)
# we model it as logP(wrd1 | c) + ... + logP(wrdn | c)
def get_logpr_words_given_c(words, c, prob_table, df=0.0001):
    logpr = 0
    for wrd in words:
        logpr += np.log(get_w_given_t(wrd, c, prob_table, df))
    return logpr

# make a ranker for some probability table
def make_classifier_ranker(prob_table):
    # given a set of words, we rank ALL the concepts in Concept_train
    # in descending logPr according to logP(words | c)
    def ranker(words):
        score_c_list = []
        for c in Concepts_train:
            score_c_list.append((get_logpr_words_given_c(words, c, prob_table), c))
        return [x[1] for x in reversed(sorted(score_c_list))]
    return ranker

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
nb_prob_table = dict()
for c in c_to_words:
    c_denum = len(c_to_words[c])
    for word in Words_train:
        word_freq = c_to_words[c].count(word)
        nb_prob_table[(c, word)] = word_freq / c_denum

# print (prob_table)

print ('performance of the naive bayes ranker')
evaluation(make_classifier_ranker(nb_prob_table), repetition = NUM_REPETITIONS)

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
tf = nb_prob_table

# create inverse-document frequency
idf = dict()
D = len(Concepts_train) # num concepts
for word in word_to_concepts:
    num_concepts = len(word_to_concepts[word])    # number of concepts that the word maps to
    for concept in Concepts_train:
        idf[(concept, word)] = D / num_concepts     # total num concepts / num concepts w/ word

# calculate TD-IDF
tfidf = dict()
for key in tf:
    tfidf[key] = tf[key] * idf[key]

print ('performance of the TF-IDF ranker')
evaluation(make_classifier_ranker(tfidf), repetition = NUM_REPETITIONS)

# ======= BEGIN OF NAIVE BAYES MODELING w/ Word-embedding =======

# # create word embeddings
# with open('glove/glove.6B.50d.txt') as word2vec:    # if using w2v file
#     word_embeddings = dict()
#     for i, line in enumerate(word2vec):

#         word, *vec = line.split()
#         if word not in Words: # ignore words that are not in our vocab
#             continue
#         vec = np.array([float(v) for v in vec])

#         word_embeddings[word] = vec

#     with open('word_embeddings.pickle', 'wb') as handle:
#         pickle.dump(word_embeddings, handle)

with open('word_embeddings.pickle', 'rb') as handle:   # if using pickled version
    word_embeddings = pickle.load(handle)

def similarity(v1, v2):
    """
    get the similarity between two vectors
    """
    return abs(np.dot(v1, v2)/(np.linalg.norm(v1)*np.linalg.norm(v2)))      # using abs is sus here but idk what to do

# get avg word similarity bc some words not in w2v
tot_similarity = 0
for word1, vec1 in word_embeddings.items():
      for word2, vec2 in word_embeddings.items():
          tot_similarity += similarity(vec1, vec2)
avg_similarity = tot_similarity / len(word_embeddings)**2

# print("average similarity between a pair of words:", avg_similarity)

# instead of P(word | concept), now using fuzzy P(word | concept) 
# = sum(P(word_i | concept) * e^(alpha * similarity(word_i, word)) )
alpha_vals = [0, 1/4, 1/2, 1]   # a quick way to get better alpha -- try a few values
best_alpha, best_sore, best_w2v_prob_table = 0, 0, dict()
for alpha in alpha_vals:
    w2v_prob_table = dict()

    for c in c_to_words:
        c_denum = len(c_to_words[c])
        for word in c_to_words[c]:
            weighted_sim_word_freq = 0
            for word_i in Words_train:
                p_wordi = nb_prob_table.get((c, word_i), 0)     # prob of word i given concept

                word_similarity = avg_similarity    # if one of the words not in the w2v, just use avg similarity
                if word in word_embeddings and word_i in word_embeddings:
                    word_similarity = similarity(word_embeddings[word], word_embeddings[word_i])

                weighted_sim_word_freq += p_wordi * np.exp(alpha * word_similarity) # P(word_i | concept) * e^(alpha * similarity(word_i, word))

            w2v_prob_table[(c, word)] = weighted_sim_word_freq
            assert w2v_prob_table[(c, word)] >= 0

    print(f'performance of the w2v naive bayes ranker (alpha={alpha}) on train')
    score = evaluation(make_classifier_ranker(w2v_prob_table), repetition=1, D=D_train, verbose=True)   # something is going wrong here bc all alphas get same accuracy on train
    # print(f'performance of the best w2v naive bayes ranker (alpha={alpha})')
    # evaluation(make_classifier_ranker(w2v_prob_table), repetition = NUM_REPETITIONS)
    if score > best_sore:
        best_alpha = alpha
        best_sore = score
        best_w2v_prob_table = w2v_prob_table

print(f'performance of the best w2v naive bayes ranker (alpha={best_alpha})')
evaluation(make_classifier_ranker(best_w2v_prob_table), repetition = NUM_REPETITIONS)
