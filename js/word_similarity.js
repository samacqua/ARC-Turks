function norm(a) {
  var mag = mag(a);
  return a.map(function(val) {                                                                  
    return val/mag;                                                                             
  });                                                                                           
}                                                                                               

function addVecs(a, b) {
  return a.map(function(val, idx) {                                                             
    return val + b[idx];                                                                        
  });                                                                                           
}                                                                                               

function subVecs(a, b) {
  return a.map(function(val, idx) {                                                             
    return val - b[idx];                                                                        
  });                                                                                           
}   

function mag(a) {
  return Math.sqrt(a.reduce(function(sum, val) {                                                
    return sum + val*val;                                                                       
  }, 0));                                                                                       
}  

function get_dist(word_query, word_target) {
  var all_in = (word_query in wordVecs) && (word_target in wordVecs);
  if (all_in) {
    var q_vec = wordVecs[word_query]
    var w_vec = wordVecs[word_target]
    return [mag(subVecs(q_vec, w_vec)), word_target]
  } else {
    return [9999, word_target];
  }
}

// function get_color(closest, furthest, x) {
//   var r_weight = (furthest - x) / (furthest - closest)
//   var w_weight = (x - closest) / (furthest - closest)
//   console.log(r_weight, w_weight)
//   var R = Math.floor(r_weight * 255 + w_weight * 255)
//   var G = Math.floor(r_weight * 0 + w_weight * 255)
//   var B = Math.floor(r_weight * 0 + w_weight * 255)
//   return 'rgb(R,G,B)'.replace('R',R).replace('G',G).replace('B',B)
// }

// $( document ).ready(function() {
//   console.log( "ready!" );

//   $("#search").click(function(){
//     $("#result").empty()
//     var query_word = $("#query").val()
//     var raw_words = $("#input_passage").val()
// //    var split_words = split(/(?<=\.)\s*/, raw_words)
//     var replaced = raw_words.replace(/([^A-Za-z])/g, 'a#a#a$1a#a#a')
//     var splitt = replaced.split("a#a#a")

//     // find out the furthest dist
//     var dists = splitt.map(function(x){return get_dist(query_word, x)})
//     var dist_set = new Set(dists)
//     var array = Array.from(dist_set)
//     var bott = array.sort()[0]
//     var topp = array.sort().reverse()[1]

//     // reassemble with colors
//     var to_put = []
//     splitt.forEach(function(token) {
//       var dist = get_dist(query_word, token)
//       if (dist == 9999) {
//         var hey = $('<span/>').text(token)
//         $("#result").append(hey)
//       } else {
//         var hey = $('<span/>').text(token)
//         $(hey).css('background-color', get_color(bott, topp, dist))
//         console.log(hey)
//         $("#result").append(hey)
//       }
//     });
//   });
// });

